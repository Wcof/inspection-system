import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface PointPosition {
  id: string
  name: string
  x: number
  y: number
  calibrationStatus?: string
}

export const useRobotConsoleStore = defineStore('robotConsole', () => {
  // ========== 任务核心状态 ==========
  const taskStatus = ref<'idle' | 'inspecting' | 'paused' | 'emergency_locked'>('idle')
  const elapsedTimeSec = ref(0)
  const battery = ref(100)
  const mileage = ref(0)
  const speed = ref(0) // 正数前进，负数后退

  // ========== 空间位置状态 ==========
  const currentRobotId = ref('')
  const robotPosition = ref({ x: 10, y: 15 })
  const robotDirection = ref(0) // 弧度，0 = 朝右
  const targetPoint = ref<PointPosition | null>(null)
  const currentPointName = ref('无')

  // ========== 传感器模拟状态 ==========
  const gasData = ref({
    lels: 0.02,
    o2: 20.9,
    co: 5,
    h2s: 1
  })

  // ========== 操控输入层 ==========
  const keysPressed = ref({
    w: false,
    a: false,
    s: false,
    d: false,
    space: false
  })

  // ========== 控制模式 ==========
  const controlMode = ref<'pc' | 'iPad'>('pc')

  // ========== 主视角 ==========
  const mainViewType = ref<'binocular' | 'visible' | 'thermal'>('binocular')

  // ========== 定时器引用 ==========
  let elapsedTimer: ReturnType<typeof setInterval> | null = null
  let gasTimer: ReturnType<typeof setInterval> | null = null
  let positionTimer: ReturnType<typeof setInterval> | null = null

  // ========== Getters ==========
  const formattedTime = computed(() => {
    const h = Math.floor(elapsedTimeSec.value / 3600).toString().padStart(2, '0')
    const m = Math.floor((elapsedTimeSec.value % 3600) / 60).toString().padStart(2, '0')
    const s = (elapsedTimeSec.value % 60).toString().padStart(2, '0')
    return `${h}:${m}:${s}`
  })

  const batteryClass = computed(() => {
    if (battery.value <= 20) return 'text-danger'
    if (battery.value <= 50) return 'text-warning'
    return ''
  })

  const taskStatusColor = computed(() => {
    switch (taskStatus.value) {
      case 'inspecting': return 'green'
      case 'paused': return 'orange'
      case 'emergency_locked': return 'red'
      default: return 'default'
    }
  })

  const taskStatusLabel = computed(() => {
    switch (taskStatus.value) {
      case 'inspecting': return '巡检中'
      case 'paused': return '已暂停'
      case 'emergency_locked': return '急停锁定'
      default: return '空闲'
    }
  })

  const isGasOverload = computed(() => {
    return gasData.value.co > 24 || gasData.value.h2s > 10 || gasData.value.lels > 25 || gasData.value.o2 < 19.5 || gasData.value.o2 > 23.5
  })

  const gasAlerts = computed(() => {
    const alerts: string[] = []
    if (gasData.value.lels > 25) alerts.push('可燃气超标')
    else if (gasData.value.lels > 10) alerts.push('可燃气预警')
    if (gasData.value.o2 < 19.5) alerts.push('氧气不足')
    else if (gasData.value.o2 > 23.5) alerts.push('氧气过浓')
    if (gasData.value.co > 24) alerts.push('CO超标')
    if (gasData.value.h2s > 10) alerts.push('H₂S超标')
    return alerts
  })

  // ========== Actions ==========

  /** 更新速度（根据按键状态） */
  function updateSpeed() {
    if (keysPressed.value.space) {
      speed.value = 0
      return
    }
    if (keysPressed.value.w) {
      speed.value = 1.5
    } else if (keysPressed.value.s) {
      speed.value = -0.5
    } else {
      speed.value = 0
    }
  }

  /** 设置按键状态 */
  function setKeyPressed(key: string, pressed: boolean) {
    if (key === ' ') {
      keysPressed.value.space = pressed
    } else if (key in keysPressed.value) {
      (keysPressed.value as any)[key] = pressed
    }
    updateSpeed()
  }

  /** 释放所有按键 */
  function releaseAllKeys() {
    keysPressed.value = { w: false, a: false, s: false, d: false, space: false }
    speed.value = 0
  }

  /** 切换控制模式 */
  function toggleControlMode() {
    controlMode.value = controlMode.value === 'pc' ? 'iPad' : 'pc'
    releaseAllKeys()
  }

  /** 切换主视角 */
  function switchMainView(view: 'binocular' | 'visible' | 'thermal') {
    mainViewType.value = view
  }

  /** iPad 方向输入 */
  function handleDirection(dir: string) {
    releaseAllKeys()
    switch (dir) {
      case 'forward': keysPressed.value.w = true; speed.value = 1.5; break
      case 'backward': keysPressed.value.s = true; speed.value = -0.5; break
      case 'left': keysPressed.value.a = true; break
      case 'right': keysPressed.value.d = true; break
      case 'brake': keysPressed.value.space = true; speed.value = 0; break
      case 'stop': releaseAllKeys(); break
    }
  }

  // ========== 任务控制 ==========

  function startTask() {
    taskStatus.value = 'inspecting'
    startTimers()
  }

  function pauseTask() {
    taskStatus.value = 'paused'
    stopTimers()
  }

  function resumeTask() {
    taskStatus.value = 'inspecting'
    startTimers()
  }

  function stopTask() {
    taskStatus.value = 'idle'
    stopTimers()
    elapsedTimeSec.value = 0
    speed.value = 0
    mileage.value = 0
    releaseAllKeys()
  }

  /** 急停（E-Stop） */
  function triggerEmergencyStop() {
    taskStatus.value = 'emergency_locked'
    speed.value = 0
    releaseAllKeys()
    keysPressed.value.space = true
    stopTimers()
  }

  /** 解除急停锁定 */
  function releaseEmergencyLock() {
    taskStatus.value = 'paused'
    keysPressed.value.space = false
  }

  // ========== 定时器 ==========

  function startTimers() {
    stopTimers()
    elapsedTimer = setInterval(() => {
      elapsedTimeSec.value++
      if (battery.value > 0) {
        battery.value = Math.max(0, +(battery.value - 0.1).toFixed(1))
      }
      if (Math.abs(speed.value) > 0) {
        mileage.value = +(mileage.value + Math.abs(speed.value) * 0.001).toFixed(3)
      }
    }, 1000)

    gasTimer = setInterval(() => {
      gasData.value = {
        lels: +(0.02 + (Math.random() - 0.5) * 0.01).toFixed(3),
        o2: +(20.9 + (Math.random() - 0.5) * 0.2).toFixed(1),
        co: Math.max(0, +(5 + (Math.random() - 0.5) * 2).toFixed(1)),
        h2s: Math.max(0, +(1 + (Math.random() - 0.5) * 0.5).toFixed(2))
      }
    }, 2000)

    positionTimer = setInterval(() => {
      updateRobotPosition()
    }, 100)
  }

  function stopTimers() {
    if (elapsedTimer) { clearInterval(elapsedTimer); elapsedTimer = null }
    if (gasTimer) { clearInterval(gasTimer); gasTimer = null }
    if (positionTimer) { clearInterval(positionTimer); positionTimer = null }
  }

  /** 更新机器人位置（模拟物理运动） */
  function updateRobotPosition() {
    if (Math.abs(speed.value) < 0.01) return
    const dt = 0.1 // 100ms
    const moveSpeed = speed.value * dt

    // 转向
    if (keysPressed.value.a) {
      robotDirection.value -= 0.05
    }
    if (keysPressed.value.d) {
      robotDirection.value += 0.05
    }

    // 位移
    robotPosition.value = {
      x: robotPosition.value.x + Math.cos(robotDirection.value) * moveSpeed,
      y: robotPosition.value.y + Math.sin(robotDirection.value) * moveSpeed
    }
  }

  /** 欧几里得距离到达判定 */
  function checkPointArrival(points: PointPosition[], threshold = 0.5) {
    if (taskStatus.value !== 'inspecting') return
    for (const point of points) {
      const distance = Math.sqrt(
        Math.pow(robotPosition.value.x - point.x, 2) +
        Math.pow(robotPosition.value.y - point.y, 2)
      )
      if (distance < threshold && targetPoint.value?.id !== point.id) {
        targetPoint.value = point
        currentPointName.value = point.name
        break
      }
    }
  }

  return {
    // State
    taskStatus, elapsedTimeSec, battery, mileage, speed,
    currentRobotId, robotPosition, robotDirection, targetPoint, currentPointName,
    gasData, keysPressed, controlMode, mainViewType,
    // Getters
    formattedTime, batteryClass, taskStatusColor, taskStatusLabel,
    isGasOverload, gasAlerts,
    // Actions
    updateSpeed, setKeyPressed, releaseAllKeys, toggleControlMode,
    switchMainView, handleDirection,
    startTask, pauseTask, resumeTask, stopTask,
    triggerEmergencyStop, releaseEmergencyLock,
    checkPointArrival
  }
})
