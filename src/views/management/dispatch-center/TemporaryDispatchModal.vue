<template>
  <a-modal
    :open="visible"
    title="创建临时任务"
    width="920px"
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
            <a-select v-model:value="form.dispatchType" placeholder="请选择任务类型">
              <a-select-option value="insert">插单</a-select-option>
              <a-select-option value="recheck">补检</a-select-option>
              <a-select-option value="charging">充电</a-select-option>
              <a-select-option value="parking">停车</a-select-option>
              <a-select-option value="replace_robot">替换机器人</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="12">
        <a-col :span="12">
          <a-form-item label="任务场景" required>
            <a-select v-model:value="form.businessScene" placeholder="请选择任务场景">
              <a-select-option value="daily_inspection">日常巡检</a-select-option>
              <a-select-option value="hazard_screening">隐患排查</a-select-option>
              <a-select-option value="environment_check">环境检查</a-select-option>
              <a-select-option value="operation_guard">作业监护</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
        <a-col :span="12">
          <a-form-item label="执行机器人" required>
            <a-select v-model:value="form.robotId" placeholder="请选择执行机器人">
              <a-select-option v-for="robot in robotOptions" :key="robot.value" :value="robot.value">{{ robot.label }}</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>

      <a-row :gutter="12">
        <a-col :span="12">
          <a-form-item label="计划执行时间" required>
            <a-input v-model:value="form.scheduledAt" placeholder="例如 2026-04-17 15:30" />
          </a-form-item>
        </a-col>
        <a-col v-if="form.dispatchType !== 'replace_robot'" :span="12">
          <a-form-item label="调度目标类型" required>
            <a-select v-model:value="form.taskType">
              <a-select-option value="inspection">巡检点</a-select-option>
              <a-select-option value="charging">充电站</a-select-option>
              <a-select-option value="parking">停车点</a-select-option>
            </a-select>
          </a-form-item>
        </a-col>
      </a-row>

      <a-form-item v-if="form.dispatchType !== 'replace_robot' && form.taskType === 'inspection'" label="巡检点（可多选）" required>
        <a-select v-model:value="form.targetPointIds" mode="multiple" placeholder="请选择巡检点">
          <a-select-option v-for="point in inspectionPointOptions" :key="point.value" :value="point.value">{{ point.label }}</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item v-else-if="form.dispatchType !== 'replace_robot' && form.taskType === 'charging'" label="充电站" required>
        <a-select v-model:value="form.targetPointId" placeholder="请选择充电站">
          <a-select-option v-for="point in chargingPointOptions" :key="point.value" :value="point.value">{{ point.label }}</a-select-option>
        </a-select>
      </a-form-item>
      <a-form-item v-else-if="form.dispatchType !== 'replace_robot'" label="停车点" required>
        <a-select v-model:value="form.targetPointId" placeholder="请选择停车点">
          <a-select-option v-for="point in parkingPointOptions" :key="point.value" :value="point.value">{{ point.label }}</a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="调度原因">
        <a-textarea v-model:value="form.reason" :rows="3" placeholder="请输入临时调度原因" />
      </a-form-item>

      <a-alert
        v-if="hasConflict"
        type="warning"
        show-icon
        style="margin-bottom: 12px"
        message="检测到时间 / 机器人资源冲突，请选择冲突处理方式。"
        :description="`当前执行机器人存在占用或时间交叉，受影响任务将进入待处理队列。`"
      />

      <a-card v-if="hasConflict" size="small" title="受影响任务清单" style="margin-bottom: 12px">
        <a-empty v-if="conflictTasks.length === 0" description="暂无明确受影响任务" />
        <a-table v-else :columns="conflictColumns" :data-source="conflictTasks" row-key="id" :pagination="false" size="small">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'status'">
              <a-tag :color="record.status === 'running' ? 'blue' : 'gold'">{{ record.status === 'running' ? '执行中' : '待执行' }}</a-tag>
            </template>
          </template>
        </a-table>
      </a-card>

      <a-form-item v-if="hasConflict" label="冲突处理方式">
        <a-radio-group v-model:value="form.conflictStrategy">
          <a-radio value="delay">延后执行</a-radio>
          <a-radio value="pause">暂停执行</a-radio>
        </a-radio-group>
      </a-form-item>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { message } from 'ant-design-vue'

export interface SelectOption { value: string; label: string }
export interface ConflictTaskItem { id: string; name: string; robotId: string; robotName: string; scheduledAt?: string; status: 'running' | 'pending'; typeLabel?: string }
export interface TemporaryDispatchForm {
  name: string
  dispatchType: 'insert' | 'recheck' | 'charging' | 'parking' | 'replace_robot'
  businessScene: 'daily_inspection' | 'hazard_screening' | 'environment_check' | 'operation_guard'
  taskType: 'inspection' | 'charging' | 'parking'
  robotId: string
  scheduledAt: string
  reason: string
  targetPointId?: string
  targetPointIds?: string[]
  conflictStrategy: 'delay' | 'pause'
}

const props = defineProps<{
  visible: boolean
  runningTaskExists: boolean
  robotOptions: SelectOption[]
  inspectionPointOptions: SelectOption[]
  chargingPointOptions: SelectOption[]
  parkingPointOptions: SelectOption[]
  taskCandidates?: ConflictTaskItem[]
  prefill?: Partial<TemporaryDispatchForm>
}>()
const emit = defineEmits<{ (e: 'update:visible', value: boolean): void; (e: 'submit', payload: TemporaryDispatchForm): void }>()

const form = reactive<TemporaryDispatchForm>({
  name: '',
  dispatchType: 'insert',
  businessScene: 'daily_inspection',
  taskType: 'inspection',
  robotId: '',
  scheduledAt: '',
  reason: '',
  targetPointId: '',
  targetPointIds: [],
  conflictStrategy: 'delay'
})
const conflictTasks = computed(() => (props.taskCandidates || []).filter((task) => !form.robotId || task.robotId === form.robotId))
const hasConflict = computed(() => Boolean((props.runningTaskExists || conflictTasks.value.length) && form.robotId && form.scheduledAt))
const conflictColumns = [
  { title: '任务名称', dataIndex: 'name', key: 'name' },
  { title: '执行机器人', dataIndex: 'robotName', key: 'robotName', width: 140 },
  { title: '计划时间', dataIndex: 'scheduledAt', key: 'scheduledAt', width: 180 },
  { title: '状态', key: 'status', width: 100 },
  { title: '来源', dataIndex: 'typeLabel', key: 'typeLabel', width: 120 }
]

watch(() => props.visible, (value) => { if (value) applyPrefill(); else resetForm() })
watch(() => form.taskType, (type) => { if (type === 'inspection') form.targetPointId = ''; else form.targetPointIds = [] })
watch(() => form.dispatchType, (type) => {
  if (type === 'charging') form.taskType = 'charging'
  if (type === 'parking') form.taskType = 'parking'
  if (type === 'replace_robot') {
    form.targetPointId = ''
    form.targetPointIds = []
  }
  if (type === 'recheck' && form.businessScene === 'daily_inspection') form.businessScene = 'hazard_screening'
})

function applyPrefill() {
  const prefill = props.prefill || {}
  form.name = prefill.name || ''
  form.dispatchType = prefill.dispatchType || 'insert'
  form.businessScene = prefill.businessScene || (form.dispatchType === 'recheck' ? 'hazard_screening' : 'daily_inspection')
  form.taskType = prefill.taskType || 'inspection'
  form.robotId = prefill.robotId || ''
  form.scheduledAt = prefill.scheduledAt || ''
  form.reason = prefill.reason || ''
  form.targetPointId = prefill.targetPointId || ''
  form.targetPointIds = prefill.targetPointIds ? [...prefill.targetPointIds] : []
  form.conflictStrategy = prefill.conflictStrategy || 'delay'
}
function resetForm() { form.name=''; form.dispatchType='insert'; form.businessScene='daily_inspection'; form.taskType='inspection'; form.robotId=''; form.scheduledAt=''; form.reason=''; form.targetPointId=''; form.targetPointIds=[]; form.conflictStrategy='delay' }
function handleCancel() { emit('update:visible', false) }
function handleSubmit() {
  if (!form.name || !form.dispatchType || !form.businessScene || !form.robotId || !form.scheduledAt) return message.error('请完整填写任务名称、任务类型、任务场景、执行机器人、计划执行时间')
  if (form.dispatchType !== 'replace_robot' && form.taskType === 'inspection' && !form.targetPointIds?.length) return message.error('请至少选择一个巡检点')
  if (form.dispatchType !== 'replace_robot' && form.taskType !== 'inspection' && !form.targetPointId) return message.error('请选择目标点')
  emit('submit', { ...form, targetPointIds: [...(form.targetPointIds || [])] })
}
</script>
