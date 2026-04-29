<template>
  <div>
    <a-page-header :title="isEdit ? '编辑检测规则' : '新增检测规则'" @back="goBack" />

    <a-card style="margin-top:16px">
      <a-form layout="vertical">
        <a-divider orientation="left">基础信息</a-divider>
        <a-row :gutter="16">
          <a-col :span="8"><a-form-item label="规则名称" required><a-input v-model:value="form.name" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="规则编码" required><a-input v-model:value="form.code" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="检测类别" required><a-select v-model:value="form.category" @change="handleCategoryChange"><a-select-option v-for="v in categories" :key="v" :value="v">{{ v }}</a-select-option></a-select></a-form-item></a-col>
        </a-row>
        <a-form-item label="配置说明"><a-textarea v-model:value="form.description" :rows="3" /></a-form-item>

        <a-divider orientation="left">适用对象范围</a-divider>
        <a-alert
          type="info"
          show-icon
          style="margin-bottom: 12px"
          message="适用对象类别按层级分组选择：第一层是设施、设施部件、连接部位等对象层级，第二层是该层级下的标准类别。这里不选择具体设施实例。"
        />
        <a-form-item label="适用对象层级" required>
          <a-select v-model:value="form.targetTypes" mode="multiple" @change="handleTargetTypeChange">
            <a-select-option v-for="v in targetTypes" :key="v" :value="v">{{ v }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="适用对象类别" required>
          <a-select
            v-model:value="targetDetailList"
            mode="multiple"
            :disabled="!form.targetTypes.length"
            placeholder="请先选择适用对象层级，再从分组中勾选标准类别"
          >
            <a-select-opt-group v-for="group in availableTargetGroups" :key="group.type" :label="group.type">
              <a-select-option v-for="item in group.options" :key="`${group.type}-${item}`" :value="item">
                {{ item }}
              </a-select-option>
            </a-select-opt-group>
          </a-select>
          <div class="field-tip">例如先选择“设施部件”，再在该分组下选择“压力表、阀门、法兰”。</div>
        </a-form-item>

        <a-divider orientation="left">结果定义</a-divider>
        <a-alert
          type="info"
          show-icon
          style="margin-bottom: 12px"
          :message="resultDefinitionTip"
        />
        <a-table :data-source="form.results" row-key="id" :pagination="false" size="small" style="margin-bottom:8px" :scroll="{ x: 1600 }">
          <a-table-column title="结果名称"><template #default="{ record }"><a-input v-model:value="record.name" /></template></a-table-column>
          <a-table-column title="结果编码"><template #default="{ record }"><a-input v-model:value="record.code" /></template></a-table-column>
          <a-table-column v-if="form.category === '视觉识别' || form.category === '安全行为'" title="识别标签/状态" width="160">
            <template #default="{ record }"><a-input v-model:value="record.indicator" placeholder="如 指针异常/未戴安全帽" /></template>
          </a-table-column>
          <a-table-column v-else-if="form.category === '热成像'" title="温度指标" width="150">
            <template #default="{ record }"><a-input v-model:value="record.indicator" placeholder="如 最高温/温升" /></template>
          </a-table-column>
          <a-table-column v-else-if="form.category === '气体检测'" title="气体类型" width="150">
            <template #default="{ record }"><a-input v-model:value="record.indicator" placeholder="如 CH4/H2S/VOC" /></template>
          </a-table-column>
          <a-table-column v-else title="判定指标" width="150">
            <template #default="{ record }"><a-input v-model:value="record.indicator" placeholder="如 状态/数值/事件" /></template>
          </a-table-column>
          <a-table-column v-if="form.category === '热成像' || form.category === '气体检测' || form.category === '环境监测'" title="单位" width="110">
            <template #default="{ record }"><a-input v-model:value="record.unit" :placeholder="form.category === '热成像' ? '℃' : 'ppm/%LEL'" /></template>
          </a-table-column>
          <a-table-column v-if="form.category === '热成像' || form.category === '气体检测' || form.category === '远传对比' || form.category === '环境监测'" title="正常范围" width="160">
            <template #default="{ record }"><a-input v-model:value="record.normalRange" placeholder="如 ≤60 / 0-10" /></template>
          </a-table-column>
          <a-table-column v-if="form.category === '热成像' || form.category === '气体检测' || form.category === '环境监测'" title="预警阈值" width="130">
            <template #default="{ record }"><a-input v-model:value="record.warningThreshold" placeholder="如 >60" /></template>
          </a-table-column>
          <a-table-column v-if="form.category === '热成像' || form.category === '气体检测' || form.category === '环境监测'" title="告警阈值" width="130">
            <template #default="{ record }"><a-input v-model:value="record.alarmThreshold" placeholder="如 >80" /></template>
          </a-table-column>
          <a-table-column v-if="form.category === '热成像' || form.category === '气体检测'" title="严重阈值" width="130">
            <template #default="{ record }"><a-input v-model:value="record.severeThreshold" placeholder="如 >100" /></template>
          </a-table-column>
          <a-table-column title="判定口径" width="220">
            <template #default="{ record }"><a-input v-model:value="record.judgmentBasis" placeholder="说明该结果如何判定" /></template>
          </a-table-column>
          <a-table-column title="风险等级" width="120"><template #default="{ record }"><a-input v-model:value="record.riskLevel" /></template></a-table-column>
          <a-table-column title="操作" width="80"><template #default="{ index }"><a-button danger type="link" size="small" @click="removeResult(index)">删除</a-button></template></a-table-column>
        </a-table>
        <a-button @click="addResult">新增结果</a-button>

        <div style="margin-top:16px;display:flex;justify-content:flex-end">
          <a-space>
            <a-button @click="goBack">取消</a-button>
            <a-button type="primary" @click="save('草稿')">保存草稿</a-button>
            <a-button type="primary" @click="save('已发布')">保存并发布</a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { getDetectionItemConfigs, targetCategoryOptions, upsertDetectionItemConfig, type DetectionCategory, type DetectionItemConfig, type PublishStatus, type ResultDef, type TargetType } from './model'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => route.path.includes('/edit/'))
const editId = computed(() => String(route.params.id || ''))

const categories: DetectionCategory[] = ['视觉识别','热成像','气体检测','远传对比','安全行为','设备状态','环境监测','其他']
const targetTypes: TargetType[] = ['设施','设施部件','连接部位','区域环境','人员行为','机器人自身']

const source = isEdit.value ? getDetectionItemConfigs().find(item => item.id === editId.value) : undefined

const form = reactive<DetectionItemConfig>(source ? JSON.parse(JSON.stringify(source)) : {
  id: `dic-${Date.now()}`,
  name: '',
  code: '',
  category: '视觉识别',
  description: '',
  resultType: '数值型',
  needEvidence: true,
  targetTypes: [],
  targetDetails: '',
  collectMethod: '光学图像',
  collectDirection: '',
  collectDistance: '',
  collectNote: '',
  rules: [{ id: `rule-${Date.now()}`, name: '', version: 'V1.0', algorithm: '', status: '启用' }],
  results: [{ id: `result-${Date.now()}`, name: '正常', code: 'NORMAL', group: '业务结果', riskLevel: '提示', needReview: false, generateException: false }],
  version: 'V1.0',
  publishStatus: '草稿',
  enabled: false,
  referenceCount: 0,
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString()
})

form.targetTypes = normalizeTargetTypes(form.targetTypes)
const targetDetailList = ref(parseTargetDetails(form.targetDetails))
const availableTargetGroups = computed(() => form.targetTypes
  .map(type => ({ type, options: targetCategoryOptions[type] || [] }))
  .filter(group => group.options.length))
const availableTargetDetails = computed(() => {
  const values = availableTargetGroups.value.flatMap(group => group.options)
  return Array.from(new Set(values))
})
const resultDefinitionTip = computed(() => {
  if (form.category === '视觉识别') return '视觉识别类结果需要定义识别标签、判定口径和异常结果，例如正常、外观破损、目标缺失、无法读取。'
  if (form.category === '热成像') return '热成像类结果需要定义温度指标、单位、正常范围和预警/告警/严重阈值。'
  if (form.category === '气体检测') return '气体检测类结果需要定义气体类型、单位、正常范围和分级阈值。'
  if (form.category === '安全行为') return '安全行为类结果需要定义行为标签和判定口径，例如未戴安全帽、闯入危险区。'
  return '当前检测类别使用通用结果定义，重点维护判定指标、判定口径、风险等级和是否生成异常。'
})

function goBack() { router.push('/implementation/detection-item-config/list') }
function normalizeTargetTypes(values: string[]) {
  return values.map((value) => {
    if (value === '组成部件') return '设施部件'
    if (value === '接口与连接') return '连接部位'
    return value
  }) as TargetType[]
}
function parseTargetDetails(value: string) {
  return String(value || '')
    .split(/[、,，]/)
    .map(item => item.trim())
    .filter(Boolean)
}
function handleTargetTypeChange() {
  const allowed = new Set(availableTargetDetails.value)
  targetDetailList.value = targetDetailList.value.filter(item => allowed.has(item))
}
function createResult(category: DetectionCategory, overrides: Partial<ResultDef> = {}) {
  const base = {
    id: `result-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: '',
    code: '',
    group: '业务结果' as const,
    riskLevel: '提示',
    needReview: false,
    generateException: false,
    indicator: '',
    unit: category === '热成像' ? '℃' : category === '气体检测' ? 'ppm' : '',
    normalRange: '',
    warningThreshold: '',
    alarmThreshold: '',
    severeThreshold: '',
    judgmentBasis: ''
  }
  return { ...base, ...overrides }
}
function defaultResultsByCategory(category: DetectionCategory) {
  if (category === '热成像') {
    return [
      createResult(category, { name: '正常', code: 'NORMAL', indicator: '最高温', normalRange: '≤60', judgmentBasis: '目标温度处于允许范围内' }),
      createResult(category, { name: '预警', code: 'WARNING', riskLevel: '预警', indicator: '最高温', warningThreshold: '>60', needReview: true, generateException: true, judgmentBasis: '温度超过预警阈值' }),
      createResult(category, { name: '告警', code: 'ALARM', riskLevel: '告警', indicator: '最高温', alarmThreshold: '>80', needReview: true, generateException: true, judgmentBasis: '温度超过告警阈值' }),
      createResult(category, { name: '严重告警', code: 'SEVERE_ALARM', riskLevel: '严重告警', indicator: '最高温', severeThreshold: '>100', needReview: true, generateException: true, judgmentBasis: '温度超过严重告警阈值' })
    ]
  }
  if (category === '气体检测') {
    return [
      createResult(category, { name: '正常', code: 'NORMAL', indicator: '可燃气/VOC', normalRange: '≤10', judgmentBasis: '气体浓度处于正常范围内' }),
      createResult(category, { name: '预警', code: 'WARNING', riskLevel: '预警', indicator: '可燃气/VOC', warningThreshold: '>10', needReview: true, generateException: true, judgmentBasis: '气体浓度超过预警阈值' }),
      createResult(category, { name: '告警', code: 'ALARM', riskLevel: '告警', indicator: '可燃气/VOC', alarmThreshold: '>25', needReview: true, generateException: true, judgmentBasis: '气体浓度超过告警阈值' }),
      createResult(category, { name: '严重告警', code: 'SEVERE_ALARM', riskLevel: '严重告警', indicator: '可燃气/VOC', severeThreshold: '>50', needReview: true, generateException: true, judgmentBasis: '气体浓度超过严重告警阈值' })
    ]
  }
  if (category === '视觉识别') {
    return [
      createResult(category, { name: '正常', code: 'NORMAL', indicator: '目标状态正常', judgmentBasis: '大模型识别目标无异常' }),
      createResult(category, { name: '异常', code: 'ABNORMAL', riskLevel: '告警', indicator: '目标状态异常', needReview: true, generateException: true, judgmentBasis: '大模型识别存在外观破损、状态异常或目标缺失' }),
      createResult(category, { name: '无法读取', code: 'UNREADABLE', group: '采集质量结果', riskLevel: '预警', indicator: '识别失败', needReview: true, generateException: true, judgmentBasis: '图像模糊、反光、遮挡或目标缺失导致无法判定' })
    ]
  }
  if (category === '安全行为') {
    return [
      createResult(category, { name: '正常', code: 'NORMAL', indicator: '人员行为合规', judgmentBasis: '未识别到违规行为' }),
      createResult(category, { name: '违规', code: 'VIOLATION', riskLevel: '告警', indicator: '违规行为', needReview: true, generateException: true, judgmentBasis: '识别到未戴安全帽、吸烟、闯入危险区等行为' })
    ]
  }
  return [
    createResult(category, { name: '正常', code: 'NORMAL', judgmentBasis: '检测结果符合正常口径' }),
    createResult(category, { name: '异常', code: 'ABNORMAL', riskLevel: '告警', needReview: true, generateException: true, judgmentBasis: '检测结果符合异常口径' })
  ]
}
function isInitialResultSet() {
  return form.results.length <= 1 && (!form.results[0] || form.results[0].code === 'NORMAL')
}
function ensureResultFieldsForCategory() {
  form.results = form.results.map(item => ({ ...createResult(form.category), ...item }))
}
function handleCategoryChange() {
  form.collectMethod = form.category === '热成像' ? '热成像' : form.category === '气体检测' ? '气体传感器' : '光学图像'
  form.resultType = form.category === '热成像' || form.category === '气体检测' ? '数值型' : form.category === '视觉识别' ? '图像识别型' : '状态型'
  if (isInitialResultSet()) {
    form.results = defaultResultsByCategory(form.category)
    return
  }
  ensureResultFieldsForCategory()
}
ensureResultFieldsForCategory()
function addResult() { form.results.push(createResult(form.category)) }
function removeResult(index: number) { form.results.splice(index, 1) }

function validateBeforePublish() {
  if (!form.name || !form.code || !form.targetTypes.length || !targetDetailList.value.length || !form.results.length) {
    return false
  }
  return form.results.every(isResultComplete)
}

function isResultComplete(result: ResultDef) {
  if (!result.name || !result.code || !result.riskLevel) return false
  if (form.category === '视觉识别' || form.category === '安全行为') {
    return Boolean(result.indicator && result.judgmentBasis)
  }
  if (form.category === '热成像' || form.category === '气体检测') {
    return Boolean(result.indicator && result.unit && result.judgmentBasis && (result.normalRange || result.warningThreshold || result.alarmThreshold || result.severeThreshold))
  }
  if (form.category === '远传对比' || form.category === '环境监测') {
    return Boolean(result.indicator && result.judgmentBasis && (result.normalRange || result.warningThreshold || result.alarmThreshold))
  }
  return Boolean(result.judgmentBasis)
}

function save(status: PublishStatus) {
  if (!form.name.trim() || !form.code.trim()) {
    message.error('请填写配置名称和配置编码')
    return
  }
  if (status === '已发布' && !validateBeforePublish()) {
    message.error('发布校验未通过，请补全适用对象层级、适用对象类别，以及当前检测类别要求的结果定义字段')
    return
  }

  if (!targetDetailList.value.length) {
    message.error('请选择适用对象类别')
    return
  }

  form.targetDetails = targetDetailList.value.join('、')
  ensureResultFieldsForCategory()
  form.publishStatus = status
  form.enabled = status === '已发布'
  form.updatedAt = new Date().toISOString()
  if (!isEdit.value) {
    form.createdAt = new Date().toISOString()
  }
  upsertDetectionItemConfig(JSON.parse(JSON.stringify(form)))
  message.success(status === '已发布' ? '已保存并发布' : '草稿已保存')
  goBack()
}
</script>

<style scoped>
.field-tip {
  color: #8c8c8c;
  font-size: 12px;
  line-height: 20px;
  margin-top: 4px;
}
</style>
