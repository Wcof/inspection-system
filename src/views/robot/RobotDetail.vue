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
          <a-descriptions title="基本信息" :column="2">
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
          <a-descriptions title="异常策略" :column="1">
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
      
      <a-descriptions title="连接配置" :column="2">
        <a-descriptions-item label="协议">{{ robot?.connectionConfig?.protocol }}</a-descriptions-item>
        <a-descriptions-item label="主机">{{ robot?.connectionConfig?.host }}</a-descriptions-item>
        <a-descriptions-item label="端口">{{ robot?.connectionConfig?.port }}</a-descriptions-item>
        <a-descriptions-item label="重连间隔">{{ robot?.connectionConfig?.reconnectInterval }}ms</a-descriptions-item>
        <a-descriptions-item label="心跳间隔">{{ robot?.connectionConfig?.heartbeatInterval }}ms</a-descriptions-item>
        <a-descriptions-item label="超时时间">{{ robot?.connectionConfig?.timeout }}ms</a-descriptions-item>
        <a-descriptions-item label="最大重连次数">{{ robot?.connectionConfig?.maxReconnectAttempts }}</a-descriptions-item>
      </a-descriptions>

      <a-divider style="margin: 24px 0" />

      <a-descriptions title="版本信息" :column="2">
        <a-descriptions-item label="固件版本">{{ robot?.versionInfo?.firmwareVersion || '-' }}</a-descriptions-item>
        <a-descriptions-item label="硬件版本">{{ robot?.versionInfo?.hardwareVersion || '-' }}</a-descriptions-item>
        <a-descriptions-item label="软件版本">{{ robot?.versionInfo?.softwareVersion || '-' }}</a-descriptions-item>
        <a-descriptions-item label="最近固件更新">{{ formatDate(robot?.versionInfo?.lastFirmwareUpdate) || '-' }}</a-descriptions-item>
        <a-descriptions-item label="最近软件更新">{{ formatDate(robot?.versionInfo?.lastSoftwareUpdate) || '-' }}</a-descriptions-item>
      </a-descriptions>

      <a-divider style="margin: 24px 0" />

      <div class="widget-section">
        <div class="widget-header">
          <h3 style="margin: 0 0 16px 0">挂件信息</h3>
        </div>
        <a-tabs v-model:activeKey="activeWidgetTab" type="card">
          <a-tab-pane v-for="category in widgetCategories" :key="category.key" :tab="category.label">
            <a-table 
              :columns="widgetColumns" 
              :data-source="getWidgetsByCategory(category.key)" 
              :pagination="false"
              size="small"
              row-key="id"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'status'">
                  <a-tag :color="getWidgetStatusColor(record.status)">{{ getWidgetStatusText(record.status) }}</a-tag>
                </template>
                <template v-if="column.key === 'maintenance'">
                  {{ formatDate(record.nextMaintenanceDate) || '-' }}
                </template>
              </template>
            </a-table>
          </a-tab-pane>
        </a-tabs>
      </div>
      
      <div style="margin-top: 24px; text-align: right">
        <a-button type="primary" @click="handleEdit">
          编辑
        </a-button>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { LeftOutlined } from '@ant-design/icons-vue'
import { useRobotStore } from '@/stores/robot'
import { RobotStatus, ExceptionStrategy } from '@/types'
import type { RobotAttachment } from '@/types/robot'

const router = useRouter()
const route = useRoute()
const robotStore = useRobotStore()

const robotId = route.params.id as string
const robot = computed(() => robotStore.getRobotById(robotId))
const activeWidgetTab = ref('chassis')

// 挂件分类
const widgetCategories = [
  { key: 'chassis', label: '底盘' },
  { key: 'sensor', label: '传感器' },
  { key: 'power', label: '电源' },
  { key: 'communication', label: '通信' },
  { key: 'other', label: '其他' }
]

// 挂件表格列
const widgetColumns = [
  { title: '名称', dataIndex: 'name', key: 'name', width: 120 },
  { title: '型号', dataIndex: 'model', key: 'model', width: 150 },
  { title: '序列号', dataIndex: 'serialNumber', key: 'serialNumber', width: 150 },
  { title: '状态', key: 'status', width: 100 },
  { title: '厂商', dataIndex: 'manufacturer', key: 'manufacturer', width: 120 },
  { title: '下次维护', key: 'maintenance', width: 120 },
  { title: '备注', dataIndex: 'remark', key: 'remark' }
]

// 获取挂件数据（优先使用接口数据，否则使用默认数据）
const attachments = computed<RobotAttachment[]>(() => {
  if (robot.value?.attachments && robot.value.attachments.length > 0) {
    return robot.value.attachments
  }
  // 默认数据
  const model = robot.value?.model || 'Patrol-X1'
  return [
    { id: '1', name: '底盘', model: `${model}-CHASSIS`, category: 'chassis', status: 'normal', manufacturer: '极客光年' },
    { id: '2', name: '双目摄像头', model: `${model}-BI-CAM`, category: 'sensor', status: 'normal', manufacturer: '极客光年' },
    { id: '3', name: '热成像', model: `${model}-THERMAL`, category: 'sensor', status: 'normal', manufacturer: '极客光年' },
    { id: '4', name: '激光雷达', model: `${model}-LIDAR`, category: 'sensor', status: 'normal', manufacturer: '极客光年' },
    { id: '5', name: '电池', model: `${model}-BATTERY`, category: 'power', status: (robot.value?.batteryLevel || 0) < 20 ? 'warning' : 'normal', manufacturer: '极客光年' },
    { id: '6', name: '通信模块', model: `${model}-COMM`, category: 'communication', status: 'normal', manufacturer: '极客光年' }
  ]
})

// 按分类筛选挂件
const getWidgetsByCategory = (category: string) => {
  return attachments.value.filter(item => item.category === category)
}

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

// 挂件状态颜色
const getWidgetStatusColor = (status: string): string => {
  switch (status) {
    case 'normal': return 'green'
    case 'warning': return 'orange'
    case 'error': return 'red'
    case 'offline': return 'default'
    default: return 'default'
  }
}

// 挂件状态文本
const getWidgetStatusText = (status: string): string => {
  switch (status) {
    case 'normal': return '正常'
    case 'warning': return '告警'
    case 'error': return '异常'
    case 'offline': return '离线'
    default: return status
  }
}

const handleBack = () => {
  router.push('/implementation/robot/list')
}

const handleEdit = () => {
  router.push(`/implementation/robot/form/${robotId}`)
}
</script>

<style scoped lang="css">
.robot-detail .page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.robot-detail .page-header h2 {
  margin: 0;
  font-size: 20px;
}
.widget-section {
  margin-top: 16px;
}
.widget-section :deep(.ant-tabs-card) > .ant-tabs-nav .ant-tabs-tab {
  background: #fafafa;
  border-color: #e8e8e8;
  padding: 8px 16px;
}
.widget-section :deep(.ant-tabs-card) > .ant-tabs-nav .ant-tabs-tab-active {
  background: #fff;
  border-bottom-color: #fff;
}
.widget-section :deep(.ant-table-small) {
  font-size: 13px;
}
</style>
