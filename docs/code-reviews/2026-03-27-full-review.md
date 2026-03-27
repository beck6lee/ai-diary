# Code Review — 2026-03-27

**范围**：全量 review，涵盖所有前端源文件
**触发原因**：阶段性功能完成（增量日记整理、增量 Todo 更新）后的主动质量检查
**结果**：发现 15 项问题，当日全部修复，无遗留

---

## 审查文件清单

| 文件 | 说明 |
|------|------|
| `src/views/TodayView.vue` | 主页面，核心交互逻辑 |
| `src/views/HistoryView.vue` | 历史日记列表 |
| `src/views/SettingsView.vue` | API Key 设置 |
| `src/utils/deepseek.js` | DeepSeek API 调用封装 |
| `src/utils/storage.js` | localStorage 读写封装 |
| `src/styles/main.css` | 全局样式 |
| `src/App.vue` | 根组件，Tab 导航 |

---

## 问题清单

### P0 — Bug / 逻辑错误（必须修）

#### P0-1 `updateTodos` 传参错误
- **位置**：`TodayView.vue` — `handleFormat`
- **问题**：只把 `newRawEntry`（单条记录）传给 `updateTodos`，AI 缺少今天全部记录的上下文，无法准确判断哪些 todo 已完成
- **修复**：改传 `rawAccumulated.value`（全量原始记录）

#### P0-2 `handleToggleTodo` 追加位置不稳固
- **位置**：`TodayView.vue` — `handleToggleTodo`
- **问题**：用 `includes(SECTION)` 检测 section 是否存在，但追加是 `trimEnd() + \nline`，即追加到整个文档末尾。若 AI 生成日记中 `## ✅ 已完成` 不在末尾（用户手动编辑等场景），完成条目会挂错位置
- **修复**：改用 `lastIndexOf(DONE_SECTION)` 定位 section，再用正则检测其后是否还有 `##` 标题，决定在 section 内部追加还是追加到末尾

#### P0-3 `onDone` 没有传 `todos`
- **位置**：`TodayView.vue` — `runStream` → `onDone`
- **问题**：`saveDiary` 未传 `todos`，依赖 `storage.js` 隐式读 `existing.todos`，逻辑上能工作但不稳固，与内存状态存在短暂不一致风险
- **修复**：`onDone` 里显式传 `todos: todos.value`

#### P0-4 `response.body` 缺少 null guard
- **位置**：`deepseek.js` — `streamDiary`
- **问题**：`response.body.getReader()` 在 `response.body` 为 null 时直接抛出，错误信息不友好
- **修复**：在 `if (!response.ok)` 后加 `if (!response.body) throw new Error('响应体为空')`

---

### P1 — 用户体验问题（建议修）

#### P1-5 缺少防重入保护
- **位置**：`TodayView.vue` — `handleFormat`
- **问题**：快速连点发送按钮，`state` 还未变为 `'formatting'` 时第二次点击可以进入，导致 `rawAccumulated` 被追加两次相同内容
- **修复**：`handleFormat` 首行加 `if (state.value !== 'idle') return`

#### P1-6 出错后用户输入丢失
- **位置**：`TodayView.vue` — `handleFormat` / `runStream`
- **问题**：`newInput` 在 `handleFormat` 里清空，`onError` 回滚了 `rawAccumulated` 但没有恢复 `newInput`，用户需要重新输入
- **修复**：保存 `inputText`，通过 `prevInput` 参数传入 `runStream`，在 `onError` 里恢复 `newInput.value = prevInput`

#### P1-7 API Key 切页可能丢失
- **位置**：`SettingsView.vue`
- **问题**：只有 `@blur` 触发保存，移动端直接点导航栏切页时 blur 不稳定，Key 可能未保存
- **修复**：同时监听 `@change`

#### P1-8 手动编辑保存后 todos 不同步
- **位置**：`TodayView.vue` — `handleSaveEdit`
- **问题**：用户手动编辑日记内容后，todos 未跟随更新
- **修复**：`handleSaveEdit` 末尾调用 `updateTodos(rawAccumulated.value)`（静默模式）

#### P1-9 `## ✅ 已完成` 硬编码散落
- **位置**：`TodayView.vue`
- **问题**：section 标题字符串多处引用，AI 生成或用户编辑有差异时会重复建 section
- **修复**：提取为模块顶层常量 `const DONE_SECTION = '## ✅ 已完成'`

#### P1-10 `HistoryView` 重复读取 index
- **位置**：`HistoryView.vue`
- **问题**：`ref(getDiaryIndex())` 在 setup 阶段已读取，`onMounted` 里重复赋值无意义；且组件每次切换都销毁重建，`onMounted` 永远能拿到最新数据，但加 KeepAlive 后需要改用 `onActivated`
- **修复**：删除 `onMounted`，改用 `onActivated` 以支持 KeepAlive

---

### P2 — 代码质量 / 可维护性

#### P2-11 `extractTodos` 是死代码
- **位置**：`deepseek.js`
- **问题**：全面改为 `extractTodosIncremental` 后，`extractTodos` 不再被 import，属于冗余代码
- **修复**：删除该函数

#### P2-12 API URL 和 model 名称重复三处
- **位置**：`deepseek.js`
- **问题**：`'https://api.deepseek.com/chat/completions'` 和 `'deepseek-chat'` 各出现三次
- **修复**：提取为顶层常量 `const API_URL` / `const MODEL`

#### P2-13 时间格式化逻辑重复
- **位置**：`TodayView.vue`
- **问题**：`String(now.getHours()).padStart(2,'0') + ':' + ...` 在 `updateTodos` 和 `handleToggleTodo` 中各写一遍
- **修复**：提取为 `formatHHMM(date)` 函数，同时 `handleFormat` 里的时间戳也统一使用

#### P2-14 `<KeepAlive>` 缺失
- **位置**：`App.vue`
- **问题**：`<component :is>` 每次切换都销毁重建组件，`newInput`、`showRaw` 等本地状态切回 today 后丢失
- **修复**：用 `<KeepAlive>` 包裹，配合 HistoryView 的 `onActivated` 使用

#### P2-15 `body { overflow: hidden }` 无注释
- **位置**：`main.css`
- **问题**：意图不明，后续维护者可能误删
- **修复**：加注释说明是「防移动端双滚动条和 rubber-band 滚动」

---

## 修复 Commits

| Commit | 说明 |
|--------|------|
| `cff6d55` | fix: 全面修复 review 问题（P0/P1/P2 共15项） |

---

## 总体评价

整体代码结构清晰，组件职责单一，CSS 设计系统（token 变量）和 BEM 命名一致性好，流式处理动画逻辑优雅。主要风险集中在两点：`handleFormat` 的错误恢复路径不完整（用户输入丢失）和 `updateTodos` 传参错误（仅传新增条目而非全量 raw），这两个 P0 问题在真实使用中容易触发。技术债最快可清理的是 `extractTodos` 死代码和重复时间格式化逻辑。

---

*Review 执行人：Claude Code (claude-sonnet-4-6)*
*修复执行人：Claude Code (claude-sonnet-4-6)*
