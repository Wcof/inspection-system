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
      :robot-options="scopeRobotOptions"
      @update:control="onControlUpdate"
      @create-temporary="openTemporary()"
      @create-emergency="openEmergency()"
      @coverage-check="showCoverageCheck"
      @refresh="refreshData"
    />

    <DispatchSummaryCards :summary="summary" :active-filter="activeSummaryFilter" @filter="handleSummaryFilter" />
    <div class="scope-bar">
      当前统计范围：{{ currentScopeText }}
      <a-button v-if="activeSummaryFilter" type="link" size="small" @click="activeSummaryFilter = ''">清除列表过滤</a-button>
    </div>

    <!-- 机器人状态与故障接管 -->
    <a-card size="small" title="机器人状态" style="margin-bottom: 12px">
      <a-space wrap>
        <div v-for="bot in takevoerRobots" :key="bot.id" class="robot-status-badge"
          :class="bot.status" style="padding: 4px 12px; border: 1px solid #d9d9d9; border-radius: 6px; display: inline-flex; align-items: center; gap: 8px">
          <a-tag :color="statusColor(bot.status)" style="margin-right: 0">{{ statusLabel(bot.status) }}</a-tag>
          <span>{{ bot.name }}</span>
          <a-button v-if="bot.status === 'fault' || bot.status === 'low_battery'" size="small" type="link" danger @click="openTakeover(bot)">无线接管</a-button>
          <a-button v-else-if="bot.status === 'idle'" size="small" type="link" @click="openTakeover(bot)">发起接管</a-button>
        </div>
      </a-space>
    </a-card>

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
          :mode="control.mode"
          :active-filter="activeSummaryFilter"
          @task-action="handleTaskAction"
        />
      </div>
    </div>

    <TemporaryDispatchModal
      v-model:visible="temporaryVisible"
      :mode="temporaryMode"
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
        <a-descriptions-item label="遗漏巡检对象/连接">{{ coverageResult.missingSubjects.length }}</a-descriptions-item>
        <a-descriptions-item label="遗漏巡检规则">{{ coverageResult.missingRules.length }}</a-descriptions-item>
        <a-descriptions-item label="待人工确认">{{ coverageResult.pendingManual.length }}</a-descriptions-item>
      </a-descriptions>

      <a-row :gutter="[16, 16]" class="coverage-card-grid">
        <a-col :xs="24" :lg="12" :xl="6">
          <a-card size="small" title="遗漏区域">
            <a-empty v-if="filteredMissingRegions.length === 0" description="无遗漏区域" />
            <div
              v-for="item in filteredMissingRegions"
              :key="item.regionId"
              class="coverage-missing-item clickable"
              :class="{ active: selectedRegionId === item.regionId }"
              @click="toggleRegionSelection(item)"
            >
              <div class="coverage-title">{{ item.regionName }}</div>
              <div class="coverage-meta">所属任务：{{ getCoverageOwnerTaskText(item) }}</div>
              <div class="coverage-meta">所属规划：{{ getCoverageOwnerPlanText(item) }}</div>
              <a-space size="small" style="margin-top: 6px">
                <a-button size="small" type="link" :disabled="!item.taskId" @click.stop="goTask(item.taskId || '')">任务</a-button>
                <a-button size="small" type="link" :disabled="!item.planId" @click.stop="goPlan(item.planId || '', item.planName)">规划</a-button>
              </a-space>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="12" :xl="6">
          <a-card size="small" title="遗漏设施">
            <a-empty v-if="filteredMissingDevices.length === 0" description="无遗漏设施" />
            <div
              v-for="item in filteredMissingDevices"
              :key="item.deviceId"
              class="coverage-missing-item danger clickable"
              :class="{ active: selectedDeviceId === item.deviceId }"
              @click="toggleDeviceSelection(item)"
            >
              <div class="coverage-title">{{ item.deviceName }}</div>
              <div class="coverage-meta">巡检区域：{{ item.regionName }}</div>
              <div class="coverage-meta">所属任务：{{ getCoverageOwnerTaskText(item) }}</div>
              <div class="coverage-meta">所属规划：{{ getCoverageOwnerPlanText(item) }}</div>
              <a-space size="small" style="margin-top: 6px">
                <a-button size="small" type="link" :disabled="!item.taskId" @click.stop="goTask(item.taskId || '')">任务</a-button>
                <a-button size="small" type="link" :disabled="!item.planId" @click.stop="goPlan(item.planId || '', item.planName)">规划</a-button>
              </a-space>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="12" :xl="6">
          <a-card size="small" title="遗漏巡检对象/连接">
            <a-empty v-if="filteredMissingSubjects.length === 0" description="无遗漏巡检对象/连接" />
            <div
              v-for="item in filteredMissingSubjects"
              :key="item.subjectId"
              class="coverage-missing-item warning clickable"
              :class="{ active: selectedSubjectId === item.subjectId }"
              @click="toggleSubjectSelection(item)"
            >
              <div class="coverage-title">{{ item.subjectName }}</div>
              <div class="coverage-meta">{{ item.regionName }} / {{ item.deviceName }} / {{ item.subjectType }}</div>
              <div class="coverage-meta">所属任务：{{ getCoverageOwnerTaskText(item) }}</div>
              <div class="coverage-meta">所属规划：{{ getCoverageOwnerPlanText(item) }}</div>
              <a-space size="small" style="margin-top: 6px">
                <a-button size="small" type="link" :disabled="!item.taskId" @click.stop="goTask(item.taskId || '')">任务</a-button>
                <a-button size="small" type="link" :disabled="!item.planId" @click.stop="goPlan(item.planId || '', item.planName)">规划</a-button>
              </a-space>
            </div>
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="12" :xl="6">
          <a-card size="small" title="遗漏巡检规则">
            <a-empty v-if="filteredMissingRules.length === 0" description="无遗漏巡检规则" />
            <div v-for="item in filteredMissingRules" :key="item.id" class="coverage-missing-item warning">
              <div class="coverage-title">{{ item.ruleName }}</div>
              <div class="coverage-meta">{{ item.regionName }} / {{ item.deviceName }} / {{ item.subjectName }}</div>
              <div class="coverage-meta">所属任务：{{ getCoverageOwnerTaskText(item) }}</div>
              <div class="coverage-meta">所属规划：{{ getCoverageOwnerPlanText(item) }}</div>
              <a-space size="small" style="margin-top: 6px">
                <a-button size="small" type="link" :disabled="!item.taskId" @click.stop="goTask(item.taskId || '')">任务</a-button>
                <a-button size="small" type="link" :disabled="!item.planId" @click.stop="goPlan(item.planId || '', item.planName)">规划</a-button>
              </a-space>
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

    <!-- 故障/低电接管弹窗 -->
    <a-modal
      v-model:open="takeoverVisible"
      title="无线全量接管"
      width="600"
      @ok="confirmTakeover"
      :ok-button-props="{ disabled: !takeoverTargetRobotId }"
      ok-text="执行接管"
    >
      <a-alert v-if="takeoverSourceBot?.status === 'fault' || takeoverSourceBot?.status === 'low_battery'" type="warning" show-icon style="margin-bottom: 12px">
        <template #message>
          <div>{{ takeoverSourceBot?.name }} 状态异常（{{ takeoverSourceBot?.status === 'fault' ? '故障' : '低电量' }}）<br/>建议立即执行无线接管，将 DAG 断点+知识库迁移至空闲机器人续巡。</div>
        </template>
      </a-alert>

      <a-descriptions :column="2" bordered size="small" style="margin-bottom: 16px">
        <a-descriptions-item label="源机器人">{{ takeoverSourceBot?.name || '-' }}</a-descriptions-item>
        <a-descriptions-item label="源状态"><a-tag :color="statusColor(takeoverSourceBot?.status || 'idle')">{{ statusLabel(takeoverSourceBot?.status || 'idle') }}</a-tag></a-descriptions-item>
        <a-descriptions-item label="当前任务数" :span="2">{{ takeoverSourceTasks.length }}</a-descriptions-item>
      </a-descriptions>

      <a-form layout="vertical">
        <a-form-item label="目标机器人（接管后续巡）" required>
          <a-select v-model:value="takeoverTargetRobotId" placeholder="请选择空闲机器人接管">
            <a-select-option v-for="bot in idleRobotOptions" :key="bot.id" :value="bot.id">
              <a-space>
                <a-tag :color="statusColor(bot.status)">{{ statusLabel(bot.status) }}</a-tag>
                <span>{{ bot.name }}</span>
                <small style="color: #999">{{ bot.dailyCapacity }}次/日</small>
              </a-space>
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>

      <a-collapse ghost>
        <a-collapse-panel key="trace" header="断点位置与迁移记录">
          <div v-if="takeoverRecords.length === 0" style="color: #999; padding: 8px">暂无迁移记录</div>
          <a-timeline v-else>
            <a-timeline-item v-for="r in takeoverRecords" :key="r.time" :color="r.success ? 'green' : 'red'">
              <div><strong>{{ r.sourceBot }}</strong> → <strong>{{ r.targetBot }}</strong></div>
              <div style="font-size: 12px; color: #999">{{ r.time }} — {{ r.reason }}</div>
            </a-timeline-item>
          </a-timeline>
        </a-collapse-panel>
      </a-collapse>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import DispatchControlBar from './dispatch-center/DispatchControlBar.vue'
import DispatchSummaryCards from './dispatch-center/DispatchSummaryCards.vue'
import DispatchBoardColumns from './dispatch-center/DispatchBoardColumns.vue'
import DispatchMapPanel from './dispatch-center/DispatchMapPanel.vue'
import TemporaryDispatchModal from './dispatch-center/TemporaryDispatchModal.vue'
import type { DispatchControlState } from './dispatch-center/DispatchControlBar.vue'
import type { DispatchSummary, SummaryFilter } from './dispatch-center/DispatchSummaryCards.vue'
import type { DispatchTask } from './dispatch-center/DispatchBoardColumns.vue'
import type { MapMarker } from './dispatch-center/DispatchMapPanel.vue'
import type { TemporaryDispatchForm, ConflictTaskItem } from './dispatch-center/TemporaryDispatchModal.vue'

interface RobotState { id: string; name: string; status: 'idle' | 'running' | 'charging' | 'fault' | 'low_battery'; dailyCapacity: number }
interface DispatchRecordItem {
  id: string
  time: string
  event: string
  taskName: string
  resultStatus: 'pending' | 'running' | 'done' | 'rejected'
  source: 'auto' | 'manual' | 'temp'
}
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
type CoverageOwnerType = 'task_missing' | 'plan_missing'
interface CoverageLinkMeta {
  ownerType: CoverageOwnerType
  taskId?: string
  taskName?: string
  taskNo?: string
  planId?: string
  planName?: string
}
interface MissingRegionItem extends CoverageLinkMeta { regionId: string; regionName: string }
interface MissingDeviceItem extends CoverageLinkMeta { deviceId: string; deviceName: string; regionId?: string; regionName: string }
interface MissingSubjectItem extends CoverageLinkMeta { subjectId: string; subjectName: string; subjectType: string; deviceId?: string; deviceName: string; regionId?: string; regionName: string }
interface MissingRuleItem extends CoverageLinkMeta { id: string; ruleName: string; subjectId?: string; subjectName: string; deviceId?: string; deviceName: string; regionId?: string; regionName: string }

const ALL_ROBOT_SCOPE = '__all__'
const TODAY_DATE = formatCurrentDate()
const control = reactive<DispatchControlState>({
  autoDispatchEnabled: true,
  allowAutoCreate: true,
  allowQueueJump: true,
  mode: 'auto',
  pointKeyword: '',
  robotId: ALL_ROBOT_SCOPE,
  timeRange: []
})
const activeSummaryFilter = ref<SummaryFilter | ''>('')
const temporaryVisible = ref(false)
const temporaryMode = ref<'temporary' | 'emergency'>('temporary')
const temporaryPrefill = ref<Partial<TemporaryDispatchForm>>({})
const supplementLevelVisible = ref(false)
const manualHandlingLevel = ref<'temporary' | 'plan'>('temporary')
const cancelVisible = ref(false)
const cancelTarget = ref<DispatchTask | null>(null)
const cancelReason = ref('')
const router = useRouter()
const coverageVisible = ref(false)
const selectedRegionId = ref<string>('')
const selectedDeviceId = ref<string>('')
const selectedSubjectId = ref<string>('')
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
    { regionId: 'region-a', regionName: '反应区', ownerType: 'task_missing', taskId: 'task-004', taskName: '自动补检-1号反应釜温度计', taskNo: 'TASK-20260512-004' },
    { regionId: 'region-b', regionName: '储罐区', ownerType: 'plan_missing', planId: 'plan-002', planName: '每周安全巡检' }
  ],
  missingDevices: [
    { deviceId: 'device-001', deviceName: '1号反应釜温度计', regionId: 'region-a', regionName: '反应区', ownerType: 'task_missing', taskId: 'task-004', taskName: '自动补检-1号反应釜温度计', taskNo: 'TASK-20260512-004' },
    { deviceId: 'device-003', deviceName: '储罐液位计', regionId: 'region-b', regionName: '储罐区', ownerType: 'plan_missing', planId: 'plan-002', planName: '每周安全巡检' }
  ],
  missingSubjects: [
    { subjectId: 'device-001-valve', subjectName: '入口阀门', subjectType: '巡检对象', deviceId: 'device-001', deviceName: '1号反应釜温度计', regionId: 'region-a', regionName: '反应区', ownerType: 'task_missing', taskId: 'task-001', taskName: '每日例行巡检', taskNo: 'TASK-2024-001' },
    { subjectId: 'device-003-conn-flange-pipe', subjectName: '法兰-管线', subjectType: '连接', deviceId: 'device-003', deviceName: '储罐液位计', regionId: 'region-b', regionName: '储罐区', ownerType: 'plan_missing', planId: 'plan-002', planName: '每周安全巡检' }
  ],
  missingRules: [
    { id: 'rule-missing-1', ruleName: '未配置阀门开闭识别规则', subjectId: 'device-001-valve', subjectName: '入口阀门', deviceId: 'device-001', deviceName: '1号反应釜温度计', regionId: 'region-a', regionName: '反应区', ownerType: 'task_missing', taskId: 'task-001', taskName: '每日例行巡检', taskNo: 'TASK-2024-001' },
    { id: 'rule-missing-2', ruleName: '未配置红外温升检测规则', subjectId: 'device-003-conn-flange-pipe', subjectName: '法兰-管线', deviceId: 'device-003', deviceName: '储罐液位计', regionId: 'region-b', regionName: '储罐区', ownerType: 'plan_missing', planId: 'plan-002', planName: '每周安全巡检' }
  ],
  pendingManual: [
    { id: 'manual-1', name: '反应区临时复检', type: '补检任务', suggestion: '建议人工确认后插入执行队列', suggestedAction: '插单', affectedTaskName: '每日例行巡检', riskLevel: 'critical_alarm', manualStatus: 'pending' },
    { id: 'manual-2', name: '储罐区计划顺延', type: '计划任务', suggestion: '建议延后执行并通知值班长', suggestedAction: '顺延', affectedTaskName: '每周安全巡检', riskLevel: 'warning', manualStatus: 'pending' }
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

// ── 故障接管 ──
const takeoverVisible = ref(false)
const takeoverSourceBot = ref<RobotState | null>(null)
const takeoverTargetRobotId = ref<string>()
const takeoverRecords = ref<{ sourceBot: string; targetBot: string; time: string; reason: string; success: boolean }[]>([])

function statusColor(status: RobotState['status']) {
  const map = { idle: 'green', running: 'blue', charging: 'orange', fault: 'red', low_battery: 'gold' }
  return map[status] || 'default'
}
function statusLabel(status: RobotState['status']) {
  const map = { idle: '空闲', running: '执行中', charging: '充电中', fault: '故障', low_battery: '低电量' }
  return map[status] || status
}

const takevoerRobots = computed(() => robots.value)

const takeoverSourceTasks = computed(() => {
  if (!takeoverSourceBot.value) return []
  return tasks.value.filter(t => t.robotName === takeoverSourceBot.value?.name)
})

const idleRobotOptions = computed(() => {
  const sourceId = takeoverSourceBot.value?.id
  return robots.value.filter(b => b.id !== sourceId && (b.status === 'idle' || b.status === 'charging'))
})

function openTakeover(bot: RobotState) {
  takeoverSourceBot.value = bot
  takeoverTargetRobotId.value = ''
  takeoverVisible.value = true
}

function confirmTakeover() {
  if (!takeoverSourceBot.value || !takeoverTargetRobotId.value) {
    message.warning('请选择目标机器人')
    return
  }
  const targetBot = robots.value.find(b => b.id === takeoverTargetRobotId.value)
  if (!targetBot) return
  const time = new Date().toLocaleString('zh-CN', { hour12: false })
  takeoverRecords.value.unshift({
    sourceBot: takeoverSourceBot.value.name,
    targetBot: targetBot.name,
    time,
    reason: `${takeoverSourceBot.value.status === 'fault' ? '故障' : '低电量'} — DAG 断点+知识库已迁移`,
    success: true
  })
  takeoverSourceBot.value.status = 'charging'
  targetBot.status = 'running'
  message.success(`已执行无线接管：${takeoverSourceBot.value.name} → ${targetBot.name}`)
  takeoverVisible.value = false
  takeoverSourceBot.value = null
  takeoverTargetRobotId.value = ''
}

const robots = ref<RobotState[]>([
  { id: 'robot-001', name: '巡检机器人-01', status: 'running', dailyCapacity: 8 },
  { id: 'robot-002', name: '巡检机器人-02', status: 'charging', dailyCapacity: 7 },
  { id: 'robot-003', name: '巡检机器人-03', status: 'fault', dailyCapacity: 6 },
  { id: 'robot-004', name: '巡检机器人-04', status: 'idle', dailyCapacity: 8 },
  { id: 'robot-005', name: '巡检机器人-05', status: 'idle', dailyCapacity: 10 }
])

const tasks = ref<DispatchTask[]>([
  { id: 'task-001', name: '每日例行巡检', type: 'plan', typeLabel: '执行规划生成', businessScene: 'daily_inspection', riskLevel: 'normal', suggestedAction: '排队', constraintSummary: '电量82% / 反应区可进入 / 作业窗口正常', status: 'running', robotName: '巡检机器人-01', priority: 'high', priorityLabel: '高', createdAt: '09:00', startedAt: '09:10', progressPercent: 75, doneCount: 9, totalCount: 12, etaTime: '12:30', changeFlag: true, changeReason: '因临时高优任务自动重排后改派至巡检机器人-01' },
  { id: 'task-002', name: '每周安全巡检', type: 'plan', typeLabel: '执行规划生成', businessScene: 'hazard_screening', riskLevel: 'warning', suggestedAction: '顺延', constraintSummary: '机器人适配 / 作业窗口13:00-15:00', status: 'pending', robotName: '巡检机器人-03', priority: 'medium', priorityLabel: '中', createdAt: '09:30', scheduledAt: '13:00', queueOrder: 1 },
  { id: 'task-003', name: '临时复检-储罐液位计', type: 'temp', typeLabel: '总调度台插单', businessScene: 'hazard_screening', riskLevel: 'critical_alarm', suggestedAction: '插单', constraintSummary: '电量64% / 储罐区允许进入 / 需人工确认', status: 'pending', robotName: '巡检机器人-02', priority: 'high', priorityLabel: '高', createdAt: '10:15', scheduledAt: '12:20', queueOrder: 2, changeFlag: true, changeReason: '人工插入后重排至第 2 位' },
  { id: 'task-004', name: '自动补检-1号反应釜温度计', type: 'auto', typeLabel: '自动补检', businessScene: 'recheck', riskLevel: 'alarm', suggestedAction: '补检', dispatchReason: '漏检补偿', constraintSummary: '机器人充电中 / 建议替换机器人', status: 'auto_pending', robotName: '巡检机器人-04', priority: 'high', priorityLabel: '高', createdAt: '10:45', reason: '漏检补偿', affectedTaskName: '每周安全巡检' }
])

const records = ref<DispatchRecordItem[]>([
  { id: 'record-001', time: '10:45', event: '自动调度生成漏检补偿任务：1号反应釜温度计', taskName: '自动补检-1号反应釜温度计', resultStatus: 'pending', source: 'auto' },
  { id: 'record-002', time: '10:20', event: '人工创建临时任务：储罐液位计复检', taskName: '临时复检-储罐液位计', resultStatus: 'running', source: 'temp' },
  { id: 'record-003', time: '10:05', event: '任务重排：每周安全巡检顺延执行', taskName: '每周安全巡检', resultStatus: 'done', source: 'manual' }
])

const mapMarkers = ref<MapMarker[]>([
  { id: 'm-r1', label: '巡检机器人-01', markerType: 'robot', x: 34, y: 22, status: 'running', speedKmh: 6.8, taskShortName: '反应区', relatedRobotId: 'robot-001' },
  { id: 'm-r2', label: '巡检机器人-02', markerType: 'robot', x: 18, y: 49, status: 'charging', speedKmh: 0, taskShortName: '回充中', relatedRobotId: 'robot-002' },
  { id: 'p-i1', label: '反应釜车间巡检点', markerType: 'inspection', x: 35, y: 29, todayPlannedCount: 8, inspectedCount: 6, status: 'running' },
  { id: 'p-i2', label: '储罐区巡检点', markerType: 'inspection', x: 25, y: 64, todayPlannedCount: 5, inspectedCount: 2, status: 'pending' },
  { id: 'p-c1', label: '充电站-C1', markerType: 'charging', x: 78, y: 18, chargingCount: 2, parkedCount: 1, status: 'charging' },
  { id: 'p-p1', label: '停车点-P1', markerType: 'parking', x: 12, y: 82, parkedCount: 3, status: 'idle' }
])

const visibleMapMarkers = computed(() => {
  const keyword = control.pointKeyword.trim().toLowerCase()
  const robotId = control.robotId
  return mapMarkers.value.filter((marker) => {
    const matchesKeyword = !keyword || marker.markerType !== 'inspection' || marker.label.toLowerCase().includes(keyword)
    const matchesRobot = !robotId || robotId === ALL_ROBOT_SCOPE || marker.relatedRobotId === robotId || marker.markerType !== 'robot'
    return matchesKeyword && matchesRobot
  })
})
const robotScopedTasks = computed(() => {
  if (!control.robotId || control.robotId === ALL_ROBOT_SCOPE) return tasks.value
  const robot = robots.value.find(item => item.id === control.robotId)
  if (!robot) return tasks.value
  return tasks.value.filter(task => task.robotName === robot.name)
})
const scopedTasks = computed(() => robotScopedTasks.value.filter((task) => isInSelectedRange(getTaskTimeValue(task))))
const runningTasks = computed(() => filterTasks(scopedTasks.value.filter((task) => task.status === 'running'), 'running'))
const pendingTasks = computed(() => filterTasks(scopedTasks.value.filter((task) => task.status === 'pending').sort((a, b) => (a.queueOrder || 99) - (b.queueOrder || 99)), 'pending'))
const pendingProcessTasks = computed(() => filterTasks(scopedTasks.value.filter((task) => task.status === 'auto_pending' || task.status === 'conflict'), 'processing'))
const temporaryTasks = computed(() => filterTasks(scopedTasks.value.filter(task => task.type === 'temp'), 'temporary'))
const robotOptions = computed(() => robots.value.map((robot) => ({ value: robot.id, label: robot.name })))
const scopeRobotOptions = computed(() => [{ value: ALL_ROBOT_SCOPE, label: '全部（全部机器人）' }, ...robotOptions.value])
const inspectionPointOptions = computed(() => mapMarkers.value.filter((m) => m.markerType === 'inspection').map((m) => ({ value: m.id, label: m.label })))
const chargingPointOptions = computed(() => mapMarkers.value.filter((m) => m.markerType === 'charging').map((m) => ({ value: m.id, label: m.label })))
const parkingPointOptions = computed(() => mapMarkers.value.filter((m) => m.markerType === 'parking').map((m) => ({ value: m.id, label: m.label })))
const conflictCandidates = computed<ConflictTaskItem[]>(() => [...runningTasks.value, ...pendingTasks.value].map((task) => ({ id: task.id, name: task.name, robotId: robotOptions.value.find((item) => item.label === task.robotName)?.value || task.robotName, robotName: task.robotName, scheduledAt: task.scheduledAt || task.startedAt || '-', status: task.status === 'running' ? 'running' : 'pending', typeLabel: task.typeLabel })))
const robotLoadMap = computed(() => {
  const map = new Map<string, number>()
  robotScopedTasks.value.forEach((task) => {
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
const filteredMissingRegions = computed(() => coverageResult.missingRegions)
const filteredMissingDevices = computed(() => {
  return coverageResult.missingDevices.filter((item) => {
    if (selectedRegionId.value && item.regionId !== selectedRegionId.value) return false
    return true
  })
})
const filteredMissingSubjects = computed(() => {
  return coverageResult.missingSubjects.filter((item) => {
    if (selectedRegionId.value && item.regionId !== selectedRegionId.value) return false
    if (selectedDeviceId.value && item.deviceId !== selectedDeviceId.value) return false
    return true
  })
})
const filteredMissingRules = computed(() => {
  return coverageResult.missingRules.filter((item) => {
    if (selectedRegionId.value && item.regionId !== selectedRegionId.value) return false
    if (selectedDeviceId.value && item.deviceId !== selectedDeviceId.value) return false
    if (selectedSubjectId.value && item.subjectId !== selectedSubjectId.value) return false
    return true
  })
})

const summary = computed<DispatchSummary>(() => ({
  timeRange: getSelectedDateRangeText(),
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
  const scope = control.robotId === ALL_ROBOT_SCOPE ? '全部（全部机器人）任务' : robot ? `${robot.name}任务` : '全部（全部机器人）任务'
  const timeRangeText = getSelectedDateRangeText()
  const segments = [scope]
  if (timeRangeText) segments.push(`日期：${timeRangeText}`)
  if (control.pointKeyword) segments.push(`关键字：${control.pointKeyword}`)
  return segments.join(' / ')
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
function openTemporary() { temporaryMode.value = 'temporary'; temporaryPrefill.value = {}; temporaryVisible.value = true }
function openEmergency() {
  temporaryMode.value = 'emergency'
  temporaryPrefill.value = {
    dispatchType: 'emergency',
    businessScene: 'daily_inspection',
    taskType: 'inspection',
    name: '紧急任务'
  }
  temporaryVisible.value = true
}
function openTemporaryFromMap(payload: any) {
  const marker = payload?.marker
  const markerType = marker?.markerType || 'inspection'
  const markerId = marker?.id || ''
  const dispatchType = markerType === 'charging' ? 'charging' : markerType === 'parking' ? 'parking' : 'insert'
  temporaryMode.value = 'temporary'
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
function showCoverageCheck() {
  selectedRegionId.value = ''
  selectedDeviceId.value = ''
  selectedSubjectId.value = ''
  coverageVisible.value = true
}
function handleTaskAction(payload: { type: string; task: DispatchTask }) {
  if (payload.type === 'cancel-task') {
    cancelTarget.value = payload.task
    cancelReason.value = ''
    cancelVisible.value = true
    return
  }
  if (payload.type === 'view-detail' && payload.task.type === 'temp') {
    router.push(`/management/task/detail/${payload.task.id}?source=temp`)
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
function getCoverageOwnerTaskText(item: CoverageLinkMeta) {
  if (item.ownerType === 'plan_missing') return '漏检'
  if (!item.taskName) return '漏检'
  return `遗漏任务：${item.taskName}${item.taskNo ? `（${item.taskNo}）` : ''}`
}
function getCoverageOwnerPlanText(item: CoverageLinkMeta) {
  if (item.ownerType === 'task_missing') return '漏检'
  if (!item.planName) return '漏检'
  return `遗漏规划：${item.planName}`
}
function toggleRegionSelection(item: MissingRegionItem) {
  const next = selectedRegionId.value === item.regionId ? '' : item.regionId
  selectedRegionId.value = next
  if (!next) {
    selectedDeviceId.value = ''
    selectedSubjectId.value = ''
    return
  }
  if (selectedDeviceId.value && !filteredMissingDevices.value.some((device) => device.deviceId === selectedDeviceId.value)) {
    selectedDeviceId.value = ''
  }
  if (selectedSubjectId.value && !filteredMissingSubjects.value.some((subject) => subject.subjectId === selectedSubjectId.value)) {
    selectedSubjectId.value = ''
  }
}
function toggleDeviceSelection(item: MissingDeviceItem) {
  if (item.regionId) selectedRegionId.value = item.regionId
  const next = selectedDeviceId.value === item.deviceId ? '' : item.deviceId
  selectedDeviceId.value = next
  if (!next) selectedSubjectId.value = ''
  if (selectedSubjectId.value && !filteredMissingSubjects.value.some((subject) => subject.subjectId === selectedSubjectId.value)) {
    selectedSubjectId.value = ''
  }
}
function toggleSubjectSelection(item: MissingSubjectItem) {
  if (item.regionId) selectedRegionId.value = item.regionId
  if (item.deviceId) selectedDeviceId.value = item.deviceId
  selectedSubjectId.value = selectedSubjectId.value === item.subjectId ? '' : item.subjectId
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
    router.push('/management/plan/form')
    message.success('已跳转至新建规划')
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
  if (!taskId) return
  router.push(`/management/task/detail/${taskId}`)
}
function goPlan(planId: string, planName?: string) {
  router.push({
    path: '/management/plan/list',
    query: {
      from: 'dispatch-coverage',
      planId,
      name: planName || ''
    }
  })
}
function submitTemporaryDispatch(form: TemporaryDispatchForm) {
  const matchedRobot = robotOptions.value.find((item) => item.value === form.robotId)
  const impacted = conflictCandidates.value.filter((item) => item.robotId === form.robotId).map((item) => item.name)
  const hasConflict = Boolean(impacted.length)
  const typeText = getTemporaryDispatchTypeText(form.dispatchType)
  const isEmergencyTask = form.dispatchType === 'emergency' || temporaryMode.value === 'emergency'
  tasks.value.unshift({
    id: `temp-${Date.now()}`,
    name: form.name,
    type: 'temp',
    typeLabel: isEmergencyTask ? '紧急任务' : `总调度台${typeText}`,
    businessScene: form.businessScene,
    dispatchType: form.dispatchType,
    tempTaskType: form.taskType,
    taskSource: isEmergencyTask ? 'emergency' : 'dispatch_insert',
    riskLevel: isEmergencyTask ? 'critical_alarm' : form.dispatchType === 'recheck' ? 'alarm' : 'normal',
    suggestedAction: isEmergencyTask ? '立即出发' : hasConflict ? `${typeText}后顺延` : typeText,
    dispatchReason: form.reason,
    constraintSummary: isEmergencyTask ? '最高优先级 / 允许中断当前任务 / 立即插队执行' : hasConflict ? '存在机器人资源冲突，需人工确认' : '机器人资源可用',
    status: hasConflict ? 'auto_pending' : (control.mode === 'auto' ? 'pending' : 'pending'),
    robotName: matchedRobot?.label || form.robotId,
    priority: isEmergencyTask ? 'emergency' : 'high',
    priorityLabel: isEmergencyTask ? '紧急' : '高',
    createdAt: new Date().toLocaleTimeString(),
    scheduledAt: form.scheduledAt,
    reason: form.reason,
    affectedTaskName: impacted[0],
    changeFlag: hasConflict,
    changeReason: hasConflict ? (isEmergencyTask ? `紧急任务插入，受影响任务 ${impacted.join('、')} 需顺延或暂停` : `冲突处理：${form.conflictStrategy === 'delay' ? '延后执行' : '暂停执行'}；受影响任务 ${impacted.join('、')}`) : undefined,
    inspectionPointIds: [...(form.targetPointIds || [])],
    interruptsCurrentTask: isEmergencyTask,
    immediateDeparture: isEmergencyTask,
    priorityLevel: isEmergencyTask ? 'emergency' : 'high'
  })
  records.value.unshift({ id: `record-${Date.now()}`, time: new Date().toLocaleTimeString(), event: `${isEmergencyTask ? '人工创建紧急任务' : '人工创建临时任务'}：${form.name}（${isEmergencyTask ? '最高优先级 / 固定巡查' : `${typeText} / ${getSceneText(form.businessScene)}` }）`, taskName: form.name, resultStatus: hasConflict ? 'pending' : 'running', source: 'temp' })
  temporaryVisible.value = false
  temporaryMode.value = 'temporary'
  message.success(isEmergencyTask ? '紧急任务已创建' : '临时任务已创建')
}

function getTemporaryDispatchTypeText(type?: TemporaryDispatchForm['dispatchType']) {
  return ({ insert: '插单', recheck: '补检', emergency: '紧急任务', charging: '充电', parking: '停车', replace_robot: '替换机器人' } as Record<string, string>)[type || ''] || '插单'
}

function formatCurrentDate() {
  const now = new Date()
  const year = now.getFullYear()
  const month = `${now.getMonth() + 1}`.padStart(2, '0')
  const day = `${now.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function normalizeDateTime(value?: string) {
  if (!value) return ''
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return `${value} 00:00`
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(value)) return `${TODAY_DATE} ${value.slice(0, 5)}`
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(value)) return value.slice(0, 16)
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  const hour = `${date.getHours()}`.padStart(2, '0')
  const minute = `${date.getMinutes()}`.padStart(2, '0')
  return `${year}-${month}-${day} ${hour}:${minute}`
}

function getTaskTimeValue(task: DispatchTask) {
  return task.scheduledAt || task.startedAt || task.createdAt
}

function isInSelectedRange(value?: string) {
  if (!control.timeRange.length) return true
  const target = normalizeDateTime(value).slice(0, 10)
  if (!target) return false
  const [start, end] = control.timeRange
  const startValue = start
  const endValue = end
  if (!startValue || !endValue) return true
  return target >= startValue && target <= endValue
}

function getSelectedDateRangeText() {
  if (!control.timeRange.length) return '今日'
  const [start, end] = control.timeRange
  const startText = start
  const endText = end
  if (!startText || !endText) return '今日'
  return `${startText} - ${endText}`
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
.coverage-missing-item.clickable {
  cursor: pointer;
}
.coverage-missing-item.active {
  box-shadow: 0 0 0 2px #1677ff inset;
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
