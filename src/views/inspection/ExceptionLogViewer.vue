
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
                  <a-select-option value="monitor_failure">监测失效</a-select-option>
                  <a-select-option value="uninspectable">不可检异常</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="状态" class="search-item">
                <a-select v-model:value="searchForm.status" placeholder="请选择状态" allow-clear>
                  <a-select-option value="pending_confirm">待确认</a-select-option>
                  <a-select-option value="confirmed">已确认</a-select-option>
                  <a-select-option value="cleared">已消警</a-select-option>
                  <a-select-option value="hazard_created">已转隐患</a-select-option>
                  <a-select-option value="rectifying">整改中</a-select-option>
                  <a-select-option value="pending_review">待复核</a-select-option>
                  <a-select-option value="closed">已闭环</a-select-option>
                  <a-select-option value="archived">已归档</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="风险等级" class="search-item">
                <a-select v-model:value="searchForm.riskLevel" placeholder="请选择风险等级" allow-clear>
                  <a-select-option value="notice">提示</a-select-option>
                  <a-select-option value="warning">预警</a-select-option>
                  <a-select-option value="alarm">告警</a-select-option>
                  <a-select-option value="critical_alarm">严重告警</a-select-option>
                  <a-select-option value="hazard">隐患</a-select-option>
                  <a-select-option value="major_hazard">重大隐患</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="业务场景" class="search-item">
                <a-select v-model:value="searchForm.businessScene" placeholder="请选择业务场景" allow-clear>
                  <a-select-option value="daily_inspection">日常巡检</a-select-option>
                  <a-select-option value="hazard_screening">隐患排查</a-select-option>
                  <a-select-option value="environment_check">环境检查</a-select-option>
                  <a-select-option value="operation_guard">作业监护</a-select-option>
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
              <a-button :disabled="!selectedRowKeys.length" @click="batchConfirm">批量确认</a-button>
              <a-button :disabled="!selectedRowKeys.length" @click="batchCreateHazard">批量转隐患</a-button>
              <a-button :disabled="!selectedRowKeys.length" @click="batchClose">批量复核通过</a-button>
            </a-space>
          </div>
        </a-form>
      </div>

      <a-alert
        type="info"
        show-icon
        class="status-operation-tip"
        message="状态与操作约束说明"
      >
        <template #description>
          <div class="status-flow">
            <span>推荐流转：</span>
            <a-tag color="red">待确认</a-tag>
            <span>→</span>
            <a-tag color="blue">已确认</a-tag>
            <span>→</span>
            <a-tag color="volcano">已转隐患</a-tag>
            <span>→</span>
            <a-tag color="orange">整改中</a-tag>
            <span>→</span>
            <a-tag color="purple">待复核</a-tag>
            <span>→</span>
            <a-tag color="green">已闭环</a-tag>
            <span>→</span>
            <a-tag>已归档</a-tag>
          </div>
          <div class="operation-rules">
            <span>待确认：可确认、消警。</span>
            <span>已确认：可消警、转隐患。</span>
            <span>已转隐患：可进入整改。</span>
            <span>整改中：可提交复核。</span>
            <span>待复核：可复核通过或退回整改。</span>
            <span>已闭环：可归档。</span>
            <span>已消警/已归档：不再处置。</span>
          </div>
        </template>
      </a-alert>

      <a-table
        :columns="columns"
        :data-source="filteredAlerts"
        row-key="id"
        :pagination="{ pageSize: 10 }"
        :scroll="{ x: 1780 }"
        :row-selection="{ selectedRowKeys, onChange: onSelectChange }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <a-tag :color="getTypeColor(record.type)">{{ getTypeText(record.type) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'businessScene'">
            <a-tag :color="getSceneColor(record.businessScene)">{{ getSceneText(record.businessScene) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'riskLevel'">
            <a-tag :color="getRiskColor(record.riskLevel)">{{ getRiskText(record.riskLevel) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'ehsSync'">
            <a-tag :color="record.ehsSync === 'synced' ? 'green' : record.ehsSync === 'pending' ? 'blue' : record.ehsSync === 'failed' ? 'red' : 'default'">
              {{ getEhsText(record.ehsSync) }}
            </a-tag>
            <div v-if="record.ehsTicketNo" class="ehs-ticket">{{ record.ehsTicketNo }}</div>
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
              <a-button type="link" size="small" @click="goDetail(record)">详情</a-button>
              <a-button type="link" size="small" @click="openOperationModal(record, 'confirm')" :disabled="record.status !== 'pending_confirm'">确认</a-button>
              <a-button type="link" size="small" @click="openOperationModal(record, 'clear')" :disabled="!canClear(record.status)">消警</a-button>
              <a-dropdown trigger="click">
                <a-button type="link" size="small">更多处置</a-button>
                <template #overlay>
                    <a-menu class="more-disposal-menu">
                    <a-menu-item key="hazard" :disabled="!canCreateHazard(record.status)" @click="openOperationModal(record, 'hazard')">
                      <a-button type="link" size="small" :disabled="!canCreateHazard(record.status)">转隐患</a-button>
                    </a-menu-item>
                    <a-menu-item key="rectify" :disabled="!canRectify(record.status)" @click="openOperationModal(record, 'rectify')">
                      <a-button type="link" size="small" :disabled="!canRectify(record.status)">整改</a-button>
                    </a-menu-item>
                    <a-menu-item key="review" :disabled="!canReview(record.status)" @click="openOperationModal(record, 'review')">
                      <a-button type="link" size="small" :disabled="!canReview(record.status)">提交复核</a-button>
                    </a-menu-item>
                    <a-menu-item key="review_pass" :disabled="!canReviewPass(record.status)" @click="openOperationModal(record, 'review_pass')">
                      <a-button type="link" size="small" :disabled="!canReviewPass(record.status)">复核通过</a-button>
                    </a-menu-item>
                    <a-menu-item key="review_reject" :disabled="!canReviewReject(record.status)" @click="openOperationModal(record, 'review_reject')">
                      <a-button type="link" size="small" :disabled="!canReviewReject(record.status)">退回整改</a-button>
                    </a-menu-item>
                    <a-menu-item key="archive" :disabled="!canArchive(record.status)" @click="openOperationModal(record, 'archive')">
                      <a-button type="link" size="small" :disabled="!canArchive(record.status)">归档</a-button>
                    </a-menu-item>
                  </a-menu>
                </template>
              </a-dropdown>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="handleVisible" :title="operationTitle" ok-text="提交" cancel-text="取消" @ok="submitHandle">
      <a-form layout="vertical">
        <a-form-item label="告警名称"><a-input :value="selectedAlert?.name" disabled /></a-form-item>
        <a-form-item label="当前状态"><a-input :value="selectedAlert ? getStatusText(selectedAlert.status) : ''" disabled /></a-form-item>
        <a-form-item label="处置意见" required><a-textarea v-model:value="handleComment" :rows="4" placeholder="请输入确认依据、消警原因、隐患说明、整改记录、复核意见或归档结论" /></a-form-item>
        <a-form-item label="第三方 EHS 同步">
          <a-switch v-model:checked="syncToEhs" checked-children="同步" un-checked-children="不同步" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'

type AlertType = 'facility' | 'gas' | 'safety' | 'monitor_failure' | 'uninspectable'
type AlertStatus = 'pending_confirm' | 'confirmed' | 'cleared' | 'hazard_created' | 'rectifying' | 'pending_review' | 'closed' | 'archived'
type RiskLevel = 'notice' | 'warning' | 'alarm' | 'critical_alarm' | 'hazard' | 'major_hazard'
type EhsSyncStatus = 'none' | 'pending' | 'synced' | 'failed'
type OperationType = 'confirm' | 'clear' | 'hazard' | 'rectify' | 'review' | 'review_pass' | 'review_reject' | 'archive'
interface AlertItem {
  id: string
  name: string
  businessScene: string
  type: AlertType
  riskLevel: RiskLevel
  source: string
  summary: string
  area: string
  time: string
  status: AlertStatus
  ehsSync: EhsSyncStatus
  ehsTicketNo?: string
  imageUrl?: string
  handleComment?: string
}

interface AlertSearchForm {
  name: string
  type: AlertType | undefined
  status: AlertStatus | undefined
  riskLevel: RiskLevel | undefined
  businessScene: string | undefined
  timeRange: [any, any] | undefined
}

const searchForm = reactive<AlertSearchForm>({
  name: '',
  type: undefined,
  status: undefined,
  riskLevel: undefined,
  businessScene: undefined,
  timeRange: undefined
})
const router = useRouter()

const appliedSearch = reactive<AlertSearchForm>({
  name: '',
  type: undefined,
  status: undefined,
  riskLevel: undefined,
  businessScene: undefined,
  timeRange: undefined
})
const alerts = ref<AlertItem[]>([
  { id: 'alert-001', name: '配电柜温升异常', businessScene: 'daily_inspection', type: 'facility', riskLevel: 'alarm', source: '任务 TASK-2026-001', summary: '温度 86℃，超过阈值上限 80℃', area: 'A区配电房', time: '2026-04-17 09:20:00', status: 'pending_confirm', ehsSync: 'none', imageUrl: 'https://picsum.photos/seed/alert-1/120/70' },
  { id: 'alert-002', name: '甲烷浓度超阈值', businessScene: 'environment_check', type: 'gas', riskLevel: 'critical_alarm', source: '任务 TASK-2026-002', summary: '浓度 34%LEL，处于告警区间，采样时间 09:35', area: 'B区管廊', time: '2026-04-17 09:35:00', status: 'confirmed', ehsSync: 'pending', ehsTicketNo: 'EHS-PENDING-002', imageUrl: 'https://picsum.photos/seed/alert-2/120/70' },
  { id: 'alert-003', name: '未佩戴安全帽', businessScene: 'operation_guard', type: 'safety', riskLevel: 'warning', source: '任务 TASK-2026-003', summary: '识别到 1 名作业人员未佩戴安全帽', area: '1号车间入口', time: '2026-04-17 10:05:00', status: 'rectifying', ehsSync: 'synced', ehsTicketNo: 'EHS-20260417-003', handleComment: '已通知现场管理人员处置并复核。' },
  { id: 'alert-004', name: '压力表反光无法读取', businessScene: 'daily_inspection', type: 'uninspectable', riskLevel: 'notice', source: '任务 TASK-2026-004', summary: '采集位侧拍存在强反光，识别结果不可用', area: '反应装置区', time: '2026-04-17 10:18:00', status: 'pending_review', ehsSync: 'none', imageUrl: 'https://picsum.photos/seed/alert-4/120/70' },
  { id: 'alert-005', name: '热成像仪监测失效', businessScene: 'hazard_screening', type: 'monitor_failure', riskLevel: 'hazard', source: '机器人 ROBOT-A001', summary: '热成像模块离线，影响温度类检测结果', area: 'B区管廊', time: '2026-04-17 10:25:00', status: 'hazard_created', ehsSync: 'failed', ehsTicketNo: 'EHS-FAIL-005', imageUrl: 'https://picsum.photos/seed/alert-5/120/70' }
])

const columns = [
  { title: '告警名称', dataIndex: 'name', key: 'name', width: 180 },
  { title: '业务场景', key: 'businessScene', width: 130 },
  { title: '异常类型', key: 'type', width: 140 },
  { title: '风险等级', key: 'riskLevel', width: 130 },
  { title: '摘要信息', dataIndex: 'summary', key: 'summary', width: 260 },
  { title: '所属区域', dataIndex: 'area', key: 'area', width: 160 },
  { title: '来源', key: 'source', width: 180 },
  { title: '图片', key: 'snapshot', width: 110 },
  { title: '告警时间', dataIndex: 'time', key: 'time', width: 180 },
  { title: '状态', key: 'status', width: 110 },
  { title: 'EHS同步', key: 'ehsSync', width: 110 },
  { title: '操作', key: 'actions', width: 260, fixed: 'right' }
]

const handleVisible = ref(false)
const selectedAlert = ref<AlertItem | null>(null)
const selectedOperation = ref<OperationType>('confirm')
const handleComment = ref('')
const syncToEhs = ref(false)
const selectedRowKeys = ref<string[]>([])
const operationTitle = computed(() => ({
  confirm: '人工确认异常',
  clear: '误判/消警',
  hazard: '转隐患',
  rectify: '进入整改',
  review: '提交复核',
  review_pass: '复核通过',
  review_reject: '退回整改',
  archive: '归档异常'
} as Record<OperationType, string>)[selectedOperation.value])
const filteredAlerts = computed(() =>
  alerts.value.filter((alert) => {
    const matchName = !appliedSearch.name || alert.name.includes(appliedSearch.name)
    const matchType = !appliedSearch.type || alert.type === appliedSearch.type
    const matchStatus = !appliedSearch.status || alert.status === appliedSearch.status
    const matchRisk = !appliedSearch.riskLevel || alert.riskLevel === appliedSearch.riskLevel
    const matchScene = !appliedSearch.businessScene || alert.businessScene === appliedSearch.businessScene
    const matchTime = isAlertTimeInRange(alert.time, appliedSearch.timeRange)
    return matchName && matchType && matchStatus && matchRisk && matchScene && matchTime
  })
)

function getTypeText(type: AlertType) { return ({ facility: '设施设备异常', gas: '气体异常', safety: '安全行为异常', monitor_failure: '监测失效', uninspectable: '不可检异常' } as Record<AlertType, string>)[type] }
function getTypeColor(type: AlertType) { return ({ facility: 'processing', gas: 'orange', safety: 'purple', monitor_failure: 'red', uninspectable: 'gold' } as Record<AlertType, string>)[type] }
function getRiskText(level: RiskLevel) { return ({ notice: '提示', warning: '预警', alarm: '告警', critical_alarm: '严重告警', hazard: '隐患', major_hazard: '重大隐患' } as Record<RiskLevel, string>)[level] }
function getRiskColor(level: RiskLevel) { return ({ notice: 'default', warning: 'gold', alarm: 'orange', critical_alarm: 'red', hazard: 'volcano', major_hazard: 'magenta' } as Record<RiskLevel, string>)[level] }
function getStatusText(status: AlertStatus) { return ({ pending_confirm: '待确认', confirmed: '已确认', cleared: '已消警', hazard_created: '已转隐患', rectifying: '整改中', pending_review: '待复核', closed: '已闭环', archived: '已归档' } as Record<AlertStatus, string>)[status] }
function getStatusColor(status: AlertStatus) { return ({ pending_confirm: 'red', confirmed: 'blue', cleared: 'default', hazard_created: 'volcano', rectifying: 'orange', pending_review: 'purple', closed: 'green', archived: 'default' } as Record<AlertStatus, string>)[status] }
function getEhsText(status: EhsSyncStatus) { return ({ none: '未同步', pending: '待同步', synced: '已同步', failed: '同步失败' } as Record<EhsSyncStatus, string>)[status] }
function getSceneText(scene?: string) { return ({ daily_inspection: '日常巡检', hazard_screening: '隐患排查', environment_check: '环境检查', operation_guard: '作业监护' } as Record<string, string>)[scene || ''] || '日常巡检' }
function getSceneColor(scene?: string) { return ({ daily_inspection: 'blue', hazard_screening: 'volcano', environment_check: 'green', operation_guard: 'purple' } as Record<string, string>)[scene || ''] || 'blue' }
function handleSearch() {
  appliedSearch.name = searchForm.name.trim()
  appliedSearch.type = searchForm.type
  appliedSearch.status = searchForm.status
  appliedSearch.riskLevel = searchForm.riskLevel
  appliedSearch.businessScene = searchForm.businessScene
  appliedSearch.timeRange = searchForm.timeRange ? [...searchForm.timeRange] as [any, any] : undefined
}
function handleReset() {
  searchForm.name = ''
  searchForm.type = undefined
  searchForm.status = undefined
  searchForm.riskLevel = undefined
  searchForm.businessScene = undefined
  searchForm.timeRange = undefined
  appliedSearch.name = ''
  appliedSearch.type = undefined
  appliedSearch.status = undefined
  appliedSearch.riskLevel = undefined
  appliedSearch.businessScene = undefined
  appliedSearch.timeRange = undefined
}
function goDetail(record: AlertItem) {
  router.push(`/management/exception/detail/${record.id}`)
}
function isAlertTimeInRange(alertTime: string, timeRange?: [any, any]) {
  if (!timeRange || !timeRange[0] || !timeRange[1]) return true
  const alertAt = new Date(alertTime.replace(/-/g, '/')).getTime()
  const startAt = typeof timeRange[0].valueOf === 'function' ? timeRange[0].valueOf() : new Date(timeRange[0]).getTime()
  const endAt = typeof timeRange[1].valueOf === 'function' ? timeRange[1].valueOf() : new Date(timeRange[1]).getTime()
  return alertAt >= startAt && alertAt <= endAt
}
function jumpToSource(alert: AlertItem) {
  const matched = alert.source.match(/TASK-\d+-(\d+)/)
  if (matched?.[1]) {
    router.push(`/management/task/detail/task-${matched[1].padStart(3, '0')}?tab=evidence`)
    return
  }
  message.info(`跳转至来源详情：${alert.source}`)
}
function canClear(status: AlertStatus) { return ['pending_confirm', 'confirmed', 'pending_review'].includes(status) }
function canCreateHazard(status: AlertStatus) { return ['confirmed', 'pending_review'].includes(status) }
function canRectify(status: AlertStatus) { return ['hazard_created'].includes(status) }
function canReview(status: AlertStatus) { return ['rectifying'].includes(status) }
function canReviewPass(status: AlertStatus) { return status === 'pending_review' }
function canReviewReject(status: AlertStatus) { return status === 'pending_review' }
function canArchive(status: AlertStatus) { return ['closed'].includes(status) }
function openOperationModal(alert: AlertItem, operation: OperationType) {
  selectedAlert.value = alert
  selectedOperation.value = operation
  handleComment.value = alert.handleComment || ''
  syncToEhs.value = alert.ehsSync === 'pending' || alert.ehsSync === 'synced'
  handleVisible.value = true
}
function getNextStatus(operation: OperationType): AlertStatus {
  if (operation === 'confirm') return 'confirmed'
  if (operation === 'clear') return 'cleared'
  if (operation === 'hazard') return 'hazard_created'
  if (operation === 'rectify') return 'rectifying'
  if (operation === 'review') return 'pending_review'
  if (operation === 'review_pass') return 'closed'
  if (operation === 'review_reject') return 'rectifying'
  if (operation === 'archive') return 'archived'
  return 'confirmed'
}
function submitHandle() {
  if (!selectedAlert.value) return
  if (!handleComment.value.trim()) return message.error('请填写处理意见')
  selectedAlert.value.status = getNextStatus(selectedOperation.value)
  selectedAlert.value.handleComment = handleComment.value.trim()
  selectedAlert.value.ehsSync = syncToEhs.value ? 'pending' : selectedAlert.value.ehsSync
  handleVisible.value = false
  message.success('处置状态已更新')
}
function onSelectChange(keys: string[]) {
  selectedRowKeys.value = keys
}
function batchConfirm() {
  alerts.value.forEach((alert) => {
    if (selectedRowKeys.value.includes(alert.id) && alert.status === 'pending_confirm') {
      alert.status = 'confirmed'
      alert.handleComment = '批量确认'
    }
  })
  selectedRowKeys.value = []
  message.success('批量确认已完成')
}
function batchClose() {
  Modal.confirm({
    title: '确认批量复核通过',
    content: '仅对待复核状态的异常执行复核通过，并进入已闭环状态。',
    onOk: () => {
      alerts.value.forEach((alert) => {
        if (selectedRowKeys.value.includes(alert.id) && canReviewPass(alert.status)) {
          alert.status = 'closed'
          alert.handleComment = '批量复核通过'
        }
      })
      selectedRowKeys.value = []
      message.success('批量复核通过已完成')
    }
  })
}
function batchCreateHazard() {
  alerts.value.forEach((alert) => {
    if (selectedRowKeys.value.includes(alert.id) && canCreateHazard(alert.status)) {
      alert.status = 'hazard_created'
      if (alert.ehsSync === 'none') alert.ehsSync = 'pending'
      alert.handleComment = '批量转隐患'
    }
  })
  selectedRowKeys.value = []
  message.success('批量转隐患已完成')
}
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
.status-operation-tip {
  margin-bottom: 12px;
}
.status-flow {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}
.operation-rules {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 16px;
  color: #4b5563;
  line-height: 1.7;
}
.thumb {
  width: 72px;
  height: 44px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}
.ehs-ticket {
  margin-top: 4px;
  color: #8c8c8c;
  font-size: 12px;
}

:global(.more-disposal-menu .ant-dropdown-menu-item) {
  padding: 4px 8px;
}

:global(.more-disposal-menu .ant-dropdown-menu-item-disabled) {
  cursor: not-allowed;
}

:global(.more-disposal-menu .ant-btn) {
  min-width: 88px;
  padding: 0;
  text-align: left;
}
</style>
