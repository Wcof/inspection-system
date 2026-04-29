<template>
  <div class="point-manage">
    <a-page-header
      :title="isListMode ? '地图执行点管理' : `地图执行点管理 - ${currentMap?.name || '未命名地图'}`"
      :sub-title="isListMode ? '菜单入口展示停车点、充电站、通行点；新增后进入地图内配置' : '维护机器人地图执行点，不在这里创建业务巡检点'"
    >
      <template #extra>
        <a-space v-if="isListMode">
          <a-button type="primary" @click="openCreateFromList">新增执行点</a-button>
        </a-space>
        <a-space v-else>
          <a-button @click="backToList">返回执行点列表</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-card v-if="isListMode" style="margin-top: 16px">
      <a-table :columns="listColumns" :data-source="pointListRows" row-key="id">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'pointType'">
            <a-tag>{{ pointTypeText(record.bizType) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="goToMapScopedPage(record.mapId)">进入地图执行点管理</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <template v-else>
      <div class="layout-grid">
        <a-card class="map-card" title="位置管理">
          <template #extra>
            <a-space v-if="mode !== 'moving'">
              <a-button type="primary" @click="enterAddMode">新增执行点</a-button>
              <a-button @click="enterMoveMode">移动执行点</a-button>
            </a-space>
            <a-space v-else>
              <a-button type="primary" @click="confirmMove">确认</a-button>
              <a-button @click="cancelMove">取消</a-button>
            </a-space>
          </template>

          <div class="map-stage" :style="mapStageStyle" @click="handleStageClick">
            <div class="map-mask" />
            <div class="map-tip">
              <template v-if="mode === 'adding'">新增模式：在地图中点击位置后填写执行点信息。</template>
              <template v-else-if="mode === 'moving'">移动模式：先点击一个执行点，再点击地图新位置。</template>
              <template v-else>查看模式：可点击执行点高亮，或切换到新增/移动模式。</template>
            </div>

            <div
              v-for="point in points"
              :key="point.id"
              class="marker"
              :class="{
                active: point.id === selectedPointId,
                moving: mode === 'moving' && point.id === activeMovePointId
              }"
              :style="{ left: `${point.mapX}%`, top: `${point.mapY}%` }"
              @click.stop="handlePointClick(point)"
            >
              <span class="marker-dot">{{ getShortType(point.bizType) }}</span>
              <span class="marker-text">{{ point.name }}</span>
            </div>
          </div>
        </a-card>

        <a-card title="属性管理列表">
          <a-table :columns="columns" :data-source="points" row-key="id" :pagination="false" :scroll="{ y: 520 }">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'pointType'">
                <template v-if="editingId === record.id">
                  <a-select v-model:value="inlineEdit.type" style="width: 120px">
                    <a-select-option value="parking">停车点</a-select-option>
                    <a-select-option value="charging">充电站</a-select-option>
                    <a-select-option value="transit">通行点</a-select-option>
                  </a-select>
                </template>
                <a-tag v-else>{{ pointTypeText(record.bizType) }}</a-tag>
              </template>

              <template v-else-if="column.key === 'name'">
                <template v-if="editingId === record.id">
                  <a-input v-model:value="inlineEdit.name" />
                </template>
                <template v-else>{{ record.name }}</template>
              </template>

              <template v-else-if="column.key === 'location'">
                {{ record.mapX.toFixed(2) }}, {{ record.mapY.toFixed(2) }}
              </template>

              <template v-else-if="column.key === 'actions'">
                <a-space>
                  <template v-if="editingId === record.id">
                    <a-button type="link" size="small" @click="saveInlineEdit(record)">保存</a-button>
                    <a-button type="link" size="small" @click="cancelInlineEdit">取消</a-button>
                  </template>
                  <template v-else>
                    <a-button type="link" size="small" @click="openInlineEdit(record)">编辑</a-button>
                    <a-button type="link" size="small" danger @click="deletePoint(record)">删除</a-button>
                  </template>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-card>
      </div>

      <a-modal v-model:open="addModalVisible" title="新增地图执行点" @ok="createPoint" @cancel="cancelAdd">
        <a-form layout="vertical">
          <a-form-item label="执行点名称" required>
            <a-input v-model:value="addForm.name" placeholder="请输入执行点名称" />
          </a-form-item>
          <a-form-item label="执行点类型" required>
            <a-select v-model:value="addForm.type">
              <a-select-option value="parking">停车点</a-select-option>
              <a-select-option value="charging">充电站</a-select-option>
              <a-select-option value="transit">通行点</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="所属区域">
            <a-select v-model:value="addForm.areaId" allow-clear placeholder="请选择区域">
              <a-select-option v-for="area in areaOptions" :key="area.id" :value="area.id">{{ area.name }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="地图坐标">
            <a-input :value="`${addForm.mapX.toFixed(2)}, ${addForm.mapY.toFixed(2)}`" disabled />
          </a-form-item>
        </a-form>
      </a-modal>
    </template>

    <a-modal
      v-model:open="createFromListVisible"
      title="选择地图后新增执行点"
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
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import { CalibrationStatus, InspectionPointType, PositionSource } from '@/types/inspection'
import { ExceptionStrategy } from '@/types'
import type { InspectionPoint, MapRegion } from '@/types/inspection'

type BizPointType = 'parking' | 'charging' | 'transit'
type Mode = 'normal' | 'adding' | 'moving'

interface PointRow {
  id: string
  name: string
  code: string
  mapId: string
  mapName: string
  mapX: number
  mapY: number
  areaId?: string
  areaName?: string
  bizType: BizPointType
  raw: InspectionPoint
}

const inspectionStore = useInspectionStore()
const route = useRoute()
const router = useRouter()

const selectedMapId = computed(() => (typeof route.query.mapId === 'string' ? route.query.mapId : ''))
const isListMode = computed(() => !selectedMapId.value)

const points = ref<PointRow[]>([])
const mode = ref<Mode>('normal')
const selectedPointId = ref('')
const activeMovePointId = ref('')

const editingId = ref('')
const inlineEdit = reactive({ name: '', type: 'parking' as BizPointType })

const addModalVisible = ref(false)
const addForm = reactive({
  name: '',
  type: 'parking' as BizPointType,
  areaId: '',
  mapX: 0,
  mapY: 0
})

const createFromListVisible = ref(false)
const selectedMapForCreate = ref('')

const moveDraft = ref<Record<string, { x: number; y: number }>>({})
const fallbackMapBackgroundUrl = new URL('../../地图.png', import.meta.url).href

const columns = [
  { title: '执行点名称', dataIndex: 'name', key: 'name' },
  { title: '执行点编码', dataIndex: 'code', key: 'code', width: 160 },
  { title: '执行点类型', key: 'pointType', width: 140 },
  { title: '所属区域', dataIndex: 'areaName', key: 'areaName', width: 150 },
  { title: '地图坐标', key: 'location', width: 170 },
  { title: '操作', key: 'actions', width: 140 }
]

const listColumns = [
  { title: '执行点名称', dataIndex: 'name', key: 'name' },
  { title: '地图', dataIndex: 'mapName', key: 'mapName', width: 180 },
  { title: '所属区域', dataIndex: 'areaName', key: 'areaName', width: 180 },
  { title: '执行点类型', key: 'pointType', width: 140 },
  { title: '操作', key: 'actions', width: 220 }
]

const currentMap = computed(() => inspectionStore.inspectionMaps.find(map => map.id === selectedMapId.value))
const areaOptions = computed(() => currentMap.value?.regions || [])
const pointListRows = computed(() => {
  return inspectionStore.inspectionPoints.filter(isMapExecutionPoint).map((point) => {
    const map = inspectionStore.inspectionMaps.find(item => item.id === point.mapId)
    return {
      id: point.id,
      name: point.name,
      mapId: point.mapId,
      mapName: map?.name || point.mapId,
      areaName: point.areaName || '-',
      bizType: getBizTypeFromDescription(point.description)
    }
  })
})

const mapStageStyle = computed(() => ({
  backgroundImage: `url(${currentMap.value?.imageUrl || fallbackMapBackgroundUrl})`,
  backgroundColor: '#eef3ff'
}))

function normalizeMapCoordinate(value?: number) {
  const raw = Number(value || 0)
  if (raw <= 100) return clamp(raw)
  if (raw <= 1000) return clamp(raw / 10)
  return clamp(raw / 20)
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Number(value.toFixed(2))))
}

function getBizTypeFromDescription(description?: string): BizPointType {
  const tag = String(description || '').match(/^\[(巡检点|停车点|充电点|充电站|通行点)\]/)?.[1]
  if (tag === '充电点' || tag === '充电站') return 'charging'
  if (tag === '通行点') return 'transit'
  if (tag === '停车点') return 'parking'
  return 'parking'
}

function getDescriptionByBizType(type: BizPointType, name: string) {
  if (type === 'charging') return `[充电站] ${name}`
  if (type === 'transit') return `[通行点] ${name}`
  return `[停车点] ${name}`
}

function pointTypeText(type: BizPointType) {
  if (type === 'charging') return '充电站'
  if (type === 'transit') return '通行点'
  return '停车点'
}

function getShortType(type: BizPointType) {
  if (type === 'charging') return '充'
  if (type === 'transit') return '通'
  return '停'
}

function isMapExecutionPoint(point: InspectionPoint) {
  if (point.parkingPoints?.length) return false
  const tag = String(point.description || '').match(/^\[(巡检点|停车点|充电点|充电站|通行点)\]/)?.[1]
  return tag !== '巡检点'
}

function normalizeRegion(region: MapRegion) {
  if (region.x <= 100 && region.y <= 100 && region.width <= 100 && region.height <= 100) {
    return region
  }
  return {
    ...region,
    x: region.x / 8,
    y: region.y / 6,
    width: region.width / 8,
    height: region.height / 6
  }
}

function detectAreaByPoint(x: number, y: number) {
  const hit = areaOptions.value.find((region) => {
    const normalized = normalizeRegion(region)
    return x >= normalized.x && x <= normalized.x + normalized.width && y >= normalized.y && y <= normalized.y + normalized.height
  })
  return hit || null
}

function initializeBase() {
  inspectionStore.initialize()
}

function loadPoints() {
  if (isListMode.value || !selectedMapId.value) {
    points.value = []
    return
  }

  const all = inspectionStore.inspectionPoints.filter(point => point.mapId === selectedMapId.value && isMapExecutionPoint(point))
  points.value = all.map((point) => ({
    id: point.id,
    name: point.name,
    code: point.code,
    mapId: point.mapId,
    mapName: currentMap.value?.name || point.mapId,
    mapX: normalizeMapCoordinate(point.mapPosition?.x),
    mapY: normalizeMapCoordinate(point.mapPosition?.y),
    areaId: point.areaId,
    areaName: point.areaName || areaOptions.value.find(region => region.id === point.areaId)?.name || '',
    bizType: getBizTypeFromDescription(point.description),
    raw: point
  }))

  if (!selectedPointId.value && points.value[0]) {
    selectedPointId.value = points.value[0].id
  }
}

function goToMapScopedPage(mapId: string, action?: 'create') {
  router.push({
    path: '/implementation/map/point-manage',
    query: action ? { mapId, action } : { mapId }
  })
}

function backToList() {
  router.push('/implementation/map/point-manage')
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

function buildAndSavePoint(row: PointRow, patch: Partial<PointRow>) {
  const next = { ...row, ...patch }
  const area = areaOptions.value.find(item => item.id === next.areaId)
  inspectionStore.saveInspectionPoint({
    ...row.raw,
    name: next.name,
    code: next.code,
    mapId: next.mapId,
    pointType: InspectionPointType.FIXED,
    description: getDescriptionByBizType(next.bizType, next.name),
    areaId: next.areaId,
    areaName: area?.name || next.areaName || '',
    mapPosition: { x: next.mapX, y: next.mapY, yaw: row.raw.mapPosition?.yaw || 0 },
    positionSource: PositionSource.MANUAL_ADJUST,
    updatedAt: new Date()
  })
}

function openInlineEdit(record: PointRow) {
  editingId.value = record.id
  inlineEdit.name = record.name
  inlineEdit.type = record.bizType
}

function saveInlineEdit(record: PointRow) {
  const name = inlineEdit.name.trim()
  if (!name) {
    message.warning('请填写执行点名称')
    return
  }
  buildAndSavePoint(record, { name, bizType: inlineEdit.type })
  editingId.value = ''
  message.success('执行点属性已更新')
  loadPoints()
}

function cancelInlineEdit() {
  editingId.value = ''
}

function deletePoint(record: PointRow) {
  Modal.confirm({
    title: '确认删除该执行点？',
    content: `执行点 ${record.name} 删除后不可恢复。`,
    okText: '确认删除',
    okButtonProps: { danger: true },
    cancelText: '取消',
    onOk() {
      inspectionStore.deleteInspectionPoint(record.id)
      message.success('已删除执行点')
      loadPoints()
    }
  })
}

function getClickPosition(event: MouseEvent) {
  const stage = event.currentTarget as HTMLElement
  const rect = stage.getBoundingClientRect()
  const x = clamp(((event.clientX - rect.left) / rect.width) * 100)
  const y = clamp(((event.clientY - rect.top) / rect.height) * 100)
  return { x, y }
}

function enterAddMode() {
  mode.value = 'adding'
  activeMovePointId.value = ''
  message.info('已进入新增模式，请在地图点击位置创建执行点')
}

function enterMoveMode() {
  mode.value = 'moving'
  activeMovePointId.value = ''
  moveDraft.value = {}
  message.info('已进入移动模式，请先点击一个执行点再点击地图新位置')
}

function handlePointClick(point: PointRow) {
  selectedPointId.value = point.id
  if (mode.value === 'moving') {
    activeMovePointId.value = point.id
    if (!moveDraft.value[point.id]) {
      moveDraft.value[point.id] = { x: point.mapX, y: point.mapY }
    }
  }
}

function handleStageClick(event: MouseEvent) {
  const position = getClickPosition(event)

  if (mode.value === 'adding') {
    addForm.name = ''
    addForm.type = 'parking'
    addForm.mapX = position.x
    addForm.mapY = position.y
    const area = detectAreaByPoint(position.x, position.y)
    addForm.areaId = area?.id || ''
    addModalVisible.value = true
    return
  }

  if (mode.value === 'moving') {
    if (!activeMovePointId.value) {
      message.warning('请先点击一个执行点')
      return
    }
    moveDraft.value[activeMovePointId.value] = { x: position.x, y: position.y }
    points.value = points.value.map((point) =>
      point.id === activeMovePointId.value
        ? { ...point, mapX: position.x, mapY: position.y }
        : point
    )
  }
}

function cancelAdd() {
  addModalVisible.value = false
  if (mode.value === 'adding') {
    mode.value = 'normal'
  }
}

function createPoint() {
  const name = addForm.name.trim()
  if (!name || !selectedMapId.value) {
    message.warning('请填写执行点名称')
    return
  }
  const area = areaOptions.value.find(item => item.id === addForm.areaId)
  const newPoint: InspectionPoint = {
    id: `point-${Date.now()}`,
    name,
    code: `IP-${Math.floor(Math.random() * 900 + 100)}`,
    pointType: InspectionPointType.FIXED,
    description: getDescriptionByBizType(addForm.type, name),
    mapId: selectedMapId.value,
    areaId: addForm.areaId || undefined,
    areaName: area?.name || '',
    location: {
      longitude: Number((120 + addForm.mapX / 1000).toFixed(6)),
      latitude: Number((30 + addForm.mapY / 1000).toFixed(6)),
      altitude: 0
    },
    mapPosition: { x: addForm.mapX, y: addForm.mapY, yaw: 0 },
    sequence: points.value.length + 1,
    calibrationStatus: CalibrationStatus.PENDING,
    stayDurationSec: 30,
    monitorPoints: [],
    isCritical: false,
    exceptionStrategy: {
      onFailure: ExceptionStrategy.SKIP,
      retryCount: 3,
      skipToNext: true
    },
    positionSource: PositionSource.MAP_PICK,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  inspectionStore.saveInspectionPoint(newPoint)
  addModalVisible.value = false
  mode.value = 'normal'
  message.success('执行点新增成功')
  loadPoints()
}

function confirmMove() {
  const draftIds = Object.keys(moveDraft.value)
  if (!draftIds.length) {
    message.warning('尚未移动任何执行点')
    return
  }

  draftIds.forEach((id) => {
    const row = points.value.find(point => point.id === id)
    const draft = moveDraft.value[id]
    if (!row || !draft) return
    buildAndSavePoint(row, { mapX: draft.x, mapY: draft.y })
  })

  mode.value = 'normal'
  activeMovePointId.value = ''
  moveDraft.value = {}
  message.success('执行点位置已更新')
  loadPoints()
}

function cancelMove() {
  mode.value = 'normal'
  activeMovePointId.value = ''
  moveDraft.value = {}
  loadPoints()
}

function handleRouteIntent() {
  if (isListMode.value) return
  if (route.query.action === 'create') {
    enterAddMode()
    router.replace({ path: '/implementation/map/point-manage', query: { mapId: selectedMapId.value } })
  }
}

watch(
  () => route.fullPath,
  () => {
    loadPoints()
    handleRouteIntent()
  }
)

onMounted(() => {
  initializeBase()
  loadPoints()
  handleRouteIntent()
})
</script>

<style scoped lang="css">
.layout-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 12px;
  margin-top: 16px;
}

.map-card {
  min-width: 0;
}

.map-stage {
  position: relative;
  min-height: 620px;
  border-radius: 12px;
  border: 1px solid #b4c9ff;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  overflow: hidden;
}

.map-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(4, 12, 26, 0.12) 0%, rgba(4, 12, 26, 0.26) 100%);
}

.map-tip {
  position: absolute;
  left: 12px;
  top: 12px;
  z-index: 2;
  padding: 6px 10px;
  border-radius: 6px;
  color: #334155;
  font-size: 12px;
  background: rgba(255, 255, 255, 0.9);
}

.marker {
  position: absolute;
  transform: translate(-50%, -50%);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  z-index: 3;
}

.marker-dot {
  display: inline-flex;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  background: #2f54eb;
  color: #fff;
  font-size: 12px;
  box-shadow: 0 4px 12px rgba(47, 84, 235, 0.22);
}

.marker.active .marker-dot {
  background: #1677ff;
  box-shadow: 0 0 0 3px rgba(22, 119, 255, 0.2);
}

.marker.moving .marker-dot {
  background: #f59e0b;
}

.marker-text {
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid #d9d9d9;
  font-size: 12px;
}

@media (max-width: 1200px) {
  .layout-grid {
    grid-template-columns: 1fr;
  }
}
</style>
