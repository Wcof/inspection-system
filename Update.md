# 系统更新日志

## 检测对象页面 Mock 数据清理 & 树结构关联修复

### 问题描述

检测对象页面（`implementation/metric/list`）存在以下问题：
1. 左侧树结构第4层（部件）永远为空 — `initialFacilityComponents` 作为独立数组存在，但从未接入 `InspectionDevice.assetComponents`
2. `initialMetrics`（7条）和 `initialMonitorPoints`（5条）是旧数据模型残留，无 Vue 组件直接使用
3. `InspectionDeviceCheckItem` 缺少 `subjectId` 字段，无法将检测项关联到具体部件

### 修改内容

#### 类型变更（`src/types/inspection.ts`）
- `InspectionDeviceCheckItem` 接口新增 `subjectId?: string` 字段

#### Mock 数据清理（`src/mock/initialData.ts`）
- 删除 `initialMetrics`（7条 Metric 对象）和 `initialMonitorPoints`（5条 MonitorPoint 对象）
- 删除 metrics→monitorPoints、monitorPoints→inspectionPoints 的 wiring 代码
- 为全部 7 条 check item 添加 `subjectId` 字段，关联到对应部件（fc-001 ~ fc-005）
- 新增 FacilityComponent → `InspectionDevice.assetComponents` wiring 逻辑

#### Mock 服务清理（`src/mock/mockService.ts`）
- 移除 `initialMonitorPoints` 和 `initialMetrics` 的 import 和 localStorage seeding

### 涉及文件
- `src/types/inspection.ts`
- `src/mock/initialData.ts`
- `src/mock/mockService.ts`

---

## 路线规划组件改造

### 问题描述

巡检计划表单中的路线规划组件（`PlanRouteCanvas`）存在以下问题：
1. 右侧途经点列表与地图交互重复，占用空间
2. 地图上途经点默认绿色，视觉上无法区分"已连接"和"未连接"
3. 路线不允许重复选择同一点位，无法规划来回路线

### 修改内容

#### 移除右侧侧边栏（`src/views/inspection/plan/PlanRouteCanvas.vue`）
- 删除途径点列表、巡检点列表、路线顺序三个 section 的 DOM
- 删除所有侧边栏相关 CSS（`.plan-route-canvas__sidebar-*`）
- 删除仅侧边栏使用的 `routeSequence` computed
- 地图画布改为全宽显示

#### 途经点颜色调整
- **未连接**：途经点和巡检点均为灰色（`#bfbfbf`）
- **已连接到路线**：途经点绿色（`#52c41a`），巡检点橙色（`#fa8c16`）
- 移除入路线后的透明度降低效果
- 路线连线、序号标记、绘制临时线统一改为绿色

#### 支持来回路线
- 移除 `appendToRoute()` 中的重复点位检查
- 同一个点可以被多次选择（如 A→B→C→B→A）

### 涉及文件
- `src/views/inspection/plan/PlanRouteCanvas.vue`

---

## 机器人数据迁移功能

### 功能描述
新增了机器人数据迁移功能，支持以下场景：

1. **直接迁移**：将一个机器人的任务和配置直接迁移到另一个机器人
2. **导出迁移包**：将机器人的配置、任务和历史数据导出为 JSON 格式的迁移包
3. **导入迁移包**：将迁移包导入到新的机器人中

### 使用方式

#### 1. 直接迁移
1. 在机器人列表中，点击目标机器人的「迁移」按钮
2. 选择「直接迁移到其他机器人」选项
3. 从下拉菜单中选择目标机器人
4. 点击「确定」按钮完成迁移

#### 2. 导出迁移包
1. 在机器人列表中，点击源机器人的「迁移」按钮
2. 选择「导出为迁移包」选项
3. 选择需要导出的内容（任务、配置、历史数据）
4. 点击「确定」按钮，系统会生成并下载迁移包文件

#### 3. 导入迁移包
1. 在机器人列表页面，点击「导入数据」按钮
2. 选择目标机器人
3. 上传迁移包文件
4. 选择导入选项（覆盖现有数据或合并数据）
5. 点击「确定」按钮完成导入

### 技术实现

#### 数据结构
迁移包采用 JSON 格式，包含以下内容：
- 机器人基本信息
- 导出时间
- 导出内容类型
- 具体数据（配置、任务、历史数据）

#### 核心功能
- 任务迁移：将源机器人的任务重新分配给目标机器人
- 配置迁移：迁移电池阈值、连接配置、异常策略等
- 历史数据迁移：迁移任务执行结果数据

### 注意事项
- 迁移过程中请确保目标机器人处于在线状态
- 导入时请确保迁移包文件格式正确
- 建议在迁移前备份重要数据

### 版本信息
- 版本：1.0.0
- 发布日期：2026-04-05
- 影响模块：机器人管理、任务管理

---

## 表单必填字段 `required` 标识补全

### 问题描述

全面扫描项目中所有表单页面后，发现部分基础信息字段（名称、编码等）缺少 Ant Design Vue 的 `required` 属性（红色 `*` 必填标识），导致用户无法直观区分必填与选填字段，且可提交空白值。

### 修改内容

#### 1. 路网管理（`src/views/map/RoadNetwork.vue`）

右侧属性面板共 9 个基础信息字段补上 `required`：

| 属性面板 | 字段 | 行号 |
|----------|------|------|
| 路段属性 | 路段名称 | 第276行 |
| 路段属性 | 路段编码 | 第277行 |
| 路口属性 | 路口名称 | 第329行 |
| 路口属性 | 路口编码 | 第330行 |
| 点位属性 | 点位名称 | 第369行 |
| 点位属性 | 点位编码 | 第370行 |
| 区域属性 | 区域名称 | 第425行 |
| 区域属性 | 区域编码 | 第426行 |
| 节点-路口属性 | 路口编码 | 第493行 |

#### 2. 巡检点详情（`src/views/inspection/InspectionPointDetail.vue`）

| 字段 | 行号 | 说明 |
|------|------|------|
| 巡检区域 | 第74行 | 同表单中"点位名称""点位编码""业务类型"均有 required，此处保持一致 |

#### 3. 区域管理（`src/views/map/AreaManage.vue`）

| 属性面板 | 字段 | 行号 | 说明 |
|----------|------|------|------|
| 编辑属性面板 | 区域名称 | 第175行 | 新建弹窗中同字段已有 required，编辑模式保持一致 |

### 涉及文件

- `src/views/map/RoadNetwork.vue`
- `src/views/inspection/InspectionPointDetail.vue`
- `src/views/map/AreaManage.vue`
