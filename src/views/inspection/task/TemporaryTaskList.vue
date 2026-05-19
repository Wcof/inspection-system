<template>
  <div class="temporary-task-list">
    <a-page-header title="临时任务" sub-title="由总调度台创建的执行任务，字段与执行任务保持一致，额外标识任务类型" @back="goBack" />

    <a-card style="margin-top: 16px">
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
                  <a-select-option value="charging">充电</a-select-option>
                  <a-select-option value="parking">停车</a-select-option>
                  <a-select-option value="replace_robot">替换机器人</a-select-option>
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
              <a-button type="primary" @click="handleSearch">搜索</a-button>
              <a-button @click="handleReset">重置</a-button>
            </a-space>
          </div>
        </a-form>
      </div>

      <a-table :columns="columns" :data-source="filteredTasks" :loading="loading" row-key="id" :scroll="{ x: 1500 }">
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
          <template v-else-if="column.key === 'regionNames'">
            <a-space wrap>
              <a-tag v-for="region in record.regionNames" :key="region">{{ region }}</a-tag>
              <span v-if="!record.regionNames?.length">-</span>
            </a-space>
          </template>
          <template v-else-if="column.key === 'timeRange'">{{ getTaskTimeRangeText(record) }}</template>
          <template v-else-if="column.key === 'actions'">
            <a-button type="link" size="small" @click="viewDetail(record.id)">详情</a-button>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import { useRobotStore } from '@/stores/robot'
import type { InspectionTaskInstanceStatus } from '@/types/inspection'

const router = useRouter()
const inspectionStore = useInspectionStore()
const robotStore = useRobotStore()

const tasks = ref<any[]>([])
const loading = ref(false)
const searchForm = reactive({
  name: '',
  code: '',
  status: '',
  dispatchType: '',
  businessScene: '',
  robotId: '',
  startDate: '',
  endDate: ''
})

const columns = [
  { title: '任务名称', dataIndex: 'name', key: 'name', width: 220 },
  { title: '编码', dataIndex: 'code', key: 'code', width: 160 },
  { title: '状态', key: 'status', width: 100 },
  { title: '任务类型', key: 'taskType', width: 110 },
  { title: '任务场景', key: 'businessScene', width: 130 },
  { title: '巡检区域', key: 'regionNames', width: 220 },
  { title: '巡检设施数', dataIndex: 'facilityCount', key: 'facilityCount', width: 120 },
  { title: '部件/连接数', dataIndex: 'componentConnectionCount', key: 'componentConnectionCount', width: 120 },
  { title: '巡检规则数', dataIndex: 'ruleCount', key: 'ruleCount', width: 120 },
  { title: '执行机器人', key: 'robot', width: 150 },
  { title: '异常数', dataIndex: 'exceptionCount', key: 'exceptionCount', width: 90 },
  { title: '执行时间', key: 'timeRange', width: 280 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'actions', width: 100, fixed: 'right' }
]

function getStatusColor(status: InspectionTaskInstanceStatus): string {
  const colorMap: Record<InspectionTaskInstanceStatus, string> = {
    pending: 'default',
    running: 'blue',
    completed: 'green',
    paused: 'orange',
    cancelled: 'default',
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
    cancelled: '已取消',
    failed: '失败'
  }
  return textMap[status] || status
}

function getDispatchTypeText(type?: string) {
  if (type === 'charging') return '充电'
  if (type === 'parking') return '停车'
  if (type === 'replace_robot') return '替换机器人'
  if (type === 'recheck') return '补检'
  return '插单'
}

function getSceneText(scene?: string) {
  return ({ daily_inspection: '日常巡检', hazard_screening: '隐患排查', environment_check: '环境检查', operation_guard: '作业监护' } as Record<string, string>)[scene || ''] || '日常巡检'
}

function getSceneColor(scene?: string) {
  return ({ daily_inspection: 'blue', hazard_screening: 'volcano', environment_check: 'green', operation_guard: 'purple' } as Record<string, string>)[scene || ''] || 'blue'
}

function getDispatchTypeColor(type?: string) {
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

function getFacilitiesByPointIds(pointIds: string[]) {
  const regionIds = new Set(inspectionStore.inspectionPoints.filter((point: any) => pointIds.includes(point.id) && point.areaId).map((point: any) => point.areaId))
  return inspectionStore.inspectionDevices.filter((device: any) => regionIds.has(device.areaId) || pointIds.includes(device.inspectionPointId))
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

function enrichTemporaryTask(task: any, index: number) {
  const pointIds = task.inspectionPointIds || []
  const points = inspectionStore.inspectionPoints.filter((point: any) => pointIds.includes(point.id))
  const regionIds = Array.from(new Set(points.map((point: any) => point.areaId).filter(Boolean)))
  const facilities = getFacilitiesByPointIds(pointIds)
  return {
    ...task,
    dispatchType: task.dispatchType || inferDispatchType(task),
    businessScene: task.businessScene || (task.dispatchType === 'recheck' ? 'hazard_screening' : 'daily_inspection'),
    taskSource: task.taskSource || (task.dispatchType === 'recheck' ? 'auto_recheck' : 'dispatch_insert'),
    riskLevel: task.riskLevel || (task.dispatchType === 'recheck' ? 'alarm' : 'normal'),
    robotName: task.robotName || robotStore.robots.find((robot: any) => robot.id === task.robotId)?.name || '巡检机器人-01',
    regionNames: regionIds.map((id) => getRegionName(String(id))),
    facilityCount: facilities.length,
    componentConnectionCount: facilities.reduce((sum: number, device: any) => sum + (device.assetComponents?.length || 0) + (device.connectionObjects?.length || 0), 0),
    ruleCount: getRuleCount(facilities),
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

function inferDispatchType(task: any): 'insert' | 'recheck' | 'charging' | 'parking' | 'replace_robot' {
  const name = String(task?.name || '')
  if (name.includes('补检') || name.includes('复检')) return 'recheck'
  if (name.includes('充电')) return 'charging'
  if (name.includes('停车')) return 'parking'
  if (name.includes('替换')) return 'replace_robot'
  return 'insert'
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
    { type: 'charging', name: '临时充电-巡检机器人-02', target: '机器人充电区', pointIds: [], initiator: '调度员-赵敏', status: 'completed' },
    { type: 'parking', name: '临时停车-巡检机器人-01', target: '机器人充电区', pointIds: [], initiator: '系统安全策略', status: 'pending' },
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
  const startDate = searchForm.startDate.trim()
  const endDate = searchForm.endDate.trim()
  return tasks.value.filter(task => {
    const timeRangeText = getTaskTimeRangeText(task)
    const matchesName = !name || task.name.toLowerCase().includes(name)
    const matchesCode = !code || task.code.toLowerCase().includes(code)
    const matchesStatus = !status || task.status === status
    const matchesDispatchType = !dispatchType || (task as any).dispatchType === dispatchType
    const matchesScene = !businessScene || task.businessScene === businessScene
    const matchesRobot = !robotId || task.robotId === robotId
    const matchesStart = !startDate || timeRangeText.includes(startDate)
    const matchesEnd = !endDate || timeRangeText.includes(endDate)
    return matchesName && matchesCode && matchesStatus && matchesDispatchType && matchesScene && matchesRobot && matchesStart && matchesEnd
  })
})

function goBack() {
  router.push('/management/plan/list')
}

function viewDetail(id: string) {
  router.push(`/management/task/detail/${id}?source=temp`)
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
</style>
