
<template>
  <div class="area-manage">
    <a-page-header title="区域管理" sub-title="支持不规则多边形区域绘制（演示版）" />
    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :span="16">
        <a-card title="地图区域绘制">
          <div class="panel-toolbar">
            <a-space>
              <a-button type="primary" @click="startPolygon">开始区域</a-button>
              <a-button :disabled="draftPoints.length < 3" @click="finishPolygon">完成区域绘制</a-button>
              <a-button @click="draftPoints = []">清空草稿</a-button>
            </a-space>
            <div class="help-text">点击画布依次落点，形成不规则多边形区域。</div>
          </div>
          <div class="map-stage" @click="appendPoint($event)">
            <svg viewBox="0 0 1000 560" class="map-svg" preserveAspectRatio="none">
              <rect x="0" y="0" width="1000" height="560" fill="#f6f8fb" />
              <polygon v-for="region in regions" :key="region.id" :points="region.points" fill="rgba(22,119,255,.15)" stroke="#1677ff" stroke-width="2" />
              <polygon v-if="draftPoints.length" :points="draftPolygon" fill="rgba(250,173,20,.18)" stroke="#faad14" stroke-width="2" stroke-dasharray="6 4" />
              <circle v-for="(point, idx) in draftPoints" :key="idx" :cx="point.x" :cy="point.y" r="5" fill="#faad14" />
            </svg>
          </div>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="区域列表">
          <a-table :columns="columns" :data-source="regions" row-key="id" :pagination="false" size="small" />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { message } from 'ant-design-vue'

const drawing = ref(false)
const draftPoints = ref<Array<{ x: number; y: number }>>([])
const regions = ref<any[]>([
  { id: 'area-1', name: 'A区装置区', points: '120,140 320,100 360,220 180,260' },
  { id: 'area-2', name: 'B区管廊', points: '520,180 760,160 820,260 700,360 560,320' }
])
const columns = [ { title: '区域名称', dataIndex: 'name', key: 'name' }, { title: '图形', key: 'shape', customRender: () => '多边形' } ]
const draftPolygon = computed(() => draftPoints.value.map((point) => `${point.x},${point.y}`).join(' '))
function startPolygon() { drawing.value = true; draftPoints.value = []; message.info('请在画布上点击落点') }
function appendPoint(event: MouseEvent) { if (!drawing.value) return; const target = event.currentTarget as HTMLElement; const rect = target.getBoundingClientRect(); const x = ((event.clientX - rect.left) / rect.width) * 1000; const y = ((event.clientY - rect.top) / rect.height) * 560; draftPoints.value.push({ x: Math.round(x), y: Math.round(y) }) }
function finishPolygon() { if (draftPoints.value.length < 3) return; regions.value.push({ id: `area-${Date.now()}`, name: `新区域-${regions.value.length + 1}`, points: draftPolygon.value }); drawing.value = false; draftPoints.value = []; message.success('多边形区域已创建') }
</script>

<style scoped lang="css">.panel-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.help-text {
  color: #8c8c8c;
  font-size: 12px;
}
.map-stage {
  height: 560px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  cursor: crosshair;
}
.map-svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
