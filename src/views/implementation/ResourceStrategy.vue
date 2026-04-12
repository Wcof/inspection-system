<template>
  <div class="resource-strategy">
    <div class="page-header">
      <h2>资源分配策略</h2>
      <div class="header-actions">
        <a-button type="primary">
          <template #icon>
            <PlusOutlined />
          </template>
          新增分配策略
        </a-button>
      </div>
    </div>

    <a-card style="margin-top: 16px">
      <div class="search-bar">
        <a-form layout="inline" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
          <a-form-item label="策略名称">
            <a-input placeholder="请输入策略名称" style="width: 200px" />
          </a-form-item>
          <a-form-item label="策略类型">
            <a-select placeholder="请选择策略类型" style="width: 200px">
              <a-select-option value="">全部</a-select-option>
              <a-select-option value="robot">机器人分配</a-select-option>
              <a-select-option value="path">路径分配</a-select-option>
              <a-select-option value="time">时间分配</a-select-option>
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

      <a-table :data-source="strategies" row-key="id">
        <a-table-column title="序号" data-index="index" width="80px">
          <template #default="{ index }">
            {{ index + 1 }}
          </template>
        </a-table-column>
        <a-table-column title="策略名称" data-index="name" />
        <a-table-column title="策略类型" data-index="type">
          <template #default="{ record }">
            {{ getStrategyTypeText(record.type) }}
          </template>
        </a-table-column>
        <a-table-column title="适用场景" data-index="scenario" />
        <a-table-column title="优先级" data-index="priority">
          <template #default="{ record }">
            <a-tag :color="getPriorityColor(record.priority)">{{ record.priority }}</a-tag>
          </template>
        </a-table-column>
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
          description="1. 资源分配策略详细配置
2. 策略优先级管理
3. 策略适用场景设置
4. 资源使用预测
5. 策略效果分析"
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

// 模拟资源分配策略数据
const strategies = ref([
  {
    id: '1',
    name: '负载均衡分配',
    type: 'robot',
    scenario: '多机器人协同',
    priority: '高',
    status: 'active'
  },
  {
    id: '2',
    name: '最短路径优先',
    type: 'path',
    scenario: '单机器人巡检',
    priority: '中',
    status: 'active'
  },
  {
    id: '3',
    name: '工作时间分配',
    type: 'time',
    scenario: '24小时巡检',
    priority: '中',
    status: 'active'
  },
  {
    id: '4',
    name: '关键区域优先',
    type: 'robot',
    scenario: '重要区域巡检',
    priority: '高',
    status: 'inactive'
  },
  {
    id: '5',
    name: '电量优化分配',
    type: 'robot',
    scenario: '长距离巡检',
    priority: '低',
    status: 'inactive'
  }
])

// 获取策略类型文本
const getStrategyTypeText = (type: string): string => {
  switch (type) {
    case 'robot':
      return '机器人分配'
    case 'path':
      return '路径分配'
    case 'time':
      return '时间分配'
    default:
      return type
  }
}

// 获取优先级颜色
const getPriorityColor = (priority: string): string => {
  switch (priority) {
    case '高':
      return 'red'
    case '中':
      return 'orange'
    case '低':
      return 'green'
    default:
      return 'default'
  }
}

// 切换状态
const toggleStatus = (id: string) => {
  const strategy = strategies.value.find(s => s.id === id)
  if (strategy) {
    strategy.status = strategy.status === 'active' ? 'inactive' : 'active'
  }
}
</script>

<style scoped lang="scss">
.resource-strategy {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    h2 {
      margin: 0;
      font-size: 20px;
    }
  }
  
  .search-bar {
    margin-bottom: 16px;
  }
  
  .page-footer {
    margin-top: 24px;
  }
}
</style>