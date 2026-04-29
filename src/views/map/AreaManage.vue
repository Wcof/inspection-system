<template>
  <div class="area-manage">
    <a-page-header
      :title="isListMode ? '区域管理' : `区域管理 - ${currentMap?.name || '未命名地图'}`"
      :sub-title="isListMode ? '菜单入口展示区域列表；新增后进入地图内区域配置' : '支持不规则多边形区域绘制'"
    >
      <template #extra>
        <a-space v-if="isListMode">
          <a-button type="primary" @click="openCreateFromList">新增区域</a-button>
        </a-space>
        <a-space v-else>
          <a-button @click="backToList">返回区域列表</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-card v-if="isListMode" style="margin-top: 16px">
      <a-table :columns="listColumns" :data-source="regionListRows" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="goToMapScopedPage(record.mapId)">进入地图区域管理</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-row v-else :gutter="16" style="margin-top: 16px">
      <a-col :span="16">
        <a-card title="地图区域绘制">
          <div class="panel-toolbar">
            <a-space>
              <a-button type="primary" @click="startPolygon">开始区域</a-button>
              <a-button :disabled="draftPoints.length < 3" @click="finishPolygon">完成区域绘制</a-button>
              <a-button @click="draftPoints = []">清空草稿</a-button>
            </a-space>
            <div class="help-text">点击画布依次落点，形成不规则多边形区域。</div>
          </div>
          <div class="map-stage" @click="appendPoint($event)">
            <svg viewBox="0 0 1000 560" class="map-svg" preserveAspectRatio="none">
              <rect x="0" y="0" width="1000" height="560" fill="#f6f8fb" />
              <polygon v-for="region in regions" :key="region.id" :points="region.points" fill="rgba(22,119,255,.15)" stroke="#1677ff" stroke-width="2" />
              <polygon v-if="draftPoints.length" :points="draftPolygon" fill="rgba(250,173,20,.18)" stroke="#faad14" stroke-width="2" stroke-dasharray="6 4" />
              <circle v-for="(point, idx) in draftPoints" :key="idx" :cx="point.x" :cy="point.y" r="5" fill="#faad14" />
            </svg>
          </div>
        </a-card>
      </a-col>
      <a-col :span="8">
        <a-card title="区域列表">
          <a-table :columns="columns" :data-source="regions" row-key="id" :pagination="false" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'actions'">
                <a-button type="link" size="small" danger @click="deleteRegion(record.id)">删除</a-button>
              </template>
            </template>
          </a-table>
        </a-card>
      </a-col>
    </a-row>

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
import { message } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import type { InspectionMap } from '@/types/inspection'

interface RegionRow {
  id: string
  mapId: string
  mapName: string
  name: string
  shape: string
}

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()

const drawing = ref(false)
const draftPoints = ref<Array<{ x: number; y: number }>>([])
const regions = ref<Array<{ id: string; name: string; points: string; color: string }>>([])
const createFromListVisible = ref(false)
const selectedMapForCreate = ref('')

const selectedMapId = computed(() => (typeof route.query.mapId === 'string' ? route.query.mapId : ''))
const isListMode = computed(() => !selectedMapId.value)
const currentMap = computed(() => inspectionStore.inspectionMaps.find(map => map.id === selectedMapId.value))

const listColumns = [
  { title: '区域名称', dataIndex: 'name', key: 'name' },
  { title: '所属地图', dataIndex: 'mapName', key: 'mapName', width: 220 },
  { title: '图形', dataIndex: 'shape', key: 'shape', width: 120 },
  { title: '操作', key: 'actions', width: 220 }
]

const columns = [
  { title: '区域名称', dataIndex: 'name', key: 'name' },
  { title: '图形', key: 'shape', customRender: () => '多边形' },
  { title: '操作', key: 'actions', width: 100 }
]

const draftPolygon = computed(() => draftPoints.value.map((point) => `${point.x},${point.y}`).join(' '))
const regionListRows = computed<RegionRow[]>(() => {
  return inspectionStore.inspectionMaps.flatMap((map) => {
    return (map.regions || []).map((region) => ({
      id: `${map.id}-${region.id}`,
      mapId: map.id,
      mapName: map.name,
      name: region.name,
      shape: '矩形/多边形'
    }))
  })
})

function initializeBase() {
  inspectionStore.initialize()
}

function mapRegionToPolygon(region: NonNullable<InspectionMap['regions']>[number]) {
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
  const parsed = points
    .split(' ')
    .map(item => item.trim())
    .filter(Boolean)
    .map((item) => {
      const [x, y] = item.split(',').map(Number)
      return { x, y }
    })

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

function loadRegions() {
  if (isListMode.value || !currentMap.value) {
    regions.value = []
    return
  }

  regions.value = (currentMap.value.regions || []).map((region) => ({
    id: region.id,
    name: region.name,
    color: region.color,
    points: mapRegionToPolygon(region)
  }))
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
        height: rect.height
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

function startPolygon() {
  drawing.value = true
  draftPoints.value = []
  message.info('请在画布上点击落点')
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
  regions.value.push({
    id: `area-${Date.now()}`,
    name: `新区域-${regions.value.length + 1}`,
    color: '#1677ff',
    points: draftPolygon.value
  })
  drawing.value = false
  draftPoints.value = []
  saveRegions()
  message.success('区域已创建')
}

function deleteRegion(regionId: string) {
  regions.value = regions.value.filter(item => item.id !== regionId)
  saveRegions()
  message.success('区域已删除')
}

function handleRouteIntent() {
  if (isListMode.value) return
  if (route.query.action === 'create') {
    startPolygon()
    router.replace({ path: '/implementation/map/area-manage', query: { mapId: selectedMapId.value } })
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
  height: 560px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  cursor: crosshair;
}

.map-svg {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
