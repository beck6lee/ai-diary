---
编号：ADR-003
日期：2026-03-27
状态：已采纳
决策：前端技术栈选择 Vite + Vue 3
---

# ADR-003 前端技术栈选择 Vite + Vue 3

## 背景

项目需要选择前端技术栈。候选方案为：纯 HTML/JS、Vite + Vue 3、Next.js。

## 备选方案

### 方案 A：纯 HTML + Vanilla JS（已放弃）

**优点：**
- 零依赖，最轻量
- 无构建步骤，直接写直接用

**缺点：**
- 状态管理麻烦（手动操作 DOM）
- 组件复用困难
- 代码量大，可维护性差
- 流式渲染 + 多状态切换的场景代码会很脏

### 方案 B：Vite + Vue 3（已选择）

**优点：**
- Composition API + `<script setup>` 写状态逻辑简洁
- 响应式系统天然适合流式输出（`formattedContent` 追加即更新 UI）
- 组件化方便拆分 TodayView / HistoryView / SettingsView
- Vite 构建快，开发体验好
- Vitest 与 Vite 生态一致，测试配置简单

**缺点：**
- 相比纯 HTML 多了构建步骤
- 需要配置 GitHub Actions 部署

### 方案 C：Next.js（已放弃）

**优点：**
- SSR / SSG 支持，SEO 友好

**缺点：**
- 日记 App 完全不需要 SSR（内容存 localStorage，SSR 无意义）
- 框架体积大，启动慢
- 对于三个 Tab 页的简单 SPA 来说是过度设计

## 最终决策及理由

**选择方案 B（Vite + Vue 3）**。

流式 AI 输出是核心交互，Vue 3 的响应式 ref 非常适合处理"逐字追加"的场景。Next.js 的 SSR 能力对于纯本地存储的日记 App 没有价值。纯 HTML 在多状态管理上维护成本太高。

**关键小决策**：Tab 切换使用 `currentTab` ref + `<component :is>` computed，不引入 Vue Router。三个页面结构简单，不需要路由的历史记录、动态参数等特性，引入反而增加复杂度。

## 影响与后续

- 依赖 Vite 生态，后续升级需关注 Vite 大版本变更
- 如果将来需要 SSR（SEO 或首屏优化），可以迁移到 Nuxt 3（Vue 的 Next.js 等价物），迁移成本相对较低

## 回顾时机

- 项目规模扩大，组件数量超过 20 个，需要更完善的路由和状态管理方案
