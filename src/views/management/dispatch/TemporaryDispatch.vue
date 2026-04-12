<template>
  <div class="temporary-dispatch">
    <a-card title="临时调度">
      <a-button type="primary" @click="goBack">返回总调度台</a-button>
      <div class="dispatch-content">
        <p>临时调度页面 - 骨架页</p>
        <div class="temporary-form">
          <h3>临时调度表单</h3>
          <a-form :model="form" layout="vertical">
            <a-form-item label="任务名称">
              <a-input v-model:value="form.name" placeholder="输入任务名称" />
            </a-form-item>
            <a-form-item label="巡检点">
              <a-select v-model:value="form.points" mode="multiple" placeholder="选择巡检点">
                <a-select-option value="point1">巡检点1</a-select-option>
                <a-select-option value="point2">巡检点2</a-select-option>
                <a-select-option value="point3">巡检点3</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="执行机器人">
              <a-select v-model:value="form.robot" placeholder="选择机器人">
                <a-select-option value="robot1">机器人1</a-select-option>
                <a-select-option value="robot2">机器人2</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="执行时间">
              <a-date-picker v-model:value="form.executeTime" show-time format="YYYY-MM-DD HH:mm:ss" />
            </a-form-item>
            <a-form-item label="备注">
              <a-textarea v-model:value="form.remark" placeholder="输入备注信息" />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" @click="submitForm">提交调度</a-button>
            </a-form-item>
          </a-form>
        </div>
        <div class="temporary-list">
          <h3>临时调度任务列表</h3>
          <a-table :columns="columns" :data-source="data" row-key="id">
            <template #empty>
              <p>暂无临时调度任务</p>
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
  name: '',
  points: [],
  robot: '',
  executeTime: null,
  remark: ''
})

const submitForm = () => {
  // 提交逻辑
  console.log('提交临时调度任务', form.value)
}

const columns = [
  { title: '任务ID', dataIndex: 'id' },
  { title: '任务名称', dataIndex: 'name' },
  { title: '巡检点', dataIndex: 'points' },
  { title: '执行机器人', dataIndex: 'robot' },
  { title: '执行时间', dataIndex: 'executeTime' },
  { title: '状态', dataIndex: 'status' }
]

const data = [
  {
    id: '1',
    name: '临时调度任务1',
    points: '巡检点1, 巡检点2',
    robot: '机器人1',
    executeTime: '2026-04-12 14:00:00',
    status: '待执行'
  }
]
</script>

<style scoped>
.temporary-dispatch {
  padding: 20px 0;
}

.dispatch-content {
  margin-top: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 4px;
}

.temporary-form,
.temporary-list {
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