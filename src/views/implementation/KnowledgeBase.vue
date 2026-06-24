<template>
  <div>
    <a-page-header title="知识库管理" sub-title="管理安全生产条例、规程、图纸等知识文件">
      <template #extra>
        <a-button type="primary" @click="showUploadModal = true">
          <UploadOutlined /> 上传文件
        </a-button>
      </template>
    </a-page-header>

    <a-card style="margin-top: 16px">
      <a-table :data-source="files" row-key="id" :pagination="{ pageSize: 10 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'type'">
            <a-tag :color="typeColor(record.type)">{{ typeLabel(record.type) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'uploadTime'">
            {{ formatDate(record.uploadTime) }}
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="previewFile(record)">预览</a-button>
              <a-popconfirm title="确认删除该文件？" @confirm="removeFile(record.id)">
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
        <template #emptyText>
          <a-empty description="暂无知识库文件，请上传" />
        </template>
      </a-table>
    </a-card>

    <!-- 上传弹窗 -->
    <a-modal v-model:open="showUploadModal" title="上传知识文件" @ok="handleUpload" :confirm-loading="uploading">
      <a-form layout="vertical">
        <a-form-item label="文件名称" required>
          <a-input v-model:value="uploadForm.name" placeholder="如：安全生产规程V2.0" />
        </a-form-item>
        <a-form-item label="文件类型" required>
          <a-select v-model:value="uploadForm.type">
            <a-select-option value="pdf">PDF 文档</a-select-option>
            <a-select-option value="doc">Word 文档</a-select-option>
            <a-select-option value="image">图纸/图片</a-select-option>
            <a-select-option value="video">视频教程</a-select-option>
            <a-select-option value="other">其他</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="文件大小">
          <a-input v-model:value="uploadForm.size" placeholder="如：2.5MB" />
        </a-form-item>
        <a-form-item label="文件描述">
          <a-textarea v-model:value="uploadForm.description" :rows="2" placeholder="简要描述文件内容" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 预览弹窗 -->
    <a-modal v-model:open="showPreviewModal" :title="previewFileItem?.name" :footer="null" width="640">
      <a-descriptions :column="1" bordered size="small">
        <a-descriptions-item label="文件名称">{{ previewFileItem?.name }}</a-descriptions-item>
        <a-descriptions-item label="文件类型">{{ typeLabel(previewFileItem?.type || 'other') }}</a-descriptions-item>
        <a-descriptions-item label="上传时间">{{ formatDate(previewFileItem?.uploadTime || '') }}</a-descriptions-item>
        <a-descriptions-item label="文件大小">{{ previewFileItem?.size || '-' }}</a-descriptions-item>
        <a-descriptions-item label="文件描述">{{ previewFileItem?.description || '-' }}</a-descriptions-item>
      </a-descriptions>
      <div style="margin-top: 16px; padding: 24px; background: #fafafa; border-radius: 4px; text-align: center; color: #999">
        <FileTextOutlined style="font-size: 48px; display: block; margin-bottom: 8px" />
        <span>mock 文件预览（真实环境下可在线查看 PDF/图片）</span>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { message } from 'ant-design-vue'
import { UploadOutlined, FileTextOutlined } from '@ant-design/icons-vue'
import { MockService } from '@/mock/mockService'
import type { KnowledgeFile, KnowledgeFileType } from '@/types/ai'

const files = ref<KnowledgeFile[]>([])
const showUploadModal = ref(false)
const showPreviewModal = ref(false)
const previewFileItem = ref<KnowledgeFile | null>(null)
const uploading = ref(false)
const uploadForm = ref<Partial<KnowledgeFile>>({
  name: '',
  type: 'pdf',
  size: '',
  description: ''
})

onMounted(() => {
  loadFiles()
})

function loadFiles() {
  files.value = MockService.getKnowledgeFiles().map((f: any) => ({
    ...f,
    type: (['pdf', 'doc', 'image', 'video', 'other'].includes(f.type) ? f.type : 'other') as KnowledgeFileType
  }))
}

async function handleUpload() {
  if (!uploadForm.value.name?.trim()) {
    message.warning('请输入文件名称')
    return
  }
  uploading.value = true
  // mock 模拟上传延迟
  await new Promise(resolve => setTimeout(resolve, 500))
  MockService.saveKnowledgeFile({
    id: `kf-${Date.now()}`,
    name: uploadForm.value.name.trim(),
    type: uploadForm.value.type || 'other',
    size: uploadForm.value.size || '-',
    description: uploadForm.value.description || '',
    uploadTime: new Date().toISOString()
  })
  uploading.value = false
  showUploadModal.value = false
  uploadForm.value = { name: '', type: 'pdf', size: '', description: '' }
  loadFiles()
  message.success('文件上传成功')
}

function removeFile(id: string) {
  MockService.deleteKnowledgeFile(id)
  loadFiles()
  message.success('已删除')
}

function previewFile(item: KnowledgeFile) {
  previewFileItem.value = item
  showPreviewModal.value = true
}

function typeColor(type?: KnowledgeFileType): string {
  const map: Record<string, string> = { pdf: 'red', doc: 'blue', image: 'green', video: 'purple', other: 'default' }
  return map[type || 'other']
}

function typeLabel(type?: KnowledgeFileType): string {
  const map: Record<string, string> = { pdf: 'PDF', doc: 'Word', image: '图片', video: '视频', other: '其他' }
  return map[type || 'other']
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}
</script>

<style scoped>
</style>
