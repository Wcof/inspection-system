<template>
  <div class="task-review">
    <a-card :title="task ? `任务复盘 - ${task.name}` : '任务复盘'">
      <a-button type="primary" @click="goBack">返回任务详情</a-button>

      <a-empty v-if="!task" description="未找到任务" style="margin-top: 24px" />

      <template v-else>
        <a-descriptions class="review-section" title="任务基本信息" :column="2" bordered>
          <a-descriptions-item label="任务编码">{{ task.code }}</a-descriptions-item>
          <a-descriptions-item label="执行状态">{{ getTaskStatusText(task.status) }}</a-descriptions-item>
          <a-descriptions-item label="巡检点数">{{ task.inspectionPointIds.length }}</a-descriptions-item>
          <a-descriptions-item label="采集动作">{{ snapshot?.collectionActions?.length || 0 }}</a-descriptions-item>
          <a-descriptions-item label="计划时间">{{ formatDate(task.plannedExecuteAt || task.schedule?.startTime) }}</a-descriptions-item>
          <a-descriptions-item label="更新时间">{{ formatDate(task.updatedAt) }}</a-descriptions-item>
        </a-descriptions>

        <div class="review-section">
          <h3>执行分析</h3>
          <a-row :gutter="16">
            <a-col v-for="item in analysisCards" :key="item.label" :xs="24" :sm="12" :lg="6">
              <a-card size="small">
                <div class="analysis-label">{{ item.label }}</div>
                <div class="analysis-value">{{ item.value }}</div>
              </a-card>
            </a-col>
          </a-row>
        </div>

        <div class="review-section">
          <h3>问题与改进</h3>
          <a-table :columns="columns" :data-source="issueRows" row-key="id" :pagination="false">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'severity'">
                <a-tag :color="record.severity === '高' ? 'red' : record.severity === '中' ? 'orange' : 'blue'">
                  {{ record.severity }}
                </a-tag>
              </template>
            </template>
          </a-table>
        </div>

        <div class="review-section">
          <h3>复盘总结</h3>
          <a-textarea v-model:value="summary" rows="4" placeholder="输入复盘总结" />
          <a-button type="primary" style="margin-top: 10px" @click="saveSummary">保存总结</a-button>
        </div>
      </template>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { message } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import type { InspectionTaskInstanceStatus, InspectionTaskResult } from '@/types/inspection'

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()
const taskId = computed(() => route.params.id as string)
const summary = ref('')

const task = computed(() => inspectionStore.getTaskById(taskId.value))
const snapshot = computed(() => inspectionStore.getInspectionTaskSnapshotByTaskId(taskId.value))
const results = computed(() => inspectionStore.getInspectionTaskResultsByTaskId(taskId.value))

const abnormalStatuses = new Set(['warning', 'alarm', 'critical', 'critical_alarm', 'hazard', 'major_hazard'])
const blockedStatuses = new Set(['uninspectable', 'unreadable', 'blocked', 'bad_angle', 'target_missing', 'monitor_failure', 'not_arrived', 'unknown'])

const analysisCards = computed(() => {
  const actionCount = snapshot.value?.collectionActions?.length || 0
  const parkingCount = snapshot.value?.parkingRoute?.length || 0
  const arrivedCount = (snapshot.value?.parkingRoute || []).filter(item => item.arrivalStatus === 'arrived').length
  const resultCount = results.value.length
  const abnormalCount = results.value.filter(item => abnormalStatuses.has(item.status)).length
  const blockedCount = results.value.filter(item => blockedStatuses.has(item.status)).length
  return [
    { label: '采集完成率', value: actionCount ? `${Math.round((resultCount / actionCount) * 100)}%` : '0%' },
    { label: '停车到达率', value: parkingCount ? `${Math.round((arrivedCount / parkingCount) * 100)}%` : '0%' },
    { label: '异常率', value: resultCount ? `${Math.round((abnormalCount / resultCount) * 100)}%` : '0%' },
    { label: '需人工复核', value: blockedCount }
  ]
})

const issueRows = computed(() => {
  const rows = results.value
    .filter(item => abnormalStatuses.has(item.status) || blockedStatuses.has(item.status))
    .map((item) => {
      const action = snapshot.value?.collectionActions?.find(row => row.id === item.collectionActionId)
      return {
        id: item.id,
        description: `${action?.pointName || item.inspectionPointId} / ${item.subjectName || action?.targetObject || '检测对象'}：${getResultStatusText(item.status)}`,
        type: abnormalStatuses.has(item.status) ? '告警风险' : '采集质量',
        severity: getSeverity(item.status),
        suggestion: getSuggestion(item.status)
      }
    })
  return rows.length ? rows : [{
    id: 'no-issue',
    description: '当前任务未发现需要复盘的问题项',
    type: '执行状态',
    severity: '低',
    suggestion: '保持现有巡检路径与采集配置'
  }]
})

const columns = [
  { title: '问题描述', dataIndex: 'description', key: 'description' },
  { title: '问题类型', dataIndex: 'type', key: 'type', width: 140 },
  { title: '严重程度', key: 'severity', width: 120 },
  { title: '改进建议', dataIndex: 'suggestion', key: 'suggestion' }
]

function goBack() {
  router.push(`/management/task/detail/${taskId.value}`)
}

function saveSummary() {
  message.success(summary.value.trim() ? '复盘总结已记录在当前页面' : '已保留空复盘总结')
}

function formatDate(value?: string | Date) {
  if (!value) return '-'
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

function getTaskStatusText(status?: InspectionTaskInstanceStatus) {
  const textMap: Record<string, string> = {
    pending: '待执行',
    running: '执行中',
    completed: '已完成',
    paused: '已暂停',
    cancelled: '已取消',
    failed: '失败'
  }
  return status ? textMap[status] || status : '-'
}

function getResultStatusText(status: InspectionTaskResult['status']) {
  const textMap: Record<string, string> = {
    warning: '预警',
    alarm: '告警',
    critical: '严重',
    critical_alarm: '严重告警',
    hazard: '隐患',
    major_hazard: '重大隐患',
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

function getSeverity(status: InspectionTaskResult['status']) {
  if (['critical', 'critical_alarm', 'hazard', 'major_hazard', 'monitor_failure', 'not_arrived'].includes(status)) return '高'
  if (['alarm', 'warning', 'blocked', 'target_missing', 'unreadable'].includes(status)) return '中'
  return '低'
}

function getSuggestion(status: InspectionTaskResult['status']) {
  if (abnormalStatuses.has(status)) return '复核检测规则阈值，并安排设备责任人确认现场状态'
  if (status === 'blocked') return '调整停车点或云台角度，减少遮挡后重新采集'
  if (status === 'not_arrived') return '检查路径连通性、机器人电量和定位状态'
  return '补充人工复核记录，并优化采集位配置'
}

onMounted(() => {
  inspectionStore.initialize()
  inspectionStore.ensureTaskExecutionData(taskId.value)
})
</script>

<style scoped>
.task-review {
  padding: 20px 0;
}

.review-section {
  margin-top: 20px;
}

.analysis-label {
  color: rgba(0, 0, 0, 0.45);
  font-size: 13px;
}

.analysis-value {
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
