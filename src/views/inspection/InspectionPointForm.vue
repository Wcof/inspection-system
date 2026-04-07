<template>
  <div class="inspection-point-form">
    <a-page-header :title="isEdit ? '编辑巡检点' : '新建巡检点'" @back="goBack">
    </a-page-header>

    <a-card style="margin-top: 16px">
      <a-form :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="巡检点名称" name="name" :rules="[{ required: true, message: '请输入巡检点名称' }]">
              <a-input v-model:value="form.name" placeholder="请输入巡检点名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="编码" name="code" :rules="[{ required: true, message: '请输入编码' }]">
              <a-input v-model:value="form.code" placeholder="请输入编码" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="24">
            <a-form-item label="地图" name="mapId" :rules="[{ required: true, message: '请选择地图' }]">
              <a-select v-model:value="form.mapId" placeholder="请选择地图" style="width: 100%">
                <a-select-option v-for="map in maps" :key="map.id" :value="map.id">
                  {{ map.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="巡检点类型" name="pointType" :rules="[{ required: true, message: '请选择巡检点类型' }]">
              <a-select v-model:value="form.pointType" @change="handlePointTypeChange">
                <a-select-option :value="InspectionPointType.FIXED">固定巡检点</a-select-option>
                <a-select-option :value="InspectionPointType.AREA">区域巡检点</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="24">
            <a-form-item label="地图拾点">
              <div class="map-picker">
                <div class="map-toolbar">
                  <a-space>
                    <a-radio-group v-model:value="mapViewMode" button-style="solid">
                      <a-radio-button value="2d">2D</a-radio-button>
                      <a-radio-button value="3d">3D</a-radio-button>
                    </a-radio-group>
                    <span class="map-helper-text">
                      <template v-if="form.pointType === InspectionPointType.FIXED">
                        固定巡检点：点击地图设置唯一坐标点
                      </template>
                      <template v-else>
                        区域巡检点：在地图上按下并拖拽画框选择巡检区域
                      </template>
                    </span>
                    <a-button size="small" @click="resetPickedPoints">清空拾点</a-button>
                  </a-space>
                </div>

                <div
                  ref="mapStageRef"
                  class="map-stage"
                  :class="{ 'mode-3d': mapViewMode === '3d' }"
                  @click="handleMapStageClick"
                  @pointerdown.prevent="handleAreaPointerDown"
                  @pointermove.prevent="handleAreaPointerMove"
                  @pointerup.prevent="handleAreaPointerUp"
                  @pointercancel.prevent="handleAreaPointerUp"
                  @pointerleave.prevent="handleAreaPointerUp"
                >
                  <img
                    v-if="activeMap?.imageUrl"
                    :src="activeMap.imageUrl"
                    alt="地图预览"
                    class="map-image"
                  />
                  <div v-else class="map-placeholder">
                    <span>{{ activeMap?.name || '请先选择地图' }}</span>
                  </div>

                  <button
                    v-for="(point, idx) in form.pointType === InspectionPointType.FIXED ? pickedPoints : pickedPoints.slice(0, 2)"
                    :key="`${point.x}-${point.y}-${idx}`"
                    class="picked-marker"
                    :style="{ left: `${point.x}px`, top: `${point.y}px` }"
                    type="button"
                  >
                    {{ idx + 1 }}
                  </button>

                  <template v-if="form.pointType === InspectionPointType.AREA && areaRect.width > 0 && areaRect.height > 0">
                    <div class="area-mask area-mask-top" :style="{ top: '0px', height: `${areaRect.y}px` }" />
                    <div class="area-mask area-mask-left" :style="{ top: `${areaRect.y}px`, left: '0px', width: `${areaRect.x}px`, height: `${areaRect.height}px` }" />
                    <div
                      class="area-mask area-mask-right"
                      :style="{ top: `${areaRect.y}px`, left: `${areaRect.x + areaRect.width}px`, width: `calc(100% - ${areaRect.x + areaRect.width}px)`, height: `${areaRect.height}px` }"
                    />
                    <div class="area-mask area-mask-bottom" :style="{ left: '0px', top: `${areaRect.y + areaRect.height}px`, height: `calc(100% - ${areaRect.y + areaRect.height}px)` }" />
                    <div
                      class="area-box"
                      :style="{ left: `${areaRect.x}px`, top: `${areaRect.y}px`, width: `${areaRect.width}px`, height: `${areaRect.height}px` }"
                    >
                      <span class="area-meta">{{ areaRect.width }} × {{ areaRect.height }}</span>
                    </div>
                  </template>
                </div>

                <div class="map-position-info">
                  <template v-if="form.pointType === InspectionPointType.FIXED">
                    当前坐标: X={{ form.mapPosition?.x ?? 0 }}, Y={{ form.mapPosition?.y ?? 0 }}, Yaw={{ form.mapPosition?.yaw || 0 }}
                  </template>
                  <template v-else>
                    起点: X={{ form.areaStartMapPosition?.x ?? 0 }}, Y={{ form.areaStartMapPosition?.y ?? 0 }}, Yaw={{ form.areaStartMapPosition?.yaw || 0 }}
                    <br />
                    终点: X={{ form.areaEndMapPosition?.x ?? 0 }}, Y={{ form.areaEndMapPosition?.y ?? 0 }}, Yaw={{ form.areaEndMapPosition?.yaw || 0 }}
                    <br />
                    框选区域：宽={{ areaRect.width }}，高={{ areaRect.height }}
                  </template>
                </div>
              </div>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="form.description" placeholder="请输入描述" :rows="3" />
        </a-form-item>

        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSave" :loading="saving">保存</a-button>
            <a-button @click="goBack">取消</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import { PositionSource, CalibrationStatus, InspectionPointType } from '@/types/inspection'
import type { InspectionPoint, InspectionMap } from '@/types/inspection'
import { message } from 'ant-design-vue'
import { ExceptionStrategy } from '@/types'

const router = useRouter()
const route = useRoute()
const inspectionStore = useInspectionStore()

const saving = ref(false)
const isEdit = computed(() => !!route.params.id)
const maps = ref<InspectionMap[]>([])
const mapViewMode = ref<'2d' | '3d'>('2d')
const mapStageRef = ref<HTMLElement | null>(null)
const pickedPoints = ref<Array<{ x: number; y: number; yaw: number }>>([])
const areaRect = ref({ x: 0, y: 0, width: 0, height: 0 })
const areaDragStart = ref({ x: 0, y: 0 })
const isDrawingArea = ref(false)
const activeMap = computed(() => maps.value.find(map => map.id === form.mapId))

const form = reactive<Partial<InspectionPoint>>({
  name: '',
  code: '',
  pointType: InspectionPointType.FIXED,
  description: '',
  mapId: '',
  location: {
    longitude: 0,
    latitude: 0,
    altitude: 0
  },
  mapPosition: {
    x: 0,
    y: 0,
    yaw: 0
  },
  areaStartMapPosition: {
    x: 0,
    y: 0,
    yaw: 0
  },
  areaEndMapPosition: {
    x: 0,
    y: 0,
    yaw: 0
  },
  exceptionStrategy: {
    onFailure: ExceptionStrategy.SKIP,
    retryCount: 3,
    skipToNext: true
  },
  monitorPoints: [],
  positionSource: PositionSource.MAP_PICK
})

function goBack() {
  router.push('/facility/inspection-point')
}

function ensureInspectionPointDescription(description: string) {
  const raw = description.trim()
  if (!raw) return '[巡检点]'
  if (/^\[(巡检点|停车点|充电点)\]\s*/.test(raw)) return raw
  return `[巡检点] ${raw}`
}

function normalizePickedPoint(position?: { x: number; y: number; yaw?: number }) {
  return {
    x: position?.x ?? 0,
    y: position?.y ?? 0,
    yaw: position?.yaw ?? 0
  }
}

function applyPickedPointsToForm() {
  if (form.pointType === InspectionPointType.FIXED) {
    const point = normalizePickedPoint(pickedPoints.value[0])
    form.mapPosition = { ...point }
    form.areaStartMapPosition = undefined
    form.areaEndMapPosition = undefined
  } else {
    const start = normalizePickedPoint(pickedPoints.value[0])
    const end = normalizePickedPoint(pickedPoints.value[Math.max(1, pickedPoints.value.length - 1)])
    form.areaStartMapPosition = { ...start }
    form.areaEndMapPosition = { ...end }
    form.mapPosition = { ...start }
  }
}

function syncAreaRectFromPickedPoints() {
  if (pickedPoints.value.length < 2) {
    areaRect.value = { x: 0, y: 0, width: 0, height: 0 }
    return
  }
  const start = pickedPoints.value[0]
  const end = pickedPoints.value[1]
  areaRect.value = {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y)
  }
}

function resetPickedPoints() {
  pickedPoints.value = []
  areaRect.value = { x: 0, y: 0, width: 0, height: 0 }
  if (form.pointType === InspectionPointType.FIXED) {
    form.mapPosition = { x: 0, y: 0, yaw: 0 }
  } else {
    form.areaStartMapPosition = { x: 0, y: 0, yaw: 0 }
    form.areaEndMapPosition = { x: 0, y: 0, yaw: 0 }
    form.mapPosition = { x: 0, y: 0, yaw: 0 }
  }
  markManualAdjust()
}

function handleMapStageClick(event: MouseEvent) {
  if (form.pointType !== InspectionPointType.FIXED) return
  if (!form.mapId) {
    message.error('请先选择地图')
    return
  }
  if (!mapStageRef.value) return

  const rect = mapStageRef.value.getBoundingClientRect()
  const x = Math.max(12, Math.min(rect.width - 12, event.clientX - rect.left))
  const y = Math.max(12, Math.min(rect.height - 12, event.clientY - rect.top))
  const picked = {
    x: Math.round(x),
    y: Math.round(y),
    yaw: Math.random() * 360
  }

  if (form.pointType === InspectionPointType.FIXED) {
    pickedPoints.value = [picked]
    areaRect.value = { x: 0, y: 0, width: 0, height: 0 }
    message.success('固定巡检点拾取成功')
  }
  applyPickedPointsToForm()

  form.location = {
    longitude: Number((120 + picked.x / 10000).toFixed(6)),
    latitude: Number((30 + picked.y / 10000).toFixed(6)),
    altitude: form.location?.altitude || 0
  }
  form.positionSource = PositionSource.MAP_PICK
}

function getStagePoint(event: PointerEvent) {
  if (!mapStageRef.value) return null
  const rect = mapStageRef.value.getBoundingClientRect()
  const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left))
  const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top))
  return { x: Math.round(x), y: Math.round(y) }
}

function handleAreaPointerDown(event: PointerEvent) {
  if (form.pointType !== InspectionPointType.AREA || !form.mapId) return
  const point = getStagePoint(event)
  const stage = mapStageRef.value
  if (!point || !stage) return
  if (event.button !== 0) return
  stage.setPointerCapture?.(event.pointerId)
  areaDragStart.value = { x: point.x, y: point.y }
  areaRect.value = { x: point.x, y: point.y, width: 0, height: 0 }
  isDrawingArea.value = true
}

function handleAreaPointerMove(event: PointerEvent) {
  if (!isDrawingArea.value || form.pointType !== InspectionPointType.AREA) return
  const point = getStagePoint(event)
  if (!point) return
  areaRect.value = {
    x: Math.min(areaDragStart.value.x, point.x),
    y: Math.min(areaDragStart.value.y, point.y),
    width: Math.abs(point.x - areaDragStart.value.x),
    height: Math.abs(point.y - areaDragStart.value.y)
  }
}

function handleAreaPointerUp(event?: PointerEvent) {
  const stage = mapStageRef.value
  if (stage && event?.pointerId !== undefined && stage.hasPointerCapture?.(event.pointerId)) {
    stage.releasePointerCapture?.(event.pointerId)
  }
  if (!isDrawingArea.value || form.pointType !== InspectionPointType.AREA) return
  isDrawingArea.value = false
  if (areaRect.value.width < 8 || areaRect.value.height < 8) {
    areaRect.value = { x: 0, y: 0, width: 0, height: 0 }
    message.warning('请选择有效巡检区域')
    return
  }
  const start = { x: areaRect.value.x, y: areaRect.value.y, yaw: 0 }
  const end = { x: areaRect.value.x + areaRect.value.width, y: areaRect.value.y + areaRect.value.height, yaw: 0 }
  pickedPoints.value = [start, end]
  applyPickedPointsToForm()
  form.location = {
    longitude: Number((120 + (start.x + end.x) / 2 / 10000).toFixed(6)),
    latitude: Number((30 + (start.y + end.y) / 2 / 10000).toFixed(6)),
    altitude: form.location?.altitude || 0
  }
  form.positionSource = PositionSource.MAP_PICK
  message.success('区域巡检点框选成功')
}

function handlePointTypeChange(value: InspectionPointType) {
  if (value === InspectionPointType.FIXED) {
    pickedPoints.value = pickedPoints.value.length > 0 ? [normalizePickedPoint(pickedPoints.value[0])] : []
    areaRect.value = { x: 0, y: 0, width: 0, height: 0 }
    form.mapPosition = form.mapPosition || { x: 0, y: 0, yaw: 0 }
  } else {
    const start = normalizePickedPoint(form.areaStartMapPosition || form.mapPosition)
    const end = normalizePickedPoint(form.areaEndMapPosition || { x: start.x + 40, y: start.y + 30, yaw: 0 })
    pickedPoints.value = [start, end]
    form.areaStartMapPosition = form.areaStartMapPosition || { x: 0, y: 0, yaw: 0 }
    form.areaEndMapPosition = form.areaEndMapPosition || { x: 0, y: 0, yaw: 0 }
    form.mapPosition = { ...(form.areaStartMapPosition || { x: 0, y: 0, yaw: 0 }) }
    syncAreaRectFromPickedPoints()
  }
  applyPickedPointsToForm()
  markManualAdjust()
}

function markManualAdjust() {
  form.positionSource = PositionSource.MANUAL_ADJUST
}

function hasValidPosition(position?: { x: number; y: number; yaw?: number }) {
  if (!position) return false
  return typeof position.x === 'number' && typeof position.y === 'number'
}

async function handleSave() {
  if (!form.name || !form.code || !form.mapId || !form.pointType) {
    message.error('请填写必填项')
    return
  }

  if (form.pointType === InspectionPointType.FIXED && !hasValidPosition(form.mapPosition)) {
    message.error('固定巡检点必须设置一个坐标点')
    return
  }

  if (form.pointType === InspectionPointType.FIXED && pickedPoints.value.length !== 1) {
    message.error('固定巡检点必须且只能设置 1 个坐标点')
    return
  }

  if (form.pointType === InspectionPointType.AREA && pickedPoints.value.length < 2) {
    message.error('区域巡检点至少需要设置 2 个坐标点')
    return
  }

  if (form.pointType === InspectionPointType.AREA && (!hasValidPosition(form.areaStartMapPosition) || !hasValidPosition(form.areaEndMapPosition))) {
    message.error('区域巡检点必须设置起点和终点坐标')
    return
  }

  saving.value = true
  try {
    const now = new Date()
    const pointData: InspectionPoint = {
      id: isEdit.value ? route.params.id as string : `point-${Date.now()}`,
      name: form.name!,
      code: form.code!,
      pointType: form.pointType,
      description: ensureInspectionPointDescription(form.description || ''),
      mapId: form.mapId!,
      location: form.location!,
      mapPosition: form.pointType === InspectionPointType.FIXED ? form.mapPosition : form.areaStartMapPosition,
      areaStartMapPosition: form.pointType === InspectionPointType.AREA ? form.areaStartMapPosition : undefined,
      areaEndMapPosition: form.pointType === InspectionPointType.AREA ? form.areaEndMapPosition : undefined,
      sequence: 1,
      calibrationStatus: CalibrationStatus.PENDING,
      stayDurationSec: 30,
      isCritical: false,
      exceptionStrategy: form.exceptionStrategy!,
      monitorPoints: form.monitorPoints || [],
      positionSource: form.positionSource || PositionSource.MAP_PICK,
      lastMapPickAt: form.positionSource === PositionSource.MAP_PICK ? now : undefined,
      lastManualAdjustAt: form.positionSource === PositionSource.MANUAL_ADJUST ? now : undefined,
      createdAt: isEdit.value ? new Date() : new Date(),
      updatedAt: new Date()
    }

    inspectionStore.saveInspectionPoint(pointData)
    message.success(isEdit.value ? '更新成功' : '创建成功')
    goBack()
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  inspectionStore.initialize()
  maps.value = inspectionStore.inspectionMaps
  
  if (isEdit.value) {
    const point = inspectionStore.getInspectionPointById(route.params.id as string)
    if (point) {
      Object.assign(form, point)
      form.pointType = point.pointType || InspectionPointType.FIXED
      if (form.pointType === InspectionPointType.AREA) {
        form.areaStartMapPosition = point.areaStartMapPosition || point.mapPosition || { x: 0, y: 0, yaw: 0 }
        form.areaEndMapPosition = point.areaEndMapPosition || { x: 0, y: 0, yaw: 0 }
        pickedPoints.value = [
          normalizePickedPoint(form.areaStartMapPosition),
          normalizePickedPoint(form.areaEndMapPosition)
        ]
        syncAreaRectFromPickedPoints()
      } else {
        form.mapPosition = point.mapPosition || { x: 0, y: 0, yaw: 0 }
        pickedPoints.value = form.mapPosition ? [normalizePickedPoint(form.mapPosition)] : []
      }
      form.description = (point.description || '').replace(/^\[(巡检点|停车点|充电点)\]\s*/, '')
    }
  }
})
</script>

<style scoped lang="scss">
.inspection-point-form {
  width: 100%;
}

.map-picker {
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 12px;
  background: #fafafa;
  transition: all 0.3s;
  
  &:hover {
    border-color: #1890ff;
  }

  .map-toolbar {
    margin-bottom: 10px;
  }

  .map-helper-text {
    color: #8c8c8c;
    font-size: 12px;
  }

  .map-stage {
    position: relative;
    height: 260px;
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    overflow: hidden;
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
    cursor: crosshair;
    touch-action: none;
    user-select: none;
  }

  .map-stage.mode-3d {
    transform: perspective(1200px) rotateX(10deg);
    transform-origin: center center;
  }

  .map-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    user-select: none;
    pointer-events: none;
  }

  .map-placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 14px;
    color: #667085;
  }

  .picked-marker {
    position: absolute;
    width: 24px;
    height: 24px;
    border: 2px solid #fff;
    border-radius: 50%;
    background: #1677ff;
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    transform: translate(-50%, -50%);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .area-mask {
    position: absolute;
    background: rgba(5, 20, 60, 0.28);
    pointer-events: none;
    z-index: 2;
  }

  .area-mask-top {
    left: 0;
    right: 0;
  }

  .area-mask-bottom {
    left: 0;
    right: 0;
  }

  .area-box {
    position: absolute;
    border: 2px solid #1677ff;
    background: rgba(22, 119, 255, 0.16);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.65);
    pointer-events: none;
    z-index: 3;
  }

  .area-meta {
    position: absolute;
    left: 6px;
    top: 6px;
    padding: 2px 6px;
    border-radius: 4px;
    background: rgba(15, 23, 42, 0.72);
    color: #fff;
    font-size: 12px;
    line-height: 1.2;
    font-weight: 600;
    white-space: nowrap;
  }

  .map-position-info {
    margin-top: 10px;
    font-size: 12px;
    color: #666;
  }
}
</style>
