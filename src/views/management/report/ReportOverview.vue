<template>
  <ReportShell
    v-model="selectedPeriod"
    badge="REPORT CENTER"
    title="统计总览"
    subtitle="统一查看执行态势、风险密度与四类分析入口，支持日/周/月/季切换。"
    :period-options="periodOptions"
  >
    <template #actions>
      <a-button @click="goTo('inspection-point-analysis')">巡检点分析</a-button>
      <a-button @click="goTo('facility-device-analysis')">设施设备分析</a-button>
      <a-button @click="goTo('gas-analysis')">气体分析</a-button>
      <a-button @click="goTo('safety-behavior-analysis')">安全行为分析</a-button>
      <a-button type="primary">导出巡检分析报告</a-button>
    </template>

    <div class="summary-grid">
      <KpiTile
        v-for="item in summaryCards"
        :key="item.title"
        :title="item.title"
        :chip="item.chip"
        :value="item.value"
        :meta="item.meta"
        :meta-type="item.metaType"
      />
    </div>

    <div class="content-grid">
      <a-card title="总体执行情况" size="small" class="panel-card">
        <a-table :columns="executionColumns" :data-source="executionRows" row-key="id" :pagination="false" />
      </a-card>
      <a-card title="模块完成度概览" size="small" class="panel-card">
        <div class="progress-list">
          <div v-for="item in moduleProgress" :key="item.label" class="progress-row">
            <div class="progress-head">
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
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import ReportShell from './components/ReportShell.vue'
import KpiTile from './components/KpiTile.vue'

type Period = 'day' | 'week' | 'month' | 'quarter'

const router = useRouter()
const selectedPeriod = ref<Period>('week')
const periodOptions = [
  { label: '日', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
  { label: '季', value: 'quarter' }
]

function goTo(path: string) {
  router.push(`/management/report/${path}`)
}

const summaryCards = computed(() => {
  const dataByPeriod: Record<Period, { title: string; chip: string; value: string; meta: string; metaType: 'up' | 'down' | 'flat' }[]> = {
    day: [
      { title: '巡检任务数', chip: '执行', value: '126', meta: '较昨日 +8.6%', metaType: 'up' },
      { title: '覆盖巡检点', chip: '覆盖', value: '58', meta: '覆盖率 96.7%', metaType: 'flat' },
      { title: '异常记录', chip: '风险', value: '12', meta: '已处理 9 条', metaType: 'down' },
      { title: '平均完成时长', chip: '效率', value: '14.2 分钟', meta: '较昨日 -1.1 分钟', metaType: 'up' }
    ],
    week: [
      { title: '巡检任务数', chip: '执行', value: '803', meta: '较上周 +12.3%', metaType: 'up' },
      { title: '覆盖巡检点', chip: '覆盖', value: '61', meta: '覆盖率 97.9%', metaType: 'flat' },
      { title: '异常记录', chip: '风险', value: '76', meta: '已处理 69 条', metaType: 'down' },
      { title: '平均完成时长', chip: '效率', value: '15.6 分钟', meta: '较上周 -0.8 分钟', metaType: 'up' }
    ],
    month: [
      { title: '巡检任务数', chip: '执行', value: '3,274', meta: '较上月 +5.1%', metaType: 'up' },
      { title: '覆盖巡检点', chip: '覆盖', value: '63', meta: '覆盖率 98.4%', metaType: 'flat' },
      { title: '异常记录', chip: '风险', value: '298', meta: '已处理 281 条', metaType: 'down' },
      { title: '平均完成时长', chip: '效率', value: '16.1 分钟', meta: '较上月 -0.3 分钟', metaType: 'up' }
    ],
    quarter: [
      { title: '巡检任务数', chip: '执行', value: '9,852', meta: '较上季度 +7.8%', metaType: 'up' },
      { title: '覆盖巡检点', chip: '覆盖', value: '65', meta: '覆盖率 98.9%', metaType: 'flat' },
      { title: '异常记录', chip: '风险', value: '871', meta: '已处理 836 条', metaType: 'down' },
      { title: '平均完成时长', chip: '效率', value: '16.5 分钟', meta: '较上季度 -0.4 分钟', metaType: 'up' }
    ]
  }
  return dataByPeriod[selectedPeriod.value]
})

const executionColumns = [
  { title: '模块', dataIndex: 'module', key: 'module' },
  { title: '检查次数', dataIndex: 'count', key: 'count', width: 120 },
  { title: '正常', dataIndex: 'normal', key: 'normal', width: 100 },
  { title: '异常', dataIndex: 'abnormal', key: 'abnormal', width: 100 },
  { title: '异常率', dataIndex: 'abnormalRate', key: 'abnormalRate', width: 100 }
]

const executionRows = [
  { id: 'm1', module: '巡检点', count: 365, normal: 336, abnormal: 29, abnormalRate: '7.9%' },
  { id: 'm2', module: '设施设备', count: 318, normal: 286, abnormal: 32, abnormalRate: '10.1%' },
  { id: 'm3', module: '气体', count: 214, normal: 203, abnormal: 11, abnormalRate: '5.1%' },
  { id: 'm4', module: '安全行为', count: 173, normal: 154, abnormal: 19, abnormalRate: '11.0%' }
]

const moduleProgress = [
  { label: '巡检点执行率', value: 97, color: '#0f766e' },
  { label: '设施设备执行率', value: 95, color: '#0284c7' },
  { label: '气体检测覆盖率', value: 98, color: '#c2410c' },
  { label: '安全行为闭环率', value: 92, color: '#475569' }
]
</script>

<style scoped>
.summary-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.hero-chip {
  min-width: 200px;
  border-radius: 10px;
  background: rgba(236, 254, 255, 0.2);
  padding: 10px 12px;
}

.hero-chip span {
  display: block;
  font-size: 12px;
  opacity: 0.9;
}

.hero-chip strong {
  font-size: 14px;
  letter-spacing: 0.3px;
}

.content-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 14px;
}

.panel-card {
  border-radius: 12px;
  box-shadow: 0 12px 22px -20px rgba(15, 23, 42, 1);
}

:deep(.panel-card .ant-card-head-title) {
  color: #0f172a;
  font-weight: 700;
}

:deep(.panel-card .ant-table-thead > tr > th) {
  background: #edf2f7;
  color: #334155;
  font-weight: 600;
}

:deep(.panel-card .ant-table-tbody > tr:hover > td) {
  background: #f8fafc;
}

.progress-list {
  padding-top: 6px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.progress-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.progress-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.progress-head span {
  color: #475569;
}

.progress-head strong {
  font-size: 13px;
  color: #0f172a;
}

@media (max-width: 1200px) {
  .summary-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
