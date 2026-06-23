# ADR 0001 — 路网拓扑属性承载主体为路网管理页

**状态**：已确认
**日期**：2026-06-23
**关联模块**：7月迭代 模块四（运行策略与路网底座）

## 背景

7月迭代功能清单模块四第一条要求"扩展 WaypointEdge 新增 speedLimit/safetyLevel/roadType"。

项目现状并存两套地图图结构：
- 轻量套：被巡检点/路线/任务流深耦合，仅含 from/to/distance/estimatedTime
- 重量套（路网管理页 RoadNetwork.vue 对应类型）：已含 speedLimit/width/bidirectional/segmentType/allowReverse/allowUTurn/maxSlope 等

清单写"扩展 WaypointEdge"指向的是轻量套，但 speedLimit 和 segmentType 在重量套中已存在或等价存在。

## 决策

路网拓扑属性扩展的承载主体是**路网管理页对应的重量套路网类型（路段/路网边）**，不是巡检路线管理里的轻量边类型。

## 理由

- 重量套本就是为"路网策略"而生，通行属性天然属于这一套
- 轻量套已被巡检点/路线/任务流深耦合，强行迁移成本极高且无收益
- 清单原文指向轻量套是作者未察觉重量套已存在

## 后果

- 在路网管理的路段类型上补"安全等级"字段
- speedLimit/路段类型复用现有字段，不重复建模
- 后续通行策略相关属性一律扩展到重量套，轻量套不再增字段

## 相关

- 取决于：无
- 影响：ADR 0002（巡检点/路线与路网统一）
