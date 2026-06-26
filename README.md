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
| `frontend/` | **新增** | Next.js 16 前端（Vercel 部署） |
| `video/` | **新增** | HyperFrames 演示视频 |

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
export AWS_REGION="us-east-2"
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
# {"status":"ok","dynamodb":"connected","region":"us-east-2"}
```

---

## 架构

```
┌─────────────────────────────────────────┐
│  ▲ Vercel 前端                          │
│  chemspectra-agent-h0.vercel.app       │
│  (Next.js 16 / React / TypeScript)     │
│  • 文件上传 (28+ FTIR 格式)            │
│  • 分析结果展示 + 置信度追踪           │
│  • 多轮对话聊天 + 追问                 │
│  • 报告下载 + Agent 指标面板           │
│  • 历史记录侧边栏                      │
└──────────────┬──────────────────────────┘
               │ HTTPS (ftir.fun/h0)
┌──────────────▼──────────────────────────┐
│  FastAPI 后端 (server.py)               │
│  • /api/analyze — 光谱分析              │
│  • /api/followup — 多轮追问             │
│  • /api/confirm — 确认+报告             │
│  • /api/report/{id} — 报告下载          │
│  • /api/history — 历史记录              │
│  • /health — 健康检查                   │
└──────┬──────────────────┬───────────────┘
       │                  │
┌──────▼──────┐  ┌────────▼────────┐
│  Qwen API   │  │  ☁ AWS DynamoDB │  ← H0 要求
│  (dashscope)│  │  chemspectra-   │
│  Qwen 3.7-  │  │  sessions 表    │
│  Max        │  │  30 天 TTL      │
│  agent.py   │  │  History API    │
│  tools.py   │  │                 │
└──────┬──────┘  └─────────────────┘
       │
┌──────▼──────────────────┐
│  FTIR.fun API           │
│  (130K 光谱库)          │
│  5 tools + MCP endpoint │
└─────────────────────────┘
```

---

## 🔗 在线地址

| 环境 | URL |
|------|-----|
| **Vercel 前端** | `https://chemspectra-agent-h0.vercel.app` |
| **后端 API** | `https://ftir.fun/h0` |
| **GitHub** | `https://github.com/jxbaoxiaodong/chemspectra-agent-h0` |

---

## H0 提交要求对照

| # | 要求 | 状态 |
|---|------|:--:|
| 1 | 使用 AWS 数据库（Aurora/DynamoDB） | ✅ DynamoDB — `chemspectra-sessions` 表 |
| 2 | 前端部署到 Vercel/v0.app | ✅ `chemspectra-agent-h0.vercel.app` |
| 3 | 全栈应用（前后端联通） | ✅ FastAPI + Next.js，公网全链路通 |
| 4 | 演示视频 ≤3 分钟 | ✅ HTML 完成，待渲染上传 |
| 5 | 架构图 | ✅ `ARCHITECTURE.md` |
| 6 | 公开仓库 + 开源许可证 | ✅ MIT |
| 7 | AWS 数据库使用截图 | ⬜ 待截取 |

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
