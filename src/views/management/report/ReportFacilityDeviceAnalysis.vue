<template>
  <ReportShell
    v-model="selectedPeriod"
    badge="DEVICE ANALYSIS"
    title="设施设备分析"
    subtitle="从设备清单、巡检结果到异常趋势，快速锁定高风险设备。"
    :period-options="periodOptions"
  >
    <template #hero-extra>
      <div class="hero-mini">
        <span>异常率最高设备</span>
        <strong>防爆风机B03 · 24%</strong>
      </div>
    </template>
    <div class="content-grid">
      <a-card title="设备巡检清单" size="small" class="panel-card">
        <a-table :columns="columns" :data-source="rows" row-key="id" :pagination="false">
          <template #bodyCell="{ column, text }">
            <template v-if="column.key === 'status'">
              <a-tag :color="text === '异常' ? 'volcano' : 'green'">{{ text }}</a-tag>
            </template>
          </template>
        </a-table>
      </a-card>
      <a-card title="设备历史趋势（异常率）" size="small" class="panel-card">
        <div class="trend-list">
          <div v-for="item in trendRows" :key="item.name" class="trend-row">
            <div class="trend-head">
              <span>{{ item.name }}</span>
              <strong>{{ item.value }}%</strong>
            </div>
            <a-progress :percent="item.value" size="small" status="active" :stroke-color="item.color" />
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
  { title: '设备名称', dataIndex: 'deviceName', key: 'deviceName' },
  { title: '设备类型', dataIndex: 'deviceType', key: 'deviceType', width: 120 },
  { title: '所在巡检点', dataIndex: 'pointName', key: 'pointName', width: 180 },
  { title: '最近状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '异常次数', dataIndex: 'abnormalCount', key: 'abnormalCount', width: 120 }
]

const rows = [
  { id: 'd1', deviceName: '配电柜A15', deviceType: '电气', pointName: 'A区配电房巡检点', status: '正常', abnormalCount: 3 },
  { id: 'd2', deviceName: '防爆风机B03', deviceType: '通风', pointName: 'B区储罐区巡检点', status: '异常', abnormalCount: 7 },
  { id: 'd3', deviceName: '消防泵C02', deviceType: '消防', pointName: '危化仓入口巡检点', status: '正常', abnormalCount: 2 }
]

const trendRows = [
  { name: '配电柜A15', value: 11, color: '#0284c7' },
  { name: '防爆风机B03', value: 24, color: '#c2410c' },
  { name: '消防泵C02', value: 8, color: '#0f766e' }
]
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

.trend-list {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.trend-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 10px;
  border-radius: 10px;
  border: 1px solid #e2e8f0;
  background: #f8fafc;
}

.trend-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trend-head span {
  color: #475569;
}

.trend-head strong {
  color: #0f172a;
  font-size: 13px;
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
