<template>
  <div class="inspection-point-detail">
    <a-page-header
      :title="pageTitle"
      :sub-title="pageSubtitle"
      @back="goBack"
    >
      <template #extra>
        <a-space>
          <a-button @click="goToPosition">位置</a-button>
          <a-button v-if="isInspectionPoint" @click="goToConfig">巡检配置</a-button>
          <a-button v-if="!isEditMode" type="primary" @click="goToEdit">编辑</a-button>
          <a-button v-else type="primary" @click="handleSave">保存</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-row :gutter="[16, 16]" style="margin-top: 12px">
      <a-col :xs="24" :xl="14">
        <a-card :title="isEditMode ? '基础信息' : '当前巡检点摘要'" class="panel-card">
          <a-form v-if="isEditMode" layout="vertical">
            <a-row :gutter="16" class="form-grid">
              <a-col :span="8"><a-form-item label="点位名称" required><a-input v-model:value="form.name" :disabled="!isEditMode" /></a-form-item></a-col>
              <a-col :span="8"><a-form-item label="点位编码" required><a-input v-model:value="form.code" :disabled="!isEditMode" /></a-form-item></a-col>
              <a-col :span="8">
                <a-form-item label="业务类型" required>
                  <a-select v-model:value="form.pointBizType" :disabled="!isEditMode">
                    <a-select-option value="inspection">巡检点</a-select-option>
                    <a-select-option value="charging">充电站</a-select-option>
                    <a-select-option value="maintenance">维修站</a-select-option>
                    <a-select-option value="standby">停靠点</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
            </a-row>

            <a-row :gutter="16" class="form-grid">
              <a-col :span="8">
                <a-form-item label="巡检模式" :required="form.pointBizType === 'inspection'">
                  <a-select v-model:value="form.inspectionMode" :disabled="!isEditMode || form.pointBizType !== 'inspection'">
                    <a-select-option value="fixed">固定巡检点（停车检查）</a-select-option>
                    <a-select-option value="area">区域巡检点（不强制停车）</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="所属地图">
                  <a-input :value="currentMap?.name || '-'" disabled />
                </a-form-item>
              </a-col>
              <a-col :span="8">
                <a-form-item label="所属区域">
                  <a-select v-model:value="form.areaId" allow-clear :disabled="!isEditMode" @change="onAreaChange">
                    <a-select-option v-for="area in areaOptions" :key="area.id" :value="area.id">{{ area.name }}</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
            </a-row>

            <a-row :gutter="16" class="form-grid">
              <a-col :span="8"><a-form-item label="装置区 / 分区"><a-input v-model:value="form.workAreaName" :disabled="!isEditMode" /></a-form-item></a-col>
              <a-col :span="8"><a-form-item label="地图坐标"><a-input :value="coordinateText" disabled /></a-form-item></a-col>
              <a-col :span="8"><a-form-item label="车头朝向"><a-input-number v-model:value="form.yaw" :disabled="!isEditMode" :min="0" :max="360" style="width: 100%" /></a-form-item></a-col>
            </a-row>
          </a-form>
          <template v-else>
            <a-descriptions bordered :column="3" size="small" class="summary-descriptions">
              <a-descriptions-item label="巡检点">{{ currentPoint?.name || '-' }}</a-descriptions-item>
              <a-descriptions-item label="所属地图">{{ currentMap?.name || '-' }}</a-descriptions-item>
              <a-descriptions-item label="所属区域">{{ form.areaName || currentPoint?.areaName || '-' }}</a-descriptions-item>
              <a-descriptions-item label="配置对象">{{ mergedConfigRows.length }}</a-descriptions-item>
              <a-descriptions-item label="关联设施">{{ uniqueFacilityCount }}</a-descriptions-item>
              <a-descriptions-item label="检测项">{{ totalRuleCount }}</a-descriptions-item>
            </a-descriptions>
          </template>
        </a-card>
      </a-col>

      <a-col :xs="24" :xl="10">
        <a-card title="地图位置">
          <div class="map-stage">
            <img :src="currentMap?.imageUrl || fallbackMapBackgroundUrl" alt="地图预览" class="map-image" />
            <div
              v-for="mapPoint in mapPoints"
              :key="mapPoint.id"
              class="marker"
              :class="{ active: mapPoint.id === currentPoint?.id }"
              :style="{ left: `${mapPoint.mapX}%`, top: `${mapPoint.mapY}%` }"
            >
              <span class="marker-dot">{{ getPointMarkerText(mapPoint.pointBizType) }}</span>
            </div>
          </div>
          <div class="map-summary">
            <a-tag :color="pointBizColor">{{ pointBizText }}</a-tag>
            <a-tag v-if="isInspectionPoint">{{ form.inspectionMode === 'area' ? '区域巡检点' : '固定巡检点' }}</a-tag>
            <a-tag>{{ form.areaName || currentPoint?.areaName || '未分区' }}</a-tag>
          </div>
        </a-card>
      </a-col>
    </a-row>

    <template v-if="isInspectionPoint">
      <a-row :gutter="[16, 16]" style="margin-top: 16px">
        <a-col :span="24">
          <a-card title="巡检配置详情" class="panel-card">
            <a-form layout="vertical" class="search-form" @submit.prevent>
              <a-row :gutter="[16, 8]">
                <a-col :xs="24" :sm="12" :md="8" :lg="6">
                  <a-form-item label="设施检索">
                    <a-input v-model:value="filtersDraft.facilityKeyword" allow-clear placeholder="输入设施名称" />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :md="8" :lg="6">
                  <a-form-item label="部件检索">
                    <a-input v-model:value="filtersDraft.componentKeyword" allow-clear placeholder="输入部件名称" />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :md="8" :lg="6" style="display: flex; align-items: end">
                  <a-space>
                    <a-button type="primary" @click="handleSearch">搜索</a-button>
                    <a-button @click="handleResetSearch">重置</a-button>
                  </a-space>
                </a-col>
              </a-row>
            </a-form>
            <a-table class="config-table" :columns="configColumns" :data-source="filteredConfigRows" row-key="id" :pagination="false" :scroll="{ x: 1400 }" size="small" />
          </a-card>
        </a-col>

        <a-col :span="24">
          <a-card title="执行记录" class="panel-card">
            <a-table class="record-table" :columns="recordColumns" :data-source="executionRows" row-key="id" :pagination="false" size="small" />
          </a-card>
        </a-col>
      </a-row>
    </template>

    <template v-else-if="form.pointBizType === 'charging'">
      <a-row :gutter="[16, 16]" style="margin-top: 16px">
        <a-col :span="24">
          <a-card title="充电站信息">
            <a-descriptions bordered :column="3" size="small">
              <a-descriptions-item label="点位名称">{{ form.name || '-' }}</a-descriptions-item>
              <a-descriptions-item label="所属区域">{{ form.areaName || '-' }}</a-descriptions-item>
              <a-descriptions-item label="校准状态">{{ currentPoint?.calibrationStatus === 'calibrated' ? '已校准' : '待校准' }}</a-descriptions-item>
              <a-descriptions-item label="坐标">{{ coordinateText }}</a-descriptions-item>
              <a-descriptions-item label="说明">当前作为充电站点位使用，可在地图页维护位置。</a-descriptions-item>
            </a-descriptions>
          </a-card>
        </a-col>
      </a-row>
    </template>

    <template v-else-if="form.pointBizType === 'maintenance'">
      <a-row :gutter="[16, 16]" style="margin-top: 16px">
        <a-col :span="24">
          <a-card title="维修站信息">
            <a-descriptions bordered :column="3" size="small">
              <a-descriptions-item label="点位名称">{{ form.name || '-' }}</a-descriptions-item>
              <a-descriptions-item label="所属区域">{{ form.areaName || '-' }}</a-descriptions-item>
              <a-descriptions-item label="校准状态">{{ currentPoint?.calibrationStatus === 'calibrated' ? '已校准' : '待校准' }}</a-descriptions-item>
              <a-descriptions-item label="坐标">{{ coordinateText }}</a-descriptions-item>
              <a-descriptions-item label="说明">当前作为维修/维护停靠点位使用，可在地图页维护边界条件。</a-descriptions-item>
            </a-descriptions>
          </a-card>
        </a-col>
      </a-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useInspectionStore } from '@/stores/inspection'
import type { InspectionPoint, ParkingPointConstraint } from '@/types/inspection'
import { CalibrationStatus, InspectionPointType, PositionSource } from '@/types/inspection'
import { getDetectionItemConfigs } from '@/views/implementation/detection-item-config/model'

const fallbackMapBackgroundUrl = new URL('../../地图.png', import.meta.url).href

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()

const isEditMode = computed(() => route.name === 'ImplementationPointEdit')
const currentPoint = computed(() => inspectionStore.inspectionPoints.find(item => item.id === String(route.params.id)))
const currentMap = computed(() => inspectionStore.inspectionMaps.find(item => item.id === form.mapId))
const isInspectionPoint = computed(() => form.pointBizType === 'inspection')

const form = reactive({
  id: '',
  name: '',
  code: '',
  mapId: '',
  areaId: '',
  areaName: '',
  pointBizType: 'inspection' as NonNullable<InspectionPoint['pointBizType']>,
  inspectionMode: 'fixed' as NonNullable<InspectionPoint['inspectionMode']>,
  workAreaName: '',
  yaw: 0
})

const constraintForm = reactive<ParkingPointConstraint>({
  reachable: true,
  reverseRequired: false,
  turnAroundRequired: false,
  narrowRoad: false,
  slope: false,
  bridgeRequired: false,
  detourRequired: false
})

const configColumns = [
  { title: '装置', dataIndex: 'installationName', key: 'installationName', width: 180 },
  { title: '设施', dataIndex: 'facilityName', key: 'facilityName', width: 200 },
  { title: '部件', dataIndex: 'componentName', key: 'componentName', width: 220 },
  { title: '云台X轴', dataIndex: 'ptzX', key: 'ptzX', width: 120 },
  { title: '云台Y轴', dataIndex: 'ptzY', key: 'ptzY', width: 120 },
  { title: '焦距', dataIndex: 'focalLength', key: 'focalLength', width: 140 },
  { title: '检测规则', dataIndex: 'ruleNamesText', key: 'ruleNamesText' }
]

const recordColumns = [
  { title: '任务名称', dataIndex: 'taskName', key: 'taskName' },
  { title: '执行时间', dataIndex: 'executedAtText', key: 'executedAtText', width: 190 },
  { title: '结果摘要', dataIndex: 'resultSummary', key: 'resultSummary' },
  { title: '执行载体', dataIndex: 'executor', key: 'executor', width: 140 }
]

const areaOptions = computed(() => currentMap.value?.regions || [])
const filters = reactive({
  facilityKeyword: '',
  componentKeyword: ''
})
const filtersDraft = reactive({
  facilityKeyword: '',
  componentKeyword: ''
})

const pageTitle = computed(() => `${form.name || currentPoint.value?.name || '点位'}${isEditMode.value ? '编辑' : '详情'}`)
const pageSubtitle = computed(() => isInspectionPoint.value
  ? '显示地图位置，并围绕装置、设施、部件与检测规则查看当前巡检点。'
  : '显示当前点位的地图位置和基础属性。')

const coordinateText = computed(() => {
  const point = currentPoint.value
  return point?.mapPosition ? `${Number(point.mapPosition.x || 0).toFixed(2)}, ${Number(point.mapPosition.y || 0).toFixed(2)}` : '-'
})

const pointBizText = computed(() => getBizTypeText(form.pointBizType))
const pointBizColor = computed(() => {
  if (form.pointBizType === 'charging') return 'green'
  if (form.pointBizType === 'maintenance') return 'orange'
  if (form.pointBizType === 'standby') return 'cyan'
  return 'blue'
})

const mapPoints = computed(() => inspectionStore.inspectionPoints
  .filter(item => item.mapId === form.mapId)
  .map((item) => ({
    id: item.id,
    mapX: normalizeMapCoordinate(item.mapPosition?.x),
    mapY: normalizeMapCoordinate(item.mapPosition?.y),
    pointBizType: item.pointBizType || inferPointBizType(item)
  })))

const mergedConfigRows = computed(() => {
  const point = currentPoint.value
  if (!point) return []
  const ruleMap = new Map(getDetectionItemConfigs().map((item) => [item.id, item.name]))
  const componentMap = new Map(inspectionStore.facilityComponents.map((item) => [item.id, item]))
  const poseMap = new Map<string, { ptzX: number; ptzY: number; focalLength: string }>()

  ;(point.parkingPoints || []).forEach((parking) => {
    ;(parking.collectionPoses || []).forEach((pose) => {
      if (pose.targetType !== 'component') return
      poseMap.set(pose.targetName, {
        ptzX: pose.ptzYaw,
        ptzY: pose.ptzPitch,
        focalLength: pose.focalLength || '-'
      })
    })
  })

  return (point.coverageObjects || [])
    .filter((item) => item.type === 'component' && item.componentId)
    .map((item) => {
      const component = componentMap.get(item.componentId || '')
      const pose = poseMap.get(component?.name || item.name)
      const ruleIds = (point.detectionConfigs || [])
        .filter((cfg) => cfg.subjectType === 'component' && cfg.subjectId === item.componentId)
        .map((cfg) => cfg.ruleId)
      const uniqueRuleIds = Array.from(new Set(ruleIds.length ? ruleIds : (component?.ruleIds || [])))
      return {
        id: `detail-${item.componentId}`,
        installationName: component?.installationName || '-',
        facilityName: component?.facilityName || inspectionStore.inspectionDevices.find((device) => device.id === item.deviceId)?.name || '-',
        componentName: component?.name || item.name,
        ptzX: pose?.ptzX ?? 0,
        ptzY: pose?.ptzY ?? 0,
        focalLength: pose?.focalLength || '-',
        ruleNamesText: uniqueRuleIds.map((ruleId) => ruleMap.get(ruleId) || ruleId).join('、') || '-'
      }
    })
})

const filteredConfigRows = computed(() => {
  const facilityKeyword = filters.facilityKeyword.trim().toLowerCase()
  const componentKeyword = filters.componentKeyword.trim().toLowerCase()
  return mergedConfigRows.value.filter((row) => {
    const byFacility = !facilityKeyword || row.facilityName.toLowerCase().includes(facilityKeyword)
    const byComponent = !componentKeyword || row.componentName.toLowerCase().includes(componentKeyword)
    return byFacility && byComponent
  })
})

const executionRows = computed(() => (currentPoint.value?.executionRecords || []).map(item => ({
  ...item,
  executedAtText: new Date(item.executedAt).toLocaleString()
})))

const uniqueFacilityCount = computed(() => new Set(mergedConfigRows.value.map((item) => item.facilityName)).size)
const totalRuleCount = computed(() => mergedConfigRows.value.reduce((count, row) => count + (row.ruleNamesText === '-' ? 0 : row.ruleNamesText.split('、').length), 0))

function normalizeMapCoordinate(value?: number) {
  const raw = Number(value || 0)
  if (raw <= 100) return clamp(raw)
  if (raw <= 1000) return clamp(raw / 10)
  return clamp(raw / 20)
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Number(value.toFixed(2))))
}

function inferPointBizType(point: InspectionPoint) {
  const tag = String(point.description || '').match(/^\[(巡检点|充电站|维修站|通行点|停靠点)\]/)?.[1]
  if (tag === '充电站') return 'charging'
  if (tag === '维修站') return 'maintenance'
  if (tag === '通行点' || tag === '停靠点') return 'standby'
  return 'inspection'
}

function loadDetail() {
  inspectionStore.initialize()
  const point = currentPoint.value
  if (!point) return
  form.id = point.id
  form.name = point.name
  form.code = point.code
  form.mapId = point.mapId
  form.areaId = point.areaId || ''
  form.areaName = point.areaName || ''
  form.pointBizType = point.pointBizType || inferPointBizType(point)
  form.inspectionMode = point.inspectionMode || (point.pointType === 'area' ? 'area' : 'fixed')
  form.workAreaName = point.workAreaName || ''
  form.yaw = Number(point.mapPosition?.yaw || 0)
  Object.assign(constraintForm, point.parkingPoints?.[0]?.constraint || constraintForm)
  handleResetSearch()
}

function handleSave() {
  const point = currentPoint.value
  if (!point || !form.name.trim() || !form.code.trim()) {
    message.error('请补充点位名称和编码')
    return
  }
  const nextParkingPoints = (point.parkingPoints || []).map((parking, index) => ({
    ...parking,
    constraint: index === 0 ? { ...constraintForm } : parking.constraint,
    position: {
      ...parking.position,
      yaw: index === 0 ? form.yaw : parking.position.yaw
    }
  }))
  inspectionStore.saveInspectionPoint({
    ...point,
    name: form.name.trim(),
    code: form.code.trim(),
    areaId: form.areaId || undefined,
    areaName: form.areaName || '',
    pointBizType: form.pointBizType,
    inspectionMode: form.pointBizType === 'inspection' ? form.inspectionMode : undefined,
    pointType: form.pointBizType === 'inspection' && form.inspectionMode === 'area' ? InspectionPointType.AREA : InspectionPointType.FIXED,
    description: `[${getBizTypeText(form.pointBizType)}] ${form.name.trim()}`,
    workAreaName: form.workAreaName || form.areaName,
    parkingPoints: nextParkingPoints,
    updatedAt: new Date(),
    calibratedAt: point.calibratedAt,
    calibrationStatus: point.calibrationStatus || CalibrationStatus.PENDING,
    positionSource: point.positionSource || PositionSource.MAP_PICK
  })
  message.success('点位信息已保存')
  router.push(`/implementation/point/detail/${point.id}`)
}

function onAreaChange(value: string) {
  const area = areaOptions.value.find(item => item.id === value)
  form.areaName = area?.name || ''
}

function handleSearch() {
  filters.facilityKeyword = filtersDraft.facilityKeyword
  filters.componentKeyword = filtersDraft.componentKeyword
}

function handleResetSearch() {
  filtersDraft.facilityKeyword = ''
  filtersDraft.componentKeyword = ''
  filters.facilityKeyword = ''
  filters.componentKeyword = ''
}

function getBizTypeText(type: string) {
  return ({ inspection: '巡检点', charging: '充电站', maintenance: '维修站', standby: '停靠点' } as Record<string, string>)[type] || '巡检点'
}

function getPointMarkerText(type: string) {
  if (type === 'charging') return '充'
  if (type === 'maintenance') return '维'
  if (type === 'standby') return '停'
  return '巡'
}

function goToConfig() {
  router.push(`/implementation/point/create/${route.params.id}`)
}

function goToEdit() {
  router.push(`/implementation/point/edit/${route.params.id}`)
}

function goToPosition() {
  const point = currentPoint.value
  if (!point) return
  router.push({
    path: '/implementation/map/point-manage',
    query: {
      mapId: point.mapId,
      pointId: point.id
    }
  })
}

function goBack() {
  router.push({ path: '/implementation/map/point-manage', query: { tab: 'all' } })
}

onMounted(loadDetail)
</script>

<style scoped lang="css">
.inspection-point-detail {
  width: 100%;
}

.panel-card {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.search-form {
  margin-bottom: 6px;
}

.inspection-point-detail :deep(.search-form .ant-form-item) {
  margin-bottom: 12px;
}

.inspection-point-detail :deep(.ant-card-head) {
  min-height: 48px;
}

.inspection-point-detail :deep(.ant-card-head-title) {
  padding: 12px 0;
  font-weight: 600;
}

.inspection-point-detail :deep(.config-table .ant-table-thead > tr > th),
.inspection-point-detail :deep(.record-table .ant-table-thead > tr > th) {
  font-weight: 600;
}

.inspection-point-detail :deep(.summary-descriptions .ant-descriptions-item-label) {
  width: 110px;
}

.inspection-point-detail :deep(.form-grid .ant-form-item) {
  margin-bottom: 12px;
}

.map-stage {
  position: relative;
  height: 304px;
  border-radius: 10px;
  overflow: hidden;
  background: #f5f7fa;
  border: 1px solid #e8e8e8;
}

.map-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.marker {
  position: absolute;
  transform: translate(-50%, -50%);
  z-index: 1;
}

.marker-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: rgba(22, 119, 255, 0.75);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.28);
}

.marker.active .marker-dot {
  width: 30px;
  height: 30px;
  background: #1677ff;
  box-shadow: 0 0 0 6px rgba(22, 119, 255, 0.18);
}

.map-summary {
  margin-top: 12px;
}

@media (max-width: 1200px) {
  .map-stage {
    height: 240px;
  }
}
</style>
