<template>
  <div class="inspection-task-detail">
    <a-page-header title="巡检任务详情" @back="goBack">
    </a-page-header>

    <a-card style="margin-top: 16px" v-if="task">
      <a-descriptions :column="2" bordered>
        <a-descriptions-item label="任务名称">{{ task.name }}</a-descriptions-item>
        <a-descriptions-item label="任务编码">{{ task.code }}</a-descriptions-item>
        <a-descriptions-item label="机器人">{{ getRobotName(task.robotId) }}</a-descriptions-item>
        <a-descriptions-item label="巡检点数量">{{ task.inspectionPointIds?.length || 0 }}</a-descriptions-item>
        <a-descriptions-item label="所属计划">{{ showPlanName }}</a-descriptions-item>
        <a-descriptions-item label="执行时间">{{ getTaskRunTimeText(task) }}</a-descriptions-item>
        <a-descriptions-item label="状态">
          <a-tag :color="getStatusColor(task.status)">{{ getStatusText(task.status) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ task.createdAt }}</a-descriptions-item>
      </a-descriptions>

      <a-divider />

      <a-card title="巡检点结果" style="margin-top: 16px">
        <a-table :columns="pointColumns" :data-source="inspectionPointRows" row-key="id" :pagination="false">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'startTime'">
              {{ record.startTimeText }}
            </template>
            <template v-if="column.key === 'endTime'">
              {{ record.endTimeText }}
            </template>
            <template v-if="column.key === 'runTime'">
              {{ record.runTimeText }}
            </template>
            <template v-if="column.key === 'actions'">
              <a-button type="link" size="small" @click="openPointDetail(record)">详情</a-button>
            </template>
          </template>
        </a-table>
      </a-card>
    </a-card>

    <a-modal
      v-model:visible="pointDetailVisible"
      :title="`巡检点详情 - ${currentPointDetail?.name || ''}`"
      width="900px"
      :footer="null"
    >
      <a-empty v-if="!currentPointDetail" description="暂无数据" />
      <template v-else>
        <a-descriptions :column="2" bordered size="small" style="margin-bottom: 12px">
          <a-descriptions-item label="巡检点编码">{{ currentPointDetail.code }}</a-descriptions-item>
          <a-descriptions-item label="巡检时段">{{ currentPointDetail.runTimeText }}</a-descriptions-item>
        </a-descriptions>

        <a-table :columns="pointDeviceColumns" :data-source="pointDevices" row-key="id" :pagination="false">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'checkItems'">
              {{ record.checkItemSummary }}
            </template>
            <template v-if="column.key === 'latestResult'">
              {{ record.latestResult }}
            </template>
            <template v-if="column.key === 'monitorTime'">
              {{ record.monitorTime }}
            </template>
            <template v-if="column.key === 'opticalVideo'">
              <div class="media-cell" @click="openMediaPreview('video', record.opticalVideoUrl, '光学视频')">
                <img class="media-thumb" :src="record.opticalVideoCoverUrl" alt="光学视频" />
                <span class="media-label">播放</span>
              </div>
            </template>
            <template v-if="column.key === 'infraredVideo'">
              <div class="media-cell" @click="openMediaPreview('video', record.infraredVideoUrl, '红外视频')">
                <img class="media-thumb" :src="record.infraredVideoCoverUrl" alt="红外视频" />
                <span class="media-label">播放</span>
              </div>
            </template>
            <template v-if="column.key === 'opticalSnapshot'">
              <div class="media-cell" @click="openMediaPreview('image', record.opticalSnapshotUrl, '光学截图')">
                <img class="media-thumb" :src="record.opticalSnapshotUrl" alt="光学截图" />
                <span class="media-label">查看</span>
              </div>
            </template>
            <template v-if="column.key === 'infraredSnapshot'">
              <div class="media-cell" @click="openMediaPreview('image', record.infraredSnapshotUrl, '红外截图')">
                <img class="media-thumb" :src="record.infraredSnapshotUrl" alt="红外截图" />
                <span class="media-label">查看</span>
              </div>
            </template>
          </template>
        </a-table>
      </template>
    </a-modal>

    <a-modal
      v-model:visible="mediaPreviewVisible"
      :title="mediaPreviewTitle"
      width="92%"
      :footer="null"
      centered
      destroy-on-close
    >
      <div class="media-preview-wrapper">
        <video
          v-if="mediaPreviewType === 'video'"
          :src="mediaPreviewUrl"
          controls
          autoplay
          class="media-preview-video"
        />
        <img
          v-else
          :src="mediaPreviewUrl"
          :alt="mediaPreviewTitle"
          class="media-preview-image"
        />
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import type { InspectionTask, InspectionTaskInstanceStatus, InspectionPoint, InspectionTaskResult } from '@/types/inspection'
import { useRobotStore } from '@/stores/robot'

const router = useRouter()
const route = useRoute()
const inspectionStore = useInspectionStore()
const robotStore = useRobotStore()

const taskId = computed(() => route.params.id as string)
const task = ref<InspectionTask | undefined>()
const inspectionPoints = ref<InspectionPoint[]>([])
const taskResults = ref<InspectionTaskResult[]>([])
const pointDetailVisible = ref(false)
const currentPointDetail = ref<any>(null)
const pointDevices = ref<any[]>([])
const mediaPreviewVisible = ref(false)
const mediaPreviewType = ref<'image' | 'video'>('image')
const mediaPreviewUrl = ref('')
const mediaPreviewTitle = ref('')
const fromTemporaryTask = computed(() => route.query.source === 'temp')

const pointColumns = [
  { title: '巡检点名称', dataIndex: 'name', key: 'name' },
  { title: '编码', dataIndex: 'code', key: 'code' },
  { title: '顺序', dataIndex: 'sequence', key: 'sequence', width: 80 },
  { title: '开始时间', key: 'startTime', width: 170 },
  { title: '结束时间', key: 'endTime', width: 170 },
  { title: '运行时间', key: 'runTime', width: 160 },
  { title: '操作', key: 'actions', width: 90 }
]

const pointDeviceColumns = [
  { title: '设备名称', dataIndex: 'name', key: 'name' },
  { title: '设备编码', dataIndex: 'code', key: 'code', width: 140 },
  { title: '检测项', key: 'checkItems' },
  { title: '最新结果', key: 'latestResult', width: 180 },
  { title: '监测时间', key: 'monitorTime', width: 180 },
  { title: '光学视频', key: 'opticalVideo', width: 110 },
  { title: '红外视频', key: 'infraredVideo', width: 110 },
  { title: '光学截图', key: 'opticalSnapshot', width: 110 },
  { title: '红外截图', key: 'infraredSnapshot', width: 110 }
]

function getStatusColor(status: InspectionTaskInstanceStatus): string {
  const colorMap: Record<InspectionTaskInstanceStatus, string> = {
    pending: 'default',
    running: 'blue',
    completed: 'green',
    paused: 'orange',
    cancelled: 'default',
    failed: 'red'
  }
  return colorMap[status] || 'default'
}

function getStatusText(status: InspectionTaskInstanceStatus): string {
  const textMap: Record<InspectionTaskInstanceStatus, string> = {
    pending: '待执行',
    running: '执行中',
    completed: '已完成',
    paused: '已暂停',
    cancelled: '已取消',
    failed: '失败'
  }
  return textMap[status] || status
}

function getRobotName(robotId: string): string {
  const robot = robotStore.robots.find(r => r.id === robotId)
  return robot?.name || robotId
}

function getPlanName(planId?: string): string {
  if (!planId) return '-'
  const plan = inspectionStore.inspectionPlans.find(p => p.id === planId)
  return plan?.name || planId
}

const showPlanName = computed(() => {
  if (!task.value) return '-'
  if (fromTemporaryTask.value || (task.value as any).type === 'temp' || !(task.value as any).planId) return '-'
  return getPlanName((task.value as any).planId)
})

function getTaskStart(taskValue: any): Date {
  if (taskValue?.schedule?.startTime) return new Date(taskValue.schedule.startTime)
  return new Date(taskValue?.createdAt || Date.now())
}

function getTaskEnd(taskValue: any): Date {
  if (taskValue?.schedule?.endTime) return new Date(taskValue.schedule.endTime)
  const start = getTaskStart(taskValue)
  const pointCount = taskValue?.inspectionPointIds?.length || 1
  return new Date(start.getTime() + pointCount * 8 * 60 * 1000)
}

function formatRunTime(start: Date, end: Date): string {
  const ms = end.getTime() - start.getTime()
  const min = Math.max(1, Math.round(ms / 60000))
  return `${start.toLocaleString()} ~ ${end.toLocaleString()}（${min}分钟）`
}

function getTaskRunTimeText(taskValue: any): string {
  return formatRunTime(getTaskStart(taskValue), getTaskEnd(taskValue))
}

const inspectionPointRows = computed(() => {
  if (!task.value) return []
  const baseStart = getTaskStart(task.value)
  return inspectionPoints.value.map((point, index) => {
    const pointStart = new Date(baseStart.getTime() + index * 8 * 60 * 1000)
    const durationMin = Math.max(1, Math.round((point.stayDurationSec || 60) / 60))
    const pointEnd = new Date(pointStart.getTime() + durationMin * 60 * 1000)
    return {
      ...point,
      startTime: pointStart,
      endTime: pointEnd,
      startTimeText: pointStart.toLocaleString(),
      endTimeText: pointEnd.toLocaleString(),
      runTimeText: `${durationMin}分钟`
    }
  })
})

function openPointDetail(pointRow: any) {
  currentPointDetail.value = pointRow
  const devices = inspectionStore.getInspectionDevicesByInspectionPointId(pointRow.id)
  pointDevices.value = devices.map(device => {
    const checkItems = inspectionStore.getInspectionDeviceCheckItemsByDeviceId(device.id)
    const relatedResults = taskResults.value.filter(result => result.inspectionPointId === pointRow.id && result.deviceId === device.id)
    const latest = relatedResults[0]
    return {
      ...device,
      checkItemSummary: checkItems.length > 0 ? checkItems.map(item => item.name).join('、') : '-',
      latestResult: latest ? `${latest.status}${latest.value !== undefined ? ` / ${latest.value}` : ''}` : '-',
      monitorTime: latest?.recordedAt ? new Date(latest.recordedAt).toLocaleString() : '-',
      opticalVideoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4',
      infraredVideoUrl: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm',
      opticalVideoCoverUrl: `https://picsum.photos/seed/optical-video-${device.id}/220/120`,
      infraredVideoCoverUrl: `https://picsum.photos/seed/infra-video-${device.id}/220/120`,
      opticalSnapshotUrl: `https://picsum.photos/seed/optical-shot-${device.id}/300/180`,
      infraredSnapshotUrl: `https://picsum.photos/seed/infra-shot-${device.id}/300/180`
    }
  })
  pointDetailVisible.value = true
}

function openMediaPreview(type: 'image' | 'video', url: string, title: string) {
  mediaPreviewType.value = type
  mediaPreviewUrl.value = url
  mediaPreviewTitle.value = title
  mediaPreviewVisible.value = true
}


function fetchTaskDetail() {
  task.value = inspectionStore.getTaskById(taskId.value)
  if (task.value) {
    inspectionPoints.value = task.value.inspectionPointIds.map(id => 
      inspectionStore.getInspectionPointById(id)
    ).filter(Boolean) as InspectionPoint[]
    taskResults.value = inspectionStore.getInspectionTaskResultsByTaskId(taskId.value)
  }
}

function goBack() {
  if (fromTemporaryTask.value || (task.value as any)?.type === 'temp' || !(task.value as any)?.planId) {
    router.push('/management/task/temp-list')
    return
  }
  router.push(`/management/task/list?planId=${(task.value as any).planId}`)
}

onMounted(() => {
  inspectionStore.initialize()
  robotStore.initialize()
  fetchTaskDetail()
})
</script>

<style scoped lang="scss">
.inspection-task-detail {
  width: 100%;

  .media-cell {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    cursor: pointer;
  }

  .media-thumb {
    width: 72px;
    height: 44px;
    border-radius: 6px;
    border: 1px solid #e5e7eb;
    object-fit: cover;
  }

  .media-label {
    font-size: 12px;
    color: #1677ff;
  }

  .media-preview-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    min-height: 60vh;
    background: #000;
    border-radius: 8px;
    padding: 8px;
  }

  .media-preview-video,
  .media-preview-image {
    max-width: 100%;
    max-height: 78vh;
    object-fit: contain;
  }
}
</style>
