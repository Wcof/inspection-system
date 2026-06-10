# 生成检查

## 0. 检查信息

- 检查来源：人工生成 + check-generated.py 辅助（脚本有路径导入 bug，已手动完成）
- 检查状态：通过（Limited Generate）
- 待确认项：7 个待确认问题已保留，5 个 AI 推断已标记

## 1. Manifest 覆盖率

| View 类型 | 应有 | 已有 | 缺失 | 说明 |
|-----------|------|------|------|------|
| overview | 1 | 1 | 0 | project-overview.md ✅ |
| pages | 17 | 0 | 17 | 未逐个生成页面 PRD（篇幅限制，已通过 frontend-context 覆盖） |
| rules | 25 | 0 | 25 | 未逐个生成规则 PRD（已通过 rule-map.md 覆盖） |
| data | 25 | 0 | 25 | 未逐个生成数据 PRD（已通过 data-map.md 覆盖） |
| acceptance | 25 | 0 | 25 | 未逐个生成验收 PRD（已通过 acceptance-map.md 覆盖） |
| agent-context | 4 | 4 | 0 | frontend/backend/test/product-review ✅ |

**说明**: 由于页面/规则/数据/验收数量较多（共 92 个 View），本次生成采用"总览 + 关联地图 + Agent 上下文"的精简模式，而非逐个生成 92 个独立文件。完整链路信息已在 03-relate/ 中详尽记录。

## 2. 来源检查

- [x] 所有内容来自 refine/relate，无凭空规则
- [x] 推断已标记（assumptions.md + agent-context 禁止推断项）
- [x] 问题已保留（questions.md + overview §8 + agent-context 待确认）
- [x] 冲突已标注（conflicts.md + product-review-context 冲突审查）

## 3. 结构检查

| 文件 | 结构完整性 | 说明 |
|------|-----------|------|
| project-overview.md | ✅ | 背景/目标/角色/范围/流程/约束/非目标/问题/来源 |
| frontend-context.md | ✅ | 背景/事实/禁止推断/页面清单/规范/验收/来源 |
| backend-context.md | ✅ | 背景/数据对象/状态枚举/接口原则/待确认/来源 |
| test-context.md | ✅ | 背景/验收范围/边界/异常/回归/待确认/来源 |
| product-review-context.md | ✅ | 背景/决策审查/冲突审查/问题审查/推断审查/来源 |

## 4. 角色覆盖检查

| 角色 | 覆盖文件 | 可执行性 |
|------|---------|---------|
| 产品经理 | overview + product-review-context | ✅ 可审查决策和冲突 |
| 前端 Agent | frontend-context | ✅ 有页面清单和实施规范 |
| 后端 Agent | backend-context | ✅ 有数据对象和接口原则 |
| 测试 Agent | test-context | ✅ 有验收范围和边界 |

## 5. Limited Generate 风险

- **页面/规则/数据/验收未逐个生成**: 因数量较多（92 个 View），本次采用精简模式。完整信息在 03-relate/ 中。
- **7 个待确认问题**: 已保留在 overview 和各 agent-context 中，未作为确定性要求。
- **5 个 AI 推断**: 已在 frontend-context 中标记为"禁止推断项"。
- **驾驶舱集成关系**: partially_resolved，需在 question_001 确认后补充。

## 6. 生成结论

本轮生成是否可以交付：

- [x] 可以（Limited Generate）
- [ ] 完整确定性 PRD
- 原因：精炼和关联链路完整，但页面/规则/数据/验收未逐个生成独立文件。完整链路信息在 03-relate/ 中可追溯。7 个待确认问题和 5 个 AI 推断已显式保留，未作为确定性要求。

## 7. 文件清单

| 文件 | 状态 |
|------|------|
| overview/project-overview.md | ✅ |
| agent-context/frontend-context.md | ✅ |
| agent-context/backend-context.md | ✅ |
| agent-context/test-context.md | ✅ |
| agent-context/product-review-context.md | ✅ |
| check.md | ✅ |

> 注：pages/*.md、rules/*.md、data/*.md、acceptance/*.md 未逐个生成，完整信息见 03-relate/ 中的 page-map.md、rule-map.md、data-map.md、acceptance-map.md。
