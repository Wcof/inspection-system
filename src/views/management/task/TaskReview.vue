<template>
  <div class="task-review">
    <a-card title="任务复盘">
      <a-button type="primary" @click="goBack">返回任务详情</a-button>
      <div class="review-content">
        <p>任务复盘页面 - 骨架页</p>
        <p>任务ID: {{ taskId }}</p>
        <div class="review-info">
          <h3>任务基本信息</h3>
          <p>任务名称：[任务名称]</p>
          <p>任务类型：[任务类型]</p>
          <p>执行状态：[执行状态]</p>
          <p>开始时间：[开始时间]</p>
          <p>结束时间：[结束时间]</p>
          <p>执行时长：[执行时长]</p>
        </div>
        <div class="review-analysis">
          <h3>执行分析</h3>
          <p>执行效率：[执行效率]</p>
          <p>异常率：[异常率]</p>
          <p>平均巡检点耗时：[平均巡检点耗时]</p>
          <p>路径优化建议：[路径优化建议]</p>
        </div>
        <div class="review-issues">
          <h3>问题与改进</h3>
          <a-table :columns="columns" :data-source="data" row-key="id">
            <template #empty>
              <p>暂无问题记录</p>
            </template>
          </a-table>
        </div>
        <div class="review-summary">
          <h3>复盘总结</h3>
          <a-textarea v-model:value="summary" rows="4" placeholder="输入复盘总结" />
          <a-button type="primary" style="margin-top: 10px" @click="saveSummary">保存总结</a-button>
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
const summary = ref('')

const goBack = () => {
  router.push(`/management/task/detail/${taskId.value}`)
}

const saveSummary = () => {
  // 保存总结逻辑
  console.log('保存复盘总结', summary.value)
}

const columns = [
  { title: '问题ID', dataIndex: 'id' },
  { title: '问题描述', dataIndex: 'description' },
  { title: '问题类型', dataIndex: 'type' },
  { title: '严重程度', dataIndex: 'severity' },
  { title: '改进建议', dataIndex: 'suggestion' }
]

const data = [
  {
    id: '1',
    description: '巡检点2检查耗时过长',
    type: '效率问题',
    severity: '中等',
    suggestion: '优化检查流程，减少等待时间'
  },
  {
    id: '2',
    description: '设备温度异常',
    type: '设备问题',
    severity: '高',
    suggestion: '检查设备散热系统'
  }
]
</script>

<style scoped>
.task-review {
  padding: 20px 0;
}

.review-content {
  margin-top: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 4px;
}

.review-info,
.review-analysis,
.review-issues,
.review-summary {
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