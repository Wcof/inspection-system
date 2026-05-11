<template>
  <a-card class="map-card" title="地图">
    <template #extra>
      <a-button type="link" @click="fullscreenVisible = true">全屏</a-button>
    </template>

    <div class="map-stage" :style="mapStageStyle" @contextmenu.prevent="handleContextCreate">
      <div class="map-mask"></div>
      <div class="map-grid"></div>

      <svg class="route-layer" viewBox="0 0 100 100" preserveAspectRatio="none">
        <g v-for="line in routeLines" :key="line.id">
          <line :x1="line.from.x" :y1="line.from.y" :x2="line.to.x" :y2="line.to.y" class="route-backbone" />
        </g>
      </svg>

      <div
        v-for="marker in visibleMarkers"
        :key="marker.id"
        class="marker"
        :class="markerClass(marker)"
        :style="{ left: `${marker.x}%`, top: `${marker.y}%` }"
        :title="markerTitle(marker)"
        @click="handleMarkerClick(marker)"
        @contextmenu.stop.prevent="handleMarkerContext(marker)"
      >
        <template v-if="marker.markerType === 'robot'">
          <div class="marker-node robot-node" :class="`status-${marker.status || 'running'}`">
            <span class="pin robot"></span>
            <div class="mini-text">
              <div class="line strong">{{ marker.label }} · {{ (marker.speedKmh ?? 0).toFixed(1) }}km/h</div>
              <div class="line">{{ marker.taskShortName || '待命任务' }}</div>
              <div class="line status" :class="`status-${marker.status || 'running'}`">{{ getRobotStatusText(marker.status || 'running') }}</div>
            </div>
          </div>
        </template>

        <template v-else-if="marker.markerType === 'inspection'">
          <div class="marker-node inspection-node" :class="`status-${marker.status || 'pending'}`">
            <span class="pin inspection"></span>
            <div class="mini-text">
              <div class="line strong">{{ marker.label }}</div>
              <div class="line">今日 {{ marker.todayPlannedCount ?? 0 }} 次 / 已巡 {{ marker.inspectedCount ?? 0 }} 次</div>
              <div class="line status" :class="`status-${marker.status || 'pending'}`">{{ getPointStatusText(marker.status || 'pending') }}</div>
            </div>
          </div>
        </template>

        <template v-else-if="marker.markerType === 'charging'">
          <div class="marker-node charging-node" :class="`status-${marker.status || 'charging'}`">
            <span class="pin charging">⚡</span>
            <div class="mini-text">
              <div class="line strong">{{ marker.label }}</div>
              <div class="line">充电中 {{ marker.chargingCount ?? 0 }} 台 / 停放 {{ marker.parkedCount ?? 0 }} 台</div>
            </div>
          </div>
        </template>

        <template v-else-if="marker.markerType === 'parking'">
          <div class="marker-node parking-node" :class="`status-${marker.status || 'idle'}`">
            <span class="pin parking">P</span>
            <div class="mini-text">
              <div class="line strong">{{ marker.label }}</div>
              <div class="line">停放 {{ marker.parkedCount ?? 0 }} 台</div>
            </div>
          </div>
        </template>

        <template v-else>
          <span class="task-chip">{{ marker.label }}</span>
        </template>
      </div>

      <div class="map-tools">
        <button class="tool-btn">+</button>
        <button class="tool-btn">-</button>
        <button class="tool-btn">⚙</button>
      </div>
    </div>

    <div class="legend">
      <span class="legend-item" :class="{ off: !isEnabled('robot') }" @click="toggleType('robot')"><i class="dot robot"></i>机器人位置</span>
      <span class="legend-item" :class="{ off: !isEnabled('inspection') }" @click="toggleType('inspection')"><i class="dot inspection"></i>巡检点</span>
      <span class="legend-item" :class="{ off: !isEnabled('charging') }" @click="toggleType('charging')"><i class="dot charging"></i>充电站</span>
      <span class="legend-item" :class="{ off: !isEnabled('parking') }" @click="toggleType('parking')"><i class="dot parking"></i>停车点</span>
    </div>

    <a-modal
      v-model:visible="fullscreenVisible"
      title="地图全屏"
      width="92%"
      :footer="null"
      :body-style="fullscreenBodyStyle"
      wrap-class-name="dispatch-map-fullscreen-modal"
    >
      <div class="map-stage fullscreen" :style="mapStageStyle" @contextmenu.prevent="handleContextCreate">
        <div class="map-mask"></div>
        <div class="map-grid"></div>

        <svg class="route-layer" viewBox="0 0 100 100" preserveAspectRatio="none">
          <g v-for="line in routeLines" :key="`full-${line.id}`">
            <line :x1="line.from.x" :y1="line.from.y" :x2="line.to.x" :y2="line.to.y" class="route-backbone" />
          </g>
        </svg>

        <div
          v-for="marker in visibleMarkers"
          :key="`full-${marker.id}`"
          class="marker"
          :class="markerClass(marker)"
          :style="{ left: `${marker.x}%`, top: `${marker.y}%` }"
          :title="markerTitle(marker)"
          @click="handleMarkerClick(marker)"
          @contextmenu.stop.prevent="handleMarkerContext(marker)"
        >
          <template v-if="marker.markerType === 'robot'">
            <div class="marker-node robot-node" :class="`status-${marker.status || 'running'}`">
              <span class="pin robot"></span>
              <div class="mini-text">
                <div class="line strong">{{ marker.label }} · {{ (marker.speedKmh ?? 0).toFixed(1) }}km/h</div>
                <div class="line">{{ marker.taskShortName || '待命任务' }}</div>
                <div class="line status" :class="`status-${marker.status || 'running'}`">{{ getRobotStatusText(marker.status || 'running') }}</div>
              </div>
            </div>
          </template>

          <template v-else-if="marker.markerType === 'inspection'">
            <div class="marker-node inspection-node" :class="`status-${marker.status || 'pending'}`">
              <span class="pin inspection"></span>
              <div class="mini-text">
                <div class="line strong">{{ marker.label }}</div>
                <div class="line">今日 {{ marker.todayPlannedCount ?? 0 }} 次 / 已巡 {{ marker.inspectedCount ?? 0 }} 次</div>
                <div class="line status" :class="`status-${marker.status || 'pending'}`">{{ getPointStatusText(marker.status || 'pending') }}</div>
              </div>
            </div>
          </template>

          <template v-else-if="marker.markerType === 'charging'">
            <div class="marker-node charging-node" :class="`status-${marker.status || 'charging'}`">
              <span class="pin charging">⚡</span>
              <div class="mini-text">
                <div class="line strong">{{ marker.label }}</div>
                <div class="line">充电中 {{ marker.chargingCount ?? 0 }} 台 / 停放 {{ marker.parkedCount ?? 0 }} 台</div>
              </div>
            </div>
          </template>

          <template v-else-if="marker.markerType === 'parking'">
            <div class="marker-node parking-node" :class="`status-${marker.status || 'idle'}`">
              <span class="pin parking">P</span>
              <div class="mini-text">
                <div class="line strong">{{ marker.label }}</div>
                <div class="line">停放 {{ marker.parkedCount ?? 0 }} 台</div>
              </div>
            </div>
          </template>

          <template v-else>
            <span class="task-chip">{{ marker.label }}</span>
          </template>
        </div>
      </div>
    </a-modal>
  </a-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

type MarkerType = 'robot' | 'inspection' | 'charging' | 'parking'

export interface MapMarker {
  id: string
  label: string
  markerType: MarkerType
  x: number
  y: number
  status?: 'running' | 'pending' | 'completed' | 'warning' | 'charging' | 'idle'
  todayPlannedCount?: number
  inspectedCount?: number
  chargingCount?: number
  parkedCount?: number
  speedKmh?: number
  taskShortName?: string
  reason?: string
  relatedTaskId?: string
  relatedRobotId?: string
}

const props = defineProps<{ markers: MapMarker[] }>()

const emit = defineEmits<{
  (e: 'map-context-create', payload: { marker?: MapMarker; x: number; y: number }): void
}>()

const enabledTypes = ref<MarkerType[]>(['robot', 'inspection', 'charging', 'parking'])
const fullscreenVisible = ref(false)
const mapBackgroundUrl = new URL('../../../地图.png', import.meta.url).href

const visibleMarkers = computed(() => props.markers.filter(marker => enabledTypes.value.includes(marker.markerType)))
const pointMarkers = computed(() => props.markers.filter(marker => ['inspection', 'charging', 'parking'].includes(marker.markerType)).sort((a, b) => a.x - b.x))

const routeLines = computed(() => {
  const points = pointMarkers.value
  if (points.length < 2) return []
  return points.slice(0, -1).map((from, index) => ({ id: `line-${from.id}-${points[index + 1].id}`, from, to: points[index + 1] }))
})

const mapStageStyle = computed(() => ({
  backgroundImage: `url(${mapBackgroundUrl})`,
  backgroundColor: '#eff4ff'
}))
const fullscreenBodyStyle = computed(() => ({
  padding: '12px',
  background: '#0f172a'
}))

function markerClass(marker: MapMarker) {
  return `marker-${marker.markerType}`
}

function markerTitle(marker: MapMarker) {
  const typeMap: Record<MarkerType, string> = {
    robot: '机器人',
    inspection: '巡检点',
    charging: '充电站',
    parking: '停车点'
  }
  return `${typeMap[marker.markerType]}：${marker.label}`
}

function getRobotStatusText(status: MapMarker['status']) {
  if (status === 'pending') return '待执行'
  if (status === 'completed') return '已完成'
  if (status === 'warning') return '告警'
  if (status === 'charging') return '充电中'
  if (status === 'idle') return '待命'
  return '执行中'
}

function getPointStatusText(status: MapMarker['status']) {
  if (status === 'completed') return '已巡完成'
  if (status === 'warning') return '巡检异常'
  if (status === 'running') return '巡检中'
  return '待巡检'
}

function handleMarkerClick(marker: MapMarker) {
  if (!['inspection', 'charging', 'parking'].includes(marker.markerType)) return
  emit('map-context-create', { marker, x: marker.x, y: marker.y })
}

function handleMarkerContext(marker: MapMarker) {
  emit('map-context-create', { marker, x: marker.x, y: marker.y })
}

function handleContextCreate(event: MouseEvent) {
  const stage = event.currentTarget as HTMLElement
  if (!stage) return
  const rect = stage.getBoundingClientRect()
  const x = Number((((event.clientX - rect.left) / rect.width) * 100).toFixed(2))
  const y = Number((((event.clientY - rect.top) / rect.height) * 100).toFixed(2))

  const nearest = pointMarkers.value
    .map(marker => ({ marker, distance: Math.hypot(marker.x - x, marker.y - y) }))
    .sort((a, b) => a.distance - b.distance)[0]

  emit('map-context-create', { marker: nearest && nearest.distance <= 8 ? nearest.marker : undefined, x, y })
}

function toggleType(type: MarkerType) {
  const exists = enabledTypes.value.includes(type)
  enabledTypes.value = exists ? enabledTypes.value.filter(item => item !== type) : [...enabledTypes.value, type]
}

function isEnabled(type: MarkerType) {
  return enabledTypes.value.includes(type)
}
</script>

<style scoped lang="css">.map-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.map-card :deep(.ant-card-body) {
  padding: 12px;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}
.map-stage {
  position: relative;
  flex: 1;
  min-height: clamp(420px, calc(100vh - 340px), 640px);
  border: 1px solid rgba(107, 142, 173, 0.26);
  border-radius: 8px;
  background-color: #05080e;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  overflow: hidden;
}
.map-stage.fullscreen {
  height: 76vh;
  min-height: 560px;
  background-color: #05080e;
}
.map-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(5, 8, 14, 0.12) 0%, rgba(5, 8, 14, 0.26) 100%);
  pointer-events: none;
  z-index: 1;
}
.map-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(107, 142, 173, 0.08) 1px, transparent 1px),
    linear-gradient(90deg, rgba(107, 142, 173, 0.08) 1px, transparent 1px);
  background-size: 42px 42px;
  pointer-events: none;
  z-index: 1;
}
.route-layer {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
}
.route-backbone {
  stroke: #8ca0b9;
  stroke-width: 0.28;
  stroke-dasharray: 0.6 0.6;
  opacity: 0.72;
}
.marker {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 3;
  cursor: pointer;
}
.marker-node {
  display: inline-flex;
  align-items: flex-start;
  gap: 5px;
}
.pin {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  line-height: 1;
  margin-top: 2px;
  border: 1px solid transparent;
}
.pin.robot {
  background: rgba(59, 130, 246, 0.24);
  border-color: #3b82f6;
}
.pin.inspection {
  background: rgba(16, 185, 129, 0.24);
  border-color: #10b981;
}
.pin.charging {
  background: rgba(59, 130, 246, 0.24);
  border-color: #60a5fa;
  color: #e2e8f0;
}
.pin.parking {
  background: rgba(148, 163, 184, 0.24);
  border-color: #94a3b8;
  color: #e2e8f0;
}
.mini-text {
  font-size: 11px;
  line-height: 1.2;
  color: #dbe5f1;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.65);
  white-space: nowrap;
}
.line {
  margin-bottom: 1px;
}
.line.strong {
  color: #f1f5f9;
  font-weight: 600;
}
.line.status.status-running {
  color: #10b981;
}
.line.status.status-pending {
  color: #f59e0b;
}
.line.status.status-completed {
  color: #22c55e;
}
.line.status.status-warning {
  color: #ef4444;
}
.line.status.status-charging {
  color: #60a5fa;
}
.line.status.status-idle {
  color: #94a3b8;
}
.task-chip {
  font-size: 12px;
  color: #e2e8f0;
  white-space: nowrap;
}
.map-tools {
  position: absolute;
  right: 10px;
  bottom: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  z-index: 4;
}
.tool-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(10, 16, 26, 0.78);
  color: #e2e8f0;
  cursor: default;
}
.legend {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 10px;
  font-size: 12px;
  flex: 0 0 auto;
}
@media (max-width: 1440px), (max-height: 820px) {
  .map-stage {
    min-height: clamp(360px, 48vh, 520px);
  }
}
@media (max-width: 768px) {
  .map-card :deep(.ant-card-body) {
    padding: 8px;
  }
  .map-stage {
    min-height: 340px;
  }
  .mini-text {
    max-width: 180px;
    white-space: normal;
  }
  .legend {
    gap: 8px;
  }
}
.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  user-select: none;
  opacity: 1;
  transition: opacity 0.2s;
}
.legend-item.off {
  opacity: 0.35;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
}
.dot.robot {
  background: #3b82f6;
}
.dot.inspection {
  background: #10b981;
}
.dot.charging {
  background: #60a5fa;
}
.dot.parking {
  background: #94a3b8;
}
</style>
