<template>
  <div class="component-usage-detail">
    <a-page-header :title="`${component?.name || '部件'}详情`" @back="goBack" />

    <a-card style="margin-top: 16px">
      <a-descriptions bordered :column="3" size="small">
        <a-descriptions-item label="部件名称">{{ component?.name || '-' }}</a-descriptions-item>
        <a-descriptions-item label="部件类型">{{ getComponentTypeText(component?.componentType) }}</a-descriptions-item>
        <a-descriptions-item label="部件编号">{{ component?.componentNo || '-' }}</a-descriptions-item>
        <a-descriptions-item label="部件位号">{{ component?.componentPositionNo || '-' }}</a-descriptions-item>
        <a-descriptions-item label="所属区域">{{ component?.areaName || '-' }}</a-descriptions-item>
        <a-descriptions-item label="所属装置">{{ component?.installationName || '-' }}</a-descriptions-item>
        <a-descriptions-item label="所属设施">{{ component?.facilityName || '-' }}</a-descriptions-item>
        <a-descriptions-item label="备注">{{ component?.remark || '-' }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card style="margin-top: 16px" title="关联检测规则">
      <a-table :columns="ruleColumns" :data-source="ruleRows" row-key="id" :pagination="false" />
    </a-card>

    <a-card style="margin-top: 16px" title="关联点位">
      <a-table :columns="pointColumns" :data-source="pointRows" row-key="id" :pagination="false" />
    </a-card>

    <a-card style="margin-top: 16px" title="最近巡检记录、告警与证据">
      <a-alert
        type="info"
        show-icon
        style="margin-bottom: 12px"
        message="列表按任务详情证据链口径展示：巡检记录、命中规则、告警状态、光学图、热成图、识别值和复核结论。"
      />
      <a-table
        :columns="inspectionRecordColumns"
        :data-source="inspectionRecordRows"
        row-key="id"
        size="small"
        :pagination="{ pageSize: 5 }"
        :scroll="{ x: 1680 }"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'taskName'">
            <a-button type="link" size="small" @click="goTaskEvidence(record.taskId)">{{ record.taskName }}</a-button>
          </template>
          <template v-else-if="column.key === 'qualityStatus'">
            <a-tag :color="getQualityStatusColor(record.qualityStatus)">{{ record.qualityStatusText }}</a-tag>
          </template>
          <template v-else-if="column.key === 'alert'">
            <a-tag :color="record.generatesAlert ? 'red' : 'green'">{{ record.generatesAlert ? record.alertName : '未生成告警' }}</a-tag>
          </template>
          <template v-else-if="column.key === 'evidence'">
            <a-space>
              <img :src="record.opticalImageUrl" alt="光学图" class="shot-thumb" />
              <img :src="record.thermalImageUrl" alt="热成像图" class="shot-thumb" />
            </a-space>
          </template>
          <template v-else-if="column.key === 'confidence'">
            {{ Math.round(record.confidence * 100) }}%
          </template>
          <template v-else-if="column.key === 'feedbackStatus'">
            <a-tag :color="record.feedbackStatus === '已回传' ? 'green' : 'blue'">{{ record.feedbackStatus }}</a-tag>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import { getDetectionItemConfigs } from '@/views/implementation/detection-item-config/model'
import type { InspectionTaskResult } from '@/types/inspection'

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()
const opticalImageUrl = new URL('../../../设备.png', import.meta.url).href
const thermalImageUrl = new URL('../../../车间.png', import.meta.url).href

const componentId = computed(() => String(route.params.componentId || ''))
const component = computed(() => inspectionStore.facilityComponents.find((item) => item.id === componentId.value))
const pointRows = computed(() => {
  return inspectionStore.inspectionPoints.flatMap((point) => {
    const pointConfigs = (point.detectionConfigs || []).filter((config) => config.subjectType === 'component' && config.subjectId === componentId.value)
    if (!pointConfigs.length) return []
    const parkingNames = new Set<string>()
    ;(point.parkingPoints || []).forEach((parking) => {
      const matched = parking.collectionPoses.some((pose) => pose.targetType === 'component' && pose.targetName === component.value?.name)
      if (matched) parkingNames.add(parking.name)
    })
    return [{
      id: point.id,
      pointName: point.name,
      areaName: point.areaName || '-',
      parkingPointNames: Array.from(parkingNames).join('、') || '-',
      ruleNames: pointConfigs.map((item) => getRuleName(item.ruleId)).join('、') || '-',
      executionOrder: point.sequence || '-'
    }]
  })
})

const ruleRows = computed(() => (component.value?.ruleIds || []).map((id) => {
  const rule = getDetectionItemConfigs().find((item) => item.id === id)
  return {
    id,
    name: rule?.name || id,
    detectionType: rule?.detectionType || '-',
    detectionAlgorithm: rule?.detectionAlgorithm || '-',
    publishStatus: rule?.publishStatus || '-',
    status: rule?.enabled ? '启用' : '停用'
  }
}))

const ruleColumns = [
  { title: '规则名称', dataIndex: 'name', key: 'name', width: 140  },
  { title: '检测类型', dataIndex: 'detectionType', key: 'detectionType', width: 140 },
  { title: '发布状态', dataIndex: 'publishStatus', key: 'publishStatus', width: 120 },
  { title: '启用状态', dataIndex: 'status', key: 'status', width: 100 }
]

const pointColumns = [
  { title: '巡检点', dataIndex: 'pointName', key: 'pointName' },
  { title: '所属区域', dataIndex: 'areaName', key: 'areaName', width: 120 },
  { title: '停车点', dataIndex: 'parkingPointNames', key: 'parkingPointNames', width: 180 },
  { title: '关联规则', dataIndex: 'ruleNames', key: 'ruleNames' },
  { title: '检测顺序', dataIndex: 'executionOrder', key: 'executionOrder', width: 100 }
]

const inspectionRecordRows = computed(() => {
  const taskId = 'task-001'
  const snapshot = inspectionStore.ensureTaskExecutionData(taskId)
  const results = inspectionStore.getInspectionTaskResultsByTaskId(taskId)
  const resultMap = new Map(results.map((result) => [result.collectionActionId, result]))
  const componentName = component.value?.name || ''
  const componentNo = component.value?.componentNo || componentId.value
  const matchedRows = (snapshot?.collectionActions || [])
    .filter((action) => {
      const target = `${action.targetObject || ''}${action.collectionAction || ''}`
      return target.includes(componentName) || target.includes(componentNo)
    })
    .map((action, index) => buildInspectionRecordRow({
      id: `${action.id}-${index}`,
      taskId,
      taskName: inspectionStore.getTaskById(taskId)?.name || '每日例行巡检',
      pointName: action.pointName,
      parkingPointName: action.parkingPointName,
      collectionAction: action.collectionAction,
      componentRef: `${componentNo} / ${component.value?.componentPositionNo || '-'}`,
      ruleName: action.ruleName || getRuleName(action.ruleId || ''),
      result: resultMap.get(action.id),
      index
    }))

  if (matchedRows.length) return matchedRows

  const basePoint = pointRows.value[0]
  const rules = ruleRows.value.length ? ruleRows.value : [{ id: 'dic-001', name: '仪表读数识别' }, { id: 'dic-002', name: '压力表外观破损检测' }]
  return [
    buildInspectionRecordRow({
      id: `${componentId.value}-record-1`,
      taskId,
      taskName: '每日例行巡检',
      pointName: basePoint?.pointName || '反应区巡检点',
      parkingPointName: basePoint?.parkingPointNames.split('、')[0] || '反应釜东侧停车点',
      collectionAction: '压力表正拍 / 光学图像',
      componentRef: `${componentNo} / ${component.value?.componentPositionNo || '-'}`,
      ruleName: rules[0]?.name || '仪表读数识别',
      status: 'normal',
      recognizedValue: '读数 0.42MPa，外观正常',
      confidence: 0.94,
      index: 0
    }),
    buildInspectionRecordRow({
      id: `${componentId.value}-record-2`,
      taskId,
      taskName: '每日例行巡检',
      pointName: basePoint?.pointName || '反应区巡检点',
      parkingPointName: basePoint?.parkingPointNames.split('、')[0] || '反应釜东侧停车点',
      collectionAction: '压力表局部复拍 / 光学图像',
      componentRef: `${componentNo} / ${component.value?.componentPositionNo || '-'}`,
      ruleName: rules[1]?.name || '压力表外观破损检测',
      status: 'warning',
      recognizedValue: '表盘反光，建议人工复核',
      confidence: 0.73,
      index: 1
    }),
    buildInspectionRecordRow({
      id: `${componentId.value}-record-3`,
      taskId: 'task-001',
      taskName: '每日例行巡检',
      pointName: basePoint?.pointName || '反应区巡检点',
      parkingPointName: basePoint?.parkingPointNames.split('、')[0] || '反应釜东侧停车点',
      collectionAction: '压力表温升复核 / 热成像',
      componentRef: `${componentNo} / ${component.value?.componentPositionNo || '-'}`,
      ruleName: '温升判定规则 V1',
      status: 'alarm',
      recognizedValue: '局部温升 86℃',
      confidence: 0.89,
      index: 2
    })
  ]
})

const inspectionRecordColumns = [
  { title: '任务', key: 'taskName', width: 160 },
  { title: '巡检点', dataIndex: 'pointName', key: 'pointName', width: 160 },
  { title: '停车点', dataIndex: 'parkingPointName', key: 'parkingPointName', width: 180 },
  { title: '采集动作', dataIndex: 'collectionAction', key: 'collectionAction', width: 190 },
  { title: '部件编号/位号', dataIndex: 'componentRef', key: 'componentRef', width: 190 },
  { title: '命中规则', dataIndex: 'ruleName', key: 'ruleName', width: 170 },
  { title: '规则结果', dataIndex: 'recognizedValue', key: 'recognizedValue', width: 190 },
  { title: '结果状态', key: 'qualityStatus', width: 120 },
  { title: '告警', key: 'alert', width: 150 },
  { title: '证据', key: 'evidence', width: 150 },
  { title: '采样时间', dataIndex: 'sampledAt', key: 'sampledAt', width: 190 },
  { title: '机器人位姿', dataIndex: 'robotPose', key: 'robotPose', width: 180 },
  { title: '云台/焦距', dataIndex: 'ptz', key: 'ptz', width: 170 },
  { title: '置信度', key: 'confidence', width: 90 },
  { title: '人工复核', dataIndex: 'manualReviewConclusion', key: 'manualReviewConclusion', width: 160 },
  { title: '历史回放', dataIndex: 'playbackEntry', key: 'playbackEntry', width: 120 },
  { title: '第三方回传', key: 'feedbackStatus', width: 120 }
]

function buildInspectionRecordRow(options: {
  id: string
  taskId: string
  taskName: string
  pointName: string
  parkingPointName: string
  collectionAction: string
  componentRef: string
  ruleName: string
  result?: InspectionTaskResult
  status?: string
  recognizedValue?: string
  confidence?: number
  index: number
}) {
  const status = String(options.result?.qualityStatus || options.result?.status || options.status || 'normal')
  const sampledAt = options.result?.evidence?.sampledAt || new Date(Date.now() - options.index * 8 * 60 * 1000).toLocaleString()
  const generatesAlert = ['warning', 'alarm', 'critical', 'critical_alarm', 'hazard', 'major_hazard'].includes(status)
  return {
    id: options.id,
    taskId: options.taskId,
    taskName: options.taskName,
    pointName: options.pointName,
    parkingPointName: options.parkingPointName,
    collectionAction: options.collectionAction,
    componentRef: options.componentRef,
    ruleName: options.ruleName,
    qualityStatus: status,
    qualityStatusText: getQualityStatusText(status),
    recognizedValue: options.result?.evidence?.recognizedValue || options.recognizedValue || getQualityStatusText(status),
    generatesAlert,
    alertName: generatesAlert ? (status === 'warning' ? '待复核预警' : '已生成告警') : '',
    opticalImageUrl: resolveEvidenceImage(options.result?.evidence?.opticalImageUrl, opticalImageUrl),
    thermalImageUrl: resolveEvidenceImage(options.result?.evidence?.thermalImageUrl, thermalImageUrl),
    sampledAt,
    robotPose: options.result?.evidence?.robotPose || `X${120 + options.index * 4}, Y${86 + options.index * 2}, Yaw${(options.index * 18) % 360}°`,
    ptz: `Yaw ${(options.index * 18) % 360}° / Pitch ${-8 + options.index}° / 焦距 ${28 + options.index * 2}mm`,
    confidence: options.result?.evidence?.confidence ?? options.confidence ?? 0.86,
    manualReviewConclusion: options.result?.evidence?.manualReviewConclusion || (generatesAlert ? '需人工复核' : '待抽检'),
    playbackEntry: '历史回放',
    feedbackStatus: options.index === 0 ? '已回传' : '待回传'
  }
}

function getRuleName(ruleId: string) {
  return getDetectionItemConfigs().find((item) => item.id === ruleId)?.name || ruleId
}

function getComponentTypeText(type?: string) {
  const map: Record<string, string> = {
    valve: '阀门', meter: '压力表', temperature_gauge: '温度表', flange: '法兰', pipe: '管体',
    motor: '电机', cable: '电缆', joint: '接头', sensor: '传感器', screw: '螺杆', other: '其他'
  }
  return type ? map[type] || type : '-'
}

function getQualityStatusText(status?: string) {
  const map: Record<string, string> = {
    normal: '正常',
    warning: '预警',
    alarm: '告警',
    critical: '严重',
    critical_alarm: '严重告警',
    uninspectable: '不可检',
    blocked: '遮挡',
    bad_angle: '角度不足',
    target_missing: '目标缺失',
    unreadable: '无法识别',
    not_arrived: '未到达',
    unknown: '未知'
  }
  return map[status || ''] || status || '未知'
}

function getQualityStatusColor(status?: string) {
  const map: Record<string, string> = {
    normal: 'green',
    warning: 'gold',
    alarm: 'orange',
    critical: 'red',
    critical_alarm: 'red',
    uninspectable: 'volcano',
    blocked: 'orange',
    bad_angle: 'gold',
    target_missing: 'purple',
    unreadable: 'default',
    not_arrived: 'default',
    unknown: 'default'
  }
  return map[status || ''] || 'default'
}

function resolveEvidenceImage(url: string | undefined, fallback: string) {
  if (!url || url.startsWith('/src/')) return fallback
  return url
}

function goTaskEvidence(taskId: string) {
  router.push(`/management/task/detail/${taskId}?tab=evidence`)
}

function goBack() {
  router.push('/implementation/device/component-usage')
}

onMounted(() => inspectionStore.initialize())
</script>

<style scoped>
.shot-thumb {
  width: 64px;
  height: 44px;
  object-fit: cover;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  background: #f5f5f5;
}
</style>
