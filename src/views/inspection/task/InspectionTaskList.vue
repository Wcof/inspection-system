<template>
  <div class="inspection-task-list">
    <a-page-header title="巡检任务" sub-title="管理巡检任务" @back="goBack">
    </a-page-header>

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
              <a-form-item label="机器人" class="search-item">
                <a-select v-model:value="searchForm.robotId" placeholder="请选择机器人" allow-clear>
                  <a-select-option v-for="robot in robotStore.robots" :key="robot.id" :value="robot.id">
                    {{ robot.name }}
                  </a-select-option>
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
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">
              {{ getStatusText(record.status) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'robot'">
            {{ getRobotName(record.robotId) }}
          </template>
          <template v-if="column.key === 'pointCount'">
            {{ record.inspectionPointIds?.length || 0 }}
          </template>
          <template v-if="column.key === 'planSource'">
            {{ getPlanName(record.planId) }}
          </template>
          <template v-if="column.key === 'startTime'">
            {{ getTaskStartTimeText(record) }}
          </template>
          <template v-if="column.key === 'endTime'">
            {{ getTaskEndTimeText(record) }}
          </template>
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="viewDetail(record.id)">详情</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import type { InspectionTask, InspectionTaskInstanceStatus } from '@/types/inspection'
import { useRobotStore } from '@/stores/robot'

const router = useRouter()
const route = useRoute()
const inspectionStore = useInspectionStore()
const robotStore = useRobotStore()

const tasks = ref<InspectionTask[]>([])
const loading = ref(false)
const searchForm = reactive({
  name: '',
  code: '',
  robotId: '',
  status: '',
  createdAt: ''
})

const columns = [
  { title: '任务名称', dataIndex: 'name', key: 'name' },
  { title: '编码', dataIndex: 'code', key: 'code' },
  { title: '所属计划', key: 'planSource', width: 180 },
  { title: '机器人', key: 'robot', width: 150 },
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

function getRobotName(robotId: string): string {
  const robot = robotStore.robots.find(r => r.id === robotId)
  return robot?.name || robotId
}

// 获取计划名称
function getPlanName(planId?: string): string {
  if (!planId) {
    return inspectionStore.inspectionPlans[0]?.name || '-'
  }
  const plan = inspectionStore.inspectionPlans.find(p => p.id === planId)
  return plan?.name || inspectionStore.inspectionPlans[0]?.name || planId
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
    let allTasks = inspectionStore.tasks
    allTasks = allTasks.map((task: any) => {
      const fallbackPlanId = task.planId || inspectionStore.inspectionPlans[0]?.id
      const fallbackStart = task.schedule?.startTime || task.plannedExecuteAt || task.createdAt
      const fallbackEnd = task.schedule?.endTime || new Date(new Date(fallbackStart).getTime() + ((task.inspectionPointIds?.length || 1) * 8 * 60 * 1000))
      return {
        ...task,
        planId: fallbackPlanId,
        schedule: {
          ...(task.schedule || {}),
          startTime: fallbackStart,
          endTime: fallbackEnd
        }
      }
    })
    const planId = route.query.planId as string
    if (planId) {
      // 过滤出指定计划的任务
      allTasks = allTasks.filter((t: any) => t.planId === planId)
    }
    tasks.value = allTasks
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  // 由 filteredTasks 计算属性过滤
}

function handleReset() {
  searchForm.name = ''
  searchForm.code = ''
  searchForm.robotId = ''
  searchForm.status = ''
  searchForm.createdAt = ''
}

const filteredTasks = computed(() => {
  const name = searchForm.name.trim().toLowerCase()
  const code = searchForm.code.trim().toLowerCase()
  const robotId = searchForm.robotId
  const status = searchForm.status
  const createdAt = searchForm.createdAt.trim()
  return tasks.value.filter(task => {
    const matchesName = !name || task.name.toLowerCase().includes(name)
    const matchesCode = !code || task.code.toLowerCase().includes(code)
    const matchesRobot = !robotId || task.robotId === robotId
    const matchesStatus = !status || task.status === status
    const createdText = task.createdAt ? new Date(task.createdAt).toISOString().slice(0, 10) : ''
    const matchesCreated = !createdAt || createdText.includes(createdAt)
    return matchesName && matchesCode && matchesRobot && matchesStatus && matchesCreated
  })
})
function goBack() {
  router.push('/management/task/list')
}

function viewDetail(id: string) {
  router.push(`/management/task/detail/${id}`)
}

onMounted(() => {
  inspectionStore.initialize()
  robotStore.initialize()
  fetchTasks()
})

watch(
  () => route.query.planId,
  () => fetchTasks()
)
</script>

<style scoped lang="scss">
.inspection-task-list {
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

  :deep(.ant-table) {
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    overflow: hidden;
  }

  :deep(.ant-table-thead > tr > th) {
    background: #fafafa;
    font-weight: 600;
    white-space: nowrap;
  }

  :deep(.ant-table-tbody > tr > td) {
    vertical-align: middle;
  }

  @media (max-width: 992px) {
    :deep(.ant-card-body) {
      padding: 12px;
    }
  }
}
</style>
