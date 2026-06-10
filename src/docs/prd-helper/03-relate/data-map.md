# 数据关联

## data_001 — InspectionPlan（巡检计划）
- **对象含义**: 周期性巡检调度计划
- **来源事实**: fact_002
- **关联规则**: rule_001, rule_003
- **关键字段**: id, name, robotId, routeId, inspectionPointIds[], cycleType（周/月/一次性）, cronExpression, status, createdAt, updatedAt

## data_002 — InspectionRoute（巡检路线）
- **对象含义**: 有序 waypoint 和 inspectionPoint 序列
- **来源事实**: fact_001
- **关联规则**: rule_001
- **关键字段**: id, name, mapId, waypointOrder[], inspectionPointOrder[], createdAt

## data_003 — InspectionTask（巡检任务）
- **对象含义**: 计划生成的单次执行任务实例
- **来源事实**: fact_002
- **关联规则**: rule_001, rule_004
- **关键字段**: id, planId, robotId, status（待执行/执行中/已完成/异常/已取消）, snapshots[], results, createdAt, executedAt

## data_004 — TaskSnapshot（任务快照）
- **对象含义**: 任务执行过程中的状态快照
- **来源事实**: fact_002
- **关联规则**: rule_001
- **关键字段**: id, taskId, robotPosition, currentInspectionPointId, progress, timestamp

## data_005 — ExceptionLog（异常日志）
- **对象含义**: 巡检过程中记录的异常事件
- **来源事实**: fact_002
- **关联规则**: rule_002
- **关键字段**: id, taskId, inspectionPointId, deviceId, exceptionType, severity, description, status, handledBy, handledAt

## data_006 — Alert（告警）
- **对象含义**: 检测规则触发后的告警记录
- **来源事实**: fact_004
- **关联规则**: rule_002, rule_005
- **关键字段**: id, taskId, checkItemId, ruleId, alertLevel, evidenceRecordIds[], message, createdAt

## data_007 — StatisticsReport（统计报表）
- **对象含义**: 巡检统计汇总数据
- **来源事实**: fact_002
- **关联规则**: rule_006
- **关键字段**: id, period, completionRate, anomalyRate, coverageRate, deviceStats[], pointStats[], createdAt

## data_008 — InspectionMap（巡检地图）
- **对象含义**: 机器人巡检用地图
- **来源事实**: fact_001
- **关联规则**: rule_007
- **关键字段**: id, name, mapData, waypointIds[], areaIds[], createdAt, updatedAt

## data_009 — Waypoint（途径点）
- **对象含义**: 地图上的导航途径点
- **来源事实**: fact_001
- **关联规则**: rule_007
- **关键字段**: id, mapId, type（巡查点/充电点/停车点/普通通过点）, position, properties, createdAt

## data_010 — WaypointEdge（途径点连线）
- **对象含义**: 途径点之间的可通行路径
- **来源事实**: fact_001
- **关联规则**: rule_007
- **关键字段**: id, mapId, fromWaypointId, toWaypointId, distance, traversable, createdAt

## data_011 — MapArea（地图分区）
- **对象含义**: 地图上的区域划分（画框）
- **来源事实**: fact_001
- **关联规则**: rule_008, rule_012
- **关键字段**: id, mapId, name, boundingBox, color, createdAt, updatedAt

## data_012 — Robot（机器人）
- **对象含义**: 巡检机器人设备
- **来源事实**: fact_013
- **关联规则**: rule_009, rule_010, rule_018, rule_019
- **关键字段**: id, name, model, hardwareModel, carControllerModel, softwareModel, autoControlBoardModel,挂件信息[], status, batteryLevel, range, totalMileage, maintenanceInfo, defaultServiceAreaId, createdAt

## data_013 — RobotComponent（机器人挂件组件）
- **对象含义**: 机器人挂载的硬件组件
- **来源事实**: fact_013
- **关联规则**: rule_009
- **关键字段**: id, robotId, name, type（底盘/双目摄像头/热成像/电池等）, model, status

## data_014 — InspectionPoint（巡检点）
- **对象含义**: 机器人到达并停留进行巡检的地点
- **来源事实**: fact_005
- **关联规则**: rule_011, rule_012
- **关键字段**: id, name, type（固定点/区域点）, mapId, areaId, positions[], collectionPoses[], parkingPointIds[], calibrationTime, calibrationStatus, inspectionItemCount, deviceCount, updatedAt, updatedBy, previewImage, createdAt

## data_015 — CalibrationRecord（校准记录）
- **对象含义**: 巡检点校准历史记录
- **来源事实**: fact_010
- **关联规则**: rule_022, rule_025
- **关键字段**: id, inspectionPointId, robotId, calibrationPosition, calibrationTime, status（待预标/待校准/已校准/待复核/已归档）, createdAt

## data_016 — InspectionDevice（设施设备）
- **对象含义**: 巡检点下的设施/设备
- **来源事实**: fact_006
- **关联规则**: rule_013, rule_014
- **关键字段**: id, inspectionPointId, name, category, code, positionCode, areaId, deviceId, componentIds[], checkItemConfigs[], checkCycle, checkWindow, referenceImage, createdAt, updatedAt

## data_017 — AssetComponent（资产巡检对象）
- **对象含义**: 设施下的可检测巡检对象
- **来源事实**: fact_004
- **关联规则**: rule_005
- **关键字段**: id, deviceId, name, type, code, positionCode, areaId, deviceCode, checkRuleIds[], status, createdAt

## data_018 — ConnectionObject（连接对象）
- **对象含义**: 设施设备之间的连接关系
- **来源事实**: fact_004
- **关联规则**: rule_005
- **关键字段**: id, fromComponentId, toComponentId, type, createdAt

## data_019 — CheckItem（检测项）
- **对象含义**: 设备设施的具体检测项目
- **来源事实**: fact_007, fact_011
- **关联规则**: rule_014, rule_015, rule_016
- **关键字段**: id, deviceId, inspectionPointId, areaId, name, type（温度/外观/线路/气体/仪表读数/阀门开闭/安全行为/泄漏腐蚀）, thresholds（min/max）, recognitionMode, imageMapping, checkCycle, checkWindow, priority（主要/次要）, referenceImage, createdAt, updatedAt

## data_020 — DetectionConfig（检测配置）
- **对象含义**: 巡检点的检测规则配置
- **来源事实**: fact_007
- **关联规则**: rule_014
- **关键字段**: id, inspectionPointId, checkItemIds[], order[], createdAt

## data_021 — DispatchRule（调度规则）
- **对象含义**: 自动调度配置规则
- **来源事实**: fact_008
- **关联规则**: rule_004, rule_017
- **关键字段**: id, name, areaId, enabled,补检规则, description, createdAt, updatedAt

## data_022 — ResourceConfig（资源基础配置）
- **对象含义**: 机器人优先巡检区域配置
- **来源事实**: fact_009
- **关联规则**: rule_018, rule_019
- **关键字段**: id, areaId, robotIds[], priority, createdAt, updatedAt

## data_023 — NotifyConfig（通知配置）
- **对象含义**: 告警通知配置
- **来源事实**: fact_015
- **关联规则**: rule_020
- **关键字段**: id, smsTemplate, enabled, createdAt, updatedAt

## data_024 — EdgeInspectionData（边巡边检数据）
- **对象含义**: 安全行为和气体分析的历史检测数据
- **来源事实**: fact_014
- **关联规则**: rule_021
- **关键字段**: id, type（安全行为/气体分析）, inspectionPointId, timestamp, value, heatMapData, createdAt

## data_025 — EvidenceRecord（证据记录）
- **对象含义**: 告警关联的证据（图片、数据等）
- **来源事实**: fact_004
- **关联规则**: rule_005
- **关键字段**: id, alertId, type（图片/数据/日志）, url, ptzCoordinates, timestamp, createdAt
