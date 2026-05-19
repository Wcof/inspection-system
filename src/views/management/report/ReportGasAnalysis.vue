<template>
  <ReportShell
    v-model="selectedPeriod"
    badge="GAS ANALYSIS"
    title="气体分析"
    subtitle="按区域展示气体风险、最近采样时间和数据新鲜度，避免把区域环境误绑定为单个设施。"
    :period-options="periodOptions"
  >
    <template #hero-extra>
      <div class="hero-stack">
        <div class="hero-mini danger">
          <span>当前最高峰值</span>
          <strong>{{ peakSample.area }} · {{ peakSample.peakValue }}</strong>
          <small>{{ peakSample.sampledAt }} · {{ peakSample.freshness }}</small>
        </div>
        <div class="hero-mini">
          <span>超时未采样区域</span>
          <strong>{{ staleCount }} 个</strong>
          <small>超过 15 分钟视为需复核</small>
        </div>
      </div>
    </template>

    <div class="freshness-grid">
      <a-card v-for="item in freshnessCards" :key="item.label" size="small" class="freshness-card">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <small>{{ item.desc }}</small>
      </a-card>
    </div>

    <div class="content-grid">
      <a-card title="区域气体热力图" size="small" class="panel-card">
        <div class="heatmap-grid">
          <div
            v-for="cell in heatmapCells"
            :key="cell.area"
            class="heat-cell"
            :class="cell.level"
            :style="{ opacity: String(cell.opacity) }"
          >
            <div>
              <span>{{ cell.area }}</span>
              <strong>{{ cell.peakValue }}</strong>
            </div>
            <small>{{ cell.sampledAt }} · {{ cell.freshness }}</small>
            <em>{{ cell.pointName }}</em>
          </div>
        </div>
        <div class="note">热力图按区域最近有效采样与周期峰值渲染；新鲜度用于判断数据是否仍可作为调度依据。</div>
      </a-card>

      <a-card title="气体检测结果列表" size="small" class="panel-card">
        <a-table :columns="columns" :data-source="rows" row-key="id" :pagination="false" :scroll="{ x: 980 }">
          <template #bodyCell="{ column, record, text }">
            <template v-if="column.key === 'status'">
              <a-tag :color="record.statusColor">{{ text }}</a-tag>
            </template>
            <template v-else-if="column.key === 'freshness'">
              <a-tag :color="record.freshnessLevel === 'stale' ? 'red' : record.freshnessLevel === 'warning' ? 'orange' : 'green'">
                {{ text }}
              </a-tag>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>
  </ReportShell>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import ReportShell from './components/ReportShell.vue'

type Period = 'day' | 'week' | 'month' | 'quarter'
const selectedPeriod = ref<Period>('week')
const periodOptions = [
  { label: '日', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
  { label: '季', value: 'quarter' }
]

const rows = [
  { id: 'g1', area: '反应区', pointName: '反应釜车间巡检点', metric: '可燃气体', peakValue: '18%LEL', currentValue: '12%LEL', status: '正常', statusColor: 'green', sampledAt: '2026-04-17 13:04:00', freshness: '6 分钟前', freshnessLevel: 'fresh' },
  { id: 'g2', area: '储罐区', pointName: '储罐区巡检点', metric: '可燃气体', peakValue: '36%LEL', currentValue: '28%LEL', status: '预警', statusColor: 'orange', sampledAt: '2026-04-17 13:00:00', freshness: '10 分钟前', freshnessLevel: 'warning' },
  { id: 'g3', area: '管廊区', pointName: '管廊东侧经过点', metric: '甲烷', peakValue: '41%LEL', currentValue: '34%LEL', status: '告警', statusColor: 'red', sampledAt: '2026-04-17 12:56:00', freshness: '14 分钟前', freshnessLevel: 'warning' },
  { id: 'g4', area: '装卸区', pointName: '装卸区入口巡检点', metric: '硫化氢', peakValue: '8ppm', currentValue: '6ppm', status: '正常', statusColor: 'green', sampledAt: '2026-04-17 12:48:00', freshness: '22 分钟前', freshnessLevel: 'stale' }
]

const peakSample = computed(() => rows.reduce((max, item) => parseFloat(item.peakValue) > parseFloat(max.peakValue) ? item : max, rows[0]))
const staleCount = computed(() => rows.filter(item => item.freshnessLevel === 'stale').length)
const freshnessCards = computed(() => [
  { label: '有效采样区域', value: rows.filter(item => item.freshnessLevel !== 'stale').length, desc: '15 分钟内有有效采样' },
  { label: '预警/告警区域', value: rows.filter(item => item.status !== '正常').length, desc: '需进入调度关注' },
  { label: '最近采样', value: rows[0].sampledAt.slice(11, 16), desc: `${rows[0].area} · ${rows[0].freshness}` }
])

const heatmapCells = computed(() => rows.map((row) => {
  const value = parseFloat(row.peakValue)
  return {
    ...row,
    opacity: Math.min(0.95, Math.max(0.28, value / 48)),
    level: row.status === '告警' ? 'danger' : row.status === '预警' ? 'warning' : 'normal'
  }
}))

const columns = [
  { title: '区域', dataIndex: 'area', key: 'area', width: 110 },
  { title: '采样点位', dataIndex: 'pointName', key: 'pointName', width: 170 },
  { title: '检测项', dataIndex: 'metric', key: 'metric', width: 110 },
  { title: '当前值', dataIndex: 'currentValue', key: 'currentValue', width: 110 },
  { title: '周期峰值', dataIndex: 'peakValue', key: 'peakValue', width: 110 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '最近采样时间', dataIndex: 'sampledAt', key: 'sampledAt', width: 170 },
  { title: '新鲜度', dataIndex: 'freshness', key: 'freshness', width: 110 }
]
</script>

<style scoped>
.hero-stack {
  display: grid;
  grid-template-columns: repeat(2, minmax(170px, 1fr));
  gap: 10px;
}

.hero-mini {
  border-radius: 10px;
  background: rgba(236, 254, 255, 0.2);
  padding: 10px 12px;
}

.hero-mini.danger {
  background: rgba(254, 226, 226, 0.22);
}

.hero-mini span,
.hero-mini small,
.freshness-card span,
.freshness-card small {
  display: block;
  font-size: 12px;
}

.hero-mini small {
  margin-top: 4px;
  color: rgba(236, 254, 255, 0.78);
}

.hero-mini strong {
  display: block;
  margin-top: 4px;
  font-size: 16px;
}

.freshness-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.freshness-card {
  border-radius: 12px;
  box-shadow: 0 12px 20px -20px rgba(15, 23, 42, 0.9);
}

.freshness-card strong {
  display: block;
  margin: 8px 0 4px;
  color: #0f172a;
  font-size: 24px;
}

.freshness-card small {
  color: #64748b;
}

.content-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 0.9fr 1.35fr;
  gap: 14px;
}

.panel-card {
  border-radius: 12px;
  box-shadow: 0 12px 20px -20px rgba(15, 23, 42, 1);
}

.heatmap-grid {
  margin-top: 6px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.heat-cell {
  min-height: 126px;
  border-radius: 12px;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 14px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.2);
}

.heat-cell.normal {
  background: linear-gradient(140deg, #0f766e, #22c55e);
}

.heat-cell.warning {
  background: linear-gradient(140deg, #f97316, #facc15);
}

.heat-cell.danger {
  background: linear-gradient(140deg, #dc2626, #f97316);
}

.heat-cell span,
.heat-cell small,
.heat-cell em {
  display: block;
}

.heat-cell strong {
  font-size: 22px;
}

.heat-cell small,
.heat-cell em {
  font-size: 12px;
  opacity: 0.9;
  font-style: normal;
}

.note {
  margin-top: 10px;
  color: #475569;
  font-size: 12px;
}

:deep(.panel-card .ant-table-thead > tr > th) {
  background: #edf2f7;
  color: #334155;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .content-grid,
  .freshness-grid,
  .hero-stack,
  .heatmap-grid {
    grid-template-columns: 1fr;
  }
}
</style>
