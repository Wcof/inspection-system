<template>
  <div class="facility-device-form">
    <a-page-header :title="isEdit ? '编辑设施' : '新增设施'" @back="goBack" />
    <a-card style="margin-top: 16px">
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="8"><a-form-item label="设施名称" required><a-input v-model:value="form.name" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="设施编号" required><a-input v-model:value="form.deviceNo" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="设施类别" required><a-input v-model:value="form.deviceCategory" /></a-form-item></a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="8"><a-form-item label="设施分类" required><a-input v-model:value="form.deviceClassification" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="责任人" required><a-input v-model:value="form.owner" /></a-form-item></a-col>
          <a-col :span="8">
            <a-form-item label="来源" required>
              <a-select v-model:value="form.source">
                <a-select-option value="manual">手动维护</a-select-option>
                <a-select-option value="synced">三方同步</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="所属区域" required>
              <a-select v-model:value="form.areaId" allow-clear placeholder="请选择区域" @change="onAreaChange">
                <a-select-option v-for="area in areas" :key="area.id" :value="area.id">{{ area.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8"><a-form-item label="规格型号"><a-input v-model:value="form.specModel" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="系统名称"><a-input v-model:value="form.systemName" /></a-form-item></a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="8"><a-form-item label="设备状态"><a-select v-model:value="form.status"><a-select-option value="active">在用</a-select-option><a-select-option value="inactive">停用</a-select-option><a-select-option value="maintenance">维护中</a-select-option><a-select-option value="scrapped">报废</a-select-option></a-select></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="出厂厂家"><a-input v-model:value="form.manufacturer" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="存放位置"><a-input v-model:value="form.storageLocation" /></a-form-item></a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="8"><a-form-item label="最近检测时间"><a-date-picker v-model:value="form.lastInspectionTime" value-format="YYYY-MM-DD" style="width: 100%" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="下次检测时间"><a-date-picker v-model:value="form.nextInspectionTime" value-format="YYYY-MM-DD" style="width: 100%" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="地图坐标"><a-input v-model:value="form.mapCoordinate" placeholder="例如 120.12,30.16" /></a-form-item></a-col>
        </a-row>

        <a-form-item label="参考图（单张）">
          <a-space direction="vertical" style="width: 100%">
            <a-upload :show-upload-list="false" :before-upload="() => false" @change="handleUploadChange">
              <a-button>上传参考图</a-button>
            </a-upload>
            <img :src="form.referenceImageUrl || defaultDeviceImage" class="preview-image" alt="reference" />
          </a-space>
        </a-form-item>

        <a-card size="small" title="设施资产结构" class="model-card">
          <a-alert
            type="info"
            show-icon
            style="margin-bottom: 12px"
            message="这里维护设施部件与连接对象。检测规则仍然绑定到真实部件或连接部位。"
          />
          <a-tabs>
            <a-tab-pane key="components" tab="部件配置">
              <a-table :data-source="assetComponents" row-key="localKey" :pagination="false" size="small">
                <a-table-column title="部件名称">
                  <template #default="{ record }">
                    <a-input v-model:value="record.name" />
                  </template>
                </a-table-column>
                <a-table-column title="部件类型" width="180">
                  <template #default="{ record }">
                    <a-select v-model:value="record.type" style="width: 100%">
                      <a-select-option value="valve">阀门</a-select-option>
                      <a-select-option value="meter">压力表</a-select-option>
                      <a-select-option value="temperature_gauge">温度表</a-select-option>
                      <a-select-option value="flange">法兰</a-select-option>
                      <a-select-option value="motor">电机</a-select-option>
                      <a-select-option value="pipe">管体</a-select-option>
                      <a-select-option value="cable">电缆</a-select-option>
                      <a-select-option value="joint">接头</a-select-option>
                      <a-select-option value="sensor">传感器</a-select-option>
                      <a-select-option value="screw">螺杆</a-select-option>
                      <a-select-option value="other">其他</a-select-option>
                    </a-select>
                  </template>
                </a-table-column>
                <a-table-column title="关联检测规则" width="340">
                  <template #default="{ record }">
                    <a-select
                      v-model:value="record.ruleIds"
                      mode="multiple"
                      style="width: 100%"
                      :options="getComponentRuleOptions(record)"
                      option-filter-prop="label"
                      show-search
                    />
                  </template>
                </a-table-column>
                <a-table-column title="操作" width="90">
                  <template #default="{ index }">
                    <a-button type="link" size="small" danger @click="assetComponents.splice(index, 1)">删除</a-button>
                  </template>
                </a-table-column>
              </a-table>
              <a-button size="small" style="margin-top: 10px" @click="addAssetComponent">新增部件</a-button>
            </a-tab-pane>

            <a-tab-pane key="connections" tab="连接对象配置">
              <a-table :data-source="connectionObjects" row-key="localKey" :pagination="false" size="small" :scroll="{ x: 1450 }">
                <a-table-column title="连接对象名称" width="180">
                  <template #default="{ record }">
                    <a-input v-model:value="record.name" />
                  </template>
                </a-table-column>
                <a-table-column title="当前设施部件" width="220">
                  <template #default="{ record }">
                    <a-select v-model:value="record.sourceComponentId" style="width: 100%" @change="syncConnectionEndpoint(record)">
                      <a-select-option v-for="component in assetComponents" :key="component.id" :value="component.id">{{ component.name }}</a-select-option>
                    </a-select>
                  </template>
                </a-table-column>
                <a-table-column title="连接范围" width="140">
                  <template #default="{ record }">
                    <a-select v-model:value="record.sinkScope" style="width: 100%" @change="onSinkScopeChange(record)">
                      <a-select-option value="self">本设施</a-select-option>
                      <a-select-option value="other">其他设施</a-select-option>
                    </a-select>
                  </template>
                </a-table-column>
                <a-table-column title="连接设施" width="220">
                  <template #default="{ record }">
                    <a-input v-if="record.sinkScope !== 'other'" :value="currentDeviceLabel" disabled />
                    <a-select v-else v-model:value="record.sinkDeviceId" style="width: 100%" @change="onSinkDeviceChange(record)">
                      <a-select-option v-for="device in otherDeviceOptions" :key="device.id" :value="device.id">
                        {{ device.name }}{{ device.deviceNo ? `（${device.deviceNo}）` : '' }}
                      </a-select-option>
                    </a-select>
                  </template>
                </a-table-column>
                <a-table-column title="连接部件" width="220">
                  <template #default="{ record }">
                    <a-select v-model:value="record.sinkComponentId" style="width: 100%" @change="syncConnectionEndpoint(record)">
                      <a-select-option v-for="component in getSinkComponentOptions(record)" :key="component.id" :value="component.id">{{ component.name }}</a-select-option>
                    </a-select>
                  </template>
                </a-table-column>
                <a-table-column title="关联检测规则" width="320">
                  <template #default="{ record }">
                    <a-select
                      v-model:value="record.ruleIds"
                      mode="multiple"
                      style="width: 100%"
                      :options="connectionRuleOptions"
                      option-filter-prop="label"
                      show-search
                    />
                  </template>
                </a-table-column>
                <a-table-column title="操作" width="90">
                  <template #default="{ index }">
                    <a-button type="link" size="small" danger @click="connectionObjects.splice(index, 1)">删除</a-button>
                  </template>
                </a-table-column>
              </a-table>
              <a-button size="small" style="margin-top: 10px" @click="addConnectionObject">新增连接对象</a-button>
            </a-tab-pane>
          </a-tabs>
        </a-card>

        <a-card size="small" title="可采点位配置" class="model-card">
          <a-alert
            type="warning"
            show-icon
            style="margin-bottom: 12px"
            message="在设施侧维护该设施可被哪些巡检点/停车点检测，并为每个停车点绑定真实部件。"
          />
          <a-table :data-source="parkingBindings" row-key="localKey" :pagination="false" size="small" :scroll="{ x: 1300 }">
            <a-table-column title="巡检点" width="220">
              <template #default="{ record }">
                <a-select v-model:value="record.inspectionPointId" style="width: 100%" allow-clear @change="onBindingPointChange(record)">
                  <a-select-option v-for="point in inspectionPointOptions" :key="point.id" :value="point.id">{{ point.name }}</a-select-option>
                </a-select>
              </template>
            </a-table-column>
            <a-table-column title="停车点" width="240">
              <template #default="{ record }">
                <a-select v-model:value="record.parkingPointId" style="width: 100%" allow-clear @change="onBindingParkingChange(record)">
                  <a-select-option v-for="parking in getParkingOptions(record.inspectionPointId)" :key="parking.id" :value="parking.id">{{ parking.name }}</a-select-option>
                </a-select>
              </template>
            </a-table-column>
            <a-table-column title="关联部件" width="360">
              <template #default="{ record }">
                <a-select v-model:value="record.componentIds" mode="multiple" style="width: 100%" allow-clear placeholder="选择该停车点可采的部件">
                  <a-select-option v-for="component in assetComponents" :key="component.id" :value="component.id">{{ component.name }}</a-select-option>
                </a-select>
              </template>
            </a-table-column>
            <a-table-column title="巡检模式" width="180">
              <template #default="{ record }">
                <a-tag>{{ getInspectionModeText(record.inspectionPointId) }}</a-tag>
              </template>
            </a-table-column>
            <a-table-column title="操作" width="90">
              <template #default="{ index }">
                <a-button type="link" size="small" danger @click="parkingBindings.splice(index, 1)">删除</a-button>
              </template>
            </a-table-column>
          </a-table>
          <a-button size="small" style="margin-top: 10px" @click="addParkingBinding">新增可采点位</a-button>
        </a-card>

        <div class="form-actions">
          <a-space>
            <a-button @click="goBack">取消</a-button>
            <a-button type="primary" @click="handleSave">保存</a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useInspectionStore } from '@/stores/inspection'
import type {
  ConnectionObject,
  FacilityParkingPointBinding,
  InspectedAssetComponent,
  ObjectDetectionConfig
} from '@/types/inspection'
import { DeviceStatus } from '@/types/inspection'
import { getDetectionItemConfigs, type DetectionItemConfig } from '@/views/implementation/detection-item-config/model'

interface AssetComponentRow extends InspectedAssetComponent {
  localKey: string
}

interface ConnectionObjectRow extends ConnectionObject {
  localKey: string
}

interface ParkingBindingRow extends FacilityParkingPointBinding {
  localKey: string
}

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()
const isEdit = computed(() => Boolean(route.params.id))
const defaultDeviceImage = new URL('../../../设备.png', import.meta.url).href

const form = reactive<any>({
  id: '',
  name: '',
  code: '',
  deviceNo: '',
  deviceClassification: '',
  specModel: '',
  owner: '',
  manufacturer: '',
  areaId: '',
  areaName: '',
  storageLocation: '',
  systemName: '',
  lastInspectionTime: '',
  nextInspectionTime: '',
  mapCoordinate: '',
  deviceCategory: '',
  referenceImageUrl: '',
  status: 'active',
  source: 'manual'
})

const assetComponents = ref<AssetComponentRow[]>([])
const connectionObjects = ref<ConnectionObjectRow[]>([])
const parkingBindings = ref<ParkingBindingRow[]>([])
const existingObjectDetectionConfigs = ref<ObjectDetectionConfig[]>([])

const currentDeviceId = computed(() => form.id || 'new-device')
const currentDeviceLabel = computed(() => `${form.name || '当前设施'}${form.deviceNo ? `（${form.deviceNo}）` : ''}`)
const otherDeviceOptions = computed(() => inspectionStore.inspectionDevices.filter(device => device.id !== currentDeviceId.value && (device.assetComponents || []).length))
const inspectionPointOptions = computed(() => inspectionStore.inspectionPoints.filter(point => point.pointBizType === 'inspection' || !point.pointBizType))
const detectionRules = computed(() => getDetectionItemConfigs().filter(item => item.publishStatus === '已发布' && item.enabled))

const connectionRuleOptions = computed(() => detectionRules.value
  .slice()
  .sort((a, b) => Number(isConnectionRule(b)) - Number(isConnectionRule(a)))
  .map(rule => ({
    value: rule.id,
    label: `${isConnectionRule(rule) ? '推荐 - ' : ''}${rule.name}（${rule.category}）`
  })))

const componentTypeText: Record<InspectedAssetComponent['type'], string> = {
  valve: '阀门',
  meter: '压力表',
  temperature_gauge: '温度表',
  flange: '法兰',
  motor: '电机',
  pipe: '管体',
  cable: '电缆',
  joint: '接头',
  sensor: '传感器',
  screw: '螺杆',
  other: '其他'
}

const areas = computed(() => {
  const map = new Map<string, string>()
  inspectionStore.inspectionMaps.forEach((inspectionMap) => {
    inspectionMap.regions?.forEach((region) => map.set(region.id, region.name))
  })
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
})

function seedAssetModel(deviceId: string) {
  form.id = deviceId
  assetComponents.value = [
    { id: `${deviceId}-valve`, localKey: `${deviceId}-valve`, assetId: deviceId, name: '入口阀门', type: 'valve', ruleIds: [] },
    { id: `${deviceId}-meter`, localKey: `${deviceId}-meter`, assetId: deviceId, name: '压力表', type: 'meter', ruleIds: [] },
    { id: `${deviceId}-flange`, localKey: `${deviceId}-flange`, assetId: deviceId, name: '出口法兰', type: 'flange', ruleIds: [] }
  ]
  connectionObjects.value = [
    {
      id: `${deviceId}-conn-valve-pipe`,
      localKey: `${deviceId}-conn-valve-pipe`,
      name: '阀门-管线',
      endpointA: '当前设施 / 入口阀门',
      endpointB: '当前设施 / 压力表',
      sourceComponentId: `${deviceId}-valve`,
      sinkScope: 'self',
      sinkDeviceId: deviceId,
      sinkComponentId: `${deviceId}-meter`,
      ruleIds: [],
      detectionFocus: '开闭状态/泄漏'
    }
  ]
  parkingBindings.value = []
}

function loadDetail() {
  inspectionStore.initialize()
  if (!isEdit.value) {
    seedAssetModel(`device-${Date.now()}`)
    return
  }
  const detail = inspectionStore.inspectionDevices.find(item => item.id === String(route.params.id))
  if (!detail) return
  existingObjectDetectionConfigs.value = Array.isArray(detail.objectDetectionConfigs) ? detail.objectDetectionConfigs : []

  Object.assign(form, {
    id: detail.id,
    name: detail.name,
    code: detail.code,
    deviceNo: detail.deviceNo || detail.code,
    deviceClassification: detail.deviceClassification || '',
    specModel: detail.specModel || '',
    owner: detail.owner || '',
    manufacturer: detail.manufacturer || '',
    areaId: detail.areaId || '',
    areaName: detail.areaName || '',
    storageLocation: detail.storageLocation || '',
    systemName: detail.systemName || '',
    lastInspectionTime: detail.lastInspectionTime || '',
    nextInspectionTime: detail.nextInspectionTime || '',
    mapCoordinate: detail.mapCoordinate || '',
    deviceCategory: detail.deviceCategory || '',
    referenceImageUrl: detail.referenceImageUrl || '',
    status: detail.status || 'active',
    source: detail.source || 'manual'
  })

  assetComponents.value = (detail.assetComponents || []).map((item, index) => ({
    ...item,
    ruleIds: Array.isArray(item.ruleIds) ? item.ruleIds : getRuleIdsFromUnifiedConfig('component', item.id),
    localKey: `${item.id}-${index}`
  }))

  connectionObjects.value = (detail.connectionObjects || []).map((item, index) => ({
    ...item,
    ruleIds: Array.isArray(item.ruleIds) ? item.ruleIds : getRuleIdsFromUnifiedConfig('connection', item.id),
    localKey: `${item.id}-${index}`,
    sinkScope: item.sinkScope || 'self',
    sinkDeviceId: item.sinkDeviceId || currentDeviceId.value
  }))

  parkingBindings.value = (detail.parkingPointBindings || []).map((item, index) => ({
    ...item,
    localKey: `${item.id}-${index}`
  }))
}

function handleUploadChange(info: any) {
  const file = info?.file?.originFileObj
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    form.referenceImageUrl = String(reader.result || '')
  }
  reader.readAsDataURL(file)
}

function addAssetComponent() {
  const id = `component-${Date.now()}`
  assetComponents.value.push({ id, localKey: id, assetId: currentDeviceId.value, name: '新增部件', type: 'valve', ruleIds: [] })
}

function addConnectionObject() {
  const id = `connection-${Date.now()}`
  const firstSource = assetComponents.value[0]?.id
  const firstSink = assetComponents.value[1]?.id || firstSource
  connectionObjects.value.push({
    id,
    localKey: id,
    name: '新增连接对象',
    endpointA: formatSourceEndpoint(firstSource),
    endpointB: formatSinkEndpoint('self', currentDeviceId.value, firstSink),
    sourceComponentId: firstSource,
    sinkScope: 'self',
    sinkDeviceId: currentDeviceId.value,
    sinkComponentId: firstSink,
    ruleIds: [],
    detectionFocus: '泄漏/紧密度'
  })
}

function addParkingBinding() {
  const firstPoint = inspectionPointOptions.value[0]
  const firstParking = firstPoint?.parkingPoints?.[0]
  parkingBindings.value.push({
    id: `binding-${Date.now()}`,
    localKey: `binding-${Date.now()}`,
    inspectionPointId: firstPoint?.id || '',
    inspectionPointName: firstPoint?.name || '',
    parkingPointId: firstParking?.id || '',
    parkingPointName: firstParking?.name || '',
    componentIds: []
  })
}

function onAreaChange(value: string) {
  const area = areas.value.find(item => item.id === value)
  form.areaName = area?.name || ''
}

function onBindingPointChange(record: ParkingBindingRow) {
  const point = inspectionPointOptions.value.find(item => item.id === record.inspectionPointId)
  record.inspectionPointName = point?.name || ''
  const parking = point?.parkingPoints?.[0]
  record.parkingPointId = parking?.id || ''
  record.parkingPointName = parking?.name || ''
}

function onBindingParkingChange(record: ParkingBindingRow) {
  const parking = getParkingOptions(record.inspectionPointId).find(item => item.id === record.parkingPointId)
  record.parkingPointName = parking?.name || ''
}

function getParkingOptions(pointId?: string) {
  return inspectionPointOptions.value.find(item => item.id === pointId)?.parkingPoints || []
}

function getInspectionModeText(pointId?: string) {
  const point = inspectionPointOptions.value.find(item => item.id === pointId)
  return point?.inspectionMode === 'area' ? '区域巡检点（不强制停车）' : '固定巡检点（停车检查）'
}

function formatSourceEndpoint(componentId?: string) {
  const component = assetComponents.value.find(item => item.id === componentId)
  return `${form.name || '当前设施'} / ${component?.name || componentId || ''}`
}

function formatSinkEndpoint(scope: 'self' | 'other' = 'self', deviceId?: string, componentId?: string) {
  const device = scope === 'self'
    ? { id: currentDeviceId.value, name: form.name || '当前设施', deviceNo: form.deviceNo, assetComponents: assetComponents.value }
    : inspectionStore.inspectionDevices.find(item => item.id === deviceId)
  const component = (device?.assetComponents || []).find(item => item.id === componentId)
  return `${device?.name || deviceId || ''}${device?.deviceNo ? `（${device.deviceNo}）` : ''} / ${component?.name || componentId || ''}`
}

function syncConnectionEndpoint(record: ConnectionObjectRow) {
  record.endpointA = formatSourceEndpoint(record.sourceComponentId)
  record.endpointB = formatSinkEndpoint(record.sinkScope, record.sinkDeviceId, record.sinkComponentId)
}

function onSinkScopeChange(record: ConnectionObjectRow) {
  if (record.sinkScope === 'other') {
    const firstOther = otherDeviceOptions.value[0]
    record.sinkDeviceId = firstOther?.id
    record.sinkComponentId = firstOther?.assetComponents?.[0]?.id
  } else {
    record.sinkDeviceId = currentDeviceId.value
    record.sinkComponentId = assetComponents.value[0]?.id
  }
  syncConnectionEndpoint(record)
}

function onSinkDeviceChange(record: ConnectionObjectRow) {
  const device = inspectionStore.inspectionDevices.find(item => item.id === record.sinkDeviceId)
  record.sinkComponentId = device?.assetComponents?.[0]?.id
  syncConnectionEndpoint(record)
}

function getSinkComponentOptions(record: ConnectionObjectRow) {
  if (record.sinkScope === 'other') {
    return inspectionStore.inspectionDevices.find(item => item.id === record.sinkDeviceId)?.assetComponents || []
  }
  return assetComponents.value
}

function getComponentRuleOptions(component: AssetComponentRow) {
  return detectionRules.value
    .slice()
    .sort((a, b) => Number(isComponentRule(b, component)) - Number(isComponentRule(a, component)))
    .map(rule => ({
      value: rule.id,
      label: `${isComponentRule(rule, component) ? '推荐 - ' : ''}${rule.name}（${rule.category}）`
    }))
}

function getRuleIdsFromUnifiedConfig(subjectType: ObjectDetectionConfig['subjectType'], subjectId: string) {
  return existingObjectDetectionConfigs.value
    .filter(item => item.subjectType === subjectType && item.subjectId === subjectId && item.enabled)
    .map(item => item.ruleId)
}

function buildObjectDetectionConfigs(deviceId: string): ObjectDetectionConfig[] {
  const previous = existingObjectDetectionConfigs.value
  const now = new Date().toISOString()
  const configs: ObjectDetectionConfig[] = []

  function createConfig(subjectType: ObjectDetectionConfig['subjectType'], subjectId: string, subjectName: string, ruleId: string) {
    const old = previous.find(item => item.subjectType === subjectType && item.subjectId === subjectId && item.ruleId === ruleId)
    configs.push({
      id: old?.id || `odc-${deviceId}-${subjectType}-${subjectId}-${ruleId}`,
      deviceId,
      subjectType,
      subjectId,
      subjectName,
      ruleId,
      collectionPoseId: old?.collectionPoseId,
      requiredCoverage: old?.requiredCoverage ?? true,
      failureStrategy: old?.failureStrategy || 'manual_review',
      enabled: true,
      remark: old?.remark,
      updatedAt: now
    })
  }

  assetComponents.value.forEach((component) => {
    ;(component.ruleIds || []).forEach(ruleId => createConfig('component', component.id, component.name, ruleId))
  })
  connectionObjects.value.forEach((connection) => {
    ;(connection.ruleIds || []).forEach(ruleId => createConfig('connection', connection.id, connection.name, ruleId))
  })
  return configs
}

function isComponentRule(rule: DetectionItemConfig, component: AssetComponentRow) {
  const targetTypes = rule.targetTypes || []
  const targetDetails = rule.targetDetails || ''
  const typeText = componentTypeText[component.type] || component.type
  return targetTypes.includes('设施部件') || targetDetails.includes(component.name) || targetDetails.includes(typeText)
}

function isConnectionRule(rule: DetectionItemConfig) {
  const targetTypes = rule.targetTypes || []
  const targetDetails = rule.targetDetails || ''
  return targetTypes.includes('连接部位') || targetDetails.includes('法兰') || targetDetails.includes('连接') || targetDetails.includes('管线')
}

function normalizeParkingBindings() {
  return parkingBindings.value.map(({ localKey, ...item }) => item)
}

function handleSave() {
  if (!form.deviceNo || !form.deviceClassification || !form.owner || !form.name || !form.areaId || !form.deviceCategory) {
    message.error('请补充必填信息：设备编号、设备分类、责任人、设备名称、所属区域、设备类别')
    return
  }

  const payloadId = form.id || `device-${Date.now()}`
  const normalizedBindings = normalizeParkingBindings()
  const primaryPointId = normalizedBindings[0]?.inspectionPointId || ''
  const payload = {
    id: payloadId,
    inspectionPointId: primaryPointId,
    name: form.name,
    code: form.code || form.deviceNo,
    deviceNo: form.deviceNo,
    deviceClassification: form.deviceClassification,
    specModel: form.specModel,
    owner: form.owner,
    manufacturer: form.manufacturer,
    areaId: form.areaId,
    areaName: form.areaName,
    storageLocation: form.storageLocation,
    systemName: form.systemName,
    lastInspectionTime: form.lastInspectionTime,
    nextInspectionTime: form.nextInspectionTime,
    mapCoordinate: form.mapCoordinate,
    deviceCategory: form.deviceCategory,
    referenceImageUrl: form.referenceImageUrl || defaultDeviceImage,
    status: form.status as DeviceStatus,
    source: form.source as 'manual' | 'synced',
    type: 'general',
    sequence: 1,
    assetComponents: assetComponents.value.map(({ localKey, ...item }) => ({ ...item, assetId: payloadId })),
    connectionObjects: connectionObjects.value.map(({ localKey, ...item }) => item),
    parkingPointBindings: normalizedBindings,
    objectDetectionConfigs: buildObjectDetectionConfigs(payloadId),
    createdAt: new Date(),
    updatedAt: new Date()
  }

  inspectionStore.saveInspectionDevice(payload)
  message.success('设施信息已保存')
  router.push('/implementation/device/list')
}

function goBack() {
  router.push('/implementation/device/list')
}

onMounted(loadDetail)
</script>

<style scoped lang="css">
.preview-image {
  margin-top: 6px;
  width: 260px;
  height: 140px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.model-card {
  margin-top: 16px;
}
</style>
