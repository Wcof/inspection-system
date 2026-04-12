<template>
  <div class="inspection-plan-detail">
    <a-card title="计划详情">
      <a-button type="primary" @click="goBack">返回列表</a-button>
      <div class="detail-content">
        <p>计划详情页面 - 骨架页</p>
        <p>计划ID: {{ planId }}</p>
        <div class="plan-info">
          <h3>计划基本信息</h3>
          <p>计划名称：[计划名称]</p>
          <p>计划编码：[计划编码]</p>
          <p>计划类型：[计划类型]</p>
          <p>状态：[计划状态]</p>
          <p>创建时间：[创建时间]</p>
          <p>更新时间：[更新时间]</p>
        </div>
        <div class="schedule-info">
          <h3>调度配置</h3>
          <p>调度周期：[调度周期]</p>
          <p>运行时间：[运行时间]</p>
          <p>开始日期：[开始日期]</p>
          <p>结束日期：[结束日期]</p>
        </div>
        <div class="robot-info">
          <h3>执行机器人</h3>
          <p>机器人名称：[机器人名称]</p>
          <p>机器人编号：[机器人编号]</p>
        </div>
        <div class="point-info">
          <h3>巡检点信息</h3>
          <p>巡检点数量：[巡检点数量]</p>
          <p>巡检点列表：[巡检点列表]</p>
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
const planId = ref(route.params.id as string)

const goBack = () => {
  router.push('/management/plan/list')
}
</script>

<style scoped>
.inspection-plan-detail {
  padding: 20px 0;
}

.detail-content {
  margin-top: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 4px;
}

.plan-info,
.schedule-info,
.robot-info,
.point-info {
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