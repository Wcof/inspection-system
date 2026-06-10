# Agent Context：product-review-context

## 任务背景

产品复核视角：基于精炼（02-refine）和关联（03-relate）结果，审查巡检机器人管理系统的 PRD 完整性和一致性。

## 背景与目标

- **背景**: 单体后台拆分为管理端 + 实施平台双系统，需确保系统边界清晰、页面归属正确
- **目标**: 验证 PRD 是否覆盖全部业务场景，无遗漏、无冲突、无凭空规则

## 关键决策审查

| 决策 | 状态 | 审查意见 |
|------|------|---------|
| decision_001 双系统而非三端 | confirmed | ✅ 用户明确确认 |
| decision_002 路由前缀隔离 | confirmed | ✅ 技术合理 |
| decision_003 校准记录后台存储 | confirmed | ✅ 会议明确 |
| decision_004 检测项独立周期 | confirmed | ✅ 业务合理 |
| decision_005 启用状态控制显示 | confirmed | ✅ 用户多次确认 |
| decision_006 预警值/临界值移除 | confirmed | ✅ 用户明确要求 |
| decision_007 全局图片预览 | confirmed | ✅ 已实现 |

## 冲突点审查

| 冲突 | 状态 | 审查意见 |
|------|------|---------|
| conflict_001 实时平台 vs 双系统 | partially_resolved | ⚠️ 驾驶舱集成关系待确认 |
| conflict_002 检测项配置一致性 | resolved | ✅ 已统一 |
| conflict_003 调度规则布局 | resolved | ✅ 用户最终确认 |
| conflict_004 校准记录策略 | resolved | ✅ 会议明确 |
| conflict_005 巡检点字段不一致 | resolved | ✅ 已统一 |

## 待确认问题审查

| 问题 | 优先级 | 影响范围 | 建议 |
|------|--------|---------|------|
| question_001 驾驶舱集成 | high | 系统架构 | 需明确三端数据互通方案 |
| question_002 后端 API | high | 全部 | 需确定技术栈和对接时间表 |
| question_003 权限体系 | medium | 全部页面 | 建议采用 RBAC |
| question_004 校准坐标获取 | medium | 校准流程 | 需与机器人团队确认 |
| question_005 热力图数据源 | medium | 边巡边检 | 需与数据团队确认 |
| question_006 优先级算法 | low | 检测项 | 可后续细化 |
| question_007 区域与点位映射 | medium | 点位管理 | 建议一对多 |

## AI 推断审查

| 推断 | 状态 | 审查意见 |
|------|------|---------|
| assumption_001 四菜单结构 | pending | 需核对代码现状 |
| assumption_002 数据迁移 | pending | 需确认 migrations.ts 覆盖范围 |
| assumption_003 机器人 mock | pending | 实现细节，不影响 PRD |
| assumption_004 列表样式规范 | pending | 需明确具体规范 |
| assumption_005 检测项树层级 | pending | 需核对代码现状 |

## 来源说明

本上下文来自 02-refine 和 03-relate 的精炼与关联结果，不引入新事实。
