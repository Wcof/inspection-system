<template>
  <div class="robot-simulation">
    <a-page-header title="机器人仿真" />
    
    <a-card style="margin-bottom: 16px">
      <h3>机器人选择</h3>
      <a-select v-model:value="selectedRobotId" placeholder="请选择机器人" style="width: 300px">
        <a-select-option v-for="robot in robots" :key="robot.id" :value="robot.id">
          {{ robot.name }}
        </a-select-option>
      </a-select>
    </a-card>
    
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
    
    <a-card v-if="selectedRobot">
      <h3>机型仿真视图</h3>
      <div class="simulation-view" ref="simulationViewRef">
        <div class="robot-model">
          <!-- SVG 巡检机器人图片展示层 -->
          <svg class="robot-svg" viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
            <!-- 机器人主体 -->
            <rect x="100" y="100" width="200" height="120" rx="10" fill="#e6f7ff" stroke="#1890ff" stroke-width="3"/>
            <!-- 顶部云台 -->
            <rect x="150" y="70" width="100" height="40" rx="5" fill="#bae7ff" stroke="#1890ff" stroke-width="2"/>
            <!-- 左侧驱动轮 -->
            <circle cx="120" cy="230" r="25" fill="#333" stroke="#666" stroke-width="3"/>
            <circle cx="120" cy="230" r="10" fill="#666"/>
            <!-- 右侧驱动轮 -->
            <circle cx="280" cy="230" r="25" fill="#333" stroke="#666" stroke-width="3"/>
            <circle cx="280" cy="230" r="10" fill="#666"/>
            <!-- 标签 -->
            <text x="200" y="165" text-anchor="middle" fill="#333" font-size="14" font-weight="bold">巡检机器人</text>
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
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const selectedRobotId = ref<string>('')
const simulationViewRef = ref<HTMLElement>()
const selectedDevice = ref<any>(null)
const popupPosition = ref({ x: 0, y: 0 })

const robots = ref<any[]>([])

const selectedRobot = computed(() => {
  return robots.value.find(robot => robot.id === selectedRobotId.value)
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
    id: 'robot-1',
    name: '巡检机器人 A',
    totalMileage: 125.5,
    todayMileage: 5.2,
    batteryLevel: 85,
    remainingMileage: 45.0,
    status: '正常',
    currentTask: '巡检任务 #123',
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
    id: 'robot-2',
    name: '巡检机器人 B',
    totalMileage: 89.2,
    todayMileage: 3.1,
    batteryLevel: 60,
    remainingMileage: 28.5,
    status: '正常',
    currentTask: '巡检任务 #456',
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
  // 使用模拟数据
  robots.value = mockRobots
  
  // 读取 route.query.robotId 并设置默认选中的机器人
  const queryRobotId = route.query.robotId as string
  if (queryRobotId) {
    const robotExists = robots.value.some(robot => robot.id === queryRobotId)
    if (robotExists) {
      selectedRobotId.value = queryRobotId
    } else if (robots.value.length > 0) {
      selectedRobotId.value = robots.value[0].id
    }
  } else if (robots.value.length > 0) {
    selectedRobotId.value = robots.value[0].id
  }
  
  // 点击空白处关闭设备信息浮层
  document.addEventListener('click', (event) => {
    if (simulationViewRef.value && !simulationViewRef.value.contains(event.target as Node)) {
      selectedDevice.value = null
    }
  })
})
</script>

<style scoped lang="scss">
.robot-simulation {
  .simulation-view {
    position: relative;
    width: 100%;
    height: 400px;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    overflow: hidden;
    background-color: #fafafa;
    
    .robot-model {
      position: relative;
      width: 100%;
      height: 100%;
      
      .robot-svg {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: 100%;
      }
      
      .device-node {
        position: absolute;
        cursor: pointer;
        
        .device-dot {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 4px rgba(0, 0, 0, 0.3);
          
          &.ptz-camera {
            background-color: #52c41a;
          }
          
          &.thermal {
            background-color: #fa8c16;
          }
          
          &.lidar {
            background-color: #1890ff;
          }
          
          &.ultrasonic {
            background-color: #722ed1;
          }
          
          &.wheel {
            background-color: #13c2c2;
          }
          
          &.battery {
            background-color: #faad14;
          }
          
          &.edge-computer {
            background-color: #eb2f96;
          }
          
          &.communication {
            background-color: #2f54eb;
          }
          
          &.offline {
            background-color: #d9d9d9;
            border-color: #bfbfbf;
          }
        }
      }
      
      .device-info-popup {
        position: absolute;
        background-color: white;
        border: 1px solid #d9d9d9;
        border-radius: 6px;
        padding: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
        z-index: 10;
        min-width: 200px;
        
        h4 {
          margin: 0 0 8px 0;
          color: #333;
        }
        
        .device-info-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 4px;
          
          .label {
            color: #666;
          }
          
          .value {
            color: #333;
            font-weight: 500;
            
            &.status-online {
              color: #52c41a;
            }
            
            &.status-offline {
              color: #d9d9d9;
            }
            
            &.status-normal {
              color: #52c41a;
            }
            
            &.status-error {
              color: #ff4d4f;
            }
          }
        }
      }
    }
  }
}
</style>