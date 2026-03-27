# AI 日记 App · 设计文档

**日期：** 2026-03-27
**阶段：** MVP（移动端网页版）

---

## 概述

一款面向普通用户的 AI 日记 Web App。用户用口语化文字输入今天发生的事情，AI 自动整理成结构化日记并保存。目标是降低记日记的门槛，让记录变成一件顺手的事。

---

## 技术栈

| 项目 | 选型 |
|------|------|
| 框架 | Vite + Vue 3（Composition API） |
| 样式 | 手写移动端 CSS，无 UI 框架 |
| AI | DeepSeek API（`deepseek-chat` 模型） |
| 存储 | localStorage |
| 部署 | GitHub Pages |

---

## 核心流程

```
用户输入（文字 / 输入法语音）
    ↓
点击「AI 整理」
    ↓
调用 DeepSeek API（流式输出）
    ↓
展示格式化日记，用户可二次编辑
    ↓
点击「保存」→ 写入 localStorage
```

---

## 页面结构

三个页面，底部 Tab 切换。

### 今日页（默认）

- 顶部显示今天日期
- 文本框：输入原始内容（口语化，想到什么写什么）
- 「AI 整理」按钮：调用 DeepSeek，流式输出整理结果
- 结果区：展示格式化后的日记，可直接编辑
- 「保存」按钮：存入 localStorage

### 历史页

- 按日期倒序列出所有已保存日记
- 点击某天展开查看全文

### 设置页

- DeepSeek API Key 输入框（保存到 localStorage）
- 清除所有数据按钮

---

## 数据结构

```js
// key: "diary_2026-03-27"
{
  date: "2026-03-27",
  raw: "今天开了个会，下午搞了个bug，晚上吃了火锅",
  formatted: "## 今日工作\n\n- 上午开会...",
  updatedAt: 1743040800000
}

// key: "settings"
{
  apiKey: "sk-xxxxxxxx"
}
```

---

## AI Prompt 设计

**System Prompt：**

```
你是一个日记整理助手。用户会输入今天发生的事情（口语化、碎片化），
你需要将其整理成结构化的日记，使用以下 Markdown 格式：

## 今日工作
- （工作/学习相关内容）

## 想法 / 灵感
（有想法则写，没有则省略此节）

## 知识碎片
- （学到的东西，没有则省略）

## 复盘
### 做到了什么
### 哪里卡住了

要求：
- 保持用户原意，不要过度加工
- 口语内容转为简洁书面语
- 没有提到的章节直接省略，不要补充空内容
```

---

## 组件结构

```
src/
  views/
    TodayView.vue      # 今日页
    HistoryView.vue    # 历史页
    SettingsView.vue   # 设置页
  components/
    DiaryEditor.vue    # 输入 + 整理区
    DiaryResult.vue    # 结果展示 + 编辑
    NavBar.vue         # 底部导航
  utils/
    storage.js         # localStorage 读写封装
    deepseek.js        # DeepSeek API 调用（流式）
  App.vue
  main.js
```

---

## MVP 范围

**包含：**
- 文字输入 → AI 整理 → 保存
- 历史日记查看
- API Key 设置

**不包含（后续版本）：**
- 目标管理 / 偏离提醒
- 用户账号 / 云同步
- 原生 App
