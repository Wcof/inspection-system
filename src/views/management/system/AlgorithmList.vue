<template>
  <div>
    <a-page-header title="检测算法配置" sub-title="检测类型下可引用的算法字典，供检测规则引用">
      <template #extra>
        <a-tooltip title="新增一个检测算法配置">
          <a-button type="primary" @click="openCreate">新增</a-button>
        </a-tooltip>
      </template>
    </a-page-header>

    <a-card style="margin-top: 16px">
      <a-alert type="info" show-icon closable style="margin-bottom: 16px">
        <template #message>
          <div style="font-size: 13px">
            <strong>💡 使用指引：</strong>
            检测算法配置为字典列表，供检测规则引用。可新增和删除，删除后不影响已有引用记录。
          </div>
        </template>
      </a-alert>

      <a-form layout="vertical" @submit.prevent>
        <a-row :gutter="[16, 8]">
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="算法名称">
              <a-input v-model:value="query.name" allow-clear placeholder="请输入算法名称" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6">
            <a-form-item label="检测类型">
              <a-select v-model:value="query.detectionType" allow-clear placeholder="全部">
                <a-select-option v-for="t in algorithmDetectionTypeOptions" :key="t" :value="t">{{ t }}</a-select-option>
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

      <a-table :columns="columns" :data-source="filteredRows" row-key="id" :scroll="{ x: 900 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'modelType'">
            <a-tag :color="record.modelType === 'small' ? 'blue' : 'purple'">
              {{ record.modelType === 'small' ? '小模型' : '大模型' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'createdAt'">
            {{ formatDate(record.createdAt) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="openDetail(record)">查看</a-button>
              <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
              <a-popconfirm
                title="确认删除该配置？"
                ok-text="确认"
                cancel-text="取消"
                @confirm="remove(record)"
              >
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 新增弹窗 -->
    <a-modal
      v-model:open="formVisible"
      title="新增检测算法配置"
      :confirm-loading="submitting"
      width="560px"
      @ok="submit"
      @cancel="formVisible = false"
    >
      <a-form ref="formRef" :model="form" :rules="rules" layout="vertical">
        <a-form-item label="检测类型" name="detectionType">
          <a-select v-model:value="form.detectionType" placeholder="请选择检测类型">
            <a-select-option v-for="t in algorithmDetectionTypeOptions" :key="t" :value="t">{{ t }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="算法名称" name="name">
          <a-input v-model:value="form.name" placeholder="请输入算法名称" allow-clear />
        </a-form-item>
        <a-form-item label="算法类型" name="modelType">
          <a-radio-group v-model:value="form.modelType">
            <a-radio value="small">小模型</a-radio>
            <a-radio value="large">大模型</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="备注" name="remark">
          <a-textarea v-model:value="form.remark" :rows="3" placeholder="算法用途、适用场景等" allow-clear />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 编辑弹窗 -->
    <a-modal
      v-model:open="editFormVisible"
      title="编辑检测算法配置"
      :confirm-loading="submitting"
      width="560px"
      @ok="submitEdit"
      @cancel="editFormVisible = false"
    >
      <a-form ref="editFormRef" :model="editForm" :rules="rules" layout="vertical">
        <a-form-item label="检测类型" name="detectionType">
          <a-select v-model:value="editForm.detectionType" placeholder="请选择检测类型">
            <a-select-option v-for="t in algorithmDetectionTypeOptions" :key="t" :value="t">{{ t }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="算法名称" name="name">
          <a-input v-model:value="editForm.name" placeholder="请输入算法名称" allow-clear />
        </a-form-item>
        <a-form-item label="算法类型" name="modelType">
          <a-radio-group v-model:value="editForm.modelType">
            <a-radio value="small">小模型</a-radio>
            <a-radio value="large">大模型</a-radio>
          </a-radio-group>
        </a-form-item>
        <a-form-item label="备注" name="remark">
          <a-textarea v-model:value="editForm.remark" :rows="3" placeholder="算法用途、适用场景等" allow-clear />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 查看详情弹窗 -->
    <a-modal
      v-model:open="detailVisible"
      title="查看检测算法配置"
      :footer="null"
      width="560px"
      @cancel="detailVisible = false"
    >
      <a-descriptions :column="1" bordered size="small" v-if="detailRecord">
        <a-descriptions-item label="检测类型">{{ detailRecord.detectionType }}</a-descriptions-item>
        <a-descriptions-item label="算法名称">{{ detailRecord.name }}</a-descriptions-item>
        <a-descriptions-item label="算法类型">
          <a-tag :color="detailRecord.modelType === 'small' ? 'blue' : 'purple'">
            {{ detailRecord.modelType === 'small' ? '小模型' : '大模型' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="备注">{{ detailRecord.remark || '-' }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ formatDate(detailRecord.createdAt) }}</a-descriptions-item>
      </a-descriptions>
      <div style="text-align: right; margin-top: 16px">
        <a-button type="primary" @click="detailVisible = false">知道了</a-button>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { message, type FormInstance } from 'ant-design-vue'
import { MockService } from '@/mock/mockService'
import { algorithmDetectionTypeOptions } from '@/types/ai'
import type { DetectionAlgorithmConfig } from '@/types/ai'

const rows = ref<DetectionAlgorithmConfig[]>(MockService.getDetectionAlgorithmConfigs())

const query = reactive({
  name: '',
  detectionType: ''
})

const columns = [
  { title: '检测类型', dataIndex: 'detectionType', key: 'detectionType', width: 140 },
  { title: '算法名称', dataIndex: 'name', key: 'name', width: 200 },
  { title: '算法类型', key: 'modelType', width: 100 },
  { title: '备注', dataIndex: 'remark', key: 'remark', width: 240, ellipsis: true },
  { title: '创建时间', key: 'createdAt', width: 180 },
  { title: '操作', key: 'actions', width: 220, fixed: 'right' as const }
]

const filteredRows = computed(() => rows.value
  .filter(item => !query.name || item.name.toLowerCase().includes(query.name.trim().toLowerCase()))
  .filter(item => !query.detectionType || item.detectionType === query.detectionType)
)

function refresh() {
  rows.value = MockService.getDetectionAlgorithmConfigs()
}

function resetQuery() {
  query.name = ''
  query.detectionType = ''
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

// ── 新增 ──
const formVisible = ref(false)
const submitting = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  detectionType: '',
  name: '',
  modelType: 'small' as 'small' | 'large',
  remark: ''
})

const rules = {
  detectionType: [{ required: true, message: '请选择检测类型' }],
  name: [{ required: true, message: '请输入算法名称' }],
  modelType: [{ required: true, message: '请选择算法类型' }]
}

function resetForm() {
  form.detectionType = ''
  form.name = ''
  form.modelType = 'small'
  form.remark = ''
}

function openCreate() {
  resetForm()
  formVisible.value = true
}

function submit() {
  formRef.value?.validate().then(() => {
    submitting.value = true
    const payload: DetectionAlgorithmConfig = {
      id: `dac-${Date.now()}`,
      detectionType: form.detectionType,
      name: form.name.trim(),
      modelType: form.modelType,
      remark: form.remark.trim() || undefined,
      createdAt: new Date().toISOString()
    }
    MockService.saveDetectionAlgorithmConfig(payload)
    submitting.value = false
    formVisible.value = false
    refresh()
    message.success('已新增')
  }).catch(() => {})
}

// ── 编辑 ──
const editFormVisible = ref(false)
const editFormRef = ref<FormInstance>()

const editForm = reactive({
  id: '',
  detectionType: '',
  name: '',
  modelType: 'small' as 'small' | 'large',
  remark: ''
})

function resetEditForm() {
  editForm.id = ''
  editForm.detectionType = ''
  editForm.name = ''
  editForm.modelType = 'small'
  editForm.remark = ''
}

function openEdit(record: DetectionAlgorithmConfig) {
  resetEditForm()
  editForm.id = record.id
  editForm.detectionType = record.detectionType
  editForm.name = record.name
  editForm.modelType = record.modelType
  editForm.remark = record.remark || ''
  editFormVisible.value = true
}

function submitEdit() {
  editFormRef.value?.validate().then(() => {
    submitting.value = true
    const payload: DetectionAlgorithmConfig = {
      id: editForm.id,
      detectionType: editForm.detectionType,
      name: editForm.name.trim(),
      modelType: editForm.modelType,
      remark: editForm.remark.trim() || undefined,
      createdAt: new Date().toISOString()
    }
    MockService.saveDetectionAlgorithmConfig(payload)
    submitting.value = false
    editFormVisible.value = false
    refresh()
    message.success('已更新')
  }).catch(() => {})
}

// ── 查看详情 ──
const detailVisible = ref(false)
const detailRecord = ref<DetectionAlgorithmConfig | null>(null)

function openDetail(record: DetectionAlgorithmConfig) {
  detailRecord.value = record
  detailVisible.value = true
}

// ── 删除 ──
function remove(record: DetectionAlgorithmConfig) {
  MockService.deleteDetectionAlgorithmConfig(record.id)
  refresh()
  message.success('已删除')
}
</script>
