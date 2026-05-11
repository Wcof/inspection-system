
<template>
  <div class="board-grid">
    <a-card class="panel panel-running">
      <template #title>
        <div class="panel-title-wrap">
          <span>机器人执行任务</span>
          <a-tag color="blue">{{ runningTasks.length }}</a-tag>
        </div>
      </template>
      <a-empty v-if="runningTasks.length === 0" description="暂无执行中任务" />
      <div v-else class="task-list">
        <div v-for="task in runningTasks" :key="task.id" class="task-item">
          <div class="task-title-wrap">
            <div class="task-title">{{ task.name }}</div>
            <div>
              <a-tag :color="getSceneColor(task.businessScene)">{{ task.businessSceneLabel || getSceneText(task.businessScene) }}</a-tag>
              <a-tag :color="getRiskColor(task.riskLevel)">{{ task.riskLevelLabel || getRiskText(task.riskLevel) }}</a-tag>
              <a-tag color="processing">{{ task.typeLabel }}</a-tag>
              <a-tag v-if="task.changeFlag" color="purple">已变更</a-tag>
            </div>
          </div>
          <div class="meta">
            <span>执行机器人：{{ task.robotName }}</span>
            <span>开始：{{ task.startedAt || '-' }}</span>
            <span>预计完成：{{ task.etaTime || '-' }}</span>
          </div>
          <div class="meta">
            <span>进度：{{ task.progressPercent ?? 0 }}%</span>
            <span>完成：{{ task.doneCount ?? 0 }}/{{ task.totalCount ?? 0 }}</span>
          </div>
          <div class="meta">
            <span>调度约束：{{ task.constraintSummary || '电量、区域、作业窗口已校验' }}</span>
          </div>
          <div v-if="task.changeReason" class="meta emphasis">变更说明：{{ task.changeReason }}</div>
          <a-progress :percent="task.progressPercent || 0" size="small" />
          <div class="actions">
            <a-button size="small" @click="emitTaskAction('view-detail', task)">查看详情</a-button>
            <a-button size="small" @click="emitTaskAction('replace-robot', task)">替换机器人</a-button>
          </div>
        </div>
      </div>
    </a-card>

    <a-card class="panel panel-pending">
      <template #title>
        <div class="panel-title-wrap">
          <span>待执行任务</span>
          <a-tag color="gold">{{ pendingTasks.length }}</a-tag>
        </div>
      </template>
      <template #extra>
        <a-tag :color="mode === 'auto' ? 'purple' : 'blue'">{{ mode === 'auto' ? '自动调度' : '顺序执行' }}</a-tag>
      </template>
      <a-empty v-if="pendingTasks.length === 0" description="暂无待执行任务" />
      <div v-else class="task-list">
        <div v-for="(task, index) in pendingTasks" :key="task.id" class="task-item">
          <div class="task-title-wrap">
            <div class="task-title">{{ task.name }}</div>
            <div>
              <a-tag :color="getSceneColor(task.businessScene)">{{ task.businessSceneLabel || getSceneText(task.businessScene) }}</a-tag>
              <a-tag :color="task.priority === 'high' ? 'red' : task.priority === 'medium' ? 'orange' : 'default'">
                {{ task.priorityLabel }}
              </a-tag>
              <a-tag :color="getRiskColor(task.riskLevel)">{{ task.riskLevelLabel || getRiskText(task.riskLevel) }}</a-tag>
              <a-tag v-if="task.changeFlag" color="purple">已变更</a-tag>
            </div>
          </div>
          <div class="meta">
            <span>预计执行机器人：{{ task.robotName }}</span>
            <span>开始时间：{{ task.scheduledAt || '-' }}</span>
          </div>
          <div class="meta">
            <span>任务来源：{{ task.typeLabel }}</span>
            <span>模式：{{ mode === 'auto' ? '自动调度' : '顺序执行' }}</span>
          </div>
          <div class="meta">
            <span>建议动作：{{ task.suggestedAction || '排队' }}</span>
            <span>约束：{{ task.constraintSummary || '机器人适配 / 作业窗口正常' }}</span>
          </div>
          <div v-if="task.changeReason" class="meta emphasis">变更说明：{{ task.changeReason }}</div>
          <div class="actions">
            <a-button size="small" :disabled="mode === 'auto' || index === 0" @click="emitTaskAction('move-up', task)">上移</a-button>
            <a-button size="small" :disabled="mode === 'auto' || index === pendingTasks.length - 1" @click="emitTaskAction('move-down', task)">下移</a-button>
            <a-button size="small" danger @click="emitTaskAction('cancel-task', task)">取消</a-button>
          </div>
        </div>
      </div>
    </a-card>

    <a-card class="panel panel-process">
      <template #title>
        <div class="panel-title-wrap">
          <span>待处理任务</span>
          <a-tag color="red">{{ pendingProcessTasks.length }}</a-tag>
        </div>
      </template>
      <a-empty v-if="pendingProcessTasks.length === 0" description="暂无待处理任务" />
      <div v-else class="task-list">
        <div v-for="task in pendingProcessTasks" :key="task.id" class="task-item">
          <div class="task-title-wrap">
            <div class="task-title">{{ task.name }}</div>
            <div>
              <a-tag :color="getSceneColor(task.businessScene)">{{ task.businessSceneLabel || getSceneText(task.businessScene) }}</a-tag>
              <a-tag :color="getRiskColor(task.riskLevel)">{{ task.riskLevelLabel || getRiskText(task.riskLevel) }}</a-tag>
              <a-tag color="volcano">必须人工确认</a-tag>
            </div>
          </div>
          <div class="meta">
            <span>处理原因：{{ task.reason || '-' }}</span>
            <span>生成时间：{{ task.createdAt }}</span>
          </div>
          <div v-if="task.affectedTaskName" class="meta emphasis">受影响任务：{{ task.affectedTaskName }}</div>
          <div class="meta">
            <span>建议动作：{{ task.suggestedAction || '人工确认后补检' }}</span>
            <span>调度原因：{{ task.dispatchReason || task.reason || '-' }}</span>
          </div>
          <div class="actions">
            <a-button size="small" type="primary" @click="emitTaskAction('accept-auto', task)">接受</a-button>
            <a-button size="small" @click="emitTaskAction('replace-robot', task)">替换机器人</a-button>
            <a-button size="small" @click="emitTaskAction('view-reason', task)">查看原因</a-button>
            <a-button size="small" danger @click="emitTaskAction('cancel-task', task)">取消</a-button>
          </div>
        </div>
      </div>
    </a-card>

    <a-card class="panel panel-record">
      <template #title>
        <div class="panel-title-wrap">
          <span>调度记录（今日）</span>
          <a-tag>{{ records.length }}</a-tag>
        </div>
      </template>
      <a-empty v-if="records.length === 0" description="暂无调度记录" />
      <a-timeline v-else>
        <a-timeline-item v-for="record in records" :key="record.id">
          <div class="record-line">
            <span class="time">{{ record.time }}</span>
            <span class="event">{{ record.event }}</span>
            <a-tag size="small">{{ record.resultStatus }}</a-tag>
          </div>
        </a-timeline-item>
      </a-timeline>
    </a-card>
  </div>
</template>

<script setup lang="ts">
export interface DispatchTask {
  id: string
  name: string
  type: 'plan' | 'auto' | 'temp'
  typeLabel?: string
  businessScene?: string
  businessSceneLabel?: string
  dispatchType?: string
  tempTaskType?: string
  riskLevel?: string
  riskLevelLabel?: string
  taskSource?: string
  suggestedAction?: string
  dispatchReason?: string
  constraintSummary?: string
  status: 'running' | 'pending' | 'auto_pending' | 'conflict' | 'paused' | 'cancelled'
  robotName: string
  reason?: string
  priority: 'high' | 'medium' | 'low'
  priorityLabel?: string
  createdAt: string
  scheduledAt?: string
  startedAt?: string
  progressPercent?: number
  doneCount?: number
  totalCount?: number
  etaTime?: string
  affectedTaskName?: string
  queueOrder?: number
  changeFlag?: boolean
  changeReason?: string
}

export interface DispatchRecordItem {
  id: string
  time: string
  event: string
  taskName: string
  resultStatus: 'pending' | 'running' | 'done' | 'rejected'
  source: 'auto' | 'manual' | 'temp'
}

type ActionType = 'view-detail' | 'replace-robot' | 'move-up' | 'move-down' | 'cancel-task' | 'accept-auto' | 'view-reason'

defineProps<{
  runningTasks: DispatchTask[]
  pendingTasks: DispatchTask[]
  pendingProcessTasks: DispatchTask[]
  records: DispatchRecordItem[]
  mode: 'auto' | 'manual'
}>()

const emit = defineEmits<{ (e: 'task-action', payload: { type: ActionType; task: DispatchTask }): void }>()
function emitTaskAction(type: ActionType, task: DispatchTask) { emit('task-action', { type, task }) }

function getSceneText(scene?: string) {
  return ({ daily_inspection: '日常巡检', hazard_screening: '隐患排查', environment_check: '环境检查', operation_guard: '作业监护', recheck: '补检' } as Record<string, string>)[scene || ''] || '日常巡检'
}

function getSceneColor(scene?: string) {
  return ({ daily_inspection: 'blue', hazard_screening: 'volcano', environment_check: 'green', operation_guard: 'purple', recheck: 'red' } as Record<string, string>)[scene || ''] || 'blue'
}

function getRiskText(level?: string) {
  return ({ normal: '普通', warning: '预警', alarm: '告警', critical_alarm: '严重告警', hazard: '隐患', major_hazard: '重大隐患' } as Record<string, string>)[level || ''] || '普通'
}

function getRiskColor(level?: string) {
  return ({ normal: 'default', warning: 'gold', alarm: 'orange', critical_alarm: 'red', hazard: 'volcano', major_hazard: 'magenta' } as Record<string, string>)[level || ''] || 'default'
}
</script>

<style scoped lang="css">.board-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-areas: 'running running' 'pending pendingProcess' 'record record';
  gap: 12px;
  min-width: 0;
}
.panel-running {
  grid-area: running;
}
.panel-pending {
  grid-area: pending;
}
.panel-process {
  grid-area: pendingProcess;
}
.panel-record {
  grid-area: record;
}
.panel-title-wrap {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.task-item {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  padding: 12px;
  background: #fff;
}
.task-title-wrap {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 6px;
  min-width: 0;
}
.task-title-wrap > div:last-child {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 4px;
}
.task-title {
  font-size: 14px;
  font-weight: 600;
  min-width: 0;
  word-break: break-word;
}
.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}
.meta.emphasis {
  color: #531dab;
}
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}
.record-line {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}
.time {
  color: #999;
}
@media (max-width: 1200px) {
  .board-grid {
    grid-template-columns: 1fr;
    grid-template-areas: 'running' 'pending' 'pendingProcess' 'record';
  }
}
@media (max-width: 768px) {
  .task-item {
    padding: 10px;
  }
  .task-title-wrap {
    align-items: flex-start;
    flex-direction: column;
  }
  .task-title-wrap > div:last-child {
    justify-content: flex-start;
  }
  .actions {
    gap: 6px;
  }
}
</style>
