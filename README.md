# AI 日记

一款移动端 Web App，让记日记变成一件顺手的事。随口说几句，AI 自动整理成结构化日记。

**在线体验 →** https://beck6lee.github.io/ai-diary/

---

## 功能

- **多次追加**：一天内随时补充记录，所有内容自动合并到同一篇日记
- **AI 整理**：口语化输入，AI 整理成带标题、列表、复盘的 Markdown 日记
- **流式输出**：整理结果逐字出现，不需要等待
- **时间戳**：每条记录自动打上提交时间；如果你说"下午3点开了个会"，AI 会识别并标注
- **可编辑**：对整理结果不满意，可以手动修改，也可以重新让 AI 整理
- **原始记录**：随时查看自己的原始输入，确认 AI 没有遗漏
- **历史日记**：按日期浏览所有过去的日记，Markdown 渲染展示
- **数据本地化**：所有数据存储在浏览器 localStorage，不上传任何服务器

---

## 快速开始

需要一个 [DeepSeek API Key](https://platform.deepseek.com/)（注册后免费领取额度）。

1. 打开 https://beck6lee.github.io/ai-diary/
2. 点击底部「设置」Tab
3. 填写你的 DeepSeek API Key，失去焦点后自动保存
4. 切换到「今日」Tab，开始记录

---

## 本地开发

```bash
# 克隆项目
git clone https://github.com/beck6lee/ai-diary.git
cd ai-diary

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 运行测试
npm test

# 构建生产版本
npm run build
```

---

## 技术栈

| 项目 | 选型 |
|------|------|
| 框架 | Vite 5 + Vue 3（Composition API） |
| AI | DeepSeek API（`deepseek-chat`，SSE 流式输出） |
| Markdown | marked |
| 存储 | localStorage |
| 测试 | Vitest + jsdom |
| 部署 | GitHub Pages（push to main 自动触发） |

路由用 `currentTab` ref 控制 Tab 切换，没有引入 Vue Router。

---

## 项目结构

```
src/
├── views/
│   ├── TodayView.vue      # 今日页（多次追加、流式整理、编辑模式）
│   ├── HistoryView.vue    # 历史页（日期列表、折叠展开）
│   └── SettingsView.vue   # 设置页（API Key、清除数据）
├── components/
│   └── NavBar.vue         # 底部导航
├── utils/
│   ├── storage.js         # localStorage 读写封装
│   └── deepseek.js        # DeepSeek 流式 API 调用
├── styles/
│   └── main.css
├── App.vue
└── main.js
```

---

## 数据说明

所有数据保存在浏览器 localStorage，**清除浏览器缓存会导致数据丢失**。

```
diary_YYYY-MM-DD   每天一篇日记（raw 原始输入 + formatted AI 整理结果）
diary_index        日期列表，倒序排列
settings           API Key
```

API Key 明文存储于 localStorage，请勿在公共设备上使用。

---

## 需求文档

产品设计文档、变更记录和路线图见 [`requirements/`](./requirements/)。
