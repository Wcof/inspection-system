<template>
  <div class="board-grid">
    <a-card class="panel panel-running">
      <template #title>
        <div class="panel-title-wrap">
          <span>执行计划</span>
          <a-tag color="blue">{{ runningTasks.length }}</a-tag>
        </div>
      </template>
      <a-empty v-if="runningTasks.length === 0" description="暂无执行中任务" />
      <div v-else class="task-list">
        <div v-for="task in runningTasks" :key="task.id" class="task-item">
          <div class="task-title">{{ task.name }}</div>
          <div class="meta">
            <span>机器人：{{ task.robotName }}</span>
            <span>开始：{{ task.startedAt || '-' }}</span>
            <span>预计完成：{{ task.etaTime || '-' }}</span>
          </div>
          <div class="meta">
            <span>进度：{{ task.progressPercent ?? 0 }}%</span>
            <span>完成：{{ task.doneCount ?? 0 }}/{{ task.totalCount ?? 0 }}</span>
          </div>
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
      <a-empty v-if="pendingTasks.length === 0" description="暂无待执行任务" />
      <div v-else class="task-list">
        <div v-for="(task, index) in pendingTasks" :key="task.id" class="task-item">
          <div class="task-title">{{ task.name }}</div>
          <div class="meta">
            <span>开始时间：{{ task.scheduledAt || '-' }}</span>
            <span>优先级：{{ task.priority }}</span>
          </div>
          <div class="actions">
            <a-button size="small" :disabled="index === 0" @click="emitTaskAction('move-up', task)">上移</a-button>
            <a-button size="small" :disabled="index === pendingTasks.length - 1" @click="emitTaskAction('move-down', task)">下移</a-button>
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
          <div class="task-title">{{ task.name }}</div>
          <div class="meta">
            <span>任务类型：{{ task.type === 'auto' ? '自动调度' : '冲突待处理' }}</span>
            <span>生成时间：{{ task.createdAt }}</span>
          </div>
          <div class="meta">
            <span>处理原因：{{ task.reason || '-' }}</span>
          </div>
          <div v-if="task.affectedTaskName" class="meta">
            <span>影响任务：{{ task.affectedTaskName }}</span>
          </div>
          <div class="actions">
            <a-button size="small" type="primary" @click="emitTaskAction('accept-auto', task)">接受</a-button>
            <a-button size="small" @click="emitTaskAction('insert-execute', task)">插队执行</a-button>
            <a-button size="small" @click="emitTaskAction('replace-robot', task)">替换机器人</a-button>
            <a-button size="small" @click="emitTaskAction('cancel-task', task)">取消</a-button>
            <a-button size="small" @click="emitTaskAction('view-reason', task)">查看原因</a-button>
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
  status: 'running' | 'pending' | 'auto_pending' | 'conflict' | 'paused' | 'cancelled'
  robotName: string
  reason?: string
  priority: 'high' | 'medium' | 'low'
  createdAt: string
  scheduledAt?: string
  startedAt?: string
  progressPercent?: number
  doneCount?: number
  totalCount?: number
  etaTime?: string
  affectedTaskName?: string
  queueOrder?: number
}

export interface DispatchRecordItem {
  id: string
  time: string
  event: string
  taskName: string
  resultStatus: 'pending' | 'running' | 'done' | 'rejected'
  source: 'auto' | 'manual' | 'temp'
}

type ActionType =
  | 'view-detail'
  | 'replace-robot'
  | 'move-up'
  | 'move-down'
  | 'cancel-task'
  | 'accept-auto'
  | 'view-reason'
  | 'insert-execute'

defineProps<{
  runningTasks: DispatchTask[]
  pendingTasks: DispatchTask[]
  pendingProcessTasks: DispatchTask[]
  records: DispatchRecordItem[]
}>()

const emit = defineEmits<{
  (e: 'task-action', payload: { type: ActionType; task: DispatchTask }): void
}>()

function emitTaskAction(type: ActionType, task: DispatchTask) {
  emit('task-action', { type, task })
}
</script>

<style scoped lang="scss">
.board-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-areas:
    'running running'
    'pending pendingProcess'
    'record record';
  gap: 12px;
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
}

.panel-running .task-list {
  max-height: 430px;
  overflow: auto;
  padding-right: 4px;
}

.panel-pending .task-list,
.panel-process .task-list {
  max-height: 300px;
  overflow: auto;
  padding-right: 4px;
}

.panel-record :deep(.ant-timeline) {
  max-height: 250px;
  overflow: auto;
  padding-right: 4px;
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

.task-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
}

.meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px dashed #f0f0f0;
}

.record-line {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.time {
  width: 44px;
  color: #666;
}

.event {
  flex: 1;
}

@media (max-width: 1300px) {
  .board-grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      'running'
      'pending'
      'pendingProcess'
      'record';
  }
}

@media (max-width: 900px) {
  .board-grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      'running'
      'pending'
      'pendingProcess'
      'record';
  }
}
</style>
