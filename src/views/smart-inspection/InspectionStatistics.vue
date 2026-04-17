
<template>
  <div class="inspection-statistics">
    <a-page-header title="巡检分析" sub-title="已拆分为巡检点分析 / 设施设备分析 / 气体分析 / 安全行为分析" />

    <a-card style="margin-top: 16px">
      <div class="toolbar">
        <a-space>
          <a-form-item label="统计周期"><a-segmented v-model:value="selectedPeriod" :options="periodOptions" /></a-form-item>
          <a-form-item label="分析模块"><a-segmented v-model:value="selectedModule" :options="moduleOptions" /></a-form-item>
          <a-form-item v-if="selectedModule === 'device'" label="展示方式"><a-segmented v-model:value="deviceViewMode" :options="deviceViewOptions" /></a-form-item>
        </a-space>
      </div>

      <div v-if="selectedModule !== 'gas'" class="content-grid">
        <a-card size="small" title="维度汇总" class="panel">
          <a-table :columns="summaryColumns" :data-source="currentSummary" row-key="id" :pagination="false">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'abnormalRate'">{{ record.abnormalRate }}%</template>
              <template v-else-if="column.key === 'actions'"><a-button type="link" size="small" @click="selectedSummary = record">查看明细</a-button></template>
            </template>
          </a-table>
        </a-card>
        <a-card size="small" :title="selectedModule === 'device' && deviceViewMode === 'trend' ? '趋势分析' : '数据清单'" class="panel">
          <a-table v-if="deviceViewMode === 'list' || selectedModule !== 'device'" :columns="detailColumns" :data-source="currentDetailRows" row-key="id" :pagination="false" />
          <div v-else class="trend-box">
            <div v-for="item in trendMock" :key="item.label" class="trend-row"><span>{{ item.label }}</span><a-progress :percent="item.value" size="small" /></div>
          </div>
        </a-card>
      </div>

      <a-card v-else size="small" title="气体分析（区域热力图）" class="panel-full">
        <div class="heatmap-grid">
          <div v-for="cell in heatmapCells" :key="cell.name" class="heat-cell" :style="{ opacity: String(cell.opacity) }">
            <span>{{ cell.name }}</span>
            <strong>{{ cell.value }}</strong>
          </div>
        </div>
        <div class="heat-note">按当前时间范围取最大值进行热力渲染，趋势曲线暂缓实现。</div>
      </a-card>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

type Period = 'day' | 'week' | 'month'
type Module = 'point' | 'device' | 'gas' | 'safety'
const periodOptions = [ { label: '天', value: 'day' }, { label: '周', value: 'week' }, { label: '月', value: 'month' } ]
const moduleOptions = [ { label: '巡检点分析', value: 'point' }, { label: '设施设备分析', value: 'device' }, { label: '气体分析', value: 'gas' }, { label: '安全行为分析', value: 'safety' } ]
const deviceViewOptions = [ { label: '数据清单', value: 'list' }, { label: '趋势分析', value: 'trend' } ]
const selectedPeriod = ref<Period>('day')
const selectedModule = ref<Module>('point')
const deviceViewMode = ref<'list' | 'trend'>('list')
const selectedSummary = ref<any>()
const summaryColumns = [ { title: '名称', dataIndex: 'name', key: 'name' }, { title: '总检测数', dataIndex: 'total', key: 'total', width: 120 }, { title: '异常数', dataIndex: 'abnormal', key: 'abnormal', width: 120 }, { title: '异常率', key: 'abnormalRate', width: 100 }, { title: '操作', key: 'actions', width: 100 } ]
const detailColumns = [ { title: '项目', dataIndex: 'itemName', key: 'itemName' }, { title: '最新值', dataIndex: 'latestValue', key: 'latestValue', width: 140 }, { title: '状态', dataIndex: 'status', key: 'status', width: 120 }, { title: '采样时间', dataIndex: 'sampledAt', key: 'sampledAt', width: 180 } ]
const dataMap: Record<Module, any[]> = {
  point: [ { id: 'p1', name: 'A区配电房', total: 32, abnormal: 3, abnormalRate: 9.4 } ],
  device: [ { id: 'd1', name: '配电柜A15', total: 40, abnormal: 5, abnormalRate: 12.5 } ],
  gas: [ { id: 'g1', name: 'B区管廊', total: 28, abnormal: 2, abnormalRate: 7.1 } ],
  safety: [ { id: 's1', name: '安全帽识别', total: 36, abnormal: 4, abnormalRate: 11.1 } ]
}
const detailMap: Record<string, any[]> = {
  p1: [ { id: '1', itemName: '温度读数', latestValue: '65.4℃', status: 'warning', sampledAt: '2026-04-17 13:10:00' } ],
  d1: [ { id: '2', itemName: '柜体温升', latestValue: '85℃', status: 'critical', sampledAt: '2026-04-17 12:44:00' } ],
  s1: [ { id: '3', itemName: '安全帽佩戴', latestValue: '未佩戴', status: 'critical', sampledAt: '2026-04-17 11:40:00' } ]
}
const currentSummary = computed(() => dataMap[selectedModule.value])
const currentDetailRows = computed(() => detailMap[selectedSummary.value?.id || currentSummary.value[0]?.id] || [])
const trendMock = computed(() => [ { label: `${selectedPeriod.value}-1`, value: 35 }, { label: `${selectedPeriod.value}-2`, value: 50 }, { label: `${selectedPeriod.value}-3`, value: 72 } ])
const heatmapCells = computed(() => [ { name: 'A区', value: '22%LEL', opacity: .35 }, { name: 'B区', value: '34%LEL', opacity: .65 }, { name: 'C区', value: '41%LEL', opacity: .85 }, { name: 'D区', value: '15%LEL', opacity: .25 } ])
</script>

<style scoped lang="css">.toolbar {
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
  min-height: 360px;
}
.trend-box {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 12px;
}
.trend-row {
  display: grid;
  grid-template-columns: 90px 1fr;
  gap: 12px;
  align-items: center;
}
.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}
.heat-cell {
  min-height: 120px;
  border-radius: 12px;
  background: #ff4d4f;
  color: #fff;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 16px;
}
.heat-note {
  margin-top: 12px;
  color: #666;
  font-size: 12px;
}
</style>
