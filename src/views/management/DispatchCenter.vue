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
      :robot-options="robotOptions"
      @update:control="onControlUpdate"
      @create-temporary="openTemporary()"
      @coverage-check="showCoverageCheck"
      @refresh="refreshData"
    />

    <DispatchSummaryCards :summary="summary" :active-filter="activeSummaryFilter" @filter="handleSummaryFilter" />
    <div class="scope-bar">
      当前统计范围：{{ currentScopeText }}
      <a-button v-if="activeSummaryFilter" type="link" size="small" @click="activeSummaryFilter = ''">清除列表过滤</a-button>
    </div>

    <div class="content-layout">
      <div class="map-panel">
        <DispatchMapPanel :markers="visibleMapMarkers" @map-context-create="openTemporaryFromMap" />
      </div>
      <div class="left-side">
        <DispatchBoardColumns
          :running-tasks="runningTasks"
          :pending-tasks="pendingTasks"
          :pending-process-tasks="pendingProcessTasks"
          :temporary-tasks="temporaryTasks"
          :records="records"
          :mode="control.mode"
          :active-filter="activeSummaryFilter"
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

    <a-modal
      v-model:open="coverageVisible"
      title="覆盖检查"
      width="min(1320px, 94vw)"
      :footer="null"
      wrap-class-name="coverage-check-modal"
    >
      <a-alert
        :type="coverageResult.hasMissing ? 'warning' : 'success'"
        show-icon
        style="margin-bottom: 12px"
        :message="coverageResult.hasMissing ? '当前调度范围存在未覆盖对象或待人工确认项，可补充任务或人工确认。' : '当前调度范围覆盖完整。'"
      />
      <a-descriptions bordered :column="2" size="small" style="margin-bottom: 12px">
        <a-descriptions-item label="当前时间范围">{{ summary.timeRange }}</a-descriptions-item>
        <a-descriptions-item label="检测结果">{{ coverageResult.hasMissing ? '存在遗漏' : '覆盖正常' }}</a-descriptions-item>
        <a-descriptions-item label="遗漏区域">{{ coverageResult.missingRegions.length }}</a-descriptions-item>
        <a-descriptions-item label="遗漏设施">{{ coverageResult.missingDevices.length }}</a-descriptions-item>
        <a-descriptions-item label="遗漏部件/连接">{{ coverageResult.missingSubjects.length }}</a-descriptions-item>
        <a-descriptions-item label="遗漏巡检规则">{{ coverageResult.missingRules.length }}</a-descriptions-item>
        <a-descriptions-item label="待人工确认">{{ coverageResult.pendingManual.length }}</a-descriptions-item>
      </a-descriptions>

      <a-row :gutter="[16, 16]" class="coverage-card-grid">
        <a-col :xs="24" :lg="12" :xl="6">
          <a-card size="small" title="遗漏区域">
            <a-empty v-if="coverageResult.missingRegions.length === 0" description="无遗漏区域" />
            <div v-for="item in coverageResult.missingRegions" :key="item.regionId" class="coverage-missing-item">
              <div class="coverage-title">{{ item.regionName }}</div>
              <div class="coverage-meta">所属任务：{{ item.taskName }}（{{ item.taskNo }}）</div>
              <div class="coverage-meta">所属规划：{{ item.planName }}</div>
              <a-space size="small" style="margin-top: 6px">
                <a-button size="small" type="link" @click="goTask(item.taskId)">任务</a-button>
                <a-button size="small" type="link" @click="goPlan(item.planId)">规划</a-button>
              </a-space>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="12" :xl="6">
          <a-card size="small" title="遗漏设施">
            <a-empty v-if="coverageResult.missingDevices.length === 0" description="无遗漏设施" />
            <div v-for="item in coverageResult.missingDevices" :key="item.deviceId" class="coverage-missing-item danger">
              <div class="coverage-title">{{ item.deviceName }}</div>
              <div class="coverage-meta">所属区域：{{ item.regionName }}</div>
              <div class="coverage-meta">所属任务：{{ item.taskName }}（{{ item.taskNo }}）</div>
              <div class="coverage-meta">所属规划：{{ item.planName }}</div>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="12" :xl="6">
          <a-card size="small" title="遗漏部件/连接">
            <a-empty v-if="coverageResult.missingSubjects.length === 0" description="无遗漏部件/连接" />
            <div v-for="item in coverageResult.missingSubjects" :key="item.subjectId" class="coverage-missing-item warning">
              <div class="coverage-title">{{ item.subjectName }}</div>
              <div class="coverage-meta">{{ item.regionName }} / {{ item.deviceName }} / {{ item.subjectType }}</div>
              <div class="coverage-meta">所属任务：{{ item.taskName }}（{{ item.taskNo }}）</div>
              <div class="coverage-meta">所属规划：{{ item.planName }}</div>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="12" :xl="6">
          <a-card size="small" title="遗漏巡检规则">
            <a-empty v-if="coverageResult.missingRules.length === 0" description="无遗漏巡检规则" />
            <div v-for="item in coverageResult.missingRules" :key="item.id" class="coverage-missing-item warning">
              <div class="coverage-title">{{ item.ruleName }}</div>
              <div class="coverage-meta">{{ item.regionName }} / {{ item.deviceName }} / {{ item.subjectName }}</div>
              <div class="coverage-meta">所属任务：{{ item.taskName }}（{{ item.taskNo }}）</div>
              <div class="coverage-meta">所属规划：{{ item.planName }}</div>
            </div>
          </a-card>
        </a-col>
      </a-row>

      <a-card size="small" title="待人工确认项" style="margin-top: 12px">
        <a-empty v-if="coverageResult.pendingManual.length === 0" description="无待人工确认项" />
        <a-table v-else :columns="manualColumns" :data-source="coverageResult.pendingManual" row-key="id" size="small" :pagination="false" :scroll="{ x: 1180 }">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'manualStatus'">
              <a-tag :color="getManualStatusColor(record.manualStatus)">{{ getManualStatusText(record.manualStatus) }}</a-tag>
            </template>
            <template v-else-if="column.key === 'riskLevel'">
              <a-tag :color="getRiskColor(record.riskLevel)">{{ getRiskText(record.riskLevel) }}</a-tag>
            </template>
            <template v-else-if="column.key === 'assignedRobot'">
              {{ record.assignedRobotName || '-' }}
            </template>
            <template v-else-if="column.key === 'actions'">
              <a-space>
                <a-button size="small" @click="openReplaceRobot(record)" :disabled="record.manualStatus === 'resolved'">替换机器人</a-button>
                <a-button size="small" type="primary" ghost @click="autoAdjustPendingManual(record)" :disabled="record.manualStatus === 'resolved'">自动调整</a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>

      <div class="modal-actions">
        <a-space>
          <a-button @click="coverageVisible = false">关闭</a-button>
          <a-button :disabled="!coverageResult.hasMissing" @click="manualSupplementCoverage">人工补充任务</a-button>
          <a-button type="primary" :disabled="!coverageResult.hasMissing" @click="autoSupplementCoverage">一键自动补充</a-button>
        </a-space>
      </div>
    </a-modal>

    <a-modal
      v-model:open="cancelVisible"
      title="取消任务"
      ok-text="确认取消"
      cancel-text="返回"
      :ok-button-props="{ disabled: !cancelReason.trim() }"
      @ok="confirmCancelTask"
    >
      <a-alert type="warning" show-icon style="margin-bottom: 12px" :message="`取消任务：${cancelTarget?.name || '-'}`" />
      <a-form layout="vertical">
        <a-form-item label="取消原因" required>
          <a-textarea v-model:value="cancelReason" :rows="4" placeholder="请填写取消原因，作为人工确认不再补检的依据" />
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal
      v-model:open="supplementLevelVisible"
      title="人工补充任务"
      ok-text="继续创建"
      cancel-text="取消"
      @ok="confirmManualSupplementCoverage"
    >
      <a-alert type="info" show-icon style="margin-bottom: 12px" message="重复漏检或长期缺失请选择巡检规划；单次缺失、补检、临时处置请选择临时任务。" />
      <a-radio-group v-model:value="manualHandlingLevel">
        <a-radio value="temporary">临时任务</a-radio>
        <a-radio value="plan">巡检规划</a-radio>
      </a-radio-group>
    </a-modal>

    <a-modal
      v-model:open="replaceRobotVisible"
      title="替换机器人"
      ok-text="确认替换"
      cancel-text="取消"
      :ok-button-props="{ disabled: !selectedRobotId }"
      @ok="confirmReplaceRobot"
    >
      <a-alert
        show-icon
        type="info"
        style="margin-bottom: 12px"
        :message="`待处理项：${replaceTarget?.name || '-'}（${replaceTarget?.type || '-'}）`"
      />
      <a-select
        v-model:value="selectedRobotId"
        style="width: 100%"
        placeholder="请选择执行机器人"
        :options="replaceRobotOptions"
      />
      <div style="margin-top: 8px; color: #666; font-size: 12px">
        系统按“空闲优先、负载优先”推荐，默认选择推荐机器人。
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
import type { DispatchSummary, SummaryFilter } from './dispatch-center/DispatchSummaryCards.vue'
import type { DispatchTask, DispatchRecordItem } from './dispatch-center/DispatchBoardColumns.vue'
import type { MapMarker } from './dispatch-center/DispatchMapPanel.vue'
import type { TemporaryDispatchForm, ConflictTaskItem } from './dispatch-center/TemporaryDispatchModal.vue'

interface RobotState { id: string; name: string; status: 'idle' | 'running' | 'charging'; dailyCapacity: number }
type PendingManualStatus = 'pending' | 'processing' | 'resolved'
interface PendingManualItem {
  id: string
  name: string
  type: string
  suggestion: string
  suggestedAction: string
  affectedTaskName: string
  riskLevel: string
  assignedRobotId?: string
  assignedRobotName?: string
  manualStatus: PendingManualStatus
}
interface CoverageLinkMeta { taskId: string; taskName: string; taskNo: string; planId: string; planName: string }
interface MissingRegionItem extends CoverageLinkMeta { regionId: string; regionName: string }
interface MissingDeviceItem extends CoverageLinkMeta { deviceId: string; deviceName: string; regionName: string }
interface MissingSubjectItem extends CoverageLinkMeta { subjectId: string; subjectName: string; subjectType: string; deviceName: string; regionName: string }
interface MissingRuleItem extends CoverageLinkMeta { id: string; ruleName: string; subjectName: string; deviceName: string; regionName: string }

const control = reactive<DispatchControlState>({ autoDispatchEnabled: true, allowAutoCreate: true, allowQueueJump: true, mode: 'auto', pointKeyword: '', robotId: '' })
const activeSummaryFilter = ref<SummaryFilter | ''>('')
const temporaryVisible = ref(false)
const temporaryPrefill = ref<Partial<TemporaryDispatchForm>>({})
const supplementLevelVisible = ref(false)
const manualHandlingLevel = ref<'temporary' | 'plan'>('temporary')
const cancelVisible = ref(false)
const cancelTarget = ref<DispatchTask | null>(null)
const cancelReason = ref('')
const coverageVisible = ref(false)
const coverageResult = reactive<{
  hasMissing: boolean
  missingRegions: MissingRegionItem[]
  missingDevices: MissingDeviceItem[]
  missingSubjects: MissingSubjectItem[]
  missingRules: MissingRuleItem[]
  pendingManual: PendingManualItem[]
}>({
  hasMissing: true,
  missingRegions: [
    { regionId: 'region-b', regionName: '二期装置区 / B区', taskId: 'task-002', taskName: '作业监护-办公区', taskNo: 'TASK-20260512-002', planId: 'plan-002', planName: '今日执行规划-办公区' }
  ],
  missingDevices: [
    { deviceId: 'device-a15', deviceName: '配电柜A15', regionName: '一期装置区 / A区', taskId: 'task-004', taskName: '自动补检-配电柜A15', taskNo: 'TASK-20260512-004', planId: 'plan-004', planName: '配电柜补检规划' }
  ],
  missingSubjects: [
    { subjectId: 'subject-valve-01', subjectName: '入口阀门', subjectType: '部件', deviceName: '1号循环泵', regionName: '一期装置区 / A区', taskId: 'task-001', taskName: '日常巡检-变电站A区', taskNo: 'TASK-20260512-001', planId: 'plan-001', planName: 'A区日常巡检规划' },
    { subjectId: 'subject-flange-02', subjectName: '出口法兰连接处', subjectType: '连接', deviceName: '2号反应釜', regionName: '二期装置区 / B区', taskId: 'task-002', taskName: '作业监护-办公区', taskNo: 'TASK-20260512-002', planId: 'plan-002', planName: '今日执行规划-办公区' }
  ],
  missingRules: [
    { id: 'rule-missing-1', ruleName: '未配置阀门开闭识别规则', subjectName: '入口阀门', deviceName: '1号循环泵', regionName: '一期装置区 / A区', taskId: 'task-001', taskName: '日常巡检-变电站A区', taskNo: 'TASK-20260512-001', planId: 'plan-001', planName: 'A区日常巡检规划' },
    { id: 'rule-missing-2', ruleName: '未配置红外温升检测规则', subjectName: '电机轴承', deviceName: '风机F02', regionName: '公用工程区 / C区', taskId: 'task-004', taskName: '自动补检-配电柜A15', taskNo: 'TASK-20260512-004', planId: 'plan-004', planName: '配电柜补检规划' }
  ],
  pendingManual: [
    { id: 'manual-1', name: '危化区临时复检', type: '补检任务', suggestion: '建议人工确认后插入执行队列', suggestedAction: '插单', affectedTaskName: '日常巡检-危化区', riskLevel: 'critical_alarm', manualStatus: 'pending' },
    { id: 'manual-2', name: '办公区计划顺延', type: '计划任务', suggestion: '建议延后执行并通知值班长', suggestedAction: '顺延', affectedTaskName: '作业监护-办公区', riskLevel: 'warning', manualStatus: 'pending' }
  ]
})
const manualColumns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '类型', dataIndex: 'type', key: 'type', width: 120 },
  { title: '建议动作', dataIndex: 'suggestedAction', key: 'suggestedAction', width: 100 },
  { title: '影响任务', dataIndex: 'affectedTaskName', key: 'affectedTaskName', width: 160 },
  { title: '风险等级', dataIndex: 'riskLevel', key: 'riskLevel', width: 120 },
  { title: '建议', dataIndex: 'suggestion', key: 'suggestion' },
  { title: '执行机器人', key: 'assignedRobot', width: 140 },
  { title: '处理状态', key: 'manualStatus', width: 120 },
  { title: '操作', key: 'actions', width: 220 }
]
const replaceRobotVisible = ref(false)
const replaceTarget = ref<PendingManualItem | null>(null)
const selectedRobotId = ref<string>()

const robots = ref<RobotState[]>([
  { id: 'robot-001', name: '机器人A001', status: 'running', dailyCapacity: 8 },
  { id: 'robot-002', name: '机器人A002', status: 'running', dailyCapacity: 7 },
  { id: 'robot-003', name: '机器人A003', status: 'running', dailyCapacity: 6 },
  { id: 'robot-004', name: '机器人A004', status: 'idle', dailyCapacity: 8 },
  { id: 'robot-005', name: '系统调度分配', status: 'running', dailyCapacity: 10 }
])

const tasks = ref<DispatchTask[]>([
  { id: 'task-001', name: '日常巡检-变电站A区', type: 'plan', typeLabel: '执行规划生成', businessScene: 'daily_inspection', riskLevel: 'normal', suggestedAction: '排队', constraintSummary: '电量82% / 区域可进入 / 作业窗口正常', status: 'running', robotName: '机器人A001', priority: 'high', priorityLabel: '高', createdAt: '09:00', startedAt: '09:10', progressPercent: 75, doneCount: 9, totalCount: 12, etaTime: '12:30', changeFlag: true, changeReason: '因临时高优任务自动重排后改派至 A001' },
  { id: 'task-002', name: '作业监护-办公区', type: 'plan', typeLabel: '执行规划生成', businessScene: 'operation_guard', riskLevel: 'warning', suggestedAction: '顺延', constraintSummary: '机器人适配 / 作业窗口13:00-15:00', status: 'pending', robotName: '机器人A003', priority: 'medium', priorityLabel: '中', createdAt: '09:30', scheduledAt: '13:00', queueOrder: 1 },
  { id: 'task-003', name: '隐患排查-危化区', type: 'temp', typeLabel: '总调度台插单', businessScene: 'hazard_screening', riskLevel: 'critical_alarm', suggestedAction: '插单', constraintSummary: '电量64% / 危化区允许进入 / 需人工确认', status: 'pending', robotName: '机器人A002', priority: 'high', priorityLabel: '高', createdAt: '10:15', scheduledAt: '12:20', queueOrder: 2, changeFlag: true, changeReason: '人工插入后重排至第 2 位' },
  { id: 'task-004', name: '自动补检-配电柜A15', type: 'auto', typeLabel: '自动补检', businessScene: 'recheck', riskLevel: 'alarm', suggestedAction: '补检', dispatchReason: '漏检补偿', constraintSummary: '机器人充电中 / 建议替换机器人', status: 'auto_pending', robotName: '机器人A004', priority: 'high', priorityLabel: '高', createdAt: '10:45', reason: '漏检补偿', affectedTaskName: '作业监护-办公区' }
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
  const robotId = control.robotId
  return mapMarkers.value.filter((marker) => {
    const matchesKeyword = !keyword || marker.markerType !== 'inspection' || marker.label.toLowerCase().includes(keyword)
    const matchesRobot = !robotId || marker.relatedRobotId === robotId || marker.markerType !== 'robot'
    return matchesKeyword && matchesRobot
  })
})
const scopedTasks = computed(() => {
  if (!control.robotId) return tasks.value
  const robot = robots.value.find(item => item.id === control.robotId)
  if (!robot) return tasks.value
  return tasks.value.filter(task => task.robotName === robot.name)
})
const runningTasks = computed(() => filterTasks(scopedTasks.value.filter((task) => task.status === 'running'), 'running'))
const pendingTasks = computed(() => filterTasks(scopedTasks.value.filter((task) => task.status === 'pending').sort((a, b) => (a.queueOrder || 99) - (b.queueOrder || 99)), 'pending'))
const pendingProcessTasks = computed(() => filterTasks(scopedTasks.value.filter((task) => task.status === 'auto_pending' || task.status === 'conflict'), 'processing'))
const temporaryTasks = computed(() => filterTasks(scopedTasks.value.filter(task => task.type === 'temp'), 'temporary'))
const robotOptions = computed(() => robots.value.map((robot) => ({ value: robot.id, label: robot.name })))
const inspectionPointOptions = computed(() => mapMarkers.value.filter((m) => m.markerType === 'inspection').map((m) => ({ value: m.id, label: m.label })))
const chargingPointOptions = computed(() => mapMarkers.value.filter((m) => m.markerType === 'charging').map((m) => ({ value: m.id, label: m.label })))
const parkingPointOptions = computed(() => mapMarkers.value.filter((m) => m.markerType === 'parking').map((m) => ({ value: m.id, label: m.label })))
const conflictCandidates = computed<ConflictTaskItem[]>(() => [...runningTasks.value, ...pendingTasks.value].map((task) => ({ id: task.id, name: task.name, robotId: robotOptions.value.find((item) => item.label === task.robotName)?.value || task.robotName, robotName: task.robotName, scheduledAt: task.scheduledAt || task.startedAt || '-', status: task.status === 'running' ? 'running' : 'pending', typeLabel: task.typeLabel })))
const robotLoadMap = computed(() => {
  const map = new Map<string, number>()
  scopedTasks.value.forEach((task) => {
    if (!['running', 'pending', 'auto_pending', 'conflict'].includes(task.status)) return
    const robot = robots.value.find((item) => item.name === task.robotName)
    if (!robot) return
    map.set(robot.id, (map.get(robot.id) || 0) + 1)
  })
  return map
})
const replaceRobotOptions = computed(() => {
  const score = (status: RobotState['status']) => (status === 'idle' ? 0 : status === 'charging' ? 1 : 2)
  return [...robots.value]
    .sort((a, b) => {
      const sa = score(a.status)
      const sb = score(b.status)
      if (sa !== sb) return sa - sb
      return (robotLoadMap.value.get(a.id) || 0) - (robotLoadMap.value.get(b.id) || 0)
    })
    .map((robot) => ({
      value: robot.id,
      label: `${robot.name}（${getRobotStatusText(robot.status)} / 负载${robotLoadMap.value.get(robot.id) || 0}/${robot.dailyCapacity}）`
    }))
})
const recommendedRobotId = computed(() => replaceRobotOptions.value[0]?.value as string | undefined)

const summary = computed<DispatchSummary>(() => ({
  timeRange: currentScopeText.value,
  task: {
    total: scopedTasks.value.length,
    running: scopedTasks.value.filter(task => task.status === 'running').length,
    pending: scopedTasks.value.filter(task => task.status === 'pending').length,
    processing: scopedTasks.value.filter(task => task.status === 'auto_pending' || task.status === 'conflict').length
  },
  plan: { total: 18, manual: 6, auto: 12 },
  temporary: { total: scopedTasks.value.filter((task) => task.type === 'temp').length, pending: scopedTasks.value.filter((task) => task.type === 'temp' && task.status === 'auto_pending').length, dispatched: scopedTasks.value.filter((task) => task.type === 'temp' && task.status !== 'auto_pending').length }
}))

const currentScopeText = computed(() => {
  const robot = robots.value.find(item => item.id === control.robotId)
  const scope = robot ? `${robot.name}今日任务` : '所有机器人今日任务'
  return control.pointKeyword ? `${scope} / 关键字：${control.pointKeyword}` : scope
})

function filterTasks(source: DispatchTask[], ownFilter: SummaryFilter) {
  if (!activeSummaryFilter.value || activeSummaryFilter.value === ownFilter) return source
  return []
}

function handleSummaryFilter(value: SummaryFilter) {
  activeSummaryFilter.value = activeSummaryFilter.value === value ? '' : value
}

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
  const dispatchType = markerType === 'charging' ? 'charging' : markerType === 'parking' ? 'parking' : 'insert'
  temporaryPrefill.value = {
    dispatchType,
    businessScene: dispatchType === 'charging' || dispatchType === 'parking' ? 'daily_inspection' : 'hazard_screening',
    taskType: markerType === 'inspection' ? 'inspection' : markerType === 'charging' ? 'charging' : 'parking',
    targetPointId: markerId,
    targetPointIds: markerType === 'inspection' && markerId ? [markerId] : [],
    name: marker ? `临时任务-${marker.label}` : '临时任务'
  }
  temporaryVisible.value = true
}
function refreshData() { message.success('调度数据已刷新') }
function showCoverageCheck() { coverageVisible.value = true }
function handleTaskAction(payload: { type: string; task: DispatchTask }) {
  if (payload.type === 'cancel-task') {
    cancelTarget.value = payload.task
    cancelReason.value = ''
    cancelVisible.value = true
    return
  }
  message.info(`已触发操作：${payload.type} / ${payload.task.name}`)
}
function getRobotStatusText(status: RobotState['status']) {
  return ({ idle: '空闲', running: '执行中', charging: '充电中' } as Record<RobotState['status'], string>)[status]
}
function getManualStatusText(status: PendingManualStatus) {
  return ({ pending: '待处理', processing: '处理中', resolved: '已完成' } as Record<PendingManualStatus, string>)[status]
}
function getManualStatusColor(status: PendingManualStatus) {
  return ({ pending: 'default', processing: 'processing', resolved: 'green' } as Record<PendingManualStatus, string>)[status]
}
function getRiskText(level?: string) {
  return ({ normal: '普通', warning: '预警', alarm: '告警', critical_alarm: '严重告警', hazard: '隐患', major_hazard: '重大隐患' } as Record<string, string>)[level || ''] || '普通'
}
function getRiskColor(level?: string) {
  return ({ normal: 'default', warning: 'gold', alarm: 'orange', critical_alarm: 'red', hazard: 'volcano', major_hazard: 'magenta' } as Record<string, string>)[level || ''] || 'default'
}
function getSceneText(scene?: string) {
  return ({ daily_inspection: '日常巡检', hazard_screening: '隐患排查', environment_check: '环境检查', operation_guard: '作业监护', recheck: '补检' } as Record<string, string>)[scene || ''] || '日常巡检'
}
function openReplaceRobot(item: PendingManualItem) {
  replaceTarget.value = item
  selectedRobotId.value = item.assignedRobotId || recommendedRobotId.value
  replaceRobotVisible.value = true
}
function confirmReplaceRobot() {
  if (!replaceTarget.value || !selectedRobotId.value) return
  const robot = robots.value.find((item) => item.id === selectedRobotId.value)
  if (!robot) return
  replaceTarget.value.assignedRobotId = robot.id
  replaceTarget.value.assignedRobotName = robot.name
  if (replaceTarget.value.manualStatus === 'pending') replaceTarget.value.manualStatus = 'processing'
  records.value.unshift({
    id: `record-${Date.now()}`,
    time: new Date().toLocaleTimeString(),
    event: `待人工确认项替换机器人：${replaceTarget.value.name} -> ${robot.name}`,
    taskName: replaceTarget.value.name,
    resultStatus: 'pending',
    source: 'manual'
  })
  replaceRobotVisible.value = false
  message.success('已完成机器人替换')
}
function autoAdjustPendingManual(item: PendingManualItem) {
  const robotId = item.assignedRobotId || recommendedRobotId.value
  if (!robotId) return message.error('无可用机器人，请先手动选择机器人')
  const robot = robots.value.find((it) => it.id === robotId)
  if (!robot) return message.error('机器人不存在')
  item.assignedRobotId = robot.id
  item.assignedRobotName = robot.name
  item.manualStatus = 'resolved'

  if (item.type === '临时任务') {
    tasks.value.unshift({
      id: `auto-manual-${Date.now()}`,
      name: `自动调整-${item.name}`,
      type: 'auto',
      typeLabel: '自动补检',
      businessScene: 'recheck',
      riskLevel: 'alarm',
      suggestedAction: '补检',
      dispatchReason: `待人工确认项自动调整：${item.name}`,
      constraintSummary: '自动调整后进入待确认队列',
      status: 'auto_pending',
      robotName: robot.name,
      priority: 'high',
      priorityLabel: '高',
      createdAt: new Date().toLocaleTimeString(),
      reason: `待人工确认项自动调整：${item.name}`,
      affectedTaskName: pendingTasks.value[0]?.name
    })
  } else {
    const targetPlanTask = tasks.value.find((task) => task.type === 'plan' && task.status === 'pending')
    if (targetPlanTask) {
      targetPlanTask.robotName = robot.name
      targetPlanTask.changeFlag = true
      targetPlanTask.changeReason = `自动调整：${item.name}，执行机器人调整为 ${robot.name}`
    }
  }

  records.value.unshift({
    id: `record-${Date.now()}`,
    time: new Date().toLocaleTimeString(),
    event: `待人工确认项自动调整：${item.name}（${robot.name}）`,
    taskName: item.name,
    resultStatus: 'done',
    source: 'auto'
  })
  message.success('已完成自动调整')
}
function autoSupplementCoverage() {
  const missingTarget = coverageResult.missingDevices[0]?.deviceName || coverageResult.missingSubjects[0]?.subjectName || coverageResult.missingRules[0]?.subjectName || coverageResult.missingRegions[0]?.regionName || '漏检任务'
  const taskName = `自动补充-${missingTarget}`
  tasks.value.unshift({
    id: `auto-${Date.now()}`,
    name: taskName,
    type: 'auto',
    typeLabel: '自动补检',
    businessScene: 'recheck',
    riskLevel: 'alarm',
    suggestedAction: '补检',
    dispatchReason: '覆盖检查自动补充',
    constraintSummary: '待调度台确认机器人资源',
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
  coverageResult.missingRegions = []
  coverageResult.missingDevices = []
  coverageResult.missingSubjects = []
  coverageResult.missingRules = []
  message.success('已自动补充调度任务')
}
function manualSupplementCoverage() {
  manualHandlingLevel.value = 'temporary'
  supplementLevelVisible.value = true
}
function confirmManualSupplementCoverage() {
  if (manualHandlingLevel.value === 'plan') {
    records.value.unshift({ id: `record-${Date.now()}`, time: new Date().toLocaleTimeString(), event: '覆盖检查人工确认：进入巡检规划调整', taskName: '巡检规划调整', resultStatus: 'pending', source: 'manual' })
    supplementLevelVisible.value = false
    coverageVisible.value = false
    message.success('已记录为巡检规划级处理')
    return
  }
  const firstPoint = inspectionPointOptions.value[0]?.value
  temporaryPrefill.value = {
    name: '人工补充任务',
    dispatchType: 'recheck',
    businessScene: 'hazard_screening',
    taskType: 'inspection',
    targetPointIds: firstPoint ? [firstPoint] : [],
    reason: '覆盖检查发现遗漏，需人工补充'
  }
  coverageVisible.value = false
  supplementLevelVisible.value = false
  temporaryVisible.value = true
  message.info('已打开手动创建任务弹窗，可补充遗漏任务')
}
function confirmCancelTask() {
  if (!cancelTarget.value || !cancelReason.value.trim()) return
  const task = cancelTarget.value
  task.status = 'cancelled'
  records.value.unshift({
    id: `record-${Date.now()}`,
    time: new Date().toLocaleTimeString(),
    event: `取消任务：${task.name}，原因：${cancelReason.value.trim()}`,
    taskName: task.name,
    resultStatus: 'rejected',
    source: 'manual'
  })
  cancelVisible.value = false
  cancelTarget.value = null
  cancelReason.value = ''
  message.success('任务已取消，取消原因已记录为人工确认依据')
}
function goTask(taskId: string) {
  message.info(`跳转到任务：${taskId}`)
}
function goPlan(planId: string) {
  message.info(`跳转到执行规划：${planId}`)
}
function submitTemporaryDispatch(form: TemporaryDispatchForm) {
  const matchedRobot = robotOptions.value.find((item) => item.value === form.robotId)
  const impacted = conflictCandidates.value.filter((item) => item.robotId === form.robotId).map((item) => item.name)
  const hasConflict = Boolean(impacted.length)
  const typeText = getTemporaryDispatchTypeText(form.dispatchType)
  tasks.value.unshift({
    id: `temp-${Date.now()}`,
    name: form.name,
    type: 'temp',
    typeLabel: `总调度台${typeText}`,
    businessScene: form.businessScene,
    dispatchType: form.dispatchType,
    tempTaskType: form.taskType,
    taskSource: 'dispatch_insert',
    riskLevel: form.dispatchType === 'recheck' ? 'alarm' : 'normal',
    suggestedAction: hasConflict ? `${typeText}后顺延` : typeText,
    dispatchReason: form.reason,
    constraintSummary: hasConflict ? '存在机器人资源冲突，需人工确认' : '机器人资源可用',
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
  records.value.unshift({ id: `record-${Date.now()}`, time: new Date().toLocaleTimeString(), event: `人工创建临时任务：${form.name}（${typeText} / ${getSceneText(form.businessScene)}）`, taskName: form.name, resultStatus: hasConflict ? 'pending' : 'running', source: 'temp' })
  temporaryVisible.value = false
  message.success('临时任务已创建')
}

function getTemporaryDispatchTypeText(type?: TemporaryDispatchForm['dispatchType']) {
  return ({ insert: '插单', recheck: '补检', charging: '充电', parking: '停车', replace_robot: '替换机器人' } as Record<string, string>)[type || ''] || '插单'
}
</script>

<style scoped lang="css">.dispatch-center {
  width: 100%;
  min-width: 0;
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
.scope-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: -4px 0 12px;
  color: #4b5563;
  font-size: 13px;
}
.content-layout {
  display: grid;
  grid-template-columns: minmax(560px, 1.15fr) minmax(440px, 0.95fr);
  gap: 12px;
  align-items: stretch;
}
.map-panel {
  min-width: 0;
  display: flex;
}
.left-side {
  min-width: 0;
}
.map-panel :deep(.map-card) {
  width: 100%;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.dispatch-center :deep(.coverage-check-modal .ant-modal-body) {
  max-height: 78vh;
  overflow-y: auto;
}
.coverage-card-grid :deep(.ant-card) {
  height: 100%;
}
.coverage-card-grid :deep(.ant-card-body) {
  max-height: 320px;
  overflow-y: auto;
}
.coverage-missing-item {
  padding: 8px 10px;
  margin-bottom: 8px;
  border: 1px solid #e6f4ff;
  border-radius: 6px;
  background: #f6fbff;
}
.coverage-missing-item.warning {
  border-color: #ffe7ba;
  background: #fffaf0;
}
.coverage-missing-item.danger {
  border-color: #ffccc7;
  background: #fff2f0;
}
.coverage-title {
  color: #1f2937;
  font-weight: 600;
}
.coverage-meta {
  margin-top: 2px;
  color: #667085;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-word;
}
@media (max-width: 1200px) {
  .content-layout {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 1440px), (max-height: 820px) {
  .content-layout {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 768px) {
  .page-header {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }
}
</style>
