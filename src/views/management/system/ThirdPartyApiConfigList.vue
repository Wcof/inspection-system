<template>
  <div class="third-party-api-config">
    <a-page-header title="第三方接口配置" sub-title="管理第三方 API 配置，用于同步第三方任务到临时任务列表" />
    
    <a-card style="margin-top: 16px">
      <div class="toolbar">
        <a-button type="primary" @click="openDrawer('add')">新增配置</a-button>
      </div>
      
      <a-table :columns="columns" :data-source="store.configs" row-key="id" :loading="store.loading">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'enabled'">
            <a-switch :checked="record.enabled" @change="() => store.toggleEnabled(record.id)" />
          </template>
          <template v-else-if="column.key === 'method'">
            <a-tag :color="record.method === 'GET' ? 'blue' : 'green'">{{ record.method }}</a-tag>
          </template>
          <template v-else-if="column.key === 'requestMode'">
            <a-tag>{{ record.requestMode }}</a-tag>
          </template>
          <template v-else-if="column.key === 'lastTestAt'">
            {{ record.lastTestAt ? new Date(record.lastTestAt).toLocaleString() : '-' }}
          </template>
          <template v-else-if="column.key === 'lastTestStatus'">
            <a-tag v-if="record.lastTestStatus === 'success'" color="green">成功</a-tag>
            <a-tag v-else-if="record.lastTestStatus === 'fail'" color="red">失败</a-tag>
            <span v-else>-</span>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="testConnection(record)">测试连接</a-button>
              <a-button type="link" size="small" @click="openDrawer('edit', record)">编辑</a-button>
              <a-popconfirm title="确定删除该配置？" @confirm="store.deleteConfig(record.id)">
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 配置编辑 Drawer -->
    <a-drawer
      :title="drawerMode === 'add' ? '新增配置' : '编辑配置'"
      :open="drawerVisible"
      width="640"
      @close="closeDrawer"
    >
      <a-form layout="vertical" :model="form" @submit.prevent="handleSave">
        <!-- A. 系统信息 -->
        <a-divider>系统信息</a-divider>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="系统名称" required>
              <a-input v-model:value="form.systemName" placeholder="如：EHS系统" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="系统编码" required>
              <a-input v-model:value="form.systemCode" placeholder="如：EHS" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="接口名称" required>
              <a-input v-model:value="form.apiName" placeholder="如：获取作业票列表" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="启用状态">
              <a-switch v-model:checked="form.enabled" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="请求模式">
              <a-select v-model:value="form.requestMode">
                <a-select-option value="mock">Mock（本地演示）</a-select-option>
                <a-select-option value="direct">Direct（直接请求）</a-select-option>
                <a-select-option value="proxy">Proxy（后端代理）</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="备注">
              <a-input v-model:value="form.remark" placeholder="可选备注" />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- B. 请求配置 -->
        <a-divider>请求配置</a-divider>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="请求方式" required>
              <a-select v-model:value="form.method">
                <a-select-option value="GET">GET</a-select-option>
                <a-select-option value="POST">POST</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="超时时间(ms)" required>
              <a-input-number v-model:value="form.timeoutMs" :min="1000" :max="60000" :step="1000" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="Content-Type">
              <a-select v-model:value="form.contentType">
                <a-select-option value="application/json">application/json</a-select-option>
                <a-select-option value="application/xml">application/xml</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="接口地址" required>
          <a-input v-model:value="form.url" placeholder="https://api.example.com/v1/tasks" />
        </a-form-item>
        <a-form-item label="请求头 (Key-Value)">
          <div v-for="(item, i) in form.headers" :key="i" style="display: flex; gap: 8px; margin-bottom: 8px">
            <a-input v-model:value="item.key" placeholder="Key" style="width: 200px" />
            <a-input v-model:value="item.value" placeholder="Value" style="width: 200px" />
            <a-button type="link" danger @click="form.headers.splice(i, 1)">删除</a-button>
          </div>
          <a-button type="dashed" size="small" @click="form.headers.push({ key: '', value: '' })">+ 添加请求头</a-button>
        </a-form-item>
        <a-form-item label="查询参数 (Key-Value)">
          <div v-for="(item, i) in form.queryParams" :key="i" style="display: flex; gap: 8px; margin-bottom: 8px">
            <a-input v-model:value="item.key" placeholder="Key" style="width: 200px" />
            <a-input v-model:value="item.value" placeholder="Value" style="width: 200px" />
            <a-button type="link" danger @click="form.queryParams.splice(i, 1)">删除</a-button>
          </div>
          <a-button type="dashed" size="small" @click="form.queryParams.push({ key: '', value: '' })">+ 添加查询参数</a-button>
        </a-form-item>
        <a-form-item v-if="form.method === 'POST'" label="请求 Body (JSON)">
          <a-textarea v-model:value="form.bodyTemplate" rows="4" placeholder='{"startTime": "{{today}}", "type": "inspection"}' />
        </a-form-item>

        <!-- C. 认证配置 -->
        <a-divider>认证配置</a-divider>
        <a-form-item label="认证方式">
          <a-select v-model:value="form.authType">
            <a-select-option value="none">无认证</a-select-option>
            <a-select-option value="bearer">Bearer Token</a-select-option>
            <a-select-option value="api_key">API Key</a-select-option>
            <a-select-option value="basic">Basic Auth</a-select-option>
          </a-select>
        </a-form-item>
        <template v-if="form.authType === 'bearer'">
          <a-form-item label="Token">
            <a-input-password v-model:value="form.bearerToken" placeholder="输入 Bearer Token" />
          </a-form-item>
        </template>
        <template v-if="form.authType === 'api_key'">
          <a-row :gutter="16">
            <a-col :span="8">
              <a-form-item label="Key 名称">
                <a-input v-model:value="form.apiKeyName" placeholder="X-API-Key" />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="Key 值">
                <a-input-password v-model:value="form.apiKeyValue" placeholder="值" />
              </a-form-item>
            </a-col>
            <a-col :span="8">
              <a-form-item label="位置">
                <a-select v-model:value="form.apiKeyPlacement">
                  <a-select-option value="header">Header</a-select-option>
                  <a-select-option value="query">Query</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
        </template>
        <template v-if="form.authType === 'basic'">
          <a-row :gutter="16">
            <a-col :span="12">
              <a-form-item label="用户名">
                <a-input v-model:value="form.basicUsername" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="密码">
                <a-input-password v-model:value="form.basicPassword" />
              </a-form-item>
            </a-col>
          </a-row>
        </template>

        <!-- D. 响应解析 -->
        <a-divider>响应解析</a-divider>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="成功状态路径">
              <a-input v-model:value="form.successPath" placeholder="data.success" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="成功值">
              <a-input v-model:value="form.successValue" placeholder="true" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="错误消息路径">
              <a-input v-model:value="form.messagePath" placeholder="data.message" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="任务数组路径" required>
          <a-input v-model:value="form.listPath" placeholder="data.records" />
        </a-form-item>

        <!-- E. 字段映射 -->
        <a-divider>字段映射</a-divider>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="第三方任务编号" required>
              <a-input v-model:value="form.externalTaskIdPath" placeholder="taskId" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="任务名称" required>
              <a-input v-model:value="form.taskNamePath" placeholder="name" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="巡检点编码" required>
              <a-input v-model:value="form.pointCodePath" placeholder="pointCode" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="描述路径">
              <a-input v-model:value="form.descriptionPath" placeholder="description" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="执行时间路径">
              <a-input v-model:value="form.plannedExecuteAtPath" placeholder="executeTime" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="优先级路径">
              <a-input v-model:value="form.priorityPath" placeholder="priority" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="风险等级路径">
              <a-input v-model:value="form.riskLevelPath" placeholder="riskLevel" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="任务场景路径">
              <a-input v-model:value="form.businessScenePath" placeholder="scene" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="机器人编码路径">
              <a-input v-model:value="form.robotCodePath" placeholder="robotCode" />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- F. 默认值 -->
        <a-divider>默认值</a-divider>
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="默认机器人" required>
              <a-select v-model:value="form.defaultRobotId" placeholder="选择默认机器人">
                <a-select-option v-for="r in robots" :key="r.id" :value="r.id">{{ r.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="默认任务场景">
              <a-select v-model:value="form.defaultBusinessScene">
                <a-select-option value="daily_inspection">日常巡检</a-select-option>
                <a-select-option value="hazard_screening">隐患排查</a-select-option>
                <a-select-option value="environment_check">环境检查</a-select-option>
                <a-select-option value="operation_guard">作业监护</a-select-option>
                <a-select-option value="work_ticket_guard">作业票监护</a-select-option>
                <a-select-option value="emergency_arrival">应急到场</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="默认优先级">
              <a-select v-model:value="form.defaultPriorityLevel">
                <a-select-option value="normal">普通</a-select-option>
                <a-select-option value="high">高</a-select-option>
                <a-select-option value="emergency">应急</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="默认风险等级">
              <a-select v-model:value="form.defaultRiskLevel">
                <a-select-option value="normal">正常</a-select-option>
                <a-select-option value="warning">警告</a-select-option>
                <a-select-option value="alarm">告警</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="默认执行时长(分)">
              <a-input-number v-model:value="form.durationMinutes" :min="1" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>

      <!-- 测试结果 -->
      <div v-if="testResult" style="margin-bottom: 16px; padding: 12px; border: 1px solid #d9d9d9; border-radius: 4px; background: #fafafa">
        <h4>测试结果</h4>
        <p :style="{ color: testResult.success ? '#52c41a' : '#ff4d4f' }">
          {{ testResult.message }}
        </p>
        <p v-if="testResult.status">HTTP 状态: {{ testResult.status }} | 耗时: {{ testResult.elapsed }}ms</p>
        <p v-if="testResult.parsedCount !== undefined">解析任务数: {{ testResult.parsedCount }}</p>
        <div v-if="testResult.mappingPreview && testResult.mappingPreview.length > 0">
          <p>字段映射预览（前3条）:</p>
          <pre style="font-size: 12px; background: #f0f0f0; padding: 8px; border-radius: 4px">{{ JSON.stringify(testResult.mappingPreview, null, 2) }}</pre>
        </div>
        <div v-if="testResult.preview">
          <p>响应预览:</p>
          <pre style="font-size: 12px; background: #f0f0f0; padding: 8px; border-radius: 4px; max-height: 200px; overflow: auto">{{ testResult.preview }}</pre>
        </div>
      </div>

      <div class="drawer-footer">
        <a-space>
          <a-button @click="testConnectionFromForm" :loading="testing">测试连接</a-button>
          <a-button type="primary" @click="handleSave" :loading="saving">保存</a-button>
          <a-button @click="closeDrawer">取消</a-button>
        </a-space>
      </div>
    </a-drawer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import { message } from 'ant-design-vue'
import { useThirdPartyIntegrationStore } from '@/stores/thirdPartyIntegration'
import { useRobotStore } from '@/stores/robot'
import { testConnection as testConnectionService } from '@/services/thirdPartyIntegration'
import type { ThirdPartyApiConfig, KeyValueItem } from '@/types/third-party'

const store = useThirdPartyIntegrationStore()
const robotStore = useRobotStore()

const drawerVisible = ref(false)
const drawerMode = ref<'add' | 'edit'>('add')
const editingId = ref<string>('')
const testing = ref(false)
const saving = ref(false)
const testResult = ref<any>(null)

const form = reactive({
  systemName: '',
  systemCode: '',
  apiName: '',
  enabled: true,
  requestMode: 'mock' as 'mock' | 'direct' | 'proxy',
  method: 'GET' as 'GET' | 'POST',
  url: '',
  timeoutMs: 10000,
  contentType: 'application/json',
  headers: [] as KeyValueItem[],
  queryParams: [] as KeyValueItem[],
  bodyTemplate: '',
  authType: 'none' as string,
  bearerToken: '',
  apiKeyName: '',
  apiKeyValue: '',
  apiKeyPlacement: 'header' as 'header' | 'query',
  basicUsername: '',
  basicPassword: '',
  successPath: '',
  successValue: '',
  messagePath: '',
  listPath: 'data.records',
  externalTaskIdPath: 'taskId',
  taskNamePath: 'name',
  pointCodePath: 'pointCode',
  descriptionPath: '',
  plannedExecuteAtPath: '',
  priorityPath: '',
  riskLevelPath: '',
  businessScenePath: '',
  robotCodePath: '',
  defaultRobotId: '',
  defaultBusinessScene: 'daily_inspection' as any,
  defaultPriorityLevel: 'normal' as any,
  defaultRiskLevel: 'normal' as any,
  durationMinutes: 60,
  remark: ''
})

const robots = computed(() => robotStore.robots)

const columns = [
  { title: '系统名称', dataIndex: 'systemName', key: 'systemName', width: 140 },
  { title: '系统编码', dataIndex: 'systemCode', key: 'systemCode', width: 100 },
  { title: '接口名称', dataIndex: 'apiName', key: 'apiName', width: 160 },
  { title: '请求方式', key: 'method', width: 80 },
  { title: '接口地址', dataIndex: 'url', key: 'url', ellipsis: true },
  { title: '请求模式', key: 'requestMode', width: 100 },
  { title: '启用', key: 'enabled', width: 60 },
  { title: '最近测试', key: 'lastTestAt', width: 160 },
  { title: '测试结果', key: 'lastTestStatus', width: 80 },
  { title: '操作', key: 'actions', width: 200, fixed: 'right' }
]

function openDrawer(mode: 'add' | 'edit', record?: any) {
  drawerMode.value = mode
  testResult.value = null
  if (mode === 'edit' && record) {
    editingId.value = record.id
    form.systemName = record.systemName
    form.systemCode = record.systemCode
    form.apiName = record.apiName
    form.enabled = record.enabled
    form.requestMode = record.requestMode
    form.method = record.method
    form.url = record.url
    form.timeoutMs = record.timeoutMs
    form.contentType = record.contentType
    form.headers = record.headers?.map((h: any) => ({ ...h })) || []
    form.queryParams = record.queryParams?.map((h: any) => ({ ...h })) || []
    form.bodyTemplate = record.bodyTemplate || ''
    form.authType = record.auth?.type || 'none'
    form.bearerToken = record.auth?.bearerToken || ''
    form.apiKeyName = record.auth?.apiKey?.keyName || ''
    form.apiKeyValue = record.auth?.apiKey?.keyValue || ''
    form.apiKeyPlacement = record.auth?.apiKey?.placement || 'header'
    form.basicUsername = record.auth?.basic?.username || ''
    form.basicPassword = record.auth?.basic?.password || ''
    form.successPath = record.responseMapping?.successPath || ''
    form.successValue = record.responseMapping?.successValue || ''
    form.messagePath = record.responseMapping?.messagePath || ''
    form.listPath = record.responseMapping?.listPath || 'data.records'
    form.externalTaskIdPath = record.fieldMapping?.externalTaskIdPath || 'taskId'
    form.taskNamePath = record.fieldMapping?.taskNamePath || 'name'
    form.pointCodePath = record.fieldMapping?.pointCodePath || 'pointCode'
    form.descriptionPath = record.fieldMapping?.descriptionPath || ''
    form.plannedExecuteAtPath = record.fieldMapping?.plannedExecuteAtPath || ''
    form.priorityPath = record.fieldMapping?.priorityPath || ''
    form.riskLevelPath = record.fieldMapping?.riskLevelPath || ''
    form.businessScenePath = record.fieldMapping?.businessScenePath || ''
    form.robotCodePath = record.fieldMapping?.robotCodePath || ''
    form.defaultRobotId = record.defaults?.robotId || ''
    form.defaultBusinessScene = record.defaults?.businessScene || 'daily_inspection'
    form.defaultPriorityLevel = record.defaults?.priorityLevel || 'normal'
    form.defaultRiskLevel = record.defaults?.riskLevel || 'normal'
    form.durationMinutes = record.defaults?.durationMinutes || 60
    form.remark = record.remark || ''
  } else {
    editingId.value = ''
    form.systemName = ''
    form.systemCode = ''
    form.apiName = ''
    form.enabled = true
    form.requestMode = 'mock'
    form.method = 'GET'
    form.url = ''
    form.timeoutMs = 10000
    form.contentType = 'application/json'
    form.headers = []
    form.queryParams = []
    form.bodyTemplate = ''
    form.authType = 'none'
    form.bearerToken = ''
    form.apiKeyName = ''
    form.apiKeyValue = ''
    form.apiKeyPlacement = 'header'
    form.basicUsername = ''
    form.basicPassword = ''
    form.successPath = ''
    form.successValue = ''
    form.messagePath = ''
    form.listPath = 'data.records'
    form.externalTaskIdPath = 'taskId'
    form.taskNamePath = 'name'
    form.pointCodePath = 'pointCode'
    form.descriptionPath = ''
    form.plannedExecuteAtPath = ''
    form.priorityPath = ''
    form.riskLevelPath = ''
    form.businessScenePath = ''
    form.robotCodePath = ''
    form.defaultRobotId = ''
    form.defaultBusinessScene = 'daily_inspection'
    form.defaultPriorityLevel = 'normal'
    form.defaultRiskLevel = 'normal'
    form.durationMinutes = 60
    form.remark = ''
  }
  drawerVisible.value = true
}

function closeDrawer() {
  drawerVisible.value = false
  testResult.value = null
}

function buildConfigFromForm(): any {
  const auth: any = { type: form.authType }
  if (form.authType === 'bearer') auth.bearerToken = form.bearerToken
  if (form.authType === 'api_key') {
    auth.apiKey = { keyName: form.apiKeyName, keyValue: form.apiKeyValue, placement: form.apiKeyPlacement }
  }
  if (form.authType === 'basic') {
    auth.basic = { username: form.basicUsername, password: form.basicPassword }
  }

  return {
    id: editingId.value || undefined,
    systemName: form.systemName,
    systemCode: form.systemCode,
    apiName: form.apiName,
    enabled: form.enabled,
    requestMode: form.requestMode,
    method: form.method,
    url: form.url,
    timeoutMs: form.timeoutMs,
    contentType: form.contentType,
    headers: form.headers.filter(h => h.key),
    queryParams: form.queryParams.filter(h => h.key),
    bodyTemplate: form.method === 'POST' ? form.bodyTemplate : undefined,
    auth,
    responseMapping: {
      successPath: form.successPath || undefined,
      successValue: form.successValue || undefined,
      messagePath: form.messagePath || undefined,
      listPath: form.listPath
    },
    fieldMapping: {
      externalTaskIdPath: form.externalTaskIdPath,
      taskNamePath: form.taskNamePath,
      pointCodePath: form.pointCodePath,
      descriptionPath: form.descriptionPath || undefined,
      plannedExecuteAtPath: form.plannedExecuteAtPath || undefined,
      priorityPath: form.priorityPath || undefined,
      riskLevelPath: form.riskLevelPath || undefined,
      businessScenePath: form.businessScenePath || undefined,
      robotCodePath: form.robotCodePath || undefined
    },
    defaults: {
      robotId: form.defaultRobotId,
      businessScene: form.defaultBusinessScene,
      priorityLevel: form.defaultPriorityLevel,
      riskLevel: form.defaultRiskLevel,
      durationMinutes: form.durationMinutes,
      autoStart: false,
      notifyOnComplete: false,
      notifyOnError: false,
      autoResumeAfterInterrupt: false
    },
    remark: form.remark || undefined
  }
}

async function handleSave() {
  // 基本校验
  if (!form.systemName) { message.warning('请输入系统名称'); return }
  if (!form.systemCode) { message.warning('请输入系统编码'); return }
  if (!form.apiName) { message.warning('请输入接口名称'); return }
  if (!form.url) { message.warning('请输入接口地址'); return }
  if (!form.listPath) { message.warning('请输入任务数组路径'); return }
  if (!form.externalTaskIdPath) { message.warning('请输入第三方任务编号路径'); return }
  if (!form.taskNamePath) { message.warning('请输入任务名称路径'); return }
  if (!form.pointCodePath) { message.warning('请输入巡检点编码路径'); return }
  if (!form.defaultRobotId) { message.warning('请选择默认机器人'); return }

  if (form.method === 'POST' && form.bodyTemplate) {
    try { JSON.parse(form.bodyTemplate) } catch { message.warning('Body 格式不是合法 JSON'); return }
  }

  saving.value = true
  try {
    const config = buildConfigFromForm()
    const success = store.saveConfig(config)
    if (success) {
      message.success('保存成功')
      closeDrawer()
    } else {
      message.error('系统编码已存在')
    }
  } finally {
    saving.value = false
  }
}

async function testConnectionFromForm() {
  if (!form.url) { message.warning('请先填写接口地址'); return }
  testing.value = true
  testResult.value = null
  try {
    const config = buildConfigFromForm() as ThirdPartyApiConfig
    const result = await testConnectionService(config)
    testResult.value = result
    // 更新测试结果到配置
    const existing = store.configs.find(c => c.id === editingId.value)
    if (existing) {
      existing.lastTestAt = new Date().toISOString()
      existing.lastTestStatus = result.success ? 'success' : 'fail'
      existing.lastTestMessage = result.message
      store.saveConfig(existing)
    }
  } finally {
    testing.value = false
  }
}

async function testConnection(record: any) {
  testing.value = true
  testResult.value = null
  try {
    openDrawer('edit', record)
    drawerVisible.value = true
    const result = await testConnectionService(record as ThirdPartyApiConfig)
    testResult.value = result
    record.lastTestAt = new Date().toISOString()
    record.lastTestStatus = result.success ? 'success' : 'fail'
    record.lastTestMessage = result.message
    store.saveConfig(record)
  } finally {
    testing.value = false
  }
}

onMounted(() => {
  store.initialize()
  robotStore.initialize()
})
</script>

<script lang="ts">
import { computed } from 'vue'
</script>

<style scoped lang="css">
.third-party-api-config { width: 100%; }
.toolbar { margin-bottom: 16px; }
.drawer-footer { position: absolute; bottom: 0; left: 0; right: 0; padding: 12px 24px; border-top: 1px solid #f0f0f0; background: #fff; text-align: right; }
</style>