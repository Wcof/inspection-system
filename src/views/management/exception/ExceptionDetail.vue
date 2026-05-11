<template>
  <div class="exception-detail">
    <a-page-header title="异常详情" sub-title="展示识别异常、证据链、隐患闭环与 EHS 同步信息" @back="goBack">
      <template #extra>
        <a-space>
          <a-button type="primary" @click="goTaskEvidence">查看任务证据</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-card style="margin-top: 16px">
      <a-descriptions bordered size="small" :column="3">
        <a-descriptions-item label="异常名称">{{ detail.name }}</a-descriptions-item>
        <a-descriptions-item label="业务场景">
          <a-tag :color="getSceneColor(detail.businessScene)">{{ getSceneText(detail.businessScene) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="风险等级">
          <a-tag :color="getRiskColor(detail.riskLevel)">{{ getRiskText(detail.riskLevel) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="异常类型">{{ getTypeText(detail.type) }}</a-descriptions-item>
        <a-descriptions-item label="闭环状态">
          <a-tag :color="getStatusColor(detail.status)">{{ getStatusText(detail.status) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="发生时间">{{ detail.time }}</a-descriptions-item>
        <a-descriptions-item label="所属区域">{{ detail.area }}</a-descriptions-item>
        <a-descriptions-item label="来源任务">
          <a-button type="link" size="small" @click="goTaskEvidence">{{ detail.sourceTask }}</a-button>
        </a-descriptions-item>
        <a-descriptions-item label="EHS 同步">
          <a-tag :color="detail.ehsSync === 'synced' ? 'green' : detail.ehsSync === 'failed' ? 'red' : detail.ehsSync === 'pending' ? 'blue' : 'default'">
            {{ getEhsText(detail.ehsSync) }}
          </a-tag>
          <span v-if="detail.ehsTicketNo" class="ehs-ticket">{{ detail.ehsTicketNo }}</span>
        </a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :xs="24" :lg="12">
        <a-card title="检测对象">
          <a-descriptions bordered size="small" :column="1">
            <a-descriptions-item label="设施">{{ detail.facilityName }}</a-descriptions-item>
            <a-descriptions-item label="检测对象">{{ detail.targetObject }}</a-descriptions-item>
            <a-descriptions-item label="对象类型">{{ detail.targetType }}</a-descriptions-item>
            <a-descriptions-item label="检测规则">{{ detail.ruleName }}</a-descriptions-item>
            <a-descriptions-item label="识别结论">{{ detail.summary }}</a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="12">
        <a-card title="证据链">
          <div class="evidence-grid">
            <div class="evidence-item">
              <img :src="detail.opticalImage" alt="光学证据" />
              <span>光学图</span>
            </div>
            <div class="evidence-item thermal">
              <img :src="detail.thermalImage" alt="热成像证据" />
              <span>热成像图</span>
            </div>
          </div>
          <a-descriptions bordered size="small" :column="2" style="margin-top: 12px">
            <a-descriptions-item label="采样时间">{{ detail.sampledAt }}</a-descriptions-item>
            <a-descriptions-item label="机器人位姿">{{ detail.robotPose }}</a-descriptions-item>
            <a-descriptions-item label="云台/焦距">{{ detail.ptz }}</a-descriptions-item>
            <a-descriptions-item label="置信度">{{ detail.confidence }}</a-descriptions-item>
            <a-descriptions-item label="规则版本">{{ detail.ruleVersion }}</a-descriptions-item>
            <a-descriptions-item label="人工复核">{{ detail.manualReview }}</a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
    </a-row>

    <a-card title="处置流转" style="margin-top: 16px">
      <a-timeline>
        <a-timeline-item v-for="item in timeline" :key="item.time" :color="item.color">
          <div class="timeline-title">{{ item.title }}</div>
          <div class="timeline-meta">{{ item.time }} / {{ item.operator }}</div>
          <div class="timeline-content">{{ item.content }}</div>
        </a-timeline-item>
      </a-timeline>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const opticalImage = new URL('../../../设备.png', import.meta.url).href
const thermalImage = new URL('../../../车间.png', import.meta.url).href

const detail = computed(() => {
  const id = String(route.params.id || 'alert-001')
  const seed = Number(id.match(/\d+/)?.[0] || 1)
  const scenes = ['daily_inspection', 'hazard_screening', 'environment_check', 'operation_guard']
  const types = ['facility', 'gas', 'safety', 'monitor_failure', 'uninspectable']
  const risks = ['warning', 'alarm', 'critical_alarm', 'hazard', 'major_hazard']
  const statuses = ['pending_confirm', 'confirmed', 'hazard_created', 'rectifying', 'pending_review', 'closed']
  return {
    id,
    name: seed % 2 ? '阀门法兰热异常' : '甲烷浓度超阈值',
    businessScene: scenes[seed % scenes.length],
    type: types[seed % types.length],
    riskLevel: risks[seed % risks.length],
    status: statuses[seed % statuses.length],
    time: '2026-04-17 10:18:00',
    area: seed % 2 ? '反应装置区' : 'B区管廊',
    sourceTask: `TASK-2026-${String(seed).padStart(3, '0')}`,
    ehsSync: seed % 3 === 0 ? 'failed' : seed % 2 === 0 ? 'synced' : 'pending',
    ehsTicketNo: seed % 2 === 0 ? `EHS-20260417-${String(seed).padStart(3, '0')}` : '',
    facilityName: '1号循环泵',
    targetObject: seed % 2 ? '出口法兰连接处' : '区域环境采样点',
    targetType: seed % 2 ? '接口与连接' : '区域环境',
    ruleName: seed % 2 ? '法兰泄漏/热异常规则 V1' : '可燃气体阈值规则 V1',
    summary: seed % 2 ? '热成像识别局部温升，建议转隐患复核。' : '采样值超过告警阈值，需现场确认。',
    opticalImage,
    thermalImage,
    sampledAt: '2026-04-17 10:17:42',
    robotPose: 'X128, Y93, Yaw 72°',
    ptz: 'Yaw 32° / Pitch -6° / 焦距 35mm',
    confidence: '91%',
    ruleVersion: 'RULE-V1.3',
    manualReview: '待安全员复核'
  }
})

const timeline = computed(() => [
  { title: '异常发生', time: detail.value.time, operator: '系统识别', content: detail.value.summary, color: 'red' },
  { title: '人工确认', time: '2026-04-17 10:25:00', operator: '值班长-李航', content: '已确认需要现场复核。', color: 'blue' },
  { title: '转隐患', time: '2026-04-17 10:32:00', operator: '安全员-周晨', content: '已转入隐患闭环，等待整改。', color: 'orange' },
  { title: 'EHS 同步', time: '2026-04-17 10:35:00', operator: '系统', content: detail.value.ehsTicketNo || '待同步第三方系统。', color: detail.value.ehsSync === 'failed' ? 'red' : 'green' }
])

function getSceneText(scene?: string) { return ({ daily_inspection: '日常巡检', hazard_screening: '隐患排查', environment_check: '环境检查', operation_guard: '作业监护' } as Record<string, string>)[scene || ''] || '日常巡检' }
function getSceneColor(scene?: string) { return ({ daily_inspection: 'blue', hazard_screening: 'volcano', environment_check: 'green', operation_guard: 'purple' } as Record<string, string>)[scene || ''] || 'blue' }
function getTypeText(type?: string) { return ({ facility: '设施设备异常', gas: '气体异常', safety: '安全行为异常', monitor_failure: '监测失效', uninspectable: '不可检异常' } as Record<string, string>)[type || ''] || '设施设备异常' }
function getRiskText(level?: string) { return ({ warning: '预警', alarm: '告警', critical_alarm: '严重告警', hazard: '隐患', major_hazard: '重大隐患' } as Record<string, string>)[level || ''] || '预警' }
function getRiskColor(level?: string) { return ({ warning: 'gold', alarm: 'orange', critical_alarm: 'red', hazard: 'volcano', major_hazard: 'magenta' } as Record<string, string>)[level || ''] || 'gold' }
function getStatusText(status?: string) { return ({ pending_confirm: '待确认', confirmed: '已确认', cleared: '已消警', hazard_created: '已转隐患', rectifying: '整改中', pending_review: '待复核', closed: '已闭环', archived: '已归档' } as Record<string, string>)[status || ''] || '待确认' }
function getStatusColor(status?: string) { return ({ pending_confirm: 'red', confirmed: 'blue', cleared: 'default', hazard_created: 'volcano', rectifying: 'orange', pending_review: 'purple', closed: 'green', archived: 'default' } as Record<string, string>)[status || ''] || 'default' }
function getEhsText(status?: string) { return ({ none: '未同步', pending: '待同步', synced: '已同步', failed: '同步失败' } as Record<string, string>)[status || ''] || '未同步' }

function goBack() { router.push('/management/exception/list') }
function goTaskEvidence() { router.push(`/management/task/detail/task-${String(route.params.id || '001').match(/\d+/)?.[0] || '001'}?tab=evidence`) }
</script>

<style scoped lang="css">
.exception-detail {
  width: 100%;
}
.ehs-ticket {
  margin-left: 8px;
  color: #8c8c8c;
}
.evidence-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}
.evidence-item {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  background: #fafafa;
}
.evidence-item img {
  display: block;
  width: 100%;
  height: 168px;
  object-fit: cover;
}
.evidence-item.thermal img {
  filter: saturate(1.6) hue-rotate(150deg);
}
.evidence-item span {
  display: block;
  padding: 8px 10px;
  color: #595959;
}
.timeline-title {
  font-weight: 600;
}
.timeline-meta {
  margin: 2px 0;
  color: #8c8c8c;
  font-size: 12px;
}
.timeline-content {
  color: #595959;
}
</style>
