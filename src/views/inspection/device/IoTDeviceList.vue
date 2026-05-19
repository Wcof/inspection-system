<template>
  <div class="iot-device-list">
    <a-page-header title="网络设备管理" sub-title="统一管理网关设备" />

    <a-card style="margin-top: 16px">
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
          <template v-if="column.key === 'status'">
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
import { computed, reactive } from 'vue'

interface IoTDeviceRow {
  id: string
  name: string
  code: string
  majorType: 'gateway'
  subType: string
  location: string
  linkedArea: string
  status: 'online' | 'offline'
  updatedAt: string
}

const searchForm = reactive({
  name: '',
  code: '',
  subType: ''
})

const columns = [
  { title: '设备名称', dataIndex: 'name', key: 'name' },
  { title: '设备编码', dataIndex: 'code', key: 'code', width: 180 },
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
  }
]

const subtypeOptions = [
  { value: 'AI 盒子', label: 'AI 盒子' },
  { value: '边缘网关', label: '边缘网关' },
  { value: 'LoRa 网关', label: 'LoRa 网关' }
]

const filteredRows = computed(() => {
  const name = searchForm.name.trim().toLowerCase()
  const code = searchForm.code.trim().toLowerCase()
  const subType = searchForm.subType

  return rows.filter((row) => {
    const matchName = !name || row.name.toLowerCase().includes(name)
    const matchCode = !code || row.code.toLowerCase().includes(code)
    const matchSubType = !subType || row.subType === subType
    return matchName && matchCode && matchSubType
  })
})

function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('zh-CN', { hour12: false })
}

function resetSearch() {
  searchForm.name = ''
  searchForm.code = ''
  searchForm.subType = ''
}
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
