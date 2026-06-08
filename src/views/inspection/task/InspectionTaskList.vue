
<template>
  <div class="inspection-task-list">
    <a-page-header title="执行任务" :sub-title="pageSubTitle" @back="goBack" />

    <a-card style="margin-top: 16px">
      <div class="scene-switch" style="margin-bottom: 12px">
        <button
          v-for="item in sceneOptions"
          :key="item.value"
          type="button"
          class="scene-switch__item"
          :class="{ 'scene-switch__item--active': activeScene === item.value }"
          @click="activeScene = item.value"
        >
          {{ item.label }}
        </button>
      </div>
      <a-alert type="info" show-icon style="margin-bottom: 12px" :message="`执行任务由执行规划派生，真正控制机器人执行的是任务快照。当前任务生成周期是：${taskWindowLabel}`" />

      <div class="scene-summary">
        <a-card size="small"><span>当前场景任务数</span><strong>{{ filteredTasks.length }}</strong></a-card>
        <a-card size="small"><span>装置数</span><strong>{{ taskSummary.installationCount }}</strong></a-card>
        <a-card size="small"><span>设施/管路数</span><strong>{{ taskSummary.facilityCount }}</strong></a-card>
        <a-card size="small"><span>部件数</span><strong>{{ taskSummary.componentCount }}</strong></a-card>
        <a-card size="small"><span>规则数</span><strong>{{ taskSummary.ruleCount }}</strong></a-card>
      </div>

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
                  <a-select-option value="work_ticket_guard">作业票监护</a-select-option>
                  <a-select-option value="emergency_arrival">应急到场</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="任务来源" class="search-item">
                <a-select v-model:value="searchForm.taskSource" placeholder="请选择任务来源" allow-clear>
                  <a-select-option value="execution_plan">执行规划派生</a-select-option>
                  <a-select-option value="dispatch_insert">总调度台插单</a-select-option>
                  <a-select-option value="auto_recheck">自动补检</a-select-option>
                  <a-select-option value="work_ticket">作业票任务</a-select-option>
                  <a-select-option value="third_party">第三方任务</a-select-option>
                  <a-select-option value="emergency">事故/异常快速到场</a-select-option>
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
              <a-form-item label="装置" class="search-item">
                <a-select v-model:value="searchForm.installationId" placeholder="请选择装置" allow-clear show-search>
                  <a-select-option v-for="installation in installationOptions" :key="installation.id" :value="installation.id">{{ installation.name }}</a-select-option>
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
              <a-form-item label="优先级" class="search-item">
                <a-select v-model:value="searchForm.priorityLevel" placeholder="请选择优先级" allow-clear>
                  <a-select-option value="normal">普通</a-select-option>
                  <a-select-option value="high">高</a-select-option>
                  <a-select-option value="emergency">应急</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="作业票/第三方单号" class="search-item">
                <a-input v-model:value="searchForm.thirdPartyTaskNo" placeholder="请输入单号" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="执行起止时间" class="search-item">
                <a-input v-model:value="searchForm.startDate" placeholder="YYYY-MM-DD" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="创建时间" class="search-item">
                <a-input v-model:value="searchForm.endDate" placeholder="YYYY-MM-DD" allow-clear />
              </a-form-item>
            </a-col>
          </a-row>
          <div class="search-actions">
            <a-space>
              <a-button type="primary" @click="handleSearch">搜索</a-button>
              <a-button @click="handleReset">重置</a-button>
            </a-space>
          </div>
        </a-form>
      </div>

      <a-table :columns="columns" :data-source="filteredTasks" :loading="loading" row-key="id" :scroll="{ x: 1700 }">
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
          <template v-else-if="column.key === 'priorityLevel'">
            <a-tag :color="record.priorityLevel === 'emergency' ? 'red' : record.priorityLevel === 'high' ? 'orange' : 'default'">{{ record.priorityLevel === 'emergency' ? '应急' : record.priorityLevel === 'high' ? '高' : '普通' }}</a-tag>
          </template>
          <template v-else-if="column.key === 'interruptsCurrentTask'">
            {{ record.interruptsCurrentTask ? '是' : '否' }}
          </template>
          <template v-else-if="column.key === 'regionNames'">
            <a-space wrap>
              <a-tag v-for="region in record.regionNames" :key="region">{{ region }}</a-tag>
              <span v-if="!record.regionNames?.length">-</span>
            </a-space>
          </template>
          <template v-else-if="column.key === 'installationNames'">
            <a-space wrap>
              <a-tag v-for="installation in record.installationNames" :key="installation">{{ installation }}</a-tag>
              <span v-if="!record.installationNames?.length">-</span>
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
const activeScene = ref('all')

const searchForm = reactive({
  name: '',
  code: '',
  robotId: undefined as string | undefined,
  installationId: undefined as string | undefined,
  status: undefined as string | undefined,
  businessScene: undefined as string | undefined,
  taskSource: undefined as string | undefined,
  priorityLevel: undefined as string | undefined,
  feedbackStatus: undefined as string | undefined,
  thirdPartyTaskNo: '',
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
  { title: '状态', key: 'status', width: 100 },
  { title: '所属规划', key: 'planSource', width: 180 },
  { title: '规划类型', key: 'planType', width: 110 },
  { title: '任务场景', key: 'businessScene', width: 130 },
  { title: '任务来源', key: 'taskSource', width: 140 },
  { title: '优先级', key: 'priorityLevel', width: 90 },
  { title: '作业票/第三方单号', dataIndex: 'thirdPartyTaskNo', key: 'thirdPartyTaskNo', width: 150 },
  { title: '中断当前任务', key: 'interruptsCurrentTask', width: 110 },
  { title: '巡检区域', key: 'regionNames', width: 220 },
  { title: '巡检装置', key: 'installationNames', width: 220 },
  { title: '装置数', dataIndex: 'installationCount', key: 'installationCount', width: 100 },
  { title: '巡检设施数', dataIndex: 'facilityCount', key: 'facilityCount', width: 120 },
  { title: '部件数', dataIndex: 'componentCount', key: 'componentCount', width: 120 },
  { title: '巡检规则数', dataIndex: 'ruleCount', key: 'ruleCount', width: 120 },
  { title: '执行机器人', key: 'robot', width: 150 },
  { title: '异常数', dataIndex: 'exceptionCount', key: 'exceptionCount', width: 90 },
  { title: '执行时间', key: 'timeRange', width: 280 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'actions', width: 100, fixed: 'right' }
]

const sceneOptions = [
  { label: '全部', value: 'all' },
  { label: '日常巡检', value: 'daily_inspection' },
  { label: '作业票监护', value: 'work_ticket_guard' },
]

function getStatusText(status: string) {
  return ({ pending: '待执行', running: '执行中', completed: '已完成', paused: '已暂停', cancelled: '已取消', failed: '失败' } as Record<string, string>)[status] || status
}

function getStatusColor(status: string) {
  return ({ pending: 'default', running: 'blue', completed: 'green', paused: 'orange', cancelled: 'default', failed: 'red' } as Record<string, string>)[status] || 'default'
}

function getSceneText(scene?: string) {
  return ({ daily_inspection: '日常巡检', hazard_screening: '隐患排查', environment_check: '环境检查', operation_guard: '作业监护', work_ticket_guard: '作业票监护', emergency_arrival: '应急到场' } as Record<string, string>)[scene || ''] || '日常巡检'
}

function getSceneColor(scene?: string) {
  return ({ daily_inspection: 'blue', hazard_screening: 'volcano', environment_check: 'green', operation_guard: 'purple', work_ticket_guard: 'gold', emergency_arrival: 'red' } as Record<string, string>)[scene || ''] || 'blue'
}

function getTaskSourceText(source?: string) {
  return ({
    execution_plan: '执行规划派生',
    dispatch_insert: '总调度台插单',
    auto_recheck: '自动补检',
    work_ticket: '作业票任务',
    third_party: '第三方任务',
    emergency: '事故/异常快速到场',
    manual: '人工创建',
    manual_plan: '执行规划派生',
    auto_plan: '执行规划派生'
  } as Record<string, string>)[source || ''] || '执行规划派生'
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

const installationOptions = computed(() => {
  if (inspectionStore.installations.length) return inspectionStore.installations
  const map = new Map<string, string>()
  inspectionStore.inspectionDevices.forEach((device: any) => {
    if (device.installationId) map.set(device.installationId, device.installationName || device.installationId)
  })
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
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

function getFacilitiesByPointIds(pointIds: string[]) {
  const regionIds = new Set(inspectionStore.inspectionPoints.filter((point: any) => pointIds.includes(point.id) && point.areaId).map((point: any) => point.areaId))
  return inspectionStore.inspectionDevices.filter((device: any) => regionIds.has(device.areaId) || pointIds.includes(device.inspectionPointId))
}

function getRuleCount(devices: any[]) {
  const ruleIds = new Set<string>()
  const components = inspectionStore.facilityComponents.filter((component: any) => devices.some((device: any) => device.id === component.facilityId))
  if (components.length) {
    components.forEach((component: any) => (component.ruleIds || []).forEach((ruleId: string) => ruleIds.add(ruleId)))
    return ruleIds.size
  }
  devices.forEach((device: any) => {
    ;(device.objectDetectionConfigs || []).forEach((config: any) => {
      if (config.enabled && config.ruleId) ruleIds.add(config.ruleId)
    })
    ;(device.assetComponents || []).forEach((component: any) => (component.ruleIds || []).forEach((ruleId: string) => ruleIds.add(ruleId)))
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
  const regionIds = plan ? getPlanRegionIds(plan) : Array.from(new Set(inspectionStore.inspectionPoints
    .filter((point: any) => (task.inspectionPointIds || []).includes(point.id) && point.areaId)
    .map((point: any) => point.areaId)))
  const facilities = plan ? getPlanFacilities(plan) : getFacilitiesByPointIds(task.inspectionPointIds || [])
  const installationIds = Array.from(new Set(facilities.map((device: any) => device.installationId).filter(Boolean)))
  const installationNames = installationIds.map((id) => installationOptions.value.find((item: any) => item.id === id)?.name || facilities.find((device: any) => device.installationId === id)?.installationName || id)
  const sceneOptions = ['daily_inspection', 'hazard_screening', 'environment_check', 'operation_guard', 'work_ticket_guard', 'emergency_arrival']
  const sourceOptions = ['execution_plan', 'dispatch_insert', 'auto_recheck', 'work_ticket', 'third_party', 'emergency', 'manual']
  const riskOptions = ['normal', 'warning', 'alarm', 'critical_alarm', 'hazard', 'major_hazard']
  const linkedComponents = inspectionStore.facilityComponents.filter((component: any) => facilities.some((device: any) => device.id === component.facilityId))
  const componentCount = linkedComponents.length ? linkedComponents.length : facilities.reduce((sum: number, device: any) => sum + (device.assetComponents?.length || 0), 0)
  return {
    ...task,
    businessScene: task.businessScene || plan?.businessScene || sceneOptions[index % sceneOptions.length],
    taskSource: task.taskSource || (plan ? 'execution_plan' : sourceOptions[index % sourceOptions.length]),
    planType,
    riskLevel: task.riskLevel || plan?.riskLevel || riskOptions[index % riskOptions.length],
    regionIds,
    regionNames: regionIds.map((id: string) => getRegionName(id)),
    installationIds,
    installationNames,
    installationCount: installationIds.length,
    facilityCount: facilities.length,
    componentCount,
    ruleCount: getRuleCount(facilities),
    priorityLevel: task.priorityLevel || (task.taskSource === 'emergency' ? 'emergency' : task.taskSource === 'work_ticket' || task.taskSource === 'third_party' ? 'high' : 'normal'),
    thirdPartyTaskNo: task.thirdPartyTaskNo || (task.taskSource === 'work_ticket' ? `WT-${String(index + 1).padStart(3, '0')}` : task.taskSource === 'third_party' ? `TP-${String(index + 1).padStart(3, '0')}` : '-'),
    interruptsCurrentTask: task.interruptsCurrentTask ?? (task.taskSource === 'emergency'),
    feedbackStatus: task.feedbackStatus || (task.taskSource === 'work_ticket' || task.taskSource === 'third_party' ? (index % 3 === 0 ? 'pending' : 'success') : ''),
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

function parseSearchDate(value: string, boundary: 'start' | 'end') {
  const normalized = value.trim()
  if (!normalized) return undefined
  const date = new Date(`${normalized}T${boundary === 'start' ? '00:00:00' : '23:59:59'}`)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function matchesTaskDateRange(task: any) {
  const searchStart = parseSearchDate(searchForm.startDate, 'start')
  const searchEnd = parseSearchDate(searchForm.endDate, 'end')
  const taskStart = getTaskStartTime(task)
  const taskEnd = getTaskEndTime(task)
  const matchStart = !searchStart || taskEnd.getTime() >= searchStart.getTime()
  const matchEnd = !searchEnd || taskStart.getTime() <= searchEnd.getTime()
  return matchStart && matchEnd
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
  const thirdPartyTaskNo = searchForm.thirdPartyTaskNo.trim().toLowerCase()
  return tasks.value.filter((task) => {
    const matchName = !name || String(task.name).toLowerCase().includes(name)
    const matchCode = !code || String(task.code).toLowerCase().includes(code)
    const matchRobot = !searchForm.robotId || task.robotId === searchForm.robotId
    const matchInstallation = !searchForm.installationId || (task.installationIds || []).includes(searchForm.installationId)
    const matchStatus = !searchForm.status || task.status === searchForm.status
    const matchScene = (!searchForm.businessScene || task.businessScene === searchForm.businessScene) && (activeScene.value === 'all' || task.businessScene === activeScene.value)
    const matchSource = !searchForm.taskSource || task.taskSource === searchForm.taskSource
    const matchPriority = !searchForm.priorityLevel || task.priorityLevel === searchForm.priorityLevel
    const matchFeedback = !searchForm.feedbackStatus || task.feedbackStatus === searchForm.feedbackStatus
    const matchThirdPartyTaskNo = !thirdPartyTaskNo || String(task.thirdPartyTaskNo || '').toLowerCase().includes(thirdPartyTaskNo)
    const matchDateRange = matchesTaskDateRange(task)
    return matchName && matchCode && matchRobot && matchInstallation && matchStatus && matchScene && matchSource && matchPriority && matchFeedback && matchThirdPartyTaskNo && matchDateRange
  })
})

const taskSummary = computed(() => ({
  installationCount: new Set(filteredTasks.value.flatMap((task: any) => task.installationIds || [])).size,
  facilityCount: filteredTasks.value.reduce((sum: number, task: any) => sum + (task.facilityCount || 0), 0),
  componentCount: filteredTasks.value.reduce((sum: number, task: any) => sum + (task.componentCount || 0), 0),
  ruleCount: filteredTasks.value.reduce((sum: number, task: any) => sum + (task.ruleCount || 0), 0)
}))

function handleReset() {
  searchForm.name = ''
  searchForm.code = ''
  searchForm.robotId = undefined
  searchForm.installationId = undefined
  searchForm.status = undefined
  searchForm.businessScene = undefined
  searchForm.taskSource = undefined
  searchForm.priorityLevel = undefined
  searchForm.feedbackStatus = undefined
  searchForm.thirdPartyTaskNo = ''
  searchForm.startDate = ''
  searchForm.endDate = ''
}

function handleSearch() {
  // 当前页面通过 computed 实时过滤，保留显式搜索按钮以符合管理页交互规范。
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
.scene-summary {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}
.scene-summary strong {
  display: block;
  margin-top: 6px;
  font-size: 22px;
}
.scene-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: linear-gradient(180deg, #fcfcfd, #f8fafc);
}
.scene-switch__item {
  min-width: 108px;
  padding: 9px 14px;
  border: 1px solid #dbe2ea;
  border-radius: 999px;
  background: #fff;
  color: #475569;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
}
.scene-switch__item:hover {
  border-color: #94a3b8;
  color: #0f172a;
}
.scene-switch__item--active {
  border-color: #0f766e;
  background: #0f766e;
  color: #fff;
  box-shadow: 0 8px 16px -12px rgba(15, 118, 110, 0.9);
}
</style>
