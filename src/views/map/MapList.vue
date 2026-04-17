<template>
  <div class="map-list">
    <a-page-header title="地图列表" sub-title="管理巡检地图">
      <template #extra>
        <a-button type="primary" @click="goToEditor">
          <a-icon type="plus" />
          新建地图
        </a-button>
      </template>
    </a-page-header>

    <a-card style="margin-top: 16px">
      <div class="search-panel">
        <a-form layout="vertical" :model="searchForm" @submit.prevent>
          <a-row :gutter="[16, 8]">
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="地图名称" class="search-item">
                <a-input v-model:value="searchForm.name" placeholder="请输入地图名称" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="创建时间" class="search-item">
                <a-input v-model:value="searchForm.createdAt" placeholder="YYYY-MM-DD" allow-clear />
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
      <a-table :columns="columns" :data-source="filteredMaps" :loading="loading" row-key="id">
        <template #expandedRowRender="{ record }">
          <div class="map-children">
            <div class="map-children-title">分区</div>
            <a-space wrap>
              <a-tag v-for="region in (record.regions || [])" :key="region.id" :color="region.color">
                {{ region.name }}
              </a-tag>
              <span v-if="!record.regions || !record.regions.length">暂无分区</span>
            </a-space>
          </div>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'image'">
            <img v-if="record.imageUrl" :src="record.imageUrl" alt="地图预览" style="width: 100px; height: 100px; object-fit: cover" />
            <span v-else>-</span>
          </template>
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="goToAreaManage(record.id)">区域管理</a-button>
              <a-button type="link" size="small" @click="goToPointManage(record.id)">点位设置</a-button>
              <a-button type="link" size="small" @click="goToEditor(record.id)">编辑</a-button>
              <a-button type="link" size="small" danger @click="handleDelete(record.id)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import type { InspectionMap } from '@/types/inspection'
import { message, Modal } from 'ant-design-vue'

const router = useRouter()
const inspectionStore = useInspectionStore()

const maps = ref<InspectionMap[]>([])
const loading = ref(false)
const searchForm = reactive({
  name: '',
  createdAt: ''
})

const columns = [
  { title: '地图名称', dataIndex: 'name', key: 'name' },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '预览图', key: 'image', width: 120 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  { title: '操作', key: 'actions', width: 220 }
]

function fetchMaps() {
  loading.value = true
  try {
    inspectionStore.fetchAllInspectionMaps()
    maps.value = inspectionStore.inspectionMaps
  } finally {
    loading.value = false
  }
}

function goToEditor(id?: string) {
  if (id) {
    router.push(`/implementation/map/editor/${id}`)
  } else {
    router.push('/implementation/map/editor')
  }
}

function goToPointManage(mapId: string) {
  router.push(`/implementation/map/point-manage?mapId=${mapId}`)
}

function goToAreaManage(mapId: string) {
  router.push(`/implementation/map/area-manage?mapId=${mapId}`)
}

function handleDelete(id: string) {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这个地图吗？',
    okText: '确定',
    cancelText: '取消',
    onOk() {
      inspectionStore.deleteInspectionMap(id)
      fetchMaps()
      message.success('删除成功')
    }
  })
}

function handleSearch() {
  // 由 filteredMaps 计算属性过滤
}

function handleReset() {
  searchForm.name = ''
  searchForm.createdAt = ''
}

const filteredMaps = computed(() => {
  const name = searchForm.name.trim().toLowerCase()
  const createdAt = searchForm.createdAt.trim()
  return maps.value.filter(map => {
    const matchesName = !name || map.name.toLowerCase().includes(name)
    const createdText = map.createdAt ? new Date(map.createdAt).toISOString().slice(0, 10) : ''
    const matchesCreatedAt = !createdAt || createdText.includes(createdAt)
    return matchesName && matchesCreatedAt
  })
})

onMounted(() => {
  inspectionStore.initialize()
  fetchMaps()
})
</script>

<style scoped lang="css">.map-list {
  width: 100%;
}
.map-list :deep(.ant-card) {
  border-radius: 10px;
  border-color: #f0f0f0;
  box-shadow: none;
}
.map-list :deep(.ant-card-body) {
  padding: 16px;
}
.map-list .search-panel {
  margin-bottom: 12px;
  padding: 12px 12px 4px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}
.map-list .search-item {
  margin-bottom: 8px;
}
.map-list .search-actions {
  display: flex;
  justify-content: flex-end;
  margin: 4px 0 8px;
}
.map-list :deep(.ant-table) {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}
.map-list :deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  white-space: nowrap;
}
.map-list :deep(.ant-table-tbody > tr > td) {
  vertical-align: middle;
}
.map-list .map-children {
  padding: 4px 0;
}
.map-list .map-children-title {
  margin-bottom: 8px;
  color: #8c8c8c;
  font-size: 12px;
}
@media (max-width: 992px) {
  .map-list :deep(.ant-card-body) {
    padding: 12px;
  }
}
</style>
