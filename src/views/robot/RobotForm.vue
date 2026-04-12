<template>
  <div class="robot-form">
    <div class="page-header">
      <h2>{{ isEdit ? '编辑机器人' : '新增机器人' }}</h2>
      <a-button @click="handleCancel">
        <template #icon>
          <CloseOutlined />
        </template>
        取消
      </a-button>
    </div>
    
    <a-card style="margin-top: 16px">
      <a-form
        :model="formData"
        :rules="rules"
        ref="formRef"
        :label-col="{ span: 6 }"
        :wrapper-col="{ span: 16 }"
      >
        <a-form-item label="机器人名称" name="name">
          <a-input v-model:value="formData.name" placeholder="请输入机器人名称" />
        </a-form-item>
        
        <a-form-item label="序列号" name="serialNumber">
          <a-input v-model:value="formData.serialNumber" placeholder="请输入序列号" />
        </a-form-item>
        
        <a-form-item label="型号" name="model">
          <a-input v-model:value="formData.model" placeholder="请输入型号" />
        </a-form-item>
        
        <a-form-item label="低电量阈值" name="batteryThreshold.low">
          <a-input-number v-model:value="formData.batteryThreshold.low" min="0" max="100" placeholder="请输入低电量阈值" />
          <span style="margin-left: 8px">%</span>
        </a-form-item>
        
        <a-form-item label="危险电量阈值" name="batteryThreshold.critical">
          <a-input-number v-model:value="formData.batteryThreshold.critical" min="0" max="100" placeholder="请输入危险电量阈值" />
          <span style="margin-left: 8px">%</span>
        </a-form-item>

        <a-divider style="margin: 16px 0" />

        <a-collapse 
          v-model:activeKey="activeKeys" 
          class="advanced-config-collapse"
          :bordered="false"
        >
          <a-collapse-panel key="1" header="高级配置">
            <div class="config-section">
              <div class="section-title">连接配置</div>
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="协议" name="connectionConfig.protocol" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
                    <a-select v-model:value="formData.connectionConfig.protocol" placeholder="请选择协议">
                      <a-select-option value="tcp">tcp</a-select-option>
                      <a-select-option value="ws">ws</a-select-option>
                      <a-select-option value="wss">wss</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="端口" name="connectionConfig.port" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
                    <a-input-number v-model:value="formData.connectionConfig.port" min="1" max="65535" placeholder="请输入端口" style="width: 100%" />
                  </a-form-item>
                </a-col>
              </a-row>
              
              <a-form-item label="主机" name="connectionConfig.host">
                <a-input v-model:value="formData.connectionConfig.host" placeholder="请输入主机地址" />
              </a-form-item>
              
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="重连间隔" name="connectionConfig.reconnectInterval" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
                    <a-input-number v-model:value="formData.connectionConfig.reconnectInterval" min="1000" placeholder="请输入重连间隔" style="width: 100%" />
                    <span class="unit-text">ms</span>
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="心跳间隔" name="connectionConfig.heartbeatInterval" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
                    <a-input-number v-model:value="formData.connectionConfig.heartbeatInterval" min="1000" placeholder="请输入心跳间隔" style="width: 100%" />
                    <span class="unit-text">ms</span>
                  </a-form-item>
                </a-col>
              </a-row>
              
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="超时时间" name="connectionConfig.timeout" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
                    <a-input-number v-model:value="formData.connectionConfig.timeout" min="1000" placeholder="请输入超时时间" style="width: 100%" />
                    <span class="unit-text">ms</span>
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="最大重连次数" name="connectionConfig.maxReconnectAttempts" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
                    <a-input-number v-model:value="formData.connectionConfig.maxReconnectAttempts" min="1" placeholder="请输入最大重连次数" style="width: 100%" />
                  </a-form-item>
                </a-col>
              </a-row>
            </div>

            <div class="config-section">
              <div class="section-title">异常策略</div>
              <a-row :gutter="16">
                <a-col :span="12">
                  <a-form-item label="低电量策略" name="exceptionStrategy.lowBattery" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
                    <a-select v-model:value="formData.exceptionStrategy.lowBattery" placeholder="请选择低电量策略">
                      <a-select-option value="return_to_base">返回基站</a-select-option>
                      <a-select-option value="skip">跳过继续</a-select-option>
                      <a-select-option value="abort">中止任务</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :span="12">
                  <a-form-item label="信号丢失策略" name="exceptionStrategy.signalLost" :label-col="{ span: 8 }" :wrapper-col="{ span: 16 }">
                    <a-select v-model:value="formData.exceptionStrategy.signalLost" placeholder="请选择信号丢失策略">
                      <a-select-option value="wait_and_resume">等待恢复</a-select-option>
                      <a-select-option value="return_to_base">返回基站</a-select-option>
                      <a-select-option value="abort">中止任务</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
              </a-row>
              
              <a-form-item label="机器人故障策略" name="exceptionStrategy.robotFailure">
                <a-select v-model:value="formData.exceptionStrategy.robotFailure" placeholder="请选择机器人故障策略">
                  <a-select-option value="return_to_base">返回基站</a-select-option>
                  <a-select-option value="wait_and_resume">等待恢复</a-select-option>
                  <a-select-option value="abort">中止任务</a-select-option>
                  <a-select-option value="notify">仅通知</a-select-option>
                </a-select>
              </a-form-item>
              
              <a-row :gutter="16">
                <a-col :span="8">
                  <a-form-item label="信号丢失重试次数" name="exceptionStrategy.signalLostRetryCount" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
                    <a-input-number v-model:value="formData.exceptionStrategy.signalLostRetryCount" min="1" placeholder="请输入重试次数" style="width: 100%" />
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="重试间隔" name="exceptionStrategy.retryInterval" :label-col="{ span: 10 }" :wrapper-col="{ span: 14 }">
                    <a-input-number v-model:value="formData.exceptionStrategy.retryInterval" min="1" placeholder="请输入重试间隔" style="width: 100%" />
                    <span class="unit-text">s</span>
                  </a-form-item>
                </a-col>
                <a-col :span="8">
                  <a-form-item label="最大重试次数" name="exceptionStrategy.retryTimes" :label-col="{ span: 12 }" :wrapper-col="{ span: 12 }">
                    <a-input-number v-model:value="formData.exceptionStrategy.retryTimes" min="1" placeholder="请输入最大重试次数" style="width: 100%" />
                  </a-form-item>
                </a-col>
              </a-row>
            </div>
          </a-collapse-panel>
        </a-collapse>
        
        <a-form-item :wrapper-col="{ offset: 6, span: 16 }" style="margin-top: 24px">
          <a-button type="primary" @click="handleSubmit" :loading="loading">
            保存
          </a-button>
          <a-button style="margin-left: 8px" @click="handleCancel">
            取消
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { message } from 'ant-design-vue'
import { CloseOutlined } from '@ant-design/icons-vue'
import { useRobotStore } from '@/stores/robot'
import type { RobotFormData, ExceptionStrategy } from '@/types'

const router = useRouter()
const route = useRoute()
const robotStore = useRobotStore()

const formRef = ref()
const loading = ref(false)
const robotId = route.params.id as string
const isEdit = !!robotId
const activeKeys = ref<string[]>([])

const formData = reactive<RobotFormData>({
  name: '',
  serialNumber: '',
  model: '',
  batteryThreshold: {
    low: 20,
    critical: 10
  },
  connectionConfig: {
    protocol: 'ws',
    host: 'localhost',
    port: 8080,
    reconnectInterval: 5000,
    heartbeatInterval: 30000,
    timeout: 10000,
    maxReconnectAttempts: 5
  },
  exceptionStrategy: {
    lowBattery: 'return_to_base' as ExceptionStrategy,
    signalLost: 'wait_and_resume' as ExceptionStrategy,
    robotFailure: 'return_to_base' as ExceptionStrategy,
    signalLostRetryCount: 3,
    retryInterval: 30,
    retryTimes: 3
  }
})

const rules = {
  name: [{ required: true, message: '请输入机器人名称', trigger: 'blur' }],
  serialNumber: [{ required: true, message: '请输入序列号', trigger: 'blur' }],
  model: [{ required: true, message: '请输入型号', trigger: 'blur' }]
}

onMounted(() => {
  if (isEdit) {
    const robot = robotStore.getRobotById(robotId)
    if (robot) {
      Object.assign(formData, {
        name: robot.name,
        serialNumber: robot.serialNumber,
        model: robot.model,
        batteryThreshold: { ...robot.batteryThreshold },
        connectionConfig: { ...robot.connectionConfig },
        exceptionStrategy: { ...robot.exceptionStrategy }
      })
    }
  }
})

const handleSubmit = async () => {
  if (formRef.value) {
    await formRef.value.validate()
    loading.value = true
    try {
      if (isEdit) {
        const robot = robotStore.getRobotById(robotId)
        if (robot) {
          robotStore.saveRobot({
            ...robot,
            ...formData,
            updatedAt: new Date()
          })
        }
      } else {
        robotStore.saveRobot(formData)
      }
      message.success(isEdit ? '编辑成功' : '创建成功')
      router.push('/implementation/robot/list')
    } finally {
      loading.value = false
    }
  }
}

const handleCancel = () => {
  router.push('/implementation/robot/list')
}
</script>

<style scoped lang="scss">
.robot-form {
  max-width: 1120px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 16px;
    
    h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
      color: #1f1f1f;
    }
  }

  :deep(.ant-card) {
    border-radius: 12px;
    border: 1px solid #f0f0f0;
    box-shadow: 0 8px 24px rgba(31, 35, 41, 0.04);
  }

  :deep(.ant-card-body) {
    padding: 20px 22px 16px;
  }

  :deep(.ant-form-item-label > label) {
    font-weight: 500;
    color: #262626;
  }

  :deep(.ant-input),
  :deep(.ant-input-number),
  :deep(.ant-select-selector) {
    border-radius: 8px;
  }

  :deep(.ant-input-number) {
    width: 100%;
  }

  .advanced-config-collapse {
    margin-top: 4px;
    background: transparent;
    
    :deep(.ant-collapse-item) {
      border: 1px solid #e6f0ff;
      border-radius: 10px !important;
      overflow: hidden;
      background: #f8fbff;
      
      .ant-collapse-header {
        background: linear-gradient(180deg, #ffffff 0%, #f7fbff 100%);
        padding: 13px 16px !important;
        font-weight: 600;
        color: #1f2937;
        border-bottom: 1px solid #e6f0ff;
        
        .ant-collapse-arrow {
          color: #1890ff;
          font-size: 14px;
        }
      }
      
      .ant-collapse-content {
        border-top: none;
        background: transparent;
        
        .ant-collapse-content-box {
          padding: 12px;
        }
      }
    }
  }

  .config-section {
    margin-bottom: 14px;
    padding: 14px 14px 8px;
    border: 1px solid #edf2f7;
    border-radius: 10px;
    background: #ffffff;
    
    &:last-child {
      margin-bottom: 0;
    }
    
    .section-title {
      display: inline-flex;
      align-items: center;
      height: 30px;
      padding: 0 10px;
      border-radius: 999px;
      background: #eaf4ff;
      color: #175cd3;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 12px;
    }
  }

  .unit-text {
    margin-left: 6px;
    color: #8c8c8c;
    font-size: 12px;
  }

  :deep(.ant-form-item) {
    margin-bottom: 14px;
  }

  :deep(.ant-divider) {
    margin: 18px 0 14px !important;
  }

  @media (max-width: 992px) {
    :deep(.ant-form) {
      .ant-col-12,
      .ant-col-8 {
        width: 100%;
        max-width: 100%;
        flex: 0 0 100%;
      }
    }

    :deep(.ant-card-body) {
      padding: 14px 14px 10px;
    }

    .config-section {
      padding: 12px 12px 6px;
    }
  }
}
</style>
