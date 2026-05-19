<template>
  <div class="exception-handle">
    <a-page-header title="异常处理" sub-title="完成确认、消警、转隐患、整改、复核、闭环与 EHS 同步" @back="goBack" />

    <a-card style="margin-top: 16px">
      <a-alert
        type="info"
        show-icon
        style="margin-bottom: 16px"
        message="异常是机器人识别结果；转隐患后进入安全管理闭环，可选择是否同步第三方 EHS。"
      />
      <a-descriptions bordered size="small" :column="3">
        <a-descriptions-item label="异常ID">{{ exceptionId }}</a-descriptions-item>
        <a-descriptions-item label="当前状态">
          <a-tag :color="getStatusColor(currentStatus)">{{ getStatusText(currentStatus) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="风险等级">
          <a-tag color="volcano">隐患</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="检测对象">1号循环泵 / 出口法兰连接处</a-descriptions-item>
        <a-descriptions-item label="来源任务">TASK-2026-001</a-descriptions-item>
        <a-descriptions-item label="EHS 单号">{{ ehsTicketNo || '未同步' }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card title="处置表单" style="margin-top: 16px">
      <a-form :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :xs="24" :md="8">
            <a-form-item label="处置动作" required>
              <a-select v-model:value="form.operation">
                <a-select-option value="confirm">人工确认</a-select-option>
                <a-select-option value="clear">误判消警</a-select-option>
                <a-select-option value="hazard">转隐患</a-select-option>
                <a-select-option value="rectify">整改中</a-select-option>
                <a-select-option value="review">待复核</a-select-option>
                <a-select-option value="close">闭环</a-select-option>
                <a-select-option value="archive">归档</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item label="处理人员" required>
              <a-input v-model:value="form.handler" placeholder="请输入处理人员" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item label="是否同步 EHS">
              <a-switch v-model:checked="form.syncToEhs" checked-children="同步" un-checked-children="不同步" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="处置意见" required>
          <a-textarea v-model:value="form.comment" :rows="4" placeholder="请输入确认依据、消警原因、隐患说明、整改记录、复核意见或闭环结论" />
        </a-form-item>
        <div class="form-actions">
          <a-space>
            <a-button @click="goBack">取消</a-button>
            <a-button type="primary" @click="submitForm">提交处理</a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>

    <a-card title="处理历史" style="margin-top: 16px">
      <a-table :columns="columns" :data-source="historyRows" row-key="id" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'ehsSync'">
            <a-tag :color="record.ehsSync === 'synced' ? 'green' : record.ehsSync === 'pending' ? 'blue' : 'default'">{{ record.ehsSyncText }}</a-tag>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'

type OperationType = 'confirm' | 'clear' | 'hazard' | 'rectify' | 'review' | 'close' | 'archive'
type HandleStatus = 'pending_confirm' | 'confirmed' | 'cleared' | 'hazard_created' | 'rectifying' | 'pending_review' | 'closed' | 'archived'

const route = useRoute()
const router = useRouter()
const exceptionId = ref(route.params.id as string)
const currentStatus = ref<HandleStatus>('hazard_created')
const ehsTicketNo = ref('')

const form = reactive({
  operation: 'rectify' as OperationType,
  handler: '安全员-周晨',
  syncToEhs: true,
  comment: ''
})

const historyRows = ref([
  { id: 'h-1', operation: '系统识别', handler: '机器人A001', status: 'pending_confirm', time: '2026-04-17 10:18:00', comment: '识别到法兰连接处热异常。', ehsSync: 'none', ehsSyncText: '未同步' },
  { id: 'h-2', operation: '人工确认', handler: '值班长-李航', status: 'confirmed', time: '2026-04-17 10:25:00', comment: '确认需现场复核。', ehsSync: 'none', ehsSyncText: '未同步' },
  { id: 'h-3', operation: '转隐患', handler: '安全员-周晨', status: 'hazard_created', time: '2026-04-17 10:32:00', comment: '转入隐患闭环。', ehsSync: 'pending', ehsSyncText: '待同步' }
])

const columns = [
  { title: '动作', dataIndex: 'operation', key: 'operation', width: 120 },
  { title: '状态', key: 'status', width: 120 },
  { title: '处理人员', dataIndex: 'handler', key: 'handler', width: 140 },
  { title: '处理时间', dataIndex: 'time', key: 'time', width: 180 },
  { title: '处理意见', dataIndex: 'comment', key: 'comment' },
  { title: 'EHS同步', key: 'ehsSync', width: 120 }
]

const operationStatusMap: Record<OperationType, HandleStatus> = {
  confirm: 'confirmed',
  clear: 'cleared',
  hazard: 'hazard_created',
  rectify: 'rectifying',
  review: 'pending_review',
  close: 'closed',
  archive: 'archived'
}

const operationTextMap = computed<Record<OperationType, string>>(() => ({
  confirm: '人工确认',
  clear: '误判消警',
  hazard: '转隐患',
  rectify: '进入整改',
  review: '提交复核',
  close: '闭环',
  archive: '归档'
}))

function getStatusText(status: HandleStatus) {
  return ({ pending_confirm: '待确认', confirmed: '已确认', cleared: '已消警', hazard_created: '已转隐患', rectifying: '整改中', pending_review: '待复核', closed: '已闭环', archived: '已归档' } as Record<HandleStatus, string>)[status]
}

function getStatusColor(status: HandleStatus) {
  return ({ pending_confirm: 'red', confirmed: 'blue', cleared: 'default', hazard_created: 'volcano', rectifying: 'orange', pending_review: 'purple', closed: 'green', archived: 'default' } as Record<HandleStatus, string>)[status]
}

function submitForm() {
  if (!form.handler.trim() || !form.comment.trim()) {
    message.error('请填写处理人员和处置意见')
    return
  }
  const status = operationStatusMap[form.operation]
  currentStatus.value = status
  if (form.syncToEhs && !ehsTicketNo.value) ehsTicketNo.value = `EHS-${Date.now()}`
  historyRows.value.unshift({
    id: `h-${Date.now()}`,
    operation: operationTextMap.value[form.operation],
    handler: form.handler.trim(),
    status,
    time: new Date().toLocaleString(),
    comment: form.comment.trim(),
    ehsSync: form.syncToEhs ? 'pending' : 'none',
    ehsSyncText: form.syncToEhs ? '待同步' : '未同步'
  })
  form.comment = ''
  message.success('异常处置已提交')
}

function goBack() {
  router.push(`/management/exception/detail/${exceptionId.value}`)
}
</script>

<style scoped lang="css">
.exception-handle {
  width: 100%;
}
.form-actions {
  display: flex;
  justify-content: flex-end;
}
</style>
