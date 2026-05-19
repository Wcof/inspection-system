<template>
  <ReportShell v-model="period" badge="THIRD PARTY" title="第三方回传分析" subtitle="统计第三方下发、作业票、告警推送与回传结果。" :period-options="periodOptions">
    <a-card title="回传统计" size="small"><a-table :columns="columns" :data-source="rows" row-key="name" :pagination="false" size="small" /></a-card>
  </ReportShell>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import ReportShell from './components/ReportShell.vue'
const period = ref('week')
const periodOptions = [{ label: '日', value: 'day' }, { label: '周', value: 'week' }, { label: '月', value: 'month' }, { label: '季', value: 'quarter' }]
const columns = [{ title: '类型', dataIndex: 'name', key: 'name' }, { title: '数量', dataIndex: 'count', key: 'count', width: 110 }, { title: '成功率', dataIndex: 'rate', key: 'rate', width: 110 }]
const rows = [
  { name: '第三方下发任务', count: 84, rate: '96.4%' }, { name: '作业票任务', count: 32, rate: '93.8%' }, { name: '告警推送第三方', count: 52, rate: '98.1%' }, { name: 'EHS 单号状态', count: 52, rate: '91.7%' }
]
</script>
