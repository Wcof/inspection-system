<template>
  <div class="dispatch-rule-config">
    <a-page-header title="调度规则配置" sub-title="平台级任务生成规则">
      <template #extra>
        <a-button @click="showHelpModal = true">说明</a-button>
      </template>
    </a-page-header>
    
    <a-card class="rule-card" style="margin-top: 16px">
      <a-form layout="vertical" :model="ruleForm" class="rule-form single-line-form">
        <div class="single-line-item first-line">
          <a-form-item label="启用状态" help="是否启用该配置规则">
            <a-switch v-model:checked="ruleForm.isEnabled" />
          </a-form-item>
        </div>

        <template v-if="ruleForm.isEnabled">
          <div class="single-line-item">
            <a-form-item label="任务生成方式" help="控制任务的生成时机和方式">
              <a-select v-model:value="ruleForm.taskGenerationMethod">
                <a-select-option value="on_time">到点生成</a-select-option>
                <a-select-option value="advance">提前生成</a-select-option>
                <a-select-option value="batch">批量生成</a-select-option>
              </a-select>
            </a-form-item>
          </div>

          <div class="single-line-item">
            <a-form-item label="合并阈值（分钟）" help="相邻任务在该时间范围内可合并">
              <a-input-number v-model:value="ruleForm.mergeThreshold" :min="0" />
            </a-form-item>
          </div>

          <div class="single-line-item">
            <a-form-item label="单任务点位数上限" help="单个任务最多包含的点位数量">
              <a-input-number v-model:value="ruleForm.maxPointsPerTask" :min="1" />
            </a-form-item>
          </div>

          <div class="single-line-item">
            <a-form-item label="单任务时长上限（分钟）" help="单个任务的最大预计执行时长">
              <a-input-number v-model:value="ruleForm.maxDurationPerTask" :min="1" />
            </a-form-item>
          </div>

          <div class="single-line-item">
            <a-form-item label="是否补检" help="任务未完成时是否自动进行补检">
              <a-switch v-model:checked="ruleForm.enableRetry" />
            </a-form-item>
          </div>

          <div class="single-line-item" v-if="ruleForm.enableRetry">
            <a-form-item label="补检次数" help="补检的最大重试次数">
              <a-input-number v-model:value="ruleForm.retryCount" :min="1" :max="5" />
            </a-form-item>
          </div>

          <div class="single-line-item">
            <a-form-item label="漏检判定" help="判定任务为漏检的条件">
              <a-checkbox-group v-model:value="ruleForm.missedCheckConditions">
                <a-checkbox value="timeout">超时</a-checkbox>
                <a-checkbox value="retry_failed">补检失败</a-checkbox>
              </a-checkbox-group>
            </a-form-item>
          </div>

          <div class="single-line-item">
            <a-form-item label="区域" help="规则适用的区域范围">
              <a-select v-model:value="ruleForm.applicableArea" mode="multiple" placeholder="选择区域">
                <a-select-option value="area_a">A区</a-select-option>
                <a-select-option value="area_b">B区</a-select-option>
                <a-select-option value="area_c">C区</a-select-option>
              </a-select>
            </a-form-item>
          </div>

          <div class="single-line-item">
            <a-form-item label="生效时间" help="配置规则的生效时间范围">
              <a-range-picker
                v-model:value="ruleForm.effectiveTimeRange"
                show-time
                format="YYYY-MM-DD HH:mm:ss"
              />
            </a-form-item>
          </div>

        </template>

        <a-alert
          v-else
          class="disabled-tip"
          type="warning"
          show-icon
          message="调度规则已关闭"
          description="当前仅保留启用状态配置。开启后可继续维护其余规则项。"
        />

        <a-form-item class="action-row">
          <a-space>
            <a-button type="primary" @click="handleSave">保存配置</a-button>
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
      <a-table
        :columns="helpColumns"
        :data-source="helpData"
        :pagination="false"
        bordered
        size="small"
      />
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
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
    role: '决定系统何时生成任务。',
    recommended: '到点生成',
    example: '按计划时间准点生成任务'
  },
  {
    key: '2',
    field: '合并阈值（分钟）',
    role: '时间间隔小于该阈值的任务可合并调度，减少碎片任务。',
    recommended: '20~30分钟',
    example: '08:00 与 08:15 的任务可合并'
  },
  {
    key: '3',
    field: '单任务点位数上限',
    role: '限制单个任务包含的点位数量，避免任务过重。',
    recommended: '10个',
    example: '超过10个点位时拆分为多条任务'
  },
  {
    key: '4',
    field: '单任务时长上限（分钟）',
    role: '限制单任务预计执行时长，避免占用机器人过久。',
    recommended: '45~60分钟',
    example: '预计超过60分钟时自动拆分'
  },
  {
    key: '5',
    field: '是否补检',
    role: '任务异常中断或漏检时，是否自动发起补检。',
    recommended: '开启',
    example: '任务超时后自动补检'
  },
  {
    key: '6',
    field: '补检次数',
    role: '补检最大重试次数，防止无限循环。',
    recommended: '2次',
    example: '主检失败后最多补检2轮'
  },
  {
    key: '7',
    field: '漏检判定',
    role: '定义何种场景算漏检，用于统计与后续处理。',
    recommended: '超时 + 补检失败',
    example: '任务超时且两次补检均失败'
  },
  {
    key: '8',
    field: '区域',
    role: '指定规则生效的区域范围，支持多选。',
    recommended: '按真实责任区域配置',
    example: '规则仅对 A区、B区 生效'
  },
  {
    key: '9',
    field: '启用状态',
    role: '控制规则是否立即参与调度计算。',
    recommended: '启用',
    example: '测试阶段可先停用，验证后再启用'
  },
  {
    key: '10',
    field: '生效时间',
    role: '控制规则在什么时间段内生效。',
    recommended: '按班次时间配置',
    example: '工作日 08:00-18:00 生效'
  }
]

const ruleForm = reactive({
  taskGenerationMethod: 'on_time',
  mergeThreshold: 30,
  maxPointsPerTask: 10,
  maxDurationPerTask: 60,
  enableRetry: true,
  retryCount: 2,
  missedCheckConditions: ['timeout', 'retry_failed'],
  applicableArea: [],
  isEnabled: true,
  effectiveTimeRange: null
})

function handleSave() {
  message.success('配置保存成功')
}

function handleReset() {
  ruleForm.taskGenerationMethod = 'on_time'
  ruleForm.mergeThreshold = 30
  ruleForm.maxPointsPerTask = 10
  ruleForm.maxDurationPerTask = 60
  ruleForm.enableRetry = true
  ruleForm.retryCount = 2
  ruleForm.missedCheckConditions = ['timeout', 'retry_failed']
  ruleForm.applicableArea = []
  ruleForm.isEnabled = true
  ruleForm.effectiveTimeRange = null
  message.info('已重置为默认配置')
}

function handleCancel() {
  handleReset()
  message.info('已取消当前修改')
}
</script>

<style scoped lang="scss">
.dispatch-rule-config {
  width: 100%;
  padding-bottom: 8px;

  :deep(.ant-page-header) {
    padding: 0;
  }

  :deep(.ant-page-header-heading) {
    align-items: center;
  }

  :deep(.ant-card) {
    border-radius: 10px;
    border: 1px solid #f0f0f0;
    box-shadow: 0 2px 10px rgba(15, 23, 42, 0.03);
  }

  .rule-card {
    overflow: hidden;
  }

  :deep(.ant-card-body) {
    padding: 20px 20px 16px;
  }

  .rule-form {
    max-width: 920px;
    margin: 0 auto;
  }

  .single-line-form {
    .single-line-item {
      padding: 12px 0;
      border-bottom: 1px solid #f5f5f5;
    }

    .first-line {
      padding-top: 2px;
    }
  }

  :deep(.ant-form-vertical .ant-form-item) {
    margin-bottom: 0;
  }

  :deep(.ant-form-item-label > label) {
    color: #262626;
    font-weight: 500;
  }

  :deep(.ant-form-item-explain),
  :deep(.ant-form-item-extra) {
    font-size: 12px;
    color: #8c8c8c;
    line-height: 1.3;
  }

  :deep(.ant-input-number),
  :deep(.ant-picker),
  :deep(.ant-select) {
    width: 100%;
  }

  :deep(.ant-checkbox-group) {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
  }

  .action-row {
    margin-top: 6px;
    margin-bottom: 0;
    padding-top: 16px;
    display: flex;
    justify-content: flex-end;
  }

  .disabled-tip {
    margin-top: 14px;
  }

  :deep(.ant-modal-body) {
    max-height: 68vh;
    overflow: auto;
    padding-top: 12px;
  }

  :deep(.ant-table-wrapper) {
    border-radius: 8px;
    overflow: hidden;
  }

  @media (max-width: 1200px) {
    :deep(.ant-card-body) {
      padding: 16px 16px 10px;
    }

    .rule-form {
      max-width: 100%;
    }

    .action-row {
      justify-content: flex-start;
    }
  }
}
</style>
