<template>
  <div class="calibration-record">
    <a-page-header title="校准记录" />

    <a-card style="margin-top: 16px">
      <div class="search-bar">
        <a-form layout="inline" :model="filters">
          <a-form-item label="点位名称">
            <a-input v-model:value="filters.pointName" placeholder="请输入点位名称" style="width: 180px" allow-clear />
          </a-form-item>
          <a-form-item label="校准机器人">
            <a-select v-model:value="filters.robotId" placeholder="请选择校准机器人" style="width: 180px" allow-clear>
              <a-select-option v-for="robot in robots" :key="robot.id" :value="robot.id">{{ robot.name }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="校准状态">
            <a-select v-model:value="filters.status" placeholder="请选择校准状态" style="width: 180px" allow-clear>
              <a-select-option value="pending">待校准</a-select-option>
              <a-select-option value="calibrated">已校准</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item class="search-buttons">
            <a-button type="primary">
              <template #icon><SearchOutlined /></template>
              搜索
            </a-button>
            <a-button style="margin-left: 8px" @click="resetFilters">重置</a-button>
          </a-form-item>
        </a-form>
      </div>

      <a-table :data-source="filteredRecords" row-key="id">
        <a-table-column title="序号" width="80px">
          <template #default="{ index }">{{ index + 1 }}</template>
        </a-table-column>
        <a-table-column title="点位名称" data-index="pointName" />
        <a-table-column title="点位编码" data-index="pointCode" />
        <a-table-column title="巡检区域" data-index="areaName" />
        <a-table-column title="校准机器人" data-index="calibrationRobot" />
        <a-table-column title="校准状态" data-index="status">
          <template #default="{ record }">
            <a-tag :color="record.status === 'calibrated' ? 'green' : 'orange'">{{ getStatusText(record.status) }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="校准时间" data-index="calibrationTime" />
        <a-table-column title="校准人员" data-index="calibrator" />
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { SearchOutlined } from '@ant-design/icons-vue'
import { useInspectionStore } from '@/stores/inspection'
import { useRobotStore } from '@/stores/robot'

const inspectionStore = useInspectionStore()
const robotStore = useRobotStore()

const filters = reactive({
  pointName: '',
  robotId: undefined as string | undefined,
  status: undefined as string | undefined
})

const robots = computed(() => robotStore.robots)

const calibrationRecords = computed(() => {
  const robotRows = robots.value
  return inspectionStore.inspectionPoints.map((point, index) => {
    const robot = robotRows[index % Math.max(robotRows.length, 1)]
    return {
      id: `calibration-${point.id}`,
      pointName: point.name,
      pointCode: point.code,
      areaName: point.areaName || '-',
      robotId: robot?.id || '',
      calibrationRobot: robot?.name || '-',
      status: point.calibrationStatus,
      calibrationTime: point.calibratedAt ? formatDate(point.calibratedAt) : '-',
      calibrator: point.updatedBy || '系统管理员'
    }
  })
})

const filteredRecords = computed(() => calibrationRecords.value.filter((record) => {
  const matchesName = !filters.pointName || record.pointName.includes(filters.pointName) || record.pointCode.includes(filters.pointName)
  const matchesRobot = !filters.robotId || record.robotId === filters.robotId
  const matchesStatus = !filters.status || record.status === filters.status
  return matchesName && matchesRobot && matchesStatus
}))

function resetFilters() {
  filters.pointName = ''
  filters.robotId = undefined
  filters.status = undefined
}

function getStatusText(status: string) {
  return status === 'calibrated' ? '已校准' : '待校准'
}

function formatDate(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? '-' : date.toLocaleString()
}

onMounted(() => {
  inspectionStore.initialize()
  robotStore.initialize()
})
</script>

<style scoped lang="css">
.calibration-record .search-bar {
  margin-bottom: 16px;
}
.calibration-record .search-bar :deep(.ant-form-inline) {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 8px 16px;
}
.calibration-record .search-buttons {
  margin-left: auto;
  margin-bottom: 8px;
}
</style>
