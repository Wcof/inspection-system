<template>
  <div class="facility-device-detail">
    <a-page-header title="设施详情" @back="goBack" />

    <a-card v-if="device" style="margin-top: 16px">
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="basic" tab="基础信息">
          <a-descriptions :column="2" bordered>
            <a-descriptions-item label="设施名称">{{ device.name }}</a-descriptions-item>
            <a-descriptions-item label="设施编号">{{ device.deviceNo || device.code }}</a-descriptions-item>
            <a-descriptions-item label="设施类别">{{ device.deviceCategory || '-' }}</a-descriptions-item>
            <a-descriptions-item label="设施分类">{{ device.deviceClassification || '-' }}</a-descriptions-item>
            <a-descriptions-item label="责任人">{{ device.owner || '-' }}</a-descriptions-item>
            <a-descriptions-item label="所在区域">{{ device.areaName || point?.areaName || '-' }}</a-descriptions-item>
            <a-descriptions-item label="所在巡检点">{{ point?.name || '-' }}</a-descriptions-item>
            <a-descriptions-item label="状态">{{ statusText }}</a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>

        <a-tab-pane key="components" tab="组成部位">
          <a-table :columns="componentColumns" :data-source="componentRows" row-key="id" :pagination="false" />
        </a-tab-pane>

        <a-tab-pane key="connections" tab="连接部位">
          <a-table :columns="connectionColumns" :data-source="connectionRows" row-key="id" :pagination="false" />
        </a-tab-pane>

        <a-tab-pane key="checkItems" tab="检测项">
          <a-table :columns="checkItemColumns" :data-source="checkItemRows" row-key="id" :pagination="false" />
        </a-tab-pane>

        <a-tab-pane key="collectionPoses" tab="采集位">
          <a-table :columns="poseColumns" :data-source="poseRows" row-key="id" :pagination="false" />
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()
const activeTab = ref('basic')

const device = computed(() => inspectionStore.inspectionDevices.find(item => item.id === String(route.params.id)))
const point = computed(() => inspectionStore.inspectionPoints.find(item => item.id === device.value?.inspectionPointId))

const componentRows = computed(() => device.value?.assetComponents || [])
const connectionRows = computed(() => device.value?.connectionObjects || [])
const checkItemRows = computed(() => inspectionStore.inspectionDeviceCheckItems.filter(item => item.deviceId === device.value?.id))
const poseRows = computed(() => {
  const parkingPoints = point.value?.parkingPoints || []
  return parkingPoints.flatMap((parking) =>
    parking.collectionPoses.map((pose) => ({
      ...pose,
      parkingPointName: parking.name
    }))
  )
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
  { title: '部件类型', dataIndex: 'type', key: 'type', width: 180 }
]

const connectionColumns = [
  { title: '连接对象', dataIndex: 'name', key: 'name' },
  { title: '端点A', dataIndex: 'endpointA', key: 'endpointA', width: 180 },
  { title: '端点B', dataIndex: 'endpointB', key: 'endpointB', width: 180 },
  { title: '检测关注点', dataIndex: 'detectionFocus', key: 'detectionFocus' }
]

const checkItemColumns = [
  { title: '检测项', dataIndex: 'name', key: 'name' },
  { title: '检测主体', dataIndex: 'subjectType', key: 'subjectType', width: 140 },
  { title: '目标对象', dataIndex: 'targetObject', key: 'targetObject', width: 180 },
  { title: '检测类型', dataIndex: 'detectionType', key: 'detectionType', width: 150 },
  { title: '采集条件', dataIndex: 'collectableCondition', key: 'collectableCondition' }
]

const poseColumns = [
  { title: '停车点', dataIndex: 'parkingPointName', key: 'parkingPointName', width: 150 },
  { title: '采集位目标', dataIndex: 'targetName', key: 'targetName' },
  { title: '采集方向', dataIndex: 'direction', key: 'direction', width: 120 },
  { title: '距离(m)', dataIndex: 'distanceMeter', key: 'distanceMeter', width: 100 },
  { title: '焦距', dataIndex: 'focalLength', key: 'focalLength', width: 120 },
  { title: '采集条件', dataIndex: 'collectableCondition', key: 'collectableCondition' }
]

function goBack() {
  router.push('/implementation/device/list')
}

function syncTabFromQuery() {
  const tab = String(route.query.tab || 'basic')
  if (['basic', 'components', 'connections', 'checkItems', 'collectionPoses'].includes(tab)) {
    activeTab.value = tab
  } else {
    activeTab.value = 'basic'
  }
}

watch(() => route.query.tab, syncTabFromQuery)

onMounted(() => {
  inspectionStore.initialize()
  syncTabFromQuery()
})
</script>
