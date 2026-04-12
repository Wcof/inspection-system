<template>
  <div class="exception-handle">
    <a-card title="异常处理">
      <a-button type="primary" @click="goBack">返回异常详情</a-button>
      <div class="handle-content">
        <p>异常处理页面 - 骨架页</p>
        <p>异常ID: {{ exceptionId }}</p>
        <div class="handle-form">
          <h3>处理表单</h3>
          <a-form :model="form" layout="vertical">
            <a-form-item label="处理方式">
              <a-select v-model:value="form.handleType" placeholder="选择处理方式">
                <a-select-option value="repair">维修</a-select-option>
                <a-select-option value="replace">更换</a-select-option>
                <a-select-option value="adjust">调整</a-select-option>
                <a-select-option value="ignore">忽略</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="处理人员">
              <a-input v-model:value="form.handler" placeholder="输入处理人员" />
            </a-form-item>
            <a-form-item label="处理时间">
              <a-date-picker v-model:value="form.handleTime" show-time format="YYYY-MM-DD HH:mm:ss" />
            </a-form-item>
            <a-form-item label="处理结果">
              <a-select v-model:value="form.result" placeholder="选择处理结果">
                <a-select-option value="success">处理成功</a-select-option>
                <a-select-option value="partial">部分处理</a-select-option>
                <a-select-option value="failed">处理失败</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="处理备注">
              <a-textarea v-model:value="form.remark" rows="4" placeholder="输入处理备注" />
            </a-form-item>
            <a-form-item>
              <a-button type="primary" @click="submitForm">提交处理</a-button>
            </a-form-item>
          </a-form>
        </div>
        <div class="handle-history">
          <h3>处理历史</h3>
          <a-table :columns="columns" :data-source="data" row-key="id">
            <template #empty>
              <p>暂无处理历史</p>
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
const exceptionId = ref(route.params.id as string)

const goBack = () => {
  router.push(`/management/exception/detail/${exceptionId.value}`)
}

const form = ref({
  handleType: '',
  handler: '',
  handleTime: null,
  result: '',
  remark: ''
})

const submitForm = () => {
  // 提交处理逻辑
  console.log('提交异常处理', form.value)
}

const columns = [
  { title: '处理ID', dataIndex: 'id' },
  { title: '处理方式', dataIndex: 'handleType' },
  { title: '处理人员', dataIndex: 'handler' },
  { title: '处理时间', dataIndex: 'handleTime' },
  { title: '处理结果', dataIndex: 'result' },
  { title: '处理备注', dataIndex: 'remark' }
]

const data = [
  {
    id: '1',
    handleType: '维修',
    handler: '工程师A',
    handleTime: '2026-04-12 10:00:00',
    result: '处理成功',
    remark: '设备已修复，运行正常'
  }
]
</script>

<style scoped>
.exception-handle {
  padding: 20px 0;
}

.handle-content {
  margin-top: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 4px;
}

.handle-form,
.handle-history {
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