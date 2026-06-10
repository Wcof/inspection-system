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
      <h3>机器人信息</h3>
      <a-tabs v-model:activeKey="infoTab" type="card">
        <!-- 硬件信息 -->
        <a-tab-pane key="hardware" tab="硬件信息">
          <a-descriptions :column="3" bordered size="small">
            <a-descriptions-item label="硬件型号">{{ selectedRobot.versions.hardwareModel }}</a-descriptions-item>
            <a-descriptions-item label="车控型号">{{ selectedRobot.versions.vehicleControlModel }}</a-descriptions-item>
            <a-descriptions-item label="自控板型号">{{ selectedRobot.versions.controlBoardModel }}</a-descriptions-item>
            <a-descriptions-item label="底盘类型">全驱防爆底盘</a-descriptions-item>
            <a-descriptions-item label="驱动方式">四轮独立驱动</a-descriptions-item>
            <a-descriptions-item label="最大负载">100 kg</a-descriptions-item>
            <a-descriptions-item label="最大速度">1.5 m/s</a-descriptions-item>
            <a-descriptions-item label="爬坡能力">≤15°</a-descriptions-item>
            <a-descriptions-item label="越障高度">≤50 mm</a-descriptions-item>
            <a-descriptions-item label="防护等级">IP67</a-descriptions-item>
            <a-descriptions-item label="防爆等级">Ex d IIC T4 Gb</a-descriptions-item>
            <a-descriptions-item label="整机重量">≈85 kg</a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>

        <!-- 软件与版本 -->
        <a-tab-pane key="software" tab="软件与版本">
          <a-descriptions :column="3" bordered size="small">
            <a-descriptions-item label="软件型号">{{ selectedRobot.versions.softwareModel }}</a-descriptions-item>
            <a-descriptions-item label="系统内核">RobotOS v2.4</a-descriptions-item>
            <a-descriptions-item label="导航算法">SLAM + 多传感器融合</a-descriptions-item>
            <a-descriptions-item label="路径规划">A* + 动态避障</a-descriptions-item>
            <a-descriptions-item label="最近固件更新">2026-05-20</a-descriptions-item>
            <a-descriptions-item label="最近软件更新">2026-06-01</a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>

        <!-- 通讯信息 -->
        <a-tab-pane key="communication" tab="通讯信息">
          <a-descriptions :column="3" bordered size="small">
            <a-descriptions-item label="主通信方式">5G 工业网关</a-descriptions-item>
            <a-descriptions-item label="通信模块型号">EDGE-5G-01</a-descriptions-item>
            <a-descriptions-item label="通信协议">MQTT / ROS Bridge</a-descriptions-item>
            <a-descriptions-item label="备用通信">4G LTE</a-descriptions-item>
            <a-descriptions-item label="Wi-Fi">802.11ac (2.4G/5G)</a-descriptions-item>
            <a-descriptions-item label="心跳间隔">5000 ms</a-descriptions-item>
            <a-descriptions-item label="重连间隔">3000 ms</a-descriptions-item>
            <a-descriptions-item label="超时时间">10000 ms</a-descriptions-item>
            <a-descriptions-item label="最大重连次数">5 次</a-descriptions-item>
          </a-descriptions>
        </a-tab-pane>

        <!-- 悬挂配件 -->
        <a-tab-pane key="accessories" tab="悬挂配件">
          <a-tabs v-model:activeKey="accessoryTab" type="card" size="small">
            <!-- 光学（云台） -->
            <a-tab-pane key="gimbal" tab="光学（云台）">
              <a-descriptions :column="3" bordered size="small">
                <a-descriptions-item label="设备名称">双轴高精度防爆云台</a-descriptions-item>
                <a-descriptions-item label="型号">GIMBAL-2AXIS-01</a-descriptions-item>
                <a-descriptions-item label="厂商">精密工业驱动</a-descriptions-item>
                <a-descriptions-item label="状态"><a-tag color="green">正常</a-tag></a-descriptions-item>
                <a-descriptions-item label="分辨率">200万像素 (1080P)</a-descriptions-item>
                <a-descriptions-item label="光学变焦">30倍</a-descriptions-item>
                <a-descriptions-item label="旋转范围">水平360° / 垂直-15°~90°</a-descriptions-item>
                <a-descriptions-item label="旋转速度">水平60°/s / 垂直40°/s</a-descriptions-item>
                <a-descriptions-item label="工作温度">-20°C ~ +60°C</a-descriptions-item>
              </a-descriptions>
            </a-tab-pane>

            <!-- 光学（双目） -->
            <a-tab-pane key="binocular" tab="光学（双目）">
              <a-descriptions :column="3" bordered size="small">
                <a-descriptions-item label="设备名称">双目红外可见光一体相机</a-descriptions-item>
                <a-descriptions-item label="型号">BI-CAM-01</a-descriptions-item>
                <a-descriptions-item label="厂商">航天视觉</a-descriptions-item>
                <a-descriptions-item label="状态"><a-tag color="green">正常</a-tag></a-descriptions-item>
                <a-descriptions-item label="可见光分辨率">400万像素 (2K)</a-descriptions-item>
                <a-descriptions-item label="红外分辨率">640×512</a-descriptions-item>
                <a-descriptions-item label="视场角">H: 90° / V: 65°</a-descriptions-item>
                <a-descriptions-item label="深度感知">0.5m ~ 20m</a-descriptions-item>
                <a-descriptions-item label="帧率">30 fps</a-descriptions-item>
              </a-descriptions>
            </a-tab-pane>

            <!-- 热成像 -->
            <a-tab-pane key="thermal" tab="热成像">
              <a-descriptions :column="3" bordered size="small">
                <a-descriptions-item label="设备名称">高精度热成像仪</a-descriptions-item>
                <a-descriptions-item label="型号">THERMAL-01</a-descriptions-item>
                <a-descriptions-item label="厂商">高德红外</a-descriptions-item>
                <a-descriptions-item label="状态"><a-tag color="green">正常</a-tag></a-descriptions-item>
                <a-descriptions-item label="探测器类型">非制冷氧化钒</a-descriptions-item>
                <a-descriptions-item label="分辨率">640×512</a-descriptions-item>
                <a-descriptions-item label="测温范围">-20°C ~ +150°C</a-descriptions-item>
                <a-descriptions-item label="测温精度">±2°C</a-descriptions-item>
                <a-descriptions-item label="帧频">30 Hz</a-descriptions-item>
              </a-descriptions>
            </a-tab-pane>

            <!-- 气体检测 -->
            <a-tab-pane key="gas" tab="气体检测">
              <a-descriptions :column="3" bordered size="small">
                <a-descriptions-item label="设备名称">多组合气体检测仪</a-descriptions-item>
                <a-descriptions-item label="型号">GAS-DET-01</a-descriptions-item>
                <a-descriptions-item label="厂商">环境感知安防</a-descriptions-item>
                <a-descriptions-item label="状态"><a-tag color="green">正常</a-tag></a-descriptions-item>
                <a-descriptions-item label="检测气体">CH₄ / H₂S / CO / O₂ / VOC</a-descriptions-item>
                <a-descriptions-item label="CH₄量程">0~100% LEL</a-descriptions-item>
                <a-descriptions-item label="H₂S量程">0~100 ppm</a-descriptions-item>
                <a-descriptions-item label="CO量程">0~1000 ppm</a-descriptions-item>
                <a-descriptions-item label="响应时间">≤30 s</a-descriptions-item>
              </a-descriptions>
            </a-tab-pane>

            <!-- 激光雷达 -->
            <a-tab-pane key="lidar" tab="激光雷达">
              <a-descriptions :column="3" bordered size="small">
                <a-descriptions-item label="设备名称">32线激光雷达</a-descriptions-item>
                <a-descriptions-item label="型号">LIDAR-32CH</a-descriptions-item>
                <a-descriptions-item label="厂商">镭神智能</a-descriptions-item>
                <a-descriptions-item label="状态"><a-tag color="green">正常</a-tag></a-descriptions-item>
                <a-descriptions-item label="线数">32线</a-descriptions-item>
                <a-descriptions-item label="测距范围">0.3m ~ 200m</a-descriptions-item>
                <a-descriptions-item label="水平视场角">360°</a-descriptions-item>
                <a-descriptions-item label="垂直视场角">-15° ~ +15°</a-descriptions-item>
                <a-descriptions-item label="点云速率">640,000 pts/s</a-descriptions-item>
              </a-descriptions>
            </a-tab-pane>

            <!-- 电源系统 -->
            <a-tab-pane key="power" tab="电源系统">
              <a-descriptions :column="3" bordered size="small">
                <a-descriptions-item label="设备名称">钛酸锂高密度电池</a-descriptions-item>
                <a-descriptions-item label="型号">BATTERY-LTO-01</a-descriptions-item>
                <a-descriptions-item label="厂商">拓扑能源</a-descriptions-item>
                <a-descriptions-item label="状态">
                  <a-tag :color="(selectedRobot.batteryLevel || 0) < 20 ? 'orange' : 'green'">
                    {{ (selectedRobot.batteryLevel || 0) < 20 ? '低电量' : '正常' }}
                  </a-tag>
                </a-descriptions-item>
                <a-descriptions-item label="电池类型">钛酸锂 (LTO)</a-descriptions-item>
                <a-descriptions-item label="额定容量">2.4 kWh</a-descriptions-item>
                <a-descriptions-item label="额定电压">48V</a-descriptions-item>
                <a-descriptions-item label="充电时长">≤2 h (快充)</a-descriptions-item>
                <a-descriptions-item label="循环寿命">≥10,000 次</a-descriptions-item>
              </a-descriptions>
            </a-tab-pane>
          </a-tabs>
        </a-tab-pane>
      </a-tabs>
    </a-card>
    
    <a-card v-if="selectedRobot">
      <h3>机器人俯视结构图</h3>
      <div class="simulation-view" ref="simulationViewRef">
        <div class="robot-model">
          <!-- 俯视结构图 -->
          <img class="robot-topview-img" src="@/bot.jpg" alt="机器人俯视结构图" />
          
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
const infoTab = ref('hardware')
const accessoryTab = ref('gimbal')

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
.robot-simulation .simulation-view .robot-model .robot-topview-img {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
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
