import { defineStore } from 'pinia'
import { ref } from 'vue'
import { MockService } from '@/mock/mockService'
import { 
  InspectionPoint, 
  InspectionPointFormData, 
  MonitorPoint, 
  MonitorPointFormData, 
  Metric, 
  MetricFormData,
  InspectionTask,
  InspectionTaskFormData,
  InspectionMap,
  Waypoint,
  WaypointEdge,
  InspectionRoute,
  InspectionRouteFormData,
  InspectionDevice,
  InspectionDeviceFormData,
  InspectionDeviceCheckItem,
  InspectionDeviceCheckItemFormData,
  CalibrationStatus,
  InspectionPointType,
  PositionSource,
  DeviceStatus,
  InspectionTaskInstanceStatus,
  InspectionPlan,
  InspectionTaskResult
} from '@/types/inspection'

export const useInspectionStore = defineStore('inspection', () => {
  const inspectionPoints = ref<InspectionPoint[]>([])
  const monitorPoints = ref<MonitorPoint[]>([])
  const metrics = ref<Metric[]>([])
  const tasks = ref<InspectionTask[]>([])
  const inspectionMaps = ref<InspectionMap[]>([])
  const waypoints = ref<Waypoint[]>([])
  const waypointEdges = ref<WaypointEdge[]>([])
  const inspectionRoutes = ref<InspectionRoute[]>([])
  const inspectionDevices = ref<InspectionDevice[]>([])
  const inspectionDeviceCheckItems = ref<InspectionDeviceCheckItem[]>([])
  const inspectionPlans = ref<InspectionPlan[]>([])
  const loading = ref(false)
  
  // 初始化数据
  function initialize() {
    MockService.initializeData()
    fetchAllInspectionPoints()
    fetchAllMonitorPoints()
    fetchAllMetrics()
    fetchAllTasks()
    fetchAllInspectionMaps()
    fetchAllWaypoints()
    fetchAllWaypointEdges()
    fetchAllInspectionRoutes()
    fetchAllInspectionDevices()
    fetchAllInspectionDeviceCheckItems()
    fetchAllInspectionPlans()
  }
  
  // 巡检点相关
  function fetchAllInspectionPoints() {
    loading.value = true
    try {
      inspectionPoints.value = MockService.getInspectionPoints()
    } finally {
      loading.value = false
    }
  }
  
  function getInspectionPointById(id: string): InspectionPoint | undefined {
    return inspectionPoints.value.find(point => point.id === id)
  }
  
  function saveInspectionPoint(pointData: InspectionPoint | InspectionPointFormData) {
    const now = new Date()
    const point: InspectionPoint = 'id' in pointData ? pointData : {
      id: `point-${Date.now()}`,
      name: pointData.name,
      code: pointData.code,
      pointType: pointData.pointType || InspectionPointType.FIXED,
      description: pointData.description,
      mapId: pointData.mapId,
      location: pointData.location,
      mapPosition: pointData.mapPosition,
      areaStartMapPosition: pointData.areaStartMapPosition,
      areaEndMapPosition: pointData.areaEndMapPosition,
      waypointId: pointData.waypointId,
      sequence: pointData.sequence || 1,
      calibrationStatus: pointData.calibrationStatus || CalibrationStatus.PENDING,
      stayDurationSec: pointData.stayDurationSec || 30,
      monitorPoints: [],
      isCritical: pointData.isCritical,
      exceptionStrategy: pointData.exceptionStrategy,
      positionSource: pointData.positionSource || PositionSource.MAP_PICK,
      lastMapPickAt: pointData.positionSource === PositionSource.MAP_PICK ? now : undefined,
      lastManualAdjustAt: pointData.positionSource === PositionSource.MANUAL_ADJUST ? now : undefined,
      createdAt: now,
      updatedAt: now
    }
    
    MockService.saveInspectionPoint(point)
    fetchAllInspectionPoints()
    return point
  }
  
  function deleteInspectionPoint(id: string) {
    MockService.deleteInspectionPoint(id)
    fetchAllInspectionPoints()
  }
  
  // 监测点相关
  function fetchAllMonitorPoints() {
    loading.value = true
    try {
      monitorPoints.value = MockService.getMonitorPoints()
    } finally {
      loading.value = false
    }
  }
  
  function getMonitorPointsByInspectionPointId(inspectionPointId: string): MonitorPoint[] {
    return MockService.getMonitorPointsByInspectionPointId(inspectionPointId)
  }
  
  function saveMonitorPoint(mpData: MonitorPoint | MonitorPointFormData) {
    const monitorPoint: MonitorPoint = 'id' in mpData ? mpData : {
      id: `mp-${Date.now()}`,
      name: mpData.name,
      code: mpData.code,
      inspectionPointId: mpData.inspectionPointId,
      deviceType: mpData.deviceType,
      metrics: [],
      position: mpData.position,
      stayDuration: mpData.stayDuration,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    MockService.saveMonitorPoint(monitorPoint)
    fetchAllMonitorPoints()
    return monitorPoint
  }
  
  function deleteMonitorPoint(id: string) {
    MockService.deleteMonitorPoint(id)
    fetchAllMonitorPoints()
  }
  
  // 监测指标相关
  function fetchAllMetrics() {
    loading.value = true
    try {
      metrics.value = MockService.getMetrics()
    } finally {
      loading.value = false
    }
  }
  
  function getMetricsByMonitorPointId(monitorPointId: string): Metric[] {
    return MockService.getMetricsByMonitorPointId(monitorPointId)
  }
  
  function saveMetric(metricData: Metric | MetricFormData) {
    const metric: Metric = 'id' in metricData ? metricData : {
      id: `metric-${Date.now()}`,
      name: metricData.name,
      code: metricData.code,
      unit: metricData.unit,
      threshold: metricData.threshold,
      monitorPointId: metricData.monitorPointId,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    MockService.saveMetric(metric)
    fetchAllMetrics()
    return metric
  }
  
  function deleteMetric(id: string) {
    MockService.deleteMetric(id)
    fetchAllMetrics()
  }
  
  // 任务相关
  function fetchAllTasks() {
    loading.value = true
    try {
      tasks.value = MockService.getTasks()
    } finally {
      loading.value = false
    }
  }
  
  function getTaskById(id: string): InspectionTask | undefined {
    return tasks.value.find(task => task.id === id)
  }
  
  function saveTask(taskData: InspectionTask | InspectionTaskFormData) {
    const task: InspectionTask = 'id' in taskData ? taskData : {
      id: `task-${Date.now()}`,
      name: taskData.name,
      code: taskData.code,
      robotId: taskData.robotId,
      routeId: 'route-001',
      type: taskData.type,
      status: InspectionTaskInstanceStatus.PENDING,
      inspectionPointIds: taskData.inspectionPointIds,
      currentInspectionPointIndex: 0,
      schedule: taskData.schedule,
      config: taskData.config,
      exceptionStrategy: taskData.exceptionStrategy,
      exceptionLog: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    MockService.saveTask(task)
    fetchAllTasks()
    return task
  }
  
  function deleteTask(id: string) {
    MockService.deleteTask(id)
    fetchAllTasks()
  }
  
  function getTaskResultsByRobotId(robotId: string): any[] {
    const robotTasks = tasks.value.filter(task => task.robotId === robotId)
    const taskIds = robotTasks.map(task => task.id)
    return MockService.getInspectionTaskResults().filter(result => taskIds.includes(result.taskId))
  }

  function getInspectionTaskResultsByTaskId(taskId: string): InspectionTaskResult[] {
    return MockService.getInspectionTaskResultsByTaskId(taskId)
  }
  
  // 路径相关巡检地图相关
  function fetchAllInspectionMaps() {
    loading.value = true
    try {
      inspectionMaps.value = MockService.getInspectionMaps()
    } finally {
      loading.value = false
    }
  }
  
  function getInspectionMapById(id: string): InspectionMap | undefined {
    return inspectionMaps.value.find(map => map.id === id)
  }
  
  function saveInspectionMap(mapData: InspectionMap) {
    MockService.saveInspectionMap(mapData)
    fetchAllInspectionMaps()
    return mapData
  }
  
  function deleteInspectionMap(id: string) {
    MockService.deleteInspectionMap(id)
    fetchAllInspectionMaps()
  }
  
  // 途径点相关
  function fetchAllWaypoints() {
    loading.value = true
    try {
      waypoints.value = MockService.getWaypoints()
    } finally {
      loading.value = false
    }
  }
  
  function getWaypointsByMapId(mapId: string): Waypoint[] {
    return MockService.getWaypointsByMapId(mapId)
  }
  
  function saveWaypoint(waypointData: Waypoint) {
    MockService.saveWaypoint(waypointData)
    fetchAllWaypoints()
    return waypointData
  }
  
  function deleteWaypoint(id: string) {
    MockService.deleteWaypoint(id)
    fetchAllWaypoints()
  }
  
  // 途径点连线相关
  function fetchAllWaypointEdges() {
    loading.value = true
    try {
      waypointEdges.value = MockService.getWaypointEdges()
    } finally {
      loading.value = false
    }
  }
  
  function saveWaypointEdge(edgeData: WaypointEdge) {
    MockService.saveWaypointEdge(edgeData)
    fetchAllWaypointEdges()
    return edgeData
  }
  
  function deleteWaypointEdge(id: string) {
    MockService.deleteWaypointEdge(id)
    fetchAllWaypointEdges()
  }
  
  // 巡检路线相关
  function fetchAllInspectionRoutes() {
    loading.value = true
    try {
      inspectionRoutes.value = MockService.getInspectionRoutes()
    } finally {
      loading.value = false
    }
  }
  
  function getInspectionRouteById(id: string): InspectionRoute | undefined {
    return inspectionRoutes.value.find(route => route.id === id)
  }
  
  function saveInspectionRoute(routeData: InspectionRoute | InspectionRouteFormData) {
    const route: InspectionRoute = 'id' in routeData ? routeData : {
      id: `route-${Date.now()}`,
      name: routeData.name,
      code: routeData.code,
      description: routeData.description,
      mapId: routeData.mapId,
      waypointIds: routeData.waypointIds,
      inspectionPointIds: routeData.inspectionPointIds,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    MockService.saveInspectionRoute(route)
    fetchAllInspectionRoutes()
    return route
  }
  
  function deleteInspectionRoute(id: string) {
    MockService.deleteInspectionRoute(id)
    fetchAllInspectionRoutes()
  }
  
  // 巡检设备相关
  function fetchAllInspectionDevices() {
    loading.value = true
    try {
      inspectionDevices.value = MockService.getInspectionDevices()
    } finally {
      loading.value = false
    }
  }
  
  function getInspectionDevicesByInspectionPointId(inspectionPointId: string): InspectionDevice[] {
    return MockService.getInspectionDevicesByInspectionPointId(inspectionPointId)
  }
  
  function saveInspectionDevice(deviceData: InspectionDevice | InspectionDeviceFormData) {
    const device: InspectionDevice = 'id' in deviceData ? deviceData : {
      id: `device-${Date.now()}`,
      inspectionPointId: deviceData.inspectionPointId,
      name: deviceData.name,
      code: deviceData.code,
      deviceNo: deviceData.deviceNo,
      deviceClassification: deviceData.deviceClassification,
      specModel: deviceData.specModel,
      owner: deviceData.owner,
      manufacturer: deviceData.manufacturer,
      expiryDate: deviceData.expiryDate,
      usageCertificateNo: deviceData.usageCertificateNo,
      authorityCertificateNo: deviceData.authorityCertificateNo,
      commissioningDate: deviceData.commissioningDate,
      lastInspectionTime: deviceData.lastInspectionTime,
      nextInspectionTime: deviceData.nextInspectionTime,
      expiryWarningDays: deviceData.expiryWarningDays,
      inspectionPostName: deviceData.inspectionPostName,
      mapCoordinate: deviceData.mapCoordinate,
      areaId: deviceData.areaId,
      areaName: deviceData.areaName,
      departmentName: deviceData.departmentName,
      storageLocation: deviceData.storageLocation,
      outDate: deviceData.outDate,
      factoryNo: deviceData.factoryNo,
      issueDate: deviceData.issueDate,
      systemName: deviceData.systemName,
      detectionCycle: deviceData.detectionCycle,
      lastInspectionConclusion: deviceData.lastInspectionConclusion,
      inspectionWarningDays: deviceData.inspectionWarningDays,
      deviceCategory: deviceData.deviceCategory,
      custodianPostName: deviceData.custodianPostName,
      nfcId: deviceData.nfcId,
      type: deviceData.type,
      sequence: deviceData.sequence,
      ptzPreset: deviceData.ptzPreset,
      referenceImageUrl: deviceData.referenceImageUrl,
      status: deviceData.status || DeviceStatus.ACTIVE,
      checkItems: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    MockService.saveInspectionDevice(device)
    fetchAllInspectionDevices()
    return device
  }
  
  function deleteInspectionDevice(id: string) {
    MockService.deleteInspectionDevice(id)
    fetchAllInspectionDevices()
  }
  
  // 设备检测项相关
  function fetchAllInspectionDeviceCheckItems() {
    loading.value = true
    try {
      inspectionDeviceCheckItems.value = MockService.getInspectionDeviceCheckItems()
    } finally {
      loading.value = false
    }
  }
  
  function getInspectionDeviceCheckItemsByDeviceId(deviceId: string): InspectionDeviceCheckItem[] {
    return MockService.getInspectionDeviceCheckItemsByDeviceId(deviceId)
  }
  
  function saveInspectionDeviceCheckItem(itemData: InspectionDeviceCheckItem | InspectionDeviceCheckItemFormData) {
    const item: InspectionDeviceCheckItem = 'id' in itemData ? itemData : {
      id: `check-${Date.now()}`,
      deviceId: itemData.deviceId,
      name: itemData.name,
      code: itemData.code,
      checkType: itemData.checkType || 'threshold',
      unit: itemData.unit,
      threshold: itemData.threshold,
      visionMapping: itemData.visionMapping,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    MockService.saveInspectionDeviceCheckItem(item)
    fetchAllInspectionDeviceCheckItems()
    return item
  }
  
  function deleteInspectionDeviceCheckItem(id: string) {
    MockService.deleteInspectionDeviceCheckItem(id)
    fetchAllInspectionDeviceCheckItems()
  }

  // 巡检计划相关
  function fetchAllInspectionPlans() {
    loading.value = true
    try {
      inspectionPlans.value = MockService.getInspectionPlans()
    } finally {
      loading.value = false
    }
  }

  function getInspectionPlanById(id: string): InspectionPlan | undefined {
    return inspectionPlans.value.find(plan => plan.id === id)
  }

  function saveInspectionPlan(planData: InspectionPlan) {
    MockService.saveInspectionPlan(planData)
    fetchAllInspectionPlans()
    return planData
  }

  function deleteInspectionPlan(id: string) {
    MockService.deleteInspectionPlan(id)
    fetchAllInspectionPlans()
  }
  
  return {
    inspectionPoints,
    monitorPoints,
    metrics,
    tasks,
    inspectionMaps,
    maps: inspectionMaps,
    waypoints,
    waypointEdges,
    inspectionRoutes,
    inspectionDevices,
    inspectionDeviceCheckItems,
    inspectionPlans,
    loading,
    initialize,
    fetchAllInspectionPoints,
    getInspectionPointById,
    saveInspectionPoint,
    deleteInspectionPoint,
    fetchAllMonitorPoints,
    getMonitorPointsByInspectionPointId,
    saveMonitorPoint,
    deleteMonitorPoint,
    fetchAllMetrics,
    getMetricsByMonitorPointId,
    saveMetric,
    deleteMetric,
    fetchAllTasks,
    getTaskById,
    saveTask,
    deleteTask,
    getTaskResultsByRobotId,
    getInspectionTaskResultsByTaskId,
    fetchAllInspectionMaps,
    getInspectionMapById,
    saveInspectionMap,
    deleteInspectionMap,
    fetchAllWaypoints,
    getWaypointsByMapId,
    saveWaypoint,
    deleteWaypoint,
    fetchAllWaypointEdges,
    saveWaypointEdge,
    deleteWaypointEdge,
    fetchAllInspectionRoutes,
    getInspectionRouteById,
    saveInspectionRoute,
    deleteInspectionRoute,
    fetchAllInspectionDevices,
    getInspectionDevicesByInspectionPointId,
    saveInspectionDevice,
    deleteInspectionDevice,
    fetchAllInspectionDeviceCheckItems,
    getInspectionDeviceCheckItemsByDeviceId,
    saveInspectionDeviceCheckItem,
    deleteInspectionDeviceCheckItem,
    fetchAllInspectionPlans,
    getInspectionPlanById,
    saveInspectionPlan,
    deleteInspectionPlan
  }
})
