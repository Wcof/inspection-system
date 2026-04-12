<template>
  <div class="exception-analysis">
    <a-card title="异常分析">
      <a-button type="primary" @click="goBack">返回报表统计</a-button>
      <div class="analysis-content">
        <p>异常分析页面 - 骨架页</p>
        <div class="analysis-filter">
          <a-form :model="form" layout="inline">
            <a-form-item label="时间范围">
              <a-range-picker v-model:value="form.timeRange" />
            </a-form-item>
            <a-form-item label="异常类型">
              <a-select v-model:value="form.type" placeholder="选择异常类型">
                <a-select-option value="temperature">温度异常</a-select-option>
                <a-select-option value="humidity">湿度异常</a-select-option>
                <a-select-option value="pressure">压力异常</a-select-option>
                <a-select-option value="vibration">振动异常</a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item>
              <a-button type="primary" @click="search">查询</a-button>
            </a-form-item>
          </a-form>
        </div>
        <div class="analysis-charts">
          <h3>异常统计图表</h3>
          <div class="chart-placeholder">
            <p>图表占位区域</p>
            <p>异常分析图表将在此显示</p>
          </div>
        </div>
        <div class="analysis-data">
          <h3>异常数据</h3>
          <a-table :columns="columns" :data-source="data" row-key="id">
            <template #empty>
              <p>暂无异常数据</p>
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
  router.push('/management/report/statistics')
}

const form = ref({
  timeRange: null,
  type: ''
})

const search = () => {
  // 查询逻辑
  console.log('查询异常分析', form.value)
}

const columns = [
  { title: '异常类型', dataIndex: 'type' },
  { title: '发生次数', dataIndex: 'count' },
  { title: '占比', dataIndex: 'percentage' },
  { title: '处理率', dataIndex: 'handleRate' },
  { title: '趋势', dataIndex: 'trend' }
]

const data = [
  {
    id: '1',
    type: '温度异常',
    count: 50,
    percentage: '40%',
    handleRate: '90%',
    trend: '上升'
  },
  {
    id: '2',
    type: '湿度异常',
    count: 30,
    percentage: '24%',
    handleRate: '85%',
    trend: '稳定'
  },
  {
    id: '3',
    type: '压力异常',
    count: 25,
    percentage: '20%',
    handleRate: '95%',
    trend: '下降'
  },
  {
    id: '4',
    type: '振动异常',
    count: 20,
    percentage: '16%',
    handleRate: '80%',
    trend: '上升'
  }
]
</script>

<style scoped>
.exception-analysis {
  padding: 20px 0;
}

.analysis-content {
  margin-top: 20px;
  padding: 20px;
  background: #f5f5f5;
  border-radius: 4px;
}

.analysis-filter,
.analysis-charts,
.analysis-data {
  margin-top: 20px;
  padding: 15px;
  background: #fff;
  border-radius: 4px;
}

.chart-placeholder {
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