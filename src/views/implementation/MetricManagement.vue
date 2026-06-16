<template>
  <div class="metric-management">
    <a-page-header title="检测对象" sub-title="支持检测类型、优先级、关联层级与阈值管理">
      <template #extra><a-button type="primary" @click="openCreateModal">新增</a-button></template>
    </a-page-header>

    <a-layout class="metric-layout">
      <a-layout-sider width="300" class="tree-sider">
        <div class="tree-panel">
          <a-input v-model:value="treeSearchValue" placeholder="搜索区域/装置/设施设备" allow-clear style="margin-bottom: 12px" />
          <a-tree v-model:selectedKeys="selectedTreeKeys" :tree-data="filteredTreeData" default-expand-all />
        </div>
      </a-layout-sider>

      <a-layout-content class="list-content">
        <a-card size="small" style="margin-bottom: 12px">
          <span class="header-title">检测规则列表</span>
          <a-tag v-if="selectedPathLabel" color="blue">{{ selectedPathLabel }}</a-tag>
          <span class="header-count">共 {{ filteredItems.length }} 项</span>
        </a-card>

        <a-card size="small" style="margin-bottom: 12px">
          <a-form layout="vertical" :model="searchForm" @submit.prevent>
            <a-row :gutter="[12, 8]">
              <a-col :xs="24" :sm="12" :md="8" :lg="6">
                <a-form-item label="检测对象名称" class="search-item">
                  <a-input v-model:value="searchForm.objectName" allow-clear placeholder="请输入检测对象名称" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="8" :lg="6">
                <a-form-item label="检测规则" class="search-item">
                  <a-input v-model:value="searchForm.name" allow-clear placeholder="请输入检测规则名称" />
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="8" :lg="6">
                <a-form-item label="检测区域" class="search-item">
                  <a-select v-model:value="searchForm.areaId" allow-clear placeholder="请选择检测区域">
                    <a-select-option v-for="area in areas" :key="area.id" :value="area.id">{{ area.name }}</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="8" :lg="6">
                <a-form-item label="检测装置" class="search-item">
                  <a-select v-model:value="searchForm.installationId" allow-clear placeholder="请选择检测装置">
                    <a-select-option v-for="inst in installationsByArea" :key="inst.id" :value="inst.id">{{ inst.name }}</a-select-option>
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

        <a-table :columns="columns" :data-source="filteredItems" row-key="id" :scroll="{ x: 1420 }">
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'index'">{{ index + 1 }}</template>
            <template v-else-if="column.key === 'objectName'">{{ getDeviceName(record.deviceId) }}</template>
            <template v-else-if="column.key === 'detectionType'">
              <a-tag :color="record.detectionType === 'gas' ? 'red' : record.detectionType === 'liquid' ? 'blue' : 'gold'">
                {{ detectionTypeText(record.detectionType) }}
              </a-tag>
            </template>
            <template v-else-if="column.key === 'region'">{{ getAreaName(record.deviceId) }}</template>
            <template v-else-if="column.key === 'installation'">{{ getInstallationName(record.deviceId) }}</template>
            <template v-else-if="column.key === 'device'">{{ getDeviceName(record.deviceId) }}</template>
            <template v-else-if="column.key === 'priority'">
              <a-tag :color="priorityColor(record.priorityLevel || inferPriority(record))">{{ priorityText(record.priorityLevel || inferPriority(record)) }}</a-tag>
            </template>
            <template v-else-if="column.key === 'cycle'">{{ getCycleText(record) }}</template>
            <template v-else-if="column.key === 'window'">{{ getWindowText(record) }}</template>
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

    <a-modal v-model:open="editVisible" :title="editMode === 'create' ? '新建检测对象' : '编辑检测对象'" width="760px">
      <a-form layout="vertical">
        <a-row :gutter="12">
          <a-col :span="8">
            <a-form-item label="关联检测区域" required>
              <a-select v-model:value="editForm.areaId" placeholder="请选择检测区域" @change="onAreaChange">
                <a-select-option v-for="area in areas" :key="area.id" :value="area.id">{{ area.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="关联检测装置" required>
              <a-select v-model:value="editForm.installationId" placeholder="请选择装置" @change="onInstallationChange">
                <a-select-option v-for="inst in selectableInstallations" :key="inst.id" :value="inst.id">{{ inst.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="关联检测设施设备" required>
              <a-select v-model:value="editForm.deviceId" placeholder="请选择设施设备">
                <a-select-option v-for="device in selectableDevices" :key="device.id" :value="device.id">{{ device.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="12">
          <a-col :span="8"><a-form-item label="检测规则名称" required><a-input v-model:value="editForm.name" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="检测规则编码" required><a-input v-model:value="editForm.code" /></a-form-item></a-col>
          <a-col :span="8">
            <a-form-item label="检测类型" required>
              <a-select v-model:value="editForm.detectionType" @change="onDetectionTypeChange">
                <a-select-option v-for="t in detectionTypeOptions" :key="t" :value="t">{{ t }}</a-select-option>
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
          <a-col :span="8">
            <a-form-item label="检测规则">
              <a-select v-model:value="editForm.ruleIds" mode="multiple" placeholder="请选择检测规则" :options="filteredDetectionRuleOptions" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
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
import { getDetectionItemConfigs, detectionTypeOptions } from './detection-item-config/model'
import type { DetectionType } from './detection-item-config/model'

const inspectionStore = useInspectionStore()
const router = useRouter()
const treeSearchValue = ref('')
const selectedTreeKeys = ref<string[]>(['all'])
const editVisible = ref(false)
const editMode = ref<'create' | 'edit'>('create')
const editingId = ref('')

const searchForm = reactive({
  objectName: '',
  name: '',
  areaId: '',
  installationId: '',
  deviceId: '',
  priority: ''
})

const editForm = reactive<any>({
  areaId: '',
  installationId: '',
  deviceId: '',
  name: '',
  code: '',
  detectionType: '图像识别' as DetectionType,
  priorityLevel: 'medium',
  cycleValue: 1,
  cycleUnit: 'day',
  windowText: '08:00 - 18:00',
  ruleIds: [],
  referenceImageUrl: ''
})

const detectionRuleOptions = computed(() =>
  getDetectionItemConfigs().map((item) => ({ value: item.id, label: item.name }))
)

const filteredDetectionRuleOptions = computed(() => {
  if (!editForm.detectionType) return detectionRuleOptions.value
  return getDetectionItemConfigs()
    .filter((item) => item.detectionType === editForm.detectionType)
    .map((item) => ({ value: item.id, label: item.name }))
})

const areas = computed(() => {
  const map = new Map<string, { id: string; name: string }>()
  inspectionStore.installations.forEach((inst: any) => {
    if (inst.areaId && !map.has(inst.areaId)) {
      map.set(inst.areaId, { id: inst.areaId, name: inst.areaName || inst.areaId })
    }
  })
  // fallback: 从巡检点提取区域
  if (map.size === 0) {
    inspectionStore.inspectionPoints.forEach((point: any) => {
      if (point.areaId && !map.has(point.areaId)) {
        map.set(point.areaId, { id: point.areaId, name: point.areaName || point.areaId })
      }
    })
  }
  return Array.from(map.values())
})

const treeData = computed(() => [{
  title: '全部',
  key: 'all',
  children: areas.value.map((area) => ({
    title: area.name,
    key: `area:${area.id}`,
    children: inspectionStore.installations
      .filter((inst: any) => inst.areaId === area.id)
      .map((inst: any) => ({
        title: inst.name,
        key: `installation:${inst.id}`,
        children: inspectionStore.inspectionDevices
          .filter((device: any) => device.installationId === inst.id)
          .map((device: any) => ({
            title: device.name,
            key: `device:${device.id}`,
            children: (device.assetComponents || []).map((comp: any) => ({
              title: comp.name,
              key: `component:${device.id}:${comp.id}`
            }))
          }))
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
  const parts = key.split(':')
  const type = parts[0]
  if (type === 'area') return areas.value.find(item => item.id === parts[1])?.name || key
  if (type === 'installation') return inspectionStore.installations.find((item: any) => item.id === parts[1])?.name || key
  if (type === 'device') return inspectionStore.inspectionDevices.find((item: any) => item.id === parts[1])?.name || key
  if (type === 'component') {
    const device = inspectionStore.inspectionDevices.find((item: any) => item.id === parts[1]) as any
    const comp = device?.assetComponents?.find((c: any) => c.id === parts[2])
    return comp?.name || key
  }
  return key
}

const selectedPathLabel = computed(() => resolveTreeLabel(selectedTreeKey.value))
const installationsByArea = computed(() => inspectionStore.installations.filter((inst: any) => !searchForm.areaId || inst.areaId === searchForm.areaId))
const selectableInstallations = computed(() => inspectionStore.installations.filter((inst: any) => !editForm.areaId || inst.areaId === editForm.areaId))
const selectableDevices = computed(() => inspectionStore.inspectionDevices.filter((device: any) => !editForm.installationId || device.installationId === editForm.installationId))

const columns = [
  { title: '序号', key: 'index', width: 70 },
  { title: '检测对象名称', key: 'objectName', width: 160 },
  { title: '检测规则', dataIndex: 'name', key: 'name', width: 180 },
  { title: '检测类型', key: 'detectionType', width: 110 },
  { title: '检测区域', key: 'region', width: 120 },
  { title: '检测装置', key: 'installation', width: 140 },
  { title: '检测设施设备', key: 'device', width: 140 },
  { title: '优先级', key: 'priority', width: 100 },
  { title: '巡检周期', key: 'cycle', width: 120 },
  { title: '巡检窗口', key: 'window', width: 160 },
  { title: '参考图', key: 'reference', width: 110 },
  { title: '操作', key: 'actions', width: 120 }
]

function inferDetectionType(name: string): DetectionType {
  if (name.includes('气') || name.includes('氧') || name.includes('硫化氢') || name.includes('一氧化碳')) return '气体检测'
  if (name.includes('液') || name.includes('液位')) return '环境监测'
  if (name.includes('热') || name.includes('温度')) return '热成像'
  if (name.includes('行为') || name.includes('安全帽')) return '安全行为'
  if (name.includes('状态') || name.includes('开关')) return '设备状态'
  return '图像识别'
}

function detectionTypeText(type: string) {
  return type || '-'
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
      const key = selectedTreeKey.value
      if (key === 'all') return true

      const device = inspectionStore.inspectionDevices.find((d: any) => d.id === item.deviceId) as any

      if (key.startsWith('device:')) return item.deviceId === key.replace('device:', '')

      if (key.startsWith('installation:')) {
        const instId = key.replace('installation:', '')
        return device?.installationId === instId
      }

      if (key.startsWith('area:')) {
        const areaId = key.replace('area:', '')
        // 通过装置→区域链路过滤
        const inst = inspectionStore.installations.find((i: any) => i.id === device?.installationId) as any
        return inst?.areaId === areaId
      }

      if (key.startsWith('component:')) {
        const [, deviceId, compId] = key.split(':')
        return item.deviceId === deviceId && (item as any).subjectId === compId
      }

      return true
    })

  return base.filter((item: any) => {
    const device = getDevice(item.deviceId)
    const inst = device?.installationId ? inspectionStore.installations.find((i: any) => i.id === device.installationId) as any : null

    const matchObjectName = !searchForm.objectName || (device?.name || '').toLowerCase().includes(searchForm.objectName.trim().toLowerCase())
    const matchName = !searchForm.name || item.name.toLowerCase().includes(searchForm.name.trim().toLowerCase())
    const matchArea = !searchForm.areaId || inst?.areaId === searchForm.areaId
    const matchInstallation = !searchForm.installationId || device?.installationId === searchForm.installationId
    const matchDevice = !searchForm.deviceId || item.deviceId === searchForm.deviceId
    const matchPriority = !searchForm.priority || item.priorityLevel === searchForm.priority

    return matchObjectName && matchName && matchArea && matchInstallation && matchDevice && matchPriority
  })
})

function getDevice(deviceId: string) {
  return inspectionStore.inspectionDevices.find((d: any) => d.id === deviceId) as any
}

function getDeviceName(deviceId: string) {
  return getDevice(deviceId)?.name || '-'
}

function getInstallationName(deviceId: string) {
  const device = getDevice(deviceId)
  if (!device?.installationId) return '-'
  return inspectionStore.installations.find((inst: any) => inst.id === device.installationId)?.name || '-'
}

function getAreaName(deviceId: string) {
  const device = getDevice(deviceId)
  if (!device?.installationId) return '-'
  const inst = inspectionStore.installations.find((i: any) => i.id === device.installationId) as any
  return inst?.areaName || '-'
}

function getCycleText(record: any) {
  return record.inspectionFrequency
    ? `${record.inspectionFrequency.value}${record.inspectionFrequency.unit === 'day' ? '天' : record.inspectionFrequency.unit === 'week' ? '周' : '小时'}`
    : '-'
}

function getWindowText(record: any) {
  return record.executionWindow ? `${record.executionWindow.startTime} - ${record.executionWindow.endTime}` : '-'
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
  searchForm.objectName = ''
  searchForm.name = ''
  searchForm.areaId = ''
  searchForm.installationId = ''
  searchForm.deviceId = ''
  searchForm.priority = ''
}

function resetForm() {
  editForm.areaId = ''
  editForm.installationId = ''
  editForm.deviceId = ''
  editForm.name = ''
  editForm.code = ''
  editForm.detectionType = 'gas'
  editForm.priorityLevel = 'medium'
  editForm.cycleValue = 1
  editForm.cycleUnit = 'day'
  editForm.windowText = '08:00 - 18:00'
  editForm.ruleIds = []
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
  const key = selectedTreeKey.value
  if (key.startsWith('area:')) {
    editForm.areaId = key.replace('area:', '')
  }
  if (key.startsWith('installation:')) {
    const instId = key.replace('installation:', '')
    const inst = inspectionStore.installations.find((item: any) => item.id === instId) as any
    editForm.installationId = instId
    editForm.areaId = inst?.areaId || ''
  }
  if (key.startsWith('device:')) {
    const deviceId = key.replace('device:', '')
    const device = getDevice(deviceId)
    const inst = inspectionStore.installations.find((item: any) => item.id === device?.installationId) as any
    editForm.deviceId = deviceId
    editForm.installationId = device?.installationId || ''
    editForm.areaId = inst?.areaId || ''
  }
  if (key.startsWith('component:')) {
    const [, deviceId] = key.split(':')
    const device = getDevice(deviceId)
    const inst = inspectionStore.installations.find((item: any) => item.id === device?.installationId) as any
    editForm.deviceId = deviceId
    editForm.installationId = device?.installationId || ''
    editForm.areaId = inst?.areaId || ''
  }
}

function openEditModal(record: any) {
  editMode.value = 'edit'
  editingId.value = record.id
  const device = getDevice(record.deviceId)
  const inst = device?.installationId ? inspectionStore.installations.find((i: any) => i.id === device.installationId) as any : null
  editForm.areaId = inst?.areaId || ''
  editForm.installationId = device?.installationId || ''
  editForm.deviceId = record.deviceId
  editForm.name = record.name
  editForm.code = record.code
  editForm.detectionType = record.detectionType || inferDetectionType(record.name)
  editForm.priorityLevel = record.priorityLevel || inferPriority(record)
  editForm.cycleValue = record.inspectionFrequency?.value || 1
  editForm.cycleUnit = record.inspectionFrequency?.unit || 'day'
  editForm.windowText = record.executionWindow ? `${record.executionWindow.startTime} - ${record.executionWindow.endTime}` : '08:00 - 18:00'
  editForm.ruleIds = record.ruleIds ? [...record.ruleIds] : []
  editForm.referenceImageUrl = record.referenceImageUrl || record.visionMapping?.customImageUrl || ''
  editVisible.value = true
}


function onDetectionTypeChange(_value: DetectionType) {
  // 检测类型变更时清空已选规则
  editForm.ruleIds = []
}

function onAreaChange() {
  editForm.installationId = ''
  editForm.deviceId = ''
}

function onInstallationChange() {
  editForm.deviceId = ''
}

function saveCurrentEdit(): boolean {
  if (!editForm.areaId || !editForm.installationId || !editForm.deviceId || !editForm.name || !editForm.code) {
    message.error('请完整填写检测区域、检测装置、检测设施设备、名称和编码')
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
    ruleIds: editForm.ruleIds || [],
    unit: '-',
    threshold: {},
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
  message.success('检测对象已保存')
}

function handleSaveAndGoCockpit() {
  const saved = saveCurrentEdit()
  if (!saved) return
  editVisible.value = false
  message.success('检测对象已保存，正在前往驾驶舱')
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
    title: '确认删除检测规则？',
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
