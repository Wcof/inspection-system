<template>
  <div>
    <a-page-header title="检测项配置详情" @back="goBack" />

    <a-card v-if="item" style="margin-top:16px">
      <a-tabs>
        <a-tab-pane key="basic" tab="基础信息">
          <a-descriptions :column="2" bordered>
            <a-descriptions-item label="配置名称">{{ item.name }}</a-descriptions-item>
            <a-descriptions-item label="配置编码">{{ item.code }}</a-descriptions-item>
            <a-descriptions-item label="配置分类">{{ item.category }}</a-descriptions-item>
            <a-descriptions-item label="默认结果类型">{{ item.resultType }}</a-descriptions-item>
            <a-descriptions-item label="是否必须留证">{{ item.needEvidence ? '是' : '否' }}</a-descriptions-item>
            <a-descriptions-item label="当前版本">{{ item.version }}</a-descriptions-item>
            <a-descriptions-item label="发布状态">{{ item.publishStatus }}</a-descriptions-item>
            <a-descriptions-item label="启用状态">{{ item.enabled ? '启用' : '停用' }}</a-descriptions-item>
            <a-descriptions-item label="配置说明" :span="2">{{ item.description }}</a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>
        <a-tab-pane key="targets" tab="适用对象">
          <a-descriptions :column="1" bordered>
            <a-descriptions-item label="适用对象层级">{{ normalizeTargetTypes(item.targetTypes).join('、') }}</a-descriptions-item>
            <a-descriptions-item label="适用对象类别">{{ item.targetDetails }}</a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>
        <a-tab-pane key="results" tab="结果定义">
          <a-alert
            type="info"
            show-icon
            style="margin-bottom: 12px"
            message="检测项配置只维护结果口径。采集姿态、采集位和默认大模型能力由对象检测配置与系统能力承接。"
          />
          <a-table :data-source="item.results" row-key="id" :pagination="false" :columns="resultColumns" />
        </a-tab-pane>
        <a-tab-pane key="refs" tab="引用情况">
          <a-space direction="vertical" style="width: 100%">
            <a-alert
              type="info"
              show-icon
              message="本页第一版先展示引用数量。后续引用来源应来自对象检测配置。"
              :description="`当前引用数量：${item.referenceCount}`"
            />
            <a-descriptions title="使用说明" :column="1" bordered>
              <a-descriptions-item label="数据流">标准检测项配置 -> 对象检测配置 -> 巡检计划 -> 任务执行结果</a-descriptions-item>
              <a-descriptions-item label="职责边界">本页面只维护标准能力，不绑定具体设施、部件、连接部位或采集位。</a-descriptions-item>
            </a-descriptions>
          </a-space>
        </a-tab-pane>
        <a-tab-pane key="versions" tab="版本记录">
          <a-table :data-source="versionRows" row-key="version" :pagination="false" :columns="versionColumns" />
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getDetectionItemConfigs, type DetectionCategory } from './model'

const route = useRoute()
const router = useRouter()
const item = computed(() => getDetectionItemConfigs().find(x => x.id === String(route.params.id)))

function normalizeTargetTypes(values: string[]) {
  return values.map((value) => {
    if (value === '组成部件') return '设施部件'
    if (value === '接口与连接') return '连接部位'
    return value
  })
}

const resultColumns = computed(() => {
  const category = item.value?.category
  const columns: any[] = [
    { title: '结果名称', dataIndex: 'name', key: 'name' },
    { title: '结果编码', dataIndex: 'code', key: 'code', width: 150 }
  ]
  if (category === '视觉识别' || category === '安全行为') {
    columns.push({ title: '识别标签/状态', dataIndex: 'indicator', key: 'indicator', width: 160 })
  } else if (category === '热成像') {
    columns.push({ title: '温度指标', dataIndex: 'indicator', key: 'indicator', width: 150 })
  } else if (category === '气体检测') {
    columns.push({ title: '气体类型', dataIndex: 'indicator', key: 'indicator', width: 150 })
  } else {
    columns.push({ title: '判定指标', dataIndex: 'indicator', key: 'indicator', width: 150 })
  }
  if (shouldShowUnit(category)) columns.push({ title: '单位', dataIndex: 'unit', key: 'unit', width: 100 })
  if (shouldShowThreshold(category)) {
    columns.push({ title: '正常范围', dataIndex: 'normalRange', key: 'normalRange', width: 140 })
    columns.push({ title: '预警阈值', dataIndex: 'warningThreshold', key: 'warningThreshold', width: 120 })
    columns.push({ title: '告警阈值', dataIndex: 'alarmThreshold', key: 'alarmThreshold', width: 120 })
  }
  if (category === '热成像' || category === '气体检测') {
    columns.push({ title: '严重阈值', dataIndex: 'severeThreshold', key: 'severeThreshold', width: 120 })
  }
  columns.push(
    { title: '判定口径', dataIndex: 'judgmentBasis', key: 'judgmentBasis', width: 220 },
    { title: '风险等级', dataIndex: 'riskLevel', key: 'riskLevel', width: 120 },
    { title: '生成异常', key: 'generateException', width: 100, customRender: ({ record }: any) => (record.generateException ? '是' : '否') },
    { title: '人工复核', key: 'needReview', width: 100, customRender: ({ record }: any) => (record.needReview ? '是' : '否') }
  )
  return columns
})

function shouldShowUnit(category?: DetectionCategory) {
  return category === '热成像' || category === '气体检测' || category === '环境监测'
}

function shouldShowThreshold(category?: DetectionCategory) {
  return category === '热成像' || category === '气体检测' || category === '远传对比' || category === '环境监测'
}

const versionColumns = [
  { title: '版本号', dataIndex: 'version', key: 'version', width: 120 },
  { title: '发布状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '发布时间', dataIndex: 'time', key: 'time', width: 180 },
  { title: '变更说明', dataIndex: 'change', key: 'change' }
]

const versionRows = computed(() => item.value ? [{ version: item.value.version, status: item.value.publishStatus, time: new Date(item.value.updatedAt).toLocaleString('zh-CN', { hour12: false }), change: '首版配置' }] : [])

function goBack() { router.push('/implementation/detection-item-config/list') }
</script>
