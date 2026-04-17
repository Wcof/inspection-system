<template>
  <div class="metric-management">
    <a-page-header title="检测项管理" sub-title="支持检测类型、优先级、关联层级与阈值管理">
      <template #extra><a-button type="primary" @click="openCreateModal">新增</a-button></template>
    </a-page-header>

    <a-layout class="metric-layout">
      <a-layout-sider width="300" class="tree-sider">
        <div class="tree-panel">
          <a-input v-model:value="treeSearchValue" placeholder="搜索分区/巡检点/设备" allow-clear style="margin-bottom: 12px" />
          <a-tree v-model:selectedKeys="selectedTreeKeys" :tree-data="filteredTreeData" default-expand-all />
        </div>
      </a-layout-sider>

      <a-layout-content class="list-content">
        <a-card size="small" style="margin-bottom: 12px">
          <span class="header-title">检测项列表</span>
          <a-tag v-if="selectedPathLabel" color="blue">{{ selectedPathLabel }}</a-tag>
          <span class="header-count">共 {{ filteredItems.length }} 项</span>
        </a-card>

        <a-card size="small" style="margin-bottom: 12px">
          <a-form layout="vertical" :model="searchForm" @submit.prevent>
            <a-row :gutter="[12, 8]">
              <a-col :xs="24" :sm="12" :md="8" :lg="6">
                <a-form-item label="序号" class="search-item">
                  <a-input v-model:value="searchForm.index" allow-clear placeholder="请输入序号" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="8" :lg="6">
                <a-form-item label="检测项名称" class="search-item">
                  <a-input v-model:value="searchForm.name" allow-clear placeholder="请输入检测项名称" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="8" :lg="6">
                <a-form-item label="所属分区" class="search-item">
                  <a-select v-model:value="searchForm.areaId" allow-clear placeholder="请选择分区">
                    <a-select-option v-for="area in areas" :key="area.id" :value="area.id">{{ area.name }}</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="8" :lg="6">
                <a-form-item label="巡检点" class="search-item">
                  <a-select v-model:value="searchForm.pointId" allow-clear placeholder="请选择巡检点">
                    <a-select-option v-for="point in pointsByArea" :key="point.id" :value="point.id">{{ point.name }}</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="8" :lg="6">
                <a-form-item label="设施设备" class="search-item">
                  <a-select v-model:value="searchForm.deviceId" allow-clear placeholder="请选择设备">
                    <a-select-option v-for="device in devicesByPoint" :key="device.id" :value="device.id">{{ device.name }}</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="8" :lg="6">
                <a-form-item label="优先级" class="search-item">
                  <a-select v-model:value="searchForm.priority" allow-clear placeholder="请选择优先级">
                    <a-select-option value="high">高</a-select-option>
                    <a-select-option value="medium">中</a-select-option>
                    <a-select-option value="low">低</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
            </a-row>
            <div class="search-actions">
              <a-space>
                <a-button type="primary" @click="noopSearch">搜索</a-button>
                <a-button @click="resetSearch">重置</a-button>
              </a-space>
            </div>
          </a-form>
        </a-card>

        <a-table :columns="columns" :data-source="filteredItems" row-key="id" :scroll="{ x: 1560 }">
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'index'">{{ index + 1 }}</template>
            <template v-else-if="column.key === 'detectionType'">
              <a-tag :color="record.detectionType === 'gas' ? 'red' : record.detectionType === 'liquid' ? 'blue' : 'gold'">
                {{ detectionTypeText(record.detectionType) }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'region'">{{ getPoint(record.deviceId)?.areaName || '-' }}</template>
            <template v-else-if="column.key === 'point'">{{ getPoint(record.deviceId)?.name || '-' }}</template>
            <template v-else-if="column.key === 'device'">{{ getDeviceName(record.deviceId) }}</template>
            <template v-else-if="column.key === 'priority'">
              <a-tag :color="priorityColor(record.priorityLevel || inferPriority(record))">{{ priorityText(record.priorityLevel || inferPriority(record)) }}</a-tag>
            </template>
            <template v-else-if="column.key === 'cycle'">{{ getCycleText(record) }}</template>
            <template v-else-if="column.key === 'window'">{{ getWindowText(record) }}</template>
            <template v-else-if="column.key === 'threshold'">{{ getThresholdText(record) }}</template>
            <template v-else-if="column.key === 'reference'">
              <img v-if="record.referenceImageUrl" :src="record.referenceImageUrl" class="thumb" alt="reference" />
              <span v-else>-</span>
            </template>
            <template v-else-if="column.key === 'actions'">
              <a-space>
                <a-button type="link" @click="openEditModal(record)">编辑</a-button>
                <a-button type="link" danger @click="handleDelete(record.id)">删除</a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-layout-content>
    </a-layout>

    <a-modal v-model:open="editVisible" :title="editMode === 'create' ? '新增检测项' : '编辑检测项'" width="760px">
      <a-form layout="vertical">
        <a-row :gutter="12">
          <a-col :span="8">
            <a-form-item label="关联分区" required>
              <a-select v-model:value="editForm.areaId" placeholder="请选择分区" @change="onAreaChange">
                <a-select-option v-for="area in areas" :key="area.id" :value="area.id">{{ area.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="关联巡检点" required>
              <a-select v-model:value="editForm.pointId" placeholder="请选择巡检点" @change="onPointChange">
                <a-select-option v-for="point in selectablePoints" :key="point.id" :value="point.id">{{ point.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="关联设施设备" required>
              <a-select v-model:value="editForm.deviceId" placeholder="请选择设施设备">
                <a-select-option v-for="device in selectableDevices" :key="device.id" :value="device.id">{{ device.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="12">
          <a-col :span="8"><a-form-item label="检测项名称" required><a-input v-model:value="editForm.name" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="检测项编码" required><a-input v-model:value="editForm.code" /></a-form-item></a-col>
          <a-col :span="8">
            <a-form-item label="检测类型" required>
              <a-select v-model:value="editForm.detectionType">
                <a-select-option value="gas">气体</a-select-option>
                <a-select-option value="liquid">液体</a-select-option>
                <a-select-option value="appearance">外观</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="12">
          <a-col :span="8">
            <a-form-item label="优先级">
              <a-select v-model:value="editForm.priorityLevel">
                <a-select-option value="high">高</a-select-option>
                <a-select-option value="medium">中</a-select-option>
                <a-select-option value="low">低</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="巡检周期">
              <a-input-group compact>
                <a-input-number v-model:value="editForm.cycleValue" :min="1" style="width: 50%" />
                <a-select v-model:value="editForm.cycleUnit" style="width: 50%">
                  <a-select-option value="hour">小时</a-select-option>
                  <a-select-option value="day">天</a-select-option>
                  <a-select-option value="week">周</a-select-option>
                </a-select>
              </a-input-group>
            </a-form-item>
          </a-col>
          <a-col :span="8"><a-form-item label="巡检窗口"><a-input v-model:value="editForm.windowText" placeholder="例如 08:00 - 18:00" /></a-form-item></a-col>
        </a-row>
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="告警阈值">
              <a-input-number v-if="editForm.detectionType !== 'appearance'" v-model:value="editForm.thresholdValue" style="width: 100%" />
              <a-input v-else value="-" disabled />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="参考图">
              <div class="reference-image-field">
                <a-upload
                  v-if="!editForm.referenceImageUrl"
                  :show-upload-list="false"
                  :before-upload="() => false"
                  @change="handleReferenceImageChange"
                >
                  <a-button>上传参考图</a-button>
                </a-upload>
                <div v-else class="reference-preview-wrap">
                  <img :src="editForm.referenceImageUrl" class="preview-image" alt="参考图预览" />
                  <a-space>
                    <a-upload :show-upload-list="false" :before-upload="() => false" @change="handleReferenceImageChange">
                      <a-button size="small">重新上传</a-button>
                    </a-upload>
                    <a-button size="small" @click="clearReferenceImage">清除</a-button>
                  </a-space>
                </div>
              </div>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
      <template #footer>
        <a-space>
          <a-button @click="handleCancel">取消</a-button>
          <a-button type="primary" @click="handleSave">保存</a-button>
          <a-button type="primary" ghost @click="handleSaveAndGoCockpit">保存并前往驾驶舱</a-button>
        </a-space>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Modal, message } from 'ant-design-vue'
import { useInspectionStore } from '@/stores/inspection'

const inspectionStore = useInspectionStore()
const router = useRouter()
const treeSearchValue = ref('')
const selectedTreeKeys = ref<string[]>(['all'])
const editVisible = ref(false)
const editMode = ref<'create' | 'edit'>('create')
const editingId = ref('')

const searchForm = reactive({
  index: '',
  name: '',
  areaId: '',
  pointId: '',
  deviceId: '',
  priority: ''
})

const editForm = reactive<any>({
  areaId: '',
  pointId: '',
  deviceId: '',
  name: '',
  code: '',
  detectionType: 'gas',
  priorityLevel: 'medium',
  cycleValue: 1,
  cycleUnit: 'day',
  windowText: '08:00 - 18:00',
  thresholdValue: undefined,
  referenceImageUrl: ''
})

const areas = computed(() => {
  const map = new Map<string, any>()
  inspectionStore.inspectionPoints.forEach((point: any) => {
    if (point.areaId) map.set(point.areaId, { id: point.areaId, name: point.areaName || point.areaId })
  })
  return Array.from(map.values())
})

const treeData = computed(() => [{
  title: '全部',
  key: 'all',
  children: areas.value.map((area: any) => ({
    title: area.name,
    key: `area:${area.id}`,
    children: inspectionStore.inspectionPoints
      .filter((point: any) => point.areaId === area.id)
      .map((point: any) => ({
        title: point.name,
        key: `point:${point.id}`,
        children: inspectionStore.inspectionDevices
          .filter((device: any) => device.inspectionPointId === point.id)
          .map((device: any) => ({ title: device.name, key: `device:${device.id}` }))
      }))
  }))
}])

function filterTree(nodes: any[], keyword: string): any[] {
  if (!keyword) return nodes
  return nodes
    .map((node) => {
      const children = filterTree(node.children || [], keyword)
      const matched = String(node.title || '').toLowerCase().includes(keyword)
      return matched || children.length ? { ...node, children } : null
    })
    .filter(Boolean) as any[]
}

const filteredTreeData = computed(() => filterTree(treeData.value, treeSearchValue.value.trim().toLowerCase()))
const selectedTreeKey = computed(() => selectedTreeKeys.value[0] || 'all')

function resolveTreeLabel(key: string) {
  if (key === 'all') return ''
  const [type, id] = key.split(':')
  if (type === 'area') return areas.value.find((item: any) => item.id === id)?.name || key
  if (type === 'point') return inspectionStore.inspectionPoints.find((item: any) => item.id === id)?.name || key
  if (type === 'device') return inspectionStore.inspectionDevices.find((item: any) => item.id === id)?.name || key
  return key
}

const selectedPathLabel = computed(() => resolveTreeLabel(selectedTreeKey.value))
const selectablePoints = computed(() => inspectionStore.inspectionPoints.filter((point: any) => !editForm.areaId || point.areaId === editForm.areaId))
const selectableDevices = computed(() => inspectionStore.inspectionDevices.filter((device: any) => !editForm.pointId || device.inspectionPointId === editForm.pointId))
const pointsByArea = computed(() => inspectionStore.inspectionPoints.filter(point => !searchForm.areaId || point.areaId === searchForm.areaId))
const devicesByPoint = computed(() => inspectionStore.inspectionDevices.filter(device => !searchForm.pointId || device.inspectionPointId === searchForm.pointId))

const columns = [
  { title: '序号', key: 'index', width: 70 },
  { title: '检测项名称', dataIndex: 'name', key: 'name', width: 180 },
  { title: '检测类型', key: 'detectionType', width: 110 },
  { title: '所属分区', key: 'region', width: 140 },
  { title: '巡检点', key: 'point', width: 160 },
  { title: '设施设备', key: 'device', width: 160 },
  { title: '优先级', key: 'priority', width: 100 },
  { title: '巡检周期', key: 'cycle', width: 120 },
  { title: '巡检窗口', key: 'window', width: 160 },
  { title: '告警阈值', key: 'threshold', width: 140 },
  { title: '参考图', key: 'reference', width: 110 },
  { title: '操作', key: 'actions', width: 120 }
]

function inferDetectionType(name: string): 'gas' | 'liquid' | 'appearance' {
  if (name.includes('气') || name.includes('氧') || name.includes('硫化氢') || name.includes('一氧化碳')) return 'gas'
  if (name.includes('液') || name.includes('液位')) return 'liquid'
  return 'appearance'
}

function detectionTypeText(type: string) {
  if (type === 'gas') return '气体'
  if (type === 'liquid') return '液体'
  return '外观'
}

function inferPriority(record: any): 'high' | 'medium' | 'low' {
  if (record.priority === 'primary') return 'high'
  return 'medium'
}

function priorityText(value: 'high' | 'medium' | 'low') {
  if (value === 'high') return '高'
  if (value === 'low') return '低'
  return '中'
}

function priorityColor(value: 'high' | 'medium' | 'low') {
  if (value === 'high') return 'red'
  if (value === 'low') return 'default'
  return 'blue'
}

const filteredItems = computed(() => {
  const base = inspectionStore.inspectionDeviceCheckItems
    .map((item, idx) => ({
      ...item,
      _index: idx + 1,
      detectionType: (item as any).detectionType || inferDetectionType(item.name),
      priorityLevel: (item as any).priorityLevel || inferPriority(item)
    }))
    .filter((item: any) => {
      const device = inspectionStore.inspectionDevices.find((d: any) => d.id === item.deviceId) as any
      const point = inspectionStore.inspectionPoints.find((p: any) => p.id === device?.inspectionPointId) as any
      if (selectedTreeKey.value === 'all') return true
      if (selectedTreeKey.value.startsWith('device:')) return item.deviceId === selectedTreeKey.value.replace('device:', '')
      if (selectedTreeKey.value.startsWith('point:')) return device?.inspectionPointId === selectedTreeKey.value.replace('point:', '')
      if (selectedTreeKey.value.startsWith('area:')) return point?.areaId === selectedTreeKey.value.replace('area:', '')
      return true
    })

  return base.filter((item: any) => {
    const device = inspectionStore.inspectionDevices.find((d: any) => d.id === item.deviceId) as any
    const point = inspectionStore.inspectionPoints.find((p: any) => p.id === device?.inspectionPointId) as any

    const matchIndex = !searchForm.index || String(item._index).includes(searchForm.index.trim())
    const matchName = !searchForm.name || item.name.toLowerCase().includes(searchForm.name.trim().toLowerCase())
    const matchArea = !searchForm.areaId || point?.areaId === searchForm.areaId
    const matchPoint = !searchForm.pointId || point?.id === searchForm.pointId
    const matchDevice = !searchForm.deviceId || item.deviceId === searchForm.deviceId
    const matchPriority = !searchForm.priority || item.priorityLevel === searchForm.priority

    return matchIndex && matchName && matchArea && matchPoint && matchDevice && matchPriority
  })
})

function getDeviceName(deviceId: string) {
  return inspectionStore.inspectionDevices.find((device: any) => device.id === deviceId)?.name || '-'
}

function getPoint(deviceId: string) {
  const device = inspectionStore.inspectionDevices.find((item: any) => item.id === deviceId)
  return inspectionStore.inspectionPoints.find((point: any) => point.id === device?.inspectionPointId) as any
}

function getCycleText(record: any) {
  return record.inspectionFrequency
    ? `${record.inspectionFrequency.value}${record.inspectionFrequency.unit === 'day' ? '天' : record.inspectionFrequency.unit === 'week' ? '周' : '小时'}`
    : '-'
}

function getWindowText(record: any) {
  return record.executionWindow ? `${record.executionWindow.startTime} - ${record.executionWindow.endTime}` : '-'
}

function getThresholdText(record: any) {
  if (record.detectionType === 'appearance') return '-'
  const warning = record.threshold?.warning
  const max = record.threshold?.max
  if (warning === undefined && max === undefined) return '-'
  return `${warning ?? '-'} / ${max ?? '-'}`
}

function parseWindow(text: string) {
  const [startTime, endTime] = String(text || '').split('-').map((item) => item.trim())
  return { startTime: startTime || '08:00', endTime: endTime || '18:00' }
}

function mapPriority(level: 'high' | 'medium' | 'low') {
  return level === 'high' ? 'primary' : 'secondary'
}

function noopSearch() {
  // 触发 computed 过滤
}

function resetSearch() {
  searchForm.index = ''
  searchForm.name = ''
  searchForm.areaId = ''
  searchForm.pointId = ''
  searchForm.deviceId = ''
  searchForm.priority = ''
}

function resetForm() {
  editForm.areaId = ''
  editForm.pointId = ''
  editForm.deviceId = ''
  editForm.name = ''
  editForm.code = ''
  editForm.detectionType = 'gas'
  editForm.priorityLevel = 'medium'
  editForm.cycleValue = 1
  editForm.cycleUnit = 'day'
  editForm.windowText = '08:00 - 18:00'
  editForm.thresholdValue = undefined
  editForm.referenceImageUrl = ''
}

function openCreateModal() {
  editMode.value = 'create'
  editingId.value = ''
  prefillByTree()
  editVisible.value = true
}

function prefillByTree() {
  resetForm()
  if (selectedTreeKey.value.startsWith('area:')) {
    editForm.areaId = selectedTreeKey.value.replace('area:', '')
  }
  if (selectedTreeKey.value.startsWith('point:')) {
    const pointId = selectedTreeKey.value.replace('point:', '')
    const point = inspectionStore.inspectionPoints.find((item: any) => item.id === pointId) as any
    editForm.pointId = pointId
    editForm.areaId = point?.areaId || ''
  }
  if (selectedTreeKey.value.startsWith('device:')) {
    const deviceId = selectedTreeKey.value.replace('device:', '')
    const device = inspectionStore.inspectionDevices.find((item: any) => item.id === deviceId) as any
    const point = inspectionStore.inspectionPoints.find((item: any) => item.id === device?.inspectionPointId) as any
    editForm.deviceId = deviceId
    editForm.pointId = point?.id || ''
    editForm.areaId = point?.areaId || ''
  }
}

function openEditModal(record: any) {
  editMode.value = 'edit'
  editingId.value = record.id
  const point = getPoint(record.deviceId)
  editForm.areaId = point?.areaId || ''
  editForm.pointId = point?.id || ''
  editForm.deviceId = record.deviceId
  editForm.name = record.name
  editForm.code = record.code
  editForm.detectionType = record.detectionType || inferDetectionType(record.name)
  editForm.priorityLevel = record.priorityLevel || inferPriority(record)
  editForm.cycleValue = record.inspectionFrequency?.value || 1
  editForm.cycleUnit = record.inspectionFrequency?.unit || 'day'
  editForm.windowText = record.executionWindow ? `${record.executionWindow.startTime} - ${record.executionWindow.endTime}` : '08:00 - 18:00'
  editForm.thresholdValue = record.threshold?.warning || record.threshold?.max
  editForm.referenceImageUrl = record.referenceImageUrl || record.visionMapping?.customImageUrl || ''
  editVisible.value = true
}

function onAreaChange() {
  editForm.pointId = ''
  editForm.deviceId = ''
}

function onPointChange() {
  editForm.deviceId = ''
}

function saveCurrentEdit(): boolean {
  if (!editForm.areaId || !editForm.pointId || !editForm.deviceId || !editForm.name || !editForm.code) {
    message.error('请完整填写分区、巡检点、设备、名称和编码')
    return false
  }

  inspectionStore.saveInspectionDeviceCheckItem({
    id: editingId.value || `check-${Date.now()}`,
    deviceId: editForm.deviceId,
    name: editForm.name,
    code: editForm.code,
    checkType: 'threshold',
    detectionType: editForm.detectionType,
    priorityLevel: editForm.priorityLevel,
    priority: mapPriority(editForm.priorityLevel),
    inspectionFrequency: { value: editForm.cycleValue, unit: editForm.cycleUnit },
    executionWindow: parseWindow(editForm.windowText),
    unit: editForm.detectionType === 'gas' ? 'ppm' : editForm.detectionType === 'liquid' ? 'm' : '-',
    threshold: editForm.detectionType === 'appearance' ? {} : { warning: editForm.thresholdValue, max: editForm.thresholdValue },
    referenceImageUrl: editForm.referenceImageUrl,
    visionMapping: editForm.referenceImageUrl
      ? { sourceType: 'manual', customImageUrl: editForm.referenceImageUrl, recognitionMode: 'ai' }
      : undefined,
    createdAt: new Date(),
    updatedAt: new Date()
  } as any)

  return true
}

function handleSave() {
  const saved = saveCurrentEdit()
  if (!saved) return
  editVisible.value = false
  message.success('检测项已保存')
}

function handleSaveAndGoCockpit() {
  const saved = saveCurrentEdit()
  if (!saved) return
  editVisible.value = false
  message.success('检测项已保存，正在前往驾驶舱')
  router.push('/management/cockpit/view')
}

function handleCancel() {
  editVisible.value = false
}

function clearReferenceImage() {
  editForm.referenceImageUrl = ''
}

function handleReferenceImageChange(info: any) {
  const file = info?.file?.originFileObj
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    editForm.referenceImageUrl = String(reader.result || '')
  }
  reader.readAsDataURL(file)
}

function handleDelete(id: string) {
  Modal.confirm({
    title: '确认删除检测项？',
    onOk: () => {
      inspectionStore.deleteInspectionDeviceCheckItem(id)
      message.success('已删除')
    }
  })
}

onMounted(() => inspectionStore.initialize())
</script>

<style scoped lang="css">
.metric-layout {
  margin-top: 16px;
  gap: 16px;
  background: transparent;
}

.tree-sider {
  background: transparent;
}

.tree-panel {
  padding: 12px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}

.list-content {
  min-width: 0;
}

.header-title {
  font-size: 14px;
  font-weight: 600;
  margin-right: 8px;
}

.header-count {
  color: #666;
}

.search-item {
  margin-bottom: 8px;
}

.search-actions {
  display: flex;
  justify-content: flex-end;
}

.thumb,
.preview-image {
  width: 72px;
  height: 44px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}

.preview-image {
  margin-top: 12px;
  width: 180px;
  height: 110px;
}

.reference-image-field {
  min-height: 40px;
}

.reference-preview-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
