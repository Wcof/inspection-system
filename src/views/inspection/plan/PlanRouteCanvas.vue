<template>
  <div class="plan-route-canvas">
    <!-- 工具栏 -->
    <div class="plan-route-canvas__toolbar">
      <div class="plan-route-canvas__toolbar-left">
        <a-button
          type="primary"
          size="small"
          :disabled="!canStartDraw"
          @click="handleStartDraw"
        >
          {{ drawButtonLabel }}
        </a-button>
        <a-button
          size="small"
          :disabled="!canDeleteLast"
          @click="handleDeleteLast"
        >
          删除末点
        </a-button>
        <a-button
          size="small"
          :disabled="!canClear"
          @click="handleClearRoute"
        >
          清除路线
        </a-button>
      </div>
      <div class="plan-route-canvas__toolbar-right">
        <span v-if="drawMode" class="plan-route-canvas__draw-hint">
          <a-badge status="processing" /> 绘制中 — 依次点击点位，右键完成绘制
        </span>
        <span v-else-if="routePointIds.length" class="plan-route-canvas__route-info">
          路线：{{ routePointIds.length }} 个点位
        </span>
      </div>
    </div>

    <!-- 主体：地图画布 + 设施列表 -->
    <div class="plan-route-canvas__body">
      <!-- SVG 地图画布 -->
      <div class="plan-route-canvas__map">
        <svg
          ref="svgRef"
          :viewBox="`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`"
          class="plan-route-canvas__svg"
          @click="handleSvgClick"
          @contextmenu.prevent="handleFinishDraw"
        >
          <!-- 地图背景 -->
          <image
            v-if="mapImageUrl"
            :href="mapImageUrl"
            x="0"
            y="0"
            :width="MAP_WIDTH"
            :height="MAP_HEIGHT"
            preserveAspectRatio="xMidYMid slice"
          />
          <rect
            v-else
            x="0"
            y="0"
            :width="MAP_WIDTH"
            :height="MAP_HEIGHT"
            fill="#f0f2f5"
          />

          <!-- 网格线 -->
          <g opacity="0.15" stroke="#94a3b8" stroke-width="0.5">
            <line v-for="i in gridLinesX" :key="'gx'+i" :x1="i" y1="0" :x2="i" :y2="MAP_HEIGHT" />
            <line v-for="i in gridLinesY" :key="'gy'+i" x1="0" :y1="i" :x2="MAP_WIDTH" :y2="i" />
          </g>

          <!-- 路线连线（已绘制的路线） -->
          <polyline
            v-if="routePoints.length >= 2"
            :points="routePolylinePoints"
            fill="none"
            stroke="#52c41a"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-dasharray="6 3"
          />

          <!-- 绘制模式临时线（最后一个点到鼠标位置） -->
          <line
            v-if="drawMode && lastRoutePoint && mousePos"
            :x1="lastRoutePoint.x"
            :y1="lastRoutePoint.y"
            :x2="mousePos.x"
            :y2="mousePos.y"
            stroke="#52c41a"
            stroke-width="1.5"
            stroke-dasharray="4 4"
            opacity="0.6"
          />

          <!-- 路线点位序号标记 -->
          <g v-for="(pt, idx) in routePoints" :key="'route-idx-' + pt.id">
            <circle
              :cx="pt.x"
              :cy="pt.y"
              r="12"
              fill="#52c41a"
              stroke="#fff"
              stroke-width="2"
            />
            <text
              :x="pt.x"
              :y="pt.y"
              text-anchor="middle"
              dominant-baseline="central"
              fill="#fff"
              font-size="10"
              font-weight="600"
            >
              {{ idx + 1 }}
            </text>
          </g>

          <!-- 途径点标记（候选点位） -->
          <g
            v-for="wp in waypointMarkers"
            :key="'wp-' + wp.id"
            class="plan-route-canvas__point"
            :class="{ 'plan-route-canvas__point--in-route': wp.inRoute }"
            @click.stop="handlePointClick(wp.id, 'waypoint')"
          >
            <circle
              :cx="wp.x"
              :cy="wp.y"
              r="7"
              :fill="wp.inRoute ? '#52c41a' : '#bfbfbf'"
              stroke="#fff"
              stroke-width="1.5"
              opacity="1"
            />
            <text
              :x="wp.x"
              :y="wp.y - 12"
              text-anchor="middle"
              fill="#333"
              font-size="10"
              opacity="0.8"
            >
              {{ wp.name }}
            </text>
          </g>

          <!-- 巡检点标记（候选点位） -->
          <g
            v-for="ip in inspectionPointMarkers"
            :key="'ip-' + ip.id"
            class="plan-route-canvas__point"
            :class="{ 'plan-route-canvas__point--in-route': ip.inRoute }"
            @click.stop="handlePointClick(ip.id, 'inspection')"
          >
            <rect
              :x="ip.x - 6"
              :y="ip.y - 6"
              width="12"
              height="12"
              rx="2"
              :fill="ip.inRoute ? '#52c41a' : getPointPrimaryColor(ip.id)"
              stroke="#fff"
              stroke-width="1.5"
              opacity="1"
            />
            <text
              :x="ip.x"
              :y="ip.y - 14"
              text-anchor="middle"
              fill="#333"
              font-size="10"
              opacity="0.8"
            >
              {{ ip.name }}
            </text>
          </g>
        </svg>

        <!-- 空状态提示 -->
        <div v-if="!waypoints.length && !inspectionPoints.length" class="plan-route-canvas__empty">
          请先选择巡检区域以加载地图点位
        </div>
      </div>

      <!-- 右侧：巡检设施列表 -->
      <div v-if="facilityPointGroups.length" class="plan-route-canvas__sidebar">
        <div class="plan-route-canvas__sidebar-title">
          巡检设施 <a-badge :count="facilityPointGroups.length" :number-style="{ backgroundColor: '#1677ff' }" />
        </div>
        <div class="plan-route-canvas__sidebar-list">
          <div
            v-for="fg in facilityPointGroups"
            :key="fg.facilityId"
            class="plan-route-canvas__facility-item"
          >
            <span class="plan-route-canvas__facility-dots">
              <span
                v-for="(color, ci) in getFacilityPointColors(fg)"
                :key="ci"
                class="plan-route-canvas__facility-dot"
                :style="{ background: color }"
              ></span>
            </span>
            <span class="plan-route-canvas__facility-name">{{ fg.facilityName }}</span>
            <span class="plan-route-canvas__facility-count">{{ fg.pointIds.length }} 点</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import type { Waypoint, InspectionPoint } from '@/types/inspection'
import mapBgImage from '@/lw.png'

// ─── 常量 ─────────────────────────────────────────────
const MAP_WIDTH = 800
const MAP_HEIGHT = 600
const GRID_STEP = 50

// ─── Props ────────────────────────────────────────────
const props = withDefaults(
  defineProps<{
    mapId: string
    waypoints: Waypoint[]
    inspectionPoints: InspectionPoint[]
    facilityPointGroups?: { facilityId: string; facilityName: string; facilityColor: string; pointIds: string[] }[]
    interactive?: boolean
  }>(),
  {
    mapId: '',
    waypoints: () => [],
    inspectionPoints: () => [],
    facilityPointGroups: () => [],
    interactive: true,
  }
)

// ─── Emits ────────────────────────────────────────────
const emit = defineEmits<{
  'route-changed': [pointIds: string[]]
}>()

// ─── Refs ─────────────────────────────────────────────
const svgRef = ref<SVGSVGElement>()
const drawMode = ref(false)
const routePointIds = ref<string[]>([])
const mousePos = ref<{ x: number; y: number } | null>(null)

// ─── 地图信息 ─────────────────────────────────────────
const mapImageUrl = computed(() => mapBgImage)

// ─── 网格线 ──────────────────────────────────────────
const gridLinesX = computed(() => {
  const lines: number[] = []
  for (let i = GRID_STEP; i < MAP_WIDTH; i += GRID_STEP) lines.push(i)
  return lines
})
const gridLinesY = computed(() => {
  const lines: number[] = []
  for (let i = GRID_STEP; i < MAP_HEIGHT; i += GRID_STEP) lines.push(i)
  return lines
})

// ─── 点位标记数据 ─────────────────────────────────────
interface PointMarker {
  id: string
  name: string
  x: number
  y: number
  type: 'waypoint' | 'inspection'
  inRoute: boolean
  routeIndex: number
}

const waypointMarkers = computed<PointMarker[]>(() =>
  props.waypoints.map(wp => {
    const idx = routePointIds.value.indexOf(wp.id)
    return {
      id: wp.id,
      name: wp.name,
      x: wp.position.x,
      y: wp.position.y,
      type: 'waypoint' as const,
      inRoute: idx >= 0,
      routeIndex: idx,
    }
  })
)

const inspectionPointMarkers = computed<PointMarker[]>(() =>
  props.inspectionPoints.map(ip => {
    const idx = routePointIds.value.indexOf(ip.id)
    const pos = ip.mapPosition || { x: 0, y: 0 }
    return {
      id: ip.id,
      name: ip.name,
      x: pos.x,
      y: pos.y,
      type: 'inspection' as const,
      inRoute: idx >= 0,
      routeIndex: idx,
    }
  })
)

// ─── 设施颜色映射（一个点可能关联多个设施 → 多色） ───
const pointColorMap = computed(() => {
  const map = new Map<string, string[]>()
  for (const group of props.facilityPointGroups) {
    for (const pid of group.pointIds) {
      const arr = map.get(pid) || []
      if (!arr.includes(group.facilityColor)) arr.push(group.facilityColor)
      map.set(pid, arr)
    }
  }
  return map
})

// 点位主色（取第一个设施颜色，无设施则灰色）
function getPointPrimaryColor(pointId: string): string {
  return pointColorMap.value.get(pointId)?.[0] || '#bfbfbf'
}

// 设施关联的点位颜色集合（去重）
function getFacilityPointColors(fg: { pointIds: string[] }): string[] {
  const colors = new Set<string>()
  for (const pid of fg.pointIds) {
    for (const c of pointColorMap.value.get(pid) || []) {
      colors.add(c)
    }
  }
  return Array.from(colors)
}

// ─── 路线点位（带坐标） ──────────────────────────────
interface RoutePointWithCoord {
  id: string
  name: string
  x: number
  y: number
}

const allPointMap = computed(() => {
  const map = new Map<string, { name: string; x: number; y: number }>()
  waypointMarkers.value.forEach(wp => map.set(wp.id, { name: wp.name, x: wp.x, y: wp.y }))
  inspectionPointMarkers.value.forEach(ip => map.set(ip.id, { name: ip.name, x: ip.x, y: ip.y }))
  return map
})

const routePoints = computed<RoutePointWithCoord[]>(() =>
  routePointIds.value
    .map(id => {
      const info = allPointMap.value.get(id)
      return info ? { id, name: info.name, x: info.x, y: info.y } : null
    })
    .filter((p): p is RoutePointWithCoord => p !== null)
)

const routePolylinePoints = computed(() =>
  routePoints.value.map(p => `${p.x},${p.y}`).join(' ')
)

const lastRoutePoint = computed(() =>
  routePoints.value.length ? routePoints.value[routePoints.value.length - 1] : null
)

// ─── 按钮状态 ─────────────────────────────────────────
const hasCandidatePoints = computed(() =>
  props.waypoints.length > 0 || props.inspectionPoints.length > 0
)

const canStartDraw = computed(() =>
  props.interactive && hasCandidatePoints.value && !drawMode.value
)

const drawButtonLabel = computed(() =>
  routePointIds.value.length > 0 ? '重新绘制路线' : '绘制路线'
)

const canDeleteLast = computed(() =>
  drawMode.value && routePointIds.value.length > 0
)

const canClear = computed(() =>
  drawMode.value || routePointIds.value.length > 0
)

// ─── 坐标转换（浏览器鼠标 → SVG 坐标） ────────────────
function clientToSvg(clientX: number, clientY: number): { x: number; y: number } | null {
  const svg = svgRef.value
  if (!svg) return null
  const rect = svg.getBoundingClientRect()
  const x = ((clientX - rect.left) / rect.width) * MAP_WIDTH
  const y = ((clientY - rect.top) / rect.height) * MAP_HEIGHT
  return { x: Math.round(x), y: Math.round(y) }
}

// ─── 查找最近的候选点位 ───────────────────────────────
function findNearestPoint(svgX: number, svgY: number, threshold = 25): string | null {
  let nearestId: string | null = null
  let nearestDist = threshold

  for (const wp of waypointMarkers.value) {
    const dist = Math.hypot(wp.x - svgX, wp.y - svgY)
    if (dist < nearestDist) {
      nearestDist = dist
      nearestId = wp.id
    }
  }
  for (const ip of inspectionPointMarkers.value) {
    const dist = Math.hypot(ip.x - svgX, ip.y - svgY)
    if (dist < nearestDist) {
      nearestDist = dist
      nearestId = ip.id
    }
  }
  return nearestId
}

// ─── 交互事件 ─────────────────────────────────────────
function handleSvgClick(e: MouseEvent) {
  if (!drawMode.value || !props.interactive) return
  const svgCoord = clientToSvg(e.clientX, e.clientY)
  if (!svgCoord) return

  const pointId = findNearestPoint(svgCoord.x, svgCoord.y)
  if (!pointId) {
    message.info('请点击候选点位以添加到路线')
    return
  }
  appendToRoute(pointId)
}

function handlePointClick(pointId: string, _type: 'waypoint' | 'inspection') {
  if (!drawMode.value || !props.interactive) return
  appendToRoute(pointId)
}

function handleSvgMouseMove(e: MouseEvent) {
  if (!drawMode.value) return
  mousePos.value = clientToSvg(e.clientX, e.clientY)
}

function handleSvgMouseLeave() {
  mousePos.value = null
}

function handleFinishDraw() {
  if (!drawMode.value) return
  if (routePointIds.value.length < 2) {
    message.warning('路线至少需要 2 个点位')
    return
  }
  drawMode.value = false
  mousePos.value = null
  message.success(`路线绘制完成，共 ${routePointIds.value.length} 个点位`)
}

// ─── 路线操作 ─────────────────────────────────────────
function appendToRoute(pointId: string) {
  routePointIds.value.push(pointId)
  emit('route-changed', [...routePointIds.value])

  const info = allPointMap.value.get(pointId)
  if (info) {
    message.success(`已添加：${info.name}`)
  }
}

function handleStartDraw() {
  if (!hasCandidatePoints.value) {
    message.info('暂无可选点位')
    return
  }
  routePointIds.value = []
  drawMode.value = true
  message.info('进入绘制模式：依次点击地图上的点位构建路线')
}

function handleDeleteLast() {
  if (!routePointIds.value.length) return
  const removed = routePointIds.value.pop()
  emit('route-changed', [...routePointIds.value])

  const info = removed ? allPointMap.value.get(removed) : null
  if (info) {
    message.info(`已移除：${info.name}`)
  }
}

function handleClearRoute() {
  routePointIds.value = []
  drawMode.value = false
  mousePos.value = null
  emit('route-changed', [])
  message.info('路线已清除')
}

// ─── Expose（供父组件调用） ───────────────────────────
function resolveRouteForSave():
  | { type: 'none' }
  | { type: 'valid'; pointIds: string[] }
  | { type: 'invalid'; message: string } {
  if (!routePointIds.value.length) {
    return { type: 'none' }
  }
  if (routePointIds.value.length < 2) {
    return { type: 'invalid', message: '路线至少需要 2 个点位' }
  }
  return { type: 'valid', pointIds: [...routePointIds.value] }
}

defineExpose({ resolveRouteForSave })

// ─── Watch ────────────────────────────────────────────
watch(() => props.mapId, () => {
  routePointIds.value = []
  drawMode.value = false
})

// SVG 鼠标事件绑定
watch(svgRef, (el) => {
  if (el) {
    el.addEventListener('mousemove', handleSvgMouseMove)
    el.addEventListener('mouseleave', handleSvgMouseLeave)
  }
}, { immediate: true })
</script>

<style scoped lang="css">
.plan-route-canvas {
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
}

.plan-route-canvas__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.plan-route-canvas__toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.plan-route-canvas__toolbar-right {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #666;
}

.plan-route-canvas__draw-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  color: #52c41a;
  font-weight: 500;
}

.plan-route-canvas__route-info {
  color: #52c41a;
  font-weight: 500;
}

.plan-route-canvas__body {
  display: flex;
  gap: 12px;
  height: 500px;
  width: 100%;
}

.plan-route-canvas__map {
  flex: 1 1 0;
  min-width: 0;
  border-radius: 8px;
  overflow: hidden;
  background: #f0f2f5;
  position: relative;
  border: 1px solid #e8edf3;
}

.plan-route-canvas__svg {
  width: 100%;
  height: 100%;
  display: block;
  cursor: crosshair;
}

.plan-route-canvas__point {
  cursor: pointer;
  transition: opacity 0.2s;
}

.plan-route-canvas__point:hover circle,
.plan-route-canvas__point:hover rect {
  filter: brightness(1.2);
}

.plan-route-canvas__point--in-route {
  cursor: default;
}

.plan-route-canvas__empty {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #94a3b8;
  font-size: 13px;
  pointer-events: none;
}

.plan-route-canvas__sidebar {
  width: 220px;
  min-width: 220px;
  border: 1px solid #e8edf3;
  border-radius: 8px;
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.plan-route-canvas__sidebar-title {
  padding: 10px 12px;
  font-weight: 600;
  font-size: 13px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.plan-route-canvas__sidebar-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 0;
}

.plan-route-canvas__facility-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  font-size: 13px;
  transition: background 0.15s;
}

.plan-route-canvas__facility-item:hover {
  background: #f5f5f5;
}

.plan-route-canvas__facility-dots {
  display: flex;
  gap: 3px;
  flex-shrink: 0;
}

.plan-route-canvas__facility-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.plan-route-canvas__facility-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.plan-route-canvas__facility-count {
  font-size: 12px;
  color: #8c8c8c;
  flex-shrink: 0;
}
</style>
