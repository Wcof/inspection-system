<template>
  <div class="standard-component-library">
    <a-page-header title="标准巡检对象库" sub-title="维护可复用的标准巡检对象类型">
      <template #extra>
        <a-button type="primary" @click="openCreate">新增标准巡检对象</a-button>
      </template>
    </a-page-header>

    <a-card style="margin-top: 16px">
      <div class="search-panel">
        <a-form layout="vertical" :model="searchForm" @submit.prevent>
          <a-row :gutter="[16, 8]">
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="巡检对象名称" class="search-item">
                <a-input v-model:value="searchForm.name" placeholder="请输入巡检对象名称" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="巡检对象类型" class="search-item">
                <a-select v-model:value="searchForm.type" placeholder="请选择巡检对象类型" allow-clear>
                  <a-select-option v-for="item in componentTypeOptions" :key="item.value" :value="item.value">
                    {{ item.label }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="说明" class="search-item">
                <a-input v-model:value="searchForm.description" placeholder="请输入说明关键字" allow-clear />
              </a-form-item>
            </a-col>
          </a-row>
          <div class="search-actions">
            <a-space>
              <a-button type="primary" @click="handleSearch">搜索</a-button>
              <a-button @click="handleReset">重置</a-button>
            </a-space>
          </div>
        </a-form>
      </div>

      <a-table :columns="columns" :data-source="filteredComponents" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            {{ getTypeText(record.type) }}
          </template>
          <template v-else-if="column.key === 'updatedAt'">
            {{ formatDate(record.updatedAt) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="openEdit(record)">编辑</a-button>
              <a-button type="link" size="small" danger @click="remove(record.id)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="modalOpen"
      :title="editingId ? '编辑标准巡检对象' : '新增标准巡检对象'"
      @ok="save"
      @cancel="modalOpen = false"
    >
      <a-form layout="vertical">
        <a-form-item label="巡检对象名称" required>
          <a-input v-model:value="form.name" placeholder="请输入巡检对象名称" />
        </a-form-item>
        <a-form-item label="巡检对象类型" required>
          <a-select v-model:value="form.type" placeholder="请选择巡检对象类型">
            <a-select-option v-for="item in componentTypeOptions" :key="item.value" :value="item.value">
              {{ item.label }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="说明">
          <a-textarea v-model:value="form.description" :rows="3" placeholder="可选" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { Modal, message } from 'ant-design-vue'
import { useInspectionStore } from '@/stores/inspection'
import type { StandardComponent } from '@/types/inspection'

const inspectionStore = useInspectionStore()
const modalOpen = ref(false)
const editingId = ref('')

const form = reactive({
  name: '',
  type: 'valve' as StandardComponent['type'],
  description: ''
})
const searchForm = reactive({
  name: '',
  type: undefined as StandardComponent['type'] | undefined,
  description: ''
})
const appliedSearch = reactive({
  name: '',
  type: undefined as StandardComponent['type'] | undefined,
  description: ''
})

const columns = [
  { title: '巡检对象名称', dataIndex: 'name', key: 'name' },
  { title: '巡检对象类型', key: 'type', width: 180 },
  { title: '说明', dataIndex: 'description', key: 'description' },
  { title: '更新时间', key: 'updatedAt', width: 180 },
  { title: '操作', key: 'actions', width: 140 }
]

const componentTypeOptions: Array<{ value: StandardComponent['type']; label: string }> = [
  { value: 'valve', label: '阀门' },
  { value: 'meter', label: '压力表' },
  { value: 'temperature_gauge', label: '温度表' },
  { value: 'flange', label: '法兰' },
  { value: 'pipe', label: '管体' },
  { value: 'motor', label: '电机' },
  { value: 'cable', label: '电缆' },
  { value: 'joint', label: '接头' },
  { value: 'sensor', label: '传感器' },
  { value: 'screw', label: '螺杆' },
  { value: 'other', label: '其他' }
]

const filteredComponents = computed(() => {
  const name = appliedSearch.name.trim().toLowerCase()
  const description = appliedSearch.description.trim().toLowerCase()
  return inspectionStore.standardComponents.filter((component) => {
    const componentName = component.name.toLowerCase()
    const componentDescription = String(component.description || '').toLowerCase()
    const matchesName = !name || componentName.includes(name)
    const matchesType = !appliedSearch.type || component.type === appliedSearch.type
    const matchesDescription = !description || componentDescription.includes(description)
    return matchesName && matchesType && matchesDescription
  })
})

function formatDate(date?: Date | string) {
  if (!date) return '-'
  const next = new Date(date)
  return Number.isNaN(next.getTime()) ? '-' : next.toLocaleString('zh-CN', { hour12: false })
}

function getTypeText(type: StandardComponent['type']) {
  return componentTypeOptions.find((item) => item.value === type)?.label || type
}

function handleSearch() {
  appliedSearch.name = searchForm.name.trim()
  appliedSearch.type = searchForm.type
  appliedSearch.description = searchForm.description.trim()
}

function handleReset() {
  searchForm.name = ''
  searchForm.type = undefined
  searchForm.description = ''
  appliedSearch.name = ''
  appliedSearch.type = undefined
  appliedSearch.description = ''
}

function resetForm() {
  form.name = ''
  form.type = 'valve'
  form.description = ''
}

function openCreate() {
  editingId.value = ''
  resetForm()
  modalOpen.value = true
}

function openEdit(record: StandardComponent) {
  editingId.value = record.id
  form.name = record.name
  form.type = record.type
  form.description = record.description || ''
  modalOpen.value = true
}

function save() {
  if (!form.name.trim()) {
    message.error('请填写巡检对象名称')
    return
  }

  const now = new Date()
  const payload: StandardComponent = {
    id: editingId.value || `std-comp-${Date.now()}`,
    name: form.name.trim(),
    type: form.type,
    description: form.description.trim(),
    createdAt: editingId.value
      ? inspectionStore.standardComponents.find(item => item.id === editingId.value)?.createdAt || now
      : now,
    updatedAt: now
  }

  inspectionStore.saveStandardComponent(payload)
  modalOpen.value = false
  message.success(editingId.value ? '标准巡检对象已更新' : '标准巡检对象已新增')
}

function remove(id: string) {
  Modal.confirm({
    title: '确认删除该标准巡检对象？',
    okText: '确认',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk() {
      inspectionStore.deleteStandardComponent(id)
      message.success('已删除')
    }
  })
}

onMounted(() => {
  inspectionStore.initialize()
  inspectionStore.fetchAllStandardComponents()
})
</script>

<style scoped lang="css">
.search-panel {
  margin-bottom: 12px;
  padding: 12px 12px 4px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}
.search-item {
  margin-bottom: 8px;
}
.search-actions {
  display: flex;
  justify-content: flex-end;
  margin: 4px 0 8px;
}
</style>
