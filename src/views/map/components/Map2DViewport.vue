<template>
  <div class="map2d-viewport">
    <svg class="map2d-svg" :viewBox="viewBox" 
      @click="$emit('mapClick', $event)"
      @mousedown="$emit('mouseDown', $event)"
      @mousemove="$emit('mouseMove', $event)"
      @mouseup="$emit('mouseUp', $event)"
      @contextmenu.prevent="$emit('rightClick', $event)">
      <slot />
    </svg>
    <div class="map2d-tools">
      <a-button-group size="small">
        <a-button @click="$emit('zoomIn')"><ZoomInOutlined /></a-button>
        <a-button @click="$emit('zoomOut')"><ZoomOutOutlined /></a-button>
        <a-button @click="$emit('fitContent')">适配</a-button>
      </a-button-group>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ZoomInOutlined, ZoomOutOutlined } from '@ant-design/icons-vue'

defineProps<{
  viewBox: string
}>()

defineEmits<{
  (e: 'mapClick', event: MouseEvent): void
  (e: 'mouseDown', event: MouseEvent): void
  (e: 'mouseMove', event: MouseEvent): void
  (e: 'mouseUp', event: MouseEvent): void
  (e: 'rightClick', event: MouseEvent): void
  (e: 'zoomIn'): void
  (e: 'zoomOut'): void
  (e: 'fitContent'): void
}>()
</script>

<style scoped lang="scss">
.map2d-viewport {
  width: 100%;
  height: 100%;
  position: relative;
  .map2d-svg {
    width: 100%;
    height: 100%;
    cursor: crosshair;
  }
  .map2d-tools {
    position: absolute;
    top: 8px;
    left: 8px;
    z-index: 10;
  }
}
</style>
