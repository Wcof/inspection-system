<template>
  <div class="inspection-route-list">
    <a-page-header title="巡检路线" sub-title="管理巡检路线">
      <template #extra>
        <a-button type="primary" @click="goToForm">
          <a-icon type="plus" />
          新建路线
        </a-button>
      </template>
    </a-page-header>

    <a-card style="margin-top: 16px">
      <a-table :columns="columns" :data-source="routes" :loading="loading" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'waypointCount'">
            {{ record.waypointIds.length }}
          </template>
          <template v-if="column.key === 'pointCount'">
            {{ record.inspectionPointIds.length }}
          </template>
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="goToForm(record.id)">编辑</a-button>
              <a-button type="link" size="small" danger @click="handleDelete(record.id)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import type { InspectionRoute } from '@/types/inspection'
import { message, Modal } from 'ant-design-vue'

const router = useRouter()
const inspectionStore = useInspectionStore()

const routes = ref<InspectionRoute[]>([])
const loading = ref(false)

const columns = [
  { title: '路线名称', dataIndex: 'name', key: 'name' },
  { title: '编码', dataIndex: 'code', key: 'code' },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '途径点数量', key: 'waypointCount', width: 120 },
  { title: '巡检点数量', key: 'pointCount', width: 120 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  { title: '操作', key: 'actions', width: 150 }
]

function fetchRoutes() {
  loading.value = true
  try {
    inspectionStore.fetchAllInspectionRoutes()
    routes.value = inspectionStore.inspectionRoutes
  } finally {
    loading.value = false
  }
}

function goToForm(id?: string) {
  if (id) {
    router.push(`/management/inspection/route/form/${id}`)
  } else {
    router.push('/management/inspection/route/form')
  }
}

function handleDelete(id: string) {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这个巡检路线吗？',
    okText: '确定',
    cancelText: '取消',
    onOk() {
      inspectionStore.deleteInspectionRoute(id)
      fetchRoutes()
      message.success('删除成功')
    }
  })
}

onMounted(() => {
  inspectionStore.initialize()
  fetchRoutes()
})
</script>

<style scoped lang="css">.inspection-route-list {
  width: 100%;
}
.inspection-route-list :deep(.ant-card) {
  border-radius: 10px;
  border-color: #f0f0f0;
  box-shadow: none;
}
.inspection-route-list :deep(.ant-card-body) {
  padding: 16px;
}
.inspection-route-list :deep(.ant-table) {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}
.inspection-route-list :deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  white-space: nowrap;
}
.inspection-route-list :deep(.ant-table-tbody > tr > td) {
  vertical-align: middle;
}
@media (max-width: 992px) {
  .inspection-route-list :deep(.ant-card-body) {
    padding: 12px;
  }
}
</style>
