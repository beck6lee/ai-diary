---
编号：RFC-009
日期：2026-03-27
类型：修改
状态：已实施
影响模块：today
提出人：产品负责人
---

# RFC-009 日记整理改为增量模式

## 背景

原有逻辑：每次提交新记录时，将当天全部原始记录发给 AI，要求完整重写日记。随着当天记录增多，每次整理时间变长，且 AI 可能改写已经整理好的早期内容（内容漂移）。

## 变更前

- 每次点击发送，将 `rawAccumulated`（全量原始记录）发给 AI
- AI 从零开始生成完整日记
- 整理时间随记录数线性增长
- 已有内容可能被 AI 改写

## 变更后

- 首次提交（无已有日记）：行为不变，AI 从原始记录生成完整日记
- 后续提交（已有日记）：只将**新增的一条原始记录** + **已有日记**发给 AI，AI 将新内容插入合适章节，不修改已有内容
- 「重新整理」按钮：保留全量重写能力，用于修复整体结构

## 技术实现

**`deepseek.js`**：
- 新增 `SYSTEM_PROMPT_UPDATE`：指示 AI 将新记录插入已有日记，严禁改动已有内容
- `streamDiary(rawContent, apiKey, callbacks, existingDiary?)` 新增第四参数；`existingDiary` 非空时使用增量 prompt，消息格式为 `【已有日记】\n...\n\n【新增记录】\n...`

**`TodayView.vue`**：
- `runStream(rawToSend, prevRaw, existingDiary?)` 新增第三参数，透传给 `streamDiary`
- `handleFormat`：提取 `newRawEntry`（仅本次新增内容），调用 `runStream(newRawEntry, prevRaw, formattedContent.value || null)`
- `handleReformat`：调用 `runStream(rawAccumulated.value, rawAccumulated.value)`，不传 `existingDiary`，保持全量重写

## 预期收益

- 第二条及以后的记录整理速度显著提升（Token 消耗更少）
- 已整理内容不再被意外改写
- 与 RFC-008 后端增量 Agent 的思路保持一致，未来迁移到后端时逻辑可复用
