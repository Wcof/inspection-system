<template>
  <div class="inspection-statistics">
    <a-page-header title="巡检分析" sub-title="按周期和维度查看巡检结果" />

    <a-card style="margin-top: 16px">
      <div class="toolbar">
        <a-form layout="inline">
          <a-form-item label="统计周期">
            <a-segmented v-model:value="selectedPeriod" :options="periodOptions" />
          </a-form-item>
          <a-form-item label="主维度">
            <a-segmented v-model:value="selectedDimension" :options="dimensionOptions" />
          </a-form-item>
        </a-form>
      </div>

      <div class="content-grid">
        <a-card size="small" title="维度汇总" class="panel">
          <a-table
            :columns="summaryColumns"
            :data-source="currentSummary"
            row-key="id"
            :pagination="false"
            :row-class-name="getSummaryRowClass"
            @rowClick="undefined"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'abnormalRate'">{{ record.abnormalRate }}%</template>
              <template v-else-if="column.key === 'actions'">
                <a-button type="link" size="small" @click="selectSummary(record)">查看巡检项</a-button>
              </template>
            </template>
          </a-table>
        </a-card>

        <a-card size="small" title="巡检项明细" class="panel">
          <template v-if="selectedSummary">
            <a-descriptions :column="2" bordered size="small" style="margin-bottom: 12px">
              <a-descriptions-item label="维度名称">{{ selectedSummary.name }}</a-descriptions-item>
              <a-descriptions-item label="异常率">{{ selectedSummary.abnormalRate }}%</a-descriptions-item>
            </a-descriptions>
            <a-table :columns="detailColumns" :data-source="currentDetailRows" row-key="id" :pagination="{ pageSize: 6 }" />
          </template>
          <a-empty v-else description="请选择左侧维度项查看巡检项明细" />
        </a-card>

        <a-card size="small" title="趋势曲线" class="panel panel-full">
          <div v-if="selectedSummary" class="trend">
            <svg viewBox="0 0 600 220" class="trend-svg" preserveAspectRatio="none">
              <polyline :points="trendPoints" fill="none" stroke="#1677ff" stroke-width="3" />
              <circle v-for="point in trendChartPoints" :key="point.key" :cx="point.x" :cy="point.y" r="4" fill="#1677ff" />
            </svg>
            <div class="trend-axis">
              <span v-for="item in selectedSummary.trend" :key="item.time">{{ item.time }}</span>
            </div>
          </div>
          <a-empty v-else description="请选择维度项查看趋势" />
        </a-card>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

type Period = 'day' | 'week' | 'month' | 'quarter'
type Dimension = 'point' | 'device' | 'gas' | 'safety'

interface TrendItem {
  time: string
  value: number
}

interface SummaryItem {
  id: string
  name: string
  total: number
  abnormal: number
  abnormalRate: number
  trend: TrendItem[]
}

interface DetailItem {
  id: string
  itemName: string
  latestValue: string
  status: 'normal' | 'warning' | 'critical'
  sampledAt: string
}

const periodOptions = [
  { label: '天', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
  { label: '季', value: 'quarter' }
]

const dimensionOptions = [
  { label: '巡检点', value: 'point' },
  { label: '设施设备', value: 'device' },
  { label: '气体', value: 'gas' },
  { label: '安全行为', value: 'safety' }
]

const selectedPeriod = ref<Period>('day')
const selectedDimension = ref<Dimension>('point')
const selectedSummary = ref<SummaryItem | null>(null)

const summaryColumns = [
  { title: '名称', dataIndex: 'name', key: 'name' },
  { title: '总检测数', dataIndex: 'total', key: 'total', width: 120 },
  { title: '异常数', dataIndex: 'abnormal', key: 'abnormal', width: 120 },
  { title: '异常率', key: 'abnormalRate', width: 100 },
  { title: '操作', key: 'actions', width: 120 }
]

const detailColumns = [
  { title: '巡检项', dataIndex: 'itemName', key: 'itemName' },
  { title: '最新值', dataIndex: 'latestValue', key: 'latestValue', width: 140 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '采样时间', dataIndex: 'sampledAt', key: 'sampledAt', width: 180 }
]

const mockSummary: Record<Period, Record<Dimension, SummaryItem[]>> = {
  day: {
    point: [
      { id: 'p-1', name: 'A区配电房', total: 32, abnormal: 3, abnormalRate: 9.4, trend: [
        { time: '09:00', value: 5 }, { time: '10:00', value: 4 }, { time: '11:00', value: 7 }, { time: '12:00', value: 6 }, { time: '13:00', value: 10 }
      ] },
      { id: 'p-2', name: 'B区管廊', total: 21, abnormal: 1, abnormalRate: 4.8, trend: [
        { time: '09:00', value: 3 }, { time: '10:00', value: 5 }, { time: '11:00', value: 4 }, { time: '12:00', value: 6 }, { time: '13:00', value: 3 }
      ] }
    ],
    device: [
      { id: 'd-1', name: '配电柜A15', total: 40, abnormal: 5, abnormalRate: 12.5, trend: [
        { time: '09:00', value: 8 }, { time: '10:00', value: 7 }, { time: '11:00', value: 10 }, { time: '12:00', value: 6 }, { time: '13:00', value: 9 }
      ] }
    ],
    gas: [
      { id: 'g-1', name: '甲烷传感器G01', total: 28, abnormal: 2, abnormalRate: 7.1, trend: [
        { time: '09:00', value: 2 }, { time: '10:00', value: 3 }, { time: '11:00', value: 4 }, { time: '12:00', value: 5 }, { time: '13:00', value: 4 }
      ] }
    ],
    safety: [
      { id: 's-1', name: '安全帽识别', total: 36, abnormal: 4, abnormalRate: 11.1, trend: [
        { time: '09:00', value: 6 }, { time: '10:00', value: 7 }, { time: '11:00', value: 5 }, { time: '12:00', value: 9 }, { time: '13:00', value: 8 }
      ] }
    ]
  },
  week: { point: [], device: [], gas: [], safety: [] },
  month: { point: [], device: [], gas: [], safety: [] },
  quarter: { point: [], device: [], gas: [], safety: [] }
}

const mockDetail: Record<string, DetailItem[]> = {
  'p-1': [
    { id: 'i-1', itemName: '温度读数', latestValue: '65.4℃', status: 'warning', sampledAt: '2026-04-15 13:10:00' },
    { id: 'i-2', itemName: '开关状态', latestValue: '闭合', status: 'normal', sampledAt: '2026-04-15 13:10:12' },
    { id: 'i-3', itemName: '电流显示', latestValue: '123A', status: 'normal', sampledAt: '2026-04-15 13:10:20' }
  ],
  'p-2': [
    { id: 'i-4', itemName: '液位高度', latestValue: '2.1m', status: 'normal', sampledAt: '2026-04-15 12:10:00' }
  ],
  'd-1': [
    { id: 'i-5', itemName: '柜体温升', latestValue: '85℃', status: 'critical', sampledAt: '2026-04-15 12:44:00' }
  ],
  'g-1': [
    { id: 'i-6', itemName: '甲烷浓度', latestValue: '34%LEL', status: 'warning', sampledAt: '2026-04-15 11:25:00' }
  ],
  's-1': [
    { id: 'i-7', itemName: '安全帽佩戴', latestValue: '未佩戴', status: 'critical', sampledAt: '2026-04-15 11:40:00' }
  ]
}

const currentSummary = computed(() => {
  const list = mockSummary[selectedPeriod.value][selectedDimension.value]
  if (list.length > 0) return list
  return [
    {
      id: 'fallback',
      name: '暂无统计数据',
      total: 0,
      abnormal: 0,
      abnormalRate: 0,
      trend: [
        { time: 'T1', value: 0 },
        { time: 'T2', value: 0 },
        { time: 'T3', value: 0 },
        { time: 'T4', value: 0 },
        { time: 'T5', value: 0 }
      ]
    }
  ]
})

const currentDetailRows = computed(() => {
  if (!selectedSummary.value) return []
  return mockDetail[selectedSummary.value.id] || []
})

const trendChartPoints = computed(() => {
  if (!selectedSummary.value || selectedSummary.value.trend.length === 0) return []
  const values = selectedSummary.value.trend.map(item => item.value)
  const max = Math.max(...values, 1)
  return selectedSummary.value.trend.map((item, index) => {
    const x = 30 + index * (540 / Math.max(selectedSummary.value!.trend.length - 1, 1))
    const y = 190 - (item.value / max) * 150
    return { key: `${item.time}-${index}`, x, y }
  })
})

const trendPoints = computed(() => trendChartPoints.value.map(item => `${item.x},${item.y}`).join(' '))

function selectSummary(record: SummaryItem) {
  selectedSummary.value = record
}

function getSummaryRowClass(record: SummaryItem) {
  return selectedSummary.value?.id === record.id ? 'row-active' : ''
}
</script>

<style scoped lang="scss">
.inspection-statistics {
  width: 100%;

  .toolbar {
    margin-bottom: 12px;
    padding: 10px 12px;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    background: #fafafa;
  }

  .content-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .panel {
    min-height: 320px;
  }

  .panel-full {
    grid-column: 1 / span 2;
    min-height: 280px;
  }

  .trend {
    padding-top: 8px;
  }

  .trend-svg {
    width: 100%;
    height: 220px;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  }

  .trend-axis {
    display: flex;
    justify-content: space-between;
    margin-top: 8px;
    color: #666;
    font-size: 12px;
    padding: 0 10px;
  }

  :deep(.row-active > td) {
    background: #e6f4ff !important;
  }
}

@media (max-width: 1100px) {
  .inspection-statistics {
    .content-grid {
      grid-template-columns: 1fr;
    }

    .panel-full {
      grid-column: auto;
    }
  }
}
</style>
