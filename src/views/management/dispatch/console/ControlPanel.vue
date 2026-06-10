<template>
  <div class="control-panel" tabindex="0" ref="panelRef">
    <!-- 主画面背景（single / pip / main-bottom 共用） -->
    <div class="main-view" v-show="viewLayout !== 'triple'">
      <img :src="mainViewSrc" alt="主视角" class="main-view-img" :style="{ transform: 'scale(1.15) translate(' + panX + 'px, ' + panY + 'px)' }" style="transition: transform 0.05s linear;" />
      <div class="hud-scanlines"></div>
      <div class="hud-corners"></div>
    </div>

    <!-- 三等分模式 -->
    <div v-if="viewLayout === 'triple'" class="triple-view">
      <div class="triple-view-panel">
        <img :src="mainViewImg" class="triple-view-img" />
        <div class="triple-view-label">双目</div>
        <div class="hud-scanlines"></div>
      </div>
      <div class="triple-view-panel">
        <img :src="visibleLightImg" class="triple-view-img" />
        <div class="triple-view-label">可见光</div>
        <div class="hud-scanlines"></div>
      </div>
      <div class="triple-view-panel">
        <img :src="thermalImg" class="triple-view-img" />
        <div class="triple-view-label">热成像</div>
        <div class="hud-scanlines"></div>
      </div>
    </div>

    <!-- 主+双下模式：底部两个小画面 -->
    <div v-if="viewLayout === 'main-bottom'" class="bottom-cameras">
      <div class="bottom-cam-panel" v-for="item in bottomCamItems" :key="item.key">
        <img :src="item.img" class="bottom-cam-img" />
        <div class="bottom-cam-label">{{ item.label }}</div>
        <div class="hud-scanlines"></div>
      </div>
    </div>

    <!-- 主+双右模式：右侧两个小画面 -->
    <div v-if="viewLayout === 'main-right'" class="right-cameras">
      <div class="right-cam-panel" v-for="item in bottomCamItems" :key="item.key">
        <img :src="item.img" class="right-cam-img" />
        <div class="right-cam-label">{{ item.label }}</div>
        <div class="hud-scanlines"></div>
      </div>
    </div>

    <!-- 机器人切换页面 -->
    <div v-if="showRobotSwitch" class="robot-switch-overlay" @click="showRobotSwitch = false">
      <div class="robot-switch-container">
        <img :src="robotSwitchImage" alt="切换机器人" class="robot-switch-image" @click="showRobotSwitch = false" />
        <button class="robot-switch-close" @click.stop="showRobotSwitch = false">✕</button>
        <div class="robot-switch-hint">点击任意位置返回控制台</div>
      </div>
    </div>

    <!-- 顶部控制栏 -->
    <div class="top-bar-hud">
      <div class="top-left">
        <div class="console-select-wrapper">
          <span class="select-label">当前机器人:</span>
          <span class="robot-name">{{ currentRobotName }}</span>
          <button class="switch-robot-btn" @click="showRobotSwitch = true">切换</button>
        </div>
      </div>
      <div class="top-center">
        <div class="console-tabs">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            class="console-tab"
            :class="{ active: activeTab === tab.key }"
            @click="switchTab(tab.key)"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
      <div class="top-right">
        <template v-if="taskStatus === 'running'">
          <button class="hud-btn action-btn pause" @click="pauseTask">
            <span class="hud-btn-glow"></span>
            <span class="hud-btn-text">暂停</span>
          </button>
          <button class="hud-btn action-btn danger stop" @click="stopTask">
            <span class="hud-btn-glow"></span>
            <span class="hud-btn-text">停止</span>
          </button>
        </template>
        <template v-else-if="taskStatus === 'paused'">
          <button class="hud-btn action-btn resume" @click="resumeTask">
            <span class="hud-btn-glow"></span>
            <span class="hud-btn-text">继续</span>
          </button>
          <button class="hud-btn action-btn danger stop" @click="stopTask">
            <span class="hud-btn-glow"></span>
            <span class="hud-btn-text">停止</span>
          </button>
        </template>
      </div>
    </div>

    <!-- HUD: 左侧信息列（监控数据中心 + 当前点位） -->
    <div class="hud-left-col">
      <!-- 监控数据中心 -->
      <div class="hud hud-card hud-monitoring" v-if="!monitoringCollapsed">
        <div class="hud-card-header" @click="monitoringCollapsed = true">
          <span class="header-line"></span>
          <div class="hud-card-title">监控数据中心</div>
          <span class="collapse-arrow">◂</span>
        </div>
        <div class="hud-monitoring-body">
          <div class="hud-column">
            <div class="column-title">遥测数据 (TELEMETRY)</div>
            <div class="hud-row"><span class="hud-label">执行时间</span><span class="hud-value monospace">{{ elapsedTime }}</span></div>
            <div class="hud-row"><span class="hud-label">电量</span><span class="hud-value monospace" :class="batteryClass">{{ battery }}%</span></div>
            <div class="hud-row"><span class="hud-label">里程</span><span class="hud-value monospace">{{ mileage }} km</span></div>
            <div class="hud-row"><span class="hud-label">云台偏航/俯仰</span><span class="hud-value monospace ptz-text">{{ gimbalYaw }}° / {{ gimbalPitch }}°</span></div>
            <div class="hud-row"><span class="hud-label">位置</span><span class="hud-value location-text">{{ currentPointName }}</span></div>
          </div>
          <div class="divider-line"></div>
          <div class="hud-column">
            <div class="column-title">环境传感器 (SENSORS)</div>
            <div class="hud-row">
              <span class="hud-label">可燃气体</span>
              <span class="hud-value monospace" :class="{ warning: gasData.combustible > 0.05 }">{{ gasData.combustible }} %LEL</span>
            </div>
            <div class="hud-row">
              <span class="hud-label">氧气浓度</span>
              <span class="hud-value monospace" :class="{ warning: gasData.oxygen < 19.5 || gasData.oxygen > 23.5 }">{{ gasData.oxygen }} %VOL</span>
            </div>
            <div class="hud-row">
              <span class="hud-label">一氧化碳</span>
              <span class="hud-value monospace" :class="{ warning: gasData.co > 20 }">{{ gasData.co }} ppm</span>
            </div>
            <div class="hud-row">
              <span class="hud-label">硫化氢</span>
              <span class="hud-value monospace" :class="{ warning: gasData.h2s > 5 }">{{ gasData.h2s }} ppm</span>
            </div>
          </div>
        </div>
      </div>
      <div v-else class="hud-collapse-tag" @click="monitoringCollapsed = false">数据 ▸</div>

      <!-- 当前点位 -->
      <div class="hud hud-card hud-point-info" v-if="!pointCollapsed">
        <div class="hud-card-header" @click="pointCollapsed = true">
          <span class="header-line"></span>
          <div class="hud-card-title">当前点位</div>
          <span class="collapse-arrow">◂</span>
        </div>
        <div class="hud-point-body">
          <template v-if="currentPoint">
            <div class="hud-row"><span class="hud-label">名称</span><span class="hud-value name-highlight">{{ currentPoint.name }}</span></div>
            <div class="hud-row"><span class="hud-label">装置</span><span class="hud-value">{{ getPointDeviceName(currentPoint) || '无' }}</span></div>
            <div class="hud-row"><span class="hud-label">设施</span><span class="hud-value">{{ getPointFacilityName(currentPoint) || '无' }}</span></div>
            <div class="hud-row"><span class="hud-label">对象</span><span class="hud-value">{{ getPointObjectName(currentPoint) || '无' }}</span></div>
            <div class="hud-row"><span class="hud-label">规则</span><span class="hud-value">{{ getPointRuleName(currentPoint) || '无' }}</span></div>
          </template>
          <template v-else>
            <div class="hud-row"><span class="hud-label">名称</span><span class="hud-value">无活跃连接</span></div>
          </template>
        </div>
      </div>
      <div v-else class="hud-collapse-tag" @click="pointCollapsed = false">点位 ▸</div>
    </div>

    <!-- 速度显示 (云台上方) -->
    <div class="hud hud-speed-bar">
      <div class="speed-bar-header">
        <span class="speed-bar-label">速度</span>
        <span class="speed-bar-value monospace">{{ speed }}</span>
        <span class="speed-bar-unit">m/s</span>
      </div>
      <div class="speed-bar-track">
        <div class="speed-bar-fill" :style="{ width: Math.min(speed / 3 * 100, 100) + '%' }"></div>
      </div>
    </div>

    <!-- 地图缩略图 (底部中央) -->
    <MapThumbnail />

    <!-- 摄像头小窗 (右上) -->
    <CameraViews
      :mainView="mainViewType"
      :layout="viewLayout"
      @switch-main="switchMainView"
      @update:layout="viewLayout = $event"
    />

    <!-- 操控区域 - 移动端 -->
    <ControlPad
      v-if="showControlPad && controlPadType === 'mobile'"
      @direction="handleDirection"
      @gimbal="handleGimbal"
    />

    <!-- 操控区域 - 桌面端 -->
    <DesktopControlPad
      v-if="showControlPad && controlPadType === 'desktop'"
      @direction="handleDirection"
      @gimbal="handleGimbal"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { MockService } from '@/mock/mockService'
import type { Robot } from '@/types/robot'
import type { InspectionPoint } from '@/types/inspection'
import MapThumbnail from './MapThumbnail.vue'
import CameraViews, { type LayoutMode } from './CameraViews.vue'
import ControlPad from './ControlPad.vue'
import DesktopControlPad from './DesktopControlPad.vue'

// Props
const { showControlPad = true, controlPadType = 'mobile', activeTab = 'monitor' } = defineProps<{
  showControlPad?: boolean
  controlPadType?: 'mobile' | 'desktop'
  activeTab?: 'monitor' | 'control' | 'config' | 'ipad'
}>()

// Emits
const emit = defineEmits<{
  (e: 'update:activeTab', tab: 'monitor' | 'control' | 'config' | 'ipad'): void
}>()

// Tab 定义
type TabKey = 'monitor' | 'control' | 'config' | 'ipad'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'monitor', label: '监控' },
  { key: 'control', label: '操控' },
  { key: 'config', label: '配置' },
  { key: 'ipad', label: 'IPAD' },
]

function switchTab(tab: TabKey) {
  emit('update:activeTab', tab)
}

// 图片资源
import mainViewImg from '@/双目.png'
import visibleLightImg from '@/巡检光学.png'
import thermalImg from '@/巡检热成.png'
import robotSwitchImage from '@/切换机器人.png'

// 机器人切换页面状态
const showRobotSwitch = ref(false)

// 机器人列表
const robots = ref<Robot[]>(MockService.getRobots())
const selectedRobotId = ref<string>('')

// 当前机器人名称
const currentRobotName = computed(() => {
  const robot = robots.value.find(r => r.id === selectedRobotId.value)
  return robot ? robot.name : '未选择'
})

// 折叠状态
const monitoringCollapsed = ref(false)
const pointCollapsed = ref(false)

// 任务状态
const taskStatus = ref<'idle' | 'running' | 'paused'>('idle')

// 主视角类型
const mainViewType = ref<'binocular' | 'visible' | 'thermal'>('binocular')

// 画面布局模式
const viewLayout = ref<LayoutMode>('pip')

// 主+双下模式：底部两个非主视角的摄像头
const ALL_CAMS = [
  { key: 'binocular' as const, label: '双目', img: mainViewImg },
  { key: 'visible' as const, label: '可见光', img: visibleLightImg },
  { key: 'thermal' as const, label: '热成像', img: thermalImg },
]
const bottomCamItems = computed(() => ALL_CAMS.filter(c => c.key !== mainViewType.value))



// 云台模拟状态
const gimbalPitch = ref(0)
const gimbalYaw = ref(0)
const panX = ref(0)
const panY = ref(0)
const gimbalActiveDir = ref('stop')

let gimbalLoop: ReturnType<typeof setInterval> | null = null

function startGimbalLoop() {
  if (gimbalLoop) return
  gimbalLoop = setInterval(() => {
    if (gimbalActiveDir.value === 'stop') return
    const step = 1
    if (gimbalActiveDir.value === 'up') {
      gimbalPitch.value = Math.min(90, gimbalPitch.value + step)
      panY.value = Math.min(30, panY.value + step)
    } else if (gimbalActiveDir.value === 'down') {
      gimbalPitch.value = Math.max(-90, gimbalPitch.value - step)
      panY.value = Math.max(-30, panY.value - step)
    } else if (gimbalActiveDir.value === 'left') {
      gimbalYaw.value = (gimbalYaw.value - step + 180) % 360 - 180
      panX.value = Math.min(30, panX.value + step)
    } else if (gimbalActiveDir.value === 'right') {
      gimbalYaw.value = (gimbalYaw.value + step + 180) % 360 - 180
      panX.value = Math.max(-30, panX.value - step)
    } else if (gimbalActiveDir.value === 'center') {
      gimbalPitch.value = 0
      gimbalYaw.value = 0
      panX.value = 0
      panY.value = 0
    }
  }, 30)
}

function stopGimbalLoop() {
  if (gimbalLoop) {
    clearInterval(gimbalLoop)
    gimbalLoop = null
  }
}

function handleGimbal(dir: string) {
  gimbalActiveDir.value = dir
  if (dir !== 'stop') {
    startGimbalLoop()
  } else {
    stopGimbalLoop()
  }
}

// 面板引用
const panelRef = ref<HTMLElement>()

// HUD 数据
const elapsedTimeSec = ref(0)
const battery = ref(100)
const mileage = ref(0)
const speed = ref(0)
const currentPointName = ref('无')

// 检测数据
const gasData = ref({
  combustible: 0.02,
  oxygen: 20.9,
  co: 5,
  h2s: 1
})

// 巡检点位
const inspectionPoints = ref<InspectionPoint[]>(MockService.getInspectionPoints())
const currentPoint = ref<InspectionPoint | null>(null)

// 点位信息辅助函数
function getPointDeviceName(point: InspectionPoint) {
  return MockService.getInspectionDevices()
    .filter(d => d.inspectionPointId === point.id)
    .map(d => d.name)
    .join('、')
}
function getPointFacilityName(point: InspectionPoint) {
  return (point.coverageObjects || [])
    .filter(o => o.type === 'asset' || o.type === 'component')
    .map(o => o.name)
    .join('、')
}
function getPointObjectName(point: InspectionPoint) {
  return (point.coverageObjects || [])
    .filter(o => o.type === 'component' || o.type === 'connection')
    .map(o => o.name)
    .join('、')
}
function getPointRuleName(point: InspectionPoint) {
  return (point.detectionConfigs || [])
    .filter(c => c.enabled)
    .map(c => c.subjectName)
    .join('、')
}

// 计时器
let elapsedTimer: ReturnType<typeof setInterval> | null = null
let gasTimer: ReturnType<typeof setInterval> | null = null

// 计算属性
const mainViewSrc = computed(() => {
  switch (mainViewType.value) {
    case 'visible': return visibleLightImg
    case 'thermal': return thermalImg
    default: return mainViewImg
  }
})

const elapsedTime = computed(() => {
  const h = Math.floor(elapsedTimeSec.value / 3600)
  const m = Math.floor((elapsedTimeSec.value % 3600) / 60)
  const s = elapsedTimeSec.value % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
})

const batteryClass = computed(() => {
  if (battery.value <= 20) return 'text-danger glow-red'
  if (battery.value <= 50) return 'text-warning glow-yellow'
  return 'text-normal glow-green'
})

// 初始化
onMounted(() => {
  if (robots.value.length > 0) {
    selectedRobotId.value = robots.value[0].id
  }
  if (inspectionPoints.value.length > 0) {
    currentPoint.value = inspectionPoints.value[0]
    currentPointName.value = inspectionPoints.value[0].name
  }
})

onUnmounted(() => {
  stopTimers()
  stopGimbalLoop()
})

// 遥控手柄数据映射
function handleDirection(dir: string) {
  switch (dir) {
    case 'forward':
      speed.value = 1.5
      break
    case 'backward':
      speed.value = 0.5
      break
    case 'left':
    case 'right':
      break
    case 'brake':
    case 'stop':
      speed.value = 0
      break
  }
}

// 主视角切换
function switchMainView(view: 'binocular' | 'visible' | 'thermal') {
  mainViewType.value = view
}

// 任务控制
function pauseTask() {
  taskStatus.value = 'paused'
  stopTimers()
}

function resumeTask() {
  taskStatus.value = 'running'
  startTimers()
}

function stopTask() {
  taskStatus.value = 'idle'
  stopTimers()
  elapsedTimeSec.value = 0
  speed.value = 0
}

// 计时器
function startTimers() {
  stopTimers()
  elapsedTimer = setInterval(() => {
    elapsedTimeSec.value++
    // 电量下降
    if (battery.value > 0) {
      battery.value = Math.max(0, +(battery.value - 0.1).toFixed(1))
    }
    // 里程增加
    if (speed.value > 0) {
      mileage.value = +(mileage.value + speed.value * 0.001).toFixed(3)
    }
  }, 1000)

  gasTimer = setInterval(() => {
    gasData.value = {
      combustible: +(0.02 + (Math.random() - 0.5) * 0.01).toFixed(3),
      oxygen: +(20.9 + (Math.random() - 0.5) * 0.2).toFixed(1),
      co: Math.max(0, +(5 + (Math.random() - 0.5) * 2).toFixed(1)),
      h2s: Math.max(0, +(1 + (Math.random() - 0.5) * 0.5).toFixed(2))
    }
  }, 2000)
}

function stopTimers() {
  if (elapsedTimer) {
    clearInterval(elapsedTimer)
    elapsedTimer = null
  }
  if (gasTimer) {
    clearInterval(gasTimer)
    gasTimer = null
  }
}

// 模拟到达点位
watch(mileage, (val) => {
  const idx = Math.floor(val * 10) % inspectionPoints.value.length
  if (inspectionPoints.value[idx]) {
    currentPoint.value = inspectionPoints.value[idx]
    currentPointName.value = inspectionPoints.value[idx].name
  }
})
</script>

<style scoped lang="less">
.control-panel {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  outline: none;
  user-select: none;
  background-color: #04060f;
}

// 机器人切换页面
.robot-switch-overlay {
  position: absolute;
  inset: 0;
  z-index: 500;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.robot-switch-container {
  position: relative;
  max-width: 90%;
  max-height: 90%;
  cursor: default;
}

.robot-switch-image {
  max-width: 100%;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(0, 212, 255, 0.15);
  pointer-events: none;
  user-select: none;
  -webkit-user-drag: none;
}

.robot-switch-close {
  position: absolute;
  top: -12px;
  right: -12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 1px solid rgba(0, 212, 255, 0.3);
  background: rgba(10, 16, 35, 0.9);
  color: rgba(0, 212, 255, 0.8);
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 212, 255, 0.15);
    border-color: rgba(0, 212, 255, 0.6);
    color: #00d4ff;
    transform: scale(1.1);
  }
}

.robot-switch-hint {
  position: absolute;
  bottom: -30px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
}

.select-label {
  cursor: default;
}

.robot-name {
  color: rgba(0, 212, 255, 0.9);
  font-weight: 600;
  margin: 0 4px;
}

.switch-robot-btn {
  padding: 4px 12px;
  border: 1px solid rgba(0, 212, 255, 0.4);
  border-radius: 4px;
  background: rgba(0, 212, 255, 0.08);
  color: rgba(0, 212, 255, 0.9);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-left: 8px;

  &:hover {
    background: rgba(0, 212, 255, 0.15);
    border-color: rgba(0, 212, 255, 0.7);
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.2);
  }
}

.console-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(0, 212, 255, 0.1);
}

.console-tab {
  display: flex;
  align-items: center;
  padding: 6px 16px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;

  &:hover {
    color: rgba(255, 255, 255, 0.8);
    background: rgba(0, 212, 255, 0.05);
  }

  &.active {
    color: #00d4ff;
    background: rgba(0, 212, 255, 0.1);
    border-color: rgba(0, 212, 255, 0.3);
    box-shadow: 0 0 12px rgba(0, 212, 255, 0.15);
  }
}

.main-view {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;

  .main-view-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: contrast(1.05) brightness(0.95);
  }

  // 扫描线特效
  .hud-scanlines {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(
      rgba(18, 16, 16, 0) 50%, 
      rgba(0, 0, 0, 0.25) 50%
    ), linear-gradient(
      90deg,
      rgba(255, 0, 0, 0.06),
      rgba(0, 255, 0, 0.02),
      rgba(0, 0, 255, 0.06)
    );
    background-size: 100% 4px, 6px 100%;
    opacity: 0.45;
  }

  // 炫酷四角框线
  .hud-corners {
    position: absolute;
    inset: 20px;
    border: 1px solid rgba(0, 212, 255, 0.08);
    pointer-events: none;

    &::before, &::after {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      border-color: #00d4ff;
      border-style: solid;
      box-shadow: 0 0 8px rgba(0, 212, 255, 0.4);
    }
    
    // 左上/右下
    &::before {
      top: -1px;
      left: -1px;
      border-width: 2px 0 0 2px;
    }
    &::after {
      bottom: -1px;
      right: -1px;
      border-width: 0 2px 2px 0;
    }
  }
}

// 三画面分屏
.triple-view {
  position: absolute;
  top: 52px;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  display: flex;
  gap: 4px;
  background: #04060f;
  padding: 4px;

  .triple-view-panel {
    flex: 1;
    position: relative;
    overflow: hidden;
    border-radius: 4px;
    border: 1px solid rgba(0, 212, 255, 0.15);

    .triple-view-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: contrast(1.05) brightness(0.95);
      pointer-events: none;
    }

    .triple-view-label {
      position: absolute;
      top: 8px;
      left: 8px;
      background: rgba(0, 0, 0, 0.6);
      border: 1px solid rgba(0, 212, 255, 0.3);
      border-radius: 3px;
      padding: 2px 10px;
      font-size: 11px;
      font-weight: 700;
      color: #00d4ff;
      letter-spacing: 1px;
      z-index: 2;
    }

    .hud-scanlines {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: linear-gradient(
        rgba(18, 16, 16, 0) 50%,
        rgba(0, 0, 0, 0.25) 50%
      ), linear-gradient(
        90deg,
        rgba(255, 0, 0, 0.06),
        rgba(0, 255, 0, 0.02),
        rgba(0, 255, 0, 0.06)
      );
      background-size: 100% 4px, 6px 100%;
      opacity: 0.3;
    }
  }
}

// 主+双下模式：底部小画面
.bottom-cameras {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 30%;
  z-index: 2;
  display: flex;
  gap: 4px;
  background: #04060f;
  padding: 4px;
  border-top: 1px solid rgba(0, 212, 255, 0.15);

  .bottom-cam-panel {
    flex: 1;
    position: relative;
    overflow: hidden;
    border-radius: 4px;
    border: 1px solid rgba(0, 212, 255, 0.15);

    .bottom-cam-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: contrast(1.05) brightness(0.95);
      pointer-events: none;
    }

    .bottom-cam-label {
      position: absolute;
      top: 6px;
      left: 6px;
      background: rgba(0, 0, 0, 0.6);
      border: 1px solid rgba(0, 212, 255, 0.3);
      border-radius: 3px;
      padding: 1px 8px;
      font-size: 10px;
      font-weight: 700;
      color: #00d4ff;
      letter-spacing: 1px;
      z-index: 2;
    }

    .hud-scanlines {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: linear-gradient(
        rgba(18, 16, 16, 0) 50%,
        rgba(0, 0, 0, 0.25) 50%
      ), linear-gradient(
        90deg,
        rgba(255, 0, 0, 0.06),
        rgba(0, 255, 0, 0.02),
        rgba(0, 255, 0, 0.06)
      );
      background-size: 100% 4px, 6px 100%;
      opacity: 0.3;
    }
  }
}

// 主+双右模式：右侧小画面
.right-cameras {
  position: absolute;
  top: 52px;
  bottom: 0;
  right: 0;
  width: 30%;
  z-index: 2;
  display: flex;
  flex-direction: column;
  gap: 4px;
  background: #04060f;
  padding: 4px;
  border-left: 1px solid rgba(0, 212, 255, 0.15);

  .right-cam-panel {
    flex: 1;
    position: relative;
    overflow: hidden;
    border-radius: 4px;
    border: 1px solid rgba(0, 212, 255, 0.15);

    .right-cam-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: contrast(1.05) brightness(0.95);
      pointer-events: none;
    }

    .right-cam-label {
      position: absolute;
      top: 6px;
      left: 6px;
      background: rgba(0, 0, 0, 0.6);
      border: 1px solid rgba(0, 212, 255, 0.3);
      border-radius: 3px;
      padding: 1px 8px;
      font-size: 10px;
      font-weight: 700;
      color: #00d4ff;
      letter-spacing: 1px;
      z-index: 2;
    }

    .hud-scanlines {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background: linear-gradient(
        rgba(18, 16, 16, 0) 50%,
        rgba(0, 0, 0, 0.25) 50%
      ), linear-gradient(
        90deg,
        rgba(255, 0, 0, 0.06),
        rgba(0, 255, 0, 0.02),
        rgba(0, 255, 0, 0.06)
      );
      background-size: 100% 4px, 6px 100%;
      opacity: 0.3;
    }
  }
}

// 顶部玻璃态HUD控制条
.top-bar-hud {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  z-index: 10;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 24px;
  background: linear-gradient(180deg, rgba(5, 10, 25, 0.95) 0%, rgba(5, 10, 25, 0.5) 70%, transparent 100%);
  backdrop-filter: blur(4px);
  border-bottom: 1px solid rgba(0, 212, 255, 0.1);

  .top-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }
}

.console-select-wrapper {
  display: flex;
  align-items: center;
  background: rgba(0, 20, 45, 0.6);
  border: 1px solid rgba(0, 212, 255, 0.25);
  border-radius: 4px;
  padding: 2px 10px;
  box-shadow: 0 0 8px rgba(0, 212, 255, 0.05);

  .select-label {
    font-size: 11px;
    color: #00d4ff;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin-right: 8px;
    text-shadow: 0 0 6px rgba(0, 212, 255, 0.4);
  }

  .robot-select-hud {
    width: 140px;
    color: #fff;

    :deep(.ant-select-selector) {
      color: #fff !important;
      font-weight: 600;
      font-size: 12px;
      background: transparent !important;
      padding: 0 !important;
      
      .ant-select-selection-item {
        color: #fff !important;
      }
    }

    :deep(.ant-select-arrow) {
      color: #00d4ff;
    }
  }
}

// 扁平 sci-fi 按钮
.hud-btn {
  position: relative;
  background: rgba(0, 30, 60, 0.4);
  border: 1px solid rgba(0, 212, 255, 0.3);
  color: rgba(255, 255, 255, 0.85);
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 1px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;

  .hud-btn-glow {
    position: absolute;
    inset: 0;
    background: linear-gradient(90deg, transparent, rgba(0, 212, 255, 0.15), transparent);
    transform: translateX(-100%);
    transition: transform 0.6s ease;
  }

  &:hover {
    border-color: #00d4ff;
    color: #fff;
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
    background: rgba(0, 40, 80, 0.65);

    .hud-btn-glow {
      transform: translateX(100%);
    }
  }

  &:active {
    transform: scale(0.98);
  }

  &.mode-btn {
    border-color: rgba(168, 85, 247, 0.4);
    background: rgba(88, 28, 135, 0.25);
    color: rgba(216, 180, 254, 0.9);

    &:hover {
      border-color: rgb(168, 85, 247);
      box-shadow: 0 0 10px rgba(168, 85, 247, 0.3);
      background: rgba(88, 28, 135, 0.45);
    }
  }

  &.action-btn {
    padding: 6px 16px;
    
    &.start {
      border-color: rgba(16, 185, 129, 0.4);
      background: rgba(4, 120, 87, 0.25);
      color: #10b981;
      
      &:hover {
        border-color: #10b981;
        box-shadow: 0 0 12px rgba(16, 185, 129, 0.35);
        background: rgba(4, 120, 87, 0.45);
      }
    }

    &.pause {
      border-color: rgba(245, 158, 11, 0.4);
      background: rgba(180, 83, 9, 0.25);
      color: #f59e0b;

      &:hover {
        border-color: #f59e0b;
        box-shadow: 0 0 12px rgba(245, 158, 11, 0.35);
        background: rgba(180, 83, 9, 0.45);
      }
    }

    &.resume {
      border-color: rgba(16, 185, 129, 0.4);
      background: rgba(4, 120, 87, 0.25);
      color: #10b981;
      
      &:hover {
        border-color: #10b981;
        box-shadow: 0 0 12px rgba(16, 185, 129, 0.35);
        background: rgba(4, 120, 87, 0.45);
      }
    }

    &.danger {
      border-color: rgba(239, 68, 68, 0.4);
      background: rgba(185, 28, 28, 0.25);
      color: #ef4444;

      &:hover {
        border-color: #ef4444;
        box-shadow: 0 0 12px rgba(239, 68, 68, 0.35);
        background: rgba(185, 28, 28, 0.45);
      }
    }
  }
}



// 玻璃态 HUD 卡片
.hud-card {
  position: absolute;
  z-index: 5;
  background: linear-gradient(135deg, rgba(8, 16, 36, 0.82) 0%, rgba(3, 7, 18, 0.9) 100%);
  border: 1px solid rgba(0, 212, 255, 0.2);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(0, 212, 255, 0.05);
  border-radius: 6px;
  padding: 12px 16px;
  color: #d1d5db;
  backdrop-filter: blur(12px);
  transition: border-color 0.3s ease, box-shadow 0.3s ease;

  &:hover {
    border-color: rgba(0, 212, 255, 0.4);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 212, 255, 0.15), inset 0 0 15px rgba(0, 212, 255, 0.08);
  }

  .hud-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 10px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(0, 212, 255, 0.15);
    cursor: pointer;
    user-select: none;

    .header-line {
      width: 3px;
      height: 12px;
      background: #00d4ff;
      box-shadow: 0 0 6px #00d4ff;
    }

    .hud-card-title {
      font-size: 11px;
      font-weight: 800;
      color: #00d4ff;
      letter-spacing: 1.5px;
      text-shadow: 0 0 8px rgba(0, 212, 255, 0.2);
    }
  }
}

.hud-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  line-height: 2;
  font-size: 12px;

  .hud-label {
    color: rgba(255, 255, 255, 0.5);
    font-weight: 500;
    letter-spacing: 0.5px;
  }

  .hud-value {
    color: #f3f4f6;
    font-weight: 600;

    &.warning {
      color: #ef4444;
      text-shadow: 0 0 8px rgba(239, 68, 68, 0.5);
      animation: alert-blink 1s infinite alternate;
    }
  }

  .location-text {
    color: #38bdf8;
    text-shadow: 0 0 6px rgba(56, 189, 248, 0.25);
    max-width: 130px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}

@keyframes alert-blink {
  0% { opacity: 0.7; }
  100% { opacity: 1; }
}

.monospace {
  font-family: 'Courier New', Courier, monospace;
}

// 各种颜色及阴影
.text-danger { color: #f43f5e !important; }
.text-warning { color: #f59e0b !important; }
.text-normal { color: #10b981 !important; }
.glow-red { text-shadow: 0 0 6px rgba(244, 63, 94, 0.6); }
.glow-yellow { text-shadow: 0 0 6px rgba(245, 158, 11, 0.6); }
.glow-green { text-shadow: 0 0 6px rgba(16, 185, 129, 0.6); }

// ── 左侧信息列 ──
.hud-left-col {
  position: absolute;
  top: 68px;
  left: 20px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 8px;

  > .hud-card {
    position: relative;
    top: auto;
    left: auto;
  }
}

// ── 折叠箭头 ──
.collapse-arrow {
  margin-left: auto;
  font-size: 11px;
  color: rgba(0, 212, 255, 0.5);
}

// ── 折叠小标签 ──
.hud-collapse-tag {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  background: rgba(8, 16, 36, 0.82);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 4px;
  font-size: 11px;
  font-weight: 700;
  color: rgba(0, 212, 255, 0.7);
  letter-spacing: 1px;
  cursor: pointer;
  user-select: none;
  backdrop-filter: blur(8px);
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(0, 212, 255, 0.5);
    color: #00d4ff;
    box-shadow: 0 0 10px rgba(0, 212, 255, 0.15);
  }
}

// ── 监控数据中心 ──
.hud-monitoring {
  width: 460px;

  .hud-monitoring-body {
    display: flex;
    gap: 20px;
    margin-top: 4px;

    .hud-column {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 4px;
      white-space: nowrap;

      .column-title {
        font-size: 10px;
        font-weight: 800;
        color: rgba(0, 212, 255, 0.45);
        border-bottom: 1px solid rgba(0, 212, 255, 0.15);
        padding-bottom: 2px;
        margin-bottom: 4px;
        letter-spacing: 0.5px;
      }

      .ptz-text {
        color: #a855f7;
        text-shadow: 0 0 6px rgba(168, 85, 247, 0.35);
      }
    }

    .divider-line {
      width: 1px;
      background: rgba(0, 212, 255, 0.15);
      align-self: stretch;
      margin: 4px 0;
    }
  }
}

// ── 当前点位 ──
.hud-point-info {
  width: 460px;

  .hud-point-body {
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 4px;

    .hud-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
      line-height: 2;
      font-size: 12px;

      .hud-label {
        color: rgba(255, 255, 255, 0.5);
        font-weight: 500;
        letter-spacing: 0.5px;
      }

      .hud-value {
        color: #f3f4f6;
        font-weight: 600;
        max-width: 300px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        &.name-highlight {
          color: #00d4ff;
          text-shadow: 0 0 6px rgba(0, 212, 255, 0.3);
        }
      }
    }
  }
}

// 速度横条 (机器人控制上方)
.hud-speed-bar {
  position: absolute;
  bottom: 220px;
  left: 28px;
  z-index: 5;
  width: 184px;
  background: linear-gradient(180deg, rgba(8, 16, 36, 0.88) 0%, rgba(4, 10, 25, 0.92) 100%);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 10px;
  padding: 10px 14px;
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.4);
  transition: border-color 0.3s ease;

  &:hover {
    border-color: rgba(0, 212, 255, 0.4);
  }

  .speed-bar-header {
    display: flex;
    align-items: baseline;
    gap: 6px;
    margin-bottom: 8px;
  }

  .speed-bar-label {
    font-size: 10px;
    font-weight: 700;
    color: rgba(0, 212, 255, 0.45);
    letter-spacing: 3px;
  }

  .speed-bar-value {
    font-size: 22px;
    font-weight: 900;
    color: #00d4ff;
    line-height: 1;
    text-shadow: 0 0 8px rgba(0, 212, 255, 0.5);
  }

  .speed-bar-unit {
    font-size: 10px;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.35);
    letter-spacing: 1px;
  }

  .speed-bar-track {
    width: 100%;
    height: 4px;
    background: rgba(0, 212, 255, 0.1);
    border-radius: 2px;
    overflow: hidden;
  }

  .speed-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, #00d4ff, #00a0ff);
    border-radius: 2px;
    transition: width 0.15s ease;
    box-shadow: 0 0 6px rgba(0, 212, 255, 0.4);
  }
}
</style>
