<template>
  <div class="road-toolbar">
    <div class="toolbar-left">
      <h3 class="toolbar-title">路网管理</h3>
      <a-select :value="selectedMapId" placeholder="选择地图" style="width: 160px" size="small" @change="onMapSelect">
        <a-select-option v-for="m in maps" :key="m.id" :value="m.id">{{ m.name }}</a-select-option>
      </a-select>
    </div>
    <div class="toolbar-center">
      <slot name="tools" />
    </div>
    <div class="toolbar-right">
      <a-button size="small" @click="$emit('topologyCheck')" :loading="checkingTopology">
        <BugOutlined /> 检查
      </a-button>
      <a-button size="small" @click="$emit('pathSim')">
        <BranchesOutlined /> 模拟
      </a-button>
      <a-dropdown :trigger="['click']">
        <a-button size="small"><AppstoreOutlined /> 分屏</a-button>
        <template #overlay>
          <a-menu @click="(e: any) => $emit('splitChange', e.key)">
            <a-menu-item key="single2d">单画面 - 二维地图</a-menu-item>
            <a-menu-item key="singleCloud">单画面 - 点云图</a-menu-item>
            <a-menu-item key="pip2dMain">画中画 - 二维主画面</a-menu-item>
            <a-menu-item key="pipCloudMain">画中画 - 点云主画面</a-menu-item>
            <a-menu-item key="verticalEqual">左右等分</a-menu-item>
            <a-menu-item key="horizontalEqual">上下等分</a-menu-item>
          </a-menu>
        </template>
      </a-dropdown>
      <slot name="saveBtn" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { BugOutlined, BranchesOutlined, AppstoreOutlined } from '@ant-design/icons-vue'
import type { InspectionMap } from '@/types/inspection'

defineProps<{
  maps: InspectionMap[]
  selectedMapId: string
  checkingTopology?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:selectedMapId', v: string): void
  (e: 'mapChange'): void
  (e: 'topologyCheck'): void
  (e: 'pathSim'): void
  (e: 'splitChange', layout: string): void
}>()

function onMapSelect(value: unknown) {
  emit('update:selectedMapId', String(value))
  emit('mapChange')
}
</script>

<style scoped lang="scss">
.road-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  gap: 12px;
  .toolbar-left, .toolbar-center, .toolbar-right {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .toolbar-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #1d2129;
    white-space: nowrap;
  }
}
</style>
