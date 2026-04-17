<template>
  <div class="robot-simulation">
    <a-page-header title="详情" sub-title="机器人设备详情" />

    <a-card style="margin-bottom: 16px" v-if="selectedRobot">
      <h3>状态信息</h3>
      <a-row :gutter="[16, 16]">
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <a-statistic title="总里程" :value="selectedRobot.totalMileage" suffix="km" />
        </a-col>
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <a-statistic title="当日行驶" :value="selectedRobot.todayMileage" suffix="km" />
        </a-col>
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <a-statistic title="当前电量" :value="selectedRobot.batteryLevel" suffix="%" />
        </a-col>
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <a-statistic title="剩余里程" :value="selectedRobot.remainingMileage" suffix="km" />
        </a-col>
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <a-statistic title="当前状态" :value="selectedRobot.status" />
        </a-col>
        <a-col :xs="24" :sm="12" :md="8" :lg="6">
          <a-statistic title="当前任务" :value="selectedRobot.currentTask || '无'" />
        </a-col>
      </a-row>
    </a-card>

    <a-card style="margin-bottom: 16px" v-if="selectedRobot">
      <h3>版本与型号信息</h3>
      <a-descriptions :column="3" bordered size="small">
        <a-descriptions-item label="硬件型号">{{ selectedRobot.versions.hardwareModel }}</a-descriptions-item>
        <a-descriptions-item label="车控型号">{{ selectedRobot.versions.vehicleControlModel }}</a-descriptions-item>
        <a-descriptions-item label="软件型号">{{ selectedRobot.versions.softwareModel }}</a-descriptions-item>
        <a-descriptions-item label="自控板型号">{{ selectedRobot.versions.controlBoardModel }}</a-descriptions-item>
        <a-descriptions-item label="挂件型号">{{ selectedRobot.versions.attachmentModel }}</a-descriptions-item>
      </a-descriptions>
    </a-card>
    
    <a-card v-if="selectedRobot">
      <h3>机器人俯视结构图</h3>
      <div class="simulation-view" ref="simulationViewRef">
        <div class="robot-model">
          <!-- SVG 俯视结构图 -->
          <svg class="robot-svg" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
            <rect x="95" y="55" width="210" height="190" rx="20" fill="#eef6ff" stroke="#1677ff" stroke-width="2.5"/>
            <rect x="155" y="70" width="90" height="42" rx="8" fill="#d6ecff" stroke="#1677ff" />
            <rect x="160" y="125" width="80" height="60" rx="8" fill="#f7fbff" stroke="#91caff" />
            <circle cx="130" cy="90" r="16" fill="#263238" />
            <circle cx="270" cy="90" r="16" fill="#263238" />
            <circle cx="130" cy="220" r="18" fill="#455a64" />
            <circle cx="270" cy="220" r="18" fill="#455a64" />
            <text x="200" y="170" text-anchor="middle" fill="#1f1f1f" font-size="12">电池舱</text>
            <text x="200" y="96" text-anchor="middle" fill="#1f1f1f" font-size="10">云台</text>
            <text x="130" y="94" text-anchor="middle" fill="#fff" font-size="9">左摄像头</text>
            <text x="270" y="94" text-anchor="middle" fill="#fff" font-size="9">右摄像头</text>
            <text x="130" y="224" text-anchor="middle" fill="#fff" font-size="9">左轮</text>
            <text x="270" y="224" text-anchor="middle" fill="#fff" font-size="9">右轮</text>
          </svg>
          
          <!-- 设备圆点 -->
          <div 
            v-for="device in selectedRobot.devices" 
            :key="device.id"
            class="device-node"
            :style="{ left: device.position.x + '%', top: device.position.y + '%' }"
            @click="showDeviceInfo(device, $event)"
          >
            <div class="device-dot" :class="[device.type, device.onlineStatus === 'offline' ? 'offline' : '']"></div>
            <div class="device-name">{{ device.name }}</div>
          </div>
          
          <!-- 设备信息浮层 -->
          <div 
            v-if="selectedDevice" 
            class="device-info-popup"
            :style="{ left: popupPosition.x + 'px', top: popupPosition.y + 'px' }"
          >
            <h4>{{ selectedDevice.name }}</h4>
            <div class="device-info-item">
              <span class="label">在线状态:</span>
              <span class="value" :class="selectedDevice.onlineStatus === 'online' ? 'status-online' : 'status-offline'">
                {{ selectedDevice.onlineStatus === 'online' ? '在线' : '离线' }}
              </span>
            </div>
            <div class="device-info-item">
              <span class="label">设备状态:</span>
              <span class="value" :class="selectedDevice.status === '正常' ? 'status-normal' : 'status-error'">
                {{ selectedDevice.status }}
              </span>
            </div>
            <div class="device-info-item">
              <span class="label">温度:</span>
              <span class="value">{{ selectedDevice.temperature }}°C</span>
            </div>
            <div class="device-info-item">
              <span class="label">负载:</span>
              <span class="value">{{ selectedDevice.load }}%</span>
            </div>
            <div class="device-info-item">
              <span class="label">健康度:</span>
              <span class="value">{{ selectedDevice.health }}%</span>
            </div>
          </div>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onBeforeUnmount, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const simulationViewRef = ref<HTMLElement>()
const selectedDevice = ref<any>(null)
const popupPosition = ref({ x: 0, y: 0 })

const robots = ref<any[]>([])
const handleDocumentClick = (event: MouseEvent) => {
  if (simulationViewRef.value && !simulationViewRef.value.contains(event.target as Node)) {
    selectedDevice.value = null
  }
}

const currentRobotId = computed(() => (route.query.robotId as string) || robots.value[0]?.id || '')

const selectedRobot = computed(() => {
  return robots.value.find((robot) => robot.id === currentRobotId.value) || null
})

function showDeviceInfo(device: any, event: MouseEvent) {
  selectedDevice.value = device
  
  if (event && simulationViewRef.value) {
    const rect = simulationViewRef.value.getBoundingClientRect()
    popupPosition.value = {
      x: (event.clientX - rect.left) + 10,
      y: (event.clientY - rect.top) + 10
    }
  }
}

// 模拟数据
const mockRobots = [
  {
    id: 'robot-001',
    name: '巡检机器人 A',
    totalMileage: 125.5,
    todayMileage: 5.2,
    batteryLevel: 85,
    remainingMileage: 45.0,
    status: '正常',
    currentTask: '巡检任务 #123',
    versions: {
      hardwareModel: 'PATROL-X1',
      vehicleControlModel: 'VCU-2.3',
      softwareModel: 'SW-3.12.8',
      controlBoardModel: 'MCB-1.8',
      attachmentModel: 'KIT-IND-01'
    },
    devices: [
      {
        id: 'dev-1',
        name: '云台相机',
        type: 'ptz-camera',
        position: { x: 50, y: 15 },
        onlineStatus: 'online',
        status: '正常',
        temperature: 32,
        load: 45,
        health: 95
      },
      {
        id: 'dev-2',
        name: '热成像仪',
        type: 'thermal',
        position: { x: 65, y: 15 },
        onlineStatus: 'online',
        status: '正常',
        temperature: 38,
        load: 60,
        health: 92
      },
      {
        id: 'dev-3',
        name: '激光雷达',
        type: 'lidar',
        position: { x: 50, y: 30 },
        onlineStatus: 'online',
        status: '正常',
        temperature: 28,
        load: 35,
        health: 98
      },
      {
        id: 'dev-4',
        name: '超声传感器',
        type: 'ultrasonic',
        position: { x: 30, y: 30 },
        onlineStatus: 'online',
        status: '正常',
        temperature: 25,
        load: 20,
        health: 99
      },
      {
        id: 'dev-5',
        name: '左驱动轮',
        type: 'wheel',
        position: { x: 25, y: 70 },
        onlineStatus: 'online',
        status: '正常',
        temperature: 40,
        load: 55,
        health: 90
      },
      {
        id: 'dev-6',
        name: '右驱动轮',
        type: 'wheel',
        position: { x: 75, y: 70 },
        onlineStatus: 'online',
        status: '正常',
        temperature: 42,
        load: 58,
        health: 88
      },
      {
        id: 'dev-7',
        name: '电池组',
        type: 'battery',
        position: { x: 50, y: 55 },
        onlineStatus: 'online',
        status: '正常',
        temperature: 35,
        load: 85,
        health: 85
      },
      {
        id: 'dev-8',
        name: '边缘计算盒',
        type: 'edge-computer',
        position: { x: 50, y: 40 },
        onlineStatus: 'online',
        status: '正常',
        temperature: 45,
        load: 70,
        health: 93
      },
      {
        id: 'dev-9',
        name: '通信模块',
        type: 'communication',
        position: { x: 70, y: 40 },
        onlineStatus: 'online',
        status: '正常',
        temperature: 30,
        load: 25,
        health: 97
      },
      {
        id: 'dev-10',
        name: '右超声传感器',
        type: 'ultrasonic',
        position: { x: 70, y: 30 },
        onlineStatus: 'offline',
        status: '异常',
        temperature: 0,
        load: 0,
        health: 0
      }
    ]
  },
  {
    id: 'robot-002',
    name: '巡检机器人 B',
    totalMileage: 89.2,
    todayMileage: 3.1,
    batteryLevel: 60,
    remainingMileage: 28.5,
    status: '正常',
    currentTask: '巡检任务 #456',
    versions: {
      hardwareModel: 'PATROL-X2',
      vehicleControlModel: 'VCU-3.1',
      softwareModel: 'SW-3.14.2',
      controlBoardModel: 'MCB-2.1',
      attachmentModel: 'KIT-IND-02'
    },
    devices: [
      {
        id: 'dev-11',
        name: '云台相机',
        type: 'ptz-camera',
        position: { x: 50, y: 15 },
        onlineStatus: 'online',
        status: '正常',
        temperature: 34,
        load: 50,
        health: 94
      },
      {
        id: 'dev-12',
        name: '热成像仪',
        type: 'thermal',
        position: { x: 65, y: 15 },
        onlineStatus: 'online',
        status: '正常',
        temperature: 36,
        load: 55,
        health: 91
      },
      {
        id: 'dev-13',
        name: '激光雷达',
        type: 'lidar',
        position: { x: 50, y: 30 },
        onlineStatus: 'online',
        status: '正常',
        temperature: 29,
        load: 40,
        health: 97
      },
      {
        id: 'dev-14',
        name: '超声传感器',
        type: 'ultrasonic',
        position: { x: 30, y: 30 },
        onlineStatus: 'online',
        status: '正常',
        temperature: 24,
        load: 18,
        health: 98
      },
      {
        id: 'dev-15',
        name: '左驱动轮',
        type: 'wheel',
        position: { x: 25, y: 70 },
        onlineStatus: 'online',
        status: '异常',
        temperature: 55,
        load: 80,
        health: 70
      },
      {
        id: 'dev-16',
        name: '右驱动轮',
        type: 'wheel',
        position: { x: 75, y: 70 },
        onlineStatus: 'online',
        status: '正常',
        temperature: 41,
        load: 52,
        health: 89
      },
      {
        id: 'dev-17',
        name: '电池组',
        type: 'battery',
        position: { x: 50, y: 55 },
        onlineStatus: 'online',
        status: '正常',
        temperature: 33,
        load: 60,
        health: 87
      },
      {
        id: 'dev-18',
        name: '边缘计算盒',
        type: 'edge-computer',
        position: { x: 50, y: 40 },
        onlineStatus: 'online',
        status: '正常',
        temperature: 44,
        load: 65,
        health: 92
      },
      {
        id: 'dev-19',
        name: '通信模块',
        type: 'communication',
        position: { x: 70, y: 40 },
        onlineStatus: 'online',
        status: '正常',
        temperature: 31,
        load: 28,
        health: 96
      }
    ]
  }
]

onMounted(() => {
  robots.value = mockRobots
  document.addEventListener('click', handleDocumentClick)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
})
</script>

<style scoped lang="css">.robot-simulation .simulation-view {
  position: relative;
  width: 100%;
  height: 400px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
  background-color: #fafafa;
}
.robot-simulation .simulation-view .robot-model {
  position: relative;
  width: 100%;
  height: 100%;
}
.robot-simulation .simulation-view .robot-model .robot-svg {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: 100%;
}
.robot-simulation .simulation-view .robot-model .device-node {
  position: absolute;
  cursor: pointer;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.robot-simulation .simulation-view .robot-model .device-node .device-dot {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid white;
  box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
}
.robot-simulation .simulation-view .robot-model .device-node .device-dot.ptz-camera {
  background-color: #52c41a;
}
.robot-simulation .simulation-view .robot-model .device-node .device-dot.thermal {
  background-color: #fa8c16;
}
.robot-simulation .simulation-view .robot-model .device-node .device-dot.lidar {
  background-color: #1890ff;
}
.robot-simulation .simulation-view .robot-model .device-node .device-dot.ultrasonic {
  background-color: #722ed1;
}
.robot-simulation .simulation-view .robot-model .device-node .device-dot.wheel {
  background-color: #13c2c2;
}
.robot-simulation .simulation-view .robot-model .device-node .device-dot.battery {
  background-color: #faad14;
}
.robot-simulation .simulation-view .robot-model .device-node .device-dot.edge-computer {
  background-color: #eb2f96;
}
.robot-simulation .simulation-view .robot-model .device-node .device-dot.communication {
  background-color: #2f54eb;
}
.robot-simulation .simulation-view .robot-model .device-node .device-dot.offline {
  background-color: #d9d9d9;
  border-color: #bfbfbf;
}
.robot-simulation .simulation-view .robot-model .device-node .device-name {
  margin-top: 4px;
  padding: 1px 6px;
  border-radius: 10px;
  font-size: 11px;
  line-height: 16px;
  color: #fff;
  white-space: nowrap;
  background: rgba(0, 0, 0, 0.5);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.35);
  pointer-events: none;
}
.robot-simulation .simulation-view .robot-model .device-info-popup {
  position: absolute;
  background-color: white;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
  min-width: 200px;
}
.robot-simulation .simulation-view .robot-model .device-info-popup h4 {
  margin: 0 0 8px 0;
  color: #333;
}
.robot-simulation .simulation-view .robot-model .device-info-popup .device-info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
}
.robot-simulation .simulation-view .robot-model .device-info-popup .device-info-item .label {
  color: #666;
}
.robot-simulation .simulation-view .robot-model .device-info-popup .device-info-item .value {
  color: #333;
  font-weight: 500;
}
.robot-simulation .simulation-view .robot-model .device-info-popup .device-info-item .value.status-online {
  color: #52c41a;
}
.robot-simulation .simulation-view .robot-model .device-info-popup .device-info-item .value.status-offline {
  color: #d9d9d9;
}
.robot-simulation .simulation-view .robot-model .device-info-popup .device-info-item .value.status-normal {
  color: #52c41a;
}
.robot-simulation .simulation-view .robot-model .device-info-popup .device-info-item .value.status-error {
  color: #ff4d4f;
}
</style>
