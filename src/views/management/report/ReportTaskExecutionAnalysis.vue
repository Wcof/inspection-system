<template>
  <ReportShell v-model="period" badge="TASK EXECUTION" title="任务执行分析" subtitle="统计常规、临时、作业票、应急任务及执行结果。" :period-options="periodOptions">
    <div class="kpis">
      <a-card v-for="item in kpis" :key="item.label" size="small"><span>{{ item.label }}</span><strong>{{ item.value }}</strong><small>{{ item.desc }}</small></a-card>
    </div>
    <a-card title="执行结果" size="small" style="margin-top: 12px"><a-table :columns="columns" :data-source="rows" row-key="name" :pagination="false" size="small" /></a-card>
  </ReportShell>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import ReportShell from './components/ReportShell.vue'
const period = ref('week')
const periodOptions = [{ label: '日', value: 'day' }, { label: '周', value: 'week' }, { label: '月', value: 'month' }, { label: '季', value: 'quarter' }]
const kpis = [
  { label: '常规任务', value: '386', desc: '执行规划派生' },
  { label: '临时任务', value: '74', desc: '插单/补检' },
  { label: '作业票任务', value: '32', desc: '第三方下发' },
  { label: '应急任务', value: '18', desc: '最高优先级' }
]
const columns = [{ title: '结果', dataIndex: 'name', key: 'name' }, { title: '数量', dataIndex: 'count', key: 'count', width: 110 }, { title: '平均时长', dataIndex: 'avg', key: 'avg', width: 110 }]
const rows = [
  { name: '完成', count: 421, avg: '14.8m' }, { name: '失败', count: 27, avg: '18.2m' }, { name: '中断', count: 13, avg: '6.4m' }, { name: '取消', count: 17, avg: '3.1m' }
]
</script>
<style scoped>.kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px} .kpis strong{display:block;margin-top:6px;font-size:20px} @media(max-width:960px){.kpis{grid-template-columns:1fr}}</style>
