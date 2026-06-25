# Vercel v0 前端生成指南

> 用 v0.app 一句话生成 ChemSpectra Agent 的前端 UI，直接部署到 Vercel。
> 全程无需手写前端代码。中国大陆可直接访问 v0.app（可能慢但不被墙）。

---

## 1. 前提条件

### 1.1 注册 Vercel 账号

1. 打开 [https://vercel.com](https://vercel.com)
2. 点击 **Sign Up** → 用 GitHub 账号登录（推荐）
3. 授权 Vercel 访问你的 GitHub 仓库

### 1.2 注册 v0.app

> v0 是 Vercel 的 AI 前端生成器，免费额度包含在 H0 的 $30 信用额中。

1. 打开 [https://v0.app](https://v0.app)
2. 用同一个 GitHub 账号登录
3. 首次使用会获得免费生成额度

---

## 2. 用 v0 生成前端

### 2.1 在 v0 中输入 prompt

打开 v0.app，在输入框中粘贴以下 prompt（已根据你的 API 端点定制）：

```
Build a dark-themed scientific web application for FTIR spectral analysis with the following features:

1. FILE UPLOAD SECTION:
   - Drag-and-drop area for spectrum files (.spc, .csv, .jdx, .dx, .opus, .spa, .xlsx, .txt, .json formats)
   - Alternative: text input for peak positions (comma-separated cm⁻¹ values)
   - Sample context/description text field
   - Analysis type dropdown: "Identify Material", "Explain Peaks", "Assign Functional Groups", "Deformulate / Full Analysis", "Quick Screening"

2. ANALYSIS RESULTS PANEL:
   - Top material match with large name, CAS number, similarity score (0-1)
   - Confidence badge (green >0.85, yellow >0.7, red <0.7)
   - "Tools Used by Agent" section showing which tools the AI selected (colored pill tags)
   - Agent synthesis text block with chemical reasoning
   - Functional groups list with wavenumber ranges
   - Peak explanations table
   - "Agent Metrics" section showing: ReAct iterations, verification rounds, repair count, confidence trace

3. FOLLOW-UP CHAT:
   - Chat input at the bottom of results
   - Q&A style conversation with the AI agent about the analysis results
   - Display agent responses in markdown

4. CONFIRMATION + REPORT:
   - "Confirm Analysis" button
   - After confirmation: "Download Report (Markdown)" button
   - Success toast/notification

5. ANALYSIS HISTORY:
   - Sidebar or bottom section showing recent analyses
   - Each entry: timestamp, top match name, confidence score
   - Clickable to view past results

6. DESIGN REQUIREMENTS:
   - Dark theme with blue/teal accent colors
   - Professional, lab-software feel
   - Responsive layout (works on desktop)
   - Loading states with animated progress indicator
   - Error states with clear messages

BACKEND API (FastAPI at http://localhost:8080):
- POST /api/analyze (multipart/form-data: file, context, peaks, analysis_type)
- POST /api/followup (JSON: session_id, question)
- POST /api/confirm (JSON: session_id, accept)
- GET /api/report/{session_id}
- GET /api/history (JSON array of past sessions)
- GET /health

The backend base URL should be configurable via environment variable.
Use React/Next.js with TypeScript.
Include a .env.example with NEXT_PUBLIC_API_URL.
```

### 2.2 v0 迭代调整

v0 生成初版后，可能需要微调：

1. **如果 UI 布局不对**：继续和 v0 对话，描述需要调整的地方
2. **如果 API 调用格式不对**：复制 server.py 中的响应格式给 v0 参考
3. **如果颜色/样式不满意**：告诉 v0 你的偏好

### 2.3 配置 API 地址

v0 生成的代码会有一个 `.env.local` 或 `.env` 文件：

```
NEXT_PUBLIC_API_URL=https://your-backend-url.com
```

本地开发时改为：

```
NEXT_PUBLIC_API_URL=http://localhost:8080
```

---

## 3. 部署到 Vercel

### 3.1 从 v0 一键部署

v0 生成的代码可以直接部署到 Vercel：

1. 在 v0 中点击 **"Deploy"** 或 **"Publish"**
2. 选择部署到 Vercel
3. 输入项目名称（如 `chemspectra-agent`）
4. 等待部署完成（约 1-2 分钟）

### 3.2 设置环境变量

部署后在 Vercel Dashboard 中：

1. 进入项目 → **Settings** → **Environment Variables**
2. 添加：
   - `NEXT_PUBLIC_API_URL` = 你的后端 API 地址
   - （如果后端部署在 AWS ECS 或其他云服务，使用公网地址）

### 3.3 获取部署信息

部署成功后，你会得到：

- **Vercel Project URL**: `https://chemspectra-agent.vercel.app`（提交用）
- **Vercel Team ID**: 在 Dashboard → Settings → General 中找到（提交用）

---

## 4. 后端部署选项

### 选项 A: 本地运行 + ngrok 穿透（最简单）

```bash
# 启动后端
python server.py

# 另一终端，用 ngrok 暴露公网地址
ngrok http 8080
# → https://xxxx.ngrok.io → 设置到 NEXT_PUBLIC_API_URL
```

### 选项 B: AWS EC2 部署

```bash
# 在 EC2 上安装 Python 依赖
pip install -r requirements.txt

# 启动（使用 screen 或 systemd 保持后台运行）
python server.py
```

### 选项 C: 现有服务器

如果你已有运行 FTIR.fun 的服务器，H0 的后端可以直接部署在同一台机器上，只需改端口即可。

---

## 5. 前端代码结构（v0 生成后）

```
frontend/
├── app/
│   ├── layout.tsx          # Root layout (dark theme)
│   ├── page.tsx            # Main page
│   └── globals.css         # Global styles
├── components/
│   ├── FileUpload.tsx       # File upload with drag-and-drop
│   ├── AnalysisForm.tsx     # Peak input + analysis type
│   ├── ResultsPanel.tsx     # Results display
│   ├── ToolBadges.tsx       # "Tools Used" pill tags
│   ├── ConfidenceBadge.tsx  # Color-coded confidence
│   ├── FollowUpChat.tsx     # Chat interface
│   ├── ReportDownload.tsx   # Report download button
│   └── HistorySidebar.tsx   # Past analyses list
├── lib/
│   └── api.ts               # API client (fetch wrapper)
├── .env.example
├── package.json
└── next.config.js
```

---

## 6. 与后端联调测试

```bash
# 1. 启动后端
cd /home/bob/projects/h0-aws-hackathon
python server.py

# 2. 测试 API
curl -X POST http://localhost:8080/api/analyze \
  -F "peaks=2920,2850,1460,720" \
  -F "context=suspected polyethylene film" \
  -F "analysis_type=identify"
# 预期返回: {"step":"awaiting_confirmation","session_id":"abc123...","tools_called":[...]})

# 3. 启动前端（本地）
cd frontend
npm install
npm run dev
# → http://localhost:3000 → 应该能调用后端 API

# 4. 完整流程测试
# 上传文件 → 查看结果 → 追问 → 确认 → 下载报告 → 检查历史
```

---

## 7. H0 提交时注意事项

| 检查项 | 说明 |
|--------|------|
| Vercel 前端必须公网可访问 | 不能用 localhost |
| 后端可以在任意位置 | 只要能通过公网或 ngrok 被前端调用 |
| 截图包含 Vercel 部署证据 | 拍 Vercel Dashboard 项目列表 |
| 截图包含 DynamoDB 证据 | 拍 AWS Console DynamoDB 表 |
