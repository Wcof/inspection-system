<template>
  <div class="road-tool-palette">
    <div class="palette-group">
      <a-tooltip title="选取工具 — 点击选中、拖拽移动、查看属性">
        <a-button
          :type="activeTool === 'select' ? 'primary' : 'default'"
          size="small"
          @click="$emit('selectTool', 'select')"
        >
          <SelectOutlined /> 选取
        </a-button>
      </a-tooltip>
      <a-tooltip title="绘制路网 — 点击落点创建路段">
        <a-button
          :type="activeTool === 'drawSegment' ? 'primary' : 'default'"
          size="small"
          @click="$emit('selectTool', 'drawSegment')"
        >
          <EditOutlined /> 路网
        </a-button>
      </a-tooltip>
      <a-tooltip title="放置点位 — 连续点击创建导航点">
        <a-button
          :type="activeTool === 'placeNode' ? 'primary' : 'default'"
          size="small"
          @click="$emit('selectTool', 'placeNode')"
        >
          <AimOutlined /> 点位
        </a-button>
      </a-tooltip>
      <a-tooltip title="绘制区域 — 多边形套索创建区域">
        <a-button
          :type="activeTool === 'drawArea' ? 'primary' : 'default'"
          size="small"
          @click="$emit('selectTool', 'drawArea')"
        >
          <StopOutlined /> 区域
        </a-button>
      </a-tooltip>
    </div>
    <div class="palette-extra" v-if="activeTool === 'placeNode'">
      <a-select v-model:value="placeNodeType" size="small" style="width: 90px">
        <a-select-option value="inspection">巡检点</a-select-option>
        <a-select-option value="parking">停车点</a-select-option>
        <a-select-option value="charging">充电点</a-select-option>
      </a-select>
    </div>
    <div class="palette-finish" v-if="activeTool === 'drawSegment' || activeTool === 'drawArea'">
      <a-button size="small" type="primary" ghost @click="$emit('finishDraw')">完成</a-button>
      <a-button size="small" danger @click="$emit('cancelDraw')">取消</a-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SelectOutlined, EditOutlined, AimOutlined, StopOutlined } from '@ant-design/icons-vue'
import type { EditorTool, PlaceNodeType } from '@/types/road-editor'

const props = defineProps<{
  activeTool: EditorTool
  placeNodeType: PlaceNodeType
}>()

const emit = defineEmits<{
  (e: 'selectTool', tool: EditorTool): void
  (e: 'update:placeNodeType', v: PlaceNodeType): void
  (e: 'finishDraw'): void
  (e: 'cancelDraw'): void
}>()

const placeNodeType = computed({
  get: () => props.placeNodeType,
  set: (v: PlaceNodeType) => emit('update:placeNodeType', v)
})
</script>

<style scoped lang="scss">
.road-tool-palette {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
  .palette-group {
    display: flex;
    gap: 4px;
  }
  .palette-extra, .palette-finish {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: 8px;
    padding-left: 8px;
    border-left: 1px solid #e8e8e8;
  }
}
</style>
