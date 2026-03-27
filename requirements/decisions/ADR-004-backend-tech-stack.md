---
编号：ADR-004
日期：2026-03-27
状态：已采纳
决策：后端技术栈选择 Node.js + Hono + PostgreSQL + Railway
---

# ADR-004 后端技术栈选型

## 背景

上架华为应用市场前需要建设后端服务，承接：日记 Agent、用户账号、云存储、API Key 统一管理。需要在 Node.js 和 Python 之间做选择。

## 备选方案

### 方案 A：Node.js + Hono + Prisma（已选择）

**优点：**
- 与前端同语言，无上下文切换，前后端可共享类型定义
- Hono 天然支持 SSE 流式输出，与现有前端流式方案无缝对接
- Prisma ORM 类型安全，迁移管理方便
- Railway 一键部署 + 托管 PostgreSQL，适合初期

**缺点：**
- AI Agent 生态不如 Python 丰富（LangChain、LlamaIndex 等主要是 Python）

### 方案 B：Python + FastAPI（已放弃）

**优点：**
- AI/ML 生态最丰富（LangChain、OpenAI SDK、向量数据库集成等）
- FastAPI 同样支持 SSE 流式

**缺点：**
- 需要切换语言，增加认知负担
- 日记 Agent 逻辑目前不复杂，不需要 LangChain 级别的框架
- 部署配置相对繁琐

## 最终决策及理由

**选择方案 A（Node.js）**。

日记 Agent 的核心逻辑是：接收新记录 + 当前日记状态 → 增量更新日记。这个逻辑用 Node.js 手写完全够用，不依赖复杂的 Agent 框架。选择 Python 的最大理由（AI 框架生态）在当前阶段不成立。

## 回顾时机

- 如果后续需要接入向量数据库做语义搜索，或需要复杂的 Multi-Agent 编排，重新评估是否迁移到 Python
