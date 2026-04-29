<template>
  <div class="object-detection-config">
    <a-page-header
      :title="pageTitle"
      :sub-title="device ? `${device.name}（${device.deviceNo || device.code || '-'}）` : ''"
      @back="goBack"
    >
      <template #extra>
        <a-button @click="goRules">检测规则库</a-button>
        <a-button type="primary" @click="save">保存配置</a-button>
      </template>
    </a-page-header>

    <a-card style="margin-top: 16px">
      <a-alert
        type="info"
        show-icon
        style="margin-bottom: 12px"
        message="对象检测配置是具体绑定页：检测主体 + 检测规则 + 采集位 + 覆盖要求 + 失败策略。这里保存到设施对象本身，不再使用独立 localStorage。"
      />

      <a-descriptions v-if="device" :column="3" bordered size="small" style="margin-bottom: 16px">
        <a-descriptions-item label="设施名称">{{ device.name }}</a-descriptions-item>
        <a-descriptions-item label="设施编号">{{ device.deviceNo || device.code || '-' }}</a-descriptions-item>
        <a-descriptions-item label="所在巡检点">{{ point?.name || '-' }}</a-descriptions-item>
      </a-descriptions>

      <a-table
        :columns="columns"
        :data-source="rows"
        row-key="id"
        :pagination="false"
        :scroll="{ x: 1900 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'subjectType'">
            <a-tag :color="record.subjectType === 'connection' ? 'purple' : 'blue'">{{ getSubjectTypeText(record.subjectType) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'rules'">
            <a-select
              v-model:value="formState[record.id].ruleIds"
              mode="multiple"
              style="width: 100%"
              placeholder="选择该对象要执行的检测规则"
              :options="getRuleOptions(record)"
              option-filter-prop="label"
              show-search
            />
          </template>
          <template v-else-if="column.key === 'collectionPose'">
            <a-select
              v-model:value="formState[record.id].collectionPoseId"
              style="width: 100%"
              allow-clear
              placeholder="选择采集位"
              :options="poseOptions"
              option-filter-prop="label"
              show-search
            />
          </template>
          <template v-else-if="column.key === 'requiredCoverage'">
            <a-switch v-model:checked="formState[record.id].requiredCoverage" checked-children="必须" un-checked-children="可选" />
          </template>
          <template v-else-if="column.key === 'failureStrategy'">
            <a-select v-model:value="formState[record.id].failureStrategy" style="width: 150px">
              <a-select-option value="manual_review">人工复核</a-select-option>
              <a-select-option value="supplement_task">生成补检</a-select-option>
              <a-select-option value="mark_uninspectable">标记不可检</a-select-option>
            </a-select>
          </template>
          <template v-else-if="column.key === 'enabled'">
            <a-switch v-model:checked="formState[record.id].enabled" checked-children="启用" un-checked-children="停用" />
          </template>
          <template v-else-if="column.key === 'remark'">
            <a-input v-model:value="formState[record.id].remark" placeholder="现场说明，可选" />
          </template>
        </template>
      </a-table>

      <a-empty v-if="!rows.length" description="当前设施暂无部件或连接对象，请先在设施编辑中维护资产结构。" />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useInspectionStore } from '@/stores/inspection'
import type { DetectionFailureStrategy, InspectedAssetComponent, ObjectDetectionConfig, ObjectDetectionSubjectType } from '@/types/inspection'
import { getDetectionItemConfigs, type DetectionItemConfig } from '@/views/implementation/detection-item-config/model'

interface SubjectRow {
  id: string
  subjectId: string
  subjectName: string
  subjectType: ObjectDetectionSubjectType
  categoryText: string
}

interface FormStateItem {
  ruleIds: string[]
  collectionPoseId?: string
  requiredCoverage: boolean
  failureStrategy: DetectionFailureStrategy
  enabled: boolean
  remark: string
}

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()
const formState = reactive<Record<string, FormStateItem>>({})

const deviceId = computed(() => String(route.params.deviceId || ''))
const componentId = computed(() => String(route.params.componentId || ''))
const device = computed(() => inspectionStore.inspectionDevices.find(item => item.id === deviceId.value))
const point = computed(() => inspectionStore.inspectionPoints.find(item => item.id === device.value?.inspectionPointId))
const ruleOptions = computed(() => getDetectionItemConfigs().filter(item => item.publishStatus === '已发布' && item.enabled))
const pageTitle = computed(() => componentId.value ? '部件检测配置' : '设施检测配置')

const rows = computed<SubjectRow[]>(() => {
  const components = (device.value?.assetComponents || []).map(component => ({
    id: `component-${component.id}`,
    subjectId: component.id,
    subjectName: component.name,
    subjectType: 'component' as const,
    categoryText: getComponentTypeText(component.type)
  }))
  const connections = (device.value?.connectionObjects || []).map(connection => ({
    id: `connection-${connection.id}`,
    subjectId: connection.id,
    subjectName: connection.name,
    subjectType: 'connection' as const,
    categoryText: `${connection.endpointA || '-'} -> ${connection.endpointB || '-'}`
  }))
  const allRows = [...components, ...connections]
  if (!componentId.value) return allRows
  return allRows.filter(item => item.subjectType === 'component' && item.subjectId === componentId.value)
})

const poseOptions = computed(() => {
  const parkingPoints = point.value?.parkingPoints || []
  return parkingPoints.flatMap(parking => parking.collectionPoses.map(pose => ({
    value: pose.id,
    label: `${parking.name} / ${pose.targetName} / ${pose.method}`
  })))
})

const columns = [
  { title: '检测主体', dataIndex: 'subjectName', key: 'subjectName', width: 180 },
  { title: '主体类型', key: 'subjectType', width: 120 },
  { title: '对象类别/连接关系', dataIndex: 'categoryText', key: 'categoryText', width: 260 },
  { title: '关联检测规则', key: 'rules', width: 420 },
  { title: '采集位', key: 'collectionPose', width: 300 },
  { title: '覆盖要求', key: 'requiredCoverage', width: 110 },
  { title: '失败策略', key: 'failureStrategy', width: 160 },
  { title: '启用', key: 'enabled', width: 100 },
  { title: '备注', key: 'remark', width: 240 }
]

const componentTypeText: Record<string, string> = {
  valve: '阀门',
  meter: '压力表',
  temperature_gauge: '温度表',
  flange: '法兰',
  pipe: '管体',
  motor: '电机',
  cable: '电缆',
  joint: '接头',
  sensor: '传感器',
  screw: '螺杆',
  other: '其他'
}

function getComponentTypeText(type: string) {
  return componentTypeText[type] || type
}

function getSubjectTypeText(type: ObjectDetectionSubjectType) {
  if (type === 'connection') return '连接部位'
  if (type === 'area_environment') return '区域环境'
  if (type === 'asset') return '设施'
  return '设施部件'
}

function createEmptyState(): FormStateItem {
  return {
    ruleIds: [],
    collectionPoseId: undefined,
    requiredCoverage: true,
    failureStrategy: 'manual_review',
    enabled: true,
    remark: ''
  }
}

function hydrateFormState() {
  const configs = device.value?.objectDetectionConfigs || []
  rows.value.forEach((row) => {
    const matched = configs.filter(item => item.subjectType === row.subjectType && item.subjectId === row.subjectId)
    const first = matched[0]
    formState[row.id] = {
      ...createEmptyState(),
      ruleIds: matched.filter(item => item.enabled).map(item => item.ruleId),
      collectionPoseId: first?.collectionPoseId,
      requiredCoverage: first?.requiredCoverage ?? true,
      failureStrategy: first?.failureStrategy || 'manual_review',
      enabled: first?.enabled ?? true,
      remark: first?.remark || ''
    }
  })
}

function getRuleOptions(row: SubjectRow) {
  return ruleOptions.value
    .slice()
    .sort((a, b) => Number(isRecommendedRule(b, row)) - Number(isRecommendedRule(a, row)))
    .map(item => ({
      value: item.id,
      label: `${isRecommendedRule(item, row) ? '推荐 - ' : ''}${item.name}（${item.category}）`
    }))
}

function isRecommendedRule(rule: DetectionItemConfig, row: SubjectRow) {
  const target = `${rule.targetTypes?.join('') || ''}${rule.targetDetails || ''}${rule.name || ''}`
  if (row.subjectType === 'connection') return target.includes('连接') || target.includes('法兰') || target.includes(row.subjectName)
  return target.includes('设施部件') || target.includes(row.subjectName) || target.includes(row.categoryText)
}

function buildConfigs(): ObjectDetectionConfig[] {
  const now = new Date().toISOString()
  return rows.value.flatMap((row) => {
    const state = formState[row.id] || createEmptyState()
    return (state.ruleIds || []).map(ruleId => ({
      id: `odc-${deviceId.value}-${row.subjectType}-${row.subjectId}-${ruleId}`,
      deviceId: deviceId.value,
      subjectType: row.subjectType,
      subjectId: row.subjectId,
      subjectName: row.subjectName,
      ruleId,
      collectionPoseId: state.collectionPoseId,
      requiredCoverage: state.requiredCoverage,
      failureStrategy: state.failureStrategy,
      enabled: state.enabled,
      remark: state.remark,
      updatedAt: now
    }))
  })
}

function save() {
  if (!device.value) return
  const configs = buildConfigs()
  const nextComponents = (device.value.assetComponents || []).map((component: InspectedAssetComponent) => ({
    ...component,
    ruleIds: configs.filter(item => item.subjectType === 'component' && item.subjectId === component.id && item.enabled).map(item => item.ruleId)
  }))
  const nextConnections = (device.value.connectionObjects || []).map(connection => ({
    ...connection,
    ruleIds: configs.filter(item => item.subjectType === 'connection' && item.subjectId === connection.id && item.enabled).map(item => item.ruleId)
  }))
  inspectionStore.saveInspectionDevice({
    ...device.value,
    assetComponents: nextComponents,
    connectionObjects: nextConnections,
    objectDetectionConfigs: configs,
    updatedAt: new Date()
  })
  inspectionStore.fetchAllInspectionDevices()
  message.success('检测配置已保存')
}

function goBack() {
  if (componentId.value) {
    router.push('/implementation/device/component-usage')
    return
  }
  router.push('/implementation/device/list')
}

function goRules() {
  router.push('/implementation/detection-item-config/list')
}

onMounted(() => {
  inspectionStore.initialize()
  hydrateFormState()
})
</script>

<style scoped lang="css">
.object-detection-config {
  width: 100%;
}
</style>
