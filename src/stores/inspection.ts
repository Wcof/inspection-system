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
  StandardComponent,
  CalibrationStatus,
  InspectionPointType,
  PositionSource,
  DeviceStatus,
  InspectionTaskInstanceStatus,
  InspectionPlan,
  InspectionTaskResult,
  InspectionTaskSnapshot
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
  const standardComponents = ref<StandardComponent[]>([])
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
    fetchAllStandardComponents()
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

  function getInspectionTaskSnapshotByTaskId(taskId: string): InspectionTaskSnapshot | undefined {
    return MockService.getInspectionTaskSnapshotByTaskId(taskId)
  }

  function ensureTaskExecutionData(taskId: string): InspectionTaskSnapshot | undefined {
    const task = getTaskById(taskId)
    if (!task) return undefined
    const existed = MockService.getInspectionTaskSnapshotByTaskId(taskId)
    if (existed && MockService.getInspectionTaskResultsByTaskId(taskId).length) return existed

    const taskPoints = (task.inspectionPointIds || [])
      .map(id => getInspectionPointById(id))
      .filter(Boolean) as InspectionPoint[]
    const createdAt = new Date().toISOString()
    const parkingRoute: NonNullable<InspectionTaskSnapshot['parkingRoute']> = []
    const collectionActions: NonNullable<InspectionTaskSnapshot['collectionActions']> = []
    let parkingSequence = 1

    taskPoints.forEach((point) => {
      const parkingPoints = point.parkingPoints?.length ? point.parkingPoints : []
      parkingPoints.forEach((parking) => {
        const arrivalStatus = parking.constraint.reachable ? 'arrived' : 'unreachable'
        parkingRoute.push({
          id: `${task.id}-${parking.id}`,
          inspectionPointId: point.id,
          inspectionPointName: point.name,
          parkingPointId: parking.id,
          parkingPointName: parking.name,
          sequence: parkingSequence++,
          position: parking.position,
          arrivalStatus,
          failureReason: arrivalStatus === 'arrived' ? undefined : '停车点不可达'
        })

        parking.collectionPoses.forEach((pose) => {
          const devices = inspectionDevices.value.filter(device => device.inspectionPointId === point.id)
          const configs = devices.flatMap(device => device.objectDetectionConfigs || [])
          const config = configs.find(item => !item.collectionPoseId || item.collectionPoseId === pose.id)
          collectionActions.push({
            id: `${task.id}-${pose.id}-${config?.ruleId || 'default'}`,
            inspectionPointId: point.id,
            pointName: point.name,
            parkingPointId: parking.id,
            parkingPointName: parking.name,
            collectionPoseId: pose.id,
            collectionAction: `${pose.targetName} / ${pose.method}`,
            targetObject: config?.subjectName || pose.targetName,
            ruleId: config?.ruleId,
            ruleName: config?.ruleId || '默认外观检测',
            requiredCoverage: config?.requiredCoverage ?? true
          })
        })
      })
    })

    const snapshot: InspectionTaskSnapshot = {
      id: `snapshot-${task.id}`,
      taskId: task.id,
      route: {
        id: task.routeId,
        name: task.routeId || '任务路线',
        waypointIds: [],
        inspectionPointIds: task.inspectionPointIds
      },
      points: taskPoints.map((point, index) => ({
        id: point.id,
        name: point.name,
        sequence: index + 1,
        mapPosition: point.mapPosition || { x: 0, y: 0, yaw: 0 },
        stayDurationSec: point.stayDurationSec
      })),
      devices: inspectionDevices.value
        .filter(device => task.inspectionPointIds.includes(device.inspectionPointId))
        .map(device => ({
          id: device.id,
          inspectionPointId: device.inspectionPointId,
          name: device.name,
          sequence: device.sequence || 1,
          ptzPreset: device.ptzPreset,
          referenceImageUrl: device.referenceImageUrl,
          referenceImageVersion: device.referenceImageVersion
        })),
      parkingRoute,
      collectionActions,
      createdAt
    }
    MockService.saveInspectionTaskSnapshot(snapshot)

    const statuses: InspectionTaskResult['status'][] = ['normal', 'warning', 'alarm', 'critical_alarm', 'uninspectable', 'blocked', 'bad_angle', 'target_missing', 'unreadable', 'not_arrived']
    collectionActions.forEach((action, index) => {
      const status = statuses[index % statuses.length]
      const sampledAt = new Date(Date.now() - index * 6 * 60 * 1000).toISOString()
      MockService.saveInspectionTaskResult({
        id: `result-${action.id}`,
        taskId: task.id,
        inspectionPointId: action.inspectionPointId,
        parkingPointId: action.parkingPointId,
        collectionPoseId: action.collectionPoseId,
        collectionActionId: action.id,
        subjectName: action.targetObject,
        value: ['normal', 'warning', 'alarm', 'critical_alarm'].includes(status) ? `${(10 + index * 1.7).toFixed(1)}` : status,
        status,
        qualityStatus: (status === 'uninspectable' ? 'uninspectable' : status === 'monitor_failure' ? 'monitor_failure' : status === 'normal' || status === 'warning' || status === 'alarm' || status === 'critical_alarm' ? 'normal' : status) as InspectionTaskResult['qualityStatus'],
        evidence: {
          opticalImageUrl: '/src/设备.png',
          thermalImageUrl: '/src/车间.png',
          sampledAt,
          robotPose: `X${120 + index * 2}, Y${80 + index}, Yaw${(index * 17) % 360}°`,
          recognizedValue: String(status),
          confidence: ['normal', 'warning', 'alarm', 'critical_alarm'].includes(status) ? 0.91 : 0.48,
          ruleVersion: action.ruleId ? `${action.ruleId}-V1` : 'DEFAULT-V1',
          manualReviewConclusion: ['normal', 'warning', 'alarm', 'critical_alarm'].includes(status) ? '待抽检' : '需人工复核'
        },
        recordedAt: sampledAt,
        createdAt: new Date(sampledAt),
        updatedAt: new Date(sampledAt)
      })
    })
    return snapshot
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
      assetComponents: deviceData.assetComponents,
      connectionObjects: deviceData.connectionObjects,
      objectDetectionConfigs: deviceData.objectDetectionConfigs,
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

  // 标准部件库
  function fetchAllStandardComponents() {
    loading.value = true
    try {
      standardComponents.value = MockService.getStandardComponents()
    } finally {
      loading.value = false
    }
  }

  function saveStandardComponent(component: StandardComponent) {
    MockService.saveStandardComponent(component)
    fetchAllStandardComponents()
  }

  function deleteStandardComponent(id: string) {
    MockService.deleteStandardComponent(id)
    fetchAllStandardComponents()
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
    standardComponents,
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
    getInspectionTaskSnapshotByTaskId,
    ensureTaskExecutionData,
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
    fetchAllStandardComponents,
    saveStandardComponent,
    deleteStandardComponent,
    fetchAllInspectionPlans,
    getInspectionPlanById,
    saveInspectionPlan,
    deleteInspectionPlan
  }
})
