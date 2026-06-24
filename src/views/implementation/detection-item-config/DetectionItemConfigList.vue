<template>
  <div>
    <a-page-header title="检测规则配置" sub-title="标准检测能力库，供巡检对象配置引用">
      <template #extra>
        <a-button type="primary" @click="goCreate">新增规则</a-button>
      </template>
    </a-page-header>

    <a-card style="margin-top: 16px">
      <a-form layout="vertical" @submit.prevent>
        <a-row :gutter="[16, 8]">
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="规则名称">
              <a-input v-model:value="query.name" allow-clear />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="检测类型">
              <a-select v-model:value="query.detectionType" allow-clear>
                <a-select-option v-for="value in detectionTypeOptions" :key="value" :value="value">{{ value }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="检测算法">
              <a-select v-model:value="query.detectionAlgorithm" allow-clear show-search option-filter-prop="label">
                <a-select-option v-for="value in algorithmSelectOptions" :key="value" :value="value" :label="value">{{ value }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="状态">
              <a-select v-model:value="query.status" allow-clear>
                <a-select-option v-for="value in statuses" :key="value" :value="value">{{ value }}</a-select-option>
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
          <template v-else-if="column.key === 'llmEnabled'">
            <a-tag :color="record.rules?.some((r: any) => r.llmEnabled) ? 'blue' : 'default'">
              {{ record.rules?.some((r: any) => r.llmEnabled) ? '已开启' : '未开启' }}
            </a-tag>
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
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Modal, message } from 'ant-design-vue'
import {
  deleteDetectionItemConfig,
  detectionAlgorithmOptions,
  detectionTypeOptions,
  getDetectionItemConfigs,
  saveDetectionItemConfigs,
  type DetectionItemConfig,
  type DetectionType,
  type PublishStatus
} from './model'

const router = useRouter()
const rows = ref<DetectionItemConfig[]>(getDetectionItemConfigs())
const statuses: PublishStatus[] = ['草稿', '启用', '停用']

const query = reactive({
  name: '',
  detectionType: '',
  detectionAlgorithm: '',
  status: ''
})

const columns = [
  { title: '规则名称', dataIndex: 'name', key: 'name', width: 180 },
  { title: '规则编码', dataIndex: 'code', key: 'code', width: 180 },
  { title: '检测类型', dataIndex: 'detectionType', key: 'detectionType', width: 120 },
  { title: '检测算法', dataIndex: 'detectionAlgorithm', key: 'detectionAlgorithm', width: 180 },
  { title: '大模型增强', key: 'llmEnabled', width: 120 },
  { title: '结果数量', key: 'resultCount', width: 100 },
  { title: '版本', dataIndex: 'version', key: 'version', width: 100 },
  { title: '引用数量', dataIndex: 'referenceCount', key: 'referenceCount', width: 100 },
  { title: '状态', key: 'status', width: 100 },
  { title: '更新时间', key: 'updatedAt', width: 180 },
  { title: '操作', key: 'actions', width: 220, fixed: 'right' as const }
]

const algorithmSelectOptions = computed(() => {
  if (query.detectionType) return detectionAlgorithmOptions[query.detectionType as DetectionType]
  return Array.from(new Set(Object.values(detectionAlgorithmOptions).flat()))
})

const filteredRows = computed(() => rows.value
  .filter(item => !query.name || item.name.includes(query.name.trim()))
  .filter(item => !query.detectionType || item.detectionType === query.detectionType)
  .filter(item => !query.detectionAlgorithm || item.detectionAlgorithm === query.detectionAlgorithm)
  .filter(item => !query.status || item.status === query.status)
  .map(item => ({ ...item, resultCount: item.results.length }))
)

function refresh() {
  rows.value = getDetectionItemConfigs()
}

function resetQuery() {
  query.name = ''
  query.detectionType = ''
  query.detectionAlgorithm = ''
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
  router.push('/implementation/detection-item-config/create')
}

function goEdit(id: string) {
  router.push(`/implementation/detection-item-config/edit/${id}`)
}

function goDetail(id: string) {
  router.push(`/implementation/detection-item-config/detail/${id}`)
}

function isPublishable(record: DetectionItemConfig) {
  return Boolean(record.name && record.code && record.detectionType && record.detectionAlgorithm && record.results.length)
}

function toggleStatus(record: DetectionItemConfig) {
  if (record.status !== '启用') {
    if (!isPublishable(record)) {
      message.error('启用前请补全规则名称、编码、检测类型、检测算法和结果定义')
      return
    }
    record.status = '启用'
    record.publishStatus = '启用'
    record.enabled = true
  } else {
    record.status = '停用'
    record.publishStatus = '停用'
    record.enabled = false
  }
  record.updatedAt = new Date().toISOString()
  saveDetectionItemConfigs(rows.value)
  refresh()
}

function remove(id: string) {
  const current = rows.value.find(item => item.id === id)
  if (current?.referenceCount) {
    message.error('当前规则已被引用，无法删除')
    return
  }
  Modal.confirm({
    title: '确认删除该规则？',
    okText: '确认',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk() {
      deleteDetectionItemConfig(id)
      refresh()
      message.success('已删除')
    }
  })
}
</script>
