# 需求变更总日志

> 按时间倒序，最新在前。每次变更后在此文件顶部追加记录。

---

## 变更记录

### [RFC-010] Todo 生成改为基于原始记录
- 日期：2026-03-27
- 类型：修复
- 影响模块：today
- 摘要：extractTodos 数据源从整理后日记改为原始记录，避免已完成事项被误判为待办；更新提示词明确过滤已完成内容
- 详细记录：[RFC-010](./changes/RFC-010-todo-from-raw-records.md)

### [RFC-009] 日记整理改为增量模式
- 日期：2026-03-27
- 类型：修改
- 影响模块：today
- 摘要：新增记录时只将本条内容+已有日记发给 AI，AI 增量插入合适章节而非完全重写；「重新整理」保留全量重写能力
- 详细记录：[RFC-009](./changes/RFC-009-incremental-diary-update.md)

### [RFC-008] 后台日记 Agent（待规划）
- 日期：2026-03-27
- 类型：新增
- 影响模块：后端（新建）、today
- 摘要：用后台 Agent 替代当前"全量重写"模式，每次只处理新增记录并增量更新日记，解决速度慢、内容漂移问题
- 详细记录：[RFC-008](./changes/RFC-008-diary-agent-backend.md)

### [RFC-007] 支持手动编辑日记与查看原始记录
- 日期：2026-03-27
- 类型：新增
- 影响模块：today
- 摘要：新增"编辑"入口，支持直接修改已整理内容；新增"重新整理"按钮；新增可折叠的原始记录展示区
- 详细记录：[RFC-007](./changes/RFC-007-edit-and-raw-records.md)

### [RFC-006] 每条记录自动添加时间戳
- 日期：2026-03-27
- 类型：新增
- 影响模块：today
- 摘要：提交记录时自动打上 【HH:MM】 时间标记，AI 识别用户文本中的时间描述并在整理结果中标注 (HH:MM)
- 详细记录：[RFC-006](./changes/RFC-006-timestamps.md)

### [RFC-005] 日记内容支持 Markdown 渲染
- 日期：2026-03-27
- 类型：新增
- 影响模块：today、history
- 摘要：引入 marked 库，今日页和历史页的日记内容从纯文本 `<pre>` 改为渲染 Markdown HTML
- 详细记录：[RFC-005](./changes/RFC-005-markdown-rendering.md)

### [RFC-004] 今日页改为多次追加模式
- 日期：2026-03-27
- 类型：修改
- 影响模块：today
- 摘要：输入框常驻底部，每次新增内容追加到当天 raw 并触发 AI 重新整理，自动保存，无需手动点保存
- 详细记录：[RFC-004](./changes/RFC-004-append-mode.md)

### [RFC-003] UI 重设计——输入栏移至底部
- 日期：2026-03-27
- 类型：修改
- 影响模块：today、history、settings
- 摘要：输入栏固定在屏幕底部拇指区；整体视觉使用暖色调+卡片阴影；整理时内容变暗后流式替换而非消失
- 详细记录：[RFC-003](./changes/RFC-003-ui-redesign.md)

### [RFC-002] 项目上线 GitHub Pages
- 日期：2026-03-27
- 类型：新增
- 影响模块：基础设施
- 摘要：配置 GitHub Actions 自动构建，推送 main 分支后自动部署到 GitHub Pages
- 详细记录：[RFC-002](./changes/RFC-002-github-pages.md)

### [RFC-001] 项目初始需求确立
- 日期：2026-03-27
- 类型：新增
- 影响模块：全部
- 摘要：确立 AI 日记 MVP 的产品形态、技术选型与核心功能模块
- 详细记录：[RFC-001](./changes/RFC-001-initial-requirements.md)

<!-- 新的变更记录添加在此行上方 -->
