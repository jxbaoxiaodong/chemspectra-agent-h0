# H0 AWS+Vercel — 进度追踪

> 最后更新: 2026-06-25 20:00

---

## ✅ 已完成 (21/25)

| # | 事项 | 详情 |
|---|------|------|
| 1 | 项目目录创建 | `/home/bob/projects/h0-aws-hackathon/` |
| 2 | 核心代码复用 | `agent.py` / `tools.py` / `report.py` 从 qwen-hackathon 复制 |
| 3 | H0 专版 `server.py` | 纯 REST API + DynamoDB 持久化 + CORS |
| 4 | 全部文档 | README / ARCHITECTURE / AWS_SETUP / DEVPOST / v0 指南 / .env.example |
| 5 | AWS 账号注册 | 新账号，$100 信用额已到账，184 天有效期 |
| 6 | DynamoDB 建表 | `chemspectra-sessions`，状态 ACTIVE，region us-east-2 |
| 7 | IAM 用户 + Access Key | `chemspectra-agent`，DynamoDBFullAccess 权限 |
| 8 | DynamoDB 连通性测试 | 读写删除全部通过 ✅ |
| 9 | Google Forms 信用额申请 | 新旧邮箱各提交一次（新邮箱为准） |
| 10 | Devpost 注册 | 用户名 `ftir_fun` |
| 11 | .env 配置 | AWS + dashscope + FTIR.fun 密钥已填入 |
| 12 | boto3 安装 | 系统级 Python 已安装 |
| 13 | Python 依赖安装 | `pip install -r requirements.txt` 全部已装 ✅ |
| 14 | 后端启动验证 | `curl :8080/health` → DynamoDB connected ✅ |
| 15 | GitHub 仓库 | `github.com/jxbaoxiaodong/chemspectra-agent-h0` 公开，MIT License ✅ |
| 16 | FTIR.fun API 确认 | `localhost:18080` 正常运行 ✅ |
| 17 | agent.py 修复 | dashscope response `__getattr__` KeyError → 改用 `.get()` ✅ |
| 18 | Next.js 前端 | 7 组件 + API 客户端 + 暗色主题，Turbopack 构建通过 ✅ |
| 19 | Vercel 部署 | `chemspectra-agent-h0.vercel.app` 生产环境，GitHub 自动部署 ✅ |
| 20 | 后端公网 | `https://ftir.fun/h0` ← VPS Nginx + SSH 反向隧道 → 本机 8080 ✅ |
| 21 | **演示视频 (HTML)** | HyperFrames 1920×1080，7 场景，GSAP 动画，已推送 GitHub ✅ |

---

## ⬜ 待完成 (4/25)

| # | 事项 | 预计工时 | 说明 |
|---|------|:--:|------|
| 1 | **AWS DynamoDB 截图** | 5 min | AWS Console → DynamoDB → chemspectra-sessions 表详情截图 |
| 2 | **Vercel 部署截图** | 5 min | Vercel Dashboard → chemspectra-agent-h0 项目列表截图 |
| 3 | **Devpost 提交** | 30 min | 填表 + 贴视频链接 + 上传截图 + 架构图 |
| 4 | **旧邮箱申请撤销邮件** | 5 min | — |

---

## 📋 关键链接

| 用途 | URL |
|------|-----|
| **Vercel 前端** | `https://chemspectra-agent-h0.vercel.app` |
| **后端 API** | `https://ftir.fun/h0` |
| **GitHub** | `https://github.com/jxbaoxiaodong/chemspectra-agent-h0` |
| **Devpost** | `https://h01.devpost.com/` |
| **演示视频** | `video/index.html`（HyperFrames，待渲染 + 上传 YouTube） |

---

## 📋 环境变量清单

| 变量 | 状态 |
|------|:--:|
| `AWS_REGION=us-east-2` | ✅ |
| `AWS_ACCESS_KEY_ID` | ✅ |
| `AWS_SECRET_ACCESS_KEY` | ✅ |
| `DYNAMODB_TABLE=chemspectra-sessions` | ✅ |
| `DASHSCOPE_API_KEY` | ✅ |
| `QWEN_MODEL=qwen3.7-max` | ✅ |
| `FTIRFUN_API_KEY` | ✅ |
| `FTIRFUN_API_URL=http://127.0.0.1:18080` | ✅ |

---

## 🚀 启动命令

```bash
# 后端
cd /home/bob/projects/h0-aws-hackathon
source .env
python3 server.py
# → http://localhost:8080

# 前端 (开发模式)
cd /home/bob/projects/h0-aws-hackathon/frontend
echo "NEXT_PUBLIC_API_URL=http://localhost:8080" > .env.local
npx next dev
# → http://localhost:3000
```

---

## 🎬 演示视频说明

视频文件: `video/index.html`（HyperFrames 1920×1080，7 场景，180 秒）

| 场景 | 时长 | 内容 | 打 H0 哪个维度 |
|------|:--:|------|:--|
| 1. Title | 8s | 标题 + AWS/Vercel 双徽标 | Design |
| 2. B2B Pain | 20s | QC 实验室痛点 + 52国客户 | Impact |
| 3. Architecture | 25s | Vercel→FastAPI→Qwen→FTIR.fun→DynamoDB | Technical |
| 4. Vercel Demo | 55s | 公网前端 + Agent 分析 + 自验证 | Design + Technical |
| 5. DynamoDB | 20s | AWS Console 数据表（H0 硬性要求） | Technical |
| 6. B2B Value | 30s | 6 卡片：创新点 + 商业模式 | Originality + Impact |
| 7. Closing | 22s | 技术栈总结 + GitHub + Thank you | 全维度收束 |

渲染后需上传到 **YouTube**（公开），获取链接填入 Devpost 提交表。
