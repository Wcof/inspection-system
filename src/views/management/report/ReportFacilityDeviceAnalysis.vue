<template>
  <ReportShell
    v-model="selectedPeriod"
    badge="FACILITY ANALYSIS"
    title="设施对象分析"
    subtitle="按设施、部件、连接部位、检测规则、异常和证据链复盘安全生产巡检结果。"
    :period-options="periodOptions"
  >
    <template #hero-extra>
      <div class="hero-mini">
        <span>高风险对象</span>
        <strong>{{ highRiskSummary }}</strong>
        <small>按异常数、不可检和规则覆盖综合计算</small>
      </div>
    </template>

    <div class="summary-grid">
      <a-card v-for="item in summaryCards" :key="item.label" size="small" class="summary-card">
        <span>{{ item.label }}</span>
        <strong>{{ item.value }}</strong>
        <small>{{ item.desc }}</small>
      </a-card>
    </div>

    <div class="content-grid">
      <a-card title="设施 / 部件 / 连接巡检清单" size="small" class="panel-card">
        <a-table :columns="columns" :data-source="rows" row-key="id" :pagination="{ pageSize: 6 }" :scroll="{ x: 1320 }">
          <template #bodyCell="{ column, record, text }">
            <template v-if="column.key === 'objectType'">
              <a-tag :color="record.objectType === '部件' ? 'blue' : 'purple'">{{ record.objectType }}</a-tag>
            </template>
            <template v-else-if="column.key === 'rules'">
              <a-space wrap>
                <a-tag v-for="rule in record.rules" :key="rule" color="cyan">{{ rule }}</a-tag>
              </a-space>
            </template>
            <template v-else-if="column.key === 'status'">
              <a-tag :color="text === '异常' ? 'volcano' : text === '需复核' ? 'orange' : 'green'">{{ text }}</a-tag>
            </template>
            <template v-else-if="column.key === 'evidence'">
              <div class="evidence-pair">
                <img :src="record.opticalImageUrl" alt="光学证据" />
                <img :src="record.thermalImageUrl" alt="热成像证据" />
              </div>
            </template>
          </template>
        </a-table>
      </a-card>

      <a-card title="对象风险排行" size="small" class="panel-card">
        <div class="risk-list">
          <div v-for="item in riskRows" :key="item.name" class="risk-row">
            <div class="risk-head">
              <span>{{ item.name }}</span>
              <strong>{{ item.score }} 分</strong>
            </div>
            <a-progress :percent="item.score" size="small" :stroke-color="item.color" />
            <div class="risk-meta">
              <span>{{ item.area }}</span>
              <span>{{ item.reason }}</span>
            </div>
          </div>
        </div>
      </a-card>
    </div>
  </ReportShell>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import ReportShell from './components/ReportShell.vue'
import { useInspectionStore } from '@/stores/inspection'

type Period = 'day' | 'week' | 'month' | 'quarter'
const selectedPeriod = ref<Period>('week')
const periodOptions = [
  { label: '日', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
  { label: '季', value: 'quarter' }
]

const inspectionStore = useInspectionStore()
const opticalImageUrl = new URL('../../../设备.png', import.meta.url).href
const thermalImageUrl = new URL('../../../车间.png', import.meta.url).href

const ruleNameMap: Record<string, string> = {
  'dic-001': '仪表读数识别',
  'dic-002': '外观/状态识别',
  'dic-003': '热成像温升判定'
}

function getRuleNames(ruleIds?: string[]) {
  const ids = ruleIds?.length ? ruleIds : ['dic-002']
  return ids.map(id => ruleNameMap[id] || id)
}

const rows = computed(() => inspectionStore.inspectionDevices.flatMap((facility: any, facilityIndex) => {
  const componentRows = (facility.assetComponents || []).map((component: any, index: number) => {
    const abnormalCount = (facilityIndex + index) % 3 === 0 ? 2 : (index % 2)
    return {
      id: `${facility.id}-component-${component.id}`,
      areaName: facility.areaName || '未配置区域',
      facilityName: facility.name,
      objectName: component.name,
      objectType: '部件',
      rules: getRuleNames(component.ruleIds),
      exceptionCount: abnormalCount,
      status: abnormalCount > 1 ? '异常' : abnormalCount === 1 ? '需复核' : '正常',
      evidenceCount: 2 + index,
      opticalImageUrl,
      thermalImageUrl
    }
  })
  const connectionRows = (facility.connectionObjects || []).map((connection: any, index: number) => {
    const abnormalCount = index % 2 === 0 ? 1 : 0
    return {
      id: `${facility.id}-connection-${connection.id}`,
      areaName: facility.areaName || '未配置区域',
      facilityName: facility.name,
      objectName: connection.name,
      objectType: '连接',
      rules: getRuleNames(connection.ruleIds),
      exceptionCount: abnormalCount,
      status: abnormalCount ? '需复核' : '正常',
      evidenceCount: 1 + index,
      opticalImageUrl,
      thermalImageUrl
    }
  })
  return [...componentRows, ...connectionRows]
}))

const summaryCards = computed(() => {
  const facilityCount = inspectionStore.inspectionDevices.length
  const componentCount = inspectionStore.inspectionDevices.reduce((sum: number, item: any) => sum + (item.assetComponents?.length || 0), 0)
  const connectionCount = inspectionStore.inspectionDevices.reduce((sum: number, item: any) => sum + (item.connectionObjects?.length || 0), 0)
  const ruleCount = new Set(rows.value.flatMap(row => row.rules)).size
  return [
    { label: '设施数', value: facilityCount, desc: '按区域归属统计' },
    { label: '部件数', value: componentCount, desc: '仅统计需巡检部件' },
    { label: '连接部位', value: connectionCount, desc: '法兰/管线等连接对象' },
    { label: '检测规则', value: ruleCount, desc: '已生效规则种类' }
  ]
})

const riskRows = computed(() => rows.value
  .map((row) => {
    const score = Math.min(95, 35 + row.exceptionCount * 24 + row.rules.length * 6)
    return {
      name: `${row.facilityName} / ${row.objectName}`,
      area: row.areaName,
      reason: `${row.exceptionCount} 次异常，${row.rules.length} 条规则`,
      score,
      color: score >= 75 ? '#dc2626' : score >= 55 ? '#f97316' : '#0f766e'
    }
  })
  .sort((a, b) => b.score - a.score)
  .slice(0, 5))

const highRiskSummary = computed(() => riskRows.value[0]?.name || '暂无高风险对象')

const columns = [
  { title: '所属区域', dataIndex: 'areaName', key: 'areaName', width: 120 },
  { title: '设施', dataIndex: 'facilityName', key: 'facilityName', width: 180 },
  { title: '部件/连接', dataIndex: 'objectName', key: 'objectName', width: 180 },
  { title: '对象类型', key: 'objectType', width: 100 },
  { title: '检测规则', key: 'rules', width: 260 },
  { title: '异常数', dataIndex: 'exceptionCount', key: 'exceptionCount', width: 90 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 },
  { title: '证据数', dataIndex: 'evidenceCount', key: 'evidenceCount', width: 90 },
  { title: '证据', key: 'evidence', width: 150 }
]

onMounted(() => {
  inspectionStore.initialize()
})
</script>

<style scoped>
.hero-mini {
  min-width: 240px;
  border-radius: 10px;
  background: rgba(236, 254, 255, 0.2);
  padding: 10px 12px;
}

.hero-mini span,
.hero-mini small,
.summary-card span,
.summary-card small {
  display: block;
  font-size: 12px;
}

.hero-mini small {
  margin-top: 4px;
  color: rgba(236, 254, 255, 0.78);
}

.hero-mini strong {
  display: block;
  margin-top: 4px;
  font-size: 14px;
}

.summary-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.summary-card {
  border-radius: 12px;
  box-shadow: 0 12px 20px -20px rgba(15, 23, 42, 0.9);
}

.summary-card strong {
  display: block;
  margin: 8px 0 4px;
  color: #0f172a;
  font-size: 24px;
}

.summary-card small {
  color: #64748b;
}

.content-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: minmax(0, 1.6fr) minmax(320px, 0.8fr);
  gap: 14px;
}

.panel-card {
  border-radius: 12px;
  box-shadow: 0 12px 20px -20px rgba(15, 23, 42, 1);
}

.evidence-pair {
  display: flex;
  gap: 6px;
}

.evidence-pair img {
  width: 48px;
  height: 34px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.risk-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.risk-row {
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
}

.risk-head,
.risk-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.risk-head span {
  color: #0f172a;
  font-weight: 600;
}

.risk-meta {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

:deep(.panel-card .ant-table-thead > tr > th) {
  background: #edf2f7;
  color: #334155;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .summary-grid,
  .content-grid {
    grid-template-columns: 1fr;
  }
}
</style>
