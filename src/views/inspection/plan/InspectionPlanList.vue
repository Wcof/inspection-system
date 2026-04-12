<template>
  <div class="inspection-plan-list">
    <a-page-header title="巡检计划" sub-title="管理巡检计划">
      <template #extra>
        <a-button type="primary" @click="goToForm">
          <template #icon><PlusOutlined /></template>
          新建计划
        </a-button>
      </template>
    </a-page-header>

    <a-card style="margin-top: 16px">
      <div class="search-panel">
        <a-form layout="vertical" :model="searchForm" @submit.prevent>
          <a-row :gutter="[16, 8]">
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="名称" class="search-item">
                <a-input v-model:value="searchForm.name" placeholder="请输入计划名称" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="编码" class="search-item">
                <a-input v-model:value="searchForm.code" placeholder="请输入计划编码" allow-clear />
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
              <a-form-item label="调度类型" class="search-item">
                <a-select v-model:value="searchForm.scheduleType" placeholder="请选择调度类型" allow-clear>
                  <a-select-option value="weekly">每周</a-select-option>
                  <a-select-option value="monthly">每月</a-select-option>
                  <a-select-option value="once">一次性</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="状态" class="search-item">
                <a-select v-model:value="searchForm.status" placeholder="请选择状态" allow-clear>
                  <a-select-option value="active">启用</a-select-option>
                  <a-select-option value="paused">暂停</a-select-option>
                  <a-select-option value="inactive">停用</a-select-option>
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
      <a-table :columns="columns" :data-source="filteredPlans" :loading="loading" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getPlanStatusColor(record.status)">
              {{ getPlanStatusText(record.status) }}
            </a-tag>
          </template>
          <template v-if="column.key === 'schedule'">
            {{ getScheduleText(record.schedule) }}
          </template>
          <template v-if="column.key === 'startTime'">
            {{ getStartTimeText(record) }}
          </template>
          <template v-if="column.key === 'endTime'">
            {{ getEndTimeText(record) }}
          </template>
          <template v-if="column.key === 'robot'">
            {{ getRobotName(record.robotId) }}
          </template>
          <template v-if="column.key === 'pointCount'">
            {{ record.inspectionPointIds?.length || 0 }}
          </template>
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="goToForm(record.id)">编辑</a-button>
              <a-button type="link" size="small" @click="viewTasks(record.id)">任务</a-button>
              <a-button v-if="record.status === 'active'" type="link" size="small" @click="handlePause(record.id)">暂停</a-button>
              <a-button v-else type="link" size="small" @click="handleActivate(record.id)">启用</a-button>
              <a-button type="link" size="small" danger @click="handleDelete(record.id)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { PlusOutlined } from '@ant-design/icons-vue'
import { useInspectionStore } from '@/stores/inspection'
import { InspectionPlanStatus } from '@/types/inspection'
import type { InspectionPlan } from '@/types/inspection'
import { message, Modal } from 'ant-design-vue'
import { useRobotStore } from '@/stores/robot'

const router = useRouter()
const inspectionStore = useInspectionStore()
const robotStore = useRobotStore()

const plans = ref<InspectionPlan[]>([])
const loading = ref(false)
const searchForm = reactive({
  name: '',
  code: '',
  robotId: '',
  scheduleType: '',
  status: '',
  createdAt: ''
})

const columns = [
  { title: '计划名称', dataIndex: 'name', key: 'name' },
  { title: '编码', dataIndex: 'code', key: 'code' },
  { title: '机器人', key: 'robot', width: 150 },
  { title: '巡检点数量', key: 'pointCount', width: 120 },
  { title: '调度周期', key: 'schedule', width: 200 },
  { title: '开始时间', key: 'startTime', width: 180 },
  { title: '结束时间', key: 'endTime', width: 180 },
  { title: '状态', key: 'status', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 180 },
  { title: '操作', key: 'actions', width: 200 }
]

function getScheduleText(schedule: any): string {
  if (!schedule) return ''
  
  switch (schedule.type) {
    case 'weekly':
      const days = schedule.daysOfWeek?.map((d: number) => ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][d]).join('、')
      return `${days}`
    case 'monthly':
      return `${schedule.daysOfMonth?.map((day: number) => `${day}号`).join('、')}`
    case 'once':
      return `一次性`
    default:
      return ''
  }
}

function getRobotName(robotId: string): string {
  const robot = robotStore.robots.find(r => r.id === robotId)
  return robot?.name || robotId
}

// 获取派生状态文本
function getPlanStatusText(status: string): string {
  if (status === 'active') return '启用'
  if (status === 'paused') return '暂停'
  if (status === 'inactive') return '停用'
  return status || '-'
}

function getPlanStatusColor(status: string): string {
  if (status === 'active') return 'green'
  if (status === 'paused') return 'orange'
  if (status === 'inactive') return 'default'
  return 'default'
}

// 获取运行时间文本
function getStartTimeText(plan: any): string {
  if (!plan.startTime) return new Date(plan.createdAt).toLocaleString()
  return new Date(plan.startTime).toLocaleString()
}

function getEndTimeText(plan: any): string {
  if (!plan.endTime) {
    const start = new Date(plan.startTime || plan.createdAt)
    return new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleString()
  }
  return new Date(plan.endTime).toLocaleString()
}


function fetchPlans() {
  loading.value = true
  try {
    plans.value = inspectionStore.inspectionPlans
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  // 由 filteredPlans 计算属性过滤
}

function handleReset() {
  searchForm.name = ''
  searchForm.code = ''
  searchForm.robotId = ''
  searchForm.scheduleType = ''
  searchForm.status = ''
  searchForm.createdAt = ''
}

const filteredPlans = computed(() => {
  const name = searchForm.name.trim().toLowerCase()
  const code = searchForm.code.trim().toLowerCase()
  const robotId = searchForm.robotId
  const scheduleType = searchForm.scheduleType
  const status = searchForm.status
  const createdAt = searchForm.createdAt.trim()
  return plans.value.filter(plan => {
    const matchesName = !name || plan.name.toLowerCase().includes(name)
    const matchesCode = !code || plan.code.toLowerCase().includes(code)
    const matchesRobot = !robotId || plan.robotId === robotId
    const matchesScheduleType = !scheduleType || plan.schedule?.type === scheduleType
    const matchesStatus = !status || plan.status === status
    const createdText = plan.createdAt ? new Date(plan.createdAt).toISOString().slice(0, 10) : ''
    const matchesCreated = !createdAt || createdText.includes(createdAt)
    return matchesName && matchesCode && matchesRobot && matchesScheduleType && matchesStatus && matchesCreated
  })
})
function goToForm(id?: string) {
  if (id) {
    router.push(`/management/plan/form/${id}`)
  } else {
    router.push('/management/plan/form')
  }
}

function viewTasks(_id: string) {
  router.push(`/management/task/list?planId=${_id}`)
}

function handleDelete(id: string) {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这个巡检计划吗？',
    okText: '确定',
    cancelText: '取消',
    onOk() {
      inspectionStore.deleteInspectionPlan(id)
      message.success('删除成功')
      fetchPlans()
    }
  })
}

// 暂停计划
function handlePause(id: string) {
  Modal.confirm({
    title: '确认暂停',
    content: '确定要暂停这个巡检计划吗？',
    okText: '确定',
    cancelText: '取消',
    onOk() {
      const plan = inspectionStore.inspectionPlans.find(p => p.id === id)
      if (plan) {
        const updatedPlan = { ...plan, status: InspectionPlanStatus.PAUSED }
        inspectionStore.saveInspectionPlan(updatedPlan)
        message.success('暂停成功')
        fetchPlans()
      }
    }
  })
}

// 启用计划
function handleActivate(id: string) {
  Modal.confirm({
    title: '确认启用',
    content: '确定要启用这个巡检计划吗？',
    okText: '确定',
    cancelText: '取消',
    onOk() {
      const plan = inspectionStore.inspectionPlans.find(p => p.id === id)
      if (plan) {
        const updatedPlan = { ...plan, status: InspectionPlanStatus.ACTIVE }
        inspectionStore.saveInspectionPlan(updatedPlan)
        message.success('启用成功')
        fetchPlans()
      }
    }
  })
}

onMounted(() => {
  inspectionStore.initialize()
  robotStore.initialize()
  fetchPlans()
})
</script>

<style scoped lang="scss">
.inspection-plan-list {
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
