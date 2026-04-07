<template>
  <div class="inspection-statistics">
    <div class="page-header">
      <h2>巡检统计</h2>
    </div>
    
    <a-row :gutter="16" style="margin-top: 16px;">
      <!-- 统计卡片 -->
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #1890ff;">
              <AppstoreOutlined />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ totalTasks }}</div>
              <div class="stat-label">总任务数</div>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #52c41a;">
              <CheckCircleOutlined />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ completedTasks }}</div>
              <div class="stat-label">已完成</div>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #faad14;">
              <ClockCircleOutlined />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ pendingTasks }}</div>
              <div class="stat-label">进行中</div>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :span="6">
        <a-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #ff4d4f;">
              <ExclamationCircleOutlined />
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ exceptionTasks }}</div>
              <div class="stat-label">异常数</div>
            </div>
          </div>
        </a-card>
      </a-col>
    </a-row>
    
    <a-row :gutter="16" style="margin-top: 16px;">
      <!-- 图表区域 -->
      <a-col :span="12">
        <a-card title="巡检任务趋势">
          <div class="chart-placeholder">
            <p>巡检任务趋势图表</p>
          </div>
        </a-card>
      </a-col>
      <a-col :span="12">
        <a-card title="巡检完成率">
          <div class="chart-placeholder">
            <p>巡检完成率图表</p>
          </div>
        </a-card>
      </a-col>
    </a-row>
    
    <a-row style="margin-top: 16px;">
      <a-col :span="24">
        <a-card title="最近巡检记录">
          <a-table :data-source="recentRecords" :pagination="false" row-key="id">
            <a-table-column title="任务名称" data-index="taskName" />
            <a-table-column title="执行时间" data-index="executeTime" />
            <a-table-column title="执行人" data-index="executor" />
            <a-table-column title="状态" data-index="status">
              <template #default="{ record }">
                <a-tag v-if="record.status === 'completed'" color="green">已完成</a-tag>
                <a-tag v-else-if="record.status === 'pending'" color="orange">进行中</a-tag>
                <a-tag v-else color="red">异常</a-tag>
              </template>
            </a-table-column>
            <a-table-column title="巡检点数" data-index="pointCount" />
          </a-table>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AppstoreOutlined, CheckCircleOutlined, ClockCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons-vue'

const totalTasks = ref(128)
const completedTasks = ref(96)
const pendingTasks = ref(25)
const exceptionTasks = ref(7)

const recentRecords = ref([
  {
    id: '1',
    taskName: 'A区生产线巡检',
    executeTime: '2024-01-15 09:00:00',
    executor: '张三',
    status: 'completed',
    pointCount: 15
  },
  {
    id: '2',
    taskName: '安全设施巡检',
    executeTime: '2024-01-15 10:30:00',
    executor: '李四',
    status: 'pending',
    pointCount: 12
  },
  {
    id: '3',
    taskName: 'B区设备巡检',
    executeTime: '2024-01-14 14:00:00',
    executor: '王五',
    status: 'completed',
    pointCount: 20
  },
  {
    id: '4',
    taskName: 'C区巡检路线',
    executeTime: '2024-01-14 16:00:00',
    executor: '赵六',
    status: 'exception',
    pointCount: 8
  },
  {
    id: '5',
    taskName: 'D区日常巡检',
    executeTime: '2024-01-13 08:00:00',
    executor: '张三',
    status: 'completed',
    pointCount: 18
  }
])
</script>

<style scoped lang="scss">
.inspection-statistics {
  .page-header {
    h2 {
      margin: 0;
      font-size: 20px;
    }
  }
  
  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
      
      .stat-icon {
        width: 64px;
        height: 64px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 32px;
      }
      
      .stat-info {
        flex: 1;
        
        .stat-value {
          font-size: 28px;
          font-weight: 600;
          color: #333;
        }
        
        .stat-label {
          font-size: 14px;
          color: #999;
          margin-top: 4px;
        }
      }
    }
  }
  
  .chart-placeholder {
    height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f5f5;
    border-radius: 4px;
    
    p {
      color: #999;
      margin: 0;
    }
  }
}
</style>
