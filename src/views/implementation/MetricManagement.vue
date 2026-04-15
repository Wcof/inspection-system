<template>
  <div class="metric-management">
    <a-page-header title="检测项管理" sub-title="按分区层级管理检测项">
      <template #extra>
        <a-button type="primary" @click="openCreateModal">
          <template #icon><PlusOutlined /></template>
          新增
        </a-button>
      </template>
    </a-page-header>

    <a-layout class="metric-layout">
      <a-layout-sider width="300" class="tree-sider">
        <div class="tree-panel">
          <a-input v-model:value="treeSearchValue" placeholder="搜索分区/巡检点/设备" allow-clear style="margin-bottom: 12px" />
          <a-tree
            v-model:expandedKeys="expandedTreeKeys"
            v-model:selectedKeys="selectedTreeKeys"
            :tree-data="filteredTreeData"
            :field-names="{ title: 'title', key: 'key', children: 'children' }"
          />
        </div>
      </a-layout-sider>

      <a-layout-content class="list-content">
        <div class="content-header">
          <div class="header-left">
            <span class="header-title">检测项列表</span>
            <a-tag v-if="selectedPathLabel" color="blue">{{ selectedPathLabel }}</a-tag>
            <span class="header-count">共 {{ filteredCheckItems.length }} 项</span>
          </div>
        </div>

        <a-table :columns="columns" :data-source="filteredCheckItems" row-key="id" :pagination="false" :scroll="{ x: 1600 }">
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'index'">{{ index + 1 }}</template>
            <template v-if="column.key === 'region'">{{ getPointByDevice(record.deviceId)?.areaName || '-' }}</template>
            <template v-if="column.key === 'point'">{{ getPointNameByDevice(record.deviceId) }}</template>
            <template v-if="column.key === 'device'">{{ deviceNameMap[record.deviceId] || '-' }}</template>
            <template v-if="column.key === 'priority'">
              <a-tag :color="record.priority === 'primary' ? 'red' : 'default'">{{ record.priority === 'primary' ? '主要' : '次要' }}</a-tag>
            </template>
            <template v-if="column.key === 'checkCycle'">{{ getCheckCycleText(record) }}</template>
            <template v-if="column.key === 'checkWindow'">{{ getCheckWindowText(record) }}</template>
            <template v-if="column.key === 'actions'">
              <a-space size="small">
                <a-button type="link" @click="openEditModal(record)">编辑</a-button>
                <a-button type="link" danger @click="handleDelete(record.id)">删除</a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-layout-content>
    </a-layout>

    <a-modal
      v-model:open="editModalVisible"
      :title="editMode === 'create' ? '新增检测项' : '编辑检测项'"
      @ok="handleSave"
      @cancel="editModalVisible = false"
      ok-text="保存"
      cancel-text="取消"
      width="760px"
    >
      <a-form layout="vertical">
        <div v-if="editForm.deviceId" class="ptz-preview-section">
          <div class="ptz-preview-title">参考图</div>
          <div class="ptz-preview-frame">
            <img :src="ptzMockImage" alt="参考图" />
            <div class="ptz-roi-box">ROI</div>
          </div>
        </div>

        <a-row :gutter="12">
          <a-col :span="8">
            <a-form-item label="关联分区" required>
              <a-select v-model:value="editForm.areaId" placeholder="请选择分区" @change="onAreaChange">
                <a-select-option v-for="region in allRegions" :key="region.id" :value="region.id">{{ region.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="关联巡检点" required>
              <a-select v-model:value="editForm.pointId" placeholder="请选择巡检点" @change="onPointChange">
                <a-select-option v-for="point in selectablePoints" :key="point.id" :value="point.id">{{ point.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="关联设施设备" required>
              <a-select v-model:value="editForm.deviceId" placeholder="请选择设施设备">
                <a-select-option v-for="device in selectableDevices" :key="device.id" :value="device.id">{{ device.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="检测项名称" required>
              <a-input v-model:value="editForm.name" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="检测项编码" required>
              <a-input v-model:value="editForm.code" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="12">
          <a-col :span="8">
            <a-form-item label="类型">
              <a-select v-model:value="editForm.unit">
                <a-select-option value="温度">温度</a-select-option>
                <a-select-option value="外观">外观</a-select-option>
                <a-select-option value="压力">压力</a-select-option>
                <a-select-option value="液位">液位</a-select-option>
                <a-select-option value="状态">状态</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="优先级">
              <a-select v-model:value="editForm.priority">
                <a-select-option value="primary">主要</a-select-option>
                <a-select-option value="secondary">次要</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="巡检周期">
              <a-input-group compact>
                <a-input-number v-model:value="editForm.cycleValue" :min="1" style="width: 58%" />
                <a-select v-model:value="editForm.cycleUnit" style="width: 42%">
                  <a-select-option value="hour">小时</a-select-option>
                  <a-select-option value="day">天</a-select-option>
                  <a-select-option value="week">周</a-select-option>
                </a-select>
              </a-input-group>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="12">
          <a-col :span="12">
            <a-form-item label="巡检窗口">
              <a-time-picker v-model:value="editForm.windowStart" format="HH:mm" style="width: 48%" />
              <span style="display:inline-block;width:4%;text-align:center;">-</span>
              <a-time-picker v-model:value="editForm.windowEnd" format="HH:mm" style="width: 48%" />
            </a-form-item>
          </a-col>
        </a-row>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import dayjs from 'dayjs'
import { computed, onMounted, reactive, ref } from 'vue'
import { Modal, message } from 'ant-design-vue'
import { PlusOutlined } from '@ant-design/icons-vue'
import { useInspectionStore } from '@/stores/inspection'
import {
  CalibrationStatus,
  DeviceStatus,
  InspectionPointType,
  PositionSource,
  type InspectionDevice,
  type InspectionDeviceCheckItem,
  type InspectionPoint
} from '@/types/inspection'

const inspectionStore = useInspectionStore()
const inspectionPoints = ref<InspectionPoint[]>([])
const devices = ref<InspectionDevice[]>([])
const checkItems = ref<InspectionDeviceCheckItem[]>([])
const ptzMockImage = new URL('../../车间.png', import.meta.url).href

const treeSearchValue = ref('')
const expandedTreeKeys = ref<string[]>(['all'])
const selectedTreeKeys = ref<string[]>(['all'])
const selectedTreeKey = computed(() => selectedTreeKeys.value[0] || 'all')

const editModalVisible = ref(false)
const editMode = ref<'create' | 'edit'>('create')
const editingId = ref('')
const editForm = reactive({
  areaId: '',
  pointId: '',
  deviceId: '',
  name: '',
  code: '',
  unit: '温度',
  priority: 'secondary' as 'primary' | 'secondary',
  cycleValue: 1,
  cycleUnit: 'day' as 'hour' | 'day' | 'week',
  windowStart: dayjs('08:00', 'HH:mm'),
  windowEnd: dayjs('18:00', 'HH:mm')
})

const mapRegionMap = computed(() => {
  const map: Record<string, { id: string; name: string }> = {}
  inspectionStore.inspectionMaps.forEach((m) => {
    ;(m.regions || []).forEach((r) => {
      map[r.id] = { id: r.id, name: r.name }
    })
  })
  return map
})

const allRegions = computed(() => Object.values(mapRegionMap.value))

const treeData = computed(() => {
  const regionNodes = allRegions.value.map((region) => {
    const regionPoints = inspectionPoints.value.filter((p) => p.areaId === region.id)
    return {
      title: region.name,
      key: `region:${region.id}`,
      children: regionPoints.map((point) => ({
        title: point.name,
        key: `point:${point.id}`,
        children: devices.value
          .filter((d) => d.inspectionPointId === point.id)
          .map((device) => ({ title: device.name, key: `device:${device.id}` }))
      }))
    }
  })
  return [{ title: '全部', key: 'all', children: regionNodes }]
})

const filteredTreeData = computed(() => {
  if (!treeSearchValue.value.trim()) return treeData.value
  const q = treeSearchValue.value.trim().toLowerCase()
  const regionNodes = (treeData.value[0].children || []).filter((region: any) =>
    JSON.stringify(region).toLowerCase().includes(q)
  )
  return [{ title: '全部', key: 'all', children: regionNodes }]
})

const deviceNameMap = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  devices.value.forEach((d) => {
    map[d.id] = d.name
  })
  return map
})

const selectedPathLabel = computed(() => {
  if (selectedTreeKey.value === 'all') return ''
  if (selectedTreeKey.value.startsWith('device:')) return deviceNameMap.value[selectedTreeKey.value.replace('device:', '')] || ''
  if (selectedTreeKey.value.startsWith('point:')) return inspectionPoints.value.find((p) => p.id === selectedTreeKey.value.replace('point:', ''))?.name || ''
  if (selectedTreeKey.value.startsWith('region:')) return mapRegionMap.value[selectedTreeKey.value.replace('region:', '')]?.name || ''
  return ''
})

const columns = [
  { title: '序号', key: 'index', width: 70 },
  { title: '检测项名称', dataIndex: 'name', width: 140 },
  { title: '编码', dataIndex: 'code', width: 140 },
  { title: '关联分区', key: 'region', width: 120 },
  { title: '关联巡检点', key: 'point', width: 140 },
  { title: '关联设施设备', key: 'device', width: 140 },
  { title: '优先级', key: 'priority', width: 90 },
  { title: '巡检周期', key: 'checkCycle', width: 120 },
  { title: '巡检窗口', key: 'checkWindow', width: 150 },
  { title: '操作', key: 'actions', width: 130, fixed: 'right' }
]

const filteredCheckItems = computed(() => {
  if (selectedTreeKey.value === 'all') return checkItems.value
  if (selectedTreeKey.value.startsWith('device:')) {
    const deviceId = selectedTreeKey.value.replace('device:', '')
    return checkItems.value.filter((i) => i.deviceId === deviceId)
  }
  if (selectedTreeKey.value.startsWith('point:')) {
    const pointId = selectedTreeKey.value.replace('point:', '')
    const deviceIds = devices.value.filter((d) => d.inspectionPointId === pointId).map((d) => d.id)
    return checkItems.value.filter((i) => deviceIds.includes(i.deviceId))
  }
  if (selectedTreeKey.value.startsWith('region:')) {
    const regionId = selectedTreeKey.value.replace('region:', '')
    const pointIds = inspectionPoints.value.filter((p) => p.areaId === regionId).map((p) => p.id)
    const deviceIds = devices.value.filter((d) => pointIds.includes(d.inspectionPointId)).map((d) => d.id)
    return checkItems.value.filter((i) => deviceIds.includes(i.deviceId))
  }
  return checkItems.value
})

const selectablePoints = computed(() => inspectionPoints.value.filter((p) => p.areaId === editForm.areaId))
const selectableDevices = computed(() => devices.value.filter((d) => d.inspectionPointId === editForm.pointId))

function getPointByDevice(deviceId: string) {
  const device = devices.value.find((d) => d.id === deviceId)
  return inspectionPoints.value.find((p) => p.id === device?.inspectionPointId)
}

function getPointNameByDevice(deviceId: string) {
  return getPointByDevice(deviceId)?.name || '-'
}

function getCheckCycleText(item: InspectionDeviceCheckItem) {
  const cycle = item.inspectionFrequency || devices.value.find((d) => d.id === item.deviceId)?.inspectionFrequency
  if (!cycle) return '-'
  const unitText = { hour: '小时', day: '天', week: '周' }[cycle.unit] || cycle.unit
  return `每${cycle.value}${unitText}`
}

function getCheckWindowText(item: InspectionDeviceCheckItem) {
  const window = item.executionWindow || devices.value.find((d) => d.id === item.deviceId)?.executionWindow
  if (!window) return '-'
  return `${window.startTime}-${window.endTime}`
}

function openCreateModal() {
  editMode.value = 'create'
  editingId.value = ''
  prefillHierarchyByTree()
  editForm.name = ''
  editForm.code = ''
  editForm.unit = '温度'
  editForm.priority = 'secondary'
  editForm.cycleValue = 1
  editForm.cycleUnit = 'day'
  editForm.windowStart = dayjs('08:00', 'HH:mm')
  editForm.windowEnd = dayjs('18:00', 'HH:mm')
  editModalVisible.value = true
}

function openEditModal(record: InspectionDeviceCheckItem) {
  editMode.value = 'edit'
  editingId.value = record.id
  const point = getPointByDevice(record.deviceId)
  editForm.areaId = point?.areaId || ''
  editForm.pointId = point?.id || ''
  editForm.deviceId = record.deviceId
  editForm.name = record.name
  editForm.code = record.code
  editForm.unit = record.unit || '温度'
  editForm.priority = record.priority || 'secondary'
  const cycle = record.inspectionFrequency || { value: 1, unit: 'day' as const }
  editForm.cycleValue = cycle.value
  editForm.cycleUnit = cycle.unit
  const window = record.executionWindow || { startTime: '08:00', endTime: '18:00' }
  editForm.windowStart = dayjs(window.startTime, 'HH:mm')
  editForm.windowEnd = dayjs(window.endTime, 'HH:mm')
  editModalVisible.value = true
}

function prefillHierarchyByTree() {
  if (selectedTreeKey.value.startsWith('region:')) {
    editForm.areaId = selectedTreeKey.value.replace('region:', '')
    editForm.pointId = inspectionPoints.value.find((p) => p.areaId === editForm.areaId)?.id || ''
    editForm.deviceId = devices.value.find((d) => d.inspectionPointId === editForm.pointId)?.id || ''
  } else if (selectedTreeKey.value.startsWith('point:')) {
    editForm.pointId = selectedTreeKey.value.replace('point:', '')
    const point = inspectionPoints.value.find((p) => p.id === editForm.pointId)
    editForm.areaId = point?.areaId || ''
    editForm.deviceId = devices.value.find((d) => d.inspectionPointId === editForm.pointId)?.id || ''
  } else if (selectedTreeKey.value.startsWith('device:')) {
    editForm.deviceId = selectedTreeKey.value.replace('device:', '')
    const point = getPointByDevice(editForm.deviceId)
    editForm.pointId = point?.id || ''
    editForm.areaId = point?.areaId || ''
  } else {
    editForm.areaId = allRegions.value[0]?.id || ''
    editForm.pointId = inspectionPoints.value.find((p) => p.areaId === editForm.areaId)?.id || ''
    editForm.deviceId = devices.value.find((d) => d.inspectionPointId === editForm.pointId)?.id || ''
  }
}

function onAreaChange() {
  editForm.pointId = selectablePoints.value[0]?.id || ''
  onPointChange()
}

function onPointChange() {
  editForm.deviceId = selectableDevices.value[0]?.id || ''
}

function saveItem() {
  const now = new Date()
  inspectionStore.saveInspectionDeviceCheckItem({
    id: editMode.value === 'edit' ? editingId.value : undefined,
    deviceId: editForm.deviceId,
    name: editForm.name,
    code: editForm.code,
    checkType: 'vision',
    unit: editForm.unit,
    priority: editForm.priority,
    inspectionFrequency: { value: editForm.cycleValue, unit: editForm.cycleUnit },
    executionWindow: {
      startTime: editForm.windowStart.format('HH:mm'),
      endTime: editForm.windowEnd.format('HH:mm')
    },
    threshold: {},
    createdAt: now,
    updatedAt: now
  } as any)
  message.success('保存成功')
  editModalVisible.value = false
  fetchData()
}

function handleSave() {
  if (!editForm.areaId || !editForm.pointId || !editForm.deviceId || !editForm.name || !editForm.code) {
    message.error('请填写完整信息')
    return
  }
  const device = devices.value.find((d) => d.id === editForm.deviceId)
  const differsCycle = device?.inspectionFrequency && (device.inspectionFrequency.value !== editForm.cycleValue || device.inspectionFrequency.unit !== editForm.cycleUnit)
  const differsWindow = device?.executionWindow && (device.executionWindow.startTime !== editForm.windowStart.format('HH:mm') || device.executionWindow.endTime !== editForm.windowEnd.format('HH:mm'))
  if (differsCycle || differsWindow) {
    Modal.confirm({
      title: '检测项配置与设备默认配置存在差异',
      content: '当前检测项巡检周期/巡检窗口与所属设备不一致，是否确认保存？',
      okText: '确认保存',
      cancelText: '取消',
      onOk: saveItem
    })
    return
  }
  saveItem()
}

function handleDelete(id: string) {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除该检测项吗？',
    okText: '确定',
    cancelText: '取消',
    onOk() {
      inspectionStore.deleteInspectionDeviceCheckItem(id)
      fetchData()
      message.success('删除成功')
    }
  })
}

function ensureTreeMockData() {
  inspectionStore.fetchAllInspectionMaps()
  inspectionStore.fetchAllInspectionPoints()
  inspectionStore.fetchAllInspectionDevices()
  inspectionStore.fetchAllInspectionDeviceCheckItems()

  const maps = inspectionStore.inspectionMaps
  const now = new Date()

  maps.forEach((map) => {
    ;(map.regions || []).forEach((region, idx) => {
      const existedPoint = inspectionStore.inspectionPoints.find((point) => point.areaId === region.id)
      const pointId = existedPoint?.id || `mock-point-${region.id}`
      if (!existedPoint) {
        inspectionStore.saveInspectionPoint({
          id: pointId,
          name: `${region.name}巡检点`,
          code: `IP-${region.id.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-6) || idx + 1}`,
          pointType: InspectionPointType.FIXED,
          description: `[巡检点] ${region.name}默认巡检点`,
          mapId: map.id,
          areaId: region.id,
          areaName: region.name,
          location: {
            longitude: (map.geographicCoordinates?.longitude || 121.4737) + (idx + 1) * 0.0001,
            latitude: (map.geographicCoordinates?.latitude || 31.2304) + (idx + 1) * 0.0001,
            altitude: 0
          },
          mapPosition: {
            x: Math.round(region.x + Math.max(30, region.width / 2)),
            y: Math.round(region.y + Math.max(30, region.height / 2)),
            yaw: 0
          },
          sequence: idx + 1,
          calibrationStatus: CalibrationStatus.PENDING,
          stayDurationSec: 30,
          monitorPoints: [],
          isCritical: false,
          exceptionStrategy: { onFailure: 'skip', retryCount: 2, skipToNext: true } as any,
          positionSource: PositionSource.MAP_PICK,
          lastMapPickAt: now,
          updatedBy: '系统管理员',
          createdAt: now,
          updatedAt: now
        } as InspectionPoint)
      }

      const existedDevice = inspectionStore.inspectionDevices.find((device) => device.inspectionPointId === pointId)
      const deviceId = existedDevice?.id || `mock-device-${region.id}`
      if (!existedDevice) {
        inspectionStore.saveInspectionDevice({
          id: deviceId,
          inspectionPointId: pointId,
          name: `${region.name}温度计`,
          code: `DEV-${region.id.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-6) || idx + 1}`,
          type: '温度计',
          sequence: 1,
          ptzPreset: { x: 12 + idx, y: 8 + idx, z: 1.5 },
          referenceImageUrl:
            'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=industrial%20meter%20inspection&image_size=square',
          status: DeviceStatus.ACTIVE,
          checkItems: [],
          createdAt: now,
          updatedAt: now
        } as InspectionDevice)
      }

      const existedCheckItem = inspectionStore.inspectionDeviceCheckItems.find((item) => item.deviceId === deviceId)
      if (!existedCheckItem) {
        inspectionStore.saveInspectionDeviceCheckItem({
          id: `mock-check-${region.id}`,
          deviceId,
          name: '温度',
          code: `CHECK-${region.id.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-6) || idx + 1}`,
          checkType: 'vision',
          priority: 'primary',
          inspectionFrequency: { value: 4, unit: 'hour' },
          executionWindow: { startTime: '08:00', endTime: '18:00' },
          unit: '温度',
          threshold: { min: 0, max: 100 },
          visionMapping: { sourceType: 'system', recognitionMode: 'ocr', customImageUrl: '' },
          createdAt: now,
          updatedAt: now
        } as any)
      }
    })
  })
}

function fetchData() {
  inspectionStore.fetchAllInspectionMaps()
  inspectionStore.fetchAllInspectionPoints()
  inspectionStore.fetchAllInspectionDevices()
  inspectionStore.fetchAllInspectionDeviceCheckItems()
  inspectionPoints.value = inspectionStore.inspectionPoints
  devices.value = inspectionStore.inspectionDevices
  checkItems.value = inspectionStore.inspectionDeviceCheckItems
}

onMounted(() => {
  inspectionStore.initialize()
  ensureTreeMockData()
  fetchData()
})
</script>

<style scoped lang="scss">
.metric-management {
  width: 100%;
  height: 100%;

  .metric-layout {
    margin-top: 16px;
    min-height: 620px;
    background: #fff;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    overflow: hidden;
  }

  .tree-sider {
    background: #fcfcfc;
    border-right: 1px solid #f0f0f0;
  }

  .tree-panel {
    padding: 16px;
    height: 100%;
    overflow: auto;
  }

  .list-content {
    padding: 0 16px 16px;
    background: #fff;
  }

  .content-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 16px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .header-title {
    font-size: 16px;
    font-weight: 600;
  }

  .header-count {
    color: #8c8c8c;
    font-size: 12px;
  }

  .ptz-preview-section {
    margin-bottom: 12px;
    padding: 8px;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    background: #fafafa;
  }

  .ptz-preview-title {
    margin-bottom: 8px;
    font-size: 13px;
    color: #595959;
  }

  .ptz-preview-frame {
    position: relative;
    width: 320px;
    max-width: 100%;
    height: 150px;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #d9d9d9;
    background: #0f141b;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.92;
    }
  }

  .ptz-roi-box {
    position: absolute;
    left: 50%;
    top: 50%;
    width: 120px;
    height: 80px;
    transform: translate(-50%, -50%);
    border: 2px solid #52c41a;
    border-radius: 4px;
    color: #52c41a;
    font-size: 12px;
    display: flex;
    align-items: flex-start;
    justify-content: flex-start;
    padding: 4px 6px;
    background: rgba(82, 196, 26, 0.08);
    box-shadow: 0 0 0 1px rgba(82, 196, 26, 0.25) inset;
  }
}
</style>
