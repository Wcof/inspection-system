
<template>
  <div class="inspection-task-detail">
    <a-page-header title="任务详情" @back="goBack" />

    <a-card style="margin-top: 16px">
      <a-descriptions bordered :column="3" size="small">
        <a-descriptions-item label="任务名称">{{ task?.name || '-' }}</a-descriptions-item>
        <a-descriptions-item label="任务编码">{{ task?.code || '-' }}</a-descriptions-item>
        <a-descriptions-item label="执行机器人">{{ getRobotName(task?.robotId) }}</a-descriptions-item>
        <a-descriptions-item label="所属计划">{{ showPlanName }}</a-descriptions-item>
        <a-descriptions-item label="规划类型">
          <a-tag :color="displayPlanType === 'auto' ? 'purple' : 'blue'">{{ getPlanTypeText(displayPlanType) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="任务场景">
          <a-tag :color="getSceneColor(task?.businessScene)">{{ getSceneText(task?.businessScene) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="任务来源">{{ getTaskSourceText(task?.taskSource) }}</a-descriptions-item>
        <a-descriptions-item label="风险等级">
          <a-tag :color="getRiskColor(task?.riskLevel)">{{ getRiskText(task?.riskLevel) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="任务状态">
          <a-tag :color="getStatusColor(task?.status)">{{ getStatusText(task?.status) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="预计执行时间">{{ task ? getPlannedTimeText(task) : '-' }}</a-descriptions-item>
        <a-descriptions-item label="执行总时长">{{ task ? getDurationText(task) : '-' }}</a-descriptions-item>
        <a-descriptions-item label="实际执行时间">{{ task ? getActualTimeText(task) : '-' }}</a-descriptions-item>
        <a-descriptions-item label="巡检区域">{{ taskRegionNames.join('、') || '-' }}</a-descriptions-item>
        <a-descriptions-item label="巡检设施数">{{ taskFacilities.length }}</a-descriptions-item>
        <a-descriptions-item label="地图">{{ taskMapName }}</a-descriptions-item>
        <a-descriptions-item label="巡检对象数">{{ taskComponentCount }}</a-descriptions-item>
        <a-descriptions-item label="巡检规则数">{{ taskRuleCount }}</a-descriptions-item>
        <a-descriptions-item label="回传状态">{{ taskFeedbackStatus }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card style="margin-top: 16px" title="任务视图">
      <a-tabs v-model:activeKey="activeView">
        <a-tab-pane key="trace" tab="执行轨迹">
          <a-descriptions bordered :column="4" size="small" class="trace-summary">
            <a-descriptions-item label="当前定位">{{ currentLocationLabel }}</a-descriptions-item>
            <a-descriptions-item label="已执行">{{ completedRouteCount }} 段</a-descriptions-item>
            <a-descriptions-item label="未执行">{{ pendingRouteCount }} 段</a-descriptions-item>
            <a-descriptions-item label="任务进度">{{ traceProgressPercent }}%</a-descriptions-item>
          </a-descriptions>

          <div class="trace-layout">
            <a-card class="trace-map-card" title="轨迹地图" size="small">
              <div class="trace-map-stage" :style="mapStageStyle">
                <div class="map-mask"></div>
                <div class="map-grid"></div>

                <svg class="route-layer" viewBox="0 0 100 100" preserveAspectRatio="none">
                  <line
                    v-for="line in routeLines"
                    :key="line.id"
                    :x1="line.from.x"
                    :y1="line.from.y"
                    :x2="line.to.x"
                    :y2="line.to.y"
                    :class="line.completed ? 'route-completed' : 'route-pending'"
                  />
                </svg>

                <div
                  v-for="point in tracePoints"
                  :key="point.id"
                  class="trace-marker"
                  :class="{ completed: point.sequence <= currentSequence, current: point.sequence === currentSequence + 1 }"
                  :style="{ left: `${point.x}%`, top: `${point.y}%` }"
                >
                  <span class="marker-dot">{{ point.sequence }}</span>
                  <div class="marker-label">
                    <div class="strong">{{ point.name }}</div>
                    <div>{{ point.statusText }}</div>
                  </div>
                </div>

                <div class="robot-marker" :style="{ left: `${robotPosition.x}%`, top: `${robotPosition.y}%` }">
                  <span class="robot-dot"></span>
                  <div class="robot-label">
                    <div class="strong">{{ getRobotName(task?.robotId) }}</div>
                    <div>当前位置 · {{ traceProgressPercent }}%</div>
                  </div>
                </div>

                <div class="map-legend">
                  <span><i class="legend-line solid"></i>已执行路线</span>
                  <span><i class="legend-line dashed"></i>未执行路线</span>
                  <span><i class="legend-dot robot"></i>机器人定位</span>
                  <span><i class="legend-dot point"></i>任务点位</span>
                </div>
              </div>
            </a-card>

            <a-card title="执行步骤" class="trace-step-card" size="small">
              <a-timeline>
                <a-timeline-item v-for="step in traceSteps" :key="step.id" :color="step.color">
                  <div class="step-title">{{ step.title }}</div>
                  <div class="step-meta">{{ step.time }}</div>
                  <div class="step-desc">{{ step.description }}</div>
                </a-timeline-item>
              </a-timeline>
            </a-card>
          </div>
        </a-tab-pane>
        <a-tab-pane key="point" tab="按点位查看">
          <a-table :columns="pointColumns" :data-source="inspectionPointRows" row-key="id" :pagination="false">
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'index'">{{ index + 1 }}</template>
              <template v-else-if="column.key === 'inspectionStatus'">
                <a-tag :color="getPointStatusColor(record.inspectionStatus)">{{ record.inspectionStatus }}</a-tag>
              </template>
              <template v-else-if="column.key === 'inspectionItemCount'">{{ record.inspectionItemCount }}</template>
              <template v-else-if="column.key === 'missedItemCount'">{{ record.missedItemCount }}</template>
              <template v-else-if="column.key === 'timeRange'">{{ record.timeRange }}</template>
            </template>
          </a-table>
        </a-tab-pane>
        <a-tab-pane key="device" tab="对象链路">
          <a-table :columns="deviceColumns" :data-source="deviceRows" row-key="id" :pagination="false">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'checkItems'">{{ record.checkItems }}</template>
              <template v-else-if="column.key === 'status'">
                <a-tag :color="record.status === '已检测' ? 'green' : 'orange'">{{ record.status }}</a-tag>
              </template>
              <template v-else-if="column.key === 'result'">
                <a-tag :color="record.result === '正常' ? 'green' : 'red'">{{ record.result }}</a-tag>
              </template>
              <template v-else-if="column.key === 'detectionData'">{{ record.detectionData }}</template>
              <template v-else-if="column.key === 'inspectTime'">{{ record.inspectTime }}</template>
              <template v-else-if="column.key === 'opticalShot'">
                <img :src="record.opticalShot" alt="光学截图" class="shot-thumb" />
              </template>
              <template v-else-if="column.key === 'thermalShot'">
                <img :src="record.thermalShot" alt="热成像截图" class="shot-thumb" />
              </template>
              <template v-else-if="column.key === 'prioritySummary'">
                <a-tag color="red" v-if="record.primaryCount">主要 {{ record.primaryCount }}</a-tag>
                <a-tag v-if="record.secondaryCount">次要 {{ record.secondaryCount }}</a-tag>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
        <a-tab-pane key="evidence" tab="采集动作与证据链">
          <a-alert
            type="info"
            show-icon
            message="不可检、未到达、目标缺失不计入有效覆盖，只进入漏检/复核口径。"
            style="margin-bottom: 12px"
          />
          <a-table :columns="evidenceColumns" :data-source="collectionActionRows" row-key="id" :pagination="{ pageSize: 8 }" :scroll="{ x: 1680 }">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'qualityStatus'">
                <a-tag :color="getQualityStatusColor(record.qualityStatus)">{{ getQualityStatusText(record.qualityStatus) }}</a-tag>
              </template>
              <template v-else-if="column.key === 'evidence'">
                <a-space>
                  <img :src="record.evidence.opticalImageUrl" alt="光学图" class="shot-thumb" />
                  <img :src="record.evidence.thermalImageUrl" alt="热成像图" class="shot-thumb" />
                </a-space>
              </template>
              <template v-else-if="column.key === 'robotPose'">
                {{ record.evidence.robotPose }}
              </template>
              <template v-else-if="column.key === 'recognizedValue'">
                {{ record.evidence.recognizedValue }}
              </template>
              <template v-else-if="column.key === 'gasValue'">
                {{ record.gasValue }}
              </template>
              <template v-else-if="column.key === 'ptz'">
                {{ record.ptz }}
              </template>
              <template v-else-if="column.key === 'confidence'">
                {{ Math.round(record.evidence.confidence * 100) }}%
              </template>
              <template v-else-if="column.key === 'ruleVersion'">
                {{ record.evidence.ruleVersion }}
              </template>
              <template v-else-if="column.key === 'manualReview'">
                {{ record.evidence.manualReviewConclusion }}
              </template>
              <template v-else-if="column.key === 'coverage'">
                <a-tag :color="isEffectiveCoverage(record.qualityStatus) ? 'green' : 'orange'">
                  {{ isEffectiveCoverage(record.qualityStatus) ? '计入覆盖' : '不计覆盖' }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import { useRobotStore } from '@/stores/robot'
import type { EvidenceChain, InspectionTaskResult, InspectionTaskSnapshot } from '@/types/inspection'

const router = useRouter()
const route = useRoute()
const inspectionStore = useInspectionStore()
const robotStore = useRobotStore()

const task = ref<any>()
const inspectionPoints = ref<any[]>([])
const taskSnapshot = ref<InspectionTaskSnapshot>()
const taskResults = ref<InspectionTaskResult[]>([])
const activeView = ref(String(route.query.tab || 'point'))
const fallbackMapBackgroundUrl = new URL('../../../地图.png', import.meta.url).href

interface TracePoint {
  id: string
  name: string
  sequence: number
  x: number
  y: number
  statusText: string
}

interface RouteLine {
  id: string
  from: TracePoint
  to: TracePoint
  completed: boolean
}

const pointColumns = [
  { title: '序号', key: 'index', width: 80 },
  { title: '执行点位', dataIndex: 'name', key: 'name' },
  { title: '编码', dataIndex: 'code', key: 'code', width: 160 },
  { title: '巡检区域', dataIndex: 'areaName', key: 'areaName', width: 180 },
  { title: '停车点', dataIndex: 'parkingPointNames', key: 'parkingPointNames', width: 180 },
  { title: '云台角度', dataIndex: 'ptzSummary', key: 'ptzSummary', width: 180 },
  { title: '检测顺序', dataIndex: 'sequence', key: 'sequence', width: 100 },
  { title: '巡检状态', key: 'inspectionStatus', width: 120 },
  { title: '设施数', key: 'deviceCount', width: 80 },
  { title: '巡检对象数', key: 'deviceCount', width: 80 },
  { title: '检测规则数', key: 'inspectionItemCount', width: 80 },
  { title: '漏检数', key: 'missedItemCount', width: 80 },
  { title: '时间范围', key: 'timeRange', width: 260 }
]

const deviceColumns = [
  { title: '区域', dataIndex: 'areaName', key: 'areaName', width: 120 },
  { title: '装置', dataIndex: 'installationName', key: 'installationName', width: 140 },
  { title: '设施/管路', dataIndex: 'name', key: 'name', width: 160 },
  { title: '巡检对象', dataIndex: 'componentNames', key: 'componentNames', width: 200 },
  { title: '检测规则', key: 'checkItems' },
  { title: '采集动作', key: 'collectionAction', width: 160 },
  { title: '状态', key: 'status', width: 110 },
  { title: '检测结果', key: 'result', width: 110 },
  { title: '监测时间', key: 'inspectTime', width: 190 }
]

const evidenceColumns = [
  { title: '巡检点', dataIndex: 'pointName', key: 'pointName', width: 160 },
  { title: '停车点/经过点', dataIndex: 'parkingPoint', key: 'parkingPoint', width: 180 },
  { title: '采集动作', dataIndex: 'collectionAction', key: 'collectionAction', width: 180 },
  { title: '巡检对象编号/位号', dataIndex: 'componentRef', key: 'componentRef', width: 180 },
  { title: '命中规则', dataIndex: 'ruleName', key: 'ruleName', width: 150 },
  { title: '规则结果', dataIndex: ['evidence', 'recognizedValue'], key: 'ruleResult', width: 140 },
  { title: '是否生成告警', dataIndex: 'generatesAlert', key: 'generatesAlert', width: 120 },
  { title: '检测规则', dataIndex: 'ruleName', key: 'ruleName', width: 150 },
  { title: '结果状态', key: 'qualityStatus', width: 130 },
  { title: '覆盖口径', key: 'coverage', width: 110 },
  { title: '证据', key: 'evidence', width: 160 },
  { title: '采样时间', dataIndex: ['evidence', 'sampledAt'], key: 'sampledAt', width: 190 },
  { title: '机器人位姿', key: 'robotPose', width: 180 },
  { title: '云台/焦距', key: 'ptz', width: 160 },
  { title: '识别值', key: 'recognizedValue', width: 140 },
  { title: '气体值', key: 'gasValue', width: 120 },
  { title: '置信度', key: 'confidence', width: 100 },
  { title: '规则版本', key: 'ruleVersion', width: 110 },
  { title: '人工复核', key: 'manualReview', width: 180 },
  { title: '历史回放', dataIndex: 'playbackEntry', key: 'playbackEntry', width: 120 },
  { title: '第三方回传', dataIndex: 'feedbackStatus', key: 'feedbackStatus', width: 120 }
]

const mapStageStyle = computed(() => ({
  backgroundImage: `url(${fallbackMapBackgroundUrl})`
}))

const currentSequence = computed(() => {
  if (!task.value) return 0
  if (task.value.status === 'pending') return 0
  if (task.value.status === 'completed') return inspectionPoints.value.length >= 2 ? inspectionPoints.value.length : 5
  return Math.max(0, Number(task.value.currentInspectionPointIndex || 1))
})

const traceProgressPercent = computed(() => {
  if (!tracePoints.value.length) return 0
  return Math.min(100, Math.round((currentSequence.value / tracePoints.value.length) * 100))
})

const tracePoints = computed<TracePoint[]>(() => {
  const fallback = [
    { id: 'mock-1', name: 'A区入口巡检点', mapPosition: { x: 18, y: 62 } },
    { id: 'mock-2', name: '1号循环泵巡检点', mapPosition: { x: 34, y: 46 } },
    { id: 'mock-3', name: '反应釜北侧巡检点', mapPosition: { x: 56, y: 38 } },
    { id: 'mock-4', name: '危化仓入口巡检点', mapPosition: { x: 74, y: 55 } },
    { id: 'mock-5', name: '北侧充电站', mapPosition: { x: 86, y: 28 } }
  ]
  const source = inspectionPoints.value.length >= 2 ? inspectionPoints.value : fallback

  return source.map((point: any, index: number) => {
    const sequence = index + 1
    return {
      id: point.id,
      name: point.name,
      sequence,
      x: normalizeTraceCoordinate(point.mapPosition?.x ?? 14 + index * 18),
      y: normalizeTraceCoordinate(point.mapPosition?.y ?? 58 - index * 6),
      statusText: sequence <= currentSequence.value ? '已执行' : sequence === currentSequence.value + 1 ? '当前目标' : '待执行'
    }
  })
})

const routeLines = computed<RouteLine[]>(() => tracePoints.value.slice(0, -1).map((from: TracePoint, index: number) => ({
  id: `line-${from.id}-${tracePoints.value[index + 1].id}`,
  from,
  to: tracePoints.value[index + 1],
  completed: index + 1 <= currentSequence.value
})))

const robotPosition = computed(() => {
  if (!tracePoints.value.length) return { x: 50, y: 50 }
  if (currentSequence.value <= 0) return { x: tracePoints.value[0].x, y: tracePoints.value[0].y }
  const completedIndex = Math.min(Math.max(currentSequence.value - 1, 0), tracePoints.value.length - 1)
  const current = tracePoints.value[completedIndex]
  const next = tracePoints.value[completedIndex + 1]
  if (!next) return { x: current.x, y: current.y }
  return {
    x: Number((current.x * 0.65 + next.x * 0.35).toFixed(2)),
    y: Number((current.y * 0.65 + next.y * 0.35).toFixed(2))
  }
})

const currentLocationLabel = computed(() => {
  if (!tracePoints.value.length) return '-'
  if (currentSequence.value <= 0) return `${tracePoints.value[0].name} 待出发`
  const current = tracePoints.value[Math.min(currentSequence.value - 1, tracePoints.value.length - 1)]
  return `${current.name} 附近`
})

const completedRouteCount = computed(() => routeLines.value.filter((line: RouteLine) => line.completed).length)
const pendingRouteCount = computed(() => routeLines.value.filter((line: RouteLine) => !line.completed).length)

const traceSteps = computed(() => {
  const start = task.value ? getTaskStart(task.value) : new Date()
  const steps = [
    { id: 'start', title: '任务下发', description: '总调度台下发执行任务，机器人接收路线与采集动作快照。', color: 'green' },
    ...tracePoints.value.map((point: TracePoint) => ({
      id: point.id,
      title: `${point.statusText}：${point.name}`,
      description: point.sequence <= currentSequence.value ? '已到达并完成采集动作。' : '等待机器人按路线前往执行。',
      color: point.sequence <= currentSequence.value ? 'green' : point.sequence === currentSequence.value + 1 ? 'blue' : 'gray'
    }))
  ]
  return steps.map((step, index) => ({
    ...step,
    time: new Date(start.getTime() + index * 8 * 60 * 1000).toLocaleString()
  }))
})

function normalizeTraceCoordinate(value: number) {
  if (!Number.isFinite(value)) return 50
  if (value > 100) return Math.max(4, Math.min(96, value / 10))
  return Math.max(4, Math.min(96, value))
}

function getStatusText(status?: string) {
  return ({ pending: '待执行', running: '执行中', completed: '已完成', paused: '已暂停', cancelled: '已取消', failed: '失败' } as Record<string, string>)[status || ''] || '-'
}

function getStatusColor(status?: string) {
  return ({ pending: 'default', running: 'blue', completed: 'green', paused: 'orange', cancelled: 'default', failed: 'red' } as Record<string, string>)[status || ''] || 'default'
}

function getSceneText(scene?: string) {
  return ({ daily_inspection: '日常巡检', hazard_screening: '隐患排查', environment_check: '环境检查', operation_guard: '作业监护', work_ticket_guard: '作业票监护', emergency_arrival: '应急到场' } as Record<string, string>)[scene || ''] || '日常巡检'
}

function getSceneColor(scene?: string) {
  return ({ daily_inspection: 'blue', hazard_screening: 'volcano', environment_check: 'green', operation_guard: 'purple', work_ticket_guard: 'gold', emergency_arrival: 'red' } as Record<string, string>)[scene || ''] || 'blue'
}

function getTaskSourceText(source?: string) {
  return ({
    execution_plan: '执行规划派生',
    dispatch_insert: '总调度台插单',
    auto_recheck: '自动补检',
    work_ticket: '作业票/第三方下发',
    third_party: '作业票/第三方下发',
    emergency: '事故/异常快速到场',
    manual: '人工创建',
    manual_plan: '执行规划派生',
    auto_plan: '执行规划派生'
  } as Record<string, string>)[source || ''] || '执行规划派生'
}

function getPlanTypeText(type?: string) {
  return ({ manual: '人工', auto: '自动' } as Record<string, string>)[type || ''] || '人工'
}

function getRiskText(level?: string) {
  return ({ normal: '普通', warning: '预警', alarm: '告警', critical_alarm: '严重告警', hazard: '隐患', major_hazard: '重大隐患' } as Record<string, string>)[level || ''] || '普通'
}

function getRiskColor(level?: string) {
  return ({ normal: 'default', warning: 'gold', alarm: 'orange', critical_alarm: 'red', hazard: 'volcano', major_hazard: 'magenta' } as Record<string, string>)[level || ''] || 'default'
}

function getPointStatusColor(status: string) {
  return ({ '已检': 'green', '待检': 'default', '检测中': 'blue', '存在不可检': 'orange' } as Record<string, string>)[status] || 'default'
}

function getPointInspectionStatus(index: number) {
  if (!task.value) return '待检'
  if (task.value.status === 'completed') return '已检'
  if (task.value.status === 'running') {
    const currentIndex = Math.max(0, Number(task.value.currentInspectionPointIndex || 0))
    if (index < currentIndex) return '已检'
    if (index === currentIndex) return '检测中'
    return '待检'
  }
  if (task.value.status === 'failed' || task.value.status === 'cancelled') {
    const currentIndex = Math.max(0, Number(task.value.currentInspectionPointIndex || 0))
    return index < currentIndex ? '已检' : '待检'
  }
  return '待检'
}

function getMissedItemCount(pointId: string, itemCount: number, inspectionStatus: string) {
  if (inspectionStatus === '待检' || itemCount === 0) return 0
  const pointNo = Number(String(pointId).match(/\d+$/)?.[0] || 0)
  return pointNo % (itemCount + 1)
}

function getQualityStatusText(status: string) {
  return ({
    normal: '正常',
    warning: '预警',
    alarm: '告警',
    critical_alarm: '严重告警',
    skipped: '跳过',
    not_arrived: '未到达',
    blocked: '被遮挡',
    bad_angle: '视角不足',
    blurred: '模糊',
    reflection: '反光',
    target_missing: '目标缺失',
    unreadable: '无法读取',
    uninspectable: '不可检',
    monitor_failure: '监测失效',
    unknown: '未知'
  } as Record<string, string>)[status] || status
}

function getQualityStatusColor(status: string) {
  return ({
    normal: 'green',
    warning: 'gold',
    alarm: 'orange',
    critical_alarm: 'red',
    skipped: 'default',
    not_arrived: 'volcano',
    blocked: 'orange',
    bad_angle: 'purple',
    blurred: 'cyan',
    reflection: 'blue',
    target_missing: 'magenta',
    unreadable: 'red',
    uninspectable: 'volcano',
    monitor_failure: 'red',
    unknown: 'default'
  } as Record<string, string>)[status] || 'default'
}

function isEffectiveCoverage(status: string) {
  return ['normal', 'warning', 'alarm', 'critical_alarm'].includes(status)
}

function getDetectionValue(item: any, deviceNo: number) {
  const unit = String(item.unit || '')
  const name = String(item.name || '')
  if (name.includes('温度') || unit.includes('℃') || unit.includes('°C')) {
    return `${12 + (deviceNo % 9)}°C`
  }
  if (name.includes('压力') || unit.includes('MPa')) {
    return `${(0.8 + (deviceNo % 6) * 0.3).toFixed(1)}MPa`
  }
  if (name.includes('液位') || unit === 'm') {
    return `${(2 + (deviceNo % 5) * 0.6).toFixed(1)}m`
  }
  if (unit) {
    return `${(5 + (deviceNo % 7)).toFixed(1)}${unit}`
  }
  return `${5 + (deviceNo % 7)}`
}

function getRobotName(robotId?: string) {
  if (!robotId) return '-'
  return robotStore.robots.find((robot: any) => robot.id === robotId)?.name || robotId
}

function getPlanName(planId?: string) {
  if (!planId) return '-'
  return inspectionStore.inspectionPlans.find((plan: any) => plan.id === planId)?.name || '-'
}

const showPlanName = computed(() => task.value?.planId ? getPlanName(task.value.planId) : '-')
const taskPlan = computed<any>(() => task.value?.planId ? inspectionStore.inspectionPlans.find((plan: any) => plan.id === task.value.planId) : undefined)
const displayPlanType = computed(() => (task.value?.name === '每日例行巡检' || task.value?.planId === 'plan-001') ? 'auto' : (taskPlan.value?.planType || 'manual'))

const regionOptions = computed(() => {
  const regionMap = new Map<string, string>()
  inspectionStore.inspectionMaps.forEach((map: any) => {
    ;(map.regions || []).forEach((region: any) => regionMap.set(region.id, `${map.name} / ${region.name}`))
  })
  return Array.from(regionMap.entries()).map(([id, name]) => ({ id, name }))
})

function getRegionName(regionId?: string) {
  if (!regionId) return '未配置区域'
  return regionOptions.value.find((region) => region.id === regionId)?.name || regionId
}

const taskRegionIds = computed(() => {
  if (taskPlan.value?.regionIds?.length) return [...new Set(taskPlan.value.regionIds)]
  return [...new Set(inspectionPoints.value.filter((point: any) => point.areaId).map((point: any) => point.areaId))]
})

const taskRegionNames = computed(() => taskRegionIds.value.map((id: string) => getRegionName(id)))

const taskFacilities = computed(() => inspectionStore.inspectionDevices.filter((device: any) => {
  if (taskPlan.value?.facilityIds?.length) return taskPlan.value.facilityIds.includes(device.id)
  return taskRegionIds.value.includes(device.areaId) || (task.value?.inspectionPointIds || []).includes(device.inspectionPointId)
}))

function getDeviceRuleCount(device: any) {
  const ruleIds = new Set<string>()
  ;(device.objectDetectionConfigs || []).forEach((config: any) => {
    if (config.enabled && config.ruleId) ruleIds.add(config.ruleId)
  })
  ;(device.assetComponents || []).forEach((component: any) => (component.ruleIds || []).forEach((ruleId: string) => ruleIds.add(ruleId)))
  return ruleIds.size
}

const taskMapName = computed(() => inspectionStore.inspectionMaps.find((map: any) => map.id === inspectionPoints.value[0]?.mapId)?.name || '默认厂区地图')
const taskComponentCount = computed(() => taskFacilities.value.reduce((sum: number, device: any) => sum + (device.assetComponents?.length || 0), 0))
const taskRuleCount = computed(() => {
  const ruleIds = new Set<string>()
  taskFacilities.value.forEach((device: any) => {
    ;(device.objectDetectionConfigs || []).forEach((config: any) => {
      if (config.enabled && config.ruleId) ruleIds.add(config.ruleId)
    })
    ;(device.assetComponents || []).forEach((component: any) => (component.ruleIds || []).forEach((ruleId: string) => ruleIds.add(ruleId)))
  })
  return ruleIds.size
})
const taskFeedbackStatus = computed(() => task.value?.feedbackStatus === 'pending' ? '待回传' : task.value?.feedbackStatus === 'success' ? '已回传' : task.value?.feedbackStatus === 'failed' ? '回传失败' : '-')

function getTaskStart(taskValue: any) {
  return taskValue?.schedule?.startTime ? new Date(taskValue.schedule.startTime) : new Date(taskValue?.createdAt || Date.now())
}

function getTaskEnd(taskValue: any) {
  if (taskValue?.schedule?.endTime) return new Date(taskValue.schedule.endTime)
  return new Date(getTaskStart(taskValue).getTime() + ((taskValue?.inspectionPointIds?.length || 1) * 8 * 60 * 1000))
}

function getPlannedTimeText(taskValue: any) {
  return getTaskStart(taskValue).toLocaleString()
}

function getDurationText(taskValue: any) {
  const start = getTaskStart(taskValue)
  const end = getTaskEnd(taskValue)
  const diffMs = end.getTime() - start.getTime()
  if (diffMs <= 0) return '-'
  const totalMinutes = Math.floor(diffMs / 60000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  if (hours > 0) return `${hours}小时${minutes > 0 ? minutes + '分钟' : ''}`
  return `${minutes}分钟`
}

function getActualTimeText(taskValue: any) {
  const start = getTaskStart(taskValue)
  if (taskValue?.status === 'pending') return '-'
  if (taskValue?.status === 'running') return `${start.toLocaleString()} ~ 进行中...`
  const end = getTaskEnd(taskValue)
  return `${start.toLocaleString()} ~ ${end.toLocaleString()}`
}

const inspectionPointRows = computed(() => {
  const start = task.value ? getTaskStart(task.value) : new Date()
  return inspectionPoints.value.map((point: any, index: number) => {
    const pointStart = new Date(start.getTime() + index * 8 * 60 * 1000)
    const pointEnd = new Date(pointStart.getTime() + 8 * 60 * 1000)
    const itemCount = (taskSnapshot.value?.collectionActions || []).filter((action: any) => action.inspectionPointId === point.id).length
    const inspectionStatus = getPointInspectionStatus(index)
    return {
      ...point,
      sequence: index + 1,
      areaName: point.areaName || '-',
      parkingPointNames: (point.parkingPoints || []).map((item: any) => item.name).join('、') || '-',
      ptzSummary: (point.parkingPoints || []).flatMap((item: any) => item.collectionPoses || []).slice(0, 1).map((pose: any) => `Yaw ${pose.ptzYaw} / Pitch ${pose.ptzPitch}`).join('、') || '-',
      inspectionStatus,
      inspectionItemCount: itemCount,
      missedItemCount: getMissedItemCount(point.id, itemCount, inspectionStatus),
      timeRange: `${pointStart.toLocaleString()} ~ ${pointEnd.toLocaleString()}`
    }
  })
})

const deviceRows = computed(() => {
  const opticalImage = new URL('../../../设备.png', import.meta.url).href
  const thermalImage = new URL('../../../车间.png', import.meta.url).href
  const taskStart = task.value ? getTaskStart(task.value) : new Date()
  return taskFacilities.value.map((device: any) => {
      const deviceNo = Number(String(device.id).replace(/\D/g, '')) || 0
      const isChecked = deviceNo % 2 === 1
      const result = isChecked ? (deviceNo % 3 === 0 ? '异常' : '正常') : '-'
      const inspectTime = isChecked
        ? new Date(taskStart.getTime() + (deviceNo % 7) * 6 * 60 * 1000).toLocaleString()
        : '-'
      const pointNames = Array.from(new Set((device.parkingPointBindings || []).map((binding: any) => binding.inspectionPointName).filter(Boolean)))
      return {
        id: device.id,
        name: device.name,
        areaName: device.areaName || getRegionName(device.areaId),
        pointNames: pointNames.join('、') || '-',
        installationName: device.installationName || '-',
        componentNames: (device.assetComponents || []).map((c: any) => c.name).join('、') || '-',
        ruleCount: getDeviceRuleCount(device),
        status: isChecked ? '已检测' : '待检测',
        result,
        detectionData: '-',
        inspectTime,
        opticalShot: opticalImage,
        thermalShot: thermalImage,
        collectionAction: '停车采集 + 云台对焦',
        checkItems: '',
        primaryCount: 0,
        secondaryCount: 0
      }
    })
    .map((row: any) => {
      const items = inspectionStore.inspectionDeviceCheckItems.filter((item: any) => item.deviceId === row.id)
      const deviceNo = Number(String(row.id).replace(/\D/g, '')) || 0
      return {
        ...row,
        checkItems: items.map((item: any) => item.name).join('、') || '-',
        detectionData: row.status === '已检测'
          ? (items.map((item: any) => `${item.name} ${getDetectionValue(item, deviceNo)}`).join('；') || '-')
          : '-',
        primaryCount: items.filter((item: any) => item.priority === 'primary').length,
        secondaryCount: items.filter((item: any) => (item.priority || 'secondary') !== 'primary').length
      }
    })
})

const collectionActionRows = computed(() => {
  const opticalImage = new URL('../../../设备.png', import.meta.url).href
  const thermalImage = new URL('../../../车间.png', import.meta.url).href
  const rows: Array<{
    id: string
    pointName: string
    parkingPoint: string
    collectionAction: string
      componentRef: string
      generatesAlert: string
      playbackEntry: string
      feedbackStatus: string
    ruleName: string
    ptz: string
    gasValue: string
    qualityStatus: string
    evidence: EvidenceChain
  }> = []

  const resultMap = new Map(taskResults.value.map(result => [result.collectionActionId, result]))
  ;(taskSnapshot.value?.collectionActions || []).forEach((action, index) => {
    const result = resultMap.get(action.id)
    const qualityStatus = String(result?.qualityStatus || result?.status || 'unknown')
    rows.push({
      id: action.id,
      pointName: action.pointName,
      parkingPoint: action.parkingPointName,
      collectionAction: action.collectionAction,
      componentRef: action.targetObject,
      generatesAlert: result?.exceptionLogId ? '是' : '否',
      playbackEntry: '历史回放',
      feedbackStatus: '待回传',
      ruleName: action.ruleName || (action.ruleId ? `${action.ruleId}-V1` : '默认大模型规则'),
      ptz: `Yaw ${(index * 18) % 360}° / Pitch ${-8 + index}° / 焦距 ${28 + index * 2}mm`,
      gasValue: index % 3 === 0 ? `${18 + index}%LEL` : '-',
      qualityStatus,
      evidence: result?.evidence || {
        opticalImageUrl: opticalImage,
        thermalImageUrl: thermalImage,
        sampledAt: new Date().toLocaleString(),
        robotPose: `X${120 + index * 3}, Y${86 + index * 2}, Yaw${(index * 18) % 360}°`,
        recognizedValue: getQualityStatusText(qualityStatus),
        confidence: 0.5,
        ruleVersion: action.ruleId ? `${action.ruleId}-V1` : 'DEFAULT-V1',
        manualReviewConclusion: '需人工复核'
      }
    })
  })

  return rows
})

function goBack() {
  router.back()
}

onMounted(() => {
  inspectionStore.initialize()
  robotStore.initialize()
  task.value = inspectionStore.getTaskById(route.params.id as string)
  if (task.value) {
    const seed = String(task.value.id || '')
    const sceneOptions = ['daily_inspection', 'hazard_screening', 'environment_check', 'operation_guard']
    const sourceOptions = ['execution_plan', 'dispatch_insert', 'auto_recheck', 'work_ticket', 'third_party', 'emergency', 'manual']
    const riskOptions = ['normal', 'warning', 'alarm', 'critical_alarm', 'hazard', 'major_hazard']
      task.value = {
        ...task.value,
      businessScene: task.value.businessScene || taskPlan.value?.businessScene || sceneOptions[seed.length % sceneOptions.length],
      taskSource: task.value.taskSource || (taskPlan.value ? 'execution_plan' : sourceOptions[seed.length % sourceOptions.length]),
      riskLevel: task.value.riskLevel || taskPlan.value?.riskLevel || riskOptions[seed.length % riskOptions.length]
    }
  }
  taskSnapshot.value = inspectionStore.ensureTaskExecutionData(route.params.id as string)
  taskResults.value = inspectionStore.getInspectionTaskResultsByTaskId(route.params.id as string)
  inspectionPoints.value = (task.value?.inspectionPointIds || []).map((id: string) => inspectionStore.getInspectionPointById(id)).filter(Boolean)
})
</script>

<style scoped lang="css">
.shot-thumb {
  width: 64px;
  height: 44px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}

.trace-summary {
  margin-bottom: 16px;
}

.trace-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 340px;
  gap: 16px;
}

.trace-map-card,
.trace-step-card {
  min-width: 0;
}

.trace-map-stage {
  position: relative;
  height: min(54vh, 560px);
  min-height: 420px;
  overflow: hidden;
  border: 1px solid rgba(107, 142, 173, 0.26);
  border-radius: 10px;
  background-color: #05080e;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

.map-mask {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(5, 8, 14, 0.1) 0%, rgba(5, 8, 14, 0.26) 100%);
}

.map-grid {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background-image:
    linear-gradient(rgba(107, 142, 173, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(107, 142, 173, 0.08) 1px, transparent 1px);
  background-size: 42px 42px;
}

.route-layer {
  position: absolute;
  inset: 0;
  z-index: 2;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.route-completed,
.route-pending {
  stroke-width: 0.55;
  stroke-linecap: round;
}

.route-completed {
  stroke: #22c55e;
  opacity: 0.95;
}

.route-pending {
  stroke: #f59e0b;
  stroke-dasharray: 1.2 1;
  opacity: 0.92;
}

.trace-marker,
.robot-marker {
  position: absolute;
  z-index: 3;
  display: flex;
  align-items: flex-start;
  gap: 6px;
  transform: translate(-50%, -50%);
}

.marker-dot,
.robot-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  border: 2px solid rgba(255, 255, 255, 0.86);
  background: #64748b;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
}

.trace-marker.completed .marker-dot {
  background: #16a34a;
}

.trace-marker.current .marker-dot {
  background: #2563eb;
}

.robot-marker {
  z-index: 4;
}

.robot-dot {
  width: 22px;
  height: 22px;
  background: #ef4444;
  box-shadow: 0 0 0 5px rgba(239, 68, 68, 0.22), 0 4px 10px rgba(0, 0, 0, 0.36);
}

.marker-label,
.robot-label {
  max-width: 180px;
  padding: 5px 8px;
  color: #dbeafe;
  font-size: 11px;
  line-height: 1.35;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
  background: rgba(15, 23, 42, 0.76);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 7px;
}

.strong {
  color: #f8fafc;
  font-weight: 700;
}

.map-legend {
  position: absolute;
  left: 14px;
  bottom: 14px;
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 8px 10px;
  color: #e2e8f0;
  font-size: 12px;
  background: rgba(15, 23, 42, 0.78);
  border: 1px solid rgba(148, 163, 184, 0.3);
  border-radius: 8px;
}

.legend-line {
  display: inline-block;
  width: 24px;
  height: 0;
  margin-right: 4px;
  vertical-align: middle;
  border-top: 3px solid #22c55e;
}

.legend-line.dashed {
  border-top-color: #f59e0b;
  border-top-style: dashed;
}

.legend-dot {
  display: inline-block;
  width: 10px;
  height: 10px;
  margin-right: 4px;
  vertical-align: middle;
  border-radius: 50%;
}

.legend-dot.robot {
  background: #ef4444;
}

.legend-dot.point {
  background: #2563eb;
}

.step-title {
  font-weight: 700;
  color: #1f2937;
}

.step-meta {
  margin-top: 2px;
  color: #667085;
  font-size: 12px;
}

.step-desc {
  margin-top: 4px;
  color: #4b5563;
}

@media (max-width: 1200px) {
  .trace-layout {
    grid-template-columns: 1fr;
  }

  .trace-map-stage {
    min-height: 360px;
  }
}
</style>
      generatesAlert: index % 3 === 0 ? '是' : '否',
      playbackEntry: '查看回放',
      feedbackStatus: index % 4 === 0 ? '待回传' : '已回传',
