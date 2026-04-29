<template>
  <div class="component-usage-list">
    <a-page-header title="设施部件" sub-title="查看设施设备关联的部件使用情况" />

    <a-card style="margin-top: 16px">
      <div class="search-panel">
        <a-form layout="vertical" :model="searchForm" @submit.prevent>
          <a-row :gutter="[16, 8]">
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="部件名称" class="search-item">
                <a-input v-model:value="searchForm.name" allow-clear placeholder="请输入部件名称" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="部件类型" class="search-item">
                <a-select v-model:value="searchForm.type" allow-clear placeholder="请选择部件类型">
                  <a-select-option v-for="item in componentTypeOptions" :key="item.value" :value="item.value">{{ item.label }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="所属设施" class="search-item">
                <a-input v-model:value="searchForm.deviceName" allow-clear placeholder="请输入设施名称" />
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

      <a-table :columns="columns" :data-source="filteredRows" row-key="id" :pagination="{ pageSize: 10 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">{{ getTypeText(record.type) }}</template>
          <template v-else-if="column.key === 'actions'">
            <a-button type="link" size="small" @click="goToDetectionConfig(record)">检测配置</a-button>
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
import type { InspectedAssetComponent, StandardComponent } from '@/types/inspection'

interface ComponentUsageRow extends InspectedAssetComponent {
  deviceId: string
  componentId: string
  deviceName: string
  deviceNo: string
  pointName: string
  areaName: string
}

const inspectionStore = useInspectionStore()
const router = useRouter()

const searchForm = reactive({
  name: '',
  type: '',
  deviceName: ''
})

const columns = [
  { title: '部件名称', dataIndex: 'name', key: 'name' },
  { title: '部件类型', key: 'type', width: 130 },
  { title: '所属设施', dataIndex: 'deviceName', key: 'deviceName', width: 160 },
  { title: '设备编号', dataIndex: 'deviceNo', key: 'deviceNo', width: 150 },
  { title: '巡检点', dataIndex: 'pointName', key: 'pointName', width: 180 },
  { title: '所属区域', dataIndex: 'areaName', key: 'areaName', width: 150 },
  { title: '操作', key: 'actions', width: 120, fixed: 'right' as const }
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
    const point = inspectionStore.inspectionPoints.find((item) => item.id === device.inspectionPointId)
    return (device.assetComponents || []).map((component) => ({
      ...component,
      id: `${device.id}-${component.id}`,
      deviceId: device.id,
      componentId: component.id,
      deviceName: device.name,
      deviceNo: device.deviceNo || device.code,
      pointName: point?.name || '-',
      areaName: point?.areaName || device.areaName || '-'
    }))
  })
})

const filteredRows = computed(() => {
  const name = searchForm.name.trim().toLowerCase()
  const type = searchForm.type
  const deviceName = searchForm.deviceName.trim().toLowerCase()

  return rows.value.filter((row) => {
    const matchName = !name || row.name.toLowerCase().includes(name)
    const matchType = !type || row.type === type
    const matchDevice = !deviceName || row.deviceName.toLowerCase().includes(deviceName)
    return matchName && matchType && matchDevice
  })
})

function getTypeText(type: string) {
  return componentTypeOptions.find(item => item.value === type)?.label || type
}

function goToDetectionConfig(record: ComponentUsageRow) {
  router.push(`/implementation/device/detection-config/${record.deviceId}/${record.componentId}`)
}

function reset() {
  searchForm.name = ''
  searchForm.type = ''
  searchForm.deviceName = ''
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
