# 安全生产巡检任务管理系统 Spec

## Why
构建一个基于 Vue 3 的纯前端安全生产巡检任务管理 Web 系统,用于管理智能巡检机器人、巡检点、监测点(仪表设备)、巡检任务,并支持路径规划和异常处理。该系统将帮助工厂实现巡检工作的数字化管理,提高巡检效率和安全性。

## What Changes
- 创建 Vue 3 + TypeScript + Composition API 项目基础架构
- 实现 12 个核心功能模块的开发
- 建立完整的数据模型和类型定义系统
- 实现 Mock 数据层,使用 localStorage 进行数据持久化
- 实现机器人管理模块(机器人信息维护、状态模拟、异常策略配置)
- 实现巡检点管理模块(巡检点、监测点、监测指标三层管理)
- 实现巡检任务管理模块(任务创建、路径规划、任务模拟执行)
- 实现异常处理模块(巡检点故障、机器人故障、电量不足、信号丢失等异常策略)
- 强制使用 Ant Design Vue 作为唯一 UI 组件库
- 实现路径规划编辑器和可视化组件
- 实现异常策略配置和异常日志查看功能

## Impact
- 新增项目: 纯前端 Web 应用
- 技术栈: Vue 3、TypeScript、Pinia、Vue Router、Ant Design Vue、localStorage
- 数据存储: 纯前端 localStorage,无后端依赖
- UI 组件库: 强制使用 Ant Design Vue,禁止混用其他组件库

## ADDED Requirements

### Requirement: 项目初始化与基础配置
系统 SHALL 提供完整的项目基础架构,包括 Vue 3 项目初始化、TypeScript 配置、路由配置、状态管理配置等。

#### Scenario: 项目初始化成功
- **WHEN** 开发者执行项目初始化
- **THEN** 系统创建完整的 Vue 3 + TypeScript 项目结构
- **AND** 配置 Ant Design Vue 作为 UI 组件库
- **AND** 配置 Pinia 作为状态管理工具
- **AND** 配置 Vue Router 作为路由管理工具

### Requirement: 数据模型与类型定义
系统 SHALL 提供完整的 TypeScript 类型定义,包括机器人、巡检点、监测点、监测指标、巡检任务、路径规划、异常策略等核心实体。

#### Scenario: 类型定义完整
- **WHEN** 开发者使用类型定义
- **THEN** 系统提供完整的 TypeScript 接口和枚举定义
- **AND** 所有核心实体都有对应的类型定义
- **AND** 类型定义包含表单数据类型和实体类型

### Requirement: Mock 数据层实现
系统 SHALL 提供 Mock 数据层,使用 localStorage 进行数据持久化,并模拟机器人状态变化、数据采集和异常事件。

#### Scenario: Mock 数据初始化
- **WHEN** 系统首次启动
- **THEN** 系统自动生成初始 Mock 数据
- **AND** 数据保存到 localStorage
- **AND** 提供统一的数据访问接口

#### Scenario: 数据模拟
- **WHEN** 系统运行时
- **THEN** 系统模拟机器人状态变化(电量消耗、状态切换)
- **AND** 系统模拟监测数据采集(随机生成符合阈值的数据)
- **AND** 系统模拟异常事件触发(随机触发低电量、信号丢失等异常)

### Requirement: 机器人管理功能
系统 SHALL 提供机器人管理功能,包括机器人信息的增删改查、状态模拟配置、异常策略配置。

#### Scenario: 创建机器人
- **WHEN** 用户创建新机器人
- **THEN** 系统保存机器人基础信息(名称、序列号、型号)
- **AND** 系统配置机器人连接参数
- **AND** 系统配置机器人异常策略(低电量、信号丢失、机器人故障)
- **AND** 系统生成唯一 UUID

#### Scenario: 配置异常策略
- **WHEN** 用户配置机器人异常策略
- **THEN** 系统保存异常策略配置
- **AND** 异常策略包括: SKIP(跳过继续)、RETRY(重试)、RETURN_TO_BASE(返回基站)、WAIT_AND_RESUME(等待恢复)、ABORT(中止任务)、NOTIFY(仅通知)

### Requirement: 巡检点管理功能
系统 SHALL 提供巡检点管理功能,支持巡检点、监测点(仪表设备)、监测指标的三层管理结构。

#### Scenario: 创建巡检点
- **WHEN** 用户创建巡检点
- **THEN** 系统保存巡检点基础信息(名称、编码、位置)
- **AND** 系统标记是否为关键巡检点
- **AND** 系统配置巡检点异常策略

#### Scenario: 添加监测点
- **WHEN** 用户在巡检点下添加监测点
- **THEN** 系统保存监测点信息(名称、设备类型、相对位置、停留时间)
- **AND** 设备类型包括: 温度计、压力表、阀门、流量计、液位计、气体检测仪、电表、振动传感器等

#### Scenario: 配置监测指标
- **WHEN** 用户为监测点配置监测指标
- **THEN** 系统保存指标信息(名称、单位、阈值)
- **AND** 阈值包括: 最小值、最大值、警告值、危险值
- **AND** 系统配置数据模拟范围

### Requirement: 巡检任务管理功能
系统 SHALL 提供巡检任务管理功能,支持任务创建、路径规划、任务模拟执行。

#### Scenario: 创建巡检任务
- **WHEN** 用户创建巡检任务
- **THEN** 系统保存任务基础信息(名称、编码、类型)
- **AND** 系统关联机器人和巡检点
- **AND** 系统配置任务调度(开始时间、结束时间、重复周期)
- **AND** 系统配置任务异常策略

#### Scenario: 路径规划
- **WHEN** 用户创建任务后
- **THEN** 系统自动生成巡检路径(A→B→C)
- **AND** 系统计算各路径段的距离和预计时间
- **AND** 系统支持路径优化(最短路径、关键点位优先、时间最优)
- **AND** 用户可手动调整巡检点顺序

#### Scenario: 任务模拟执行
- **WHEN** 用户启动任务
- **THEN** 系统模拟机器人沿路径移动
- **AND** 系统模拟电量消耗
- **AND** 系统模拟数据采集
- **AND** 系统模拟异常事件触发
- **AND** 系统应用预配置的异常策略

### Requirement: 异常处理功能
系统 SHALL 提供完善的异常处理功能,支持巡检点故障、机器人故障、电量不足、信号丢失等异常场景的处理。

#### Scenario: 异常检测与处理
- **WHEN** 系统检测到异常事件
- **THEN** 系统识别异常类型和等级
- **AND** 系统匹配预配置的异常策略
- **AND** 系统执行异常策略(SKIP、RETRY、WAIT_AND_RESUME、RETURN_TO_BASE、ABORT、NOTIFY)
- **AND** 系统记录异常日志
- **AND** 系统发送告警通知

#### Scenario: 异常日志查看
- **WHEN** 用户查看异常日志
- **THEN** 系统显示异常列表(类型、时间、位置、策略、结果)
- **AND** 用户可标记异常为已解决
- **AND** 用户可添加解决说明

### Requirement: UI 组件库约束
系统 SHALL 强制使用 Ant Design Vue 作为唯一 UI 组件库,禁止混用其他组件库(如 Element Plus、Vant、Naive UI 等)。

#### Scenario: UI 组件使用
- **WHEN** 开发者使用 UI 组件
- **THEN** 所有 UI 组件必须来自 Ant Design Vue
- **AND** 遵循 Ant Design 设计规范
- **AND** 保持界面风格统一

### Requirement: 数据持久化
系统 SHALL 使用 localStorage 进行数据持久化,确保数据在浏览器刷新后不丢失。

#### Scenario: 数据持久化
- **WHEN** 用户进行任何数据操作
- **THEN** 系统将数据保存到 localStorage
- **AND** 系统在启动时从 localStorage 加载数据
- **AND** 系统提供数据导入导出功能

## MODIFIED Requirements
无

## REMOVED Requirements
无
