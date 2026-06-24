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
            <!-- 绘制区域：未绘制时显示「绘制区域」，绘制中变为激活态 -->
            <a-button
              :type="drawing ? 'primary' : 'default'"
              @click="toggleDrawing"
            >{{ drawing ? '绘制中...' : '绘制区域' }}</a-button>
            <a-button v-if="drawing" type="primary" @click="finishPolygon">完成绘制</a-button>
            <a-button v-if="drawing" danger @click="cancelDrawing">取消绘制</a-button>
            <a-divider type="vertical" />
            <a-button size="small" :disabled="!canUndo" @click="handleUndo">撤销</a-button>
            <a-button size="small" :disabled="!canRedo" @click="handleRedo">重做</a-button>
            <!-- 选中后整体保存 -->
            <a-button v-if="hasUnsavedChanges" type="primary" @click="saveAll">保存</a-button>
            <a-button v-if="hasUnsavedChanges" @click="discardChanges">放弃修改</a-button>
          </a-space>
          <div class="layer-toggles">
            <a-checkbox v-model:checked="showRegionName">显示名称</a-checkbox>
          </div>
        </div>

        <div
          class="map-stage"
          :class="{ 'is-drawing': drawing }"
          @click="handleStageClick($event)"
          @contextmenu.prevent="onRightClick"
          @mousemove="handleStageMouseMove($event)"
          @mouseup="stopPolygonDrag"
          @mouseleave="stopPolygonDrag"
        >
          <img :src="currentMap?.imageUrl || fallbackMapBackgroundUrl" alt="地图底图" class="map-image" />
          <svg viewBox="0 0 1000 560" class="map-svg" preserveAspectRatio="none">
            <!-- 已有区域 -->
            <polygon
              v-for="region in regions"
              :key="region.id"
              :points="region.points"
              :fill="region.id === selectedRegionId ? 'rgba(22,119,255,.28)' : 'rgba(22,119,255,.12)'"
              :stroke="region.id === selectedRegionId ? '#0958d9' : '#1677ff'"
              :stroke-width="region.id === selectedRegionId ? 4 : 2"
              :style="{ cursor: selectedRegionId === region.id ? 'move' : 'pointer' }"
              @click.stop="selectEditableRegion(region.id)"
              @mousedown.stop="startPolygonDrag(region.id, $event)"
            />
            <!-- 区域名称 -->
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
            <!-- 选中区域的移动手柄 -->
            <text
              v-if="selectedRegionId && !drawing"
              :x="getPolygonCenter(getSelectedRegionPoints()).x"
              :y="getPolygonCenter(getSelectedRegionPoints()).y"
              class="move-handle"
              text-anchor="middle"
              dominant-baseline="middle"
              @mousedown.stop="startWholeMove($event)"
            >移</text>
            <!-- 选中区域的顶点手柄（用于改形状） -->
            <circle
              v-if="selectedRegionId && !drawing"
              v-for="(pt, idx) in (selectedRegionVertexHandles)"
              :key="`v-${idx}`"
              :cx="pt.x"
              :cy="pt.y"
              r="6"
              fill="#fff"
              stroke="#0958d9"
              stroke-width="2"
              style="cursor: nwse-resize"
              @mousedown.stop="startVertexDrag(idx, $event)"
            />
            <!-- 绘制中的虚线跟随预览 -->
            <polygon
              v-if="draftPoints.length"
              :points="draftPolygonPreview"
              fill="rgba(250,173,20,.10)"
              stroke="#faad14"
              stroke-width="2"
              stroke-dasharray="6 4"
            />
            <!-- 已落点 -->
            <circle v-for="(point, idx) in draftPoints" :key="`d-${idx}`" :cx="point.x" :cy="point.y" :r="idx === 0 ? 7 : 5" :fill="idx === 0 ? '#faad14' : '#fff'" :stroke="idx === 0 ? '#d48806' : '#faad14'" stroke-width="2" />
            <!-- 跟随鼠标的虚线预览 -->
            <line v-if="drawing && draftPoints.length && mousePreviewPoint" :x1="draftPoints[draftPoints.length - 1].x" :y1="draftPoints[draftPoints.length - 1].y" :x2="mousePreviewPoint.x" :y2="mousePreviewPoint.y" stroke="#faad14" stroke-width="2" stroke-dasharray="4 4" />
            <line v-if="drawing && draftPoints.length >= 2 && mousePreviewPoint" :x1="mousePreviewPoint.x" :y1="mousePreviewPoint.y" :x2="draftPoints[0].x" :y2="draftPoints[0].y" stroke="#faad14" stroke-width="1" stroke-dasharray="2 4" opacity="0.5" />
          </svg>
          <div v-if="drawing" class="draw-hint">在地图上点击落点绘制区域，右键或「完成绘制」闭合，靠近起点点击也可闭合</div>
        </div>
      </a-card>

      <!-- 右侧：属性面板（三态：只读→编辑→保存） -->
      <a-card v-if="selectedRegionData" class="property-card">
        <template #title>
          <span>区域属性 - {{ selectedRegionData.name }}</span>
        </template>
        <template #extra>
          <a-space>
            <a-button v-if="!propertyEditing" size="small" type="link" @click="enterPropertyEdit">编辑</a-button>
            <template v-else>
              <a-button size="small" type="primary" @click="savePropertyEdit">保存</a-button>
              <a-button size="small" @click="cancelPropertyEdit">取消</a-button>
            </template>
          </a-space>
        </template>
        <a-form layout="vertical" size="small" :disabled="!propertyEditing">
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
import { computed, onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { message, Modal, Empty } from 'ant-design-vue'
import { SearchOutlined } from '@ant-design/icons-vue'
import { useRoute, useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import { useUndoRedo } from '@/utils/undo-redo'
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

// ─── 撤销/重做 ───
const { canUndo, canRedo, pushSnapshot, undo, redo } = useUndoRedo<string>()

const drawing = ref(false)
const draftPoints = ref<Array<{ x: number; y: number }>>([])
const mousePreviewPoint = ref<{ x: number; y: number } | null>(null)
const regions = ref<EditableRegionRow[]>([])
const regionKeyword = ref('')
const showRegionName = ref(true)
// 去掉全局 editMode 开关：默认即可绘制/选中/编辑
const hasUnsavedChanges = ref(false)
const propertyEditing = ref(false)
const draggingVertexIdx = ref(-1)
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
// 绘制中的预览多边形：包含已落点 + 鼠标当前位置（若有）
const draftPolygonPreview = computed(() => {
  const pts = draftPoints.value.map(p => `${p.x},${p.y}`)
  if (mousePreviewPoint.value && pts.length > 0) {
    pts.push(`${mousePreviewPoint.value.x},${mousePreviewPoint.value.y}`)
  }
  return pts.join(' ')
})

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
  // 初始化 snapshot 用于属性编辑取消还原
  regionsSnapshot = JSON.parse(JSON.stringify(regions.value))
  hasUnsavedChanges.value = false
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

function toggleDrawing() {
  if (drawing.value) {
    cancelDrawing()
  } else {
    startPolygon()
  }
}

function startPolygon() {
  // 直接进入绘制，无需 editMode 开关
  selectedRegionId.value = ''
  drawing.value = true
  draftPoints.value = []
  mousePreviewPoint.value = null
  hasUnsavedChanges.value = true
  message.info('请在地图上点击落点形成区域，右键或「完成绘制」闭合')
}

function cancelDrawing() {
  drawing.value = false
  draftPoints.value = []
  mousePreviewPoint.value = null
}

function onRightClick() {
  if (drawing.value) finishPolygon()
}

function handleStageClick(event: MouseEvent) {
  if (!drawing.value) return
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 1000
  const y = ((event.clientY - rect.top) / rect.height) * 560
  const px = Math.round(x)
  const py = Math.round(y)
  // 起点闭合检测：靠近起点（<14px）且已有>=3 点则闭合
  if (draftPoints.value.length >= 3) {
    const first = draftPoints.value[0]
    const dist = Math.hypot(first.x - px, first.y - py)
    if (dist < 14) {
      finishPolygon()
      return
    }
  }
  draftPoints.value.push({ x: px, y: py })
}

function handleStageMouseMove(event: MouseEvent) {
  const target = event.currentTarget as HTMLElement
  const rect = target.getBoundingClientRect()
  const x = ((event.clientX - rect.left) / rect.width) * 1000
  const y = ((event.clientY - rect.top) / rect.height) * 560
  mousePreviewPoint.value = { x: Math.round(x), y: Math.round(y) }
  // 顶点拖动中
  if (draggingVertexIdx.value >= 0 && selectedRegionId.value) {
    const region = regions.value.find(r => r.id === selectedRegionId.value)
    if (region) {
      const pts = parsePoints(region.points)
      pts[draggingVertexIdx.value] = { x: Math.round(x), y: Math.round(y) }
      region.points = pts.map(p => `${p.x},${p.y}`).join(' ')
      region.previewPoints = buildPreviewPolygon(region.points)
      hasUnsavedChanges.value = true
    }
  }
  // 整体移动中
  if (draggingRegionId.value && dragStartPoint.value) {
    const region = regions.value.find(item => item.id === draggingRegionId.value)
    if (region) {
      const deltaX = ((event.clientX - dragStartPoint.value.x) / rect.width) * 1000
      const deltaY = ((event.clientY - dragStartPoint.value.y) / rect.height) * 560
      if (deltaX || deltaY) {
        region.points = movePolygon(region.points, deltaX, deltaY)
        region.previewPoints = buildPreviewPolygon(region.points)
        hasUnsavedChanges.value = true
      }
      dragStartPoint.value = { x: event.clientX, y: event.clientY }
    }
  }
}

function finishPolygon() {
  if (!drawing.value || draftPoints.value.length < 3) {
    message.warning('至少需要 3 个点才能闭合区域')
    return
  }
  pushSnapshot(JSON.stringify(regions.value))
  // 直接创建区域，使用默认名称，进入属性面板编辑
  const points = draftPolygon.value
  const regionId = `area-${Date.now()}`
  regions.value.push({
    id: regionId,
    name: `新区域-${regions.value.length + 1}`,
    color: '#1677ff',
    points,
    previewPoints: buildPreviewPolygon(points),
    showName: true,
    code: '',
    zoneType: 'normal',
    description: '',
    responsiblePerson: '',
    contactPhone: ''
  })
  draftPoints.value = []
  mousePreviewPoint.value = null
  drawing.value = false
  selectedRegionId.value = regionId
  hasUnsavedChanges.value = true
  // 直接进入属性编辑态，让用户填写名称
  propertyEditing.value = true
  message.success('区域已创建，请在右侧填写名称等信息')
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
  hasUnsavedChanges.value = true
  message.success('区域已添加，继续绘制下一个或点击保存')
}

function selectEditableRegion(regionId: string) {
  if (drawing.value) return // 绘制中不切换选中
  selectedRegionId.value = regionId
  propertyEditing.value = false
}

function saveAll() {
  saveRegions()
  drawing.value = false
  draftPoints.value = []
  regionsSnapshot = []
  hasUnsavedChanges.value = false
  message.success('已保存')
}

function discardChanges() {
  if (regionsSnapshot.length) {
    regions.value = JSON.parse(JSON.stringify(regionsSnapshot))
  }
  drawing.value = false
  draftPoints.value = []
  hasUnsavedChanges.value = false
  message.info('已放弃修改')
}

function startPolygonDrag(regionId: string, event: MouseEvent) {
  if (drawing.value) return
  // 仅当点击的是 polygon 本身时才触发整体移动；移动手柄有独立 mousedown
  draggingRegionId.value = regionId
  dragStartPoint.value = { x: event.clientX, y: event.clientY }
}

function startWholeMove(event: MouseEvent) {
  if (drawing.value || !selectedRegionId.value) return
  draggingRegionId.value = selectedRegionId.value
  dragStartPoint.value = { x: event.clientX, y: event.clientY }
}

function startVertexDrag(idx: number, _event: MouseEvent) {
  if (drawing.value) return
  draggingVertexIdx.value = idx
}

function stopPolygonDrag() {
  draggingRegionId.value = ''
  draggingVertexIdx.value = -1
  dragStartPoint.value = null
}

function movePolygon(points: string, deltaX: number, deltaY: number) {
  return parsePoints(points)
    .map((point) => `${Math.round(point.x + deltaX)},${Math.round(point.y + deltaY)}`)
    .join(' ')
}

function getSelectedRegionPoints(): string {
  const region = regions.value.find(r => r.id === selectedRegionId.value)
  return region?.points || ''
}

const selectedRegionVertexHandles = computed(() => {
  if (!selectedRegionId.value) return []
  const region = regions.value.find(r => r.id === selectedRegionId.value)
  if (!region) return []
  return parsePoints(region.points)
})

function enterPropertyEdit() {
  propertyEditing.value = true
}

function savePropertyEdit() {
  pushSnapshot(JSON.stringify(regions.value))
  propertyEditing.value = false
  hasUnsavedChanges.value = true
  message.success('属性已修改，点击「保存」提交到系统')
}

function cancelPropertyEdit() {
  // 从 snapshot 还原当前选中区域
  if (selectedRegionId.value && regionsSnapshot.length) {
    const snap = regionsSnapshot.find(r => r.id === selectedRegionId.value)
    if (snap) {
      const region = regions.value.find(r => r.id === selectedRegionId.value)
      if (region) Object.assign(region, JSON.parse(JSON.stringify(snap)))
    }
  }
  propertyEditing.value = false
}

function handleRouteIntent() {
  if (isListMode.value) return
  if (route.query.action === 'create') {
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
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
})

function onKeyDown(e: KeyboardEvent) {
  // Ctrl+Z 撤销
  if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault()
    handleUndo()
    return
  }
  // Ctrl+Y / Ctrl+Shift+Z 重做
  if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
    e.preventDefault()
    handleRedo()
    return
  }
  if (e.key === 'Delete' && selectedRegionId.value) {
    const region = regions.value.find(r => r.id === selectedRegionId.value)
    if (region) {
      Modal.confirm({
        title: '确认删除区域',
        content: `确定删除区域「${region.name}」吗？`,
        okText: '确认删除',
        cancelText: '取消',
        okButtonProps: { danger: true },
        onOk: () => {
          pushSnapshot(JSON.stringify(regions.value))
          regions.value = regions.value.filter(r => r.id !== region.id)
          selectedRegionId.value = ''
          hasUnsavedChanges.value = true
          message.success('区域已删除，点击「保存」提交')
        }
      })
    }
  }
}

// ─── 撤销/重做处理 ───
function handleUndo() {
  const prev = undo(JSON.stringify(regions.value))
  if (prev) {
    regions.value = JSON.parse(prev)
    hasUnsavedChanges.value = true
    message.info('已撤销')
  }
}

function handleRedo() {
  const next = redo(JSON.stringify(regions.value))
  if (next) {
    regions.value = JSON.parse(next)
    hasUnsavedChanges.value = true
    message.info('已重做')
  }
}
</script>

<style scoped lang="css">
.map-stage.is-drawing {
  cursor: crosshair;
}
.draw-hint {
  position: absolute;
  bottom: 8px;
  left: 50%;
  transform: translateX(-50%);
  padding: 4px 12px;
  background: rgba(0, 0, 0, 0.65);
  color: #fff;
  font-size: 12px;
  border-radius: 4px;
  pointer-events: none;
}
.move-handle {
  font-size: 20px;
  cursor: move;
  user-select: none;
}
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
