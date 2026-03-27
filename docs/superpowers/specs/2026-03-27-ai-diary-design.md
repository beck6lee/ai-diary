# AI 日记 App · 设计文档

**日期：** 2026-03-27
**阶段：** MVP（移动端网页版）

---

## 概述

一款面向普通用户的 AI 日记移动端 Web App（MVP）。用户输入口语化文字，AI 整理成结构化日记并保存到 localStorage。目标是降低记日记的门槛，让记录变成一件顺手的事。

---

## 技术栈

| 项目 | 选型 |
|------|------|
| 框架 | Vite + Vue 3（Composition API） |
| 路由 | 无 Vue Router，用组件状态（`currentTab` ref）控制 Tab 切换 |
| 样式 | 手写移动端 CSS，无 UI 框架 |
| AI | DeepSeek API（`deepseek-chat` 模型，流式输出） |
| 存储 | localStorage |
| 部署 | GitHub Pages |

> **已知约束：** API Key 由用户自行填写并保管，明文存储于 localStorage，风险自担。该项目为个人工具，不涉及服务端代理。

---

## 核心流程

```
用户输入（文字 / 输入法语音）
    ↓
点击「AI 整理」
    ↓
校验 API Key 是否已填写（未填写 → 提示跳转设置页）
    ↓
调用 DeepSeek API（流式输出，边返回边渲染）
    ↓
[异常] 请求失败 / 超时 / 流中断 → 显示错误提示，恢复按钮可点击状态
    ↓
展示格式化日记，用户可二次编辑
    ↓
点击「保存」→ 写入 localStorage，同步更新日期索引
```

---

## 页面结构

三个页面，底部 Tab 切换（`App.vue` 用 `currentTab` ref 控制显示哪个 view）。

### 今日页（默认）

今日页存在四种状态，组件初始化时按优先级判断：

1. **已保存**：今天已有日记 → 直接展示保存的内容，提供「重新整理」入口
   - 点击「重新整理」→ 回到状态 3，输入框中预填已保存的 `raw` 内容供修改
2. **已整理未保存**：展示 AI 结果区，等待用户保存
3. **输入中**：展示输入框，等待用户点击整理
4. **空白**：新的一天，展示空输入框

其他元素：
- 顶部显示今天日期
- 文本框：输入原始内容（口语化）
- 「AI 整理」按钮：流式调用 DeepSeek
- 结果区：流式逐字渲染，完成后可编辑
- 「保存」按钮：存入 localStorage

### 历史页

- 从 `diary_index` 读取日期列表，按倒序排列
- 点击某天展开查看全文

### 设置页

- DeepSeek API Key 输入框（保存到 localStorage）
- 清除所有数据按钮

---

## 数据结构

```js
// key: "diary_2026-03-27"（每天一条）
{
  date: "2026-03-27",
  raw: "今天开了个会，下午搞了个bug，晚上吃了火锅",
  formatted: "## 今日工作\n\n- 上午开会...",
  updatedAt: 1743040800000
}

// key: "diary_index"（日期列表，用于历史页，每次保存时同步更新）
// 由 storage.js 维护：写入前检查是否已存在（去重），始终保持倒序（新日期在前）
["2026-03-27", "2026-03-26", "2026-03-25"]

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
- 如果输入内容过少，如实记录，不要发挥补充
- 只输出日记正文，不要输出任何解释性文字、前缀或道歉
```

---

## 组件结构

```
src/
  views/
    TodayView.vue      # 今日页，管理四种状态与流式请求状态
    HistoryView.vue    # 历史页
    SettingsView.vue   # 设置页
  components/
    DiaryEditor.vue    # 输入框 + 「AI 整理」按钮
    DiaryResult.vue    # 结果展示 + 编辑 + 「保存」按钮
    NavBar.vue         # 底部导航
  utils/
    storage.js         # localStorage 读写封装（含 diary_index 维护）
    deepseek.js        # DeepSeek 流式 API 调用，暴露 streamDiary(content, onChunk, onDone, onError)
  App.vue              # currentTab 状态控制页面切换
  main.js
```

`deepseek.js` 暴露接口：
```js
streamDiary(content, { onChunk, onDone, onError })
// onChunk(text)   每收到一段流式内容时回调
// onDone()        流结束时回调
// onError(err)    请求失败 / 超时 / 流中断时回调
```

---

## 异常处理

| 场景 | 处理方式 |
|------|----------|
| API Key 未填写 | 点击「AI 整理」时提示"请先在设置页填写 API Key"，不发起请求 |
| 请求失败（网络 / 401 / 500） | 显示错误提示，恢复按钮可点击，结果区清空 |
| 流式中断 | 同上，不保留不完整内容 |
| 输入为空 | 按钮禁用，不允许发起请求 |

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
