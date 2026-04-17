<template>
  <div class="facility-device-form">
    <a-page-header :title="isEdit ? '编辑设施设备' : '新增设施设备'" @back="goBack" />
    <a-card style="margin-top: 16px">
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="8"><a-form-item label="设备名称" required><a-input v-model:value="form.name" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="设备编号" required><a-input v-model:value="form.deviceNo" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="设备类别" required><a-input v-model:value="form.deviceCategory" /></a-form-item></a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="8"><a-form-item label="设备分类" required><a-input v-model:value="form.deviceClassification" /></a-form-item></a-col>
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
          <a-col :span="8"><a-form-item label="检测周期"><a-input v-model:value="form.detectionCycle" placeholder="例如 每30天" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="最近检测结论"><a-select v-model:value="form.lastInspectionConclusion"><a-select-option value="合格">合格</a-select-option><a-select-option value="不合格">不合格</a-select-option><a-select-option value="待检">待检</a-select-option></a-select></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="设备编码"><a-input v-model:value="form.code" placeholder="默认同设备编号" /></a-form-item></a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="8"><a-form-item label="失效预警天数"><a-input-number v-model:value="form.expiryWarningDays" :min="0" style="width: 100%" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="检测预警天数"><a-input-number v-model:value="form.inspectionWarningDays" :min="0" style="width: 100%" /></a-form-item></a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="巡检周期">
              <a-input-group compact>
                <a-input-number v-model:value="form.checkCycleValue" :min="1" style="width: 48%" />
                <a-select v-model:value="form.checkCycleUnit" style="width: 52%">
                  <a-select-option value="hour">小时</a-select-option>
                  <a-select-option value="day">天</a-select-option>
                  <a-select-option value="week">周</a-select-option>
                </a-select>
              </a-input-group>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="巡检窗口">
              <a-input v-model:value="form.windowText" placeholder="例如 08:00 - 18:00" />
            </a-form-item>
          </a-col>
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

        <a-card size="small" title="检测项配置">
          <a-table :columns="itemColumns" :data-source="checkItems" row-key="localKey" :pagination="false" :scroll="{ x: 1100 }">
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'name'">
                <a-input v-model:value="record.name" placeholder="检测项名称" />
              </template>
              <template v-else-if="column.key === 'type'">
                <a-select v-model:value="record.detectionType" style="width: 100%" @change="onTypeChange(record)">
                  <a-select-option value="gas">气体</a-select-option>
                  <a-select-option value="liquid">液体</a-select-option>
                  <a-select-option value="appearance">外观</a-select-option>
                </a-select>
              </template>
              <template v-else-if="column.key === 'priority'">
                <a-select v-model:value="record.priority" style="width: 100%">
                  <a-select-option value="high">高</a-select-option>
                  <a-select-option value="medium">中</a-select-option>
                  <a-select-option value="low">低</a-select-option>
                </a-select>
              </template>
              <template v-else-if="column.key === 'cycle'">
                <a-input-group compact>
                  <a-input-number v-model:value="record.cycleValue" :min="1" style="width: 48%" />
                  <a-select v-model:value="record.cycleUnit" style="width: 52%">
                    <a-select-option value="hour">小时</a-select-option>
                    <a-select-option value="day">天</a-select-option>
                    <a-select-option value="week">周</a-select-option>
                  </a-select>
                </a-input-group>
              </template>
              <template v-else-if="column.key === 'window'">
                <a-input v-model:value="record.windowText" placeholder="08:00 - 18:00" />
              </template>
              <template v-else-if="column.key === 'threshold'">
                <template v-if="record.detectionType === 'appearance'">-</template>
                <a-input-number v-else v-model:value="record.thresholdValue" style="width: 100%" :min="0" />
              </template>
              <template v-else-if="column.key === 'actions'">
                <a-space>
                  <a-button size="small" :disabled="index === 0" @click="moveItem(index, -1)">上移</a-button>
                  <a-button size="small" :disabled="index === checkItems.length - 1" @click="moveItem(index, 1)">下移</a-button>
                  <a-button size="small" danger @click="removeItem(index)">删除</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
          <a-button style="margin-top: 12px" @click="addItem">新增检测项</a-button>
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

interface DeviceCheckItemRow {
  id?: string
  localKey: string
  name: string
  detectionType: 'gas' | 'liquid' | 'appearance'
  priority: 'high' | 'medium' | 'low'
  cycleValue: number
  cycleUnit: 'hour' | 'day' | 'week'
  windowText: string
  thresholdValue?: number
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
  detectionCycle: '',
  lastInspectionConclusion: '',
  inspectionWarningDays: 15,
  deviceCategory: '',
  custodianPostName: '',
  nfcId: '',
  inspectionPointId: '',
  referenceImageUrl: '',
  status: 'active',
  checkCycleValue: 1,
  checkCycleUnit: 'day',
  windowText: '08:00 - 18:00'
})

const checkItems = ref<DeviceCheckItemRow[]>([])

const itemColumns = [
  { title: '检测项名称', key: 'name', width: 180 },
  { title: '检测类型', key: 'type', width: 120 },
  { title: '优先级', key: 'priority', width: 110 },
  { title: '巡检周期', key: 'cycle', width: 170 },
  { title: '巡检窗口', key: 'window', width: 170 },
  { title: '告警阈值', key: 'threshold', width: 130 },
  { title: '操作', key: 'actions', width: 220 }
]

const currentPoint = computed(() => inspectionStore.inspectionPoints.find((point: any) => point.id === form.inspectionPointId) as any)
const areas = computed(() => {
  const map = new Map<string, string>()
  inspectionStore.inspectionPoints.forEach((point) => {
    if (point.areaId) map.set(point.areaId, point.areaName || point.areaId)
  })
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
})

function inferDetectionType(name: string): 'gas' | 'liquid' | 'appearance' {
  if (name.includes('气') || name.includes('氧') || name.includes('硫化氢') || name.includes('一氧化碳')) return 'gas'
  if (name.includes('液') || name.includes('液位')) return 'liquid'
  return 'appearance'
}

function loadDetail() {
  inspectionStore.initialize()
  if (!isEdit.value) {
    checkItems.value = [
      {
        localKey: `new-${Date.now()}`,
        name: '示例检测项',
        detectionType: 'gas',
        priority: 'medium',
        cycleValue: 1,
        cycleUnit: 'day',
        windowText: '08:00 - 18:00',
        thresholdValue: 50
      }
    ]
    return
  }

  const detail = inspectionStore.inspectionDevices.find((item: any) => item.id === route.params.id) as any
  if (!detail) return

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
  form.detectionCycle = detail.detectionCycle || ''
  form.lastInspectionConclusion = detail.lastInspectionConclusion || ''
  form.inspectionWarningDays = detail.inspectionWarningDays ?? 15
  form.deviceCategory = detail.deviceCategory || ''
  form.custodianPostName = detail.custodianPostName || ''
  form.nfcId = detail.nfcId || ''
  form.referenceImageUrl = detail.referenceImageUrl || ''
  form.status = detail.status || 'active'
  form.checkCycleValue = detail.inspectionFrequency?.value || 1
  form.checkCycleUnit = detail.inspectionFrequency?.unit || 'day'
  form.windowText = detail.executionWindow ? `${detail.executionWindow.startTime} - ${detail.executionWindow.endTime}` : '08:00 - 18:00'

  checkItems.value = inspectionStore.inspectionDeviceCheckItems
    .filter((item: any) => item.deviceId === detail.id)
    .map((item: any, index: number) => ({
      id: item.id,
      localKey: `${item.id}-${index}`,
      name: item.name,
      detectionType: (item.detectionType as any) || inferDetectionType(item.name),
      priority: item.priorityLevel || (item.priority === 'primary' ? 'high' : 'medium'),
      cycleValue: item.inspectionFrequency?.value || detail.inspectionFrequency?.value || 1,
      cycleUnit: item.inspectionFrequency?.unit || detail.inspectionFrequency?.unit || 'day',
      windowText: item.executionWindow ? `${item.executionWindow.startTime} - ${item.executionWindow.endTime}` : (detail.executionWindow ? `${detail.executionWindow.startTime} - ${detail.executionWindow.endTime}` : '08:00 - 18:00'),
      thresholdValue: item.threshold?.warning || item.threshold?.max
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

function addItem() {
  checkItems.value.push({
    localKey: `new-${Date.now()}`,
    name: '',
    detectionType: 'gas',
    priority: 'medium',
    cycleValue: 1,
    cycleUnit: 'day',
    windowText: '08:00 - 18:00',
    thresholdValue: 50
  })
}

function removeItem(index: number) {
  checkItems.value.splice(index, 1)
}

function moveItem(index: number, offset: number) {
  const target = index + offset
  const current = checkItems.value[index]
  checkItems.value.splice(index, 1)
  checkItems.value.splice(target, 0, current)
}

function onTypeChange(record: DeviceCheckItemRow) {
  if (record.detectionType === 'appearance') {
    record.thresholdValue = undefined
  } else if (record.thresholdValue === undefined) {
    record.thresholdValue = 50
  }
}

function parseWindow(text: string) {
  const parts = String(text || '').split('-').map((item) => item.trim())
  return { startTime: parts[0] || '08:00', endTime: parts[1] || '18:00' }
}

function mapPriority(value: 'high' | 'medium' | 'low') {
  if (value === 'high') return 'primary'
  return 'secondary'
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
  const payload: any = {
    id: form.id || `device-${Date.now()}`,
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
    detectionCycle: form.detectionCycle,
    lastInspectionConclusion: form.lastInspectionConclusion,
    inspectionWarningDays: form.inspectionWarningDays,
    deviceCategory: form.deviceCategory,
    custodianPostName: form.custodianPostName,
    nfcId: form.nfcId,
    type: 'general',
    sequence: 1,
    referenceImageUrl: form.referenceImageUrl || defaultDeviceImage,
    status: form.status,
    inspectionFrequency: { value: form.checkCycleValue, unit: form.checkCycleUnit },
    executionWindow: parseWindow(form.windowText),
    createdAt: new Date(),
    updatedAt: new Date()
  }

  inspectionStore.saveInspectionDevice(payload)

  const existingIds = inspectionStore.inspectionDeviceCheckItems
    .filter(item => item.deviceId === payload.id)
    .map(item => item.id)
  existingIds.forEach(id => inspectionStore.deleteInspectionDeviceCheckItem(id))

  checkItems.value.forEach((item, index) => {
    inspectionStore.saveInspectionDeviceCheckItem({
      id: item.id || `check-${Date.now()}-${index}`,
      deviceId: payload.id,
      name: item.name || `检测项${index + 1}`,
      code: `CHECK-${index + 1}`,
      checkType: 'threshold',
      detectionType: item.detectionType,
      priorityLevel: item.priority,
      priority: mapPriority(item.priority),
      inspectionFrequency: { value: item.cycleValue, unit: item.cycleUnit },
      executionWindow: parseWindow(item.windowText),
      unit: item.detectionType === 'gas' ? 'ppm' : item.detectionType === 'liquid' ? 'm' : '-',
      threshold: item.detectionType === 'appearance' ? {} : { warning: item.thresholdValue, max: item.thresholdValue },
      visionMapping: payload.referenceImageUrl
        ? { sourceType: 'manual', customImageUrl: payload.referenceImageUrl, recognitionMode: 'ai' }
        : undefined,
      createdAt: new Date(),
      updatedAt: new Date()
    } as any)
  })

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
</style>
