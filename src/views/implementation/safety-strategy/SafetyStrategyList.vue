<template>
  <div>
    <a-page-header title="安全策略配置" sub-title="安全策略规则库，供调度配置引用">
      <template #extra>
        <a-space>
          <a-button @click="showHelpModal = true">说明</a-button>
          <a-button type="primary" @click="goCreate">新增策略</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-card style="margin-top: 16px">
      <a-form layout="vertical" @submit.prevent>
        <a-row :gutter="[16, 8]">
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="策略名称">
              <a-input v-model:value="query.name" allow-clear />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="优先级">
              <a-select v-model:value="query.priority" allow-clear>
                <a-select-option v-for="opt in priorityOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="状态">
              <a-select v-model:value="query.status" allow-clear>
                <a-select-option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>

      <div style="display: flex; justify-content: flex-end; margin-bottom: 12px">
        <a-space>
          <a-button @click="resetQuery">重置</a-button>
        </a-space>
      </div>

      <a-table :columns="columns" :data-source="filteredRows" row-key="id" :scroll="{ x: 1400 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getStatusColor(record.status)">{{ record.status }}</a-tag>
          </template>
          <template v-else-if="column.key === 'priority'">
            <a-tag :color="record.priority === 'high' ? 'red' : record.priority === 'medium' ? 'orange' : 'blue'">
              {{ priorityMap[record.priority as Priority] ?? record.priority }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'speedRange'">
            {{ record.normalSpeed }} / {{ record.maxSpeed }} km/h
          </template>
          <template v-else-if="column.key === 'safeDistance'">
            {{ record.minSafeDistance }}m +{{ record.speedExpansionFactor }}%
          </template>
          <template v-else-if="column.key === 'avoidance'">
            膨胀{{ record.obstacleExpansionMin }}-{{ record.obstacleExpansionMax }}%
            <a-tag v-if="record.allowEdgePass" color="warning" size="small" style="margin-left: 4px">允许擦边</a-tag>
          </template>
          <template v-else-if="column.key === 'specialScenarios'">
            <a-space :size="4" wrap>
              <a-tag v-if="record.narrowRoad.enabled" color="orange" size="small">窄道</a-tag>
              <a-tag v-if="record.bridge.enabled" color="purple" size="small">便桥</a-tag>
              <a-tag v-if="record.blindCorner.enabled" color="red" size="small">盲区</a-tag>
              <span v-if="!record.narrowRoad.enabled && !record.bridge.enabled && !record.blindCorner.enabled" style="color: #999">—</span>
            </a-space>
          </template>
          <template v-else-if="column.key === 'updatedAt'">
            {{ formatDate(record.updatedAt) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="goDetail(record.id)">详情</a-button>
              <a-button type="link" size="small" @click="goEdit(record.id)">编辑</a-button>
              <a-button type="link" size="small" @click="toggleStatus(record)">{{ record.status === '启用' ? '停用' : '启用' }}</a-button>
              <a-button type="link" size="small" danger @click="remove(record.id)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 说明弹窗 -->
    <a-modal v-model:open="showHelpModal" title="安全策略配置说明" width="860px" :footer="null">
      <a-descriptions bordered :column="1" size="small">
        <a-descriptions-item label="安全距离公式">
          实际安全距离 = 最小安全距离 × (1 + 当前速度 × 速度膨胀系数 / 100)
        </a-descriptions-item>
        <a-descriptions-item label="避障膨胀">
          正常通行时，机器人与障碍物之间保持的距离 = 实际安全距离 × (1 + 膨胀系数/100)。膨胀系数在最小值和最大值之间，根据通道宽度自适应。
        </a-descriptions-item>
        <a-descriptions-item label="擦边通行">
          仅在窄道等通行条件极有限的场景下启用。此时机器人贴近最小安全距离行驶，要求通道宽度 ≥ 擦边最小通道宽度。
        </a-descriptions-item>
        <a-descriptions-item label="速度自适应">
          前方检测距离内无障碍物时以最高限速行驶；有障碍物时降至正常速度。不同区域可配置不同的检测距离。
        </a-descriptions-item>
        <a-descriptions-item label="特殊路段">
          窄道、便桥、转角盲区可独立启用。启用后自动覆盖该区域的限速和安全距离，并可开启语音播报提醒现场人员。
        </a-descriptions-item>
        <a-descriptions-item label="遥控安全">
          远程遥控时，超过指令超时时间无新指令，车机自动执行降速或停车。遥控时可选择是否保持避障功能。
        </a-descriptions-item>
        <a-descriptions-item label="优先级">
          当机器人同时处于多个区域边界时，按优先级（高 > 中 > 低）匹配策略。
        </a-descriptions-item>
      </a-descriptions>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Modal, message } from 'ant-design-vue'
import {
  deleteSafetyStrategy,
  getSafetyStrategies,
  saveSafetyStrategies,
  priorityMap,
  priorityOptions,
  statusOptions,
  type Priority,
  type PublishStatus,
  type SafetyStrategy
} from './model'

const router = useRouter()
const rows = ref<SafetyStrategy[]>(getSafetyStrategies())
const showHelpModal = ref(false)

const query = reactive({
  name: '',
  priority: '',
  status: ''
})

const columns = [
  { title: '策略名称', dataIndex: 'name', key: 'name', width: 160 },
  { title: '优先级', key: 'priority', width: 80, align: 'center' as const },
  { title: '状态', key: 'status', width: 80, align: 'center' as const },
  { title: '正常/最高限速', key: 'speedRange', width: 130 },
  { title: '安全距离+膨胀', key: 'safeDistance', width: 140 },
  { title: '避障膨胀', key: 'avoidance', width: 180 },
  { title: '特殊路段', key: 'specialScenarios', width: 140 },
  { title: '引用数量', dataIndex: 'referenceCount', key: 'referenceCount', width: 100 },
  { title: '更新时间', key: 'updatedAt', width: 180 },
  { title: '操作', key: 'actions', width: 220, fixed: 'right' as const }
]

const filteredRows = computed(() => rows.value
  .filter(item => !query.name || item.name.includes(query.name.trim()))
  .filter(item => !query.priority || item.priority === query.priority)
  .filter(item => !query.status || item.status === query.status)
)

function refresh() {
  rows.value = getSafetyStrategies()
}

function resetQuery() {
  query.name = ''
  query.priority = ''
  query.status = ''
}

function getStatusColor(status: PublishStatus) {
  if (status === '启用') return 'green'
  if (status === '草稿') return 'gold'
  return 'default'
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

function goCreate() {
  router.push('/implementation/safety-strategy/create')
}

function goEdit(id: string) {
  router.push(`/implementation/safety-strategy/edit/${id}`)
}

function goDetail(id: string) {
  router.push(`/implementation/safety-strategy/detail/${id}`)
}

function toggleStatus(record: SafetyStrategy) {
  if (record.status !== '启用') {
    if (!record.name.trim()) {
      message.error('启用前请补全策略名称')
      return
    }
    record.status = '启用'
    record.enabled = true
  } else {
    record.status = '停用'
    record.enabled = false
  }
  record.updatedAt = new Date().toISOString()
  saveSafetyStrategies(rows.value)
  refresh()
}

function remove(id: string) {
  const current = rows.value.find(item => item.id === id)
  if (current?.referenceCount) {
    message.error('当前策略已被引用，无法删除')
    return
  }
  Modal.confirm({
    title: '确认删除该安全策略？',
    okText: '确认',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk() {
      deleteSafetyStrategy(id)
      refresh()
      message.success('已删除')
    }
  })
}
</script>
