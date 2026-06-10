<template>
  <div class="installation-list">
    <a-page-header title="装置管理" sub-title="按区域统一维护装置基础信息，并查看关联设施、巡检对象、规则与点位概况" />

    <a-card style="margin-top: 16px">
      <a-form layout="vertical" @submit.prevent>
        <a-row :gutter="[16, 8]">
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="装置名称">
              <a-input v-model:value="query.name" allow-clear placeholder="请输入装置名称" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="装置编号">
              <a-input v-model:value="query.code" allow-clear placeholder="请输入装置编号" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="巡检区域">
              <a-select v-model:value="query.areaId" allow-clear placeholder="请选择巡检区域">
                <a-select-option v-for="area in areaOptions" :key="area.id" :value="area.id">{{ area.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>

      <div class="actions-row">
        <a-space>
          <a-button @click="resetQuery">重置</a-button>
          <a-button type="primary" @click="goCreate">新增装置</a-button>
        </a-space>
      </div>

      <a-table :columns="columns" :data-source="rows" row-key="id" :pagination="{ pageSize: 10 }" :scroll="{ x: 1320 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'facilityCount'">{{ getFacilityCount(record.id) }}</template>
          <template v-else-if="column.key === 'componentCount'">{{ getComponentCount(record.id) }}</template>
          <template v-else-if="column.key === 'ruleCount'">{{ getRuleCount(record.id) }}</template>
          <template v-else-if="column.key === 'pointCount'">{{ getPointCount(record.id) }}</template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="goDetail(record.id)">详情</a-button>
              <a-button type="link" size="small" @click="goEdit(record.id)">编辑</a-button>
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

const inspectionStore = useInspectionStore()
const router = useRouter()

const query = reactive({
  name: '',
  code: '',
  areaId: ''
})

const columns = [
  { title: '装置名称', dataIndex: 'name', key: 'name', width: 180 },
  { title: '装置编号', dataIndex: 'code', key: 'code', width: 180 },
  { title: '巡检区域', dataIndex: 'areaName', key: 'areaName', width: 140 },
  { title: '设施数', key: 'facilityCount', width: 100 },
  { title: '巡检对象数', key: 'componentCount', width: 100 },
  { title: '规则数', key: 'ruleCount', width: 100 },
  { title: '备注', dataIndex: 'remark', key: 'remark' },
  { title: '操作', key: 'actions', width: 180, fixed: 'right' as const }
]

const areaOptions = computed(() => {
  const map = new Map<string, string>()
  inspectionStore.installations.forEach((item) => {
    if (item.areaId) map.set(item.areaId, item.areaName || item.areaId)
  })
  inspectionStore.inspectionDevices.forEach((item) => {
    if (item.areaId) map.set(item.areaId, item.areaName || item.areaId)
  })
  inspectionStore.inspectionPoints.forEach((item) => {
    if (item.areaId) map.set(item.areaId, item.areaName || item.areaId)
  })
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
})

const rows = computed(() => inspectionStore.installations.filter((item) => {
  const name = query.name.trim().toLowerCase()
  const code = query.code.trim().toLowerCase()
  const byName = !name || item.name.toLowerCase().includes(name)
  const byCode = !code || item.code.toLowerCase().includes(code)
  const byArea = !query.areaId || item.areaId === query.areaId
  return byName && byCode && byArea
}))

function getFacilityCount(installationId: string) {
  return inspectionStore.inspectionDevices.filter((device) => device.installationId === installationId).length
}

function getComponentCount(installationId: string) {
  return inspectionStore.facilityComponents.filter((component) => component.installationId === installationId).length
}

function getRuleCount(installationId: string) {
  const ids = new Set<string>()
  inspectionStore.facilityComponents
    .filter((component) => component.installationId === installationId)
    .forEach((component) => (component.ruleIds || []).forEach((ruleId) => ids.add(ruleId)))
  return ids.size
}

function getPointCount(installationId: string) {
  const facilityIds = new Set(
    inspectionStore.inspectionDevices.filter((device) => device.installationId === installationId).map((item) => item.id)
  )
  const componentIds = new Set(
    inspectionStore.facilityComponents.filter((component) => component.installationId === installationId).map((item) => item.id)
  )
  const pointIds = new Set<string>()

  inspectionStore.inspectionPoints.forEach((point) => {
    const coversFacility = (point.coverageObjects || []).some((obj) => obj.deviceId && facilityIds.has(obj.deviceId))
    const coversComponent = (point.coverageObjects || []).some((obj) => obj.componentId && componentIds.has(obj.componentId))
    const coversConfig = (point.detectionConfigs || []).some((config) => config.subjectType === 'component' && componentIds.has(config.subjectId))
    if (coversFacility || coversComponent || coversConfig) pointIds.add(point.id)
  })

  inspectionStore.inspectionDevices.forEach((device) => {
    if (device.installationId !== installationId) return
    ;(device.parkingPointBindings || []).forEach((binding) => {
      if (binding.inspectionPointId) pointIds.add(binding.inspectionPointId)
    })
    if (device.inspectionPointId) pointIds.add(device.inspectionPointId)
  })

  return pointIds.size
}

function resetQuery() {
  query.name = ''
  query.code = ''
  query.areaId = ''
}

function goCreate() {
  router.push('/implementation/device/installation-form')
}

function goEdit(id: string) {
  router.push(`/implementation/device/installation-form/${id}`)
}

function goDetail(id: string) {
  router.push(`/implementation/device/installation-detail/${id}`)
}

function remove(id: string) {
  const hasFacilities = getFacilityCount(id) > 0
  const hasComponents = getComponentCount(id) > 0
  if (hasFacilities || hasComponents) {
    message.error('该装置下仍存在设施或巡检对象，无法删除')
    return
  }
  Modal.confirm({
    title: '确认删除该装置？',
    okText: '确认',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk() {
      inspectionStore.deleteInstallation(id)
      message.success('装置已删除')
    }
  })
}

onMounted(() => inspectionStore.initialize())
</script>

<style scoped>
.actions-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 12px;
}
</style>
