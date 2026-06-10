# 设计决策

## decision_001 — 双系统而非三端
**决策内容**: 最终口径锁定为"管理端 + 实施平台"两套系统切换，不再引入"实时平台"作为本轮导航目标。

- **原因**: 用户明确指示不做"实时平台+管理端"，只保留两套系统切换；驾驶舱作为独立 dashboard 项目存在
- **替代方案**: 曾考虑"实时平台+管理端"双系统方案，后被用户否定
- **影响范围**: 全部路由、菜单、页面归属
- **来源材料**: session-codex-019d673f Turn 7
- **来源位置**: "冻结系统定义与边界"
- **状态**: confirmed

## decision_002 — 路由前缀隔离
**决策内容**: 路由按前缀隔离：`/management/*` 和 `/implementation/*`，原 `/smart-inspection/*` 路由迁入管理端命名空间，原地图/机器人/点位/设备页面整体迁入实施平台命名空间。

- **原因**: 避免两套系统共用一套路由树，确保系统切换时路由可清晰分区
- **替代方案**: 曾考虑通过菜单切换控制页面归属但不改路由前缀，但会导致路由混乱
- **影响范围**: 全部路由定义
- **来源材料**: session-codex-019d673f Turn 6
- **来源位置**: Key Changes §6
- **状态**: confirmed

## decision_003 — 校准记录后台存储
**决策内容**: 不再在业务层重点展示完整校准记录列表，业务层只看最新一条校准时间，复杂记录放后台存储，需要时再调。校准记录菜单隐藏，页面保留等待以后使用。

- **原因**: 会议明确倾向简化业务层展示，避免校准记录列表成为信息负担
- **替代方案**: 曾考虑在校准记录页面展示完整历史记录列表
- **影响范围**: 校准记录页面、点位管理校准时间展示
- **来源材料**: session-codex-019d65be Turn 3, Turn 17
- **来源位置**: Turn 3 注释, Turn 17
- **状态**: confirmed

## decision_004 — 检测项独立周期
**决策内容**: 每个检测项独立配置检测周期和窗口，而非同点位下所有检测项统一周期。

- **原因**: 实施时不同设备/检查项的实际检查频率需求不同，统一周期会导致过度巡检或巡检不足
- **替代方案**: 曾考虑按巡检点统一配置所有检测项周期
- **影响范围**: 检测对象、设备表单检测项配置、调度规则
- **来源材料**: session-codex-019d65be Turn 23-24
- **来源位置**: Turn 23, Turn 24
- **状态**: confirmed

## decision_005 — 启用状态控制显示
**决策内容**: 调度规则配置和资源基础配置中，启用状态控制其余字段显示/隐藏；关闭时底部操作区（保存/取消/重置）始终显示。

- **原因**: 用户要求按照 Ant Design 的表单节奏，恢复关键交互，不是简单"硬拉平"
- **替代方案**: 曾尝试将所有字段平铺展示，被用户否定（"太丑了"）
- **影响范围**: 调度规则配置、资源基础配置页面
- **来源材料**: session-codex-019e0b90 Turn 33-35
- **来源位置**: Turn 33, Turn 34, Turn 35
- **状态**: confirmed

## decision_006 — 预警值/临界值移除
**决策内容**: 所有检测项相关页面（检测对象弹窗、设备表单、设备详情）去除预警值和临界值字段，仅保留最小值/最大值。

- **原因**: 用户明确要求去除，简化阈值配置
- **替代方案**: 无
- **影响范围**: 所有检测项配置页面
- **来源材料**: session-codex-019d65be Turn 22
- **来源位置**: Turn 22
- **状态**: confirmed

## decision_007 — 全局图片预览
**决策内容**: 在主内容区统一监听图片点击，弹出大图预览弹窗，覆盖所有图片场景。

- **原因**: 多处页面需要图片预览能力，全局方案避免逐页重复实现
- **替代方案**: 逐页单独实现图片预览
- **影响范围**: AppLayout.vue 及所有含图片的页面
- **来源材料**: session-codex-019d65be Turn 43, Turn 46
- **来源位置**: Turn 43, Turn 46（bug 修复）
- **状态**: confirmed

## decision_008 — 调度台页面整合
**决策内容**: 将原 5 个独立调度子页面（AutoDispatch、ConflictHandling、DispatchIntervention、DispatchRecord、TemporaryDispatch）整合为统一控制台（Console.vue），通过 Tab 或面板切换不同调度功能。

- **原因**: 原 5 个页面各自独立但功能关联紧密，分散布局导致用户在调度操作时需要频繁跳转，降低调度效率
- **替代方案**: 保持 5 个独立页面，通过菜单导航切换
- **影响范围**: `/management/dispatch/*` 路由、调度台相关组件
- **来源材料**: commit 5ce0c97
- **来源位置**: "Refactor inspection business logic: consolidate dispatch pages"
- **状态**: confirmed

## decision_009 — 实施平台页面合并
**决策内容**: 将原独立页面 DispatchRule（调度规则）、InspectionCycle（巡检周期）合并到 DispatchRuleConfig；将 ResourceStrategy（资源策略）合并到 ResourceBaseConfig。

- **原因**: 原独立页面功能与目标配置页面高度重叠，分开维护增加认知负担和代码冗余
- **替代方案**: 保持独立页面，各自维护
- **影响范围**: `/implementation/dispatch/*` 路由、调度配置相关组件
- **来源材料**: commit 5ce0c97
- **来源位置**: "Remove standalone implementation pages and merge into DispatchRuleConfig, ResourceBaseConfig"
- **状态**: confirmed

## decision_010 — 检测规则状态统一
**决策内容**: 统一检测项配置相关页面（DetectionItemConfigDetail/Form/List、ComponentUsageDetail/Form、FacilityDeviceForm、ObjectDetectionConfig）的状态处理逻辑，确保状态枚举和交互行为一致。

- **原因**: 不同页面对检测规则状态的处理存在差异，导致数据展示和操作行为不一致
- **替代方案**: 各页面独立维护状态逻辑
- **影响范围**: 检测对象、组件使用、设施设备表单、目标检测配置等页面
- **来源材料**: commit e7ff351
- **来源位置**: "Unify detection rule status"
- **状态**: confirmed

## decision_011 — 任务管理子页面扩展
**决策内容**: 为巡检任务管理新增三个子页面：执行轨迹（ExecutionTrace）、检查结果（CheckResult）、任务复盘（TaskReview），分别用于查看任务执行过程、检测结果详情和事后复盘分析。

- **原因**: 原任务管理仅有列表和详情页，缺少执行过程追踪、结果查看和复盘分析能力
- **替代方案**: 在任务详情页内通过 Tab 集成所有功能
- **影响范围**: `/management/task/*` 路由、任务管理相关组件
- **来源材料**: commit 5ce0c97, commit 14756e0
- **来源位置**: "enhance task management"
- **状态**: confirmed
