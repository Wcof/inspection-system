<template>
  <div class="point-manage">
    <a-page-header title="点位管理" sub-title="在地图上新增和删除点位标记" @back="goBack">
      <template #extra>
        <a-select v-model:value="activeMapId" style="width: 280px" placeholder="请选择地图">
          <a-select-option v-for="map in maps" :key="map.id" :value="map.id">
            {{ map.name }}
          </a-select-option>
        </a-select>
      </template>
    </a-page-header>

    <a-card style="margin-top: 16px">
      <a-row :gutter="16">
        <a-col :span="16">
          <div class="map-panel">
            <div class="map-panel-head">
              <a-space>
                <a-radio-group v-model:value="mapViewMode" button-style="solid">
                  <a-radio-button value="2d">2D</a-radio-button>
                  <a-radio-button value="3d">3D</a-radio-button>
                </a-radio-group>
                <span class="helper-text">
                  <template v-if="addMode">新增标记模式：点击地图空白处完成新增</template>
                  <template v-else-if="deleteMode">删除标记模式：点击标记可快速删除</template>
                  <template v-else>普通模式：点选标记可高亮对应列表项</template>
                </span>
              </a-space>
            </div>

            <div
              ref="mapStageRef"
              class="map-stage"
              :class="{ 'mode-3d': mapViewMode === '3d', adding: addMode, deleting: deleteMode }"
              @click="handleMapClick"
            >
              <img
                v-if="activeMap?.imageUrl"
                :src="activeMap.imageUrl"
                alt="地图预览"
                class="map-image"
              />
              <div v-else class="map-placeholder">
                <span>{{ activeMap?.name || '未选择地图' }}</span>
              </div>

              <button
                v-for="point in pointRows"
                :key="point.id"
                class="map-marker"
                :class="{ selected: selectedPointIds.includes(point.id), deleting: deleteMode }"
                :style="getMarkerStyle(point)"
                @click.stop="handleMarkerClick(point)"
              >
                {{ point.index }}
              </button>
            </div>
          </div>
        </a-col>

        <a-col :span="8">
          <div class="list-panel">
            <div class="list-toolbar">
              <a-space>
                <a-button :type="addMode ? 'primary' : 'default'" @click="toggleAddMode">
                  新增标记
                </a-button>
                <a-button :type="deleteMode ? 'primary' : 'default'" danger @click="toggleDeleteMode">
                  删除标记
                </a-button>
                <a-button danger :disabled="selectedPointIds.length === 0" @click="handleDeleteSelected">
                  删除选中
                </a-button>
              </a-space>
            </div>

            <a-table
              :columns="columns"
              :data-source="pointRows"
              row-key="id"
              size="small"
              :pagination="false"
              :scroll="{ y: 500 }"
              :row-selection="rowSelection"
            >
              <template #bodyCell="{ column, record }">
                <template v-if="column.key === 'pointType'">
                  <a-tag :color="record.bizType === '停车点' ? 'gold' : record.bizType === '充电点' ? 'green' : 'blue'">
                    {{ record.bizType }}
                  </a-tag>
                </template>
                <template v-if="column.key === 'location'">
                  {{ record.locationText }}
                </template>
                <template v-if="column.key === 'updatedBy'">
                  {{ record.updatedBy || '-' }}
                </template>
              </template>
            </a-table>
          </div>
        </a-col>
      </a-row>
    </a-card>

    <a-modal
      v-model:open="createPointVisible"
      title="新增点位"
      @ok="handleConfirmCreatePoint"
      @cancel="handleCancelCreatePoint"
      ok-text="确认新增"
      cancel-text="取消"
    >
      <a-form layout="vertical">
        <a-form-item label="点位名称" required>
          <a-input v-model:value="createPointForm.name" placeholder="请输入点位名称" />
        </a-form-item>
        <a-form-item label="点位类型" required>
          <a-select v-model:value="createPointForm.bizType" placeholder="请选择点位类型">
            <a-select-option v-for="type in pointBizTypeOptions" :key="type" :value="type">
              {{ type }}
            </a-select-option>
          </a-select>
        </a-form-item>
        <a-alert type="info" show-icon>
          <template #message>已定位坐标：X={{ pendingPoint.x }}，Y={{ pendingPoint.y }}</template>
        </a-alert>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { Modal, message } from 'ant-design-vue'
import { useInspectionStore } from '@/stores/inspection'
import { CalibrationStatus, InspectionPointType, PositionSource, type InspectionPoint } from '@/types/inspection'
import { ExceptionStrategy } from '@/types/robot'

const router = useRouter()
const route = useRoute()
const inspectionStore = useInspectionStore()

const mapStageRef = ref<HTMLElement | null>(null)
const activeMapId = ref('')
const mapViewMode = ref<'2d' | '3d'>('2d')
const addMode = ref(false)
const deleteMode = ref(false)
const selectedPointIds = ref<string[]>([])
const createPointVisible = ref(false)
const pendingPoint = ref({ x: 0, y: 0 })
const pointBizTypeOptions = ['巡检点', '停车点', '充电点'] as const
type PointBizType = typeof pointBizTypeOptions[number]
const createPointForm = ref<{ name: string; bizType: PointBizType }>({
  name: '',
  bizType: '巡检点'
})

const maps = computed(() => inspectionStore.inspectionMaps)
const activeMap = computed(() => maps.value.find(m => m.id === activeMapId.value))
const points = computed(() => inspectionStore.inspectionPoints.filter(p => p.mapId === activeMapId.value))

const pointRows = computed(() =>
  points.value
    .slice()
    .sort((a, b) => (a.sequence || 0) - (b.sequence || 0))
    .map((point, idx) => ({
      ...point,
      index: idx + 1,
      bizType: getPointBizType(point),
      locationText: `${point.location.longitude.toFixed(6)}, ${point.location.latitude.toFixed(6)}`
    }))
)

const columns = [
  { title: '序号', dataIndex: 'index', key: 'index', width: 70 },
  { title: '点位名称', dataIndex: 'name', key: 'name', width: 140 },
  { title: '点位类型', key: 'pointType', width: 100 },
  { title: '点位经纬度', key: 'location' },
  { title: '更新人', key: 'updatedBy', width: 100 }
]

const rowSelection = computed(() => ({
  selectedRowKeys: selectedPointIds.value,
  onChange: (keys: string[]) => {
    selectedPointIds.value = keys
  }
}))

function goBack() {
  router.push('/implementation/map/list')
}

function toggleAddMode() {
  addMode.value = !addMode.value
  if (addMode.value) {
    deleteMode.value = false
  }
}

function toggleDeleteMode() {
  deleteMode.value = !deleteMode.value
  if (deleteMode.value) {
    addMode.value = false
  }
}

function getMarkerStyle(point: InspectionPoint & { index: number }) {
  const x = point.mapPosition?.x ?? 0
  const y = point.mapPosition?.y ?? 0
  return {
    left: `${x}px`,
    top: `${y}px`
  }
}

function handleMapClick(event: MouseEvent) {
  if (!addMode.value || !activeMapId.value || !mapStageRef.value) return

  const rect = mapStageRef.value.getBoundingClientRect()
  const x = Math.max(12, Math.min(rect.width - 12, event.clientX - rect.left))
  const y = Math.max(12, Math.min(rect.height - 12, event.clientY - rect.top))
  pendingPoint.value = { x: Math.round(x), y: Math.round(y) }
  const nextIndex = pointRows.value.length + 1
  createPointForm.value = {
    name: `点位-${nextIndex}`,
    bizType: '巡检点'
  }
  createPointVisible.value = true
}

function getPointBizType(point: InspectionPoint): PointBizType {
  const matched = point.description?.match(/^\[(巡检点|停车点|充电点)\]\s*/)
  if (matched?.[1] && pointBizTypeOptions.includes(matched[1] as PointBizType)) {
    return matched[1] as PointBizType
  }
  return '巡检点'
}

function getPointCodePrefix(type: PointBizType) {
  if (type === '停车点') return 'PK'
  if (type === '充电点') return 'CH'
  return 'IP'
}

function handleConfirmCreatePoint() {
  if (!activeMapId.value) {
    message.error('请先选择地图')
    return
  }
  if (!createPointForm.value.name.trim()) {
    message.error('请填写点位名称')
    return
  }

  const x = pendingPoint.value.x
  const y = pendingPoint.value.y
  const now = new Date()
  const nextIndex = pointRows.value.length + 1

  const baseLat = activeMap.value?.geographicCoordinates?.latitude || 31.2304
  const baseLng = activeMap.value?.geographicCoordinates?.longitude || 121.4737
  const codePrefix = getPointCodePrefix(createPointForm.value.bizType)

  inspectionStore.saveInspectionPoint({
    id: `point-${Date.now()}`,
    name: createPointForm.value.name.trim(),
    code: `${codePrefix}-${String(Date.now()).slice(-6)}`,
    pointType: InspectionPointType.FIXED,
    description: `[${createPointForm.value.bizType}] ${activeMap.value?.name || '地图'}新增点位`,
    mapId: activeMapId.value,
    location: {
      longitude: Number((baseLng + x / 100000).toFixed(6)),
      latitude: Number((baseLat + y / 100000).toFixed(6)),
      altitude: 0
    },
    mapPosition: { x: Math.round(x), y: Math.round(y), yaw: 0 },
    sequence: nextIndex,
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
    lastMapPickAt: now,
    createdAt: now,
    updatedAt: now,
    updatedBy: '系统管理员'
  })
  createPointVisible.value = false
  message.success('点位新增成功')
}

function handleCancelCreatePoint() {
  createPointVisible.value = false
}

function handleMarkerClick(point: InspectionPoint & { index: number }) {
  if (deleteMode.value) {
    Modal.confirm({
      title: '确认删除',
      content: `确定删除点位 ${point.name} 吗？`,
      okText: '确定',
      cancelText: '取消',
      onOk() {
        inspectionStore.deleteInspectionPoint(point.id)
        selectedPointIds.value = selectedPointIds.value.filter(id => id !== point.id)
        message.success('删除成功')
      }
    })
    return
  }
  selectedPointIds.value = [point.id]
}

function handleDeleteSelected() {
  if (selectedPointIds.value.length === 0) return
  Modal.confirm({
    title: '确认批量删除',
    content: `确定删除选中的 ${selectedPointIds.value.length} 个点位吗？`,
    okText: '确定',
    cancelText: '取消',
    onOk() {
      selectedPointIds.value.forEach(id => inspectionStore.deleteInspectionPoint(id))
      selectedPointIds.value = []
      message.success('批量删除成功')
    }
  })
}

onMounted(() => {
  inspectionStore.initialize()
  activeMapId.value = (route.query.mapId as string) || inspectionStore.inspectionMaps[0]?.id || ''
})
</script>

<style scoped lang="scss">
.point-manage {
  width: 100%;

  .map-panel,
  .list-panel {
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    background: #fff;
    overflow: hidden;
  }

  .map-panel-head,
  .list-toolbar {
    padding: 10px 12px;
    border-bottom: 1px solid #f0f0f0;
    background: #fafafa;
  }

  .helper-text {
    color: #8c8c8c;
  }

  .map-stage {
    position: relative;
    height: 620px;
    overflow: hidden;
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
    cursor: default;
  }

  .map-stage.adding {
    cursor: crosshair;
  }

  .map-stage.mode-3d {
    transform: perspective(1300px) rotateX(12deg);
    transform-origin: center center;
  }

  .map-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    user-select: none;
    pointer-events: none;
  }

  .map-placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #475569;
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 1px;
  }

  .map-marker {
    position: absolute;
    width: 28px;
    height: 28px;
    border: 2px solid #fff;
    border-radius: 50%;
    background: #1677ff;
    color: #fff;
    font-weight: 600;
    cursor: pointer;
    transform: translate(-50%, -50%);
    box-shadow: 0 4px 10px rgba(0, 0, 0, 0.25);
    z-index: 3;
  }

  .map-marker.selected {
    background: #22c55e;
  }

  .map-marker.deleting {
    background: #ef4444;
  }

  .list-panel {
    display: flex;
    flex-direction: column;
    height: 680px;
  }

  :deep(.list-panel .ant-table-wrapper) {
    flex: 1;
    min-height: 0;
  }

  :deep(.list-panel .ant-table) {
    border: none;
    border-radius: 0;
  }

  :deep(.list-panel .ant-table-thead > tr > th) {
    background: #fafafa;
    white-space: nowrap;
  }
}
</style>
