<template>
  <div class="edge-inspection">
    <a-page-header title="边巡边检" />

    <a-card class="filter-card" size="small">
      <a-row :gutter="12" align="middle">
        <a-col :xs="24" :sm="24" :md="14" :lg="12">
          <a-space>
            <span class="filter-label">时间区间</span>
            <a-range-picker v-model:value="timeRange" show-time style="min-width: 320px" />
          </a-space>
        </a-col>
        <a-col :xs="24" :sm="24" :md="10" :lg="12">
          <a-alert
            type="info"
            show-icon
            message="展示逻辑：根据所选时间区间，取每个区域检测项的最高值进行展示。"
          />
        </a-col>
      </a-row>
    </a-card>

    <div class="panel-grid">
      <a-card title="安全行为" class="panel-card">
        <template #extra>
          <a-space>
            <a-tag :color="safety.running ? 'green' : 'default'">{{ safety.running ? '运行中' : '已停止' }}</a-tag>
            <a-button type="primary" size="small" :ghost="safety.running" @click="toggleSafety">{{ safety.running ? '停止' : '启动' }}</a-button>
          </a-space>
        </template>

        <img :src="bannerUrl" alt="安全行为预览" class="banner" />
        <div class="heatmap-title">区域触发热力图（点击区域查看走势）</div>
        <div class="heatmap">
          <span
            v-for="(cell, idx) in safetyHeatmap"
            :key="`s-${idx}`"
            class="cell"
            :class="{ active: selectedSafetyCell === idx }"
            :style="{ backgroundColor: `rgba(239,68,68,${cell})` }"
            @click="selectSafetyCell(idx)"
          />
        </div>

        <div v-if="selectedSafetyCell !== null" class="trend-wrap">
          <div class="trend-header">
            <span>区域 {{ selectedSafetyCell + 1 }} 走势（{{ timeRangeLabel }}）</span>
            <a-radio-group v-model:value="safetyGranularity" button-style="solid" size="small">
              <a-radio-button value="month">月</a-radio-button>
              <a-radio-button value="week">周</a-radio-button>
              <a-radio-button value="day">日</a-radio-button>
            </a-radio-group>
          </div>
          <div class="line-chart">
            <svg viewBox="0 0 100 36" preserveAspectRatio="none">
              <polyline :points="buildPolylinePoints(safetyTrendSeries)" class="line-safety" />
            </svg>
          </div>
        </div>
      </a-card>

      <a-card title="气体分析" class="panel-card">
        <template #extra>
          <a-space>
            <a-tag :color="gas.running ? 'green' : 'default'">{{ gas.running ? '运行中' : '已停止' }}</a-tag>
            <a-button type="primary" size="small" :ghost="gas.running" @click="toggleGas">{{ gas.running ? '停止' : '启动' }}</a-button>
          </a-space>
        </template>

        <a-row :gutter="10" style="margin-bottom: 12px">
          <a-col :span="12" v-for="item in gasMetrics" :key="item.name">
            <a-statistic :title="item.name" :value="item.value" :suffix="item.unit" />
          </a-col>
        </a-row>

        <a-tabs v-model:activeKey="activeGasTab" size="small">
          <a-tab-pane key="oxygen" tab="氧气" />
          <a-tab-pane key="co" tab="一氧化碳" />
          <a-tab-pane key="h2s" tab="硫化氢" />
          <a-tab-pane key="combustible" tab="可燃气体" />
        </a-tabs>

        <div class="heatmap-title">{{ currentGasLabel }} 热力图（点击区域查看走势）</div>
        <div class="heatmap gas">
          <span
            v-for="(cell, idx) in currentGasHeatmap"
            :key="`g-${idx}`"
            class="cell"
            :class="{ active: selectedGasCell === idx }"
            :style="{ backgroundColor: `rgba(37,99,235,${cell})` }"
            @click="selectGasCell(idx)"
          />
        </div>

        <div v-if="selectedGasCell !== null" class="trend-wrap">
          <div class="trend-header">
            <span>{{ currentGasLabel }} · 区域 {{ selectedGasCell + 1 }} 走势（{{ timeRangeLabel }}）</span>
            <a-radio-group v-model:value="gasGranularity" button-style="solid" size="small">
              <a-radio-button value="month">月</a-radio-button>
              <a-radio-button value="week">周</a-radio-button>
              <a-radio-button value="day">日</a-radio-button>
            </a-radio-group>
          </div>
          <div class="line-chart">
            <svg viewBox="0 0 100 36" preserveAspectRatio="none">
              <polyline :points="buildPolylinePoints(gasTrendSeries)" class="line-gas" />
            </svg>
          </div>
        </div>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import dayjs, { type Dayjs } from 'dayjs'

type GasTab = 'oxygen' | 'co' | 'h2s' | 'combustible'
type Granularity = 'month' | 'week' | 'day'

const bannerUrl = new URL('../../车间.png', import.meta.url).href
const activeGasTab = ref<GasTab>('oxygen')

const safety = reactive({ running: true })
const gas = reactive({ running: true })
const selectedSafetyCell = ref<number | null>(null)
const selectedGasCell = ref<number | null>(null)
const safetyGranularity = ref<Granularity>('week')
const gasGranularity = ref<Granularity>('week')

const now = dayjs()
const timeRange = ref<[Dayjs, Dayjs]>([now.subtract(7, 'day'), now])

const baseSafetyHeatmap = [
  0.12, 0.2, 0.3, 0.18, 0.1,
  0.15, 0.45, 0.64, 0.36, 0.22,
  0.2, 0.56, 0.9, 0.51, 0.28,
  0.12, 0.3, 0.5, 0.34, 0.16
]

const gasHeatmapMap: Record<GasTab, number[]> = {
  oxygen: [0.1, 0.16, 0.22, 0.25, 0.18, 0.21, 0.32, 0.46, 0.35, 0.24, 0.2, 0.38, 0.61, 0.52, 0.3, 0.15, 0.24, 0.41, 0.33, 0.21],
  co: [0.18, 0.24, 0.38, 0.35, 0.22, 0.31, 0.5, 0.72, 0.61, 0.34, 0.2, 0.42, 0.68, 0.73, 0.48, 0.16, 0.28, 0.45, 0.36, 0.24],
  h2s: [0.12, 0.2, 0.24, 0.28, 0.18, 0.24, 0.36, 0.52, 0.39, 0.26, 0.14, 0.3, 0.56, 0.63, 0.37, 0.1, 0.2, 0.34, 0.29, 0.18],
  combustible: [0.2, 0.28, 0.4, 0.44, 0.3, 0.35, 0.58, 0.76, 0.68, 0.42, 0.22, 0.46, 0.73, 0.81, 0.52, 0.18, 0.3, 0.49, 0.41, 0.25]
}

const rangeDays = computed(() => {
  const [start, end] = timeRange.value
  return Math.max(1, end.diff(start, 'day') + 1)
})

const rangeScale = computed(() => {
  if (rangeDays.value <= 1) return 0.9
  if (rangeDays.value <= 7) return 1
  if (rangeDays.value <= 30) return 1.08
  return 1.16
})

const timeRangeLabel = computed(() => {
  const [start, end] = timeRange.value
  return `${start.format('YYYY-MM-DD HH:mm')} ~ ${end.format('YYYY-MM-DD HH:mm')}`
})

const safetyHeatmap = computed(() =>
  baseSafetyHeatmap.map((value) => clampHeat(value * rangeScale.value))
)

const currentGasHeatmap = computed(() =>
  gasHeatmapMap[activeGasTab.value].map((value) => clampHeat(value * rangeScale.value))
)

const currentGasLabel = computed(() => {
  if (activeGasTab.value === 'co') return '一氧化碳'
  if (activeGasTab.value === 'h2s') return '硫化氢'
  if (activeGasTab.value === 'combustible') return '可燃气体'
  return '氧气'
})

const gasMetrics = computed(() => {
  const scale = rangeScale.value
  return [
    { name: '氧气最高值', value: Number((22.6 * scale).toFixed(1)), unit: '%' },
    { name: '一氧化碳最高值', value: Math.round(43 * scale), unit: 'ppm' },
    { name: '硫化氢最高值', value: Math.round(18 * scale), unit: 'ppm' },
    { name: '可燃气体最高值', value: Math.round(41 * scale), unit: '%LEL' }
  ]
})

const safetyTrendSeries = computed(() => {
  if (selectedSafetyCell.value === null) return []
  return buildTrendSeries('safety', selectedSafetyCell.value, safetyGranularity.value)
})

const gasTrendSeries = computed(() => {
  if (selectedGasCell.value === null) return []
  return buildTrendSeries(activeGasTab.value, selectedGasCell.value, gasGranularity.value)
})

function clampHeat(value: number) {
  return Number(Math.max(0.1, Math.min(0.95, value)).toFixed(2))
}

function buildTrendSeries(type: string, areaIndex: number, granularity: Granularity) {
  const count = granularity === 'month' ? 30 : granularity === 'week' ? 7 : 24
  const phase = (areaIndex % 5) * 0.7 + (type === 'safety' ? 0.4 : 1.1)
  const amplitude = (granularity === 'day' ? 11 : granularity === 'week' ? 16 : 22) * rangeScale.value
  const baseline = 42 + (areaIndex % 4) * 6

  return Array.from({ length: count }).map((_, idx) => {
    const wave = Math.sin(idx / (granularity === 'day' ? 2.4 : 1.8) + phase) * amplitude
    const pulse = Math.cos(idx / 3.1 + phase / 2) * 6
    return Math.max(8, Math.min(98, Number((baseline + wave + pulse).toFixed(1))))
  })
}

function buildPolylinePoints(series: number[]) {
  if (!series.length) return ''
  const step = series.length > 1 ? 100 / (series.length - 1) : 100
  return series
    .map((value, index) => {
      const x = Number((index * step).toFixed(2))
      const y = Number((36 - (value / 100) * 30).toFixed(2))
      return `${x},${y}`
    })
    .join(' ')
}

function selectSafetyCell(index: number) {
  selectedSafetyCell.value = index
}

function selectGasCell(index: number) {
  selectedGasCell.value = index
}

function toggleSafety() {
  safety.running = !safety.running
}

function toggleGas() {
  gas.running = !gas.running
}
</script>

<style scoped lang="css">
.filter-card {
  margin-top: 12px;
}

.filter-label {
  font-size: 13px;
  color: #475569;
  font-weight: 600;
}

.panel-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.panel-card {
  min-height: 520px;
}

.banner {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 8px;
  margin-bottom: 12px;
  border: 1px solid #e5e7eb;
}

.heatmap-title {
  margin: 6px 0;
  font-size: 13px;
  color: #475569;
  font-weight: 600;
}

.heatmap {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
}

.cell {
  height: 42px;
  border-radius: 6px;
  border: 1px solid rgba(148, 163, 184, 0.25);
  cursor: pointer;
  transition: all 0.2s;
}

.cell:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 12px rgba(15, 23, 42, 0.12);
}

.cell.active {
  border-color: #111827;
  box-shadow: 0 0 0 2px rgba(17, 24, 39, 0.2);
}

.trend-wrap {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px dashed #dbe3ef;
}

.trend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
  color: #475569;
}

.line-chart {
  height: 120px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

.line-chart svg {
  width: 100%;
  height: 100%;
}

.line-safety,
.line-gas {
  fill: none;
  stroke-width: 1.5;
}

.line-safety {
  stroke: #dc2626;
}

.line-gas {
  stroke: #2563eb;
}

@media (max-width: 1200px) {
  .panel-grid {
    grid-template-columns: 1fr;
  }
}
</style>
