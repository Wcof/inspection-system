<template>
  <div class="metric-management">
    <a-page-header title="检测项管理" sub-title="管理设备的检测项配置" />

    <a-layout class="metric-layout">
      <a-layout-sider width="280" class="tree-sider">
        <div class="tree-panel">
          <a-input
            v-model:value="treeSearchValue"
            placeholder="搜索巡检点/设备名称/编码"
            allow-clear
            style="margin-bottom: 16px"
          />
          <a-tree
            v-model:expandedKeys="expandedTreeKeys"
            v-model:selectedKeys="selectedTreeKeys"
            :tree-data="filteredTreeData"
            :field-names="{ title: 'title', key: 'key', children: 'children' }"
            @select="handleTreeSelect"
          />
        </div>
      </a-layout-sider>

      <a-layout-content class="list-content">
        <div class="content-header">
          <div class="header-left">
            <span class="header-title">检测项列表</span>
            <a-tag v-if="selectedDeviceName" color="blue">{{ selectedDeviceName }}</a-tag>
            <span class="header-count">共 {{ filteredCheckItems.length }} 项</span>
          </div>
        </div>

        <a-table :columns="columns" :data-source="filteredCheckItems" row-key="id" :pagination="false">
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'index'">
              {{ index + 1 }}
            </template>

            <template v-if="column.key === 'device'">
              {{ deviceNameMap[record.deviceId] || '-' }}
            </template>

            <template v-if="column.key === 'checkCycle'">
              {{ getCheckCycleText(record.deviceId) }}
            </template>

            <template v-if="column.key === 'checkWindow'">
              {{ getCheckWindowText(record.deviceId) }}
            </template>

            <template v-if="column.key === 'actions'">
              <a-space size="small">
                <a-button type="link" @click="handleEdit(record)">编辑</a-button>
                <a-button type="link" danger @click="handleDelete(record.id)">删除</a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-layout-content>
    </a-layout>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import type { InspectionDevice, InspectionPoint, InspectionDeviceCheckItem } from '@/types/inspection'
import { message, Modal } from 'ant-design-vue'

const router = useRouter()
const inspectionStore = useInspectionStore()

const inspectionPoints = ref<InspectionPoint[]>([])
const devices = ref<InspectionDevice[]>([])
const checkItems = ref<InspectionDeviceCheckItem[]>([])

const treeSearchValue = ref('')
const expandedTreeKeys = ref<string[]>(['all'])
const selectedTreeKeys = ref<string[]>(['all'])
const selectedTreeKey = computed(() => selectedTreeKeys.value[0] || 'all')

const treeData = computed(() => {
  const pointNodes = inspectionPoints.value.map(point => {
    const pointDevices = devices.value.filter(d => d.inspectionPointId === point.id)
    return {
      title: point.name,
      key: `point:${point.id}`,
      description: point.code,
      children: pointDevices.map(device => ({
        title: device.name,
        key: `device:${device.id}`,
        description: device.code
      }))
    }
  })

  return [{
    title: '全部',
    key: 'all',
    children: pointNodes
  }]
})

const filteredTreeData = computed(() => {
  if (!treeSearchValue.value.trim()) return treeData.value
  const searchValue = treeSearchValue.value.trim().toLowerCase()

  const filteredPoints = inspectionPoints.value.map(point => {
    const pointDevices = devices.value.filter(d => d.inspectionPointId === point.id)
    const matchedDevices = pointDevices.filter(device =>
      device.name.toLowerCase().includes(searchValue) ||
      device.code.toLowerCase().includes(searchValue)
    )
    const pointMatches = point.name.toLowerCase().includes(searchValue) || point.code.toLowerCase().includes(searchValue)

    if (pointMatches || matchedDevices.length > 0) {
      return {
        title: point.name,
        key: `point:${point.id}`,
        description: point.code,
        children: matchedDevices.length > 0 ? matchedDevices.map(device => ({
          title: device.name,
          key: `device:${device.id}`,
          description: device.code
        })) : pointDevices.map(device => ({
          title: device.name,
          key: `device:${device.id}`,
          description: device.code
        }))
      }
    }
    return null
  }).filter(Boolean) as any[]

  return [{
    title: '全部',
    key: 'all',
    children: filteredPoints
  }]
})

const selectedDeviceId = computed(() => {
  if (selectedTreeKey.value.startsWith('device:')) {
    return selectedTreeKey.value.replace('device:', '')
  }
  return undefined
})

const selectedDeviceName = computed(() => {
  if (selectedDeviceId.value) {
    return deviceNameMap.value[selectedDeviceId.value] || ''
  }
  if (selectedTreeKey.value.startsWith('point:')) {
    const pointId = selectedTreeKey.value.replace('point:', '')
    return inspectionPoints.value.find(p => p.id === pointId)?.name || ''
  }
  return ''
})

const deviceNameMap = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  devices.value.forEach(device => { map[device.id] = device.name })
  return map
})

const deviceMap = computed<Record<string, InspectionDevice>>(() => {
  const map: Record<string, InspectionDevice> = {}
  devices.value.forEach(device => { map[device.id] = device })
  return map
})

const columns = [
  { title: '序号', key: 'index', width: 80 },
  { title: '检测项名称', dataIndex: 'name', width: 150 },
  { title: '检测项编码', dataIndex: 'code', width: 150 },
  { title: '所属设备', key: 'device', width: 150 },
  { title: '单位', dataIndex: 'unit', width: 100 },
  { title: '检查周期', key: 'checkCycle', width: 150 },
  { title: '检查窗口', key: 'checkWindow', width: 180 },
  { title: '操作', key: 'actions', width: 150, fixed: 'right' }
]

function getCheckCycleText(deviceId: string): string {
  const device = deviceMap.value[deviceId]
  if (!device?.inspectionFrequency) return '-'
  const { value, unit } = device.inspectionFrequency
  const unitText = { hour: '小时', day: '天', week: '周' }[unit] || unit
  return `每${value}${unitText}`
}

function getCheckWindowText(deviceId: string): string {
  const device = deviceMap.value[deviceId]
  if (!device?.executionWindow) return '-'
  const { startTime, endTime } = device.executionWindow
  return `${startTime} - ${endTime}`
}

function fetchData() {
  inspectionStore.fetchAllInspectionPoints()
  inspectionStore.fetchAllInspectionDevices()
  inspectionStore.fetchAllInspectionDeviceCheckItems()
  inspectionPoints.value = inspectionStore.inspectionPoints
  devices.value = inspectionStore.inspectionDevices
  checkItems.value = inspectionStore.inspectionDeviceCheckItems
}

const filteredCheckItems = computed(() => {
  if (selectedDeviceId.value) {
    return checkItems.value.filter(item => item.deviceId === selectedDeviceId.value)
  }
  if (selectedTreeKey.value.startsWith('point:')) {
    const pointId = selectedTreeKey.value.replace('point:', '')
    const pointDeviceIds = devices.value
      .filter(d => d.inspectionPointId === pointId)
      .map(d => d.id)
    return checkItems.value.filter(item => pointDeviceIds.includes(item.deviceId))
  }
  return checkItems.value
})

function handleTreeSelect(keys: string[]) {
  selectedTreeKeys.value = keys
}

function handleEdit(record: InspectionDeviceCheckItem) {
  router.push(`/implementation/device/list?deviceId=${record.deviceId}&checkItemId=${record.id}&edit=1`)
}

function handleDelete(id: string) {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这个检测项吗？',
    okText: '确定',
    cancelText: '取消',
    onOk() {
      inspectionStore.deleteInspectionDeviceCheckItem(id)
      fetchData()
      message.success('删除成功')
    }
  })
}

onMounted(() => {
  inspectionStore.initialize()
  fetchData()
})
</script>

<style scoped lang="scss">
.metric-management {
  width: 100%;
  height: 100%;

  .metric-layout {
    margin-top: 16px;
    min-height: 600px;
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
    min-width: 0;
  }

  .header-title {
    font-size: 16px;
    font-weight: 600;
    color: #262626;
  }

  .header-count {
    color: #8c8c8c;
    font-size: 12px;
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
}
</style>
