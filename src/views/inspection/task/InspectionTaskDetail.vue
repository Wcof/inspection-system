
<template>
  <div class="inspection-task-detail">
    <a-page-header title="任务详情" @back="goBack" />

    <a-card style="margin-top: 16px">
      <a-descriptions bordered :column="3" size="small">
        <a-descriptions-item label="任务名称">{{ task?.name || '-' }}</a-descriptions-item>
        <a-descriptions-item label="任务编码">{{ task?.code || '-' }}</a-descriptions-item>
        <a-descriptions-item label="执行机器人">{{ getRobotName(task?.robotId) }}</a-descriptions-item>
        <a-descriptions-item label="所属计划">{{ showPlanName }}</a-descriptions-item>
        <a-descriptions-item label="任务状态">
          <a-tag :color="getStatusColor(task?.status)">{{ getStatusText(task?.status) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="任务总执行时间">{{ task ? getTaskRunTimeText(task) : '-' }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card style="margin-top: 16px" title="任务视图">
      <a-tabs v-model:activeKey="activeView">
        <a-tab-pane key="point" tab="按巡检点查看">
          <a-table :columns="pointColumns" :data-source="inspectionPointRows" row-key="id" :pagination="false">
            <template #bodyCell="{ column, record, index }">
              <template v-if="column.key === 'index'">{{ index + 1 }}</template>
              <template v-else-if="column.key === 'inspectionStatus'">
                <a-tag :color="getPointStatusColor(record.inspectionStatus)">{{ record.inspectionStatus }}</a-tag>
              </template>
              <template v-else-if="column.key === 'inspectionItemCount'">{{ record.inspectionItemCount }}</template>
              <template v-else-if="column.key === 'missedItemCount'">{{ record.missedItemCount }}</template>
              <template v-else-if="column.key === 'timeRange'">{{ record.timeRange }}</template>
            </template>
          </a-table>
        </a-tab-pane>
        <a-tab-pane key="device" tab="按设备查看">
          <a-table :columns="deviceColumns" :data-source="deviceRows" row-key="id" :pagination="false">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'checkItems'">{{ record.checkItems }}</template>
              <template v-else-if="column.key === 'status'">
                <a-tag :color="record.status === '已检测' ? 'green' : 'orange'">{{ record.status }}</a-tag>
              </template>
              <template v-else-if="column.key === 'result'">
                <a-tag :color="record.result === '正常' ? 'green' : 'red'">{{ record.result }}</a-tag>
              </template>
              <template v-else-if="column.key === 'detectionData'">{{ record.detectionData }}</template>
              <template v-else-if="column.key === 'inspectTime'">{{ record.inspectTime }}</template>
              <template v-else-if="column.key === 'opticalShot'">
                <img :src="record.opticalShot" alt="光学截图" class="shot-thumb" />
              </template>
              <template v-else-if="column.key === 'thermalShot'">
                <img :src="record.thermalShot" alt="热成像截图" class="shot-thumb" />
              </template>
              <template v-else-if="column.key === 'prioritySummary'">
                <a-tag color="red" v-if="record.primaryCount">主要 {{ record.primaryCount }}</a-tag>
                <a-tag v-if="record.secondaryCount">次要 {{ record.secondaryCount }}</a-tag>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
        <a-tab-pane key="evidence" tab="采集动作与证据链">
          <a-alert
            type="info"
            show-icon
            message="不可检、未到达、目标缺失不计入有效覆盖，只进入漏检/复核口径。"
            style="margin-bottom: 12px"
          />
          <a-table :columns="evidenceColumns" :data-source="collectionActionRows" row-key="id" :pagination="{ pageSize: 8 }" :scroll="{ x: 1680 }">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'qualityStatus'">
                <a-tag :color="getQualityStatusColor(record.qualityStatus)">{{ getQualityStatusText(record.qualityStatus) }}</a-tag>
              </template>
              <template v-else-if="column.key === 'evidence'">
                <a-space>
                  <img :src="record.evidence.opticalImageUrl" alt="光学图" class="shot-thumb" />
                  <img :src="record.evidence.thermalImageUrl" alt="热成像图" class="shot-thumb" />
                </a-space>
              </template>
              <template v-else-if="column.key === 'robotPose'">
                {{ record.evidence.robotPose }}
              </template>
              <template v-else-if="column.key === 'recognizedValue'">
                {{ record.evidence.recognizedValue }}
              </template>
              <template v-else-if="column.key === 'confidence'">
                {{ Math.round(record.evidence.confidence * 100) }}%
              </template>
              <template v-else-if="column.key === 'ruleVersion'">
                {{ record.evidence.ruleVersion }}
              </template>
              <template v-else-if="column.key === 'manualReview'">
                {{ record.evidence.manualReviewConclusion }}
              </template>
              <template v-else-if="column.key === 'coverage'">
                <a-tag :color="isEffectiveCoverage(record.qualityStatus) ? 'green' : 'orange'">
                  {{ isEffectiveCoverage(record.qualityStatus) ? '计入覆盖' : '不计覆盖' }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import { useRobotStore } from '@/stores/robot'
import type { CollectionQualityStatus, EvidenceChain } from '@/types/inspection'

const router = useRouter()
const route = useRoute()
const inspectionStore = useInspectionStore()
const robotStore = useRobotStore()

const task = ref<any>()
const inspectionPoints = ref<any[]>([])
const activeView = ref('point')

const pointColumns = [
  { title: '序号', key: 'index', width: 80 },
  { title: '巡检点名称', dataIndex: 'name', key: 'name' },
  { title: '编码', dataIndex: 'code', key: 'code', width: 160 },
  { title: '所属分区', dataIndex: 'areaName', key: 'areaName', width: 140 },
  { title: '巡检状态', key: 'inspectionStatus', width: 120 },
  { title: '检测项数量', key: 'inspectionItemCount', width: 120 },
  { title: '漏检项数量', key: 'missedItemCount', width: 120 },
  { title: '时间范围', key: 'timeRange', width: 260 }
]

const deviceColumns = [
  { title: '设备名称', dataIndex: 'name', key: 'name' },
  { title: '所在巡检点', dataIndex: 'pointNames', key: 'pointNames', width: 220 },
  { title: '状态', key: 'status', width: 110 },
  { title: '检测结果', key: 'result', width: 110 },
  { title: '检测数据', key: 'detectionData', width: 220 },
  { title: '监测时间', key: 'inspectTime', width: 190 },
  { title: '光学截图', key: 'opticalShot', width: 120 },
  { title: '热成像截图', key: 'thermalShot', width: 120 },
  { title: '检测项清单', key: 'checkItems' },
  { title: '优先级分布', key: 'prioritySummary', width: 180 }
]

const evidenceColumns = [
  { title: '巡检点', dataIndex: 'pointName', key: 'pointName', width: 160 },
  { title: '停车点', dataIndex: 'parkingPoint', key: 'parkingPoint', width: 180 },
  { title: '采集动作', dataIndex: 'collectionAction', key: 'collectionAction', width: 180 },
  { title: '检测目标', dataIndex: 'targetObject', key: 'targetObject', width: 160 },
  { title: '结果状态', key: 'qualityStatus', width: 130 },
  { title: '覆盖口径', key: 'coverage', width: 110 },
  { title: '证据', key: 'evidence', width: 160 },
  { title: '采样时间', dataIndex: ['evidence', 'sampledAt'], key: 'sampledAt', width: 190 },
  { title: '机器人位姿', key: 'robotPose', width: 180 },
  { title: '识别值', key: 'recognizedValue', width: 140 },
  { title: '置信度', key: 'confidence', width: 100 },
  { title: '规则版本', key: 'ruleVersion', width: 110 },
  { title: '人工复核', key: 'manualReview', width: 180 }
]

function getStatusText(status?: string) {
  return ({ pending: '待执行', running: '执行中', completed: '已完成', paused: '已暂停', cancelled: '已取消', failed: '失败' } as Record<string, string>)[status || ''] || '-'
}

function getStatusColor(status?: string) {
  return ({ pending: 'default', running: 'blue', completed: 'green', paused: 'orange', cancelled: 'default', failed: 'red' } as Record<string, string>)[status || ''] || 'default'
}

function getPointStatusColor(status: string) {
  return ({ '已检': 'green', '待检': 'default', '检测中': 'blue', '存在不可检': 'orange' } as Record<string, string>)[status] || 'default'
}

function getPointInspectionStatus(index: number) {
  if (!task.value) return '待检'
  if (task.value.status === 'completed') return '已检'
  if (task.value.status === 'running') {
    const currentIndex = Math.max(0, Number(task.value.currentInspectionPointIndex || 0))
    if (index < currentIndex) return '已检'
    if (index === currentIndex) return '检测中'
    return '待检'
  }
  if (task.value.status === 'failed' || task.value.status === 'cancelled') {
    const currentIndex = Math.max(0, Number(task.value.currentInspectionPointIndex || 0))
    return index < currentIndex ? '已检' : '待检'
  }
  return '待检'
}

function getMissedItemCount(pointId: string, itemCount: number, inspectionStatus: string) {
  if (inspectionStatus === '待检' || itemCount === 0) return 0
  const pointNo = Number(String(pointId).match(/\d+$/)?.[0] || 0)
  return pointNo % (itemCount + 1)
}

function getQualityStatusText(status: CollectionQualityStatus) {
  return ({
    normal: '正常',
    warning: '预警',
    alarm: '告警',
    critical_alarm: '严重告警',
    skipped: '跳过',
    not_arrived: '未到达',
    blocked: '被遮挡',
    bad_angle: '视角不足',
    blurred: '模糊',
    reflection: '反光',
    target_missing: '目标缺失',
    unreadable: '无法读取'
  } as Record<CollectionQualityStatus, string>)[status]
}

function getQualityStatusColor(status: CollectionQualityStatus) {
  return ({
    normal: 'green',
    warning: 'gold',
    alarm: 'orange',
    critical_alarm: 'red',
    skipped: 'default',
    not_arrived: 'volcano',
    blocked: 'orange',
    bad_angle: 'purple',
    blurred: 'cyan',
    reflection: 'blue',
    target_missing: 'magenta',
    unreadable: 'red'
  } as Record<CollectionQualityStatus, string>)[status]
}

function isEffectiveCoverage(status: CollectionQualityStatus) {
  return ['normal', 'warning', 'alarm', 'critical_alarm'].includes(status)
}

function getDetectionValue(item: any, deviceNo: number) {
  const unit = String(item.unit || '')
  const name = String(item.name || '')
  if (name.includes('温度') || unit.includes('℃') || unit.includes('°C')) {
    return `${12 + (deviceNo % 9)}°C`
  }
  if (name.includes('压力') || unit.includes('MPa')) {
    return `${(0.8 + (deviceNo % 6) * 0.3).toFixed(1)}MPa`
  }
  if (name.includes('液位') || unit === 'm') {
    return `${(2 + (deviceNo % 5) * 0.6).toFixed(1)}m`
  }
  if (unit) {
    return `${(5 + (deviceNo % 7)).toFixed(1)}${unit}`
  }
  return `${5 + (deviceNo % 7)}`
}

function getRobotName(robotId?: string) {
  if (!robotId) return '-'
  return robotStore.robots.find((robot: any) => robot.id === robotId)?.name || robotId
}

function getPlanName(planId?: string) {
  if (!planId) return '-'
  return inspectionStore.inspectionPlans.find((plan: any) => plan.id === planId)?.name || '-'
}

const showPlanName = computed(() => task.value?.planId ? getPlanName(task.value.planId) : '-')

function getTaskStart(taskValue: any) {
  return taskValue?.schedule?.startTime ? new Date(taskValue.schedule.startTime) : new Date(taskValue?.createdAt || Date.now())
}

function getTaskEnd(taskValue: any) {
  if (taskValue?.schedule?.endTime) return new Date(taskValue.schedule.endTime)
  return new Date(getTaskStart(taskValue).getTime() + ((taskValue?.inspectionPointIds?.length || 1) * 8 * 60 * 1000))
}

function getTaskRunTimeText(taskValue: any) {
  const start = getTaskStart(taskValue)
  const end = getTaskEnd(taskValue)
  return `${start.toLocaleString()} ~ ${end.toLocaleString()}`
}

const inspectionPointRows = computed(() => {
  const start = task.value ? getTaskStart(task.value) : new Date()
  return inspectionPoints.value.map((point: any, index: number) => {
    const pointStart = new Date(start.getTime() + index * 8 * 60 * 1000)
    const pointEnd = new Date(pointStart.getTime() + 8 * 60 * 1000)
    const devices = inspectionStore.inspectionDevices.filter((device: any) => device.inspectionPointId === point.id)
    const itemCount = inspectionStore.inspectionDeviceCheckItems.filter((item: any) => devices.some((device: any) => device.id === item.deviceId)).length
    const inspectionStatus = getPointInspectionStatus(index)
    return {
      ...point,
      areaName: point.areaName || '-',
      inspectionStatus,
      inspectionItemCount: itemCount,
      missedItemCount: getMissedItemCount(point.id, itemCount, inspectionStatus),
      timeRange: `${pointStart.toLocaleString()} ~ ${pointEnd.toLocaleString()}`
    }
  })
})

const deviceRows = computed(() => {
  const opticalImage = new URL('../../../设备.png', import.meta.url).href
  const thermalImage = new URL('../../../车间.png', import.meta.url).href
  const taskStart = task.value ? getTaskStart(task.value) : new Date()
  const deviceMap = new Map<string, any>()
  inspectionPoints.value.forEach((point: any) => {
    inspectionStore.inspectionDevices.filter((device: any) => device.inspectionPointId === point.id).forEach((device: any) => {
      const items = inspectionStore.inspectionDeviceCheckItems.filter((item: any) => item.deviceId === device.id)
      const deviceNo = Number(String(device.id).replace(/\D/g, '')) || 0
      const isChecked = deviceNo % 2 === 1
      const result = isChecked ? (deviceNo % 3 === 0 ? '异常' : '正常') : '-'
      const inspectTime = isChecked
        ? new Date(taskStart.getTime() + (deviceNo % 7) * 6 * 60 * 1000).toLocaleString()
        : '-'
      const current = deviceMap.get(device.id) || {
        id: device.id,
        name: device.name,
        pointNames: [],
        status: isChecked ? '已检测' : '待检测',
        result,
        detectionData: '-',
        inspectTime,
        opticalShot: opticalImage,
        thermalShot: thermalImage,
        checkItems: '',
        primaryCount: 0,
        secondaryCount: 0
      }
      current.pointNames.push(point.name)
      current.checkItems = items.map((item: any) => item.name).join('、') || '-'
      current.detectionData = isChecked
        ? (items.map((item: any) => `${item.name} ${getDetectionValue(item, deviceNo)}`).join('；') || '-')
        : '-'
      current.primaryCount = items.filter((item: any) => item.priority === 'primary').length
      current.secondaryCount = items.filter((item: any) => (item.priority || 'secondary') !== 'primary').length
      deviceMap.set(device.id, current)
    })
  })
  return Array.from(deviceMap.values()).map((row: any) => ({ ...row, pointNames: row.pointNames.join('、') }))
})

const collectionActionRows = computed(() => {
  const opticalImage = new URL('../../../设备.png', import.meta.url).href
  const thermalImage = new URL('../../../车间.png', import.meta.url).href
  const statuses: CollectionQualityStatus[] = ['normal', 'warning', 'alarm', 'blocked', 'bad_angle', 'reflection', 'target_missing', 'not_arrived', 'unreadable']
  const taskStart = task.value ? getTaskStart(task.value) : new Date()
  const rows: Array<{
    id: string
    pointName: string
    parkingPoint: string
    collectionAction: string
    targetObject: string
    qualityStatus: CollectionQualityStatus
    evidence: EvidenceChain
  }> = []

  inspectionPoints.value.forEach((point: any, pointIndex: number) => {
    const devices = inspectionStore.inspectionDevices.filter((device: any) => device.inspectionPointId === point.id)
    devices.forEach((device: any, deviceIndex: number) => {
      const items = inspectionStore.inspectionDeviceCheckItems.filter((item: any) => item.deviceId === device.id)
      const resolvedItems = items.length ? items : [{ id: `${device.id}-default`, name: '默认外观检测', unit: '-' }]
      resolvedItems.forEach((item: any, itemIndex: number) => {
        const seed = pointIndex + deviceIndex + itemIndex
        const status = statuses[seed % statuses.length]
        const sampledAt = new Date(taskStart.getTime() + (seed + 1) * 5 * 60 * 1000).toLocaleString()
        rows.push({
          id: `${point.id}-${device.id}-${item.id}`,
          pointName: point.name,
          parkingPoint: `${point.name}-${seed % 2 === 0 ? '正前方停车点' : '侧向停车点'}`,
          collectionAction: `${seed % 2 === 0 ? '正拍' : '侧拍'}-${item.name}`,
          targetObject: item.targetObject || device.name,
          qualityStatus: status,
          evidence: {
            opticalImageUrl: opticalImage,
            thermalImageUrl: thermalImage,
            sampledAt,
            robotPose: `X${120 + seed * 3}, Y${86 + seed * 2}, Yaw${(seed * 18) % 360}°`,
            recognizedValue: isEffectiveCoverage(status) ? getDetectionValue(item, seed + 1) : getQualityStatusText(status),
            confidence: isEffectiveCoverage(status) ? Math.max(0.72, 0.96 - seed * 0.03) : Math.max(0.38, 0.62 - seed * 0.02),
            ruleVersion: `R-${new Date().getFullYear()}.04.${(seed % 4) + 1}`,
            manualReviewConclusion: isEffectiveCoverage(status) ? '待抽检' : '需人工复核'
          }
        })
      })
    })
  })

  return rows
})

function goBack() {
  router.back()
}

onMounted(() => {
  inspectionStore.initialize()
  robotStore.initialize()
  task.value = inspectionStore.getTaskById(route.params.id as string)
  inspectionPoints.value = (task.value?.inspectionPointIds || []).map((id: string) => inspectionStore.getInspectionPointById(id)).filter(Boolean)
})
</script>

<style scoped lang="css">
.shot-thumb {
  width: 64px;
  height: 44px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #f0f0f0;
}
</style>
