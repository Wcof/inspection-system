<template>
  <div>
    <a-page-header title="检测规则详情" @back="goBack" />

    <a-space v-if="item" direction="vertical" style="width: 100%; margin-top:16px" :size="16">
      <a-card title="基础信息">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="规则名称">{{ item.name }}</a-descriptions-item>
          <a-descriptions-item label="规则编码">{{ item.code }}</a-descriptions-item>
          <a-descriptions-item label="检测类型">{{ item.detectionType }}</a-descriptions-item>
          <a-descriptions-item label="检测算法">{{ item.detectionAlgorithm }}</a-descriptions-item>
          <a-descriptions-item label="默认结果类型">{{ item.resultType }}</a-descriptions-item>
          <a-descriptions-item label="采集方式">{{ item.collectMethod }}</a-descriptions-item>
          <a-descriptions-item label="是否必须留证">{{ item.needEvidence ? '是' : '否' }}</a-descriptions-item>
          <a-descriptions-item label="当前版本">{{ item.version }}</a-descriptions-item>
          <a-descriptions-item label="状态">{{ item.status }}</a-descriptions-item>
          <a-descriptions-item label="配置说明" :span="2">{{ item.description || '-' }}</a-descriptions-item>
        </a-descriptions>
      </a-card>

      <a-card title="结果定义">
        <a-alert
          type="info"
          show-icon
          style="margin-bottom: 12px"
          message="结果定义支持配置语音播报。为空则不播放；填写后可在详情页直接试播。"
        />
        <a-table :data-source="item.results" row-key="id" :pagination="false" :columns="resultColumns">
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'generateException'">{{ record.generateException ? '是' : '否' }}</template>
            <template v-else-if="column.key === 'needReview'">{{ record.needReview ? '是' : '否' }}</template>
            <template v-else-if="column.key === 'voiceBroadcastText'">{{ record.voiceBroadcastText || '空不播放' }}</template>
            <template v-else-if="column.key === 'voicePlay'">
              <a-button size="small" :disabled="!record.voiceBroadcastText" @click="playVoice(record.voiceBroadcastText)">播放</a-button>
            </template>
          </template>
        </a-table>
      </a-card>

      <a-card title="引用情况">
        <a-descriptions :column="1" bordered>
          <a-descriptions-item label="当前引用数量">{{ item.referenceCount }}</a-descriptions-item>
        </a-descriptions>
      </a-card>

      <a-card title="版本记录">
        <a-table :data-source="versionRows" row-key="version" :pagination="false" :columns="versionColumns" />
      </a-card>
    </a-space>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getDetectionItemConfigs, type DetectionType } from './model'

const route = useRoute()
const router = useRouter()
const item = computed(() => getDetectionItemConfigs().find((x) => x.id === String(route.params.id)))

const resultColumns = computed(() => {
  const detectionType = item.value?.detectionType
  const columns: any[] = [
    { title: '结果名称', dataIndex: 'name', key: 'name', width: 140 },
    { title: '结果编码', dataIndex: 'code', key: 'code', width: 140 },
    { title: '判定指标', dataIndex: 'indicator', key: 'indicator', width: 150 }
  ]
  if (shouldShowUnit(detectionType)) columns.push({ title: '单位', dataIndex: 'unit', key: 'unit', width: 90 })
  if (shouldShowThreshold(detectionType)) {
    columns.push({ title: '正常范围', dataIndex: 'normalRange', key: 'normalRange', width: 130 })
    columns.push({ title: '预警阈值', dataIndex: 'warningThreshold', key: 'warningThreshold', width: 120 })
    columns.push({ title: '告警阈值', dataIndex: 'alarmThreshold', key: 'alarmThreshold', width: 120 })
  }
  if (detectionType === '热成像' || detectionType === '气体检测') {
    columns.push({ title: '严重阈值', dataIndex: 'severeThreshold', key: 'severeThreshold', width: 120 })
  }
  columns.push(
    { title: '判断口径', dataIndex: 'judgmentBasis', key: 'judgmentBasis', width: 220 },
    { title: '生成异常', key: 'generateException', width: 100 },
    { title: '人工复核', key: 'needReview', width: 100 },
    { title: '语音播报', key: 'voiceBroadcastText', width: 220 },
    { title: '播放', key: 'voicePlay', width: 90 }
  )
  return columns
})

function shouldShowUnit(type?: DetectionType) {
  return type === '热成像' || type === '气体检测' || type === '环境监测'
}

function shouldShowThreshold(type?: DetectionType) {
  return type === '热成像' || type === '气体检测' || type === '远传对比' || type === '环境监测'
}

const versionColumns = [
  { title: '版本号', dataIndex: 'version', key: 'version', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '更新时间', dataIndex: 'time', key: 'time', width: 180 },
  { title: '变更说明', dataIndex: 'change', key: 'change' }
]

const versionRows = computed(() => item.value ? [{ version: item.value.version, status: item.value.status, time: new Date(item.value.updatedAt).toLocaleString('zh-CN', { hour12: false }), change: '当前版本配置' }] : [])

function playVoice(text?: string) {
  const value = (text || '').trim()
  if (!value) {
    message.warning('当前结果未填写语音播报内容')
    return
  }
  if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
    message.error('当前浏览器不支持语音播报')
    return
  }
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(value)
  utterance.lang = 'zh-CN'
  window.speechSynthesis.speak(utterance)
}

function goBack() { router.push('/implementation/detection-item-config/list') }
</script>
