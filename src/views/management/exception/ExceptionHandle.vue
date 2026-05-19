<template>
  <div class="exception-handle">
    <a-page-header title="异常处理" sub-title="事实确认、处置理由、第三方推送与复核归档分开表达" @back="goBack" />
    <a-card style="margin-top: 16px">
      <a-descriptions bordered size="small" :column="3">
        <a-descriptions-item label="异常ID">{{ exceptionId }}</a-descriptions-item>
        <a-descriptions-item label="当前状态"><a-tag :color="getStatusColor(currentStatus)">{{ getStatusText(currentStatus) }}</a-tag></a-descriptions-item>
        <a-descriptions-item label="第三方单号">{{ ehsTicketNo || '未同步' }}</a-descriptions-item>
        <a-descriptions-item label="检测对象">A区 / 循环泵装置 / 1号循环泵 / 出口法兰</a-descriptions-item>
        <a-descriptions-item label="来源任务">TASK-2026-001</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card title="处置表单" style="margin-top: 16px">
      <a-form :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :xs="24" :md="8">
            <a-form-item label="处置动作" required>
              <a-select v-model:value="form.operation">
                <a-select-option value="confirm">人工确认</a-select-option>
                <a-select-option value="misjudged">标记误判</a-select-option>
                <a-select-option value="hazard">转隐患</a-select-option>
                <a-select-option value="rectify">转整改</a-select-option>
                <a-select-option value="push_third_party">推送第三方</a-select-option>
                <a-select-option value="review">提交复核</a-select-option>
                <a-select-option value="review_pass">复核通过</a-select-option>
                <a-select-option value="review_reject">退回整改</a-select-option>
                <a-select-option value="archive">归档</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item label="业务场景"><a-input v-model:value="form.businessScene" /></a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item label="处理人员" required><a-input v-model:value="form.handler" /></a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="事实确认" required><a-textarea v-model:value="form.fact" :rows="3" /></a-form-item>
        <a-form-item label="处置理由" required><a-textarea v-model:value="form.reason" :rows="3" /></a-form-item>
        <a-row :gutter="16">
          <a-col :xs="24" :md="12"><a-form-item label="是否推送第三方"><a-switch v-model:checked="form.syncToThirdParty" /></a-form-item></a-col>
          <a-col :xs="24" :md="12"><a-form-item label="第三方状态"><a-input v-model:value="form.thirdPartyStatus" /></a-form-item></a-col>
        </a-row>
        <a-form-item label="第三方单号"><a-input v-model:value="form.thirdPartyTicketNo" /></a-form-item>
        <div class="form-actions"><a-space><a-button @click="goBack">取消</a-button><a-button type="primary" @click="submitForm">提交处理</a-button></a-space></div>
      </a-form>
    </a-card>

    <a-card title="处理历史" style="margin-top: 16px">
      <a-table :columns="columns" :data-source="historyRows" row-key="id" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'"><a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag></template>
          <template v-else-if="column.key === 'pushStatus'"><a-tag :color="getPushColor(record.pushStatus)">{{ getPushText(record.pushStatus) }}</a-tag></template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'

type OperationType = 'confirm' | 'misjudged' | 'hazard' | 'rectify' | 'push_third_party' | 'review' | 'review_pass' | 'review_reject' | 'archive'
type HandleStatus = 'pending_confirm' | 'confirmed' | 'misjudged' | 'hazard_created' | 'rectifying' | 'pending_review' | 'closed' | 'archived'
type PushStatus = 'none' | 'pending' | 'success' | 'failed'

const route = useRoute()
const router = useRouter()
const exceptionId = ref(String(route.params.id || 'exception-001'))
const currentStatus = ref<HandleStatus>('hazard_created')
const ehsTicketNo = ref('')

const form = reactive({
  operation: 'rectify' as OperationType,
  businessScene: '日常巡检',
  handler: '安全员-周晨',
  fact: '热成像识别局部温升 86℃。',
  reason: '需要转隐患并同步第三方。',
  syncToThirdParty: true,
  thirdPartyStatus: '待同步',
  thirdPartyTicketNo: ''
})

const historyRows = ref([
  { id: 'h-1', operation: '系统识别', handler: '机器人A001', status: 'pending_confirm', time: '2026-04-17 10:18:00', fact: '识别到法兰温升异常。', reason: '待人工确认。', pushStatus: 'none' },
  { id: 'h-2', operation: '人工确认', handler: '值班长-李航', status: 'confirmed', time: '2026-04-17 10:25:00', fact: '确认告警有效。', reason: '已进入复核流程。', pushStatus: 'none' },
  { id: 'h-3', operation: '转隐患', handler: '安全员-周晨', status: 'hazard_created', time: '2026-04-17 10:32:00', fact: '告警事实成立。', reason: '转入隐患闭环。', pushStatus: 'pending' }
])

const columns = [
  { title: '动作', dataIndex: 'operation', key: 'operation', width: 120 },
  { title: '状态', key: 'status', width: 120 },
  { title: '处理人员', dataIndex: 'handler', key: 'handler', width: 140 },
  { title: '处理时间', dataIndex: 'time', key: 'time', width: 180 },
  { title: '事实确认', dataIndex: 'fact', key: 'fact' },
  { title: '处置理由', dataIndex: 'reason', key: 'reason' },
  { title: '第三方状态', key: 'pushStatus', width: 120 }
]

const operationStatusMap: Record<OperationType, HandleStatus> = {
  confirm: 'confirmed',
  misjudged: 'misjudged',
  hazard: 'hazard_created',
  rectify: 'rectifying',
  push_third_party: 'pending_review',
  review: 'pending_review',
  review_pass: 'closed',
  review_reject: 'rectifying',
  archive: 'archived'
}

const operationTextMap = computed<Record<OperationType, string>>(() => ({
  confirm: '人工确认',
  misjudged: '标记误判',
  hazard: '转隐患',
  rectify: '转整改',
  push_third_party: '推送第三方',
  review: '提交复核',
  review_pass: '复核通过',
  review_reject: '退回整改',
  archive: '归档'
}))

function getStatusText(status: HandleStatus) { return ({ pending_confirm: '待确认', confirmed: '已确认', misjudged: '标记误判', hazard_created: '已转隐患', rectifying: '整改中', pending_review: '待复核', closed: '已闭环', archived: '已归档' } as Record<HandleStatus, string>)[status] }
function getStatusColor(status: HandleStatus) { return ({ pending_confirm: 'red', confirmed: 'blue', misjudged: 'default', hazard_created: 'volcano', rectifying: 'orange', pending_review: 'purple', closed: 'green', archived: 'default' } as Record<HandleStatus, string>)[status] }
function getPushText(status: PushStatus) { return ({ none: '未同步', pending: '待同步', success: '已同步', failed: '同步失败' } as Record<PushStatus, string>)[status] }
function getPushColor(status: PushStatus) { return ({ none: 'default', pending: 'blue', success: 'green', failed: 'red' } as Record<PushStatus, string>)[status] }

function submitForm() {
  if (!form.handler.trim() || !form.fact.trim() || !form.reason.trim()) return message.error('请填写事实确认、处置理由和处理人员')
  const status = operationStatusMap[form.operation]
  currentStatus.value = status
  if (form.syncToThirdParty && !ehsTicketNo.value) ehsTicketNo.value = form.thirdPartyTicketNo || `EHS-${Date.now()}`
  historyRows.value.unshift({
    id: `h-${Date.now()}`,
    operation: operationTextMap.value[form.operation],
    handler: form.handler.trim(),
    status,
    time: new Date().toLocaleString(),
    fact: form.fact.trim(),
    reason: form.reason.trim(),
    pushStatus: form.syncToThirdParty ? 'pending' : 'none'
  })
  message.success('异常处置已提交')
}

function goBack() { router.push(`/management/exception/detail/${exceptionId.value}`) }
</script>

<style scoped>
.exception-handle { width: 100%; }
.form-actions { display: flex; justify-content: flex-end; }
</style>
