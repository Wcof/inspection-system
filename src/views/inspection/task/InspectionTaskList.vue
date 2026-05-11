
<template>
  <div class="inspection-task-list">
    <a-page-header title="执行任务" :sub-title="pageSubTitle" @back="goBack" />

    <a-card style="margin-top: 16px">
      <a-alert type="info" show-icon style="margin-bottom: 12px" :message="`执行任务由执行规划派生，真正控制机器人执行的是任务快照。当前任务生成周期是：${taskWindowLabel}`" />

      <div class="search-panel">
        <a-form layout="vertical" :model="searchForm" @submit.prevent>
          <a-row :gutter="[16, 8]">
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="任务名称" class="search-item">
                <a-input v-model:value="searchForm.name" placeholder="请输入任务名称" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="任务编码" class="search-item">
                <a-input v-model:value="searchForm.code" placeholder="请输入任务编码" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="任务场景" class="search-item">
                <a-select v-model:value="searchForm.businessScene" placeholder="请选择任务场景" allow-clear>
                  <a-select-option value="daily_inspection">日常巡检</a-select-option>
                  <a-select-option value="hazard_screening">隐患排查</a-select-option>
                  <a-select-option value="environment_check">环境检查</a-select-option>
                  <a-select-option value="operation_guard">作业监护</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="任务来源" class="search-item">
                <a-select v-model:value="searchForm.taskSource" placeholder="请选择任务来源" allow-clear>
                  <a-select-option value="manual_plan">人工规划派生</a-select-option>
                  <a-select-option value="auto_plan">自动规划派生</a-select-option>
                  <a-select-option value="dispatch_insert">总调度台插单</a-select-option>
                  <a-select-option value="auto_recheck">自动补检</a-select-option>
                  <a-select-option value="ehs">EHS 下发</a-select-option>
                  <a-select-option value="manual">人工创建</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="执行机器人" class="search-item">
                <a-select v-model:value="searchForm.robotId" placeholder="请选择执行机器人" allow-clear>
                  <a-select-option v-for="robot in robotStore.robots" :key="robot.id" :value="robot.id">{{ robot.name }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="状态" class="search-item">
                <a-select v-model:value="searchForm.status" placeholder="请选择状态" allow-clear>
                  <a-select-option value="pending">待执行</a-select-option>
                  <a-select-option value="running">执行中</a-select-option>
                  <a-select-option value="completed">已完成</a-select-option>
                  <a-select-option value="paused">已暂停</a-select-option>
                  <a-select-option value="cancelled">已取消</a-select-option>
                  <a-select-option value="failed">失败</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="时间范围（起）" class="search-item">
                <a-input v-model:value="searchForm.startDate" placeholder="YYYY-MM-DD" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="时间范围（止）" class="search-item">
                <a-input v-model:value="searchForm.endDate" placeholder="YYYY-MM-DD" allow-clear />
              </a-form-item>
            </a-col>
          </a-row>
          <div class="search-actions">
            <a-space>
              <a-button type="primary">搜索</a-button>
              <a-button @click="handleReset">重置</a-button>
            </a-space>
          </div>
        </a-form>
      </div>

      <a-table :columns="columns" :data-source="filteredTasks" :loading="loading" row-key="id" :scroll="{ x: 1280 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'businessScene'">
            <a-tag :color="getSceneColor(record.businessScene)">{{ getSceneText(record.businessScene) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'taskSource'">
            {{ getTaskSourceText(record.taskSource) }}
          </template>
          <template v-else-if="column.key === 'riskLevel'">
            <a-tag :color="getRiskColor(record.riskLevel)">{{ getRiskText(record.riskLevel) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'robot'">
            {{ getRobotName(record.robotId) }}
          </template>
          <template v-else-if="column.key === 'pointCount'">
            {{ record.inspectionPointIds?.length || 0 }}
          </template>
          <template v-else-if="column.key === 'planSource'">
            {{ getPlanName(record.planId) }}
          </template>
          <template v-else-if="column.key === 'planType'">
            <a-tag :color="record.planType === 'auto' ? 'purple' : 'blue'">{{ getPlanTypeText(record.planType) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'regionNames'">
            <a-space wrap>
              <a-tag v-for="region in record.regionNames" :key="region">{{ region }}</a-tag>
              <span v-if="!record.regionNames?.length">-</span>
            </a-space>
          </template>
          <template v-else-if="column.key === 'timeRange'">
            {{ getTaskTimeRangeText(record) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-button type="link" size="small" @click="viewDetail(record.id)">详情</a-button>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import { useRobotStore } from '@/stores/robot'

type TaskRow = any

const router = useRouter()
const route = useRoute()
const inspectionStore = useInspectionStore()
const robotStore = useRobotStore()

const loading = ref(false)
const tasks = ref<TaskRow[]>([])
const taskWindowLabel = ref('根据规划，任务开始前 7 天自动创建')

const searchForm = reactive({
  name: '',
  code: '',
  robotId: undefined as string | undefined,
  status: undefined as string | undefined,
  businessScene: undefined as string | undefined,
  taskSource: undefined as string | undefined,
  startDate: '',
  endDate: ''
})

const pageSubTitle = computed(() => {
  const planId = route.query.planId as string
  if (!planId) return '任务列表按时间范围查看，可从执行规划或总调度台进入'
  const plan = inspectionStore.inspectionPlans.find((item: any) => item.id === planId)
  return plan ? `所属规划：${plan.name}` : '所属规划任务'
})

const columns = [
  { title: '任务名称', dataIndex: 'name', key: 'name', width: 220 },
  { title: '编码', dataIndex: 'code', key: 'code', width: 160 },
  { title: '所属规划', key: 'planSource', width: 180 },
  { title: '规划类型', key: 'planType', width: 110 },
  { title: '任务场景', key: 'businessScene', width: 130 },
  { title: '任务来源', key: 'taskSource', width: 140 },
  { title: '巡检区域', key: 'regionNames', width: 220 },
  { title: '巡检设施数', dataIndex: 'facilityCount', key: 'facilityCount', width: 120 },
  { title: '部件/连接数', dataIndex: 'componentConnectionCount', key: 'componentConnectionCount', width: 120 },
  { title: '巡检规则数', dataIndex: 'ruleCount', key: 'ruleCount', width: 120 },
  { title: '执行机器人', key: 'robot', width: 150 },
  { title: '异常数', dataIndex: 'exceptionCount', key: 'exceptionCount', width: 90 },
  { title: '状态', key: 'status', width: 100 },
  { title: '执行时间', key: 'timeRange', width: 280 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'actions', width: 100, fixed: 'right' }
]

function getStatusText(status: string) {
  return ({ pending: '待执行', running: '执行中', completed: '已完成', paused: '已暂停', cancelled: '已取消', failed: '失败' } as Record<string, string>)[status] || status
}

function getStatusColor(status: string) {
  return ({ pending: 'default', running: 'blue', completed: 'green', paused: 'orange', cancelled: 'default', failed: 'red' } as Record<string, string>)[status] || 'default'
}

function getSceneText(scene?: string) {
  return ({ daily_inspection: '日常巡检', hazard_screening: '隐患排查', environment_check: '环境检查', operation_guard: '作业监护' } as Record<string, string>)[scene || ''] || '日常巡检'
}

function getSceneColor(scene?: string) {
  return ({ daily_inspection: 'blue', hazard_screening: 'volcano', environment_check: 'green', operation_guard: 'purple' } as Record<string, string>)[scene || ''] || 'blue'
}

function getTaskSourceText(source?: string) {
  return ({ execution_plan: '调度规划派生', dispatch_insert: '总调度台插单', auto_recheck: '自动补检', ehs: 'EHS下发', manual: '人工创建', manual_plan: '人工规划派生', auto_plan: '自动规划派生' } as Record<string, string>)[source || ''] || '调度系统派生'
}

function getPlanTypeText(type?: string) {
  return ({ manual: '人工', auto: '自动' } as Record<string, string>)[type || ''] || '人工'
}

function getRiskText(level?: string) {
  return ({ normal: '普通', warning: '预警', alarm: '告警', critical_alarm: '严重告警', hazard: '隐患', major_hazard: '重大隐患' } as Record<string, string>)[level || ''] || '普通'
}

function getRiskColor(level?: string) {
  return ({ normal: 'default', warning: 'gold', alarm: 'orange', critical_alarm: 'red', hazard: 'volcano', major_hazard: 'magenta' } as Record<string, string>)[level || ''] || 'default'
}

function getRobotName(robotId: string) {
  return robotStore.robots.find((robot: any) => robot.id === robotId)?.name || robotId || '-'
}

function getPlanName(planId?: string) {
  if (!planId) return '-'
  return inspectionStore.inspectionPlans.find((item: any) => item.id === planId)?.name || '-'
}

const regionOptions = computed(() => {
  const regionMap = new Map<string, string>()
  inspectionStore.inspectionMaps.forEach((map: any) => {
    ;(map.regions || []).forEach((region: any) => regionMap.set(region.id, `${map.name} / ${region.name}`))
  })
  return Array.from(regionMap.entries()).map(([id, name]) => ({ id, name }))
})

function getRegionName(regionId?: string) {
  if (!regionId) return '未配置区域'
  return regionOptions.value.find((region) => region.id === regionId)?.name || regionId
}

function getPlanRegionIds(plan: any) {
  if (plan?.regionIds?.length) return [...new Set(plan.regionIds)]
  return [...new Set(inspectionStore.inspectionPoints
    .filter((point: any) => (plan?.inspectionPointIds || []).includes(point.id) && point.areaId)
    .map((point: any) => point.areaId))]
}

function getPlanFacilities(plan: any) {
  const regionIds = getPlanRegionIds(plan)
  return inspectionStore.inspectionDevices.filter((device: any) => {
    if (plan?.facilityIds?.length) return plan.facilityIds.includes(device.id)
    return regionIds.includes(device.areaId)
  })
}

function getRuleCount(devices: any[]) {
  const ruleIds = new Set<string>()
  devices.forEach((device: any) => {
    ;(device.objectDetectionConfigs || []).forEach((config: any) => {
      if (config.enabled && config.ruleId) ruleIds.add(config.ruleId)
    })
    ;(device.assetComponents || []).forEach((component: any) => (component.ruleIds || []).forEach((ruleId: string) => ruleIds.add(ruleId)))
    ;(device.connectionObjects || []).forEach((connection: any) => (connection.ruleIds || []).forEach((ruleId: string) => ruleIds.add(ruleId)))
  })
  return ruleIds.size
}

function buildDerivedTaskFromPlan(plan: any, index: number) {
  const regionIds = getPlanRegionIds(plan)
  const pointIds = plan.inspectionPointIds?.length
    ? plan.inspectionPointIds
    : inspectionStore.inspectionPoints.filter((point: any) => regionIds.includes(point.areaId)).map((point: any) => point.id)
  const startTime = new Date(Date.now() + (index + 1) * 30 * 60 * 1000)
  return {
    id: `derived-${plan.id}`,
    planId: plan.id,
    name: `${plan.name}-派生任务`,
    code: `TASK-${plan.code || plan.id}`,
    robotId: 'robot-001',
    routeId: plan.routeId || '',
    type: 'point',
    status: 'pending',
    inspectionPointIds: pointIds,
    currentInspectionPointIndex: 0,
    schedule: {
      startTime,
      endTime: new Date(startTime.getTime() + Math.max(1, pointIds.length) * 10 * 60 * 1000)
    },
    config: plan.config || { autoStart: true, notifyOnComplete: true, notifyOnError: true, autoResumeAfterInterrupt: true },
    exceptionStrategy: plan.exceptionStrategy || {},
    exceptionLog: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    derivedFromPlan: true
  }
}

function enrichTask(task: any, index: number) {
  const plan = inspectionStore.inspectionPlans.find((item: any) => item.id === task.planId) as any
  const isDailyRoutineTask = task.name === '每日例行巡检' || task.planId === 'plan-001'
  const planType = isDailyRoutineTask ? 'auto' : (task.planType || plan?.planType || 'manual')
  const regionIds = plan ? getPlanRegionIds(plan) : []
  const facilities = plan ? getPlanFacilities(plan) : []
  const sceneOptions = ['daily_inspection', 'hazard_screening', 'environment_check', 'operation_guard']
  const sourceOptions = ['execution_plan', 'dispatch_insert', 'auto_recheck', 'ehs', 'manual']
  const riskOptions = ['normal', 'warning', 'alarm', 'critical_alarm', 'hazard', 'major_hazard']
  const componentConnectionCount = facilities.reduce((sum: number, device: any) => sum + (device.assetComponents?.length || 0) + (device.connectionObjects?.length || 0), 0)
  return {
    ...task,
    businessScene: task.businessScene || plan?.businessScene || sceneOptions[index % sceneOptions.length],
    taskSource: task.taskSource || (planType === 'auto' ? 'auto_plan' : plan ? 'manual_plan' : sourceOptions[index % sourceOptions.length]),
    planType,
    riskLevel: task.riskLevel || plan?.riskLevel || riskOptions[index % riskOptions.length],
    regionIds,
    regionNames: regionIds.map((id: string) => getRegionName(id)),
    facilityCount: facilities.length,
    componentConnectionCount,
    ruleCount: getRuleCount(facilities),
    exceptionCount: task.exceptionCount ?? (index % 3),
    uninspectableCount: task.uninspectableCount ?? (index % 2),
    pendingReviewCount: task.pendingReviewCount ?? (index % 4 === 0 ? 1 : 0),
    createdAt: task.createdAt ? new Date(task.createdAt).toLocaleString() : '-'
  }
}

function getTaskStartTime(task: any) {
  return task?.schedule?.startTime ? new Date(task.schedule.startTime) : new Date(task.createdAt)
}

function getTaskEndTime(task: any) {
  if (task?.schedule?.endTime) return new Date(task.schedule.endTime)
  const start = getTaskStartTime(task)
  return new Date(start.getTime() + ((task.inspectionPointIds?.length || 1) * 8 * 60 * 1000))
}

function getTaskTimeRangeText(task: any) {
  const start = getTaskStartTime(task)
  const end = getTaskEndTime(task)
  return `${start.toLocaleString()} ~ ${end.toLocaleString()}`
}

function fetchTasks() {
  loading.value = true
  try {
    inspectionStore.initialize()
    robotStore.initialize()
    const planId = route.query.planId as string | undefined
    const existingTasks = [...inspectionStore.tasks]
    const existingPlanTaskIds = new Set(existingTasks.map((task: any) => task.planId).filter(Boolean))
    const derivedTasks = inspectionStore.inspectionPlans
      .filter((plan: any) => plan.status !== 'inactive' && !existingPlanTaskIds.has(plan.id))
      .map((plan: any, index: number) => buildDerivedTaskFromPlan(plan, index))
    const allTasks = [...existingTasks, ...derivedTasks].map(enrichTask)
    tasks.value = planId ? allTasks.filter((task: any) => task.planId === planId || !task.planId) : allTasks
  } finally {
    loading.value = false
  }
}

const filteredTasks = computed(() => {
  const name = searchForm.name.trim().toLowerCase()
  const code = searchForm.code.trim().toLowerCase()
  return tasks.value.filter((task) => {
    const timeRangeText = getTaskTimeRangeText(task)
    const matchName = !name || String(task.name).toLowerCase().includes(name)
    const matchCode = !code || String(task.code).toLowerCase().includes(code)
    const matchRobot = !searchForm.robotId || task.robotId === searchForm.robotId
    const matchStatus = !searchForm.status || task.status === searchForm.status
    const matchScene = !searchForm.businessScene || task.businessScene === searchForm.businessScene
    const matchSource = !searchForm.taskSource || task.taskSource === searchForm.taskSource
    const matchStart = !searchForm.startDate || timeRangeText.includes(searchForm.startDate)
    const matchEnd = !searchForm.endDate || timeRangeText.includes(searchForm.endDate)
    return matchName && matchCode && matchRobot && matchStatus && matchScene && matchSource && matchStart && matchEnd
  })
})

function handleReset() {
  searchForm.name = ''
  searchForm.code = ''
  searchForm.robotId = undefined
  searchForm.status = undefined
  searchForm.businessScene = undefined
  searchForm.taskSource = undefined
  searchForm.startDate = ''
  searchForm.endDate = ''
}

function viewDetail(id: string) {
  const current = tasks.value.find((item: any) => item.id === id)
  if (current?.derivedFromPlan) {
    inspectionStore.saveTask({
      ...current,
      createdAt: new Date(),
      updatedAt: new Date()
    })
  }
  router.push(`/management/task/detail/${id}`)
}

function goBack() {
  router.push('/management/plan/list')
}

onMounted(fetchTasks)
watch(() => route.query.planId, fetchTasks)
</script>

<style scoped lang="css">.inspection-task-list {
  width: 100%;
}
.inspection-task-list .search-panel {
  margin-bottom: 12px;
  padding: 12px 12px 4px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}
.inspection-task-list .search-item {
  margin-bottom: 8px;
}
.inspection-task-list .search-actions {
  display: flex;
  justify-content: flex-end;
  margin: 4px 0 8px;
}
</style>
