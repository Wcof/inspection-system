<template>
  <div class="dispatch-record">
    <a-card title="调度记录">
      <a-button type="primary" @click="goBack">返回总调度台</a-button>
      <div class="record-content">
        <p>调度记录页面 - 骨架页</p>
        <div class="record-filter">
          <a-form :model="form" layout="inline">
            <a-form-item label="任务类型">
              <a-select v-model:value="form.type" placeholder="选择任务类型">
                <a-select-option value="plan">计划任务</a-select-option>
                <a-select-option value="auto">自动调度任务</a-select-option>
                <a-select-option value="temporary">临时调度任务</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="时间范围">
              <a-range-picker v-model:value="form.timeRange" />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" @click="search">查询</a-button>
            </a-form-item>
          </a-form>
        </div>
        <div class="record-list">
          <h3>调度记录列表</h3>
          <a-table :columns="columns" :data-source="data" row-key="id">
            <template #empty>
              <p>暂无调度记录</p>
            </template>
          </a-table>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const goBack = () => {
  router.push('/management/dispatch/center')
}

const form = ref({
  type: '',
  timeRange: null
})

const search = () => {
  // 查询逻辑
  console.log('查询调度记录', form.value)
}

const columns = [
  { title: '记录ID', dataIndex: 'id' },
  { title: '任务ID', dataIndex: 'taskId' },
  { title: '任务名称', dataIndex: 'taskName' },
  { title: '任务类型', dataIndex: 'taskType' },
  { title: '调度时间', dataIndex: 'dispatchTime' },
  { title: '调度状态', dataIndex: 'status' },
  { title: '调度结果', dataIndex: 'result' }
]

const data = [
  {
    id: '1',
    taskId: '1',
    taskName: '计划任务1',
    taskType: '计划任务',
    dispatchTime: '2026-04-12 09:00:00',
    status: '成功',
    result: '任务已开始执行'
  },
  {
    id: '2',
    taskId: '2',
    taskName: '临时调度任务1',
    taskType: '临时调度任务',
    dispatchTime: '2026-04-12 10:00:00',
    status: '成功',
    result: '任务已开始执行'
  }
]
</script>

<style scoped>
.dispatch-record {
  padding: 20px 0;
}

.record-content {
  margin-top: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 4px;
}

.record-filter,
.record-list {
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