<template>
  <div class="inspection-cycle">
    <div class="page-header">
      <h2>检查周期管理</h2>
      <div class="header-actions">
        <a-button type="primary">
          <template #icon>
            <PlusOutlined />
          </template>
          新增检查周期
        </a-button>
      </div>
    </div>

    <a-card style="margin-top: 16px">
      <div class="search-bar">
        <a-form layout="inline" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
          <a-form-item label="周期名称">
            <a-input placeholder="请输入周期名称" style="width: 200px" />
          </a-form-item>
          <a-form-item label="周期类型">
            <a-select placeholder="请选择周期类型" style="width: 200px">
              <a-select-option value="">全部</a-select-option>
              <a-select-option value="daily">每日</a-select-option>
              <a-select-option value="weekly">每周</a-select-option>
              <a-select-option value="monthly">每月</a-select-option>
              <a-select-option value="quarterly">每季度</a-select-option>
              <a-select-option value="yearly">每年</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-button type="primary">
              <template #icon>
                <SearchOutlined />
              </template>
              搜索
            </a-button>
          </a-form-item>
          <a-form-item>
            <a-button>重置</a-button>
          </a-form-item>
        </a-form>
      </div>

      <a-table :data-source="cycles" row-key="id">
        <a-table-column title="序号" data-index="index" width="80px">
          <template #default="{ index }">
            {{ index + 1 }}
          </template>
        </a-table-column>
        <a-table-column title="周期名称" data-index="name" />
        <a-table-column title="周期类型" data-index="type">
          <template #default="{ record }">
            {{ getCycleTypeText(record.type) }}
          </template>
        </a-table-column>
        <a-table-column title="执行间隔" data-index="interval" />
        <a-table-column title="开始时间" data-index="startTime" />
        <a-table-column title="状态" data-index="status">
          <template #default="{ record }">
            <a-tag :color="record.status === 'active' ? 'green' : 'default'">{{ record.status === 'active' ? '启用' : '禁用' }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="操作" width="150px" fixed="right">
          <template #default="{ record }">
            <a-space size="small">
              <a-button type="link">编辑</a-button>
              <a-button type="link" @click="toggleStatus(record.id)">{{ record.status === 'active' ? '禁用' : '启用' }}</a-button>
              <a-button type="link" danger>删除</a-button>
            </a-space>
          </template>
        </a-table-column>
      </a-table>
    </a-card>

    <div class="page-footer">
      <div class="construction-note">
        <a-alert
          message="后续建设范围"
          description="1. 检查周期详细配置
2. 周期与巡检点关联
3. 周期执行历史
4. 周期优化建议
5. 多维度周期管理"
          type="info"
          show-icon
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { PlusOutlined, SearchOutlined } from '@ant-design/icons-vue'

// 模拟检查周期数据
const cycles = ref([
  {
    id: '1',
    name: '日常巡检',
    type: 'daily',
    interval: '1天',
    startTime: '08:00',
    status: 'active'
  },
  {
    id: '2',
    name: '周巡检',
    type: 'weekly',
    interval: '7天',
    startTime: '09:00',
    status: 'active'
  },
  {
    id: '3',
    name: '月巡检',
    type: 'monthly',
    interval: '30天',
    startTime: '10:00',
    status: 'active'
  },
  {
    id: '4',
    name: '季度巡检',
    type: 'quarterly',
    interval: '90天',
    startTime: '14:00',
    status: 'inactive'
  },
  {
    id: '5',
    name: '年度巡检',
    type: 'yearly',
    interval: '365天',
    startTime: '09:00',
    status: 'inactive'
  }
])

// 获取周期类型文本
const getCycleTypeText = (type: string): string => {
  switch (type) {
    case 'daily':
      return '每日'
    case 'weekly':
      return '每周'
    case 'monthly':
      return '每月'
    case 'quarterly':
      return '每季度'
    case 'yearly':
      return '每年'
    default:
      return type
  }
}

// 切换状态
const toggleStatus = (id: string) => {
  const cycle = cycles.value.find(c => c.id === id)
  if (cycle) {
    cycle.status = cycle.status === 'active' ? 'inactive' : 'active'
  }
}
</script>

<style scoped lang="css">.inspection-cycle .page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.inspection-cycle .page-header h2 {
  margin: 0;
  font-size: 20px;
}
.inspection-cycle .search-bar {
  margin-bottom: 16px;
}
.inspection-cycle .page-footer {
  margin-top: 24px;
}
</style>