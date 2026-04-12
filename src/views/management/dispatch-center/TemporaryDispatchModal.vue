<template>
  <a-modal
    :visible="visible"
    title="临时任务"
    width="700px"
    :zIndex="3000"
    ok-text="提交调度"
    cancel-text="取消"
    @ok="handleSubmit"
    @cancel="handleCancel"
  >
    <a-form layout="vertical" :model="form">
      <a-row :gutter="12">
        <a-col :span="12">
          <a-form-item label="任务名称" required>
            <a-input v-model:value="form.name" placeholder="请输入临时调度任务名称" />
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="任务类型" required>
            <a-select v-model:value="form.taskType">
              <a-select-option value="inspection">巡检任务</a-select-option>
              <a-select-option value="charging">充电任务</a-select-option>
              <a-select-option value="parking">停车任务</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="12">
        <a-col :span="12">
          <a-form-item label="机器人" required>
            <a-select v-model:value="form.robotId" placeholder="请选择机器人">
              <a-select-option v-for="robot in robotOptions" :key="robot.value" :value="robot.value">
                {{ robot.label }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="计划执行时间" required>
            <a-input v-model:value="form.scheduledAt" placeholder="例如 2026-04-12 15:30" />
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="12">
        <a-col :span="24">
          <a-form-item v-if="form.taskType === 'inspection'" label="巡检点（可多选）" required>
            <div class="inspection-transfer-tools">
              <a-space>
                <a-button size="small" @click="selectAllInspectionPoints">全选</a-button>
                <a-button size="small" @click="clearInspectionPoints">清空</a-button>
                <span class="selected-count">已选 {{ form.targetPointIds?.length || 0 }} 个</span>
              </a-space>
            </div>
            <a-transfer
              :target-keys="form.targetPointIds || []"
              :data-source="inspectionTransferData"
              :show-search="true"
              :filter-option="filterInspectionOption"
              :list-style="{ width: '100%', height: '260px' }"
              :titles="['可选巡检点', '已选巡检点']"
              @change="handleInspectionTransferChange"
            >
              <template #render="{ label }">
                {{ label }}
              </template>
            </a-transfer>
          </a-form-item>
          <a-form-item v-else-if="form.taskType === 'charging'" label="充电站（单选）" required>
            <a-select v-model:value="form.targetPointId" placeholder="请选择充电站">
              <a-select-option v-for="point in chargingPointOptions" :key="point.value" :value="point.value">
                {{ point.label }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item v-else label="停车点（单选）" required>
            <a-select v-model:value="form.targetPointId" placeholder="请选择停车点">
              <a-select-option v-for="point in parkingPointOptions" :key="point.value" :value="point.value">
                {{ point.label }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>

      <a-form-item label="调度原因">
        <a-textarea v-model:value="form.reason" :rows="3" placeholder="请输入临时调度原因" />
      </a-form-item>

      <a-alert
        v-if="needsTerminateConfirm"
        type="warning"
        show-icon
        :message="`当前机器人存在执行中任务，发起${form.taskType === 'charging' ? '充电' : '停车'}任务前需要确认是否终止当前任务。`"
      />
      <a-form-item v-if="needsTerminateConfirm" style="margin-top: 10px">
        <a-checkbox v-model:checked="form.confirmTerminateCurrentTask">
          确认终止当前任务并立即前往{{ form.taskType === 'charging' ? '充电站' : '停车点' }}
        </a-checkbox>
      </a-form-item>
      <a-alert
        v-else-if="isChargeOrParkTask"
        type="info"
        show-icon
        :message="`当前机器人无执行中任务，将直接前往${form.taskType === 'charging' ? '充电站' : '停车点'}。`"
      />
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { message } from 'ant-design-vue'

export interface SelectOption {
  value: string
  label: string
}

export interface TemporaryDispatchForm {
  name: string
  taskType: 'inspection' | 'charging' | 'parking'
  robotId: string
  scheduledAt: string
  reason: string
  targetPointId?: string
  targetPointIds?: string[]
  confirmTerminateCurrentTask: boolean
}

const props = defineProps<{
  visible: boolean
  runningTaskExists: boolean
  robotOptions: SelectOption[]
  inspectionPointOptions: SelectOption[]
  chargingPointOptions: SelectOption[]
  parkingPointOptions: SelectOption[]
  prefill?: Partial<TemporaryDispatchForm>
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'submit', payload: TemporaryDispatchForm): void
}>()

const form = reactive<TemporaryDispatchForm>({
  name: '',
  taskType: 'inspection',
  robotId: '',
  scheduledAt: '',
  reason: '',
  targetPointId: '',
  targetPointIds: [],
  confirmTerminateCurrentTask: false
})

watch(
  () => props.visible,
  (value) => {
    if (value) {
      applyPrefill()
    } else {
      resetForm()
    }
  }
)

watch(
  () => form.taskType,
  (type) => {
    if (type === 'inspection') {
      form.targetPointId = ''
    } else {
      form.targetPointIds = []
    }
  }
)

const isChargeOrParkTask = computed(() => form.taskType === 'charging' || form.taskType === 'parking')
const needsTerminateConfirm = computed(() => isChargeOrParkTask.value && props.runningTaskExists)
const inspectionTransferData = computed(() =>
  props.inspectionPointOptions.map(option => ({
    key: option.value,
    title: option.label,
    label: option.label
  }))
)

function handleCancel() {
  emit('update:visible', false)
}

function handleSubmit() {
  if (!form.name || !form.robotId || !form.scheduledAt) {
    message.error('请完整填写任务名称、机器人、计划执行时间')
    return
  }
  if (form.taskType === 'inspection' && (!form.targetPointIds || form.targetPointIds.length === 0)) {
    message.error('巡检任务至少需要选择一个巡检点')
    return
  }
  if ((form.taskType === 'charging' || form.taskType === 'parking') && !form.targetPointId) {
    message.error(`${form.taskType === 'charging' ? '充电任务' : '停车任务'}需要选择一个目标点`)
    return
  }
  if (needsTerminateConfirm.value && !form.confirmTerminateCurrentTask) {
    message.error('请确认是否终止当前任务后再提交')
    return
  }
  emit('submit', { ...form, targetPointIds: form.targetPointIds ? [...form.targetPointIds] : [] })
}

function applyPrefill() {
  const prefill = props.prefill || {}
  form.name = prefill.name || ''
  form.taskType = prefill.taskType || 'inspection'
  form.robotId = prefill.robotId || ''
  form.scheduledAt = prefill.scheduledAt || ''
  form.reason = prefill.reason || ''
  form.targetPointId = prefill.targetPointId || ''
  form.targetPointIds = prefill.targetPointIds ? [...prefill.targetPointIds] : []
  form.confirmTerminateCurrentTask = false
}

function resetForm() {
  form.name = ''
  form.taskType = 'inspection'
  form.robotId = ''
  form.scheduledAt = ''
  form.reason = ''
  form.targetPointId = ''
  form.targetPointIds = []
  form.confirmTerminateCurrentTask = false
}

function handleInspectionTransferChange(nextTargetKeys: string[]) {
  form.targetPointIds = nextTargetKeys
}

function filterInspectionOption(inputValue: string, option: { title?: string; label?: string }) {
  const text = option?.title || option?.label || ''
  return text.toLowerCase().includes(inputValue.toLowerCase())
}

function selectAllInspectionPoints() {
  form.targetPointIds = props.inspectionPointOptions.map(option => option.value)
}

function clearInspectionPoints() {
  form.targetPointIds = []
}
</script>

<style scoped lang="scss">
.inspection-transfer-tools {
  margin-bottom: 8px;
}

.selected-count {
  color: #666;
  font-size: 12px;
}
</style>
