<template>
  <div class="installation-form-page">
    <a-page-header :title="isEdit ? '编辑装置' : '新增装置'" @back="goBack" />

    <a-card style="margin-top: 16px">
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :xs="24" :md="12">
            <a-form-item label="装置名称" required>
              <a-input v-model:value="form.name" placeholder="请输入装置名称" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="装置编号" required>
              <a-input v-model:value="form.code" placeholder="请输入装置编号" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :xs="24" :md="12">
            <a-form-item label="位号" required>
              <a-input v-model:value="form.installationPositionNo" placeholder="请输入装置位号" />
            </a-form-item>
          </a-col>
          <a-col :xs="24" :md="12">
            <a-form-item label="巡检区域" required>
              <a-select v-model:value="form.areaId" placeholder="请选择巡检区域" @change="syncArea">
                <a-select-option v-for="area in areaOptions" :key="area.id" :value="area.id">{{ area.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :xs="24" :md="12">
            <a-form-item label="备注">
              <a-input v-model:value="form.remark" placeholder="请输入备注" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-alert style="margin-bottom: 16px" type="info" show-icon message="装置仅维护基础属性，状态和类型作为兼容字段内部保留，不在此页面展示。" />

        <div class="actions">
          <a-space>
            <a-button @click="goBack">取消</a-button>
            <a-button type="primary" @click="handleSave">保存</a-button>
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
import { useInspectionStore } from '@/stores/inspection'
import { DeviceStatus, type Installation } from '@/types/inspection'

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()

const isEdit = computed(() => Boolean(route.params.id))
const currentId = computed(() => String(route.params.id || ''))
const current = computed(() => inspectionStore.installations.find((item) => item.id === currentId.value))

const form = reactive({
  name: '',
  code: '',
  installationPositionNo: '',
  areaId: '',
  areaName: '',
  remark: ''
})

const areaOptions = computed(() => {
  const map = new Map<string, string>()
  inspectionStore.inspectionPoints.forEach((point) => {
    if (point.areaId) map.set(point.areaId, point.areaName || point.areaId)
  })
  inspectionStore.inspectionDevices.forEach((device) => {
    if (device.areaId) map.set(device.areaId, device.areaName || device.areaId)
  })
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
})

function syncArea(id: string) {
  const area = areaOptions.value.find((item) => item.id === id)
  form.areaName = area?.name || ''
}

function goBack() {
  router.push('/implementation/device/installation-list')
}

function fillForm(data?: Installation) {
  Object.assign(form, {
    name: data?.name || '',
    code: data?.code || '',
    installationPositionNo: data?.installationPositionNo || '',
    areaId: data?.areaId || '',
    areaName: data?.areaName || '',
    remark: data?.remark || ''
  })
}

function handleSave() {
  if (!form.name.trim() || !form.code.trim() || !form.installationPositionNo.trim() || !form.areaId) {
    message.error('请补齐装置名称、编号、位号和巡检区域')
    return
  }

  const now = new Date()
  inspectionStore.saveInstallation({
    id: currentId.value || `inst-${Date.now()}`,
    name: form.name.trim(),
    code: form.code.trim(),
    installationPositionNo: form.installationPositionNo.trim(),
    areaId: form.areaId,
    areaName: form.areaName,
    installationType: current.value?.installationType || '通用装置',
    status: current.value?.status || DeviceStatus.ACTIVE,
    remark: form.remark,
    createdAt: current.value?.createdAt || now,
    updatedAt: now
  })
  message.success('装置已保存')
  goBack()
}

onMounted(() => {
  inspectionStore.initialize()
  fillForm(current.value)
})
</script>

<style scoped>
.actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
</style>
