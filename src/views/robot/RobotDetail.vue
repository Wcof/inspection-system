<template>
  <div class="robot-detail">
    <div class="page-header">
      <h2>机器人详情</h2>
      <a-button @click="handleBack">
        <template #icon>
          <LeftOutlined />
        </template>
        返回
      </a-button>
    </div>
    
    <a-card style="margin-top: 16px">
      <a-row :gutter="[16, 16]">
        <a-col :span="12">
          <a-descriptions title="基本信息" column={2}>
            <a-descriptions-item label="机器人名称">{{ robot?.name }}</a-descriptions-item>
            <a-descriptions-item label="序列号">{{ robot?.serialNumber }}</a-descriptions-item>
            <a-descriptions-item label="型号">{{ robot?.model }}</a-descriptions-item>
            <a-descriptions-item label="状态">
              <a-tag :color="getStatusColor(robot?.status)">{{ getStatusText(robot?.status) }}</a-tag>
            </a-descriptions-item>
            <a-descriptions-item label="电量">
              <a-progress 
                :percent="robot?.batteryLevel" 
                :status="getBatteryStatus(robot?.batteryLevel)"
                size="small"
              />
            </a-descriptions-item>
            <a-descriptions-item label="最后在线时间">{{ formatDate(robot?.lastOnlineTime) }}</a-descriptions-item>
          </a-descriptions>
        </a-col>
        <a-col :span="12">
          <a-descriptions title="异常策略" column={1}>
            <a-descriptions-item label="低电量策略">{{ getStrategyText(robot?.exceptionStrategy?.lowBattery) }}</a-descriptions-item>
            <a-descriptions-item label="信号丢失策略">{{ getStrategyText(robot?.exceptionStrategy?.signalLost) }}</a-descriptions-item>
            <a-descriptions-item label="机器人故障策略">{{ getStrategyText(robot?.exceptionStrategy?.robotFailure) }}</a-descriptions-item>
            <a-descriptions-item label="信号丢失重试次数">{{ robot?.exceptionStrategy?.signalLostRetryCount }}</a-descriptions-item>
            <a-descriptions-item label="重试间隔">{{ robot?.exceptionStrategy?.retryInterval }}秒</a-descriptions-item>
            <a-descriptions-item label="最大重试次数">{{ robot?.exceptionStrategy?.retryTimes }}</a-descriptions-item>
          </a-descriptions>
        </a-col>
      </a-row>
      
      <a-divider style="margin: 24px 0" />
      
      <a-descriptions title="连接配置" column={2}>
        <a-descriptions-item label="协议">{{ robot?.connectionConfig?.protocol }}</a-descriptions-item>
        <a-descriptions-item label="主机">{{ robot?.connectionConfig?.host }}</a-descriptions-item>
        <a-descriptions-item label="端口">{{ robot?.connectionConfig?.port }}</a-descriptions-item>
        <a-descriptions-item label="重连间隔">{{ robot?.connectionConfig?.reconnectInterval }}ms</a-descriptions-item>
        <a-descriptions-item label="心跳间隔">{{ robot?.connectionConfig?.heartbeatInterval }}ms</a-descriptions-item>
        <a-descriptions-item label="超时时间">{{ robot?.connectionConfig?.timeout }}ms</a-descriptions-item>
        <a-descriptions-item label="最大重连次数">{{ robot?.connectionConfig?.maxReconnectAttempts }}</a-descriptions-item>
      </a-descriptions>
      
      <div style="margin-top: 24px; text-align: right">
        <a-button type="primary" @click="handleEdit">
          编辑
        </a-button>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { LeftOutlined } from '@ant-design/icons-vue'
import { useRobotStore } from '@/stores/robot'
import { RobotStatus, ExceptionStrategy } from '@/types'

const router = useRouter()
const route = useRoute()
const robotStore = useRobotStore()

const robotId = route.params.id as string
const robot = computed(() => robotStore.getRobotById(robotId))

onMounted(() => {
  robotStore.fetchAllRobots()
})

const getStatusColor = (status?: RobotStatus): string => {
  if (!status) return 'default'
  switch (status) {
    case RobotStatus.ONLINE:
      return 'green'
    case RobotStatus.CHARGING:
      return 'blue'
    case RobotStatus.PATROLLING:
      return 'orange'
    case RobotStatus.ERROR:
      return 'red'
    default:
      return 'default'
  }
}

const getStatusText = (status?: RobotStatus): string => {
  if (!status) return ''
  switch (status) {
    case RobotStatus.ONLINE:
      return '在线'
    case RobotStatus.OFFLINE:
      return '离线'
    case RobotStatus.CHARGING:
      return '充电中'
    case RobotStatus.PATROLLING:
      return '巡检中'
    case RobotStatus.ERROR:
      return '异常'
    case RobotStatus.PAUSED:
      return '暂停'
    case RobotStatus.RETURNING:
      return '返回中'
    default:
      return status
  }
}

const getBatteryStatus = (level?: number): 'success' | 'warning' | 'exception' | undefined => {
  if (level === undefined) return undefined
  if (level < 10) return 'exception'
  if (level < 20) return 'warning'
  return 'success'
}

const getStrategyText = (strategy?: ExceptionStrategy): string => {
  if (!strategy) return ''
  switch (strategy) {
    case ExceptionStrategy.RETURN_TO_BASE:
      return '返回基站'
    case ExceptionStrategy.SKIP:
      return '跳过继续'
    case ExceptionStrategy.RETRY:
      return '重试'
    case ExceptionStrategy.WAIT_AND_RESUME:
      return '等待恢复'
    case ExceptionStrategy.ABORT:
      return '中止任务'
    case ExceptionStrategy.NOTIFY:
      return '仅通知'
    default:
      return strategy
  }
}

const formatDate = (date?: Date): string => {
  if (!date) return ''
  return new Date(date).toLocaleString()
}

const handleBack = () => {
  router.push('/implementation/robot/list')
}

const handleEdit = () => {
  router.push(`/implementation/robot/form/${robotId}`)
}
</script>

<style scoped lang="scss">
.robot-detail {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h2 {
      margin: 0;
      font-size: 20px;
    }
  }
}
</style>