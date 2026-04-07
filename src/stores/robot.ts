import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { MockService } from '@/mock/mockService'
import type { Robot, RobotFormData } from '@/types'
import { RobotStatus } from '@/types'

export const useRobotStore = defineStore('robot', () => {
  const robots = ref<Robot[]>([])
  const loading = ref(false)
  
  // 初始化数据
  function initialize() {
    MockService.initializeData()
    robots.value = MockService.getRobots()
  }
  
  // 获取所有机器人
  function fetchAllRobots() {
    loading.value = true
    try {
      robots.value = MockService.getRobots()
    } finally {
      loading.value = false
    }
  }
  
  // 根据 ID 获取机器人
  function getRobotById(id: string): Robot | undefined {
    return robots.value.find(robot => robot.id === id)
  }
  
  // 创建或更新机器人
  function saveRobot(robotData: Robot | RobotFormData) {
    const robot: Robot = 'id' in robotData ? robotData : {
      id: `robot-${Date.now()}`,
      name: robotData.name,
      serialNumber: robotData.serialNumber,
      model: robotData.model,
      status: RobotStatus.OFFLINE,
      batteryLevel: 100,
      batteryThreshold: robotData.batteryThreshold,
      lastOnlineTime: new Date(),
      connectionConfig: robotData.connectionConfig,
      exceptionStrategy: robotData.exceptionStrategy,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    MockService.saveRobot(robot)
    fetchAllRobots()
    return robot
  }
  
  // 删除机器人
  function deleteRobot(id: string) {
    MockService.deleteRobot(id)
    fetchAllRobots()
  }
  
  // 计算属性：在线机器人数量
  const onlineRobotsCount = computed(() => {
    return robots.value.filter(robot => robot.status === RobotStatus.ONLINE).length
  })
  
  // 计算属性：充电中机器人数量
  const chargingRobotsCount = computed(() => {
    return robots.value.filter(robot => robot.status === RobotStatus.CHARGING).length
  })
  
  return {
    robots,
    loading,
    onlineRobotsCount,
    chargingRobotsCount,
    initialize,
    fetchAllRobots,
    getRobotById,
    saveRobot,
    deleteRobot
  }
})