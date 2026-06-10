# 页面关联

## page_001 — 管理端调度台
- **路径**: `/management/dispatch/center`（总调度台）, `/management/dispatch/console`（控制台）
- **所属模块**: 管理端
- **来源范围**: session-codex-019d673f Turn 6, commit 5ce0c97
- **关联事实**: fact_002, fact_016
- **关联功能**: feature_001（巡检计划管理）, feature_002（巡检任务管理）, feature_003（异常中心）
- **关联规则**: rule_001（计划调度生成任务）, rule_002（异常升级流程）
- **变更记录**: 2026-06-08 整合原 5 个独立调度子页面（AutoDispatch、ConflictHandling、DispatchIntervention、DispatchRecord、TemporaryDispatch）为统一控制台（Console.vue）

## page_002 — 巡检计划管理
- **路径**: `/management/inspection-plan`
- **所属模块**: 管理端
- **来源范围**: session-codex-019d673f Turn 6
- **关联事实**: fact_002
- **关联功能**: feature_001（巡检计划管理）
- **关联规则**: rule_001（计划调度生成任务）, rule_003（检查周期配置）

## page_003 — 巡检任务管理
- **路径**: `/management/task/list`（任务列表）, `/management/task/detail/:id`（任务详情）, `/management/task/temp-list`（临时任务）, `/management/task/trace/:id`（执行轨迹）, `/management/task/result/:id`（检查结果）, `/management/task/review/:id`（任务复盘）
- **所属模块**: 管理端
- **来源范围**: session-codex-019d673f Turn 6, commit 5ce0c97, commit 14756e0
- **关联事实**: fact_002, fact_017
- **关联功能**: feature_002（巡检任务管理）
- **关联规则**: rule_001（计划调度生成任务）, rule_004（补检规则）
- **变更记录**: 2026-06-08 新增执行轨迹（ExecutionTrace）、检查结果（CheckResult）、任务复盘（TaskReview）三个子页面；原临时任务路由迁移至 `/management/task/temp-list`

## page_004 — 异常中心
- **路径**: `/management/exception`
- **所属模块**: 管理端
- **来源范围**: session-codex-019d673f Turn 6
- **关联事实**: fact_002
- **关联功能**: feature_003（异常中心）
- **关联规则**: rule_002（异常升级流程）, rule_005（告警证据链）

## page_005 — 巡检统计
- **路径**: `/management/statistics`
- **所属模块**: 管理端
- **来源范围**: session-codex-019d673f Turn 6
- **关联事实**: fact_002
- **关联功能**: feature_004（巡检统计）
- **关联规则**: rule_006（统计口径定义）

## page_006 — 地图管理（列表+编辑+区域管理）
- **路径**: `/implementation/map/list`, `/implementation/map/edit`, `/implementation/map/area-manage`
- **所属模块**: 实施平台
- **来源范围**: session-codex-019d65be Turn 19-20, Turn 37, Turn 40, Turn 47, Turn 48, Turn 49
- **关联事实**: fact_005
- **关联功能**: feature_005（地图建模）, feature_006（区域划分）
- **关联规则**: rule_007（途径点类型定义）, rule_008（分区画框创建）

## page_007 — 机器人管理（列表+详情）
- **路径**: `/implementation/robot/list`, `/implementation/robot/simulation`
- **所属模块**: 实施平台
- **来源范围**: session-codex-019d65be Turn 2, Turn 7-9, Turn 42, Turn 44
- **关联事实**: fact_013
- **关联功能**: feature_007（机器人 CRUD）, feature_008（机器人仿真/详情）
- **关联规则**: rule_009（机器人状态枚举）, rule_010（保养信息计算）

## page_008 — 点位管理
- **路径**: `/implementation/point/list`, `/implementation/point/create`, `/implementation/point/detail`
- **所属模块**: 实施平台
- **来源范围**: session-codex-019d65be Turn 19-25, Turn 39
- **关联事实**: fact_005, fact_006
- **关联功能**: feature_009（巡检点 CRUD）, feature_010（点位校准）
- **关联规则**: rule_011（固定点=1 点/区域点≥2 点）, rule_012（点位巡检区域）

## page_009 — 设施设备管理
- **路径**: `/implementation/device/list`, `/implementation/device/form`
- **所属模块**: 实施平台
- **来源范围**: session-codex-019d65be Turn 7-18, Turn 22
- **关联事实**: fact_006, fact_007
- **关联功能**: feature_011（设备设施 CRUD）, feature_012（采集向导）
- **关联规则**: rule_013（云台坐标自动回填）, rule_014（检测项配置一致性）

## page_010 — 检测对象
- **路径**: `/implementation/metric/list`
- **所属模块**: 实施平台
- **来源范围**: session-codex-019d65be Turn 22-27, Turn 41, Turn 51
- **关联事实**: fact_007, fact_011
- **关联功能**: feature_013（检测项 CRUD）
- **关联规则**: rule_015（检测项独立周期配置）, rule_016（检测项优先级）

## page_011 — 调度规则配置
- **路径**: `/implementation/dispatch/rule-config`
- **所属模块**: 实施平台
- **来源范围**: session-codex-019e0b90 Turn 1, Turn 28-35, commit 5ce0c97
- **关联事实**: fact_008
- **关联功能**: feature_014（调度规则配置）
- **关联规则**: rule_017（启用状态控制显示）, rule_004（补检规则）
- **变更记录**: 2026-06-08 合并原独立页面 DispatchRule（调度规则）和 InspectionCycle（巡检周期）到此页面

## page_012 — 资源基础配置
- **路径**: `/implementation/dispatch/resource-config`
- **所属模块**: 实施平台
- **来源范围**: session-codex-019e0b90 Turn 3, Turn 27, commit 5ce0c97
- **关联事实**: fact_009
- **关联功能**: feature_015（资源分配策略）
- **关联规则**: rule_018（优先区域指派）, rule_019（跨区域调度）
- **变更记录**: 2026-06-08 合并原独立页面 ResourceStrategy（资源策略）到此页面

## page_013 — 通知配置
- **路径**: `/implementation/dispatch/notify-config`
- **所属模块**: 实施平台
- **来源范围**: session-codex-019e0b90 Turn 4
- **关联事实**: fact_015
- **关联功能**: feature_016（通知配置）
- **关联规则**: rule_020（短信模板配置）

## page_014 — 边巡边检
- **路径**: `/implementation/dispatch/edge-inspection`
- **所属模块**: 实施平台
- **来源范围**: session-codex-019e0b90 Turn 5, Turn 7
- **关联事实**: fact_014
- **关联功能**: feature_017（安全行为边巡边检）, feature_018（气体分析边巡边检）
- **关联规则**: rule_021（热力图数据展示）

## page_015 — 校准记录（隐藏）
- **路径**: `/implementation/calibration-record`
- **所属模块**: 实施平台
- **来源范围**: session-codex-019d65be Turn 3, Turn 17
- **关联事实**: fact_010
- **关联功能**: feature_019（校准记录存储）
- **关联规则**: rule_022（校准记录后台存储策略）

## page_016 — 驾驶舱
- **路径**: `/drive-dashboard`（独立项目）
- **所属模块**: 驾驶舱（独立）
- **来源范围**: session-codex-019e3dfb Turn 2
- **关联事实**: —
- **关联功能**: feature_020（实时运行监控）, feature_021（告警查看）
- **关联规则**: rule_023（对象建模链路展示）

## page_017 — 全局图片预览
- **路径**: 全局（AppLayout.vue）
- **所属模块**: 公共组件
- **来源范围**: session-codex-019d65be Turn 43, Turn 46
- **关联事实**: fact_012
- **关联功能**: feature_022（图片放大预览）
- **关联规则**: rule_024（图片点击事件处理）

---

## 已删除/合并页面（2026-06-08 整合）

以下页面在 commit `5ce0c97` 中被删除或合并，保留记录以供追溯：

| 原页面 | 原路径 | 处理方式 | 合并目标 |
|--------|--------|----------|----------|
| AutoDispatch | `management/dispatch/AutoDispatch` | 删除，逻辑合并至控制台 | Console.vue |
| ConflictHandling | `management/dispatch/ConflictHandling` | 删除，逻辑合并至控制台 | Console.vue |
| DispatchIntervention | `management/dispatch/DispatchIntervention` | 删除，逻辑合并至控制台 | Console.vue |
| DispatchRecord | `management/dispatch/DispatchRecord` | 删除，逻辑合并至控制台 | Console.vue |
| TemporaryDispatch | `management/dispatch/TemporaryDispatch` | 删除，逻辑合并至控制台 | Console.vue |
| DispatchRule | `implementation/DispatchRule` | 合并 | DispatchRuleConfig.vue |
| InspectionCycle | `implementation/InspectionCycle` | 合并 | DispatchRuleConfig.vue |
| ResourceStrategy | `implementation/ResourceStrategy` | 合并 | ResourceBaseConfig.vue |
