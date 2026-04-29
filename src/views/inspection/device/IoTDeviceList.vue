<template>
  <div class="iot-device-list">
    <a-page-header title="设备管理" sub-title="网关设备、感知设备、终端设备统一管理" />

    <a-card style="margin-top: 16px">
      <div class="quick-switch">
        <a-radio-group v-model:value="quickType" button-style="solid">
          <a-radio-button value="all">全部</a-radio-button>
          <a-radio-button value="gateway">网关</a-radio-button>
          <a-radio-button value="perception">感知设备</a-radio-button>
          <a-radio-button value="terminal">终端设备</a-radio-button>
        </a-radio-group>
      </div>

      <div class="search-panel">
        <a-form layout="vertical" :model="searchForm" @submit.prevent>
          <a-row :gutter="[16, 8]">
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="设备名称" class="search-item">
                <a-input v-model:value="searchForm.name" allow-clear placeholder="请输入设备名称" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="设备编码" class="search-item">
                <a-input v-model:value="searchForm.code" allow-clear placeholder="请输入设备编码" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="设备大类" class="search-item">
                <a-select v-model:value="searchForm.majorType" allow-clear placeholder="请选择设备大类">
                  <a-select-option value="gateway">网关设备</a-select-option>
                  <a-select-option value="perception">感知设备</a-select-option>
                  <a-select-option value="terminal">终端设备</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="设备类型" class="search-item">
                <a-select v-model:value="searchForm.subType" allow-clear placeholder="请选择设备类型">
                  <a-select-option v-for="item in subtypeOptions" :key="item.value" :value="item.value">{{ item.label }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <div class="search-actions">
            <a-space>
              <a-button type="primary">搜索</a-button>
              <a-button @click="resetSearch">重置</a-button>
            </a-space>
          </div>
        </a-form>
      </div>

      <a-table :columns="columns" :data-source="filteredRows" row-key="id" :pagination="{ pageSize: 10 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'majorType'">
            <a-tag :color="record.majorType === 'gateway' ? 'blue' : record.majorType === 'perception' ? 'green' : 'purple'">
              {{ getMajorTypeText(record.majorType) }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 'online' ? 'green' : 'default'">
              {{ record.status === 'online' ? '在线' : '离线' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'updatedAt'">
            {{ formatDate(record.updatedAt) }}
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'

interface IoTDeviceRow {
  id: string
  name: string
  code: string
  majorType: 'gateway' | 'perception' | 'terminal'
  subType: string
  location: string
  linkedArea: string
  status: 'online' | 'offline'
  updatedAt: string
}

const searchForm = reactive({
  name: '',
  code: '',
  majorType: '',
  subType: ''
})
const quickType = ref<'all' | 'gateway' | 'perception' | 'terminal'>('all')

const columns = [
  { title: '设备名称', dataIndex: 'name', key: 'name' },
  { title: '设备编码', dataIndex: 'code', key: 'code', width: 180 },
  { title: '设备大类', key: 'majorType', width: 120 },
  { title: '设备类型', dataIndex: 'subType', key: 'subType', width: 140 },
  { title: '部署位置', dataIndex: 'location', key: 'location', width: 180 },
  { title: '关联区域', dataIndex: 'linkedArea', key: 'linkedArea', width: 150 },
  { title: '状态', key: 'status', width: 100 },
  { title: '更新时间', key: 'updatedAt', width: 180 }
]

const rows: IoTDeviceRow[] = [
  {
    id: 'iot-001',
    name: 'AI 盒子 A1',
    code: 'GW-AI-001',
    majorType: 'gateway',
    subType: 'AI 盒子',
    location: '中控机柜 1-2',
    linkedArea: '反应区',
    status: 'online',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'iot-002',
    name: '边缘网关 E1',
    code: 'GW-EDGE-001',
    majorType: 'gateway',
    subType: '边缘网关',
    location: '配电间北侧',
    linkedArea: '储罐区',
    status: 'online',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'iot-003',
    name: 'LoRa 网关 L1',
    code: 'GW-LORA-001',
    majorType: 'gateway',
    subType: 'LoRa 网关',
    location: '厂房屋顶',
    linkedArea: '管廊区',
    status: 'offline',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'iot-004',
    name: '气体传感器 G1',
    code: 'SN-GAS-001',
    majorType: 'perception',
    subType: '气体传感器',
    location: '反应釜 1 号位',
    linkedArea: '反应区',
    status: 'online',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'iot-005',
    name: '声音传感器 S1',
    code: 'SN-SOUND-001',
    majorType: 'perception',
    subType: '声音传感器',
    location: '泵房东侧',
    linkedArea: '动力区',
    status: 'online',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'iot-006',
    name: '充电桩 C1',
    code: 'TM-CHARGE-001',
    majorType: 'terminal',
    subType: '充电桩',
    location: '机器人充电区',
    linkedArea: '充电房',
    status: 'online',
    updatedAt: new Date().toISOString()
  }
]

const subtypeOptions = [
  { value: 'AI 盒子', label: 'AI 盒子' },
  { value: '边缘网关', label: '边缘网关' },
  { value: 'LoRa 网关', label: 'LoRa 网关' },
  { value: '气体传感器', label: '气体传感器' },
  { value: '声音传感器', label: '声音传感器' },
  { value: '充电桩', label: '充电桩' },
  { value: '终端主机', label: '终端主机' }
]

const filteredRows = computed(() => {
  const name = searchForm.name.trim().toLowerCase()
  const code = searchForm.code.trim().toLowerCase()
  const majorType = searchForm.majorType
  const subType = searchForm.subType

  return rows.filter((row) => {
    const matchName = !name || row.name.toLowerCase().includes(name)
    const matchCode = !code || row.code.toLowerCase().includes(code)
    const quickMatch = quickType.value === 'all' || row.majorType === quickType.value
    const matchMajorType = !majorType || row.majorType === majorType
    const matchSubType = !subType || row.subType === subType
    return quickMatch && matchName && matchCode && matchMajorType && matchSubType
  })
})

function getMajorTypeText(type: IoTDeviceRow['majorType']) {
  if (type === 'gateway') return '网关设备'
  if (type === 'perception') return '感知设备'
  return '终端设备'
}

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('zh-CN', { hour12: false })
}

function resetSearch() {
  searchForm.name = ''
  searchForm.code = ''
  searchForm.majorType = ''
  searchForm.subType = ''
}
</script>

<style scoped lang="css">
.quick-switch {
  margin-bottom: 12px;
}

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
