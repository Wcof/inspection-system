<template>
  <a-modal
    :open="visible"
    :title="modalTitle"
    :width="960"
    :footer="null"
    :mask-closable="false"
    destroy-on-close
    @cancel="handleClose"
  >
    <!-- 来源选择 & 同步操作 -->
    <div v-if="!syncing && !candidates.length" style="margin-bottom: 16px">
      <div v-if="store.configs.length === 0" style="text-align: center; padding: 40px 0">
        <a-empty description="暂无启用配置">
          <a-button type="primary" @click="handleGoConfig">前往配置</a-button>
        </a-empty>
      </div>
      <div v-else>
        <a-form layout="inline">
          <a-form-item label="数据来源" required>
            <a-select v-model:value="selectedConfigId" style="width: 300px" placeholder="选择第三方系统">
              <a-select-option v-for="c in enabledConfigs" :key="c.id" :value="c.id">{{ c.systemName }} ({{ c.systemCode }})</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-button type="primary" :disabled="!selectedConfigId" :loading="syncing" @click="startSync">开始同步</a-button>
          </a-form-item>
        </a-form>
      </div>
    </div>

    <!-- 同步中 -->
    <div v-if="syncing" style="text-align: center; padding: 40px 0">
      <a-spin size="large" />
      <p style="margin-top: 16px">正在同步第三方任务...</p>
    </div>

    <!-- 同步结果摘要 -->
    <div v-if="summary" style="margin-bottom: 16px">
      <a-row :gutter="16">
        <a-col :span="6">
          <a-card size="small"><span>获取总数</span><strong>{{ summary.total }}</strong></a-card>
        </a-col>
        <a-col :span="6">
          <a-card size="small"><span>可创建</span><strong style="color: #52c41a">{{ summary.valid }}</strong></a-card>
        </a-col>
        <a-col :span="6">
          <a-card size="small"><span>重复</span><strong style="color: #faad14">{{ summary.duplicate }}</strong></a-card>
        </a-col>
        <a-col :span="6">
          <a-card size="small"><span>异常</span><strong style="color: #ff4d4f">{{ summary.invalid }}</strong></a-card>
        </a-col>
      </a-row>
    </div>

    <!-- 错误信息 -->
    <a-alert v-if="errorMessage" :message="errorMessage" type="error" show-icon style="margin-bottom: 16px" closable @close="errorMessage = ''" />

    <!-- 候选任务表格 -->
    <div v-if="candidates.length > 0">
      <a-table
        :data-source="candidates"
        :columns="columns"
        row-key="candidateId"
        :pagination="{ pageSize: 10 }"
        :scroll="{ y: 400 }"
        size="small"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'selection'">
            <a-checkbox
              :checked="selectedIds.has(record.candidateId)"
              :disabled="record.validationStatus !== 'valid'"
              @change="toggleSelect(record.candidateId)"
            />
          </template>
          <template v-else-if="column.key === 'validationStatus'">
            <a-tag v-if="record.validationStatus === 'valid'" color="green">有效</a-tag>
            <a-tag v-else-if="record.validationStatus === 'duplicate'" color="orange">重复</a-tag>
            <a-tag v-else color="red">无效</a-tag>
          </template>
          <template v-else-if="column.key === 'validationErrors'">
            <span v-if="record.validationErrors.length > 0" style="color: #ff4d4f; font-size: 12px">{{ record.validationErrors.join('; ') }}</span>
            <span v-else-if="record.duplicateTaskId" style="color: #faad14; font-size: 12px">已有内部任务: {{ record.duplicateTaskId }}</span>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'inspectionPoint'">
            {{ record.inspectionPointName || record.pointCode || '-' }}
          </template>
          <template v-else-if="column.key === 'priorityLevel'">
            <a-tag :color="record.priorityLevel === 'emergency' ? 'red' : record.priorityLevel === 'high' ? 'orange' : 'default'">
              {{ record.priorityLevel === 'emergency' ? '应急' : record.priorityLevel === 'high' ? '高' : '普通' }}
            </a-tag>
          </template>
        </template>
      </a-table>
    </div>

    <!-- 底部操作 -->
    <div v-if="candidates.length > 0" style="margin-top: 16px; display: flex; justify-content: space-between; align-items: center">
      <a-checkbox
        :indeterminate="indeterminate"
        :checked="checkAll"
        @change="toggleAll"
      >
        全选可创建项
      </a-checkbox>
      <a-space>
        <a-button @click="startSync" :loading="syncing" :disabled="syncing">重新同步</a-button>
        <a-button type="primary" :disabled="selectedIds.size === 0" :loading="creating" @click="confirmCreate">
          确认创建（{{ selectedIds.size }}）
        </a-button>
        <a-button @click="handleClose">关闭</a-button>
      </a-space>
    </div>

    <!-- 创建结果 -->
    <a-modal
      :open="resultVisible"
      title="同步结果"
      :footer="null"
      width="600"
      destroy-on-close
      @cancel="handleResultClose"
    >
      <a-alert
        v-if="createResult"
        :type="createResult.failed.length === 0 && createResult.duplicated.length === 0 ? 'success' : 'warning'"
        show-icon
        :message="`成功 ${createResult.created.length} 条，重复 ${createResult.duplicated.length} 条，失败 ${createResult.failed.length} 条`"
      />
      <div v-if="createResult?.failed.length" style="margin-top: 12px">
        <h4>失败详情:</h4>
        <ul>
          <li v-for="f in createResult.failed" :key="f.externalTaskId">{{ f.externalTaskId }}: {{ f.reason }}</li>
        </ul>
      </div>
      <div style="margin-top: 16px; text-align: right">
        <a-button type="primary" @click="handleResultClose">完成</a-button>
      </div>
    </a-modal>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { message } from 'ant-design-vue'
import { useInspectionStore } from '@/stores/inspection'
import { useThirdPartyIntegrationStore } from '@/stores/thirdPartyIntegration'
import { previewTasks, normalizeResponse, validateCandidates, generateMockThirdPartyTasks, generateSyncBatchId } from '@/services/thirdPartyIntegration'
import type { ThirdPartyTaskCandidate, ThirdPartySyncBatch } from '@/types/third-party'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  created: []
  'go-config': []
}>()

const inspectionStore = useInspectionStore()
const store = useThirdPartyIntegrationStore()

const selectedConfigId = ref('')
const syncing = ref(false)
const creating = ref(false)
const candidates = ref<ThirdPartyTaskCandidate[]>([])
const selectedIds = ref<Set<string>>(new Set())
const errorMessage = ref('')
const resultVisible = ref(false)
const createResult = ref<any>(null)
const currentBatchId = ref('')

const enabledConfigs = computed(() => store.getEnabledConfigs())

const columns = [
  { title: '', key: 'selection', width: 40 },
  { title: '第三方任务编号', dataIndex: 'externalTaskId', key: 'externalTaskId', width: 140 },
  { title: '任务名称', dataIndex: 'taskName', key: 'taskName', ellipsis: true },
  { title: '巡检点编码', dataIndex: 'pointCode', key: 'pointCode', width: 120 },
  { title: '匹配巡检点', key: 'inspectionPoint', width: 160 },
  { title: '计划执行时间', dataIndex: 'plannedExecuteAt', key: 'plannedExecuteAt', width: 160 },
  { title: '优先级', key: 'priorityLevel', width: 80 },
  { title: '校验状态', key: 'validationStatus', width: 80 },
  { title: '说明', key: 'validationErrors', width: 200 }
]

const summary = computed(() => {
  const valid = candidates.value.filter(c => c.validationStatus === 'valid').length
  const duplicate = candidates.value.filter(c => c.validationStatus === 'duplicate').length
  const invalid = candidates.value.filter(c => c.validationStatus === 'invalid').length
  return { total: candidates.value.length, valid, duplicate, invalid }
})

const modalTitle = computed(() => {
  if (resultVisible.value) return '同步结果'
  if (candidates.value.length > 0) return '同步第三方任务 - 确认创建'
  return '同步第三方任务'
})

const indeterminate = computed(() => {
  const validCount = candidates.value.filter(c => c.validationStatus === 'valid').length
  return selectedIds.value.size > 0 && selectedIds.value.size < validCount
})

const checkAll = computed(() => {
  const validIds = candidates.value.filter(c => c.validationStatus === 'valid').map(c => c.candidateId)
  return validIds.length > 0 && validIds.every(id => selectedIds.value.has(id))
})

function toggleSelect(candidateId: string) {
  const newSet = new Set(selectedIds.value)
  if (newSet.has(candidateId)) {
    newSet.delete(candidateId)
  } else {
    newSet.add(candidateId)
  }
  selectedIds.value = newSet
}

function toggleAll() {
  const validIds = candidates.value.filter(c => c.validationStatus === 'valid').map(c => c.candidateId)
  if (checkAll.value) {
    selectedIds.value = new Set()
  } else {
    selectedIds.value = new Set(validIds)
  }
}

async function startSync() {
  if (!selectedConfigId.value) {
    // 只有一个启用配置，自动选择
    if (enabledConfigs.value.length === 1) {
      selectedConfigId.value = enabledConfigs.value[0].id
    } else {
      message.warning('请选择数据来源')
      return
    }
  }

  syncing.value = true
  errorMessage.value = ''
  candidates.value = []
  selectedIds.value = new Set()

  try {
    const config = store.getConfigById(selectedConfigId.value)
    if (!config) {
      errorMessage.value = '配置不存在'
      return
    }

    let rawData: any[] = []

    if (config.requestMode === 'mock') {
      // Mock 模式：生成演示数据
      rawData = generateMockThirdPartyTasks(config)
    } else {
      // Direct 或 Proxy 模式：发起 HTTP 请求
      const result = await previewTasks(config)
      if (!result.success) {
        errorMessage.value = result.message
        return
      }
      rawData = result.data || []
    }

    // 标准化为候选任务
    const normalized = normalizeResponse(config, rawData)
    
    // 校验候选任务（巡检点匹配 + 重复校验）
    const validated = validateCandidates(
      normalized,
      inspectionStore.inspectionPoints,
      inspectionStore.tasks,
      config.id
    )

    candidates.value = validated
    currentBatchId.value = generateSyncBatchId()

    // 默认勾选有效项
    selectedIds.value = new Set(
      validated.filter(c => c.validationStatus === 'valid').map(c => c.candidateId)
    )

    if (validated.length === 0) {
      errorMessage.value = '未获取到任何任务数据'
    }
  } catch (e: any) {
    errorMessage.value = `同步失败: ${e.message}`
  } finally {
    syncing.value = false
  }
}

async function confirmCreate() {
  if (selectedIds.value.size === 0) return

  creating.value = true
  try {
    const config = store.getConfigById(selectedConfigId.value)
    if (!config) {
      message.error('配置不存在')
      return
    }

    const selectedCandidates = candidates.value.filter(c => selectedIds.value.has(c.candidateId))
    const syncBatchId = currentBatchId.value || generateSyncBatchId()

    const result = inspectionStore.createThirdPartyTemporaryTasks({
      candidates: selectedCandidates.map(c => ({
        sourceSystemId: c.sourceSystemId,
        sourceSystemCode: c.sourceSystemCode,
        sourceSystemName: c.sourceSystemName,
        externalTaskId: c.externalTaskId,
        taskName: c.taskName,
        pointCode: c.pointCode,
        inspectionPointId: c.inspectionPointId,
        inspectionPointName: c.inspectionPointName,
        plannedExecuteAt: c.plannedExecuteAt,
        priorityLevel: c.priorityLevel,
        riskLevel: c.riskLevel,
        businessScene: c.businessScene,
        robotId: c.robotId
      })),
      syncBatchId,
      sourceSystemId: config.id,
      sourceSystemCode: config.systemCode,
      sourceSystemName: config.systemName,
      defaultRobotId: config.defaults.robotId,
      defaultBusinessScene: config.defaults.businessScene,
      defaultPriorityLevel: config.defaults.priorityLevel,
      defaultRiskLevel: config.defaults.riskLevel
    })

    createResult.value = result

    // 保存同步批次记录
    const batch: ThirdPartySyncBatch = {
      id: syncBatchId,
      configId: config.id,
      sourceSystemId: config.id,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString(),
      receivedCount: candidates.value.length,
      validCount: candidates.value.filter(c => c.validationStatus === 'valid').length,
      duplicateCount: candidates.value.filter(c => c.validationStatus === 'duplicate').length + result.duplicated.length,
      invalidCount: candidates.value.filter(c => c.validationStatus === 'invalid').length,
      createdCount: result.created.length,
      status: result.created.length > 0 ? (result.failed.length > 0 ? 'partial' : 'completed') : 'failed',
      errorMessage: result.failed.length > 0 ? `${result.failed.length} 条创建失败` : undefined
    }
    store.saveSyncBatch(batch)

    resultVisible.value = true
  } catch (e: any) {
    message.error(`创建失败: ${e.message}`)
  } finally {
    creating.value = false
  }
}

function handleClose() {
  candidates.value = []
  selectedIds.value = new Set()
  errorMessage.value = ''
  resultVisible.value = false
  emit('close')
}

function handleResultClose() {
  resultVisible.value = false
  emit('created')
}

function handleGoConfig() {
  emit('go-config')
}

watch(() => props.visible, (val) => {
  if (val) {
    store.fetchConfigs()
    selectedConfigId.value = ''
    candidates.value = []
    selectedIds.value = new Set()
    errorMessage.value = ''
    resultVisible.value = false
    // 只有一个启用配置时自动选择
    if (enabledConfigs.value.length === 1) {
      selectedConfigId.value = enabledConfigs.value[0].id
    }
  }
})
</script>