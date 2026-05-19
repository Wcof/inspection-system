<template>
  <div class="facility-device-detail">
    <a-page-header title="设施详情" @back="goBack" />

    <a-card v-if="device" style="margin-top: 16px">
      <a-tabs v-model:activeKey="activeTab">
        <a-tab-pane key="profile" tab="设备信息">
          <a-row :gutter="[16, 16]">
            <a-col :span="24">
              <a-descriptions :column="3" bordered size="small">
                <a-descriptions-item v-for="item in basicInfoItems" :key="item.label" :label="item.label">
                  {{ item.value }}
                </a-descriptions-item>
              </a-descriptions>
            </a-col>

            <a-col :span="24">
              <a-card title="组成部位" size="small">
                <a-table :columns="componentColumns" :data-source="componentRows" row-key="id" :pagination="false" />
              </a-card>
            </a-col>

            <a-col :span="24">
              <a-card title="连接部位" size="small">
                <a-table :columns="connectionColumns" :data-source="connectionRows" row-key="id" :pagination="false" />
              </a-card>
            </a-col>
          </a-row>
        </a-tab-pane>

        <a-tab-pane key="inspection" tab="巡检信息">
          <a-row :gutter="[16, 16]">
            <a-col :span="24">
              <a-card title="巡检配置" size="small">
                <a-table :columns="bindingColumns" :data-source="bindingRows" row-key="id" :pagination="false" />
              </a-card>
            </a-col>

            <a-col :span="24">
              <a-card title="检测配置" size="small">
                <a-table :columns="detectionConfigColumns" :data-source="detectionConfigRows" row-key="id" :pagination="false" />
              </a-card>
            </a-col>

            <a-col :span="24">
              <a-card title="采集位" size="small">
                <a-table :columns="poseColumns" :data-source="poseRows" row-key="id" :pagination="false" />
              </a-card>
            </a-col>
          </a-row>
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
const activeTab = ref('profile')

const device = computed(() => inspectionStore.inspectionDevices.find(item => item.id === String(route.params.id)))
const detectionRules = computed(() => getDetectionItemConfigs())

const componentRows = computed(() => device.value?.assetComponents || [])
const connectionRows = computed(() => device.value?.connectionObjects || [])

const bindingRows = computed(() => (device.value?.parkingPointBindings || [])
  .slice()
  .sort((a, b) => (a.executionOrder || a.sequence || 0) - (b.executionOrder || b.sequence || 0))
  .map((binding, index) => ({
    ...binding,
    executionOrder: binding.executionOrder || binding.sequence || index + 1,
    inspectionModeText: binding.inspectionMode === 'area' ? '区域巡检' : '固定巡检',
    parkingPointDisplay: (binding.parkingPointNames && binding.parkingPointNames.length
      ? binding.parkingPointNames
      : [binding.parkingPointName].filter(Boolean)
    ).join('、'),
    targetObjectDisplay: getTargetObjectNames(binding).join('、') || '-'
  })))

const poseRows = computed(() => {
  const bindings = device.value?.parkingPointBindings || []
  return bindings.flatMap((binding) => {
    const parkingIds = binding.parkingPointIds?.length ? binding.parkingPointIds : [binding.parkingPointId].filter(Boolean)
    return parkingIds.flatMap((parkingId) => {
      const point = inspectionStore.inspectionPoints.find(item => item.id === binding.inspectionPointId)
      const parking = point?.parkingPoints?.find(item => item.id === parkingId)
      return (parking?.collectionPoses || []).map((pose) => ({
        ...pose,
        inspectionModeText: binding.inspectionMode === 'area' ? '区域巡检' : '固定巡检',
        parkingPointName: parking?.name || binding.parkingPointName,
        targetName: pose.targetName
      }))
    })
  })
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

const basicInfoItems = computed(() => {
  const current = device.value
  if (!current) return []
  return [
    { label: '设施名称', value: current.name || '-' },
    { label: '设施分类', value: current.deviceClassification || '-' },
    { label: '设施编号', value: current.deviceNo || '-' },
    { label: '规格型号', value: current.specModel || '-' },
    { label: '所在区域', value: current.areaName || '-' },
    { label: '设施类别', value: current.deviceCategory || '-' },
    { label: '责任人', value: current.owner || '-' },
    { label: '设备状态', value: statusText.value },
    { label: '出厂厂家', value: current.manufacturer || '-' },
    { label: '出厂编号', value: current.factoryNo || '-' },
    { label: '投用日期', value: current.commissioningDate || '-' },
    { label: '发证日期', value: current.certificateIssueDate || current.issueDate || '-' },
    { label: '使用证号', value: current.usageCertificateNo || '-' },
    { label: '系统名称', value: current.systemName || '-' },
    { label: '检查岗位名称', value: current.inspectionPostName || '-' },
    { label: '失效日期', value: current.expiryDate || '-' },
    { label: '最近检测时间', value: current.lastInspectionTime || '-' },
    { label: '机构核准证书', value: current.institutionApprovalCertificate || current.authorityCertificateNo || '-' },
    { label: '使用部门名称', value: current.usageDepartmentName || current.departmentName || '-' },
    { label: '保管岗位名称', value: current.custodianPostName || '-' },
    { label: '出日期', value: current.outDate || '-' },
    { label: '下次检测时间', value: current.nextInspectionTime || '-' },
    { label: 'NFCID', value: current.nfcId || '-' },
    { label: '存放位置', value: current.storageLocation || '-' },
    { label: '地图坐标', value: current.mapCoordinate || '-' },
    { label: '检测周期', value: current.detectionCycle || '-' },
    { label: '失效预警天数', value: current.failureWarningDays ?? '-' },
    { label: '巡检周期', value: current.inspectionCycle || '-' },
    { label: '最近检测结论', value: current.lastInspectionConclusion || '-' },
    { label: '检测预警天数', value: current.inspectionWarningDays ?? '-' },
    { label: '巡检窗口', value: current.inspectionWindow || '-' },
    { label: '设施编码', value: current.code || current.deviceNo || '-' },
    { label: '来源', value: current.source === 'synced' ? '三方同步' : '手动维护' }
  ]
})

const componentColumns = [
  { title: '部件名称', dataIndex: 'name', key: 'name' },
  { title: '部件类型', dataIndex: 'type', key: 'type', width: 180 },
  { title: '检测规则', key: 'ruleIds', customRender: ({ record }: any) => (record.ruleIds || []).join('、') || '-', width: 260 }
]

const connectionColumns = [
  { title: '连接对象', dataIndex: 'name', key: 'name' },
  { title: '端点A', dataIndex: 'endpointA', key: 'endpointA', width: 220 },
  { title: '端点B', dataIndex: 'endpointB', key: 'endpointB', width: 220 },
  { title: '检测规则', key: 'ruleIds', customRender: ({ record }: any) => (record.ruleIds || []).join('、') || '-', width: 260 }
]

const bindingColumns = [
  { title: '执行顺序', dataIndex: 'executionOrder', key: 'executionOrder', width: 100 },
  { title: '停车点', dataIndex: 'parkingPointDisplay', key: 'parkingPointDisplay', width: 260 },
  { title: '巡检模式', dataIndex: 'inspectionModeText', key: 'inspectionModeText', width: 140 },
  { title: '关联对象', dataIndex: 'targetObjectDisplay', key: 'targetObjectDisplay' }
]

const detectionConfigColumns = [
  { title: '检测主体', dataIndex: 'subjectName', key: 'subjectName' },
  { title: '主体类型', dataIndex: 'subjectTypeText', key: 'subjectTypeText', width: 130 },
  { title: '检测规则', dataIndex: 'ruleName', key: 'ruleName' },
  { title: '采集位', dataIndex: 'collectionPoseName', key: 'collectionPoseName' },
  { title: '覆盖要求', dataIndex: 'requiredCoverageText', key: 'requiredCoverageText', width: 120 },
  { title: '失败策略', dataIndex: 'failureStrategyText', key: 'failureStrategyText', width: 120 },
  { title: '状态', dataIndex: 'enabledText', key: 'enabledText', width: 90 }
]

const poseColumns = [
  { title: '停车点', dataIndex: 'parkingPointName', key: 'parkingPointName', width: 180 },
  { title: '巡检模式', dataIndex: 'inspectionModeText', key: 'inspectionModeText', width: 120 },
  { title: '采集位目标', dataIndex: 'targetName', key: 'targetName' },
  { title: '采集方向', dataIndex: 'direction', key: 'direction', width: 120 },
  { title: '距离(m)', dataIndex: 'distanceMeter', key: 'distanceMeter', width: 100 },
  { title: '焦距', dataIndex: 'focalLength', key: 'focalLength', width: 120 },
  { title: '采集条件', dataIndex: 'collectableCondition', key: 'collectableCondition' }
]

function getTargetObjectNames(binding: any) {
  const refs = binding.targetObjectRefs?.length
    ? binding.targetObjectRefs
    : (binding.componentIds || []).map((id: string) => `component:${id}`)
  return refs.map((ref: string) => {
    const [type, id] = String(ref).split(':')
    if (type === 'connection') {
      return device.value?.connectionObjects?.find(item => item.id === id)?.name || id
    }
    return device.value?.assetComponents?.find(item => item.id === id)?.name || id
  })
}

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
  const tab = String(route.query.tab || 'profile')
  if (['profile', 'inspection'].includes(tab)) {
    activeTab.value = tab
  } else {
    activeTab.value = 'profile'
  }
}

watch(() => route.query.tab, syncTabFromQuery)

onMounted(() => {
  inspectionStore.initialize()
  syncTabFromQuery()
})
</script>
