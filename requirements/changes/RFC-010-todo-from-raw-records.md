---
编号：RFC-010
日期：2026-03-27
类型：修复
状态：已实施
影响模块：today
提出人：产品负责人
---

# RFC-010 Todo 生成改为基于原始记录

## 背景

原有实现将 `formattedContent`（AI 整理后的日记）发给 AI 来提取待办事项。问题：整理过程中 AI 会将"已完成"的事项以正常记录形式写入日记，导致这些已完成事项被错误地提取为待办。

## 变更前

```js
const texts = await extractTodos(formattedContent.value, apiKey)
```

- 数据源：整理后的日记（`formattedContent`）
- 问题：AI 整理时可能将"我已经完成了 X"写成"(14:30) 完成了 X"，格式上看不出已完成，仍会被提取为 todo

## 变更后

```js
const texts = await extractTodos(rawAccumulated.value, apiKey)
```

- 数据源：原始记录（`rawAccumulated`）
- 原始记录保留用户的原始表述（如"已经做了"、"完成了"），信息更完整
- `extractTodos` 系统提示更新：明确告知 AI 过滤掉用户已说明完成的事项

## 更新后的系统提示

> 以下是用户今天的原始记录（口语化、碎片化，每条以【HH:MM】开头）。从中提取今天还需要行动的待办事项——如果用户在记录中明确说已经完成、已经做了，则不要提取。每行一条，只输出待办事项文字，不要编号、不要前缀符号、不要任何解释。如果没有明显的待办事项，返回空字符串。
