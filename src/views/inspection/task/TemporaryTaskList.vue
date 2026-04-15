<template>
  <div class="temporary-task-list">
    <a-page-header title="临时任务" sub-title="查看临时调度任务" @back="goBack" />

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
              <a-form-item label="创建时间" class="search-item">
                <a-input v-model:value="searchForm.createdAt" placeholder="YYYY-MM-DD" allow-clear />
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

      <a-table :columns="columns" :data-source="filteredTasks" :loading="loading" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'taskType'">
            <a-tag :color="getTaskTypeColor(record.tempTaskType)">{{ getTaskTypeText(record.tempTaskType) }}</a-tag>
          </template>
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'planSource'">-</template>
          <template v-else-if="column.key === 'targetPoint'">{{ record.targetPointName || '-' }}</template>
          <template v-else-if="column.key === 'initiator'">{{ record.initiator || '-' }}</template>
          <template v-else-if="column.key === 'pointCount'">{{ record.inspectionPointIds?.length || 0 }}</template>
          <template v-else-if="column.key === 'startTime'">{{ getTaskStartTimeText(record) }}</template>
          <template v-else-if="column.key === 'endTime'">{{ getTaskEndTimeText(record) }}</template>
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
import type { InspectionTask, InspectionTaskInstanceStatus } from '@/types/inspection'

const router = useRouter()
const inspectionStore = useInspectionStore()

const tasks = ref<InspectionTask[]>([])
const loading = ref(false)
const searchForm = reactive({
  name: '',
  code: '',
  status: '',
  createdAt: ''
})

const columns = [
  { title: '任务名称', dataIndex: 'name', key: 'name' },
  { title: '任务类型', key: 'taskType', width: 110 },
  { title: '编码', dataIndex: 'code', key: 'code' },
  { title: '所属计划', key: 'planSource', width: 140 },
  { title: '目标点位', key: 'targetPoint', width: 180 },
  { title: '发起人', key: 'initiator', width: 120 },
  { title: '巡检点数量', key: 'pointCount', width: 120 },
  { title: '开始时间', key: 'startTime', width: 180 },
  { title: '结束时间', key: 'endTime', width: 180 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'actions', width: 100 }
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

function getTaskTypeText(type?: string) {
  if (type === 'charging') return '充电任务'
  if (type === 'parking') return '停车任务'
  return '巡检任务'
}

function getTaskTypeColor(type?: string) {
  if (type === 'charging') return 'blue'
  if (type === 'parking') return 'purple'
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

function fetchTasks() {
  loading.value = true
  try {
    const existingTasks = inspectionStore.tasks
      .filter((task: any) => task.type === 'temp' || !task.planId)
      .map((task: any) => ({
        ...task,
        tempTaskType: task.tempTaskType || inferTempTaskType(task),
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

    tasks.value = existingTasks.length >= 6 ? existingTasks : [...existingTasks, ...buildMockTemporaryTasks(6 - existingTasks.length)]
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

function inferTargetPointName(task: any): string {
  const ids = task?.inspectionPointIds || []
  if (ids.length === 0) return '站内临时点'
  return `巡检点-${ids[0]}`
}

function buildMockTemporaryTasks(count: number): any[] {
  const templates = [
    { type: 'inspection', name: '临时复检-配电柜A15', target: 'A区配电房-巡检点A12', initiator: '系统自动派发', status: 'pending' },
    { type: 'inspection', name: '临时巡检-危化仓入口', target: '危化区-巡检点C03', initiator: '值班长-李航', status: 'running' },
    { type: 'charging', name: '临时充电-机器人A003', target: '北侧充电站-C2', initiator: '调度员-赵敏', status: 'completed' },
    { type: 'parking', name: '临时停车-机器人A001', target: '应急停车点-P1', initiator: '系统安全策略', status: 'pending' },
    { type: 'inspection', name: '临时补检-电机B07', target: 'B区机房-巡检点B07', initiator: '调度员-王磊', status: 'failed' },
    { type: 'inspection', name: '临时巡检-消防通道', target: '生产车间2层-巡检点D11', initiator: '安全员-周晨', status: 'cancelled' }
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
      inspectionPointIds: t.type === 'inspection' ? [`point-${String(index + 11).padStart(3, '0')}`] : [],
      status: t.status,
      tempTaskType: t.type,
      targetPointName: t.target,
      initiator: t.initiator,
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
  searchForm.createdAt = ''
}

const filteredTasks = computed(() => {
  const name = searchForm.name.trim().toLowerCase()
  const code = searchForm.code.trim().toLowerCase()
  const status = searchForm.status
  const createdAt = searchForm.createdAt.trim()
  return tasks.value.filter(task => {
    const matchesName = !name || task.name.toLowerCase().includes(name)
    const matchesCode = !code || task.code.toLowerCase().includes(code)
    const matchesStatus = !status || task.status === status
    const createdText = task.createdAt ? new Date(task.createdAt).toISOString().slice(0, 10) : ''
    const matchesCreated = !createdAt || createdText.includes(createdAt)
    return matchesName && matchesCode && matchesStatus && matchesCreated
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

<style scoped lang="scss">
.temporary-task-list {
  width: 100%;

  :deep(.ant-card) {
    border-radius: 10px;
    border-color: #f0f0f0;
    box-shadow: none;
  }

  :deep(.ant-card-body) {
    padding: 16px;
  }

  .search-panel {
    margin-bottom: 12px;
    padding: 12px 12px 4px;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    background: #fafafa;
  }

  .search-item {
    margin-bottom: 8px;
  }

  .search-actions {
    display: flex;
    justify-content: flex-end;
    margin: 4px 0 8px;
  }
}
</style>
