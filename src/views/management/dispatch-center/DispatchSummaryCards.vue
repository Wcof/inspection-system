<template>
  <div class="summary-grid">
    <a-card size="small">
      <div class="title">任务统计</div>
      <div class="value">{{ summary.totalTasks }}</div>
    </a-card>
    <a-card size="small">
      <div class="title">执行中任务</div>
      <div class="value">{{ summary.runningTasks }}</div>
    </a-card>
    <a-card size="small">
      <div class="title">待执行任务</div>
      <div class="value">{{ summary.pendingTasks }}</div>
    </a-card>
    <a-card size="small">
      <div class="title">自动调度任务</div>
      <div class="value">{{ summary.autoTasks }}</div>
    </a-card>
    <a-card size="small">
      <div class="title">待确认任务</div>
      <div class="value">{{ summary.waitingConfirmTasks }}</div>
    </a-card>
    <a-card size="small">
      <div class="title">机器人总数</div>
      <div class="value">{{ summary.robotTotal }}</div>
      <div class="sub">
        空闲 {{ summary.robotIdle }} | 执行中 {{ summary.robotRunning }} | 充电中 {{ summary.robotCharging }}
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
export interface DispatchSummary {
  totalTasks: number
  runningTasks: number
  pendingTasks: number
  autoTasks: number
  waitingConfirmTasks: number
  robotTotal: number
  robotIdle: number
  robotRunning: number
  robotCharging: number
}

defineProps<{
  summary: DispatchSummary
}>()
</script>

<style scoped lang="scss">
.summary-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
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
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
