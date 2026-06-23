# 实施方案 — 7月迭代（调度引擎深化与边巡边检升级）

**关联 PRD**: `docs/prd/2026-06-23-7y-iteration-prd.md`（GitHub Issue #1，标签 `ready-for-agent`）
**关联 ADR**: `docs/adr/0001` ~ `docs/adr/0023`
**领域词汇**: 根目录 `CONTEXT.md`
**项目定位**: Vue 3 + Pinia + localStorage mock 的原型 SPA，无后端、零测试基建
**迭代周期**: 4 周（W1~W4）

---

## 0. 实施总览

### 0.1 节奏与里程碑

| 周 | 模块 | 关键交付 | 验收信号 |
|---|---|---|---|
| W1 | 横向基建 + 模块二地基 | 测试基建 + 状态机 8 态 + 任务对象统一 + 计划解耦 + 审计日志接口位 | `npm run test` 跑通 store 行为测试；调度台 8 态可流转 |
| W1 末~W2 | 模块二调度引擎 | 资源池升格 + 调度规则配置扩展 + 抢占分级 + 第三方系统模拟页 + 作业票联动 + 人员核对 + 机会事件重定义 | 作业票按钮一键贯通至异常处置 |
| W2 末~W3 | 模块四路网底座 + 模块三边巡边检 | 导航点统一迁移 + 路段运行策略/云台扫描/倒车模板 + 看门狗 + 充电点风险监控 + 调度台执行端联动 | 路网管理页路段编辑可配 8 字段；调度台可触发网络抖动 mock |
| W3 末~W4 | 模块五资产管理 + 模块六 AI + 收尾 | 维保台账梯度弹窗 + 故障接管可视化 + 远程校准 + 大模型兜底 + AI 智库两页面 | 控制台可跳 AI 问答；接管动画可见 |

### 0.2 优先级与依赖链

```
P0（必做、阻塞后续）:
  测试基建 → 状态机 8 态 → 任务对象统一 → 计划解耦 → 审计日志接口位
P1（依赖 P0）:
  资源池升格 → 调度规则配置扩展 → 抢占分级 → 第三方系统模拟页 → 作业票联动 → 人员核对
  导航点统一迁移（独立可并行，不依赖模块二）→ 路段运行策略 → 看门狗 → 云台扫描 → 倒车模板 → 充电点风险监控 → 边巡边检执行端联动
P2（依赖 P1）:
  维保台账梯度弹窗 → 故障接管可视化 → 远程校准
  大模型兜底 → AI 智库两页面 → 控制台跳 AI 问答
```

关键并行点：**模块四导航点统一迁移**与**模块二调度引擎**无强依赖，可分两人并行；其余按依赖链串行。

### 0.3 风险与对策

| 风险 | 概率 | 影响 | 对策 |
|---|---|---|---|
| `Waypoint` → `NavigationPoint` 迁移涉及多处引用，遗漏致运行时错 | 中 | 高 | ADR 0002 已要求实现前全量 grep 扫描列迁移清单；加迁移单测兜底 |
| 状态机从 6 态扩到 8 态，`terminateTask` 现错挂 CANCELLED | 高 | 中 | 先改枚举 + terminate 对接 TERMINATED + 全局搜 `CANCELLED` 复核 |
| `RoadSegment` 已有 `allowReverse`/`allowUTurn` 布尔，要迁移为模板枚举 | 中 | 中 | 迁移脚本按 `reverseRequired`/`turnAroundRequired` 双布尔映射到 5 模板之一 |
| DispatchCenter.vue 已 970 行硬编码 mock，改动易出回归 | 高 | 中 | 拆分前先补 store 行为测试锁外部行为，再渐进重构 |
| 零测试基建，W1 同时起步基建 + 业务，可能拖慢 | 中 | 中 | 测试基建只建最小可跑骨架（Vitest + Vue Test Utils），不追求覆盖率 |
| 路网管理页 2186 行巨型组件，加字段易冲突 | 中 | 中 | 优先用既有"路段编辑抽屉"扩展字段，不重构页面结构 |

---

## 1. 模块实施详案

### 1.1 横向基建（W1 上半，P0）

#### 1.1.1 测试基建

**目标**: 项目零测试 → 跑通最小可执行测试骨架。

**改动**:
- `package.json` 加 devDeps: `vitest`、`@vue/test-utils`、`jsdom`、`@vitest/coverage-v8`
- 加 `vitest.config.ts`（environment: jsdom，alias `@` → `./src`，include `src/**/*.{test,spec}.ts`）
- 加 `src/test/setup.ts`（mock `localStorage`、mock `window.matchMedia` 等 AntD 依赖）
- `package.json` scripts 加 `"test": "vitest"`、`"test:run": "vitest run"`、`"test:coverage": "vitest run --coverage"`
- 写 1 个冒烟测试 `src/stores/inspection.test.ts`（验证 `fetchAllInspectionPoints` 能从 MockService 读到数据）

**验收**: `npm run test:run` 通过，CI（GitHub Actions）加 test 步骤。

#### 1.1.2 审计日志接口位（ADR 0023）

**目标**: 关键操作留痕到 localStorage，不建查看页。

**改动**:
- `src/types/audit.ts`（新建）:
  ```ts
  export interface AuditLogEntry {
    id: string
    action: 'preempt' | 'terminate' | 'takeover' | 'calibrate'
    operator: string
    targetId: string
    targetType: 'task' | 'robot'
    beforeValue?: unknown
    afterValue?: unknown
    reason?: string
    createdAt: string  // ISO
  }
  ```
- `src/utils/audit.ts`（新建）: `writeAuditLog(entry: Omit<AuditLogEntry, 'id' | 'createdAt'>)`，写入 localStorage key `audit-log`（数组追加）
- `MockService` 加 `getAuditLogs()` / `saveAuditLog()` 便于后续查看页对接

**验收**: 单元测试验证写入读回一致；后续模块二/五调用 `writeAuditLog` 即可。

---

### 1.2 模块二：调度引擎与任务中心（W1 下半 ~ W2，P0/P1）

#### 1.2.1 任务状态机 8 态（ADR 0008）— P0

**现状**: `InspectionTaskInstanceStatus` 6 态（PENDING/RUNNING/COMPLETED/PAUSED/CANCELLED/FAILED），`terminateTask` 错误地把终止置为 `CANCELLED`。

**改动**:
- `src/types/inspection.ts` 扩展枚举:
  ```ts
  export enum InspectionTaskInstanceStatus {
    PENDING = 'pending',
    RUNNING = 'running',
    COMPLETED = 'completed',
    PAUSED = 'paused',           // 自动可恢复
    PROCESSING = 'processing',   // 待处理：必须人工裁决（正式化现状 auto_pending 字面量）
    CANCELLED = 'cancelled',     // 已取消（计划撤销等）
    TERMINATED = 'terminated',   // 已终止：执行中强制终止带审计
    FAILED = 'failed'
  }
  ```
- `src/stores/inspection.ts`:
  - `terminateTask` 改为置 `TERMINATED`（不再置 CANCELLED），调用前 `writeAuditLog({ action: 'terminate', ... })`
  - `deleteTask` 标记 `@deprecated`，函数体改为 no-op + console.warn（不立即物理删除，留过渡期）
- 全局搜 `auto_pending` 字面量（主要在 `DispatchCenter.vue` / `DispatchBoardColumns.vue`），映射为 `processing` 状态
- 加状态机流转单测：`pending→running→completed`、`running→paused→running`、`running→processing→running`、`running→terminated`、`running→failed`

**验收**: `npm run test:run` 状态机流转测试全绿；调度台任务卡显示 8 态徽标正确。

#### 1.2.2 任务对象统一（ADR 0003）— P0

**现状**: `InspectionTask` 与 `InspectionTaskInstance` 两套并存，`InspectionTask.taskSource` 字段已埋但未启用。

**改动**:
- `InspectionTaskInstance` 标记 `@deprecated`，迁移期内不再新增实例，只在读取兼容时用
- `InspectionTask` 已有 `taskSource`/`businessScene`/`priorityLevel`/`thirdPartyTaskNo`/`interruptsCurrentTask` 字段，启用到 UI:
  - `taskSource` 默认 `'execution_plan'`（计划派生）或 `'manual'`（手动）
  - 任务列表/调度台按 `taskSource` 显示来源徽标（计划派生/调度插入/自动复核/作业票/第三方/紧急/手动）
- MockService 加 `getTaskInstances` 兼容读取，但 `saveTaskInstance` 弃用
- 单测验证：创建任务带 `taskSource`，读取回来源字段正确

**验收**: 任务列表不再出现独立的"计划派生实例"Tab；所有任务统一在 `InspectionTask` 一套对象下。

#### 1.2.3 计划解耦机器人（ADR 0004）— P0

**现状**: `InspectionPlan.robotId` 为必填 string。

**改动**:
- `InspectionPlan.robotId`: `string` → `string | undefined`（可选）
- `InspectionPlanFormData` 同步改
- `views/inspection/plan/InspectionPlanForm.vue`:
  - "执行机器人"字段改为可选（去除必填校验），加提示"留空由调度引擎自动派车"
  - 启用已埋点的"业务场景"/"风险等级"/"关联规则"字段到 UI（下拉选择）
- MockService `saveInspectionPlan` 兼容 robotId 为空
- 派生任务时若计划 robotId 为空，任务 robotId 留空，由调度引擎派车阶段填充

**验收**: 创建计划不选机器人可保存；调度台看到该计划派生任务 robotId 为空待派。

#### 1.2.4 资源基础配置页升格（ADR 0006）— P1

**现状**: `ResourceBaseConfig.vue` 345 行，仅"区域→优先机器人"配置。

**改动**:
- 类型扩展 `src/types/dispatch.ts`（新建或并入既有调度类型）:
  ```ts
  export interface DispatchResourcePool {
    id: string
    areaId: string
    preferredRobotIds: string[]        // 软偏好候选池
    disabledTimeWindows: { robotId: string; start: string; end: string; reason?: string }[]
    robotTypeWhitelist: { robotType: string; allowedAreaIds: string[] }[]
  }
  ```
- `ResourceBaseConfig.vue` 在既有"区域→优先机器人"基础上加两个 Tab/区块:
  - "机器人禁用时段"（按机器人配时间段）
  - "机型兼容白名单"（机型→允许区域）
- MockService 加 `getDispatchResourcePools` / `saveDispatchResourcePool`
- 派车排序逻辑（在调度引擎实现）: 先查区域候选池 → 池内按就近+电量+负载排序 → 池空溢出到外区域空闲机器人

**验收**: 资源基础配置页可见三个配置区；单测验证派车排序优先池内机器人。

#### 1.2.5 调度规则配置页扩展（ADR 0005）— P1

**现状**: `DispatchRuleConfig.vue` 321 行，已有部分规则配置。

**改动**:
- 新增"疲劳段频次与优先级控制"配置区（时间段调度矩阵: 时间段→频次倍率→优先级升格）
- 选车规则统一挂此页（从计划页移除散落的选车配置）
- 类型扩展: `DispatchRule` 加 `fatigueSegments: { timeRange: string; frequencyMultiplier: number; priorityBoost: 'none' | 'high' | 'emergency' }[]`
- MockService 持久化

**验收**: 调度规则配置页可配疲劳段；调度引擎读规则在疲劳段自动加密巡检。

#### 1.2.6 抢占分级授权（ADR 0007）— P1

**改动**:
- `src/utils/dispatch-engine.ts`（新建调度引擎核心）:
  - `preemptTask(targetTask, reason, authLevel)`: 紧急到场/作业票监护自动抢占无需确认；抢占后强制弹审计表单 → `writeAuditLog({ action: 'preempt', ... })`
  - 机会事件已移出抢占分支（见 1.2.9）
- DispatchCenter 加抢占审计弹窗组件（操作人/原因/前后值）
- 单测: 验证自动抢占触发 + 审计写入

**验收**: 自动抢占场景任务被挂起 + 审计日志可见记录。

#### 1.2.7 第三方系统模拟页（ADR 0009）— P1

**改动**:
- 新建 `views/management/system/ThirdPartySimulator.vue`（放管理端系统设置菜单下）
- 路由 `/management/system/third-party-simulator`
- 页面含按钮:
  - "推送作业票"（mock 作业票数据含允许作业人员名单）
  - "推送现场人员识别结果"（mock 人脸/安全帽/行为识别）
- 点击"推送作业票" → 调度引擎 `insertWorkTicketTask(workTicket)`:
  - 拆为临时最高优先级区域监护任务（taskSource: 'work_ticket'）
  - DAG 强插挂起日常巡检（被挂起任务置 `paused`）
- MockService 加 `getWorkTickets` / `saveWorkTicket`（含 allowedPersonnel 字段）

**验收**: 点击按钮后调度台出现新作业票任务 + 日常巡检被挂起。

#### 1.2.8 监护作业人员核对（ADR 0011）— P1

**改动**:
- 第三方模拟页"推送现场人员识别结果"按钮 → mock 识别结果（人员列表+识别类型）
- 调度引擎 `verifyPersonnel(taskId, recognizedPersonnel)`:
  - 比对作业票 `allowedPersonnel` 名单
  - 不匹配即生成异常告警走异常处置流程（复用既有 ExceptionLog 机制）
- 任务详情页（`InspectionTaskDetail.vue`）加"现场人员核对"区块: 显示作业票允许名单 + 识别结果 + 比对状态

**验收**: 推送不匹配人员后异常中心出现告警条目。

#### 1.2.9 机会事件重定义（ADR 0010）— P1

**改动**:
- 明确: 路过时新发现隐患 → 告警走异常处置；无隐患静默；**不**触发"建议路径优化"和"主动监护任务"
- 调度引擎不加机会事件分支
- 文档化: 在 `CONTEXT.md` 和 ADR 0010 已固化

**验收**: 无新增调度路径；路过隐患仅在异常中心可见。

---

### 1.3 模块四：运行策略与路网底座（W2 末 ~ W3，P1）

> 模块四排在模块三前实施，因为模块三的边巡边检执行端联动依赖路段级配置。

#### 1.3.1 导航点统一迁移（ADR 0002）— P0（模块四内）

**现状**: `Waypoint`（轻量导航点，inspection.ts L335）与 `NavigationPoint`（路网管理页导航点，road-network.ts L170）并存。已知引用点:
- `InspectionPoint.waypointId`（L754）
- `InspectionPointFormData.waypointId`（L799）
- `InspectionRoute.waypointIds`（L361）
- `InspectionRouteFormData.waypointIds`（L372）
- `InspectionTaskSnapshot.route.waypointIds`（L590）
- `MockService.getWaypoints` / `getWaypointsByMapId` / `saveWaypoint` / `deleteWaypoint`
- `stores/inspection.ts` 的 `fetchAllWaypoints` 等

**改动**:
- 实现前全量 `grep -r "waypointId\|Waypoint\|getWaypoints\|saveWaypoint"` 列迁移清单（ADR 0002 已要求）
- `InspectionPoint.waypointId` → `navPointId`（引用 `NavigationPoint.id`）
- `InspectionRoute.waypointIds` → `navPointIds`
- `InspectionTaskSnapshot.route.waypointIds` → `navPointIds`
- MockService 加 `getNavigationPoints` 兼容读，废弃 `getWaypoints`（标记 deprecated，内部转调 getNavigationPoints）
- `migrations.ts` 加迁移: 把既有 `waypoints` 数据迁到 `navigationPoints`，`waypointId` 字段重映射
- 单测验证迁移前后数据等价

**验收**: 全局无 `Waypoint` 类型引用（除 deprecated 兼容层）；巡检点/路线引用导航点正确。

#### 1.3.2 路段运行策略三项（ADR 0014）— P1

**现状**: `RoadSegment` 已有 `speedLimit`，缺心跳频率/语音提醒。

**改动**:
- `RoadSegment` 加字段:
  ```ts
  heartbeatIntervalMs?: number   // 100~10000ms，空则用机器人默认
  voiceReminder?: {
    type: 'none' | 'approach_hazard' | 'narrow_road' | 'restricted_area' | 'custom'
    content?: string  // custom 时填
  }
  ```
- `views/map/RoadNetwork.vue` 的路段编辑抽屉加这两字段表单
- MockService 持久化

**验收**: 路段编辑可配心跳/语音；机器人驶入路段下发策略时读取（mock）。

#### 1.3.3 看门狗时效锁（ADR 0015）— P1

**改动**:
- `RoadSegment` 加字段:
  ```ts
  watchdogAction?: 'decelerate' | 'emergency_stop'  // 触发动作，路段可配
  // 阈值固定 0.3~0.4s 只读外显，不入 RoadSegment（常量）
  ```
- `src/constants/safety.ts`（新建）: `WATCHDOG_TIMEOUT_MS = 350`（取中值），常量不可配
- `RoadNetwork.vue` 路段编辑: 看门狗阈值只读展示 "0.3~0.4 秒（固定）" + 触发动作下拉
- DispatchCenter 加"模拟网络抖动"按钮 → mock 触发看门狗 fallback → 按路段 watchdogAction 执行降速/紧急停车（mock 状态变化）

**验收**: 路段编辑可见只读阈值 + 可配动作；调度台按钮触发 mock fallback。

#### 1.3.4 倒车动作模板（ADR 0017）— P1

**现状**: `RoadSegment.allowReverse`/`allowUTurn`/`allowSpin` 三个布尔字段。

**改动**:
- `RoadSegment` 加字段:
  ```ts
  reverseActionTemplate?: 'straight_pass' | 'slow_pass' | 'stop_then_straight' | 'reverse_pass' | 'uturn_reenter'
  ```
- 迁移映射（migrations.ts）:
  - `allowReverse=false, allowUTurn=false` → `straight_pass`
  - `allowReverse=false, allowUTurn=true` → `uturn_reenter`
  - `allowReverse=true, allowUTurn=false` → `reverse_pass`
  - 其余 → `straight_pass`（默认）
- 删除 `allowReverse`/`allowUTurn`/`allowSpin` 三个布尔字段（迁移后）
- `RoadNetwork.vue` 路段编辑: 改为单选下拉（5 固定模板），不让自定义

**验收**: 路段编辑见单选模板；迁移后旧数据无丢失。

#### 1.3.5 充电点风险监控（ADR 0016）— P1

**改动**:
- 充电点已在 `NavigationPoint.navType = 'charging'`，确认升格为巡检/风险辨识对象（可关联检测规则）
- 但**不纳入路线编排**（路线编排过滤掉 charging 类型导航点）
- 充电时 mock 监控三项指标（阈值常量，`constants/safety.ts`）:
  - 转换效率 ≥ 80%
  - 输出功率 = 1 kW
  - 实际充电功率 = 800 W
- DispatchCenter 加充电状态监控 mock: 当机器人状态为 `charging` 时展示三项指标，超阈值告警走异常处置

**验收**: 充电中机器人在调度台可见三项指标 mock；超阈值触发异常告警。

#### 1.3.6 路网为拓扑底座（ADR 0001）— P1（文档化为主）

**现状**: `RoadSegment` 已有 `speedLimit`/`segmentType`（等价 roadType）。

**改动**:
- `RoadSegment` 加 `safetyLevel?: 'normal' | 'warning' | 'danger'`（新增字段）
- 文档化: 拓扑属性扩展承载在路网管理页路段上，不再在巡检路线轻量边上扩展
- `WaypointEdge` 标记 deprecated，新数据用 `RoadEdge`

**验收**: 路段编辑可见安全等级字段；路线轻量边不再加拓扑属性。

---

### 1.4 模块三：边巡边检（W3，P1）

#### 1.4.1 路段级云台扫描配置（ADR 0012）

**改动**:
- `RoadSegment` 加字段:
  ```ts
  ptzScan?: {
    enabled: boolean
    scanMode: 'continuous_sweep' | 'back_and_forth' | 'fixed_yaw'
    yawStart: number        // 0~360
    yawEnd: number          // 0~360
    pitchMin: number        // -90~+30（上限防天空聚焦联动避空保护）
    pitchMax: number        // -90~+30
    scanSpeed: number       // 5~60 °/s 防抖动
    height: number          // 0.5~3.0 m
    hazardPointFlag?: boolean
    hazardTypes?: ('leak' | 'temperature_rise' | 'debris' | 'safety_behavior' | 'gas')[]
  }
  ```
- `RoadNetwork.vue` 路段编辑抽屉加"云台扫描策略"折叠面板（8 字段表单，带数值范围校验）
- `EdgeInspection.vue` 保持只读，不改配置

**验收**: 路段编辑可配 8 字段；表单校验数值范围；边巡边检页无配置入口。

#### 1.4.2 执行端联动落调度台（ADR 0013）

**改动**:
- DispatchCenter 加自由巡检模式展示区（按任务 `inspectionMode: 'area'` 区分）:
  - 24 帧/秒抽帧识别流 mock（定时器推 mock 帧到看板）
  - 云台空旷区避空保护留痕（日志条目）
  - 漫游异常即时锚点（不等待任务结束，走异常处置）
- 不新建独立自由巡检执行监控页
- 漫游异常锚点: 调度台地图上即时生成 marker + 异常中心同步告警

**验收**: 调度台自由巡检模式可见抽帧流 mock + 漫游异常锚点即时出现。

---

### 1.5 模块五：资产管理与维保迁移（W4 上半，P2）

#### 1.5.1 组件维保台账补字段+梯度弹窗（ADR 0018）

**现状**: `RobotAttachment`（robot.ts L30）已有基础字段，缺数据化追踪字段。

**改动**:
- `RobotAttachment` 加可选追踪字段（按 category 区分）:
  ```ts
  trackingMetrics?: {
    operationHours?: number        // 激光雷达运行小时数
    chassisFriction?: number       // 底盘行走轴摩擦力
    sealLifeRemainingPct?: number  // 密封圈寿命剩余百分比
    gimbalRotationCount?: number   // 云台旋转次数
    motorLifeRemainingPct?: number // 电机寿命剩余百分比
    batteryCycleCount?: number     // 电池循环次数
    capacityDecayPct?: number      // 容量衰减率
    signalStrength?: number        // 通信信号强度
    reconnectCount?: number        // 重连次数
  }
  ```
- `RobotDetail.vue` 挂载组件 Tab（6 类保持不动）展示追踪字段
- 加"到期梯度弹出框": 按剩余寿命百分比分级
  - ≥30%: 不提示
  - 10%~30%: 预警黄
  - 0%~10%: urgent 橙
  - 0%: 过期红
- 维保项保持扁平，不建树

**验收**: 机器人详情页组件 Tab 可见追踪字段；低于 30% 触发梯度弹窗。

#### 1.5.2 故障接管可视化（ADR 0019）

**改动**:
- DispatchCenter 加"执行无线全量接管"按钮（仅对故障/低电机器人可见）
- 接管流程 mock:
  - 可视化展示断点位置（地图 marker）
  - 迁移过程动画（进度条 + 状态文案）
  - 迁移记录（源机器人/目标机器人/断点位置/数据量/续巡任务 ID）
- 接管完成 → 二号车从断点续巡（新建续巡任务 taskSource: 'auto_recheck'）
- 接管写审计日志 `writeAuditLog({ action: 'takeover', ... })`

**验收**: 接管按钮可见流程动画 + 迁移记录 + 续巡任务生成 + 审计记录。

#### 1.5.3 远程校准（ADR 0019）

**改动**:
- 控制台配置面板（`views/management/dispatch/Console.vue` 或对应配置面板）加"远程一键零位校准"按钮
- mock 流程: 对齐机械绝对零点 + 重载 SLAM 标定文件 → 进度展示 → 留痕 `writeAuditLog({ action: 'calibrate', ... })`

**验收**: 控制台按钮触发 mock 校准进度 + 审计记录。

---

### 1.6 模块六：AI 智能平台对接（W4 下半，P2）

#### 1.6.1 检测项组合不改（ADR 0020）

无需改动。确认现状巡检对象关联多检测规则天然支持组合。

#### 1.6.2 大模型增强作规则兜底（ADR 0021）

**现状**: `views/implementation/detection-item-config/model.ts` 281 行，检测规则表单。

**改动**:
- 检测规则类型加 `llmEnhancement?: { enabled: boolean }`
- `DetectionItemConfigForm.vue` 加"大模型增强"开关（默认关）
- 执行端 mock: 主算法识别失败时由大模型兜底，结果按正常格式返回，备注显示"大模型增强"标识
- 不建独立解释区块

**验收**: 检测规则表单可见开关；开启后执行结果备注可见"大模型增强"。

#### 1.6.3 AI 智库独立两页面（ADR 0022）

**改动**:
- 新建菜单"AI 配置"（放实施端或独立顶层，按菜单分割原则）
- 新建 `views/ai/KnowledgeBase.vue`（知识库管理页）:
  - 列表 + 文件 CRUD（mock 灌入条例/规程/图纸）
  - MockService 加 `getKnowledgeFiles` / `saveKnowledgeFile` / `deleteKnowledgeFile`
- 新建 `views/ai/AIChat.vue`（问答页）:
  - 左侧会话列表（新建 + 历史 CRUD）
  - 右侧对话内容
  - 每条对话带"载体"字段: `{ time: string, device: 'pc' | 'robot', robotId?: string }`
  - MockService 加 `getAIChatSessions` / `saveAIChatSession` / `getAIChatMessages` / `saveAIChatMessage`
- 路由 `/implementation/ai/knowledge-base` 和 `/implementation/ai/chat`
- 控制台语音对讲模块加"切换至 AI 智库"按钮 → 跳转 `/implementation/ai/chat?robotId=xxx&new=1`（载体自动标记机器人）
- 文字输入 mock 语音对话（不接真实 ASR/TTS）

**验收**: AI 配置菜单可见两页面；控制台按钮可跳问答页新建会话；会话载体字段可见。

---

## 2. 测试策略落地

### 2.1 测试 Seams 与优先级（对应 PRD Testing Decisions）

| Seam | 优先级 | 落地时序 | 工具 |
|---|---|---|---|
| Pinia store 行为测试 | P0 | W1 基建 + 各模块随改随加 | Vitest + 测试 Pinia store |
| 组件渲染测试 | P1 | W2 起，关键页面随改随加 | Vue Test Utils + AntD stub |
| 路由测试 | P1 | W2 起 | Vue Router 内存模式 + Vitest |
| 样式/交互测试 | P2 | W4 按需 | Playwright E2E（可选） |

### 2.2 各模块测试重点（对应 PRD）

- **模块二**: 状态机 8 态流转单测、抢占分级触发单测、派车软偏好排序单测、作业票联动集成测试、人员核对告警单测
- **模块三**: 路段云台扫描策略 mock 单测、抽帧识别流 mock 单测、漫游异常锚点生成单测
- **模块四**: 导航点统一迁移单测（迁移前后等价）、路段策略读取下发单测、看门狗 fallback 单测、充电点指标监控单测
- **模块五**: 追踪字段展示渲染测试、梯度弹窗触发单测、接管可视化渲染测试、校准 mock 单测
- **模块六**: 大模型兜底 mock 单测、知识库 CRUD 单测、问答会话载体字段单测

### 2.3 测试纪律

- 只测外部行为不测实现细节
- 不追求覆盖率指标，追求关键路径有测试
- 每个模块改动至少补 1 个单测锁外部行为
- CI（GitHub Actions `.github/workflows/deploy-pages.yml`）加 `npm run test:run` 步骤，失败阻断部署

---

## 3. 数据迁移

`src/mock/migrations.ts` 加迁移版本，按顺序:

1. **迁移 001**: `waypoints` → `navigationPoints`，`waypointId` → `navPointId`（ADR 0002）
2. **迁移 002**: `RoadSegment.allowReverse/allowUTurn/allowSpin` → `reverseActionTemplate`（ADR 0017）
3. **迁移 003**: 任务状态 `auto_pending` 字面量 → `processing`（ADR 0008）
4. **迁移 004**: `InspectionTaskInstance` 数据并入 `InspectionTask`（taskSource: 'execution_plan'）（ADR 0003）

每个迁移写单测验证前后等价。迁移失败不阻断启动，console.warn 并保留旧数据。

---

## 4. 路由与菜单变更

新增路由:
- `/management/system/third-party-simulator` → 第三方系统模拟页（ADR 0009）
- `/implementation/ai/knowledge-base` → 知识库管理页（ADR 0022）
- `/implementation/ai/chat` → AI 问答页（ADR 0022）

菜单调整:
- 管理端"系统设置"菜单下加"第三方系统模拟"
- 实施端"AI 配置"菜单（一级）下挂"知识库管理"和"AI 问答"

---

## 5. 持续集成

`.github/workflows/deploy-pages.yml` 加步骤:
```yaml
- name: Run tests
  run: npm run test:run
- name: Type check
  run: npx vue-tsc --noEmit
- name: Build
  run: npm run build
```

测试失败阻断部署，类型检查失败阻断部署。

---

## 6. 任务拆分建议（可发布为 GitHub Issues）

按依赖链拆分，每个 Issue 一个可独立认领的垂直切片，标签 `ready-for-agent`:

| # | Issue 标题 | 依赖 | 估时 |
|---|---|---|---|
| T1 | 测试基建搭建（Vitest + Vue Test Utils） | 无 | 0.5d |
| T2 | 审计日志接口位（types + utils + MockService） | 无 | 0.5d |
| T3 | 任务状态机 8 态 + terminateTask 修正 + deleteTask 废弃 | T1, T2 | 1d |
| T4 | 任务对象统一（废弃 InspectionTaskInstance） | T3 | 1d |
| T5 | 计划解耦机器人 + 业务场景/风险等级/关联规则 UI 启用 | T4 | 0.5d |
| T6 | 资源基础配置页升格（资源池 + 禁用时段 + 机型白名单） | T5 | 1d |
| T7 | 调度规则配置页扩展（疲劳段 + 选车规则统一） | T6 | 1d |
| T8 | 调度引擎核心（派车排序 + 抢占分级 + 审计） | T6, T7, T2 | 1.5d |
| T9 | 第三方系统模拟页 + 作业票联动 | T8 | 1d |
| T10 | 监护作业人员核对 | T9 | 0.5d |
| T11 | 导航点统一迁移（Waypoint → NavigationPoint） | T1 | 1.5d |
| T12 | 路段运行策略三项（限速/心跳/语音） | T11 | 0.5d |
| T13 | 看门狗时效锁 + 调度台模拟网络抖动按钮 | T12 | 0.5d |
| T14 | 倒车动作模板枚举迁移 | T11 | 0.5d |
| T15 | 充电点风险监控 mock | T12 | 0.5d |
| T16 | 路段级云台扫描配置（8 字段） | T11 | 0.5d |
| T17 | 边巡边检执行端联动落调度台（抽帧/避空/漫游锚点） | T16, T8 | 1d |
| T18 | 组件维保台账补字段 + 梯度弹窗 | T1 | 1d |
| T19 | 故障接管可视化 | T8, T2 | 1d |
| T20 | 远程一键零位校准 | T2 | 0.5d |
| T21 | 大模型增强作规则兜底 | T1 | 0.5d |
| T22 | AI 智库独立两页面（知识库 + 问答） | T1 | 1.5d |
| T23 | 控制台跳 AI 问答按钮 + 载体自动标记 | T22 | 0.5d |

**总计**: ~19 人日（单人），4 周内可完成（含联调收尾）。

可并行点:
- T11（导航点迁移）与 T3~T10（模块二）无依赖，可并行
- T18（维保台账）与模块三/四无依赖，可并行
- T21（大模型兜底）独立，可随时穿插

---

## 7. 验收清单（迭代结束前逐项确认）

- [ ] `npm run test:run` 全绿，CI 集成测试步骤
- [ ] `npx vue-tsc --noEmit` 通过
- [ ] `npm run build` 产物正常
- [ ] 状态机 8 态在调度台/任务列表正确流转
- [ ] 计划创建可不绑机器人，业务场景/风险等级/关联规则 UI 可用
- [ ] 任务对象统一为一套，无独立计划派生实例 Tab
- [ ] 终止任务置 TERMINATED + 审计日志可见，无删除按钮
- [ ] 资源基础配置页可见资源池/禁用时段/机型白名单三区
- [ ] 调度规则配置页可配疲劳段
- [ ] 第三方模拟页按钮可推送作业票/人员识别结果，联动闭环
- [ ] 抢占自动触发 + 审计表单留痕
- [ ] 导航点统一，全局无 Waypoint 业务引用（除 deprecated 兼容层）
- [ ] 路段编辑可配限速/心跳/语音/看门狗动作/倒车模板/云台扫描 8 字段
- [ ] 调度台可模拟网络抖动触发看门狗 fallback
- [ ] 充电点 mock 监控三项指标超阈值告警
- [ ] 调度台自由巡检模式可见抽帧流/避空留痕/漫游锚点
- [ ] 机器人详情页组件 Tab 可见追踪字段 + 梯度弹窗
- [ ] 调度台接管按钮可见流程动画 + 续巡任务
- [ ] 控制台校准按钮可见 mock 进度
- [ ] 检测规则表单可见大模型增强开关
- [ ] AI 配置菜单可见知识库/问答两页面，控制台可跳问答
- [ ] 23 个 ADR 决策均已落地（逐项对照）

---

## 8. 不在本次实施范围（对应 PRD Out of Scope）

- 模块一首页大屏与控制闭环（新项目承接）
- 真实 AI 能力（大模型/ASR/TTS）
- 真实外部系统对接（作业票/EHS）
- 真实 ROS2 参数下发
- 真实网络抖动模拟
- 独立审计日志查看页（属模块一）

---

## 9. 进一步说明

- 本实施方案严格基于 PRD 2026-06-23 与 23 个 ADR，未引入 PRD 之外的决策
- 若实施过程中发现 ADR 决策需修订，走 ADR 修订流程（新增 ADR 或修订原 ADR + 标注 superseded）
- 任务拆分（第 6 节）可直接用 `/to-issues` 发布为 GitHub Issues，每个 Issue 引用对应 ADR
- 实施过程中每个 Issue 完成后更新本方案的验收清单（第 7 节）
