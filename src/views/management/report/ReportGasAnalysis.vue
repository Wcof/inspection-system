<template>
  <ReportShell
    v-model="selectedPeriod"
    badge="GAS ANALYSIS"
    title="气体分析"
    subtitle="以区域热力图为核心展示气体风险强度，并配合检测结果列表快速追溯。"
    :period-options="periodOptions"
  >
    <template #hero-extra>
      <div class="hero-mini">
        <span>当前最高峰值</span>
        <strong>C区 · 41%LEL</strong>
      </div>
    </template>
    <div class="content-grid">
      <a-card title="区域热力图" size="small" class="panel-card">
        <div class="heatmap-grid">
          <div v-for="cell in heatmapCells" :key="cell.area" class="heat-cell" :style="{ opacity: String(cell.opacity) }">
            <span>{{ cell.area }}</span>
            <strong>{{ cell.value }}</strong>
          </div>
        </div>
        <div class="note">按当前统计周期的峰值浓度渲染；趋势图后续扩展。</div>
      </a-card>

      <a-card title="气体检测结果列表" size="small" class="panel-card">
        <a-table :columns="columns" :data-source="rows" row-key="id" :pagination="false">
          <template #bodyCell="{ column, text }">
            <template v-if="column.key === 'status'">
              <a-tag :color="text === '预警' ? 'volcano' : 'green'">{{ text }}</a-tag>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>
  </ReportShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ReportShell from './components/ReportShell.vue'

type Period = 'day' | 'week' | 'month' | 'quarter'
const selectedPeriod = ref<Period>('week')
const periodOptions = [
  { label: '日', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
  { label: '季', value: 'quarter' }
]

const heatmapCells = [
  { area: 'A区', value: '18%LEL', opacity: 0.3 },
  { area: 'B区', value: '36%LEL', opacity: 0.72 },
  { area: 'C区', value: '41%LEL', opacity: 0.9 },
  { area: 'D区', value: '22%LEL', opacity: 0.45 },
  { area: 'E区', value: '29%LEL', opacity: 0.58 },
  { area: 'F区', value: '14%LEL', opacity: 0.24 }
]

const columns = [
  { title: '区域', dataIndex: 'area', key: 'area', width: 100 },
  { title: '检测项', dataIndex: 'metric', key: 'metric', width: 140 },
  { title: '峰值', dataIndex: 'peakValue', key: 'peakValue', width: 120 },
  { title: '平均值', dataIndex: 'avgValue', key: 'avgValue', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '最近采样时间', dataIndex: 'sampledAt', key: 'sampledAt' }
]

const rows = [
  { id: 'g1', area: 'A区', metric: '可燃气体', peakValue: '18%LEL', avgValue: '12%LEL', status: '正常', sampledAt: '2026-04-17 13:04:00' },
  { id: 'g2', area: 'B区', metric: '可燃气体', peakValue: '36%LEL', avgValue: '28%LEL', status: '预警', sampledAt: '2026-04-17 13:00:00' },
  { id: 'g3', area: 'C区', metric: '可燃气体', peakValue: '41%LEL', avgValue: '30%LEL', status: '预警', sampledAt: '2026-04-17 12:56:00' }
]
</script>

<style scoped>
.hero-mini {
  min-width: 180px;
  border-radius: 10px;
  background: rgba(236, 254, 255, 0.2);
  padding: 10px 12px;
}

.hero-mini span {
  display: block;
  font-size: 12px;
}

.hero-mini strong {
  font-size: 14px;
}

.content-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.panel-card {
  border-radius: 12px;
  box-shadow: 0 12px 20px -20px rgba(15, 23, 42, 1);
}

:deep(.panel-card .ant-table-thead > tr > th) {
  background: #edf2f7;
  color: #334155;
  font-weight: 600;
}

.heatmap-grid {
  margin-top: 6px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.heat-cell {
  min-height: 110px;
  border-radius: 12px;
  background: linear-gradient(140deg, #dc2626, #f97316);
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 14px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.note {
  margin-top: 10px;
  color: #475569;
  font-size: 12px;
}

@media (max-width: 1200px) {
  .content-grid,
  .heatmap-grid {
    grid-template-columns: 1fr;
  }
}
</style>
