<template>
  <div class="edge-inspection">
    <a-page-header title="边巡边检" sub-title="基于历史巡检数据展示安全行为与气体分析的瓦片热力分布" />

    <a-card class="filter-card" size="small">
      <a-row :gutter="[16, 12]" align="top">
        <a-col :xs="24" :lg="14">
          <div class="filter-control-stack">
            <div class="mode-switch-row">
              <span class="filter-label">巡检类型</span>
              <a-radio-group v-model:value="activeMode" button-style="solid">
                <a-radio-button value="safety">安全行为</a-radio-button>
                <a-radio-button value="gas">气体分析</a-radio-button>
              </a-radio-group>
            </div>
            <div class="time-filter-row">
              <span class="filter-label">历史时间区间</span>
              <a-range-picker v-model:value="timeRange" show-time class="time-picker" />
            </div>
          </div>
        </a-col>
        <a-col :xs="24" :lg="10">
          <a-alert
            type="info"
            show-icon
            message="地图热力来自机器人移动巡检采样：机器人搭载气体分析仪、双目摄像头、红外摄像头和云台摄像头，不依赖固定点位摄像头实时监控。"
          />
        </a-col>
      </a-row>
    </a-card>

    <a-card class="map-card" :title="activeMode === 'safety' ? '安全行为边巡边检' : '气体分析边巡边检'">
      <div class="summary-grid">
        <template v-if="activeMode === 'safety'">
          <div v-for="item in safetySummaryItems" :key="item.eventType" class="summary-metric">
            <div class="summary-title">{{ item.title }}</div>
            <div class="summary-value">{{ item.value }}次</div>
            <div class="summary-meta">{{ item.name }} · {{ item.level }}</div>
          </div>
        </template>
        <template v-else>
          <div v-for="item in gasSummaryItems" :key="item.gasType" class="summary-metric">
            <div class="summary-title">{{ item.title }}</div>
            <div class="summary-value">{{ item.value }}{{ item.unit }}</div>
            <div class="summary-meta">{{ item.name }} · {{ item.percent }}%</div>
          </div>
        </template>
      </div>

      <div class="map-title">
        {{ activeMode === 'safety' ? '安全行为瓦片热力分布' : '气体分析瓦片热力分布' }}（点击瓦片查看历史走势）
      </div>
      <div class="map-heatmap" :class="activeMode === 'safety' ? 'safety-map' : 'gas-map'" :style="{ backgroundImage: `url(${mapUrl})` }">
        <button
          v-for="(tile, index) in currentTiles"
          :key="`${activeMode}-${tile.name}`"
          class="heat-tile"
          :class="[
            activeMode === 'safety' ? 'safety-tile' : 'gas-tile',
            { active: selectedTileIndex === index }
          ]"
          :style="getTileStyle(tile)"
          @click="selectTile(index)"
        >
          <span class="tile-label">{{ tile.name }}</span>
          <span class="tile-detail">
            <template v-if="activeMode === 'safety'">
              {{ tile.eventType }} / {{ tile.value }}次
            </template>
            <template v-else>
              {{ tile.gasType }}最高 / {{ tile.value }}{{ tile.unit }}
            </template>
          </span>
        </button>
      </div>

      <div class="detail-grid">
        <a-card size="small" :title="detailTitle">
          <div class="history-list">
            <button
              v-for="(item, index) in currentHistory"
              :key="item.name"
              class="history-item"
              :class="{ selectable: hasSelectedTile, active: selectedDetailIndex === index }"
              @click="selectDetail(index)"
            >
              <span class="history-name">{{ item.name }}</span>
              <a-tag :color="item.level === '高' ? 'red' : item.level === '中' ? 'orange' : 'green'">{{ item.level }}</a-tag>
              <span v-if="activeMode === 'safety'">{{ item.eventType }} · {{ item.value }}次</span>
              <span v-else>{{ item.gasType }} · {{ item.value }}{{ item.unit }} · {{ item.percent }}%</span>
              <span class="history-meta">{{ item.robot }} / {{ item.payload }} / {{ item.route }}</span>
            </button>
          </div>
        </a-card>

        <a-card size="small" title="历史走势">
          <template v-if="hasSelectedTile">
            <div class="trend-header">
              <span>{{ trendTitle }}（{{ timeRangeLabel }}）</span>
              <a-radio-group v-model:value="currentGranularity" button-style="solid" size="small">
                <a-radio-button value="month">月</a-radio-button>
                <a-radio-button value="week">周</a-radio-button>
                <a-radio-button value="day">日</a-radio-button>
              </a-radio-group>
            </div>
            <div class="line-chart">
              <svg viewBox="0 0 360 190" preserveAspectRatio="none" role="img" :aria-label="trendChartAriaLabel">
                <line x1="48" y1="18" x2="48" y2="148" class="axis-line" />
                <line x1="48" y1="148" x2="340" y2="148" class="axis-line" />
                <g v-for="tick in yAxisTicks" :key="`y-${tick.value}`">
                  <line x1="48" :y1="tick.y" x2="340" :y2="tick.y" class="grid-line" />
                  <text x="40" :y="tick.y + 4" text-anchor="end" class="axis-label">{{ tick.value }}</text>
                </g>
                <g v-for="tick in xAxisTicks" :key="`x-${tick.label}`">
                  <line :x1="tick.x" y1="148" :x2="tick.x" y2="153" class="axis-line" />
                  <text :x="tick.x" y="171" text-anchor="middle" class="axis-label">{{ tick.label }}</text>
                </g>
                <text x="48" y="10" class="axis-title">{{ trendUnitLabel }}</text>
                <polyline :points="trendPolylinePoints" :class="activeMode === 'safety' ? 'line-safety' : 'line-gas'" />
                <g v-for="point in labeledTrendPoints" :key="`p-${point.index}`">
                  <circle :cx="point.x" :cy="point.y" r="3.5" :class="activeMode === 'safety' ? 'point-safety' : 'point-gas'" />
                  <text :x="point.x" :y="point.y - 8" text-anchor="middle" class="point-label">{{ point.value }}{{ trendUnit }}</text>
                </g>
              </svg>
            </div>
          </template>
          <a-empty v-else description="请选择地图瓦片后查看对应片区或机器人采样记录走势" />
        </a-card>
      </div>

      <a-card size="small" class="alert-list-card" :title="activeMode === 'safety' ? '安全行为告警明细' : '气体告警明细'">
        <template #extra>
          <a-tag :color="hasSelectedTile ? 'blue' : 'default'">
            {{ hasSelectedTile ? `当前区域：${selectedTile?.name}` : '全区域' }}
          </a-tag>
        </template>
        <a-table
          :columns="alertColumns"
          :data-source="currentAlertRows"
          row-key="id"
          size="small"
          :pagination="{ pageSize: 6 }"
          :scroll="{ x: activeMode === 'safety' ? 1280 : 1360 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'level'">
              <a-tag :color="getLevelColor(record.level)">{{ record.level }}</a-tag>
            </template>
            <template v-else-if="column.key === 'value'">
              <span class="alert-value">{{ record.valueText }}</span>
            </template>
            <template v-else-if="column.key === 'status'">
              <a-tag :color="getAlertStatusColor(record.status)">{{ record.status }}</a-tag>
            </template>
            <template v-else-if="column.key === 'evidence'">
              <a-space>
                <img :src="record.opticalImageUrl" alt="光学图" class="alert-thumb" />
                <img v-if="record.thermalImageUrl" :src="record.thermalImageUrl" alt="热成像图" class="alert-thumb" />
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import dayjs, { type Dayjs } from 'dayjs'

type Mode = 'safety' | 'gas'
type Granularity = 'month' | 'week' | 'day'
type HeatLevel = '高' | '中' | '低'
type HeatTile = {
  name: string
  x: number
  y: number
  width: number
  height: number
  value: number
  level: HeatLevel
  intensity: number
  eventType?: string
  triggerReason?: string
  gasType?: string
  unit?: string
  percent?: number
  samples: InspectionSample[]
}

type GasType = '可燃气体' | '一氧化碳' | '硫化氢'
type SafetyEventType = '烟火识别' | '人员闯入' | '未戴安全帽' | '未戴工牌' | '跌倒停留'

type InspectionSample = {
  name: string
  robot: string
  payload: string
  route: string
  value: number
  level: HeatLevel
  intensity: number
  eventType?: string
  triggerReason?: string
  gasType?: string
  unit?: string
  percent?: number
}

type AlertRow = {
  id: string
  areaName: string
  alertName: string
  alertType: string
  robot: string
  payload: string
  route: string
  valueText: string
  level: HeatLevel
  sampledAt: string
  status: string
  reason: string
  evidenceText: string
  opticalImageUrl: string
  thermalImageUrl?: string
}

const mapUrl = new URL('../../地图.png', import.meta.url).href
const opticalImageUrl = new URL('../../设备.png', import.meta.url).href
const thermalImageUrl = new URL('../../车间.png', import.meta.url).href
const activeMode = ref<Mode>('safety')

const selectedTileIndex = ref<number | null>(null)
const selectedDetailIndex = ref<number | null>(null)
const safetyGranularity = ref<Granularity>('week')
const gasGranularity = ref<Granularity>('week')

const now = dayjs()
const timeRange = ref<[Dayjs, Dayjs]>([now.subtract(7, 'day'), now])

const safetyBaseTiles: HeatTile[] = [
  {
    name: 'A区入口', x: 12, y: 19, width: 18, height: 20, value: 18, level: '中', intensity: 0.42, eventType: '未戴安全帽', triggerReason: '人员进入巡检通道未佩戴安全帽',
    samples: [
      { name: 'A区入口采样-01', robot: '巡检机器人 A', payload: '双目摄像头', route: 'A区入口巡检线', value: 9, level: '中', intensity: 0.46, eventType: '未戴安全帽', triggerReason: '机器人巡检经过入口时识别到人员未佩戴安全帽' },
      { name: 'A区入口采样-02', robot: '巡检机器人 A', payload: '云台摄像头', route: 'A区入口巡检线', value: 6, level: '低', intensity: 0.32, eventType: '未戴工牌', triggerReason: '机器人云台回看时识别到人员未佩戴工牌' },
      { name: 'A区入口采样-03', robot: '巡检机器人 B', payload: '双目摄像头', route: '访客通道巡检线', value: 3, level: '低', intensity: 0.22, eventType: '人员闯入', triggerReason: '机器人移动巡检时识别到访客越界进入' },
      { name: 'A区入口采样-04', robot: '巡检机器人 A', payload: '红外摄像头', route: '入口消防巡检线', value: 2, level: '低', intensity: 0.18, eventType: '烟火识别', triggerReason: '机器人红外采样发现疑似烟火点' },
      { name: 'A区入口采样-05', robot: '巡检机器人 B', payload: '云台摄像头', route: '入口楼梯巡检线', value: 2, level: '低', intensity: 0.18, eventType: '跌倒停留', triggerReason: '机器人云台识别到人员异常停留' }
    ]
  },
  {
    name: '装置通道', x: 33, y: 15, width: 22, height: 18, value: 26, level: '高', intensity: 0.72, eventType: '人员闯入', triggerReason: '非授权人员进入装置隔离区',
    samples: [
      { name: '装置通道采样-01', robot: '巡检机器人 B', payload: '双目摄像头', route: '装置通道巡检线', value: 12, level: '高', intensity: 0.7, eventType: '人员闯入', triggerReason: '机器人移动巡检时识别到人员越过电子围栏' },
      { name: '装置通道采样-02', robot: '巡检机器人 B', payload: '云台摄像头', route: '装置通道巡检线', value: 8, level: '中', intensity: 0.48, eventType: '未戴安全帽', triggerReason: '机器人云台巡检识别到安全帽缺失' },
      { name: '装置通道采样-03', robot: '巡检机器人 A', payload: '双目摄像头', route: '装置门禁巡检线', value: 6, level: '中', intensity: 0.38, eventType: '未戴工牌', triggerReason: '机器人经过门禁口时识别到人员未佩戴工牌' },
      { name: '装置通道采样-04', robot: '巡检机器人 B', payload: '红外摄像头', route: '装置通道巡检线', value: 4, level: '低', intensity: 0.26, eventType: '跌倒停留', triggerReason: '机器人红外辅助识别疑似跌倒后停留' },
      { name: '装置通道采样-05', robot: '巡检机器人 A', payload: '红外摄像头', route: '装置消防巡检线', value: 5, level: '低', intensity: 0.28, eventType: '烟火识别', triggerReason: '机器人红外巡检发现疑似烟火点' }
    ]
  },
  {
    name: '罐区南侧', x: 51, y: 38, width: 23, height: 24, value: 34, level: '高', intensity: 0.9, eventType: '烟火识别', triggerReason: '疑似烟火行为被边缘模型识别',
    samples: [
      { name: '罐区南侧采样-01', robot: '巡检机器人 C', payload: '红外摄像头', route: '罐区南侧巡检线', value: 16, level: '高', intensity: 0.88, eventType: '烟火识别', triggerReason: '机器人红外巡检发现疑似烟火点' },
      { name: '罐区南侧采样-02', robot: '巡检机器人 C', payload: '双目摄像头', route: '罐区边界巡检线', value: 11, level: '高', intensity: 0.66, eventType: '人员闯入', triggerReason: '机器人巡检识别到人员进入禁行区域' },
      { name: '罐区南侧采样-03', robot: '巡检机器人 C', payload: '云台摄像头', route: '罐区南侧巡检线', value: 7, level: '中', intensity: 0.42, eventType: '跌倒停留', triggerReason: '机器人云台识别到人员异常停留' },
      { name: '罐区南侧采样-04', robot: '巡检机器人 B', payload: '双目摄像头', route: '罐区入口巡检线', value: 9, level: '中', intensity: 0.46, eventType: '未戴安全帽', triggerReason: '机器人移动采样识别到安全帽缺失' },
      { name: '罐区南侧采样-05', robot: '巡检机器人 B', payload: '云台摄像头', route: '罐区门禁巡检线', value: 5, level: '低', intensity: 0.3, eventType: '未戴工牌', triggerReason: '机器人回看门禁区域识别到工牌缺失' }
    ]
  },
  {
    name: '泵房外廊', x: 25, y: 53, width: 20, height: 21, value: 15, level: '中', intensity: 0.38, eventType: '跌倒停留', triggerReason: '人员异常停留超过阈值',
    samples: [
      { name: '泵房外廊采样-01', robot: '巡检机器人 A', payload: '云台摄像头', route: '泵房外廊巡检线', value: 8, level: '中', intensity: 0.4, eventType: '跌倒停留', triggerReason: '机器人云台识别到人员停留超过阈值' },
      { name: '泵房外廊采样-02', robot: '巡检机器人 A', payload: '双目摄像头', route: '泵房入口巡检线', value: 5, level: '低', intensity: 0.28, eventType: '未戴安全帽', triggerReason: '机器人移动采样识别到安全帽缺失' },
      { name: '泵房外廊采样-03', robot: '巡检机器人 B', payload: '双目摄像头', route: '泵房东侧巡检线', value: 2, level: '低', intensity: 0.18, eventType: '未戴工牌', triggerReason: '机器人识别到工牌缺失' },
      { name: '泵房外廊采样-04', robot: '巡检机器人 A', payload: '红外摄像头', route: '泵房消防巡检线', value: 3, level: '低', intensity: 0.2, eventType: '烟火识别', triggerReason: '机器人红外采样发现疑似烟火点' },
      { name: '泵房外廊采样-05', robot: '巡检机器人 B', payload: '双目摄像头', route: '泵房警戒线巡检线', value: 4, level: '低', intensity: 0.24, eventType: '人员闯入', triggerReason: '机器人巡检识别到人员越过警戒线' }
    ]
  },
  {
    name: '检修平台', x: 68, y: 25, width: 17, height: 19, value: 9, level: '低', intensity: 0.24, eventType: '未戴工牌', triggerReason: '人员未佩戴工牌',
    samples: [
      { name: '检修平台采样-01', robot: '巡检机器人 C', payload: '云台摄像头', route: '检修平台巡检线', value: 4, level: '低', intensity: 0.24, eventType: '未戴工牌', triggerReason: '机器人云台识别到人员未佩戴工牌' },
      { name: '检修平台采样-02', robot: '巡检机器人 C', payload: '双目摄像头', route: '平台作业面巡检线', value: 3, level: '低', intensity: 0.22, eventType: '未戴安全帽', triggerReason: '机器人移动采样识别到安全帽缺失' },
      { name: '检修平台采样-03', robot: '巡检机器人 C', payload: '双目摄像头', route: '平台护栏巡检线', value: 2, level: '低', intensity: 0.18, eventType: '人员闯入', triggerReason: '机器人识别到人员接近护栏边界' },
      { name: '检修平台采样-04', robot: '巡检机器人 C', payload: '红外摄像头', route: '平台消防巡检线', value: 1, level: '低', intensity: 0.18, eventType: '烟火识别', triggerReason: '机器人红外采样发现疑似烟火点' },
      { name: '检修平台采样-05', robot: '巡检机器人 C', payload: '云台摄像头', route: '平台楼梯巡检线', value: 2, level: '低', intensity: 0.18, eventType: '跌倒停留', triggerReason: '机器人巡检识别到人员异常停留' }
    ]
  }
]

const gasBaseTiles: HeatTile[] = [
  {
    name: 'A区入口', x: 12, y: 19, width: 18, height: 20, value: 22.1, level: '低', intensity: 0.32, gasType: '氧气', unit: '%', percent: 52,
    samples: [
      { name: 'A区入口气体采样-氧气', robot: '巡检机器人 A', payload: '气体感应分析仪', route: 'A区入口巡检线', value: 22.1, level: '低', intensity: 0.32, gasType: '氧气', unit: '%', percent: 52 },
      { name: 'A区入口气体采样-CO', robot: '巡检机器人 A', payload: '气体感应分析仪', route: 'A区入口巡检线', value: 12, level: '低', intensity: 0.22, gasType: '一氧化碳', unit: 'ppm', percent: 28 },
      { name: 'A区入口气体采样-H2S', robot: '巡检机器人 A', payload: '气体感应分析仪', route: 'A区入口巡检线', value: 6, level: '低', intensity: 0.2, gasType: '硫化氢', unit: 'ppm', percent: 24 },
      { name: 'A区入口气体采样-可燃', robot: '巡检机器人 A', payload: '气体感应分析仪', route: 'A区入口巡检线', value: 18, level: '低', intensity: 0.3, gasType: '可燃气体', unit: '%LEL', percent: 38 }
    ]
  },
  {
    name: '装置通道', x: 33, y: 15, width: 22, height: 18, value: 37, level: '中', intensity: 0.58, gasType: '一氧化碳', unit: 'ppm', percent: 68,
    samples: [
      { name: '装置通道气体采样-CO', robot: '巡检机器人 B', payload: '气体感应分析仪', route: '装置通道巡检线', value: 37, level: '中', intensity: 0.58, gasType: '一氧化碳', unit: 'ppm', percent: 68 },
      { name: '装置通道气体采样-可燃', robot: '巡检机器人 B', payload: '气体感应分析仪', route: '装置通道巡检线', value: 31, level: '中', intensity: 0.5, gasType: '可燃气体', unit: '%LEL', percent: 57 },
      { name: '装置通道气体采样-H2S', robot: '巡检机器人 B', payload: '气体感应分析仪', route: '装置通道巡检线', value: 14, level: '中', intensity: 0.36, gasType: '硫化氢', unit: 'ppm', percent: 45 }
    ]
  },
  {
    name: '罐区南侧', x: 51, y: 38, width: 23, height: 24, value: 52, level: '高', intensity: 0.88, gasType: '可燃气体', unit: '%LEL', percent: 86,
    samples: [
      { name: '罐区南侧气体采样-可燃', robot: '巡检机器人 C', payload: '气体感应分析仪', route: '罐区南侧巡检线', value: 52, level: '高', intensity: 0.88, gasType: '可燃气体', unit: '%LEL', percent: 86 },
      { name: '罐区南侧气体采样-CO', robot: '巡检机器人 C', payload: '气体感应分析仪', route: '罐区南侧巡检线', value: 44, level: '高', intensity: 0.72, gasType: '一氧化碳', unit: 'ppm', percent: 76 },
      { name: '罐区南侧气体采样-H2S', robot: '巡检机器人 C', payload: '气体感应分析仪', route: '罐区南侧巡检线', value: 21, level: '高', intensity: 0.64, gasType: '硫化氢', unit: 'ppm', percent: 70 }
    ]
  },
  {
    name: '泵房外廊', x: 25, y: 53, width: 20, height: 21, value: 23, level: '高', intensity: 0.76, gasType: '硫化氢', unit: 'ppm', percent: 74,
    samples: [
      { name: '泵房外廊气体采样-H2S', robot: '巡检机器人 A', payload: '气体感应分析仪', route: '泵房外廊巡检线', value: 23, level: '高', intensity: 0.76, gasType: '硫化氢', unit: 'ppm', percent: 74 },
      { name: '泵房外廊气体采样-CO', robot: '巡检机器人 A', payload: '气体感应分析仪', route: '泵房外廊巡检线', value: 32, level: '中', intensity: 0.54, gasType: '一氧化碳', unit: 'ppm', percent: 61 },
      { name: '泵房外廊气体采样-可燃', robot: '巡检机器人 A', payload: '气体感应分析仪', route: '泵房外廊巡检线', value: 28, level: '中', intensity: 0.46, gasType: '可燃气体', unit: '%LEL', percent: 55 }
    ]
  },
  {
    name: '检修平台', x: 68, y: 25, width: 17, height: 19, value: 26, level: '中', intensity: 0.42, gasType: '可燃气体', unit: '%LEL', percent: 61,
    samples: [
      { name: '检修平台气体采样-可燃', robot: '巡检机器人 C', payload: '气体感应分析仪', route: '检修平台巡检线', value: 26, level: '中', intensity: 0.42, gasType: '可燃气体', unit: '%LEL', percent: 61 },
      { name: '检修平台气体采样-氧气', robot: '巡检机器人 C', payload: '气体感应分析仪', route: '检修平台巡检线', value: 22.4, level: '中', intensity: 0.36, gasType: '氧气', unit: '%', percent: 53 },
      { name: '检修平台气体采样-CO', robot: '巡检机器人 C', payload: '气体感应分析仪', route: '检修平台巡检线', value: 19, level: '低', intensity: 0.28, gasType: '一氧化碳', unit: 'ppm', percent: 37 },
      { name: '检修平台气体采样-H2S', robot: '巡检机器人 C', payload: '气体感应分析仪', route: '检修平台巡检线', value: 8, level: '低', intensity: 0.24, gasType: '硫化氢', unit: 'ppm', percent: 31 }
    ]
  }
]

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

const safetyTiles = computed(() => safetyBaseTiles.map((tile) => scaleTile(tile)))
const gasTiles = computed(() => gasBaseTiles.map((tile) => scaleTile(tile)))
const currentTiles = computed(() => activeMode.value === 'safety' ? safetyTiles.value : gasTiles.value)

const hasSelectedTile = computed(() => selectedTileIndex.value !== null)
const selectedTile = computed(() => {
  if (selectedTileIndex.value === null) return null
  return currentTiles.value[selectedTileIndex.value] || null
})

const selectedSamples = computed(() => selectedTile.value?.samples || [])
const currentHistory = computed(() => {
  if (activeMode.value === 'safety') {
    return selectedTile.value ? safetyLeadersForSamples(selectedSamples.value) : safetyGlobalLeaders.value
  }
  if (activeMode.value === 'gas') {
    return selectedTile.value ? gasLeadersForSamples(selectedSamples.value) : gasGlobalLeaders.value
  }
  return []
})

const alertColumns = computed(() => {
  const commonColumns = [
    { title: '区域', dataIndex: 'areaName', key: 'areaName', width: 120 },
    { title: '告警名称', dataIndex: 'alertName', key: 'alertName', width: 180 },
    { title: '告警类型', dataIndex: 'alertType', key: 'alertType', width: 120 },
    { title: '风险等级', key: 'level', width: 100 },
    { title: '机器人', dataIndex: 'robot', key: 'robot', width: 130 },
    { title: '载荷', dataIndex: 'payload', key: 'payload', width: 140 },
    { title: '巡检路线', dataIndex: 'route', key: 'route', width: 160 }
  ]
  const valueColumn = activeMode.value === 'safety'
    ? { title: '触发次数', key: 'value', width: 100 }
    : { title: '采样值', key: 'value', width: 110 }
  return [
    ...commonColumns,
    valueColumn,
    { title: '采样时间', dataIndex: 'sampledAt', key: 'sampledAt', width: 170 },
    { title: '状态', key: 'status', width: 110 },
    { title: '告警事实', dataIndex: 'reason', key: 'reason', width: 260 },
    { title: '证据', key: 'evidence', width: 150 }
  ]
})

const currentAlertRows = computed(() => {
  const tiles = selectedTile.value ? [selectedTile.value] : currentTiles.value
  return tiles.flatMap((tile, tileIndex) => tile.samples.map((sample, sampleIndex) => buildAlertRow(tile, sample, tileIndex, sampleIndex)))
})

const safetyGlobalLeaders = computed(() => safetyLeadersForSamples(safetyTiles.value.flatMap((tile) => tile.samples)))
const gasGlobalLeaders = computed(() => gasLeadersForSamples(gasTiles.value.flatMap((tile) => tile.samples)))

const safetySummaryItems = computed(() => {
  const scope = selectedTile.value ? `${selectedTile.value.name}最高` : '全区域最高'
  const source = selectedTile.value ? selectedSamples.value : safetyTiles.value.flatMap((tile) => tile.samples)
  return safetyLeadersForSamples(source).map((item) => ({
    ...item,
    title: `${scope}${item.eventType}`
  }))
})

const gasSummaryItems = computed(() => {
  const scope = selectedTile.value ? `${selectedTile.value.name}最高` : '全区域最高'
  const source = selectedTile.value ? selectedSamples.value : gasTiles.value.flatMap((tile) => tile.samples)
  return gasLeadersForSamples(source).map((item) => ({
    ...item,
    title: `${scope}${item.gasType}`
  }))
})

const selectedTrendTarget = computed(() => {
  if (!selectedTile.value) return null
  if (selectedDetailIndex.value === null) return selectedTile.value
  return currentHistory.value[selectedDetailIndex.value] || selectedTile.value
})

const detailTitle = computed(() => {
  if (!selectedTile.value) {
    return activeMode.value === 'safety' ? '全区域各安全行为最高值' : '全区域各气体最高值'
  }
  return activeMode.value === 'safety'
    ? `${selectedTile.value.name} · 各安全行为最高采样记录`
    : `${selectedTile.value.name} · 各气体最高采样记录`
})

const currentGranularity = computed({
  get: () => activeMode.value === 'safety' ? safetyGranularity.value : gasGranularity.value,
  set: (value: Granularity) => {
    if (activeMode.value === 'safety') safetyGranularity.value = value
    else gasGranularity.value = value
  }
})

const trendTitle = computed(() => {
  const target = selectedTrendTarget.value
  if (!target) return ''
  if (activeMode.value === 'safety') return `${target.name} · ${target.eventType}`
  return `${target.name} · ${target.gasType}最高值`
})

const currentTrendSeries = computed(() =>
  buildTrendSeries(activeMode.value, selectedTileIndex.value || 0, currentGranularity.value, selectedDetailIndex.value)
)

const trendUnit = computed(() => {
  const target = selectedTrendTarget.value
  if (activeMode.value === 'safety') return '次'
  return target?.unit || ''
})

const trendUnitLabel = computed(() => `单位：${trendUnit.value}`)

const trendChartAriaLabel = computed(() => `${trendTitle.value}历史走势，单位${trendUnit.value}`)

const trendScale = computed(() => {
  const values = currentTrendSeries.value
  if (!values.length) return { min: 0, max: 100 }
  const minRaw = Math.min(...values)
  const maxRaw = Math.max(...values)
  const padding = Math.max(4, Math.ceil((maxRaw - minRaw) * 0.16))
  return {
    min: Math.max(0, Math.floor(minRaw - padding)),
    max: Math.ceil(maxRaw + padding)
  }
})

const yAxisTicks = computed(() => {
  const { min, max } = trendScale.value
  const tickCount = 4
  return Array.from({ length: tickCount + 1 }).map((_, index) => {
    const ratio = index / tickCount
    const value = Math.round(max - (max - min) * ratio)
    return {
      value,
      y: Number((18 + ratio * 130).toFixed(2))
    }
  })
})

const xAxisTicks = computed(() => {
  const series = currentTrendSeries.value
  if (!series.length) return []
  const indexes = getTickIndexes(series.length)
  return indexes.map((index) => ({
    index,
    x: getTrendPoint(index, series[index], series.length).x,
    label: getTrendLabel(index)
  }))
})

const trendPolylinePoints = computed(() => buildPolylinePoints(currentTrendSeries.value))

const labeledTrendPoints = computed(() => {
  const series = currentTrendSeries.value
  if (!series.length) return []
  return getTickIndexes(series.length).map((index) => {
    const point = getTrendPoint(index, series[index], series.length)
    return {
      ...point,
      index,
      value: series[index]
    }
  })
})

function scaleTile(tile: HeatTile): HeatTile {
  const samples = tile.samples.map((sample) => scaleMetric(sample))
  const scaled = scaleMetric(tile)
  return {
    ...tile,
    ...scaled,
    samples
  }
}

function scaleMetric<T extends HeatTile | InspectionSample>(item: T): T {
  const isGasPercent = item.unit === '%' || item.unit === '%LEL'
  const value = isGasPercent
    ? Number((item.value * rangeScale.value).toFixed(1))
    : Math.round(item.value * rangeScale.value)

  return {
    ...item,
    value,
    percent: item.percent ? Math.min(99, Math.round(item.percent * rangeScale.value)) : undefined,
    intensity: clampHeat(item.intensity * rangeScale.value)
  }
}

function gasLeadersForSamples(samples: InspectionSample[]) {
  const gasTypes: GasType[] = ['可燃气体', '一氧化碳', '硫化氢']
  return gasTypes
    .map((gasType) => {
      return samples
        .filter((sample) => sample.gasType === gasType)
        .sort((a, b) => b.value - a.value)[0]
    })
    .filter((sample): sample is InspectionSample => Boolean(sample))
}

function safetyLeadersForSamples(samples: InspectionSample[]) {
  const eventTypes: SafetyEventType[] = ['烟火识别', '人员闯入', '未戴安全帽', '未戴工牌', '跌倒停留']
  return eventTypes
    .map((eventType) => {
      return samples
        .filter((sample) => sample.eventType === eventType)
        .sort((a, b) => b.value - a.value)[0]
    })
    .filter((sample): sample is InspectionSample => Boolean(sample))
}

function buildAlertRow(tile: HeatTile, sample: InspectionSample, tileIndex: number, sampleIndex: number): AlertRow {
  const alertType = activeMode.value === 'safety' ? sample.eventType || tile.eventType || '安全行为异常' : sample.gasType || tile.gasType || '气体异常'
  const valueText = activeMode.value === 'safety'
    ? `${sample.value}次`
    : `${sample.value}${sample.unit || tile.unit || ''}${sample.percent ? ` / ${sample.percent}%` : ''}`
  return {
    id: `${activeMode.value}-${tile.name}-${sample.name}-${tileIndex}-${sampleIndex}`,
    areaName: tile.name,
    alertName: `${tile.name}${activeMode.value === 'safety' ? '安全行为告警' : '气体浓度告警'}-${String(sampleIndex + 1).padStart(2, '0')}`,
    alertType,
    robot: sample.robot,
    payload: sample.payload,
    route: sample.route,
    valueText,
    level: sample.level,
    sampledAt: now.subtract(tileIndex * 17 + sampleIndex * 6, 'minute').format('YYYY-MM-DD HH:mm:ss'),
    status: sample.level === '高' ? '待确认' : sample.level === '中' ? '处理中' : '已记录',
    reason: activeMode.value === 'safety'
      ? sample.triggerReason || tile.triggerReason || `${alertType}触发边巡边检告警`
      : `${alertType}采样值 ${sample.value}${sample.unit || tile.unit || ''}，达到${sample.level}风险阈值`,
    evidenceText: activeMode.value === 'safety' ? '光学图 / 热成图' : '气体曲线 / 现场图',
    opticalImageUrl,
    thermalImageUrl
  }
}

function getLevelColor(level: HeatLevel) {
  return level === '高' ? 'red' : level === '中' ? 'orange' : 'green'
}

function getAlertStatusColor(status: string) {
  return ({ 待确认: 'red', 处理中: 'orange', 已记录: 'blue', 已闭环: 'green' } as Record<string, string>)[status] || 'default'
}

function clampHeat(value: number) {
  return Number(Math.max(0.18, Math.min(0.96, value)).toFixed(2))
}

function getTileStyle(tile: HeatTile) {
  return {
    left: `${tile.x}%`,
    top: `${tile.y}%`,
    width: `${tile.width}%`,
    height: `${tile.height}%`,
    '--heat-alpha': tile.intensity
  }
}

function buildTrendSeries(type: Mode, areaIndex: number, granularity: Granularity, detailIndex: number | null) {
  const count = granularity === 'month' ? 30 : granularity === 'week' ? 7 : 24
  const phase = (areaIndex % 5) * 0.7 + (detailIndex ?? 0) * 0.33 + (type === 'safety' ? 0.4 : 1.1)
  const amplitude = (granularity === 'day' ? 11 : granularity === 'week' ? 16 : 22) * rangeScale.value
  const baseline = type === 'safety'
    ? 38 + (areaIndex % 4) * 7 + (detailIndex ?? 0) * 3
    : 46 + (areaIndex % 4) * 5 + (detailIndex ?? 0) * 2

  return Array.from({ length: count }).map((_, idx) => {
    const wave = Math.sin(idx / (granularity === 'day' ? 2.4 : 1.8) + phase) * amplitude
    const pulse = Math.cos(idx / 3.1 + phase / 2) * 6
    return Math.max(8, Math.min(98, Number((baseline + wave + pulse).toFixed(1))))
  })
}

function buildPolylinePoints(series: number[]) {
  if (!series.length) return ''
  return series
    .map((value, index) => {
      const point = getTrendPoint(index, value, series.length)
      return `${point.x},${point.y}`
    })
    .join(' ')
}

function getTrendPoint(index: number, value: number, length: number) {
  const { min, max } = trendScale.value
  const plotWidth = 292
  const plotHeight = 130
  const x = length > 1 ? 48 + (index / (length - 1)) * plotWidth : 48
  const y = 148 - ((value - min) / Math.max(1, max - min)) * plotHeight
  return {
    x: Number(x.toFixed(2)),
    y: Number(y.toFixed(2))
  }
}

function getTickIndexes(length: number) {
  if (length <= 1) return [0]
  const indexes = [0, Math.floor((length - 1) / 2), length - 1]
  return Array.from(new Set(indexes))
}

function getTrendLabel(index: number) {
  if (currentGranularity.value === 'day') return `${String(index).padStart(2, '0')}:00`
  if (currentGranularity.value === 'week') return `第${index + 1}天`
  return `第${index + 1}日`
}

function selectTile(index: number) {
  selectedTileIndex.value = selectedTileIndex.value === index ? null : index
  selectedDetailIndex.value = null
}

function selectDetail(index: number) {
  if (!hasSelectedTile.value) return
  selectedDetailIndex.value = selectedDetailIndex.value === index ? null : index
}

watch(activeMode, () => {
  selectedTileIndex.value = null
  selectedDetailIndex.value = null
})
</script>

<style scoped lang="css">
.edge-inspection {
  width: 100%;
}

.filter-card {
  margin-top: 12px;
}

.filter-label {
  color: #475569;
  font-size: 13px;
  font-weight: 600;
}

.filter-control-stack {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
}

.mode-switch-row,
.time-filter-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.mode-switch-row {
  min-height: 32px;
}

.time-picker {
  min-width: 320px;
}

.map-card {
  margin-top: 16px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 12px;
}

.summary-metric {
  min-height: 76px;
  padding: 10px 12px;
  border: 1px solid #edf2f7;
  border-radius: 8px;
  background: #fafafa;
}

.summary-title {
  color: #64748b;
  font-size: 12px;
}

.summary-value {
  margin-top: 4px;
  color: #111827;
  font-size: 24px;
  font-weight: 600;
  line-height: 1.2;
}

.summary-meta {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.map-title {
  margin: 8px 0;
  color: #475569;
  font-size: 13px;
  font-weight: 600;
}

.map-heatmap {
  position: relative;
  min-height: 430px;
  overflow: hidden;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background-position: center;
  background-size: cover;
}

.map-heatmap::before {
  position: absolute;
  inset: 0;
  content: '';
  background: rgba(248, 250, 252, 0.12);
}

.heat-tile {
  position: absolute;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.72);
  border-radius: 4px;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(15, 23, 42, 0.06);
  transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
}

.safety-tile {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0)),
    rgba(239, 68, 68, var(--heat-alpha));
}

.gas-tile {
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0)),
    rgba(37, 99, 235, var(--heat-alpha));
}

.heat-tile:hover,
.heat-tile.active {
  transform: translateY(-1px);
  border-color: rgba(17, 24, 39, 0.8);
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.2), inset 0 0 0 1px rgba(255, 255, 255, 0.45);
}

.heat-tile.active::after {
  position: absolute;
  inset: -3px;
  border: 2px solid rgba(17, 24, 39, 0.65);
  border-radius: 6px;
  content: '';
  pointer-events: none;
}

.tile-label,
.tile-detail {
  position: relative;
  color: #111827;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.9);
}

.tile-label {
  font-size: 12px;
  font-weight: 700;
}

.tile-detail {
  align-self: flex-end;
  padding: 1px 5px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.68);
  font-size: 11px;
  font-weight: 600;
}

.detail-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  gap: 12px;
  margin-top: 12px;
}

.history-list {
  display: grid;
  gap: 8px;
}

.history-item {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: 1px solid #edf2f7;
  border-radius: 8px;
  background: #fafafa;
  color: #475569;
  font-size: 12px;
  text-align: left;
}

.history-item.selectable {
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
}

.history-item.selectable:hover,
.history-item.active {
  border-color: #1677ff;
  background: #f0f7ff;
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.12);
}

.history-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-meta {
  grid-column: 1 / -1;
  overflow: hidden;
  color: #64748b;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trend-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
  color: #475569;
  font-size: 12px;
}

.line-chart {
  height: 220px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 8px;
  background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%);
}

.line-chart svg {
  width: 100%;
  height: 100%;
}

.axis-line {
  stroke: #94a3b8;
  stroke-width: 1;
}

.grid-line {
  stroke: #e2e8f0;
  stroke-dasharray: 3 3;
  stroke-width: 1;
}

.axis-label,
.axis-title {
  fill: #64748b;
  font-size: 10px;
}

.line-safety,
.line-gas {
  fill: none;
  stroke-linejoin: round;
  stroke-width: 2.2;
}

.line-safety {
  stroke: #dc2626;
}

.line-gas {
  stroke: #2563eb;
}

.point-safety {
  fill: #dc2626;
  stroke: #fff;
  stroke-width: 1.5;
}

.point-gas {
  fill: #2563eb;
  stroke: #fff;
  stroke-width: 1.5;
}

.point-label {
  fill: #111827;
  font-size: 10px;
  font-weight: 600;
}

.alert-list-card {
  margin-top: 12px;
}

.alert-value {
  color: #111827;
  font-weight: 600;
}

.alert-thumb {
  width: 56px;
  height: 38px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  object-fit: cover;
  background: #f8fafc;
}

@media (max-width: 1200px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .detail-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .mode-switch-row,
  .time-filter-row {
    align-items: flex-start;
    flex-direction: column;
    width: 100%;
  }

  .time-picker {
    min-width: 100%;
    width: 100%;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .map-heatmap {
    min-height: 320px;
  }

  .trend-header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
