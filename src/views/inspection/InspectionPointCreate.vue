<template>
  <div class="inspection-point-config">
    <a-page-header
      :title="`${point?.name || '巡检点'}配置`"
      sub-title="在当前巡检点下配置覆盖对象、采集位、检测配置和覆盖检查。"
      @back="goBack"
    >
      <template #extra>
        <a-space>
          <a-button @click="goToDetail">返回详情</a-button>
          <a-button type="primary" @click="handleSave">保存配置</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-card style="margin-top: 16px" title="覆盖对象">
      <a-alert
        type="info"
        show-icon
        style="margin-bottom: 12px"
        message="覆盖对象用于定义该巡检点要关注的设施、真实部件、连接部位或区域环境。"
      />
      <a-table :columns="coverageColumns" :data-source="coverageObjects" row-key="localKey" :pagination="false" :scroll="{ x: 1500 }">
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'type'">
            <a-select v-model:value="record.type" style="width: 100%" @change="onCoverageTypeChange(record)">
              <a-select-option value="asset">设施</a-select-option>
              <a-select-option value="component">设施部件</a-select-option>
              <a-select-option value="connection">连接部位</a-select-option>
              <a-select-option value="area_environment">区域环境</a-select-option>
              <a-select-option value="safety_behavior">人员行为</a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.key === 'device'">
            <a-select
              v-if="record.type === 'asset' || record.type === 'component' || record.type === 'connection'"
              v-model:value="record.deviceId"
              style="width: 100%"
              allow-clear
              placeholder="选择设施"
              @change="onCoverageDeviceChange(record)"
            >
              <a-select-option v-for="device in filteredDevices" :key="device.id" :value="device.id">{{ device.name }}</a-select-option>
            </a-select>
            <span v-else>{{ form.areaName || point?.areaName || '-' }}</span>
          </template>
          <template v-else-if="column.key === 'target'">
            <a-select
              v-if="record.type === 'component'"
              v-model:value="record.componentId"
              style="width: 100%"
              allow-clear
              placeholder="选择部件"
              @change="onCoverageComponentChange(record)"
            >
              <a-select-option v-for="component in getDeviceComponents(record.deviceId)" :key="component.id" :value="component.id">{{ component.name }}</a-select-option>
            </a-select>
            <a-select
              v-else-if="record.type === 'connection'"
              v-model:value="record.connectionId"
              style="width: 100%"
              allow-clear
              placeholder="选择连接部位"
              @change="onCoverageConnectionChange(record)"
            >
              <a-select-option v-for="connection in getDeviceConnections(record.deviceId)" :key="connection.id" :value="connection.id">{{ connection.name }}</a-select-option>
            </a-select>
            <a-input v-else v-model:value="record.name" placeholder="对象名称" />
          </template>
          <template v-else-if="column.key === 'coverageType'">
            <a-select v-model:value="record.coverageType" style="width: 100%">
              <a-select-option value="primary">主覆盖</a-select-option>
              <a-select-option value="secondary">辅助覆盖</a-select-option>
              <a-select-option value="backup">备用覆盖</a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.key === 'coverageStatus'">
            <a-select v-model:value="record.coverageStatus" style="width: 100%">
              <a-select-option value="coverable">可覆盖</a-select-option>
              <a-select-option value="partial">部分覆盖</a-select-option>
              <a-select-option value="uncoverable">不可覆盖</a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.key === 'requiredCoverage'">
            <a-switch v-model:checked="record.requiredCoverage" checked-children="必须" un-checked-children="可选" />
          </template>
          <template v-else-if="column.key === 'remark'">
            <a-input v-model:value="record.remark" placeholder="备注" />
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-button type="link" size="small" danger @click="coverageObjects.splice(index, 1)">删除</a-button>
          </template>
        </template>
      </a-table>
      <a-button style="margin-top: 12px" @click="addCoverageObject">新增覆盖对象</a-button>
    </a-card>

    <a-card style="margin-top: 16px" title="采集位">
      <a-alert
        type="info"
        show-icon
        style="margin-bottom: 12px"
        message="采集位绑定到停车点下，定义从哪个角度、用什么设备去采集哪个覆盖对象。"
      />
      <a-table :columns="poseColumns" :data-source="collectionPoseRows" row-key="localKey" :pagination="false" :scroll="{ x: 1800 }">
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'parkingPoint'">
            <a-select v-model:value="record.parkingPointId" style="width: 100%" @change="onPoseParkingChange(record)">
              <a-select-option v-for="parking in parkingOptions" :key="parking.id" :value="parking.id">{{ parking.label }}</a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.key === 'targetObject'">
            <a-select v-model:value="record.targetRefId" style="width: 100%" allow-clear placeholder="选择覆盖对象" @change="onPoseTargetChange(record)">
              <a-select-option v-for="target in coverageOptions" :key="target.id" :value="target.id">{{ target.label }}</a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.key === 'direction'">
            <a-select v-model:value="record.direction" style="width: 100%">
              <a-select-option value="front">正拍</a-select-option>
              <a-select-option value="side">侧拍</a-select-option>
              <a-select-option value="oblique">斜拍</a-select-option>
              <a-select-option value="near">近拍</a-select-option>
              <a-select-option value="overview">全景</a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.key === 'method'">
            <a-select v-model:value="record.method" style="width: 100%">
              <a-select-option value="optical">光学</a-select-option>
              <a-select-option value="thermal">热成像</a-select-option>
              <a-select-option value="gas">气体</a-select-option>
              <a-select-option value="safety">安全行为</a-select-option>
              <a-select-option value="multi_spectrum">多光谱</a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.key === 'ptzYaw'">
            <a-input-number v-model:value="record.ptzYaw" style="width: 100%" />
          </template>
          <template v-else-if="column.key === 'ptzPitch'">
            <a-input-number v-model:value="record.ptzPitch" style="width: 100%" />
          </template>
          <template v-else-if="column.key === 'distanceMeter'">
            <a-input-number v-model:value="record.distanceMeter" :min="0" :step="0.1" style="width: 100%" />
          </template>
          <template v-else-if="column.key === 'focalLength'">
            <a-input v-model:value="record.focalLength" />
          </template>
          <template v-else-if="column.key === 'collectableCondition'">
            <a-input v-model:value="record.collectableCondition" />
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-button type="link" size="small" danger @click="collectionPoseRows.splice(index, 1)">删除</a-button>
          </template>
        </template>
      </a-table>
      <a-button style="margin-top: 12px" @click="addCollectionPose">新增采集位</a-button>
    </a-card>

    <a-card style="margin-top: 16px" title="检测配置">
      <a-alert
        type="info"
        show-icon
        style="margin-bottom: 12px"
        message="检测配置表达：检测主体 + 检测规则 + 采集位 + 覆盖要求 + 失败策略。"
      />
      <a-table :columns="detectionColumns" :data-source="detectionConfigs" row-key="localKey" :pagination="false" :scroll="{ x: 1700 }">
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'subject'">
            <a-select v-model:value="record.subjectRefId" style="width: 100%" allow-clear placeholder="选择覆盖对象" @change="onDetectionSubjectChange(record)">
              <a-select-option v-for="target in coverageOptions" :key="target.id" :value="target.id">{{ target.label }}</a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.key === 'rule'">
            <a-select v-model:value="record.ruleId" style="width: 100%" allow-clear show-search option-filter-prop="label" placeholder="选择检测规则">
              <a-select-option v-for="rule in ruleOptions" :key="rule.id" :value="rule.id">{{ rule.name }}</a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.key === 'collectionPose'">
            <a-select v-model:value="record.collectionPoseId" style="width: 100%" allow-clear placeholder="选择采集位">
              <a-select-option v-for="pose in collectionPoseOptionRows" :key="pose.id" :value="pose.id">{{ pose.label }}</a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.key === 'requiredCoverage'">
            <a-switch v-model:checked="record.requiredCoverage" checked-children="必须" un-checked-children="可选" />
          </template>
          <template v-else-if="column.key === 'failureStrategy'">
            <a-select v-model:value="record.failureStrategy" style="width: 100%">
              <a-select-option value="manual_review">人工复核</a-select-option>
              <a-select-option value="supplement_task">生成补检</a-select-option>
              <a-select-option value="mark_uninspectable">标记不可检</a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.key === 'enabled'">
            <a-switch v-model:checked="record.enabled" checked-children="启用" un-checked-children="停用" />
          </template>
          <template v-else-if="column.key === 'remark'">
            <a-input v-model:value="record.remark" placeholder="备注" />
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-button type="link" size="small" danger @click="detectionConfigs.splice(index, 1)">删除</a-button>
          </template>
        </template>
      </a-table>
      <a-button style="margin-top: 12px" @click="addDetectionConfig">新增检测配置</a-button>
    </a-card>

    <a-card style="margin-top: 16px" title="覆盖检查">
      <a-list bordered :data-source="coverageCheckItems">
        <template #renderItem="{ item }">
          <a-list-item>
            <a-space>
              <a-tag :color="item.status === 'ok' ? 'green' : 'orange'">{{ item.status === 'ok' ? '通过' : '待补齐' }}</a-tag>
              <span>{{ item.text }}</span>
            </a-space>
          </a-list-item>
        </template>
      </a-list>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useInspectionStore } from '@/stores/inspection'
import type {
  CollectionPose,
  InspectionPointCoverageObject,
  InspectionPointDetectionConfig,
} from '@/types/inspection'
import { getDetectionItemConfigs } from '@/views/implementation/detection-item-config/model'

interface CoverageRow extends InspectionPointCoverageObject {
  localKey: string
}

interface CollectionPoseRow extends CollectionPose {
  localKey: string
  targetRefId?: string
}

interface DetectionConfigRow extends InspectionPointDetectionConfig {
  localKey: string
  subjectRefId?: string
}

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()

const form = reactive({
  areaName: ''
})

const coverageObjects = ref<CoverageRow[]>([])
const collectionPoseRows = ref<CollectionPoseRow[]>([])
const detectionConfigs = ref<DetectionConfigRow[]>([])

const point = computed(() => inspectionStore.inspectionPoints.find(item => item.id === String(route.params.id)))
const filteredDevices = computed(() => inspectionStore.inspectionDevices.filter(device => !point.value?.areaId || device.areaId === point.value.areaId))
const ruleOptions = computed(() => getDetectionItemConfigs().filter(item => item.enabled && item.publishStatus === '已发布'))

const parkingOptions = computed(() => (point.value?.parkingPoints || []).map(item => ({ id: item.id, label: item.name })))
const coverageOptions = computed(() => coverageObjects.value.map(item => ({ id: item.id, label: `${getCoverageTypeText(item.type)} / ${item.name}` })))
const collectionPoseOptionRows = computed(() => collectionPoseRows.value.map(item => ({
  id: item.id,
  label: `${getParkingName(item.parkingPointId)} / ${item.targetName || '未命名采集位'}`
})))

const coverageColumns = [
  { title: '对象类型', key: 'type', width: 150 },
  { title: '所属设施', key: 'device', width: 220 },
  { title: '对象名称 / 真实部件', key: 'target', width: 240 },
  { title: '覆盖类型', key: 'coverageType', width: 120 },
  { title: '覆盖状态', key: 'coverageStatus', width: 120 },
  { title: '必须覆盖', key: 'requiredCoverage', width: 110 },
  { title: '备注', key: 'remark', width: 220 },
  { title: '操作', key: 'actions', width: 90 }
]

const poseColumns = [
  { title: '停车点', key: 'parkingPoint', width: 180 },
  { title: '目标对象', key: 'targetObject', width: 220 },
  { title: '采集方向', key: 'direction', width: 110 },
  { title: '采集设备', key: 'method', width: 120 },
  { title: '云台Yaw', key: 'ptzYaw', width: 110 },
  { title: '云台Pitch', key: 'ptzPitch', width: 110 },
  { title: '目标距离', key: 'distanceMeter', width: 110 },
  { title: '焦距', key: 'focalLength', width: 120 },
  { title: '可采条件', key: 'collectableCondition', width: 260 },
  { title: '操作', key: 'actions', width: 90 }
]

const detectionColumns = [
  { title: '检测主体', key: 'subject', width: 240 },
  { title: '检测规则', key: 'rule', width: 280 },
  { title: '采集位', key: 'collectionPose', width: 220 },
  { title: '覆盖要求', key: 'requiredCoverage', width: 110 },
  { title: '失败策略', key: 'failureStrategy', width: 140 },
  { title: '启用', key: 'enabled', width: 90 },
  { title: '备注', key: 'remark', width: 220 },
  { title: '操作', key: 'actions', width: 90 }
]

const coverageCheckItems = computed(() => {
  const items: Array<{ status: 'ok' | 'warning'; text: string }> = []
  if (!coverageObjects.value.length) {
    items.push({ status: 'warning', text: '未配置覆盖对象' })
  } else {
    items.push({ status: 'ok', text: `已配置 ${coverageObjects.value.length} 个覆盖对象` })
  }
  if (!collectionPoseRows.value.length) {
    items.push({ status: 'warning', text: '未配置采集位' })
  } else {
    items.push({ status: 'ok', text: `已配置 ${collectionPoseRows.value.length} 个采集位` })
  }
  const missingRules = detectionConfigs.value.filter(item => !item.ruleId).length
  if (missingRules) {
    items.push({ status: 'warning', text: `${missingRules} 条检测配置未绑定规则` })
  } else {
    items.push({ status: 'ok', text: '所有检测配置均已绑定规则' })
  }
  const requiredTargets = coverageObjects.value.filter(item => item.requiredCoverage)
  const coveredTargetIds = new Set(detectionConfigs.value.filter(item => item.enabled).map(item => item.subjectId))
  const missingRequired = requiredTargets.filter(item => {
    const targetId = item.componentId || item.connectionId || item.deviceId || item.id
    return !coveredTargetIds.has(targetId)
  })
  if (missingRequired.length) {
    items.push({ status: 'warning', text: `${missingRequired.length} 个必须覆盖对象尚未配置检测项` })
  } else {
    items.push({ status: 'ok', text: '必须覆盖对象均已配置检测项' })
  }
  return items
})

function loadDetail() {
  inspectionStore.initialize()
  const currentPoint = point.value
  if (!currentPoint) return
  form.areaName = currentPoint.areaName || ''
  coverageObjects.value = (currentPoint.coverageObjects || []).map((item, index) => ({
    ...item,
    localKey: `${item.id}-${index}`
  }))
  collectionPoseRows.value = (currentPoint.parkingPoints || []).flatMap((parking) =>
    parking.collectionPoses.map((pose, index) => ({
      ...pose,
      localKey: `${pose.id}-${index}`,
      targetRefId: findCoverageRefIdByName(pose.targetName)
    }))
  )
  detectionConfigs.value = (currentPoint.detectionConfigs || []).map((item, index) => ({
    ...item,
    localKey: `${item.id}-${index}`,
    subjectRefId: findCoverageRefIdBySubject(item.subjectType, item.subjectId)
  }))
}

function addCoverageObject() {
  coverageObjects.value.push({
    id: `coverage-${Date.now()}`,
    localKey: `coverage-${Date.now()}`,
    type: 'asset',
    name: '',
    coverageType: 'primary',
    coverageStatus: 'coverable',
    requiredCoverage: true,
    remark: ''
  })
}

function addCollectionPose() {
  const firstParking = parkingOptions.value[0]
  collectionPoseRows.value.push({
    id: `pose-${Date.now()}`,
    localKey: `pose-${Date.now()}`,
    parkingPointId: firstParking?.id || '',
    targetName: '',
    targetType: 'asset',
    direction: 'front',
    distanceMeter: 1.5,
    ptzYaw: 0,
    ptzPitch: -10,
    focalLength: '35mm',
    method: 'optical',
    collectableCondition: '无遮挡'
  })
}

function addDetectionConfig() {
  detectionConfigs.value.push({
    id: `point-dc-${Date.now()}`,
    localKey: `point-dc-${Date.now()}`,
    inspectionPointId: point.value?.id || '',
    subjectType: 'component',
    subjectId: '',
    subjectName: '',
    ruleId: '',
    collectionPoseId: collectionPoseOptionRows.value[0]?.id,
    requiredCoverage: true,
    failureStrategy: 'manual_review',
    enabled: true,
    remark: '',
    updatedAt: new Date().toISOString()
  })
}

function onCoverageTypeChange(record: CoverageRow) {
  record.deviceId = undefined
  record.componentId = undefined
  record.connectionId = undefined
  record.name = ''
  if (record.type === 'area_environment') {
    record.name = `${form.areaName || point.value?.areaName || point.value?.name || '当前巡检点'}区域环境`
  }
}

function onCoverageDeviceChange(record: CoverageRow) {
  const device = filteredDevices.value.find(item => item.id === record.deviceId)
  if (record.type === 'asset') {
    record.name = device?.name || ''
  } else {
    record.name = ''
  }
}

function onCoverageComponentChange(record: CoverageRow) {
  const component = getDeviceComponents(record.deviceId).find(item => item.id === record.componentId)
  record.name = component?.name || ''
}

function onCoverageConnectionChange(record: CoverageRow) {
  const connection = getDeviceConnections(record.deviceId).find(item => item.id === record.connectionId)
  record.name = connection?.name || ''
}

function onPoseParkingChange(record: CollectionPoseRow) {
  record.targetRefId = undefined
  record.targetName = ''
}

function onPoseTargetChange(record: CollectionPoseRow) {
  const target = coverageObjects.value.find(item => item.id === record.targetRefId)
  if (!target) return
  record.targetName = target.name
  record.targetType = target.type === 'asset' || target.type === 'component' || target.type === 'connection' || target.type === 'area_environment' ? target.type : 'safety_behavior'
}

function onDetectionSubjectChange(record: DetectionConfigRow) {
  const target = coverageObjects.value.find(item => item.id === record.subjectRefId)
  if (!target) return
  record.subjectType = target.type === 'asset' || target.type === 'component' || target.type === 'connection' || target.type === 'area_environment' ? target.type : 'safety_behavior'
  record.subjectId = target.componentId || target.connectionId || target.deviceId || target.id
  record.subjectName = target.name
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

function findCoverageRefIdByName(name: string) {
  return coverageObjects.value.find(item => item.name === name)?.id
}

function findCoverageRefIdBySubject(subjectType: string, subjectId: string) {
  return coverageObjects.value.find(item => {
    if (subjectType === 'component') return item.componentId === subjectId
    if (subjectType === 'connection') return item.connectionId === subjectId
    if (subjectType === 'asset') return item.deviceId === subjectId
    return item.id === subjectId || item.name === subjectId
  })?.id
}

function normalizeCoverageObjects() {
  return coverageObjects.value.map(({ localKey, ...item }) => ({
    ...item,
    areaName: item.type === 'area_environment' ? form.areaName || point.value?.areaName || '' : item.areaName
  }))
}

function normalizeParkingPoints() {
  const currentPoint = point.value
  const sourceParkingPoints = currentPoint?.parkingPoints || []
  return sourceParkingPoints.map((parking) => ({
    ...parking,
    collectionPoses: collectionPoseRows.value
      .filter(item => item.parkingPointId === parking.id)
      .map(({ localKey, targetRefId, ...pose }) => pose)
  }))
}

function normalizeDetectionConfigs() {
  return detectionConfigs.value.map(({ localKey, subjectRefId, ...item }) => ({
    ...item,
    updatedAt: new Date().toISOString()
  }))
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

function getCoverageTypeText(type: string) {
  return ({
    asset: '设施',
    component: '设施部件',
    connection: '连接部位',
    area_environment: '区域环境',
    safety_behavior: '人员行为'
  } as Record<string, string>)[type] || type
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
</style>
