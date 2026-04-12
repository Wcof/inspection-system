<template>
  <a-card class="control-card">
    <div class="control-row">
      <div class="left">
        <a-space :size="16" wrap>
          <div class="control-item">
            <span class="label">自动调度</span>
            <a-switch
              :checked="control.autoDispatchEnabled"
              @update:checked="(value: boolean) => updateControl('autoDispatchEnabled', value)"
            />
          </div>
          <div class="control-item">
            <span class="label">调度模式</span>
            <a-select
              :value="control.mode"
              style="width: 140px"
              @update:value="(value: DispatchMode) => updateControl('mode', value)"
            >
              <a-select-option value="auto">自动模式</a-select-option>
              <a-select-option value="manual">人工模式</a-select-option>
            </a-select>
          </div>
          <div class="control-item">
            <a-checkbox
              :checked="control.allowAutoCreate"
              :disabled="control.autoDispatchEnabled"
              @update:checked="(value: boolean) => updateControl('allowAutoCreate', value)"
            >
              允许自动创建任务
            </a-checkbox>
          </div>
          <div class="control-item">
            <a-checkbox
              :checked="control.allowQueueJump"
              :disabled="control.autoDispatchEnabled"
              @update:checked="(value: boolean) => updateControl('allowQueueJump', value)"
            >
              允许任务插队
            </a-checkbox>
          </div>
        </a-space>
        <div class="tip">
          <p>{{ tipSummary }}</p>
          <p>功能说明：自动创建任务=系统检测到异常或漏检时自动生成补检任务；任务插队=紧急任务可插入到普通待执行任务之前。</p>
        </div>
      </div>
      <div class="actions">
        <a-space>
          <a-button type="primary" @click="$emit('create-temporary')">创建临时任务</a-button>
          <a-button @click="$emit('refresh')">刷新数据</a-button>
        </a-space>
      </div>
    </div>
  </a-card>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export type DispatchMode = 'auto' | 'manual'

export interface DispatchControlState {
  autoDispatchEnabled: boolean
  allowAutoCreate: boolean
  allowQueueJump: boolean
  mode: DispatchMode
}

const props = defineProps<{
  control: DispatchControlState
}>()

const emit = defineEmits<{
  (e: 'update:control', value: DispatchControlState): void
  (e: 'create-temporary'): void
  (e: 'refresh'): void
}>()

const tipSummary = computed(() => {
  if (props.control.autoDispatchEnabled && props.control.mode === 'auto') {
    return '当前为自动调度：系统自动确认自动创建任务，无需人工确认。'
  }
  if (props.control.autoDispatchEnabled && props.control.mode === 'manual') {
    return '当前为人工调度：系统会生成自动任务，但需在“待人工确认任务”中手动确认。'
  }
  return '自动调度已关闭：不自动生成任务，仅支持人工发起。'
})

function updateControl<K extends keyof DispatchControlState>(key: K, value: DispatchControlState[K]) {
  const next = {
    ...props.control,
    [key]: value
  }
  if (next.autoDispatchEnabled) {
    next.allowAutoCreate = true
    next.allowQueueJump = true
  }
  emit('update:control', {
    ...next
  })
}
</script>

<style scoped lang="scss">
.control-card {
  margin-bottom: 12px;
}

.control-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.left {
  flex: 1;
  min-width: 0;
}

.control-item {
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-size: 13px;
}

.tip {
  margin: 10px 0 0;
  font-size: 12px;
  color: #666;

  p {
    margin: 0 0 4px;
  }
}

.actions {
  display: flex;
  align-items: flex-start;
}

@media (max-width: 1200px) {
  .control-row {
    flex-direction: column;
  }
}
</style>
