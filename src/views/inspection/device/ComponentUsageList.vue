<template>
  <div class="component-usage-list">
    <a-page-header title="设施部件/连接" sub-title="查看设施下部件、连接部位与停车点、检测规则关联情况" />

    <a-card style="margin-top: 16px">
      <div class="search-panel">
        <a-form layout="vertical" :model="searchForm" @submit.prevent>
          <a-row :gutter="[16, 8]">
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="所属区域" class="search-item">
                <a-input v-model:value="searchForm.areaName" allow-clear placeholder="请输入区域名称" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="所属设施" class="search-item">
                <a-input v-model:value="searchForm.deviceName" allow-clear placeholder="请输入设施名称" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="名称" class="search-item">
                <a-input v-model:value="searchForm.name" allow-clear placeholder="请输入部件或连接名称" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="类型" class="search-item">
                <a-select v-model:value="searchForm.objectType" allow-clear placeholder="请选择类型">
                  <a-select-option value="component">部件</a-select-option>
                  <a-select-option value="connection">连接</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="细分类型" class="search-item">
                <a-select v-model:value="searchForm.type" allow-clear placeholder="请选择细分类型">
                  <a-select-option v-for="item in componentTypeOptions" :key="item.value" :value="item.value">{{ item.label }}</a-select-option>
                  <a-select-option value="connection">连接</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <div class="search-actions">
            <a-space>
              <a-button type="primary">搜索</a-button>
              <a-button @click="reset">重置</a-button>
            </a-space>
          </div>
        </a-form>
      </div>

      <a-table :columns="columns" :data-source="filteredRows" row-key="id" :pagination="{ pageSize: 10 }" :scroll="{ x: 1600 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'objectType'">
            <a-tag :color="record.objectType === 'component' ? 'blue' : 'purple'">{{ record.objectType === 'component' ? '部件' : '连接' }}</a-tag>
          </template>
          <template v-else-if="column.key === 'type'">{{ getTypeText(record.type, record.objectType) }}</template>
          <template v-else-if="column.key === 'priority'">
            <a-tag :color="getPriorityColor(record.priorityLevel)">{{ record.priority }}</a-tag>
          </template>
          <template v-else-if="column.key === 'parkingCount'">{{ record.parkingCount }}</template>
          <template v-else-if="column.key === 'ruleCount'">{{ record.ruleCount }}</template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="goToDetail(record)">详情</a-button>
              <a-button type="link" size="small" @click="goToEdit(record)">编辑</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import type { ConnectionObject, InspectedAssetComponent, StandardComponent } from '@/types/inspection'

interface ComponentUsageRow {
  id: string
  deviceId: string
  objectId: string
  objectType: 'component' | 'connection'
  name: string
  type: string
  deviceName: string
  deviceNo: string
  areaName: string
  priority: string
  priorityLevel: string
  inspectionCycle: string
  inspectionWindow: string
  parkingCount: number
  ruleCount: number
}

const inspectionStore = useInspectionStore()
const router = useRouter()

const searchForm = reactive({
  areaName: '',
  deviceName: '',
  name: '',
  objectType: '',
  type: '',
})

const columns = [
  { title: '设施编号', dataIndex: 'deviceNo', key: 'deviceNo', width: 150 },
  { title: '所属区域', dataIndex: 'areaName', key: 'areaName', width: 150 },
  { title: '所属设施', dataIndex: 'deviceName', key: 'deviceName', width: 160 },
  { title: '名称', dataIndex: 'name', key: 'name', width: 170 },
  { title: '类型', key: 'objectType', width: 90 },
  { title: '细分类型', key: 'type', width: 110 },
  { title: '优先级', key: 'priority', width: 150 },
  { title: '巡检周期', dataIndex: 'inspectionCycle', key: 'inspectionCycle', width: 180 },
  { title: '巡检窗口', dataIndex: 'inspectionWindow', key: 'inspectionWindow', width: 180 },
  { title: '关联点位', key: 'parkingCount', width: 110 },
  { title: '检测规则数量', key: 'ruleCount', width: 130 },
  { title: '操作', key: 'actions', width: 140, fixed: 'right' as const }
]

const componentTypeOptions: Array<{ value: StandardComponent['type'] | 'other'; label: string }> = [
  { value: 'valve', label: '阀门' },
  { value: 'meter', label: '压力表' },
  { value: 'temperature_gauge', label: '温度表' },
  { value: 'flange', label: '法兰' },
  { value: 'pipe', label: '管体' },
  { value: 'motor', label: '电机' },
  { value: 'cable', label: '电缆' },
  { value: 'joint', label: '接头' },
  { value: 'sensor', label: '传感器' },
  { value: 'screw', label: '螺杆' },
  { value: 'other', label: '其他' }
]

const rows = computed<ComponentUsageRow[]>(() => {
  return inspectionStore.inspectionDevices.flatMap((device) => {
    const components = (device.assetComponents || []).map((component: InspectedAssetComponent) => ({
      id: `${device.id}-${component.id}`,
      deviceId: device.id,
      objectId: component.id,
      objectType: 'component' as const,
      name: component.name,
      type: component.type,
      deviceName: device.name,
      deviceNo: device.deviceNo || device.code,
      areaName: device.areaName || '-',
      priority: getEffectivePriorityText(component.priority, (device as any).priority),
      priorityLevel: component.priority || (device as any).priority || 'medium',
      inspectionCycle: getEffectiveCycleText(component.inspectionCycle, device.inspectionCycle),
      inspectionWindow: getEffectiveWindowText(component.inspectionWindow, device.inspectionWindow),
      parkingCount: getParkingCount(device, `component:${component.id}`),
      ruleCount: new Set(component.ruleIds || []).size
    }))
    const connections = (device.connectionObjects || []).map((connection: ConnectionObject) => ({
      id: `${device.id}-${connection.id}`,
      deviceId: device.id,
      objectId: connection.id,
      objectType: 'connection' as const,
      name: connection.name,
      type: 'connection',
      deviceName: device.name,
      deviceNo: device.deviceNo || device.code,
      areaName: device.areaName || '-',
      priority: getEffectivePriorityText(connection.priority, (device as any).priority),
      priorityLevel: connection.priority || (device as any).priority || 'medium',
      inspectionCycle: getEffectiveCycleText(connection.inspectionCycle, device.inspectionCycle),
      inspectionWindow: getEffectiveWindowText(connection.inspectionWindow, device.inspectionWindow),
      parkingCount: getParkingCount(device, `connection:${connection.id}`),
      ruleCount: new Set(connection.ruleIds || []).size
    }))
    return [...components, ...connections]
  })
})

const filteredRows = computed(() => {
  const name = searchForm.name.trim().toLowerCase()
  const areaName = searchForm.areaName.trim().toLowerCase()
  const deviceName = searchForm.deviceName.trim().toLowerCase()
  const objectType = searchForm.objectType
  const type = searchForm.type

  return rows.value.filter((row) => {
    const matchArea = !areaName || row.areaName.toLowerCase().includes(areaName)
    const matchDevice = !deviceName || row.deviceName.toLowerCase().includes(deviceName)
    const matchName = !name || row.name.toLowerCase().includes(name)
    const matchObjectType = !objectType || row.objectType === objectType
    const matchType = !type || row.type === type
    return matchArea && matchDevice && matchName && matchObjectType && matchType
  })
})

function getParkingCount(device: any, targetRef: string) {
  const ids = new Set<string>()
  ;(device.parkingPointBindings || []).forEach((binding: any) => {
    if ((binding.targetObjectRefs || []).includes(targetRef)) {
      ;(binding.parkingPointIds || [binding.parkingPointId].filter(Boolean)).forEach((parkingId: string) => ids.add(parkingId))
    }
  })
  return ids.size
}

function getTypeText(type: string, objectType: ComponentUsageRow['objectType']) {
  if (objectType === 'connection') return '连接'
  return componentTypeOptions.find(item => item.value === type)?.label || type
}

function getEffectivePriorityText(objectPriority?: string, devicePriority?: string) {
  const value = objectPriority || devicePriority || 'medium'
  const label = ({ high: '高', medium: '中', low: '低' } as Record<string, string>)[value] || value
  return `${label}（${objectPriority ? '自定义' : devicePriority ? '继承设施' : '默认'}）`
}

function getEffectiveCycleText(objectCycle?: string, deviceCycle?: string) {
  const value = objectCycle || deviceCycle || '每日 1 次'
  return `${normalizeCycleText(value)}（${objectCycle ? '自定义' : deviceCycle ? '继承设施' : '默认'}）`
}

function getEffectiveWindowText(objectWindow?: string, deviceWindow?: string) {
  const value = objectWindow || deviceWindow || '08:00-18:00'
  return `${value}（${objectWindow ? '自定义' : deviceWindow ? '继承设施' : '默认'}）`
}

function normalizeCycleText(value: string) {
  if (value === '每日') return '每日 1 次'
  if (value === '每周') return '每周 1 次'
  return value
}

function getPriorityColor(priority: string) {
  if (priority === 'high') return 'red'
  if (priority === 'low') return 'default'
  return 'orange'
}

function goToDetail(record: ComponentUsageRow) {
  router.push(`/implementation/device/component-usage/detail/${record.deviceId}/${record.objectType}/${record.objectId}`)
}

function goToEdit(record: ComponentUsageRow) {
  router.push(`/implementation/device/form/${record.deviceId}`)
}

function reset() {
  searchForm.areaName = ''
  searchForm.deviceName = ''
  searchForm.name = ''
  searchForm.objectType = ''
  searchForm.type = ''
}

onMounted(() => inspectionStore.initialize())
</script>

<style scoped lang="css">
.search-panel {
  margin-bottom: 12px;
  padding: 12px 12px 4px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}

.search-item {
  margin-bottom: 8px;
}

.search-actions {
  display: flex;
  justify-content: flex-end;
  margin: 4px 0 8px;
}
</style>
