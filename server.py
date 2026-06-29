"""
ChemSpectra Agent — FastAPI Server for H0 AWS + Vercel Hackathon.

Track 2: Monetizable B2B App.
Backend: FastAPI + AWS DynamoDB (session persistence).
Frontend: Vercel v0 (deployed separately — see v0-frontend-guide.md).

与 Qwen Cloud 版本的区别:
  - 去掉嵌入式 HTML UI → 纯 REST API
  - 新增 DynamoDB Session 持久化（替换内存 dict）
  - 新增 /api/history 端点（查询历史分析记录）
  - agent.py / tools.py / report.py 未做任何修改
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import os
import threading
from datetime import datetime, timezone

import boto3
from botocore.exceptions import ClientError
from fastapi import FastAPI, File, Form, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response

from agent import ChemSpectraAgent

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

# ── 配置 ──────────────────────────────────────────────────────────────────────

AWS_REGION = os.environ.get("AWS_REGION", "us-east-2")
DYNAMODB_TABLE = os.environ.get("DYNAMODB_TABLE", "chemspectra-sessions")

app = FastAPI(
    title="ChemSpectra Agent API",
    description="AI Autopilot for FTIR Spectral Analysis — H0 AWS+Vercel Hackathon",
    version="2.0.0",
)

# CORS: 允许 Vercel 前端跨域访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 生产环境应限制为 Vercel 域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

agent = ChemSpectraAgent()

# 后台分析任务存储：session_id -> {"status": "processing"|"done"|"error", "result": ..., "error": ...}
_bg_tasks: dict[str, dict] = {}

# ── DynamoDB 初始化 ───────────────────────────────────────────────────────────

STATS_TABLE = os.environ.get("DYNAMODB_STATS_TABLE", "chemspectra-stats")

try:
    dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
    dynamodb_client = boto3.client("dynamodb", region_name=AWS_REGION)
    sessions_table = dynamodb.Table(DYNAMODB_TABLE)
    stats_table = dynamodb.Table(STATS_TABLE)
    sessions_table.table_status
    DYNAMODB_ENABLED = True
    logger.info("DynamoDB connected: table=%s region=%s", DYNAMODB_TABLE, AWS_REGION)
except (ClientError, Exception) as e:
    logger.warning("DynamoDB not available — falling back to in-memory storage: %s", e)
    DYNAMODB_ENABLED = False
    _memory_sessions: dict[str, dict] = {}


def _save_session_to_dynamodb(session, *, allow_overwrite: bool = True) -> None:
    """将 Session 核心数据持久化到 DynamoDB。

    allow_overwrite=False 时使用条件写入，防止并发覆盖已确认的 session。
    """
    if not DYNAMODB_ENABLED:
        return
    now = datetime.now(timezone.utc)
    n_tools = len(session.tool_calls_log)
    top_match = (
        session.search_results[0].get("name", "")
        if session.search_results else ""
    )
    try:
        item = {
            "session_id": session.session_id,
            "pk_all": "ALL",
            "step": session.step,
            "user_input": session.user_input,
            "sample_context": session.sample_context,
            "filename": session.filename,
            "synthesis": session.synthesis,
            "final_report": session.final_report,
            "tool_calls_log": json.dumps(session.tool_calls_log, ensure_ascii=False),
            "search_summary": session.search_summary,
            "n_matches": len(session.search_results),
            "top_match": top_match or "unknown",
            "top_score": str(
                session.search_results[0].get("similarity", 0)
                if session.search_results else 0
            ),
            "confidence_trace": json.dumps(session.confidence_trace),
            "react_iterations": session.react_iterations,
            "verification_rounds": session.verification_rounds,
            "repair_count": session.repair_count,
            "n_tools_called": n_tools,
            "created_at": now.isoformat(),
            "ttl": int(now.timestamp()) + 86400 * 30,
        }
        put_kwargs = {"Item": item}
        if not allow_overwrite:
            put_kwargs["ConditionExpression"] = (
                "attribute_not_exists(session_id) OR step <> :confirmed"
            )
            put_kwargs["ExpressionAttributeValues"] = {":confirmed": "confirmed"}
        sessions_table.put_item(**put_kwargs)
    except dynamodb.meta.client.exceptions.ConditionalCheckFailedException:
        logger.warning("Conditional write rejected: session %s already confirmed", session.session_id)
    except Exception as e:
        logger.error("DynamoDB write failed (non-fatal): %s", e)

    _increment_stats("total_analyses", n_tools)


def _increment_stats(stat_type: str, n_tools: int) -> None:
    """原子计数器——追踪平台使用量统计。"""
    if not DYNAMODB_ENABLED:
        return
    try:
        stats_table.update_item(
            Key={"stat_id": "global"},
            UpdateExpression=(
                "ADD total_analyses :one, total_tools_called :tools"
            ),
            ExpressionAttributeValues={":one": 1, ":tools": n_tools},
        )
    except Exception as e:
        logger.error("Stats increment failed (non-fatal): %s", e)


def _get_stats() -> dict:
    """读取平台使用量统计。"""
    if not DYNAMODB_ENABLED:
        return {}
    try:
        resp = stats_table.get_item(Key={"stat_id": "global"})
        item = resp.get("Item", {})
        return {
            "total_analyses": int(item.get("total_analyses", 0)),
            "total_tools_called": int(item.get("total_tools_called", 0)),
        }
    except Exception as e:
        logger.error("Stats read failed: %s", e)
        return {}


def _load_session_from_dynamodb(session_id: str) -> dict | None:
    """从 DynamoDB 加载历史分析记录。"""
    if not DYNAMODB_ENABLED:
        return _memory_sessions.get(session_id)
    try:
        resp = sessions_table.get_item(Key={"session_id": session_id})
        return resp.get("Item")
    except Exception as e:
        logger.error("DynamoDB read failed: %s", e)
        return None


def _list_recent_sessions(limit: int = 20) -> list[dict]:
    """列出最近的 Session 记录——使用 GSI Query 替代 Scan。"""
    if not DYNAMODB_ENABLED:
        return []
    try:
        resp = sessions_table.query(
            IndexName="gsi-created",
            KeyConditionExpression="pk_all = :all",
            ExpressionAttributeValues={":all": "ALL"},
            ScanIndexForward=False,
            Limit=limit,
            ProjectionExpression=(
                "session_id, created_at, #s, user_input, "
                "top_match, top_score, n_matches, filename"
            ),
            ExpressionAttributeNames={"#s": "step"},
        )
        return resp.get("Items", [])
    except ClientError as e:
        if e.response["Error"]["Code"] == "ValidationException":
            logger.warning("GSI gsi-created not found, falling back to scan")
            return _list_recent_sessions_fallback(limit)
        logger.error("DynamoDB query failed: %s", e)
        return []
    except Exception as e:
        logger.error("DynamoDB query failed: %s", e)
        return []


def _list_recent_sessions_fallback(limit: int = 20) -> list[dict]:
    """Scan 回退——GSI 不可用时使用。"""
    try:
        resp = sessions_table.scan(
            Limit=limit,
            ProjectionExpression=(
                "session_id, created_at, #s, user_input, "
                "top_match, top_score, n_matches, filename"
            ),
            ExpressionAttributeNames={"#s": "step"},
        )
        items = resp.get("Items", [])
        items.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return items
    except Exception as e:
        logger.error("DynamoDB scan failed: %s", e)
        return []


def _query_by_material(material: str, limit: int = 20) -> list[dict]:
    """按材料名称查询分析历史——使用 GSI gsi-material。"""
    if not DYNAMODB_ENABLED:
        return []
    try:
        resp = sessions_table.query(
            IndexName="gsi-material",
            KeyConditionExpression="top_match = :mat",
            ExpressionAttributeValues={":mat": material},
            ScanIndexForward=False,
            Limit=limit,
            ProjectionExpression=(
                "session_id, created_at, #s, user_input, "
                "top_match, top_score, n_matches, filename, "
                "react_iterations, verification_rounds"
            ),
            ExpressionAttributeNames={"#s": "step"},
        )
        return resp.get("Items", [])
    except ClientError as e:
        if e.response["Error"]["Code"] == "ValidationException":
            logger.warning("GSI gsi-material not found")
        else:
            logger.error("DynamoDB material query failed: %s", e)
        return []
    except Exception as e:
        logger.error("DynamoDB material query failed: %s", e)
        return []


# ── 健康检查 ──────────────────────────────────────────────────────────────────


@app.get("/")
async def root():
    return {
        "service": "ChemSpectra Agent API",
        "version": "2.0.0",
        "hackathon": "H0: Hack the Zero Stack with Vercel v0 and AWS Databases",
        "track": "Track 2 — Monetizable B2B App",
        "endpoints": {
            "analyze": "POST /api/analyze",
            "followup": "POST /api/followup",
            "confirm": "POST /api/confirm",
            "report": "GET /api/report/{session_id}",
            "history": "GET /api/history",
            "material": "GET /api/material/{name}",
            "analytics": "GET /api/analytics",
            "health": "GET /health",
        },
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "dynamodb": "connected" if DYNAMODB_ENABLED else "fallback-memory",
        "region": AWS_REGION,
    }


# ── 核心 API ──────────────────────────────────────────────────────────────────


def _run_analysis_bg(session, user_input, file_b64, filename, peak_list, context):
    """后台线程执行分析流水线。"""
    sid = session.session_id
    try:
        result = agent.run_pipeline(
            session,
            user_input=user_input,
            file_base64=file_b64,
            filename=filename,
            peaks=peak_list,
            sample_context=context,
        )
        _save_session_to_dynamodb(session)
        _bg_tasks[sid]["status"] = "done"
        _bg_tasks[sid]["result"] = result
    except Exception as e:
        logger.exception("Analysis pipeline failed: %s", e)
        _bg_tasks[sid]["status"] = "error"
        _bg_tasks[sid]["error"] = str(e)


@app.post("/api/analyze")
async def analyze(
    file: UploadFile | None = File(None),
    context: str = Form(""),
    peaks: str = Form(""),
    analysis_type: str = Form("identify"),
):
    """启动光谱分析（异步）。立即返回 session_id，前端轮询 /api/status 获取进度。"""
    file_b64 = None
    filename = "spectrum.0"

    if file and file.filename:
        content = await file.read()
        if len(content) > 0:
            file_b64 = base64.b64encode(content).decode("ascii")
            filename = file.filename

    peak_list = None
    if peaks and peaks.strip():
        try:
            peak_list = [float(p.strip()) for p in peaks.split(",") if p.strip()]
        except ValueError:
            return JSONResponse(
                {"error": "Invalid peak format. Use comma-separated numbers."},
                status_code=400,
            )

    if not file_b64 and not peak_list:
        return JSONResponse(
            {"error": "Please upload a spectrum file or enter peak positions."},
            status_code=400,
        )

    user_input = f"{analysis_type}: {context}" if context else analysis_type
    session = agent.new_session()
    sid = session.session_id

    _bg_tasks[sid] = {"status": "processing"}

    thread = threading.Thread(
        target=_run_analysis_bg,
        args=(session, user_input, file_b64, filename, peak_list, context),
        daemon=True,
    )
    thread.start()

    return {"session_id": sid, "status": "processing"}


@app.get("/api/status/{session_id}")
async def get_status(session_id: str):
    """轮询分析进度。返回真实的 Agent 事件流。"""
    task = _bg_tasks.get(session_id)
    if not task:
        return JSONResponse({"error": "Session not found"}, status_code=404)

    session = agent.get_session(session_id)
    events = []
    if session:
        while not session.event_queue.empty():
            try:
                events.append(session.event_queue.get_nowait())
            except Exception:
                break

    if task["status"] == "done":
        return {"status": "done", "events": events, "result": task["result"]}
    elif task["status"] == "error":
        return {"status": "error", "events": events, "error": task.get("error", "Unknown error")}
    else:
        return {"status": "processing", "events": events}


@app.post("/api/followup")
async def followup(request: Request):
    """多轮对话追问——在已完成的 Session 上继续提问。"""
    body = await request.json()
    session_id = body.get("session_id")
    question = body.get("question")

    if not session_id or not question:
        return JSONResponse(
            {"error": "session_id and question are required"}, status_code=400
        )

    session = agent.get_session(session_id)
    if not session:
        # 尝试从 DynamoDB 加载
        item = _load_session_from_dynamodb(session_id)
        if not item:
            return JSONResponse({"error": "Session not found"}, status_code=404)
        # 历史 session 不能用 agent 追问，因为没有内存状态
        return JSONResponse(
            {
                "session_id": session_id,
                "historical": True,
                "synthesis": item.get("synthesis", ""),
                "note": "This is a historical session. Live follow-up is not available for past analyses.",
            }
        )

    try:
        loop = asyncio.get_event_loop()
        answer = await loop.run_in_executor(
            None, lambda: agent.handle_followup(session, question)
        )
    except Exception as e:
        logger.exception("Follow-up failed: %s", e)
        return JSONResponse({"error": str(e)}, status_code=500)

    _save_session_to_dynamodb(session)
    return {"session_id": session_id, "question": question, "answer": answer}


@app.post("/api/confirm")
async def confirm(request: Request):
    """确认分析结果并生成最终报告。"""
    body = await request.json()
    session_id = body.get("session_id")
    accept = body.get("accept", True)

    if not session_id:
        return JSONResponse({"error": "session_id required"}, status_code=400)

    session = agent.get_session(session_id)
    if not session:
        return JSONResponse({"error": "Session not found"}, status_code=404)

    try:
        loop = asyncio.get_event_loop()
        report_md = await loop.run_in_executor(
            None, lambda: agent.generate_report(session)
        )
    except Exception as e:
        logger.exception("Report generation failed: %s", e)
        return JSONResponse({"error": str(e)}, status_code=500)

    session.human_confirmed = accept
    session.step = "confirmed"
    _save_session_to_dynamodb(session, allow_overwrite=False)

    return {
        "session_id": session_id,
        "confirmed": accept,
        "report_preview": report_md[:500],
    }


@app.get("/api/report/{session_id}")
async def get_report(session_id: str):
    """下载 Markdown 格式分析报告。"""
    session = agent.get_session(session_id)
    if session and session.final_report:
        return Response(
            content=session.final_report,
            media_type="text/markdown",
            headers={
                "Content-Disposition": f"attachment; filename=ftir-report-{session_id}.md"
            },
        )

    # 尝试从 DynamoDB 加载
    item = _load_session_from_dynamodb(session_id)
    if item and item.get("final_report"):
        return Response(
            content=item["final_report"],
            media_type="text/markdown",
            headers={
                "Content-Disposition": f"attachment; filename=ftir-report-{session_id}.md"
            },
        )

    return JSONResponse({"error": "Session or report not found"}, status_code=404)


@app.get("/api/history")
async def history(limit: int = 20):
    """查询历史分析记录列表——使用 GSI Query 高效查询。"""
    sessions = _list_recent_sessions(limit)
    return {
        "n_sessions": len(sessions),
        "storage": "dynamodb" if DYNAMODB_ENABLED else "memory-fallback",
        "query_method": "gsi-created" if DYNAMODB_ENABLED else "memory",
        "sessions": sessions,
    }


@app.get("/api/material/{material_name}")
async def material_history(material_name: str, limit: int = 20):
    """按材料名称查询分析历史——使用 GSI gsi-material 高效聚合。

    示例: GET /api/material/Polyethylene%20terephthalate → 所有 PET 分析记录
    """
    sessions = _query_by_material(material_name, limit)
    return {
        "material": material_name,
        "n_sessions": len(sessions),
        "query_method": "gsi-material",
        "sessions": sessions,
    }


@app.get("/api/analytics")
async def analytics():
    """平台使用量统计——DynamoDB 原子计数器驱动。"""
    stats = _get_stats()
    recent = _list_recent_sessions(5)
    return {
        "platform_stats": stats,
        "storage": "dynamodb" if DYNAMODB_ENABLED else "memory-fallback",
        "recent_analyses": recent,
        "dynamodb_features_used": [
            "GSI gsi-created (time-ordered history query)",
            "GSI gsi-material (material-based aggregation)",
            "Atomic counters (usage statistics)",
            "Conditional writes (prevent overwrite of confirmed sessions)",
            "TTL auto-expiry (30-day session cleanup)",
        ],
    }


# ── 启动入口 ──────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port)
