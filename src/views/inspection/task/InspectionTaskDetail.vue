
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
              <template v-else-if="column.key === 'inspectionItemCount'">{{ record.inspectionItemCount }}</template>
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
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import { useRobotStore } from '@/stores/robot'

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
  { title: '检测项数量', key: 'inspectionItemCount', width: 120 },
  { title: '时间范围', key: 'timeRange', width: 260 }
]

const deviceColumns = [
  { title: '设备名称', dataIndex: 'name', key: 'name' },
  { title: '所在巡检点', dataIndex: 'pointNames', key: 'pointNames', width: 220 },
  { title: '状态', key: 'status', width: 110 },
  { title: '检测结果', key: 'result', width: 110 },
  { title: '监测时间', key: 'inspectTime', width: 190 },
  { title: '光学截图', key: 'opticalShot', width: 120 },
  { title: '热成像截图', key: 'thermalShot', width: 120 },
  { title: '检测项清单', key: 'checkItems' },
  { title: '优先级分布', key: 'prioritySummary', width: 180 }
]

function getStatusText(status?: string) {
  return ({ pending: '待执行', running: '执行中', completed: '已完成', paused: '已暂停', cancelled: '已取消', failed: '失败' } as Record<string, string>)[status || ''] || '-'
}

function getStatusColor(status?: string) {
  return ({ pending: 'default', running: 'blue', completed: 'green', paused: 'orange', cancelled: 'default', failed: 'red' } as Record<string, string>)[status || ''] || 'default'
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
    return {
      ...point,
      inspectionItemCount: itemCount,
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
        inspectTime,
        opticalShot: opticalImage,
        thermalShot: thermalImage,
        checkItems: '',
        primaryCount: 0,
        secondaryCount: 0
      }
      current.pointNames.push(point.name)
      current.checkItems = items.map((item: any) => item.name).join('、') || '-'
      current.primaryCount = items.filter((item: any) => item.priority === 'primary').length
      current.secondaryCount = items.filter((item: any) => (item.priority || 'secondary') !== 'primary').length
      deviceMap.set(device.id, current)
    })
  })
  return Array.from(deviceMap.values()).map((row: any) => ({ ...row, pointNames: row.pointNames.join('、') }))
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
