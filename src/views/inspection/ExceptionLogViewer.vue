<template>
  <div class="exception-log-viewer">
    <div class="page-header">
      <h2>异常日志</h2>
    </div>
    
    <a-card style="margin-top: 16px">
      <a-table :data-source="exceptionLogs" row-key="id" :loading="loading">
        <a-table-column title="序号" data-index="index" width="80px">
          <template #default="{ index }">
            {{ index + 1 }}
          </template>
        </a-table-column>
        <a-table-column title="任务名称" data-index="taskId" width="150px">
          <template #default="{ record }">
            {{ getTaskName(record.taskId) }}
          </template>
        </a-table-column>
        <a-table-column title="异常类型" data-index="type" width="150px">
          <template #default="{ record }">
            <a-tag :color="getExceptionTypeColor(record.type)">{{ getExceptionTypeText(record.type) }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="描述" data-index="description" />
        <a-table-column title="应用策略" data-index="strategyApplied" width="120px">
          <template #default="{ record }">
            {{ getStrategyText(record.strategyApplied) }}
          </template>
        </a-table-column>
        <a-table-column title="发生时间" data-index="timestamp" width="180px">
          <template #default="{ record }">
            {{ formatDate(record.timestamp) }}
          </template>
        </a-table-column>
        <a-table-column title="状态" data-index="resolved" width="100px" align="center">
          <template #default="{ record }">
            <a-tag v-if="record.resolved" color="green">已解决</a-tag>
            <a-tag v-else color="red">未解决</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="操作" width="100px" align="center">
          <template #default="{ record }">
            <a-button 
              v-if="!record.resolved"
              type="link" 
              @click="handleResolve(record.id)"
            >
              解决
            </a-button>
          </template>
        </a-table-column>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useInspectionStore } from '@/stores/inspection'
import { ExceptionLog, ExceptionType, ExceptionStrategy } from '@/types'

const inspectionStore = useInspectionStore()
const exceptionLogs = ref<ExceptionLog[]>([])
const loading = ref(false)

onMounted(() => {
  // 初始化异常日志数据
  // 实际项目中，这里应该从存储中获取异常日志
  exceptionLogs.value = [
    {
      id: 'log-001',
      taskId: 'task-001',
      type: ExceptionType.LOW_BATTERY,
      timestamp: new Date(),
      description: '机器人电量低于阈值',
      strategyApplied: ExceptionStrategy.RETURN_TO_BASE,
      resolved: false
    },
    {
      id: 'log-002',
      taskId: 'task-001',
      type: ExceptionType.SIGNAL_LOST,
      timestamp: new Date(Date.now() - 3600000),
      description: '机器人信号丢失',
      strategyApplied: ExceptionStrategy.WAIT_AND_RESUME,
      resolved: true,
      resolvedAt: new Date(),
      resolutionNote: '信号已恢复'
    }
  ]
})

const getTaskName = (taskId: string): string => {
  const task = inspectionStore.getTaskById(taskId)
  return task?.name || taskId
}

const getExceptionTypeColor = (type: ExceptionType): string => {
  switch (type) {
    case ExceptionType.LOW_BATTERY:
      return 'orange'
    case ExceptionType.SIGNAL_LOST:
      return 'blue'
    case ExceptionType.ROBOT_FAILURE:
      return 'red'
    case ExceptionType.INSPECTION_POINT_FAILURE:
      return 'purple'
    case ExceptionType.TASK_TIMEOUT:
      return 'yellow'
    case ExceptionType.OBSTACLE_DETECTED:
      return 'cyan'
    default:
      return 'default'
  }
}

const getExceptionTypeText = (type: ExceptionType): string => {
  switch (type) {
    case ExceptionType.INSPECTION_POINT_FAILURE:
      return '巡检点故障'
    case ExceptionType.ROBOT_FAILURE:
      return '机器人故障'
    case ExceptionType.LOW_BATTERY:
      return '低电量'
    case ExceptionType.SIGNAL_LOST:
      return '信号丢失'
    case ExceptionType.TASK_TIMEOUT:
      return '任务超时'
    case ExceptionType.OBSTACLE_DETECTED:
      return '检测到障碍物'
    default:
      return type
  }
}

const getStrategyText = (strategy: ExceptionStrategy): string => {
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

const formatDate = (date: Date): string => {
  return new Date(date).toLocaleString()
}

const handleResolve = (logId: string) => {
  Modal.confirm({
    title: '标记为已解决',
    content: '确定要将此异常标记为已解决吗？',
    onOk: () => {
      const log = exceptionLogs.value.find(l => l.id === logId)
      if (log) {
        log.resolved = true
        log.resolvedAt = new Date()
        log.resolutionNote = '已手动解决'
        message.success('异常已标记为已解决')
      }
    }
  })
}
</script>

<style scoped lang="scss">
.exception-log-viewer {
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