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
        message="这里用于把标准检测规则关联到具体设施部件。检测规则只定义能检测什么，本页面定义该设施哪个部件要启用哪些检测规则。"
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
        :scroll="{ x: 1500 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">{{ getComponentTypeText(record.type) }}</template>
          <template v-else-if="column.key === 'rules'">
            <a-select
              v-model:value="formState[record.id].ruleIds"
              mode="multiple"
              style="width: 100%"
              placeholder="选择该部件要执行的检测规则"
              :options="getRuleOptions(record)"
              option-filter-prop="label"
              show-search
            />
            <div class="field-tip">建议优先选择适用对象类别包含“{{ record.name }}”或“{{ getComponentTypeText(record.type) }}”的规则。</div>
          </template>
          <template v-else-if="column.key === 'enabled'">
            <a-switch v-model:checked="formState[record.id].enabled" checked-children="启用" un-checked-children="停用" />
          </template>
          <template v-else-if="column.key === 'remark'">
            <a-input v-model:value="formState[record.id].remark" placeholder="现场说明，可选" />
          </template>
        </template>
      </a-table>

      <a-empty v-if="!rows.length" description="当前设施暂无组成部位，请先在设施编辑中维护部件。" />
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useInspectionStore } from '@/stores/inspection'
import type { InspectedAssetComponent } from '@/types/inspection'
import { getDetectionItemConfigs, type DetectionItemConfig } from '@/views/implementation/detection-item-config/model'

interface ObjectDetectionConfigItem {
  id: string
  deviceId: string
  componentId: string
  ruleIds: string[]
  enabled: boolean
  remark: string
  updatedAt: string
}

type ComponentRow = InspectedAssetComponent

const STORAGE_KEY = 'inspection_object_detection_configs_v1'

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()
const formState = reactive<Record<string, ObjectDetectionConfigItem>>({})

const deviceId = computed(() => String(route.params.deviceId || ''))
const componentId = computed(() => String(route.params.componentId || ''))
const device = computed(() => inspectionStore.inspectionDevices.find(item => item.id === deviceId.value))
const point = computed(() => inspectionStore.inspectionPoints.find(item => item.id === device.value?.inspectionPointId))
const ruleOptions = computed(() => getDetectionItemConfigs().filter(item => item.publishStatus === '已发布' && item.enabled))
const pageTitle = computed(() => componentId.value ? '部件检测配置' : '设施检测配置')

const rows = computed<ComponentRow[]>(() => {
  const components = device.value?.assetComponents || []
  if (!componentId.value) return components
  return components.filter(item => item.id === componentId.value)
})

const columns = [
  { title: '部件名称', dataIndex: 'name', key: 'name', width: 180 },
  { title: '部件类型', key: 'type', width: 140 },
  { title: '关联检测规则', key: 'rules', width: 520 },
  { title: '启用', key: 'enabled', width: 100 },
  { title: '备注', key: 'remark', width: 260 }
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

function getStoredConfigs(): ObjectDetectionConfigItem[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as ObjectDetectionConfigItem[]
  } catch {
    return []
  }
}

function saveStoredConfigs(items: ObjectDetectionConfigItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

function createEmptyConfig(component: ComponentRow): ObjectDetectionConfigItem {
  return {
    id: `${deviceId.value}-${component.id}`,
    deviceId: deviceId.value,
    componentId: component.id,
    ruleIds: [],
    enabled: true,
    remark: '',
    updatedAt: new Date().toISOString()
  }
}

function hydrateFormState() {
  const configs = getStoredConfigs()
  rows.value.forEach((component) => {
    const config = configs.find(item => item.deviceId === deviceId.value && item.componentId === component.id)
    formState[component.id] = config ? { ...createEmptyConfig(component), ...config } : createEmptyConfig(component)
  })
}

function getRuleOptions(component: ComponentRow) {
  const componentName = component.name
  const componentType = getComponentTypeText(component.type)
  return ruleOptions.value
    .slice()
    .sort((a, b) => Number(isRecommendedRule(b, componentName, componentType)) - Number(isRecommendedRule(a, componentName, componentType)))
    .map(item => ({
      value: item.id,
      label: `${isRecommendedRule(item, componentName, componentType) ? '推荐 - ' : ''}${item.name}（${item.category}）`
    }))
}

function isRecommendedRule(rule: DetectionItemConfig, componentName: string, componentType: string) {
  const target = `${rule.targetDetails || ''}${rule.name || ''}`
  return target.includes(componentName) || target.includes(componentType)
}

function save() {
  const existing = getStoredConfigs().filter(item => item.deviceId !== deviceId.value || !rows.value.some(component => component.id === item.componentId))
  const next = rows.value.map(component => ({
    ...formState[component.id],
    updatedAt: new Date().toISOString()
  }))
  saveStoredConfigs([...existing, ...next])
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

.field-tip {
  color: #8c8c8c;
  font-size: 12px;
  line-height: 20px;
  margin-top: 4px;
}
</style>
