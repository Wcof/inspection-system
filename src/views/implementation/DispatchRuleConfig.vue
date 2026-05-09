<template>
  <div class="dispatch-rule-config">
    <a-page-header title="调度规则配置" sub-title="自动调度任务生成规则">
      <template #extra>
        <a-button @click="showHelpModal = true">说明</a-button>
      </template>
    </a-page-header>
    
    <a-card class="rule-card" style="margin-top: 16px">
      <a-form layout="vertical" :model="ruleForm" class="rule-form single-line-form">
        <a-alert
          class="rule-summary"
          type="info"
          show-icon
          :message="taskGenerationSummary"
          description="调度规则配置用于把已启用的巡检规划转换为待执行任务，并在生成前判断规划是否适合进入自动调度。"
        />

        <div class="section-title">任务生成时机</div>
        <a-row :gutter="[16, 8]">
          <a-col :xs="24" :md="12">
            <div class="single-line-item">
              <a-form-item label="任务生成方式" help="控制巡检规划转换为任务的触发方式">
                <a-select v-model:value="ruleForm.taskGenerationMethod">
                  <a-select-option value="advance">提前生成</a-select-option>
                  <a-select-option value="on_time">到点生成</a-select-option>
                  <a-select-option value="batch">批量滚动生成</a-select-option>
                </a-select>
              </a-form-item>
            </div>
          </a-col>
          <a-col :xs="24" :md="12">
            <div class="single-line-item">
              <a-form-item label="提前生成时间（分钟）" help="规划执行开始前多久生成待执行任务">
                <a-input-number v-model:value="ruleForm.advanceGenerateMinutes" :min="0" :max="1440" />
              </a-form-item>
            </div>
          </a-col>
          <a-col :xs="24" :md="12">
            <div class="single-line-item">
              <a-form-item label="滚动生成窗口（小时）" help="每次只为未来窗口内的规划生成任务，避免一次性生成过多">
                <a-input-number v-model:value="ruleForm.generationWindowHours" :min="1" :max="168" />
              </a-form-item>
            </div>
          </a-col>
          <a-col :xs="24" :md="12">
            <div class="single-line-item">
              <a-form-item label="生成检查频率（分钟）" help="后台扫描规划并生成任务的频率">
                <a-input-number v-model:value="ruleForm.generationIntervalMinutes" :min="5" :max="240" :step="5" />
              </a-form-item>
            </div>
          </a-col>
        </a-row>

        <div class="section-title">自动调度适配</div>
        <a-row :gutter="[16, 8]">
          <a-col :xs="24" :md="12">
            <div class="single-line-item">
              <a-form-item label="不适合调度处理" help="不满足自动调度准入时的处理方式">
                <a-select v-model:value="ruleForm.unsuitablePlanStrategy">
                  <a-select-option value="manual_review">转人工复核</a-select-option>
                  <a-select-option value="defer">延后下一轮评估</a-select-option>
                  <a-select-option value="generate_pending">生成待确认任务</a-select-option>
                </a-select>
              </a-form-item>
            </div>
          </a-col>
          <a-col :xs="24">
            <div class="single-line-item">
              <a-form-item label="准入条件" help="全部满足后才进入自动调度计算">
                <a-checkbox-group v-model:value="ruleForm.dispatchEligibilityChecks">
                  <a-checkbox value="plan_active">规划已启用</a-checkbox>
                  <a-checkbox value="resource_available">机器人资源可用</a-checkbox>
                  <a-checkbox value="route_reachable">路线可达</a-checkbox>
                  <a-checkbox value="time_window_valid">执行时间窗有效</a-checkbox>
                  <a-checkbox value="battery_enough">电量满足预计任务</a-checkbox>
                  <a-checkbox value="no_safety_block">无安全阻断</a-checkbox>
                </a-checkbox-group>
              </a-form-item>
            </div>
          </a-col>
        </a-row>

          <div class="section-title">任务拆分与冲突</div>
          <a-row :gutter="[16, 8]">
            <a-col :xs="24" :md="12">
              <div class="single-line-item">
                <a-form-item label="合并阈值（分钟）" help="相邻规划任务在该时间范围内可合并生成">
                  <a-input-number v-model:value="ruleForm.mergeThreshold" :min="0" />
                </a-form-item>
              </div>
            </a-col>
            <a-col :xs="24" :md="12">
              <div class="single-line-item">
                <a-form-item label="执行锁定窗口（分钟）" help="进入该窗口后不再自动重排、合并或拆分，避免临近执行频繁变更">
                  <a-input-number v-model:value="ruleForm.executionLockMinutes" :min="0" :max="240" />
                </a-form-item>
              </div>
            </a-col>
            <a-col :xs="24" :md="12">
              <div class="single-line-item">
                <a-form-item label="单任务点位数上限" help="单个任务最多包含的点位数量">
                  <a-input-number v-model:value="ruleForm.maxPointsPerTask" :min="1" />
                </a-form-item>
              </div>
            </a-col>
            <a-col :xs="24" :md="12">
              <div class="single-line-item">
                <a-form-item label="单任务时长上限（分钟）" help="单个任务的最大预计执行时长">
                  <a-input-number v-model:value="ruleForm.maxDurationPerTask" :min="1" />
                </a-form-item>
              </div>
            </a-col>
            <a-col :xs="24" :md="12">
              <div class="single-line-item">
                <a-form-item label="重复任务窗口（分钟）" help="同一规划在该窗口内已生成任务时不重复生成">
                  <a-input-number v-model:value="ruleForm.duplicateTaskWindowMinutes" :min="0" />
                </a-form-item>
              </div>
            </a-col>
            <a-col :xs="24" :md="12">
              <div class="single-line-item">
                <a-form-item label="资源冲突策略" help="多个规划竞争同一机器人或时间窗时的处理方式">
                  <a-select v-model:value="ruleForm.resourceConflictStrategy">
                    <a-select-option value="priority_first">优先级高者先执行</a-select-option>
                    <a-select-option value="time_first">计划时间早者先执行</a-select-option>
                    <a-select-option value="manual_review">转人工复核</a-select-option>
                  </a-select>
                </a-form-item>
              </div>
            </a-col>
          </a-row>

          <div class="section-title">异常与适用范围</div>
          <a-row :gutter="[16, 8]">
            <a-col :xs="24" :md="12">
              <div class="single-line-item">
                <a-form-item label="补检次数" help="补检的最大重试次数">
                  <a-input-number v-model:value="ruleForm.retryCount" :min="1" :max="5" />
                </a-form-item>
              </div>
            </a-col>
            <a-col :xs="24">
              <div class="single-line-item">
                <a-form-item label="漏检判定" help="判定任务为漏检的条件">
                  <a-checkbox-group v-model:value="ruleForm.missedCheckConditions">
                    <a-checkbox value="timeout">超时</a-checkbox>
                    <a-checkbox value="retry_failed">补检失败</a-checkbox>
                    <a-checkbox value="manual_abort">人工终止</a-checkbox>
                    <a-checkbox value="device_unreachable">点位不可达</a-checkbox>
                  </a-checkbox-group>
                </a-form-item>
              </div>
            </a-col>
            <a-col :xs="24" :md="12">
              <div class="single-line-item">
                <a-form-item label="区域" help="规则适用的区域范围">
                  <a-select v-model:value="ruleForm.applicableArea" mode="multiple" placeholder="选择区域">
                    <a-select-option value="area_a">A区</a-select-option>
                    <a-select-option value="area_b">B区</a-select-option>
                    <a-select-option value="area_c">C区</a-select-option>
                  </a-select>
                </a-form-item>
              </div>
            </a-col>
            <a-col :xs="24" :md="12">
              <div class="single-line-item">
                <a-form-item label="生效时间" help="配置规则的生效时间范围">
                  <a-range-picker
                    v-model:value="ruleForm.effectiveTimeRange"
                    show-time
                    format="YYYY-MM-DD HH:mm:ss"
                  />
                </a-form-item>
              </div>
            </a-col>
          </a-row>
        <a-form-item class="action-row">
          <a-space>
            <a-popconfirm
              title="确认保存调度规则配置变更？"
              ok-text="确认变更"
              cancel-text="取消"
              @confirm="handleSave"
            >
              <a-button type="primary">保存配置</a-button>
            </a-popconfirm>
            <a-button @click="handleCancel">取消</a-button>
            <a-button @click="handleReset">重置</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
    
    <a-modal
      v-model:open="showHelpModal"
      title="调度规则配置说明"
      width="900px"
      :footer="null"
    >
      <div class="help-search-panel">
        <a-form layout="vertical" :model="helpSearchForm" @submit.prevent>
          <a-row :gutter="[12, 8]" align="bottom">
            <a-col :xs="24" :sm="12" :md="8">
              <a-form-item label="字段" class="help-search-item">
                <a-input v-model:value="helpSearchForm.field" placeholder="请输入字段名称" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="10">
              <a-form-item label="作用/示例关键词" class="help-search-item">
                <a-input v-model:value="helpSearchForm.keyword" placeholder="请输入关键词" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="24" :md="6">
              <div class="help-search-actions">
                <a-space>
                  <a-button type="primary">搜索</a-button>
                  <a-button @click="resetHelpSearch">重置</a-button>
                </a-space>
              </div>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <a-table
        :columns="helpColumns"
        :data-source="filteredHelpData"
        :pagination="false"
        bordered
        size="small"
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'

const showHelpModal = ref(false)

const helpColumns = [
  { title: '字段', dataIndex: 'field', key: 'field', width: 150 },
  { title: '作用', dataIndex: 'role', key: 'role' },
  { title: '推荐值', dataIndex: 'recommended', key: 'recommended', width: 150 },
  { title: '示例', dataIndex: 'example', key: 'example', width: 150 }
]

const helpData = [
  {
    key: '1',
    field: '任务生成方式',
    role: '决定巡检规划转换为任务的触发方式。',
    recommended: '提前生成',
    example: '计划 08:00 执行，提前 30 分钟生成任务'
  },
  {
    key: '2',
    field: '提前生成时间（分钟）',
    role: '控制规划开始前多久生成任务，给自动调度预留资源计算和冲突处理时间。',
    recommended: '30~60分钟',
    example: '08:00 的规划在 07:30 生成任务'
  },
  {
    key: '3',
    field: '滚动生成窗口（小时）',
    role: '限定每轮只处理未来一段时间内的规划，避免长期任务过早固化。',
    recommended: '24小时',
    example: '每次只生成未来 24 小时内的巡检任务'
  },
  {
    key: '4',
    field: '自动调度适配',
    role: '任务生成前默认判断规划是否适合自动调度。',
    recommended: '默认执行',
    example: '资源不足或路线不可达时转人工复核'
  },
  {
    key: '5',
    field: '准入条件',
    role: '定义自动调度前必须满足的规划、资源、路线、时间窗和安全条件。',
    recommended: '全选核心条件',
    example: '规划启用、机器人可用、路线可达、电量充足'
  },
  {
    key: '6',
    field: '不适合调度处理',
    role: '当规划不满足自动调度条件时的兜底动作。',
    recommended: '转人工复核',
    example: '安全阻断时生成人工复核记录'
  },
  {
    key: '7',
    field: '合并阈值（分钟）',
    role: '时间间隔小于该阈值的任务可合并调度，减少碎片任务。',
    recommended: '20~30分钟',
    example: '08:00 与 08:15 的任务可合并'
  },
  {
    key: '8',
    field: '执行锁定窗口（分钟）',
    role: '临近执行时禁止自动重排、合并或拆分，保持现场执行稳定。',
    recommended: '10~15分钟',
    example: '距执行 10 分钟内不再自动改派'
  },
  {
    key: '9',
    field: '单任务点位数上限',
    role: '限制单个任务包含的点位数量，避免任务过重。',
    recommended: '10个',
    example: '超过10个点位时拆分为多条任务'
  },
  {
    key: '10',
    field: '单任务时长上限（分钟）',
    role: '限制单任务预计执行时长，避免占用机器人过久。',
    recommended: '45~60分钟',
    example: '预计超过60分钟时自动拆分'
  },
  {
    key: '11',
    field: '重复任务窗口（分钟）',
    role: '避免同一规划在短时间内重复生成任务。',
    recommended: '60分钟',
    example: '一小时内已生成过的规划不再重复生成'
  },
  {
    key: '12',
    field: '资源冲突策略',
    role: '多个规划争用机器人或时间窗时的自动处理策略。',
    recommended: '优先级高者先执行',
    example: '隐患排查优先于普通日巡'
  },
  {
    key: '13',
    field: '自动补检',
    role: '任务异常中断或漏检时，默认自动发起补检。',
    recommended: '默认执行',
    example: '任务超时后自动补检'
  },
  {
    key: '14',
    field: '补检次数',
    role: '补检最大重试次数，防止无限循环。',
    recommended: '2次',
    example: '主检失败后最多补检2轮'
  },
  {
    key: '15',
    field: '漏检判定',
    role: '定义何种场景算漏检，用于统计与后续处理。',
    recommended: '超时 + 补检失败 + 不可达',
    example: '任务超时且两次补检均失败'
  },
  {
    key: '16',
    field: '区域',
    role: '指定规则生效的区域范围，支持多选。',
    recommended: '按真实责任区域配置',
    example: '规则仅对 A区、B区 生效'
  },
  {
    key: '17',
    field: '生效时间',
    role: '控制规则在什么时间段内生效。',
    recommended: '按班次时间配置',
    example: '工作日 08:00-18:00 生效'
  }
]

const defaultRuleForm = {
  taskGenerationMethod: 'advance',
  advanceGenerateMinutes: 30,
  generationWindowHours: 24,
  generationIntervalMinutes: 15,
  unsuitablePlanStrategy: 'manual_review',
  dispatchEligibilityChecks: ['plan_active', 'resource_available', 'route_reachable', 'time_window_valid', 'battery_enough', 'no_safety_block'],
  mergeThreshold: 30,
  executionLockMinutes: 10,
  maxPointsPerTask: 10,
  maxDurationPerTask: 60,
  duplicateTaskWindowMinutes: 60,
  resourceConflictStrategy: 'priority_first',
  retryCount: 2,
  missedCheckConditions: ['timeout', 'retry_failed', 'device_unreachable'],
  applicableArea: [] as string[],
  effectiveTimeRange: null
}

const ruleForm = reactive({ ...defaultRuleForm })

const helpSearchForm = reactive({
  field: '',
  keyword: ''
})

const filteredHelpData = computed(() => {
  const field = helpSearchForm.field.trim().toLowerCase()
  const keyword = helpSearchForm.keyword.trim().toLowerCase()
  return helpData.filter((item) => {
    const matchesField = !field || item.field.toLowerCase().includes(field)
    const text = `${item.role} ${item.recommended} ${item.example}`.toLowerCase()
    const matchesKeyword = !keyword || text.includes(keyword)
    return matchesField && matchesKeyword
  })
})

const taskGenerationSummary = computed(() => {
  if (ruleForm.taskGenerationMethod === 'on_time') {
    return `规划到达执行时间时生成任务，后台每 ${ruleForm.generationIntervalMinutes} 分钟检查一次。`
  }
  if (ruleForm.taskGenerationMethod === 'batch') {
    return `每 ${ruleForm.generationIntervalMinutes} 分钟滚动扫描未来 ${ruleForm.generationWindowHours} 小时规划，符合条件后批量生成任务。`
  }
  return `巡检规划将在执行前 ${ruleForm.advanceGenerateMinutes} 分钟生成任务，并在未来 ${ruleForm.generationWindowHours} 小时窗口内滚动评估。`
})

function handleSave() {
  message.success('配置保存成功')
}

function handleReset() {
  Object.assign(ruleForm, {
    ...defaultRuleForm,
    dispatchEligibilityChecks: [...defaultRuleForm.dispatchEligibilityChecks],
    missedCheckConditions: [...defaultRuleForm.missedCheckConditions],
    applicableArea: []
  })
  message.info('已重置为默认配置')
}

function handleCancel() {
  handleReset()
  message.info('已取消当前修改')
}

function resetHelpSearch() {
  helpSearchForm.field = ''
  helpSearchForm.keyword = ''
}
</script>

<style scoped lang="css">.dispatch-rule-config {
  width: 100%;
  padding-bottom: 8px;
}
.dispatch-rule-config :deep(.ant-page-header) {
  padding: 0;
}
.dispatch-rule-config :deep(.ant-page-header-heading) {
  align-items: center;
}
.dispatch-rule-config :deep(.ant-card) {
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 10px rgba(15, 23, 42, 0.03);
}
.dispatch-rule-config .rule-card {
  overflow: hidden;
}
.dispatch-rule-config :deep(.ant-card-body) {
  padding: 20px 20px 16px;
}
.dispatch-rule-config .rule-form {
  max-width: 920px;
  margin: 0 auto;
}
.dispatch-rule-config .rule-summary {
  margin: 10px 0 12px;
}
.dispatch-rule-config .section-title {
  margin-top: 18px;
  padding: 0 0 8px;
  border-bottom: 1px solid #f0f0f0;
  color: #1677ff;
  font-size: 15px;
  font-weight: 600;
}
.dispatch-rule-config .single-line-form .single-line-item {
  padding: 12px 0;
  border-bottom: 1px solid #f5f5f5;
}
.dispatch-rule-config :deep(.ant-form-vertical .ant-form-item) {
  margin-bottom: 0;
}
.dispatch-rule-config :deep(.ant-form-item-label > label) {
  color: #262626;
  font-weight: 500;
}
.dispatch-rule-config :deep(.ant-form-item-explain), .dispatch-rule-config :deep(.ant-form-item-extra) {
  font-size: 12px;
  color: #8c8c8c;
  line-height: 1.3;
}
.dispatch-rule-config :deep(.ant-input-number), .dispatch-rule-config :deep(.ant-picker), .dispatch-rule-config :deep(.ant-select) {
  width: 100%;
}
.dispatch-rule-config :deep(.ant-checkbox-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
}
.dispatch-rule-config .action-row {
  margin-top: 6px;
  margin-bottom: 0;
  padding-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.dispatch-rule-config :deep(.ant-modal-body) {
  max-height: 68vh;
  overflow: auto;
  padding-top: 12px;
}
.dispatch-rule-config :deep(.ant-table-wrapper) {
  border-radius: 8px;
  overflow: hidden;
}
.dispatch-rule-config .help-search-panel {
  margin-bottom: 10px;
  padding: 10px 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}
.dispatch-rule-config .help-search-item {
  margin-bottom: 0;
}
.dispatch-rule-config .help-search-actions {
  min-height: 32px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}
@media (max-width: 1200px) {
  .dispatch-rule-config :deep(.ant-card-body) {
    padding: 16px 16px 10px;
  }
  .dispatch-rule-config .rule-form {
    max-width: 100%;
  }
  .dispatch-rule-config .action-row {
    justify-content: flex-start;
  }
}
</style>
