<template>
  <div class="dispatch-analysis">
    <ReportShell
      v-model="selectedPeriod"
      badge="DISPATCH ANALYSIS"
      title="调度分析"
      subtitle="围绕安全生产任务场景、风险优先级、调度动作和机器人约束，复盘调度决策质量。"
      :period-options="periodOptions"
    >
      <template #hero-extra>
        <div class="hero-metrics">
          <div>
            <span>调度完成率</span>
            <strong>96.4%</strong>
          </div>
          <div>
            <span>人工确认项</span>
            <strong>8 项</strong>
          </div>
        </div>
      </template>

      <template #actions>
        <a-select v-model:value="filters.scene" allow-clear placeholder="任务场景" style="width: 150px">
          <a-select-option value="daily">日常巡检</a-select-option>
          <a-select-option value="hazard">隐患排查</a-select-option>
          <a-select-option value="environment">环境检查</a-select-option>
          <a-select-option value="guard">作业监护</a-select-option>
        </a-select>
        <a-select v-model:value="filters.risk" allow-clear placeholder="风险等级" style="width: 150px">
          <a-select-option value="normal">普通</a-select-option>
          <a-select-option value="warning">预警</a-select-option>
          <a-select-option value="alarm">告警</a-select-option>
          <a-select-option value="critical">严重告警</a-select-option>
          <a-select-option value="hazard">隐患</a-select-option>
        </a-select>
      </template>

      <div class="kpi-grid">
        <a-card v-for="item in kpis" :key="item.label" class="kpi-card" size="small">
          <span>{{ item.label }}</span>
          <strong>{{ item.value }}</strong>
          <small :class="item.status">{{ item.desc }}</small>
        </a-card>
      </div>

      <div class="content-grid">
        <a-card title="任务场景分布" size="small" class="panel-card">
          <div class="scene-list">
            <div v-for="item in sceneRows" :key="item.name" class="scene-row">
              <div class="scene-head">
                <span>{{ item.name }}</span>
                <strong>{{ item.count }} 个任务</strong>
              </div>
              <a-progress :percent="item.percent" size="small" :stroke-color="item.color" />
              <div class="scene-meta">
                <span>平均等待 {{ item.wait }}</span>
                <span>异常/不可检 {{ item.exceptionCount }}</span>
              </div>
            </div>
          </div>
        </a-card>

        <a-card title="调度动作分析" size="small" class="panel-card">
          <a-table :columns="actionColumns" :data-source="actionRows" row-key="action" :pagination="false" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'risk'">
                <a-tag :color="record.riskColor">{{ record.risk }}</a-tag>
              </template>
            </template>
          </a-table>
        </a-card>
      </div>

      <div class="content-grid bottom-grid">
        <a-card title="人工确认项复盘" size="small" class="panel-card">
          <a-table :columns="confirmColumns" :data-source="confirmRows" row-key="id" :pagination="false" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="record.status === '已确认' ? 'green' : 'orange'">{{ record.status }}</a-tag>
              </template>
            </template>
          </a-table>
        </a-card>

        <a-card title="机器人资源约束" size="small" class="panel-card">
          <div class="robot-list">
            <div v-for="robot in robotRows" :key="robot.name" class="robot-row">
              <div>
                <strong>{{ robot.name }}</strong>
                <span>{{ robot.currentTask }}</span>
              </div>
              <a-progress :percent="robot.battery" size="small" :status="robot.battery < 30 ? 'exception' : 'active'" />
              <small>{{ robot.constraint }}</small>
            </div>
          </div>
        </a-card>
      </div>
    </ReportShell>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import ReportShell from './components/ReportShell.vue'

type Period = 'day' | 'week' | 'month' | 'quarter'
const selectedPeriod = ref<Period>('week')
const periodOptions = [
  { label: '日', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
  { label: '季', value: 'quarter' }
]

const filters = reactive({
  scene: undefined as string | undefined,
  risk: undefined as string | undefined
})

const kpis = [
  { label: '计划派生任务', value: '42', desc: '自动规划占 68%', status: 'ok' },
  { label: '临时插单', value: '9', desc: '严重告警触发 3 次', status: 'warn' },
  { label: '补检任务', value: '6', desc: '遮挡/未到达触发', status: 'warn' },
  { label: '取消/并入', value: '5', desc: '低风险同区域合并', status: 'ok' }
]

const sceneRows = [
  { name: '日常巡检', count: 28, percent: 52, wait: '3.5 分钟', exceptionCount: 4, color: '#0f766e' },
  { name: '隐患排查', count: 9, percent: 17, wait: '2.1 分钟', exceptionCount: 6, color: '#c2410c' },
  { name: '环境检查', count: 11, percent: 20, wait: '4.8 分钟', exceptionCount: 3, color: '#2563eb' },
  { name: '作业监护', count: 6, percent: 11, wait: '1.8 分钟', exceptionCount: 2, color: '#7c3aed' }
]

const actionColumns = [
  { title: '调度动作', dataIndex: 'action', key: 'action', width: 110 },
  { title: '触发原因', dataIndex: 'reason', key: 'reason' },
  { title: '风险等级', key: 'risk', width: 110 },
  { title: '影响任务', dataIndex: 'impact', key: 'impact', width: 120 },
  { title: '结果', dataIndex: 'result', key: 'result', width: 120 }
]

const actionRows = [
  { action: '插单', reason: '甲烷浓度严重告警，需立即复检', risk: '严重告警', riskColor: 'red', impact: '2 个', result: '已执行' },
  { action: '补检', reason: '压力表反光无法读取，不计覆盖', risk: '预警', riskColor: 'orange', impact: '1 个', result: '待执行' },
  { action: '替换机器人', reason: '机器人-02 电量低于 25%', risk: '普通', riskColor: 'blue', impact: '1 个', result: '已替换' },
  { action: '并入', reason: '同区域低风险设施可合并巡检', risk: '普通', riskColor: 'green', impact: '3 个', result: '已并入' }
]

const confirmColumns = [
  { title: '建议动作', dataIndex: 'action', key: 'action', width: 110 },
  { title: '建议原因', dataIndex: 'reason', key: 'reason' },
  { title: '建议机器人', dataIndex: 'robot', key: 'robot', width: 120 },
  { title: '确认状态', key: 'status', width: 110 }
]

const confirmRows = [
  { id: 'c1', action: '插单', reason: 'B区气体告警优先级高于日常巡检', robot: '巡检机器人-01', status: '已确认' },
  { id: 'c2', action: '补检', reason: '出口压力表目标缺失，需人工确认补检窗口', robot: '巡检机器人-02', status: '待确认' },
  { id: 'c3', action: '顺延', reason: 'A区检修作业窗口冲突', robot: '巡检机器人-01', status: '已确认' }
]

const robotRows = [
  { name: '巡检机器人-01', battery: 82, currentTask: 'B区气体复检', constraint: '可进入 B区，热成像/气体模块正常' },
  { name: '巡检机器人-02', battery: 24, currentTask: '回充中', constraint: '低电量，不建议派发高风险长任务' },
  { name: '巡检机器人-03', battery: 67, currentTask: '待命', constraint: '适合作业监护，当前无冲突任务' }
]
</script>

<style scoped>
.dispatch-analysis {
  padding: 20px 0;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(2, minmax(120px, 1fr));
  gap: 10px;
}

.hero-metrics div,
.kpi-card {
  border-radius: 12px;
  background: rgba(236, 254, 255, 0.18);
  padding: 12px;
}

.hero-metrics span,
.kpi-card span,
.robot-row span {
  display: block;
  font-size: 12px;
  color: #64748b;
}

.hero-metrics span {
  color: rgba(236, 254, 255, 0.82);
}

.hero-metrics strong {
  color: #fff;
  font-size: 20px;
}

.kpi-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.kpi-card {
  background: #fff;
  box-shadow: 0 12px 20px -20px rgba(15, 23, 42, 0.9);
}

.kpi-card strong {
  display: block;
  margin: 8px 0 4px;
  color: #0f172a;
  font-size: 24px;
}

.kpi-card small.ok {
  color: #0f766e;
}

.kpi-card small.warn {
  color: #c2410c;
}

.content-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: 1fr 1.25fr;
  gap: 14px;
}

.bottom-grid {
  grid-template-columns: 1.25fr 1fr;
}

.panel-card {
  border-radius: 12px;
  box-shadow: 0 12px 20px -20px rgba(15, 23, 42, 1);
}

.scene-list,
.robot-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.scene-row,
.robot-row {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  background: #f8fafc;
}

.scene-head,
.scene-meta {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.scene-head strong,
.robot-row strong {
  color: #0f172a;
}

.scene-meta {
  margin-top: 4px;
  color: #64748b;
  font-size: 12px;
}

.robot-row {
  display: grid;
  grid-template-columns: 1fr 150px;
  gap: 10px;
  align-items: center;
}

.robot-row small {
  grid-column: 1 / -1;
  color: #64748b;
}

:deep(.panel-card .ant-table-thead > tr > th) {
  background: #edf2f7;
  color: #334155;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .kpi-grid,
  .content-grid,
  .bottom-grid {
    grid-template-columns: 1fr;
  }
}
</style>
