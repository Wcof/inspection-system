<template>
  <ReportShell v-model="period" badge="EVIDENCE PLAYBACK" title="证据回放分析" subtitle="统计图片、截图、视频片段、完整回放与证据缺失情况。" :period-options="periodOptions">
    <a-card title="证据统计" size="small"><a-table :columns="columns" :data-source="rows" row-key="name" :pagination="false" size="small" /></a-card>
  </ReportShell>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import ReportShell from './components/ReportShell.vue'
const period = ref('week')
const periodOptions = [{ label: '日', value: 'day' }, { label: '周', value: 'week' }, { label: '月', value: 'month' }, { label: '季', value: 'quarter' }]
const columns = [{ title: '类型', dataIndex: 'name', key: 'name' }, { title: '数量', dataIndex: 'count', key: 'count', width: 110 }, { title: '说明', dataIndex: 'desc', key: 'desc' }]
const rows = [
  { name: '图片', count: 328, desc: '光学/热成像图' }, { name: '截图', count: 245, desc: '关键帧截图' }, { name: '视频片段', count: 152, desc: '可回放片段' }, { name: '完整回放', count: 68, desc: '完整轨迹回放' }, { name: '证据缺失', count: 14, desc: '保存失败或未采集' }
]
</script>
