<template>
  <div class="component-usage-detail">
    <a-page-header :title="`${component?.name || '部件'}详情`" @back="goBack" />

    <a-card style="margin-top: 16px">
      <a-descriptions bordered :column="3" size="small">
        <a-descriptions-item label="部件名称">{{ component?.name || '-' }}</a-descriptions-item>
        <a-descriptions-item label="部件类型">{{ getComponentTypeText(component?.componentType) }}</a-descriptions-item>
        <a-descriptions-item label="部件编号">{{ component?.componentNo || '-' }}</a-descriptions-item>
        <a-descriptions-item label="部件位号">{{ component?.componentPositionNo || '-' }}</a-descriptions-item>
        <a-descriptions-item label="所属区域">{{ component?.areaName || '-' }}</a-descriptions-item>
        <a-descriptions-item label="所属装置">{{ component?.installationName || '-' }}</a-descriptions-item>
        <a-descriptions-item label="所属设施">{{ component?.facilityName || '-' }}</a-descriptions-item>
        <a-descriptions-item label="状态">{{ component?.status === 'active' ? '在用' : component?.status === 'maintenance' ? '维护中' : '停用' }}</a-descriptions-item>
        <a-descriptions-item label="备注">{{ component?.remark || '-' }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card style="margin-top: 16px" title="关联检测规则">
      <a-table :columns="ruleColumns" :data-source="ruleRows" row-key="id" :pagination="false" />
    </a-card>

    <a-card style="margin-top: 16px" title="关联巡检点与停车点">
      <a-table :columns="pointColumns" :data-source="pointRows" row-key="id" :pagination="false" />
    </a-card>

    <a-card style="margin-top: 16px" title="最近巡检记录、告警与证据">
      <a-descriptions bordered :column="3" size="small">
        <a-descriptions-item label="最近巡检记录">{{ latestInspectionSummary }}</a-descriptions-item>
        <a-descriptions-item label="最近告警">{{ latestAlertSummary }}</a-descriptions-item>
        <a-descriptions-item label="最近证据">{{ latestEvidenceSummary }}</a-descriptions-item>
      </a-descriptions>
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

const componentId = computed(() => String(route.params.componentId || ''))
const component = computed(() => inspectionStore.facilityComponents.find((item) => item.id === componentId.value))
const pointRows = computed(() => {
  return inspectionStore.inspectionPoints.flatMap((point) => {
    const pointConfigs = (point.detectionConfigs || []).filter((config) => config.subjectType === 'component' && config.subjectId === componentId.value)
    if (!pointConfigs.length) return []
    const parkingNames = new Set<string>()
    ;(point.parkingPoints || []).forEach((parking) => {
      const matched = parking.collectionPoses.some((pose) => pose.targetType === 'component' && pose.targetName === component.value?.name)
      if (matched) parkingNames.add(parking.name)
    })
    return [{
      id: point.id,
      pointName: point.name,
      areaName: point.areaName || '-',
      parkingPointNames: Array.from(parkingNames).join('、') || '-',
      ruleNames: pointConfigs.map((item) => getRuleName(item.ruleId)).join('、') || '-',
      executionOrder: point.sequence || '-'
    }]
  })
})

const latestInspectionSummary = computed(() => {
  const row = pointRows.value[0]
  return row ? `${row.pointName} / 执行顺序 ${row.executionOrder}` : '暂无巡检记录'
})
const latestAlertSummary = computed(() => ruleRows.value[0] ? `${ruleRows.value[0].name} / 最近一次为静态 mock 告警` : '暂无告警')
const latestEvidenceSummary = computed(() => pointRows.value[0] ? `${pointRows.value[0].pointName} / 点位证据链静态展示` : '暂无证据')

const ruleRows = computed(() => (component.value?.ruleIds || []).map((id) => {
  const rule = getDetectionItemConfigs().find((item) => item.id === id)
  return {
    id,
    name: rule?.name || id,
    detectionType: rule?.detectionType || '-',
    detectionAlgorithm: rule?.detectionAlgorithm || '-',
    publishStatus: rule?.publishStatus || '-',
    status: rule?.enabled ? '启用' : '停用'
  }
}))

const ruleColumns = [
  { title: '规则名称', dataIndex: 'name', key: 'name' },
  { title: '检测类型', dataIndex: 'detectionType', key: 'detectionType', width: 140 },
  { title: '检测算法', dataIndex: 'detectionAlgorithm', key: 'detectionAlgorithm', width: 180 },
  { title: '发布状态', dataIndex: 'publishStatus', key: 'publishStatus', width: 120 },
  { title: '启用状态', dataIndex: 'status', key: 'status', width: 100 }
]

const pointColumns = [
  { title: '巡检点', dataIndex: 'pointName', key: 'pointName' },
  { title: '所属区域', dataIndex: 'areaName', key: 'areaName', width: 120 },
  { title: '停车点', dataIndex: 'parkingPointNames', key: 'parkingPointNames', width: 180 },
  { title: '关联规则', dataIndex: 'ruleNames', key: 'ruleNames' },
  { title: '检测顺序', dataIndex: 'executionOrder', key: 'executionOrder', width: 100 }
]

function getRuleName(ruleId: string) {
  return getDetectionItemConfigs().find((item) => item.id === ruleId)?.name || ruleId
}

function getComponentTypeText(type?: string) {
  const map: Record<string, string> = {
    valve: '阀门', meter: '压力表', temperature_gauge: '温度表', flange: '法兰', pipe: '管体',
    motor: '电机', cable: '电缆', joint: '接头', sensor: '传感器', screw: '螺杆', other: '其他'
  }
  return type ? map[type] || type : '-'
}

function goBack() {
  router.push('/implementation/device/component-usage')
}

onMounted(() => inspectionStore.initialize())
</script>
