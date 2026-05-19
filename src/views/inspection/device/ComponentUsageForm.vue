<template>
  <div class="component-usage-form">
    <a-page-header :title="isEdit ? '编辑部件' : '新增部件'" @back="goBack" />

    <a-card style="margin-top: 16px">
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :xs="24" :md="12"><a-form-item label="部件名称" required><a-input v-model:value="form.name" /></a-form-item></a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="部件类型" required>
              <a-select v-model:value="form.componentType" placeholder="请选择部件类型">
                <a-select-option v-for="item in componentTypeOptions" :key="item.value" :value="item.value">{{ item.label }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :xs="24" :md="12"><a-form-item label="部件编号" required><a-input v-model:value="form.componentNo" /></a-form-item></a-col>
          <a-col :xs="24" :md="12"><a-form-item label="部件位号" required><a-input v-model:value="form.componentPositionNo" /></a-form-item></a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :xs="24" :md="8">
            <a-form-item label="所属区域" required>
              <a-select v-model:value="form.areaId" placeholder="请选择所属区域" @change="syncArea">
                <a-select-option v-for="item in areaOptions" :key="item.id" :value="item.id">{{ item.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item label="所属装置" required>
              <a-select v-model:value="form.installationId" placeholder="请选择所属装置" @change="syncInstallation">
                <a-select-option v-for="item in installationOptions" :key="item.id" :value="item.id">{{ item.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="8">
            <a-form-item label="所属设施" required>
              <a-select v-model:value="form.facilityId" placeholder="请选择所属设施" @change="syncFacility">
                <a-select-option v-for="item in facilityOptions" :key="item.id" :value="item.id">{{ item.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-card size="small" title="关联规则" class="rules-card">
          <a-alert type="info" show-icon style="margin-bottom: 12px" message="规则通过两级选择维护：先选检测类型，再选该类型下的具体检测算法/规则。最终只保存规则 ID。" />
          <a-table :columns="ruleColumns" :data-source="form.ruleBindings" row-key="key" :pagination="false" size="small">
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'detectionType'">
                <a-select v-model:value="record.detectionType" style="width: 100%" placeholder="检测类型" @change="handleRuleTypeChange(record)">
                  <a-select-option v-for="value in detectionTypeOptions" :key="value" :value="value">{{ value }}</a-select-option>
                </a-select>
              </template>
              <template v-else-if="column.key === 'ruleId'">
                <a-select
                  v-model:value="record.ruleId"
                  style="width: 100%"
                  placeholder="请选择检测算法/规则"
                  show-search
                  option-filter-prop="label"
                  @change="syncRuleBinding(record)"
                >
                  <a-select-option
                    v-for="rule in getRulesByType(record.detectionType)"
                    :key="rule.id"
                    :value="rule.id"
                    :label="`${rule.detectionAlgorithm} / ${rule.name}`"
                  >
                    {{ rule.detectionAlgorithm }} / {{ rule.name }}
                  </a-select-option>
                </a-select>
              </template>
              <template v-else-if="column.key === 'algorithm'">{{ getRuleAlgorithm(record.ruleId) }}</template>
              <template v-else-if="column.key === 'actions'">
                <a-button type="link" size="small" danger @click="removeRuleBinding(index)">删除</a-button>
              </template>
            </template>
          </a-table>
          <a-button style="margin-top: 12px" @click="addRuleBinding">新增检查规则</a-button>
        </a-card>
        <div class="actions">
          <a-space>
            <a-button @click="goBack">取消</a-button>
            <a-button type="primary" @click="handleSave">保存</a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useInspectionStore } from '@/stores/inspection'
import type { DetectionType } from '@/views/implementation/detection-item-config/model'
import { detectionTypeOptions, getDetectionItemConfigs } from '@/views/implementation/detection-item-config/model'

interface RuleBindingRow {
  key: string
  detectionType?: DetectionType
  ruleId?: string
}

const componentTypeOptions = [
  { value: 'valve', label: '阀门' },
  { value: 'meter', label: '压力表' },
  { value: 'temperature_gauge', label: '温度表' },
  { value: 'flange', label: '法兰' },
  { value: 'pipe', label: '管体' },
  { value: 'motor', label: '电机' },
  { value: 'cable', label: '电缆' },
  { value: 'joint', label: '接头' },
  { value: 'sensor', label: '传感器' },
  { value: 'screw', label: '螺杆' },
  { value: 'other', label: '其他' }
]

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()

const isEdit = computed(() => Boolean(route.params.componentId))
const currentId = computed(() => String(route.params.componentId || ''))
const current = computed(() => inspectionStore.facilityComponents.find((item) => item.id === currentId.value))
const ruleLibrary = computed(() => getDetectionItemConfigs().filter((item) => item.publishStatus === '已发布' || current.value?.ruleIds.includes(item.id)))

const form = reactive({
  name: '',
  componentType: 'meter',
  componentNo: '',
  componentPositionNo: '',
  areaId: '',
  areaName: '',
  installationId: '',
  installationName: '',
  facilityId: '',
  facilityName: '',
  status: 'active',
  remark: '',
  ruleBindings: [] as RuleBindingRow[]
})

const areaOptions = computed(() => {
  const map = new Map<string, string>()
  inspectionStore.installations.forEach((item) => {
    if (item.areaId) map.set(item.areaId, item.areaName || item.areaId)
  })
  inspectionStore.inspectionDevices.forEach((item) => {
    if (item.areaId) map.set(item.areaId, item.areaName || item.areaId)
  })
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
})

const installationOptions = computed(() => inspectionStore.installations.filter((item) => !form.areaId || item.areaId === form.areaId))
const facilityOptions = computed(() => inspectionStore.inspectionDevices.filter((item) => {
  const matchArea = !form.areaId || item.areaId === form.areaId
  const matchInstallation = !form.installationId || item.installationId === form.installationId
  return matchArea && matchInstallation
}))

const ruleColumns = [
  { title: '检测类型', key: 'detectionType', width: 180 },
  { title: '检测算法/规则', key: 'ruleId' },
  { title: '备注', key: 'algorithm', width: 180 },
  { title: '操作', key: 'actions', width: 90 }
]

function getRulesByType(type?: DetectionType) {
  if (!type) return []
  return ruleLibrary.value.filter((rule) => rule.detectionType === type)
}

function getRuleById(ruleId?: string) {
  return ruleLibrary.value.find((item) => item.id === ruleId)
}

function getRuleAlgorithm(ruleId?: string) {
  return getRuleById(ruleId)?.detectionAlgorithm || '-'
}

function addRuleBinding() {
  form.ruleBindings.push({ key: `binding-${Date.now()}-${Math.random().toString(16).slice(2, 6)}` })
}

function removeRuleBinding(index: number) {
  form.ruleBindings.splice(index, 1)
}

function handleRuleTypeChange(record: RuleBindingRow) {
  record.ruleId = undefined
}

function syncRuleBinding(record: RuleBindingRow) {
  const rule = getRuleById(record.ruleId)
  if (rule) record.detectionType = rule.detectionType
}

function syncArea(id: string) {
  const area = areaOptions.value.find((item) => item.id === id)
  form.areaName = area?.name || ''
  form.installationId = ''
  form.installationName = ''
  form.facilityId = ''
  form.facilityName = ''
}

function syncInstallation(id: string) {
  const installation = inspectionStore.installations.find((item) => item.id === id)
  form.installationName = installation?.name || ''
  form.areaId = installation?.areaId || form.areaId
  form.areaName = installation?.areaName || form.areaName
  form.facilityId = ''
  form.facilityName = ''
}

function syncFacility(id: string) {
  const facility = inspectionStore.inspectionDevices.find((item) => item.id === id)
  form.facilityName = facility?.name || ''
  form.installationId = facility?.installationId || form.installationId
  form.installationName = facility?.installationName || form.installationName
  form.areaId = facility?.areaId || form.areaId
  form.areaName = facility?.areaName || form.areaName
}

function buildRuleBindings(ruleIds: string[]) {
  return ruleIds.map((ruleId) => {
    const rule = getRuleById(ruleId)
    return {
      key: `binding-${ruleId}`,
      detectionType: rule?.detectionType,
      ruleId
    }
  })
}

function fillForm() {
  if (!current.value) {
    addRuleBinding()
    return
  }
  Object.assign(form, {
    name: current.value.name,
    componentType: current.value.componentType,
    componentNo: current.value.componentNo,
    componentPositionNo: current.value.componentPositionNo,
    areaId: current.value.areaId,
    areaName: current.value.areaName,
    installationId: current.value.installationId,
    installationName: current.value.installationName,
    facilityId: current.value.facilityId,
    facilityName: current.value.facilityName,
    status: current.value.status,
    remark: current.value.remark || '',
    ruleBindings: buildRuleBindings(current.value.ruleIds || [])
  })
  if (!form.ruleBindings.length) addRuleBinding()
}

function goBack() {
  router.push('/implementation/device/component-usage')
}

function handleSave() {
  if (!form.name.trim() || !form.componentNo.trim() || !form.componentPositionNo.trim() || !form.areaId || !form.installationId || !form.facilityId) {
    message.error('请补齐部件基础信息')
    return
  }

  const ruleIds = Array.from(new Set(form.ruleBindings.map((item) => item.ruleId).filter(Boolean) as string[]))
  if (form.ruleBindings.some((item) => item.detectionType && !item.ruleId)) {
    message.error('存在未选择具体规则的检测类型，请补全后再保存')
    return
  }

  const now = new Date()
  inspectionStore.saveFacilityComponent({
    id: currentId.value || `fc-${Date.now()}`,
    name: form.name.trim(),
    componentType: form.componentType as any,
    componentNo: form.componentNo.trim(),
    componentPositionNo: form.componentPositionNo.trim(),
    areaId: form.areaId,
    areaName: form.areaName,
    installationId: form.installationId,
    installationName: form.installationName,
    facilityId: form.facilityId,
    facilityName: form.facilityName,
    ruleIds,
    status: form.status as any,
    remark: form.remark,
    createdAt: current.value?.createdAt || now,
    updatedAt: now
  })
  message.success('部件已保存')
  goBack()
}

onMounted(() => {
  inspectionStore.initialize()
  fillForm()
})
</script>

<style scoped>
.rules-card {
  margin-top: 8px;
}
.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
