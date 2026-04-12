<template>
  <div class="exception-detail">
    <a-card title="异常详情">
      <a-button type="primary" @click="goBack">返回异常列表</a-button>
      <div class="detail-content">
        <p>异常详情页面 - 骨架页</p>
        <p>异常ID: {{ exceptionId }}</p>
        <div class="exception-info">
          <h3>异常基本信息</h3>
          <p>异常类型：[异常类型]</p>
          <p>严重程度：[严重程度]</p>
          <p>发生时间：[发生时间]</p>
          <p>处理状态：[处理状态]</p>
          <p>所属任务：[所属任务]</p>
          <p>所属巡检点：[所属巡检点]</p>
        </div>
        <div class="exception-content">
          <h3>异常详情</h3>
          <p>异常描述：[异常描述]</p>
          <p>异常原因：[异常原因]</p>
          <p>影响范围：[影响范围]</p>
        </div>
        <div class="exception-handle">
          <h3>处理记录</h3>
          <a-timeline>
            <a-timeline-item>异常发生</a-timeline-item>
            <a-timeline-item>异常被发现</a-timeline-item>
            <a-timeline-item>开始处理</a-timeline-item>
            <a-timeline-item>处理完成</a-timeline-item>
          </a-timeline>
        </div>
        <div class="exception-actions">
          <a-button type="primary" @click="handleException">处理异常</a-button>
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
  router.push('/management/exception/list')
}

const handleException = () => {
  router.push(`/management/exception/handle/${exceptionId.value}`)
}
</script>

<style scoped>
.exception-detail {
  padding: 20px 0;
}

.detail-content {
  margin-top: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 4px;
}

.exception-info,
.exception-content,
.exception-handle,
.exception-actions {
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

.exception-actions {
  display: flex;
  justify-content: flex-end;
}
</style>