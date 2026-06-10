# 业务目标

## goal_001 — 双系统清晰边界
将单体后台拆分为管理端和实施平台两套系统，明确各自职责边界，避免业务管理能力与实施配置能力混放。

- **目标类型**: 架构重构
- **影响对象**: 全部页面、路由、菜单
- **来源材料**: session-codex-019d673f Turn 6-7
- **衡量方式**: 管理端不再出现地图建模/点位校准/检测项配置等实施型菜单；实施平台不再出现巡检任务/统计/异常中心等客户日常业务菜单
- **状态**: completed

## goal_002 — 对象建模链路统一
建立统一的对象建模链路（区域→装置→设施→巡检对象→检测规则）和巡检执行链路（停车点/巡检点→巡检对象→检测规则→任务→告警→证据），确保各页面数据口径一致。

- **目标类型**: 数据模型统一
- **影响对象**: 所有涉及设施设备、检测项、巡检点的页面
- **来源材料**: session-codex-019e3dfb Turn 2
- **衡量方式**: 各页面左侧树形筛选层级一致；列表数据按树节点正确过滤
- **状态**: in_progress

## goal_003 — 设备设施采集体验升级
将设备设施新增/编辑升级为"机器人选择→云台画面框选 ROI→填写设备信息→配置检测项"的向导流程，自动回填云台坐标。

- **目标类型**: 交互体验优化
- **影响对象**: `/facility/device` 页面及采集向导
- **来源材料**: session-codex-019d65be Turn 7-18
- **衡量方式**: 新增/编辑均弹出向导；框选可正常显示；云台坐标自动回填
- **状态**: in_progress

## goal_004 — 调度配置可读性提升
改善调度规则配置、资源基础配置等页面的可读性，增加说明引导，优化表单布局。

- **目标类型**: 交互体验优化
- **影响对象**: `/implementation/dispatch/rule-config`, `/implementation/dispatch/resource-config`, `/implementation/dispatch/notify-config`
- **来源材料**: session-codex-019e0b90 Turn 1, Turn 23-35
- **衡量方式**: 页面布局按 Ant Design 规范；配置说明与当前字段一一对应
- **状态**: completed
- **完成说明**: 2026-06-08 已合并 DispatchRule/InspectionCycle 到 DispatchRuleConfig，ResourceStrategy 到 ResourceBaseConfig（commit 5ce0c97）

## goal_005 — 检测项独立周期配置
每个检测项可独立配置巡检周期和巡检窗口，避免同点位下不同设备/检查项被强制统一周期。

- **目标类型**: 业务规则完善
- **影响对象**: 检测对象页面、设备表单检测项配置
- **来源材料**: session-codex-019d65be Turn 23-24
- **衡量方式**: 检测项列表可单独配置周期/窗口；与设备不一致时保存提示确认
- **状态**: in_progress

## goal_006 — 点位管理双向同步
点位管理（`/map/point-manage`）与巡检点管理（`/facility/inspection-point`）双向同步，地图拾点交互统一为 2D/3D。

- **目标类型**: 功能完善
- **影响对象**: 点位管理、巡检点管理、巡检点表单
- **来源材料**: session-codex-019d65be Turn 19-21
- **衡量方式**: 双向创建/删除同步；固定点=1 个点，区域点≥2 个点
- **状态**: in_progress

## goal_007 — 机器人管理信息完善
机器人列表补充续航、总里程、保养信息（进度条+文字）；详情页面补充挂件信息、版本型号、俯视结构图。

- **目标类型**: 信息完善
- **影响对象**: `/implementation/robot/list`, `/implementation/robot/simulation`
- **来源材料**: session-codex-019d65be Turn 7-9, Turn 42, Turn 44
- **衡量方式**: 列表字段完整；详情页面"关于本机"信息齐全
- **状态**: in_progress

## goal_008 — GitHub Pages 持续部署
通过 GitHub Actions 实现自动部署到 GitHub Pages，支持多分支独立推送更新。

- **目标类型**: CI/CD 建设
- **影响对象**: `.github/workflows/deploy-pages.yml`
- **来源材料**: session-codex-019d4cd9 Turn 1-2, session-codex-019e25ad Turn 4, session-codex-019d65be Turn 52
- **衡量方式**: push 到分支后自动更新 Pages
- **状态**: completed
