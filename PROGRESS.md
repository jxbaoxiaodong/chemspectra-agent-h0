# H0 AWS+Vercel — 进度追踪

> 最后更新: 2026-06-25 18:35

---

## ✅ 已完成 (18/25)

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
| 13 | Python 依赖安装 | `pip install -r requirements.txt` 全部已装 ✅ |
| 14 | 后端启动验证 | `curl :8080/health` → `{"status":"ok","dynamodb":"connected","region":"us-east-2"}` ✅ |
| 15 | GitHub 仓库创建 + 推送 | `github.com/jxbaoxiaodong/chemspectra-agent-h0` 公开，已推送 2 次 commit ✅ |
| 16 | FTIR.fun API 确认 | `{"status":"ok","service":"ftirfun-api"}` 正常运行 ✅ |
| 17 | **Next.js 前端构建** | 暗色主题 + 7 个组件 + 全栈 API 客户端 ✅ |
| 18 | **agent.py 修复** | dashscope response `__getattr__` KeyError → 改用 `.get()` ✅ |

---

## ⬜ 待完成 (7/25)

| # | 事项 | 预计工时 | 说明 |
|---|------|:--:|------|
| 1 | **Vercel 部署** | 10 min | CLI 需浏览器交互登录；走 GitHub 集成路线 → vercel.com/import |
| 2 | **AWS DynamoDB 截图** | 5 min | AWS Console → DynamoDB → chemspectra-sessions（已有 1 条真实数据） |
| 3 | **Vercel 部署截图** | 5 min | Vercel Dashboard 项目列表 |
| 4 | **录制演示视频** | 3 hr | 3 分钟，YouTube/Youku |
| 5 | **Devpost 提交** | 30 min | 文字描述 + 截图 + 视频 + 链接 |
| 6 | **旧邮箱申请撤销邮件** | 5 min | — |
| 7 | **MCP 搜索修复（可选）** | 30 min | 目前 401，MCP 服务认证机制待查 |

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
| `FTIRFUN_API_KEY` | ✅ 已验证可调 REST API |
| `FTIRFUN_API_URL` | ✅ `http://127.0.0.1:18080` 正常 |

---

## 🎯 Vercel 部署方法

由于 Vercel CLI 需要浏览器交互登录，请使用以下方式：

### 方法 1: Vercel Dashboard 导入 GitHub 仓库（推荐）

1. 打开 https://vercel.com/new （可用代理访问）
2. 用 GitHub 登录
3. 选择导入 `jxbaoxiaodong/chemspectra-agent-h0`
4. Framework 选择 **Next.js**
5. Root Directory 设为 `frontend`
6. 添加环境变量: `NEXT_PUBLIC_API_URL` = 后端公网地址
7. 点击 Deploy

### 方法 2: Vercel CLI（需先登录）

```bash
export http_proxy=http://127.0.0.1:7897/
export https_proxy=http://127.0.0.1:7897/
cd /home/bob/projects/h0-aws-hackathon/frontend
vercel login    # 浏览器授权
vercel          # 按提示部署
```

### 部署后获取

- **Vercel Project URL**: `https://chemspectra-agent-xxx.vercel.app`
- **Vercel Team ID**: Dashboard → Settings → General

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
