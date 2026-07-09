<template>
  <a-modal :open="open" title="检测到路口" @ok="$emit('confirm')" @cancel="$emit('cancel')" width="400px">
    <a-form layout="vertical">
      <a-form-item label="路口类型">
        <a-select v-model:value="junctionType">
          <a-select-option value="t_junction">T字形（三岔路）</a-select-option>
          <a-select-option value="cross">十字形（四岔路）</a-select-option>
          <a-select-option value="normal">其他</a-select-option>
        </a-select>
      </a-form-item>
      <p style="color: #86909c; font-size: 12px; margin: 0;">
        该节点连接了多条路段，是否将其标记为路口？
      </p>
    </a-form>
  </a-modal>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  open: boolean
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: string): void
  (e: 'confirm'): void
  (e: 'cancel'): void
}>()

const junctionType = computed({
  get: () => props.modelValue,
  set: (v: string) => emit('update:modelValue', v)
})
</script>
