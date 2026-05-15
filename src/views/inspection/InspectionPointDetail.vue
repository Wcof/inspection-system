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

    <a-row :gutter="[16, 16]" style="margin-top: 16px">
      <a-col :xs="24" :xl="14">
        <a-card :title="isEditMode ? '基础信息' : '当前巡检点摘要'">
          <a-form v-if="isEditMode" layout="vertical">
            <a-row :gutter="16">
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

            <a-row :gutter="16">
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

            <a-row :gutter="16">
              <a-col :span="8"><a-form-item label="装置区 / 分区"><a-input v-model:value="form.workAreaName" :disabled="!isEditMode" /></a-form-item></a-col>
              <a-col :span="8"><a-form-item label="地图坐标"><a-input :value="coordinateText" disabled /></a-form-item></a-col>
              <a-col :span="8"><a-form-item label="车头朝向"><a-input-number v-model:value="form.yaw" :disabled="!isEditMode" :min="0" :max="360" style="width: 100%" /></a-form-item></a-col>
            </a-row>
          </a-form>
          <template v-else>
            <a-descriptions bordered :column="3" size="small">
              <a-descriptions-item label="巡检点">{{ currentPoint?.name || '-' }}</a-descriptions-item>
              <a-descriptions-item label="所属地图">{{ currentMap?.name || '-' }}</a-descriptions-item>
              <a-descriptions-item label="所属区域">{{ form.areaName || currentPoint?.areaName || '-' }}</a-descriptions-item>
              <a-descriptions-item label="检测对象">{{ coverageRows.length }}</a-descriptions-item>
              <a-descriptions-item label="采集位">{{ poseRows.length }}</a-descriptions-item>
              <a-descriptions-item label="检测配置">{{ detectionRows.reduce((count, item) => count + item.ruleNames.length, 0) }}</a-descriptions-item>
            </a-descriptions>
            <a-divider style="margin: 16px 0" />
            <a-descriptions bordered :column="4" size="small">
              <a-descriptions-item label="覆盖对象">{{ coverageRows.length }}</a-descriptions-item>
              <a-descriptions-item label="采集位">{{ poseRows.length }}</a-descriptions-item>
              <a-descriptions-item label="检测配置">{{ detectionRows.length }}</a-descriptions-item>
              <a-descriptions-item label="检查结果">
                <a-tag :color="coverageCheckStatus.color">{{ coverageCheckStatus.text }}</a-tag>
              </a-descriptions-item>
            </a-descriptions>
            <a-alert
              style="margin-top: 12px"
              :type="coverageCheckStatus.type"
              show-icon
              :message="coverageCheckStatus.message"
              :description="coverageCheckStatus.description"
            />
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
          <a-card>
            <a-tabs>
              <a-tab-pane key="coverage" tab="覆盖对象">
                <a-table
                  :columns="coverageColumns"
                  :data-source="coverageTreeRows"
                  row-key="id"
                  :pagination="false"
                  size="small"
                  :expand-row-by-click="true"
                  :default-expand-all-rows="true"
                />
              </a-tab-pane>
              <a-tab-pane key="poses" tab="采集位">
                <a-table :columns="poseColumns" :data-source="poseRows" row-key="id" :pagination="false" />
              </a-tab-pane>
              <a-tab-pane key="detection" tab="检测配置">
                <a-table :columns="detectionColumns" :data-source="detectionRows" row-key="id" :pagination="false" />
              </a-tab-pane>
            </a-tabs>
          </a-card>
        </a-col>

        <a-col :span="24">
          <a-card title="执行记录">
            <a-table :columns="recordColumns" :data-source="executionRows" row-key="id" :pagination="false" />
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

    <template v-else>
      <a-row :gutter="[16, 16]" style="margin-top: 16px">
        
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

const coverageColumns = [
  { title: '所属设施', dataIndex: 'deviceName', key: 'deviceName', width: 220 },
  { title: '检测对象', dataIndex: 'objectKindText', key: 'objectKindText', width: 140 },
  { title: '部件 / 连接部位', dataIndex: 'name', key: 'name', width: 320 },
  { title: '备注', dataIndex: 'remark', key: 'remark' , width: 120}
]

const poseColumns = [
  { title: '所属设施', dataIndex: 'deviceName', key: 'facility', width: 220 },
  { title: '检测部件/连接', dataIndex: 'targetObjectText', key: 'targetObject', width: 240 },
  { title: '云台X轴', dataIndex: 'ptzYaw', key: 'ptzX', width: 110 },
  { title: '云台Y轴', dataIndex: 'ptzPitch', key: 'ptzY', width: 110 },
  { title: '焦距', dataIndex: 'focalLength', key: 'focalLength', width: 120 },
  { title: '距离', dataIndex: 'distanceText', key: 'distanceMeter', width: 110 }
]

const detectionColumns = [
  { title: '所属设施', dataIndex: 'deviceName', key: 'subject', width: 240 },
  { title: '检测部件/连接', dataIndex: 'targetObjectText', key: 'targetObject', width: 260 },
  { title: '检测规则', dataIndex: 'ruleNamesText', key: 'rule', width: 320 },
  { title: '状态', dataIndex: 'enabledText', key: 'enabledText', width: 90 }
]

const recordColumns = [
  { title: '任务名称', dataIndex: 'taskName', key: 'taskName' },
  { title: '执行时间', dataIndex: 'executedAtText', key: 'executedAtText', width: 190 },
  { title: '结果摘要', dataIndex: 'resultSummary', key: 'resultSummary' },
  { title: '执行载体', dataIndex: 'executor', key: 'executor', width: 140 }
]

const areaOptions = computed(() => currentMap.value?.regions || [])

const pageTitle = computed(() => `${form.name || currentPoint.value?.name || '点位'}${isEditMode.value ? '编辑' : '详情'}`)
const pageSubtitle = computed(() => isInspectionPoint.value
  ? '显示地图位置，并围绕覆盖对象、采集位、检测配置和覆盖检查查看当前巡检点。'
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

const coverageRows = computed(() => (currentPoint.value?.coverageObjects || []).map((item) => ({
  ...item,
  deviceName: item.deviceId ? inspectionStore.inspectionDevices.find(device => device.id === item.deviceId)?.name || '-' : item.areaName || '-',
  objectKindText: getCoverageTypeText(item.type),
  typeText: getCoverageTypeText(item.type)
})))

const coverageTreeRows = computed(() => {
  const rows = coverageRows.value
  const devices = inspectionStore.inspectionDevices
  const deviceIds = Array.from(new Set(rows.map(item => item.deviceId).filter((id): id is string => Boolean(id))))
  const groups = deviceIds.map((deviceId) => {
    const asset = rows.find(item => item.deviceId === deviceId && item.type === 'asset')
    const device = devices.find(item => item.id === deviceId)
    return {
      id: `asset-${deviceId}`,
      name: asset?.name || device?.name || deviceId,
      type: 'asset' as const,
      deviceName: device?.name || asset?.name || deviceId,
      objectKindText: '设施',
      typeText: '设施',
      remark: asset?.remark || '',
      children: rows.filter(item => item.deviceId === deviceId && (item.type === 'component' || item.type === 'connection'))
    }
  })
  const standaloneRows = rows.filter(item => !item.deviceId)
  if (standaloneRows.length) {
    groups.push({
      id: 'standalone',
      name: '其他覆盖对象',
      type: 'asset',
      deviceName: '其他覆盖对象',
      objectKindText: '设施',
      typeText: '设施',
      remark: '',
      children: standaloneRows
    })
  }
  return groups
})

const poseRows = computed(() => (currentPoint.value?.parkingPoints || []).flatMap((parking) =>
  parking.collectionPoses.map((pose) => ({
    ...pose,
    deviceName: getDeviceNameBySubject(pose.targetType, pose.targetName),
    parkingPointName: parking.name,
    targetTypeText: getCoverageTypeText(pose.targetType),
    targetObjectText: `${pose.targetName}（${pose.targetType === 'component' ? '部件' : '连接'}）`,
    directionText: ({ front: '正拍', side: '侧拍', oblique: '斜拍', near: '近拍', overview: '全景' } as Record<string, string>)[pose.direction] || pose.direction,
    methodText: ({ optical: '光学', thermal: '热成像', gas: '气体', safety: '安全行为', multi_spectrum: '多光谱' } as Record<string, string>)[pose.method] || pose.method,
    distanceText: `${pose.distanceMeter}m`
  }))
))

const detectionRows = computed(() => {
  const rules = getDetectionItemConfigs()
  const rowMap = new Map<string, any>()
  ;(currentPoint.value?.detectionConfigs || []).forEach((config) => {
    const key = `${config.subjectType}:${config.subjectId}`
    const row = rowMap.get(key) || {
      ...config,
      deviceName: getDeviceNameBySubject(config.subjectType, config.subjectName),
      targetObjectText: `${config.subjectName}（${config.subjectType === 'component' ? '部件' : '连接'}）`,
      ruleNames: [],
      enabled: true
    }
    const rule = rules.find(rule => rule.id === config.ruleId)
    row.ruleNames.push(rule?.name || config.ruleId)
    row.enabled = row.enabled && config.enabled
    row.enabledText = row.enabled ? '启用' : '停用'
    rowMap.set(key, row)
  })
  return Array.from(rowMap.values()).map((row) => {
    return {
      ...row,
      ruleNamesText: row.ruleNames.join('、') || '-'
    }
  })
})

const executionRows = computed(() => (currentPoint.value?.executionRecords || []).map(item => ({
  ...item,
  executedAtText: new Date(item.executedAt).toLocaleString()
})))

const coverageCheckStatus = computed(() => {
  const point = currentPoint.value
  const coverageCount = point?.coverageObjects?.length || 0
  const poseCount = poseRows.value.length
  const configCount = detectionRows.value.filter(item => item.enabled).length
  if (!coverageCount) {
    return { text: '未配置对象', color: 'red', type: 'warning' as const, message: '当前巡检点未配置覆盖对象', description: '请先进入巡检配置页，选择设施、部件或连接对象作为巡检覆盖范围。' }
  }
  if (!poseCount || !configCount) {
    return { text: '存在漏配', color: 'orange', type: 'warning' as const, message: '当前巡检点采集位或检测配置不完整', description: '请补齐采集位和检测配置，避免执行时出现漏检。' }
  }
  return { text: '配置完整', color: 'green', type: 'success' as const, message: '当前巡检点覆盖配置完整', description: '已具备覆盖对象、采集位和检测配置，可用于任务执行。' }
})

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

function getCoverageTypeText(type: string) {
  return ({
    asset: '设施',
    component: '设施部件',
    connection: '连接部位',
    area_environment: '区域环境',
    safety_behavior: '人员行为'
  } as Record<string, string>)[type] || type
}

function getDeviceNameBySubject(subjectType: string, subjectName: string) {
  if (subjectType === 'component' || subjectType === 'connection') {
    return currentPoint.value?.coverageObjects?.find(item => item.name === subjectName)?.deviceId
      ? inspectionStore.inspectionDevices.find(device => device.id === currentPoint.value?.coverageObjects?.find(item => item.name === subjectName)?.deviceId)?.name || '-'
      : currentPoint.value?.areaName || '-'
  }
  return currentPoint.value?.areaName || '-'
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

.map-stage {
  position: relative;
  height: 320px;
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
  width: 24px;
  height: 24px;
  border-radius: 999px;
  background: rgba(30, 64, 175, 0.72);
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 8px 20px rgba(30, 64, 175, 0.24);
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
</style>
