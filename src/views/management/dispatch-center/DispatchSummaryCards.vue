<template>
  <div class="summary-grid">
    <a-card size="small" class="summary-card" :class="{ active: activeFilter === 'plan' }" @click="emitFilter('plan')">
      <div class="title">今日计划</div>
      <div class="value">{{ summary.plan.total }}</div>
      <div class="sub">人工计划 {{ summary.plan.manual }} | 自动调度 {{ summary.plan.auto }}</div>
    </a-card>

    <a-card size="small" class="summary-card chart-card" :class="{ active: activeFilter === 'running' }" @click="emitFilter('running')">
      <div class="title">执行中</div>
      <div class="value">{{ summary.task.running }}</div>
      <div class="sub">当前正在执行的机器人任务</div>
      <div class="mini-chart bars">
        <span class="bar running" :style="{ height: `${barHeight(summary.task.running, summary.task.total)}%` }" />
      </div>
    </a-card>

    <a-card size="small" class="summary-card chart-card" :class="{ active: activeFilter === 'pending' }" @click="emitFilter('pending')">
      <div class="title">待执行</div>
      <div class="value">{{ summary.task.pending }}</div>
      <div class="sub">已生成，等待进入执行队列</div>
      <div class="mini-chart bars">
        <span class="bar pending" :style="{ height: `${barHeight(summary.task.pending, summary.task.total)}%` }" />
      </div>
    </a-card>

    <a-card size="small" class="summary-card chart-card" :class="{ active: activeFilter === 'processing' }" @click="emitFilter('processing')">
      <div class="title">待处理</div>
      <div class="value">{{ summary.task.processing }}</div>
      <div class="sub">冲突、漏检或待人工确认</div>
      <div class="mini-chart bars">
        <span class="bar processing" :style="{ height: `${barHeight(summary.task.processing, summary.task.total)}%` }" />
      </div>
    </a-card>

    <a-card size="small" class="summary-card chart-card" :class="{ active: activeFilter === 'temporary' }" @click="emitFilter('temporary')">
      <div class="title">临时任务</div>
      <div class="value">{{ summary.temporary.total }}</div>
      <div class="sub">待处理 {{ summary.temporary.pending }} | 已下发 {{ summary.temporary.dispatched }}</div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
export interface DispatchSummary {
  timeRange: string
  task: { total: number; running: number; pending: number; processing: number }
  plan: { total: number; manual: number; auto: number }
  temporary: { total: number; pending: number; dispatched: number }
}

export type SummaryFilter = 'plan' | 'running' | 'pending' | 'processing' | 'temporary'

defineProps<{ summary: DispatchSummary; activeFilter?: SummaryFilter | '' }>()
const emit = defineEmits<{ (e: 'filter', value: SummaryFilter): void }>()

function emitFilter(value: SummaryFilter) {
  emit('filter', value)
}

function barHeight(value: number, total: number) {
  if (!total) return 18
  return Math.max(18, Math.round((value / total) * 100))
}

</script>

<style scoped lang="css">
.summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.title {
  font-size: 13px;
  margin-bottom: 8px;
  color: #374151;
  font-weight: 700;
}

.value {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.1;
}

.value.small {
  font-size: 18px;
  line-height: 1.4;
}

.sub {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
}

.chart-card {
  position: relative;
}
.summary-card {
  cursor: pointer;
  border: 1px solid #f0f0f0;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.summary-card.active {
  border-color: #1677ff;
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.12);
}

.mini-chart {
  margin-top: 10px;
}

.bars {
  height: 38px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  align-items: end;
}

.bar {
  border-radius: 4px 4px 0 0;
  min-height: 10px;
  transition: all 0.2s;
}

.bar.running {
  background: linear-gradient(180deg, #1677ff 0%, #0958d9 100%);
}

.bar.pending {
  background: linear-gradient(180deg, #faad14 0%, #d48806 100%);
}

.bar.processing {
  background: linear-gradient(180deg, #13c2c2 0%, #08979c 100%);
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
