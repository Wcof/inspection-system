<template>
  <div class="hud hud-card hud-point-info">
    <div class="hud-card-header">
      <span class="header-line"></span>
      <div class="hud-card-title">当前点位</div>
    </div>
    <div class="hud-card-body">
      <template v-if="point">
        <div class="hud-row">
          <span class="hud-label">名称</span>
          <span class="hud-value name-highlight">{{ point.name }}</span>
        </div>
        <div class="hud-row">
          <span class="hud-label">装置</span>
          <span class="hud-value" :title="deviceName">{{ deviceName || '无' }}</span>
        </div>
        <div class="hud-row">
          <span class="hud-label">设施</span>
          <span class="hud-value" :title="facilityName">{{ facilityName || '无' }}</span>
        </div>
        <div class="hud-row">
          <span class="hud-label">对象</span>
          <span class="hud-value" :title="objectName">{{ objectName || '无' }}</span>
        </div>
        <div class="hud-row">
          <span class="hud-label">规则</span>
          <span class="hud-value" :title="ruleName">{{ ruleName || '无' }}</span>
        </div>
      </template>
      <template v-else>
        <div class="hud-row">
          <span class="hud-label">名称</span>
          <span class="hud-value">无活跃连接</span>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MockService } from '@/mock/mockService'
import type { InspectionPoint } from '@/types/inspection'

const props = defineProps<{
  point: InspectionPoint | null
}>()

const deviceName = computed(() => {
  if (!props.point) return ''
  const devices = MockService.getInspectionDevices().filter(
    d => d.inspectionPointId === props.point!.id
  )
  return devices.map(d => d.name).join('、')
})

const facilityName = computed(() => {
  if (!props.point?.coverageObjects?.length) return ''
  return props.point.coverageObjects
    .filter(o => o.type === 'asset' || o.type === 'component')
    .map(o => o.name)
    .join('、')
})

const objectName = computed(() => {
  if (!props.point?.coverageObjects?.length) return ''
  return props.point.coverageObjects
    .filter(o => o.type === 'component' || o.type === 'connection')
    .map(o => o.name)
    .join('、')
})

const ruleName = computed(() => {
  if (!props.point?.detectionConfigs?.length) return ''
  return props.point.detectionConfigs
    .filter(c => c.enabled)
    .map(c => c.subjectName)
    .join('、')
})
</script>

<style scoped lang="less">
.hud-point-info {
  position: absolute;
  top: 68px;
  left: 492px;
  z-index: 5;
  width: 220px;
}

// Glassmorphism HUD styles inherited from parent theme
.hud-card {
  background: linear-gradient(135deg, rgba(8, 16, 36, 0.82) 0%, rgba(3, 7, 18, 0.9) 100%);
  border: 1px solid rgba(0, 212, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(0, 212, 255, 0.05);
  border-radius: 6px;
  padding: 12px 16px;
  color: #d1d5db;
  backdrop-filter: blur(12px);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    border-color: rgba(0, 212, 255, 0.4);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 212, 255, 0.15), inset 0 0 15px rgba(0, 212, 255, 0.08);
  }

  .hud-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(0, 212, 255, 0.15);

    .header-line {
      width: 3px;
      height: 12px;
      background: #00d4ff;
      box-shadow: 0 0 6px #00d4ff;
    }

    .hud-card-title {
      font-size: 11px;
      font-weight: 800;
      color: #00d4ff;
      letter-spacing: 1.5px;
      text-shadow: 0 0 8px rgba(0, 212, 255, 0.2);
    }
  }
}

.hud-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  line-height: 2;
  font-size: 12px;

  .hud-label {
    color: rgba(255, 255, 255, 0.5);
    font-weight: 500;
    letter-spacing: 0.5px;
  }

  .hud-value {
    color: #f3f4f6;
    font-weight: 600;
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    &.name-highlight {
      color: #00d4ff;
      text-shadow: 0 0 6px rgba(0, 212, 255, 0.3);
    }
  }
}
</style>
