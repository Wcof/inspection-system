<template>
  <ReportShell
    v-model="selectedPeriod"
    badge="POINT ANALYSIS"
    title="巡检点分析"
    subtitle="追踪巡检点检查频次、巡检项完成与异常密度，识别重点关注点位。"
    :period-options="periodOptions"
  >
    <template #hero-extra>
      <div class="hero-mini">
        <span>重点关注点位</span>
        <strong>危化仓入口巡检点</strong>
      </div>
    </template>
    <div class="content-grid">
      <a-card title="巡检点维度统计" size="small" class="panel-card">
        <a-table :columns="columns" :data-source="rows" row-key="id" :pagination="false">
          <template #bodyCell="{ column, text }">
            <template v-if="column.key === 'abnormalRate'">
              <a-tag :color="toRateColor(text)">{{ text }}</a-tag>
            </template>
          </template>
        </a-table>
      </a-card>
      <a-card title="巡检点历史结果" size="small" class="panel-card">
        <div class="history-list">
          <div v-for="item in historyRows" :key="item.name" class="history-row">
            <div class="history-head">
              <strong>{{ item.name }}</strong>
              <span>最近4周期正常率 {{ item.normalRate }}%</span>
            </div>
            <a-progress :percent="item.normalRate" size="small" :stroke-color="item.color" />
          </div>
        </div>
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

const columns = [
  { title: '巡检点', dataIndex: 'pointName', key: 'pointName' },
  { title: '检查次数', dataIndex: 'checkCount', key: 'checkCount', width: 120 },
  { title: '巡检项数', dataIndex: 'itemCount', key: 'itemCount', width: 120 },
  { title: '正常', dataIndex: 'normalCount', key: 'normalCount', width: 100 },
  { title: '异常', dataIndex: 'abnormalCount', key: 'abnormalCount', width: 100 },
  { title: '异常率', dataIndex: 'abnormalRate', key: 'abnormalRate', width: 100 }
]

const rows = [
  { id: 'p1', pointName: 'A区配电房巡检点', checkCount: 92, itemCount: 368, normalCount: 349, abnormalCount: 19, abnormalRate: '5.2%' },
  { id: 'p2', pointName: 'B区储罐区巡检点', checkCount: 87, itemCount: 348, normalCount: 329, abnormalCount: 19, abnormalRate: '5.5%' },
  { id: 'p3', pointName: '危化仓入口巡检点', checkCount: 76, itemCount: 304, normalCount: 280, abnormalCount: 24, abnormalRate: '7.9%' }
]

const historyRows = [
  { name: 'A区配电房巡检点', normalRate: 96, color: '#0f766e' },
  { name: 'B区储罐区巡检点', normalRate: 95, color: '#0284c7' },
  { name: '危化仓入口巡检点', normalRate: 92, color: '#c2410c' }
]

function toRateColor(rate: string) {
  const value = Number(rate.replace('%', ''))
  if (value >= 7) return 'volcano'
  if (value >= 5) return 'gold'
  return 'green'
}
</script>

<style scoped>
.hero-mini {
  min-width: 190px;
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
  grid-template-columns: 1.3fr 1fr;
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

.history-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.history-row {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.history-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.history-head span {
  color: #64748b;
  font-size: 12px;
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
