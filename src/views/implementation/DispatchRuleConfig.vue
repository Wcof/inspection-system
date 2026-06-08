<template>
  <div class="dispatch-rule-config">
    <a-page-header title="调度规则配置" sub-title="按区域维护自动调度任务生成规则">
      <template #extra>
        <a-space>
          <a-button @click="showHelpModal = true">说明</a-button>
          <a-button type="primary" :disabled="!canCreateRule" @click="openCreate">新增区域规则</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-card style="margin-top: 16px">
      <a-alert
        type="info"
        show-icon
        style="margin-bottom: 12px"
        message="调度规则按区域生效，用于把区域内已启用的巡检规划转换为待执行任务，并在生成前判断规划是否适合自动调度。"
      />
      <a-table :columns="columns" :data-source="rules" row-key="id" :pagination="false" :scroll="{ x: 980 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'enabled'">
            <a-switch v-model:checked="record.enabled" checked-children="启用" un-checked-children="停用" @change="touchRule(record)" />
          </template>
          <template v-else-if="column.key === 'ruleType'">{{ getRuleTypeText(record.ruleType) }}</template>
          <template v-else-if="column.key === 'updatedAt'">{{ formatDate(record.updatedAt) }}</template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="openView(record)">查看</a-button>
              <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
              <a-popconfirm title="确认删除该区域规则？" ok-text="确认" cancel-text="取消" @confirm="removeRule(record.id)">
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="editorVisible"
      :title="editorMode === 'view' ? '查看区域规则' : editingId ? '编辑区域规则' : '新增区域规则'"
      width="860px"
      :ok-text="editorMode === 'view' ? '关闭' : '确认变更'"
      cancel-text="取消"
      @ok="editorMode === 'view' ? editorVisible = false : saveRule()"
    >
      <a-form layout="vertical" :model="form">
        <a-row :gutter="16">
          <a-col :xs="24" :md="12"><a-form-item label="区域名称" required><a-select v-model:value="form.areaId" :disabled="editorMode === 'view' || !editorAreaOptions.length" placeholder="请先在地图中维护区域" @change="syncAreaName"><a-select-option v-for="area in editorAreaOptions" :key="area.id" :value="area.id">{{ area.name }}</a-select-option></a-select></a-form-item></a-col>
          <a-col :xs="24" :md="12"><a-form-item label="规则名称" required><a-input v-model:value="form.ruleName" :disabled="editorMode === 'view'" /></a-form-item></a-col>
          <a-col :xs="24" :md="12"><a-form-item label="规则类型"><a-select v-model:value="form.ruleType" :disabled="editorMode === 'view'"><a-select-option value="advance">提前生成</a-select-option><a-select-option value="on_time">到点生成</a-select-option><a-select-option value="batch">批量滚动生成</a-select-option></a-select></a-form-item></a-col>
          <a-col :xs="24" :md="12"><a-form-item label="生效状态"><a-switch v-model:checked="form.enabled" :disabled="editorMode === 'view'" checked-children="启用" un-checked-children="停用" /></a-form-item></a-col>
          <a-col :xs="24" :md="8"><a-form-item label="提前生成时间（分钟）"><a-input-number v-model:value="form.advanceGenerateMinutes" :disabled="editorMode === 'view'" :min="0" :max="1440" /></a-form-item></a-col>
          <a-col :xs="24" :md="8"><a-form-item label="滚动生成窗口（小时）"><a-input-number v-model:value="form.generationWindowHours" :disabled="editorMode === 'view'" :min="1" :max="168" /></a-form-item></a-col>
          <a-col :xs="24" :md="8"><a-form-item label="检查频率（分钟）"><a-input-number v-model:value="form.generationIntervalMinutes" :disabled="editorMode === 'view'" :min="5" :max="240" :step="5" /></a-form-item></a-col>
          <a-col :xs="24"><a-form-item label="准入条件"><a-checkbox-group v-model:value="form.dispatchEligibilityChecks" :disabled="editorMode === 'view'"><a-checkbox value="plan_active">规划已启用</a-checkbox><a-checkbox value="resource_available">机器人资源可用</a-checkbox><a-checkbox value="route_reachable">路线可达</a-checkbox><a-checkbox value="time_window_valid">执行时间窗有效</a-checkbox><a-checkbox value="battery_enough">电量满足预计任务</a-checkbox><a-checkbox value="no_safety_block">无安全阻断</a-checkbox></a-checkbox-group></a-form-item></a-col>
          <a-col :xs="24" :md="12"><a-form-item label="不适合调度处理"><a-select v-model:value="form.unsuitablePlanStrategy" :disabled="editorMode === 'view'"><a-select-option value="manual_review">转人工复核</a-select-option><a-select-option value="defer">延后下一轮评估</a-select-option><a-select-option value="generate_pending">生成待确认任务</a-select-option></a-select></a-form-item></a-col>
          <a-col :xs="24" :md="12"><a-form-item label="资源冲突策略"><a-select v-model:value="form.resourceConflictStrategy" :disabled="editorMode === 'view'"><a-select-option value="priority_first">优先级高者先执行</a-select-option><a-select-option value="time_first">计划时间早者先执行</a-select-option><a-select-option value="manual_review">转人工复核</a-select-option></a-select></a-form-item></a-col>
        </a-row>
      </a-form>
    </a-modal>

    <a-modal v-model:open="showHelpModal" title="调度规则配置说明" width="900px" :footer="null">
      <a-table :columns="helpColumns" :data-source="helpData" :pagination="false" bordered size="small" />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useInspectionStore } from '@/stores/inspection'

type RuleType = 'advance' | 'on_time' | 'batch'
type EditorMode = 'create' | 'edit' | 'view'

interface AreaRule {
  id: string
  areaId: string
  areaName: string
  ruleName: string
  ruleType: RuleType
  enabled: boolean
  updatedAt: string
  advanceGenerateMinutes: number
  generationWindowHours: number
  generationIntervalMinutes: number
  dispatchEligibilityChecks: string[]
  unsuitablePlanStrategy: string
  resourceConflictStrategy: string
}

interface AreaOption {
  id: string
  name: string
}

const STORAGE_KEY = 'dispatch-rule-config'
const inspectionStore = useInspectionStore()
const showHelpModal = ref(false)
const editorVisible = ref(false)
const editorMode = ref<EditorMode>('create')
const editingId = ref('')
const hasLoadedRules = ref(false)

const areaOptions = computed<AreaOption[]>(() => inspectionStore.inspectionMaps.flatMap(map =>
  (map.regions || []).map(region => ({
    id: region.id,
    name: `${map.name} / ${region.name}`
  }))
))

const usedAreaIds = computed(() => new Set(rules.value.map(rule => rule.areaId)))
const availableAreaOptions = computed(() => areaOptions.value.filter(area => !usedAreaIds.value.has(area.id)))
const editorAreaOptions = computed(() => {
  if (!editingId.value) return availableAreaOptions.value
  return areaOptions.value.filter(area => area.id === form.areaId || !usedAreaIds.value.has(area.id))
})
const canCreateRule = computed(() => availableAreaOptions.value.length > 0)

const rules = ref<AreaRule[]>([])
const form = reactive<AreaRule>(createRule('', '', '', '', 'advance', true))

const columns = [
  { title: '区域名称', dataIndex: 'areaName', key: 'areaName', width: 200 },
  { title: '规则名称', dataIndex: 'ruleName', key: 'ruleName', width: 220 },
  { title: '规则类型', key: 'ruleType', width: 150 },
  { title: '生效状态', key: 'enabled', width: 130 },
  { title: '更新时间', key: 'updatedAt', width: 180 },
  { title: '操作', key: 'actions', width: 180 }
]

const helpColumns = [
  { title: '字段', dataIndex: 'field', key: 'field', width: 150 },
  { title: '作用', dataIndex: 'role', key: 'role' },
  { title: '推荐值', dataIndex: 'recommended', key: 'recommended', width: 150 },
  { title: '示例', dataIndex: 'example', key: 'example', width: 150 }
]

const helpData = [
  { key: '1', field: '区域规则', role: '一条规则只作用于一个区域，便于按现场区域独立调整生成和调度策略。', recommended: '按责任区域配置', example: 'A区提前30分钟生成' },
  { key: '2', field: '任务生成方式', role: '决定巡检规划转换为任务的触发方式。', recommended: '提前生成', example: '计划08:00执行，07:30生成任务' },
  { key: '3', field: '准入条件', role: '全部满足后才进入自动调度计算。', recommended: '全选核心条件', example: '规划启用、资源可用、路线可达' }
]

function createRule(id: string, areaId: string, areaName: string, ruleName: string, ruleType: RuleType, enabled: boolean): AreaRule {
  return {
    id,
    areaId,
    areaName,
    ruleName,
    ruleType,
    enabled,
    updatedAt: new Date().toISOString(),
    advanceGenerateMinutes: ruleType === 'advance' ? 30 : 0,
    generationWindowHours: 24,
    generationIntervalMinutes: 15,
    dispatchEligibilityChecks: ['plan_active', 'resource_available', 'route_reachable', 'time_window_valid', 'battery_enough', 'no_safety_block'],
    unsuitablePlanStrategy: 'manual_review',
    resourceConflictStrategy: 'priority_first'
  }
}

function getAreaName(areaId: string): string {
  return areaOptions.value.find(area => area.id === areaId)?.name || ''
}

function getRuleTypeByIndex(index: number): RuleType {
  return (['advance', 'batch', 'on_time'] as RuleType[])[index % 3]
}

function buildDefaultRules(): AreaRule[] {
  return areaOptions.value.map((area, index) => {
    const ruleType = getRuleTypeByIndex(index)
    return createRule(
      `dispatch-rule-${index + 1}`,
      area.id,
      area.name,
      `${area.name}${getRuleTypeText(ruleType)}规则`,
      ruleType,
      true
    )
  })
}

function normalizeRules(nextRules: AreaRule[]): AreaRule[] {
  const seenAreaIds = new Set<string>()
  return nextRules.reduce<AreaRule[]>((list, rule) => {
    const areaName = getAreaName(rule.areaId)
    if (!areaName || seenAreaIds.has(rule.areaId)) return list
    seenAreaIds.add(rule.areaId)
    list.push({ ...rule, areaName })
    return list
  }, [])
}

function persistRules() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules.value))
}

function loadRules() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as AreaRule[]
      const normalized = normalizeRules(parsed)
      rules.value = normalized.length ? normalized : buildDefaultRules()
      hasLoadedRules.value = true
      persistRules()
      return
    } catch {
      rules.value = []
    }
  }
  rules.value = buildDefaultRules()
  hasLoadedRules.value = true
  persistRules()
}

function reconcileRulesWithAreas() {
  if (!hasLoadedRules.value) return
  const normalized = normalizeRules(rules.value)
  rules.value = normalized.length ? normalized : buildDefaultRules()
  persistRules()
}

function assignForm(rule: AreaRule) {
  Object.assign(form, JSON.parse(JSON.stringify(rule)))
}

function openCreate() {
  const area = availableAreaOptions.value[0]
  if (!area) {
    message.warning('所有地图区域已配置调度规则，无法新增')
    return
  }
  editorMode.value = 'create'
  editingId.value = ''
  assignForm(createRule('', area.id, area.name, '', 'advance', true))
  editorVisible.value = true
}
function openEdit(record: AreaRule) {
  editorMode.value = 'edit'
  editingId.value = record.id
  assignForm(record)
  editorVisible.value = true
}
function openView(record: AreaRule) {
  editorMode.value = 'view'
  editingId.value = record.id
  assignForm(record)
  editorVisible.value = true
}
function syncAreaName(value: string) {
  form.areaName = getAreaName(value)
}
function saveRule() {
  if (!form.areaId || !form.ruleName.trim()) {
    message.error('请填写区域和规则名称')
    return
  }
  if (!getAreaName(form.areaId)) {
    message.error('所选区域不存在，请先在地图中维护区域')
    return
  }
  const duplicate = rules.value.find(item => item.id !== editingId.value && item.areaId === form.areaId)
  if (duplicate) {
    message.error('该区域已存在调度规则，请选择其他区域')
    return
  }
  const now = new Date().toISOString()
  const payload = { ...JSON.parse(JSON.stringify(form)), id: editingId.value || `rule-${Date.now()}`, areaName: getAreaName(form.areaId), updatedAt: now }
  if (editingId.value) rules.value = rules.value.map(item => item.id === editingId.value ? payload : item)
  else rules.value.unshift(payload)
  persistRules()
  editorVisible.value = false
  message.success('区域规则已保存')
}
function removeRule(id: string) {
  rules.value = rules.value.filter(item => item.id !== id)
  persistRules()
  message.success('区域规则已删除')
}
function touchRule(record: AreaRule) {
  record.updatedAt = new Date().toISOString()
  persistRules()
}
function getRuleTypeText(type: RuleType) {
  return ({ advance: '提前生成', on_time: '到点生成', batch: '批量滚动生成' } as Record<RuleType, string>)[type]
}
function formatDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString('zh-CN', { hour12: false })
}

onMounted(() => {
  inspectionStore.initialize()
  loadRules()
})

watch(areaOptions, reconcileRulesWithAreas)
</script>

<style scoped lang="css">
.dispatch-rule-config {
  width: 100%;
  padding-bottom: 8px;
}
.dispatch-rule-config :deep(.ant-page-header) {
  padding: 0;
}
.dispatch-rule-config :deep(.ant-input-number),
.dispatch-rule-config :deep(.ant-select) {
  width: 100%;
}
.dispatch-rule-config :deep(.ant-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
}
</style>
