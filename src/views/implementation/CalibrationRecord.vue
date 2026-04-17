<template>
  <div class="calibration-record">
    <a-page-header title="校准记录" />

    <a-card style="margin-top: 16px">
      <div class="search-bar">
        <a-form layout="inline" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
          <a-form-item label="点位名称">
            <a-input placeholder="请输入点位名称" style="width: 180px" />
          </a-form-item>
          <a-form-item label="校准机器人">
            <a-select placeholder="请选择校准机器人" style="width: 180px">
              <a-select-option value="">全部</a-select-option>
              <a-select-option value="robot-1">巡检机器人 A</a-select-option>
              <a-select-option value="robot-2">巡检机器人 B</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="校准状态">
            <a-select placeholder="请选择校准状态" style="width: 180px">
              <a-select-option value="">全部</a-select-option>
              <a-select-option value="pending">待预标</a-select-option>
              <a-select-option value="calibrating">待校准</a-select-option>
              <a-select-option value="calibrated">已校准</a-select-option>
              <a-select-option value="reviewing">待复核</a-select-option>
              <a-select-option value="archived">已归档</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="校准时间">
            <a-range-picker style="width: 280px" />
          </a-form-item>
          <a-form-item class="search-buttons">
            <a-button type="primary">
              <template #icon>
                <SearchOutlined />
              </template>
              搜索
            </a-button>
            <a-button style="margin-left: 8px">重置</a-button>
          </a-form-item>
        </a-form>
      </div>

      <a-table :data-source="calibrationRecords" row-key="id">
        <a-table-column title="序号" data-index="index" width="80px">
          <template #default="{ index }">
            {{ index + 1 }}
          </template>
        </a-table-column>
        <a-table-column title="点位名称" data-index="pointName" />
        <a-table-column title="点位编码" data-index="pointCode" />
        <a-table-column title="校准机器人" data-index="calibrationRobot" />
        <a-table-column title="校准状态" data-index="status">
          <template #default="{ record }">
            <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="校准时间" data-index="calibrationTime" />
        <a-table-column title="校准人员" data-index="calibrator" />
      </a-table>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { SearchOutlined } from '@ant-design/icons-vue'

// 模拟校准记录数据
const calibrationRecords = ref([
  {
    id: '1',
    pointName: 'A区-1号巡检点',
    pointCode: 'POINT-A-001',
    calibrationRobot: '巡检机器人 A',
    status: 'calibrated',
    calibrationTime: '2024-01-01 10:00:00',
    calibrator: '张三'
  },
  {
    id: '2',
    pointName: 'A区-2号巡检点',
    pointCode: 'POINT-A-002',
    calibrationRobot: '巡检机器人 A',
    status: 'reviewing',
    calibrationTime: '2024-01-02 14:00:00',
    calibrator: '李四'
  },
  {
    id: '3',
    pointName: 'B区-1号巡检点',
    pointCode: 'POINT-B-001',
    calibrationRobot: '巡检机器人 B',
    status: 'pending',
    calibrationTime: '',
    calibrator: ''
  },
  {
    id: '4',
    pointName: 'B区-2号巡检点',
    pointCode: 'POINT-B-002',
    calibrationRobot: '巡检机器人 B',
    status: 'calibrating',
    calibrationTime: '2024-01-03 09:00:00',
    calibrator: '王五'
  },
  {
    id: '5',
    pointName: 'C区-1号巡检点',
    pointCode: 'POINT-C-001',
    calibrationRobot: '巡检机器人 A',
    status: 'archived',
    calibrationTime: '2023-12-30 16:00:00',
    calibrator: '赵六'
  }
])

// 获取状态颜色
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'pending':
      return 'default'
    case 'calibrating':
      return 'blue'
    case 'calibrated':
      return 'green'
    case 'reviewing':
      return 'orange'
    case 'archived':
      return 'gray'
    default:
      return 'default'
  }
}

// 获取状态文本
const getStatusText = (status: string): string => {
  switch (status) {
    case 'pending':
      return '待预标'
    case 'calibrating':
      return '待校准'
    case 'calibrated':
      return '已校准'
    case 'reviewing':
      return '待复核'
    case 'archived':
      return '已归档'
    default:
      return status
  }
}
</script>

<style scoped lang="css">.calibration-record .page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.calibration-record .page-header h2 {
  margin: 0;
  font-size: 20px;
}
.calibration-record .search-bar {
  margin-bottom: 16px;
}
.calibration-record .search-bar :deep(.ant-form-inline) {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 8px 16px;
}
.calibration-record .search-bar .search-buttons {
  margin-left: auto;
  margin-bottom: 8px;
}
.calibration-record .page-footer {
  margin-top: 24px;
}
</style>