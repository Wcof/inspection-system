# Agent Context：frontend-context

## 任务背景

基于精炼（02-refine）和关联（03-relate）结果，实施巡检机器人管理系统的页面开发。系统分为管理端（`/management/*`）和实施平台（`/implementation/*`）两套可切换界面。

## 已确认事实（Strong Trace）

- **fact_001**: 双系统架构，顶部切换器切换，路由前缀隔离
- **fact_005**: 巡检点分固定点（单点）和区域点（画框≥2 点）
- **fact_006**: 设备设施采集向导：机器人选择→云台画面框选→填写信息→自动回填坐标
- **fact_007**: 检测项类型下拉，阈值联动，去除预警值/临界值
- **fact_008**: 调度规则单行列表式表单，启用状态控制显示
- **fact_012**: 全局图片预览，基于 event.currentTarget

## 禁止推断项

| 编号 | 禁止推断内容 | 原因 |
|------|------------|------|
| assumption_001 | 实施平台四菜单精确结构 | 需核对代码现状 |
| assumption_004 | 全局列表样式统一规范 | 未明确具体规范 |
| assumption_005 | 检测对象树四级层级 | 需核对代码现状 |

## 页面实施清单

| 页面 | 路径 | 关键要求 | 状态 |
|------|------|---------|------|
| 管理端总调度台 | `/management/dispatch/center` | 系统切换器 + 菜单动态切换 | pending |
| 巡检计划管理 | `/management/inspection-plan` | 周期配置（周/月/一次性） | pending |
| 巡检任务管理 | `/management/inspection-task` | 任务状态管理 | pending |
| 异常中心 | `/management/exception` | 异常分级 + 升级流程 | pending |
| 巡检统计 | `/management/statistics` | 完成率/异常率/覆盖率 | pending |
| 地图管理 | `/implementation/map/*` | 区域画框 + 编辑拖动 | ✅ completed |
| 机器人管理 | `/implementation/robot/*` | 列表字段 + 详情"关于本机" | ✅ completed |
| 点位管理 | `/implementation/point/*` | 固定/区域点 + 巡检区域 | ✅ completed |
| 设施设备管理 | `/implementation/device/*` | 采集向导 + 云台框选 | ✅ completed |
| 检测对象 | `/implementation/metric/list` | 四级树 + 独立周期 | pending |
| 调度规则配置 | `/implementation/dispatch/rule-config` | 单行列表 + 启用控制 | ✅ completed |
| 资源基础配置 | `/implementation/dispatch/resource-config` | 优先区域配置 | ✅ completed |
| 通知配置 | `/implementation/dispatch/notify-config` | 短信模板 | pending |
| 边巡边检 | `/implementation/dispatch/edge-inspection` | 热力图 + 安全/气体切换 | pending |

## 页面实施规范

每个页面必须包含：基本信息、区域布局、字段定义、操作定义、状态定义、异常处理、来源说明。

## 前端验收标准

- 路由切换无死链，系统切换后菜单/标题同步
- 表单校验在前端完成，错误信息明确
- 列表支持筛选、排序、分页
- 图片点击全局预览无 JS 报错
- 构建通过，无 TypeScript 类型错误

## 来源说明

本上下文来自 `02-refine/` 和 `03-relate/` 的精炼与关联结果，不引入新事实。
