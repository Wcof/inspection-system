<template>
  <div class="temporary-task-list">
    <a-page-header title="临时任务" sub-title="包含临时插单、补检、作业票任务、第三方任务、应急快速到场" @back="goBack" />

    <a-card style="margin-top: 16px">
      <div class="scene-switch" style="margin-bottom: 12px">
        <button
          v-for="item in sceneOptions"
          :key="item.value"
          type="button"
          class="scene-switch__item"
          :class="{ 'scene-switch__item--active': activeTab === item.value }"
          @click="activeTab = item.value"
        >
          {{ item.label }}
        </button>
      </div>

      <div class="scene-summary">
        <a-card size="small"><span>当前分类任务</span><strong>{{ filteredTasks.length }}</strong></a-card>
        <a-card size="small"><span>装置数</span><strong>{{ taskSummary.installationCount }}</strong></a-card>
        <a-card size="small"><span>设施/管路数</span><strong>{{ taskSummary.facilityCount }}</strong></a-card>
        <a-card size="small"><span>巡检对象数</span><strong>{{ taskSummary.componentCount }}</strong></a-card>
        <a-card size="small"><span>规则数</span><strong>{{ taskSummary.ruleCount }}</strong></a-card>
      </div>

      <div class="search-panel">
        <a-form layout="vertical" :model="searchForm" @submit.prevent>
          <a-row :gutter="[16, 8]">
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="名称" class="search-item">
                <a-input v-model:value="searchForm.name" placeholder="请输入任务名称" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="编码" class="search-item">
                <a-input v-model:value="searchForm.code" placeholder="请输入任务编码" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="任务类型" class="search-item">
                <a-select v-model:value="searchForm.dispatchType" placeholder="请选择任务类型" allow-clear>
                  <a-select-option value="insert">插单</a-select-option>
                  <a-select-option value="recheck">补检</a-select-option>
                  <a-select-option value="work_ticket">作业票任务</a-select-option>
                  <a-select-option value="emergency">应急快速到场</a-select-option>
                </a-select>
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
              <a-form-item label="中断当前任务" class="search-item">
                <a-select v-model:value="searchForm.interruptsCurrentTask" placeholder="请选择" allow-clear>
                  <a-select-option value="true">是</a-select-option>
                  <a-select-option value="false">否</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="来自第三方" class="search-item">
                <a-select v-model:value="searchForm.fromThirdParty" placeholder="请选择" allow-clear>
                  <a-select-option value="true">是</a-select-option>
                  <a-select-option value="false">否</a-select-option>
                </a-select>
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

      <a-table :columns="columns" :data-source="filteredTasks" :loading="loading" row-key="id" :scroll="{ x: 1750 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'taskType'">
            <a-tag :color="getDispatchTypeColor(record.dispatchType)">{{ getDispatchTypeText(record.dispatchType) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'businessScene'">
            <a-tag :color="getSceneColor(record.businessScene)">{{ getSceneText(record.businessScene) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'robot'">{{ record.robotName || record.robotId || '-' }}</template>
          <template v-else-if="column.key === 'priorityLevel'">
            <a-tag :color="record.priorityLevel === 'emergency' ? 'red' : record.priorityLevel === 'high' ? 'orange' : 'default'">{{ record.priorityLevel === 'emergency' ? '应急' : record.priorityLevel === 'high' ? '高' : '普通' }}</a-tag>
          </template>
          <template v-else-if="column.key === 'interruptsCurrentTask'">{{ record.interruptsCurrentTask ? '是' : '否' }}</template>
          <template v-else-if="column.key === 'immediateDeparture'">{{ record.immediateDeparture ? '立即出发' : '否' }}</template>
          <template v-else-if="column.key === 'fromThirdParty'">{{ record.fromThirdParty ? '是' : '否' }}</template>
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
          <template v-else-if="column.key === 'timeRange'">{{ getTaskTimeRangeText(record) }}</template>
          <template v-else-if="column.key === 'actions'">
            <a-button type="link" size="small" @click="viewDetail(record.id)">详情</a-button>
            <a-button
              v-if="record.status === 'running' || record.status === 'paused'"
              type="link"
              size="small"
              danger
              @click="handleTerminate(record)"
            >终止</a-button>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { useInspectionStore } from '@/stores/inspection'
import { useRobotStore } from '@/stores/robot'
import type { InspectionTaskInstanceStatus } from '@/types/inspection'

const router = useRouter()
const inspectionStore = useInspectionStore()
const robotStore = useRobotStore()

const tasks = ref<any[]>([])
const loading = ref(false)
const activeTab = ref('all')
const searchForm = reactive({
  name: '',
  code: '',
  status: '',
  dispatchType: '',
  businessScene: '',
  robotId: '',
  installationId: '',
  priorityLevel: '',
  interruptsCurrentTask: '',
  fromThirdParty: '',
  startDate: '',
  endDate: ''
})

const columns = [
  { title: '任务名称', dataIndex: 'name', key: 'name', width: 220 },
  { title: '编码', dataIndex: 'code', key: 'code', width: 160 },
  { title: '状态', key: 'status', width: 100 },
  { title: '任务类型', key: 'taskType', width: 110 },
  { title: '任务场景', key: 'businessScene', width: 130 },
  { title: '任务来源', dataIndex: 'taskSourceText', key: 'taskSourceText', width: 180 },
  { title: '优先级', key: 'priorityLevel', width: 90 },
  { title: '巡检区域', key: 'regionNames', width: 220 },
  { title: '巡检装置', key: 'installationNames', width: 220 },
  { title: '装置数', dataIndex: 'installationCount', key: 'installationCount', width: 100 },
  { title: '巡检设施数', dataIndex: 'facilityCount', key: 'facilityCount', width: 120 },
  { title: '巡检对象数', dataIndex: 'componentCount', key: 'componentCount', width: 120 },
  { title: '巡检规则数', dataIndex: 'ruleCount', key: 'ruleCount', width: 120 },
  { title: '执行机器人', key: 'robot', width: 150 },
  { title: '异常数', dataIndex: 'exceptionCount', key: 'exceptionCount', width: 90 },
  { title: '执行时间', key: 'timeRange', width: 280 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'actions', width: 160, fixed: 'right' }
]

const sceneOptions = [
  { label: '全部', value: 'all' },
  { label: '临时补检', value: 'recheck' },
  { label: '应急到场', value: 'emergency_arrival' },
  { label: '临时插单', value: 'insert' }
]

function matchesSceneTab(task: any) {
  if (activeTab.value === 'all') return true
  if (activeTab.value === 'emergency_arrival') return task.businessScene === 'emergency_arrival' || task.dispatchType === 'emergency'
  return task.dispatchType === activeTab.value
}

function getStatusColor(status: InspectionTaskInstanceStatus): string {
  const colorMap: Record<InspectionTaskInstanceStatus, string> = {
    pending: 'default',
    running: 'blue',
    completed: 'green',
    paused: 'orange',
    processing: 'cyan',
    cancelled: 'default',
    terminated: 'red',
    failed: 'red'
  }
  return colorMap[status] || 'default'
}

function getStatusText(status: InspectionTaskInstanceStatus): string {
  const textMap: Record<InspectionTaskInstanceStatus, string> = {
    pending: '待执行',
    running: '执行中',
    completed: '已完成',
    paused: '已暂停',
    processing: '待处理',
    cancelled: '已取消',
    terminated: '已终止',
    failed: '失败'
  }
  return textMap[status] || status
}

function getDispatchTypeText(type?: string) {
  if (type === 'work_ticket') return '作业票任务'
  if (type === 'emergency') return '应急快速到场'
  if (type === 'charging') return '充电'
  if (type === 'parking') return '停车'
  if (type === 'replace_robot') return '替换机器人'
  if (type === 'recheck') return '补检'
  return '插单'
}

function getSceneText(scene?: string) {
  return ({ daily_inspection: '日常巡检', hazard_screening: '隐患排查', environment_check: '环境检查', operation_guard: '作业监护', work_ticket_guard: '作业票监护', emergency_arrival: '应急到场' } as Record<string, string>)[scene || ''] || '日常巡检'
}

function getSceneColor(scene?: string) {
  return ({ daily_inspection: 'blue', hazard_screening: 'volcano', environment_check: 'green', operation_guard: 'purple', work_ticket_guard: 'gold', emergency_arrival: 'red' } as Record<string, string>)[scene || ''] || 'blue'
}

function getDispatchTypeColor(type?: string) {
  if (type === 'work_ticket') return 'gold'
  if (type === 'third_party') return 'cyan'
  if (type === 'emergency') return 'red'
  if (type === 'charging') return 'blue'
  if (type === 'parking') return 'purple'
  if (type === 'replace_robot') return 'orange'
  if (type === 'recheck') return 'red'
  return 'processing'
}

function getTaskStartTime(task: any): Date {
  if (task?.schedule?.startTime) return new Date(task.schedule.startTime)
  return new Date(task.createdAt)
}

function getTaskEndTime(task: any): Date {
  if (task?.schedule?.endTime) return new Date(task.schedule.endTime)
  const start = getTaskStartTime(task)
  const pointCount = task?.inspectionPointIds?.length || 1
  return new Date(start.getTime() + pointCount * 8 * 60 * 1000)
}

function getTaskStartTimeText(task: any): string {
  return getTaskStartTime(task).toLocaleString()
}

function getTaskEndTimeText(task: any): string {
  return getTaskEndTime(task).toLocaleString()
}

function getTaskTimeRangeText(task: any): string {
  return `${getTaskStartTimeText(task)} ~ ${getTaskEndTimeText(task)}`
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

function enrichTemporaryTask(task: any, index: number) {
  const pointIds = task.inspectionPointIds || []
  const points = inspectionStore.inspectionPoints.filter((point: any) => pointIds.includes(point.id))
  const regionIds = Array.from(new Set(points.map((point: any) => point.areaId).filter(Boolean)))
  const facilities = getFacilitiesByPointIds(pointIds)
  const installationIds = Array.from(new Set(facilities.map((device: any) => device.installationId).filter(Boolean)))
  const installationNames = installationIds.map((id) => installationOptions.value.find((item: any) => item.id === id)?.name || facilities.find((device: any) => device.installationId === id)?.installationName || id)
  const linkedComponents = inspectionStore.facilityComponents.filter((component: any) => facilities.some((device: any) => device.id === component.facilityId))
  return {
    ...task,
    dispatchType: task.dispatchType || inferDispatchType(task),
    businessScene: task.businessScene || inferBusinessScene(task),
    taskSource: task.taskSource || inferTaskSource(task),
    taskSourceText: getTaskSourceText(task.taskSource || inferTaskSource(task)),
    riskLevel: task.riskLevel || (task.dispatchType === 'recheck' ? 'alarm' : 'normal'),
    robotName: task.robotName || robotStore.robots.find((robot: any) => robot.id === task.robotId)?.name || '巡检机器人-01',
    regionNames: regionIds.map((id) => getRegionName(String(id))),
    installationIds,
    installationNames,
    installationCount: installationIds.length,
    facilityCount: facilities.length,
    componentCount: linkedComponents.length ? linkedComponents.length : facilities.reduce((sum: number, device: any) => sum + (device.assetComponents?.length || 0), 0),
    ruleCount: getRuleCount(facilities),
    priorityLevel: task.dispatchType === 'emergency' ? 'emergency' : task.dispatchType === 'work_ticket' || task.dispatchType === 'third_party' ? 'high' : 'normal',
    interruptsCurrentTask: task.dispatchType === 'emergency',
    immediateDeparture: task.dispatchType === 'emergency',
    fromThirdParty: task.dispatchType === 'third_party',
    exceptionCount: task.exceptionCount ?? (index % 3),
    uninspectableCount: task.uninspectableCount ?? (index % 2),
    pendingReviewCount: task.pendingReviewCount ?? (index % 4 === 0 ? 1 : 0),
    createdAt: task.createdAt ? new Date(task.createdAt).toLocaleString() : '-'
  }
}

function fetchTasks() {
  loading.value = true
  try {
    robotStore.initialize()
    const existingTasks = inspectionStore.tasks
      .filter((task: any) => task.type === 'temp' || !task.planId)
      .map((task: any) => ({
        ...task,
        tempTaskType: task.tempTaskType || inferTempTaskType(task),
        dispatchType: task.dispatchType || inferDispatchType(task),
        targetObject: task.targetObject || inferTargetObject(task),
        affectedTaskName: task.affectedTaskName || '每日例行巡检',
        robotName: task.robotName || '巡检机器人-01',
        targetPointName: task.targetPointName || inferTargetPointName(task),
        initiator: task.initiator || '调度员-王磊',
        schedule: {
          ...(task.schedule || {}),
          startTime: task.schedule?.startTime || task.plannedExecuteAt || task.createdAt,
          endTime:
            task.schedule?.endTime ||
            new Date(new Date(task.plannedExecuteAt || task.createdAt).getTime() + ((task.inspectionPointIds?.length || 1) * 8 * 60 * 1000))
        }
      }))

    const nextTasks = existingTasks.length >= 6 ? existingTasks : [...existingTasks, ...buildMockTemporaryTasks(6 - existingTasks.length)]
    tasks.value = nextTasks.map(enrichTemporaryTask)
  } finally {
    loading.value = false
  }
}

function inferTempTaskType(task: any): 'inspection' | 'charging' | 'parking' {
  const name = String(task?.name || '')
  if (name.includes('充电')) return 'charging'
  if (name.includes('停车')) return 'parking'
  return 'inspection'
}

function inferDispatchType(task: any): 'insert' | 'recheck' | 'work_ticket' | 'third_party' | 'emergency' {
  const name = String(task?.name || '')
  if (name.includes('应急')) return 'emergency' as any
  if (name.includes('作业票')) return 'work_ticket' as any
  if (name.includes('第三方')) return 'third_party' as any
  if (name.includes('补检') || name.includes('复检')) return 'recheck'
  return 'insert'
}

function inferTaskSource(task: any) {
  const type = task.dispatchType || inferDispatchType(task)
  if (type === 'work_ticket') return 'work_ticket'
  if (type === 'third_party') return 'third_party'
  if (type === 'emergency') return 'emergency'
  if (type === 'recheck') return 'auto_recheck'
  return 'dispatch_insert'
}

function inferBusinessScene(task: any) {
  const type = task.dispatchType || inferDispatchType(task)
  if (type === 'work_ticket' || type === 'third_party') return 'work_ticket_guard'
  if (type === 'emergency') return 'emergency_arrival'
  if (type === 'recheck') return 'hazard_screening'
  return 'daily_inspection'
}

function getTaskSourceText(source?: string) {
  return ({
    dispatch_insert: '总调度台插单',
    auto_recheck: '自动补检',
    work_ticket: '作业票任务',
    third_party: '第三方任务',
    emergency: '事故/异常快速到场',
    manual: '人工创建'
  } as Record<string, string>)[source || ''] || '总调度台插单'
}

function inferTargetObject(task: any): string {
  const name = String(task?.name || '')
  if (name.includes('反应釜')) return '1号反应釜温度计'
  if (name.includes('压力')) return '1号反应釜压力表'
  if (name.includes('储罐') || name.includes('液位')) return '储罐液位计'
  return '巡检对象'
}

function inferTargetPointName(task: any): string {
  const ids = task?.inspectionPointIds || []
  if (ids.includes('point-001')) return '反应釜车间巡检点'
  if (ids.includes('point-002')) return '储罐区巡检点'
  if (ids.length === 0) return '机器人充电区'
  return `巡检点-${ids[0]}`
}

function buildMockTemporaryTasks(count: number): any[] {
  const templates = [
    { type: 'inspection', name: '临时复检-1号反应釜温度计', target: '反应釜车间巡检点', pointIds: ['point-001'], initiator: '系统自动派发', status: 'pending' },
    { type: 'inspection', name: '临时复检-储罐液位计', target: '储罐区巡检点', pointIds: ['point-002'], initiator: '值班长-李航', status: 'running' },
    { type: 'inspection', name: '作业票任务-反应釜看护', target: '反应釜车间巡检点', pointIds: ['point-001'], initiator: '票证系统', status: 'running' },
    { type: 'inspection', name: '第三方任务-管廊复测', target: '储罐区巡检点', pointIds: ['point-002'], initiator: 'EHS系统', status: 'pending' },
    { type: 'inspection', name: '应急快速到场-气体异常点', target: '储罐区巡检点', pointIds: ['point-002'], initiator: '总调度台', status: 'running' },
    { type: 'inspection', name: '临时补检-1号反应釜压力表', target: '反应釜车间巡检点', pointIds: ['point-001'], initiator: '调度员-王磊', status: 'failed' },
    { type: 'inspection', name: '临时巡检-储罐区巡检点', target: '储罐区巡检点', pointIds: ['point-002'], initiator: '安全员-周晨', status: 'cancelled' }
  ]

  return Array.from({ length: count }).map((_, index) => {
    const t = templates[index % templates.length]
    const start = new Date(Date.now() - (index + 1) * 45 * 60 * 1000)
    const end = new Date(start.getTime() + 20 * 60 * 1000)
    return {
      id: `temp-mock-${index + 1}`,
      name: t.name,
      code: `TEMP-${String(index + 1).padStart(3, '0')}`,
      planId: undefined,
      robotId: `robot-00${(index % 2) + 1}`,
      inspectionPointIds: t.pointIds,
      status: t.status,
      tempTaskType: t.type,
      dispatchType: inferDispatchType({ name: t.name }),
      targetObject: inferTargetObject({ name: t.name }),
      targetPointName: t.target,
      initiator: t.initiator,
      affectedTaskName: index % 2 === 0 ? '每日例行巡检' : '每周安全巡检',
      robotName: `巡检机器人-0${(index % 2) + 1}`,
      createdAt: start.toISOString(),
      schedule: {
        startTime: start.toISOString(),
        endTime: end.toISOString()
      }
    }
  })
}

function handleSearch() {
  // 由计算属性过滤
}

function handleReset() {
  searchForm.name = ''
  searchForm.code = ''
  searchForm.status = ''
  searchForm.dispatchType = ''
  searchForm.businessScene = ''
  searchForm.robotId = ''
  searchForm.installationId = ''
  searchForm.priorityLevel = ''
  searchForm.interruptsCurrentTask = ''
  searchForm.fromThirdParty = ''
  searchForm.startDate = ''
  searchForm.endDate = ''
}

const filteredTasks = computed(() => {
  const name = searchForm.name.trim().toLowerCase()
  const code = searchForm.code.trim().toLowerCase()
  const status = searchForm.status
  const dispatchType = searchForm.dispatchType
  const businessScene = searchForm.businessScene
  const robotId = searchForm.robotId
  const installationId = searchForm.installationId
  const priorityLevel = searchForm.priorityLevel
  const interruptsCurrentTask = searchForm.interruptsCurrentTask
  const fromThirdParty = searchForm.fromThirdParty
  return tasks.value.filter(task => {
    const matchesName = !name || task.name.toLowerCase().includes(name)
    const matchesCode = !code || task.code.toLowerCase().includes(code)
    const matchesStatus = !status || task.status === status
    const matchesDispatchType = !dispatchType || (task as any).dispatchType === dispatchType
    const matchesScene = (!businessScene || task.businessScene === businessScene) && matchesSceneTab(task)
    const matchesRobot = !robotId || task.robotId === robotId
    const matchesInstallation = !installationId || (task.installationIds || []).includes(installationId)
    const matchesPriority = !priorityLevel || task.priorityLevel === priorityLevel
    const matchesInterrupt = !interruptsCurrentTask || String(Boolean(task.interruptsCurrentTask)) === interruptsCurrentTask
    const matchesThirdParty = !fromThirdParty || String(Boolean(task.fromThirdParty)) === fromThirdParty
    const matchesDateRange = matchesTaskDateRange(task)
    return matchesName && matchesCode && matchesStatus && matchesDispatchType && matchesScene && matchesRobot && matchesInstallation && matchesPriority && matchesInterrupt && matchesThirdParty && matchesDateRange
  })
})

const taskSummary = computed(() => ({
  installationCount: new Set(filteredTasks.value.flatMap((task: any) => task.installationIds || [])).size,
  facilityCount: filteredTasks.value.reduce((sum: number, task: any) => sum + (task.facilityCount || 0), 0),
  componentCount: filteredTasks.value.reduce((sum: number, task: any) => sum + (task.componentCount || 0), 0),
  ruleCount: filteredTasks.value.reduce((sum: number, task: any) => sum + (task.ruleCount || 0), 0)
}))

function goBack() {
  router.push('/management/plan/list')
}

function viewDetail(id: string) {
  router.push(`/management/task/detail/${id}?source=temp`)
}

function handleTerminate(record: any) {
  Modal.confirm({
    title: '确认终止',
    content: '确定要终止该任务吗？终止后任务将无法恢复。',
    okText: '确认',
    cancelText: '取消',
    okType: 'danger',
    onOk() {
      inspectionStore.terminateTask(record.id)
      message.success('任务已终止')
    }
  })
}

onMounted(() => {
  inspectionStore.initialize()
  fetchTasks()
})
</script>

<style scoped lang="css">.temporary-task-list {
  width: 100%;
}
.temporary-task-list :deep(.ant-card) {
  border-radius: 10px;
  border-color: #f0f0f0;
  box-shadow: none;
}
.temporary-task-list :deep(.ant-card-body) {
  padding: 16px;
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
.temporary-task-list .search-panel {
  margin-bottom: 12px;
  padding: 12px 12px 4px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}
.temporary-task-list .search-item {
  margin-bottom: 8px;
}
.temporary-task-list .search-actions {
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
@media (max-width: 1200px) {
  .scene-summary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
@media (max-width: 768px) {
  .scene-summary {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
