<template>
  <div class="summary-grid">
    <a-card size="small">
      <div class="title">当前时间范围</div>
      <div class="value small">{{ summary.timeRange }}</div>
      <div class="sub">当前页面数据按该时间范围统计</div>
    </a-card>

    <a-card size="small" class="chart-card">
      <div class="title">任务统计</div>
      <div class="value">{{ summary.task.total }}</div>
      <div class="sub">执行中 {{ summary.task.running }} | 待执行 {{ summary.task.pending }} | 待处理 {{ summary.task.processing }}</div>
      <div class="mini-chart bars">
        <span class="bar running" :style="{ height: `${barHeight(summary.task.running, summary.task.total)}%` }" />
        <span class="bar pending" :style="{ height: `${barHeight(summary.task.pending, summary.task.total)}%` }" />
        <span class="bar processing" :style="{ height: `${barHeight(summary.task.processing, summary.task.total)}%` }" />
      </div>
    </a-card>

    <a-card size="small" class="chart-card">
      <div class="title">临时任务</div>
      <div class="value">{{ summary.temporary.total }}</div>
      <div class="sub">待处理 {{ summary.temporary.pending }} | 已下发 {{ summary.temporary.dispatched }}</div>
      <div class="mini-chart ring-wrap">
        <div class="ring" :style="ringStyle" />
        <div class="ring-text">{{ tempPendingRatio }}%</div>
      </div>
    </a-card>

    <a-card size="small" class="chart-card">
      <div class="title">计划统计</div>
      <div class="value">{{ summary.plan.total }}</div>
      <div class="sub">人工计划 {{ summary.plan.manual }} | 自动调度 {{ summary.plan.auto }}</div>
      <div class="mini-chart line-chart">
        <span
          v-for="(point, idx) in planTrend"
          :key="`trend-${idx}`"
          class="line-dot"
          :style="{ left: `${idx * 24}%`, bottom: `${point}%` }"
        />
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface DispatchSummary {
  timeRange: string
  task: { total: number; running: number; pending: number; processing: number }
  plan: { total: number; manual: number; auto: number }
  temporary: { total: number; pending: number; dispatched: number }
}

const props = defineProps<{ summary: DispatchSummary }>()

function barHeight(value: number, total: number) {
  if (!total) return 18
  return Math.max(18, Math.round((value / total) * 100))
}

const tempPendingRatio = computed(() => {
  if (!props.summary.temporary.total) return 0
  return Math.round((props.summary.temporary.pending / props.summary.temporary.total) * 100)
})

const ringStyle = computed(() => {
  const ratio = tempPendingRatio.value
  return {
    background: `conic-gradient(#fa8c16 ${ratio}%, #d9d9d9 ${ratio}% 100%)`
  }
})

const planTrend = computed(() => {
  const manual = props.summary.plan.manual
  const auto = props.summary.plan.auto
  const total = Math.max(1, props.summary.plan.total)
  return [
    Math.max(16, Math.round((manual / total) * 72)),
    Math.max(22, Math.round(((manual + auto * 0.3) / total) * 72)),
    Math.max(28, Math.round((auto / total) * 72)),
    Math.max(20, Math.round(((manual + auto) / total) * 52)),
    Math.max(18, Math.round((auto / total) * 58))
  ]
})
</script>

<style scoped lang="css">
.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
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

.ring-wrap {
  position: relative;
  height: 40px;
}

.ring {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  position: relative;
}

.ring::after {
  content: '';
  position: absolute;
  inset: 7px;
  border-radius: 50%;
  background: #fff;
}

.ring-text {
  position: absolute;
  left: 50px;
  top: 9px;
  font-size: 14px;
  font-weight: 600;
  color: #fa8c16;
}

.line-chart {
  position: relative;
  height: 38px;
  border-top: 1px dashed #e5e7eb;
}

.line-chart::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 10px;
  border-top: 1px solid #bfd3ff;
}

.line-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #1677ff;
  transform: translateX(-50%);
  box-shadow: 0 0 0 2px rgba(22, 119, 255, 0.16);
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
