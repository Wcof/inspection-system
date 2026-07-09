<template>
  <div class="road-status-summary">
    <span>路段: <b>{{ counts.segments }}</b></span>
    <span>节点: <b>{{ counts.nodes }}</b></span>
    <span>路口: <b>{{ counts.junctions }}</b></span>
    <span>点位: <b>{{ counts.navPoints }}</b></span>
    <span>区域: <b>{{ counts.zones }}</b></span>
    <span v-if="topologyErrors !== undefined" :class="{ 'has-error': topologyErrors > 0 }">
      拓扑错误: <b>{{ topologyErrors }}</b>
    </span>
    <span class="coord" v-if="mousePos">X: {{ Math.round(mousePos.x) }} Y: {{ Math.round(mousePos.y) }}</span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  counts: {
    segments: number
    nodes: number
    junctions: number
    navPoints: number
    zones: number
  }
  mousePos?: { x: number; y: number }
  topologyErrors?: number
}>()
</script>

<style scoped lang="scss">
.road-status-summary {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 10px;
  border: 1px solid #e5e6eb;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  font-size: 12px;
  color: #4e5969;
  b { color: #1d2129; }
  .has-error b { color: #ff4d4f; }
  .coord { font-family: monospace; }
}
</style>
