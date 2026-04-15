<template>
  <div class="exception-alert-page">
    <a-page-header title="异常告警" sub-title="告警按次记录，不合并多次异常" />

    <a-card style="margin-top: 16px">
      <div class="search-panel">
        <a-form layout="vertical" :model="searchForm" @submit.prevent>
          <a-row :gutter="[16, 8]">
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="告警名称" class="search-item">
                <a-input v-model:value="searchForm.name" placeholder="请输入告警名称" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="异常类型" class="search-item">
                <a-select v-model:value="searchForm.type" placeholder="请选择异常类型" allow-clear>
                  <a-select-option value="facility">设施设备异常</a-select-option>
                  <a-select-option value="gas">气体异常</a-select-option>
                  <a-select-option value="safety">安全行为异常</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="状态" class="search-item">
                <a-select v-model:value="searchForm.status" placeholder="请选择状态" allow-clear>
                  <a-select-option value="pending">待处理</a-select-option>
                  <a-select-option value="handled">已处理</a-select-option>
                  <a-select-option value="false_alarm">误报</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="告警时间" class="search-item">
                <a-input v-model:value="searchForm.time" placeholder="YYYY-MM-DD" allow-clear />
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

      <a-table :columns="columns" :data-source="filteredAlerts" row-key="id" :pagination="{ pageSize: 10 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <a-tag :color="getTypeColor(record.type)">{{ getTypeText(record.type) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="openHandleModal(record)" :disabled="record.status !== 'pending'">处置</a-button>
              <a-button type="link" size="small" danger @click="markFalseAlarm(record)" :disabled="record.status !== 'pending'">误报</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:visible="handleVisible"
      title="处置异常告警"
      ok-text="提交处置"
      cancel-text="取消"
      @ok="submitHandle"
    >
      <a-form layout="vertical">
        <a-form-item label="告警名称">
          <a-input :value="selectedAlert?.name" disabled />
        </a-form-item>
        <a-form-item label="处置意见" required>
          <a-textarea v-model:value="handleComment" :rows="4" placeholder="请输入处置意见" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'

type AlertType = 'facility' | 'gas' | 'safety'
type AlertStatus = 'pending' | 'handled' | 'false_alarm'

interface AlertItem {
  id: string
  name: string
  type: AlertType
  source: string
  location: string
  time: string
  status: AlertStatus
  handleComment?: string
}

const searchForm = reactive({
  name: '',
  type: undefined as AlertType | undefined,
  status: undefined as AlertStatus | undefined,
  time: ''
})

const alerts = ref<AlertItem[]>([
  {
    id: 'alert-001',
    name: '配电柜温升异常',
    type: 'facility',
    source: '任务 TASK-2026-001',
    location: 'A区配电房',
    time: '2026-04-15 09:20:00',
    status: 'pending'
  },
  {
    id: 'alert-002',
    name: '甲烷浓度超阈值',
    type: 'gas',
    source: '任务 TASK-2026-002',
    location: 'B区管廊',
    time: '2026-04-15 09:35:00',
    status: 'pending'
  },
  {
    id: 'alert-003',
    name: '未佩戴安全帽',
    type: 'safety',
    source: '任务 TASK-2026-003',
    location: '1号车间入口',
    time: '2026-04-15 10:05:00',
    status: 'handled',
    handleComment: '已通知现场管理人员处置并复核。'
  }
])

const columns = [
  { title: '告警名称', dataIndex: 'name', key: 'name' },
  { title: '异常类型', key: 'type', width: 150 },
  { title: '来源', dataIndex: 'source', key: 'source', width: 200 },
  { title: '位置', dataIndex: 'location', key: 'location', width: 180 },
  { title: '告警时间', dataIndex: 'time', key: 'time', width: 180 },
  { title: '状态', key: 'status', width: 120 },
  { title: '操作', key: 'actions', width: 120 }
]

const handleVisible = ref(false)
const selectedAlert = ref<AlertItem | null>(null)
const handleComment = ref('')

const filteredAlerts = computed(() => {
  const name = searchForm.name.trim().toLowerCase()
  const time = searchForm.time.trim()
  return alerts.value.filter(alert => {
    const matchName = !name || alert.name.toLowerCase().includes(name)
    const matchType = !searchForm.type || alert.type === searchForm.type
    const matchStatus = !searchForm.status || alert.status === searchForm.status
    const matchTime = !time || alert.time.includes(time)
    return matchName && matchType && matchStatus && matchTime
  })
})

function getTypeText(type: AlertType) {
  if (type === 'facility') return '设施设备异常'
  if (type === 'gas') return '气体异常'
  return '安全行为异常'
}

function getTypeColor(type: AlertType) {
  if (type === 'facility') return 'processing'
  if (type === 'gas') return 'orange'
  return 'purple'
}

function getStatusText(status: AlertStatus) {
  if (status === 'handled') return '已处理'
  if (status === 'false_alarm') return '误报'
  return '待处理'
}

function getStatusColor(status: AlertStatus) {
  if (status === 'handled') return 'green'
  if (status === 'false_alarm') return 'default'
  return 'red'
}

function handleSearch() {
  // 由 filteredAlerts 计算属性过滤
}

function handleReset() {
  searchForm.name = ''
  searchForm.type = undefined
  searchForm.status = undefined
  searchForm.time = ''
}

function openHandleModal(alert: AlertItem) {
  selectedAlert.value = alert
  handleComment.value = alert.handleComment || ''
  handleVisible.value = true
}

function submitHandle() {
  if (!selectedAlert.value) return
  if (!handleComment.value.trim()) {
    message.error('请填写处理意见')
    return
  }
  selectedAlert.value.status = 'handled'
  selectedAlert.value.handleComment = handleComment.value.trim()
  handleVisible.value = false
  message.success('处置意见已提交')
}

function markFalseAlarm(alert: AlertItem) {
  Modal.confirm({
    title: '标记为误报',
    content: '确定将该条告警标记为误报吗？',
    okText: '确定',
    cancelText: '取消',
    onOk() {
      alert.status = 'false_alarm'
      alert.handleComment = '已标记为误报'
      message.success('已标记为误报')
    }
  })
}
</script>

<style scoped lang="scss">
.exception-alert-page {
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
