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

AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")
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

# ── DynamoDB 初始化 ───────────────────────────────────────────────────────────

try:
    dynamodb = boto3.resource("dynamodb", region_name=AWS_REGION)
    sessions_table = dynamodb.Table(DYNAMODB_TABLE)
    # 验证表是否存在
    sessions_table.table_status
    DYNAMODB_ENABLED = True
    logger.info("DynamoDB connected: table=%s region=%s", DYNAMODB_TABLE, AWS_REGION)
except (ClientError, Exception) as e:
    logger.warning("DynamoDB not available — falling back to in-memory storage: %s", e)
    DYNAMODB_ENABLED = False
    # 内存回退（开发/测试用）
    _memory_sessions: dict[str, dict] = {}


def _save_session_to_dynamodb(session) -> None:
    """将 Session 核心数据持久化到 DynamoDB。"""
    if not DYNAMODB_ENABLED:
        return
    try:
        item = {
            "session_id": session.session_id,
            "step": session.step,
            "user_input": session.user_input,
            "sample_context": session.sample_context,
            "filename": session.filename,
            "synthesis": session.synthesis,
            "final_report": session.final_report,
            "tool_calls_log": json.dumps(session.tool_calls_log, ensure_ascii=False),
            "search_summary": session.search_summary,
            "n_matches": len(session.search_results),
            "top_match": (
                session.search_results[0].get("name", "")
                if session.search_results else ""
            ),
            "top_score": (
                session.search_results[0].get("similarity", 0)
                if session.search_results else 0
            ),
            "confidence_trace": json.dumps(session.confidence_trace),
            "react_iterations": session.react_iterations,
            "verification_rounds": session.verification_rounds,
            "repair_count": session.repair_count,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "ttl": int(datetime.now(timezone.utc).timestamp()) + 86400 * 30,  # 30 天过期
        }
        sessions_table.put_item(Item=item)
    except Exception as e:
        logger.error("DynamoDB write failed (non-fatal): %s", e)


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
    """列出最近的 Session 记录（供 /api/history 使用）。"""
    if not DYNAMODB_ENABLED:
        return []
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


@app.post("/api/analyze")
async def analyze(
    file: UploadFile | None = File(None),
    context: str = Form(""),
    peaks: str = Form(""),
    analysis_type: str = Form("identify"),
):
    """运行完整的光谱分析流水线。

    接受光谱文件或峰位数据，启动 Agent 的 ReAct 推理循环，
    返回多工具分析结果和置信度追踪。
    """
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

    try:
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: agent.run_pipeline(
                session,
                user_input=user_input,
                file_base64=file_b64,
                filename=filename,
                peaks=peak_list,
                sample_context=context,
            ),
        )
    except Exception as e:
        logger.exception("Analysis pipeline failed: %s", e)
        return JSONResponse({"error": str(e)}, status_code=500)

    # 持久化到 DynamoDB
    _save_session_to_dynamodb(session)

    return result


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
    _save_session_to_dynamodb(session)

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
    """查询历史分析记录列表。"""
    sessions = _list_recent_sessions(limit)
    return {
        "n_sessions": len(sessions),
        "storage": "dynamodb" if DYNAMODB_ENABLED else "memory-fallback",
        "sessions": sessions,
    }


# ── 启动入口 ──────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    port = int(os.environ.get("PORT", "8080"))
    uvicorn.run(app, host="0.0.0.0", port=port)
