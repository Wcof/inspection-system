<template>
  <div class="dispatch-intervention">
    <a-card title="调度干预">
      <a-button type="primary" @click="goBack">返回总调度台</a-button>
      <div class="intervention-content">
        <p>调度干预页面 - 骨架页</p>
        <div class="intervention-list">
          <h3>待干预任务列表</h3>
          <a-table :columns="columns" :data-source="data" row-key="id">
            <template #action="record">
              <a-button @click="handleIntervention(record.id)">干预</a-button>
            </template>
            <template #empty>
              <p>暂无待干预任务</p>
            </template>
          </a-table>
        </div>
        <div class="intervention-history">
          <h3>干预历史记录</h3>
          <a-table :columns="historyColumns" :data-source="historyData" row-key="id">
            <template #empty>
              <p>暂无干预历史</p>
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

const handleIntervention = (id: string) => {
  // 干预逻辑
  console.log('干预任务', id)
}

const columns = [
  { title: '任务ID', dataIndex: 'id' },
  { title: '任务名称', dataIndex: 'name' },
  { title: '任务类型', dataIndex: 'type' },
  { title: '当前状态', dataIndex: 'status' },
  { title: '创建时间', dataIndex: 'createTime' },
  { title: '操作', key: 'action', slots: { customRender: 'action' } }
]

const data = [
  {
    id: '1',
    name: '调度任务1',
    type: '计划任务',
    status: '执行中',
    createTime: '2026-04-12 09:00:00'
  }
]

const historyColumns = [
  { title: '干预ID', dataIndex: 'id' },
  { title: '任务ID', dataIndex: 'taskId' },
  { title: '干预类型', dataIndex: 'type' },
  { title: '干预内容', dataIndex: 'content' },
  { title: '干预时间', dataIndex: 'interventionTime' },
  { title: '操作人员', dataIndex: 'operator' }
]

const historyData = [
  {
    id: '1',
    taskId: '1',
    type: '暂停',
    content: '暂停执行任务',
    interventionTime: '2026-04-11 15:00:00',
    operator: '管理员'
  }
]
</script>

<style scoped>
.dispatch-intervention {
  padding: 20px 0;
}

.intervention-content {
  margin-top: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 4px;
}

.intervention-list,
.intervention-history {
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
