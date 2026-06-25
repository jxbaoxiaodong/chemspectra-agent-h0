# AWS 注册与 H0 黑客松环境搭建指南

> 本文档从零开始，带你完成 AWS 账号注册、DynamoDB 建表、IAM 配置、填表申请信用额的全流程。
> 适用于中国大陆用户。需要**一次翻墙**完成 Google Forms 填表。

---

## 目录

1. [AWS 账号注册](#1-aws-账号注册)
2. [创建 DynamoDB 表](#2-创建-dynamodb-表)
3. [创建 IAM 用户并获取 Access Key](#3-创建-iam-用户并获取-access-key)
4. [申请 AWS 信用额（Google Forms 填表）](#4-申请-aws-信用额google-forms-填表)
5. [本地环境配置](#5-本地环境配置)
6. [测试 DynamoDB 连接](#6-测试-dynamodb-连接)
7. [常见问题](#7-常见问题)

---

## 1. AWS 账号注册

### 1.1 访问 AWS 官网

打开 [https://aws.amazon.com](https://aws.amazon.com)（中国大陆可直接访问，无需翻墙）。

点击右上角 **"Create an AWS Account"**（创建 AWS 账户）。

### 1.2 填写信息

| 字段 | 填写建议 |
|------|----------|
| **Email** | 使用常用邮箱（Gmail/QQ/163 均可） |
| **Account name** | 填写你的英文名或项目名，如 `ChemSpectra` |
| **Password** | 设置强密码 |

### 1.3 选择账户类型

选择 **Personal**（个人账户），不需要选择 Business。

> ⚠️ 商业账户需要公司信息，个人账户更适合黑客松参赛。

### 1.4 填写联系信息

| 字段 | 说明 |
|------|------|
| **Full Name** | 英文拼音全名 |
| **Phone** | +86 手机号 |
| **Country** | China |
| **Address** | 英文或拼音地址（如 Room 301, No. 123, XXXX Road, Beijing） |
| **City** | 拼音城市名 |
| **Postal Code** | 邮编 |

### 1.5 信用卡验证

AWS 注册需要验证信用卡（Visa/Mastercard 均可，**银联卡不被接受**）。

> ⚠️ **不会扣款**。AWS 只是预授权验证（通常是 $1 美元，随后退回）。
> 黑客松期间使用 $100 信用额，超出部分才会扣费。务必监控用量。

### 1.6 选择支持计划

选择 **Basic Support（免费）**，不需要付费支持计划。

### 1.7 完成注册

注册完成后，你会收到确认邮件。点击邮件中的链接激活账户。

---

## 2. 创建 DynamoDB 表

### 2.1 登录 AWS Console

访问 [https://console.aws.amazon.com](https://console.aws.amazon.com)（中国大陆可直连）。

登录后，确认右上角的 **Region**（区域）选择。建议选择：
- **us-east-1**（美国东部，弗吉尼亚）：最便宜、可用服务最多
- **ap-southeast-1**（新加坡）：延迟较低

### 2.2 进入 DynamoDB

在顶部搜索框输入 `DynamoDB`，点击进入 DynamoDB 控制台。

### 2.3 创建表

点击 **"Create table"** 按钮。

填写以下信息：

| 字段 | 值 | 说明 |
|------|-----|------|
| **Table name** | `chemspectra-sessions` | 与 server.py 中 `DYNAMODB_TABLE` 环境变量一致 |
| **Partition key** | `session_id` | 主键，类型选 **String** |
| **Sort key** | 留空 | 不需要排序键 |

其余选项全部使用默认值。

点击 **"Create table"** 按钮。等待表状态变为 **"Active"**（约 10 秒）。

### 2.4 确认 TTL（可选）

为了让旧 Session 自动过期，可以开启 TTL：

1. 进入 `chemspectra-sessions` 表
2. 点击 **"Additional settings"** → **"Time to Live (TTL)"**
3. 点击 **"Enable TTL"**
4. TTL attribute name 填写：`ttl`
5. 保存

---

## 3. 创建 IAM 用户并获取 Access Key

> ⚠️ **安全提醒**：不要使用 root 账号的 Access Key！始终创建专用的 IAM 用户。

### 3.1 进入 IAM

在 AWS Console 顶部搜索 `IAM`，点击进入。

### 3.2 创建用户

1. 左侧菜单 → **Users** → **Create user**
2. User name：`chemspectra-agent`
3. 勾选 **"Provide user access to the AWS Management Console"**：不勾选
4. 点击 **Next**

### 3.3 设置权限

选择 **"Attach policies directly"**，搜索并勾选：

- ✅ **AmazonDynamoDBFullAccess**（读/写/扫描 DynamoDB）

> 如果希望更精细的权限，可以创建自定义策略，只允许访问 `chemspectra-sessions` 表。但黑客松期间 FullAccess 足够。

点击 **Next** → **Create user**。

### 3.4 创建 Access Key

1. 在刚创建的用户详情页，点击 **"Security credentials"** 标签
2. 滚动到 **"Access keys"** 区域
3. 点击 **"Create access key"**
4. 选择 **"Application running outside AWS"**（本地开发用）
5. 勾选确认框，点击 **"Create access key"**

### 3.5 保存密钥 ⚠️

你将看到：

```
Access Key ID:     AKIAXXXXXXXXXXXXXXXX
Secret Access Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> ⚠️ **Secret Access Key 只显示一次！** 立即复制到安全的地方。
> 丢失后只能删除重建。

---

## 4. 申请 AWS 信用额（Google Forms 填表）

### 4.1 访问申请表单

信用额申请表地址（需要翻墙访问）：

```
https://forms.gle/ozhbhvaXAxHxu3kMA
```

> ⚠️ **这是唯一需要翻墙的步骤。** Google Forms 在中国大陆无法直接访问。
> 完成这一步后，后续所有操作都在墙内。

### 4.2 表单内容（预估）

根据 H0 规则页面描述，表单会要求填写：

| 字段 | 填写建议 |
|------|----------|
| **Your Name** | 英文全名 |
| **Email** | 注册 AWS 时使用的邮箱 |
| **Devpost Username** | 你的 Devpost 用户名 |
| **AWS Account ID** | 在 AWS Console 右上角 → 点击用户名 → 可以看到 12 位数字 Account ID |
| **Hackathon** | "H0: Hack the Zero Stack" |
| **What will you build?** | 简要描述项目（见下方模板） |

### 4.3 项目描述模板

复制以下内容填入"项目描述"栏：

```
ChemSpectra Agent — AI-Powered FTIR Spectral Analysis for Materials QC.

A full-stack B2B SaaS application that automates FTIR spectral analysis
for polymer manufacturers, pharmaceutical QC labs, and materials testing
facilities.

Tech Stack:
- Frontend: Vercel with v0 (Next.js/React)
- Backend: FastAPI (Python) with multi-round AI reasoning via Qwen
- Database: DynamoDB for session persistence and analysis history
- AI Engine: ReAct agent loop with self-verification and cross-validation
- Domain API: FTIR.fun spectral library (130,000+ reference spectra, 28+ file formats)

The application reduces manual spectral analysis from 30-60 minutes
to under 2 minutes per sample, with verifiable confidence traces
and human-in-the-loop confirmation.
```

### 4.4 信用额详情

| 项目 | 金额 |
|------|------|
| AWS 信用额 | $100（用 DynamoDB 绰绰有余） |
| Vercel v0 信用额 | $30 |
| 信用额有效期 | AWS: 2026-12-31；v0: 需在 2026-07-13 前兑换 |
| 截止申请 | **2026 年 6 月 26 日中午 12:00 PT**（太平洋时间） |

> ⚠️ **申请截止时间早于比赛截止！** 务必在 6 月 26 日前提交申请。

### 4.5 时间换算

| 时区 | 申请截止时间 |
|------|-------------|
| 太平洋时间 (PT) | 6/26 12:00 PM |
| 北京时间 (CST) | **6/27 凌晨 3:00 AM** |
| 建议提交时间 | **6/25 之前**（留出处理时间） |

---

## 5. 本地环境配置

### 5.1 安装依赖

```bash
cd /home/bob/projects/h0-aws-hackathon
pip install -r requirements.txt
```

### 5.2 设置环境变量

创建 `.env` 文件（或直接 export）：

```bash
# ── AWS (H0 hackathon requirement) ──
export AWS_REGION="us-east-1"
export AWS_ACCESS_KEY_ID="AKIAXXXXXXXXXXXXXXXX"
export AWS_SECRET_ACCESS_KEY="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export DYNAMODB_TABLE="chemspectra-sessions"

# ── Qwen API (Alibaba Cloud) ──
export DASHSCOPE_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export QWEN_MODEL="qwen3.7-max"

# ── FTIR.fun API (local or remote) ──
export FTIRFUN_API_KEY="your-ftirfun-api-key"
export FTIRFUN_API_URL="http://127.0.0.1:18080"

# ── Server ──
export PORT="8080"
```

### 5.3 启动服务

```bash
python server.py
# 输出: Uvicorn running on http://0.0.0.0:8080
```

### 5.4 验证服务

```bash
# 健康检查
curl http://localhost:8080/health
# 预期: {"status":"ok","dynamodb":"connected","region":"us-east-1"}

# API 文档
curl http://localhost:8080/
# 返回所有端点列表
```

---

## 6. 测试 DynamoDB 连接

创建一个快速测试脚本：

```python
# test_dynamodb.py
import os
import boto3

dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("AWS_REGION", "us-east-1"))
table = dynamodb.Table("chemspectra-sessions")

# 写入测试
import uuid, json
from datetime import datetime, timezone

test_id = uuid.uuid4().hex[:12]
table.put_item(Item={
    "session_id": test_id,
    "step": "test",
    "user_input": "test entry",
    "created_at": datetime.now(timezone.utc).isoformat(),
    "ttl": int(datetime.now(timezone.utc).timestamp()) + 86400,
})

# 读取测试
resp = table.get_item(Key={"session_id": test_id})
print(f"✅ DynamoDB 读写成功: {resp['Item']['session_id']}")
```

运行：

```bash
python test_dynamodb.py
# 预期: ✅ DynamoDB 读写成功: abc123def456
```

---

## 7. 常见问题

### Q: AWS 注册时信用卡验证失败？

- 确认卡号、有效期、CVV 正确
- 确认卡片已开通国际支付（部分国内信用卡默认关闭）
- 尝试使用 Visa/Mastercard。银联卡不被接受
- 香港/海外虚拟卡（如拍住赏 Tap & Go）也可使用

### Q: DynamoDB 按量付费会不会很贵？

对黑客松场景：每天几百次 API 调用，DynamoDB 费用几乎为零（$0.00-$0.01/天）。H0 提供的 $100 AWS 信用额完全够用。注意：即使超出信用额，DynamoDB 的按需定价也非常便宜（每 100 万次读取约 $0.25）。

### Q: Google Forms 打不开？

需要翻墙访问。可以尝试：
1. 使用 VPN/代理
2. 请海外朋友代填（需要你的 AWS Account ID 和 Devpost 用户名）
3. 如果实在无法翻墙，查看 H0 Devpost 页面是否有备选联系方式（如邮件申请）

### Q: 我已有 AWS 账号，还能申请信用额吗？

可以。规则中没有要求必须新注册。已有账号直接填表即可。

### Q: 担心超出 $100 信用额？

1. 在 AWS Console → Billing → Budgets 设置费用告警（阈值 $10）
2. 代码中的 DynamoDB TTL 已设置 30 天自动过期，防止数据无限堆积
3. 黑客松结束后手动删除 DynamoDB 表（如果不再需要）

### Q: 我没有 AWS 中国区账号，需要注册中国区吗？

不需要。H0 黑客松使用全球 AWS（aws.amazon.com），不是中国区（amazonaws.cn）。注册全球版即可。

---

## 附录：时间节点总览

| 节点 | 截止时间 (PT) | 北京时间 | 操作 |
|------|:-----------:|:------:|------|
| 注册 Devpost | 6/29 5:00 PM | 6/30 8:00 AM | 加入 Hackathon |
| **申请 AWS 信用额** | **6/26 12:00 PM** | **6/27 3:00 AM** | 填 Google Forms |
| 比赛提交 | 6/29 5:00 PM | 6/30 8:00 AM | Devpost 提交 |
| 评审 | 6/30 - 7/24 | — | 等待结果 |
| 公布获奖 | 7/31 2:00 PM | 8/1 5:00 AM | 看邮件 |
