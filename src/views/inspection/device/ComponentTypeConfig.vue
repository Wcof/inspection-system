<template>
  <div class="component-type-config">
    <a-page-header title="部件类型配置" sub-title="维护部件类型字典（CRUD）">
      <template #extra>
        <a-button type="primary" @click="openCreate">新增类型</a-button>
      </template>
    </a-page-header>

    <a-card style="margin-top: 16px">
      <a-table :columns="columns" :data-source="types" row-key="id" :pagination="false">
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
      :title="editingId ? '编辑部件类型' : '新增部件类型'"
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
import { reactive, ref } from 'vue'
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

const columns = [
  { title: '类型编码', dataIndex: 'code', key: 'code', width: 180 },
  { title: '类型名称', dataIndex: 'name', key: 'name', width: 180 },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '更新时间', key: 'updatedAt', width: 180 },
  { title: '操作', key: 'actions', width: 140 }
]

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
    { id: 'ct-1', code: 'valve', name: '阀门', description: '阀门类部件', updatedAt: new Date().toISOString() },
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
    message.success('部件类型已更新')
  } else {
    types.value.push({ id: `ct-${Date.now()}`, code: form.code.trim(), name: form.name.trim(), description: form.description.trim(), updatedAt: now })
    message.success('部件类型已新增')
  }

  persist()
  modalOpen.value = false
}

function remove(id: string) {
  Modal.confirm({
    title: '确认删除该部件类型？',
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
</script>
