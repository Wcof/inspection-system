<template>
  <div class="inspection-point-list">
    <a-page-header title="巡检点管理" sub-title="管理巡检点信息">
      <template #extra>
        <a-button type="primary" @click="goToForm">
          <a-icon type="plus" />
          新建巡检点
        </a-button>
      </template>
    </a-page-header>

    <a-card style="margin-top: 16px">
      <div class="search-panel">
        <a-form layout="vertical" :model="searchForm" @submit.prevent>
          <a-row :gutter="[16, 8]">
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="名称" class="search-item">
                <a-input v-model:value="searchForm.name" placeholder="请输入巡检点名称" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="编码" class="search-item">
                <a-input v-model:value="searchForm.code" placeholder="请输入巡检点编码" allow-clear />
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
              <a-form-item label="创建时间" class="search-item">
                <a-input v-model:value="searchForm.createdAt" placeholder="YYYY-MM-DD" allow-clear />
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
import { CalibrationStatus } from '@/types/inspection'
import { message, Modal } from 'ant-design-vue'

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
  createdAt: ''
})

const columns = [
  { title: '巡检点名称', dataIndex: 'name', key: 'name' },
  { title: '编码', dataIndex: 'code', key: 'code' },
  { title: '描述', dataIndex: 'description', key: 'description' },
  { title: '序号', dataIndex: 'sequence', key: 'sequence', width: 80 },
  { title: '停留时间(秒)', dataIndex: 'stayDurationSec', key: 'stayDurationSec', width: 120 },
  { title: '巡检点类型', key: 'pointType', width: 120 },
  { title: '校准状态', key: 'calibrationStatus', width: 100 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  { title: '操作', key: 'actions', width: 200 }
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

function goToForm(id?: string) {
  if (id) {
    router.push(`/facility/inspection-point/form/${id}`)
  } else {
    router.push('/facility/inspection-point/form')
  }
}

function viewDevices(id: string) {
  router.push(`/facility/device?pointId=${id}`)
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
  searchForm.createdAt = ''
}

const filteredPoints = computed(() => {
  const name = searchForm.name.trim().toLowerCase()
  const code = searchForm.code.trim().toLowerCase()
  const pointType = searchForm.pointType
  const createdAt = searchForm.createdAt.trim()
  return points.value.filter(point => {
    const matchesName = !name || point.name.toLowerCase().includes(name)
    const matchesCode = !code || point.code.toLowerCase().includes(code)
    const matchesPointType = !pointType || (point.pointType || 'fixed') === pointType
    const createdText = point.createdAt ? new Date(point.createdAt).toISOString().slice(0, 10) : ''
    const matchesCreated = !createdAt || createdText.includes(createdAt)
    return matchesName && matchesCode && matchesPointType && matchesCreated
  })
})

onMounted(() => {
  inspectionStore.initialize()
  robotStore.initialize()
  fetchPoints()
})
</script>

<style scoped lang="scss">
.inspection-point-list {
  width: 100%;

  :deep(.ant-card) {
    border-radius: 10px;
    border-color: #f0f0f0;
    box-shadow: none;
  }

  :deep(.ant-card-body) {
    padding: 16px;
  }

  .search-panel {
    margin-bottom: 12px;
    padding: 12px 12px 4px;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    background: #fafafa;
  }

  .search-item {
    margin-bottom: 8px;
  }

  .search-actions {
    display: flex;
    justify-content: flex-end;
    margin: 4px 0 8px;
  }

  :deep(.ant-table) {
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    overflow: hidden;
  }

  :deep(.ant-table-thead > tr > th) {
    background: #fafafa;
    font-weight: 600;
    white-space: nowrap;
  }

  :deep(.ant-table-tbody > tr > td) {
    vertical-align: middle;
  }

  @media (max-width: 992px) {
    :deep(.ant-card-body) {
      padding: 12px;
    }
  }
}

.calibration-modal {
  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;
  }
  
  .modal-actions {
    margin-top: 20px;
    text-align: right;
  }
}
</style>
