# Agent Context：backend-context

## 任务背景

基于精炼（02-refine）和关联（03-relate）结果，设计巡检机器人管理系统的后端数据模型和接口。当前系统为纯前端 + localStorage 模拟，需规划真实后端对接方案。

## 数据对象清单

| 数据对象 | 核心字段 | 关联规则 |
|----------|---------|---------|
| InspectionPlan | id, name, robotId, routeId, inspectionPointIds[], cycleType, cronExpression, status | rule_001, rule_003 |
| InspectionTask | id, planId, robotId, status, snapshots[], results | rule_001, rule_004 |
| ExceptionLog | id, taskId, inspectionPointId, deviceId, exceptionType, severity, status | rule_002 |
| Alert | id, taskId, checkItemId, ruleId, alertLevel, evidenceRecordIds[] | rule_002, rule_005 |
| InspectionMap | id, name, mapData, waypointIds[], areaIds[] | rule_007 |
| Waypoint | id, mapId, type, position, properties | rule_007 |
| MapArea | id, mapId, name, boundingBox, color | rule_008, rule_012 |
| Robot | id, name, model, status, batteryLevel, range, totalMileage, maintenanceInfo | rule_009, rule_010 |
| InspectionPoint | id, name, type, mapId, areaId, positions[], calibrationTime, calibrationStatus | rule_011, rule_012 |
| InspectionDevice | id, inspectionPointId, name, category, componentIds[], checkItemConfigs[] | rule_013, rule_014 |
| CheckItem | id, deviceId, type, thresholds, checkCycle, checkWindow, priority | rule_014, rule_015, rule_016 |
| DispatchRule | id, name, areaId, enabled, 补检规则 | rule_004, rule_017 |
| ResourceConfig | id, areaId, robotIds[], priority | rule_018, rule_019 |

## 状态枚举

Robot: 任务中/充电中/待机/返航中/异常中/离线 | InspectionTask: 待执行/执行中/已完成/异常/已取消 | CalibrationRecord: 待预标/待校准/已校准/待复核/已归档 | ExceptionLog: 新建/处理中/已解决/已升级

## 接口设计原则

1. RESTful 风格，资源路径与数据对象名一致
2. 批量操作支持数组 ID 传入
3. 所有写操作返回变更后的完整对象
4. 列表接口支持分页、筛选、排序
5. 错误响应统一格式：{ code, message, details }

## 待确认

- question_002: 真实后端技术栈
- question_003: 权限体系方案
- question_004: 校准坐标获取方式

## 来源说明

本上下文来自 02-refine 和 03-relate 的精炼与关联结果，不引入新事实。
