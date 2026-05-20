<template>
  <div class="facility-device-detail">
    <a-page-header title="设施详情" @back="goBack" />

    <template v-if="device">
      <a-row :gutter="[16, 16]" style="margin-top: 16px">
        <a-col :xs="24" :lg="8">
          <a-card title="设施照片" size="small">
            <div class="facility-photo-viewer">
              <img v-if="device.referenceImageUrl" :src="device.referenceImageUrl" alt="设施照片" />
              <span v-else>暂无设施照片</span>
            </div>
          </a-card>
        </a-col>

        <a-col :xs="24" :lg="16">
          <a-card title="基础信息" size="small">
            <a-descriptions :column="2" bordered size="small">
              <a-descriptions-item v-for="item in basicInfoItems" :key="item.label" :label="item.label">
                {{ item.value }}
              </a-descriptions-item>
            </a-descriptions>
          </a-card>
        </a-col>

        <a-col :span="24">
          <a-card title="部件与点位配置" size="small">
            <a-table :columns="componentPointColumns" :data-source="componentPointRows" row-key="id" :pagination="false" />
          </a-card>
        </a-col>
      </a-row>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import { getDetectionItemConfigs } from '@/views/implementation/detection-item-config/model'

interface FacilityComponentOption {
  id: string
  name: string
  componentNo?: string
  componentPositionNo?: string
  installationName?: string
  ruleIds: string[]
}

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()

const device = computed(() => inspectionStore.inspectionDevices.find((item) => item.id === String(route.params.id)))

const componentRows = computed(() => {
  const linked = inspectionStore.facilityComponents.filter((item) => item.facilityId === device.value?.id)
  const rows: FacilityComponentOption[] = linked.length
    ? linked
    : (device.value?.assetComponents || []).map((item) => ({
        id: item.id,
        name: item.name,
        componentNo: item.id,
        componentPositionNo: item.subTypeName || '-',
        installationName: device.value?.installationName || '-',
        ruleIds: [...(item.ruleIds || [])]
      }))

  return rows.map((item) => ({
    ...item,
    ruleSummary: (item.ruleIds || []).map((ruleId) => getDetectionItemConfigs().find((rule) => rule.id === ruleId)?.name || ruleId).join('、') || '-'
  }))
})

const bindingRows = computed(() => (device.value?.parkingPointBindings || [])
  .slice()
  .sort((a, b) => (a.executionOrder || a.sequence || 0) - (b.executionOrder || b.sequence || 0))
  .map((binding, index) => ({
    ...binding,
    executionOrder: binding.executionOrder || binding.sequence || index + 1,
    inspectionModeText: binding.inspectionMode === 'area' ? '区域巡检' : '固定巡检',
    parkingPointDisplay: (binding.parkingPointNames && binding.parkingPointNames.length ? binding.parkingPointNames : [binding.parkingPointName].filter(Boolean)).join('、'),
    componentDisplay: (binding.componentIds || []).map((componentId) => componentRows.value.find((item) => item.id === componentId)?.name || componentId).join('、') || '-',
    ruleDisplay: getBindingRuleNames(binding.componentIds || [])
  })))

const componentPointRows = computed(() => {
  const rows: Array<Record<string, string | number>> = []
  const boundComponentIds = new Set<string>()

  bindingRows.value.forEach((binding) => {
    const ids = binding.componentIds?.length ? binding.componentIds : ['']
    ids.forEach((componentId) => {
      const component = componentRows.value.find((item) => item.id === componentId)
      if (componentId) boundComponentIds.add(componentId)
      rows.push({
        id: `${binding.id}-${componentId || 'none'}`,
        executionOrder: binding.executionOrder,
        componentName: component?.name || binding.componentDisplay || '-',
        componentNo: component?.componentNo || '-',
        componentPositionNo: component?.componentPositionNo || '-',
        ruleSummary: component?.ruleSummary || binding.ruleDisplay || '-',
        inspectionPointName: binding.inspectionPointName || '-',
        parkingPointDisplay: binding.parkingPointDisplay || '-'
      })
    })
  })

  componentRows.value
    .filter((component) => !boundComponentIds.has(component.id))
    .forEach((component) => {
      rows.push({
        id: `unbound-${component.id}`,
        executionOrder: '-',
        componentName: component.name,
        componentNo: component.componentNo || '-',
        componentPositionNo: component.componentPositionNo || '-',
        ruleSummary: component.ruleSummary || '-',
        inspectionPointName: '-',
        parkingPointDisplay: '-'
      })
    })

  return rows
})

const basicInfoItems = computed(() => {
  const current = device.value
  if (!current) return []
  return [
    { label: '设施名称', value: current.name || '-' },
    { label: '设施类别', value: current.facilityKind === 'pipeline' ? '管道类设施' : '普通设施' },
    { label: '设施编号', value: current.deviceNo || '-' },
    { label: '设施位号', value: current.facilityPositionNo || '-' },
    { label: '所在区域', value: current.areaName || '-' },
    { label: '所属装置', value: current.installationName || '-' },
    { label: '设施状态', value: statusText.value },
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

const componentPointColumns = [
  { title: '执行顺序', dataIndex: 'executionOrder', key: 'executionOrder', width: 100 },
  { title: '部件名称', dataIndex: 'componentName', key: 'componentName', width: 180 },
  { title: '部件编号', dataIndex: 'componentNo', key: 'componentNo', width: 140 },
  { title: '部件位号', dataIndex: 'componentPositionNo', key: 'componentPositionNo', width: 140 },
  { title: '检查规则', dataIndex: 'ruleSummary', key: 'ruleSummary' },
  { title: '巡检点', dataIndex: 'inspectionPointName', key: 'inspectionPointName', width: 180 },
  { title: '停车点', dataIndex: 'parkingPointDisplay', key: 'parkingPointDisplay', width: 220 }
]

function getBindingRuleNames(componentIds: string[]) {
  const ruleIds = new Set<string>()
  componentRows.value
    .filter((item) => componentIds.includes(item.id))
    .forEach((item) => (item.ruleIds || []).forEach((ruleId) => ruleIds.add(ruleId)))
  return Array.from(ruleIds).map((ruleId) => getDetectionItemConfigs().find((rule) => rule.id === ruleId)?.name || ruleId).join('、') || '-'
}

function goBack() {
  router.push('/implementation/device/list')
}

onMounted(() => {
  inspectionStore.initialize()
})
</script>

<style scoped>
.facility-photo-viewer {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fafafa;
  color: #8c8c8c;
}

.facility-photo-viewer img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

</style>
