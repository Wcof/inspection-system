# 安全生产巡检任务管理系统 - 实现计划（完整版）

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个基于 Vue 3 的纯前端安全生产巡检任务管理 Web 系统，实现机器人管理与巡检管理两大核心功能模块。包含：
- 机器人配置与管理
- 设施设备分类维护
- 设施设备库管理
- 巡检路线分类维护
- 巡检点、监测指标管理
- 巡检任务创建与路径规划
- 完善的异常处理策略（巡检点故障、机器人故障、电量不足等场景处理

**重要说明：**
- **纯前端方案**：本项目为纯前端实现，不涉及后端开发
- **Mock 数据**：所有数据由前端自行模拟，使用 localStorage 持久化存储
- **模拟通信**：机器人通信通过定时器和随机事件模拟，不涉及真实 WebSocket 连接

**Architecture:** 采用 Vue 3 Composition API + TypeScript + Pinia 状态管理 + Vue Router 的标准架构。纯前端实现，所有数据通过 Mock Service 模拟。页面布局采用左侧导航 + 右侧内容区的经典管理后台布局。

**Tech Stack:** Vue 3、TypeScript、Pinia、Vue Router、Ant Design Vue、localStorage

**UI 组件库约束：**
- **强制使用 Ant Design Vue**：所有 UI 组件必须使用 Ant Design Vue 组件库
- **禁止使用其他组件库**：不得混用 Element Plus、Vant 等其他组件库
- **设计风格**：遵循 Ant Design 设计规范，保持界面风格统一

---

## Ant Design Vue 使用规范

### 强制约束

**必须遵守：**
- ✅ **强制使用 Ant Design Vue**：所有 UI 组件必须使用 Ant Design Vue 组件库
- ✅ **禁止混用其他组件库**：不得使用 Element Plus、Vant、Naive UI 等其他组件库
- ✅ **遵循 Ant Design 设计规范**：保持界面风格统一，使用 Ant Design 的配色、字体、间距规范

### 常用组件对照表

| 功能 | Element Plus | Ant Design Vue |
|------|-------------|----------------|
| 按钮 | `<el-button>` | `<a-button>` |
| 表格 | `<el-table>` + `<el-table-column>` | `<a-table>` + `<a-table-column>` |
| 表单 | `<el-form>` + `<el-form-item>` | `<a-form>` + `<a-form-item>` |
| 输入框 | `<el-input>` | `<a-input>` |
| 选择器 | `<el-select>` + `<el-option>` | `<a-select>` + `<a-select-option>` |
| 开关 | `<el-switch v-model="value">` | `<a-switch v-model:checked="value">` |
| 标签 | `<el-tag type="success">` | `<a-tag color="green">` |
| 卡片 | `<el-card>` | `<a-card>` |
| 对话框 | `<el-dialog>` | `<a-modal>` |
| 消息提示 | `ElMessage.success()` | `message.success()` |
| 通知 | `ElNotification()` | `notification.open()` |
| 布局 | `<el-row>` + `<el-col>` | `<a-row>` + `<a-col>` |
| 空状态 | `<el-empty>` | `<a-empty>` |
| 图标 | `@element-plus/icons-vue` | `@ant-design/icons-vue` |

### 关键差异说明

#### 1. 数据绑定
```vue
<!-- Element Plus -->
<el-switch v-model="value" />
<el-input v-model="value" />

<!-- Ant Design Vue -->
<a-switch v-model:checked="value" />
<a-input v-model:value="value" />
```

#### 2. 表格使用
```vue
<!-- Element Plus -->
<el-table :data="tableData">
  <el-table-column prop="name" label="名称" />
  <el-table-column label="操作">
    <template #default="{ row }">
      {{ row.name }}
    </template>
  </el-table-column>
</el-table>

<!-- Ant Design Vue -->
<a-table :data-source="tableData" :pagination="false">
  <a-table-column title="名称" data-index="name" />
  <a-table-column title="操作">
    <template #default="{ record }">
      {{ record.name }}
    </template>
  </a-table-column>
</a-table>
```

#### 3. 消息提示
```typescript
// Element Plus
import { ElMessage } from 'element-plus'
ElMessage.success('操作成功')

// Ant Design Vue
import { message } from 'ant-design-vue'
message.success('操作成功')
```

#### 4. 图标使用
```vue
<!-- Element Plus -->
<script setup>
import { Refresh } from '@element-plus/icons-vue'
</script>

<template>
  <el-button>
    <el-icon><Refresh /></el-icon>
    刷新
  </el-button>
</template>

<!-- Ant Design Vue -->
<script setup>
import { ReloadOutlined } from '@ant-design/icons-vue'
</script>

<template>
  <a-button>
    <template #icon>
      <ReloadOutlined />
    </template>
    刷新
  </a-button>
</template>
```

#### 5. 标签颜色
```vue
<!-- Element Plus -->
<el-tag type="success">成功</el-tag>
<el-tag type="danger">危险</el-tag>
<el-tag type="warning">警告</el-tag>
<el-tag type="info">信息</el-tag>

<!-- Ant Design Vue -->
<a-tag color="green">成功</a-tag>
<a-tag color="red">危险</a-tag>
<a-tag color="orange">警告</a-tag>
<a-tag color="blue">信息</a-tag>
```

#### 6. 卡片插槽
```vue
<!-- Element Plus -->
<el-card>
  <template #header>
    <span>标题</span>
  </template>
  内容
</el-card>

<!-- Ant Design Vue -->
<a-card title="标题">
  内容
</a-card>

<!-- 或者 -->
<a-card>
  <template #title>
    <span>标题</span>
  </template>
  内容
</a-card>
```

### 样式变量对照

```scss
/* Element Plus */
color: var(--el-text-color-primary);      // 主要文字
color: var(--el-text-color-regular);      // 常规文字
color: var(--el-text-color-secondary);    // 次要文字
color: var(--el-text-color-placeholder);  // 占位文字
border: 1px solid var(--el-border-color); // 边框
background: var(--el-fill-color-lighter); // 背景

/* Ant Design Vue */
color: rgba(0, 0, 0, 0.85);  // 主要文字
color: rgba(0, 0, 0, 0.65);  // 常规文字
color: rgba(0, 0, 0, 0.45);  // 次要文字
color: rgba(0, 0, 0, 0.25);  // 占位文字
border: 1px solid #d9d9d9;   // 边框
background: #fafafa;         // 背景
```

### 项目配置

**main.ts 配置：**
```typescript
import { createApp } from 'vue'
import Antd from 'ant-design-vue'
import 'ant-design-vue/dist/reset.css'
import App from './App.vue'

const app = createApp(App)
app.use(Antd)
app.mount('#app')
```

**按需引入（推荐）：**
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'

export default defineConfig({
  plugins: [
    vue(),
    Components({
      resolvers: [
        AntDesignVueResolver({
          importStyle: false, // css in js
        }),
      ],
    }),
  ],
})
```

---

## 系统架构总览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    安全生产巡检任务管理系统（纯前端）                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────┐    ┌────────────────────────────────────────┐ │
│  │ 设施设备管理模块   │    │          智能巡检模块                  │ │
│  ├──────────────────┤    ├────────────────────────────────────────┤ │
│  │ • 机器人管理      │    │ • 巡检统计                            │ │
│  │ • 设施设备分类    │    │ • 巡检任务管理                        │ │
│  │ • 设施设备库      │    │ • 路径规划编辑器                      │ │
│  └──────────────────┘    │ • 异常日志查看                        │ │
│                          └────────────────────────────────────────┘ │
│                              ↑                          ↑                 │
│                              │                          │                 │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                      异常处理策略引擎                        │ │
│  ├─────────────────────────────────────────────────────────────────┤ │
│  │ • 巡检点故障策略      • 机器人故障策略                  │ │
│  │ • 电量不足策略        • 任务中断恢复策略              │ │
│  │ • 信号丢失策略        • 超时处理策略                  │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                              ↑                          ↑                 │
│                              │                          │                 │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │                      Mock 数据服务层                          │ │
│  ├─────────────────────────────────────────────────────────────────┤ │
│  │ • localStorage 持久化存储                                      │ │
│  │ • 模拟机器人状态变化（定时器 + 随机事件）                       │ │
│  │ • 模拟巡检数据采集                                              │ │
│  │ • 模拟异常事件触发                                              │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 最新菜单结构与路由配置

### 一级菜单结构

系统包含两个一级菜单：

1. **设施设备管理**
   - 机器人管理
   - 设备设施分类
   - 设备设施

2. **智能巡检**
   - 巡检统计（新增，用于数据统计）
   - 巡检任务

### 路由配置

```typescript
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/facility/robot'
  },
  {
    path: '/facility',
    name: 'Facility',
    meta: { title: '设施设备管理' },
    children: [
      {
        path: 'robot',
        name: 'Robot',
        component: () => import('../views/robot/RobotList.vue'),
        meta: { title: '机器人管理' }
      },
      {
        path: 'robot/detail/:id',
        name: 'RobotDetail',
        component: () => import('../views/robot/RobotDetail.vue'),
        meta: { title: '机器人详情' }
      },
      {
        path: 'robot/form/:id?',
        name: 'RobotForm',
        component: () => import('../views/robot/RobotForm.vue'),
        meta: { title: '机器人编辑' }
      },
      {
        path: 'device/category',
        name: 'DeviceCategory',
        component: () => import('../views/inspection/device/DeviceCategoryList.vue'),
        meta: { title: '设备设施分类' }
      },
      {
        path: 'device/category/form/:id?',
        name: 'DeviceCategoryForm',
        component: () => import('../views/inspection/device/DeviceCategoryForm.vue'),
        meta: { title: '设备设施分类编辑' }
      },
      {
        path: 'device',
        name: 'FacilityDevice',
        component: () => import('../views/inspection/device/FacilityDeviceList.vue'),
        meta: { title: '设备设施' }
      },
      {
        path: 'device/form/:id?',
        name: 'FacilityDeviceForm',
        component: () => import('../views/inspection/device/FacilityDeviceForm.vue'),
        meta: { title: '设备设施编辑' }
      }
    ]
  },
  {
    path: '/smart-inspection',
    name: 'SmartInspection',
    meta: { title: '智能巡检' },
    children: [
      {
        path: 'statistics',
        name: 'InspectionStatistics',
        component: () => import('../views/smart-inspection/InspectionStatistics.vue'),
        meta: { title: '巡检统计' }
      },
      {
        path: 'task',
        name: 'InspectionTask',
        component: () => import('../views/inspection/InspectionTaskList.vue'),
        meta: { title: '巡检任务' }
      },
      {
        path: 'task/form/:id?',
        name: 'InspectionTaskForm',
        component: () => import('../views/inspection/InspectionTaskForm.vue'),
        meta: { title: '巡检任务编辑' }
      }
    ]
  },
  {
    path: '/inspection/path/:id',
    name: 'PathPlanning',
    component: () => import('../views/inspection/PathPlanningEditor.vue'),
    meta: { title: '路径规划' }
  },
  {
    path: '/inspection/exception',
    name: 'ExceptionLog',
    component: () => import('../views/inspection/ExceptionLogViewer.vue'),
    meta: { title: '异常日志' }
  },
  {
    path: '/inspection/route',
    name: 'InspectionRoute',
    component: () => import('../views/inspection/route/InspectionRouteList.vue'),
    meta: { title: '巡检路线设置' }
  },
  {
    path: '/inspection/route/form/:id?',
    name: 'InspectionRouteForm',
    component: () => import('../views/inspection/route/InspectionRouteForm.vue'),
    meta: { title: '巡检路线设置编辑' }
  },
  {
    path: '/inspection/route/category',
    name: 'RouteCategory',
    component: () => import('../views/inspection/route/RouteCategoryList.vue'),
    meta: { title: '巡检路线分类' }
  },
  {
    path: '/inspection/route/category/form/:id?',
    name: 'RouteCategoryForm',
    component: () => import('../views/inspection/route/RouteCategoryForm.vue'),
    meta: { title: '巡检路线分类编辑' }
  }
]
```

### 重要变更说明

1. **移除了巡检点管理页面**：原来的 `/inspection` 路由已被移除
2. **新增智能巡检模块**：包含巡检统计和巡检任务两个子模块
3. **设施设备管理重构**：将机器人管理、设备设施分类和设备设施整合到一个一级菜单下
4. **巡检统计页面**：新增的数据统计页面，用于展示巡检任务的统计数据

---

## 配置流程总览（新增完善版）

### 整体配置流程图

```
┌─────────────────────────────────────────────────────────────────────┐
│                          系统配置完整流程                              │
├─────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  Step 1: 机器人配置                    Step 2: 设施设备配置           │
│  ┌─────────────────────────┐         ┌─────────────────────────┐    │
│  │ • 基础信息（名称、型号）│         │ • 设施设备分类维护      │    │
│  │ • 三UD配置              │         │ • 设施设备库管理        │    │
│  │   - UUID（唯一标识）    │         │   - 选择设备分类        │    │
│  │   - 三维坐标（x,y,z）  │         │   - 设备详细信息        │    │
│  │   - 用户权限            │         │ • 巡检路线分类维护      │    │
│  │ • 状态模拟配置          │         │ • 巡检点配置            │    │
│  │ • 异常策略配置          │         │   - 选择设施设备        │    │
│  │   - 低电量策略          │         │   - 位置信息            │    │
│  │   - 信号丢失策略        │         │ • 监测指标配置          │    │
│  │   - 机器人故障策略      │         │   - 指标名称            │    │
│  └─────────────────────────┘         │   - 单位                │    │
│              │                       │   - 阈值（min/max）     │    │
│              │                       └─────────────────────────┘    │
│              └──────────────┬────────────────────┘                    │
│                             │                                         │
│  Step 3: 巡检任务创建      │              Step 4: 路径规划          │
│  ┌─────────────────────────▼─────────┐    ┌─────────────────────┐ │
│  │ • 选择机器人                      │    │ • 自动生成路径       │ │
│  │ • 选择巡检点（支持多选）            │    │   - A→B→C 顺序     │ │
│  │ • 设置任务类型（巡检点/边巡边检）   │    │ • 计算各段距离      │ │
│  │ • 配置任务调度                      │    │ • 计算预计时间      │ │
│  │ • 配置任务异常策略                  │    │ • 路径优化          │ │
│  │ • 启动任务（模拟执行）              │    │ • 人工调整          │ │
│  └─────────────────────────┬─────────┘    └──────────┬──────────┘ │
│                            │                           │              │
│  Step 5: 任务执行与监控   │              Step 6: 异常处理         │
│  ┌─────────────────────────▼─────────┐    ┌──────────▼──────────┐ │
│  │ • 模拟机器人状态变化                │    │ • 检测异常类型      │ │
│  │ • 模拟巡检进度                      │    │ • 应用预配置策略    │ │
│  │ • 模拟数据采集                      │    │   - 跳过继续        │ │
│  │ • 模拟异常告警                      │    │   - 重试            │ │
│  └─────────────────────────────────────┘    │   - 返回基站        │ │
│                                              │   - 等待恢复        │ │
│                                              │   - 中止任务        │ │
│                                              └─────────────────────┘ │
│                                                                       │
└─────────────────────────────────────────────────────────────────────┘
```

### 详细配置流程说明

#### 1. 机器人配置（含三UD）

**三UD 定义：**
- **UUID**：机器人唯一标识符
- **三维坐标**：机器人在工厂中的三维位置（x, y, z）
- **用户权限**：操作该机器人的用户权限配置

**配置步骤：**

```
1. 进入机器人管理页面
2. 点击「新增机器人」
3. 填写基础信息：
   - 机器人名称
   - 序列号
   - 型号
4. 配置三UD：
   - UUID：系统自动生成或手动输入
   - 三维坐标：在地图上选择或手动输入 (x, y, z)
   - 用户权限：选择可操作该机器人的用户角色
5. 配置状态模拟参数（纯前端）：
   - 初始电量（默认 80%）
   - 电量消耗速率（默认 1%/分钟）
   - 状态变化概率（用于模拟异常）
6. 配置异常策略：
   - 低电量策略（默认：返回基站）
   - 信号丢失策略（默认：等待恢复）
   - 机器人故障策略（默认：返回基站）
7. 保存配置
```

**机器人状态模拟说明（纯前端）：**

```
状态变化模拟：
- 在线/离线：随机切换，概率可配置
- 充电：电量 < 20% 时自动切换为充电状态
- 巡检中：执行任务时状态为巡检中
- 异常：随机触发，概率可配置

电量模拟：
- 巡检时：按配置的速率消耗电量
- 充电时：按配置的速率恢复电量
- 返回基站：消耗电量但速率较低

位置模拟：
- 执行任务时：按路径逐步移动
- 空闲时：停留在当前位置或基站
- 返回时：沿路径返回基站
```

#### 2. 设施设备配置（多层结构）

**多层结构：设施设备分类 → 设施设备 → 巡检点 → 监测指标**

**设施设备分类说明：**
设施设备分类是对设施设备进行分类管理的树状结构，例如：
- **生产设备**：生产线上的各类设备
- **安全设备**：安全监测、消防设备
- **动力设备**：电力、空调、通风设备
- **仪表设备**：各类监测仪表

**设施设备库说明：**
设施设备库是对具体设备的详细信息进行管理，包括：
- 设备基本信息（编号、名称、分类、规格型号等）
- 设备状态信息（运行状态、维护状态等）
- 设备技术参数（技术指标、性能参数等）
- 设备关联信息（所在区域、使用部门、责任人等）

**巡检路线分类说明：**
巡检路线分类是对巡检路线进行分类管理的树状结构，例如：
- **生产区域**：生产线巡检路线
- **安全区域**：安全设施巡检路线
- **设备区域**：设备集中区域巡检路线

**配置步骤：**

**2.1 设施设备分类维护：**

```
1. 进入设施设备分类管理页面
2. 支持按上级ID和名称进行搜索
3. 点击「添加」按钮新增分类
4. 填写分类信息：
   - 上级ID
   - 名称
   - 备注
5. 保存分类配置
6. 可对分类进行修改、删除操作
```

**2.2 设施设备库管理：**

```
1. 进入设施设备库管理页面
2. 支持按设备编号、设备名称、规格型号、使用部门、出厂厂家、设备类别、设备状态等进行搜索
3. 支持按设备状态（全部、待检修、已失效、即将失效、逾期检修）进行筛选
4. 左侧显示设备分类树，可按分类查看设备
5. 支持批量操作：检测记录导入、维修记录导入、二维码导出、NFC导入、设备导入、设备导出
6. 点击「添加」按钮新增设备
7. 填写设备基本信息：
   - 设备编号 *
   - 设备名称 *
   - 设备分类 *（从下拉选择）
   - 所在区域 *（从下拉选择）
   - 规格型号
   - 使用部门名称（从下拉选择）
   - 责任人 *（从下拉选择）
   - 存放位置
   - 出厂厂家
   - 出厂日期
   - 失效日期
   - 出厂编号
   - 使用证号
   - 发证日期
   - 机构核准证书
   - 系统名称
   - 投用日期
   - 检测周期
   - 最近检测时间
   - 最近检测结论
   - 下次检测时间
   - 检测预警天数
   - 失效预警天数
   - 设备类别 *（从下拉选择）
   - 设备状态（从下拉选择）
   - 保管岗位名称
   - 检查岗位名称
   - NFCID
   - 地图坐标（支持坐标拾点和清除点位）
   - 关联风险单元（是/否）
8. 配置设备属性和测点参数：
   - 设备属性：参数名称、参数值、单位
   - 测点参数：参数名称、参数类型、是否必填、参考值、单位、备注
   - 异常判定设置
   - 相关附件
9. 保存设备配置
10. 可对设备进行修改、详情查看、删除操作
11. 支持查看设备二维码
```

**2.3 巡检路线分类维护：**

```
1. 进入巡检路线分类管理页面
2. 左侧显示路线分类树，可按分类查看路线
3. 支持添加、修改路线分类
4. 右侧显示路线列表，支持按路线名称、路线编号、所在区域、状态进行搜索
5. 路线列表显示：路线名称、路线编号、所属分类、所在区域、启用状态、巡检次数、最近调度时间
6. 可对路线进行修改、删除操作
```

**2.4 巡检路线设置：**

```
1. 进入巡检路线设置页面
2. 点击「添加」按钮新增巡检路线
3. 填写路线基本信息：
   - 路线编号 *
   - 路线名称 *
   - 所在区域 *（从下拉选择）
   - 启用状态 *（从下拉选择）
   - 路线分类 *（从下拉选择）
   - 备注
4. 配置巡检方式：
   - 按班次 / 按周期
   - 调度日期：选择星期几
   - 调度班次：添加班次名称、开始时间、每次时长、结束时间
5. 配置巡检用户：
   - 人员 / 工作组
   - 选择具体人员
6. 添加巡检设备：
   - 点击「添加」按钮选择设备
   - 显示设备名称、设备编码、设备分类、所在区域、设备类别、位置校验
   - 可对设备进行操作
7. 点击「确定」保存路线配置
8. 可对路线进行修改、删除操作
```

**设施设备与巡检路线示例：**

```
示例 1：反应釜设施设备
- 设备名称：1号反应釜
- 设备编号：react-001
- 设备分类：反应釜
- 所在区域：A区
- 设备类别：生产设备
- 责任人：管理员
- 监测指标：
  * 温度
    - 单位：℃
    - 阈值：最小 0，最大 200，警告 150，危险 180
  * 压力
    - 单位：MPa
    - 阈值：最小 0，最大 10，警告 8，危险 9

示例 2：储罐设施设备
- 设备名称：1号储罐
- 设备编号：tank-001
- 设备分类：罐
- 所在区域：沥青机柜间
- 设备类别：生产设备
- 责任人：管理员
- 监测指标：
  * 液位
    - 单位：m
    - 阈值：最小 0，最大 10，警告 8，危险 9
  * 温度
    - 单位：℃
    - 阈值：最小 0，最大 80，警告 60，危险 70

示例 3：巡检路线设置
- 路线名称：A区巡检路线
- 路线编号：route-001
- 所在区域：A区
- 路线分类：加氢巡检
- 启用状态：正常
- 巡检方式：按班次
- 调度日期：周一至周五
- 调度班次：班次1（00:00-23:59）
- 巡检用户：人员（管理员）
- 巡检设备：1号反应釜、1号储罐
```

#### 3. 巡检任务创建与路径规划

**任务创建流程：**

```
1. 进入巡检任务管理页面
2. 点击「创建任务」
3. 填写任务基础信息：
   - 任务名称
   - 任务编码
   - 任务类型（巡检点类型/边巡边检）
4. 选择机器人：
   - 从可用机器人列表中选择
   - 查看机器人状态（在线/离线/充电）
5. 选择巡检点：
   - 从巡检点列表中多选
   - 支持拖拽调整顺序
   - 显示选中巡检点信息（含监测点数量）
6. 配置任务调度（可选）：
   - 开始时间
   - 结束时间
   - 重复周期（分钟/小时/天/周）
7. 配置任务异常策略：
   - 巡检点故障策略
   - 机器人故障策略
   - 低电量策略
   - 信号丢失策略
   - 超时策略
8. 自动生成路径：
   - 系统根据巡检点顺序生成 A→B→C 路径
   - 计算各路径段的距离和预计时间
   - 计算总距离和总预计时间
9. 路径优化（可选）：
   - 最短路径优先
   - 关键点位优先
   - 时间最优
10. 人工调整路径（可选）：
    - 拖拽调整巡检点顺序
    - 编辑路径段
    - 添加备选路径
11. 预览路径
12. 保存任务或启动任务（模拟执行）
```

**路径规划详细说明：**

```
A→B→C 路径规划逻辑：

1. 输入：巡检点列表 [A, B, C]
2. 生成路径段：
   - 路径段 1: A → B
     * 计算 A 到 B 的直线距离
     * 计算预计时间（距离 / 机器人速度）
     * 生成路径中间点（waypoints）
   - 路径段 2: B → C
     * 计算 B 到 C 的直线距离
     * 计算预计时间
     * 生成路径中间点
3. 计算总距离：A→B 距离 + B→C 距离
4. 计算总预计时间：A→B 时间 + B→C 时间 + 各巡检点停留时间
5. 保存完整路径

路径优化策略：
- 最短路径：重新排列巡检点顺序，使总距离最短
- 关键点位优先：优先经过标记为"关键"的巡检点
- 时间最优：综合考虑距离和停留时间
```

**任务模拟执行说明（纯前端）：**

```
模拟执行流程：
1. 点击「启动任务」
2. 系统开始模拟机器人移动：
   - 机器人状态变为"巡检中"
   - 电量开始消耗
   - 位置沿路径逐步移动
3. 到达巡检点：
   - 停留指定时间
   - 模拟采集各监测点的数据
   - 数据在配置的模拟范围内随机生成
   - 判断是否超过阈值，生成告警
4. 完成巡检点：
   - 移动到下一个巡检点
   - 更新进度
5. 模拟异常事件（随机触发）：
   - 低电量：电量低于阈值时触发
   - 信号丢失：随机触发
   - 巡检点故障：随机触发
   - 应用预配置的异常策略
6. 任务完成：
   - 机器人返回基站
   - 状态变为"空闲"或"充电"
   - 生成巡检报告

模拟速度控制：
- 支持 1x、2x、5x、10x 速度
- 支持暂停/继续
- 支持跳过当前巡检点
```

#### 4. 异常策略配置详解

**异常类型与策略矩阵：**

| 异常类型 | 可选策略 | 默认策略 | 说明 |
|---------|---------|---------|------|
| **巡检点故障** | SKIP, RETRY, WAIT_AND_RESUME, RETURN_TO_BASE, ABORT | SKIP | 巡检点无法访问或设备故障 |
| **机器人故障** | RETURN_TO_BASE, WAIT_AND_RESUME, ABORT, NOTIFY | RETURN_TO_BASE | 机器人硬件或软件故障 |
| **低电量** | RETURN_TO_BASE, SKIP_CRITICAL_AND_RETURN, ABORT | RETURN_TO_BASE | 电量低于阈值 |
| **信号丢失** | WAIT_AND_RESUME, RETURN_TO_BASE, ABORT | WAIT_AND_RESUME | 通信信号中断 |
| **任务超时** | SKIP_REMAINING, ABORT, NOTIFY | SKIP_REMAINING | 任务执行时间超过预期 |
| **检测到障碍物** | WAIT_AND_RESUME, RETURN_TO_BASE, ABORT | WAIT_AND_RESUME | 路径上有障碍物 |

**各异常策略详细说明：**

##### 4.1 巡检点故障策略

```
策略：SKIP（跳过继续）
- 描述：跳过当前故障巡检点，继续前往下一个巡检点
- 适用场景：非关键巡检点、时间紧迫、有备用巡检点
- 后续动作：记录异常日志，继续执行任务

策略：RETRY（重试）
- 描述：在指定次数内重试访问巡检点
- 配置：重试次数（默认 3 次）、重试间隔（默认 30 秒）
- 适用场景：临时性故障（如网络抖动）
- 后续动作：重试成功则继续，失败则应用降级策略

策略：WAIT_AND_RESUME（等待恢复）
- 描述：暂停任务，原地等待巡检点恢复
- 配置：最大等待时间（默认 5 分钟）
- 适用场景：可快速恢复的故障
- 后续动作：恢复则继续，超时则应用降级策略

策略：RETURN_TO_BASE（返回基站）
- 描述：终止当前任务，返回基站
- 适用场景：关键巡检点故障、安全风险
- 后续动作：记录异常，返回基站，任务标记为"异常中断"

策略：ABORT（中止）
- 描述：立即中止任务，原地待命
- 适用场景：严重安全风险
- 后续动作：通知人工处理
```

##### 4.2 机器人故障策略

```
策略：RETURN_TO_BASE（返回基站）
- 描述：尝试自主返回基站充电/维修
- 适用场景：轻度故障（如传感器异常）、仍有移动能力
- 后续动作：记录故障日志，返回基站

策略：WAIT_AND_RESUME（等待恢复）
- 描述：原地等待，尝试自动恢复
- 配置：等待时间、自动恢复检查间隔
- 适用场景：可自愈故障（如软件重启）
- 后续动作：恢复则继续，超时则通知人工

策略：ABORT（中止）
- 描述：立即中止，通知人工处理
- 适用场景：严重故障（如无法移动）
- 后续动作：发送紧急告警，记录位置

策略：NOTIFY（仅通知）
- 描述：继续任务，发送告警通知
- 适用场景：非关键警告（如某个传感器数据异常但不影响移动）
- 后续动作：记录告警，继续执行
```

##### 4.3 电量不足策略（分等级）

```
电量 > 30%：
- 策略：继续执行
- 说明：电量充足

电量 20% - 30%：
- 策略：继续执行，发送低电量告警
- 说明：提醒关注电量

电量 10% - 20%：
- 策略：加速完成剩余关键点位后返回
- 配置：可设置"关键点位"列表
- 说明：优先保障关键点位，然后返回

电量 < 10%：
- 策略：立即返回基站
- 说明：危险电量，紧急返回，跳过所有未完成点位

返回逻辑：
1. 计算当前位置到基站的剩余电量是否足够
2. 如果足够，直接返回
3. 如果不够，寻找最近的充电点
4. 记录中断位置和已完成点位
5. 返回后自动充电
6. 充电完成后可选择是否继续未完成任务
```

##### 4.4 信号丢失策略

```
策略：WAIT_AND_RESUME（等待恢复）
- 配置：等待时间（默认 2 分钟）、心跳检查间隔
- 描述：原地等待，尝试重连
- 后续动作：
  * 信号恢复：继续任务，从断点开始
  * 超时：应用备选策略

策略：RETURN_TO_BASE（返回基站）
- 描述：沿原路返回基站
- 说明：预设返航路径，确保安全返回
- 后续动作：返回后等待信号恢复

策略：ABORT（中止）
- 描述：中止任务，记录最后位置
- 适用场景：信号丢失且无法确定位置
- 后续动作：通知人工寻找机器人
```

#### 5. 边巡边检配置（补充）

**边巡边检与巡检点的区别：**

| 特性 | 巡检点类型 | 边巡边检类型 |
|------|-----------|------------|
| 形态 | 静态单点 | 动态区域/路径 |
| 监测方式 | 定点停留监测 | 移动中连续监测 |
| 阈值配置 | 统一阈值 | 区域内可分段配置不同阈值 |
| 路径规划 | 点到点 | 沿预设路径连续移动 |

**边巡边检配置步骤：**

```
1. 进入巡检点管理页面
2. 点击「新增边巡边检区域」
3. 配置区域基础信息：
   - 区域名称
   - 区域编码
   - 区域类型（线性区域/多边形区域）
4. 绘制区域范围：
   - 线性区域：在地图上绘制路径起点、终点和中间点
   - 多边形区域：在地图上绘制区域边界
5. 配置分段监测（可选）：
   - 将区域划分为多个子段
   - 每个子段可配置独立的监测指标和阈值
6. 添加监测指标（连续监测）：
   - 指标名称
   - 指标编码
   - 单位
   - 采样频率（每秒/每米）
   - 阈值配置（可分段配置）
7. 配置异常策略：
   - 区域故障策略
   - 移动中异常策略
8. 保存边巡边检区域配置
```

**边巡边检任务执行流程：**

```
1. 机器人到达边巡边检区域起点
2. 开始沿路径移动
3. 移动过程中按采样频率连续采集数据
4. 实时判断数据是否超过阈值
5. 如发现异常：
   - 立即记录异常位置和数据
   - 可选：暂停移动，重点复核
   - 可选：继续移动，持续监测
6. 到达区域终点
7. 汇总区域监测数据
8. 继续前往下一个巡检点/区域
```

---

#### 6. 任务执行时的异常处理流程

**完整异常处理工作流：**

```
┌─────────────────────────────────────────────────────────────────┐
│                      异常处理工作流                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. 异常检测                                                      │
│     ├─ 实时监控机器人状态（电量、信号、故障）                     │
│     ├─ 实时监控巡检点状态（可达性、设备状态）                     │
│     └─ 实时监控监测数据（与阈值对比）                            │
│                          ↓                                        │
│  2. 异常识别与分类                                                │
│     ├─ 确定异常类型（巡检点故障/机器人故障/低电量/信号丢失等）   │
│     ├─ 确定异常等级（警告/严重/紧急）                            │
│     └─ 收集异常上下文（位置、时间、当前任务状态）                │
│                          ↓                                        │
│  3. 策略匹配                                                      │
│     ├─ 优先使用任务级异常策略                                    │
│     ├─ 如未配置，使用机器人/巡检点级策略                         │
│     └─ 如仍未配置，使用全局默认策略                              │
│                          ↓                                        │
│  4. 策略执行                                                      │
│     ├─ SKIP：跳过当前点，前往下一个                              │
│     ├─ RETRY：在指定次数内重试                                   │
│     ├─ WAIT_AND_RESUME：等待恢复                                 │
│     ├─ RETURN_TO_BASE：返回基站                                  │
│     ├─ ABORT：中止任务                                           │
│     └─ NOTIFY：仅发送通知                                        │
│                          ↓                                        │
│  5. 记录与通知                                                    │
│     ├─ 记录异常日志（类型、时间、位置、策略、结果）               │
│     ├─ 更新任务状态                                               │
│     ├─ 发送告警通知（根据等级选择通知方式）                       │
│     └─ 更新大屏显示                                               │
│                          ↓                                        │
│  6. 后续处理                                                      │
│     ├─ 如策略执行成功：继续任务或结束                             │
│     ├─ 如策略执行失败：应用降级策略                               │
│     └─ 如需要人工干预：通知相关人员                               │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 数据模型设计（完整版）

### 核心实体关系图

```
┌─────────────┐       ┌─────────────────┐       ┌───────────────┐
│   机器人     │ 1───N │    巡检任务      │ N───N │    巡检点      │
│   Robot     │       │ InspectionTask  │       │ InspectionPoint│
└─────────────┘       └─────────────────┘       └───────┬───────┘
       │                    │                                  │ 1
       │                    │ 1───1                             │ │
       │                    ▼                                  │ │
       │          ┌──────────────────┐                        │ │
       │          │   巡检路径        │                        │ │
       │          │ InspectionPath   │                        │ │
       │          └──────────────────┘                        │ │
       │                    │ 1───N                             │ │
       │                    ▼                                  │ │ N
       │          ┌──────────────────┐               ┌───────▼───────┐ │
       │          │   路径节点          │               │  设施设备      │ │
       │          │  PathSegment     │               │ FacilityDevice │ │
       │          └──────────────────┘               └───────┬───────┘ │
       │                                                  │ 1         │
       │                                                  │           │
       │                                                  │ N         │
       │                                          ┌───────▼───────┐   │
       │                                          │   监测指标     │   │
       │                                          │   Metric      │   │
       │                                          └───────────────┘   │
       │                                                              │
       │ 1───1                                                        │
       ▼                                                              │
┌──────────────────┐                                                  │
│   异常策略配置    │                                                  │
│ ExceptionStrategy  │                                                  │
└──────────────────┘                                                  │
                                                                      │
┌──────────────────┐ 1───N ┌──────────────────┐ 1───N ┌───────────────┐
│ 设备分类配置     │       │    设施设备      │       │    巡检点      │
│ DeviceCategory   │       │ FacilityDevice  │       │ InspectionPoint│
└──────────────────┘       └──────────────────┘       └───────────────┘
                                                                      │
┌──────────────────┐ 1───N ┌──────────────────┐                      │
│ 巡检路线分类     │       │    巡检路线      │ 1───N ┌───────────────┐
│ RouteCategory    │       │ InspectionRoute │       │    巡检点      │
└──────────────────┘       └──────────────────┘       └───────────────┘
```

### TypeScript 类型定义

```typescript
// 机器人状态枚举
enum RobotStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  CHARGING = 'charging',
  PATROLLING = 'patrolling',
  ERROR = 'error',
  PAUSED = 'paused',
  RETURNING = 'returning'
}

// 巡检任务类型枚举
enum InspectionTaskType {
  POINT = 'point',           // 巡检点类型
  PATROL = 'patrol'          // 边巡边检类型
}

// 巡检任务状态枚举
enum InspectionTaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  INTERRUPTED = 'interrupted',
  RESUMED = 'resumed'
}

// 异常类型枚举
enum ExceptionType {
  INSPECTION_POINT_FAILURE = 'inspection_point_failure',
  ROBOT_FAILURE = 'robot_failure',
  LOW_BATTERY = 'low_battery',
  SIGNAL_LOST = 'signal_lost',
  TASK_TIMEOUT = 'task_timeout',
  OBSTACLE_DETECTED = 'obstacle_detected'
}

// 异常处理策略枚举
enum ExceptionStrategy {
  SKIP = 'skip',              // 跳过继续
  RETRY = 'retry',              // 重试
  RETURN_TO_BASE = 'return_to_base',  // 返回基站
  WAIT_AND_RESUME = 'wait_and_resume',  // 等待恢复
  ABORT = 'abort',            // 中止任务
  NOTIFY = 'notify'             // 仅通知
}

// 机器人实体
interface Robot {
  id: string;
  name: string;
  serialNumber: string;
  model: string;
  status: RobotStatus;
  batteryLevel: number;
  batteryThreshold: {
    low: number;          // 低电量阈值（默认 20%）
    critical: number;         // 危险电量阈值（默认 10%）
  };
  lastOnlineTime: Date;
  connectionConfig: RobotConnectionConfig;
  exceptionStrategy: RobotExceptionStrategy;
  createdAt: Date;
  updatedAt: Date;
}

// 机器人连接配置
interface RobotConnectionConfig {
  protocol: 'ws' | 'wss';
  host: string;
  port: number;
  reconnectInterval: number;
  heartbeatInterval: number;
  timeout: number;
  maxReconnectAttempts: number;
}

// 机器人异常策略配置
interface RobotExceptionStrategy {
  lowBattery: ExceptionStrategy;
  signalLost: ExceptionStrategy;
  robotFailure: ExceptionStrategy;
  signalLostRetryCount: number;
  retryInterval: number;
  retryTimes: number;
}

// 巡检点实体
interface InspectionPoint {
  id: string;
  name: string;
  code: string;
  description: string;
  location: {
    longitude: number;
    latitude: number;
    altitude?: number;
  };
  monitorPoints: MonitorPoint[];
  isCritical: boolean;          // 是否为关键巡检点
  exceptionStrategy: InspectionPointExceptionStrategy;
  createdAt: Date;
  updatedAt: Date;
}

// 巡检点异常策略配置
interface InspectionPointExceptionStrategy {
  onFailure: ExceptionStrategy;
  retryCount: number;
  skipToNext: boolean;
}

// 监测点实体
interface MonitorPoint {
  id: string;
  name: string;
  code: string;
  inspectionPointId: string;
  deviceType: string;
  metrics: Metric[];
  position?: {
    x: number;
    y: number;
    z: number;
  };
  stayDuration: number;          // 停留时间（秒）
  createdAt: Date;
  updatedAt: Date;
}

// 监测指标实体
interface Metric {
  id: string;
  name: string;
  code: string;
  unit: string;
  threshold: {
    min?: number;
    max?: number;
    warning?: number;
    critical?: number;
  };
  monitorPointId: string;
  createdAt: Date;
  updatedAt: Date;
}

// 路径段（A→B 的路径）
interface PathSegment {
  id: string;
  pathId: string;
  fromInspectionPointId: string;
  toInspectionPointId: string;
  order: number;
  waypoints: Coordinate[];     // 路径中间点（用于复杂路径）
  distance: number;             // 距离（米）
  estimatedTime: number;            // 预计时间（秒）
  isAvoidable: boolean;          // 是否可绕路
  alternativePath?: PathSegment;   // 备选路径
  createdAt: Date;
  updatedAt: Date;
}

// 坐标点
interface Coordinate {
  longitude: number;
  latitude: number;
  altitude?: number;
}

// 巡检路径
interface InspectionPath {
  id: string;
  name: string;
  taskId: string;
  inspectionPointIds: string[];      // 关联的巡检点列表（按顺序）
  segments: PathSegment[];      // 路径段列表
  totalDistance: number;        // 总距离
  estimatedDuration: number;       // 总预计时间
  isOptimized: boolean;       // 是否经过路径优化
  createdAt: Date;
  updatedAt: Date;
}

// 巡检任务实体
interface InspectionTask {
  id: string;
  name: string;
  code: string;
  robotId: string;
  type: InspectionTaskType;
  status: InspectionTaskStatus;
  inspectionPointIds: string[];
  inspectionPoints?: InspectionPoint[];
  path?: InspectionPath;
  currentInspectionPointIndex: number;      // 当前巡检点索引
  schedule?: {
    startTime: Date;
    endTime: Date;
    repeatInterval?: number;
    repeatUnit?: 'minute' | 'hour' | 'day' | 'week';
  };
  config: {
    autoStart: boolean;
    notifyOnComplete: boolean;
    notifyOnError: boolean;
    autoResumeAfterInterrupt: boolean;   // 中断后自动恢复
  };
  exceptionStrategy: TaskExceptionStrategy;
  exceptionLog: ExceptionLog[];
  createdAt: Date;
  updatedAt: Date;
}

// 任务异常策略配置
interface TaskExceptionStrategy {
  inspectionPointFailure: ExceptionStrategy;
  robotFailure: ExceptionStrategy;
  lowBattery: ExceptionStrategy;
  signalLost: ExceptionStrategy;
  timeout: ExceptionStrategy;
  maxRetryCount: number;
  retryInterval: number;
}

// 异常日志
interface ExceptionLog {
  id: string;
  taskId: string;
  type: ExceptionType;
  timestamp: Date;
  inspectionPointId?: string;
  description: string;
  strategyApplied: ExceptionStrategy;
  resolved: boolean;
  resolvedAt?: Date;
  resolutionNote?: string;
}

// 全局异常策略配置（系统级）
interface GlobalExceptionStrategy {
  id: string;
  name: string;
  defaultStrategy: Partial<TaskExceptionStrategy>;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// 设备分类
interface DeviceCategory {
  id: string;
  name: string;
  parentId?: string;
  description: string;
  children?: DeviceCategory[];
  createdAt: Date;
  updatedAt: Date;
}

// 设施设备
interface FacilityDevice {
  id: string;
  code: string;
  name: string;
  categoryId: string;
  category?: DeviceCategory;
  area: string;
  specification: string;
  department: string;
  responsiblePerson: string;
  location: string;
  manufacturer: string;
  manufactureDate: Date;
  expiryDate: Date;
  factoryNumber: string;
  certificateNumber: string;
  certificateDate: Date;
  calibrationCertificate: string;
  systemName: string;
  commissioningDate: Date;
  inspectionCycle: string;
  lastInspectionTime: Date;
  lastInspectionResult: string;
  nextInspectionTime: Date;
  inspectionWarningDays: number;
  expiryWarningDays: number;
  deviceType: string;
  status: string;
  keeperPosition: string;
  inspectorPosition: string;
  nfcId: string;
  coordinates: {
    longitude: number;
    latitude: number;
    altitude?: number;
  };
  isRiskUnit: boolean;
  attributes: Array<{
    name: string;
    value: string;
    unit?: string;
  }>;
  metrics: Metric[];
  createdAt: Date;
  updatedAt: Date;
}

// 巡检路线分类
interface RouteCategory {
  id: string;
  name: string;
  parentId?: string;
  description: string;
  children?: RouteCategory[];
  createdAt: Date;
  updatedAt: Date;
}

// 巡检路线
interface InspectionRoute {
  id: string;
  name: string;
  code: string;
  categoryId: string;
  category?: RouteCategory;
  inspectionPointIds: string[];
  inspectionPoints?: InspectionPoint[];
  estimatedDuration: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## Mock 数据设计（纯前端）

### Mock 数据存储方案

**使用 localStorage 持久化存储：**

```typescript
// src/utils/storage.ts
const STORAGE_KEYS = {
  ROBOTS: 'inspection_robots',
  INSPECTION_POINTS: 'inspection_points',
  MONITOR_POINTS: 'monitor_points',
  METRICS: 'metrics',
  TASKS: 'inspection_tasks',
  PATHS: 'inspection_paths',
  EXCEPTION_LOGS: 'exception_logs',
  STRATEGIES: 'exception_strategies'
}

// 通用存储工具
export const storage = {
  get<T>(key: string): T | null {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  },
  
  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value))
  },
  
  remove(key: string): void {
    localStorage.removeItem(key)
  },
  
  clear(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  }
}
```

### 初始化 Mock 数据

**系统启动时自动生成初始数据：**

```typescript
// src/mock/initialData.ts

// 机器人 Mock 数据
export const initialRobots: Robot[] = [
  {
    id: 'robot-001',
    name: '巡检机器人-01',
    serialNumber: 'RBT-2024-001',
    model: 'Patrol-X1',
    status: RobotStatus.ONLINE,
    batteryLevel: 85,
    batteryThreshold: { low: 20, critical: 10 },
    lastOnlineTime: new Date(),
    position: { x: 100, y: 50, z: 0 },
    uuid: 'uuid-robot-001',
    userPermissions: ['admin', 'operator'],
    simulationConfig: {
      batteryDrainRate: 1,
      statusChangeProbability: 0.05
    },
    exceptionStrategy: {
      lowBattery: ExceptionStrategy.RETURN_TO_BASE,
      signalLost: ExceptionStrategy.WAIT_AND_RESUME,
      robotFailure: ExceptionStrategy.RETURN_TO_BASE,
      signalLostRetryCount: 3,
      retryInterval: 30,
      retryTimes: 3
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'robot-002',
    name: '巡检机器人-02',
    serialNumber: 'RBT-2024-002',
    model: 'Patrol-X1',
    status: RobotStatus.CHARGING,
    batteryLevel: 45,
    batteryThreshold: { low: 20, critical: 10 },
    lastOnlineTime: new Date(),
    position: { x: 200, y: 100, z: 0 },
    uuid: 'uuid-robot-002',
    userPermissions: ['admin', 'operator'],
    simulationConfig: {
      batteryDrainRate: 1,
      statusChangeProbability: 0.05
    },
    exceptionStrategy: {
      lowBattery: ExceptionStrategy.RETURN_TO_BASE,
      signalLost: ExceptionStrategy.WAIT_AND_RESUME,
      robotFailure: ExceptionStrategy.RETURN_TO_BASE,
      signalLostRetryCount: 3,
      retryInterval: 30,
      retryTimes: 3
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// 巡检点 Mock 数据
export const initialInspectionPoints: InspectionPoint[] = [
  {
    id: 'point-001',
    name: 'A区-反应釜车间',
    code: 'IP-A-001',
    description: 'A区反应釜车间巡检点',
    location: { longitude: 121.4737, latitude: 31.2304, altitude: 0 },
    monitorPoints: [], // 关联的监测点
    isCritical: true,
    exceptionStrategy: {
      onFailure: ExceptionStrategy.SKIP,
      retryCount: 3,
      skipToNext: true
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'point-002',
    name: 'B区-储罐区',
    code: 'IP-B-001',
    description: 'B区储罐区巡检点',
    location: { longitude: 121.4740, latitude: 31.2307, altitude: 0 },
    monitorPoints: [],
    isCritical: false,
    exceptionStrategy: {
      onFailure: ExceptionStrategy.SKIP,
      retryCount: 3,
      skipToNext: true
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// 监测点（仪表设备）Mock 数据
export const initialMonitorPoints: MonitorPoint[] = [
  {
    id: 'mp-001',
    name: '1号反应釜温度计',
    code: 'MP-TEMP-001',
    inspectionPointId: 'point-001',
    deviceType: '温度计',
    deviceNumber: 'TEMP-2024-001',
    metrics: [], // 关联的监测指标
    position: { x: 10, y: 5, z: 1.5 },
    stayDuration: 30,
    status: 'normal',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mp-002',
    name: '1号反应釜压力表',
    code: 'MP-PRESS-001',
    inspectionPointId: 'point-001',
    deviceType: '压力表',
    deviceNumber: 'PRESS-2024-001',
    metrics: [],
    position: { x: 12, y: 5, z: 1.5 },
    stayDuration: 20,
    status: 'normal',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mp-003',
    name: '进水阀门',
    code: 'MP-VALVE-001',
    inspectionPointId: 'point-001',
    deviceType: '阀门',
    deviceNumber: 'VALVE-2024-001',
    metrics: [],
    position: { x: 15, y: 8, z: 0.5 },
    stayDuration: 15,
    status: 'normal',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mp-004',
    name: '储罐液位计',
    code: 'MP-LEVEL-001',
    inspectionPointId: 'point-002',
    deviceType: '液位计',
    deviceNumber: 'LEVEL-2024-001',
    metrics: [],
    position: { x: 20, y: 10, z: 2.0 },
    stayDuration: 25,
    status: 'normal',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mp-005',
    name: '可燃气体检测仪',
    code: 'MP-GAS-001',
    inspectionPointId: 'point-002',
    deviceType: '气体检测仪',
    deviceNumber: 'GAS-2024-001',
    metrics: [],
    position: { x: 22, y: 12, z: 1.0 },
    stayDuration: 20,
    status: 'normal',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// 监测指标 Mock 数据
export const initialMetrics: Metric[] = [
  // 温度计指标
  {
    id: 'metric-001',
    name: '温度',
    code: 'M-TEMP-001',
    unit: '℃',
    threshold: { min: 0, max: 200, warning: 150, critical: 180 },
    monitorPointId: 'mp-001',
    simulationRange: { min: 20, max: 100 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // 压力表指标
  {
    id: 'metric-002',
    name: '压力',
    code: 'M-PRESS-001',
    unit: 'MPa',
    threshold: { min: 0, max: 10, warning: 8, critical: 9 },
    monitorPointId: 'mp-002',
    simulationRange: { min: 1, max: 6 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // 阀门指标
  {
    id: 'metric-003',
    name: '开度',
    code: 'M-VALVE-001',
    unit: '%',
    threshold: { min: 0, max: 100 },
    monitorPointId: 'mp-003',
    simulationRange: { min: 0, max: 100 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'metric-004',
    name: '状态',
    code: 'M-VALVE-002',
    unit: '',
    threshold: { min: 0, max: 1 },
    monitorPointId: 'mp-003',
    simulationRange: { values: ['正常', '异常'] },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // 液位计指标
  {
    id: 'metric-005',
    name: '液位',
    code: 'M-LEVEL-001',
    unit: 'm',
    threshold: { min: 0, max: 10, warning: 8, critical: 9 },
    monitorPointId: 'mp-004',
    simulationRange: { min: 1, max: 7 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // 气体检测仪指标
  {
    id: 'metric-006',
    name: '甲烷浓度',
    code: 'M-GAS-001',
    unit: '%LEL',
    threshold: { min: 0, max: 100, warning: 25, critical: 50 },
    monitorPointId: 'mp-005',
    simulationRange: { min: 0, max: 30 },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'metric-007',
    name: '硫化氢浓度',
    code: 'M-GAS-002',
    unit: 'ppm',
    threshold: { min: 0, max: 100, warning: 10, critical: 20 },
    monitorPointId: 'mp-005',
    simulationRange: { min: 0, max: 15 },
    createdAt: new Date(),
    updatedAt: new Date()
  }
]
```

### 模拟数据生成器

**实时数据模拟：**

```typescript
// src/mock/dataSimulator.ts

export class DataSimulator {
  // 生成随机数值（在范围内）
  static randomInRange(min: number, max: number): number {
    return Math.random() * (max - min) + min
  }
  
  // 生成随机枚举值
  static randomFromEnum<T>(values: T[]): T {
    return values[Math.floor(Math.random() * values.length)]
  }
  
  // 模拟机器人状态变化
  static simulateRobotStatus(robot: Robot): Robot {
    const { simulationConfig } = robot
    
    // 电量消耗
    if (robot.status === RobotStatus.PATROLLING) {
      robot.batteryLevel -= simulationConfig.batteryDrainRate * 0.1
    }
    
    // 随机状态变化
    if (Math.random() < simulationConfig.statusChangeProbability) {
      const statuses = [
        RobotStatus.ONLINE,
        RobotStatus.OFFLINE,
        RobotStatus.ERROR
      ]
      robot.status = this.randomFromEnum(statuses)
    }
    
    // 低电量自动充电
    if (robot.batteryLevel < robot.batteryThreshold.low) {
      robot.status = RobotStatus.RETURNING
    }
    
    return robot
  }
  
  // 模拟监测数据采集
  static simulateMetricData(metric: Metric): number | string {
    const { simulationRange, threshold } = metric
    
    if ('values' in simulationRange) {
      // 枚举类型
      return this.randomFromEnum(simulationRange.values)
    } else {
      // 数值类型
      let value = this.randomInRange(simulationRange.min, simulationRange.max)
      
      // 10% 概率生成异常值
      if (Math.random() < 0.1 && threshold.critical) {
        value = this.randomInRange(threshold.critical, threshold.max)
      }
      
      return Number(value.toFixed(2))
    }
  }
  
  // 模拟异常事件
  static simulateException(): ExceptionType | null {
    const exceptions = [
      { type: ExceptionType.LOW_BATTERY, probability: 0.05 },
      { type: ExceptionType.SIGNAL_LOST, probability: 0.03 },
      { type: ExceptionType.INSPECTION_POINT_FAILURE, probability: 0.02 },
      { type: ExceptionType.ROBOT_FAILURE, probability: 0.01 }
    ]
    
    for (const exception of exceptions) {
      if (Math.random() < exception.probability) {
        return exception.type
      }
    }
    
    return null
  }
}
```

### Mock Service 层

**统一的数据访问接口：**

```typescript
// src/services/mockService.ts

export class MockService {
  // 初始化数据
  static initializeData(): void {
    if (!storage.get(STORAGE_KEYS.ROBOTS)) {
      storage.set(STORAGE_KEYS.ROBOTS, initialRobots)
    }
    if (!storage.get(STORAGE_KEYS.INSPECTION_POINTS)) {
      storage.set(STORAGE_KEYS.INSPECTION_POINTS, initialInspectionPoints)
    }
    if (!storage.get(STORAGE_KEYS.MONITOR_POINTS)) {
      storage.set(STORAGE_KEYS.MONITOR_POINTS, initialMonitorPoints)
    }
    if (!storage.get(STORAGE_KEYS.METRICS)) {
      storage.set(STORAGE_KEYS.METRICS, initialMetrics)
    }
  }
  
  // 机器人相关
  static getRobots(): Robot[] {
    return storage.get<Robot[]>(STORAGE_KEYS.ROBOTS) || []
  }
  
  static getRobotById(id: string): Robot | undefined {
    const robots = this.getRobots()
    return robots.find(r => r.id === id)
  }
  
  static saveRobot(robot: Robot): void {
    const robots = this.getRobots()
    const index = robots.findIndex(r => r.id === robot.id)
    if (index >= 0) {
      robots[index] = robot
    } else {
      robots.push(robot)
    }
    storage.set(STORAGE_KEYS.ROBOTS, robots)
  }
  
  static deleteRobot(id: string): void {
    const robots = this.getRobots().filter(r => r.id !== id)
    storage.set(STORAGE_KEYS.ROBOTS, robots)
  }
  
  // 巡检点相关
  static getInspectionPoints(): InspectionPoint[] {
    return storage.get<InspectionPoint[]>(STORAGE_KEYS.INSPECTION_POINTS) || []
  }
  
  static getInspectionPointById(id: string): InspectionPoint | undefined {
    const points = this.getInspectionPoints()
    return points.find(p => p.id === id)
  }
  
  static saveInspectionPoint(point: InspectionPoint): void {
    const points = this.getInspectionPoints()
    const index = points.findIndex(p => p.id === point.id)
    if (index >= 0) {
      points[index] = point
    } else {
      points.push(point)
    }
    storage.set(STORAGE_KEYS.INSPECTION_POINTS, points)
  }
  
  static deleteInspectionPoint(id: string): void {
    const points = this.getInspectionPoints().filter(p => p.id !== id)
    storage.set(STORAGE_KEYS.INSPECTION_POINTS, points)
  }
  
  // 监测点相关
  static getMonitorPoints(): MonitorPoint[] {
    return storage.get<MonitorPoint[]>(STORAGE_KEYS.MONITOR_POINTS) || []
  }
  
  static getMonitorPointsByInspectionPointId(inspectionPointId: string): MonitorPoint[] {
    return this.getMonitorPoints().filter(mp => mp.inspectionPointId === inspectionPointId)
  }
  
  static saveMonitorPoint(monitorPoint: MonitorPoint): void {
    const monitorPoints = this.getMonitorPoints()
    const index = monitorPoints.findIndex(mp => mp.id === monitorPoint.id)
    if (index >= 0) {
      monitorPoints[index] = monitorPoint
    } else {
      monitorPoints.push(monitorPoint)
    }
    storage.set(STORAGE_KEYS.MONITOR_POINTS, monitorPoints)
  }
  
  static deleteMonitorPoint(id: string): void {
    const monitorPoints = this.getMonitorPoints().filter(mp => mp.id !== id)
    storage.set(STORAGE_KEYS.MONITOR_POINTS, monitorPoints)
  }
  
  // 监测指标相关
  static getMetrics(): Metric[] {
    return storage.get<Metric[]>(STORAGE_KEYS.METRICS) || []
  }
  
  static getMetricsByMonitorPointId(monitorPointId: string): Metric[] {
    return this.getMetrics().filter(m => m.monitorPointId === monitorPointId)
  }
  
  static saveMetric(metric: Metric): void {
    const metrics = this.getMetrics()
    const index = metrics.findIndex(m => m.id === metric.id)
    if (index >= 0) {
      metrics[index] = metric
    } else {
      metrics.push(metric)
    }
    storage.set(STORAGE_KEYS.METRICS, metrics)
  }
  
  static deleteMetric(id: string): void {
    const metrics = this.getMetrics().filter(m => m.id !== id)
    storage.set(STORAGE_KEYS.METRICS, metrics)
  }
  
  // 任务相关
  static getTasks(): InspectionTask[] {
    return storage.get<InspectionTask[]>(STORAGE_KEYS.TASKS) || []
  }
  
  static saveTask(task: InspectionTask): void {
    const tasks = this.getTasks()
    const index = tasks.findIndex(t => t.id === task.id)
    if (index >= 0) {
      tasks[index] = task
    } else {
      tasks.push(task)
    }
    storage.set(STORAGE_KEYS.TASKS, tasks)
  }
  
  static deleteTask(id: string): void {
    const tasks = this.getTasks().filter(t => t.id !== id)
    storage.set(STORAGE_KEYS.TASKS, tasks)
  }
}
```

---

## 异常处理策略详解

### 1. 巡检点故障策略

| 策略 | 描述 | 适用场景 |
|------|------|----------|
| **SKIP（跳过继续）** | 跳过故障巡检点，继续下一个 | 非关键巡检点、时间紧迫 |
| **RETRY（重试）** | 在指定次数内重试，成功则继续 | 临时性故障 |
| **WAIT_AND_RESUME（等待恢复）** | 暂停任务，等待巡检点恢复 | 可快速恢复的故障 |
| **RETURN_TO_BASE（返回基站）** | 终止任务并返回 | 关键巡检点故障 |
| **ABORT（中止）** | 立即中止任务 | 严重安全风险 |

### 2. 机器人故障策略

| 策略 | 描述 | 适用场景 |
|------|------|----------|
| **RETURN_TO_BASE（返回基站）** | 尝试返回基站充电/维修 | 轻度故障 |
| **WAIT_AND_RESUME（等待恢复）** | 原地等待，尝试自动恢复 | 可自愈故障 |
| **ABORT（中止）** | 立即中止，通知人工处理 | 严重故障 |
| **NOTIFY（仅通知）** | 继续任务，发送告警 | 非关键警告 |

### 3. 电量不足策略

| 电量范围 | 默认策略 | 说明 |
|----------|----------|------|
| **> 30%** | 继续执行 | 电量充足 |
| **20% - 30%** | 继续执行，发送告警 | 低电量警告 |
| **10% - 20%** | 加速完成剩余关键点位后返回 | 低电量，优先返回 |
| **< 10%** | 立即返回基站 | 危险电量，紧急返回 |

### 4. 信号丢失策略

| 策略 | 描述 |
|------|------|
| **WAIT_AND_RESUME** | 原地等待信号恢复（可配置超时） |
| **RETURN_TO_BASE** | 沿原路返回基站 |
| **ABORT** | 中止任务，记录位置 |

### 5. 路径规划策略

- **最短路径优先**：基于距离计算最优路线
- **关键点位优先**：优先经过关键巡检点
- **时间最优**：综合考虑距离和预计停留时间
- **安全优先**：避开高风险区域
- **绕行策略**：当某段路径不可用时，自动切换备选路径

---

## 文件结构（更新版 - 纯前端）

```
src/
├── mock/                          # Mock 数据层（新增）
│   ├── initialData.ts             # 初始化 Mock 数据
│   ├── dataSimulator.ts           # 数据模拟器
│   └── mockService.ts             # Mock 服务层
│
├── services/                      # 服务层
│   ├── robotService.ts            # 机器人服务
│   ├── inspectionPointService.ts  # 巡检点服务
│   ├── monitorPointService.ts     # 监测点服务
│   ├── metricService.ts           # 监测指标服务
│   ├── taskService.ts             # 巡检任务服务
│   ├── pathService.ts             # 路径规划服务
│   └── exceptionService.ts        # 异常策略服务
│
├── types/                        # TypeScript 类型定义
│   ├── robot.ts
│   ├── inspection.ts
│   ├── exception.ts            # 异常策略类型
│   ├── path.ts               # 路径规划类型
│   ├── common.ts
│   └── index.ts
│
├── stores/                       # Pinia 状态管理
│   ├── robot.ts                  # 机器人状态
│   ├── inspection.ts             # 巡检相关状态
│   ├── taskSimulation.ts         # 任务模拟状态（新增）
│   └── exception.ts            # 异常策略状态
│
├── composables/                  # 组合式函数
│   ├── useSimulation.ts          # 模拟控制（新增）
│   ├── usePathPlanning.ts      # 路径规划
│   └── useExceptionHandler.ts  # 异常处理
│
├── views/                        # 页面视图
│   ├── robot/                    # 机器人管理模块
│   │   ├── RobotList.vue         # 机器人列表
│   │   ├── RobotDetail.vue       # 机器人详情
│   │   ├── RobotForm.vue         # 机器人表单
│   │   └── ExceptionStrategyConfig.vue  # 异常策略配置
│   │
│   ├── smart-inspection/         # 智能巡检模块（新增）
│   │   └── InspectionStatistics.vue     # 巡检统计
│   │
│   └── inspection/               # 巡检管理模块
│       ├── device/               # 设施设备管理
│       │   ├── DeviceCategoryList.vue    # 设备分类列表
│       │   ├── DeviceCategoryForm.vue    # 设备分类表单
│       │   ├── FacilityDeviceList.vue    # 设施设备库列表
│       │   ├── FacilityDeviceForm.vue    # 设施设备库表单
│       │   └── DeviceDetail.vue          # 设施设备详情
│       │
│       ├── route/                # 巡检路线管理
│       │   ├── RouteCategoryList.vue     # 巡检路线分类列表
│       │   ├── RouteCategoryForm.vue     # 巡检路线分类表单
│       │   ├── InspectionRouteList.vue   # 巡检路线列表
│       │   └── InspectionRouteForm.vue   # 巡检路线表单
│       │
│       ├── InspectionPointList.vue    # 巡检点列表
│       ├── InspectionPointForm.vue    # 巡检点表单
│       ├── MetricList.vue             # 监测指标列表
│       ├── MetricForm.vue             # 监测指标表单
│       ├── InspectionTaskList.vue     # 巡检任务列表
│       ├── InspectionTaskForm.vue     # 巡检任务表单
│       ├── PathPlanningEditor.vue       # 路径规划编辑器
│       ├── TaskSimulation.vue           # 任务模拟执行（新增）
│       └── ExceptionLogViewer.vue          # 异常日志查看
│
├── components/                   # 通用组件
│   ├── layout/
│   │   ├── AppLayout.vue         # 应用布局
│   │   ├── Sidebar.vue           # 侧边栏导航
│   │   └── Header.vue            # 顶部栏
│   │
│   ├── common/
│   │   ├── StatusBadge.vue       # 状态徽章
│   │   ├── ConfirmDialog.vue     # 确认对话框
│   │   └── LoadingOverlay.vue    # 加载遮罩
│   │
│   └── inspection/
│       ├── PointSelector.vue     # 巡检点选择器
│       ├── PathVisualizer.vue    # 路径可视化（地图组件）
│       ├── PathSegmentEditor.vue    # 路径段编辑器
│       ├── MetricEditor.vue      # 指标编辑器
│       └── ExceptionStrategySelector.vue  # 异常策略选择器
│
├── router/                       # 路由配置
│   └── index.ts
│
├── utils/                        # 工具函数
│   ├── websocket.ts              # WebSocket 工具
│   ├── validators.ts             # 表单验证
│   ├── formatters.ts             # 数据格式化
│   └── pathPlanning.ts         # 路径规划算法
│
├── styles/                       # 样式文件
│   ├── variables.scss            # 变量定义
│   └── global.scss               # 全局样式
│
├── App.vue                       # 根组件
└── main.ts                       # 入口文件
```

---

## 任务分解（更新版）

---

### Task 1: 项目初始化与基础配置

（同原计划，略）

---

### Task 2: 类型定义与数据模型（更新版）

**Files:**
- Create: `src/types/common.ts
- Create: `src/types/robot.ts`
- Create: `src/types/inspection.ts`
- Create: `src/types/exception.ts`（新增）
- Create: `src/types/path.ts`（新增）
- Create: `src/types/index.ts`

- [ ] **Step 1: 创建通用类型定义（同原计划）

- [ ] **Step 2: 创建机器人类型定义（更新版）**

创建 `src/types/robot.ts`:

```typescript
export enum RobotStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  CHARGING = 'charging',
  PATROLLING = 'patrolling',
  ERROR = 'error',
  PAUSED = 'paused',
  RETURNING = 'returning'
}

export enum ExceptionStrategy {
  SKIP = 'skip',
  RETRY = 'retry',
  RETURN_TO_BASE = 'return_to_base',
  WAIT_AND_RESUME = 'wait_and_resume',
  ABORT = 'abort',
  NOTIFY = 'notify'
}

export interface RobotConnectionConfig {
  protocol: 'ws' | 'wss'
  host: string
  port: number
  reconnectInterval: number
  heartbeatInterval: number
  timeout: number
  maxReconnectAttempts: number
}

export interface RobotExceptionStrategy {
  lowBattery: ExceptionStrategy
  signalLost: ExceptionStrategy
  robotFailure: ExceptionStrategy
  signalLostRetryCount: number
  retryInterval: number
  retryTimes: number
}

export interface Robot {
  id: string
  name: string
  serialNumber: string
  model: string
  status: RobotStatus
  batteryLevel: number
  batteryThreshold: {
    low: number
    critical: number
  }
  lastOnlineTime: Date
  connectionConfig: RobotConnectionConfig
  exceptionStrategy: RobotExceptionStrategy
  createdAt: Date
  updatedAt: Date
}

export interface RobotFormData {
  name: string
  serialNumber: string
  model: string
  batteryThreshold: {
    low: number
    critical: number
  }
  connectionConfig: RobotConnectionConfig
  exceptionStrategy: RobotExceptionStrategy
}
```

- [ ] **Step 3: 创建异常策略类型定义**

创建 `src/types/exception.ts`:

```typescript
export enum ExceptionType {
  INSPECTION_POINT_FAILURE = 'inspection_point_failure',
  ROBOT_FAILURE = 'robot_failure',
  LOW_BATTERY = 'low_battery',
  SIGNAL_LOST = 'signal_lost',
  TASK_TIMEOUT = 'task_timeout',
  OBSTACLE_DETECTED = 'obstacle_detected'
}

export interface InspectionPointExceptionStrategy {
  onFailure: ExceptionStrategy
  retryCount: number
  skipToNext: boolean
}

export interface TaskExceptionStrategy {
  inspectionPointFailure: ExceptionStrategy
  robotFailure: ExceptionStrategy
  lowBattery: ExceptionStrategy
  signalLost: ExceptionStrategy
  timeout: ExceptionStrategy
  maxRetryCount: number
  retryInterval: number
}

export interface ExceptionLog {
  id: string
  taskId: string
  type: ExceptionType
  timestamp: Date
  inspectionPointId?: string
  description: string
  strategyApplied: ExceptionStrategy
  resolved: boolean
  resolvedAt?: Date
  resolutionNote?: string
}

export interface GlobalExceptionStrategy {
  id: string
  name: string
  defaultStrategy: Partial<TaskExceptionStrategy>
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}
```

- [ ] **Step 4: 创建路径规划类型定义**

创建 `src/types/path.ts`:

```typescript
export interface Coordinate {
  longitude: number
  latitude: number
  altitude?: number
}

export interface PathSegment {
  id: string
  pathId: string
  fromInspectionPointId: string
  toInspectionPointId: string
  order: number
  waypoints: Coordinate[]
  distance: number
  estimatedTime: number
  isAvoidable: boolean
  alternativePath?: PathSegment
  createdAt: Date
  updatedAt: Date
}

export interface InspectionPath {
  id: string
  name: string
  taskId: string
  inspectionPointIds: string[]
  segments: PathSegment[]
  totalDistance: number
  estimatedDuration: number
  isOptimized: boolean
  createdAt: Date
  updatedAt: Date
}
```

- [ ] **Step 5: 创建巡检类型定义（更新版）**

创建 `src/types/inspection.ts`:

```typescript
import type { 
  InspectionPath, 
  PathSegment, 
  Coordinate 
} from './path'
import type { 
  ExceptionStrategy, 
  InspectionPointExceptionStrategy, 
  TaskExceptionStrategy, 
  ExceptionLog 
} from './exception'

export enum InspectionTaskType {
  POINT = 'point',
  PATROL = 'patrol'
}

export enum InspectionTaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  INTERRUPTED = 'interrupted',
  RESUMED = 'resumed'
}

export interface Metric {
  id: string
  name: string
  code: string
  unit: string
  threshold: {
    min?: number
    max?: number
    warning?: number
    critical?: number
  }
  monitorPointId: string
  createdAt: Date
  updatedAt: Date
}

export interface MetricFormData {
  name: string
  code: string
  unit: string
  threshold: {
    min?: number
    max?: number
    warning?: number
    critical?: number
  }
}

export interface MonitorPoint {
  id: string
  name: string
  code: string
  inspectionPointId: string
  deviceType: string
  metrics: Metric[]
  position?: {
    x: number
    y: number
    z: number
  }
  stayDuration: number
  createdAt: Date
  updatedAt: Date
}

export interface MonitorPointFormData {
  name: string
  code: string
  deviceType: string
  stayDuration: number
  position?: {
    x: number
    y: number
    z: number
  }
}

export interface InspectionPoint {
  id: string
  name: string
  code: string
  description: string
  location: {
    longitude: number
    latitude: number
    altitude?: number
  }
  monitorPoints: MonitorPoint[]
  isCritical: boolean
  exceptionStrategy: InspectionPointExceptionStrategy
  createdAt: Date
  updatedAt: Date
}

export interface InspectionPointFormData {
  name: string
  code: string
  description: string
  location: {
    longitude: number
    latitude: number
    altitude?: number
  }
  isCritical: boolean
  exceptionStrategy: InspectionPointExceptionStrategy
}

export interface InspectionTask {
  id: string
  name: string
  code: string
  robotId: string
  type: InspectionTaskType
  status: InspectionTaskStatus
  inspectionPointIds: string[]
  inspectionPoints?: InspectionPoint[]
  path?: InspectionPath
  currentInspectionPointIndex: number
  schedule?: {
    startTime: Date
    endTime: Date
    repeatInterval?: number
    repeatUnit?: 'minute' | 'hour' | 'day' | 'week'
  }
  config: {
    autoStart: boolean
    notifyOnComplete: boolean
    notifyOnError: boolean
    autoResumeAfterInterrupt: boolean
  }
  exceptionStrategy: TaskExceptionStrategy
  exceptionLog: ExceptionLog[]
  createdAt: Date
  updatedAt: Date
}

export interface InspectionTaskFormData {
  name: string
  code: string
  robotId: string
  type: InspectionTaskType
  inspectionPointIds: string[]
  schedule?: {
    startTime: Date
    endTime: Date
    repeatInterval?: number
    repeatUnit?: 'minute' | 'hour' | 'day' | 'week'
  }
  config: {
    autoStart: boolean
    notifyOnComplete: boolean
    notifyOnError: boolean
    autoResumeAfterInterrupt: boolean
  }
  exceptionStrategy: TaskExceptionStrategy
}
```

- [ ] **Step 6: 创建类型导出文件（更新版）**

创建 `src/types/index.ts`:

```typescript
export * from './common'
export * from './robot'
export * from './inspection'
export * from './exception'
export * from './path'
```

---

### Task 3: 路由配置与布局组件

（同原计划，略）

---

### Task 4: API 接口层实现（更新版）

**Files:**
- Create: `src/utils/request.ts`
- Create: `src/api/robot.ts`
- Create: `src/api/inspectionPoint.ts`
- Create: `src/api/monitorPoint.ts`
- Create: `src/api/metric.ts`
- Create: `src/api/inspectionTask.ts`
- Create: `src/api/inspectionPath.ts`（新增）
- Create: `src/api/exceptionStrategy.ts`（新增）

- [ ] **Step 1-6: 同原计划，略**

- [ ] **Step 7: 创建巡检路径 API**

创建 `src/api/inspectionPath.ts`:

```typescript
import { request } from '@/utils/request'
import type { 
  InspectionPath, 
  PathSegment, 
  Coordinate,
  PaginatedResponse, 
  PaginationParams 
} from '@/types'

export const inspectionPathApi = {
  getByTaskId(taskId: string): Promise<InspectionPath> {
    return request.get(`/inspection-tasks/${taskId}/path`)
  },

  create(taskId: string, data: {
    inspectionPointIds: string[]
    optimize?: boolean
  }): Promise<InspectionPath> {
    return request.post(`/inspection-tasks/${taskId}/path`, data)
  },

  update(taskId: string, data: Partial<{
    segments: PathSegment[]
  }>): Promise<InspectionPath> {
    return request.put(`/inspection-tasks/${taskId}/path`, data)
  },

  delete(taskId: string): Promise<void> {
    return request.delete(`/inspection-tasks/${taskId}/path`)
  },

  optimize(taskId: string): Promise<InspectionPath> {
    return request.post(`/inspection-tasks/${taskId}/path/optimize`)
  },

  getAlternativePath(
    taskId: string, 
    fromPointId: string, 
    toPointId: string
  ): Promise<PathSegment> {
    return request.get(
      `/inspection-tasks/${taskId}/path/alternative`, 
      { params: { fromPointId, toPointId } }
    )
  },

  calculateDistance(
    from: Coordinate, 
    to: Coordinate
  ): Promise<{ distance: number; estimatedTime: number }> {
    return request.post('/inspection-paths/calculate-distance', { from, to })
  }
}
```

- [ ] **Step 8: 创建异常策略 API**

创建 `src/api/exceptionStrategy.ts`:

```typescript
import { request } from '@/utils/request'
import type { 
  GlobalExceptionStrategy, 
  ExceptionLog, 
  PaginatedResponse, 
  PaginationParams 
} from '@/types'

export const exceptionStrategyApi = {
  getGlobalStrategies(): Promise<GlobalExceptionStrategy[]> {
    return request.get('/exception-strategies/global')
  },

  getGlobalStrategy(id: string): Promise<GlobalExceptionStrategy> {
    return request.get(`/exception-strategies/global/${id}`)
  },

  createGlobalStrategy(data: Partial<GlobalExceptionStrategy>): Promise<GlobalExceptionStrategy> {
    return request.post('/exception-strategies/global', data)
  },

  updateGlobalStrategy(
    id: string, 
    data: Partial<GlobalExceptionStrategy>
  ): Promise<GlobalExceptionStrategy> {
    return request.put(`/exception-strategies/global/${id}`, data)
  },

  setDefaultGlobalStrategy(id: string): Promise<void> {
    return request.post(`/exception-strategies/global/${id}/set-default`)
  },

  getExceptionLogs(
    taskId: string, 
    params: PaginationParams
  ): Promise<PaginatedResponse<ExceptionLog>> {
    return request.get(`/inspection-tasks/${taskId}/exceptions`, { params })
  },

  resolveException(
    logId: string, 
    data: { 
      resolutionNote: string 
    }
  ): Promise<ExceptionLog> {
    return request.post(`/exception-logs/${logId}/resolve`, data)
  }
}
```

---

### Task 5: Pinia 状态管理（更新版）

**Files:**
- Create: `src/stores/robot.ts`（更新）
- Create: `src/stores/inspection.ts`（更新）
- Create: `src/stores/websocket.ts`
- Create: `src/stores/exception.ts`（新增）
- Create: `src/stores/path.ts`（新增）

- [ ] **Step 1-3: 同原计划，略**

- [ ] **Step 4: 创建路径规划 Store**

创建 `src/stores/path.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { inspectionPathApi } from '@/api/inspectionPath'
import type { 
  InspectionPath, 
  PathSegment, 
  Coordinate 
} from '@/types'

export const usePathStore = defineStore('path', () => {
  const currentPath = ref<InspectionPath | null>(null)
  const loading = ref(false)

  async function fetchByTaskId(taskId: string) {
    loading.value = true
    try {
      currentPath.value = await inspectionPathApi.getByTaskId(taskId)
    } finally {
      loading.value = false
    }
  }

  async function createPath(taskId: string, inspectionPointIds: string[], optimize = true) {
    loading.value = true
    try {
      currentPath.value = await inspectionPathApi.create(taskId, { inspectionPointIds, optimize })
      return currentPath.value
    } finally {
      loading.value = false
    }
  }

  async function updatePath(taskId: string, segments: PathSegment[]) {
    loading.value = true
    try {
      currentPath.value = await inspectionPathApi.update(taskId, { segments })
      return currentPath.value
    } finally {
      loading.value = false
    }
  }

  async function optimizePath(taskId: string) {
    loading.value = true
    try {
      currentPath.value = await inspectionPathApi.optimize(taskId)
      return currentPath.value
    } finally {
      loading.value = false
    }
  }

  async function getAlternativePath(taskId: string, fromPointId: string, toPointId: string) {
    return inspectionPathApi.getAlternativePath(taskId, fromPointId, toPointId)
  }

  async function calculateDistance(from: Coordinate, to: Coordinate) {
    return inspectionPathApi.calculateDistance(from, to)
  }

  function reorderPoints(newOrder: string[]) {
    if (!currentPath.value) return
    
    currentPath.value.inspectionPointIds = [...newOrder]
    
    const segments = currentPath.value.segments
    const newSegments: PathSegment[] = []
    
    for (let i = 0; i < newOrder.length - 1; i++) {
      const existingSegment = segments.find(
        s => s.fromInspectionPointId === newOrder[i] && 
             s.toInspectionPointId === newOrder[i + 1]
      )
      if (existingSegment) {
        newSegments.push({ ...existingSegment, order: i })
      }
    }
    
    currentPath.value.segments = newSegments
  }

  return {
    currentPath,
    loading,
    fetchByTaskId,
    createPath,
    updatePath,
    optimizePath,
    getAlternativePath,
    calculateDistance,
    reorderPoints
  }
})
```

- [ ] **Step 5: 创建异常策略 Store**

创建 `src/stores/exception.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { exceptionStrategyApi } from '@/api/exceptionStrategy'
import type { 
  GlobalExceptionStrategy, 
  ExceptionLog, 
  ExceptionStrategy,
  ExceptionType
} from '@/types'

export const useExceptionStore = defineStore('exception', () => {
  const globalStrategies = ref<GlobalExceptionStrategy[]>([])
  const currentGlobalStrategy = ref<GlobalExceptionStrategy | null>(null)
  const exceptionLogs = ref<ExceptionLog[]>([])
  const loading = ref(false)

  async function fetchGlobalStrategies() {
    loading.value = true
    try {
      globalStrategies.value = await exceptionStrategyApi.getGlobalStrategies()
    } finally {
      loading.value = false
    }
  }

  async function fetchGlobalStrategy(id: string) {
    loading.value = true
    try {
      currentGlobalStrategy.value = await exceptionStrategyApi.getGlobalStrategy(id)
    } finally {
      loading.value = false
    }
  }

  async function createGlobalStrategy(data: Partial<GlobalExceptionStrategy>) {
    const strategy = await exceptionStrategyApi.createGlobalStrategy(data)
    globalStrategies.value.push(strategy)
    return strategy
  }

  async function updateGlobalStrategy(id: string, data: Partial<GlobalExceptionStrategy>) {
    const strategy = await exceptionStrategyApi.updateGlobalStrategy(id, data)
    const index = globalStrategies.value.findIndex(s => s.id === id)
    if (index !== -1) {
      globalStrategies.value[index] = strategy
    }
    if (currentGlobalStrategy.value?.id === id) {
      currentGlobalStrategy.value = strategy
    }
    return strategy
  }

  async function setDefaultGlobalStrategy(id: string) {
    await exceptionStrategyApi.setDefaultGlobalStrategy(id)
    globalStrategies.value.forEach(s => {
      s.isDefault = s.id === id
    })
  }

  async function fetchExceptionLogs(taskId: string, page = 1, pageSize = 20) {
    loading.value = true
    try {
      const res = await exceptionStrategyApi.getExceptionLogs(taskId, { page, pageSize })
      exceptionLogs.value = res.data
      return res
    } finally {
      loading.value = false
    }
  }

  async function resolveException(logId: string, resolutionNote: string) {
    const log = await exceptionStrategyApi.resolveException(logId, { resolutionNote })
    const index = exceptionLogs.value.findIndex(l => l.id === logId)
    if (index !== -1) {
      exceptionLogs.value[index] = log
    }
    return log
  }

  function getStrategyDescription(strategy: ExceptionStrategy): string {
    const descriptions: Record<ExceptionStrategy, string> = {
      [ExceptionStrategy.SKIP]: '跳过继续',
      [ExceptionStrategy.RETRY]: '重试',
      [ExceptionStrategy.RETURN_TO_BASE]: '返回基站',
      [ExceptionStrategy.WAIT_AND_RESUME]: '等待恢复',
      [ExceptionStrategy.ABORT]: '中止任务',
      [ExceptionStrategy.NOTIFY]: '仅通知'
    }
    return descriptions[strategy] || strategy
  }

  function getExceptionTypeDescription(type: ExceptionType): string {
    const descriptions: Record<ExceptionType, string> = {
      [ExceptionType.INSPECTION_POINT_FAILURE]: '巡检点故障',
      [ExceptionType.ROBOT_FAILURE]: '机器人故障',
      [ExceptionType.LOW_BATTERY]: '低电量',
      [ExceptionType.SIGNAL_LOST]: '信号丢失',
      [ExceptionType.TASK_TIMEOUT]: '任务超时',
      [ExceptionType.OBSTACLE_DETECTED]: '检测到障碍物'
    }
    return descriptions[type] || type
  }

  return {
    globalStrategies,
    currentGlobalStrategy,
    exceptionLogs,
    loading,
    fetchGlobalStrategies,
    fetchGlobalStrategy,
    createGlobalStrategy,
    updateGlobalStrategy,
    setDefaultGlobalStrategy,
    fetchExceptionLogs,
    resolveException,
    getStrategyDescription,
    getExceptionTypeDescription
  }
})
```

---

### Task 6-10: 机器人管理页面实现（更新版）

**新增：添加异常策略配置页面等。

---

### Task 11: 路径规划编辑器（新增）

**Files:**
- Create: `src/views/inspection/PathPlanningEditor.vue`
- Create: `src/components/inspection/PathVisualizer.vue`
- Create: `src/components/inspection/PathSegmentEditor.vue`
- Create: `src/utils/pathPlanning.ts`

- [ ] **Step 1: 创建路径规划工具函数**

创建 `src/utils/pathPlanning.ts`:

```typescript
import type { Coordinate, InspectionPoint, PathSegment } from '@/types'

export function calculateDistance(from: Coordinate, to: Coordinate): number {
  const R = 6371000
  const dLat = toRadians(to.latitude - from.latitude)
  const dLon = toRadians(to.longitude - from.longitude)
  const lat1 = toRadians(from.latitude)
  const lat2 = toRadians(to.latitude)

  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

export function generatePathSegments(
  inspectionPoints: InspectionPoint[],
  order: string[]
): PathSegment[] {
  const segments: PathSegment[] = []
  
  for (let i = 0; i < order.length - 1; i++) {
    const fromPoint = inspectionPoints.find(p => p.id === order[i])
    const toPoint = inspectionPoints.find(p => p.id === order[i + 1])
    
    if (fromPoint && toPoint) {
      const distance = calculateDistance(fromPoint.location, toPoint.location)
      const estimatedTime = Math.ceil(distance / 1.5)
      
      segments.push({
        id: `segment-${i}`,
        pathId: '',
        fromInspectionPointId: fromPoint.id,
        toInspectionPointId: toPoint.id,
        order: i,
        waypoints: [],
        distance,
        estimatedTime,
        isAvoidable: true,
        createdAt: new Date(),
        updatedAt: new Date()
      })
    }
  }
  
  return segments
}

export function optimizePath(
  inspectionPoints: InspectionPoint[],
  strategy: 'shortest' | 'critical_first' | 'time_optimal' = 'shortest'
): string[] {
  const pointIds = inspectionPoints.map(p => p.id)
  
  if (strategy === 'critical_first') {
    const criticalPoints = inspectionPoints.filter(p => p.isCritical).map(p => p.id)
    const normalPoints = inspectionPoints.filter(p => !p.isCritical).map(p => p.id)
    return [...criticalPoints, ...normalPoints]
  }
  
  return pointIds
}

export function estimateTotalDistance(segments: PathSegment[]): number {
  return segments.reduce((sum, s) => sum + s.distance, 0)
}

export function estimateTotalDuration(
  segments: PathSegment[],
  inspectionPoints: InspectionPoint[]
): number {
  const pathTime = segments.reduce((sum, s) => sum + s.estimatedTime, 0)
  const stayTime = inspectionPoints.reduce((sum, p) => {
    return sum + p.monitorPoints.reduce((ps, mp) => ps + mp.stayDuration, 0)
  }, 0)
  return pathTime + stayTime
}
```

- [ ] **Step 2: 创建路径可视化组件**

创建 `src/components/inspection/PathVisualizer.vue`:

```vue
<template>
  <div class="path-visualizer">
    <div class="visualizer-header">
      <h4>路径预览</h4>
      <div class="stats">
        <span>总距离: {{ formatDistance(totalDistance) }}</span>
        <span>预计时间: {{ formatDuration(totalDuration) }}</span>
      </div>
    </div>
    <div class="map-placeholder">
      <div class="map-info">
        <a-empty description="地图组件占位" />
        <p class="hint">此处可集成地图组件（如 Mapbox、Leaflet）</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { InspectionPath, InspectionPoint } from '@/types'
import { estimateTotalDistance, estimateTotalDuration } from '@/utils/pathPlanning'

const props = defineProps<{
  path?: InspectionPath
  inspectionPoints?: InspectionPoint[]
}>()

const totalDistance = computed(() => {
  if (!props.path) return 0
  return estimateTotalDistance(props.path.segments)
})

const totalDuration = computed(() => {
  if (!props.path || !props.inspectionPoints) return 0
  return estimateTotalDuration(props.path.segments, props.inspectionPoints)
})

const formatDistance = (meters: number): string => {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(2)} km`
  }
  return `${meters.toFixed(0)} m`
}

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  if (minutes > 0) {
    return `${minutes}m ${secs}s`
  }
  return `${secs}s`
}
</script>

<style scoped lang="scss">
.path-visualizer {
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 16px;
  
  .visualizer-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    
    h4 {
      margin: 0;
      font-size: 14px;
      font-weight: 500;
    }
    
    .stats {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.45);
    }
  }
  
  .map-placeholder {
    height: 300px;
    background: #fafafa;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .map-info {
      text-align: center;
      
      .hint {
        margin-top: 12px;
        font-size: 12px;
        color: rgba(0, 0, 0, 0.25);
      }
    }
  }
}
</style>
```

- [ ] **Step 3: 创建路径段编辑器组件**

创建 `src/components/inspection/PathSegmentEditor.vue`:

```vue
<template>
  <div class="path-segment-editor">
    <a-table :data-source="sortedSegments" :pagination="false" size="small">
      <a-table-column title="序号" width="60px">
        <template #default="{ index }">
          {{ index + 1 }}
        </template>
      </a-table-column>
      <a-table-column title="起点" min-width="120px">
        <template #default="{ record }">
          {{ getPointName(record.fromInspectionPointId) }}
        </template>
      </a-table-column>
      <a-table-column title="→" width="40px" align="center">
        <template #default>→</template>
      </a-table-column>
      <a-table-column title="终点" min-width="120px">
        <template #default="{ record }">
          {{ getPointName(record.toInspectionPointId) }}
        </template>
      </a-table-column>
      <a-table-column title="距离" width="100px">
        <template #default="{ record }">
          {{ formatDistance(record.distance) }}
        </template>
      </a-table-column>
      <a-table-column title="预计时间" width="100px">
        <template #default="{ record }">
          {{ formatDuration(record.estimatedTime) }}
        </template>
      </a-table-column>
      <a-table-column title="可绕路" width="80px" align="center">
        <template #default="{ record }">
          <a-switch v-model:checked="record.isAvoidable" size="small" />
        </template>
      </a-table-column>
      <a-table-column title="操作" width="100px" align="center">
        <template #default="{ index }">
          <a-button 
            v-if="index > 0"
            size="small" 
            type="link" 
            @click="moveUp(index)"
          >
            ↑
          </a-button>
          <a-button 
            v-if="index < sortedSegments.length - 1"
            size="small" 
            type="link" 
            @click="moveDown(index)"
          >
            ↓
          </a-button>
        </template>
      </a-table-column>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'
import type { PathSegment, InspectionPoint } from '@/types'

const props = defineProps<{
  segments: PathSegment[]
  inspectionPoints: InspectionPoint[]
}>()

const emit = defineEmits<{
  'update:segments': [segments: PathSegment[]]
}>()

const sortedSegments = computed(() => 
  [...props.segments].sort((a, b) => a.order - b.order)
)

watch(sortedSegments, (newVal) => {
  emit('update:segments', newVal.map((s, i) => ({ ...s, order: i })))
}, { deep: true })

const getPointName = (pointId: string): string => {
  const point = props.inspectionPoints.find(p => p.id === pointId)
  return point?.name || pointId
}

const moveUp = (index: number) => {
  if (index <= 0) return
  const newSegments = [...sortedSegments.value]
  newSegments[index].order -= 1
  newSegments[index - 1].order += 1
  emit('update:segments', newSegments)
}

const moveDown = (index: number) => {
  if (index >= sortedSegments.value.length - 1) return
  const newSegments = [...sortedSegments.value]
  newSegments[index].order += 1
  newSegments[index + 1].order -= 1
  emit('update:segments', newSegments)
}

const formatDistance = (meters: number): string => {
  return `${meters.toFixed(0)}m`
}

const formatDuration = (seconds: number): string => {
  return `${seconds}s`
}
</script>

<style scoped lang="scss">
.path-segment-editor {
  :deep(.ant-table) {
    font-size: 12px;
  }
}
</style>
```

- [ ] **Step 4: 创建路径规划编辑器页面**

创建 `src/views/inspection/PathPlanningEditor.vue`:

```vue
<template>
  <div class="path-planning-editor">
    <div class="page-header">
      <h2>路径规划编辑器</h2>
      <a-space>
        <a-button @click="handleAutoOptimize">
          <template #icon>
            <ReloadOutlined />
          </template>
          自动优化
        </a-button>
        <a-button type="primary" @click="handleSave" :loading="saving">
          保存路径
        </a-button>
      </a-space>
    </div>

    <a-row :gutter="20">
      <a-col :span="10">
        <a-card>
          <template #title>
            <div class="card-header">
              <span>巡检点排序</span>
              <a-tag color="blue">拖拽调整顺序</a-tag>
            </div>
          </template>
          <a-table
            :data-source="orderedPoints"
            :pagination="false"
            row-key="id"
          >
            <a-table-column title="#" width="50px">
              <template #default="{ index }">
                {{ index + 1 }}
              </template>
            </a-table-column>
            <a-table-column title="名称" data-index="name" />
            <a-table-column title="关键点位" width="100px" align="center">
              <template #default="{ record }">
                <a-tag v-if="record.isCritical" color="red">关键</a-tag>
              </template>
            </a-table-column>
          </a-table>
        </a-card>
      </a-col>

      <a-col :span="14">
        <PathVisualizer
          :path="currentPath"
          :inspection-points="inspectionPoints"
        />
        <a-card style="margin-top: 16px;" title="路径段详情">
          <PathSegmentEditor
            v-model:segments="localSegments"
            :inspection-points="inspectionPoints"
          />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { ReloadOutlined } from '@ant-design/icons-vue'
import { useInspectionStore } from '@/stores/inspection'
import { usePathStore } from '@/stores/path'
import PathVisualizer from '@/components/inspection/PathVisualizer.vue'
import PathSegmentEditor from '@/components/inspection/PathSegmentEditor.vue'
import type { InspectionPoint, PathSegment } from '@/types'
import { generatePathSegments } from '@/utils/pathPlanning'

const route = useRoute()
const inspectionStore = useInspectionStore()
const pathStore = usePathStore()

const saving = ref(false)
const localSegments = ref<PathSegment[]>([])
const pointOrder = ref<string[]>([])

const taskId = computed(() => route.params.id as string)

const inspectionPoints = computed(() => inspectionStore.inspectionPoints)
const currentPath = computed(() => pathStore.currentPath)

const orderedPoints = computed<InspectionPoint[]>(() => {
  if (pointOrder.value.length === 0) return inspectionPoints.value
  return pointOrder.value
    .map(id => inspectionPoints.value.find(p => p.id === id))
    .filter((p): p is InspectionPoint => p !== undefined)
})

const regenerateSegments = () => {
  if (inspectionPoints.value.length === 0) return
  
  localSegments.value = generatePathSegments(
    inspectionPoints.value,
    pointOrder.value
  )
}

const handleAutoOptimize = async () => {
  try {
    await pathStore.optimizePath(taskId.value)
    if (currentPath.value) {
      pointOrder.value = [...currentPath.value.inspectionPointIds]
      localSegments.value = [...currentPath.value.segments]
    }
    message.success('路径优化完成')
  } catch (error) {
    message.error('路径优化失败')
  }
}

const handleSave = async () => {
  saving.value = true
  try {
    await pathStore.updatePath(taskId.value, localSegments.value)
    message.success('路径保存成功')
  } catch (error) {
    message.error('路径保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(async () => {
  await inspectionStore.fetchAllInspectionPoints()
  await pathStore.fetchByTaskId(taskId.value)
  
  if (currentPath.value) {
    pointOrder.value = [...currentPath.value.inspectionPointIds]
    localSegments.value = [...currentPath.value.segments]
  } else {
    pointOrder.value = inspectionPoints.value.map(p => p.id)
    regenerateSegments()
  }
})
</script>

<style scoped lang="scss">
.path-planning-editor {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h2 {
      margin: 0;
      font-size: 20px;
    }
  }
  
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
}
</style>
```

---

### Task 12: 异常策略配置与异常日志（新增）

**Files:**
- Create: `src/views/robot/ExceptionStrategyConfig.vue`
- Create: `src/views/inspection/ExceptionLogViewer.vue`
- Create: `src/components/inspection/ExceptionStrategySelector.vue`

（实现略，详细代码类似路径规划编辑器）

---

## 验收标准（更新版）

### 功能验收

- [ ] 机器人管理
  - [ ] 可以创建、编辑、删除机器人
  - [ ] 可以配置机器人连接参数和异常策略
  - [ ] 可以测试机器人连接
  - [ ] 可以建立/断开机器人连接

- [ ] 巡检点管理
  - [ ] 可以创建、编辑、删除巡检点
  - [ ] 可以配置巡检点异常策略
  - [ ] 可以管理巡检点下的监测点
  - [ ] 可以管理监测点下的监测指标

- [ ] 巡检任务管理
  - [ ] 可以创建、编辑、删除巡检任务
  - [ ] 可以选择关联的机器人
  - [ ] 可以选择关联的巡检点
  - [ ] 可以设置任务类型（巡检点类型/边巡边检）
  - [ ] 可以配置任务异常策略
  - [ ] 可以启动、暂停、继续、取消任务

- [ ] 路径规划
  - [ ] 可以可视化巡检路径
  - [ ] 可以调整巡检点顺序
  - [ ] 可以编辑路径段
  - [ ] 可以自动优化路径
  - [ ] 可以查看总距离和预计时间

- [ ] 异常处理
  - [ ] 可以配置全局异常策略
  - [ ] 可以查看异常日志
  - [ ] 可以处理和标记异常解决
  - [ ] 可以查看异常详情和应用的策略

### 技术验收

（同原计划，略）

---

## 后续优化建议

（同原计划，略）
