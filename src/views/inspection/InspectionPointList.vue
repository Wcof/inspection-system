<template>
  <div class="inspection-point-list">
    <a-page-header title="点位管理" sub-title="管理点位信息">
      <template #extra>
        <a-button type="primary" @click="goToForm()">
          <a-icon type="plus" />
          新增巡检点
        </a-button>
      </template>
    </a-page-header>

    <a-card style="margin-top: 16px">
      <div class="search-panel">
        <a-form layout="vertical" :model="searchForm" @submit.prevent>
          <a-row :gutter="[16, 8]">
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="名称" class="search-item">
                <a-input v-model:value="searchForm.name" placeholder="请输入点位名称" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="编码" class="search-item">
                <a-input v-model:value="searchForm.code" placeholder="请输入点位编码" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="巡检点类型" class="search-item">
                <a-select v-model:value="searchForm.pointType" placeholder="请选择巡检点类型" allow-clear>
                  <a-select-option value="fixed">固定巡检点</a-select-option>
                  <a-select-option value="area">区域巡检点</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="所属区域" class="search-item">
                <a-select v-model:value="searchForm.areaId" placeholder="请选择所属区域" allow-clear>
                  <a-select-option v-for="area in areaOptions" :key="area.id" :value="area.id">
                    {{ area.name }}
                  </a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="校准状态" class="search-item">
                <a-select v-model:value="searchForm.calibrationStatus" placeholder="请选择校准状态" allow-clear>
                  <a-select-option value="calibrated">已校准</a-select-option>
                  <a-select-option value="pending">待校准</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="更新时间" class="search-item">
                <a-input v-model:value="searchForm.updatedAt" placeholder="YYYY-MM-DD" allow-clear />
              </a-form-item>
            </a-col>
          </a-row>
          <div class="search-actions">
            <a-space>
              <a-button type="primary" @click="handleSearch">搜索</a-button>
              <a-button @click="handleReset">重置</a-button>
            </a-space>
          </div>
        </a-form>
      </div>
      <a-table :columns="columns" :data-source="filteredPoints" :loading="loading" row-key="id">
        <template #expandedRowRender="{ record }">
          <div class="spatial-detail">
            <div class="spatial-summary">
              <a-tag color="blue">装置区：{{ getSpatialModel(record).workArea }}</a-tag>
              <a-tag color="green">停车点 {{ getSpatialModel(record).parkingPoints.length }}</a-tag>
              <a-tag color="purple">采集位 {{ getCollectionPoseCount(record) }}</a-tag>
            </div>
            <a-row :gutter="[12, 12]">
              <a-col v-for="parking in getSpatialModel(record).parkingPoints" :key="parking.id" :xs="24" :lg="12">
                <div class="parking-card">
                  <div class="parking-title">
                    <span>{{ parking.name }}</span>
                    <a-tag :color="parking.constraint.reachable ? 'green' : 'red'">
                      {{ parking.constraint.reachable ? '可达' : '不可达' }}
                    </a-tag>
                  </div>
                  <a-descriptions size="small" :column="2" bordered>
                    <a-descriptions-item label="坐标">{{ parking.position.x }}, {{ parking.position.y }}</a-descriptions-item>
                    <a-descriptions-item label="朝向">{{ parking.position.yaw }}°</a-descriptions-item>
                    <a-descriptions-item label="倒车">{{ yesNo(parking.constraint.reverseRequired) }}</a-descriptions-item>
                    <a-descriptions-item label="原地掉头">{{ yesNo(parking.constraint.turnAroundRequired) }}</a-descriptions-item>
                    <a-descriptions-item label="窄路">{{ yesNo(parking.constraint.narrowRoad) }}</a-descriptions-item>
                    <a-descriptions-item label="坡道">{{ yesNo(parking.constraint.slope) }}</a-descriptions-item>
                    <a-descriptions-item label="便桥">{{ yesNo(parking.constraint.bridgeRequired) }}</a-descriptions-item>
                    <a-descriptions-item label="绕行">{{ yesNo(parking.constraint.detourRequired) }}</a-descriptions-item>
                  </a-descriptions>
                  <div class="pose-list">
                    <div v-for="pose in parking.collectionPoses" :key="pose.id" class="pose-item">
                      <b>{{ pose.targetName }}</b>
                      <span>{{ getDirectionText(pose.direction) }} / {{ getMethodText(pose.method) }} / {{ pose.distanceMeter }}m</span>
                      <span>云台 {{ pose.ptzYaw }}° / {{ pose.ptzPitch }}°，焦距 {{ pose.focalLength }}</span>
                      <span>可采条件：{{ pose.collectableCondition }}</span>
                    </div>
                  </div>
                </div>
              </a-col>
            </a-row>
          </div>
        </template>
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'calibrationStatus'">
            <a-tag :color="record.calibrationStatus === 'calibrated' ? 'green' : 'orange'">
              {{ record.calibrationStatus === 'calibrated' ? '已校准' : '待校准' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'pointType'">
            <a-tag :color="record.pointType === 'area' ? 'purple' : 'blue'">
              {{ record.pointType === 'area' ? '区域巡检点' : '固定巡检点' }}
            </a-tag>
          </template>
          <template v-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="goToForm(record.id)">编辑</a-button>
              <a-button type="link" size="small" @click="viewDevices(record.id)">设备</a-button>
              <a-button type="link" size="small" @click="handleCalibrate(record.id, record)">校准</a-button>
              <a-button type="link" size="small" danger @click="handleDelete(record.id)">删除</a-button>
            </a-space>
          </template>
          <template v-if="column.key === 'previewImage'">
            <img
              v-if="record.previewImageUrl"
              :src="record.previewImageUrl"
              alt="现场预览图"
              style="width: 56px; height: 56px; object-fit: cover; border-radius: 4px"
            />
            <span v-else>-</span>
          </template>
          <template v-if="column.key === 'checkItemCount'">
            {{ getPointCheckItemCount(record.id) }}
          </template>
          <template v-if="column.key === 'deviceCount'">
            {{ getPointDeviceCount(record.id) }}
          </template>
          <template v-if="column.key === 'workArea'">
            {{ getSpatialModel(record).workArea }}
          </template>
          <template v-if="column.key === 'parkingPointCount'">
            {{ getSpatialModel(record).parkingPoints.length }}
          </template>
          <template v-if="column.key === 'collectionPoseCount'">
            {{ getCollectionPoseCount(record) }}
          </template>
          <template v-if="column.key === 'calibratedAt'">
            {{ formatDate(record.calibratedAt) || '-' }}
          </template>
          <template v-if="column.key === 'updatedAt'">
            {{ formatDate(record.updatedAt) || '-' }}
          </template>
        </template>
      </a-table>
    </a-card>

    <!-- 校准模态框 -->
    <a-modal
      v-model:visible="calibrationModalVisible"
      title="校准坐标"
      width="600px"
      footer=""
    >
      <div class="calibration-modal">
        <a-form layout="vertical" style="margin-bottom: 12px">
          <a-form-item label="选择机器人" required>
            <a-select
              v-model:value="selectedRobotId"
              placeholder="请选择机器人"
              @change="updateCalibration"
            >
              <a-select-option v-for="robot in robotStore.robots" :key="robot.id" :value="robot.id">
                {{ robot.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-form>

        <div v-if="calibrationLoading" class="loading-container">
          <a-spin tip="正在获取机器人坐标..." />
        </div>
        <div v-else>
          <a-card title="机器人当前坐标">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-descriptions :column="1">
                  <a-descriptions-item label="经度">{{ robotCoordinates.longitude.toFixed(6) }}</a-descriptions-item>
                  <a-descriptions-item label="纬度">{{ robotCoordinates.latitude.toFixed(6) }}</a-descriptions-item>
                  <a-descriptions-item label="海拔">{{ robotCoordinates.altitude.toFixed(2) }}</a-descriptions-item>
                </a-descriptions>
              </a-col>
              <a-col :span="12">
                <a-descriptions :column="1">
                  <a-descriptions-item label="地图X坐标">{{ robotCoordinates.mapX.toFixed(2) }}</a-descriptions-item>
                  <a-descriptions-item label="地图Y坐标">{{ robotCoordinates.mapY.toFixed(2) }}</a-descriptions-item>
                  <a-descriptions-item label="偏航角">{{ robotCoordinates.yaw.toFixed(2) }}</a-descriptions-item>
                </a-descriptions>
              </a-col>
            </a-row>
          </a-card>
          
          <div class="modal-actions" style="margin-top: 20px; text-align: right">
            <a-space>
              <a-button @click="goToCockpit">前往驾驶舱</a-button>
              <a-button @click="cancelCalibration">取消</a-button>
              <a-button type="primary" @click="updateCalibration">更新</a-button>
              <a-button type="primary" @click="confirmCalibration">确认</a-button>
            </a-space>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import { useRobotStore } from '@/stores/robot'
import type { InspectionPoint } from '@/types/inspection'
import type { CollectionMethod, CollectionPose, ParkingPoint } from '@/types/inspection'
import { CalibrationStatus } from '@/types/inspection'
import { message, Modal } from 'ant-design-vue'

const workshopImage = new URL('../../车间.png', import.meta.url).href

const router = useRouter()
const inspectionStore = useInspectionStore()
const robotStore = useRobotStore()

const points = ref<InspectionPoint[]>([])
const loading = ref(false)
const calibrationModalVisible = ref(false)
const currentPoint = ref<InspectionPoint | null>(null)
const robotCoordinates = ref({
  longitude: 0,
  latitude: 0,
  altitude: 0,
  mapX: 0,
  mapY: 0,
  yaw: 0
})
const calibrationLoading = ref(false)
const selectedRobotId = ref('')
const searchForm = reactive({
  name: '',
  code: '',
  pointType: '',
  areaId: '',
  calibrationStatus: '',
  updatedAt: ''
})

const columns = [
  { title: '巡检名称', dataIndex: 'name', key: 'name' },
  { title: '编码', dataIndex: 'code', key: 'code' },
  { title: '所属区域', dataIndex: 'areaName', key: 'areaName', width: 120 },
  { title: '装置区/作业区', key: 'workArea', width: 150 },
  { title: '现场预览图', key: 'previewImage', width: 100 },
  { title: '巡检项数量', key: 'checkItemCount', width: 100 },
  { title: '设施设备数量', key: 'deviceCount', width: 110 },
  { title: '停车点', key: 'parkingPointCount', width: 90 },
  { title: '采集位', key: 'collectionPoseCount', width: 90 },
  { title: '巡检点类型', key: 'pointType', width: 120 },
  { title: '校准状态', key: 'calibrationStatus', width: 100 },
  { title: '校准时间', key: 'calibratedAt', width: 170 },
  { title: '更新时间', key: 'updatedAt', width: 170 },
  { title: '操作', key: 'actions', width: 220 }
]

function isInspectionBizPoint(point: InspectionPoint): boolean {
  const matched = point.description?.match(/^\[(巡检点|停车点|充电点)\]\s*/)
  if (!matched?.[1]) return true
  return matched[1] === '巡检点'
}

function fetchPoints() {
  loading.value = true
  try {
    inspectionStore.fetchAllInspectionPoints()
    points.value = inspectionStore.inspectionPoints.filter(isInspectionBizPoint)
  } finally {
    loading.value = false
  }
}

const areaOptions = computed(() => {
  const regionMap = new Map<string, string>()
  inspectionStore.inspectionMaps.forEach((map) => {
    map.regions?.forEach((region) => {
      regionMap.set(region.id, region.name)
    })
  })
  return Array.from(regionMap.entries()).map(([id, name]) => ({ id, name }))
})

function resolveAreaName(point: InspectionPoint) {
  if (point.areaName) return point.areaName
  if (point.areaId) {
    return areaOptions.value.find((area) => area.id === point.areaId)?.name || '未分区'
  }
  return '未分区'
}

const listRows = computed(() =>
  points.value.map((point) => ({
    ...point,
    areaName: resolveAreaName(point),
    previewImageUrl: point.previewImageUrl || workshopImage
  }))
)

function getSpatialModel(point: InspectionPoint): { workArea: string; parkingPoints: ParkingPoint[] } {
  const pointNo = Number(String(point.id).replace(/\D/g, '')) || 1
  const baseX = Number(point.mapPosition?.x || 120)
  const baseY = Number(point.mapPosition?.y || 120)
  const workArea = point.areaName || (pointNo % 2 === 0 ? '泵组作业区' : '反应装置区')
  const parkingPoints: ParkingPoint[] = [
    {
      id: `${point.id}-parking-front`,
      inspectionPointId: point.id,
      name: `${point.name}-正前方停车点`,
      position: { x: Math.round(baseX), y: Math.round(baseY), yaw: point.mapPosition?.yaw || 0 },
      constraint: {
        reachable: true,
        reverseRequired: pointNo % 3 === 0,
        turnAroundRequired: pointNo % 2 === 0,
        narrowRoad: pointNo % 2 === 1,
        slope: false,
        bridgeRequired: pointNo % 4 === 0,
        detourRequired: false
      },
      collectionPoses: buildCollectionPoses(point, 'front')
    },
    {
      id: `${point.id}-parking-side`,
      inspectionPointId: point.id,
      name: `${point.name}-侧向停车点`,
      position: { x: Math.round(baseX + 18), y: Math.round(baseY + 12), yaw: 90 },
      constraint: {
        reachable: true,
        reverseRequired: true,
        turnAroundRequired: false,
        narrowRoad: true,
        slope: pointNo % 5 === 0,
        bridgeRequired: false,
        detourRequired: pointNo % 3 === 0
      },
      collectionPoses: buildCollectionPoses(point, 'side')
    }
  ]
  return { workArea, parkingPoints }
}

function buildCollectionPoses(point: InspectionPoint, side: 'front' | 'side'): CollectionPose[] {
  const prefix = side === 'front' ? '正拍' : '侧拍'
  return [
    {
      id: `${point.id}-${side}-meter`,
      parkingPointId: `${point.id}-parking-${side}`,
      targetName: `${prefix}压力表读数`,
      targetType: 'component',
      direction: side === 'front' ? 'front' : 'side',
      distanceMeter: side === 'front' ? 1.8 : 2.4,
      ptzYaw: side === 'front' ? 0 : 35,
      ptzPitch: -12,
      focalLength: side === 'front' ? '35mm' : '50mm',
      method: 'optical',
      collectableCondition: '无遮挡、无强反光、表盘刻度完整'
    },
    {
      id: `${point.id}-${side}-flange`,
      parkingPointId: `${point.id}-parking-${side}`,
      targetName: `${prefix}阀门/法兰紧密度`,
      targetType: 'connection',
      direction: side === 'front' ? 'oblique' : 'side',
      distanceMeter: side === 'front' ? 2.2 : 1.6,
      ptzYaw: side === 'front' ? 18 : 60,
      ptzPitch: -8,
      focalLength: '70mm',
      method: 'thermal',
      collectableCondition: '连接面可见，热成像目标不被管线遮挡'
    }
  ]
}

function getCollectionPoseCount(point: InspectionPoint) {
  return getSpatialModel(point).parkingPoints.reduce((sum, parking) => sum + parking.collectionPoses.length, 0)
}

function yesNo(value: boolean) {
  return value ? '是' : '否'
}

function getDirectionText(direction: CollectionPose['direction']) {
  return ({ front: '正拍', side: '侧拍', oblique: '斜拍', near: '近拍', overview: '全景' } as Record<CollectionPose['direction'], string>)[direction]
}

function getMethodText(method: CollectionMethod) {
  return ({ optical: '光学', thermal: '热成像', gas: '气体', safety: '安全行为', multi_spectrum: '多光谱' } as Record<CollectionMethod, string>)[method]
}

function goToForm(id?: string) {
  if (id) {
    router.push(`/implementation/point/form/${id}`)
  } else {
    router.push('/implementation/map/point-manage?mapId=map-001')
  }
}

function viewDevices(id: string) {
  router.push(`/implementation/device/list?pointId=${id}`)
}

function handleDelete(id: string) {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这个巡检点吗？',
    okText: '确定',
    cancelText: '取消',
    onOk() {
      inspectionStore.deleteInspectionPoint(id)
      fetchPoints()
      message.success('删除成功')
    }
  })
}

function handleCalibrate(_id: string, record: InspectionPoint) {
  currentPoint.value = record
  selectedRobotId.value = robotStore.robots[0]?.id || ''
  calibrationModalVisible.value = true
  // 初始获取一次机器人坐标
  fetchRobotCoordinates()
}

function fetchRobotCoordinates() {
  calibrationLoading.value = true
  if (!selectedRobotId.value) {
    calibrationLoading.value = false
    message.warning('请先选择机器人')
    return
  }

  const robot = robotStore.robots.find(r => r.id === selectedRobotId.value)
  const seed = selectedRobotId.value.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0)
  const jitter = (factor: number) => ((seed % 17) - 8) * factor

  // 模拟从机器人获取坐标
  setTimeout(() => {
    // 生成模拟坐标（基于当前巡检点坐标的微小偏差）
    if (currentPoint.value) {
      const baseLocation = currentPoint.value.location
      const baseMapPosition = currentPoint.value.mapPosition
      
      robotCoordinates.value = {
        longitude: baseLocation.longitude + jitter(0.000005),
        latitude: baseLocation.latitude + jitter(0.000005),
        altitude: (baseLocation.altitude || 0) + jitter(0.01),
        mapX: (baseMapPosition?.x || 0) + jitter(0.5),
        mapY: (baseMapPosition?.y || 0) + jitter(0.5),
        yaw: (baseMapPosition?.yaw || 0) + jitter(1.5)
      }
      if (robot) {
        message.success(`已获取机器人「${robot.name}」当前坐标`)
      }
    }
    calibrationLoading.value = false
  }, 1000)
}

function confirmCalibration() {
  if (currentPoint.value) {
    // 更新巡检点坐标
    const updatedPoint = {
      ...currentPoint.value,
      location: {
        longitude: robotCoordinates.value.longitude,
        latitude: robotCoordinates.value.latitude,
        altitude: robotCoordinates.value.altitude
      },
      mapPosition: {
        x: robotCoordinates.value.mapX,
        y: robotCoordinates.value.mapY,
        yaw: robotCoordinates.value.yaw
      },
      calibrationStatus: CalibrationStatus.CALIBRATED,
      calibratedAt: new Date(),
      updatedAt: new Date()
    }
    
    inspectionStore.saveInspectionPoint(updatedPoint)
    fetchPoints()
    message.success('校准成功')
    calibrationModalVisible.value = false
  }
}

function updateCalibration() {
  fetchRobotCoordinates()
}

function cancelCalibration() {
  calibrationModalVisible.value = false
}

function handleSearch() {
  // 由 filteredPoints 计算属性过滤
}

function handleReset() {
  searchForm.name = ''
  searchForm.code = ''
  searchForm.pointType = ''
  searchForm.areaId = ''
  searchForm.calibrationStatus = ''
  searchForm.updatedAt = ''
}

const filteredPoints = computed(() => {
  const name = searchForm.name.trim().toLowerCase()
  const code = searchForm.code.trim().toLowerCase()
  const pointType = searchForm.pointType
  const areaId = searchForm.areaId
  const calibrationStatus = searchForm.calibrationStatus
  const updatedAt = searchForm.updatedAt.trim()
  return listRows.value.filter(point => {
    const matchesName = !name || point.name.toLowerCase().includes(name)
    const matchesCode = !code || point.code.toLowerCase().includes(code)
    const matchesPointType = !pointType || (point.pointType || 'fixed') === pointType
    const matchesArea = !areaId || point.areaId === areaId
    const matchesCalibration = !calibrationStatus || point.calibrationStatus === calibrationStatus
    const updatedText = point.updatedAt ? new Date(point.updatedAt).toISOString().slice(0, 10) : ''
    const matchesUpdated = !updatedAt || updatedText.includes(updatedAt)
    return matchesName && matchesCode && matchesPointType && matchesArea && matchesCalibration && matchesUpdated
  })
})

function getPointDeviceCount(pointId: string) {
  return inspectionStore.inspectionDevices.filter(device => device.inspectionPointId === pointId).length
}

function getPointCheckItemCount(pointId: string) {
  const deviceIds = inspectionStore.inspectionDevices.filter(device => device.inspectionPointId === pointId).map(device => device.id)
  return inspectionStore.inspectionDeviceCheckItems.filter(item => deviceIds.includes(item.deviceId)).length
}

function goToCockpit() {
  message.success('已跳转驾驶舱，正在执行校准')
  router.push('/management/cockpit/view')
}

function formatDate(date?: Date | string) {
  if (!date) return ''
  return new Date(date).toLocaleString()
}

onMounted(() => {
  inspectionStore.initialize()
  inspectionStore.fetchAllInspectionMaps()
  inspectionStore.fetchAllInspectionDevices()
  inspectionStore.fetchAllInspectionDeviceCheckItems()
  robotStore.initialize()
  fetchPoints()
})
</script>

<style scoped lang="css">.inspection-point-list {
  width: 100%;
}
.inspection-point-list :deep(.ant-card) {
  border-radius: 10px;
  border-color: #f0f0f0;
  box-shadow: none;
}
.inspection-point-list :deep(.ant-card-body) {
  padding: 16px;
}
.inspection-point-list .search-panel {
  margin-bottom: 12px;
  padding: 12px 12px 4px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}
.inspection-point-list .search-item {
  margin-bottom: 8px;
}
.inspection-point-list .search-actions {
  display: flex;
  justify-content: flex-end;
  margin: 4px 0 8px;
}
.inspection-point-list :deep(.ant-table) {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}
.inspection-point-list :deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  white-space: nowrap;
}
.inspection-point-list :deep(.ant-table-tbody > tr > td) {
  vertical-align: middle;
}
.spatial-detail {
  padding: 4px 0;
}
.spatial-summary {
  margin-bottom: 12px;
}
.parking-card {
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fff;
}
.parking-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-weight: 600;
}
.pose-list {
  margin-top: 10px;
  display: grid;
  gap: 8px;
}
.pose-item {
  display: grid;
  gap: 2px;
  padding: 8px;
  border-radius: 6px;
  background: #fafafa;
  font-size: 12px;
  color: #475569;
}
.pose-item b {
  color: #1f2937;
}
@media (max-width: 992px) {
  .inspection-point-list :deep(.ant-card-body) {
    padding: 12px;
  }
}
.calibration-modal .loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}
.calibration-modal .modal-actions {
  margin-top: 20px;
  text-align: right;
}
</style>
