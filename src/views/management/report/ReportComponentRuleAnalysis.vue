<template>
  <ReportShell v-model="period" badge="COMPONENT RULE" title="巡检对象规则分析" subtitle="统计被巡检巡检对象、识别失败巡检对象、命中排行与不可检原因。" :period-options="periodOptions">
    <a-card title="排行" size="small"><a-table :columns="columns" :data-source="rows" row-key="name" :pagination="false" size="small" /></a-card>
  </ReportShell>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import ReportShell from './components/ReportShell.vue'
const period = ref('week')
const periodOptions = [{ label: '日', value: 'day' }, { label: '周', value: 'week' }, { label: '月', value: 'month' }, { label: '季', value: 'quarter' }]
const columns = [{ title: '巡检对象/规则', dataIndex: 'name', key: 'name' }, { title: '命中次数', dataIndex: 'count', key: 'count', width: 110 }, { title: '不可检原因', dataIndex: 'reason', key: 'reason' }]
const rows = [
  { name: '出口法兰 / 温升规则', count: 42, reason: '反光/角度不足' }, { name: '阀门 / 开度规则', count: 31, reason: '遮挡' }, { name: '压力表 / 读数规则', count: 26, reason: '识别失败' }
]
</script>
