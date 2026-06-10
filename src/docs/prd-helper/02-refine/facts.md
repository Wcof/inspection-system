# 需求事实

## fact_001 — 双系统架构
系统分为两套可切换界面：`管理端`（`/management/*`）和 `实施平台`（`/implementation/*`），通过顶部系统切换器切换，切换后同步更新左侧菜单、默认页、页面标题。

- **source_id**: scan-codex-019d673f-abed-7593-b62d-810754c65aa5
- **path**: active/sessions/session-codex-019d673f-abed-7593-b62d-810754c65aa5.md
- **quote**: "管理端：负责计划、任务、调度、异常、结果与统计；实施平台：负责地图、点位、设备、检测项、周期、规则、校准与仿真调试"
- **locator**: Turn 6, Key Changes §1
- **可信度**: Strong
- **状态**: confirmed

## fact_002 — 管理端职责范围
管理端负责：巡检计划管理、巡检任务管理、总调度台、异常中心、巡检结果查询、统计与历史追溯。不负责地图初始化、点位预标、校准回写、检测项阈值配置、现场调试。

- **source_id**: scan-codex-019d673f-abed-7593-b62d-810754c65aa5
- **path**: active/sessions/session-codex-019d673f-abed-7593-b62d-810754c65aa5.md
- **quote**: "管理端不负责：地图初始化、点位预标、校准回写、检测项阈值和识别基准配置、现场调试、实施交付"
- **locator**: Turn 7, "冻结系统定义与边界"
- **可信度**: Strong
- **状态**: confirmed

## fact_003 — 实施平台职责范围
实施平台负责：地图管理、机器人基础建设与仿真调试、点位管理、设施设备管理、检测项配置、校准记录回收与复核、检查周期配置、自动调度规则配置、资源分配策略配置。

- **source_id**: scan-codex-019d673f-abed-7593-b62d-810754c65aa5
- **path**: active/sessions/session-codex-019d673f-abed-7593-b62d-810754c65aa5.md
- **quote**: "实施平台回答的问题是：让系统能跑、让系统跑得准、问题如何被构建和回收"
- **locator**: Turn 7, "冻结系统定义与边界"
- **可信度**: Strong
- **状态**: confirmed

## fact_004 — 核心对象链路
对象建模链路：`区域 -> 装置 -> 设施/管路 -> 巡检对象 -> 检测规则`。巡检执行链路：`停车点/巡检点 -> 巡检对象 -> 检测规则 -> 任务 -> 告警 -> 证据`。

- **source_id**: scan-codex-019e3dfb-b95d-74a1-85fd-24b2a3ede129
- **path**: active/sessions/session-codex-019e3dfb-b95d-74a1-85fd-24b2a3ede129.md
- **quote**: "统一对象链路：区域 -> 装置 -> 设施/管路 -> 巡检对象 -> 检测规则"
- **locator**: Turn 2, Key Changes
- **可信度**: Strong
- **状态**: confirmed

## fact_005 — 巡检点类型
巡检点分为**固定巡检点**（单点）和**区域巡检点**（至少 2 个点，画框选区）。点位类型包括：巡检点、停车点、充电点。

- **source_id**: scan-codex-019d65be-cf98-7bc0-82fe-50f943761282
- **path**: active/sessions/session-codex-019d65be-cf98-7bc0-82fe-50f943761282.md
- **quote**: "固定巡检点默认是一个点位，如果是区域的就需要新增至少 2 个"
- **locator**: Turn 21
- **可信度**: Strong
- **状态**: confirmed

## fact_006 — 设备设施采集向导
新建设备/编辑设备时弹出向导：左侧实时云台画面（mock 图片），右侧填写设备基础信息和检测项配置；支持拖拽框选 ROI，自动回填云台坐标（X/Y/焦距/角度）。

- **source_id**: scan-codex-019d65be-cf98-7bc0-82fe-50f943761282
- **path**: active/sessions/session-codex-019d65be-cf98-7bc0-82fe-50f943761282.md
- **quote**: "先选机器人 + 左侧实时云台画面框选 + 右侧填写设备与检测项 + 自动回填云台坐标"
- **locator**: Turn 7, Turn 18
- **可信度**: Strong
- **状态**: confirmed

## fact_007 — 检测项类型与阈值
检测项类型包括：温度、外观、线路、气体、仪表读数、阀门开闭、安全行为、泄漏/腐蚀等。阈值字段包括最小值/最大值（已去除预警值/临界值）。

- **source_id**: scan-codex-019d65be-cf98-7bc0-82fe-50f943761282
- **path**: active/sessions/session-codex-019d65be-cf98-7bc0-82fe-50f943761282.md
- **quote**: "类型改成下拉后，阈值列也应该按类型联动...去除预警值、临界值，仅保留最小值/最大值"
- **locator**: Turn 5, Turn 22
- **可信度**: Strong
- **状态**: confirmed

## fact_008 — 调度规则配置
调度规则配置包含：启用状态、区域、补检规则、调度规则说明。页面采用单行列表式表单，启用状态控制其余字段显示/隐藏，底部操作区始终显示。

- **source_id**: scan-codex-019e0b90-b0fa-7273-b52e-97d5f7629e2c
- **path**: active/sessions/session-codex-019e0b90-b0fa-7273-b52e-97d5f7629e2c.md
- **quote**: "单行列表式表单：启用状态放第一行；只有开启时才显示其余配置项"
- **locator**: Turn 34, Turn 35
- **可信度**: Strong
- **状态**: confirmed

## fact_009 — 资源基础配置
资源基础配置用于配置机器人优先巡检的区域，当规划生成任务时优先按区域指派机器人；机器人空闲时才涉及跨区域调度。去除"默认服务区域"和"区域机器人配置规则"标题。

- **source_id**: scan-codex-019e0b90-b0fa-7273-b52e-97d5f7629e2c
- **path**: active/sessions/session-codex-019e0b90-b0fa-7273-b52e-97d5f7629e2c.md
- **quote**: "配置机器人优先巡检的区域...当机器人没有空闲的时候，才会涉及到跨区域调度"
- **locator**: Turn 3, Turn 27
- **可信度**: Strong
- **状态**: confirmed

## fact_010 — 校准记录策略
校准记录菜单已隐藏，页面保留等待以后使用。业务层只看最新一条校准时间，复杂记录放后台存储，需要时再调。校准坐标弹窗需选择机器人获取所选机器人的坐标。

- **source_id**: scan-codex-019d65be-cf98-7bc0-82fe-50f943761282
- **path**: active/sessions/session-codex-019d65be-cf98-7bc0-82fe-50f943761282.md
- **quote**: "不再在业务层重点展示完整《校准记录》列表...校准坐标弹窗需要新增一个机器人的选项"
- **locator**: Turn 3, Turn 23
- **可信度**: Strong
- **状态**: confirmed

## fact_011 — 检测项独立配置
每个检测项独立配置检测周期和窗口，避免同点位下不同设备/检查项被强行按同一最小周期执行。同设备下默认使用设备的巡检周期/窗口，若不一致保存时确认提示。

- **source_id**: scan-codex-019d65be-cf98-7bc0-82fe-50f943761282
- **path**: active/sessions/session-codex-019d65be-cf98-7bc0-82fe-50f943761282.md
- **quote**: "每个检测项独立配置检测周期和窗口...若存在和设备的不一致的情况，保存的时候确认提示用户"
- **locator**: Turn 23, Turn 24
- **可信度**: Strong
- **状态**: confirmed

## fact_012 — 全局图片预览
项目统一支持图片点击放大预览，通过 `AppLayout.vue` 全局监听实现，覆盖设备参考图、点位现场预览图等所有图片场景。

- **source_id**: scan-codex-019d65be-cf98-7bc0-82fe-50f943761282
- **path**: active/sessions/session-codex-019d65be-cf98-7bc0-82fe-50f943761282.md
- **quote**: "做成全局能力：在主内容区统一监听图片点击，弹出大图预览弹窗"
- **locator**: Turn 43, Turn 46
- **可信度**: Strong
- **状态**: confirmed

## fact_013 — 机器人详情页面
机器人管理列表点击"查看"直接跳转到机器人详情（原"仿真"页），默认选择列表中点击的机器人。详情页面展示硬件型号、车控型号、软件型号、自控板型号、挂件型号等"关于本机"信息，以及俯视结构图标注关键巡检对象。

- **source_id**: scan-codex-019d65be-cf98-7bc0-82fe-50f943761282
- **path**: active/sessions/session-codex-019d65be-cf98-7bc0-82fe-50f943761282.md
- **quote**: "机器人仿真页面建议更名为《详情》...新增机器人版本与型号信息展示"
- **locator**: Turn 7, Turn 8, Turn 9
- **可信度**: Strong
- **状态**: confirmed

## fact_014 — 边巡边检页面
边巡边检（`implementation/dispatch/edge-inspection`）分为安全行为边巡边检和气体分析边巡边检两块，历史数据以地图为背景展示热力分布（瓦片热力图）。

- **source_id**: scan-codex-019e0b90-b0fa-7273-b52e-97d5f7629e2c
- **path**: active/sessions/session-codex-019e0b90-b0fa-7273-b52e-97d5f7629e2c.md
- **quote**: "分为两块，一块是安全行为的边训边检，一个是气体分析的边训边检...地图上用瓦片热力"
- **locator**: Turn 5, Turn 7
- **可信度**: Strong
- **状态**: confirmed

## fact_015 — 通知配置
通知配置包含短信内容模板配置项，与调度配置页面风格保持一致。

- **source_id**: scan-codex-019e0b90-b0fa-7273-b52e-97d5f7629e2c
- **path**: active/sessions/session-codex-019e0b90-b0fa-7273-b52e-97d5f7629e2c.md
- **quote**: "缺少一个内容，可能就一个配置的短信内容"
- **locator**: Turn 4
- **可信度**: Strong
- **状态**: confirmed

## fact_016 — 调度台页面整合
管理端调度台由原 5 个独立子页面（自动调度、冲突处理、调度干预、调度记录、临时调度）整合为统一控制台（Console.vue），通过 Tab 或面板切换不同调度功能。

- **source_id**: commit-5ce0c97
- **path**: src/views/management/dispatch/Console.vue
- **quote**: "Remove redundant dispatch sub-pages...consolidate dispatch pages"
- **locator**: commit 5ce0c97 message
- **可信度**: Strong
- **状态**: confirmed

## fact_017 — 任务管理子页面
巡检任务管理新增三个子页面：执行轨迹（`/management/task/trace/:id`）、检查结果（`/management/task/result/:id`）、任务复盘（`/management/task/review/:id`），分别对应 ExecutionTrace、CheckResult、TaskReview 组件。

- **source_id**: commit-5ce0c97
- **path**: src/views/management/task/
- **quote**: "enhance task management"
- **locator**: commit 5ce0c97 message
- **可信度**: Strong
- **状态**: confirmed

## fact_018 — RobotStatus 枚举定义
在 `src/types/robot.ts` 中定义了 RobotStatus 枚举，用于统一机器人状态表示，支持机器人详情页面和列表页面的状态展示。

- **source_id**: commit-5ce0c97
- **path**: src/types/robot.ts
- **quote**: "Add RobotStatus enum and robot type definitions"
- **locator**: commit 5ce0c97 message
- **可信度**: Strong
- **状态**: confirmed

## fact_019 — 检测规则状态统一
检测项配置相关页面（DetectionItemConfig、ComponentUsage、FacilityDeviceForm、ObjectDetectionConfig）的状态处理逻辑已统一，确保状态枚举和交互行为跨页面一致。

- **source_id**: commit-e7ff351
- **path**: src/views/implementation/detection-item-config/, src/views/inspection/device/
- **quote**: "Unify detection rule status"
- **locator**: commit e7ff351 message
- **可信度**: Strong
- **状态**: confirmed
