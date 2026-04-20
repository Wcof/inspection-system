
<template>
  <div class="exception-alert-page">
    <a-page-header title="异常告警" sub-title="支持展示摘要、区域、来源跳转与图片预览；误报统一调整为消警" />

    <a-card style="margin-top: 16px">
      <div class="search-panel">
        <a-form layout="vertical" :model="searchForm" @submit.prevent>
          <a-row :gutter="[16, 8]">
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="告警名称" class="search-item"><a-input v-model:value="searchForm.name" placeholder="请输入告警名称" allow-clear /></a-form-item>
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
                  <a-select-option value="cleared">已消警</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="24" :md="16" :lg="12">
              <a-form-item label="告警时间" class="search-item">
                <a-range-picker
                  v-model:value="searchForm.timeRange"
                  show-time
                  format="YYYY-MM-DD HH:mm:ss"
                  style="width: 100%"
                  :placeholder="['开始时间', '结束时间']"
                />
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

      <a-table :columns="columns" :data-source="filteredAlerts" row-key="id" :pagination="{ pageSize: 10 }" :scroll="{ x: 1400 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <a-tag :color="getTypeColor(record.type)">{{ getTypeText(record.type) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'source'">
            <a-button type="link" size="small" @click="jumpToSource(record)">{{ record.source }}</a-button>
          </template>
          <template v-else-if="column.key === 'snapshot'">
            <img v-if="record.imageUrl" :src="record.imageUrl" class="thumb" alt="snapshot" />
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="openHandleModal(record)" :disabled="record.status !== 'pending'">处置</a-button>
              <a-button type="link" size="small" danger @click="clearAlert(record)" :disabled="record.status !== 'pending'">消警</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="handleVisible" title="处置异常告警" ok-text="提交处置" cancel-text="取消" @ok="submitHandle">
      <a-form layout="vertical">
        <a-form-item label="告警名称"><a-input :value="selectedAlert?.name" disabled /></a-form-item>
        <a-form-item label="处置意见" required><a-textarea v-model:value="handleComment" :rows="4" placeholder="请输入处置意见" /></a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'

type AlertType = 'facility' | 'gas' | 'safety'
type AlertStatus = 'pending' | 'handled' | 'cleared'
interface AlertItem { id: string; name: string; type: AlertType; source: string; summary: string; area: string; time: string; status: AlertStatus; imageUrl?: string; handleComment?: string }

interface AlertSearchForm {
  name: string
  type: AlertType | undefined
  status: AlertStatus | undefined
  timeRange: [any, any] | undefined
}

const searchForm = reactive<AlertSearchForm>({
  name: '',
  type: undefined,
  status: undefined,
  timeRange: undefined
})

const appliedSearch = reactive<AlertSearchForm>({
  name: '',
  type: undefined,
  status: undefined,
  timeRange: undefined
})
const alerts = ref<AlertItem[]>([
  { id: 'alert-001', name: '配电柜温升异常', type: 'facility', source: '任务 TASK-2026-001', summary: '温度 86℃，超过阈值上限 80℃', area: 'A区配电房', time: '2026-04-17 09:20:00', status: 'pending', imageUrl: 'https://picsum.photos/seed/alert-1/120/70' },
  { id: 'alert-002', name: '甲烷浓度超阈值', type: 'gas', source: '任务 TASK-2026-002', summary: '浓度 34%LEL，处于告警区间', area: 'B区管廊', time: '2026-04-17 09:35:00', status: 'pending', imageUrl: 'https://picsum.photos/seed/alert-2/120/70' },
  { id: 'alert-003', name: '未佩戴安全帽', type: 'safety', source: '任务 TASK-2026-003', summary: '识别到 1 名作业人员未佩戴安全帽', area: '1号车间入口', time: '2026-04-17 10:05:00', status: 'handled', handleComment: '已通知现场管理人员处置并复核。' }
])

const columns = [
  { title: '告警名称', dataIndex: 'name', key: 'name', width: 180 },
  { title: '异常类型', key: 'type', width: 140 },
  { title: '摘要信息', dataIndex: 'summary', key: 'summary', width: 260 },
  { title: '所属区域', dataIndex: 'area', key: 'area', width: 160 },
  { title: '来源', key: 'source', width: 180 },
  { title: '图片', key: 'snapshot', width: 110 },
  { title: '告警时间', dataIndex: 'time', key: 'time', width: 180 },
  { title: '状态', key: 'status', width: 110 },
  { title: '操作', key: 'actions', width: 120, fixed: 'right' }
]

const handleVisible = ref(false)
const selectedAlert = ref<AlertItem | null>(null)
const handleComment = ref('')
const filteredAlerts = computed(() =>
  alerts.value.filter((alert) => {
    const matchName = !appliedSearch.name || alert.name.includes(appliedSearch.name)
    const matchType = !appliedSearch.type || alert.type === appliedSearch.type
    const matchStatus = !appliedSearch.status || alert.status === appliedSearch.status
    const matchTime = isAlertTimeInRange(alert.time, appliedSearch.timeRange)
    return matchName && matchType && matchStatus && matchTime
  })
)

function getTypeText(type: AlertType) { return ({ facility: '设施设备异常', gas: '气体异常', safety: '安全行为异常' } as Record<AlertType, string>)[type] }
function getTypeColor(type: AlertType) { return ({ facility: 'processing', gas: 'orange', safety: 'purple' } as Record<AlertType, string>)[type] }
function getStatusText(status: AlertStatus) { return ({ pending: '待处理', handled: '已处理', cleared: '已消警' } as Record<AlertStatus, string>)[status] }
function getStatusColor(status: AlertStatus) { return ({ pending: 'red', handled: 'green', cleared: 'default' } as Record<AlertStatus, string>)[status] }
function handleSearch() {
  appliedSearch.name = searchForm.name.trim()
  appliedSearch.type = searchForm.type
  appliedSearch.status = searchForm.status
  appliedSearch.timeRange = searchForm.timeRange ? [...searchForm.timeRange] as [any, any] : undefined
}
function handleReset() {
  searchForm.name = ''
  searchForm.type = undefined
  searchForm.status = undefined
  searchForm.timeRange = undefined
  appliedSearch.name = ''
  appliedSearch.type = undefined
  appliedSearch.status = undefined
  appliedSearch.timeRange = undefined
}
function isAlertTimeInRange(alertTime: string, timeRange?: [any, any]) {
  if (!timeRange || !timeRange[0] || !timeRange[1]) return true
  const alertAt = new Date(alertTime.replace(/-/g, '/')).getTime()
  const startAt = typeof timeRange[0].valueOf === 'function' ? timeRange[0].valueOf() : new Date(timeRange[0]).getTime()
  const endAt = typeof timeRange[1].valueOf === 'function' ? timeRange[1].valueOf() : new Date(timeRange[1]).getTime()
  return alertAt >= startAt && alertAt <= endAt
}
function jumpToSource(alert: AlertItem) { message.info(`跳转至来源详情：${alert.source}`) }
function openHandleModal(alert: AlertItem) { selectedAlert.value = alert; handleComment.value = alert.handleComment || ''; handleVisible.value = true }
function submitHandle() { if (!selectedAlert.value) return; if (!handleComment.value.trim()) return message.error('请填写处理意见'); selectedAlert.value.status = 'handled'; selectedAlert.value.handleComment = handleComment.value.trim(); handleVisible.value = false; message.success('处置意见已提交') }
function clearAlert(alert: AlertItem) { Modal.confirm({ title: '确认消警', content: '确定将该条告警执行消警吗？', onOk: () => { alert.status = 'cleared'; alert.handleComment = '已消警'; message.success('已消警') } }) }
</script>

<style scoped lang="css">.exception-alert-page {
  width: 100%;
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
  margin: 8px 4px 0;
}
.thumb {
  width: 72px;
  height: 44px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}
</style>
