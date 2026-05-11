<template>
  <div class="area-manage">
    <a-page-header
      :title="isListMode ? '区域编辑' : `区域编辑 - ${currentMap?.name || '未命名地图'}`"
      :sub-title="isListMode ? '区域列表按行展示所属地图与区域形状回显。' : '支持按电子围栏方式绘制、选中和编辑区域。'"
    >
      <template #extra>
        <a-space v-if="isListMode">
          <a-button type="primary" @click="openCreateFromList">编辑区域</a-button>
        </a-space>
        <a-space v-else>
          <a-button @click="backToList">返回区域列表</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-card v-if="isListMode" style="margin-top: 16px">
      <div class="search-panel">
        <a-form layout="vertical" :model="regionSearchForm" @submit.prevent>
          <a-row :gutter="[16, 8]" align="bottom">
            <a-col :xs="24" :sm="12" :md="9">
              <a-form-item label="区域名称" class="search-item">
                <a-input v-model:value="regionSearchForm.name" placeholder="请输入区域名称" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="9">
              <a-form-item label="所属地图" class="search-item">
                <a-select v-model:value="regionSearchForm.mapId" placeholder="请选择所属地图" allow-clear>
                  <a-select-option v-for="map in inspectionStore.inspectionMaps" :key="map.id" :value="map.id">
                    {{ map.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="24" :md="6">
              <div class="search-actions">
                <a-space>
                  <a-button type="primary">搜索</a-button>
                  <a-button @click="resetRegionSearch">重置</a-button>
                </a-space>
              </div>
            </a-col>
          </a-row>
        </a-form>
      </div>

      <a-table :columns="listColumns" :data-source="filteredRegionListRows" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'shapePreview'">
            <div class="shape-preview with-map">
              <img :src="record.imageUrl || fallbackMapBackgroundUrl" alt="区域地图预览" class="shape-map-image" />
              <svg viewBox="0 0 240 140" preserveAspectRatio="none">
                <polygon :points="record.previewPoints" fill="rgba(22,119,255,.22)" stroke="#1677ff" stroke-width="2" />
              </svg>
            </div>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="openRegionEditorFromList(record.id)">编辑</a-button>
              <a-button type="link" size="small" danger @click="deleteRegionFromList(record)">删除</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <div v-else class="layout-stack">
      <a-card class="map-card" title="地图区域绘制" style="margin-top: 16px">
          <div class="panel-toolbar">
            <a-space>
              <a-button type="primary" :disabled="drawing" @click="startPolygon">绘制新区域</a-button>
              <a-button :disabled="draftPoints.length < 3" @click="finishPolygon">完成区域绘制</a-button>
            </a-space>
            <div class="help-text">点击地图依次落点形成电子围栏；选中区域后可进入编辑并调整名称、位置。</div>
          </div>

          <div class="map-stage" @click="appendPoint($event)" @mousemove="handlePolygonDrag($event)" @mouseup="stopPolygonDrag" @mouseleave="stopPolygonDrag">
            <img :src="currentMap?.imageUrl || fallbackMapBackgroundUrl" alt="地图底图" class="map-image" />
            <svg viewBox="0 0 1000 560" class="map-svg" preserveAspectRatio="none">
              <polygon
                v-for="region in regions"
                :key="region.id"
                :points="region.points"
                :fill="region.id === editingRegionId ? 'rgba(250, 140, 22, .30)' : region.id === selectedRegionId ? 'rgba(22,119,255,.28)' : 'rgba(22,119,255,.12)'"
                :stroke="region.id === editingRegionId ? '#fa8c16' : region.id === selectedRegionId ? '#0958d9' : '#1677ff'"
                :stroke-width="region.id === editingRegionId || region.id === selectedRegionId ? 4 : 2"
                @click.stop="selectEditableRegion(region.id)"
                @mousedown.stop="startPolygonDrag(region.id, $event)"
              />
              <polygon
                v-if="draftPoints.length"
                :points="draftPolygon"
                fill="rgba(250,173,20,.18)"
                stroke="#faad14"
                stroke-width="2"
                stroke-dasharray="6 4"
              />
              <circle v-for="(point, idx) in draftPoints" :key="idx" :cx="point.x" :cy="point.y" r="5" fill="#faad14" />
            </svg>
          </div>
        </a-card>

      <a-card class="list-card" title="区域列表">
        <a-table
          :columns="columns"
          :data-source="regions"
          row-key="id"
          :pagination="false"
          size="small"
          :scroll="{ x: 760, y: 320 }"
          :custom-row="bindRegionRow"
          :row-class-name="getRegionRowClass"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'name'">
              <a-input
                v-if="editingRegionId === record.id"
                v-model:value="editingRegionName"
                size="small"
                placeholder="请输入区域名称"
              />
              <template v-else>{{ record.name }}</template>
            </template>
            <template v-else-if="column.key === 'shape'">
              <div class="shape-preview compact">
                <svg viewBox="0 0 240 140" preserveAspectRatio="none">
                  <polygon :points="record.previewPoints" fill="rgba(22,119,255,.18)" stroke="#1677ff" stroke-width="2" />
                </svg>
              </div>
            </template>
            <template v-else-if="column.key === 'actions'">
              <a-space>
                <template v-if="editingRegionId === record.id">
                  <a-button type="link" size="small" @click.stop="saveRegionEdit">保存</a-button>
                  <a-button type="link" size="small" @click.stop="cancelRegionEdit">取消</a-button>
                </template>
                <template v-else>
                  <a-button type="link" size="small" @click.stop="openRegionEditor(record.id)">编辑</a-button>
                  <a-button type="link" size="small" danger @click="deleteRegion(record.id)">删除</a-button>
                </template>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-card>
    </div>

    <a-modal
      v-model:open="createFromListVisible"
      title="选择地图后新增区域"
      @ok="confirmCreateFromList"
      @cancel="createFromListVisible = false"
    >
      <a-form layout="vertical">
        <a-form-item label="地图" required>
          <a-select v-model:value="selectedMapForCreate" placeholder="请选择地图">
            <a-select-option v-for="map in inspectionStore.inspectionMaps" :key="map.id" :value="map.id">
              {{ map.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import type { InspectionMap } from '@/types/inspection'

interface EditableRegionRow {
  id: string
  name: string
  color: string
  points: string
  previewPoints: string
}

interface RegionListRow {
  id: string
  mapId: string
  mapName: string
  name: string
  points: string
  previewPoints: string
  imageUrl?: string
}

const fallbackMapBackgroundUrl = new URL('../../地图.png', import.meta.url).href

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()

const drawing = ref(false)
const draftPoints = ref<Array<{ x: number; y: number }>>([])
const regions = ref<EditableRegionRow[]>([])
const createFromListVisible = ref(false)
const selectedMapForCreate = ref('')
const selectedRegionId = ref('')
const editingRegionId = ref('')
const editingRegionName = ref('')
const draggingRegionId = ref('')
const dragStartPoint = ref<{ x: number; y: number } | null>(null)
const regionSearchForm = ref({
  name: '',
  mapId: ''
})

const selectedMapId = computed(() => (typeof route.query.mapId === 'string' ? route.query.mapId : ''))
const isListMode = computed(() => !selectedMapId.value)
const currentMap = computed(() => inspectionStore.inspectionMaps.find(map => map.id === selectedMapId.value))
const editingRegion = computed(() => regions.value.find(item => item.id === editingRegionId.value))

const listColumns = [
  { title: '区域名称', dataIndex: 'name', key: 'name' },
  { title: '所属地图', dataIndex: 'mapName', key: 'mapName', width: 220 },
  { title: '地图形状', key: 'shapePreview', width: 180 },
  { title: '操作', key: 'actions', width: 180 }
]

const columns = [
  { title: '区域名称', dataIndex: 'name', key: 'name' },
  { title: '形状预览', key: 'shape', width: 150 },
  { title: '操作', key: 'actions', width: 180 }
]

const draftPolygon = computed(() => draftPoints.value.map((point) => `${point.x},${point.y}`).join(' '))

const regionListRows = computed<RegionListRow[]>(() => {
  return inspectionStore.inspectionMaps.flatMap((map) => (map.regions || []).map((region) => ({
    id: `${map.id}-${region.id}`,
    mapId: map.id,
    mapName: map.name,
    name: region.name,
    points: mapRegionToPolygon(region),
    previewPoints: buildPreviewPolygon(mapRegionToPolygon(region)),
    imageUrl: map.imageUrl
  })))
})

const filteredRegionListRows = computed(() => {
  const name = regionSearchForm.value.name.trim().toLowerCase()
  const mapId = regionSearchForm.value.mapId
  return regionListRows.value.filter((region) => {
    const matchesName = !name || region.name.toLowerCase().includes(name)
    const matchesMap = !mapId || region.mapId === mapId
    return matchesName && matchesMap
  })
})

function initializeBase() {
  inspectionStore.initialize()
}

function parsePoints(points: string) {
  return points
    .split(' ')
    .map(item => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [x, y] = item.split(',').map(Number)
      return { x, y }
    })
}

function mapRegionToPolygon(region: NonNullable<InspectionMap['regions']>[number]) {
  if (region.polygonPoints) return region.polygonPoints
  const x1 = region.x
  const y1 = region.y
  const x2 = region.x + region.width
  const y2 = region.y
  const x3 = region.x + region.width
  const y3 = region.y + region.height
  const x4 = region.x
  const y4 = region.y + region.height
  return `${x1},${y1} ${x2},${y2} ${x3},${y3} ${x4},${y4}`
}

function polygonToRect(points: string) {
  const parsed = parsePoints(points)
  const xs = parsed.map(item => item.x)
  const ys = parsed.map(item => item.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)

  return {
    x: Math.round(minX),
    y: Math.round(minY),
    width: Math.round(maxX - minX),
    height: Math.round(maxY - minY)
  }
}

function buildPreviewPolygon(points: string) {
  const parsed = parsePoints(points)
  if (!parsed.length) return ''
  const xs = parsed.map(item => item.x)
  const ys = parsed.map(item => item.y)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const width = Math.max(1, maxX - minX)
  const height = Math.max(1, maxY - minY)

  return parsed
    .map((point) => {
      const x = 20 + ((point.x - minX) / width) * 200
      const y = 16 + ((point.y - minY) / height) * 108
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
}

function loadRegions() {
  if (isListMode.value || !currentMap.value) {
    regions.value = []
    return
  }

  regions.value = (currentMap.value.regions || []).map((region) => {
    const points = mapRegionToPolygon(region)
    return {
      id: region.id,
      name: region.name,
      color: region.color,
      points,
      previewPoints: buildPreviewPolygon(points)
    }
  })
  if (!selectedRegionId.value && regions.value[0]) {
    selectedRegionId.value = regions.value[0].id
  }
}

function saveRegions() {
  if (!currentMap.value) return
  const nextMap: InspectionMap = {
    ...currentMap.value,
    regions: regions.value.map((region) => {
      const rect = polygonToRect(region.points)
      return {
        id: region.id,
        name: region.name,
        color: region.color,
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
        polygonPoints: region.points
      }
    }),
    updatedAt: new Date()
  }
  inspectionStore.saveInspectionMap(nextMap)
}

function goToMapScopedPage(mapId: string, action?: 'create') {
  router.push({
    path: '/implementation/map/area-manage',
    query: action ? { mapId, action } : { mapId }
  })
}

function backToList() {
  router.push('/implementation/map/area-manage')
}

function openCreateFromList() {
  if (!inspectionStore.inspectionMaps.length) {
    message.warning('请先在地图管理中创建地图')
    return
  }
  if (inspectionStore.inspectionMaps.length === 1) {
    goToMapScopedPage(inspectionStore.inspectionMaps[0].id, 'create')
    return
  }
  selectedMapForCreate.value = ''
  createFromListVisible.value = true
}

function confirmCreateFromList() {
  if (!selectedMapForCreate.value) {
    message.warning('请先选择地图')
    return
  }
  createFromListVisible.value = false
  goToMapScopedPage(selectedMapForCreate.value, 'create')
}

function resetRegionSearch() {
  regionSearchForm.value.name = ''
  regionSearchForm.value.mapId = ''
}

function parseListRegionId(listRegionId: string) {
  const separator = listRegionId.indexOf('-area-')
  if (separator < 0) return null
  return {
    mapId: listRegionId.slice(0, separator),
    regionId: listRegionId.slice(separator + 1)
  }
}

function openRegionEditorFromList(listRegionId: string) {
  const parsed = parseListRegionId(listRegionId)
  if (!parsed) return
  router.push({
    path: '/implementation/map/area-manage',
    query: { mapId: parsed.mapId, regionId: parsed.regionId }
  })
}

function deleteRegionFromList(row: RegionListRow) {
  const parsed = parseListRegionId(row.id)
  if (!parsed) return
  const targetMap = inspectionStore.inspectionMaps.find(item => item.id === parsed.mapId)
  if (!targetMap) return

  Modal.confirm({
    title: '确认删除区域',
    content: `确定删除区域「${row.name}」吗？删除后不可恢复。`,
    okText: '确认删除',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: () => {
      const nextRegions = (targetMap.regions || []).filter(region => region.id !== parsed.regionId)
      inspectionStore.saveInspectionMap({
        ...targetMap,
        regions: nextRegions,
        updatedAt: new Date()
      })
      if (!isListMode.value && parsed.mapId === selectedMapId.value) {
        loadRegions()
      }
      message.success('区域已删除')
    }
  })
}

function startPolygon() {
  drawing.value = true
  draftPoints.value = []
  message.info('请在地图上点击落点形成区域')
}

function appendPoint(event: MouseEvent) {
  if (!drawing.value) return
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 1000
  const y = ((event.clientY - rect.top) / rect.height) * 560
  draftPoints.value.push({ x: Math.round(x), y: Math.round(y) })
}

function finishPolygon() {
  if (draftPoints.value.length < 3) return
  const points = draftPolygon.value
  const regionId = `area-${Date.now()}`
  regions.value.push({
    id: regionId,
    name: `新区域-${regions.value.length + 1}`,
    color: '#1677ff',
    points,
    previewPoints: buildPreviewPolygon(points)
  })
  drawing.value = false
  draftPoints.value = []
  selectedRegionId.value = regionId
  saveRegions()
  message.success('区域已创建')
}

function deleteRegion(regionId: string) {
  const targetRegion = regions.value.find(item => item.id === regionId)
  if (!targetRegion) return
  Modal.confirm({
    title: '确认删除区域',
    content: `确定删除区域「${targetRegion.name}」吗？删除后不可恢复。`,
    okText: '确认删除',
    cancelText: '取消',
    okButtonProps: { danger: true },
    onOk: () => {
      regions.value = regions.value.filter(item => item.id !== regionId)
      if (selectedRegionId.value === regionId) {
        selectedRegionId.value = regions.value[0]?.id || ''
      }
      saveRegions()
      message.success('区域已删除')
    }
  })
}

function selectEditableRegion(regionId: string) {
  selectedRegionId.value = regionId
}

function openRegionEditor(regionId: string) {
  const region = regions.value.find(item => item.id === regionId)
  if (!region) return
  selectedRegionId.value = regionId
  editingRegionId.value = regionId
  editingRegionName.value = region.name
}

function cancelRegionEdit() {
  editingRegionId.value = ''
  editingRegionName.value = ''
  draggingRegionId.value = ''
  dragStartPoint.value = null
}

function saveRegionEdit() {
  if (!editingRegion.value) return
  if (!editingRegionName.value.trim()) {
    message.warning('请输入区域名称')
    return
  }
  editingRegion.value.name = editingRegionName.value.trim()
  editingRegion.value.previewPoints = buildPreviewPolygon(editingRegion.value.points)
  saveRegions()
  message.success('区域已更新')
  cancelRegionEdit()
}

function startPolygonDrag(regionId: string, event: MouseEvent) {
  if (editingRegionId.value !== regionId) return
  draggingRegionId.value = regionId
  dragStartPoint.value = { x: event.clientX, y: event.clientY }
}

function handlePolygonDrag(event: MouseEvent) {
  if (!draggingRegionId.value || !dragStartPoint.value) return
  const region = regions.value.find(item => item.id === draggingRegionId.value)
  if (!region) return
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const deltaX = ((event.clientX - dragStartPoint.value.x) / rect.width) * 1000
  const deltaY = ((event.clientY - dragStartPoint.value.y) / rect.height) * 560
  if (!deltaX && !deltaY) return
  region.points = movePolygon(region.points, deltaX, deltaY)
  region.previewPoints = buildPreviewPolygon(region.points)
  dragStartPoint.value = { x: event.clientX, y: event.clientY }
}

function stopPolygonDrag() {
  draggingRegionId.value = ''
  dragStartPoint.value = null
}

function movePolygon(points: string, deltaX: number, deltaY: number) {
  return parsePoints(points)
    .map((point) => `${Math.round(point.x + deltaX)},${Math.round(point.y + deltaY)}`)
    .join(' ')
}

function bindRegionRow(record: EditableRegionRow) {
  return {
    onClick: () => selectEditableRegion(record.id)
  }
}

function getRegionRowClass(record: EditableRegionRow) {
  if (record.id === editingRegionId.value) return 'editing-region-row'
  if (record.id === selectedRegionId.value) return 'selected-region-row'
  return ''
}

function handleRouteIntent() {
  if (isListMode.value) return
  if (route.query.action === 'create') {
    startPolygon()
    router.replace({ path: '/implementation/map/area-manage', query: { mapId: selectedMapId.value } })
    return
  }
  if (typeof route.query.regionId === 'string') {
    openRegionEditor(route.query.regionId)
  }
}

watch(
  () => route.fullPath,
  () => {
    loadRegions()
    handleRouteIntent()
  }
)

onMounted(() => {
  initializeBase()
  loadRegions()
  handleRouteIntent()
})
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
  display: flex;
  justify-content: flex-end;
  align-items: flex-end;
  min-height: 32px;
}

.layout-stack {
  display: grid;
  grid-template-rows: auto auto;
  gap: 16px;
}

.map-card,
.list-card {
  min-width: 0;
}

.panel-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.help-text {
  color: #8c8c8c;
  font-size: 12px;
}

.map-stage {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  min-height: 420px;
  max-height: min(62vh, 720px);
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  background: #f6f8fb;
}

.map-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.map-svg {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: block;
}

.map-stage {
  cursor: crosshair;
}

.shape-preview {
  width: 180px;
  height: 110px;
  border-radius: 8px;
  overflow: hidden;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  position: relative;
}

.shape-preview.compact {
  width: 88px;
  height: 54px;
}

.shape-preview.with-map .shape-map-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.shape-preview svg {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: block;
}

.area-manage :deep(.list-card .ant-table-thead > tr > th) {
  white-space: nowrap;
}

.area-manage :deep(.list-card .ant-table-tbody > tr > td) {
  padding-top: 10px;
  padding-bottom: 10px;
  vertical-align: middle;
}

.area-manage :deep(.selected-region-row > td) {
  background: rgba(22, 119, 255, 0.08) !important;
}

.area-manage :deep(.editing-region-row > td) {
  background: rgba(250, 140, 22, 0.12) !important;
}

@media (max-width: 992px) {
  .map-stage {
    min-height: 340px;
    max-height: 54vh;
  }
}
</style>
