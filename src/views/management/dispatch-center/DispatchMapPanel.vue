<template>
  <a-card class="map-card" title="地图">
    <template #extra>
      <a-button type="link" @click="fullscreenVisible = true">全屏</a-button>
    </template>

    <div class="map-stage" :style="mapStageStyle" @contextmenu.prevent="handleContextCreate">
      <div
        v-for="marker in visibleMarkers"
        :key="marker.id"
        class="marker"
        :class="`marker-${marker.markerType}`"
        :style="{ left: `${marker.x}%`, top: `${marker.y}%` }"
        :title="marker.label"
        @click="handleMarkerClick(marker)"
        @contextmenu.stop.prevent="handleMarkerContext(marker)"
      >
        {{ marker.label }}
      </div>
    </div>
    <div class="map-hint">提示：右键地图或点位可发起临时调度。</div>

    <div class="legend">
      <span class="legend-item" :class="{ off: !isEnabled('running') }" @click="toggleType('running')">
        <i class="dot running"></i>执行中
      </span>
      <span class="legend-item" :class="{ off: !isEnabled('pending') }" @click="toggleType('pending')">
        <i class="dot pending"></i>待执行
      </span>
      <span class="legend-item" :class="{ off: !isEnabled('conflict') }" @click="toggleType('conflict')">
        <i class="dot conflict"></i>冲突
      </span>
      <span class="legend-item" :class="{ off: !isEnabled('robot') }" @click="toggleType('robot')">
        <i class="dot robot"></i>机器人
      </span>
      <span class="legend-item" :class="{ off: !isEnabled('inspection') }" @click="toggleType('inspection')">
        <i class="dot inspection"></i>巡检点
      </span>
      <span class="legend-item" :class="{ off: !isEnabled('charging') }" @click="toggleType('charging')">
        <i class="dot charging"></i>充电站
      </span>
      <span class="legend-item" :class="{ off: !isEnabled('parking') }" @click="toggleType('parking')">
        <i class="dot parking"></i>停车点
      </span>
    </div>

    <a-modal v-model:visible="fullscreenVisible" title="地图全屏" width="92%" :footer="null">
      <div class="map-stage fullscreen" :style="mapStageStyle" @contextmenu.prevent="handleContextCreate">
        <div
          v-for="marker in visibleMarkers"
          :key="`full-${marker.id}`"
          class="marker"
          :class="`marker-${marker.markerType}`"
          :style="{ left: `${marker.x}%`, top: `${marker.y}%` }"
          :title="marker.label"
          @click="handleMarkerClick(marker)"
          @contextmenu.stop.prevent="handleMarkerContext(marker)"
        >
          {{ marker.label }}
        </div>
      </div>
    </a-modal>
  </a-card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

type MarkerType = 'running' | 'pending' | 'conflict' | 'robot' | 'inspection' | 'charging' | 'parking'

export interface MapMarker {
  id: string
  label: string
  markerType: MarkerType
  x: number
  y: number
  relatedTaskId?: string
  relatedRobotId?: string
}

const props = defineProps<{
  markers: MapMarker[]
}>()

const emit = defineEmits<{
  (e: 'map-context-create', payload: { marker?: MapMarker; x: number; y: number }): void
}>()

const enabledTypes = ref<MarkerType[]>(['running', 'pending', 'conflict', 'robot', 'inspection', 'charging', 'parking'])
const fullscreenVisible = ref(false)
const mapBackgroundUrl = new URL('../../../地图.png', import.meta.url).href

const visibleMarkers = computed(() => props.markers.filter(marker => enabledTypes.value.includes(marker.markerType)))
const mapStageStyle = computed(() => ({
  backgroundImage: `url(${mapBackgroundUrl})`
}))

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

  const pointMarkers = props.markers.filter(marker => ['inspection', 'charging', 'parking'].includes(marker.markerType))
  const nearest = pointMarkers
    .map(marker => ({
      marker,
      distance: Math.hypot(marker.x - x, marker.y - y)
    }))
    .sort((a, b) => a.distance - b.distance)[0]

  emit('map-context-create', {
    marker: nearest && nearest.distance <= 8 ? nearest.marker : undefined,
    x,
    y
  })
}

function toggleType(type: MarkerType) {
  const exists = enabledTypes.value.includes(type)
  if (exists) {
    enabledTypes.value = enabledTypes.value.filter(item => item !== type)
  } else {
    enabledTypes.value = [...enabledTypes.value, type]
  }
}

function isEnabled(type: MarkerType) {
  return enabledTypes.value.includes(type)
}
</script>

<style scoped lang="scss">
.map-card {
  height: 100%;
}

.map-stage {
  position: relative;
  height: 300px;
  border: 1px solid #edf0f4;
  border-radius: 8px;
  background-color: #eef2f7;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  overflow: hidden;
}

.map-stage.fullscreen {
  height: 70vh;
}

.marker {
  position: absolute;
  transform: translate(-50%, -50%);
  padding: 1px 6px;
  border-radius: 999px;
  border: 1px solid transparent;
  font-size: 12px;
  line-height: 20px;
  background: #fff;
  white-space: nowrap;
}

.marker-running {
  border-color: #1d4ed8;
}
.marker-pending {
  border-color: #d97706;
}
.marker-conflict {
  border-color: #dc2626;
}
.marker-robot {
  border-color: #16a34a;
}
.marker-inspection {
  border-color: #6d28d9;
}
.marker-charging {
  border-color: #0891b2;
}
.marker-parking {
  border-color: #475569;
}

.map-hint {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.legend {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 8px;
  font-size: 12px;
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

.dot.running {
  background: #1d4ed8;
}
.dot.pending {
  background: #d97706;
}
.dot.conflict {
  background: #dc2626;
}
.dot.robot {
  background: #16a34a;
}
.dot.inspection {
  background: #6d28d9;
}
.dot.charging {
  background: #0891b2;
}
.dot.parking {
  background: #475569;
}
</style>
