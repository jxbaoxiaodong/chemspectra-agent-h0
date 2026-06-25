# ChemSpectra Agent — H0 AWS + Vercel Edition

**AI Autopilot for FTIR Spectral Analysis**
> H0: Hack the Zero Stack with Vercel v0 and AWS Databases · Track 2: Monetizable B2B App

---

## 与 Qwen Cloud 版本的关系

本项目代码基于 [Qwen Cloud Hackathon 版本](../qwen-hackathon/) 复用核心引擎：

| 文件 | 来源 | 改动 |
|------|------|------|
| `agent.py` | 从 qwen-hackathon 复制 | **未修改** — ReAct 推理引擎不变 |
| `tools.py` | 从 qwen-hackathon 复制 | **未修改** — FTIR.fun API 客户端不变 |
| `report.py` | 从 qwen-hackathon 复制 | **未修改** — 报告生成器不变 |
| `server.py` | **新增** | 适配 AWS：去嵌入式 UI、加 DynamoDB 持久化 |
| `requirements.txt` | 从 qwen-hackathon 复制 | +boto3（DynamoDB SDK） |
| `AWS_SETUP.md` | **新增** | AWS 注册 + DynamoDB + 信用额申请完整指南 |
| `v0-frontend-guide.md` | **新增** | Vercel v0 前端生成 + 部署指南 |
| `DEVPOST_SUBMISSION.md` | **新增** | 参赛提交清单 |

---

## 快速开始

### 前提条件

- Python 3.10+
- AWS 账号（见 [AWS_SETUP.md](AWS_SETUP.md)）
- Alibaba Cloud dashscope API key（Qwen 推理用）
- FTIR.fun API key

### 安装

```bash
cd /home/bob/projects/h0-aws-hackathon
pip install -r requirements.txt
```

### 配置环境变量

```bash
# AWS
export AWS_REGION="us-east-1"
export AWS_ACCESS_KEY_ID="AKIAXXXXXXXXXXXXXXXX"
export AWS_SECRET_ACCESS_KEY="xxxxxxxxxxxxxxxxxxxx"
export DYNAMODB_TABLE="chemspectra-sessions"

# Qwen (Alibaba Cloud)
export DASHSCOPE_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# FTIR.fun
export FTIRFUN_API_KEY="your-ftirfun-api-key"
export FTIRFUN_API_URL="http://127.0.0.1:18080"

# Server
export PORT="8080"
```

### 启动后端

```bash
python server.py
# → Uvicorn running on http://0.0.0.0:8080
```

### 验证

```bash
curl http://localhost:8080/health
# {"status":"ok","dynamodb":"connected","region":"us-east-1"}
```

---

## 架构

```
┌─────────────────────────────────┐
│  Vercel v0 前端                 │  ← v0.app 一键生成
│  (Next.js / React)              │
│  • 文件上传 (28+ FTIR 格式)     │
│  • 分析结果展示 + 置信度追踪    │
│  • 多轮对话聊天                 │
│  • 报告下载                     │
└──────────────┬──────────────────┘
               │ HTTPS
┌──────────────▼──────────────────┐
│  FastAPI 后端 (server.py)       │  ← 本次新增
│  • /api/analyze — 光谱分析     │
│  • /api/followup — 多轮追问    │
│  • /api/confirm — 确认+报告    │
│  • /api/report/{id} — 报告下载 │
│  • /api/history — 历史记录     │
│  • /health — 健康检查          │
└──────┬──────────────────┬───────┘
       │                  │
┌──────▼──────┐  ┌────────▼────────┐
│  Qwen API   │  │  AWS DynamoDB   │  ← H0 要求
│  (dashscope)│  │  Session 持久化 │
│  agent.py   │  │  历史记录查询   │
│  tools.py   │  │  30 天 TTL      │
└──────┬──────┘  └─────────────────┘
       │
┌──────▼──────────────────┐
│  FTIR.fun API           │
│  (130K 光谱库)          │
│  5 tools + MCP endpoint │
└─────────────────────────┘
```

---

## H0 提交要求对照

| # | 要求 | 实现 |
|---|------|------|
| 1 | 使用 AWS 数据库（Aurora/DynamoDB） | ✅ DynamoDB — `chemspectra-sessions` 表 |
| 2 | 前端部署到 Vercel/v0.app | ✅ v0 生成 + Vercel 部署 |
| 3 | 全栈应用（前后端联通） | ✅ FastAPI 后端 + Next.js 前端 |
| 4 | 演示视频 ≤3 分钟 | 见 DEVPOST_SUBMISSION.md |
| 5 | 架构图 | 见 ARCHITECTURE.md |
| 6 | 公开仓库 + 开源许可证 | ✅ MIT |
| 7 | AWS 数据库使用截图 | DynamoDB Console 截图 |

---

## 赛道定位

**Track 2: Monetizable B2B App**

ChemSpectra Agent 面向的 B2B 客户：
- 聚合物制造商的 QC 实验室
- 制药公司材料检验部门
- 法证分析机构
- 环境检测实验室
- 学术研究团队

商业模式：SaaS 订阅 + 按样品计费。已有 52 国用户基础。

---

## 相关文档

| 文档 | 用途 |
|------|------|
| [AWS_SETUP.md](AWS_SETUP.md) | AWS 注册、DynamoDB 建表、IAM、信用额申请全流程 |
| [v0-frontend-guide.md](v0-frontend-guide.md) | Vercel v0 前端生成 + 部署指南 |
| [ARCHITECTURE.md](ARCHITECTURE.md) | 系统架构详细文档 |
| [DEVPOST_SUBMISSION.md](DEVPOST_SUBMISSION.md) | Devpost 提交检查清单 |
| [.env.example](.env.example) | 环境变量模板 |

---

## License

MIT — see [LICENSE](LICENSE)
