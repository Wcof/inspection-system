<template>
  <div class="exception-alert-page">
    <a-page-header title="异常告警" sub-title="区分实时告警与巡检告警，补齐来源、证据、回传与处置字段" />

    <a-card style="margin-top: 16px">
      <div class="scene-switch" style="margin-bottom: 12px">
        <button
          v-for="item in alarmSourceOptions"
          :key="item.value"
          type="button"
          class="scene-switch__item"
          :class="{ 'scene-switch__item--active': activeAlarmSource === item.value }"
          @click="activeAlarmSource = item.value"
        >
          {{ item.label }}
        </button>
      </div>
      <a-form layout="vertical" :model="searchForm" @submit.prevent>
        <a-row :gutter="[16, 8]">
          <a-col :xs="24" :sm="12" :md="8" :lg="6"><a-form-item label="告警名称" class="search-item"><a-input v-model:value="searchForm.name" placeholder="请输入告警名称" allow-clear /></a-form-item></a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="异常类型" class="search-item">
              <a-select v-model:value="searchForm.type" placeholder="请选择异常类型" allow-clear>
                <a-select-option value="facility_component">设施/巡检对象异常</a-select-option>
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
                <a-select-option value="misjudged">标记误判</a-select-option>
                <a-select-option value="internal_processing">内部处理中</a-select-option>
                <a-select-option value="internal_closed">线下人工已处置</a-select-option>
                <a-select-option value="third_party_hazard">第三方隐患处理中</a-select-option>
                <a-select-option value="third_party_rectify">第三方整改处理中</a-select-option>
                <a-select-option value="third_party_closed">第三方已闭环</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="业务场景" class="search-item">
              <a-select v-model:value="searchForm.businessScene" placeholder="请选择业务场景" allow-clear>
                <a-select-option value="daily_inspection">日常巡检</a-select-option>
                <a-select-option value="hazard_screening">临时补检</a-select-option>
                <a-select-option value="environment_check">环境检查</a-select-option>
                <a-select-option value="operation_guard">看护作业</a-select-option>
                <a-select-option value="work_ticket_guard">作业票监护</a-select-option>
                <a-select-option value="emergency_arrival">应急到场</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="推送状态" class="search-item">
              <a-select v-model:value="searchForm.pushStatus" placeholder="请选择推送状态" allow-clear>
                <a-select-option value="none">未推送</a-select-option>
                <a-select-option value="pending">待推送</a-select-option>
                <a-select-option value="success">已推送</a-select-option>
                <a-select-option value="failed">推送失败</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <div class="search-actions">
          <a-space>
            <a-button type="primary" @click="handleSearch">搜索</a-button>
            <a-button @click="handleReset">重置</a-button>
            <a-button :disabled="!selectedRowKeys.length" @click="batchInternalClose">批量线下人工处置</a-button>
            <a-button :disabled="!selectedRowKeys.length" @click="batchThirdPartyRectify">批量转第三方整改</a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>

    <a-card style="margin-top: 12px">
      <a-table :columns="activeColumns" :data-source="filteredAlerts" row-key="id" :pagination="{ pageSize: 10 }" :row-selection="{ selectedRowKeys, onChange: onSelectChange }" :scroll="{ x: 1880 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'alarmSource'"><a-tag :color="record.alarmSource === 'inspection' ? 'blue' : 'purple'">{{ getAlarmSourceText(record.alarmSource) }}</a-tag></template>
          <template v-else-if="column.key === 'type'"><a-tag :color="getTypeColor(record.type)">{{ getTypeText(record.type) }}</a-tag></template>
          <template v-else-if="column.key === 'businessScene'"><a-tag :color="getSceneColor(record.businessScene)">{{ getSceneText(record.businessScene) }}</a-tag></template>
          <template v-else-if="column.key === 'status'"><a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag></template>
          <template v-else-if="column.key === 'pushStatus'"><a-tag :color="getPushColor(record.pushStatus)">{{ getPushText(record.pushStatus) }}</a-tag></template>
          <template v-else-if="column.key === 'taskName' || column.key === 'sourceTask'">
            <a-button v-if="record.sourceTask" type="link" size="small" @click="jumpToSource(record)">{{ record.taskName || record.sourceTask }}</a-button>
            <span v-else>{{ record.sourceTrigger || '-' }}</span>
          </template>
          <template v-else-if="column.key === 'evidence' || column.key === 'snapshot'">
            <img v-if="record.imageUrl" :src="record.imageUrl" class="thumb" alt="snapshot" />
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="goDetail(record)">详情</a-button>
              <a-button type="link" size="small" @click="openOperationModal(record)" :disabled="record.status !== 'pending_confirm'">处理</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="handleVisible" title="确认处理" ok-text="提交" cancel-text="取消" @ok="submitHandle">
      <a-form layout="vertical">
        <a-form-item label="告警名称"><a-input :value="selectedAlert?.name" disabled /></a-form-item>
        <a-form-item label="处理类型" required>
          <a-select v-model:value="selectedOperation">
            <a-select-option value="internal_close">线下人工处置</a-select-option>
            <a-select-option value="third_party_hazard">转第三方隐患</a-select-option>
            <a-select-option value="third_party_rectify">转第三方整改</a-select-option>
            <a-select-option value="misjudged">标记误判</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="事实确认" required><a-textarea v-model:value="handleFact" :rows="3" /></a-form-item>
        <a-form-item label="处置理由" required><a-textarea v-model:value="handleReason" :rows="3" /></a-form-item>
        <a-form-item label="第三方单号"><a-input v-model:value="thirdPartyTicketNo" /></a-form-item>
      </a-form>
    </a-modal>

    <div v-if="entryNoticeVisible && currentNoticeAlert" class="entry-alert-panel">
      <div class="entry-alert-panel__bar"></div>
      <div class="entry-alert-panel__header">
        <div>
          <div class="entry-alert-panel__eyebrow">待确认告警提醒</div>
          <div class="entry-alert-panel__title">{{ currentNoticeAlert.name }}</div>
        </div>
        <button class="entry-alert-panel__close" type="button" aria-label="关闭告警提醒" @click="closeEntryNotice">×</button>
      </div>
      <div class="entry-alert-panel__tags">
        <a-tag :color="currentNoticeAlert.alarmSource === 'inspection' ? 'blue' : 'purple'">{{ getAlarmSourceText(currentNoticeAlert.alarmSource) }}</a-tag>
        <a-tag :color="getTypeColor(currentNoticeAlert.type)">{{ getTypeText(currentNoticeAlert.type) }}</a-tag>
        <a-tag color="red">{{ getStatusText(currentNoticeAlert.status) }}</a-tag>
      </div>
      <div class="entry-alert-panel__meta">
        {{ currentNoticeAlert.areaName }} / {{ currentNoticeAlert.installationName }}
        <template v-if="currentNoticeAlert.facilityName"> / {{ currentNoticeAlert.facilityName }}</template>
      </div>
      <div class="entry-alert-panel__fact">{{ currentNoticeAlert.alertFact }}</div>
      <div class="entry-alert-panel__images">
        <div class="entry-alert-panel__image-card">
          <img :src="currentNoticeAlert.opticalImageUrl || currentNoticeAlert.imageUrl" alt="光学图" />
          <span>光学图</span>
        </div>
        <div class="entry-alert-panel__image-card">
          <img :src="currentNoticeAlert.thermalImageUrl || currentNoticeAlert.imageUrl" alt="热成图" />
          <span>热成图</span>
        </div>
      </div>
      <div class="entry-alert-panel__footer">
        <span>{{ currentNoticeAlert.sampledAt }}</span>
        <a-space>
          <a-button size="small" @click="openOperationModal(currentNoticeAlert)">处理</a-button>
          <a-button size="small" type="primary" @click="goDetail(currentNoticeAlert)">查看详情</a-button>
        </a-space>
      </div>
      <div v-if="pendingNoticeAlerts.length > 1" class="entry-alert-panel__pager">
        <a-button size="small" :disabled="currentNoticeIndex === 0" @click="switchNotice(-1)">上一条</a-button>
        <div class="entry-alert-panel__dots" aria-label="告警切换">
          <button
            v-for="(item, index) in pendingNoticeAlerts"
            :key="item.id"
            type="button"
            :class="{ active: index === currentNoticeIndex }"
            :aria-label="`切换到第 ${index + 1} 条告警`"
            @click="currentNoticeIndex = index"
          ></button>
        </div>
        <a-button size="small" :disabled="currentNoticeIndex === pendingNoticeAlerts.length - 1" @click="switchNotice(1)">下一条</a-button>
        <span class="entry-alert-panel__count">{{ currentNoticeIndex + 1 }} / {{ pendingNoticeAlerts.length }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'

type AlertType = 'facility_component' | 'gas' | 'safety' | 'monitor_failure' | 'uninspectable'
type AlertStatus = 'pending_confirm' | 'misjudged' | 'internal_processing' | 'internal_closed' | 'third_party_hazard' | 'third_party_rectify' | 'third_party_closed'
type PushStatus = 'none' | 'pending' | 'success' | 'failed'
type AlarmSource = 'all' | 'realtime' | 'inspection'
type OperationType = 'internal_close' | 'third_party_hazard' | 'third_party_rectify' | 'misjudged'

interface AlertItem {
  id: string
  alarmSource: AlarmSource
  name: string
  alertFact: string
  handlingReason: string
  businessScene: string
  type: AlertType
  sourceTrigger?: string
  sourceTask?: string
  taskName?: string
  areaName: string
  installationName: string
  facilityName?: string
  componentName?: string
  ruleName?: string
  inspectionPointName?: string
  parkingPointName?: string
  sampledAt: string
  status: AlertStatus
  pushStatus: PushStatus
  imageUrl?: string
  opticalImageUrl?: string
  thermalImageUrl?: string
  thirdPartyTicketNo?: string
}

const router = useRouter()
const opticalImageUrl = new URL('../../设备.png', import.meta.url).href
const thermalImageUrl = new URL('../../车间.png', import.meta.url).href
const activeAlarmSource = ref<AlarmSource>('all')
const alarmSourceOptions: Array<{ label: string; value: AlarmSource }> = [
  { label: '全部', value: 'all' },
  { label: '实时告警', value: 'realtime' },
  { label: '巡检告警', value: 'inspection' }
]
const searchForm = reactive({ name: '', type: undefined as AlertType | undefined, status: undefined as AlertStatus | undefined, businessScene: undefined as string | undefined, pushStatus: undefined as PushStatus | undefined })
const applied = reactive({ name: '', type: undefined as AlertType | undefined, status: undefined as AlertStatus | undefined, businessScene: undefined as string | undefined, pushStatus: undefined as PushStatus | undefined })
const selectedRowKeys = ref<string[]>([])
const handleVisible = ref(false)
const selectedAlert = ref<AlertItem | null>(null)
const selectedOperation = ref<OperationType>('internal_close')
const handleFact = ref('')
const handleReason = ref('')
const thirdPartyTicketNo = ref('')
const entryNoticeVisible = ref(false)
const currentNoticeIndex = ref(0)

const alerts = ref<AlertItem[]>([
  { id: 'rt-001', alarmSource: 'realtime', name: '甲烷浓度瞬时超限', alertFact: '边巡边检气体模块检测到 34%LEL', handlingReason: '待确认是否转第三方', businessScene: 'environment_check', type: 'gas', sourceTrigger: '边巡边检气体模块', areaName: 'B区', installationName: '管廊装置', sampledAt: '2026-04-17 09:35:00', status: 'pending_confirm', pushStatus: 'none', imageUrl: opticalImageUrl, opticalImageUrl, thermalImageUrl },
  { id: 'a1', alarmSource: 'inspection', name: '1号循环泵温升异常', alertFact: '热成像识别局部温升 86℃', handlingReason: '待选择闭环方式', businessScene: 'daily_inspection', type: 'facility_component', sourceTask: 'TASK-2026-001', taskName: '1号循环泵日常巡检', areaName: 'A区', installationName: '循环泵装置', facilityName: '1号循环泵', componentName: '出口法兰', ruleName: '温升判定规则 V1', inspectionPointName: '泵房巡检点', parkingPointName: '泵房北侧停车点', sampledAt: '2026-04-17 10:17:42', status: 'pending_confirm', pushStatus: 'none', imageUrl: opticalImageUrl, opticalImageUrl, thermalImageUrl }
])

const realtimeColumns = [
  { title: '告警名称', dataIndex: 'name', key: 'name', width: 180 },
  { title: '告警类型', key: 'type', width: 120 },
  { title: '业务场景', key: 'businessScene', width: 120 },
  { title: '区域', dataIndex: 'areaName', key: 'areaName', width: 120 },
  { title: '装置', dataIndex: 'installationName', key: 'installationName', width: 140 },
  { title: '触发来源', dataIndex: 'sourceTrigger', key: 'sourceTrigger', width: 160 },
  { title: '告警事实', dataIndex: 'alertFact', key: 'alertFact', width: 220 },
  { title: '采样时间', dataIndex: 'sampledAt', key: 'sampledAt', width: 180 },
  { title: '状态', key: 'status', width: 140 },
  { title: '推送状态', key: 'pushStatus', width: 120 },
  { title: '证据', key: 'snapshot', width: 110 },
  { title: '操作', key: 'actions', width: 140, fixed: 'right' }
]

const inspectionColumns = [
  { title: '告警名称', dataIndex: 'name', key: 'name', width: 180 },
  { title: '任务', key: 'taskName', width: 180 },
  { title: '巡检点', dataIndex: 'inspectionPointName', key: 'inspectionPointName', width: 140 },
  { title: '停车点', dataIndex: 'parkingPointName', key: 'parkingPointName', width: 140 },
  { title: '设施/管路', dataIndex: 'facilityName', key: 'facilityName', width: 150 },
  { title: '巡检对象', dataIndex: 'componentName', key: 'componentName', width: 120 },
  { title: '规则', dataIndex: 'ruleName', key: 'ruleName', width: 150 },
  { title: '告警事实', dataIndex: 'alertFact', key: 'alertFact', width: 220 },
  { title: '证据', key: 'evidence', width: 110 },
  { title: '采样时间', dataIndex: 'sampledAt', key: 'sampledAt', width: 180 },
  { title: '状态', key: 'status', width: 140 },
  { title: '推送状态', key: 'pushStatus', width: 120 },
  { title: '操作', key: 'actions', width: 140, fixed: 'right' }
]

const allColumns = [
  { title: '告警来源', dataIndex: 'alarmSource', key: 'alarmSource', width: 100 },
  { title: '告警名称', dataIndex: 'name', key: 'name', width: 180 },
  { title: '告警类型', key: 'type', width: 120 },
  { title: '业务场景', key: 'businessScene', width: 120 },
  { title: '任务/触发来源', key: 'sourceTask', width: 180 },
  { title: '区域', dataIndex: 'areaName', key: 'areaName', width: 120 },
  { title: '装置', dataIndex: 'installationName', key: 'installationName', width: 140 },
  { title: '设施/管路', dataIndex: 'facilityName', key: 'facilityName', width: 150 },
  { title: '巡检对象', dataIndex: 'componentName', key: 'componentName', width: 120 },
  { title: '规则', dataIndex: 'ruleName', key: 'ruleName', width: 150 },
  { title: '告警事实', dataIndex: 'alertFact', key: 'alertFact', width: 220 },
  { title: '采样时间', dataIndex: 'sampledAt', key: 'sampledAt', width: 180 },
  { title: '状态', key: 'status', width: 140 },
  { title: '推送状态', key: 'pushStatus', width: 120 },
  { title: '证据', key: 'snapshot', width: 110 },
  { title: '操作', key: 'actions', width: 140, fixed: 'right' }
]

const activeColumns = computed(() => {
  if (activeAlarmSource.value === 'all') return allColumns
  return activeAlarmSource.value === 'inspection' ? inspectionColumns : realtimeColumns
})
const filteredAlerts = computed(() => alerts.value.filter((item) => (activeAlarmSource.value === 'all' || item.alarmSource === activeAlarmSource.value) && (!applied.name || item.name.includes(applied.name)) && (!applied.type || item.type === applied.type) && (!applied.status || item.status === applied.status) && (!applied.businessScene || item.businessScene === applied.businessScene) && (!applied.pushStatus || item.pushStatus === applied.pushStatus)))
const pendingNoticeAlerts = computed(() => alerts.value.filter((item) => item.status === 'pending_confirm'))
const currentNoticeAlert = computed(() => pendingNoticeAlerts.value[currentNoticeIndex.value])

function handleSearch() { applied.name = searchForm.name.trim(); applied.type = searchForm.type; applied.status = searchForm.status; applied.businessScene = searchForm.businessScene; applied.pushStatus = searchForm.pushStatus }
function handleReset() { searchForm.name = ''; searchForm.type = undefined; searchForm.status = undefined; searchForm.businessScene = undefined; searchForm.pushStatus = undefined; handleSearch() }
function onSelectChange(keys: string[]) { selectedRowKeys.value = keys }
function goDetail(record: AlertItem) { router.push(`/management/exception/detail/${record.id}?source=${record.alarmSource}`) }
function jumpToSource(record: AlertItem) { if (record.sourceTask) router.push(`/management/task/detail/${record.sourceTask.toLowerCase()}?tab=evidence`) }
function openOperationModal(record: AlertItem) { selectedAlert.value = record; selectedOperation.value = 'internal_close'; handleFact.value = record.alertFact; handleReason.value = record.handlingReason; thirdPartyTicketNo.value = record.thirdPartyTicketNo || ''; handleVisible.value = true }
function submitHandle() {
  if (!selectedAlert.value || !handleFact.value.trim() || !handleReason.value.trim()) return message.error('请填写事实确认和处置理由')
  selectedAlert.value.alertFact = handleFact.value.trim()
  selectedAlert.value.handlingReason = handleReason.value.trim()
  if (selectedOperation.value === 'misjudged') selectedAlert.value.status = 'misjudged'
  if (selectedOperation.value === 'internal_close') selectedAlert.value.status = 'internal_closed'
  if (selectedOperation.value === 'third_party_hazard') selectedAlert.value.status = 'third_party_hazard'
  if (selectedOperation.value === 'third_party_rectify') selectedAlert.value.status = 'third_party_rectify'
  if (selectedOperation.value !== 'internal_close') selectedAlert.value.pushStatus = 'pending'
  if (selectedOperation.value !== 'internal_close') selectedAlert.value.thirdPartyTicketNo = thirdPartyTicketNo.value || selectedAlert.value.thirdPartyTicketNo
  handleVisible.value = false
  normalizeEntryNotice()
  message.success('处置已提交')
}
function batchInternalClose() { message.success('批量线下人工处置已提交') }
function batchThirdPartyRectify() { message.success('批量转第三方整改已提交') }

function showEntryNotifications() {
  entryNoticeVisible.value = pendingNoticeAlerts.value.length > 0
  normalizeEntryNotice()
}

function normalizeEntryNotice() {
  if (!pendingNoticeAlerts.value.length) {
    entryNoticeVisible.value = false
    currentNoticeIndex.value = 0
    return
  }
  if (currentNoticeIndex.value > pendingNoticeAlerts.value.length - 1) {
    currentNoticeIndex.value = pendingNoticeAlerts.value.length - 1
  }
}

function closeEntryNotice() {
  entryNoticeVisible.value = false
}

function switchNotice(offset: number) {
  const nextIndex = currentNoticeIndex.value + offset
  currentNoticeIndex.value = Math.min(Math.max(nextIndex, 0), pendingNoticeAlerts.value.length - 1)
}

function getTypeText(type: AlertType) { return ({ facility_component: '设施/巡检对象异常', gas: '气体异常', safety: '安全行为异常', monitor_failure: '监测失效', uninspectable: '不可检异常' } as Record<AlertType, string>)[type] }
function getTypeColor(type: AlertType) { return ({ facility_component: 'processing', gas: 'orange', safety: 'purple', monitor_failure: 'red', uninspectable: 'gold' } as Record<AlertType, string>)[type] }
function getSceneText(scene?: string) { return ({ daily_inspection: '日常巡检', hazard_screening: '临时补检', environment_check: '环境检查', operation_guard: '看护作业', work_ticket_guard: '作业票监护', emergency_arrival: '应急到场' } as Record<string, string>)[scene || ''] || '日常巡检' }
function getSceneColor(scene?: string) { return ({ daily_inspection: 'blue', hazard_screening: 'volcano', environment_check: 'green', operation_guard: 'purple', work_ticket_guard: 'gold', emergency_arrival: 'red' } as Record<string, string>)[scene || ''] || 'blue' }
function getStatusText(status: AlertStatus) { return ({ pending_confirm: '待确认', misjudged: '标记误判', internal_processing: '内部处理中', internal_closed: '线下人工已处置', third_party_hazard: '第三方隐患处理中', third_party_rectify: '第三方整改处理中', third_party_closed: '第三方已闭环' } as Record<AlertStatus, string>)[status] }
function getStatusColor(status: AlertStatus) { return ({ pending_confirm: 'red', misjudged: 'default', internal_processing: 'blue', internal_closed: 'green', third_party_hazard: 'volcano', third_party_rectify: 'orange', third_party_closed: 'green' } as Record<AlertStatus, string>)[status] }
function getPushText(status: PushStatus) { return ({ none: '未推送', pending: '待推送', success: '已推送', failed: '推送失败' } as Record<PushStatus, string>)[status] }
function getPushColor(status: PushStatus) { return ({ none: 'default', pending: 'blue', success: 'green', failed: 'red' } as Record<PushStatus, string>)[status] }
function getAlarmSourceText(source: AlarmSource) { return source === 'inspection' ? '巡检告警' : '实时告警' }

onMounted(() => {
  showEntryNotifications()
})

watch(pendingNoticeAlerts, normalizeEntryNotice)
</script>

<style scoped>
.exception-alert-page { width: 100%; }
.search-item { margin-bottom: 8px; }
.search-actions { display: flex; justify-content: flex-end; margin: 8px 4px 0; }
.thumb { width: 72px; height: 44px; object-fit: cover; border-radius: 6px; border: 1px solid #f0f0f0; }
.scene-switch {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: linear-gradient(180deg, #fcfcfd, #f8fafc);
}
.scene-switch__item {
  min-width: 108px;
  padding: 9px 14px;
  border: 1px solid #dbe2ea;
  border-radius: 999px;
  background: #fff;
  color: #475569;
  font-size: 13px;
  line-height: 1;
  cursor: pointer;
  transition: all 0.2s ease;
}
.scene-switch__item:hover {
  border-color: #94a3b8;
  color: #0f172a;
}
.scene-switch__item--active {
  border-color: #0f766e;
  background: #0f766e;
  color: #fff;
  box-shadow: 0 8px 16px -12px rgba(15, 118, 110, 0.9);
}

.entry-alert-panel {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 1000;
  width: min(438px, calc(100vw - 32px));
  overflow: hidden;
  border: 1px solid rgba(220, 38, 38, 0.18);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 18px 46px rgba(15, 23, 42, 0.18);
}
.entry-alert-panel__bar {
  height: 4px;
  background: linear-gradient(90deg, #dc2626, #f97316);
}
.entry-alert-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 16px 10px;
}
.entry-alert-panel__eyebrow {
  color: #b91c1c;
  font-size: 12px;
  font-weight: 600;
}
.entry-alert-panel__title {
  margin-top: 3px;
  color: #111827;
  font-size: 16px;
  font-weight: 700;
  line-height: 1.35;
}
.entry-alert-panel__close {
  width: 30px;
  height: 30px;
  border: 0;
  border-radius: 999px;
  background: #f3f4f6;
  color: #4b5563;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}
.entry-alert-panel__close:hover {
  background: #fee2e2;
  color: #b91c1c;
}
.entry-alert-panel__tags,
.entry-alert-panel__meta,
.entry-alert-panel__fact,
.entry-alert-panel__images,
.entry-alert-panel__footer,
.entry-alert-panel__pager {
  margin-inline: 16px;
}
.entry-alert-panel__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
}
.entry-alert-panel__meta {
  color: #6b7280;
  font-size: 12px;
}
.entry-alert-panel__fact {
  margin-top: 8px;
  color: #1f2937;
  font-size: 14px;
  line-height: 1.55;
}
.entry-alert-panel__images {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 12px;
}
.entry-alert-panel__image-card {
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f9fafb;
}
.entry-alert-panel__image-card img {
  display: block;
  width: 100%;
  height: 92px;
  object-fit: cover;
}
.entry-alert-panel__image-card span {
  display: block;
  padding: 6px 8px;
  color: #6b7280;
  font-size: 12px;
}
.entry-alert-panel__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 12px;
  color: #6b7280;
  font-size: 12px;
}
.entry-alert-panel__pager {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 14px;
  padding: 12px 0 14px;
  border-top: 1px solid #f1f5f9;
}
.entry-alert-panel__dots {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-inline: auto;
}
.entry-alert-panel__dots button {
  width: 7px;
  height: 7px;
  padding: 0;
  border: 0;
  border-radius: 999px;
  background: #cbd5e1;
  cursor: pointer;
}
.entry-alert-panel__dots button.active {
  width: 18px;
  background: #dc2626;
}
.entry-alert-panel__count {
  min-width: 42px;
  color: #64748b;
  font-size: 12px;
  text-align: right;
}
@media (max-width: 640px) {
  .entry-alert-panel {
    right: 16px;
    bottom: 16px;
  }
}
</style>
