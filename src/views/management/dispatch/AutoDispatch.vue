<template>
  <div class="auto-dispatch">
    <a-card title="自动调度管理">
      <a-button type="primary" @click="goBack">返回总调度台</a-button>
      <div class="dispatch-content">
        <p>自动调度管理页面 - 骨架页</p>
        <div class="auto-dispatch-info">
          <h3>自动调度配置</h3>
          <p>触发条件：[触发条件]</p>
          <p>执行策略：[执行策略]</p>
          <p>资源分配：[资源分配]</p>
          <p>优先级设置：[优先级设置]</p>
        </div>
        <div class="auto-dispatch-list">
          <h3>自动调度任务列表</h3>
          <a-table :columns="columns" :data-source="data" row-key="id">
            <template #empty>
              <p>暂无自动调度任务</p>
            </template>
          </a-table>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.push('/management/dispatch/center')
}

const columns = [
  { title: '任务ID', dataIndex: 'id' },
  { title: '任务名称', dataIndex: 'name' },
  { title: '触发原因', dataIndex: 'reason' },
  { title: '状态', dataIndex: 'status' },
  { title: '创建时间', dataIndex: 'createTime' },
  { title: '预计执行时间', dataIndex: 'executeTime' }
]

const data = [
  {
    id: '1',
    name: '自动调度任务1',
    reason: '设备异常触发',
    status: '待执行',
    createTime: '2026-04-12 10:00:00',
    executeTime: '2026-04-12 10:30:00'
  }
]
</script>

<style scoped>
.auto-dispatch {
  padding: 20px 0;
}

.dispatch-content {
  margin-top: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 4px;
}

.auto-dispatch-info,
.auto-dispatch-list {
  margin-top: 20px;
  padding: 15px;
  background: #fff;
  border-radius: 4px;
}

h3 {
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 500;
  color: #333;
}

p {
  margin: 5px 0;
  color: #666;
}
</style>
