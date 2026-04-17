<template>
  <ReportShell
    v-model="selectedPeriod"
    badge="SAFETY ANALYSIS"
    title="安全行为分析"
    subtitle="聚合安全行为异常记录，展示区域分布、抓拍证据与处理闭环进度。"
    :period-options="periodOptions"
  >
    <template #hero-extra>
      <div class="hero-mini">
        <span>未闭环告警</span>
        <strong>13 条</strong>
      </div>
    </template>
    <div class="content-grid">
      <a-card title="异常记录列表" size="small" class="panel-card">
        <a-table :columns="columns" :data-source="rows" row-key="id" :pagination="false">
          <template #bodyCell="{ column, record, text }">
            <template v-if="column.key === 'snapshot'">
              <img :src="record.snapshot" alt="抓拍图" class="snapshot" />
            </template>
            <template v-else-if="column.key === 'status'">
              <a-tag :color="toStatusColor(text)">{{ text }}</a-tag>
            </template>
          </template>
        </a-table>
      </a-card>
      <a-card title="区域分布与处理情况" size="small" class="panel-card">
        <div class="summary-list">
          <div v-for="item in summaryRows" :key="item.label" class="summary-row">
            <div class="summary-head">
              <span>{{ item.label }}</span>
              <strong>{{ item.value }}%</strong>
            </div>
            <a-progress :percent="item.value" size="small" :stroke-color="item.color" />
          </div>
        </div>
      </a-card>
    </div>
  </ReportShell>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ReportShell from './components/ReportShell.vue'
const devicePng = new URL('../../../设备.png', import.meta.url).href
const workshopPng = new URL('../../../车间.png', import.meta.url).href
const mapPng = new URL('../../../地图.png', import.meta.url).href

type Period = 'day' | 'week' | 'month' | 'quarter'
const selectedPeriod = ref<Period>('week')
const periodOptions = [
  { label: '日', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
  { label: '季', value: 'quarter' }
]

const columns = [
  { title: '异常类型', dataIndex: 'type', key: 'type', width: 120 },
  { title: '时间', dataIndex: 'time', key: 'time', width: 170 },
  { title: '区域', dataIndex: 'area', key: 'area', width: 100 },
  { title: '位置', dataIndex: 'location', key: 'location' },
  { title: '抓拍', key: 'snapshot', width: 90 },
  { title: '处理状态', dataIndex: 'status', key: 'status', width: 120 }
]

const rows = [
  { id: 's1', type: '未佩戴安全帽', time: '2026-04-17 10:12:00', area: 'A区', location: 'A区配电房入口', snapshot: devicePng, status: '已处理' },
  { id: 's2', type: '违规跨越警戒线', time: '2026-04-17 11:28:00', area: 'B区', location: 'B区储罐区通道', snapshot: workshopPng, status: '处理中' },
  { id: 's3', type: '未穿反光背心', time: '2026-04-17 12:44:00', area: 'C区', location: '危化仓外围', snapshot: mapPng, status: '待处理' }
]

const summaryRows = [
  { label: 'A区异常占比', value: 38, color: '#0284c7' },
  { label: 'B区异常占比', value: 41, color: '#c2410c' },
  { label: 'C区异常占比', value: 21, color: '#475569' },
  { label: '异常处理闭环率', value: 87, color: '#0f766e' }
]

function toStatusColor(status: string) {
  if (status === '已处理') return 'green'
  if (status === '处理中') return 'gold'
  return 'volcano'
}
</script>

<style scoped>
.hero-mini {
  min-width: 140px;
  border-radius: 10px;
  background: rgba(236, 254, 255, 0.2);
  padding: 10px 12px;
}

.hero-mini span {
  display: block;
  font-size: 12px;
}

.hero-mini strong {
  font-size: 24px;
  line-height: 1.1;
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

.snapshot {
  width: 58px;
  height: 38px;
  border-radius: 6px;
  object-fit: cover;
  border: 1px solid #cbd5e1;
}

.summary-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.summary-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.summary-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-head span {
  color: #475569;
}

.summary-head strong {
  color: #0f172a;
  font-size: 13px;
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
