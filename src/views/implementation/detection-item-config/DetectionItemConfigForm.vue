<template>
  <div>
    <a-page-header :title="isEdit ? '编辑检测规则' : '新增检测规则'" @back="goBack" />

    <a-card style="margin-top: 16px">
      <a-form layout="vertical">
        <a-divider orientation="left">基础信息</a-divider>
        <a-row :gutter="16">
          <a-col :span="8"><a-form-item label="规则名称" required><a-input v-model:value="form.name" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="规则编码" required><a-input v-model:value="form.code" /></a-form-item></a-col>
          <a-col :span="8">
            <a-form-item label="检测类型" required>
              <a-select v-model:value="form.detectionType" @change="handleTypeChange">
                <a-select-option v-for="value in detectionTypeOptions" :key="value" :value="value">{{ value }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="检测算法" required>
              <a-select v-model:value="form.detectionAlgorithm" @change="syncRulesFromAlgorithm">
                <a-select-option v-for="value in algorithmOptions" :key="value" :value="value">{{ value }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="状态">
              <a-select v-model:value="form.status">
                <a-select-option value="草稿">草稿</a-select-option>
                <a-select-option value="启用">启用</a-select-option>
                <a-select-option value="停用">停用</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="配置说明"><a-textarea v-model:value="form.description" :rows="3" /></a-form-item>

        <a-divider orientation="left">检测算法规则</a-divider>
        <a-table :data-source="form.rules" row-key="id" :pagination="false" size="small">
          <a-table-column title="算法名称" width="200" data-index="name" />
          <a-table-column title="算法版本" width="120" data-index="version" />
          <a-table-column title="算法标识" width="200" data-index="algorithm" />
          <a-table-column title="状态" width="100" data-index="status" />
          <a-table-column title="大模型增强兜底" width="160">
            <template #default="{ record }">
              <a-switch v-model:checked="record.llmEnabled" checked-children="开" un-checked-children="关" />
            </template>
          </a-table-column>
        </a-table>
        <a-alert
          v-if="hasLlmEnabled"
          type="info"
          show-icon
          style="margin-top: 8px; margin-bottom: 16px"
          message="大模型增强开启后，主算法识别失败时将调用大模型兜底识别，结果备注显示「大模型增强」标识"
        />

        <a-divider orientation="left">结果定义</a-divider>
        <a-alert message="所有检测类型的结果定义字段统一，非必填项留空即可。" type="info" show-icon style="margin-bottom: 12px" />

        <a-table :data-source="form.results" row-key="id" :pagination="false" size="small" :scroll="{ x: 1200 }" style="margin-bottom: 8px">
          <a-table-column title="结果名称" width="130">
            <template #default="{ record }">
              <a-select v-model:value="record.name" style="width: 100%" placeholder="选择结果名称" @change="(val: string) => onResultNameChange(record, val)">
                <a-select-option v-for="item in resultNameOptions" :key="item" :value="item">{{ item }}</a-select-option>
              </a-select>
            </template>
          </a-table-column>
          <a-table-column title="判定指标" width="150">
            <template #default="{ record }">
              <a-select v-model:value="record.indicator" style="width: 100%" placeholder="选择判定指标" allow-clear>
                <a-select-option v-for="item in indicatorOptions" :key="item" :value="item">{{ item }}</a-select-option>
              </a-select>
            </template>
          </a-table-column>
          <a-table-column title="判断口径" width="240">
            <template #default="{ record }"><a-input v-model:value="record.judgmentBasis" placeholder="说明结果如何判定" /></template>
          </a-table-column>
          <a-table-column title="单位" width="90">
            <template #default="{ record }">
              <a-select v-model:value="record.unit" style="width: 100%" placeholder="选填" allow-clear>
                <a-select-option v-for="item in unitOptions" :key="item" :value="item">{{ item }}</a-select-option>
              </a-select>
            </template>
          </a-table-column>
          <a-table-column title="是否报警" width="110">
            <template #default="{ record }">
              <a-radio-group v-model:value="record.generateException" :button-style="'solid'" size="small">
                <a-radio-button :value="true">是</a-radio-button>
                <a-radio-button :value="false">否</a-radio-button>
              </a-radio-group>
            </template>
          </a-table-column>
          <a-table-column title="语音播放" width="300">
            <template #default="{ record }">
              <a-space style="width: 100%" align="start">
                <a-input v-model:value="record.voiceBroadcastText" placeholder="为空则不播放" />
                <a-button :disabled="!record.voiceBroadcastText" @click="playVoice(record.voiceBroadcastText)">
                  播放
                </a-button>
              </a-space>
            </template>
          </a-table-column>
          <a-table-column title="操作" width="70">
            <template #default="{ index }">
              <a-button danger type="link" size="small" @click="removeResult(index)">删除</a-button>
            </template>
          </a-table-column>
        </a-table>

        <a-button @click="addResult">新增结果</a-button>

        <div style="margin-top: 16px; display: flex; justify-content: flex-end">
          <a-space>
            <a-button @click="goBack">取消</a-button>
            <a-button type="primary" @click="save(form.status)">保存</a-button>
            <a-button type="primary" @click="save('启用')">保存并启用</a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import {
  collectMethodByDetectionType,
  codeByName,
  defaultResultsByDetectionType,
  detectionAlgorithmOptions,
  detectionTypeOptions,
  getDetectionItemConfigs,
  indicatorOptions,
  resultNameOptions,
  resultTypeByDetectionType,
  unitOptions,
  upsertDetectionItemConfig,
  type DetectionItemConfig,
  type PublishStatus,
  type ResultDef
} from './model'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => route.path.includes('/edit/'))
const editId = computed(() => String(route.params.id || ''))
const source = computed(() => getDetectionItemConfigs().find(item => item.id === editId.value))

const form = reactive<DetectionItemConfig>(source.value ? JSON.parse(JSON.stringify(source.value)) : {
  id: `dic-${Date.now()}`,
  name: '',
  code: '',
  detectionType: '图像识别',
  detectionAlgorithm: '外观识别',
  category: '图像识别',
  description: '',
  resultType: '图像识别型',
  needEvidence: true,
  collectMethod: '光学图像',
  collectDirection: '',
  collectDistance: '',
  collectNote: '',
  rules: [{ id: `rule-${Date.now()}`, name: '外观识别', version: 'V1.0', algorithm: '外观识别', status: '启用' }],
  results: defaultResultsByDetectionType('图像识别'),
  version: 'V1.0',
  status: '草稿',
  publishStatus: '草稿',
  enabled: false,
  referenceCount: 0,
  updatedAt: new Date().toISOString(),
  createdAt: new Date().toISOString()
})

const algorithmOptions = computed(() => detectionAlgorithmOptions[form.detectionType])
const hasLlmEnabled = computed(() => form.rules.some(r => r.llmEnabled))

function goBack() {
  router.push('/implementation/detection-item-config/list')
}

function ensureRules() {
  form.category = form.detectionType
  form.resultType = resultTypeByDetectionType(form.detectionType)
  form.collectMethod = collectMethodByDetectionType(form.detectionType)
  form.rules = [{ id: `rule-${Date.now()}`, name: form.detectionAlgorithm, version: 'V1.0', algorithm: form.detectionAlgorithm, status: '启用' }]
  if (!form.results.length) {
    form.results = defaultResultsByDetectionType(form.detectionType)
    return
  }
  form.results = form.results.map(result => ({
    ...result,
    voiceBroadcastText: result.voiceBroadcastText || ''
  }))
}

function handleTypeChange() {
  form.detectionAlgorithm = detectionAlgorithmOptions[form.detectionType][0]
  form.results = defaultResultsByDetectionType(form.detectionType)
  ensureRules()
}

function syncRulesFromAlgorithm() {
  ensureRules()
}

function onResultNameChange(record: ResultDef, name: string) {
  record.code = codeByName(name)
}

function addResult() {
  form.results.push({
    id: `result-${Date.now()}`,
    name: '',
    code: '',
    group: '业务结果',
    riskLevel: '提示',
    needReview: false,
    generateException: false,
    indicator: '',
    unit: '',
    judgmentBasis: '',
    voiceBroadcastText: ''
  })
}

function removeResult(index: number) {
  form.results.splice(index, 1)
}

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

function isResultComplete(result: ResultDef) {
  if (!result.name || !result.indicator || !result.judgmentBasis) return false
  return true
}

function save(status: PublishStatus) {
  if (!form.name.trim() || !form.code.trim()) {
    message.error('请填写规则名称和规则编码')
    return
  }
  if (status === '启用' && !form.results.every(isResultComplete)) {
    message.error('启用校验未通过，请补全结果定义')
    return
  }
  ensureRules()
  form.status = status
  form.publishStatus = status
  form.enabled = status === '启用'
  form.updatedAt = new Date().toISOString()
  if (!isEdit.value) {
    form.createdAt = new Date().toISOString()
  }
  upsertDetectionItemConfig(JSON.parse(JSON.stringify(form)))
  message.success(status === '启用' ? '已保存并启用' : status === '停用' ? '已保存并停用' : '草稿已保存')
  goBack()
}

onMounted(() => {
  if (source.value) {
    Object.assign(form, JSON.parse(JSON.stringify(source.value)))
  }
  ensureRules()
})
</script>
