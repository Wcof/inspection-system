<template>
  <a-card class="control-card">
    <div class="control-row">
      <div class="left">
        <a-space :size="16" wrap>
          <div class="control-item">
            <span class="label">自动调度</span>
            <a-switch :checked="control.autoDispatchEnabled" @update:checked="(value: boolean) => updateControl('autoDispatchEnabled', value)" />
          </div>
          <div class="control-item">
            <span class="label">调度模式</span>
            <a-select :value="control.mode" style="width: 160px" @update:value="(value: DispatchMode) => updateControl('mode', value)">
              <a-select-option value="auto">自动调度</a-select-option>
              <a-select-option value="manual">手动执行</a-select-option>
            </a-select>
          </div>
          <div class="control-item">
            <span class="label">统计范围</span>
            <a-select :value="control.robotId" style="width: 210px" @update:value="(value?: string) => updateControl('robotId', value || '__all__')" allow-clear placeholder="全部（全部机器人）今日任务">
              <a-select-option v-for="robot in robotOptions" :key="robot.value" :value="robot.value">{{ robot.label }}</a-select-option>
            </a-select>
          </div>
        </a-space>
        <div class="mode-hint">
          当前说明：{{ control.mode === 'auto' ? '自动调度下，待执行任务可能被拆分、合并、重排或改派。' : '手动执行模式，待执行任务按既定顺序执行，变更需人工确认。' }}
          <span class="policy-hint">自动创建和插队策略由租户/主账号统一控制，当前账号仅按角色权限查看和执行。</span>
        </div>
      </div>
      <div class="actions">
        <a-space>
          <a-button @click="$emit('coverage-check')">检测覆盖检查</a-button>
          <a-button type="primary" @click="$emit('create-temporary')">创建临时任务</a-button>
          <a-button @click="$emit('refresh')">刷新数据</a-button>
        </a-space>
      </div>
    </div>
  </a-card>
</template>

<script setup lang="ts">
export type DispatchMode = 'auto' | 'manual'

export interface DispatchControlState {
  autoDispatchEnabled: boolean
  allowAutoCreate: boolean
  allowQueueJump: boolean
  mode: DispatchMode
  pointKeyword: string
  robotId?: string
}

const props = defineProps<{ control: DispatchControlState; robotOptions: Array<{ value: string; label: string }> }>()
const emit = defineEmits<{
  (e: 'update:control', value: DispatchControlState): void
  (e: 'create-temporary'): void
  (e: 'coverage-check'): void
  (e: 'refresh'): void
}>()

function updateControl<K extends keyof DispatchControlState>(key: K, value: DispatchControlState[K]) {
  const next = { ...props.control, [key]: value }
  if (next.autoDispatchEnabled) {
    next.allowAutoCreate = true
    next.allowQueueJump = true
  }
  emit('update:control', next)
}
</script>

<style scoped lang="css">.control-card {
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
.control-search {
  min-width: 0;
}
.label {
  font-size: 13px;
  white-space: nowrap;
}
.mode-hint {
  margin-top: 10px;
  color: #666;
  font-size: 12px;
}
.policy-hint {
  margin-left: 10px;
  color: #8c8c8c;
}
.actions {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  min-width: 0;
}
@media (max-width: 1440px), (max-height: 820px) {
  .control-row {
    flex-direction: column;
  }
  .actions {
    justify-content: flex-start;
  }
}
@media (max-width: 768px) {
  .control-card :deep(.ant-card-body) {
    padding: 12px;
  }
  .control-item {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }
  .actions :deep(.ant-space) {
    row-gap: 8px;
    flex-wrap: wrap;
  }
}
</style>
