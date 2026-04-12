<template>
  <div class="conflict-handling">
    <a-card title="冲突处理">
      <a-button type="primary" @click="goBack">返回总调度台</a-button>
      <div class="conflict-content">
        <p>冲突处理页面 - 骨架页</p>
        <div class="conflict-list">
          <h3>待处理冲突列表</h3>
          <a-table :columns="columns" :data-source="data" row-key="id">
            <template #action="record">
              <a-button @click="handleConflict(record.id)">处理</a-button>
            </template>
            <template #empty>
              <p>暂无冲突任务</p>
            </template>
          </a-table>
        </div>
        <div class="conflict-history">
          <h3>冲突处理历史</h3>
          <a-table :columns="historyColumns" :data-source="historyData" row-key="id">
            <template #empty>
              <p>暂无冲突处理历史</p>
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

const handleConflict = (id: string) => {
  // 处理冲突逻辑
  console.log('处理冲突', id)
}

const columns = [
  { title: '冲突ID', dataIndex: 'id' },
  { title: '任务1', dataIndex: 'task1' },
  { title: '任务2', dataIndex: 'task2' },
  { title: '冲突类型', dataIndex: 'type' },
  { title: '冲突时间', dataIndex: 'conflictTime' },
  { title: '操作', key: 'action', slots: { customRender: 'action' } }
]

const data = [
  {
    id: '1',
    task1: '计划任务1',
    task2: '临时调度任务1',
    type: '资源冲突',
    conflictTime: '2026-04-12 10:00:00'
  }
]

const historyColumns = [
  { title: '处理ID', dataIndex: 'id' },
  { title: '冲突ID', dataIndex: 'conflictId' },
  { title: '处理动作', dataIndex: 'action' },
  { title: '处理时间', dataIndex: 'handleTime' },
  { title: '操作人员', dataIndex: 'operator' }
]

const historyData = [
  {
    id: '1',
    conflictId: '1',
    action: '排队',
    handleTime: '2026-04-11 16:00:00',
    operator: '管理员'
  }
]
</script>

<style scoped>
.conflict-handling {
  padding: 20px 0;
}

.conflict-content {
  margin-top: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 4px;
}

.conflict-list,
.conflict-history {
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
