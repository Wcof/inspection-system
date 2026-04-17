
<template>
  <div class="inspection-task-list">
    <a-page-header title="巡检任务" :sub-title="pageSubTitle" @back="goBack" />

    <a-card style="margin-top: 16px">
      <a-alert type="info" show-icon style="margin-bottom: 12px" :message="`当前任务生成周期是：${taskWindowLabel}`" />

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
          <template v-else-if="column.key === 'robot'">
            {{ getRobotName(record.robotId) }}
          </template>
          <template v-else-if="column.key === 'pointCount'">
            {{ record.inspectionPointIds?.length || 0 }}
          </template>
          <template v-else-if="column.key === 'planSource'">
            {{ getPlanName(record.planId) }}
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
const taskWindowLabel = ref('任务开始前 7 天')

const searchForm = reactive({
  name: '',
  code: '',
  robotId: undefined as string | undefined,
  status: undefined as string | undefined,
  startDate: '',
  endDate: ''
})

const pageSubTitle = computed(() => {
  const planId = route.query.planId as string
  if (!planId) return '任务列表按时间范围查看，可从巡检计划或调度台进入'
  const plan = inspectionStore.inspectionPlans.find((item: any) => item.id === planId)
  return plan ? `所属计划：${plan.name}` : '所属计划任务'
})

const columns = [
  { title: '状态', key: 'status', width: 100, fixed: 'left' },
  { title: '任务名称', dataIndex: 'name', key: 'name', width: 220 },
  { title: '编码', dataIndex: 'code', key: 'code', width: 160 },
  { title: '所属计划', key: 'planSource', width: 180 },
  { title: '执行机器人', key: 'robot', width: 150 },
  { title: '巡检点数量', key: 'pointCount', width: 120 },
  { title: '时间范围', key: 'timeRange', width: 280 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'actions', width: 100, fixed: 'right' }
]

function getStatusText(status: string) {
  return ({ pending: '待执行', running: '执行中', completed: '已完成', paused: '已暂停', cancelled: '已取消', failed: '失败' } as Record<string, string>)[status] || status
}

function getStatusColor(status: string) {
  return ({ pending: 'default', running: 'blue', completed: 'green', paused: 'orange', cancelled: 'default', failed: 'red' } as Record<string, string>)[status] || 'default'
}

function getRobotName(robotId: string) {
  return robotStore.robots.find((robot: any) => robot.id === robotId)?.name || robotId || '-'
}

function getPlanName(planId?: string) {
  if (!planId) return '-'
  return inspectionStore.inspectionPlans.find((item: any) => item.id === planId)?.name || '-'
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
    const allTasks = inspectionStore.tasks.map((task: any) => ({
      ...task,
      createdAt: task.createdAt ? new Date(task.createdAt).toLocaleString() : '-'
    }))
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
    const matchStart = !searchForm.startDate || timeRangeText.includes(searchForm.startDate)
    const matchEnd = !searchForm.endDate || timeRangeText.includes(searchForm.endDate)
    return matchName && matchCode && matchRobot && matchStatus && matchStart && matchEnd
  })
})

function handleReset() {
  searchForm.name = ''
  searchForm.code = ''
  searchForm.robotId = undefined
  searchForm.status = undefined
  searchForm.startDate = ''
  searchForm.endDate = ''
}

function viewDetail(id: string) {
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
