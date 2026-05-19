<template>
  <div class="resource-base-config">
    <a-page-header title="资源基础配置" sub-title="机器人优先巡检区域配置" />
    
    <a-card class="resource-card" style="margin-top: 16px">
      <div class="search-panel">
        <a-form layout="vertical" :model="searchForm" @submit.prevent>
          <a-row :gutter="[16, 8]" align="bottom">
            <a-col :xs="24" :sm="12" :md="6">
              <a-form-item label="区域" class="search-item">
                <a-select v-model:value="searchForm.area" placeholder="请选择区域" allow-clear>
                  <a-select-option v-for="area in areaOptions" :key="area.value" :value="area.value">
                    {{ area.label }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="6">
              <a-form-item label="优先指派机器人" class="search-item">
                <a-select v-model:value="searchForm.robot" placeholder="请选择机器人" allow-clear>
                  <a-select-option v-for="robot in robotOptions" :key="robot.value" :value="robot.value">
                    {{ robot.label }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="6">
              <div class="search-actions">
                <a-space>
                  <a-button type="primary">搜索</a-button>
                  <a-button @click="resetSearch">重置</a-button>
                </a-space>
              </div>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <a-alert
        class="dispatch-priority-tip"
        type="info"
        show-icon
        message="这里配置机器人优先巡检的区域。规划生成任务时，系统会优先按照区域配置指派机器人；当本区域机器人没有空闲资源时，才会跨区域调度其他区域的空闲机器人。"
      />

      <div class="toolbar">
        <div class="toolbar-left">
          <span class="toolbar-title">区域优先指派配置</span>
          <a-tag color="blue">共 {{ filteredConfigRules.length }} 条</a-tag>
        </div>
        <a-space>
          <a-button type="primary" @click="handleAddRule">
            <template #icon><PlusOutlined /></template>
            新增规则
          </a-button>
        </a-space>
      </div>

      <div class="table-wrap">
        <a-table :data-source="filteredConfigRules" row-key="id" :pagination="false">
          <a-table-column title="区域" data-index="area">
            <template #default="{ record }">
              <a-select 
                v-if="record.editing" 
                v-model:value="record.area" 
                style="width: 100%"
              >
                <a-select-option 
                  v-for="area in getAvailableAreas(record.id)" 
                  :key="area.value" 
                  :value="area.value"
                >
                  {{ area.label }}
                </a-select-option>
              </a-select>
              <span v-else>{{ getAreaLabel(record.area) }}</span>
            </template>
          </a-table-column>
          <a-table-column title="优先指派机器人" data-index="robots">
            <template #default="{ record }">
              <a-select 
                v-if="record.editing"
                v-model:value="record.robots" 
                mode="multiple" 
                style="width: 100%"
                placeholder="请选择优先指派机器人"
              >
                <a-select-option v-for="robot in robotOptions" :key="robot.value" :value="robot.value">
                  {{ robot.label }}
                </a-select-option>
              </a-select>
              <template v-else>
                <a-tag v-for="robotId in record.robots" :key="robotId" style="margin-bottom: 4px">
                  {{ getRobotLabel(robotId) }}
                </a-tag>
              </template>
            </template>
          </a-table-column>
          <a-table-column title="备注" data-index="remark">
            <template #default="{ record }">
              <a-input 
                v-if="record.editing" 
                v-model:value="record.remark" 
                placeholder="请输入备注"
              />
              <span v-else>{{ record.remark || '-' }}</span>
            </template>
          </a-table-column>
          <a-table-column title="操作" fixed="right" width="180">
            <template #default="{ record }">
              <a-space>
                <a-button 
                  v-if="!record.editing" 
                  type="link" 
                  size="small" 
                  @click="handleEditRule(record)"
                >
                  编辑
                </a-button>
                <template v-else>
                  <a-button type="link" size="small" @click="handleSaveRule(record)">
                    保存
                  </a-button>
                  <a-button type="link" size="small" @click="handleCancelEdit(record)">
                    取消
                  </a-button>
                </template>
                <a-popconfirm
                  title="确定要删除这条规则吗？"
                  ok-text="确定"
                  cancel-text="取消"
                  @confirm="handleDeleteRule(record.id)"
                >
                  <a-button type="link" size="small" danger>
                    删除
                  </a-button>
                </a-popconfirm>
              </a-space>
            </template>
          </a-table-column>
        </a-table>
      </div>

      <div class="footer-actions">
        <a-space>
          <a-button type="primary" @click="handleSave">保存配置</a-button>
          <a-button @click="handleReset">重置</a-button>
        </a-space>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'

interface ConfigRule {
  id: string
  area: string
  robots: string[]
  remark: string
  editing?: boolean
}

const areaOptions = [
  { value: 'area_a', label: 'A区' },
  { value: 'area_b', label: 'B区' },
  { value: 'area_c', label: 'C区' },
  { value: 'area_d', label: 'D区' }
]

const robotOptions = [
  { value: 'robot-1', label: '巡检机器人 A' },
  { value: 'robot-2', label: '巡检机器人 B' },
  { value: 'robot-3', label: '巡检机器人 C' }
]

let nextId = 4

const configRules = ref<ConfigRule[]>([
  { id: '1', area: 'area_a', robots: ['robot-1'], remark: 'A区任务优先指派巡检机器人 A' },
  { id: '2', area: 'area_b', robots: ['robot-1', 'robot-2'], remark: 'B区任务优先从 A、B 两台机器人中调度' },
  { id: '3', area: 'area_c', robots: ['robot-2'], remark: 'C区任务优先指派巡检机器人 B' }
])

const searchForm = reactive({
  area: '',
  robot: ''
})

const filteredConfigRules = computed(() => {
  return configRules.value.filter((rule) => {
    const matchesArea = !searchForm.area || rule.area === searchForm.area
    const matchesRobot = !searchForm.robot || rule.robots.includes(searchForm.robot)
    return matchesArea && matchesRobot
  })
})

function getAreaLabel(value: string): string {
  const area = areaOptions.find(a => a.value === value)
  return area ? area.label : value
}

function getRobotLabel(value: string): string {
  const robot = robotOptions.find(r => r.value === value)
  return robot ? robot.label : value
}

function getAvailableAreas(currentId: string): typeof areaOptions {
  const usedAreas = configRules.value
    .filter(rule => rule.id !== currentId && !rule.editing)
    .map(rule => rule.area)
  return areaOptions.filter(area => !usedAreas.includes(area.value))
}

function handleAddRule() {
  const availableAreas = getAvailableAreas('')
  if (availableAreas.length === 0) {
    message.warning('所有区域已配置，无法新增')
    return
  }
  
  configRules.value.push({
    id: String(nextId++),
    area: availableAreas[0].value,
    robots: [],
    remark: '',
    editing: true
  })
}

function handleEditRule(record: ConfigRule) {
  record.editing = true
}

function handleSaveRule(record: ConfigRule) {
  const duplicate = configRules.value.find(
    rule => rule.id !== record.id && rule.area === record.area && !rule.editing
  )
  
  if (duplicate) {
    message.error('该区域已存在配置，请选择其他区域')
    return
  }
  
  record.editing = false
  message.success('规则保存成功')
}

function handleCancelEdit(record: ConfigRule) {
  const original = configRules.value.find(r => r.id === record.id)
  if (original && !original.area) {
    handleDeleteRule(record.id)
  } else {
    record.editing = false
  }
}

function handleDeleteRule(id: string) {
  const index = configRules.value.findIndex(rule => rule.id === id)
  if (index !== -1) {
    configRules.value.splice(index, 1)
    message.success('规则删除成功')
  }
}

function handleSave() {
  message.success('配置保存成功')
}

function handleReset() {
  configRules.value = [
    { id: '1', area: 'area_a', robots: ['robot-1'], remark: 'A区任务优先指派巡检机器人 A' },
    { id: '2', area: 'area_b', robots: ['robot-1', 'robot-2'], remark: 'B区任务优先从 A、B 两台机器人中调度' },
    { id: '3', area: 'area_c', robots: ['robot-2'], remark: 'C区任务优先指派巡检机器人 B' }
  ]
  nextId = 4
  message.info('已重置为默认配置')
}

function resetSearch() {
  searchForm.area = ''
  searchForm.robot = ''
}
</script>

<style scoped lang="css">.resource-base-config {
  width: 100%;
}
.resource-base-config .search-panel {
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}
.resource-base-config .search-item {
  margin-bottom: 0;
}
.resource-base-config .search-actions {
  min-height: 32px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}
.resource-base-config .resource-card {
  border-radius: 10px;
}
.resource-base-config .dispatch-priority-tip {
  margin-bottom: 12px;
}
.resource-base-config .toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  row-gap: 12px;
  margin-bottom: 12px;
}
.resource-base-config .toolbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
}
.resource-base-config .toolbar-title {
  font-size: 14px;
  font-weight: 600;
  color: #262626;
}
.resource-base-config .table-wrap {
  overflow-x: auto;
}
.resource-base-config .footer-actions {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  justify-content: flex-end;
}
</style>
