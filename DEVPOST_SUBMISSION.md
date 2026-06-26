# H0 AWS+Vercel — Devpost 提交清单

> Track 2: Monetizable B2B App | 截止: 2026-06-29 5:00 PM PT | 北京时间: 2026-06-30 8:00 AM
> Hackathon 页面: https://h01.devpost.com/
> 进度详情: [PROGRESS.md](PROGRESS.md)

---

## 一、强制提交项（7 项）

从 [H0 官方规则](https://h01.devpost.com/rules) 逐条提取：

| # | 要求 | 落实文件 | 状态 |
|---|------|----------|:--:|
| 1 | **公开 GitHub 仓库 + 开源许可证** | `github.com/jxbaoxiaodong/chemspectra-agent-h0`，含 `LICENSE` (MIT) | ✅ |
| 2 | **文字描述** — 解释项目功能 | 见下方「文字描述模板」 | ✅ |
| 3 | **演示视频 ≤3 分钟** — YouTube/Vimeo/Youku 公开 | `video/index.html`（HyperFrames，待渲染上传） | ⬜ |
| 4 | **架构图** — 系统组件连接关系 | `ARCHITECTURE.md` | ✅ |
| 5 | **Vercel 项目链接 + Vercel Team ID** | `chemspectra-agent-h0.vercel.app`，Team ID 待获取 | ⬜ |
| 6 | **AWS 数据库使用截图** | DynamoDB Console 截图待截 | ⬜ |
| 7 | **注明使用了哪个 AWS 数据库** | Amazon DynamoDB（chemspectra-sessions 表） | ✅ |

## 二、加分项（可选）

| # | 要求 | 说明 |
|---|------|------|
| ⭐ | **发布博客/文章** | 在 builder.aws.com、LinkedIn、Medium、dev.to 等平台发布，用 #H0Hackathon 标签，最多 +0.6 分 |
| ⭐ | **可提交多篇内容** | 每篇 +0.2 分，上限 0.6 分 |

---

## 三、文字描述模板

以下可直接贴到 Devpost 提交页（提交前微调具体数值）：

```
ChemSpectra Agent is an AI-powered FTIR spectral analysis SaaS
for polymer manufacturers, pharmaceutical QC labs, and materials
testing facilities. Built for Track 2: Monetizable B2B App.

WHAT IT DOES:
1. Users upload FTIR spectrum files (28+ formats supported)
   or enter peak positions manually
2. The AI agent autonomously selects from 5 analysis tools
   via a ReAct reasoning loop powered by Qwen-3.7-Max
3. Multi-tool evidence is cross-validated — conflicting results
   trigger an automatic verification round
4. Results are presented with confidence scores and a
   human-in-the-loop confirmation checkpoint
5. Confirmed analyses generate structured Markdown reports
   with DOI-cited chemical evidence

TECH STACK:
- Frontend: Vercel v0 (Next.js / React)
- Backend: FastAPI (Python) with multi-round AI reasoning
- Database: AWS DynamoDB — 2 tables, 2 GSIs, atomic
  counters, conditional writes, TTL auto-expiry.
  Sessions table with gsi-created (time-ordered query)
  and gsi-material (material aggregation). Stats table
  with atomic ADD counters for usage metrics.
- AI Engine: ReAct agent with self-verification and
  cross-validation (Qwen-3.7-Max)
- Domain API: FTIR.fun spectral library (130,000+
  reference spectra, 28+ file formats, 52 countries)

BUSINESS VALUE:
- Reduces manual spectral analysis from 30-60 min
  to under 2 min per sample
- Provides verifiable audit trails for regulated
  industries (pharma, forensics, materials QC)
- Already has paying users in 52 countries through
  the FTIR.fun platform
```

---

## 四、录屏指南

### 视频结构（3 分钟）

| 时间 | 内容 |
|------|------|
| 0:00-0:20 | 自我介绍 + 项目名称 + Track 2 |
| 0:20-0:50 | **Vercel 前端展示**：上传光谱文件（.csv/.spc），选择分析类型 |
| 0:50-1:20 | **Agent 工作过程**：展示多工具选择 + ReAct 推理 + 交叉验证 |
| 1:20-1:50 | **DynamoDB 证据**：切换到 AWS Console，展示 chemspectra-sessions 表中有记录 |
| 1:50-2:20 | **结果展示**：材料鉴定结果 + 置信度 + 官能团分析 + 报告下载 |
| 2:20-2:40 | **Vercel 部署证明**：展示 Vercel 项目 Dashboard |
| 2:40-3:00 | 总结 + GitHub 链接 + 商业模式简介 |

### 要点

- 视频上传 **YouTube**（需要翻墙）或 **Youku**（国内可用）
- 视频中不能有第三方版权音乐
- 必须展示 AWS 数据库的实际使用（DynamoDB Console 截图或屏幕共享）
- 必须展示 Vercel 部署的项目链接

---

## 五、提交前检查清单

### GitHub 仓库

- [x] LICENSE (MIT) 文件存在
- [x] README.md 解释项目功能 + 技术栈
- [x] ARCHITECTURE.md 包含完整系统架构图
- [x] 代码仓库设为 Public
- [x] 包含设置说明（如何运行）
- [x] 前端 Next.js 代码已推送

### AWS 数据库

- [x] DynamoDB 表 `chemspectra-sessions` 已创建并 Active
- [x] IAM 用户 `chemspectra-agent` 有 DynamoDBFullAccess 权限
- [x] 表中有真实分析数据（已验证 `/api/history` 返回记录）
- [ ] 截图：打开 AWS Console → DynamoDB → chemspectra-sessions → 显示表详情
- [ ] 截图文件名: `aws-dynamodb-proof.png`

### Vercel 部署

- [x] Next.js 前端已部署到 Vercel（`chemspectra-agent-h0.vercel.app`）
- [x] 前端调用后端 API 使用公网 URL（`https://ftir.fun/h0`）
- [x] 获取 Vercel Project URL
- [ ] 获取 Vercel Team ID
- [ ] 截图：Vercel Dashboard 项目列表

### 视频

- [x] HyperFrames HTML 视频 7 场景已完成（`video/index.html`）
- [x] 中/英文旁白脚本已完成（`video/SCRIPT.md`）
- [ ] 渲染视频 → 上传到 YouTube 并设为公开

### 文字材料

- [x] 项目描述（英文，用上方模板）已就绪
- [x] 解释了使用 AWS DynamoDB + 集成方式
- [x] README 包含完整设置说明
- [x] 架构图在 ARCHITECTURE.md 中

### 加分项（可选）

- [ ] 在 dev.to / Medium / LinkedIn 发布构建过程文章
- [ ] 文章包含 #H0Hackathon 标签

---

## 六、Devpost 提交表单预填

| 字段 | 内容 |
|------|------|
| **Project Title** | ChemSpectra Agent — AI FTIR Spectral Analysis for Materials QC |
| **Track** | Track 2: Monetizable B2B App |
| **Short Description** | AI autopilot for FTIR spectral analysis. Upload a spectrum → get material ID, functional groups, and a structured report in <2 min. |
| **Which AWS Database?** | Amazon DynamoDB |
| **Video Link** | [YouTube 上传后获取] |
| **Vercel Project Link** | `https://chemspectra-agent-h0.vercel.app` |
| **Vercel Team ID** | [从 Vercel Dashboard → Settings → General 获取] |
| **GitHub Repository** | `https://github.com/jxbaoxiaodong/chemspectra-agent-h0` |
| **AWS Database Screenshot** | 待截取：AWS Console → DynamoDB → chemspectra-sessions |
| **Architecture Diagram** | `ARCHITECTURE.md`（含 Mermaid 图） |

---

## 七、时间线

| 日期 | 任务 |
|------|------|
| 6/22-6/23 | v0 生成前端 + 部署到 Vercel |
| 6/23-6/24 | AWS 注册 + DynamoDB 建表 + IAM 配置 |
| 6/25 前 | 提交 AWS 信用额申请（Google Forms） |
| 6/25-6/26 | 前后端联调 |
| 6/26-6/27 | 录视频 + 写文档 |
| 6/28 | 缓冲日 |
| **6/29** | **🔥 提交截止** |
