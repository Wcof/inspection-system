# 管理端开发实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 按照管理端开发执行计划（防踩坑强化版），完成管理端结构调整、页面迁移和功能补齐。

**Architecture:** 采用Vue 3 + Ant Design Vue + Pinia + Vue Router，按照“先路由与菜单、再页面迁移、再功能补齐、最后回归扫尾”的顺序执行。

**Tech Stack:** Vue 3, Ant Design Vue, Pinia, Vue Router, TypeScript

---

## 一、结构层调整（先治根因）

### 任务1：调整管理端菜单结构

**Files:**
- Modify: `/Users/ldh/Downloads/project/极客光年/bot/src/components/layout/AppLayout.vue`

- [ ] **步骤1：修改管理端菜单项**

```vue
<!-- 管理端菜单 -->
<template v-if="currentSystem === 'management'">
  <a-sub-menu key="management-plan">
    <template #title>
      <span>
        <a-icon type="schedule" />
        计划管理
      </span>
    </template>
    <a-menu-item key="management-plan-list">
      <router-link to="/management/plan/list">计划列表</router-link>
    </a-menu-item>
  </a-sub-menu>
  <a-sub-menu key="management-dispatch">
    <template #title>
      <span>
        <a-icon type="control" />
        总调度台
      </span>
    </template>
    <a-menu-item key="management-dispatch-center">
      <router-link to="/management/dispatch/center">总调度台</router-link>
    </a-menu-item>
  </a-sub-menu>
  <a-sub-menu key="management-task">
    <template #title>
      <span>
        <a-icon type="bars" />
        任务中心
      </span>
    </template>
    <a-menu-item key="management-task-list">
      <router-link to="/management/task/list">任务列表</router-link>
    </a-menu-item>
  </a-sub-menu>
  <a-sub-menu key="management-exception">
    <template #title>
      <span>
        <a-icon type="warning" />
        异常中心
      </span>
    </template>
    <a-menu-item key="management-exception-list">
      <router-link to="/management/exception/list">异常列表</router-link>
    </a-menu-item>
  </a-sub-menu>
  <a-sub-menu key="management-report">
    <template #title>
      <span>
        <a-icon type="line-chart" />
        报表统计
      </span>
    </template>
    <a-menu-item key="management-report-statistics">
      <router-link to="/management/report/statistics">巡检分析</router-link>
    </a-menu-item>
  </a-sub-menu>
</template>
```

- [ ] **步骤2：更新菜单开放状态**

```typescript
// 开放的菜单
const openKeys = computed(() => {
  if (currentSystem.value === 'management') {
    return ['management-plan', 'management-dispatch', 'management-task', 'management-exception', 'management-report']
  } else {
    return ['implementation-map', 'implementation-robot', 'implementation-point-device', 'implementation-dispatch-config']
  }
})
```

- [ ] **步骤3：更新当前选中菜单项逻辑**

```typescript
// 当前选中的菜单项
const currentKey = computed(() => {
  const path = route.path
  
  // 管理端
  if (path.startsWith('/management/plan/list')) return 'management-plan-list'
  if (path.startsWith('/management/dispatch/center')) return 'management-dispatch-center'
  if (path.startsWith('/management/task/list')) return 'management-task-list'
  if (path.startsWith('/management/exception/list')) return 'management-exception-list'
  if (path.startsWith('/management/report/statistics')) return 'management-report-statistics'
  
  // 实施平台
  if (path.startsWith('/implementation/map/list')) return 'implementation-map-list'
  if (path.startsWith('/implementation/map/editor')) return 'implementation-map-list'
  if (path.startsWith('/implementation/map/point-manage')) return 'implementation-map-list'
  if (path.startsWith('/implementation/robot/list')) return 'implementation-robot-list'
  if (path.startsWith('/implementation/robot/simulation')) return 'implementation-robot-simulation'
  if (path.startsWith('/implementation/point/list')) return 'implementation-point'
  if (path.startsWith('/implementation/calibration/list')) return 'implementation-calibration'
  if (path.startsWith('/implementation/device/list')) return 'implementation-device'
  if (path.startsWith('/implementation/metric/list')) return 'implementation-metric'
  if (path.startsWith('/implementation/dispatch/rule-config')) return 'implementation-dispatch-rule-config'
  if (path.startsWith('/implementation/dispatch/resource-config')) return 'implementation-dispatch-resource-config'
  
  // 默认值
  return currentSystem.value === 'management' ? 'management-plan-list' : 'implementation-map-list'
})
```

### 任务2：调整管理端路由结构

**Files:**
- Modify: `/Users/ldh/Downloads/project/极客光年/bot/src/router/index.ts`

- [ ] **步骤1：更新管理端路由结构**

```typescript
// 管理端路由
{
  path: '/management',
  name: 'Management',
  meta: { title: '管理端' },
  children: [
    // 计划管理
    {
      path: 'plan',
      name: 'ManagementPlan',
      meta: { title: '计划管理' },
      children: [
        {
          path: 'list',
          name: 'ManagementPlanList',
          component: () => import('../views/inspection/plan/InspectionPlanList.vue'),
          meta: { title: '计划列表' }
        },
        {
          path: 'form/:id?',
          name: 'ManagementPlanForm',
          component: () => import('../views/inspection/plan/InspectionPlanForm.vue'),
          meta: { title: '计划编辑' }
        },
        {
          path: 'detail/:id',
          name: 'ManagementPlanDetail',
          component: () => import('../views/management/plan/InspectionPlanDetail.vue'),
          meta: { title: '计划详情' }
        }
      ]
    },
    // 总调度台
    {
      path: 'dispatch',
      name: 'ManagementDispatch',
      meta: { title: '总调度台' },
      children: [
        {
          path: 'center',
          name: 'ManagementDispatchCenter',
          component: () => import('../views/management/DispatchCenter.vue'),
          meta: { title: '总调度台' }
        },
        {
          path: 'auto',
          name: 'ManagementDispatchAuto',
          component: () => import('../views/management/dispatch/AutoDispatch.vue'),
          meta: { title: '自动调度管理' }
        },
        {
          path: 'temporary',
          name: 'ManagementDispatchTemporary',
          component: () => import('../views/management/dispatch/TemporaryDispatch.vue'),
          meta: { title: '临时调度' }
        },
        {
          path: 'intervention',
          name: 'ManagementDispatchIntervention',
          component: () => import('../views/management/dispatch/DispatchIntervention.vue'),
          meta: { title: '调度干预' }
        },
        {
          path: 'conflict',
          name: 'ManagementDispatchConflict',
          component: () => import('../views/management/dispatch/ConflictHandling.vue'),
          meta: { title: '冲突处理' }
        },
        {
          path: 'record',
          name: 'ManagementDispatchRecord',
          component: () => import('../views/management/dispatch/DispatchRecord.vue'),
          meta: { title: '调度记录' }
        }
      ]
    },
    // 任务中心
    {
      path: 'task',
      name: 'ManagementTask',
      meta: { title: '任务中心' },
      children: [
        {
          path: 'list',
          name: 'ManagementTaskList',
          component: () => import('../views/inspection/task/InspectionTaskList.vue'),
          meta: { title: '任务列表' }
        },
        {
          path: 'detail/:id',
          name: 'ManagementTaskDetail',
          component: () => import('../views/inspection/task/InspectionTaskDetail.vue'),
          meta: { title: '任务详情' }
        },
        {
          path: 'trace/:id',
          name: 'ManagementTaskTrace',
          component: () => import('../views/management/task/ExecutionTrace.vue'),
          meta: { title: '执行轨迹' }
        },
        {
          path: 'result/:id',
          name: 'ManagementTaskResult',
          component: () => import('../views/management/task/CheckResult.vue'),
          meta: { title: '检查结果' }
        },
        {
          path: 'review/:id',
          name: 'ManagementTaskReview',
          component: () => import('../views/management/task/TaskReview.vue'),
          meta: { title: '任务复盘' }
        }
      ]
    },
    // 异常中心
    {
      path: 'exception',
      name: 'ManagementException',
      meta: { title: '异常中心' },
      children: [
        {
          path: 'list',
          name: 'ManagementExceptionList',
          component: () => import('../views/inspection/ExceptionLogViewer.vue'),
          meta: { title: '异常列表' }
        },
        {
          path: 'detail/:id',
          name: 'ManagementExceptionDetail',
          component: () => import('../views/management/exception/ExceptionDetail.vue'),
          meta: { title: '异常详情' }
        },
        {
          path: 'handle/:id',
          name: 'ManagementExceptionHandle',
          component: () => import('../views/management/exception/ExceptionHandle.vue'),
          meta: { title: '异常处理' }
        }
      ]
    },
    // 报表统计
    {
      path: 'report',
      name: 'ManagementReport',
      meta: { title: '报表统计' },
      children: [
        {
          path: 'statistics',
          name: 'ManagementReportStatistics',
          component: () => import('../views/smart-inspection/InspectionStatistics.vue'),
          meta: { title: '巡检分析' }
        },
        {
          path: 'dispatch',
          name: 'ManagementReportDispatch',
          component: () => import('../views/management/report/DispatchAnalysis.vue'),
          meta: { title: '调度分析' }
        },
        {
          path: 'exception',
          name: 'ManagementReportException',
          component: () => import('../views/management/report/ExceptionAnalysis.vue'),
          meta: { title: '异常分析' }
        }
      ]
    }
  ]
},
```

- [ ] **步骤2：更新默认重定向**

```typescript
{
  path: '/',
  redirect: '/management/plan/list'
},
```

- [ ] **步骤3：更新系统切换处理**

```typescript
// 系统切换处理
const handleSystemChange = () => {
  if (currentSystem.value === 'management') {
    router.push('/management/plan/list')
  } else {
    router.push('/implementation/map/list')
  }
}
```

## 二、页面迁移与复用（防空页）

### 任务3：创建缺失的骨架页面

**Files:**
- Create: `/Users/ldh/Downloads/project/极客光年/bot/src/views/management/plan/InspectionPlanDetail.vue`
- Create: `/Users/ldh/Downloads/project/极客光年/bot/src/views/management/dispatch/AutoDispatch.vue`
- Create: `/Users/ldh/Downloads/project/极客光年/bot/src/views/management/dispatch/TemporaryDispatch.vue`
- Create: `/Users/ldh/Downloads/project/极客光年/bot/src/views/management/dispatch/DispatchIntervention.vue`
- Create: `/Users/ldh/Downloads/project/极客光年/bot/src/views/management/dispatch/ConflictHandling.vue`
- Create: `/Users/ldh/Downloads/project/极客光年/bot/src/views/management/dispatch/DispatchRecord.vue`
- Create: `/Users/ldh/Downloads/project/极客光年/bot/src/views/management/task/ExecutionTrace.vue`
- Create: `/Users/ldh/Downloads/project/极客光年/bot/src/views/management/task/CheckResult.vue`
- Create: `/Users/ldh/Downloads/project/极客光年/bot/src/views/management/task/TaskReview.vue`
- Create: `/Users/ldh/Downloads/project/极客光年/bot/src/views/management/exception/ExceptionDetail.vue`
- Create: `/Users/ldh/Downloads/project/极客光年/bot/src/views/management/exception/ExceptionHandle.vue`
- Create: `/Users/ldh/Downloads/project/极客光年/bot/src/views/management/report/DispatchAnalysis.vue`
- Create: `/Users/ldh/Downloads/project/极客光年/bot/src/views/management/report/ExceptionAnalysis.vue`

- [ ] **步骤1：创建计划详情页**

```vue
<template>
  <div class="inspection-plan-detail">
    <a-card title="计划详情">
      <a-button type="primary" @click="goBack">返回列表</a-button>
      <div class="detail-content">
        <p>计划详情页面 - 骨架页</p>
        <p>计划ID: {{ planId }}</p>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const planId = ref(route.params.id as string)

const goBack = () => {
  router.push('/management/plan/list')
}
</script>

<style scoped>
.inspection-plan-detail {
  padding: 20px 0;
}

.detail-content {
  margin-top: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 4px;
}
</style>
```

- [ ] **步骤2：创建调度相关页面**

创建 AutoDispatch.vue、TemporaryDispatch.vue、DispatchIntervention.vue、ConflictHandling.vue、DispatchRecord.vue，结构类似计划详情页，确保可访问、有数据占位、可返回。

- [ ] **步骤3：创建任务相关页面**

创建 ExecutionTrace.vue、CheckResult.vue、TaskReview.vue，结构类似计划详情页，确保可访问、有数据占位、可返回。

- [ ] **步骤4：创建异常相关页面**

创建 ExceptionDetail.vue、ExceptionHandle.vue，结构类似计划详情页，确保可访问、有数据占位、可返回。

- [ ] **步骤5：创建报表相关页面**

创建 DispatchAnalysis.vue、ExceptionAnalysis.vue，结构类似计划详情页，确保可访问、有数据占位、可返回。

## 三、功能落地（防“做乱”）

### 任务4：计划管理功能补齐

**Files:**
- Modify: `/Users/ldh/Downloads/project/极客光年/bot/src/views/inspection/plan/InspectionPlanForm.vue`
- Modify: `/Users/ldh/Downloads/project/极客光年/bot/src/views/inspection/plan/InspectionPlanList.vue`

- [ ] **步骤1：在计划表单中添加资源策略字段**

```vue
<a-form-item label="资源策略">
  <a-select v-model:value="form.resourceStrategy" placeholder="选择资源策略">
    <a-select-option value="priority">优先级策略</a-select-option>
    <a-select-option value="load-balancing">负载均衡策略</a-select-option>
    <a-select-option value="就近">就近策略</a-select-option>
  </a-select>
</a-form-item>
```

- [ ] **步骤2：完善计划详情页**

更新 InspectionPlanDetail.vue，添加计划详情展示和相关操作。

### 任务5：总调度台功能补齐

**Files:**
- Modify: `/Users/ldh/Downloads/project/极客光年/bot/src/views/management/DispatchCenter.vue`

- [ ] **步骤1：统一列表与筛选**

添加统一的任务列表和筛选功能，支持按任务类型、状态等筛选。

- [ ] **步骤2：添加冲突处理动作**

添加冲突处理相关的操作按钮和逻辑，支持插单、排队、替换、并入、取消等动作。

### 任务6：任务中心功能补齐

**Files:**
- Modify: `/Users/ldh/Downloads/project/极客光年/bot/src/views/inspection/task/InspectionTaskList.vue`
- Modify: `/Users/ldh/Downloads/project/极客光年/bot/src/views/inspection/task/InspectionTaskDetail.vue`

- [ ] **步骤1：完善详情链路**

确保从任务列表到任务详情的跳转正常，详情页显示完整的任务信息。

- [ ] **步骤2：添加轨迹/结果/复盘页面**

完善 ExecutionTrace.vue、CheckResult.vue、TaskReview.vue 页面，添加相应的功能和数据展示。

### 任务7：异常中心功能补齐

**Files:**
- Modify: `/Users/ldh/Downloads/project/极客光年/bot/src/views/inspection/ExceptionLogViewer.vue`

- [ ] **步骤1：添加列表筛选**

添加异常列表的筛选功能，支持按异常类型、状态、时间等筛选。

- [ ] **步骤2：完善详情与处理状态流**

完善 ExceptionDetail.vue、ExceptionHandle.vue 页面，添加异常处理状态流和相关操作。

### 任务8：报表统计功能补齐

**Files:**
- Modify: `/Users/ldh/Downloads/project/极客光年/bot/src/views/smart-inspection/InspectionStatistics.vue`

- [ ] **步骤1：统一筛选**

添加统一的筛选功能，支持按时间范围、计划、区域等筛选。

- [ ] **步骤2：完善三类分析展示**

完善巡检分析、调度分析、异常分析页面，添加相应的图表和数据展示。

## 四、回归扫尾（防反复发问题）

### 任务9：路由残留专项修复

**Files:**
- Grep: 全局搜索旧路由前缀

- [ ] **步骤1：全局扫描旧路由前缀**

```bash
rg "inspection" --type vue --type ts src/
```

- [ ] **步骤2：替换旧路由前缀**

将所有旧路由前缀 `/inspection/` 替换为新的管理端路由前缀 `/management/plan/`、`/management/task/` 等。

### 任务10：空页面专项检查

**Files:**
- 所有管理端页面

- [ ] **步骤1：遍历所有管理端菜单**

手动点击所有管理端菜单项，确保没有空白页或404页面。

- [ ] **步骤2：修复空页面问题**

对发现的空页面问题进行修复，确保所有页面都能正常访问。

### 任务11：子页面回跳专项检查

**Files:**
- 所有编辑/详情页面

- [ ] **步骤1：检查返回路径**

确保所有编辑/详情页面的返回路径都指向对应列表的新路由。

- [ ] **步骤2：修复回跳问题**

对发现的回跳问题进行修复，确保返回路径正确。

### 任务12：菜单合理性专项检查

**Files:**
- `/Users/ldh/Downloads/project/极客光年/bot/src/components/layout/AppLayout.vue`

- [ ] **步骤1：检查菜单结构**

确保编辑类页面没有在主菜单独立暴露，所有编辑页面都从列表页进入。

- [ ] **步骤2：调整菜单结构**

对发现的菜单合理性问题进行调整，确保菜单结构符合规范。

## 五、测试与交付

### 任务13：结构闸门测试

- [ ] **步骤1：验证5组菜单全部可见**

检查管理端是否显示计划管理、总调度台、任务中心、异常中心、报表统计5组菜单。

- [ ] **步骤2：验证菜单-路由-页面一致**

确保每个菜单项都有对应的路由和可访问的页面。

### 任务14：路由闸门测试

- [ ] **步骤1：验证页面内跳转无旧前缀残留**

检查所有页面内的跳转链接，确保没有使用旧的路由前缀。

- [ ] **步骤2：验证无404、无空白页、无错误回跳**

测试所有管理端页面，确保没有404错误、空白页面或错误的回跳路径。

### 任务15：功能闸门测试

- [ ] **步骤1：验证核心链路可跑通**

测试计划管理、调度中心、任务中心、异常中心、报表统计的核心链路，确保功能正常。

### 任务16：边界闸门测试

- [ ] **步骤1：验证管理端不出现实施平台构建能力入口**

检查管理端页面，确保没有包含实施平台的构建能力入口，如地图初始化、点位预标、现场校准、检测项底层配置等。

### 任务17：交付闸门测试

- [ ] **步骤1：准备代码改动清单**

整理所有改动的文件清单。

- [ ] **步骤2：准备新增/变更路由清单**

整理所有新增或变更的路由清单。

- [ ] **步骤3：准备自测结果**

记录所有测试的结果和发现的问题。

- [ ] **步骤4：准备未完成项与原因**

记录所有未完成的项目和原因。

## 六、交付清单

- [ ] 改动文件清单
- [ ] 新增/变更路由清单
- [ ] 自测结果
- [ ] 未完成项与原因

---

**Plan complete and saved to `/Users/ldh/Downloads/project/极客光年/bot/src/docs/superpowers/plans/2026-04-12-management-console-implementation.md`.**

**Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**