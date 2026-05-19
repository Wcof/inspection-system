<template>
  <div class="execution-trace">
    <a-page-header title="执行轨迹" sub-title="展示机器人执行任务的实时定位、已执行路线和待执行路线" @back="goBack" />

    <a-card style="margin-top: 16px">
      <a-descriptions bordered :column="4" size="small">
        <a-descriptions-item label="任务名称">{{ task?.name || '-' }}</a-descriptions-item>
        <a-descriptions-item label="任务编码">{{ task?.code || '-' }}</a-descriptions-item>
        <a-descriptions-item label="执行机器人">{{ robotName }}</a-descriptions-item>
        <a-descriptions-item label="执行状态">
          <a-tag :color="getStatusColor(task?.status)">{{ getStatusText(task?.status) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="当前定位">{{ currentLocationLabel }}</a-descriptions-item>
        <a-descriptions-item label="已执行">{{ completedRouteCount }} 段</a-descriptions-item>
        <a-descriptions-item label="未执行">{{ pendingRouteCount }} 段</a-descriptions-item>
        <a-descriptions-item label="任务进度">{{ progressPercent }}%</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <div class="trace-layout">
      <a-card class="trace-map-card" title="轨迹地图">
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
              <div class="strong">{{ robotName }}</div>
              <div>当前位置 · {{ progressPercent }}%</div>
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

      <a-card title="执行步骤" class="trace-step-card">
        <a-timeline>
          <a-timeline-item v-for="step in traceSteps" :key="step.id" :color="step.color">
            <div class="step-title">{{ step.title }}</div>
            <div class="step-meta">{{ step.time }}</div>
            <div class="step-desc">{{ step.description }}</div>
          </a-timeline-item>
        </a-timeline>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import { useRobotStore } from '@/stores/robot'

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()
const robotStore = useRobotStore()
const taskId = ref(route.params.id as string)
const task = ref<any>()
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

const mapStageStyle = computed(() => ({
  backgroundImage: `url(${fallbackMapBackgroundUrl})`
}))

const robotName = computed(() => robotStore.robots.find((robot: any) => robot.id === task.value?.robotId)?.name || task.value?.robotId || '机器人A001')
const currentSequence = computed(() => Math.max(0, Number(task.value?.currentInspectionPointIndex || 1)))
const progressPercent = computed(() => tracePoints.value.length ? Math.min(100, Math.round((currentSequence.value / tracePoints.value.length) * 100)) : 0)

const tracePoints = computed<TracePoint[]>(() => {
  const points = (task.value?.inspectionPointIds || [])
    .map((id: string) => inspectionStore.getInspectionPointById(id))
    .filter(Boolean)

  const fallback = [
    { id: 'mock-1', name: 'A区入口巡检点', mapPosition: { x: 18, y: 62 } },
    { id: 'mock-2', name: '1号循环泵巡检点', mapPosition: { x: 34, y: 46 } },
    { id: 'mock-3', name: '反应釜北侧巡检点', mapPosition: { x: 56, y: 38 } },
    { id: 'mock-4', name: '危化仓入口巡检点', mapPosition: { x: 74, y: 55 } },
    { id: 'mock-5', name: '北侧充电站', mapPosition: { x: 86, y: 28 } }
  ]

  const source = points.length >= 2 ? points : fallback
  return source.map((point: any, index: number) => {
    const sequence = index + 1
    const x = normalizeCoordinate(point.mapPosition?.x ?? 14 + index * 18)
    const y = normalizeCoordinate(point.mapPosition?.y ?? 58 - index * 6)
    return {
      id: point.id,
      name: point.name,
      sequence,
      x,
      y,
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
  const current = tracePoints.value[Math.min(currentSequence.value, tracePoints.value.length - 1)]
  return current ? `${current.name} 附近` : '-'
})

const completedRouteCount = computed(() => routeLines.value.filter((line: RouteLine) => line.completed).length)
const pendingRouteCount = computed(() => routeLines.value.filter((line: RouteLine) => !line.completed).length)

const traceSteps = computed(() => {
  const start = task.value?.schedule?.startTime ? new Date(task.value.schedule.startTime) : new Date(task.value?.createdAt || Date.now())
  const steps = [
    { id: 'start', title: '任务下发', description: '总调度台下发执行任务，机器人接收路线与采集动作快照。', color: 'green' },
    ...tracePoints.value.map((point: TracePoint, index: number) => ({
      id: point.id,
      title: `${point.statusText}：${point.name}`,
      description: index + 1 <= currentSequence.value ? '已到达并完成采集动作。' : '等待机器人按路线前往执行。',
      color: index + 1 <= currentSequence.value ? 'green' : index + 1 === currentSequence.value + 1 ? 'blue' : 'gray'
    }))
  ]
  return steps.map((step, index) => ({
    ...step,
    time: new Date(start.getTime() + index * 8 * 60 * 1000).toLocaleString()
  }))
})

function normalizeCoordinate(value: number) {
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

function goBack() {
  router.push(`/management/task/detail/${taskId.value}`)
}

onMounted(() => {
  inspectionStore.initialize()
  robotStore.initialize()
  task.value = inspectionStore.getTaskById(taskId.value) || {
    id: taskId.value,
    name: '临时补检任务',
    code: `TASK-${taskId.value}`,
    robotId: 'robot-001',
    status: 'running',
    currentInspectionPointIndex: 2,
    inspectionPointIds: ['point-001', 'point-002', 'point-003'],
    createdAt: new Date(),
    schedule: {
      startTime: new Date(Date.now() - 18 * 60 * 1000),
      endTime: new Date(Date.now() + 32 * 60 * 1000)
    }
  }
})
</script>

<style scoped>
.execution-trace {
  width: 100%;
}
.trace-layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 360px;
  gap: 16px;
  margin-top: 16px;
}
.trace-map-card,
.trace-step-card {
  min-width: 0;
}
.trace-map-stage {
  position: relative;
  height: min(62vh, 620px);
  min-height: 460px;
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
    min-height: 380px;
  }
}
</style>
