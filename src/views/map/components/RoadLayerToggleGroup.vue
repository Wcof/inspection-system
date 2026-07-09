<template>
  <div class="road-layer-toggles">
    <a-tooltip title="显示/隐藏路段">
      <a-button size="small" :type="showSegments ? 'primary' : 'default'" @click="$emit('toggle', 'segments')" class="layer-btn">
        <span class="layer-dot" style="background:#1677ff"></span> 路段
      </a-button>
    </a-tooltip>
    <a-tooltip title="显示/隐藏路口">
      <a-button size="small" :type="showJunctions ? 'primary' : 'default'" @click="$emit('toggle', 'junctions')" class="layer-btn">
        <span class="layer-dot" style="background:#faad14"></span> 路口
      </a-button>
    </a-tooltip>
    <a-tooltip title="显示/隐藏巡检点">
      <a-button size="small" :type="showInspection ? 'primary' : 'default'" @click="$emit('toggle', 'inspection')" class="layer-btn">
        <span class="layer-dot" style="background:#1677ff"></span> 巡检点
      </a-button>
    </a-tooltip>
    <a-tooltip title="显示/隐藏停车点">
      <a-button size="small" :type="showParking ? 'primary' : 'default'" @click="$emit('toggle', 'parking')" class="layer-btn">
        <span class="layer-dot" style="background:#52c41a"></span> 停车点
      </a-button>
    </a-tooltip>
    <a-tooltip title="显示/隐藏充电点">
      <a-button size="small" :type="showCharging ? 'primary' : 'default'" @click="$emit('toggle', 'charging')" class="layer-btn">
        <span class="layer-dot" style="background:#7cb305"></span> 充电点
      </a-button>
    </a-tooltip>
    <a-tooltip title="显示/隐藏区域">
      <a-button size="small" :type="showZones ? 'primary' : 'default'" @click="$emit('toggle', 'zones')" class="layer-btn">
        <span class="layer-dot" style="background:#ff4d4f"></span> 区域
      </a-button>
    </a-tooltip>
    <a-divider type="vertical" />
    <a-tooltip title="途经点(默认隐藏)">
      <a-button size="small" :type="showWaypoints ? 'primary' : 'default'" @click="$emit('toggle', 'waypoints')" class="layer-btn">
        <span class="layer-dot" style="background:#8c8c8c"></span> 途经点
      </a-button>
    </a-tooltip>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  showSegments: boolean
  showJunctions: boolean
  showInspection: boolean
  showParking: boolean
  showCharging: boolean
  showZones: boolean
  showWaypoints: boolean
}>()

defineEmits<{
  (e: 'toggle', layer: string): void
}>()
</script>

<style scoped lang="scss">
.road-layer-toggles {
  display: flex;
  gap: 4px;
  align-items: center;
  .layer-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    padding: 2px 8px;
    .layer-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }
  }
}
</style>
