<template>
  <div class="split-view-container" :class="layoutClass">
    <!-- 二维地图 -->
    <div v-if="show2D" class="viewport-2d" :class="{ 'pip-small': isPip2DSmall }">
      <slot name="map2d" />
    </div>
    <!-- 点云图 -->
    <div v-if="showCloud" class="viewport-cloud" :class="{ 'pip-small': isPipCloudSmall }">
      <div v-if="cloudAvailable" class="cloud-content">
        <slot name="pointcloud" />
      </div>
      <div v-else class="cloud-disabled">
        <CloudOutlined style="font-size: 32px; color: #bfbfbf;" />
        <p>{{ cloudDisabledReasonText }}</p>
      </div>
    </div>
    <!-- 分割线 -->
    <div v-if="showDivider" class="split-divider" :class="splitDividerClass"></div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CloudOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
  layout: string
  cloudAvailable: boolean
  cloudDisabledReason?: string | null
}>()

const show2D = computed(() => props.layout !== 'singleCloud')
const showCloud = computed(() => props.layout !== 'single2d')
const showDivider = computed(() => {
  return ['verticalEqual', 'horizontalEqual'].includes(props.layout)
})

const isPip2DSmall = computed(() => props.layout === 'pipCloudMain')
const isPipCloudSmall = computed(() => props.layout === 'pip2dMain')

const layoutClass = computed(() => {
  const map: Record<string, string> = {
    'single2d': 'layout-single',
    'singleCloud': 'layout-single',
    'pip2dMain': 'layout-pip-2dmain',
    'pipCloudMain': 'layout-pip-cloudmain',
    'verticalEqual': 'layout-vertical',
    'horizontalEqual': 'layout-horizontal'
  }
  return map[props.layout] || 'layout-single'
})

const splitDividerClass = computed(() => {
  return props.layout === 'horizontalEqual' ? 'divider-horizontal' : 'divider-vertical'
})

const cloudDisabledReasonText = computed(() => {
  if (!props.cloudDisabledReason) return '点云图不可用'
  const map: Record<string, string> = {
    network: '点云图已因网络策略暂停显示',
    performance: '点云图已因性能策略暂停显示',
    manual: '点云图已手动关闭'
  }
  return map[props.cloudDisabledReason] || '点云图不可用'
})
</script>

<style scoped lang="scss">
.split-view-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  display: flex;

  &.layout-single {
    .viewport-2d, .viewport-cloud { flex: 1; }
  }
  &.layout-vertical {
    flex-direction: row;
    .viewport-2d, .viewport-cloud { flex: 1; width: 50%; }
    .split-divider.divider-vertical { width: 4px; cursor: col-resize; }
  }
  &.layout-horizontal {
    flex-direction: column;
    .viewport-2d, .viewport-cloud { flex: 1; height: 50%; }
    .split-divider.divider-horizontal { height: 4px; cursor: row-resize; }
  }
  &.layout-pip-2dmain {
    .viewport-2d { flex: 1; }
    .viewport-cloud.pip-small {
      position: absolute; bottom: 16px; right: 16px;
      width: 240px; height: 180px;
      border: 2px solid #fff; border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10;
    }
  }
  &.layout-pip-cloudmain {
    .viewport-cloud { flex: 1; }
    .viewport-2d.pip-small {
      position: absolute; bottom: 16px; right: 16px;
      width: 240px; height: 180px;
      border: 2px solid #fff; border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 10;
    }
  }

  .viewport-2d, .viewport-cloud {
    position: relative;
    overflow: hidden;
    background: #f0f2f5;
  }

  .cloud-content { width: 100%; height: 100%; }
  .cloud-disabled {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    height: 100%; color: #bfbfbf;
  }

  .split-divider {
    flex-shrink: 0;
    background: #e8e8e8;
    &:hover { background: #1677ff; }
  }
}
</style>
