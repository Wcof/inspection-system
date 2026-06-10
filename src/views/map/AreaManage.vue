<template>
  <div class="area-manage">
    <a-page-header
      :title="isListMode ? '区域管理' : `区域编辑 - ${currentMap?.name || '未命名地图'}`"
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
          <a-row :gutter="[16, 8]">
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="区域名称" class="search-item">
                <a-input v-model:value="regionSearchForm.name" placeholder="请输入区域名称" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="区域编码" class="search-item">
                <a-input v-model:value="regionSearchForm.code" placeholder="请输入区域编码" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="所属地图" class="search-item">
                <a-select v-model:value="regionSearchForm.mapId" placeholder="请选择所属地图" allow-clear>
                  <a-select-option v-for="map in inspectionStore.inspectionMaps" :key="map.id" :value="map.id">
                    {{ map.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="区域类型" class="search-item">
                <a-select v-model:value="regionSearchForm.zoneType" placeholder="全部类型" allow-clear>
                  <a-select-option value="normal">正常通行</a-select-option>
                  <a-select-option value="forbidden">禁止通行</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="责任人" class="search-item">
                <a-input v-model:value="regionSearchForm.responsiblePerson" placeholder="请输入责任人" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="24" :md="16" :lg="18">
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
          <template v-if="column.key === 'zoneType'">
            <a-tag :color="record.zoneType === 'forbidden' ? 'red' : 'green'" size="small">
              {{ record.zoneType === 'forbidden' ? '禁止通行' : '正常通行' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'shapePreview'">
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
      <!-- 左侧：区域列表 -->
      <div class="list-card">
        <div class="list-header">
          <span class="list-title">区域列表</span>
          <span class="list-count">{{ filteredRegions.length }}</span>
        </div>
        <div class="list-search">
          <a-input
            v-model:value="regionKeyword"
            size="small"
            placeholder="搜索区域名称"
            allow-clear
          >
            <template #prefix><SearchOutlined /></template>
          </a-input>
        </div>
        <div class="list-body">
          <div
            v-for="region in filteredRegions"
            :key="region.id"
            class="list-item"
            :class="{ selected: region.id === selectedRegionId }"
            @click="selectEditableRegion(region.id)"
          >
            <span class="list-item-name">{{ region.name }}</span>
          </div>
          <a-empty v-if="!filteredRegions.length" :image="simpleImage" description="暂无区域" />
        </div>
      </div>

      <!-- 中间：地图绘制 -->
      <a-card class="map-card" title="地图区域绘制">
        <div class="panel-toolbar">
          <a-space>
            <template v-if="!editMode">
              <a-button type="primary" @click="enterEditMode">编辑</a-button>
            </template>
            <template v-else>
              <a-button v-if="!drawing" type="primary" @click="startPolygon">新增区域</a-button>
              <template v-else>
                <a-tag color="processing">绘制中… 右键完成</a-tag>
              </template>
              <a-button type="primary" @click="saveAll">保存</a-button>
              <a-button @click="cancelEdit">取消</a-button>
            </template>
          </a-space>
          <div class="layer-toggles">
            <a-checkbox v-model:checked="showRegionName">显示名称</a-checkbox>
          </div>
        </div>

        <div class="map-stage" @click="appendPoint($event)" @contextmenu.prevent="finishPolygon" @mousemove="handlePolygonDrag($event)" @mouseup="stopPolygonDrag" @mouseleave="stopPolygonDrag">
          <img :src="currentMap?.imageUrl || fallbackMapBackgroundUrl" alt="地图底图" class="map-image" />
          <svg viewBox="0 0 1000 560" class="map-svg" preserveAspectRatio="none">
            <polygon
              v-for="region in regions"
              :key="region.id"
              :points="region.points"
              :fill="region.id === selectedRegionId ? 'rgba(22,119,255,.28)' : 'rgba(22,119,255,.12)'"
              :stroke="region.id === selectedRegionId ? '#0958d9' : '#1677ff'"
              :stroke-width="region.id === selectedRegionId ? 4 : 2"
              :style="editMode ? 'cursor: move' : ''"
              @click.stop="selectEditableRegion(region.id)"
              @mousedown.stop="editMode && startPolygonDrag(region.id, $event)"
            />
            <text
              v-if="showRegionName"
              v-for="region in regions"
              :key="`label-${region.id}`"
              :x="getPolygonCenter(region.points).x"
              :y="getPolygonCenter(region.points).y"
              class="region-name-label"
              text-anchor="middle"
              dominant-baseline="middle"
            >{{ region.name }}</text>
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

      <!-- 右侧：属性面板 -->
      <a-card v-if="selectedRegionData" class="property-card" :title="`区域属性 - ${selectedRegionData.name}`">
        <a-form layout="vertical" size="small" :disabled="!editMode">
          <a-divider orientation="left">基础信息</a-divider>
          <a-row :gutter="12">
            <a-col :span="12">
              <a-form-item label="区域名称">
                <a-input v-model:value="selectedRegionData.name" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="区域编码">
                <a-input v-model:value="selectedRegionData.code" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item label="区域类型">
            <a-select v-model:value="selectedRegionData.zoneType">
              <a-select-option value="normal">正常通行</a-select-option>
              <a-select-option value="forbidden">禁止通行</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="描述">
            <a-textarea v-model:value="selectedRegionData.description" :rows="2" placeholder="区域描述信息" />
          </a-form-item>
          <a-divider orientation="left">管理信息</a-divider>
          <a-row :gutter="12">
            <a-col :span="12">
              <a-form-item label="责任人">
                <a-input v-model:value="selectedRegionData.responsiblePerson" placeholder="责任人姓名" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="联系电话">
                <a-input v-model:value="selectedRegionData.contactPhone" placeholder="联系电话" />
              </a-form-item>
            </a-col>
          </a-row>
          <a-form-item label="顶点数">
            <span>{{ parsePoints(selectedRegionData.points).length }} 个</span>
          </a-form-item>
        </a-form>
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

    <a-modal
      v-model:open="newRegionModalVisible"
      title="新建绘制区域"
      @ok="confirmCreateRegion"
      @cancel="newRegionModalVisible = false"
    >
      <a-form layout="vertical">
        <a-form-item label="区域名称" required>
          <a-input v-model:value="newRegionForm.name" placeholder="如：巡检区域A" />
        </a-form-item>
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="区域编码">
              <a-input v-model:value="newRegionForm.code" placeholder="如：RG-A" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="区域类型">
              <a-select v-model:value="newRegionForm.zoneType">
                <a-select-option value="normal">正常通行</a-select-option>
                <a-select-option value="forbidden">禁止通行</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-form-item label="描述">
          <a-textarea v-model:value="newRegionForm.description" :rows="2" placeholder="区域描述信息" />
        </a-form-item>
        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="责任人">
              <a-input v-model:value="newRegionForm.responsiblePerson" placeholder="责任人姓名" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="联系电话">
              <a-input v-model:value="newRegionForm.contactPhone" placeholder="联系电话" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { message, Modal, Empty } from 'ant-design-vue'
import { SearchOutlined } from '@ant-design/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import type { InspectionMap } from '@/types/inspection'

interface EditableRegionRow {
  id: string
  name: string
  color: string
  points: string
  previewPoints: string
  showName: boolean
  code: string
  zoneType: 'normal' | 'forbidden'
  description: string
  responsiblePerson: string
  contactPhone: string
}

interface RegionListRow {
  id: string
  mapId: string
  mapName: string
  name: string
  code: string
  zoneType: 'normal' | 'forbidden'
  description: string
  responsiblePerson: string
  contactPhone: string
  points: string
  previewPoints: string
  imageUrl?: string
}

const fallbackMapBackgroundUrl = new URL('../../地图.png', import.meta.url).href

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()

const simpleImage = Empty.PRESENTED_IMAGE_SIMPLE

const drawing = ref(false)
const draftPoints = ref<Array<{ x: number; y: number }>>([])
const regions = ref<EditableRegionRow[]>([])
const regionKeyword = ref('')
const showRegionName = ref(true)
const editMode = ref(false)
let regionsSnapshot: EditableRegionRow[] = []
const createFromListVisible = ref(false)
const selectedMapForCreate = ref('')
const selectedRegionId = ref('')
const draggingRegionId = ref('')
const dragStartPoint = ref<{ x: number; y: number } | null>(null)
const regionSearchForm = ref({
  name: '',
  code: '',
  mapId: '',
  zoneType: '' as '' | 'normal' | 'forbidden',
  responsiblePerson: ''
})
const newRegionModalVisible = ref(false)
const newRegionForm = reactive({
  name: '',
  code: '',
  zoneType: 'normal' as 'normal' | 'forbidden',
  description: '',
  responsiblePerson: '',
  contactPhone: ''
})

const selectedMapId = computed(() => (typeof route.query.mapId === 'string' ? route.query.mapId : ''))
const isListMode = computed(() => !selectedMapId.value)
const currentMap = computed(() => inspectionStore.inspectionMaps.find(map => map.id === selectedMapId.value))
const selectedRegionData = computed(() => regions.value.find(item => item.id === selectedRegionId.value) || null)

const listColumns = [
  { title: '区域名称', dataIndex: 'name', key: 'name' },
  { title: '区域编码', dataIndex: 'code', key: 'code', width: 100 },
  { title: '区域类型', key: 'zoneType', width: 100 },
  { title: '所属地图', dataIndex: 'mapName', key: 'mapName', width: 160 },
  { title: '责任人', dataIndex: 'responsiblePerson', key: 'responsiblePerson', width: 100 },
  { title: '地图形状', key: 'shapePreview', width: 180 },
  { title: '操作', key: 'actions', width: 180 }
]

const filteredRegions = computed(() => {
  const kw = regionKeyword.value.trim().toLowerCase()
  if (!kw) return regions.value
  return regions.value.filter(r => r.name.toLowerCase().includes(kw))
})

const draftPolygon = computed(() => draftPoints.value.map((point) => `${point.x},${point.y}`).join(' '))

const regionListRows = computed<RegionListRow[]>(() => {
  return inspectionStore.inspectionMaps.flatMap((map) => (map.regions || []).map((region) => ({
    id: `${map.id}-${region.id}`,
    mapId: map.id,
    mapName: map.name,
    name: region.name,
    code: region.code || '',
    zoneType: region.zoneType || 'normal',
    description: region.description || '',
    responsiblePerson: region.responsiblePerson || '',
    contactPhone: region.contactPhone || '',
    points: mapRegionToPolygon(region),
    previewPoints: buildPreviewPolygon(mapRegionToPolygon(region)),
    imageUrl: map.imageUrl
  })))
})

const filteredRegionListRows = computed(() => {
  const name = regionSearchForm.value.name.trim().toLowerCase()
  const code = regionSearchForm.value.code.trim().toLowerCase()
  const mapId = regionSearchForm.value.mapId
  const zoneType = regionSearchForm.value.zoneType
  const responsiblePerson = regionSearchForm.value.responsiblePerson.trim().toLowerCase()
  return regionListRows.value.filter((region) => {
    const matchesName = !name || region.name.toLowerCase().includes(name)
    const matchesCode = !code || region.code.toLowerCase().includes(code)
    const matchesMap = !mapId || region.mapId === mapId
    const matchesType = !zoneType || region.zoneType === zoneType
    const matchesPerson = !responsiblePerson || (region.responsiblePerson || '').toLowerCase().includes(responsiblePerson)
    return matchesName && matchesCode && matchesMap && matchesType && matchesPerson
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

function getPolygonCenter(points: string) {
  const parsed = parsePoints(points)
  if (!parsed.length) return { x: 0, y: 0 }
  const total = parsed.reduce((acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }), { x: 0, y: 0 })
  return { x: Math.round(total.x / parsed.length), y: Math.round(total.y / parsed.length) }
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
      previewPoints: buildPreviewPolygon(points),
      showName: region.showName ?? true,
      code: region.code || '',
      zoneType: region.zoneType || 'normal',
      description: region.description || '',
      responsiblePerson: region.responsiblePerson || '',
      contactPhone: region.contactPhone || ''
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
        polygonPoints: region.points,
        showName: region.showName,
        code: region.code || undefined,
        zoneType: region.zoneType,
        description: region.description || undefined,
        responsiblePerson: region.responsiblePerson || undefined,
        contactPhone: region.contactPhone || undefined
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
  regionSearchForm.value.code = ''
  regionSearchForm.value.mapId = ''
  regionSearchForm.value.zoneType = ''
  regionSearchForm.value.responsiblePerson = ''
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
  if (!editMode.value || !drawing.value || draftPoints.value.length < 3) return
  newRegionForm.name = `新区域-${regions.value.length + 1}`
  newRegionForm.code = ''
  newRegionForm.zoneType = 'normal'
  newRegionForm.description = ''
  newRegionForm.responsiblePerson = ''
  newRegionForm.contactPhone = ''
  newRegionModalVisible.value = true
}

function confirmCreateRegion() {
  if (!newRegionForm.name.trim()) {
    message.warning('请输入区域名称')
    return
  }
  const points = draftPolygon.value
  const regionId = `area-${Date.now()}`
  regions.value.push({
    id: regionId,
    name: newRegionForm.name.trim(),
    color: '#1677ff',
    points,
    previewPoints: buildPreviewPolygon(points),
    showName: true,
    code: newRegionForm.code.trim(),
    zoneType: newRegionForm.zoneType,
    description: newRegionForm.description.trim(),
    responsiblePerson: newRegionForm.responsiblePerson.trim(),
    contactPhone: newRegionForm.contactPhone.trim()
  })
  draftPoints.value = []
  newRegionModalVisible.value = false
  selectedRegionId.value = regionId
  message.success('区域已添加，继续绘制下一个或点击保存')
}

function selectEditableRegion(regionId: string) {
  selectedRegionId.value = regionId
}

function enterEditMode() {
  regionsSnapshot = JSON.parse(JSON.stringify(regions.value))
  editMode.value = true
}

function saveAll() {
  saveRegions()
  editMode.value = false
  drawing.value = false
  draftPoints.value = []
  regionsSnapshot = []
  message.success('已保存')
}

function cancelEdit() {
  regions.value = JSON.parse(JSON.stringify(regionsSnapshot))
  editMode.value = false
  drawing.value = false
  draftPoints.value = []
  regionsSnapshot = []
}

function startPolygonDrag(regionId: string, event: MouseEvent) {
  if (!editMode.value) return
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

function handleRouteIntent() {
  if (isListMode.value) return
  if (route.query.action === 'create') {
    enterEditMode()
    startPolygon()
    router.replace({ path: '/implementation/map/area-manage', query: { mapId: selectedMapId.value } })
    return
  }
  if (typeof route.query.regionId === 'string') {
    selectedRegionId.value = route.query.regionId
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
  display: flex;
  flex-direction: row;
  gap: 16px;
  flex: 1;
  min-height: 0;
  margin-top: 16px;
}

.list-card {
  width: 20%;
  min-width: 220px;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  background: #fff;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.list-title {
  font-weight: 600;
  font-size: 14px;
}

.list-count {
  font-size: 12px;
  color: #8c8c8c;
  background: #f5f5f5;
  padding: 0 6px;
  border-radius: 10px;
  line-height: 20px;
}

.list-search {
  padding: 8px 12px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.list-body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.list-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  transition: background 0.15s;
  border-bottom: 1px solid #fafafa;
}

.list-item:hover {
  background: #f5f5f5;
}

.list-item.selected {
  background: rgba(22, 119, 255, 0.08);
}

.list-item-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13px;
}

.map-card {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.map-card :deep(.ant-card-body) {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.property-card {
  width: 25%;
  min-width: 260px;
  max-width: 360px;
  overflow: auto;
}

.property-card :deep(.ant-form-item) {
  margin-bottom: 12px;
}

.property-card :deep(.ant-divider) {
  margin: 12px 0 8px;
}

.panel-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.layer-toggles {
  display: flex;
  gap: 12px;
  align-items: center;
}

.map-stage {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 420px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  background: #f6f8fb;
  cursor: crosshair;
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
.region-name-label {
  fill: #0f172a;
  font-size: 24px;
  font-weight: 700;
  paint-order: stroke;
  stroke: rgba(255, 255, 255, 0.88);
  stroke-width: 5px;
  pointer-events: none;
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

@media (max-width: 992px) {
  .layout-stack {
    flex-direction: column;
  }
  .list-card {
    width: 100%;
    max-width: none;
  }
  .property-card {
    width: 100%;
    max-width: none;
  }
  .map-stage {
    min-height: 340px;
  }
}
</style>
