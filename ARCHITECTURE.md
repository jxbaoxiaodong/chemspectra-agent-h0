# ChemSpectra Agent — H0 AWS Edition 架构文档

## 系统概述

ChemSpectra Agent 是 H0 AWS+Vercel 黑客松的 Track 2（B2B SaaS）参赛项目。
架构设计原则：**核心推理引擎零改动复用 + 新增 AWS 持久化层 + v0 前端替换嵌入式 UI**。

## 组件分层

```
┌──────────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                            │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  Vercel v0 Frontend (Next.js / React)                          │ │
│  │  • File upload with drag-and-drop (SPC, CSV, JDX, 28+ formats) │ │
│  │  • Peak position input (manual cm⁻¹)                           │ │
│  │  • Analysis type selector (Identify / Explain / Deformulate)   │ │
│  │  • Real-time agent progress (SSE streaming)                    │ │
│  │  • Multi-tool result cards with confidence badges              │ │
│  │  • Follow-up chat interface                                    │ │
│  │  • Report download button                                      │ │
│  │  • Analysis history timeline                                   │ │
│  └────────────────────────────┬───────────────────────────────────┘ │
│                    HTTPS (CORS enabled)                              │
└───────────────────────────────┼──────────────────────────────────────┘
                                │
┌───────────────────────────────┼──────────────────────────────────────┐
│                         API LAYER                                    │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  FastAPI Server (server.py) — H0 EDITION                       │ │
│  │                                                                │ │
│  │  NEW for H0:                                                   │ │
│  │  • Pure REST API (embedded HTML removed)                       │ │
│  │  • CORS middleware (allow Vercel cross-origin)                 │ │
│  │  • DynamoDB session persistence                                │ │
│  │  • /api/history — session listing                              │ │
│  │                                                                │ │
│  │  ENDPOINTS:                                                    │ │
│  │  POST /api/analyze     → run agent pipeline                    │ │
│  │  POST /api/followup    → multi-turn chat                       │ │
│  │  POST /api/confirm     → accept results + generate report      │ │
│  │  GET  /api/report/{id} → download Markdown report              │ │
│  │  GET  /api/history     → list recent analyses                  │ │
│  │  GET  /health          → health check + DynamoDB status        │ │
│  └──────┬──────────────────────────────────┬──────────────────────┘ │
└─────────┼──────────────────────────────────┼────────────────────────┘
          │                                  │
┌─────────▼──────────┐            ┌──────────▼────────────────────────┐
│   AGENT ENGINE     │            │   PERSISTENCE LAYER               │
│   (UNCHANGED)      │            │   (NEW — H0 requirement)          │
│                    │            │                                   │
│  ┌──────────────┐  │            │  ┌─────────────────────────────┐  │
│  │ agent.py     │  │            │  │ Amazon DynamoDB             │  │
│  │ • ReAct loop │  │            │  │ Table: chemspectra-sessions │  │
│  │ • Tool selec │  │            │  │                             │  │
│  │ • Cross-     │  │            │  │ Partition Key: session_id   │  │
│  │   validation │  │            │  │ TTL: 30 days                │  │
│  │ • Self-repair│  │            │  │                             │  │
│  │ • HITL check │  │            │  │ Stored per session:         │  │
│  └──────┬───────┘  │            │  │ • Analysis results          │  │
│         │          │            │  │ • Tool call logs            │  │
│  ┌──────▼───────┐  │            │  │ • Confidence trace          │  │
│  │ tools.py     │  │            │  │ • Final report              │  │
│  │ • 5 REST     │  │            │  │ • Timestamps                │  │
│  │   endpoints  │  │            │  └─────────────────────────────┘  │
│  │ • MCP search │  │            │                                   │
│  └──────┬───────┘  │            └───────────────────────────────────┘
│         │          │
│  ┌──────▼───────┐  │
│  │ report.py    │  │
│  │ • Markdown   │  │
│  │ • JSON       │  │
│  └──────────────┘  │
└────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────┐
│                     EXTERNAL SERVICES                             │
│                                                                  │
│  ┌────────────────────┐    ┌──────────────────────────────────┐  │
│  │ Alibaba Cloud      │    │ FTIR.fun API                     │  │
│  │ Qwen-3.7-Max       │    │ • 130,000+ reference spectra     │  │
│  │ via dashscope SDK  │    │ • 28+ file formats               │  │
│  │ • Function Calling │    │ • 5 REST tools                   │  │
│  │ • Thinking mode    │    │ • MCP endpoint                   │  │
│  └────────────────────┘    └──────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## 数据流：一次完整的分析请求

```
1. Vercel 前端 → POST /api/analyze (multipart: file + context)
        │
2. server.py → agent.new_session() → agent.run_pipeline()
        │
3. agent.py → _call_qwen_with_tools(messages)
        │  Qwen returns tool_calls e.g. [identify_material, explain_peaks]
        ▼
4. agent.py → _execute_tool(name, args, session)
        │  → tools.FtirfunClient.identify_material(...)
        │  → tools.FtirfunClient.explain_peaks(...)
        ▼
5. agent.py → _format_tool_result_for_llm(...) → back to Qwen
        │  Qwen synthesizes multi-tool results
        ▼
6. agent.py → _estimate_confidence() + _detect_evidence_conflicts()
        │  If confidence < 0.75 or conflicts found → verification round
        ▼
7. agent.py → build_confirmation_payload(session)
        │
8. server.py → _save_session_to_dynamodb(session)
        │  Writes to DynamoDB: session_id, synthesis, confidence_trace, ...
        ▼
9. Response → Vercel 前端展示结果
        │
10. User → POST /api/confirm → agent.generate_report()
        │  → _save_session_to_dynamodb(session) [update]
        ▼
11. User → GET /api/report/{session_id} → Markdown download
```

## 并发模型

与 Qwen Cloud 版本一样使用 Session 隔离：

- 每请求独立 `Session` dataclass（UUID 隔离）
- FastAPI 异步处理 + `run_in_executor` 包装同步 Qwen API 调用
- DynamoDB 写入是非阻塞的（失败不影响主流程，仅 log error）

## 与 Qwen Cloud 版本的差异

| 维度 | Qwen Cloud 版本 | H0 AWS 版本 |
|------|----------------|-------------|
| 前端 | 嵌入式 HTML（server.py 内） | Vercel v0 生成的 Next.js 独立部署 |
| Session 存储 | 内存 dict（重启丢失） | DynamoDB（持久化 + 30 天 TTL + 2 GSI + 条件写入） |
| 历史查询 | 无 | /api/history (GSI Query) + /api/material/{name} + /api/analytics |
| 使用量统计 | 无 | DynamoDB 原子计数器（chemspectra-stats 表） |
| CORS | 无（同源） | 启用（允许 Vercel 跨域） |
| agent.py | 原版 | **逐字节相同** |
| tools.py | 原版 | **逐字节相同** |
| report.py | 原版 | **逐字节相同** |
| 阿里云证明 | PROOF_ALIBABA_CLOUD.md | 不需要（H0 不要求阿里云证明） |
| 赛道 | Autopilot Agent | B2B SaaS |

## 技术栈

| Layer | Technology | Provider |
|-------|-----------|----------|
| LLM Reasoning + Tool Selection | Qwen-3.7-Max (Function Calling) | Alibaba Cloud dashscope |
| Web Framework | FastAPI + Uvicorn | — |
| Database | DynamoDB (2 tables, 2 GSIs, atomic counters, conditional writes, TTL) | **AWS** (required) |
| Frontend | Next.js / React via v0.app | **Vercel** (required) |
| Spectral Analysis | REST API (5 endpoints) + MCP | FTIR.fun |
| Spectral Database | SQLite speclib.db (130K+ spectra) | FTIR.fun |
| HTTP Client | httpx | — |
| AWS SDK | boto3 (DynamoDB) | AWS |

## DynamoDB Schema 设计

### Table: `chemspectra-sessions`

| Attribute | Type | Role |
|-----------|------|------|
| `session_id` | String | Partition Key |
| `pk_all` | String | GSI gsi-created PK (固定值 "ALL") |
| `created_at` | String (ISO 8601) | GSI gsi-created SK + GSI gsi-material SK |
| `top_match` | String | GSI gsi-material PK (材料名称) |
| `step` | String | 分析状态 (reasoning/synthesized/confirmed) |
| `ttl` | Number (epoch) | DynamoDB TTL — 30 天后自动删除 |

**GSI `gsi-created`** — 按时间倒序查询最近分析记录，替代全表 Scan。
- PK: `pk_all = "ALL"` (固定分区)
- SK: `created_at` (降序)
- 用途: `GET /api/history`

**GSI `gsi-material`** — 按材料名称聚合查询同类分析。
- PK: `top_match` (材料名称，如 "Polyethylene terephthalate")
- SK: `created_at` (降序)
- 用途: `GET /api/material/{name}`

**条件写入** — `POST /api/confirm` 使用 ConditionExpression 防止并发覆盖已确认的 session:
```
attribute_not_exists(session_id) OR step <> "confirmed"
```

### Table: `chemspectra-stats`

| Attribute | Type | Role |
|-----------|------|------|
| `stat_id` | String | Partition Key (固定值 "global") |
| `total_analyses` | Number | 原子计数器 — 总分析次数 |
| `total_tools_called` | Number | 原子计数器 — 总工具调用次数 |

使用 DynamoDB `ADD` 操作实现并发安全的原子递增，无需读-改-写循环。
- 用途: `GET /api/analytics`

### 访问模式总结

| 访问模式 | 方法 | DynamoDB 操作 |
|----------|------|---------------|
| 保存/更新 Session | `put_item` (主表) | O(1) 写入 |
| 加载 Session | `get_item` (主表) | O(1) 读取 |
| 最近 N 条记录 | `query` (GSI gsi-created) | O(N) 有序读取 |
| 按材料聚合 | `query` (GSI gsi-material) | O(N) 有序读取 |
| 使用量统计 | `update_item` ADD (stats 表) | O(1) 原子递增 |
| 防重复确认 | `put_item` + ConditionExpression | O(1) 条件写入 |
| 自动清理 | TTL 自动删除 | 零成本 |
