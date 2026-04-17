<template>
  <a-card class="kpi-tile" :bordered="false">
    <div class="kpi-top">
      <span class="kpi-title">{{ title }}</span>
      <span class="kpi-chip">{{ chip }}</span>
    </div>
    <div class="kpi-value">{{ value }}</div>
    <div class="kpi-meta" :class="metaType">{{ meta }}</div>
  </a-card>
</template>

<script setup lang="ts">
defineProps<{
  title: string
  chip: string
  value: string
  meta: string
  metaType?: 'up' | 'down' | 'flat'
}>()
</script>

<style scoped>
.kpi-tile {
  border-radius: 12px;
  overflow: hidden;
  background:
    linear-gradient(175deg, rgba(255, 255, 255, 0.96), rgba(241, 245, 249, 0.92)),
    linear-gradient(120deg, rgba(15, 118, 110, 0.08), rgba(245, 158, 11, 0.08));
  box-shadow: 0 14px 24px -22px rgba(15, 23, 42, 0.9);
  animation: riseIn 0.36s ease both;
}

.kpi-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.kpi-title {
  color: #475569;
  font-size: 12px;
}

.kpi-chip {
  font-size: 11px;
  color: #0f766e;
  padding: 2px 8px;
  border-radius: 999px;
  background: rgba(15, 118, 110, 0.12);
}

.kpi-value {
  margin-top: 10px;
  font-size: 29px;
  line-height: 1;
  letter-spacing: 0.4px;
  color: #0f172a;
  font-weight: 700;
}

.kpi-meta {
  margin-top: 10px;
  font-size: 12px;
  color: #64748b;
}

.kpi-meta.up {
  color: #15803d;
}

.kpi-meta.down {
  color: #b45309;
}

.kpi-meta.flat {
  color: #0369a1;
}

@keyframes riseIn {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
