# 需求变更库使用说明

这个目录是 **ai-diary** 项目的需求管理中心。所有功能需求、产品决策、变更历史都记录在这里。

---

## 目录结构

```
requirements/
├── README.md               # 本文件，使用说明
├── CHANGELOG.md            # 需求变更总日志（时间倒序）
├── ROADMAP.md              # 产品路线图（当前状态）
├── features/               # 各功能模块的最新需求文档
│   ├── today.md            # 今日记录页
│   ├── history.md          # 历史日记页
│   └── settings.md         # 设置页
├── changes/                # 每次变更的详细档案
│   ├── _template.md        # 新建变更时复制此模板
│   └── RFC-001-initial-requirements.md
└── decisions/              # 重大产品/技术决策记录（ADR）
    ├── ADR-001-mobile-web-first.md
    ├── ADR-002-local-storage-only.md
    └── ADR-003-tech-stack.md
```

---

## 如何记录一次需求变更

**第 1 步：新建变更档案**

复制 `changes/_template.md`，按顺序命名：
```
RFC-002-你的功能描述.md
RFC-003-另一个功能.md
```

**第 2 步：更新对应的功能文档**

在 `features/` 下找到相关模块，更新"当前需求"部分，并在文件底部的"版本历史"表中追加一行。

**第 3 步：在 CHANGELOG.md 顶部追加一条记录**

```markdown
### [RFC-002] 功能名称
- 日期：2026-XX-XX
- 类型：新增 / 修改 / 移除
- 影响模块：today
- 摘要：一句话描述这次变更做了什么
- 详细记录：[RFC-002](./changes/RFC-002-xxx.md)
```

---

## 变更类型说明

| 类型 | 说明 |
|------|------|
| 新增 | 添加了原本不存在的功能 |
| 修改 | 更改了已有功能的行为或界面 |
| 移除 | 删除了某个功能 |
| 暂缓 | 功能被推迟，不在当前版本实现 |
| 恢复 | 之前暂缓的功能重新启动 |

---

## 编号规则

- **RFC-NNN**：需求变更记录（Request For Change），三位数字，从 001 开始
- **ADR-NNN**：架构/产品决策记录（Architecture Decision Record），格式相同

---

## 快速导航

- [产品路线图](./ROADMAP.md)
- [变更日志](./CHANGELOG.md)
- [今日页需求](./features/today.md)
- [历史页需求](./features/history.md)
- [设置页需求](./features/settings.md)
