# H0 AWS+Vercel — 进度追踪

> 最后更新: 2026-06-25

---

## ✅ 已完成

| # | 事项 | 详情 |
|---|------|------|
| 1 | 项目目录创建 | `/home/bob/projects/h0-aws-hackathon/` |
| 2 | 核心代码复用 | `agent.py` / `tools.py` / `report.py` 从 qwen-hackathon 逐字节复制 |
| 3 | H0 专版 `server.py` | 纯 REST API + DynamoDB 持久化 + CORS |
| 4 | 全部文档 | README / ARCHITECTURE / AWS_SETUP / DEVPOST_SUBMISSION / v0 指南 / .env.example |
| 5 | AWS 账号注册 | 新账号，$100 信用额已到账，184 天有效期 |
| 6 | DynamoDB 建表 | `chemspectra-sessions`，状态 ACTIVE，region us-east-2 |
| 7 | IAM 用户 + Access Key | `chemspectra-agent`，DynamoDBFullAccess 权限 |
| 8 | DynamoDB 连通性测试 | 读写删除全部通过 ✅ |
| 9 | Google Forms 信用额申请 | 新旧邮箱各提交一次（新邮箱为准） |
| 10 | Devpost 注册 | 用户名 `ftir_fun` |
| 11 | .env 配置 | AWS + dashscope + FTIR.fun 密钥已填入 |
| 12 | boto3 安装 | 系统级 Python 已安装 |

---

## ⬜ 待完成

| # | 事项 | 预计工时 | 依赖 |
|---|------|:--:|------|
| 1 | **安装 Python 依赖** | 2 min | — |
|   | `pip install -r requirements.txt --break-system-packages` | | |
| 2 | **启动后端验证** | 2 min | 安装依赖 |
|   | `python3 server.py` → `curl localhost:8080/health` | | FTIR.fun API 需运行 |
| 3 | **v0 生成前端** | 2 hr | — |
|   | v0.app → 粘贴 prompt → 部署到 Vercel | | |
| 4 | **前后端联调** | 2 hr | v0 前端 + 后端 |
|   | 上传光谱 → 查看结果 → 追问 → 确认 → 下载报告 | | |
| 5 | **AWS 数据库使用截图** | 10 min | 联调完成 |
|   | DynamoDB Console → chemspectra-sessions 表中有实际数据 | | |
| 6 | **Vercel 部署截图** | 5 min | v0 部署 |
| 7 | **录制演示视频** | 3 hr | 联调完成 |
|   | 3 分钟，YouTube/Youku 上传 | | |
| 8 | **Devpost 提交** | 30 min | 全部完成 |
| 9 | **旧邮箱申请撤销邮件** | 5 min | — |

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
| `FTIRFUN_API_KEY` | ⚠️ 需确认 |
| `FTIRFUN_API_URL` | ⚠️ 需确认本地 API 是否运行 |

---

## 🎯 下一步操作

```bash
# 1. 安装依赖
cd /home/bob/projects/h0-aws-hackathon
pip install -r requirements.txt --break-system-packages

# 2. 确认 FTIR.fun API 在运行
curl http://127.0.0.1:18080/health

# 3. 启动后端
python3 server.py

# 4. 验证
curl http://localhost:8080/health
# 预期: {"status":"ok","dynamodb":"connected","region":"us-east-2"}
```
