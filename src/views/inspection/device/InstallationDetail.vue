<template>
  <div class="installation-detail-page">
    <a-page-header :title="`${installation?.name || '装置'}详情`" @back="goBack" />

    <template v-if="installation">
      <a-card style="margin-top: 16px" title="基础信息">
        <a-descriptions bordered :column="3" size="small">
          <a-descriptions-item label="装置名称">{{ installation.name }}</a-descriptions-item>
          <a-descriptions-item label="装置编号">{{ installation.code }}</a-descriptions-item>
          <a-descriptions-item label="位号">{{ installation.installationPositionNo || '-' }}</a-descriptions-item>
          <a-descriptions-item label="所属区域">{{ installation.areaName || '-' }}</a-descriptions-item>
          <a-descriptions-item label="关联设施">{{ facilityRows.length }}</a-descriptions-item>
          <a-descriptions-item label="关联部件">{{ componentRows.length }}</a-descriptions-item>
          <a-descriptions-item label="关联规则">{{ linkedRuleCount }}</a-descriptions-item>
          <a-descriptions-item label="关联点位">{{ linkedPointCount }}</a-descriptions-item>
          <a-descriptions-item label="备注">{{ installation.remark || '-' }}</a-descriptions-item>
        </a-descriptions>
      </a-card>

      <a-card style="margin-top: 16px" title="关联信息">
        <a-form layout="vertical" :model="searchForm" class="relation-search-form">
          <a-row :gutter="[16, 8]">
            <a-col :xs="24" :sm="12" :md="6">
              <a-form-item label="设施">
                <a-input v-model:value="searchForm.facilityName" placeholder="搜索设施名称" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="6">
              <a-form-item label="设施编码">
                <a-input v-model:value="searchForm.facilityCode" placeholder="搜索设施编码" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="6">
              <a-form-item label="部件">
                <a-input v-model:value="searchForm.componentName" placeholder="搜索部件名称" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="6">
              <a-form-item label="部件编码">
                <a-input v-model:value="searchForm.componentCode" placeholder="搜索部件编码" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8">
              <a-form-item label=" " class="search-actions-item">
                <a-space>
                  <a-button type="primary">搜索</a-button>
                  <a-button @click="resetSearch">重置</a-button>
                </a-space>
              </a-form-item>
            </a-col>
          </a-row>
        </a-form>

        <a-table
          :columns="relationColumns"
          :data-source="filteredRelationRows"
          row-key="id"
          size="small"
          :pagination="{ pageSize: 10 }"
          :scroll="{ x: 1080 }"
          :locale="{ emptyText: '暂无关联信息' }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'rules'">
              <a-space wrap>
                <a-tag v-for="rule in record.ruleNames" :key="rule">{{ rule }}</a-tag>
                <span v-if="!record.ruleNames.length">-</span>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import { getDetectionItemConfigs } from '@/views/implementation/detection-item-config/model'

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()

const installationId = computed(() => String(route.params.id || ''))
const installation = computed(() => inspectionStore.installations.find((item) => item.id === installationId.value))
const searchForm = reactive({
  facilityName: '',
  facilityCode: '',
  componentName: '',
  componentCode: ''
})
const facilityRows = computed(() => inspectionStore.inspectionDevices.filter((item) => item.installationId === installationId.value))
const componentRows = computed(() => inspectionStore.facilityComponents.filter((item) => item.installationId === installationId.value))
const ruleMap = computed(() => new Map(getDetectionItemConfigs().map((item) => [item.id, item])))
const componentRowsWithRules = computed(() => componentRows.value.map((item) => {
  const facility = facilityRows.value.find((facilityItem) => facilityItem.id === item.facilityId)
  const ruleIds = [...new Set(item.ruleIds || [])]
  const ruleNames = ruleIds.map((ruleId) => ruleMap.value.get(ruleId)?.name || ruleId)
  return {
    id: item.id,
    facilityName: item.facilityName || facility?.name || '-',
    facilityCode: facility?.deviceNo || facility?.code || '-',
    componentName: item.name,
    componentCode: item.componentNo || '-',
    ruleIds,
    ruleNames
  }
}))
const linkedRuleCount = computed(() => new Set(componentRows.value.flatMap((item) => item.ruleIds || [])).size)
const linkedPointCount = computed(() => {
  const facilityIds = new Set(facilityRows.value.map((item) => item.id))
  const componentIds = new Set(componentRows.value.map((item) => item.id))
  return inspectionStore.inspectionPoints.filter((point) => {
    const coveredByObject = (point.coverageObjects || []).some((obj) => {
      return (obj.deviceId && facilityIds.has(obj.deviceId)) || (obj.componentId && componentIds.has(obj.componentId))
    })
    const coveredByConfig = (point.detectionConfigs || []).some((config) => config.subjectType === 'component' && componentIds.has(config.subjectId))
    return coveredByObject || coveredByConfig
  }).length
})

const filteredRelationRows = computed(() => {
  const facilityName = searchForm.facilityName.trim().toLowerCase()
  const facilityCode = searchForm.facilityCode.trim().toLowerCase()
  const componentName = searchForm.componentName.trim().toLowerCase()
  const componentCode = searchForm.componentCode.trim().toLowerCase()
  return componentRowsWithRules.value.filter((item) => {
    const matchesFacility = !facilityName || String(item.facilityName || '').toLowerCase().includes(facilityName)
    const matchesFacilityCode = !facilityCode || String(item.facilityCode || '').toLowerCase().includes(facilityCode)
    const matchesComponent = !componentName || String(item.componentName || '').toLowerCase().includes(componentName)
    const matchesComponentCode = !componentCode || String(item.componentCode || '').toLowerCase().includes(componentCode)
    return matchesFacility && matchesFacilityCode && matchesComponent && matchesComponentCode
  })
})

const relationColumns = [
  { title: '设施', dataIndex: 'facilityName', key: 'facilityName', width: 220 },
  { title: '设施编码', dataIndex: 'facilityCode', key: 'facilityCode', width: 160 },
  { title: '部件', dataIndex: 'componentName', key: 'componentName', width: 220 },
  { title: '部件编码', dataIndex: 'componentCode', key: 'componentCode', width: 160 },
  { title: '检查规则', key: 'rules' }
]

function goBack() {
  router.push('/implementation/device/installation-list')
}

function resetSearch() {
  searchForm.facilityName = ''
  searchForm.facilityCode = ''
  searchForm.componentName = ''
  searchForm.componentCode = ''
}

onMounted(() => inspectionStore.initialize())
</script>

<style scoped>
.relation-search-form {
  margin-bottom: 12px;
  padding: 12px 12px 4px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}
.search-actions-item {
  display: flex;
  align-items: flex-end;
}
</style>
