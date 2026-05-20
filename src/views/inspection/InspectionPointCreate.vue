<template>
  <div class="inspection-point-config">
    <a-page-header
      :title="`${point?.name || '巡检点'}配置`"
      sub-title="按装置、设施、部件统一维护巡检配置。"
      @back="goBack"
    >
      <template #extra>
        <a-space>
          <a-button @click="goToDetail">返回详情</a-button>
          <a-button type="primary" @click="handleSave">保存配置</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-row :gutter="[16, 16]" style="margin-top: 12px">
      <a-col :xs="24" :xl="10">
        <a-card title="地图位置" class="panel-card map-card">
          <div class="map-stage">
            <img :src="currentMap?.imageUrl || fallbackMapBackgroundUrl" alt="地图预览" class="map-image" />
            <div class="marker" :style="{ left: `${markerPosition.x}%`, top: `${markerPosition.y}%` }">
              <span class="marker-dot">巡</span>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :xl="14">
        <a-card title="当前巡检点摘要" class="panel-card">
          <a-descriptions bordered :column="3" size="small">
            <a-descriptions-item label="巡检点">{{ point?.name || '-' }}</a-descriptions-item>
            <a-descriptions-item label="所属地图">{{ currentMap?.name || '-' }}</a-descriptions-item>
            <a-descriptions-item label="所属区域">{{ point?.areaName || '-' }}</a-descriptions-item>
            <a-descriptions-item label="关联设施数">{{ uniqueFacilityCount }}</a-descriptions-item>
            <a-descriptions-item label="关联部件数">{{ totalRuleCount }}</a-descriptions-item>
            <a-descriptions-item label="巡检规则数">{{ configRows.length }}</a-descriptions-item>

          </a-descriptions>
        </a-card>
      </a-col>
    </a-row>

    <a-card style="margin-top: 12px" title="巡检配置" class="panel-card config-card">
      <a-alert
        type="info"
        show-icon
        style="margin-bottom: 12px"
        message="检测对象统一配置：按装置、设施、部件维护云台参数与检测规则。"
      />

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

      <a-table class="config-table" :columns="configColumns" :data-source="filteredConfigRows" row-key="id" :pagination="false" :scroll="{ x: 1400 }" size="small">
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'installationId'">
            <a-select v-model:value="record.installationId" style="width: 100%" placeholder="选择装置" @change="onInstallationChange(record)">
              <a-select-option v-for="item in installationOptions" :key="item.id" :value="item.id">{{ item.name }}</a-select-option>
            </a-select>
          </template>

          <template v-else-if="column.key === 'facilityId'">
            <a-select v-model:value="record.facilityId" style="width: 100%" placeholder="选择设施" @change="onFacilityChange(record)">
              <a-select-option
                v-for="item in getFacilityOptions(record.installationId)"
                :key="item.id"
                :value="item.id"
              >
                {{ item.name }}
              </a-select-option>
            </a-select>
          </template>

          <template v-else-if="column.key === 'componentId'">
            <a-select v-model:value="record.componentId" style="width: 100%" placeholder="选择部件" @change="onComponentChange(record)">
              <a-select-option
                v-for="item in getComponentOptions(record.facilityId)"
                :key="item.id"
                :value="item.id"
              >
                {{ item.name }}
              </a-select-option>
            </a-select>
          </template>

          <template v-else-if="column.key === 'ptzX'">
            <a-input-number v-model:value="record.ptzX" style="width: 100%" />
          </template>

          <template v-else-if="column.key === 'ptzY'">
            <a-input-number v-model:value="record.ptzY" style="width: 100%" />
          </template>

          <template v-else-if="column.key === 'focalLength'">
            <a-input v-model:value="record.focalLength" placeholder="默认焦距" />
          </template>

          <template v-else-if="column.key === 'ruleIds'">
            <a-select
              v-model:value="record.ruleIds"
              mode="multiple"
              style="width: 100%"
              allow-clear
              show-search
              option-filter-prop="label"
              placeholder="选择检测规则"
            >
              <a-select-option v-for="rule in ruleOptions" :key="rule.id" :value="rule.id" :label="rule.name">{{ rule.name }}</a-select-option>
            </a-select>
          </template>

          <template v-else-if="column.key === 'actions'">
            <a-button type="link" size="small" danger @click="configRows.splice(index, 1)">删除</a-button>
          </template>
        </template>
      </a-table>

      <a-button style="margin-top: 12px" @click="addConfigRow">新增配置</a-button>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useInspectionStore } from '@/stores/inspection'
import type { InspectionPointCoverageObject, InspectionPointDetectionConfig } from '@/types/inspection'
import { getDetectionItemConfigs } from '@/views/implementation/detection-item-config/model'

type ConfigRow = {
  id: string
  installationId?: string
  facilityId?: string
  componentId?: string
  ptzX: number
  ptzY: number
  focalLength: string
  ruleIds: string[]
  remark?: string
}

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()
const fallbackMapBackgroundUrl = new URL('../../地图.png', import.meta.url).href

const filters = reactive({
  facilityKeyword: '',
  componentKeyword: ''
})

const filtersDraft = reactive({
  facilityKeyword: '',
  componentKeyword: ''
})

const configRows = ref<ConfigRow[]>([])

const point = computed(() => inspectionStore.inspectionPoints.find((item) => item.id === String(route.params.id)))
const currentMap = computed(() => inspectionStore.inspectionMaps.find((item) => item.id === point.value?.mapId))
const installationOptions = computed(() => inspectionStore.installations.filter((item) => !point.value?.areaId || item.areaId === point.value.areaId))
const ruleOptions = computed(() => getDetectionItemConfigs().filter((item) => item.enabled && item.publishStatus === '已发布'))

const markerPosition = computed(() => ({
  x: normalizeMapCoordinate(point.value?.mapPosition?.x),
  y: normalizeMapCoordinate(point.value?.mapPosition?.y)
}))

const uniqueFacilityCount = computed(() => new Set(configRows.value.map((item) => item.facilityId).filter(Boolean)).size)
const totalRuleCount = computed(() => configRows.value.reduce((count, item) => count + item.ruleIds.length, 0))

const configColumns = [
  { title: '装置', key: 'installationId', width: 190 },
  { title: '设施', key: 'facilityId', width: 200 },
  { title: '部件', key: 'componentId', width: 220 },
  { title: '云台X轴', key: 'ptzX', width: 120 },
  { title: '云台Y轴', key: 'ptzY', width: 120 },
  { title: '焦距', key: 'focalLength', width: 140 },
  { title: '检测规则', key: 'ruleIds' },
  { title: '操作', key: 'actions', width: 90 }
]

const filteredConfigRows = computed(() => {
  const facilityKeyword = filters.facilityKeyword.trim().toLowerCase()
  const componentKeyword = filters.componentKeyword.trim().toLowerCase()
  return configRows.value.filter((row) => {
    const facilityName = getFacilityName(row.facilityId).toLowerCase()
    const componentName = getComponentName(row.componentId).toLowerCase()
    const byFacility = !facilityKeyword || facilityName.includes(facilityKeyword)
    const byComponent = !componentKeyword || componentName.includes(componentKeyword)
    return byFacility && byComponent
  })
})

function getFacilityOptions(installationId?: string) {
  return inspectionStore.inspectionDevices.filter((item) => {
    const byArea = !point.value?.areaId || item.areaId === point.value.areaId
    const byInstallation = !installationId || item.installationId === installationId
    return byArea && byInstallation
  })
}

function getComponentOptions(facilityId?: string) {
  return inspectionStore.facilityComponents.filter((item) => item.facilityId === facilityId)
}

function getFacilityName(facilityId?: string) {
  return inspectionStore.inspectionDevices.find((item) => item.id === facilityId)?.name || ''
}

function getComponentName(componentId?: string) {
  return inspectionStore.facilityComponents.find((item) => item.id === componentId)?.name || ''
}

function onInstallationChange(row: ConfigRow) {
  row.facilityId = undefined
  row.componentId = undefined
  row.ruleIds = []
}

function onFacilityChange(row: ConfigRow) {
  row.componentId = undefined
  row.ruleIds = []
}

function onComponentChange(row: ConfigRow) {
  const component = inspectionStore.facilityComponents.find((item) => item.id === row.componentId)
  row.ruleIds = [...(component?.ruleIds || [])]
}

function addConfigRow() {
  configRows.value.push({
    id: `cfg-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    ptzX: 0,
    ptzY: 0,
    focalLength: '默认焦距',
    ruleIds: []
  })
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

function loadDetail() {
  inspectionStore.initialize()
  const currentPoint = point.value
  if (!currentPoint) return

  const existingPoseMap = new Map<string, { ptzX: number; ptzY: number; focalLength: string }>()
  ;(currentPoint.parkingPoints || []).forEach((parking) => {
    ;(parking.collectionPoses || []).forEach((pose) => {
      existingPoseMap.set(pose.targetName, {
        ptzX: pose.ptzYaw,
        ptzY: pose.ptzPitch,
        focalLength: pose.focalLength || '默认焦距'
      })
    })
  })

  const rows: ConfigRow[] = []
  ;(currentPoint.coverageObjects || [])
    .filter((item) => item.type === 'component' && item.componentId)
    .forEach((item) => {
      const component = inspectionStore.facilityComponents.find((fc) => fc.id === item.componentId)
      const pose = existingPoseMap.get(component?.name || item.name)
      const ruleIds = (currentPoint.detectionConfigs || [])
        .filter((cfg) => cfg.subjectType === 'component' && cfg.subjectId === item.componentId)
        .map((cfg) => cfg.ruleId)
      rows.push({
        id: `cfg-${item.componentId}`,
        installationId: component?.installationId,
        facilityId: component?.facilityId || item.deviceId,
        componentId: item.componentId,
        ptzX: pose?.ptzX ?? 0,
        ptzY: pose?.ptzY ?? 0,
        focalLength: pose?.focalLength || '默认焦距',
        ruleIds: Array.from(new Set(ruleIds.length ? ruleIds : (component?.ruleIds || []))),
        remark: item.remark
      })
    })

  configRows.value = rows
  if (!configRows.value.length) addConfigRow()
  handleResetSearch()
}

function normalizeCoverageObjects() {
  return configRows.value
    .filter((item) => item.facilityId && item.componentId)
    .map((item): InspectionPointCoverageObject => ({
      id: `component:${item.componentId}`,
      type: 'component',
      name: getComponentName(item.componentId) || item.componentId || '',
      deviceId: item.facilityId,
      componentId: item.componentId,
      coverageType: 'primary',
      coverageStatus: 'coverable',
      requiredCoverage: true,
      remark: item.remark
    }))
}

function normalizeParkingPoints() {
  const currentPoint = point.value
  const sourceParkingPoints = currentPoint?.parkingPoints || []
  const defaultParkingPointId = sourceParkingPoints[0]?.id

  const rowByParking = new Map<string, ConfigRow[]>()
  configRows.value.forEach((row) => {
    if (!defaultParkingPointId || !row.componentId) return
    const list = rowByParking.get(defaultParkingPointId) || []
    list.push(row)
    rowByParking.set(defaultParkingPointId, list)
  })

  return sourceParkingPoints.map((parking) => ({
    ...parking,
    collectionPoses: (rowByParking.get(parking.id) || []).map((row) => ({
      id: `pose-component:${row.componentId}`,
      parkingPointId: parking.id,
      targetName: getComponentName(row.componentId) || row.componentId || '',
      targetType: 'component' as const,
      direction: 'front' as const,
      distanceMeter: 0,
      ptzYaw: row.ptzX,
      ptzPitch: row.ptzY,
      focalLength: row.focalLength,
      method: 'optical' as const,
      collectableCondition: '按检测对象默认采集参数回显'
    }))
  }))
}

function normalizeDetectionConfigs() {
  return configRows.value
    .filter((item) => item.componentId && item.ruleIds.length)
    .flatMap((item) =>
      item.ruleIds.map(
        (ruleId): InspectionPointDetectionConfig => ({
          id: `cfg-${item.componentId}-${ruleId}`,
          inspectionPointId: point.value?.id || '',
          subjectType: 'component',
          subjectId: item.componentId || '',
          subjectName: getComponentName(item.componentId) || item.componentId || '',
          ruleId,
          collectionPoseId: `pose-component:${item.componentId}`,
          requiredCoverage: true,
          failureStrategy: 'manual_review',
          enabled: true,
          updatedAt: new Date().toISOString()
        })
      )
    )
}

function handleSave() {
  const currentPoint = point.value
  if (!currentPoint) return
  inspectionStore.saveInspectionPoint({
    ...currentPoint,
    coverageObjects: normalizeCoverageObjects(),
    parkingPoints: normalizeParkingPoints(),
    detectionConfigs: normalizeDetectionConfigs(),
    updatedAt: new Date()
  })
  message.success('巡检点配置已保存')
}

function normalizeMapCoordinate(value?: number) {
  const raw = Number(value || 0)
  if (raw <= 100) return clamp(raw)
  if (raw <= 1000) return clamp(raw / 10)
  return clamp(raw / 20)
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Number(value.toFixed(2))))
}

function goBack() {
  router.push({ path: '/implementation/map/point-manage', query: { tab: 'inspection' } })
}

function goToDetail() {
  router.push(`/implementation/point/detail/${route.params.id}`)
}

onMounted(loadDetail)
</script>

<style scoped lang="css">
.inspection-point-config {
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

.inspection-point-config :deep(.search-form .ant-form-item) {
  margin-bottom: 12px;
}

.inspection-point-config :deep(.ant-card-head) {
  min-height: 48px;
}

.inspection-point-config :deep(.ant-card-head-title) {
  padding: 12px 0;
  font-weight: 600;
}

.inspection-point-config :deep(.config-table .ant-table-thead > tr > th) {
  font-weight: 600;
}

.inspection-point-config :deep(.ant-descriptions-bordered .ant-descriptions-item-label) {
  width: 110px;
}

.map-stage {
  position: relative;
  height: 248px;
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
  width: 30px;
  height: 30px;
  border-radius: 999px;
  background: #1677ff;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 0 0 6px rgba(22, 119, 255, 0.16);
}

@media (max-width: 1200px) {
  .map-stage {
    height: 220px;
  }
}
</style>
