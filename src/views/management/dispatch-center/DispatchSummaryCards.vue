<template>
  <div class="summary-grid">
    <a-card size="small">
      <div class="title">任务统计</div>
      <div class="value">{{ summary.task.total }}</div>
      <div class="sub">执行中 {{ summary.task.running }} | 待执行 {{ summary.task.pending }}</div>
      <div class="sub">已完成 {{ summary.task.completed }} | 自动调度 {{ summary.task.auto }}</div>
    </a-card>
    <a-card size="small">
      <div class="title">计划统计</div>
      <div class="value">{{ summary.plan.total }}</div>
      <div class="sub">执行中 {{ summary.plan.running }} | 待执行 {{ summary.plan.pending }}</div>
      <div class="sub">已完成 {{ summary.plan.completed }} | 自动调度 {{ summary.plan.auto }}</div>
    </a-card>
    <a-card size="small">
      <div class="title">机器人总数</div>
      <div class="value">{{ summary.robot.total }}</div>
      <div class="sub">
        空闲 {{ summary.robot.idle }} | 执行中 {{ summary.robot.running }} | 充电中 {{ summary.robot.charging }}
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
export interface DispatchSummary {
  task: {
    total: number
    running: number
    pending: number
    completed: number
    auto: number
  }
  plan: {
    total: number
    running: number
    pending: number
    completed: number
    auto: number
  }
  robot: {
    total: number
    idle: number
    running: number
    charging: number
  }
}

defineProps<{
  summary: DispatchSummary
}>()
</script>

<style scoped lang="scss">
.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;

  .title {
    font-size: 13px;
    margin-bottom: 8px;
    color: #666;
  }

  .value {
    font-size: 28px;
    font-weight: 600;
    line-height: 1.1;
  }

  .sub {
    margin-top: 8px;
    font-size: 12px;
    color: #666;
  }
}

@media (max-width: 1400px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
