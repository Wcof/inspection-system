<template>
  <div class="inspection-point-create">
    <a-page-header :title="isEdit ? '编辑巡检点组成' : '新增巡检点'" sub-title="通过勾选地图停车点，组合形成业务巡检点" @back="goBack" />

    <a-card style="margin-top: 16px">
      <a-form :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="巡检点名称" required>
              <a-input v-model:value="form.name" placeholder="请输入巡检点名称" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="编码" required>
              <a-input v-model:value="form.code" placeholder="请输入编码" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="地图" required>
              <a-select v-model:value="form.mapId" placeholder="请选择地图">
                <a-select-option v-for="map in inspectionStore.inspectionMaps" :key="map.id" :value="map.id">
                  {{ map.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="所属区域（可多选，支持跨区域作业）">
              <a-select v-model:value="form.areaIds" mode="multiple" allow-clear placeholder="请选择一个或多个区域">
                <a-select-option v-for="region in activeRegions" :key="region.id" :value="region.id">
                  {{ region.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="选中点位">
              <a-alert
                type="info"
                show-icon
                :message="`已选择 ${selectedSourceIds.length} 个停车点`"
                description="巡检点只能由地图停车点聚合生成，不能选择充电站、通行点或已有巡检点。"
              />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>

      <a-table
        :columns="columns"
        :data-source="sourceRows"
        :loading="loading"
        row-key="id"
        :pagination="{ pageSize: 8 }"
        :row-selection="rowSelection"
      >
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'bizType'">
            <a-tag color="orange">{{ record.bizType }}</a-tag>
          </template>
          <template v-if="column.key === 'position'">
            {{ record.mapX.toFixed(2) }}, {{ record.mapY.toFixed(2) }}
          </template>
        </template>
      </a-table>

      <div class="footer-actions">
        <a-space>
          <a-button type="primary" :loading="saving" @click="handleSave">{{ isEdit ? '保存修改' : '保存' }}</a-button>
          <a-button @click="goBack">取消</a-button>
        </a-space>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import { CalibrationStatus, InspectionPointType, PositionSource } from '@/types/inspection'
import { ExceptionStrategy } from '@/types'
import type { InspectionPoint, ParkingPoint, CollectionPose } from '@/types/inspection'
import { message } from 'ant-design-vue'

interface SourcePointRow {
  id: string
  name: string
  code: string
  mapId: string
  areaId?: string
  areaName?: string
  mapX: number
  mapY: number
  mapYaw: number
  location: InspectionPoint['location']
  bizType: '停车点'
}

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()
const isEdit = computed(() => Boolean(route.params.id))

const loading = ref(false)
const saving = ref(false)
const hydrating = ref(true)
const selectedSourceIds = ref<string[]>([])

const form = reactive({
  name: '',
  code: '',
  mapId: '',
  areaIds: [] as string[]
})

const columns = [
  { title: '点位名称', dataIndex: 'name', key: 'name' },
  { title: '编码', dataIndex: 'code', key: 'code', width: 140 },
  { title: '点位类型', key: 'bizType', width: 110 },
  { title: '所属区域', dataIndex: 'areaName', key: 'areaName', width: 120 },
  { title: '地图坐标', key: 'position', width: 160 }
]

const currentPoint = computed(() => {
  if (!isEdit.value) return null
  return inspectionStore.inspectionPoints.find((point) => point.id === String(route.params.id)) || null
})

const activeMap = computed(() => inspectionStore.inspectionMaps.find(map => map.id === form.mapId))
const activeRegions = computed(() => activeMap.value?.regions || [])

const sourceRows = computed<SourcePointRow[]>(() => {
  return inspectionStore.inspectionPoints
    .filter((point) => canBeSourcePoint(point))
    .filter((point) => !form.mapId || point.mapId === form.mapId)
    .filter((point) => {
      if (!form.areaIds.length) return true
      if (!point.areaId) return false
      return form.areaIds.includes(point.areaId)
    })
    .map((point) => ({
      id: point.id,
      name: point.name,
      code: point.code,
      mapId: point.mapId,
      areaId: point.areaId,
      areaName: resolveAreaName(point),
      mapX: Number(point.mapPosition?.x || 0),
      mapY: Number(point.mapPosition?.y || 0),
      mapYaw: Number(point.mapPosition?.yaw || 0),
      location: point.location,
      bizType: '停车点'
    }))
})

const rowSelection = computed(() => ({
  selectedRowKeys: selectedSourceIds.value,
  onChange: (keys: Array<string | number>) => {
    selectedSourceIds.value = keys.map((item) => String(item))
  }
}))

function goBack() {
  router.push('/implementation/point/list')
}

function parseBizType(description?: string): '停车点' | '充电站' | '通行点' | '巡检点' {
  const tag = String(description || '').match(/^\[(巡检点|停车点|充电点|充电站|通行点)\]/)?.[1]
  if (tag === '巡检点') return '巡检点'
  if (tag === '充电点' || tag === '充电站') return '充电站'
  if (tag === '通行点') return '通行点'
  return '停车点'
}

function canBeSourcePoint(point: InspectionPoint) {
  if (!point.mapPosition) return false
  if (isEdit.value && point.id === currentPoint.value?.id) return false
  if (point.parkingPoints?.length) return false
  return parseBizType(point.description) === '停车点'
}

function resolveAreaName(point: InspectionPoint) {
  if (point.areaName) return point.areaName
  if (!point.areaId) return '未分区'
  const allRegions = inspectionStore.inspectionMaps.flatMap((map) => map.regions || [])
  return allRegions.find(region => region.id === point.areaId)?.name || '未分区'
}

function buildCollectionPose(source: SourcePointRow, parkingPointId: string): CollectionPose {
  return {
    id: `pose-${source.id}`,
    parkingPointId,
    targetName: source.name,
    targetType: 'asset',
    direction: 'overview',
    distanceMeter: 3,
    ptzYaw: source.mapYaw || 0,
    ptzPitch: 0,
    focalLength: '35mm',
    method: 'optical',
    collectableCondition: '视野无遮挡，目标可识别'
  }
}

function buildParkingPoints(sourceRowsData: SourcePointRow[], pointId: string): ParkingPoint[] {
  return sourceRowsData.map((row, index) => {
    const parkingPointId = `parking-${row.id}-${index + 1}`
    return {
      id: parkingPointId,
      inspectionPointId: pointId,
      name: row.name,
      position: { x: row.mapX, y: row.mapY, yaw: row.mapYaw },
      constraint: {
        reachable: true,
        reverseRequired: false,
        turnAroundRequired: false,
        narrowRoad: false,
        slope: false,
        bridgeRequired: false,
        detourRequired: false
      },
      collectionPoses: [buildCollectionPose(row, parkingPointId)]
    }
  })
}

function calculateCenterPosition(sourceRowsData: SourcePointRow[]) {
  const sum = sourceRowsData.reduce(
    (acc, row) => {
      acc.x += row.mapX
      acc.y += row.mapY
      acc.yaw += row.mapYaw
      return acc
    },
    { x: 0, y: 0, yaw: 0 }
  )
  const count = sourceRowsData.length || 1
  return {
    x: Number((sum.x / count).toFixed(2)),
    y: Number((sum.y / count).toFixed(2)),
    yaw: Number((sum.yaw / count).toFixed(2))
  }
}

function buildLocation(sourceRowsData: SourcePointRow[]) {
  const first = sourceRowsData[0]
  if (first?.location) return first.location
  const center = calculateCenterPosition(sourceRowsData)
  return {
    longitude: Number((120 + center.x / 1000).toFixed(6)),
    latitude: Number((30 + center.y / 1000).toFixed(6)),
    altitude: 0
  }
}

function nextSequence() {
  const current = inspectionStore.inspectionPoints
    .filter(point => point.mapId === form.mapId)
    .map(point => point.sequence || 0)
  return (Math.max(0, ...current) || 0) + 1
}

function inferSourcePointIdsFromParking(point: InspectionPoint) {
  if (point.sourceParkingPointIds?.length) return point.sourceParkingPointIds
  if (point.sourcePointIds?.length) return point.sourcePointIds
  const names = (point.parkingPoints || []).map(item => item.name)
  const candidates = inspectionStore.inspectionPoints.filter(item => item.mapId === point.mapId && !item.parkingPoints?.length)
  return candidates
    .filter(item => names.includes(item.name))
    .map(item => item.id)
}

async function handleSave() {
  if (!form.name.trim() || !form.code.trim() || !form.mapId) {
    message.error('请填写名称、编码、地图')
    return
  }
  if (!selectedSourceIds.value.length) {
    message.error('请至少勾选一个点位')
    return
  }

  const selectedRows = sourceRows.value.filter(row => selectedSourceIds.value.includes(row.id))
  if (!selectedRows.length) {
    message.error('未获取到已勾选点位')
    return
  }

  saving.value = true
  try {
    const centerPosition = calculateCenterPosition(selectedRows)
    const pointId = currentPoint.value?.id || `point-${Date.now()}`
    const areaNames = activeRegions.value.filter(region => form.areaIds.includes(region.id)).map(region => region.name)
    const parkingPoints = buildParkingPoints(selectedRows, pointId)

    const pointData: InspectionPoint = {
      id: pointId,
      name: form.name.trim(),
      code: form.code.trim(),
      pointType: InspectionPointType.FIXED,
      description: `[巡检点] ${form.name.trim()}`,
      mapId: form.mapId,
      areaId: form.areaIds[0] || undefined,
      areaName: areaNames.join('、'),
      areaIds: [...form.areaIds],
      areaNames,
      sourcePointIds: [...selectedSourceIds.value],
      sourceParkingPointIds: [...selectedSourceIds.value],
      workAreaName: areaNames.join('、'),
      location: buildLocation(selectedRows),
      mapPosition: centerPosition,
      sequence: currentPoint.value?.sequence || nextSequence(),
      calibrationStatus: currentPoint.value?.calibrationStatus || CalibrationStatus.PENDING,
      stayDurationSec: currentPoint.value?.stayDurationSec || 30,
      monitorPoints: currentPoint.value?.monitorPoints || [],
      isCritical: currentPoint.value?.isCritical || false,
      exceptionStrategy: currentPoint.value?.exceptionStrategy || {
        onFailure: ExceptionStrategy.SKIP,
        retryCount: 3,
        skipToNext: true
      },
      positionSource: PositionSource.MANUAL_ADJUST,
      parkingPoints,
      calibratedAt: currentPoint.value?.calibratedAt,
      previewImageUrl: currentPoint.value?.previewImageUrl,
      createdAt: currentPoint.value?.createdAt || new Date(),
      updatedAt: new Date()
    }

    inspectionStore.saveInspectionPoint(pointData)
    message.success(isEdit.value ? '巡检点组成已更新' : '巡检点创建成功')
    goBack()
  } finally {
    saving.value = false
  }
}

function fillEditData() {
  if (!currentPoint.value) return
  form.name = currentPoint.value.name
  form.code = currentPoint.value.code
  form.mapId = currentPoint.value.mapId
  form.areaIds = currentPoint.value.areaIds?.length
    ? [...currentPoint.value.areaIds]
    : (currentPoint.value.areaId ? [currentPoint.value.areaId] : [])
  selectedSourceIds.value = inferSourcePointIdsFromParking(currentPoint.value)
}

onMounted(() => {
  loading.value = true
  try {
    inspectionStore.initialize()
    if (isEdit.value) {
      fillEditData()
    } else {
      form.mapId = inspectionStore.inspectionMaps[0]?.id || ''
    }
  } finally {
    hydrating.value = false
    loading.value = false
  }
})

watch(
  () => form.mapId,
  () => {
    if (hydrating.value) return
    selectedSourceIds.value = []
    form.areaIds = []
  }
)

watch(
  sourceRows,
  (rows) => {
    const validIds = new Set(rows.map(item => item.id))
    selectedSourceIds.value = selectedSourceIds.value.filter(id => validIds.has(id))
  }
)
</script>

<style scoped lang="css">
.inspection-point-create {
  width: 100%;
}

.footer-actions {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
