<template>
  <div>
    <a-page-header title="检测规则配置" sub-title="检测规则是标准能力库，一条配置对应一种检测能力，可被多个现场对象引用；本页面不绑定具体设施、部件或采集位。">
      <template #extra>
        <a-button type="primary" @click="goCreate">新增规则</a-button>
      </template>
    </a-page-header>

    <a-card style="margin-top:16px">
      <a-form layout="vertical">
        <a-row :gutter="[16,8]">
          <a-col :xs="24" :sm="12" :md="8" :lg="6"><a-form-item label="配置名称"><a-input v-model:value="query.name" allow-clear /></a-form-item></a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6"><a-form-item label="配置分类"><a-select v-model:value="query.category" allow-clear><a-select-option v-for="v in categories" :key="v" :value="v">{{ v }}</a-select-option></a-select></a-form-item></a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6"><a-form-item label="适用对象层级"><a-select v-model:value="query.targetType" allow-clear><a-select-option v-for="v in targetTypes" :key="v" :value="v">{{ v }}</a-select-option></a-select></a-form-item></a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6"><a-form-item label="发布状态"><a-select v-model:value="query.publishStatus" allow-clear><a-select-option v-for="v in publishStatuses" :key="v" :value="v">{{ v }}</a-select-option></a-select></a-form-item></a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6"><a-form-item label="是否需要证据"><a-select v-model:value="query.needEvidence" allow-clear><a-select-option value="yes">是</a-select-option><a-select-option value="no">否</a-select-option></a-select></a-form-item></a-col>
          <a-col :xs="24" :sm="12" :md="8" :lg="6"><a-form-item label="是否启用"><a-select v-model:value="query.enabled" allow-clear><a-select-option value="yes">启用</a-select-option><a-select-option value="no">停用</a-select-option></a-select></a-form-item></a-col>
        </a-row>
      </a-form>

      <a-table :columns="columns" :data-source="filtered" row-key="id" :scroll="{x:1800}">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key==='targetLevel'">{{ normalizeTargetTypes(record.targetTypes).join('、') }}</template>
          <template v-else-if="column.key==='targets'">{{ record.targetDetails }}</template>
          <template v-else-if="column.key==='publishStatus'"><a-tag :color="record.publishStatus === '已发布' ? 'green' : record.publishStatus === '草稿' ? 'gold' : 'default'">{{ record.publishStatus }}</a-tag></template>
          <template v-else-if="column.key==='enabled'"><a-tag :color="record.enabled ? 'green' : 'default'">{{ record.enabled ? '启用' : '停用' }}</a-tag></template>
          <template v-else-if="column.key==='updatedAt'">{{ formatDate(record.updatedAt) }}</template>
          <template v-else-if="column.key==='actions'">
            <a-space>
              <a-button type="link" size="small" @click="goDetail(record.id)">详情</a-button>
              <a-button type="link" size="small" @click="goEdit(record.id)">编辑</a-button>
              <a-button type="link" size="small" @click="copyItem(record)">复制</a-button>
              <a-button type="link" size="small" @click="togglePublish(record)">{{ record.publishStatus === '草稿' ? '发布' : '停用' }}</a-button>
              <a-button type="link" size="small" danger @click="remove(record)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Modal, message } from 'ant-design-vue'
import { deleteDetectionItemConfig, getDetectionItemConfigs, saveDetectionItemConfigs, type DetectionCategory, type DetectionItemConfig, type PublishStatus, type ResultDef, type TargetType } from './model'

const router = useRouter()
const rows = ref<DetectionItemConfig[]>(getDetectionItemConfigs())

const categories: DetectionCategory[] = ['视觉识别','热成像','气体检测','远传对比','安全行为','设备状态','环境监测','其他']
const targetTypes: TargetType[] = ['设施','设施部件','连接部位','区域环境','人员行为','机器人自身']
const publishStatuses: PublishStatus[] = ['草稿','已发布','已停用']

const query = reactive({ name: '', category: '', targetType: '', publishStatus: '', needEvidence: '', enabled: '' })

const columns = [
  { title: '配置名称', dataIndex: 'name', key: 'name', width: 180 },
  { title: '配置编码', dataIndex: 'code', key: 'code', width: 180 },
  { title: '配置分类', dataIndex: 'category', key: 'category', width: 120 },
  { title: '适用对象层级', key: 'targetLevel', width: 140 },
  { title: '适用对象类别', key: 'targets', width: 220 },
  { title: '结果数量', key: 'resultCount', width: 100 },
  { title: '当前版本', dataIndex: 'version', key: 'version', width: 100 },
  { title: '引用数量', dataIndex: 'referenceCount', key: 'referenceCount', width: 100 },
  { title: '发布状态', key: 'publishStatus', width: 100 },
  { title: '启用状态', key: 'enabled', width: 100 },
  { title: '更新时间', key: 'updatedAt', width: 180 },
  { title: '操作', key: 'actions', width: 280, fixed: 'right' as const }
]

const filtered = computed(() => rows.value
  .filter(item => !query.name || item.name.includes(query.name.trim()))
  .filter(item => !query.category || item.category === query.category)
  .filter(item => !query.targetType || normalizeTargetTypes(item.targetTypes).includes(query.targetType as TargetType))
  .filter(item => !query.publishStatus || item.publishStatus === query.publishStatus)
  .filter(item => !query.needEvidence || (query.needEvidence === 'yes' ? item.needEvidence : !item.needEvidence))
  .filter(item => !query.enabled || (query.enabled === 'yes' ? item.enabled : !item.enabled))
  .map(item => ({ ...item, resultCount: item.results.length }))
)

function refresh() { rows.value = getDetectionItemConfigs() }
function formatDate(v: string) { return new Date(v).toLocaleString('zh-CN', { hour12: false }) }
function normalizeTargetTypes(values: string[]) {
  return values.map((value) => {
    if (value === '组成部件') return '设施部件'
    if (value === '接口与连接') return '连接部位'
    return value
  }) as TargetType[]
}
function goCreate() { router.push('/implementation/detection-item-config/create') }
function goEdit(id: string) { router.push(`/implementation/detection-item-config/edit/${id}`) }
function goDetail(id: string) { router.push(`/implementation/detection-item-config/detail/${id}`) }

function copyItem(record: DetectionItemConfig) {
  const now = new Date().toISOString()
  rows.value.push({ ...record, id: `dic-${Date.now()}`, name: `${record.name} 副本`, code: `${record.code}_COPY`, publishStatus: '草稿', enabled: false, referenceCount: 0, version: 'V1.0', createdAt: now, updatedAt: now })
  saveDetectionItemConfigs(rows.value)
  message.success('已复制为草稿配置')
  refresh()
}

function togglePublish(record: DetectionItemConfig) {
  if (record.publishStatus === '草稿') {
    if (!record.targetTypes.length || !record.targetDetails || !record.results.length || !record.results.every(result => isResultComplete(record.category, result))) {
      message.error('发布前校验未通过：请补全适用对象层级、适用对象类别，以及当前检测类别要求的结果定义字段')
      return
    }
    record.publishStatus = '已发布'
    record.enabled = true
  } else {
    record.publishStatus = '已停用'
    record.enabled = false
  }
  record.updatedAt = new Date().toISOString()
  saveDetectionItemConfigs(rows.value)
  refresh()
}

function isResultComplete(category: DetectionCategory, result: ResultDef) {
  if (!result.name || !result.code || !result.riskLevel) return false
  if (category === '视觉识别' || category === '安全行为') {
    return Boolean(result.indicator && result.judgmentBasis)
  }
  if (category === '热成像' || category === '气体检测') {
    return Boolean(result.indicator && result.unit && result.judgmentBasis && (result.normalRange || result.warningThreshold || result.alarmThreshold || result.severeThreshold))
  }
  if (category === '远传对比' || category === '环境监测') {
    return Boolean(result.indicator && result.judgmentBasis && (result.normalRange || result.warningThreshold || result.alarmThreshold))
  }
  return Boolean(result.judgmentBasis)
}

function remove(record: DetectionItemConfig) {
  if (record.referenceCount > 0) {
    message.error('当前检测项配置已被引用，无法删除，可停用。')
    return
  }
  Modal.confirm({ title: '确认删除该配置？', okText: '确认', cancelText: '取消', okButtonProps: { danger: true }, onOk() { deleteDetectionItemConfig(record.id); refresh(); message.success('已删除') } })
}
</script>
