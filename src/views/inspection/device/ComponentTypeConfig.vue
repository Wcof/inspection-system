<template>
  <div class="component-type-config">
    <a-page-header title="巡检对象类型配置" sub-title="维护巡检对象类型字典（CRUD）">
      <template #extra>
        <a-button type="primary" @click="openCreate">新增类型</a-button>
      </template>
    </a-page-header>

    <a-card style="margin-top: 16px">
      <div class="search-panel">
        <a-form layout="vertical" :model="searchForm" @submit.prevent>
          <a-row :gutter="[16, 8]" align="bottom">
            <a-col :xs="24" :sm="12" :md="8">
              <a-form-item label="类型编码" class="search-item">
                <a-input v-model:value="searchForm.code" placeholder="请输入类型编码" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8">
              <a-form-item label="类型名称" class="search-item">
                <a-input v-model:value="searchForm.name" placeholder="请输入类型名称" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8">
              <a-form-item label="描述关键词" class="search-item">
                <a-input v-model:value="searchForm.description" placeholder="请输入描述关键词" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="24" :md="24">
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

      <a-table :columns="columns" :data-source="filteredTypes" row-key="id" :pagination="false">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'updatedAt'">{{ formatDate(record.updatedAt) }}</template>
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
      :title="editingId ? '编辑巡检对象类型' : '新增巡检对象类型'"
      @ok="save"
      @cancel="modalOpen = false"
    >
      <a-form layout="vertical">
        <a-form-item label="类型编码" required>
          <a-input v-model:value="form.code" placeholder="例如 valve" />
        </a-form-item>
        <a-form-item label="类型名称" required>
          <a-input v-model:value="form.name" placeholder="例如 阀门" />
        </a-form-item>
        <a-form-item label="描述">
          <a-input v-model:value="form.description" placeholder="可选" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'

interface ComponentTypeRow {
  id: string
  code: string
  name: string
  description: string
  updatedAt: string
}

const STORAGE_KEY = 'inspection_component_type_configs'

const modalOpen = ref(false)
const editingId = ref('')
const types = ref<ComponentTypeRow[]>(loadInitial())

const form = reactive({
  code: '',
  name: '',
  description: ''
})
const searchForm = reactive({
  code: '',
  name: '',
  description: ''
})

const columns = [
  { title: '类型编码', dataIndex: 'code', key: 'code', width: 180 },
  { title: '类型名称', dataIndex: 'name', key: 'name', width: 180 },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '更新时间', key: 'updatedAt', width: 180 },
  { title: '操作', key: 'actions', width: 140 }
]

const filteredTypes = computed(() => {
  const code = searchForm.code.trim().toLowerCase()
  const name = searchForm.name.trim().toLowerCase()
  const description = searchForm.description.trim().toLowerCase()
  return types.value.filter((item) => {
    const matchesCode = !code || item.code.toLowerCase().includes(code)
    const matchesName = !name || item.name.toLowerCase().includes(name)
    const matchesDescription = !description || item.description.toLowerCase().includes(description)
    return matchesCode && matchesName && matchesDescription
  })
})

function loadInitial() {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw) {
    try {
      return JSON.parse(raw) as ComponentTypeRow[]
    } catch {
      return []
    }
  }
  const defaults: ComponentTypeRow[] = [
    { id: 'ct-1', code: 'valve', name: '阀门', description: '阀门类巡检对象', updatedAt: new Date().toISOString() },
    { id: 'ct-2', code: 'pressure_gauge', name: '压力表', description: '压力监测表计', updatedAt: new Date().toISOString() }
  ]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults))
  return defaults
}

function persist() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(types.value))
}

function resetForm() {
  form.code = ''
  form.name = ''
  form.description = ''
}

function openCreate() {
  editingId.value = ''
  resetForm()
  modalOpen.value = true
}

function openEdit(record: ComponentTypeRow) {
  editingId.value = record.id
  form.code = record.code
  form.name = record.name
  form.description = record.description
  modalOpen.value = true
}

function save() {
  if (!form.code.trim() || !form.name.trim()) {
    message.error('请填写类型编码和类型名称')
    return
  }

  const duplicated = types.value.find(item => item.code === form.code.trim() && item.id !== editingId.value)
  if (duplicated) {
    message.error('类型编码已存在')
    return
  }

  const now = new Date().toISOString()
  if (editingId.value) {
    types.value = types.value.map((item) =>
      item.id === editingId.value
        ? { ...item, code: form.code.trim(), name: form.name.trim(), description: form.description.trim(), updatedAt: now }
        : item
    )
    message.success('巡检对象类型已更新')
  } else {
    types.value.push({ id: `ct-${Date.now()}`, code: form.code.trim(), name: form.name.trim(), description: form.description.trim(), updatedAt: now })
    message.success('巡检对象类型已新增')
  }

  persist()
  modalOpen.value = false
}

function remove(id: string) {
  Modal.confirm({
    title: '确认删除该巡检对象类型？',
    okText: '确认',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk() {
      types.value = types.value.filter(item => item.id !== id)
      persist()
      message.success('已删除')
    }
  })
}

function formatDate(date: string) {
  const d = new Date(date)
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleString('zh-CN', { hour12: false })
}

function resetSearch() {
  searchForm.code = ''
  searchForm.name = ''
  searchForm.description = ''
}
</script>

<style scoped lang="css">
.search-panel {
  margin-bottom: 12px;
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}

.search-item {
  margin-bottom: 0;
}

.search-actions {
  min-height: 32px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
}
</style>
