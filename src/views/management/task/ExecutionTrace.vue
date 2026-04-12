<template>
  <div class="execution-trace">
    <a-card title="执行轨迹">
      <a-button type="primary" @click="goBack">返回任务详情</a-button>
      <div class="trace-content">
        <p>执行轨迹页面 - 骨架页</p>
        <p>任务ID: {{ taskId }}</p>
        <div class="trace-info">
          <h3>任务基本信息</h3>
          <p>任务名称：[任务名称]</p>
          <p>任务类型：[任务类型]</p>
          <p>执行状态：[执行状态]</p>
          <p>开始时间：[开始时间]</p>
          <p>结束时间：[结束时间]</p>
        </div>
        <div class="trace-map">
          <h3>执行轨迹地图</h3>
          <div class="map-placeholder">
            <p>地图占位区域</p>
            <p>执行轨迹将在此显示</p>
          </div>
        </div>
        <div class="trace-steps">
          <h3>执行步骤</h3>
          <a-timeline>
            <a-timeline-item>开始执行</a-timeline-item>
            <a-timeline-item>到达巡检点1</a-timeline-item>
            <a-timeline-item>完成巡检点1</a-timeline-item>
            <a-timeline-item>到达巡检点2</a-timeline-item>
            <a-timeline-item>完成巡检点2</a-timeline-item>
            <a-timeline-item>任务完成</a-timeline-item>
          </a-timeline>
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
</script>

<style scoped>
.execution-trace {
  padding: 20px 0;
}

.trace-content {
  margin-top: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 4px;
}

.trace-info,
.trace-map,
.trace-steps {
  margin-top: 20px;
  padding: 15px;
  background: #fff;
  border-radius: 4px;
}

.map-placeholder {
  height: 300px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: #f0f0f0;
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