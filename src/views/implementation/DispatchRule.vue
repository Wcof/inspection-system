<template>
  <div class="dispatch-rule">
    <div class="page-header">
      <h2>自动调度规则</h2>
      <div class="header-actions">
        <a-button type="primary">
          <template #icon>
            <PlusOutlined />
          </template>
          新增调度规则
        </a-button>
      </div>
    </div>

    <a-card style="margin-top: 16px">
      <div class="search-bar">
        <a-form layout="inline" :label-col="{ span: 6 }" :wrapper-col="{ span: 18 }">
          <a-form-item label="规则名称">
            <a-input placeholder="请输入规则名称" style="width: 200px" />
          </a-form-item>
          <a-form-item label="规则类型">
            <a-select placeholder="请选择规则类型" style="width: 200px">
              <a-select-option value="">全部</a-select-option>
              <a-select-option value="time">时间触发</a-select-option>
              <a-select-option value="event">事件触发</a-select-option>
              <a-select-option value="condition">条件触发</a-select-option>
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

      <a-table :data-source="rules" row-key="id">
        <a-table-column title="序号" data-index="index" width="80px">
          <template #default="{ index }">
            {{ index + 1 }}
          </template>
        </a-table-column>
        <a-table-column title="规则名称" data-index="name" />
        <a-table-column title="规则类型" data-index="type">
          <template #default="{ record }">
            {{ getRuleTypeText(record.type) }}
          </template>
        </a-table-column>
        <a-table-column title="触发条件" data-index="condition" />
        <a-table-column title="执行动作" data-index="action" />
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
          description="1. 规则详细配置
2. 规则触发条件设置
3. 规则执行动作配置
4. 规则优先级管理
5. 规则执行历史"
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

// 模拟调度规则数据
const rules = ref([
  {
    id: '1',
    name: '每日定时巡检',
    type: 'time',
    condition: '每天 08:00',
    action: '执行 A 区巡检任务',
    status: 'active'
  },
  {
    id: '2',
    name: '机器人异常处理',
    type: 'event',
    condition: '机器人状态异常',
    action: '发送告警通知',
    status: 'active'
  },
  {
    id: '3',
    name: '低电量自动充电',
    type: 'condition',
    condition: '电量低于 20%',
    action: '返回充电区充电',
    status: 'active'
  },
  {
    id: '4',
    name: '周检提醒',
    type: 'time',
    condition: '每周一 09:00',
    action: '执行周检任务',
    status: 'inactive'
  },
  {
    id: '5',
    name: '异常恢复处理',
    type: 'event',
    condition: '异常状态恢复',
    action: '继续执行原任务',
    status: 'inactive'
  }
])

// 获取规则类型文本
const getRuleTypeText = (type: string): string => {
  switch (type) {
    case 'time':
      return '时间触发'
    case 'event':
      return '事件触发'
    case 'condition':
      return '条件触发'
    default:
      return type
  }
}

// 切换状态
const toggleStatus = (id: string) => {
  const rule = rules.value.find(r => r.id === id)
  if (rule) {
    rule.status = rule.status === 'active' ? 'inactive' : 'active'
  }
}
</script>

<style scoped lang="css">.dispatch-rule .page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.dispatch-rule .page-header h2 {
  margin: 0;
  font-size: 20px;
}
.dispatch-rule .search-bar {
  margin-bottom: 16px;
}
.dispatch-rule .page-footer {
  margin-top: 24px;
}
</style>