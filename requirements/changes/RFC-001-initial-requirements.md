---
编号：RFC-001
日期：2026-03-27
类型：新增
状态：已实施
影响模块：全部
提出人：产品负责人
---

# RFC-001 项目初始需求确立

## 背景

用户（产品负责人本人）长期使用 AI + Obsidian 记日记，体验良好，但这套流程对普通用户门槛极高，无法复制。

市场观察（来自小红书评论区）显示，用户在寻找能降低记日记门槛的工具：
- 很多人想记日记但写不下去——不知道写什么、嫌麻烦、格式丑
- 语音 + AI 整理的组合能大幅降低这个门槛

因此决定将个人工作流产品化，先做 MVP 验证核心假设：**AI 整理能否真正降低记日记的门槛**。

## 变更内容

### 变更前

无，项目从零开始。

### 变更后

一款移动端 Web App（H5），核心流程：用户口语化输入 → AI 整理成结构化日记 → 保存到本地。

## 产品决策

| 决策 | 选择 | 理由 |
|------|------|------|
| 平台形态 | 移动端 H5，非原生 App | 验证阶段快速上线，成本低 |
| 存储方案 | localStorage，无服务端 | 个人工具，免去后端成本与账号体系 |
| AI 服务 | DeepSeek（用户自持 Key） | 无需代理，部署简单，成本由用户承担 |
| 前端框架 | Vite + Vue 3 | 比纯 HTML 开发效率高，比 Next.js 更轻 |
| 路由方案 | 无 Vue Router，currentTab ref | 三个 Tab 结构简单，不需要完整路由 |
| 语音输入 | 暂缓 | 主流输入法自带语音转文字，可代替 |
| 目标管理 | 暂缓 | 功能复杂，优先聚焦记录本身 |

## 初始功能范围

### MVP 包含

| 功能 | 优先级 | 状态 |
|------|--------|------|
| 文字输入 + AI 整理 + 保存 | P0 | ✅ |
| 历史日记查看 | P1 | ✅ |
| API Key 设置 | P0 | ✅ |
| 清除所有数据 | P2 | ✅ |
| GitHub Pages 部署 | P1 | ✅ |

### MVP 不包含

- 语音输入
- 目标管理 / 偏离提醒
- 用户账号 / 云同步
- 原生 App

## 核心数据模型

```js
// 每天一条日记
// key: "diary_2026-03-27"
{
  date: "2026-03-27",
  raw: "今天开了个会，下午搞了个bug，晚上吃了火锅",
  formatted: "## 今日工作\n\n- 上午开会...",
  updatedAt: 1743040800000
}

// 日期索引，倒序排列
// key: "diary_index"
["2026-03-27", "2026-03-26"]

// 设置
// key: "settings"
{ apiKey: "sk-xxxxxxxx" }
```

## 技术选型

| 项目 | 选型 | 版本 |
|------|------|------|
| 框架 | Vite + Vue 3 (Composition API) | Vite ^5, Vue ^3.4 |
| 测试 | Vitest + @vue/test-utils | Vitest ^1 |
| AI | DeepSeek API（SSE 流式） | deepseek-chat 模型 |
| 存储 | localStorage | 浏览器原生 |
| 部署 | GitHub Pages + Actions | peaceiris/actions-gh-pages@v3 |

## 已实施内容

- [x] Vite + Vue 3 项目初始化
- [x] storage.js（localStorage 读写 + diary_index 维护）
- [x] deepseek.js（SSE 流式请求，onChunk / onDone / onError）
- [x] TodayView（四种状态，流式 AI 整理）
- [x] HistoryView（日期列表，折叠展开）
- [x] SettingsView（API Key，清除数据）
- [x] NavBar（底部 Tab 导航）
- [x] GitHub Actions 自动部署
- [x] 17 个单元测试（storage + deepseek）

## 未解决问题

- API Key 明文存储 localStorage，有泄漏风险（个人工具，已知风险，用户自担）
- 所有数据仅存本地，换设备/清缓存后全部丢失
