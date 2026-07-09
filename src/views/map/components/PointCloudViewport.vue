<template>
  <div class="pointcloud-viewport" ref="cloudContainer">
    <div class="cloud-placeholder">
      <CloudOutlined style="font-size: 48px; color: #bfbfbf;" />
      <p style="color: #999; margin-top: 8px;">点云图预览</p>
      <p style="color: #ccc; font-size: 12px;" v-if="selectedEntityName">选中: {{ selectedEntityName }}</p>
      <p style="color: #ccc; font-size: 12px;" v-else>在左侧地图中选择元素进行同步高亮</p>
    </div>
    <!-- 降级提示 -->
    <div v-if="!available" class="cloud-overlay">
      <p>{{ disabledReasonText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { CloudOutlined } from '@ant-design/icons-vue'

const props = defineProps<{
  available: boolean
  disabledReason?: string | null
  selectedEntityName?: string
}>()

const disabledReasonText = computed(() => {
  if (!props.disabledReason) return '点云图不可用'
  const map: Record<string, string> = {
    network: '点云图已因网络策略暂停显示',
    performance: '点云图已因性能策略暂停显示',
    manual: '点云图已手动关闭'
  }
  return map[props.disabledReason] || '点云图不可用'
})
</script>

<style scoped lang="scss">
.pointcloud-viewport {
  width: 100%;
  height: 100%;
  position: relative;
  background: #f5f5f5;
  .cloud-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
  }
  .cloud-overlay {
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.8);
    color: #999;
    font-size: 13px;
  }
}
</style>
