<template>
  <div class="dispatch-center">
    <div class="page-header">
      <div>
        <h2>总调度台</h2>

      </div>
      <a-tag :color="control.mode === 'auto' ? 'purple' : 'blue'">{{ control.mode === 'auto' ? '自动调度' : '手动执行' }}</a-tag>
    </div>

    <DispatchControlBar
      :control="control"
      @update:control="onControlUpdate"
      @create-temporary="openTemporary()"
      @coverage-check="showCoverageCheck"
      @refresh="refreshData"
    />

    <DispatchSummaryCards :summary="summary" />

    <div class="content-layout">
      <div class="map-panel">
        <DispatchMapPanel :markers="visibleMapMarkers" @map-context-create="openTemporaryFromMap" />
      </div>
      <div class="left-side">
        <DispatchBoardColumns
          :running-tasks="runningTasks"
          :pending-tasks="pendingTasks"
          :pending-process-tasks="pendingProcessTasks"
          :records="records"
          :mode="control.mode"
          @task-action="handleTaskAction"
        />
      </div>
    </div>

    <TemporaryDispatchModal
      v-model:visible="temporaryVisible"
      :running-task-exists="runningTasks.length > 0"
      :robot-options="robotOptions"
      :inspection-point-options="inspectionPointOptions"
      :charging-point-options="chargingPointOptions"
      :parking-point-options="parkingPointOptions"
      :task-candidates="conflictCandidates"
      :prefill="temporaryPrefill"
      @submit="submitTemporaryDispatch"
    />

    <a-modal v-model:open="coverageVisible" title="检测覆盖检查" width="920px" :footer="null">
      <a-alert
        :type="coverageResult.hasMissing ? 'warning' : 'success'"
        show-icon
        style="margin-bottom: 12px"
        :message="coverageResult.hasMissing ? '当前巡检体系存在遗漏，可自动补充或人工创建补充任务。' : '当前巡检体系覆盖完整。'"
      />
      <a-descriptions bordered :column="2" size="small" style="margin-bottom: 12px">
        <a-descriptions-item label="当前时间范围">{{ summary.timeRange }}</a-descriptions-item>
        <a-descriptions-item label="检测结果">{{ coverageResult.hasMissing ? '存在遗漏' : '覆盖正常' }}</a-descriptions-item>
        <a-descriptions-item label="遗漏巡检点">{{ coverageResult.missingPoints.length }}</a-descriptions-item>
        <a-descriptions-item label="遗漏检测项">{{ coverageResult.missingItems.length }}</a-descriptions-item>
        <a-descriptions-item label="遗漏设备">{{ coverageResult.missingDevices.length }}</a-descriptions-item>
        <a-descriptions-item label="待人工确认">{{ coverageResult.pendingManual.length }}</a-descriptions-item>
      </a-descriptions>

      <a-row :gutter="12">
        <a-col :span="8">
          <a-card size="small" title="遗漏巡检点">
            <a-empty v-if="coverageResult.missingPoints.length === 0" description="无" />
            <a-tag v-for="item in coverageResult.missingPoints" :key="item" style="margin-bottom: 8px">{{ item }}</a-tag>
          </a-card>
        </a-col>
        <a-col :span="8">
          <a-card size="small" title="遗漏检测项">
            <a-empty v-if="coverageResult.missingItems.length === 0" description="无" />
            <a-tag v-for="item in coverageResult.missingItems" :key="item" color="orange" style="margin-bottom: 8px">{{ item }}</a-tag>
          </a-card>
        </a-col>
        <a-col :span="8">
          <a-card size="small" title="遗漏设备">
            <a-empty v-if="coverageResult.missingDevices.length === 0" description="无" />
            <a-tag v-for="item in coverageResult.missingDevices" :key="item" color="red" style="margin-bottom: 8px">{{ item }}</a-tag>
          </a-card>
        </a-col>
      </a-row>

      <a-card size="small" title="待人工确认项" style="margin-top: 12px">
        <a-empty v-if="coverageResult.pendingManual.length === 0" description="无待人工确认项" />
        <a-table v-else :columns="manualColumns" :data-source="coverageResult.pendingManual" row-key="id" size="small" :pagination="false" />
      </a-card>

      <div class="modal-actions">
        <a-space>
          <a-button @click="coverageVisible = false">关闭</a-button>
          <a-button :disabled="!coverageResult.hasMissing" @click="manualSupplementCoverage">人工补充任务</a-button>
          <a-button type="primary" :disabled="!coverageResult.hasMissing" @click="autoSupplementCoverage">一键自动补充</a-button>
        </a-space>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import DispatchControlBar from './dispatch-center/DispatchControlBar.vue'
import DispatchSummaryCards from './dispatch-center/DispatchSummaryCards.vue'
import DispatchBoardColumns from './dispatch-center/DispatchBoardColumns.vue'
import DispatchMapPanel from './dispatch-center/DispatchMapPanel.vue'
import TemporaryDispatchModal from './dispatch-center/TemporaryDispatchModal.vue'
import type { DispatchControlState } from './dispatch-center/DispatchControlBar.vue'
import type { DispatchSummary } from './dispatch-center/DispatchSummaryCards.vue'
import type { DispatchTask, DispatchRecordItem } from './dispatch-center/DispatchBoardColumns.vue'
import type { MapMarker } from './dispatch-center/DispatchMapPanel.vue'
import type { TemporaryDispatchForm, ConflictTaskItem } from './dispatch-center/TemporaryDispatchModal.vue'

interface RobotState { id: string; name: string; status: 'idle' | 'running' | 'charging' }
interface PendingManualItem { id: string; name: string; type: string; suggestion: string }

const control = reactive<DispatchControlState>({ autoDispatchEnabled: true, allowAutoCreate: true, allowQueueJump: true, mode: 'auto', pointKeyword: '' })
const temporaryVisible = ref(false)
const temporaryPrefill = ref<Partial<TemporaryDispatchForm>>({})
const coverageVisible = ref(false)
const coverageResult = reactive<{ hasMissing: boolean; missingPoints: string[]; missingItems: string[]; missingDevices: string[]; pendingManual: PendingManualItem[] }>({
  hasMissing: true,
  missingPoints: ['巡检点-B05'],
  missingItems: ['温度表计识别', '风机振动读数'],
  missingDevices: ['配电柜A15'],
  pendingManual: [
    { id: 'manual-1', name: '危化区临时复检', type: '临时任务', suggestion: '建议人工确认后插入执行队列' },
    { id: 'manual-2', name: '办公区计划顺延', type: '计划任务', suggestion: '建议延后执行并通知值班长' }
  ]
})
const manualColumns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
  { title: '建议', dataIndex: 'suggestion', key: 'suggestion' }
]

const robots = ref<RobotState[]>([
  { id: 'robot-001', name: '机器人A001', status: 'running' },
  { id: 'robot-002', name: '机器人A002', status: 'running' },
  { id: 'robot-003', name: '机器人A003', status: 'idle' },
  { id: 'robot-004', name: '机器人A004', status: 'charging' }
])

const tasks = ref<DispatchTask[]>([
  { id: 'task-001', name: '计划巡检-变电站A区', type: 'plan', typeLabel: '计划任务', status: 'running', robotName: '机器人A001', priority: 'high', priorityLabel: '高', createdAt: '09:00', startedAt: '09:10', progressPercent: 75, doneCount: 9, totalCount: 12, etaTime: '12:30', changeFlag: true, changeReason: '因临时高优任务自动重排后改派至 A001' },
  { id: 'task-002', name: '计划巡检-办公区', type: 'plan', typeLabel: '计划任务', status: 'pending', robotName: '机器人A003', priority: 'medium', priorityLabel: '中', createdAt: '09:30', scheduledAt: '13:00', queueOrder: 1 },
  { id: 'task-003', name: '临时巡检-危化区', type: 'temp', typeLabel: '临时任务', status: 'pending', robotName: '机器人A002', priority: 'high', priorityLabel: '高', createdAt: '10:15', scheduledAt: '12:20', queueOrder: 2, changeFlag: true, changeReason: '人工插入后重排至第 2 位' },
  { id: 'task-004', name: '自动调度-配电柜A15', type: 'auto', typeLabel: '自动调度', status: 'auto_pending', robotName: '机器人A004', priority: 'high', priorityLabel: '高', createdAt: '10:45', reason: '漏检补偿', affectedTaskName: '计划巡检-办公区' }
])

const records = ref<DispatchRecordItem[]>([
  { id: 'record-001', time: '10:45', event: '自动调度生成漏检补偿任务：配电柜A15', taskName: '自动调度-配电柜A15', resultStatus: 'pending', source: 'auto' },
  { id: 'record-002', time: '10:20', event: '人工创建临时任务：危化区抽检', taskName: '临时巡检-危化区', resultStatus: 'running', source: 'temp' },
  { id: 'record-003', time: '10:05', event: '任务重排：办公区任务顺延执行', taskName: '计划巡检-办公区', resultStatus: 'done', source: 'manual' }
])

const mapMarkers = ref<MapMarker[]>([
  { id: 'm-r1', label: '机器人001', markerType: 'robot', x: 34, y: 22, status: 'running', speedKmh: 6.8, taskShortName: '变电站A区', relatedRobotId: 'robot-001' },
  { id: 'm-r2', label: '机器人002', markerType: 'robot', x: 18, y: 49, status: 'charging', speedKmh: 0, taskShortName: '回充中', relatedRobotId: 'robot-002' },
  { id: 'p-i1', label: '巡检点-A12', markerType: 'inspection', x: 35, y: 29, todayPlannedCount: 8, inspectedCount: 6, status: 'running' },
  { id: 'p-i2', label: '巡检点-B05', markerType: 'inspection', x: 25, y: 64, todayPlannedCount: 5, inspectedCount: 2, status: 'pending' },
  { id: 'p-c1', label: '充电站-C1', markerType: 'charging', x: 78, y: 18, chargingCount: 2, parkedCount: 1, status: 'charging' },
  { id: 'p-p1', label: '停车点-P1', markerType: 'parking', x: 12, y: 82, parkedCount: 3, status: 'idle' }
])

const visibleMapMarkers = computed(() => {
  const keyword = control.pointKeyword.trim().toLowerCase()
  if (!keyword) return mapMarkers.value
  return mapMarkers.value.filter((marker) => marker.markerType !== 'inspection' || marker.label.toLowerCase().includes(keyword))
})
const runningTasks = computed(() => tasks.value.filter((task) => task.status === 'running'))
const pendingTasks = computed(() => tasks.value.filter((task) => task.status === 'pending').sort((a, b) => (a.queueOrder || 99) - (b.queueOrder || 99)))
const pendingProcessTasks = computed(() => tasks.value.filter((task) => task.status === 'auto_pending' || task.status === 'conflict'))
const robotOptions = computed(() => robots.value.map((robot) => ({ value: robot.id, label: robot.name })))
const inspectionPointOptions = computed(() => mapMarkers.value.filter((m) => m.markerType === 'inspection').map((m) => ({ value: m.id, label: m.label })))
const chargingPointOptions = computed(() => mapMarkers.value.filter((m) => m.markerType === 'charging').map((m) => ({ value: m.id, label: m.label })))
const parkingPointOptions = computed(() => mapMarkers.value.filter((m) => m.markerType === 'parking').map((m) => ({ value: m.id, label: m.label })))
const conflictCandidates = computed<ConflictTaskItem[]>(() => [...runningTasks.value, ...pendingTasks.value].map((task) => ({ id: task.id, name: task.name, robotId: robotOptions.value.find((item) => item.label === task.robotName)?.value || task.robotName, robotName: task.robotName, scheduledAt: task.scheduledAt || task.startedAt || '-', status: task.status === 'running' ? 'running' : 'pending', typeLabel: task.typeLabel })))

const summary = computed<DispatchSummary>(() => ({
  timeRange: control.pointKeyword ? `今日 / 15:42:02 / 关键字：${control.pointKeyword}` : '今日 / 15:42:02',
  task: { total: tasks.value.length, running: runningTasks.value.length, pending: pendingTasks.value.length, processing: pendingProcessTasks.value.length },
  plan: { total: 18, manual: 6, auto: 12 },
  temporary: { total: tasks.value.filter((task) => task.type === 'temp').length, pending: pendingProcessTasks.value.length, dispatched: tasks.value.filter((task) => task.type === 'temp' && task.status !== 'auto_pending').length }
}))

function onControlUpdate(value: DispatchControlState) {
  const prevMode = control.mode
  Object.assign(control, value)
  if (prevMode !== value.mode) message.success(`已切换为${control.mode === 'auto' ? '自动调度' : '手动执行'}模式`)
}
function openTemporary() { temporaryPrefill.value = {}; temporaryVisible.value = true }
function openTemporaryFromMap(payload: any) {
  const marker = payload?.marker
  const markerType = marker?.markerType || 'inspection'
  const markerId = marker?.id || ''
  temporaryPrefill.value = {
    taskType: markerType === 'inspection' ? 'inspection' : markerType === 'charging' ? 'charging' : 'parking',
    targetPointId: markerId,
    targetPointIds: markerType === 'inspection' && markerId ? [markerId] : [],
    name: marker ? `临时任务-${marker.label}` : '临时任务'
  }
  temporaryVisible.value = true
}
function refreshData() { message.success('调度数据已刷新') }
function showCoverageCheck() { coverageVisible.value = true }
function handleTaskAction(payload: { type: string; task: DispatchTask }) { message.info(`已触发操作：${payload.type} / ${payload.task.name}`) }
function autoSupplementCoverage() {
  const taskName = `自动补充-${coverageResult.missingDevices[0] || coverageResult.missingPoints[0] || '漏检任务'}`
  tasks.value.unshift({
    id: `auto-${Date.now()}`,
    name: taskName,
    type: 'auto',
    typeLabel: '自动调度',
    status: 'auto_pending',
    robotName: '机器人A003',
    priority: 'high',
    priorityLabel: '高',
    createdAt: new Date().toLocaleTimeString(),
    reason: '覆盖检查自动补充',
    affectedTaskName: pendingTasks.value[0]?.name
  })
  records.value.unshift({ id: `record-${Date.now()}`, time: new Date().toLocaleTimeString(), event: `覆盖检查自动补充：${taskName}`, taskName, resultStatus: 'pending', source: 'auto' })
  coverageResult.hasMissing = false
  coverageResult.missingPoints = []
  coverageResult.missingItems = []
  coverageResult.missingDevices = []
  message.success('已自动补充调度任务')
}
function manualSupplementCoverage() {
  const firstPoint = inspectionPointOptions.value[0]?.value
  temporaryPrefill.value = {
    name: '人工补充任务',
    taskType: 'inspection',
    targetPointIds: firstPoint ? [firstPoint] : [],
    reason: '覆盖检查发现遗漏，需人工补充'
  }
  coverageVisible.value = false
  temporaryVisible.value = true
  message.info('已打开手动创建任务弹窗，可补充遗漏任务')
}
function submitTemporaryDispatch(form: TemporaryDispatchForm) {
  const matchedRobot = robotOptions.value.find((item) => item.value === form.robotId)
  const impacted = conflictCandidates.value.filter((item) => item.robotId === form.robotId).map((item) => item.name)
  const hasConflict = Boolean(impacted.length)
  tasks.value.unshift({
    id: `temp-${Date.now()}`,
    name: form.name,
    type: 'temp',
    typeLabel: '临时任务',
    status: hasConflict ? 'auto_pending' : (control.mode === 'auto' ? 'pending' : 'pending'),
    robotName: matchedRobot?.label || form.robotId,
    priority: 'high',
    priorityLabel: '高',
    createdAt: new Date().toLocaleTimeString(),
    scheduledAt: form.scheduledAt,
    reason: form.reason,
    affectedTaskName: impacted[0],
    changeFlag: hasConflict,
    changeReason: hasConflict ? `冲突处理：${form.conflictStrategy === 'delay' ? '延后执行' : '暂停执行'}；受影响任务 ${impacted.join('、')}` : undefined
  })
  records.value.unshift({ id: `record-${Date.now()}`, time: new Date().toLocaleTimeString(), event: `人工创建临时任务：${form.name}`, taskName: form.name, resultStatus: hasConflict ? 'pending' : 'running', source: 'temp' })
  temporaryVisible.value = false
  message.success('临时任务已创建')
}
</script>

<style scoped lang="css">.dispatch-center {
  width: 100%;
}
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.page-header h2 {
  margin: 0;
}
.header-sub {
  margin: 4px 0 0;
  color: #666;
  font-size: 13px;
}
.content-layout {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 12px;
  align-items: start;
}
.map-panel {
  min-width: 0;
}
.left-side {
  min-width: 0;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
@media (max-width: 1200px) {
  .content-layout {
    grid-template-columns: 1fr;
  }
}
</style>
