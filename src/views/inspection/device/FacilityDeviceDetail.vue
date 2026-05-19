<template>
  <div class="facility-device-detail">
    <a-page-header title="设施详情" @back="goBack" />

    <a-card v-if="device" style="margin-top: 16px">
      <a-row :gutter="[16, 16]">
        <a-col :span="24">
          <a-card title="基础信息" size="small">
            <a-descriptions :column="3" bordered size="small">
              <a-descriptions-item v-for="item in basicInfoItems" :key="item.label" :label="item.label">
                {{ item.value }}
              </a-descriptions-item>
            </a-descriptions>
          </a-card>
        </a-col>

        <a-col :span="24">
          <a-card title="关联部件" size="small">
            <a-table :columns="componentColumns" :data-source="componentRows" row-key="id" :pagination="false" />
          </a-card>
        </a-col>

        <a-col :span="24">
          <a-card title="巡检信息" size="small">
            <a-table :columns="bindingColumns" :data-source="bindingRows" row-key="id" :pagination="false" />
          </a-card>
        </a-col>
      </a-row>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import { getDetectionItemConfigs } from '@/views/implementation/detection-item-config/model'

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()

const device = computed(() => inspectionStore.inspectionDevices.find((item) => item.id === String(route.params.id)))

const componentRows = computed(() => inspectionStore.facilityComponents
  .filter((item) => item.facilityId === device.value?.id)
  .map((item) => ({
    ...item,
    ruleSummary: (item.ruleIds || []).map((ruleId) => getDetectionItemConfigs().find((rule) => rule.id === ruleId)?.name || ruleId).join('、') || '-'
  })))

const bindingRows = computed(() => (device.value?.parkingPointBindings || [])
  .slice()
  .sort((a, b) => (a.executionOrder || a.sequence || 0) - (b.executionOrder || b.sequence || 0))
  .map((binding, index) => ({
    ...binding,
    executionOrder: binding.executionOrder || binding.sequence || index + 1,
    inspectionModeText: binding.inspectionMode === 'area' ? '区域巡检' : '固定巡检',
    parkingPointDisplay: (binding.parkingPointNames && binding.parkingPointNames.length ? binding.parkingPointNames : [binding.parkingPointName].filter(Boolean)).join('、'),
    componentDisplay: (binding.componentIds || []).map((componentId) => componentRows.value.find((item) => item.id === componentId)?.name || componentId).join('、') || '-'
  })))

const basicInfoItems = computed(() => {
  const current = device.value
  if (!current) return []
  return [
    { label: '设施名称', value: current.name || '-' },
    { label: '设施分类', value: current.deviceClassification || '-' },
    { label: '设施编号', value: current.deviceNo || '-' },
    { label: '设施位号', value: current.facilityPositionNo || '-' },
    { label: '所在区域', value: current.areaName || '-' },
    { label: '所属装置', value: current.installationName || '-' },
    { label: '设施类别', value: current.facilityKind === 'pipeline' ? '管路类设施' : '普通设施' },
    { label: '设备状态', value: statusText.value },
    { label: '备注', value: current.storageLocation || '-' }
  ]
})

const statusText = computed(() => {
  const status = device.value?.status
  if (status === 'inactive') return '停用'
  if (status === 'maintenance') return '维护中'
  if (status === 'scrapped') return '报废'
  return '在用'
})

const componentColumns = [
  { title: '部件名称', dataIndex: 'name', key: 'name' },
  { title: '部件编号', dataIndex: 'componentNo', key: 'componentNo', width: 140 },
  { title: '部件位号', dataIndex: 'componentPositionNo', key: 'componentPositionNo', width: 140 },
  { title: '关联规则', dataIndex: 'ruleSummary', key: 'ruleSummary' }
]

const bindingColumns = [
  { title: '执行顺序', dataIndex: 'executionOrder', key: 'executionOrder', width: 100 },
  { title: '巡检点', dataIndex: 'inspectionPointName', key: 'inspectionPointName', width: 180 },
  { title: '停车点', dataIndex: 'parkingPointDisplay', key: 'parkingPointDisplay', width: 220 },
  { title: '巡检模式', dataIndex: 'inspectionModeText', key: 'inspectionModeText', width: 120 },
  { title: '关联部件', dataIndex: 'componentDisplay', key: 'componentDisplay' }
]

function goBack() {
  router.push('/implementation/device/list')
}

onMounted(() => {
  inspectionStore.initialize()
})
</script>
