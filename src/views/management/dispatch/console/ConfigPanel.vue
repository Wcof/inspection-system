<template>
  <div class="config-panel">
    <!-- 主画面背景 -->
    <div class="main-view">
      <img :src="mainViewImg" alt="主视角" class="main-view-img" />
      <div class="hud-scanlines"></div>
      <div class="hud-corners"></div>
    </div>

    <!-- 顶部栏 -->
    <div class="top-bar-hud">
      <div class="top-left">
        <div class="console-select-wrapper">
          <span class="select-label">当前机器人:</span>
          <a-select v-model:value="selectedRobotId" class="robot-select-hud" dropdown-class-name="hud-dropdown" :bordered="false" placeholder="选择机器人">
            <a-select-option v-for="r in robots" :key="r.id" :value="r.id">
              {{ r.name }}
            </a-select-option>
          </a-select>
        </div>
      </div>
      <div class="top-center">
        <div class="status-pulse-badge config-mode">
          <span class="status-dot"></span>
          <span class="status-text">配置校准模式</span>
        </div>
      </div>
      <div class="top-right" />
    </div>

    <!-- HUD: 监控数据中心 (左上) -->
    <div class="hud hud-card hud-monitoring">
      <div class="hud-card-header">
        <span class="header-line"></span>
        <div class="hud-card-title">监控数据中心</div>
      </div>
      <div class="hud-monitoring-body">
        <div class="hud-column">
          <div class="column-title">遥测数据 (TELEMETRY)</div>
          <div class="hud-row"><span class="hud-label">执行时间</span><span class="hud-value monospace">{{ elapsedTime }}</span></div>
          <div class="hud-row"><span class="hud-label">电量</span><span class="hud-value monospace text-normal glow-green">{{ battery }}%</span></div>
          <div class="hud-row"><span class="hud-label">里程</span><span class="hud-value monospace">{{ mileage }} km</span></div>
          <div class="hud-row"><span class="hud-label">云台偏航/俯仰</span><span class="hud-value monospace ptz-text">{{ gimbalYaw }}° / {{ gimbalPitch }}°</span></div>
          <div class="hud-row"><span class="hud-label">位置</span><span class="hud-value location-text">{{ currentPointName }}</span></div>
        </div>
        <div class="divider-line"></div>
        <div class="hud-column">
          <div class="column-title">环境传感器 (SENSORS)</div>
          <div class="hud-row"><span class="hud-label">可燃气体</span><span class="hud-value monospace">{{ gasData.combustible }} %LEL</span></div>
          <div class="hud-row"><span class="hud-label">氧气浓度</span><span class="hud-value monospace">{{ gasData.oxygen }} %VOL</span></div>
          <div class="hud-row"><span class="hud-label">一氧化碳</span><span class="hud-value monospace">{{ gasData.co }} ppm</span></div>
          <div class="hud-row"><span class="hud-label">硫化氢</span><span class="hud-value monospace">{{ gasData.h2s }} ppm</span></div>
        </div>
      </div>
    </div>

    <!-- 摄像头小窗 -->
    <CameraViews
      :mainView="mainViewType"
      layout="pip"
      @switch-main="mainViewType = $event"
    />

    <!-- 地图缩略图 -->
    <MapThumbnail />

    <!-- 点位列表面板 -->
    <div class="point-list-panel">
      <div class="panel-header">
        <span class="header-line"></span>
        <span class="header-title">巡检点位</span>
      </div>
      <div class="point-list">
        <div
          v-for="p in pointsWithInfo"
          :key="p.id"
          class="point-item"
          :class="{ selected: selectedPoint?.id === p.id }"
          @click="selectPoint(p)"
        >
          <div class="point-item-meta">
            <span class="point-badge-status" :class="p.calibrationStatus">
              {{ p.calibrationStatus === 'calibrated' ? '已校准' : '未校准' }}
            </span>
            <span class="point-name-text">{{ p.name }}</span>
          </div>
          <div class="point-actions">
            <button class="hud-action-btn primary" @click.stop="goToPoint(p)">
              前往
            </button>
            <button v-if="p.calibrationStatus === 'calibrated'" class="hud-action-btn" @click.stop="openConfig(p)">
              变更配置
            </button>
            <button v-else class="hud-action-btn highlight" @click.stop="calibratePoint(p)">
              校准
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 选中点位的详细信息 -->
    <div v-if="selectedPoint" class="hud hud-card hud-point-detail">
      <div class="hud-card-header">
        <span class="header-line"></span>
        <div class="hud-card-title">点位详情</div>
      </div>
      <div class="hud-card-body">
        <div class="hud-row">
          <span class="hud-label">名称</span>
          <span class="hud-value title-val">{{ selectedPoint.name }}</span>
        </div>
        <div class="hud-row">
          <span class="hud-label">装置</span>
          <span class="hud-value" :title="selectedPoint._deviceName">{{ selectedPoint._deviceName || '无' }}</span>
        </div>
        <div class="hud-row">
          <span class="hud-label">设施设备</span>
          <span class="hud-value" :title="selectedPoint._facilityName">{{ selectedPoint._facilityName || '无' }}</span>
        </div>
        <div class="hud-row">
          <span class="hud-label">巡检对象</span>
          <span class="hud-value" :title="selectedPoint._objectName">{{ selectedPoint._objectName || '无' }}</span>
        </div>
        <div class="hud-row">
          <span class="hud-label">巡检规则</span>
          <span class="hud-value" :title="selectedPoint._ruleName">{{ selectedPoint._ruleName || '无' }}</span>
        </div>
      </div>
    </div>

    <!-- 前往提示 (Sci-fi Target Locking Overlay) -->
    <div v-if="goingToPoint" class="going-overlay">
      <div class="lock-grid"></div>
      <div class="radar-scan"></div>
      <div class="going-content">
        <div class="target-bracket">
          <span class="corner tl"></span>
          <span class="corner tr"></span>
          <span class="corner bl"></span>
          <span class="corner br"></span>
          <div class="target-cross"></div>
          <span class="locking-text">锁定目标中...</span>
        </div>
        <div class="transit-info">
          <div class="transit-title">自动驾驶转运中</div>
          <div class="transit-destination">目的地: {{ goingToPoint.name }}</div>
          <div class="transit-progress-container">
            <div class="transit-progress-bar"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 校准确认弹窗 (Custom Styling modal via wrapClassName) -->
    <a-modal
      v-model:open="calibrateModalVisible"
      title="点位校准"
      @ok="confirmCalibrate"
      centered
      wrap-class-name="hud-modal"
    >
      <div class="modal-body-content">
        <p>确认校准点位 <strong>{{ calibrateTarget?.name }}</strong>？</p>
        <p class="sub-text">校准操作会更新基准空间定位。此行为是不可逆的。</p>
      </div>
    </a-modal>

    <!-- 变更配置弹窗 -->
    <ConfigModal
      v-model:open="configModalVisible"
      :point="configTarget"
      @saved="onConfigSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { MockService } from '@/mock/mockService'
import type { Robot } from '@/types/robot'
import type { InspectionPoint } from '@/types/inspection'
import { CalibrationStatus } from '@/types/inspection'
import CameraViews from './CameraViews.vue'
import MapThumbnail from './MapThumbnail.vue'
import ConfigModal from './ConfigModal.vue'
import mainViewImg from '@/双目.png'

// 数据
const robots = ref<Robot[]>(MockService.getRobots())
const selectedRobotId = ref<string>('')
const inspectionPoints = ref<InspectionPoint[]>(MockService.getInspectionPoints())
const inspectionDevices = MockService.getInspectionDevices()
const currentPointName = ref('无')
const mainViewType = ref<'binocular' | 'visible' | 'thermal'>('binocular')

// 云台角度静态显示 (保持数据中心一致)
const gimbalPitch = ref(0)
const gimbalYaw = ref(0)

// HUD mock 数据
const elapsedTime = ref('00:00:00')
const battery = ref(87)
const mileage = ref(1.2)
const gasData = ref({ combustible: 0.02, oxygen: 20.9, co: 5, h2s: 1 })

// 选中的点位
const selectedPoint = ref<any>(null)

// 前往状态
const goingToPoint = ref<InspectionPoint | null>(null)

// 校准弹窗
const calibrateModalVisible = ref(false)
const calibrateTarget = ref<InspectionPoint | null>(null)

// 配置弹窗
const configModalVisible = ref(false)
const configTarget = ref<InspectionPoint | null>(null)

// 点位附加信息
const pointsWithInfo = computed(() => {
  return inspectionPoints.value.map(p => {
    const devices = inspectionDevices.filter(d => d.inspectionPointId === p.id)
    const deviceName = devices.map(d => d.name).join('、')
    const facilityName = p.coverageObjects
      ?.filter(o => o.type === 'asset' || o.type === 'component')
      .map(o => o.name).join('、') || ''
    const objectName = p.coverageObjects
      ?.filter(o => o.type === 'component' || o.type === 'connection')
      .map(o => o.name).join('、') || ''
    const ruleName = p.detectionConfigs
      ?.filter(c => c.enabled)
      .map(c => c.subjectName).join('、') || ''
    return { ...p, _deviceName: deviceName, _facilityName: facilityName, _objectName: objectName, _ruleName: ruleName }
  })
})

onMounted(() => {
  if (robots.value.length > 0) {
    selectedRobotId.value = robots.value[0].id
  }
})

// 选择点位
function selectPoint(p: any) {
  selectedPoint.value = p
}

// 前往点位
function goToPoint(p: InspectionPoint) {
  goingToPoint.value = p
  setTimeout(() => {
    goingToPoint.value = null
    currentPointName.value = p.name
    selectedPoint.value = pointsWithInfo.value.find(x => x.id === p.id) || null
  }, 3000)
}

// 校准
function calibratePoint(p: InspectionPoint) {
  calibrateTarget.value = p
  calibrateModalVisible.value = true
}

function confirmCalibrate() {
  if (!calibrateTarget.value) return
  const point = MockService.getInspectionPointById(calibrateTarget.value.id)
  if (point) {
    point.calibrationStatus = CalibrationStatus.CALIBRATED
    point.calibratedAt = new Date()
    MockService.saveInspectionPoint(point)
    inspectionPoints.value = MockService.getInspectionPoints()
  }
  calibrateModalVisible.value = false
  calibrateTarget.value = null
}

// 变更配置
function openConfig(p: InspectionPoint) {
  configTarget.value = p
  configModalVisible.value = true
}

function onConfigSaved() {
  inspectionPoints.value = MockService.getInspectionPoints()
  configModalVisible.value = false
}
</script>

<style scoped lang="less">
.config-panel {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  background-color: #04060f;
}

.main-view {
  position: absolute;
  inset: 0;
  z-index: 0;

  .main-view-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: contrast(1.05) brightness(0.95);
  }

  // 扫描线
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

  // 四角框线
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

// 顶部栏
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

.status-pulse-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  background: rgba(0, 0, 0, 0.5);
  border: 1px solid rgba(168, 85, 247, 0.3);
  padding: 4px 14px;
  border-radius: 20px;
  
  .status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #a855f7;
    box-shadow: 0 0 8px #a855f7;
  }

  .status-text {
    font-size: 11px;
    font-weight: 700;
    color: #d8b4fe;
    letter-spacing: 0.5px;
  }
}

// HUD 卡片基础样式
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

.monospace {
  font-family: 'Courier New', Courier, monospace;
}

.hud-monitoring {
  position: absolute;
  top: 68px;
  left: 20px;
  width: 460px;
  z-index: 5;
}

.hud-monitoring-body {
  display: flex;
  gap: 20px;
  margin-top: 4px;

  .hud-column {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;

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

.hud-point-detail {
  bottom: 16px;
  left: 210px;
  width: 260px;

  .hud-value {
    max-width: 150px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: #e2e8f0;
  }

  .title-val {
    color: #00d4ff;
    text-shadow: 0 0 8px rgba(0, 212, 255, 0.4);
    font-weight: 700;
  }
}

// 点位列表面板 (Glassmorphism Sidebar)
.point-list-panel {
  position: absolute;
  top: 68px;
  right: 170px;
  bottom: 16px;
  width: 290px;
  z-index: 5;
  background: linear-gradient(135deg, rgba(8, 16, 36, 0.85) 0%, rgba(3, 7, 18, 0.92) 100%);
  border: 1px solid rgba(0, 212, 255, 0.22);
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(12px);
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.5), inset 0 0 15px rgba(0, 212, 255, 0.04);
  transition: all 0.3s ease;

  &:hover {
    border-color: rgba(0, 212, 255, 0.35);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.6), 0 0 15px rgba(0, 212, 255, 0.1);
  }

  .panel-header {
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid rgba(0, 212, 255, 0.15);
    flex-shrink: 0;

    .header-line {
      width: 3px;
      height: 12px;
      background: #00d4ff;
      box-shadow: 0 0 6px #00d4ff;
    }

    .header-title {
      font-size: 11px;
      font-weight: 800;
      color: #00d4ff;
      letter-spacing: 1.5px;
      text-shadow: 0 0 8px rgba(0, 212, 255, 0.2);
    }
  }

  .point-list {
    flex: 1;
    overflow-y: auto;
    padding: 8px;

    &::-webkit-scrollbar {
      width: 4px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(0, 212, 255, 0.25);
      border-radius: 2px;
    }
  }

  .point-item {
    padding: 10px 12px;
    border-radius: 4px;
    cursor: pointer;
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.03);
    margin-bottom: 6px;
    transition: all 0.25s ease;

    &:hover {
      background: rgba(0, 212, 255, 0.06);
      border-color: rgba(0, 212, 255, 0.2);
      transform: translateX(-2px);
    }

    &.selected {
      background: rgba(0, 212, 255, 0.08);
      border-color: rgba(0, 212, 255, 0.4);
      box-shadow: 0 0 10px rgba(0, 212, 255, 0.1);
    }

    .point-item-meta {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 8px;

      .point-name-text {
        color: #e2e8f0;
        font-size: 12px;
        font-weight: 600;
      }
    }

    .point-badge-status {
      font-size: 9px;
      font-weight: 800;
      padding: 1px 5px;
      border-radius: 3px;
      letter-spacing: 0.5px;
      border: 1px solid;

      &.calibrated {
        border-color: rgba(16, 185, 129, 0.4);
        background: rgba(4, 120, 87, 0.15);
        color: #10b981;
      }
      &.pending {
        border-color: rgba(245, 158, 11, 0.4);
        background: rgba(180, 83, 9, 0.15);
        color: #f59e0b;
      }
    }

    .point-actions {
      display: flex;
      gap: 6px;
    }
  }
}

// Sci-fi buttons in config
.hud-action-btn {
  background: rgba(0, 20, 45, 0.6);
  border: 1px solid rgba(0, 212, 255, 0.35);
  color: #00d4ff;
  border-radius: 3px;
  font-size: 10px;
  font-weight: 700;
  padding: 3px 10px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    background: rgba(0, 212, 255, 0.2);
    border-color: #00d4ff;
    box-shadow: 0 0 8px rgba(0, 212, 255, 0.3);
  }

  &:active {
    transform: scale(0.96);
  }

  &.primary {
    background: rgba(0, 212, 255, 0.15);
    border-color: #00d4ff;
    color: #fff;

    &:hover {
      background: rgba(0, 212, 255, 0.3);
      box-shadow: 0 0 10px rgba(0, 212, 255, 0.4);
    }
  }

  &.highlight {
    border-color: rgba(245, 158, 11, 0.5);
    color: #f59e0b;

    &:hover {
      background: rgba(245, 158, 11, 0.15);
      border-color: #f59e0b;
      box-shadow: 0 0 8px rgba(245, 158, 11, 0.3);
    }
  }
}

// 前往点位遮罩层 (Target Locking HUD)
.going-overlay {
  position: absolute;
  inset: 0;
  z-index: 20;
  background: rgba(2, 4, 12, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;

  .lock-grid {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(0, 212, 255, 0.05) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 212, 255, 0.05) 1px, transparent 1px);
    background-size: 40px 40px;
    background-position: center;
  }

  .radar-scan {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle, rgba(0, 212, 255, 0.12) 0%, transparent 60%);
    animation: radar-sweep-zoom 3s infinite linear;
  }

  .going-content {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 32px;
  }
}

.target-bracket {
  position: relative;
  width: 140px;
  height: 140px;
  display: flex;
  align-items: center;
  justify-content: center;

  .corner {
    position: absolute;
    width: 24px;
    height: 24px;
    border-color: #00d4ff;
    border-style: solid;
    border-width: 0;

    &.tl { top: 0; left: 0; border-top-width: 3px; border-left-width: 3px; }
    &.tr { top: 0; right: 0; border-top-width: 3px; border-right-width: 3px; }
    &.bl { bottom: 0; left: 0; border-bottom-width: 3px; border-left-width: 3px; }
    &.br { bottom: 0; right: 0; border-bottom-width: 3px; border-right-width: 3px; }
  }

  .target-cross {
    width: 16px;
    height: 16px;
    position: relative;

    &::before, &::after {
      content: '';
      position: absolute;
      background: #00d4ff;
    }
    &::before { top: 7px; left: 0; width: 16px; height: 2px; }
    &::after { top: 0; left: 7px; width: 2px; height: 16px; }
  }

  .locking-text {
    position: absolute;
    bottom: -24px;
    font-size: 11px;
    color: #00d4ff;
    font-weight: 900;
    letter-spacing: 2px;
    text-shadow: 0 0 8px rgba(0, 212, 255, 0.5);
    animation: text-pulse-glow 1s infinite alternate;
  }
}

.transit-info {
  text-align: center;
  min-width: 320px;

  .transit-title {
    color: rgba(255, 255, 255, 0.85);
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 2px;
    margin-bottom: 6px;
  }

  .transit-destination {
    color: #38bdf8;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1px;
    margin-bottom: 20px;
    text-shadow: 0 0 6px rgba(56, 189, 248, 0.4);
  }

  .transit-progress-container {
    height: 4px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(0, 212, 255, 0.2);
    border-radius: 2px;
    overflow: hidden;

    .transit-progress-bar {
      height: 100%;
      background: linear-gradient(90deg, #00d4ff, #0088ff);
      box-shadow: 0 0 8px #00d4ff;
      width: 0%;
      animation: simulate-progress 3s linear forwards;
    }
  }
}

// 模拟 Autopilot 动画
@keyframes radar-sweep-zoom {
  0% { transform: scale(0.6); opacity: 0.1; }
  50% { opacity: 0.4; }
  100% { transform: scale(1.4); opacity: 0; }
}

@keyframes text-pulse-glow {
  0% { opacity: 0.5; text-shadow: 0 0 2px rgba(0, 212, 255, 0.2); }
  100% { opacity: 1; text-shadow: 0 0 10px rgba(0, 212, 255, 0.7); }
}

@keyframes simulate-progress {
  0% { width: 0%; }
  100% { width: 100%; }
}
</style>

<style lang="less">
// 暗色 Sci-fi HUD 弹框样式覆盖
.hud-modal {
  .ant-modal-content {
    background: linear-gradient(135deg, rgba(8, 16, 36, 0.95) 0%, rgba(3, 7, 18, 0.98) 100%) !important;
    border: 1px solid rgba(0, 212, 255, 0.3) !important;
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 212, 255, 0.2) !important;
    border-radius: 6px !important;
  }

  .ant-modal-header {
    background: transparent !important;
    border-bottom: 1px solid rgba(0, 212, 255, 0.15) !important;
    padding-bottom: 10px !important;
    
    .ant-modal-title {
      color: #00d4ff !important;
      font-weight: 800 !important;
      font-size: 13px !important;
      letter-spacing: 1.5px !important;
      text-shadow: 0 0 8px rgba(0, 212, 255, 0.3) !important;
    }
  }

  .ant-modal-close {
    color: rgba(255, 255, 255, 0.4) !important;
    &:hover {
      color: #00d4ff !important;
    }
  }

  .modal-body-content {
    color: #e2e8f0 !important;
    font-size: 13px;
    padding-top: 10px;

    strong {
      color: #00d4ff !important;
      text-shadow: 0 0 4px rgba(0, 212, 255, 0.2);
    }

    .sub-text {
      color: rgba(255, 255, 255, 0.4) !important;
      font-size: 11px;
      margin-top: 8px;
    }
  }

  .ant-modal-footer {
    border-top: 1px solid rgba(255, 255, 255, 0.05) !important;
    padding-top: 10px !important;
    
    .ant-btn {
      background: rgba(0, 20, 45, 0.6) !important;
      border: 1px solid rgba(0, 212, 255, 0.35) !important;
      color: #00d4ff !important;
      font-size: 11px !important;
      font-weight: 700 !important;
      border-radius: 3px !important;

      &:hover {
        background: rgba(0, 212, 255, 0.2) !important;
        border-color: #00d4ff !important;
        color: #fff !important;
      }

      &.ant-btn-primary {
        background: rgba(0, 212, 255, 0.2) !important;
        border-color: #00d4ff !important;
        color: #fff !important;

        &:hover {
          background: rgba(0, 212, 255, 0.35) !important;
          box-shadow: 0 0 10px rgba(0, 212, 255, 0.4) !important;
        }
      }
    }
  }
}
</style>
