<template>
  <ReportShell v-model="period" badge="EXCEPTION ANALYSIS" title="异常告警分析" subtitle="告警处置闭环统计，覆盖确认、误判、转隐患、整改、复核、第三方推送。" :period-options="periodOptions">
    <div class="kpi-grid">
      <a-card v-for="item in kpis" :key="item.label" size="small"><span>{{ item.label }}</span><strong>{{ item.value }}</strong></a-card>
    </div>
    <a-card title="处置分布" size="small" style="margin-top: 12px">
      <a-table :columns="columns" :data-source="rows" row-key="name" :pagination="false" size="small" />
    </a-card>
  </ReportShell>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import ReportShell from './components/ReportShell.vue'
const period = ref('week')
const periodOptions = [{ label: '日', value: 'day' }, { label: '周', value: 'week' }, { label: '月', value: 'month' }, { label: '季', value: 'quarter' }]
const kpis = [
  { label: '告警总数', value: '126' }, { label: '待确认', value: '19' }, { label: '已确认', value: '44' }, { label: '标记误判', value: '11' },
  { label: '转隐患', value: '26' }, { label: '转整改', value: '17' }, { label: '已推送第三方', value: '52' }, { label: '平均确认时长', value: '18 分钟' }, { label: '平均闭环时长', value: '9.6 小时' }
]
const columns = [{ title: '类型', dataIndex: 'name', key: 'name' }, { title: '数量', dataIndex: 'count', key: 'count', width: 100 }, { title: '占比', dataIndex: 'ratio', key: 'ratio', width: 110 }, { title: '平均处理时长', dataIndex: 'duration', key: 'duration', width: 140 }]
const rows = [
  { name: '设施/部件异常', count: 53, ratio: '42.1%', duration: '8.3h' },
  { name: '气体异常', count: 24, ratio: '19.0%', duration: '4.7h' },
  { name: '安全行为异常', count: 28, ratio: '22.2%', duration: '2.4h' },
  { name: '监测失效', count: 12, ratio: '9.5%', duration: '10.2h' },
  { name: '不可检异常', count: 9, ratio: '7.2%', duration: '5.8h' }
]
</script>
<style scoped>.kpi-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}.kpi-grid strong{display:block;margin-top:6px;font-size:20px}@media(max-width:960px){.kpi-grid{grid-template-columns:1fr}}</style>
