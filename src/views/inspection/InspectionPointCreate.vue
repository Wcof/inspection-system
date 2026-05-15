<template>
  <div class="inspection-point-config">
    <a-page-header
      :title="`${point?.name || '巡检点'}配置`"
      sub-title="在当前巡检点下配置检测对象、采集位、检测配置和覆盖检查。"
      @back="goBack"
    >
      <template #extra>
        <a-space>
          <a-button @click="goToDetail">返回详情</a-button>
          <a-button type="primary" @click="handleSave">保存配置</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-row :gutter="[16, 16]" style="margin-top: 16px">
      <a-col :xs="24" :xl="10">
        <a-card title="地图位置">
          <div class="map-stage">
            <img :src="currentMap?.imageUrl || fallbackMapBackgroundUrl" alt="地图预览" class="map-image" />
            <div class="marker" :style="{ left: `${markerPosition.x}%`, top: `${markerPosition.y}%` }">
              <span class="marker-dot">巡</span>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :xl="14">
        <a-card title="当前巡检点摘要">
          <a-descriptions bordered :column="3" size="small">
            <a-descriptions-item label="巡检点">{{ point?.name || '-' }}</a-descriptions-item>
            <a-descriptions-item label="所属地图">{{ currentMap?.name || '-' }}</a-descriptions-item>
            <a-descriptions-item label="所属区域">{{ form.areaName || point?.areaName || '-' }}</a-descriptions-item>
            <a-descriptions-item label="检测对象">{{ coverageOptions.length }}</a-descriptions-item>
            <a-descriptions-item label="采集位">{{ collectionPoseRows.length }}</a-descriptions-item>
            <a-descriptions-item label="检测配置">{{ detectionConfigRows.reduce((count, item) => count + item.ruleIds.length, 0) }}</a-descriptions-item>
          </a-descriptions>
          <a-divider style="margin: 16px 0" />
          <a-descriptions bordered :column="4" size="small">
            <a-descriptions-item label="覆盖对象">{{ coverageOptions.length }}</a-descriptions-item>
            <a-descriptions-item label="采集位">{{ collectionPoseRows.length }}</a-descriptions-item>
            <a-descriptions-item label="检测配置">{{ detectionConfigRows.length }}</a-descriptions-item>
            <a-descriptions-item label="检查结果">
              <a-tag :color="coverageCheckSummary.color">
                {{ coverageCheckSummary.text }}
              </a-tag>
            </a-descriptions-item>
          </a-descriptions>
          <a-alert
            style="margin-top: 12px"
            :type="coverageCheckSummary.type"
            show-icon
            :message="coverageCheckSummary.message"
            :description="coverageCheckSummary.description"
          />
        </a-card>
      </a-col>
    </a-row>

    <a-card style="margin-top: 16px" title="巡检配置">
      <a-tabs>
        <a-tab-pane key="objects" tab="检测对象">
          <a-alert
            type="info"
            show-icon
            style="margin-bottom: 12px"
            message="检测对象用于定义该巡检点要检测的设施部件或连接部位。先选择设施，再按部件或连接部位进行多选。"
          />
          <a-table :columns="coverageColumns" :data-source="coverageObjects" row-key="localKey" :pagination="false" :scroll="{ x: 1000 }">
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'device'">
                <a-select
                  v-model:value="record.deviceId"
                  style="width: 100%"
                  allow-clear
                  placeholder="选择设施"
                  @change="onCoverageDeviceChange(record)"
                >
                  <a-select-option v-for="device in filteredDevices" :key="device.id" :value="device.id">{{ device.name }}</a-select-option>
                </a-select>
              </template>
              <template v-else-if="column.key === 'objectKind'">
                <a-select v-model:value="record.objectKind" style="width: 100%" @change="onCoverageObjectKindChange(record)">
                  <a-select-option value="component">部件</a-select-option>
                  <a-select-option value="connection">连接部位</a-select-option>
                </a-select>
              </template>
              <template v-else-if="column.key === 'target'">
                <a-select
                  v-if="record.objectKind === 'component'"
                  v-model:value="record.componentIds"
                  mode="multiple"
                  style="width: 100%"
                  allow-clear
                  placeholder="多选该设施下的部件"
                  option-filter-prop="label"
                >
                  <a-select-option
                    v-for="component in getDeviceComponents(record.deviceId)"
                    :key="component.id"
                    :value="component.id"
                    :label="component.name"
                  >
                    {{ component.name }}
                  </a-select-option>
                </a-select>
                <a-select
                  v-else
                  v-model:value="record.connectionIds"
                  mode="multiple"
                  style="width: 100%"
                  allow-clear
                  placeholder="多选该设施下的连接部位"
                  option-filter-prop="label"
                >
                  <a-select-option
                    v-for="connection in getDeviceConnections(record.deviceId)"
                    :key="connection.id"
                    :value="connection.id"
                    :label="connection.name"
                  >
                    {{ connection.name }}
                  </a-select-option>
                </a-select>
              </template>
              <template v-else-if="column.key === 'remark'">
                <a-input v-model:value="record.remark" placeholder="备注" />
              </template>
              <template v-else-if="column.key === 'actions'">
                <a-button type="link" size="small" danger @click="coverageObjects.splice(index, 1)">删除</a-button>
              </template>
            </template>
          </a-table>
          <a-button style="margin-top: 12px" @click="addCoverageObject">新增检测对象</a-button>
        </a-tab-pane>

        <a-tab-pane key="poses" tab="采集位">
          <a-alert
            type="info"
            show-icon
            style="margin-bottom: 12px"
            message="采集位会根据检测对象自动生成，也可以在编辑状态下调整位置、云台、焦距和距离参数。"
          />
          <a-table :columns="poseColumns" :data-source="collectionPoseRows" row-key="id" :pagination="false" :scroll="{ x: 1200 }">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'facility'">{{ record.deviceName }}</template>
              <template v-else-if="column.key === 'targetObject'">
                {{ record.subjectName }}
                <a-tag style="margin-left: 6px">{{ record.subjectType === 'component' ? '部件' : '连接' }}</a-tag>
              </template>
              <template v-else-if="column.key === 'parkingPoint'">
                <a-select v-model:value="record.parkingPointId" style="width: 100%" @change="syncPoseParkingName(record)">
                  <a-select-option v-for="parking in parkingOptions" :key="parking.id" :value="parking.id">{{ parking.label }}</a-select-option>
                </a-select>
              </template>
              <template v-else-if="column.key === 'ptzX'">
                <a-input-number v-model:value="record.ptzX" style="width: 100%" />
              </template>
              <template v-else-if="column.key === 'ptzY'">
                <a-input-number v-model:value="record.ptzY" style="width: 100%" />
              </template>
              <template v-else-if="column.key === 'focalLength'">
                <a-input v-model:value="record.focalLength" />
              </template>
              <template v-else-if="column.key === 'distanceMeter'">
                <a-input-number v-model:value="record.distanceMeter" :min="0" style="width: 100%" />
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <a-tab-pane key="configs" tab="检测配置">
          <a-alert
            type="info"
            show-icon
            style="margin-bottom: 12px"
            message="检测配置会根据检测对象关联的检测规则自动生成，也可以在编辑状态下调整规则和启用状态。"
          />
          <a-table :columns="detectionColumns" :data-source="detectionConfigRows" row-key="id" :pagination="false" :scroll="{ x: 900 }">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'subject'">
                {{ record.deviceName }}
              </template>
              <template v-else-if="column.key === 'targetObject'">
                {{ record.subjectName }}
                <a-tag style="margin-left: 6px">{{ record.subjectType === 'component' ? '部件' : '连接' }}</a-tag>
              </template>
              <template v-else-if="column.key === 'rule'">
                <a-select
                  v-model:value="record.ruleIds"
                  mode="multiple"
                  style="width: 100%"
                  allow-clear
                  show-search
                  option-filter-prop="label"
                  placeholder="多选检测规则"
                  @change="syncDetectionRuleNames(record)"
                >
                  <a-select-option v-for="rule in ruleOptions" :key="rule.id" :value="rule.id" :label="rule.name">{{ rule.name }}</a-select-option>
                </a-select>
              </template>
              <template v-else-if="column.key === 'enabled'">
                <a-switch v-model:checked="record.enabled" />
              </template>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-card>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useInspectionStore } from '@/stores/inspection'
import type {
  CollectionPose,
  InspectionPointCoverageObject,
  InspectionPointDetectionConfig,
} from '@/types/inspection'
import { getDetectionItemConfigs } from '@/views/implementation/detection-item-config/model'

type DetectionObjectKind = 'component' | 'connection'

interface CoverageRow {
  id: string
  localKey: string
  deviceId?: string
  objectKind: DetectionObjectKind
  componentIds: string[]
  connectionIds: string[]
  remark?: string
}

interface CoverageOption {
  id: string
  label: string
  type: 'component' | 'connection'
  subjectId: string
  subjectName: string
  deviceId?: string
  deviceName: string
  ruleIds: string[]
  ptzX: number
  ptzY: number
  remark?: string
}

interface DerivedCollectionPoseRow {
  id: string
  subjectType: 'component' | 'connection'
  subjectId: string
  subjectName: string
  deviceId?: string
  deviceName: string
  parkingPointId: string
  parkingPointName: string
  ptzX: number
  ptzY: number
  focalLength: string
  distanceMeter: number
}

interface DerivedDetectionConfigRow {
  id: string
  subjectType: 'component' | 'connection'
  subjectId: string
  subjectName: string
  deviceId?: string
  deviceName: string
  ruleIds: string[]
  ruleNames: string[]
  enabled: boolean
}

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()
const fallbackMapBackgroundUrl = new URL('../../地图.png', import.meta.url).href

const form = reactive({
  areaName: ''
})

const coverageObjects = ref<CoverageRow[]>([])
const collectionPoseRows = ref<DerivedCollectionPoseRow[]>([])
const detectionConfigRows = ref<DerivedDetectionConfigRow[]>([])
const isLoadingDetail = ref(false)

const point = computed(() => inspectionStore.inspectionPoints.find(item => item.id === String(route.params.id)))
const currentMap = computed(() => inspectionStore.inspectionMaps.find(item => item.id === point.value?.mapId))
const filteredDevices = computed(() => inspectionStore.inspectionDevices.filter(device => !point.value?.areaId || device.areaId === point.value.areaId))
const ruleOptions = computed(() => getDetectionItemConfigs().filter(item => item.enabled && item.publishStatus === '已发布'))

const parkingOptions = computed(() => (point.value?.parkingPoints || []).map(item => ({ id: item.id, label: item.name })))
const existingCollectionPoseMap = computed(() => {
  const map = new Map<string, CollectionPose>()
  ;(point.value?.parkingPoints || []).forEach((parking) => {
    parking.collectionPoses.forEach((pose) => {
      map.set(pose.targetName, pose)
    })
  })
  return map
})
const coverageOptions = computed<CoverageOption[]>(() =>
  coverageObjects.value.flatMap((row): CoverageOption[] => {
    const device = getDevice(row.deviceId)
    if (row.objectKind === 'component') {
      return row.componentIds.map((componentId) => {
        const component = getDeviceComponents(row.deviceId).find(item => item.id === componentId)
        return {
          id: buildCoverageRefId('component', componentId),
          label: `${device?.name || '未选择设施'} / 部件 / ${component?.name || componentId}`,
          type: 'component' as const,
          subjectId: componentId,
          subjectName: component?.name || componentId,
          deviceId: row.deviceId,
          deviceName: device?.name || '未选择设施',
          ruleIds: component?.ruleIds || [],
          ptzX: 0,
          ptzY: 0,
          remark: row.remark
        }
      })
    }
    return row.connectionIds.map((connectionId) => {
      const connection = getDeviceConnections(row.deviceId).find(item => item.id === connectionId)
      return {
        id: buildCoverageRefId('connection', connectionId),
        label: `${device?.name || '未选择设施'} / 连接部位 / ${connection?.name || connectionId}`,
        type: 'connection' as const,
        subjectId: connectionId,
        subjectName: connection?.name || connectionId,
        deviceId: row.deviceId,
        deviceName: device?.name || '未选择设施',
        ruleIds: connection?.ruleIds || [],
        ptzX: 0,
        ptzY: 0,
        remark: row.remark
      }
    })
  })
)
function buildDefaultCollectionPoseRows() {
  return coverageOptions.value.map((target) => {
    const existing = existingCollectionPoseMap.value.get(target.subjectName)
    const parkingPointId = existing?.parkingPointId || parkingOptions.value[0]?.id || ''
    return {
      id: `pose-${target.id}`,
      subjectType: target.type,
      subjectId: target.subjectId,
      subjectName: target.subjectName,
      deviceId: target.deviceId,
      deviceName: target.deviceName,
      parkingPointId,
      parkingPointName: getParkingName(parkingPointId),
      ptzX: existing?.ptzYaw ?? target.ptzX,
      ptzY: existing?.ptzPitch ?? target.ptzY,
      focalLength: existing?.focalLength || '默认焦距',
      distanceMeter: existing?.distanceMeter ?? 0
    }
  })
}

function buildDefaultDetectionConfigRows() {
  return coverageOptions.value.map((target) => ({
      id: `detection-${target.id}`,
      subjectType: target.type,
      subjectId: target.subjectId,
      subjectName: target.subjectName,
      deviceId: target.deviceId,
      deviceName: target.deviceName,
      ruleIds: target.ruleIds,
      ruleNames: target.ruleIds.map(getRuleName),
      enabled: true
    }))
}
const markerPosition = computed(() => ({
  x: normalizeMapCoordinate(point.value?.mapPosition?.x),
  y: normalizeMapCoordinate(point.value?.mapPosition?.y)
}))

const coverageColumns = [
  { title: '所属设施', key: 'device', width: 220 },
  { title: '检测对象', key: 'objectKind', width: 140 },
  { title: '部件 / 连接部位', key: 'target', width: 320 },
  { title: '备注', key: 'remark', width: 220 },
  { title: '操作', key: 'actions', width: 90 }
]

const poseColumns = [
  { title: '所属设施', key: 'facility', width: 220 },
  { title: '检测部件/连接', key: 'targetObject', width: 240 },
  { title: '云台X轴', key: 'ptzX', width: 110 },
  { title: '云台Y轴', key: 'ptzY', width: 110 },
  { title: '焦距', key: 'focalLength', width: 120 },
  { title: '距离', key: 'distanceMeter', width: 110 }
]

const detectionColumns = [
  { title: '所属设施', key: 'subject', width: 240 },
  { title: '检测部件/连接', key: 'targetObject', width: 260 },
  { title: '检测规则', key: 'rule', width: 320 },
  { title: '启用状态', key: 'enabled', width: 110 }
]

const coverageCheckItems = computed(() => {
  const items: Array<{ status: 'ok' | 'warning'; text: string }> = []
  if (!coverageOptions.value.length) {
    items.push({ status: 'warning', text: '未配置检测对象' })
  } else {
    items.push({ status: 'ok', text: `已配置 ${coverageOptions.value.length} 个检测对象` })
  }
  if (!collectionPoseRows.value.length) {
    items.push({ status: 'warning', text: '未配置采集位' })
  } else {
    items.push({ status: 'ok', text: `已配置 ${collectionPoseRows.value.length} 个采集位` })
  }
  const missingRules = detectionConfigRows.value.filter(item => !item.ruleIds.length).length
  if (missingRules) {
    items.push({ status: 'warning', text: `${missingRules} 个检测对象未在部件/连接中关联规则` })
  } else {
    items.push({ status: 'ok', text: '检测对象已按部件/连接规则生成检测配置' })
  }
  const coveredTargetIds = new Set(detectionConfigRows.value.filter(item => item.ruleIds.length && item.enabled).map(item => item.subjectId))
  const missingDetectionObjects = coverageOptions.value.filter(item => !coveredTargetIds.has(item.subjectId))
  if (missingDetectionObjects.length) {
    items.push({ status: 'warning', text: `${missingDetectionObjects.length} 个检测对象尚未配置检测项` })
  } else {
    items.push({ status: 'ok', text: '检测对象均已配置检测项' })
  }
  return items
})

const coverageCheckSummary = computed(() => {
  const hasWarning = coverageCheckItems.value.some(item => item.status !== 'ok')
  return hasWarning
    ? {
        text: '存在待补齐',
        color: 'orange',
        type: 'warning' as const,
        message: '当前巡检点存在待补齐项',
        description: coverageCheckItems.value.map(item => item.text).join('；')
      }
    : {
        text: '配置完整',
        color: 'green',
        type: 'success' as const,
        message: '当前巡检点配置完整',
        description: coverageCheckItems.value.map(item => item.text).join('；')
      }
})

function loadDetail() {
  inspectionStore.initialize()
  const currentPoint = point.value
  if (!currentPoint) return
  isLoadingDetail.value = true
  form.areaName = currentPoint.areaName || ''
  coverageObjects.value = buildCoverageRows(currentPoint.coverageObjects || [])
  collectionPoseRows.value = buildDefaultCollectionPoseRows()
  detectionConfigRows.value = buildDetectionRowsFromPoint()
  isLoadingDetail.value = false
}

function addCoverageObject() {
  coverageObjects.value.push({
    id: `coverage-${Date.now()}`,
    localKey: `coverage-${Date.now()}`,
    objectKind: 'component',
    componentIds: [],
    connectionIds: [],
    remark: '',
  })
}

function onCoverageDeviceChange(record: CoverageRow) {
  record.componentIds = []
  record.connectionIds = []
}

function onCoverageObjectKindChange(record: CoverageRow) {
  record.componentIds = []
  record.connectionIds = []
}

function getDevice(deviceId?: string) {
  return inspectionStore.inspectionDevices.find(item => item.id === deviceId)
}

function getDeviceComponents(deviceId?: string) {
  return inspectionStore.inspectionDevices.find(item => item.id === deviceId)?.assetComponents || []
}

function getDeviceConnections(deviceId?: string) {
  return inspectionStore.inspectionDevices.find(item => item.id === deviceId)?.connectionObjects || []
}

function getParkingName(parkingPointId?: string) {
  return parkingOptions.value.find(item => item.id === parkingPointId)?.label || '-'
}

function getRuleName(ruleId: string) {
  return ruleOptions.value.find(item => item.id === ruleId)?.name || ruleId
}

function getSubjectKey(item: { subjectType: string; subjectId: string }) {
  return `${item.subjectType}:${item.subjectId}`
}

function buildCoverageRefId(type: DetectionObjectKind, subjectId: string) {
  return `${type}:${subjectId}`
}

function buildCoverageRows(source: InspectionPointCoverageObject[]) {
  const rowMap = new Map<string, CoverageRow>()
  source
    .filter(item => item.type === 'component' || item.type === 'connection')
    .forEach((item) => {
      const objectKind = item.type as DetectionObjectKind
      const mapKey = `${item.deviceId || 'unknown'}-${objectKind}-${item.remark || ''}`
      const existing = rowMap.get(mapKey)
      const row = existing || {
        id: `coverage-row-${rowMap.size + 1}`,
        localKey: `coverage-row-${rowMap.size + 1}`,
        deviceId: item.deviceId,
        objectKind,
        componentIds: [],
        connectionIds: [],
        remark: item.remark || ''
      }
      if (objectKind === 'component' && item.componentId && !row.componentIds.includes(item.componentId)) {
        row.componentIds.push(item.componentId)
      }
      if (objectKind === 'connection' && item.connectionId && !row.connectionIds.includes(item.connectionId)) {
        row.connectionIds.push(item.connectionId)
      }
      rowMap.set(mapKey, row)
    })
  return Array.from(rowMap.values())
}

function buildDetectionRowsFromPoint() {
  const rowMap = new Map<string, DerivedDetectionConfigRow>()
  ;(point.value?.detectionConfigs || [])
    .filter(item => item.subjectType === 'component' || item.subjectType === 'connection')
    .forEach((item) => {
      const subjectType = item.subjectType as DetectionObjectKind
      const target = coverageOptions.value.find(option => option.type === item.subjectType && option.subjectId === item.subjectId)
      const key = getSubjectKey(item)
      const row = rowMap.get(key) || {
        id: `detection-${buildCoverageRefId(subjectType, item.subjectId)}`,
        subjectType,
        subjectId: item.subjectId,
        subjectName: item.subjectName,
        deviceId: target?.deviceId,
        deviceName: target?.deviceName || '',
        ruleIds: [],
        ruleNames: [],
        enabled: item.enabled
      }
      if (item.ruleId && !row.ruleIds.includes(item.ruleId)) {
        row.ruleIds.push(item.ruleId)
        row.ruleNames.push(getRuleName(item.ruleId))
      }
      row.enabled = row.enabled && item.enabled
      rowMap.set(key, row)
    })
  const existingRows = Array.from(rowMap.values())
  return existingRows.length ? existingRows : buildDefaultDetectionConfigRows()
}

function syncEditableRowsWithCoverage() {
  const nextPoseRows = buildDefaultCollectionPoseRows()
  const existingPoseMap = new Map(collectionPoseRows.value.map(item => [getSubjectKey(item), item]))
  collectionPoseRows.value = nextPoseRows.map((row) => ({
    ...row,
    ...(existingPoseMap.get(getSubjectKey(row)) || {}),
    deviceId: row.deviceId,
    deviceName: row.deviceName,
    subjectName: row.subjectName
  }))

  const nextDetectionRows = buildDefaultDetectionConfigRows()
  const existingDetectionMap = new Map(detectionConfigRows.value.map(item => [getSubjectKey(item), item]))
  detectionConfigRows.value = nextDetectionRows.map((row) => ({
    ...row,
    ...(existingDetectionMap.get(getSubjectKey(row)) || {}),
    deviceId: row.deviceId,
    deviceName: row.deviceName,
    subjectName: row.subjectName
  }))
}

function syncPoseParkingName(record: DerivedCollectionPoseRow) {
  record.parkingPointName = getParkingName(record.parkingPointId)
}

function syncDetectionRuleNames(record: DerivedDetectionConfigRow) {
  record.ruleNames = record.ruleIds.map(getRuleName)
}

function normalizeCoverageObjects() {
  return coverageOptions.value.map((item): InspectionPointCoverageObject => ({
    id: item.id,
    type: item.type,
    name: item.subjectName,
    deviceId: item.deviceId,
    componentId: item.type === 'component' ? item.subjectId : undefined,
    connectionId: item.type === 'connection' ? item.subjectId : undefined,
    coverageType: 'primary',
    coverageStatus: 'coverable',
    requiredCoverage: true,
    remark: item.remark
  }))
}

function normalizeParkingPoints() {
  const currentPoint = point.value
  const sourceParkingPoints = currentPoint?.parkingPoints || []
  return sourceParkingPoints.map((parking) => ({
    ...parking,
    collectionPoses: collectionPoseRows.value
      .filter(item => item.parkingPointId === parking.id)
      .map(item => ({
        id: item.id,
        parkingPointId: item.parkingPointId,
        targetName: item.subjectName,
        targetType: item.subjectType,
        direction: 'front' as const,
        distanceMeter: item.distanceMeter,
        ptzYaw: item.ptzX,
        ptzPitch: item.ptzY,
        focalLength: item.focalLength,
        method: 'optical' as const,
        collectableCondition: '按检测对象默认采集参数回显'
      }))
  }))
}

function normalizeDetectionConfigs() {
  return detectionConfigRows.value
    .filter(item => item.ruleIds.length && item.enabled)
    .flatMap((item) => item.ruleIds.map((ruleId): InspectionPointDetectionConfig => ({
    id: `${item.id}-${ruleId}`,
    inspectionPointId: point.value?.id || '',
    subjectType: item.subjectType,
    subjectId: item.subjectId,
    subjectName: item.subjectName,
    ruleId,
    collectionPoseId: `pose-${buildCoverageRefId(item.subjectType, item.subjectId)}`,
    requiredCoverage: true,
    failureStrategy: 'manual_review',
    enabled: item.enabled,
    updatedAt: new Date().toISOString()
  })))
}

watch(coverageOptions, () => {
  if (isLoadingDetail.value) return
  syncEditableRowsWithCoverage()
}, { deep: true })

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

.map-stage {
  position: relative;
  height: 260px;
  border-radius: 10px;
  overflow: hidden;
  background: #f6f8fb;
  border: 1px solid #e5e7eb;
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
  box-shadow: 0 0 0 6px rgba(22, 119, 255, 0.18);
}
</style>
