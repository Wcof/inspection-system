<template>
  <ReportShell v-model="period" badge="PLAN COVERAGE" title="规划覆盖分析" subtitle="统计区域、装置、设施/管路、巡检对象与规则覆盖率。" :period-options="periodOptions">
    <a-card title="覆盖率" size="small">
      <a-table :columns="columns" :data-source="rows" row-key="name" :pagination="false" size="small" />
    </a-card>
  </ReportShell>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import ReportShell from './components/ReportShell.vue'
const period = ref('week')
const periodOptions = [{ label: '日', value: 'day' }, { label: '周', value: 'week' }, { label: '月', value: 'month' }, { label: '季', value: 'quarter' }]
const columns = [{ title: '对象', dataIndex: 'name', key: 'name' }, { title: '覆盖率', dataIndex: 'rate', key: 'rate', width: 110 }, { title: '未覆盖数', dataIndex: 'missing', key: 'missing', width: 110 }]
const rows = [
  { name: '区域', rate: '98.3%', missing: 1 }, { name: '装置', rate: '96.9%', missing: 4 }, { name: '设施/管路', rate: '95.5%', missing: 8 }, { name: '巡检对象', rate: '93.1%', missing: 17 }, { name: '规则', rate: '91.8%', missing: 21 }
]
</script>
