<template>
  <div class="check-result">
    <a-card title="检查结果">
      <a-button type="primary" @click="goBack">返回任务详情</a-button>
      <div class="result-content">
        <p>检查结果页面 - 骨架页</p>
        <p>任务ID: {{ taskId }}</p>
        <div class="result-summary">
          <h3>检查摘要</h3>
          <p>巡检点总数：[巡检点总数]</p>
          <p>通过点数：[通过点数]</p>
          <p>异常点数：[异常点数]</p>
          <p>检查完成率：[检查完成率]</p>
        </div>
        <div class="result-list">
          <h3>检查结果列表</h3>
          <a-table :columns="columns" :data-source="data" row-key="id">
            <template #status="{ record }">
              <a-tag :color="record.status === '通过' ? 'green' : 'red'">{{ record.status }}</a-tag>
            </template>
            <template #empty>
              <p>暂无检查结果</p>
            </template>
          </a-table>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const taskId = ref(route.params.id as string)

const goBack = () => {
  router.push(`/management/task/detail/${taskId.value}`)
}

const columns = [
  { title: '巡检点ID', dataIndex: 'id' },
  { title: '巡检点名称', dataIndex: 'name' },
  { title: '检查时间', dataIndex: 'checkTime' },
  { title: '检查状态', key: 'status', slots: { customRender: 'status' } },
  { title: '异常信息', dataIndex: 'exception' },
  { title: '处理状态', dataIndex: 'handleStatus' }
]

const data = [
  {
    id: '1',
    name: '巡检点1',
    checkTime: '2026-04-12 09:10:00',
    status: '通过',
    exception: '',
    handleStatus: '无需处理'
  },
  {
    id: '2',
    name: '巡检点2',
    checkTime: '2026-04-12 09:20:00',
    status: '异常',
    exception: '设备温度过高',
    handleStatus: '待处理'
  },
  {
    id: '3',
    name: '巡检点3',
    checkTime: '2026-04-12 09:30:00',
    status: '通过',
    exception: '',
    handleStatus: '无需处理'
  }
]
</script>

<style scoped>
.check-result {
  padding: 20px 0;
}

.result-content {
  margin-top: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 4px;
}

.result-summary,
.result-list {
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