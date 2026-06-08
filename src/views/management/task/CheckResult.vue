<template>
  <div class="check-result">
    <a-card :title="task ? `检查结果 - ${task.name}` : '检查结果'">
      <a-button type="primary" @click="goBack">返回任务详情</a-button>

      <a-empty v-if="!task" description="未找到任务" style="margin-top: 24px" />

      <template v-else>
        <div class="result-summary">
          <a-row :gutter="16">
            <a-col v-for="item in summaryCards" :key="item.label" :xs="24" :sm="12" :lg="6">
              <a-card size="small">
                <div class="summary-label">{{ item.label }}</div>
                <div class="summary-value">{{ item.value }}</div>
              </a-card>
            </a-col>
          </a-row>
        </div>

        <div class="result-list">
          <h3>检查结果列表</h3>
          <a-table :columns="columns" :data-source="rows" row-key="id" :pagination="{ pageSize: 8 }">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
              </template>
              <template v-else-if="column.key === 'evidence'">
                <a-space v-if="record.evidence">
                  <a-button size="small" :href="record.evidence.opticalImageUrl" target="_blank">可见光</a-button>
                  <a-button size="small" :href="record.evidence.thermalImageUrl" target="_blank">热成像</a-button>
                </a-space>
                <span v-else>-</span>
              </template>
            </template>
          </a-table>
        </div>
      </template>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import type { InspectionTaskResult } from '@/types/inspection'

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()
const taskId = computed(() => route.params.id as string)
const task = computed(() => inspectionStore.getTaskById(taskId.value))

const results = computed(() => inspectionStore.getInspectionTaskResultsByTaskId(taskId.value))
const snapshot = computed(() => inspectionStore.getInspectionTaskSnapshotByTaskId(taskId.value))

const abnormalStatuses = new Set(['warning', 'alarm', 'critical', 'critical_alarm', 'hazard', 'major_hazard'])
const failedStatuses = new Set(['skipped', 'uninspectable', 'unreadable', 'blocked', 'bad_angle', 'target_missing', 'monitor_failure', 'not_arrived', 'unknown'])

const rows = computed(() => results.value.map((result) => {
  const action = snapshot.value?.collectionActions?.find(item => item.id === result.collectionActionId)
  return {
    id: result.id,
    pointName: action?.pointName || inspectionStore.getInspectionPointById(result.inspectionPointId)?.name || result.inspectionPointId,
    parkingPointName: action?.parkingPointName || result.parkingPointId || '-',
    targetObject: result.subjectName || action?.targetObject || '-',
    value: result.value ?? '-',
    recordedAt: formatDate(result.recordedAt),
    status: result.status,
    reviewConclusion: result.evidence?.manualReviewConclusion || '-',
    evidence: result.evidence
  }
}))

const summaryCards = computed(() => {
  const totalActions = snapshot.value?.collectionActions?.length || results.value.length
  const finished = results.value.length
  const abnormal = results.value.filter(item => abnormalStatuses.has(item.status)).length
  const failed = results.value.filter(item => failedStatuses.has(item.status)).length
  const rate = totalActions ? `${Math.round((finished / totalActions) * 100)}%` : '0%'
  return [
    { label: '采集动作', value: totalActions },
    { label: '已生成结果', value: finished },
    { label: '异常/告警', value: abnormal },
    { label: '完成率', value: failed ? `${rate}（${failed} 项需复核）` : rate }
  ]
})

const columns = [
  { title: '巡检点', dataIndex: 'pointName', key: 'pointName', width: 180 },
  { title: '停车点', dataIndex: 'parkingPointName', key: 'parkingPointName', width: 180 },
  { title: '检测对象', dataIndex: 'targetObject', key: 'targetObject', width: 180 },
  { title: '识别值', dataIndex: 'value', key: 'value', width: 120 },
  { title: '检查时间', dataIndex: 'recordedAt', key: 'recordedAt', width: 180 },
  { title: '状态', key: 'status', width: 120 },
  { title: '复核结论', dataIndex: 'reviewConclusion', key: 'reviewConclusion', width: 160 },
  { title: '证据', key: 'evidence', width: 150 }
]

function goBack() {
  router.push(`/management/task/detail/${taskId.value}`)
}

function formatDate(value?: string | Date) {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

function getStatusText(status: InspectionTaskResult['status']) {
  const textMap: Record<string, string> = {
    normal: '正常',
    warning: '预警',
    alarm: '告警',
    critical: '严重',
    critical_alarm: '严重告警',
    hazard: '隐患',
    major_hazard: '重大隐患',
    skipped: '跳过',
    uninspectable: '不可检',
    unreadable: '不可读',
    blocked: '遮挡',
    bad_angle: '角度异常',
    target_missing: '目标缺失',
    monitor_failure: '监测失败',
    not_arrived: '未到达',
    unknown: '未知'
  }
  return textMap[status] || status
}

function getStatusColor(status: InspectionTaskResult['status']) {
  if (status === 'normal') return 'green'
  if (abnormalStatuses.has(status)) return 'orange'
  if (failedStatuses.has(status)) return 'red'
  return 'default'
}

onMounted(() => {
  inspectionStore.initialize()
  inspectionStore.ensureTaskExecutionData(taskId.value)
})
</script>

<style scoped>
.check-result {
  padding: 20px 0;
}

.result-summary,
.result-list {
  margin-top: 20px;
}

.summary-label {
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
}

.summary-value {
  margin-top: 8px;
  color: rgba(0, 0, 0, 0.88);
  font-size: 22px;
  font-weight: 600;
}

h3 {
  margin-bottom: 12px;
  font-size: 16px;
  font-weight: 500;
}
</style>
