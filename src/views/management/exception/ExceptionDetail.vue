<template>
  <div class="exception-detail">
    <a-page-header title="异常详情" sub-title="区分实时告警与巡检告警，补齐来源、链路、证据与推送状态" @back="goBack">
      <template #extra><a-button type="primary" @click="goTaskEvidence">查看任务证据</a-button></template>
    </a-page-header>

    <a-card style="margin-top: 16px">
      <a-descriptions bordered size="small" :column="3">
        <a-descriptions-item label="告警名称">{{ detail.name }}</a-descriptions-item>
        <a-descriptions-item label="当前闭环方式">
          <a-tag :color="detail.closeMode === 'internal' ? 'green' : 'volcano'">
            {{ detail.closeMode === 'internal' ? '线下人工处置' : '第三方闭环' }}
          </a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="状态"><a-tag :color="getStatusColor(detail.status)">{{ getStatusText(detail.status) }}</a-tag></a-descriptions-item>
        <a-descriptions-item label="告警来源">{{ detail.alarmSource === 'realtime' ? '实时告警' : '巡检告警' }}</a-descriptions-item>
        <a-descriptions-item label="告警事实">{{ detail.alertFact }}</a-descriptions-item>
        <a-descriptions-item label="处置理由">{{ detail.handlingReason }}</a-descriptions-item>
        <a-descriptions-item label="来源任务">{{ detail.sourceTask }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card :title="detail.alarmSource === 'inspection' ? '巡检告警链路' : '实时告警来源'" style="margin-top: 16px">
      <a-descriptions bordered size="small" :column="2">
        <template v-if="detail.alarmSource === 'inspection'">
          <a-descriptions-item label="任务">{{ detail.sourceTask }}</a-descriptions-item>
          <a-descriptions-item label="巡检点">{{ detail.inspectionPointName }}</a-descriptions-item>
          <a-descriptions-item label="停车点">{{ detail.parkingPointName }}</a-descriptions-item>
          <a-descriptions-item label="设施/管路">{{ detail.facilityName }}</a-descriptions-item>
          <a-descriptions-item label="部件">{{ detail.componentName }}</a-descriptions-item>
          <a-descriptions-item label="规则">{{ detail.ruleName }}</a-descriptions-item>
        </template>
        <template v-else>
          <a-descriptions-item label="触发来源">{{ detail.sourceTrigger }}</a-descriptions-item>
          <a-descriptions-item label="业务场景">{{ detail.businessSceneText }}</a-descriptions-item>
          <a-descriptions-item label="区域">{{ detail.areaName }}</a-descriptions-item>
          <a-descriptions-item label="装置">{{ detail.installationName }}</a-descriptions-item>
        </template>
      </a-descriptions>
    </a-card>

    <a-card title="证据链" style="margin-top: 16px">
      <div class="evidence-grid">
        <div class="evidence-item">
          <img :src="detail.opticalImageUrl" alt="光学图" />
          <span>光学图</span>
        </div>
        <div class="evidence-item thermal">
          <img :src="detail.thermalImageUrl" alt="热成像图" />
          <span>热成像图</span>
        </div>
      </div>
      <a-descriptions bordered size="small" :column="2" style="margin-top: 12px">
        <a-descriptions-item label="视频片段回放">
          <a :href="detail.videoClipUrl" target="_blank">查看视频回放</a>
        </a-descriptions-item>
        <a-descriptions-item label="采样时间">{{ detail.sampledAt }}</a-descriptions-item>
        <a-descriptions-item label="机器人">{{ detail.robotName }}</a-descriptions-item>
        <a-descriptions-item label="停车点">{{ detail.parkingPointName }}</a-descriptions-item>
        <a-descriptions-item label="云台/焦距">{{ detail.ptz }}</a-descriptions-item>
        <a-descriptions-item label="识别值">{{ detail.recognizedValue }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card title="处置流转" style="margin-top: 16px">
      <a-row :gutter="16">
        <a-col :xs="24" :lg="12">
          <a-card size="small" title="线下人工处置链路">
            <a-timeline>
              <a-timeline-item color="red">系统识别事实</a-timeline-item>
              <a-timeline-item color="blue">人工确认</a-timeline-item>
              <a-timeline-item color="green">线下人工处置</a-timeline-item>
            </a-timeline>
          </a-card>
        </a-col>
        <a-col :xs="24" :lg="12">
          <a-card size="small" title="第三方闭环链路">
            <a-timeline>
              <a-timeline-item color="red">系统识别事实</a-timeline-item>
              <a-timeline-item color="blue">人工确认</a-timeline-item>
              <a-timeline-item color="volcano">转隐患 / 转整改</a-timeline-item>
              <a-timeline-item color="purple">第三方回传处理中</a-timeline-item>
              <a-timeline-item color="green">第三方闭环</a-timeline-item>
            </a-timeline>
          </a-card>
        </a-col>
      </a-row>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const opticalImageUrl = new URL('../../../设备.png', import.meta.url).href
const thermalImageUrl = new URL('../../../车间.png', import.meta.url).href

const detail = computed(() => {
  const isInspection = (route.query.source as string) !== 'realtime'
  const isInternal = String(route.params.id || '').toLowerCase() === 'a1'
  return {
    alarmSource: isInspection ? 'inspection' : 'realtime',
    name: isInternal ? '1号循环泵温升异常' : '甲烷浓度超阈值',
    closeMode: isInternal ? 'internal' : 'third_party',
    status: isInternal ? 'internal_closed' : 'third_party_hazard',
    alertFact: isInternal ? '热成像识别局部温升 86℃，超阈值。' : '采样值 34%LEL，触发严重告警。',
    handlingReason: isInternal ? '已现场确认并线下人工处置。' : '已转第三方隐患闭环。',
    sourceTask: isInspection ? (isInternal ? 'TASK-2026-001' : 'TASK-2026-002') : '-',
    sourceTrigger: isInspection ? '任务执行结果' : '边巡边检气体模块',
    businessSceneText: isInspection ? '日常巡检' : '环境检查',
    areaName: isInspection ? 'A区' : 'B区',
    installationName: isInspection ? '循环泵装置' : '管廊装置',
    facilityName: isInspection ? '1号循环泵' : '-',
    componentName: isInspection ? '出口法兰' : '-',
    ruleName: isInspection ? '温升判定规则 V1' : '-',
    inspectionPointName: isInspection ? '泵房巡检点' : '-',
    opticalImageUrl,
    thermalImageUrl,
    videoClipUrl: '#',
    sampledAt: isInternal ? '2026-04-17 10:17:42' : '2026-04-17 09:35:08',
    robotName: '巡检机器人-01',
    parkingPointName: isInternal ? '泵房北侧停车点' : '管廊B段停车点',
    ptz: 'Yaw 32° / Pitch -6° / 35mm',
    recognizedValue: isInternal ? '86℃' : '34%LEL'
  }
})

function getStatusText(status: string) {
  return ({ internal_closed: '线下人工已处置', third_party_hazard: '第三方隐患处理中', third_party_rectify: '第三方整改处理中', third_party_closed: '第三方已闭环' } as Record<string, string>)[status] || '处理中'
}
function getStatusColor(status: string) {
  return ({ internal_closed: 'green', third_party_hazard: 'volcano', third_party_rectify: 'orange', third_party_closed: 'green' } as Record<string, string>)[status] || 'blue'
}
function goBack() { router.push('/management/exception/list') }
function goTaskEvidence() { router.push(`/management/task/detail/${String(route.params.id || 'task-001')}?tab=evidence`) }
</script>

<style scoped>
.evidence-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.evidence-item { border: 1px solid #f0f0f0; border-radius: 8px; overflow: hidden; background: #fafafa; }
.evidence-item img { display: block; width: 100%; height: 160px; object-fit: cover; }
.evidence-item.thermal img { filter: saturate(1.6) hue-rotate(150deg); }
.evidence-item span { display: block; padding: 8px 10px; color: #595959; }
</style>
