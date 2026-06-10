<template>
  <div>
    <a-page-header title="安全策略详情" @back="goBack" />

    <a-space v-if="item" direction="vertical" style="width: 100%; margin-top: 16px" :size="16">
      <!-- 基本信息 -->
      <a-card title="基本信息">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="策略名称">{{ item.name }}</a-descriptions-item>
          <a-descriptions-item label="优先级">
            <a-tag :color="item.priority === 'high' ? 'red' : item.priority === 'medium' ? 'orange' : 'blue'">
              {{ priorityMap[item.priority as Priority] ?? item.priority }}
            </a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="状态">
            <a-tag :color="item.status === '启用' ? 'green' : item.status === '草稿' ? 'gold' : 'default'">{{ item.status }}</a-tag>
          </a-descriptions-item>
          <a-descriptions-item label="创建时间">{{ formatTime(item.createdAt) }}</a-descriptions-item>
          <a-descriptions-item label="策略说明" :span="2">{{ item.description || '-' }}</a-descriptions-item>
        </a-descriptions>
      </a-card>

      <!-- 速度与安全距离 -->
      <a-card title="速度与安全距离">
        <a-descriptions :column="3" bordered>
          <a-descriptions-item label="正常行驶速度">{{ item.normalSpeed }} km/h</a-descriptions-item>
          <a-descriptions-item label="最高限速">{{ item.maxSpeed }} km/h</a-descriptions-item>
          <a-descriptions-item label="最小安全距离">{{ item.minSafeDistance }} m</a-descriptions-item>
          <a-descriptions-item label="速度膨胀系数">{{ item.speedExpansionFactor }}%</a-descriptions-item>
          <a-descriptions-item label="前方无障碍检测距离">{{ item.clearDistanceForFullSpeed }} m</a-descriptions-item>
          <a-descriptions-item label="速度自适应">
            前方 {{ item.clearDistanceForFullSpeed }}m 内无障碍 → {{ item.maxSpeed }}km/h；有障碍 → {{ item.normalSpeed }}km/h
          </a-descriptions-item>
        </a-descriptions>
      </a-card>

      <!-- 避障策略 -->
      <a-card title="避障策略">
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="最小膨胀系数">{{ item.obstacleExpansionMin }}%</a-descriptions-item>
          <a-descriptions-item label="最大膨胀系数">{{ item.obstacleExpansionMax }}%</a-descriptions-item>
          <a-descriptions-item label="允许擦边通行">{{ item.allowEdgePass ? '是' : '否' }}</a-descriptions-item>
          <a-descriptions-item label="擦边最小通道宽度">{{ item.edgePassMinWidth }} m</a-descriptions-item>
        </a-descriptions>
      </a-card>

      <!-- 遥控安全 -->
      <a-card title="遥控安全">
        <a-descriptions :column="3" bordered>
          <a-descriptions-item label="指令超时时间">{{ item.commandTimeoutSec }} 秒</a-descriptions-item>
          <a-descriptions-item label="超时处理方式">{{ timeoutActionMap[item.timeoutAction] ?? item.timeoutAction }}</a-descriptions-item>
          <a-descriptions-item label="遥控保持避障">{{ item.remoteObstacleAvoidance ? '开启' : '关闭' }}</a-descriptions-item>
        </a-descriptions>
      </a-card>

      <!-- 特殊路段处理 -->
      <a-card title="特殊路段处理">
        <a-divider orientation="left" style="margin-top: 0">窄道处理</a-divider>
        <a-descriptions :column="2" bordered style="margin-bottom: 16px">
          <a-descriptions-item label="启用状态">
            <a-tag :color="item.narrowRoad.enabled ? 'green' : 'default'">{{ item.narrowRoad.enabled ? '已启用' : '未启用' }}</a-tag>
          </a-descriptions-item>
          <template v-if="item.narrowRoad.enabled">
            <a-descriptions-item label="窄道判定宽度">{{ item.narrowRoad.narrowWidthThreshold }} m</a-descriptions-item>
            <a-descriptions-item label="窄道限速">{{ item.narrowRoad.speedLimit }} km/h</a-descriptions-item>
            <a-descriptions-item label="安全边界收缩至">{{ item.narrowRoad.safeDistanceOverride }} m</a-descriptions-item>
            <a-descriptions-item label="语音提醒">{{ item.narrowRoad.voiceAlert ? '开启' : '关闭' }}</a-descriptions-item>
          </template>
        </a-descriptions>

        <a-divider orientation="left">便桥处理</a-divider>
        <a-descriptions :column="2" bordered style="margin-bottom: 16px">
          <a-descriptions-item label="启用状态">
            <a-tag :color="item.bridge.enabled ? 'green' : 'default'">{{ item.bridge.enabled ? '已启用' : '未启用' }}</a-tag>
          </a-descriptions-item>
          <template v-if="item.bridge.enabled">
            <a-descriptions-item label="便桥限速">{{ item.bridge.speedLimit }} km/h</a-descriptions-item>
            <a-descriptions-item label="最小宽度">{{ item.bridge.minWidth }} m</a-descriptions-item>
            <a-descriptions-item label="最大坡度">{{ item.bridge.maxSlope }}°</a-descriptions-item>
            <a-descriptions-item label="冰雪路面降速">{{ item.bridge.iceSlowdownPercent }}%</a-descriptions-item>
            <a-descriptions-item label="语音提醒">{{ item.bridge.voiceAlert ? '开启' : '关闭' }}</a-descriptions-item>
          </template>
        </a-descriptions>

        <a-divider orientation="left">转角盲区处理</a-divider>
        <a-descriptions :column="2" bordered>
          <a-descriptions-item label="启用状态">
            <a-tag :color="item.blindCorner.enabled ? 'green' : 'default'">{{ item.blindCorner.enabled ? '已启用' : '未启用' }}</a-tag>
          </a-descriptions-item>
          <template v-if="item.blindCorner.enabled">
            <a-descriptions-item label="盲区限速">{{ item.blindCorner.speedLimit }} km/h</a-descriptions-item>
            <a-descriptions-item label="语音提醒">{{ item.blindCorner.voiceAlert ? '开启' : '关闭' }}</a-descriptions-item>
            <a-descriptions-item label="语音播报内容" :span="2">{{ item.blindCorner.voiceMessage || '-' }}</a-descriptions-item>
          </template>
        </a-descriptions>
      </a-card>

      <!-- 引用情况 -->
      <a-card title="引用情况">
        <a-descriptions :column="1" bordered>
          <a-descriptions-item label="当前引用数量">{{ item.referenceCount }}</a-descriptions-item>
        </a-descriptions>
      </a-card>

      <!-- 版本记录 -->
      <a-card title="版本记录">
        <a-table :data-source="versionRows" row-key="version" :pagination="false" :columns="versionColumns" />
      </a-card>
    </a-space>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getSafetyStrategies, priorityMap, type Priority } from './model'

const route = useRoute()
const router = useRouter()
const item = computed(() => getSafetyStrategies().find(x => x.id === String(route.params.id)))

const timeoutActionMap: Record<string, string> = {
  slowdown: '自动降速',
  stop: '自动停车',
  slowdown_then_stop: '先降速后停车'
}

const versionColumns = [
  { title: '版本号', dataIndex: 'version', key: 'version', width: 120 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 120 },
  { title: '更新时间', dataIndex: 'time', key: 'time', width: 180 },
  { title: '变更说明', dataIndex: 'change', key: 'change' }
]

const versionRows = computed(() => item.value
  ? [{
      version: 'V1.0',
      status: item.value.status,
      time: new Date(item.value.updatedAt).toLocaleString('zh-CN', { hour12: false }),
      change: '当前版本配置'
    }]
  : []
)

function formatTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

function goBack() {
  router.push('/implementation/safety-strategy/list')
}
</script>
