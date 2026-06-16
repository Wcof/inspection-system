<template>
  <div class="component-usage-list">
    <a-page-header title="巡检对象" sub-title="独立维护巡检对象，按区域/装置/设施/类型筛选，并通过规则库完成检测规则关联" />

    <a-layout class="usage-layout">
      <a-layout-sider width="280" class="tree-sider">
        <div class="tree-panel">
          <div class="tree-title">区域/装置筛选</div>
          <a-input v-model:value="treeSearchValue" placeholder="搜索区域/装置/设施设备" allow-clear style="margin-bottom: 12px" />
          <a-tree v-model:selectedKeys="selectedTreeKeys" :tree-data="filteredTreeData" default-expand-all />
        </div>
      </a-layout-sider>

      <a-layout-content class="list-content">
        <a-card style="margin-bottom: 12px">
          <a-form layout="vertical" @submit.prevent>
            <a-row :gutter="[16, 8]">
              <a-col :xs="24" :sm="12" :md="8" :lg="4">
                <a-form-item label="巡检对象名称"><a-input v-model:value="filters.name" allow-clear placeholder="名称" /></a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="8" :lg="4">
                <a-form-item label="巡检对象类型">
                  <a-select v-model:value="filters.componentType" allow-clear placeholder="类型">
                    <a-select-option v-for="item in componentTypeOptions" :key="item.value" :value="item.value">{{ item.label }}</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="8" :lg="4">
                <a-form-item label="优先级">
                  <a-select v-model:value="filters.priority" allow-clear placeholder="优先级">
                    <a-select-option value="high">高</a-select-option>
                    <a-select-option value="medium">中</a-select-option>
                    <a-select-option value="low">低</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="8" :lg="4">
                <a-form-item label="检测类型">
                  <a-select v-model:value="filters.detectionType" allow-clear placeholder="检测类型">
                    <a-select-option v-for="t in detectionTypeOptions" :key="t" :value="t">{{ t }}</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :xs="24" :sm="12" :md="8" :lg="4">
                <a-form-item label="检测规则"><a-input v-model:value="filters.ruleName" allow-clear placeholder="规则名称" /></a-form-item>
              </a-col>
            </a-row>
          </a-form>

          <div class="actions-row">
            <a-space>
              <a-button @click="resetFilters">重置</a-button>
              <a-button type="primary" @click="goCreate">新增巡检对象</a-button>
            </a-space>
          </div>

          <a-table :columns="columns" :data-source="filteredRows" row-key="id" :pagination="{ pageSize: 10 }" :scroll="{ x: 2200 }">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'componentType'">{{ getComponentTypeText(record.componentType) }}</template>
              <template v-else-if="column.key === 'priority'">
                <a-tag :color="priorityColor(record.priority)">{{ priorityText(record.priority) }}</a-tag>
              </template>
              <template v-else-if="column.key === 'cycle'">{{ record.inspectionCycle || '-' }}</template>
              <template v-else-if="column.key === 'window'">{{ record.inspectionWindow || '-' }}</template>
              <template v-else-if="column.key === 'reference'">
                <img v-if="record.referenceImageUrl" :src="record.referenceImageUrl" class="thumb" alt="reference" />
                <span v-else>-</span>
              </template>
              <template v-else-if="column.key === 'detectionType'">{{ getDetectionTypeSummary(record.ruleIds) }}</template>
              <template v-else-if="column.key === 'detectionRules'">{{ getDetectionRuleSummary(record.ruleIds) }}</template>
              <template v-else-if="column.key === 'detectionAlgorithms'">{{ getDetectionAlgorithmSummary(record.ruleIds) }}</template>
              <template v-else-if="column.key === 'status'">
                <a-tag :color="record.status === 'active' ? 'green' : record.status === 'maintenance' ? 'gold' : 'default'">{{ getStatusText(record.status) }}</a-tag>
              </template>
              <template v-else-if="column.key === 'ruleCount'">{{ record.ruleIds.length }}</template>
              <template v-else-if="column.key === 'actions'">
                <a-space>
                  <a-button type="link" size="small" @click="goToDetail(record.id)">详情</a-button>
                  <a-button type="link" size="small" @click="goToEdit(record.id)">编辑</a-button>
                  <a-button type="link" size="small" danger @click="remove(record.id)">删除</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-layout-content>
    </a-layout>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Modal, message } from 'ant-design-vue'
import { useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import { getDetectionItemConfigs, detectionTypeOptions } from '@/views/implementation/detection-item-config/model'

const inspectionStore = useInspectionStore()
const router = useRouter()
const ruleLibrary = computed(() => getDetectionItemConfigs())

// ── 树筛选 ──
const treeSearchValue = ref('')
const selectedTreeKeys = ref<string[]>(['all'])

const areas = computed(() => {
  const map = new Map<string, { id: string; name: string }>()
  inspectionStore.installations.forEach((inst: any) => {
    if (inst.areaId && !map.has(inst.areaId)) {
      map.set(inst.areaId, { id: inst.areaId, name: inst.areaName || inst.areaId })
    }
  })
  if (map.size === 0) {
    inspectionStore.inspectionPoints.forEach((point: any) => {
      if (point.areaId && !map.has(point.areaId)) {
        map.set(point.areaId, { id: point.areaId, name: point.areaName || point.areaId })
      }
    })
  }
  return Array.from(map.values())
})

const treeData = computed(() => [{
  title: '全部',
  key: 'all',
  children: areas.value.map((area) => ({
    title: area.name,
    key: `area:${area.id}`,
    children: inspectionStore.installations
      .filter((inst: any) => inst.areaId === area.id)
      .map((inst: any) => ({
        title: inst.name,
        key: `installation:${inst.id}`,
        children: inspectionStore.inspectionDevices
          .filter((device: any) => device.installationId === inst.id)
          .map((device: any) => ({
            title: device.name,
            key: `device:${device.id}`,
            children: (device.assetComponents || []).map((comp: any) => ({
              title: comp.name,
              key: `component:${device.id}:${comp.id}`
            }))
          }))
      }))
  }))
}])

function filterTree(nodes: any[], keyword: string): any[] {
  if (!keyword) return nodes
  return nodes
    .map((node) => {
      const children = filterTree(node.children || [], keyword)
      const matched = String(node.title || '').toLowerCase().includes(keyword)
      return matched || children.length ? { ...node, children } : null
    })
    .filter(Boolean) as any[]
}

const filteredTreeData = computed(() => filterTree(treeData.value, treeSearchValue.value.trim().toLowerCase()))
const selectedTreeKey = computed(() => selectedTreeKeys.value[0] || 'all')

// ── 巡检对象类型 ──
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

// ── 表格列 ──
const columns = [
  { title: '巡检对象编号', dataIndex: 'componentNo', key: 'componentNo', width: 140 },
  { title: '巡检对象名称', dataIndex: 'name', key: 'name', width: 150 },
  { title: '巡检对象位号', dataIndex: 'componentPositionNo', key: 'componentPositionNo', width: 130 },
  { title: '巡检对象类型', key: 'componentType', width: 120 },
  { title: '巡检区域', dataIndex: 'areaName', key: 'areaName', width: 120 },
  { title: '所属装置', dataIndex: 'installationName', key: 'installationName', width: 130 },
  { title: '所属设施', dataIndex: 'facilityName', key: 'facilityName', width: 150 },
  { title: '优先级', key: 'priority', width: 90 },
  { title: '巡检周期', key: 'cycle', width: 100 },
  { title: '巡检窗口', key: 'window', width: 120 },
  { title: '参考图', key: 'reference', width: 100 },
  { title: '检测类型', key: 'detectionType', width: 120 },
  { title: '检测规则', key: 'detectionRules', width: 180 },
  { title: '检测规则数', key: 'ruleCount', width: 100 },
  { title: '操作', key: 'actions', width: 170, fixed: 'right' as const }
]

// ── 筛选逻辑 ──
const filters = reactive({ name: '', componentType: '', priority: '', detectionType: '', ruleName: '' })

const filteredRows = computed(() => {
  let rows = inspectionStore.facilityComponents

  // 树筛选
  const key = selectedTreeKey.value
  if (key !== 'all') {
    rows = rows.filter((row: any) => {
      if (key.startsWith('area:')) return row.areaId === key.replace('area:', '')
      if (key.startsWith('installation:')) return row.installationId === key.replace('installation:', '')
      if (key.startsWith('device:')) return row.facilityId === key.replace('device:', '')
      if (key.startsWith('component:')) {
        const [, deviceId, compId] = key.split(':')
        return row.facilityId === deviceId && row.id === compId
      }
      return true
    })
  }

  // 列表筛选
  return rows.filter((row) => {
    const byName = !filters.name || row.name.toLowerCase().includes(filters.name.trim().toLowerCase())
    const byType = !filters.componentType || row.componentType === filters.componentType
    const byPriority = !filters.priority || row.priority === filters.priority
    const byDetectionType = !filters.detectionType || getDetectionTypeSummary(row.ruleIds).includes(filters.detectionType)
    const byRuleName = !filters.ruleName || getDetectionRuleSummary(row.ruleIds).toLowerCase().includes(filters.ruleName.trim().toLowerCase())
    return byName && byType && byPriority && byDetectionType && byRuleName
  })
})

// ── 规则相关 ──
function getRules(ruleIds: string[]) {
  return ruleIds.map((id) => ruleLibrary.value.find((item) => item.id === id)).filter(Boolean)
}

function getDetectionTypeSummary(ruleIds: string[]) {
  const text = Array.from(new Set(getRules(ruleIds).map((item: any) => item.detectionType))).join('、')
  return text || '-'
}

function getDetectionRuleSummary(ruleIds: string[]) {
  const text = getRules(ruleIds).map((item: any) => item.name).join('、')
  return text || '-'
}

function getDetectionAlgorithmSummary(ruleIds: string[]) {
  const text = Array.from(new Set(getRules(ruleIds).map((item: any) => item.detectionAlgorithm))).join('、')
  return text || '-'
}

// ── 优先级 ──
function priorityText(value?: string) {
  if (value === 'high') return '高'
  if (value === 'low') return '低'
  return '中'
}

function priorityColor(value?: string) {
  if (value === 'high') return 'red'
  if (value === 'low') return 'default'
  return 'blue'
}

// ── 操作 ──
function resetFilters() {
  filters.name = ''
  filters.componentType = ''
  filters.priority = ''
  filters.detectionType = ''
  filters.ruleName = ''
}

function goCreate() {
  router.push('/implementation/device/component-usage/form')
}

function goToEdit(componentId: string) {
  router.push(`/implementation/device/component-usage/form/${componentId}`)
}

function remove(id: string) {
  Modal.confirm({
    title: '确认删除该巡检对象？',
    okText: '确认',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk() {
      inspectionStore.deleteFacilityComponent(id)
      message.success('巡检对象已删除')
    }
  })
}

function goToDetail(componentId: string) {
  router.push(`/implementation/device/component-usage/detail/${componentId}`)
}

function getComponentTypeText(type: string) {
  return componentTypeOptions.find((item) => item.value === type)?.label || type
}

function getStatusText(status: string) {
  if (status === 'maintenance') return '维护中'
  if (status === 'inactive') return '停用'
  return '在用'
}

onMounted(() => inspectionStore.initialize())
</script>

<style scoped>
.usage-layout {
  margin-top: 16px;
  gap: 16px;
  background: transparent;
}

.list-content {
  min-width: 0;
}

.tree-sider {
  background: transparent;
}

.tree-panel {
  padding: 12px;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
}

.tree-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 12px;
}

.actions-row {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 10px;
}

.thumb {
  width: 72px;
  height: 44px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}
</style>
