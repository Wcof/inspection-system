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
          <a-col :span="8"><a-form-item label="规格型号"><a-input v-model:value="form.specModel" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="责任人" required><a-input v-model:value="form.owner" /></a-form-item></a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="所在巡检点" required>
              <a-select v-model:value="form.inspectionPointId" placeholder="请选择巡检点" @change="onPointChange">
                <a-select-option v-for="point in inspectionStore.inspectionPoints" :key="point.id" :value="point.id">{{ point.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="所在区域" required>
              <a-select v-model:value="form.areaId" placeholder="请选择区域" @change="onAreaChange">
                <a-select-option v-for="area in areas" :key="area.id" :value="area.id">{{ area.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="8"><a-form-item label="设备状态"><a-select v-model:value="form.status"><a-select-option value="active">在用</a-select-option><a-select-option value="inactive">停用</a-select-option><a-select-option value="maintenance">维护中</a-select-option><a-select-option value="scrapped">报废</a-select-option></a-select></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="出厂厂家"><a-input v-model:value="form.manufacturer" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="出厂编号"><a-input v-model:value="form.factoryNo" /></a-form-item></a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="8"><a-form-item label="投用日期"><a-date-picker v-model:value="form.commissioningDate" value-format="YYYY-MM-DD" style="width: 100%" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="失效日期"><a-date-picker v-model:value="form.expiryDate" value-format="YYYY-MM-DD" style="width: 100%" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="出日期"><a-date-picker v-model:value="form.outDate" value-format="YYYY-MM-DD" style="width: 100%" /></a-form-item></a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="8"><a-form-item label="发证日期"><a-date-picker v-model:value="form.issueDate" value-format="YYYY-MM-DD" style="width: 100%" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="最近检测时间"><a-date-picker v-model:value="form.lastInspectionTime" value-format="YYYY-MM-DD" style="width: 100%" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="下次检测时间"><a-date-picker v-model:value="form.nextInspectionTime" value-format="YYYY-MM-DD" style="width: 100%" /></a-form-item></a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="8"><a-form-item label="使用证号"><a-input v-model:value="form.usageCertificateNo" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="机构核准证书"><a-input v-model:value="form.authorityCertificateNo" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="NFCID"><a-input v-model:value="form.nfcId" /></a-form-item></a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="8"><a-form-item label="系统名称"><a-input v-model:value="form.systemName" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="使用部门名称"><a-input v-model:value="form.departmentName" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="存放位置"><a-input v-model:value="form.storageLocation" /></a-form-item></a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="8"><a-form-item label="检查岗位名称"><a-input v-model:value="form.inspectionPostName" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="保管岗位名称"><a-input v-model:value="form.custodianPostName" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="地图坐标"><a-input v-model:value="form.mapCoordinate" placeholder="例如 120.12,30.16" /></a-form-item></a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="8"><a-form-item label="失效预警天数"><a-input-number v-model:value="form.expiryWarningDays" :min="0" style="width: 100%" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="检测预警天数"><a-input-number v-model:value="form.inspectionWarningDays" :min="0" style="width: 100%" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="设备编码"><a-input v-model:value="form.code" placeholder="默认同设备编号" /></a-form-item></a-col>
        </a-row>

        <a-form-item label="参考图（单张）">
          <a-space direction="vertical" style="width: 100%">
            <a-upload :show-upload-list="false" :before-upload="() => false" @change="handleUploadChange">
              <a-button>
                <upload-outlined />
                上传参考图
              </a-button>
            </a-upload>
            <img :src="form.referenceImageUrl || defaultDeviceImage" class="preview-image" alt="reference" />
          </a-space>
        </a-form-item>

        <a-card size="small" title="设施部件" class="model-card">
          <a-alert
            type="info"
            show-icon
            style="margin-bottom: 12px"
            message="这里仅维护设施资产结构：组成部件与连接对象。检测规则绑定请回到设施列表或部件清单，通过“检测配置”进入。"
          />
          <a-tabs>
            <a-tab-pane key="components" tab="部件配置">
              <a-table :data-source="assetComponents" row-key="localKey" :pagination="false" size="small">
                <a-table-column title="部件名称">
                  <template #default="{ record }">
                    <a-input v-model:value="record.name" placeholder="例如 入口阀门" />
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
                <a-table-column title="关联检测规则" width="320">
                  <template #default="{ record }">
                    <a-select
                      v-model:value="record.ruleIds"
                      mode="multiple"
                      style="width: 100%"
                      placeholder="不选则该部件不参与检测"
                      :options="getComponentRuleOptions(record)"
                      option-filter-prop="label"
                      show-search
                    />
                  </template>
                </a-table-column>
                <a-table-column title="操作" width="80">
                  <template #default="{ index }">
                    <a-button type="link" size="small" danger @click="removeAssetComponent(index)">删除</a-button>
                  </template>
                </a-table-column>
              </a-table>
              <a-button size="small" style="margin-top: 10px" @click="addAssetComponent">新增部件</a-button>
            </a-tab-pane>

            <a-tab-pane key="connections" tab="连接对象配置">
              <a-alert
                type="warning"
                show-icon
                style="margin-bottom: 12px"
                message="连接对象按 连接 A/连接 B 配置：连接 A 固定为当前设施部件；连接 B 可选择本设施部件，也可选择其他设施下的部件。"
              />
              <a-table :data-source="connectionObjects" row-key="localKey" :pagination="false" size="small" :scroll="{ x: 1500 }">
                <a-table-column title="当前设施部件" width="220">
                  <template #default="{ record }">
                    <a-select
                      v-model:value="record.sourceComponentId"
                      style="width: 100%"
                      placeholder="选择当前设施部件"
                      @change="syncConnectionEndpoint(record)"
                    >
                      <a-select-option v-for="component in assetComponents" :key="component.id" :value="component.id">
                        {{ component.name }}
                      </a-select-option>
                    </a-select>
                  </template>
                </a-table-column>
                <a-table-column title="连接类型" width="140">
                  <template #default="{ record }">
                    <a-select v-model:value="record.sinkScope" style="width: 100%" @change="onSinkScopeChange(record)">
                      <a-select-option value="self">本设施</a-select-option>
                      <a-select-option value="other">其他设施</a-select-option>
                    </a-select>
                  </template>
                </a-table-column>
                <a-table-column title="连接设施" width="220">
                  <template #default="{ record }">
                    <a-input
                      v-if="record.sinkScope !== 'other'"
                      :value="currentDeviceLabel"
                      disabled
                    />
                    <a-select
                      v-else
                      v-model:value="record.sinkDeviceId"
                      style="width: 100%"
                      placeholder="选择其他设施"
                      @change="onSinkDeviceChange(record)"
                    >
                      <a-select-option v-for="device in otherDeviceOptions" :key="device.id" :value="device.id">
                        {{ device.name }}{{ device.deviceNo ? `（${device.deviceNo}）` : '' }}
                      </a-select-option>
                    </a-select>
                  </template>
                </a-table-column>
                <a-table-column title="连接部件" width="220">
                  <template #default="{ record }">
                    <a-select
                      v-model:value="record.sinkComponentId"
                      style="width: 100%"
                      placeholder="选择连接部件"
                      @change="syncConnectionEndpoint(record)"
                    >
                      <a-select-option v-for="component in getSinkComponentOptions(record)" :key="component.id" :value="component.id">
                        {{ component.name }}
                      </a-select-option>
                    </a-select>
                  </template>
                </a-table-column>
                <a-table-column title="关联检测规则" width="320">
                  <template #default="{ record }">
                    <a-select
                      v-model:value="record.ruleIds"
                      mode="multiple"
                      style="width: 100%"
                      placeholder="不选则该连接对象不参与检测"
                      :options="connectionRuleOptions"
                      option-filter-prop="label"
                      show-search
                    />
                  </template>
                </a-table-column>
                <a-table-column title="操作" width="80">
                  <template #default="{ index }">
                    <a-button type="link" size="small" danger @click="removeConnectionObject(index)">删除</a-button>
                  </template>
                </a-table-column>
              </a-table>
              <a-button size="small" style="margin-top: 10px" @click="addConnectionObject">新增连接对象</a-button>
            </a-tab-pane>
          </a-tabs>
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
import { UploadOutlined } from '@ant-design/icons-vue'
import { useInspectionStore } from '@/stores/inspection'
import type { InspectedAssetComponent, ConnectionObject, ObjectDetectionConfig } from '@/types/inspection'
import { getDetectionItemConfigs, type DetectionItemConfig } from '@/views/implementation/detection-item-config/model'

type AssetComponentRow = InspectedAssetComponent & { localKey: string }
type EndpointPath = [string, string]
type ConnectionObjectRow = ConnectionObject & {
  localKey: string
  sourceComponentId?: string
  sinkScope?: 'self' | 'other'
  sinkDeviceId?: string
  sinkComponentId?: string
  endpointAPath?: EndpointPath
  endpointBPath?: EndpointPath
  ruleIds?: string[]
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
  expiryDate: '',
  usageCertificateNo: '',
  authorityCertificateNo: '',
  commissioningDate: '',
  lastInspectionTime: '',
  nextInspectionTime: '',
  expiryWarningDays: 30,
  inspectionPostName: '',
  mapCoordinate: '',
  areaId: '',
  areaName: '',
  departmentName: '',
  storageLocation: '',
  outDate: '',
  factoryNo: '',
  issueDate: '',
  systemName: '',
  lastInspectionConclusion: '',
  inspectionWarningDays: 15,
  deviceCategory: '',
  custodianPostName: '',
  nfcId: '',
  inspectionPointId: '',
  referenceImageUrl: '',
  status: 'active'
})

const assetComponents = ref<AssetComponentRow[]>([])
const connectionObjects = ref<ConnectionObjectRow[]>([])
const existingObjectDetectionConfigs = ref<ObjectDetectionConfig[]>([])

const currentPoint = computed(() => inspectionStore.inspectionPoints.find((point: any) => point.id === form.inspectionPointId) as any)
const currentDeviceId = computed(() => form.id || 'new-device')
const currentDeviceLabel = computed(() => `${form.name || '当前设施'}${form.deviceNo ? `（${form.deviceNo}）` : ''}`)
const otherDeviceOptions = computed(() => inspectionStore.inspectionDevices.filter(device => device.id !== currentDeviceId.value && (device.assetComponents || []).length))
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
const componentEndpointOptions = computed(() => {
  const currentDeviceId = form.id || 'new-device'
  const currentDevice = {
    id: currentDeviceId,
    name: form.name || '当前设施',
    deviceNo: form.deviceNo || form.code || '',
    assetComponents: assetComponents.value
  }
  const devices = [currentDevice, ...inspectionStore.inspectionDevices.filter(device => device.id !== currentDeviceId)]
  return devices
    .filter(device => (device.assetComponents || []).length)
    .map(device => ({
      label: `${device.name}${device.deviceNo ? `（${device.deviceNo}）` : ''}`,
      value: device.id,
      children: (device.assetComponents || []).map(component => ({
        label: component.name,
        value: component.id
      }))
    }))
})
const areas = computed(() => {
  const map = new Map<string, string>()
  inspectionStore.inspectionPoints.forEach((point) => {
    if (point.areaId) map.set(point.areaId, point.areaName || point.areaId)
  })
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
})

function seedAssetModel(deviceId: string) {
  form.id = deviceId
  assetComponents.value = [
    { id: `${deviceId}-valve`, localKey: `${deviceId}-valve`, assetId: deviceId, name: '入口阀门', type: 'valve' },
    { id: `${deviceId}-meter`, localKey: `${deviceId}-meter`, assetId: deviceId, name: '压力表', type: 'meter' },
    { id: `${deviceId}-flange`, localKey: `${deviceId}-flange`, assetId: deviceId, name: '出口法兰', type: 'flange' },
    { id: `${deviceId}-motor`, localKey: `${deviceId}-motor`, assetId: deviceId, name: '驱动电机', type: 'motor' }
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
      endpointAPath: [deviceId, `${deviceId}-valve`],
      endpointBPath: [deviceId, `${deviceId}-meter`],
      ruleIds: [],
      detectionFocus: '开闭状态/泄漏'
    },
    {
      id: `${deviceId}-conn-flange-pipe`,
      localKey: `${deviceId}-conn-flange-pipe`,
      name: '法兰-管线',
      endpointA: '当前设施 / 出口法兰',
      endpointB: '当前设施 / 驱动电机',
      sourceComponentId: `${deviceId}-flange`,
      sinkScope: 'self',
      sinkDeviceId: deviceId,
      sinkComponentId: `${deviceId}-motor`,
      endpointAPath: [deviceId, `${deviceId}-flange`],
      endpointBPath: [deviceId, `${deviceId}-motor`],
      ruleIds: [],
      detectionFocus: '紧密度/温升'
    }
  ]
}

function loadDetail() {
  inspectionStore.initialize()
  if (!isEdit.value) {
    seedAssetModel(`device-${Date.now()}`)
    return
  }

  const detail = inspectionStore.inspectionDevices.find((item: any) => item.id === route.params.id) as any
  if (!detail) return
  existingObjectDetectionConfigs.value = Array.isArray(detail.objectDetectionConfigs) ? detail.objectDetectionConfigs : []

  form.id = detail.id
  form.name = detail.name
  form.inspectionPointId = detail.inspectionPointId
  form.deviceNo = detail.deviceNo || detail.code
  form.code = detail.code
  form.deviceClassification = detail.deviceClassification || ''
  form.specModel = detail.specModel || ''
  form.owner = detail.owner || ''
  form.manufacturer = detail.manufacturer || ''
  form.expiryDate = detail.expiryDate || ''
  form.usageCertificateNo = detail.usageCertificateNo || ''
  form.authorityCertificateNo = detail.authorityCertificateNo || ''
  form.commissioningDate = detail.commissioningDate || ''
  form.lastInspectionTime = detail.lastInspectionTime || ''
  form.nextInspectionTime = detail.nextInspectionTime || ''
  form.expiryWarningDays = detail.expiryWarningDays ?? 30
  form.inspectionPostName = detail.inspectionPostName || ''
  form.mapCoordinate = detail.mapCoordinate || ''
  form.areaId = detail.areaId || currentPoint.value?.areaId || ''
  form.areaName = detail.areaName || currentPoint.value?.areaName || ''
  form.departmentName = detail.departmentName || ''
  form.storageLocation = detail.storageLocation || ''
  form.outDate = detail.outDate || ''
  form.factoryNo = detail.factoryNo || ''
  form.issueDate = detail.issueDate || ''
  form.systemName = detail.systemName || ''
  form.lastInspectionConclusion = detail.lastInspectionConclusion || ''
  form.inspectionWarningDays = detail.inspectionWarningDays ?? 15
  form.deviceCategory = detail.deviceCategory || ''
  form.custodianPostName = detail.custodianPostName || ''
  form.nfcId = detail.nfcId || ''
  form.referenceImageUrl = detail.referenceImageUrl || ''
  form.status = detail.status || 'active'
  assetComponents.value = (detail.assetComponents || []).map((item: any, index: number) => ({
    ...item,
    ruleIds: Array.isArray(item.ruleIds) ? item.ruleIds : getRuleIdsFromUnifiedConfig('component', item.id),
    localKey: item.localKey || `${item.id || 'component'}-${index}`
  }))
  connectionObjects.value = (detail.connectionObjects || []).map((item: any, index: number) => ({
    ...item,
    localKey: item.localKey || `${item.id || 'connection'}-${index}`,
    ...normalizeConnectionObject(item)
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
  assetComponents.value.push({ id, localKey: id, assetId: form.id || 'new-device', name: '新增部件', type: 'valve', ruleIds: [] })
}

function removeAssetComponent(index: number) {
  assetComponents.value.splice(index, 1)
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
    endpointAPath: firstSource ? [currentDeviceId.value, firstSource] : undefined,
    endpointBPath: firstSink ? [currentDeviceId.value, firstSink] : undefined,
    ruleIds: [],
    detectionFocus: '泄漏/紧密度'
  })
}

function removeConnectionObject(index: number) {
  connectionObjects.value.splice(index, 1)
}

function findEndpointPath(endpointName: string): EndpointPath | undefined {
  if (!endpointName) return undefined
  for (const device of componentEndpointOptions.value) {
    const component = device.children?.find(item => endpointName.includes(String(item.label)) || endpointName === item.value)
    if (component) return [String(device.value), String(component.value)]
  }
  return undefined
}

function normalizeConnectionObject(item: any): Partial<ConnectionObjectRow> {
  const sourcePath = item.endpointAPath || findEndpointPath(item.endpointA)
  const sinkPath = item.endpointBPath || findEndpointPath(item.endpointB)
  const sourceComponentId = item.sourceComponentId || sourcePath?.[1] || assetComponents.value[0]?.id
  const sinkDeviceId = item.sinkDeviceId || sinkPath?.[0] || currentDeviceId.value
  const sinkComponentId = item.sinkComponentId || sinkPath?.[1] || assetComponents.value[0]?.id
  const sinkScope = item.sinkScope || (sinkDeviceId === currentDeviceId.value ? 'self' : 'other')
  return {
    sourceComponentId,
    sinkScope,
    sinkDeviceId: sinkScope === 'self' ? currentDeviceId.value : sinkDeviceId,
    sinkComponentId,
    ruleIds: Array.isArray(item.ruleIds) ? item.ruleIds : getRuleIdsFromUnifiedConfig('connection', item.id),
    endpointAPath: sourceComponentId ? [currentDeviceId.value, sourceComponentId] : undefined,
    endpointBPath: sinkComponentId ? [sinkScope === 'self' ? currentDeviceId.value : sinkDeviceId, sinkComponentId] : undefined,
    endpointA: item.endpointA || formatSourceEndpoint(sourceComponentId),
    endpointB: item.endpointB || formatSinkEndpoint(sinkScope, sinkDeviceId, sinkComponentId)
  }
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

function getSinkComponentOptions(record: ConnectionObjectRow) {
  if (record.sinkScope === 'other') {
    const device = inspectionStore.inspectionDevices.find(item => item.id === record.sinkDeviceId)
    return device?.assetComponents || []
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

function syncConnectionEndpoint(record: ConnectionObjectRow) {
  record.endpointAPath = record.sourceComponentId ? [currentDeviceId.value, record.sourceComponentId] : undefined
  record.endpointBPath = record.sinkComponentId ? [record.sinkScope === 'self' ? currentDeviceId.value : String(record.sinkDeviceId || ''), record.sinkComponentId] : undefined
  record.endpointA = formatSourceEndpoint(record.sourceComponentId)
  record.endpointB = formatSinkEndpoint(record.sinkScope, record.sinkDeviceId, record.sinkComponentId)
}

function onPointChange(value: string) {
  const point = inspectionStore.inspectionPoints.find((item: any) => item.id === value) as any
  if (point?.areaId) {
    form.areaId = point.areaId
    form.areaName = point.areaName || ''
  }
}

function onAreaChange(value: string) {
  const area = areas.value.find(item => item.id === value)
  form.areaName = area?.name || ''
}

function handleSave() {
  if (!form.deviceNo || !form.deviceClassification || !form.owner || !form.name || !form.areaId || !form.deviceCategory || !form.inspectionPointId) {
    message.error('请补充必填信息：设备编号、设备分类、责任人、设备名称、所在区域、设备类别、所在巡检点')
    return
  }

  if (!form.code) form.code = form.deviceNo
  const payloadId = form.id || `device-${Date.now()}`
  const payload: any = {
    id: payloadId,
    inspectionPointId: form.inspectionPointId,
    name: form.name,
    code: form.code,
    deviceNo: form.deviceNo,
    deviceClassification: form.deviceClassification,
    specModel: form.specModel,
    owner: form.owner,
    manufacturer: form.manufacturer,
    expiryDate: form.expiryDate,
    usageCertificateNo: form.usageCertificateNo,
    authorityCertificateNo: form.authorityCertificateNo,
    commissioningDate: form.commissioningDate,
    lastInspectionTime: form.lastInspectionTime,
    nextInspectionTime: form.nextInspectionTime,
    expiryWarningDays: form.expiryWarningDays,
    inspectionPostName: form.inspectionPostName,
    mapCoordinate: form.mapCoordinate,
    areaId: form.areaId,
    areaName: form.areaName,
    departmentName: form.departmentName,
    storageLocation: form.storageLocation,
    outDate: form.outDate,
    factoryNo: form.factoryNo,
    issueDate: form.issueDate,
    systemName: form.systemName,
    lastInspectionConclusion: form.lastInspectionConclusion,
    inspectionWarningDays: form.inspectionWarningDays,
    deviceCategory: form.deviceCategory,
    custodianPostName: form.custodianPostName,
    nfcId: form.nfcId,
    type: 'general',
    sequence: 1,
    referenceImageUrl: form.referenceImageUrl || defaultDeviceImage,
    status: form.status,
    assetComponents: assetComponents.value.map(({ localKey, ...item }) => ({ ...item, assetId: payloadId })),
    connectionObjects: connectionObjects.value.map(({ localKey, ...item }) => item),
    objectDetectionConfigs: buildObjectDetectionConfigs(payloadId),
    createdAt: new Date(),
    updatedAt: new Date()
  }

  inspectionStore.saveInspectionDevice(payload)

  message.success('设备信息已保存')
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
.model-section-title {
  margin-bottom: 8px;
  font-weight: 600;
  color: #1f2937;
}
</style>
