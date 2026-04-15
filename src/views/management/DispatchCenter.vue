<template>
  <div class="dispatch-center">
    <div class="page-header">
      <h2>总调度台</h2>
    </div>

    <DispatchControlBar
      :control="control"
      @update:control="onControlUpdate"
      @create-temporary="openTemporary()"
      @refresh="refreshData"
    />

    <DispatchSummaryCards :summary="summary" />

    <div class="content-layout">
      <div class="left-side">
        <DispatchBoardColumns
          :running-tasks="runningTasks"
          :pending-tasks="pendingTasks"
          :pending-process-tasks="pendingProcessTasks"
          :records="records"
          @task-action="handleTaskAction"
        />
      </div>
      <div class="map-panel">
        <DispatchMapPanel :markers="mapMarkers" @map-context-create="openTemporaryFromMap" />
      </div>
    </div>

    <TemporaryDispatchModal
      v-model:visible="temporaryVisible"
      :running-task-exists="runningTasks.length > 0"
      :robot-options="robotOptions"
      :inspection-point-options="inspectionPointOptions"
      :charging-point-options="chargingPointOptions"
      :parking-point-options="parkingPointOptions"
      :prefill="temporaryPrefill"
      @submit="submitTemporaryDispatch"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import DispatchControlBar from './dispatch-center/DispatchControlBar.vue'
import DispatchSummaryCards from './dispatch-center/DispatchSummaryCards.vue'
import DispatchBoardColumns from './dispatch-center/DispatchBoardColumns.vue'
import DispatchMapPanel from './dispatch-center/DispatchMapPanel.vue'
import TemporaryDispatchModal from './dispatch-center/TemporaryDispatchModal.vue'
import type { DispatchControlState } from './dispatch-center/DispatchControlBar.vue'
import type { DispatchSummary } from './dispatch-center/DispatchSummaryCards.vue'
import type { DispatchTask, DispatchRecordItem } from './dispatch-center/DispatchBoardColumns.vue'
import type { MapMarker } from './dispatch-center/DispatchMapPanel.vue'
import type { TemporaryDispatchForm } from './dispatch-center/TemporaryDispatchModal.vue'

interface RobotState {
  id: string
  name: string
  status: 'idle' | 'running' | 'charging'
}

const control = reactive<DispatchControlState>({
  autoDispatchEnabled: true,
  allowAutoCreate: true,
  allowQueueJump: true,
  mode: 'auto'
})

const temporaryVisible = ref(false)
const temporaryPrefill = ref<Partial<TemporaryDispatchForm>>({})

const robots = ref<RobotState[]>([
  { id: 'robot-001', name: '机器人A001', status: 'running' },
  { id: 'robot-002', name: '机器人A002', status: 'running' },
  { id: 'robot-003', name: '机器人A003', status: 'idle' },
  { id: 'robot-004', name: '机器人A004', status: 'charging' },
  { id: 'robot-005', name: '机器人A005', status: 'idle' },
  { id: 'robot-006', name: '机器人A006', status: 'charging' }
])

const tasks = ref<DispatchTask[]>([
  {
    id: 'task-001',
    name: '计划巡检-变电站A区',
    type: 'plan',
    status: 'running',
    robotName: '机器人A001',
    priority: 'high',
    createdAt: '2026-04-12 08:30',
    startedAt: '2026-04-12 09:00',
    progressPercent: 75,
    doneCount: 9,
    totalCount: 12,
    etaTime: '12:30'
  },
  {
    id: 'task-002',
    name: '计划巡检-生产车间1楼',
    type: 'plan',
    status: 'running',
    robotName: '机器人A002',
    priority: 'medium',
    createdAt: '2026-04-12 08:50',
    startedAt: '2026-04-12 09:15',
    progressPercent: 60,
    doneCount: 6,
    totalCount: 10,
    etaTime: '13:10'
  },
  {
    id: 'task-003',
    name: '计划巡检-办公区',
    type: 'plan',
    status: 'pending',
    robotName: '机器人A003',
    priority: 'medium',
    createdAt: '2026-04-12 08:35',
    scheduledAt: '11:30',
    queueOrder: 1
  },
  {
    id: 'task-004',
    name: '计划巡检-仓库区域',
    type: 'plan',
    status: 'pending',
    robotName: '机器人A006',
    priority: 'low',
    createdAt: '2026-04-12 08:36',
    scheduledAt: '12:30',
    queueOrder: 2
  },
  {
    id: 'task-005',
    name: '自动调度-配电柜A15',
    type: 'auto',
    status: 'auto_pending',
    robotName: '机器人A005',
    reason: '漏检补偿',
    priority: 'high',
    createdAt: '10:45'
  },
  {
    id: 'task-006',
    name: '自动调度-电机B07',
    type: 'auto',
    status: 'auto_pending',
    robotName: '机器人A004',
    reason: '巡检超时',
    priority: 'medium',
    createdAt: '10:50'
  },
  {
    id: 'task-007',
    name: '临时巡检-危化区',
    type: 'temp',
    status: 'conflict',
    robotName: '机器人A002',
    reason: '机器人资源冲突',
    affectedTaskName: '计划巡检-变电站A区',
    priority: 'high',
    createdAt: '10:40',
    scheduledAt: '11:00'
  }
])

const records = ref<DispatchRecordItem[]>([
  {
    id: 'record-001',
    time: '09:30',
    event: '自动调度生成任务：自动补检-配电柜A15',
    taskName: '自动调度-配电柜A15',
    resultStatus: 'pending',
    source: 'auto'
  },
  {
    id: 'record-002',
    time: '09:25',
    event: '临时调度任务：临时巡检-电梯区域',
    taskName: '临时巡检-电梯区域',
    resultStatus: 'running',
    source: 'temp'
  },
  {
    id: 'record-003',
    time: '09:20',
    event: '冲突处理：插队执行-计划巡检-变电站B区',
    taskName: '计划巡检-变电站B区',
    resultStatus: 'running',
    source: 'manual'
  }
])

const mapMarkers = ref<MapMarker[]>([
  { id: 'm-r1', label: '机器人001', markerType: 'robot', x: 34, y: 22, status: 'running', speedKmh: 6.8, taskShortName: '变电站A区', relatedRobotId: 'robot-001' },
  { id: 'm-r2', label: '机器人002', markerType: 'robot', x: 18, y: 49, status: 'charging', speedKmh: 0, taskShortName: '回充中', relatedRobotId: 'robot-002' },
  { id: 'm-r3', label: '机器人003', markerType: 'robot', x: 85, y: 58, status: 'idle', speedKmh: 0, taskShortName: '待命', relatedRobotId: 'robot-003' },
  { id: 'p-i1', label: '巡检点-A12', markerType: 'inspection', x: 35, y: 29, todayPlannedCount: 8, inspectedCount: 6, status: 'running' },
  { id: 'p-i2', label: '巡检点-B05', markerType: 'inspection', x: 25, y: 64, todayPlannedCount: 5, inspectedCount: 2, status: 'pending' },
  { id: 'p-c1', label: '充电站-C1', markerType: 'charging', x: 78, y: 18, chargingCount: 2, parkedCount: 1, status: 'charging' },
  { id: 'p-p1', label: '停车点-P1', markerType: 'parking', x: 12, y: 82, parkedCount: 3, status: 'idle' }
])

const runningTasks = computed(() => tasks.value.filter(task => task.status === 'running'))
const pendingTasks = computed(() =>
  tasks.value
    .filter(task => task.status === 'pending')
    .sort((a, b) => (a.queueOrder || 999) - (b.queueOrder || 999))
)
const pendingProcessTasks = computed(() => tasks.value.filter(task => task.status === 'auto_pending' || task.status === 'conflict'))

const robotOptions = computed(() => robots.value.map(robot => ({ value: robot.id, label: robot.name })))
const inspectionPointOptions = computed(() => mapMarkers.value.filter(m => m.markerType === 'inspection').map(m => ({ value: m.id, label: m.label })))
const chargingPointOptions = computed(() => mapMarkers.value.filter(m => m.markerType === 'charging').map(m => ({ value: m.id, label: m.label })))
const parkingPointOptions = computed(() => mapMarkers.value.filter(m => m.markerType === 'parking').map(m => ({ value: m.id, label: m.label })))

const summary = computed<DispatchSummary>(() => {
  const robotIdle = robots.value.filter(robot => robot.status === 'idle').length
  const robotRunning = robots.value.filter(robot => robot.status === 'running').length
  const robotCharging = robots.value.filter(robot => robot.status === 'charging').length
  const completedTaskCount = tasks.value.filter(task => task.status === 'paused' || task.status === 'cancelled').length
  return {
    task: {
      total: tasks.value.filter(task => task.status !== 'cancelled').length,
      running: runningTasks.value.length,
      pending: pendingTasks.value.length,
      completed: completedTaskCount,
      auto: pendingProcessTasks.value.length
    },
    plan: {
      total: 18,
      running: 6,
      pending: 7,
      completed: 3,
      auto: 2
    },
    robot: {
      total: robots.value.length,
      idle: robotIdle,
      running: robotRunning,
      charging: robotCharging
    }
  }
})

function onControlUpdate(value: DispatchControlState) {
  control.autoDispatchEnabled = value.autoDispatchEnabled
  control.allowAutoCreate = value.autoDispatchEnabled ? true : value.allowAutoCreate
  control.allowQueueJump = value.autoDispatchEnabled ? true : value.allowQueueJump
  control.mode = value.mode
  if (control.mode === 'auto' && control.autoDispatchEnabled) {
    autoConfirmPendingProcessTasks()
  }
}

function refreshData() {
  message.success('调度数据已刷新')
}

function handleTaskAction(payload: { type: string; task: DispatchTask }) {
  const { type, task } = payload
  switch (type) {
    case 'view-detail':
      message.info(`查看任务详情：${task.name}`)
      break
    case 'replace-robot':
      message.success(`进入替换机器人流程：${task.name}`)
      break
    case 'move-up':
      movePendingTask(task.id, -1)
      break
    case 'move-down':
      movePendingTask(task.id, 1)
      break
    case 'cancel-task':
      task.status = 'cancelled'
      message.success(`已取消任务：${task.name}`)
      break
    case 'accept-auto':
      task.status = 'pending'
      task.type = 'plan'
      task.queueOrder = nextQueueOrder()
      message.success(`已处理任务：${task.name}`)
      break
    case 'view-reason':
      message.info(task.reason || '暂无触发原因')
      break
    case 'insert-execute':
      task.status = 'running'
      task.startedAt = new Date().toLocaleTimeString()
      message.success(`已插队执行：${task.name}`)
      break
    default:
      break
  }
}

function autoConfirmPendingProcessTasks() {
  const autoTasks = tasks.value.filter(task => task.status === 'auto_pending' && task.type === 'auto')
  if (autoTasks.length === 0) return
  autoTasks.forEach(task => {
    task.status = 'pending'
    task.queueOrder = nextQueueOrder()
  })
  message.success('自动模式已生效：自动调度任务已加入待执行队列')
}

function nextQueueOrder() {
  return Math.max(0, ...tasks.value.map(item => item.queueOrder || 0)) + 1
}

function movePendingTask(taskId: string, offset: -1 | 1) {
  const list = pendingTasks.value
  const index = list.findIndex(item => item.id === taskId)
  if (index < 0) return
  const targetIndex = index + offset
  if (targetIndex < 0 || targetIndex >= list.length) return
  const current = list[index]
  const target = list[targetIndex]
  const currentOrder = current.queueOrder || 0
  current.queueOrder = target.queueOrder
  target.queueOrder = currentOrder
  message.success('待执行任务顺序已调整')
}

function openTemporary(prefill?: Partial<TemporaryDispatchForm>) {
  temporaryPrefill.value = prefill || {
    name: '临时调度任务',
    taskType: 'inspection',
    robotId: robots.value[0]?.id || '',
    targetPointIds: [],
    targetPointId: ''
  }
  temporaryVisible.value = true
}

function openTemporaryFromMap(payload?: { marker?: MapMarker; x: number; y: number }) {
  const marker = payload?.marker
  const now = new Date()
  now.setMinutes(now.getMinutes() + 5)
  const hh = String(now.getHours()).padStart(2, '0')
  const mm = String(now.getMinutes()).padStart(2, '0')

  const taskType =
    marker?.markerType === 'charging'
      ? 'charging'
      : marker?.markerType === 'parking'
        ? 'parking'
        : 'inspection'

  openTemporary({
    name: marker ? `临时任务-${marker.label}` : '临时调度任务',
    taskType,
    robotId: robots.value[0]?.id || '',
    scheduledAt: `${hh}:${mm}`,
    reason: marker ? `来自地图点位 ${marker.label} 的临时调度` : '来自地图右键发起',
    targetPointId: taskType === 'inspection' ? '' : marker?.id || '',
    targetPointIds: taskType === 'inspection' && marker ? [marker.id] : []
  })
}

function submitTemporaryDispatch(form: TemporaryDispatchForm) {
  Modal.confirm({
    title: '确认下达临时任务',
    content: '强制执行影响其他任务是否需要下达临时任务？',
    okText: '确认下达',
    cancelText: '取消',
    onOk() {
      const isChargeOrPark = form.taskType === 'charging' || form.taskType === 'parking'
      const robotName = robots.value.find(robot => robot.id === form.robotId)?.name || form.robotId

      if (isChargeOrPark && form.confirmTerminateCurrentTask) {
        const robotRunningTask = tasks.value.find(task => task.status === 'running' && task.robotName === robotName)
        if (robotRunningTask) {
          robotRunningTask.status = 'cancelled'
          records.value.unshift({
            id: `record-stop-${Date.now()}`,
            time: new Date().toLocaleTimeString().slice(0, 5),
            event: `终止当前任务：${robotRunningTask.name}，转为${form.taskType === 'charging' ? '充电' : '停车'}任务`,
            taskName: robotRunningTask.name,
            resultStatus: 'done',
            source: 'manual'
          })
        }
      }

      tasks.value.push({
        id: `temp-${Date.now()}`,
        name: form.name,
        type: 'temp',
        status: isChargeOrPark ? 'running' : 'pending',
        robotName,
        reason: form.reason || '临时调度',
        priority: 'medium',
        createdAt: new Date().toLocaleString(),
        scheduledAt: form.scheduledAt,
        startedAt: isChargeOrPark ? new Date().toLocaleTimeString() : undefined,
        queueOrder: isChargeOrPark ? undefined : nextQueueOrder()
      })

      records.value.unshift({
        id: `record-${Date.now()}`,
        time: new Date().toLocaleTimeString().slice(0, 5),
        event: `临时调度任务：${form.name}`,
        taskName: form.name,
        resultStatus: isChargeOrPark ? 'running' : 'pending',
        source: 'temp'
      })

      temporaryVisible.value = false
      temporaryPrefill.value = {}
      message.success('临时调度已创建')
    }
  })
}
</script>

<style scoped lang="scss">
.dispatch-center {
  .page-header {
    margin-bottom: 10px;
    h2 {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
    }
  }

  .content-layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 12px;
    align-items: start;
  }

  .left-side {
    min-width: 0;
  }

  .map-panel {
    min-width: 0;
    position: sticky;
    top: 8px;
  }
}

@media (max-width: 1400px) {
  .dispatch-center {
    .content-layout {
      grid-template-columns: 1fr;
    }
    .map-panel {
      position: static;
    }
  }
}
</style>
