<template>
  <a-modal :open="open" title="提示" :footer="null" width="380px" @cancel="$emit('close')">
    <div class="calibration-notice">
      <ExclamationCircleOutlined style="color: #faad14; font-size: 20px; margin-right: 8px;" />
      <span>当前点位未校准，存在实际偏差，请前往校准。</span>
    </div>
    <div class="modal-actions" style="margin-top: 16px; text-align: right;">
      <a-button style="margin-right: 8px" @click="$emit('close')">取消</a-button>
      <a-button type="primary" @click="$emit('calibrate')">前往校准</a-button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ExclamationCircleOutlined } from '@ant-design/icons-vue'

defineProps<{
  open: boolean
  pointName?: string
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'calibrate'): void
}>()
</script>

<style scoped lang="scss">
.calibration-notice {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #1d2129;
}
</style>
