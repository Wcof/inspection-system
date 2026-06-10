<template>
  <div class="facility-device-form">
    <a-page-header :title="isEdit ? '编辑设施' : '新增设施'" @back="goBack" />
    <a-card style="margin-top: 16px">
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="8"><a-form-item label="设施名称" required><a-input v-model:value="form.name" /></a-form-item></a-col>
        <a-col :span="8">
            <a-form-item label="设施类别" required>
              <a-select v-model:value="form.facilityKind">
                <a-select-option value="normal">普通设施</a-select-option>
                <a-select-option value="pipeline">管道类设施</a-select-option>
              </a-select>
          </a-form-item>
          </a-col>
          <a-col :span="8"><a-form-item label="设施编号" required><a-input v-model:value="form.deviceNo" /></a-form-item></a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="8"><a-form-item label="设施位号" required><a-input v-model:value="form.facilityPositionNo" /></a-form-item></a-col>
          <a-col :span="8">
            <a-form-item label="巡检区域" required>
              <a-select v-model:value="form.areaId" @change="syncArea">
                <a-select-option v-for="area in areaOptions" :key="area.id" :value="area.id">{{ area.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="所属装置" required>
              <a-select v-model:value="form.installationId" @change="syncInstallation">
                <a-select-option v-for="item in installationOptions" :key="item.id" :value="item.id">{{ item.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
         
          <a-col :span="8">
            <a-form-item label="设施状态">
              <a-select v-model:value="form.status">
                <a-select-option value="active">在用</a-select-option>
                <a-select-option value="inactive">停用</a-select-option>
                <a-select-option value="maintenance">维护中</a-select-option>
                <a-select-option value="scrapped">报废</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8"><a-form-item label="备注"><a-input v-model:value="form.remark" /></a-form-item></a-col>
        </a-row>

        <a-form-item label="设施照片">
          <div class="facility-photo-editor">
            <div class="facility-photo-preview">
              <img v-if="form.referenceImageUrl" :src="form.referenceImageUrl" alt="设施照片" />
              <span v-else>暂无设施照片</span>
            </div>
            <a-space>
              <a-upload :show-upload-list="false" accept="image/*" :before-upload="handleFacilityPhotoUpload">
                <a-button>上传设施照片</a-button>
              </a-upload>
              <a-button v-if="form.referenceImageUrl" @click="form.referenceImageUrl = ''">移除</a-button>
            </a-space>
          </div>
        </a-form-item>

        <a-card size="small" title="关联巡检对象" class="model-card">
          <a-alert type="info" show-icon style="margin-bottom: 12px" message="设施页不直接维护规则，只显示当前设施下已有巡检对象。若需新增巡检对象，请前往巡检对象。" />
          <a-table :columns="componentColumns" :data-source="facilityComponents" row-key="id" :pagination="false" size="small" />
          <div style="margin-top: 12px">
            <a-button @click="goToComponentManage">去巡检对象</a-button>
          </div>
        </a-card>

        <a-card size="small" title="点位与执行顺序" class="model-card">
          <a-alert
            v-if="!isEdit"
            type="warning"
            show-icon
            style="margin-bottom: 12px"
            message="新增设施请先保存，再配置执行顺序。执行顺序按当前设施下巡检对象与停车点建立绑定。"
          />
          <a-alert
            v-else
            type="info"
            show-icon
            style="margin-bottom: 12px"
            message="新增执行顺序时统一使用同一个停车点，关联巡检对象可在列表中逐条选择。"
          />
          <a-table
            :columns="bindingColumns"
            :data-source="bindingRows"
            row-key="id"
            :pagination="false"
            size="small"
            :scroll="{ x: 1280 }"
            :custom-row="getBindingRowProps"
            :row-class-name="getBindingRowClassName"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'dragHandle'">
                <span class="drag-handle" draggable="true" @dragstart="onDragStart(record.id, $event)" @dragend="onDragEnd">⠿</span>
              </template>
              <template v-else-if="column.key === 'executionOrder'">
                <span class="order-pill">{{ record.executionOrder }}</span>
              </template>
              <template v-else-if="column.key === 'parkingPointId'">
                {{ record.parkingPointName || '-' }}
              </template>
              <template v-else-if="column.key === 'componentIds'">
                <a-select
                  v-model:value="record.componentIds[0]"
                  style="width: 100%"
                  placeholder="请选择关联巡检对象"
                  :options="bindingComponentOptions"
                  :disabled="!facilityComponents.length"
                  @change="(value: string) => handleBindingComponentChange(record, value)"
                />
              </template>
              <template v-else-if="column.key === 'ruleIds'">
                <a-space wrap>
                  <a-tag v-for="item in getRuleNames(record.ruleIds)" :key="item">{{ item }}</a-tag>
                  <span v-if="!getRuleNames(record.ruleIds).length">-</span>
                </a-space>
              </template>
            </template>
          </a-table>
          <a-button style="margin-top: 12px" :disabled="!isEdit" @click="openParkingPicker">新增执行顺序</a-button>
        </a-card>

        <div class="form-actions">
          <a-space>
            <a-button @click="goBack">取消</a-button>
            <a-button type="primary" @click="handleSave">保存</a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>

    <a-modal
      v-model:open="parkingPickerVisible"
      title="框选巡检点（停车点）"
      width="1080px"
      :destroy-on-close="true"
      @ok="confirmParkingPicker"
      @cancel="closeParkingPicker"
    >
      <div class="parking-picker">
        <div class="parking-picker-main">
          <div class="parking-picker-toolbar">
            <a-space>
              <span>地图</span>
              <a-select v-model:value="selectedPickerMapId" style="width: 240px" placeholder="请选择地图" @change="clearPickerSelection">
                <a-select-option v-for="map in pickerMapOptions" :key="map.id" :value="map.id">{{ map.name }}</a-select-option>
              </a-select>
              <a-button size="small" @click="clearPickerSelection">清空选择</a-button>
            </a-space>
          </div>

          <div
            class="parking-picker-map"
            :style="pickerMapStyle"
            @mousedown="startPickerDrag"
            @mousemove="movePickerDrag"
            @mouseup="endPickerDrag"
            @mouseleave="endPickerDrag"
          >
            <div class="parking-picker-mask" />
            <div class="parking-picker-tip">拖拽框选停车点，也可以点击单个停车点进行增减选择。</div>
            <div v-if="selectionBox.visible" class="selection-box" :style="selectionBoxStyle" />
            <div
              v-for="parking in pickerParkingRows"
              :key="parking.parkingId"
              class="parking-point-marker"
              :class="{ selected: pickerSelectedIds.has(parking.parkingId) }"
              :style="{ left: `${parking.x}%`, top: `${parking.y}%` }"
              @mousedown.stop
              @click.stop="togglePickerParking(parking.parkingId)"
            >
              <span class="parking-point-dot">停</span>
              <span class="parking-point-label">{{ parking.pointName }} / {{ parking.parkingName }}</span>
            </div>
          </div>
        </div>

        <div class="parking-picker-side">
          <div class="parking-picker-side-title">本次已选停车点（{{ selectedPickerParkingRows.length }}）</div>
          <a-empty v-if="!selectedPickerParkingRows.length" description="尚未选择停车点" />
          <a-list v-else size="small" bordered :data-source="selectedPickerParkingRows">
            <template #renderItem="{ item }">
              <a-list-item>
                <div class="selected-parking-item">
                  <div class="selected-parking-info">
                    <b>{{ item.parkingName }}</b>
                    <span>{{ item.pointName }}</span>
                  </div>
                </div>
              </a-list-item>
            </template>
          </a-list>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useInspectionStore } from '@/stores/inspection'
import type { FacilityParkingPointBinding } from '@/types/inspection'
import { getDetectionItemConfigs, isDetectionRuleActive } from '@/views/implementation/detection-item-config/model'

interface BindingRow {
  id: string
  parkingPointId: string
  parkingPointName: string
  executionOrder: number
  componentIds: string[]
  ruleIds: string[]
}

interface PickerParkingRow {
  parkingId: string
  parkingName: string
  pointId: string
  pointName: string
  mapId: string
  x: number
  y: number
  rawX: number
  rawY: number
}

interface FacilityComponentOption {
  id: string
  name: string
  componentNo?: string
  componentPositionNo?: string
  installationName?: string
  ruleIds: string[]
}

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()

const isEdit = computed(() => Boolean(route.params.id))
const currentId = computed(() => String(route.params.id || ''))
const currentDevice = computed(() => inspectionStore.inspectionDevices.find((item) => item.id === currentId.value))
const fallbackMapBackgroundUrl = new URL('../../../地图.png', import.meta.url).href

const form = reactive<any>({
  name: '',
  deviceClassification: '',
  deviceNo: '',
  facilityPositionNo: '',
  areaId: '',
  areaName: '',
  installationId: '',
  installationName: '',
  facilityKind: 'normal',
  status: 'active',
  remark: '',
  referenceImageUrl: ''
})

const bindingRows = ref<BindingRow[]>([])
const parkingPickerVisible = ref(false)
const selectedPickerMapId = ref('')
const pickerSelectedIds = ref<Set<string>>(new Set())
const dragStart = ref<{ x: number; y: number } | null>(null)
const draggingRowId = ref('')
const selectionBox = reactive({
  visible: false,
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0
})

const areaOptions = computed(() => {
  const map = new Map<string, string>()
  inspectionStore.inspectionPoints.forEach((point) => {
    if (point.areaId) map.set(point.areaId, point.areaName || point.areaId)
  })
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
})

const installationOptions = computed(() => inspectionStore.installations.filter((item) => !form.areaId || item.areaId === form.areaId))
const facilityComponents = computed<FacilityComponentOption[]>(() => {
  const linked = inspectionStore.getFacilityComponentsByFacilityId(currentId.value)
  if (linked.length) return linked
  return (currentDevice.value?.assetComponents || []).map((item) => ({
    id: item.id,
    name: item.name,
    componentNo: item.id,
    componentPositionNo: item.subTypeName || '-',
    installationName: currentDevice.value?.installationName || form.installationName || '-',
    ruleIds: [...(item.ruleIds || [])]
  }))
})
const detectionRuleNameMap = computed(() => {
  const map = new Map<string, string>()
  getDetectionItemConfigs().forEach((item) => {
    map.set(item.id, item.name)
  })
  return map
})
const allPublishedRuleIds = computed(() => getDetectionItemConfigs().filter(isDetectionRuleActive).map((item) => item.id))
const draggingRowIndex = computed(() => bindingRows.value.findIndex((item) => item.id === draggingRowId.value))
const pickerMapOptions = computed(() => inspectionStore.inspectionMaps.filter((map) =>
  inspectionStore.inspectionPoints.some((point) => point.mapId === map.id && (point.parkingPoints || []).length)
))
const currentPickerMap = computed(() => pickerMapOptions.value.find((map) => map.id === selectedPickerMapId.value))
const pickerMapStyle = computed(() => ({
  backgroundImage: `url(${currentPickerMap.value?.imageUrl || fallbackMapBackgroundUrl})`,
  backgroundColor: '#eef3ff'
}))
const pickerRawParkingRows = computed(() =>
  inspectionStore.inspectionPoints
    .filter((point) => point.mapId === selectedPickerMapId.value)
    .flatMap((point) => (point.parkingPoints || []).map((parking) => ({
      parkingId: parking.id,
      parkingName: parking.name,
      pointId: point.id,
      pointName: point.name,
      mapId: point.mapId,
      rawX: Number(parking.position?.x ?? point.mapPosition?.x ?? 0),
      rawY: Number(parking.position?.y ?? point.mapPosition?.y ?? 0)
    })))
)
const pickerParkingRows = computed<PickerParkingRow[]>(() => {
  const rows = pickerRawParkingRows.value
  if (!rows.length) return []
  const xs = rows.map((item) => item.rawX)
  const ys = rows.map((item) => item.rawY)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const spreadX = maxX - minX
  const spreadY = maxY - minY

  return rows.map((item) => ({
    ...item,
    x: normalizeMapCoordinateToCenter(item.rawX, centerX, spreadX),
    y: normalizeMapCoordinateToCenter(item.rawY, centerY, spreadY)
  }))
})
const selectedPickerParkingRows = computed(() => {
  const selectedIds = pickerSelectedIds.value
  return pickerParkingRows.value.filter((item) => selectedIds.has(item.parkingId))
})
const selectionBoxStyle = computed(() => {
  const left = Math.min(selectionBox.startX, selectionBox.endX)
  const top = Math.min(selectionBox.startY, selectionBox.endY)
  const width = Math.abs(selectionBox.endX - selectionBox.startX)
  const height = Math.abs(selectionBox.endY - selectionBox.startY)
  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`
  }
})

const componentColumns = [
  { title: '巡检对象名称', dataIndex: 'name', key: 'name' },
  { title: '巡检对象编号', dataIndex: 'componentNo', key: 'componentNo', width: 140 },
  { title: '巡检对象位号', dataIndex: 'componentPositionNo', key: 'componentPositionNo', width: 140 },
  { title: '所属装置', dataIndex: 'installationName', key: 'installationName', width: 140 },
  {
    title: '检查规则',
    dataIndex: 'ruleIds',
    key: 'ruleIds',
    customRender: ({ record }: any) => {
      const names = (record.ruleIds || []).map((ruleId: string) => detectionRuleNameMap.value.get(ruleId) || ruleId)
      return names.length ? names.join('、') : '-'
    }
  }
]

const bindingColumns = [
  { title: '', key: 'dragHandle', width: 44 },
  { title: '执行顺序', key: 'executionOrder', width: 110 },
  { title: '停车点', key: 'parkingPointId', width: 220 },
  { title: '关联巡检对象', key: 'componentIds' },
  { title: '巡检规则', key: 'ruleIds' }
]

const bindingComponentOptions = computed(() =>
  facilityComponents.value.map((item) => ({
    label: item.name,
    value: item.id
  }))
)

function syncArea(id: string) {
  const area = areaOptions.value.find((item) => item.id === id)
  form.areaName = area?.name || ''
  form.installationId = ''
  form.installationName = ''
}

function syncInstallation(id: string) {
  const installation = inspectionStore.installations.find((item) => item.id === id)
  form.installationName = installation?.name || ''
  if (installation?.areaId) {
    form.areaId = installation.areaId
    form.areaName = installation.areaName
  }
}

function buildBindingFromRow(row: PickerParkingRow, index: number, sharedParking?: PickerParkingRow): BindingRow {
  const parking = sharedParking || row
  return {
    id: `binding-${Date.now()}-${row.parkingId}-${index}`,
    parkingPointId: parking.parkingId,
    parkingPointName: parking.parkingName,
    executionOrder: bindingRows.value.length + index + 1,
    componentIds: facilityComponents.value[0] ? [facilityComponents.value[0].id] : [],
    ruleIds: facilityComponents.value[0]?.ruleIds?.length ? [...facilityComponents.value[0].ruleIds] : []
  }
}

function getBindingRowClassName(_record: BindingRow, index: number) {
  return draggingRowIndex.value === index ? 'binding-row binding-row--dragging' : 'binding-row'
}

function openParkingPicker() {
  if (!pickerMapOptions.value.length) {
    message.warning('当前暂无可选择的停车点，请先在点位管理中维护巡检点停车点')
    return
  }
  selectedPickerMapId.value = selectedPickerMapId.value || pickerMapOptions.value[0].id
  clearPickerSelection()
  resetSelectionBox()
  parkingPickerVisible.value = true
}

function closeParkingPicker() {
  parkingPickerVisible.value = false
  resetSelectionBox()
}

function clearPickerSelection() {
  pickerSelectedIds.value = new Set()
}

function togglePickerParking(parkingId: string) {
  const next = new Set(pickerSelectedIds.value)
  if (next.has(parkingId)) next.delete(parkingId)
  else next.add(parkingId)
  pickerSelectedIds.value = next
}

function confirmParkingPicker() {
  if (!selectedPickerParkingRows.value.length) {
    message.warning('请先框选停车点')
    return
  }
  const sharedParking = selectedPickerParkingRows.value[0]
  const rows = selectedPickerParkingRows.value.map((row, index) => buildBindingFromRow(row, index, sharedParking))
  bindingRows.value.push(...rows)
  message.success(`已新增 ${rows.length} 条执行顺序`)
  closeParkingPicker()
}

function getBindingRowProps(record: BindingRow, index: number) {
  return {
    draggable: true,
    onDragstart: (event: DragEvent) => onDragStart(record.id, event),
    onDragover: (event: DragEvent) => event.preventDefault(),
    onDrop: (event: DragEvent) => onDropRow(index, event),
    onDragend: onDragEnd
  }
}

function onDragStart(rowId: string, event: DragEvent) {
  draggingRowId.value = rowId
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', rowId)
  }
}

function onDropRow(targetIndex: number, event: DragEvent) {
  event.preventDefault()
  const sourceIndex = bindingRows.value.findIndex((item) => item.id === draggingRowId.value)
  if (sourceIndex < 0 || sourceIndex === targetIndex) {
    draggingRowId.value = ''
    return
  }
  const rows = [...bindingRows.value]
  const [moved] = rows.splice(sourceIndex, 1)
  rows.splice(targetIndex, 0, moved)
  bindingRows.value = rows.map((item, idx) => ({ ...item, executionOrder: idx + 1 }))
  draggingRowId.value = ''
}

function onDragEnd() {
  draggingRowId.value = ''
}

function getPickerPosition(event: MouseEvent) {
  const stage = event.currentTarget as HTMLElement
  const rect = stage.getBoundingClientRect()
  return {
    x: clamp(((event.clientX - rect.left) / rect.width) * 100),
    y: clamp(((event.clientY - rect.top) / rect.height) * 100)
  }
}

function startPickerDrag(event: MouseEvent) {
  if (event.button !== 0) return
  const position = getPickerPosition(event)
  dragStart.value = position
  selectionBox.visible = true
  selectionBox.startX = position.x
  selectionBox.startY = position.y
  selectionBox.endX = position.x
  selectionBox.endY = position.y
}

function movePickerDrag(event: MouseEvent) {
  if (!dragStart.value) return
  const position = getPickerPosition(event)
  selectionBox.endX = position.x
  selectionBox.endY = position.y
}

function endPickerDrag() {
  if (!dragStart.value || !selectionBox.visible) return
  const minX = Math.min(selectionBox.startX, selectionBox.endX)
  const maxX = Math.max(selectionBox.startX, selectionBox.endX)
  const minY = Math.min(selectionBox.startY, selectionBox.endY)
  const maxY = Math.max(selectionBox.startY, selectionBox.endY)
  const hasDragArea = Math.abs(selectionBox.endX - selectionBox.startX) > 1 || Math.abs(selectionBox.endY - selectionBox.startY) > 1
  if (hasDragArea) {
    const next = new Set(pickerSelectedIds.value)
    const tolerance = 3
    pickerParkingRows.value
      .filter((item) => item.x >= minX - tolerance && item.x <= maxX + tolerance && item.y >= minY - tolerance && item.y <= maxY + tolerance)
      .forEach((item) => next.add(item.parkingId))
    pickerSelectedIds.value = next
  }
  resetSelectionBox()
}

function resetSelectionBox() {
  dragStart.value = null
  selectionBox.visible = false
  selectionBox.startX = 0
  selectionBox.startY = 0
  selectionBox.endX = 0
  selectionBox.endY = 0
}

function normalizeMapCoordinateToCenter(value: number, center: number, spread: number) {
  if (!Number.isFinite(value)) return 50
  if (spread <= 0) return 50
  const visualSpan = 46
  const normalized = 50 + ((value - center) / spread) * visualSpan
  return clamp(normalized)
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Number(value.toFixed(2))))
}

function handleBindingComponentChange(record: BindingRow, componentId?: string) {
  const nextId = componentId || ''
  record.componentIds = nextId ? [nextId] : []
  const component = facilityComponents.value.find((item) => item.id === nextId)
  record.ruleIds = component?.ruleIds?.length ? [...component.ruleIds] : []
}

function getRuleNames(ruleIds: string[] = []) {
  const ids = ruleIds.length ? ruleIds : allPublishedRuleIds.value
  return ids.map((id) => detectionRuleNameMap.value.get(id) || id)
}

function hydrateBindings(bindings: FacilityParkingPointBinding[] = []) {
  const sortedBindings = bindings
    .slice()
    .sort((a, b) => (a.executionOrder || a.sequence || 0) - (b.executionOrder || b.sequence || 0))
  const sharedParking = sortedBindings[0]
  bindingRows.value = sortedBindings.map((item, index) => ({
      id: item.id,
      parkingPointId: sharedParking?.parkingPointId || item.parkingPointId,
      parkingPointName: sharedParking?.parkingPointName || item.parkingPointName,
      executionOrder: item.executionOrder || item.sequence || index + 1,
      componentIds: [...(item.componentIds || [])],
      ruleIds: [...(item.ruleIds || allPublishedRuleIds.value)]
    }))
}

function getParkingSourcePoint(parkingPointId: string) {
  const matchedPoint = inspectionStore.inspectionPoints.find((point) =>
    (point.parkingPoints || []).some((parking) => parking.id === parkingPointId)
  )
  const fallbackPoint = matchedPoint
    || inspectionStore.inspectionPoints.find((point) => point.id === currentDevice.value?.inspectionPointId)
    || inspectionStore.inspectionPoints[0]
  return {
    id: fallbackPoint?.id || '',
    name: fallbackPoint?.name || ''
  }
}

function buildParkingBindings(): FacilityParkingPointBinding[] {
  return bindingRows.value
    .filter((item) => item.parkingPointId)
    .map((item) => {
      const sourcePoint = getParkingSourcePoint(item.parkingPointId)
      return {
        id: item.id,
        inspectionPointId: sourcePoint.id,
        inspectionPointName: sourcePoint.name,
        parkingPointId: item.parkingPointId,
        parkingPointName: item.parkingPointName,
        executionOrder: item.executionOrder,
        sequence: item.executionOrder,
        componentIds: item.componentIds,
        ruleIds: item.ruleIds,
        parkingPointIds: [item.parkingPointId],
        parkingPointNames: [item.parkingPointName],
        targetObjectRefs: item.componentIds.map((componentId) => `component:${componentId}`)
      }
    })
}

function goBack() {
  router.push('/implementation/device/list')
}

function goToComponentManage() {
  router.push('/implementation/device/component-usage')
}

function handleSave() {
  if (!form.name || !form.deviceNo || !form.facilityPositionNo || !form.areaId || !form.installationId) {
    message.error('请补齐设施必填字段')
    return
  }

  const now = new Date()
  inspectionStore.saveInspectionDevice({
    ...(currentDevice.value || { inspectionPointId: inspectionStore.inspectionPoints[0]?.id || '' }),
    id: currentId.value || `device-${Date.now()}`,
    name: form.name,
    deviceClassification: form.deviceClassification,
    deviceNo: form.deviceNo,
    facilityPositionNo: form.facilityPositionNo,
    areaId: form.areaId,
    areaName: form.areaName,
    installationId: form.installationId,
    installationName: form.installationName,
    facilityKind: form.facilityKind,
    status: form.status,
    source: 'manual',
    referenceImageUrl: form.referenceImageUrl,
    assetComponents: currentDevice.value?.assetComponents || [],
    connectionObjects: currentDevice.value?.connectionObjects || [],
    objectDetectionConfigs: currentDevice.value?.objectDetectionConfigs || [],
    parkingPointBindings: buildParkingBindings(),
    updatedAt: now,
    createdAt: currentDevice.value?.createdAt || now,
    sequence: currentDevice.value?.sequence || 1,
    type: currentDevice.value?.type || form.deviceClassification || '设施',
    checkItems: currentDevice.value?.checkItems || [],
    code: currentDevice.value?.code || form.deviceNo,
    storageLocation: form.remark
  })
  message.success('设施已保存')
  if (!isEdit.value) {
    router.push('/implementation/device/list')
  }
}

onMounted(() => {
  inspectionStore.initialize()
  if (currentDevice.value) {
    Object.assign(form, {
      name: currentDevice.value.name || '',
      deviceClassification: currentDevice.value.deviceClassification || '',
      deviceNo: currentDevice.value.deviceNo || currentDevice.value.code || '',
      facilityPositionNo: currentDevice.value.facilityPositionNo || '',
      areaId: currentDevice.value.areaId || '',
      areaName: currentDevice.value.areaName || '',
      installationId: currentDevice.value.installationId || '',
      installationName: currentDevice.value.installationName || '',
      facilityKind: currentDevice.value.facilityKind || 'normal',
      status: currentDevice.value.status || 'active',
      remark: currentDevice.value.storageLocation || '',
      referenceImageUrl: currentDevice.value.referenceImageUrl || ''
    })
    hydrateBindings(currentDevice.value.parkingPointBindings || [])
  }
})

function handleFacilityPhotoUpload(file: File) {
  const reader = new FileReader()
  reader.onload = () => {
    form.referenceImageUrl = String(reader.result || '')
  }
  reader.readAsDataURL(file)
  return false
}
</script>

<style scoped>
.model-card {
  margin-top: 16px;
}
.form-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.facility-photo-editor {
  display: flex;
  align-items: flex-end;
  gap: 16px;
}
.facility-photo-preview {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 240px;
  height: 150px;
  overflow: hidden;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  background: #fafafa;
  color: #8c8c8c;
}
.facility-photo-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.drag-handle {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  color: #64748b;
  cursor: grab;
  user-select: none;
}
.drag-handle:hover {
  background: #f1f5f9;
  color: #0f172a;
}
.order-pill {
  display: inline-flex;
  min-width: 36px;
  padding: 2px 10px;
  border-radius: 999px;
  background: #eef2ff;
  color: #3730a3;
  font-weight: 600;
  justify-content: center;
}
.binding-row--dragging :deep(td) {
  background: #f8fafc !important;
}
.parking-picker {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 16px;
}
.parking-picker-main {
  min-width: 0;
}
.parking-picker-toolbar {
  margin-bottom: 12px;
}
.parking-picker-map {
  position: relative;
  height: 520px;
  overflow: hidden;
  border: 1px solid #dbe4f0;
  border-radius: 14px;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  cursor: crosshair;
}
.parking-picker-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.08), rgba(15, 23, 42, 0.18));
}
.parking-picker-tip {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
  padding: 6px 10px;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.72);
  color: #fff;
  font-size: 12px;
}
.selection-box {
  position: absolute;
  z-index: 3;
  border: 1px dashed #2563eb;
  background: rgba(37, 99, 235, 0.16);
}
.parking-point-marker {
  position: absolute;
  z-index: 4;
  display: flex;
  align-items: center;
  gap: 8px;
  transform: translate(-50%, -50%);
  cursor: pointer;
}
.parking-point-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 2px solid #fff;
  border-radius: 999px;
  background: #0f766e;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 10px 24px -12px rgba(15, 118, 110, 0.9);
}
.parking-point-label {
  max-width: 220px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
  font-size: 12px;
  white-space: nowrap;
}
.parking-point-marker.selected .parking-point-dot {
  background: #2563eb;
  box-shadow: 0 12px 28px -12px rgba(37, 99, 235, 0.95);
}
.parking-point-marker.selected .parking-point-label {
  background: #dbeafe;
  color: #1d4ed8;
}
.parking-picker-side {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.parking-picker-side-title {
  font-size: 14px;
  font-weight: 600;
  color: #0f172a;
}
.selected-parking-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
}
.selected-parking-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.selected-parking-info span {
  color: #64748b;
  font-size: 12px;
}
@media (max-width: 960px) {
  .parking-picker {
    grid-template-columns: 1fr;
  }
  .parking-picker-map {
    height: 400px;
  }
}
</style>
