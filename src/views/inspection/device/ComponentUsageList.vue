<template>
  <div class="component-usage-list">
    <a-page-header title="部件管理" sub-title="独立维护部件，按区域/装置/设施/类型筛选，并通过规则库完成检测规则关联" />

    <a-card style="margin-top: 16px">
      <a-form layout="vertical" @submit.prevent>
        <a-row :gutter="[16, 8]">
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="所属区域"><a-input v-model:value="filters.area" allow-clear placeholder="区域名称" /></a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="所属装置"><a-input v-model:value="filters.installation" allow-clear placeholder="装置名称" /></a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="所属设施"><a-input v-model:value="filters.facility" allow-clear placeholder="设施名称" /></a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="部件类型">
              <a-select v-model:value="filters.componentType" allow-clear placeholder="选择部件类型">
                <a-select-option v-for="item in componentTypeOptions" :key="item.value" :value="item.value">{{ item.label }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>

      <div class="actions-row">
        <a-space>
          <a-button @click="resetFilters">重置</a-button>
          <a-button type="primary" @click="goCreate">新增部件</a-button>
        </a-space>
      </div>

      <a-table :columns="columns" :data-source="filteredRows" row-key="id" :pagination="{ pageSize: 10 }" :scroll="{ x: 1500 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'componentType'">{{ getComponentTypeText(record.componentType) }}</template>
          <template v-else-if="column.key === 'detectionTypes'">{{ getDetectionTypeSummary(record.ruleIds) }}</template>
          <template v-else-if="column.key === 'detectionAlgorithms'">{{ getDetectionAlgorithmSummary(record.ruleIds) }}</template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="record.status === 'active' ? 'green' : record.status === 'maintenance' ? 'gold' : 'default'">{{ getStatusText(record.status) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'ruleCount'">{{ record.ruleIds.length }}</template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="goToDetail(record.id)">详情</a-button>
              <a-button type="link" size="small" @click="goToEdit(record.id)">编辑</a-button>
              <a-button type="link" size="small" danger @click="remove(record.id)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { Modal, message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import { getDetectionItemConfigs } from '@/views/implementation/detection-item-config/model'

const inspectionStore = useInspectionStore()
const router = useRouter()
const ruleLibrary = computed(() => getDetectionItemConfigs())

const componentTypeOptions = [
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

const columns = [
  { title: '部件编号', dataIndex: 'componentNo', key: 'componentNo', width: 140 },
  { title: '部件名称', dataIndex: 'name', key: 'name', width: 150 },
  { title: '部件位号', dataIndex: 'componentPositionNo', key: 'componentPositionNo', width: 130 },
  { title: '部件类型', key: 'componentType', width: 120 },
  { title: '所属区域', dataIndex: 'areaName', key: 'areaName', width: 120 },
  { title: '所属装置', dataIndex: 'installationName', key: 'installationName', width: 130 },
  { title: '所属设施', dataIndex: 'facilityName', key: 'facilityName', width: 150 },
  { title: '检测规则数', key: 'ruleCount', width: 100 },
  { title: '操作', key: 'actions', width: 170, fixed: 'right' as const }
]

const filters = reactive({ area: '', installation: '', facility: '', componentType: '' })

const filteredRows = computed(() => inspectionStore.facilityComponents.filter((row) => {
  const area = filters.area.trim().toLowerCase()
  const installation = filters.installation.trim().toLowerCase()
  const facility = filters.facility.trim().toLowerCase()
  const byArea = !area || row.areaName.toLowerCase().includes(area)
  const byInstallation = !installation || row.installationName.toLowerCase().includes(installation)
  const byFacility = !facility || row.facilityName.toLowerCase().includes(facility)
  const byType = !filters.componentType || row.componentType === filters.componentType
  return byArea && byInstallation && byFacility && byType
}))

function getRules(ruleIds: string[]) {
  return ruleIds.map((id) => ruleLibrary.value.find((item) => item.id === id)).filter(Boolean)
}

function getDetectionTypeSummary(ruleIds: string[]) {
  const text = Array.from(new Set(getRules(ruleIds).map((item: any) => item.detectionType))).join('、')
  return text || '-'
}

function getDetectionAlgorithmSummary(ruleIds: string[]) {
  const text = Array.from(new Set(getRules(ruleIds).map((item: any) => item.detectionAlgorithm))).join('、')
  return text || '-'
}

function resetFilters() {
  filters.area = ''
  filters.installation = ''
  filters.facility = ''
  filters.componentType = ''
}

function goCreate() {
  router.push('/implementation/device/component-usage/form')
}

function goToEdit(componentId: string) {
  router.push(`/implementation/device/component-usage/form/${componentId}`)
}

function remove(id: string) {
  Modal.confirm({
    title: '确认删除该部件？',
    okText: '确认',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk() {
      inspectionStore.deleteFacilityComponent(id)
      message.success('部件已删除')
    }
  })
}

function goToDetail(componentId: string) {
  router.push(`/implementation/device/component-usage/detail/${componentId}`)
}

function getComponentTypeText(type: string) {
  return componentTypeOptions.find((item) => item.value === type)?.label || type
}

function getStatusText(status: string) {
  if (status === 'maintenance') return '维护中'
  if (status === 'inactive') return '停用'
  return '在用'
}

onMounted(() => inspectionStore.initialize())
</script>

<style scoped>
.actions-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}
</style>
