<template>
  <div class="facility-device-list">
    <a-page-header title="设施设备" sub-title="支持设施维度查询、关联巡检对象与检测规则统计、参考图预览" />

    <a-card style="margin-top: 16px">
      <div class="search-panel">
        <a-form layout="vertical" :model="searchForm" @submit.prevent>
          <a-row :gutter="[16, 8]">
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="设施名称" class="search-item">
                <a-input v-model:value="searchForm.name" allow-clear placeholder="请输入设施名称" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="设施编号" class="search-item">
                <a-input v-model:value="searchForm.deviceNo" allow-clear placeholder="请输入设施编号" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="设施位号" class="search-item">
                <a-input v-model:value="searchForm.facilityPositionNo" allow-clear placeholder="请输入设施位号" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="巡检区域" class="search-item">
                <a-select v-model:value="searchForm.areaId" allow-clear placeholder="请选择巡检区域">
                  <a-select-option v-for="area in areas" :key="area.id" :value="area.id">{{ area.name }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="关联巡检点" class="search-item">
                <a-select v-model:value="searchForm.pointId" allow-clear placeholder="请选择巡检点">
                  <a-select-option v-for="point in points" :key="point.id" :value="point.id">{{ point.name }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="设施类别" class="search-item">
                <a-select v-model:value="searchForm.deviceCategory" allow-clear placeholder="请选择设施类别">
                  <a-select-option value="普通设施">普通设施</a-select-option>
                  <a-select-option value="管道类设施">管道类设施</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            
          </a-row>
          <div class="search-actions">
            <a-space>
              <a-button type="primary" @click="noopSearch">搜索</a-button>
              <a-button @click="resetSearch">重置</a-button>
              <a-button type="primary" @click="goToForm()">新增设施</a-button>
            </a-space>
          </div>
        </a-form>
      </div>

      <a-table :columns="columns" :data-source="filteredDevices" row-key="id" :scroll="{ x: 1900 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'deviceNo'">{{ record.deviceNo || record.code || '-' }}</template>
          <template v-else-if="column.key === 'area'">{{ record.areaName || getPoint(record.inspectionPointId)?.areaName || '-' }}</template>
          <template v-else-if="column.key === 'source'">{{ record.source === 'synced' ? '三方同步' : '手动维护' }}</template>
          <template v-else-if="column.key === 'deviceCategory'">{{ getFacilityKindText(record) }}</template>
          <template v-else-if="column.key === 'point'">{{ getLinkedPointNames(record) }}</template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'componentCount'">{{ getComponentCount(record) }}</template>
          <template v-else-if="column.key === 'ruleCount'">{{ getDetectionRuleCount(record) }}</template>
          <template v-else-if="column.key === 'reference'">
            <img :src="record.referenceImageUrl || defaultDeviceImage" alt="参考图" class="thumb" />
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="goToDetail(record.id)">详情</a-button>
              <a-button type="link" size="small" @click="goToForm(record.id)">编辑</a-button>
              <a-button type="link" size="small" danger @click="handleDelete(record)">删除</a-button>
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
import { Modal, message } from 'ant-design-vue'
import { useInspectionStore } from '@/stores/inspection'

const router = useRouter()
const inspectionStore = useInspectionStore()
const defaultDeviceImage = new URL('../../../设备.png', import.meta.url).href

const searchForm = reactive({
  name: '',
  deviceNo: '',
  areaId: '',
  pointId: '',
  deviceClassification: '',
  deviceCategory: '',
  facilityPositionNo: '',
  owner: '',
  status: ''
})

const columns = [
  { title: '设施编号', dataIndex: 'deviceNo', key: 'deviceNo', width: 150 },
  { title: '设施位号', dataIndex: 'facilityPositionNo', key: 'facilityPositionNo', width: 150 },
  { title: '设施名称', dataIndex: 'name', key: 'name', width: 150 },
  { title: '设施类别', dataIndex: 'deviceCategory', key: 'deviceCategory', width: 130 },
  { title: '巡检区域', key: 'area', width: 130 },
  { title: '关联点位', key: 'point', width: 200 },
  { title: '关联巡检对象数', key: 'componentCount', width: 100 },
  { title: '关联检测规则数', key: 'ruleCount', width: 120 },
  { title: '参考图', key: 'reference', width: 110, fixed: 'right' as const },
  { title: '操作', key: 'actions', width: 120, fixed: 'right' as const }
]

const points = computed(() => inspectionStore.inspectionPoints)

const areas = computed(() => {
  const map = new Map<string, string>()
  inspectionStore.inspectionPoints.forEach((point) => {
    if (point.areaId) map.set(point.areaId, point.areaName || point.areaId)
  })
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
})

const filteredDevices = computed(() => {
  const name = searchForm.name.trim().toLowerCase()

  return inspectionStore.inspectionDevices.filter((device) => {
    const deviceNo = searchForm.deviceNo.trim().toLowerCase()
    const classification = searchForm.deviceClassification.trim().toLowerCase()
    const category = searchForm.deviceCategory.trim().toLowerCase()
    const owner = searchForm.owner.trim().toLowerCase()
    const point = getPoint(device.inspectionPointId)
    const bindingPointIds = (device.parkingPointBindings || []).map(item => item.inspectionPointId)
    const matchName = !name || device.name.toLowerCase().includes(name)
    const matchDeviceNo = !deviceNo || String(device.deviceNo || device.code || '').toLowerCase().includes(deviceNo)
    const matchArea = !searchForm.areaId || device.areaId === searchForm.areaId || point?.areaId === searchForm.areaId
    const matchPosition = !searchForm.facilityPositionNo.trim() || String(device.facilityPositionNo || '').toLowerCase().includes(searchForm.facilityPositionNo.trim().toLowerCase())
    const matchPoint = !searchForm.pointId || device.inspectionPointId === searchForm.pointId || bindingPointIds.includes(searchForm.pointId)
    const matchClassification = !classification || String(device.deviceClassification || '').toLowerCase().includes(classification)
    const matchCategory = !category || getFacilityKindText(device).toLowerCase().includes(category)
    const matchOwner = !owner || String(device.owner || '').toLowerCase().includes(owner)
    const matchStatus = !searchForm.status || device.status === searchForm.status
    return matchName && matchDeviceNo && matchPosition && matchArea && matchPoint && matchClassification && matchCategory && matchOwner && matchStatus
  })
})

function getPoint(pointId: string) {
  return inspectionStore.inspectionPoints.find(point => point.id === pointId)
}

function getLinkedPointNames(device: any) {
  const names = Array.from(new Set((device.parkingPointBindings || []).map((item: any) => item.inspectionPointName).filter(Boolean)))
  if (names.length) return names.join('、')
  return getPoint(device.inspectionPointId)?.name || '-'
}

function getFacilityKindText(device: any) {
  if (device.facilityKind === 'pipeline') return '管道类设施'
  if (device.facilityKind === 'normal') return '普通设施'
  return String(device.deviceCategory || '').trim() || '普通设施'
}

function getComponentCount(device: any) {
  const linkedComponents = inspectionStore.facilityComponents.filter((component) => component.facilityId === device.id)
  return linkedComponents.length || device.assetComponents?.length || 0
}

function getDetectionRuleCount(device: any) {
  const ruleIds = new Set<string>()
  const linkedComponents = inspectionStore.facilityComponents.filter((component) => component.facilityId === device.id)
  const components = linkedComponents.length ? linkedComponents : (device.assetComponents || [])
  components.forEach((component: any) => {
    ;(component.ruleIds || []).forEach((ruleId: string) => ruleIds.add(ruleId))
  })
  return ruleIds.size
}

function goToForm(id?: string) {
  router.push(id ? `/implementation/device/form/${id}` : '/implementation/device/form')
}

function goToDetail(id: string) {
  router.push(`/implementation/device/detail/${id}`)
}

function noopSearch() {
  // 保留搜索按钮，仅触发 computed 过滤
}

function resetSearch() {
  searchForm.name = ''
  searchForm.deviceNo = ''
  searchForm.areaId = ''
  searchForm.pointId = ''
  searchForm.deviceClassification = ''
  searchForm.deviceCategory = ''
  searchForm.facilityPositionNo = ''
  searchForm.owner = ''
  searchForm.status = ''
}

function getStatusText(status: string) {
  if (status === 'inactive') return '停用'
  if (status === 'maintenance') return '维护中'
  if (status === 'scrapped') return '报废'
  return '在用'
}

function getStatusColor(status: string) {
  if (status === 'inactive') return 'default'
  if (status === 'maintenance') return 'gold'
  if (status === 'scrapped') return 'volcano'
  return 'green'
}

function handleDelete(record: any) {
  const pointId = record.inspectionPointId
  const relatedPlans = inspectionStore.inspectionPlans.filter(plan =>
    (plan.pointIds || []).includes(pointId) || (plan.inspectionPointIds || []).includes(pointId)
  )
  const relatedTasks = inspectionStore.tasks.filter(task => (task.inspectionPointIds || []).includes(pointId))

  Modal.confirm({
    title: `确认删除设施 ${record.name}？`,
    content: `当前关联计划 ${relatedPlans.length} 个、关联任务 ${relatedTasks.length} 个。删除后，计划和任务可能出现执行问题，且该设施下检测项数据无法恢复。`,
    okText: '确认删除',
    okButtonProps: { danger: true },
    cancelText: '取消',
    onOk() {
      const relatedItemIds = inspectionStore.inspectionDeviceCheckItems.filter(item => item.deviceId === record.id).map(item => item.id)
      relatedItemIds.forEach(id => inspectionStore.deleteInspectionDeviceCheckItem(id))
      inspectionStore.deleteInspectionDevice(record.id)
      message.success('设施已删除')
    }
  })
}

onMounted(() => inspectionStore.initialize())
</script>

<style scoped lang="css">
.facility-device-list {
  width: 100%;
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

.thumb {
  width: 56px;
  height: 56px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid #f0f0f0;
}
</style>
