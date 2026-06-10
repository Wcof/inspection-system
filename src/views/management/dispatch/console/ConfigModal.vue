<template>
  <a-modal
    :open="open"
    :title="`变更配置 — ${point?.name || ''}`"
    @ok="handleSave"
    @cancel="handleCancel"
    centered
    :width="480"
    wrap-class-name="hud-modal"
  >
    <a-form layout="vertical" class="config-form-hud">
      <a-form-item label="巡检装置">
        <a-select
          v-model:value="form.deviceId"
          placeholder="选择巡检装置"
          allow-clear
          popup-class-name="hud-dropdown"
          @change="onDeviceChange"
        >
          <a-select-option v-for="d in devices" :key="d.id" :value="d.id">
            {{ d.name }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="巡检设施设备">
        <a-select
          v-model:value="form.facilityId"
          placeholder="选择巡检设施设备"
          allow-clear
          popup-class-name="hud-dropdown"
          :disabled="!form.deviceId"
          @change="onFacilityChange"
        >
          <a-select-option v-for="f in filteredFacilities" :key="f.id" :value="f.id">
            {{ f.name }}
          </a-select-option>
        </a-select>
      </a-form-item>

      <a-form-item label="巡检对象">
        <a-select
          v-model:value="form.objectId"
          placeholder="选择巡检对象"
          allow-clear
          popup-class-name="hud-dropdown"
          :disabled="!form.facilityId"
        >
          <a-select-option v-for="o in filteredObjects" :key="o.id" :value="o.id">
            {{ o.name }}
          </a-select-option>
        </a-select>
      </a-form-item>
    </a-form>

    <template #footer>
      <a-button class="hud-modal-btn" @click="handleCalibrate">校准</a-button>
      <a-button type="primary" class="hud-modal-btn primary" @click="handleSave">保存</a-button>
    </template>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { MockService } from '@/mock/mockService'
import type { InspectionPoint } from '@/types/inspection'
import { CalibrationStatus } from '@/types/inspection'

const props = defineProps<{
  open: boolean
  point: InspectionPoint | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  saved: []
}>()

const form = ref({
  deviceId: undefined as string | undefined,
  facilityId: undefined as string | undefined,
  objectId: undefined as string | undefined
})

// 数据源
const devices = MockService.getInspectionDevices()
const installations = MockService.getInstallations()
const facilityComponents = MockService.getFacilityComponents()

// 级联过滤
const filteredFacilities = computed(() => {
  if (!form.value.deviceId) return []
  const device = devices.find(d => d.id === form.value.deviceId)
  if (!device) return []
  const deviceComponents = device.assetComponents || []
  const facilityIds = new Set(deviceComponents.map(c => c.id))
  return installations.filter(i => facilityIds.has(i.id) || i.installationType === device.name)
})

const filteredObjects = computed(() => {
  if (!form.value.facilityId) return []
  return facilityComponents.filter(c => c.facilityId === form.value.facilityId)
})

// 初始化表单
watch(() => props.open, (val) => {
  if (val && props.point) {
    const existing = props.point.coverageObjects?.[0]
    form.value = {
      deviceId: existing?.deviceId || undefined,
      facilityId: existing?.componentId || undefined,
      objectId: existing?.id || undefined
    }
  }
})

function onDeviceChange() {
  form.value.facilityId = undefined
  form.value.objectId = undefined
}

function onFacilityChange() {
  form.value.objectId = undefined
}

function handleSave() {
  if (!props.point) return
  const point = MockService.getInspectionPointById(props.point.id)
  if (point) {
    const device = devices.find(d => d.id === form.value.deviceId)
    const facility = filteredFacilities.value.find(f => f.id === form.value.facilityId)
    const obj = filteredObjects.value.find(o => o.id === form.value.objectId)

    point.coverageObjects = [{
      id: form.value.objectId || form.value.facilityId || form.value.deviceId || '',
      type: 'component',
      name: obj?.name || facility?.name || device?.name || '',
      deviceId: form.value.deviceId,
      componentId: form.value.objectId,
      coverageType: 'primary',
      coverageStatus: 'coverable',
      requiredCoverage: true
    }]
    MockService.saveInspectionPoint(point)
  }
  emit('saved')
  emit('update:open', false)
}

function handleCalibrate() {
  if (!props.point) return
  const point = MockService.getInspectionPointById(props.point.id)
  if (point) {
    point.calibrationStatus = CalibrationStatus.CALIBRATED
    point.calibratedAt = new Date()
    MockService.saveInspectionPoint(point)
  }
  emit('saved')
  emit('update:open', false)
}

function handleCancel() {
  emit('update:open', false)
}
</script>

<style scoped lang="less">
.config-form-hud {
  padding-top: 12px;

  :deep(.ant-form-item) {
    margin-bottom: 20px;
  }

  :deep(.ant-form-item-label > label) {
    color: rgba(255, 255, 255, 0.7) !important;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.5px;
  }
}
</style>
