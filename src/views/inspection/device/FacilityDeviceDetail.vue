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

        <a-tab-pane key="detectionConfigs" tab="检测配置">
          <a-table :columns="detectionConfigColumns" :data-source="detectionConfigRows" row-key="id" :pagination="false" />
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
import { getDetectionItemConfigs } from '@/views/implementation/detection-item-config/model'

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()
const activeTab = ref('basic')

const device = computed(() => inspectionStore.inspectionDevices.find(item => item.id === String(route.params.id)))
const point = computed(() => inspectionStore.inspectionPoints.find(item => item.id === device.value?.inspectionPointId))

const componentRows = computed(() => device.value?.assetComponents || [])
const connectionRows = computed(() => device.value?.connectionObjects || [])
const detectionRules = computed(() => getDetectionItemConfigs())
const poseRows = computed(() => {
  const parkingPoints = point.value?.parkingPoints || []
  return parkingPoints.flatMap((parking) =>
    parking.collectionPoses.map((pose) => ({
      ...pose,
      parkingPointName: parking.name
    }))
  )
})
const detectionConfigRows = computed(() => (device.value?.objectDetectionConfigs || []).map((config) => {
  const rule = detectionRules.value.find(item => item.id === config.ruleId)
  const pose = poseRows.value.find(item => item.id === config.collectionPoseId)
  return {
    ...config,
    subjectTypeText: getSubjectTypeText(config.subjectType),
    ruleName: rule?.name || config.ruleId,
    collectionPoseName: pose ? `${pose.parkingPointName} / ${pose.targetName}` : '-',
    requiredCoverageText: config.requiredCoverage ? '必须覆盖' : '可选覆盖',
    failureStrategyText: getFailureStrategyText(config.failureStrategy),
    enabledText: config.enabled ? '启用' : '停用'
  }
}))

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
  { title: '端点B', dataIndex: 'endpointB', key: 'endpointB', width: 180 }
]

const detectionConfigColumns = [
  { title: '检测主体', dataIndex: 'subjectName', key: 'subjectName' },
  { title: '主体类型', dataIndex: 'subjectTypeText', key: 'subjectTypeText', width: 130 },
  { title: '检测规则', dataIndex: 'ruleName', key: 'ruleName' },
  { title: '采集位', dataIndex: 'collectionPoseName', key: 'collectionPoseName' },
  { title: '覆盖要求', dataIndex: 'requiredCoverageText', key: 'requiredCoverageText', width: 120 },
  { title: '失败策略', dataIndex: 'failureStrategyText', key: 'failureStrategyText', width: 120 },
  { title: '状态', dataIndex: 'enabledText', key: 'enabledText', width: 90 },
  { title: '备注', dataIndex: 'remark', key: 'remark' }
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

function getSubjectTypeText(type: string) {
  if (type === 'connection') return '连接部位'
  if (type === 'asset') return '设施'
  if (type === 'area_environment') return '区域环境'
  return '设施部件'
}

function getFailureStrategyText(strategy: string) {
  if (strategy === 'supplement_task') return '生成补检'
  if (strategy === 'mark_uninspectable') return '标记不可检'
  return '人工复核'
}

function syncTabFromQuery() {
  const tab = String(route.query.tab || 'basic')
  if (['basic', 'components', 'connections', 'detectionConfigs', 'collectionPoses'].includes(tab)) {
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
