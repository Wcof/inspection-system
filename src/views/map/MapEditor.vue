<template>
  <div class="map-editor">
    <a-page-header :title="isEdit ? '编辑地图' : '新建地图'" @back="goBack">
    </a-page-header>

    <a-card style="margin-top: 16px">
      <a-form :model="form" layout="vertical">
        <a-form-item label="地图名称" name="name" :rules="[{ required: true, message: '请输入地图名称' }]">
          <a-input v-model:value="form.name" placeholder="请输入地图名称" />
        </a-form-item>

        <a-form-item label="地图数据包" name="mapPackage" :rules="[{ required: true, message: '请上传地图数据包' }]">
          <a-space direction="vertical" style="width: 100%">
            <a-upload :show-upload-list="false" :before-upload="handlePackageUpload">
              <a-button>
                <a-icon type="upload" />
                上传地图数据包
              </a-button>
            </a-upload>
            <div class="package-meta" v-if="form.mapPackageName">
              <div><span class="meta-label">文件名：</span>{{ form.mapPackageName }}</div>
              <div><span class="meta-label">大小：</span>{{ formatFileSize(form.mapPackageSize || 0) }}</div>
              <div><span class="meta-label">上传时间：</span>{{ form.mapPackageUploadedAt || '-' }}</div>
            </div>
          </a-space>
        </a-form-item>

        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="form.description" placeholder="请输入地图描述" :rows="3" />
        </a-form-item>

        <a-form-item label="地图图片">
          <a-upload
            list-type="picture-card"
            :show-upload-list="false"
            :before-upload="handleBeforeUpload"
            @change="handleImageChange"
          >
            <div v-if="!form.imageUrl">
              <a-icon type="plus" />
              <div style="margin-top: 8px">上传</div>
            </div>
            <img v-else :src="form.imageUrl" alt="地图" style="width: 100%; height: 100%; object-fit: cover" />
          </a-upload>
        </a-form-item>

        <a-divider>地图详情</a-divider>

        <a-card size="small" title="地图分片" class="tile-card">
          <a-table
            :columns="tileColumns"
            :data-source="form.mapTiles"
            row-key="id"
            :pagination="false"
            size="small"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'index'">
                第{{ record.index }}片
              </template>
              <template v-if="column.key === 'size'">
                {{ formatFileSize(record.size) }}
              </template>
              <template v-if="column.key === 'status'">
                <a-tag color="green" v-if="record.status === 'ready'">就绪</a-tag>
                <a-tag color="blue" v-else-if="record.status === 'processing'">处理中</a-tag>
                <a-tag color="red" v-else>失败</a-tag>
              </template>
            </template>
          </a-table>
        </a-card>

        <a-form-item label="使用说明">
          <a-textarea v-model:value="form.usageNotes" placeholder="请输入使用说明" :rows="3" />
        </a-form-item>

        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSave" :loading="saving">保存</a-button>
            <a-button @click="goBack">取消</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import type { InspectionMap, MapTile } from '@/types/inspection'
import { message } from 'ant-design-vue'

const router = useRouter()
const route = useRoute()
const inspectionStore = useInspectionStore()

const saving = ref(false)
const isEdit = computed(() => !!route.params.id)
const MAP_TILE_CHUNK_SIZE = 2 * 1024 * 1024

const tileColumns = [
  { title: '分片序号', key: 'index', width: 100 },
  { title: '分片名称', dataIndex: 'name', key: 'name' },
  { title: '分片大小', key: 'size', width: 160 },
  { title: '状态', key: 'status', width: 100 }
]

const form = reactive({
  name: '',
  description: '',
  imageUrl: '',
  relatedMaps: '',
  mapPackageName: '',
  mapPackageUrl: '',
  mapPackageSize: 0,
  mapPackageUploadedAt: '',
  mapTiles: [] as MapTile[],
  usageNotes: '',
})

function goBack() {
  router.push('/implementation/map/list')
}

function handleBeforeUpload(file: File) {
  const reader = new FileReader()
  reader.onload = (e) => {
    form.imageUrl = e.target?.result as string
  }
  reader.readAsDataURL(file)
  return false
}

function createMapTiles(file: File): MapTile[] {
  const total = Math.max(1, Math.ceil(file.size / MAP_TILE_CHUNK_SIZE))
  return Array.from({ length: total }, (_, i) => {
    const start = i * MAP_TILE_CHUNK_SIZE
    const end = Math.min(file.size, start + MAP_TILE_CHUNK_SIZE)
    return {
      id: `tile-${Date.now()}-${i + 1}`,
      name: `${file.name}.part${String(i + 1).padStart(2, '0')}`,
      index: i + 1,
      offsetStart: start,
      offsetEnd: end,
      size: end - start,
      status: 'ready'
    }
  })
}

function handlePackageUpload(file: File) {
  form.mapPackageName = file.name
  form.mapPackageSize = file.size
  form.mapPackageUploadedAt = new Date().toLocaleString()
  form.mapPackageUrl = URL.createObjectURL(file)
  form.mapTiles = createMapTiles(file)
  message.success('地图数据包上传成功')
  return false
}

function handleImageChange(info: any) {
  if (info.file.status === 'done') {
    message.success('上传成功')
  } else if (info.file.status === 'error') {
    message.error('上传失败')
  }
}

function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`
  if (size < 1024 * 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(2)} MB`
  return `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

function handleSave() {
  if (!form.name || !form.mapPackageName) {
    message.error('请输入地图名称并上传地图数据包')
    return
  }

  saving.value = true
  try {
    const mapData: InspectionMap = {
      id: isEdit.value ? route.params.id as string : `map-${Date.now()}`,
      name: form.name!,
      description: form.description || '',
      imageUrl: form.imageUrl,
      relatedMaps: form.relatedMaps || '',
      mapPackageName: form.mapPackageName,
      mapPackageUrl: form.mapPackageUrl,
      mapPackageSize: form.mapPackageSize,
      mapPackageUploadedAt: form.mapPackageUploadedAt,
      mapTiles: form.mapTiles,
      usageNotes: form.usageNotes,
      createdAt: isEdit.value ? new Date() : new Date(),
      updatedAt: new Date()
    }

    inspectionStore.saveInspectionMap(mapData)
    message.success(isEdit.value ? '更新成功' : '创建成功')
    goBack()
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  inspectionStore.initialize()
  if (isEdit.value) {
    const map = inspectionStore.getInspectionMapById(route.params.id as string)
    if (map) {
      Object.assign(form, map)
      form.mapTiles = map.mapTiles || []
    }
  }
})
</script>

<style scoped lang="css">.map-editor {
  width: 100%;
}
.map-editor .package-meta {
  padding: 8px 12px;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
  background: #fafafa;
  line-height: 1.8;
}
.map-editor .meta-label {
  color: #666;
}
.map-editor .tile-card {
  margin-bottom: 16px;
}
</style>
