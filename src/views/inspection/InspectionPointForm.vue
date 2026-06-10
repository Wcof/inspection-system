<template>
  <div class="inspection-point-form">
    <a-page-header :title="isEdit ? '编辑点位' : '新增点位'" @back="goBack" />

    <a-card style="margin-top: 16px">
      <a-form :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="点位名称" name="name" :rules="[{ required: true, message: '请输入点位名称' }]">
              <a-input v-model:value="form.name" placeholder="请输入点位名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="编码" name="code" :rules="[{ required: true, message: '请输入编码' }]">
              <a-input v-model:value="form.code" placeholder="请输入编码" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="地图" name="mapId" :rules="[{ required: true, message: '请选择地图' }]">
              <a-select v-model:value="form.mapId" placeholder="请选择地图" style="width: 100%">
                <a-select-option v-for="map in maps" :key="map.id" :value="map.id">{{ map.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="巡检区域" name="areaId" :rules="[{ required: true, message: '请选择巡检区域' }]">
              <a-select v-model:value="form.areaId" placeholder="请选择巡检区域" style="width: 100%">
                <a-select-option v-for="region in activeRegions" :key="region.id" :value="region.id">{{ region.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="点位类型（充电站、巡检点、停车点）">
              <a-select :value="bizPointType" disabled>
                <a-select-option value="inspection">巡检点</a-select-option>
                <a-select-option value="charging">充电站</a-select-option>
                <a-select-option value="parking">停车点</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col v-if="bizPointType === 'inspection'" :span="12">
            <a-form-item label="巡检点类型" name="pointType" :rules="[{ required: true, message: '请选择巡检点类型' }]">
              <a-select v-model:value="form.pointType">
                <a-select-option :value="InspectionPointType.FIXED">固定巡检点</a-select-option>
                <a-select-option :value="InspectionPointType.AREA">区域巡检点</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="地图拾点（只读）">
          <div class="map-picker">
            <div class="map-toolbar">
              <a-alert type="info" show-icon message="当前页面只展示点位，不支持清空拾点和地图重新放置。" />
            </div>
            <div class="map-stage">
              <img v-if="activeMap?.imageUrl" :src="activeMap.imageUrl" alt="地图预览" class="map-image" />
              <div v-else class="map-placeholder"><span>{{ activeMap?.name || '请先选择地图' }}</span></div>
              <button
                class="picked-marker"
                type="button"
                :style="{ left: `${readOnlyPoint.x}px`, top: `${readOnlyPoint.y}px` }"
              >
                1
              </button>
            </div>
            <div class="map-position-info">
              当前坐标: X={{ form.mapPosition?.x ?? 0 }}, Y={{ form.mapPosition?.y ?? 0 }}, Yaw={{ form.mapPosition?.yaw || 0 }}
            </div>
          </div>
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
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import { PositionSource, CalibrationStatus, InspectionPointType } from '@/types/inspection'
import type { InspectionPoint, InspectionMap } from '@/types/inspection'
import { message } from 'ant-design-vue'
import { ExceptionStrategy } from '@/types'

type BizPointType = 'inspection' | 'charging' | 'parking'

const router = useRouter()
const route = useRoute()
const inspectionStore = useInspectionStore()

const saving = ref(false)
const isEdit = computed(() => !!route.params.id)
const maps = ref<InspectionMap[]>([])
const bizPointType = ref<BizPointType>('inspection')

const activeMap = computed(() => maps.value.find(map => map.id === form.mapId))
const activeRegions = computed(() => activeMap.value?.regions || [])
const readOnlyPoint = computed(() => ({
  x: clampPixel(Number(form.mapPosition?.x || 0)),
  y: clampPixel(Number(form.mapPosition?.y || 0))
}))

const form = reactive<Partial<InspectionPoint>>({
  name: '',
  code: '',
  pointType: InspectionPointType.FIXED,
  mapId: '',
  areaId: '',
  areaName: '',
  location: {
    longitude: 0,
    latitude: 0,
    altitude: 0
  },
  mapPosition: {
    x: 120,
    y: 120,
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
  router.push('/implementation/point/list')
}

function clampPixel(value: number) {
  if (value <= 260) return Math.max(14, value)
  return Math.max(14, Math.min(600, value / 2))
}

function getDescriptionTag(type: BizPointType) {
  if (type === 'charging') return '充电点'
  if (type === 'parking') return '停车点'
  return '巡检点'
}

function parseBizType(description?: string): BizPointType {
  const tag = String(description || '').match(/^\[(巡检点|停车点|充电点)\]/)?.[1]
  if (tag === '充电点') return 'charging'
  if (tag === '停车点') return 'parking'
  return 'inspection'
}

function hasValidPosition(position?: { x: number; y: number; yaw?: number }) {
  if (!position) return false
  return typeof position.x === 'number' && typeof position.y === 'number'
}

async function handleSave() {
  if (!form.name || !form.code || !form.mapId || !form.areaId) {
    message.error('请填写必填项')
    return
  }

  if (!hasValidPosition(form.mapPosition)) {
    message.error('当前点位缺少坐标信息')
    return
  }

  saving.value = true
  try {
    const now = new Date()
    const pointData: InspectionPoint = {
      id: isEdit.value ? route.params.id as string : `point-${Date.now()}`,
      name: form.name!,
      code: form.code!,
      pointType: bizPointType.value === 'inspection' ? (form.pointType || InspectionPointType.FIXED) : InspectionPointType.FIXED,
      description: `[${getDescriptionTag(bizPointType.value)}] ${form.name}`,
      mapId: form.mapId!,
      areaId: form.areaId,
      areaName: activeRegions.value.find(region => region.id === form.areaId)?.name || form.areaName || '',
      location: form.location!,
      mapPosition: form.mapPosition,
      areaStartMapPosition: undefined,
      areaEndMapPosition: undefined,
      sequence: 1,
      calibrationStatus: form.calibrationStatus || CalibrationStatus.PENDING,
      stayDurationSec: 30,
      isCritical: false,
      exceptionStrategy: form.exceptionStrategy!,
      monitorPoints: form.monitorPoints || [],
      positionSource: form.positionSource || PositionSource.MAP_PICK,
      lastMapPickAt: form.positionSource === PositionSource.MAP_PICK ? now : undefined,
      lastManualAdjustAt: form.positionSource === PositionSource.MANUAL_ADJUST ? now : undefined,
      createdAt: isEdit.value ? (form.createdAt as Date || new Date()) : new Date(),
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
      form.mapPosition = point.mapPosition || { x: 120, y: 120, yaw: 0 }
      bizPointType.value = parseBizType(point.description)
    }
  }
})
</script>

<style scoped lang="css">
.inspection-point-form {
  width: 100%;
}

.map-picker {
  border: 1px solid #d9d9d9;
  border-radius: 8px;
  padding: 12px;
  background: #fafafa;
}

.map-picker .map-toolbar {
  margin-bottom: 10px;
}

.map-picker .map-stage {
  position: relative;
  height: 260px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
  background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
}

.map-picker .map-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  user-select: none;
  pointer-events: none;
}

.map-picker .map-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: #667085;
}

.map-picker .picked-marker {
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

.map-picker .map-position-info {
  margin-top: 10px;
  font-size: 12px;
  color: #666;
}
</style>
