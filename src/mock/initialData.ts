import { Robot, RobotStatus, ExceptionStrategy } from '@/types'
import { 
  InspectionPoint, 
  MonitorPoint, 
  Metric, 
  InspectionTask, 
  InspectionTaskType, 
  InspectionTaskInstanceStatus,
  CalibrationStatus,
  PositionSource,
  DeviceStatus,
  InspectionMap,
  Waypoint,
  WaypointEdge,
  InspectionRoute,
  InspectionDevice,
  Installation,
  FacilityComponent,
  InspectionDeviceCheckItem,
  InspectionPlan,
  InspectionPlanStatus,
  ScheduleType,
  InspectionPointType,
  StandardComponent
} from '@/types/inspection'

const mapImageUrl = new URL('../地图.png', import.meta.url).href
const workshopImageUrl = new URL('../车间.png', import.meta.url).href
const deviceImageUrl = new URL('../设备.png', import.meta.url).href

// 机器人 Mock 数据
export const initialRobots: Robot[] = [
  {
    id: 'robot-001',
    name: '巡检机器人-01',
    serialNumber: 'RBT-2024-001',
    model: 'Patrol-X1',
    status: RobotStatus.ONLINE,
    batteryLevel: 85,
    batteryThreshold: { low: 20, critical: 10 },
    lastOnlineTime: new Date(),
    connectionConfig: {
      protocol: 'ws',
      host: 'localhost',
      port: 8080,
      reconnectInterval: 5000,
      heartbeatInterval: 30000,
      timeout: 10000,
      maxReconnectAttempts: 5
    },
    exceptionStrategy: {
      lowBattery: ExceptionStrategy.RETURN_TO_BASE,
      signalLost: ExceptionStrategy.WAIT_AND_RESUME,
      robotFailure: ExceptionStrategy.RETURN_TO_BASE,
      signalLostRetryCount: 3,
      retryInterval: 30,
      retryTimes: 3
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'robot-002',
    name: '巡检机器人-02',
    serialNumber: 'RBT-2024-002',
    model: 'Patrol-X1',
    status: RobotStatus.CHARGING,
    batteryLevel: 45,
    batteryThreshold: { low: 20, critical: 10 },
    lastOnlineTime: new Date(),
    connectionConfig: {
      protocol: 'ws',
      host: 'localhost',
      port: 8080,
      reconnectInterval: 5000,
      heartbeatInterval: 30000,
      timeout: 10000,
      maxReconnectAttempts: 5
    },
    exceptionStrategy: {
      lowBattery: ExceptionStrategy.RETURN_TO_BASE,
      signalLost: ExceptionStrategy.WAIT_AND_RESUME,
      robotFailure: ExceptionStrategy.RETURN_TO_BASE,
      signalLostRetryCount: 3,
      retryInterval: 30,
      retryTimes: 3
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// 巡检点 Mock 数据
export const initialInspectionPoints: InspectionPoint[] = [
  {
    id: 'point-001',
    name: '反应釜车间巡检点',
    code: 'IP-A-001',
    pointType: InspectionPointType.FIXED,
    description: '[巡检点] A区反应釜车间巡检点',
    mapId: 'map-001',
    areaId: 'region-a',
    areaName: '反应区',
    previewImageUrl: workshopImageUrl,
    location: { longitude: 121.4737, latitude: 31.2304, altitude: 0 },
    mapPosition: { x: 100, y: 200, yaw: 0 },
    waypointId: 'wp-001',
    sequence: 1,
    calibrationStatus: CalibrationStatus.CALIBRATED,
    stayDurationSec: 30,
    monitorPoints: [],
    isCritical: true,
    exceptionStrategy: {
      onFailure: ExceptionStrategy.SKIP,
      retryCount: 3,
      skipToNext: true
    },
    positionSource: PositionSource.MAP_PICK,
    lastMapPickAt: new Date(),
    calibratedAt: new Date(),
    updatedBy: '系统管理员',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'point-002',
    name: '储罐区巡检点',
    code: 'IP-B-001',
    pointType: InspectionPointType.FIXED,
    description: '[巡检点] B区储罐区巡检点',
    mapId: 'map-001',
    areaId: 'region-b',
    areaName: '储罐区',
    previewImageUrl: workshopImageUrl,
    location: { longitude: 121.4740, latitude: 31.2307, altitude: 0 },
    mapPosition: { x: 300, y: 400, yaw: 90 },
    waypointId: 'wp-002',
    sequence: 2,
    calibrationStatus: CalibrationStatus.CALIBRATED,
    stayDurationSec: 25,
    monitorPoints: [],
    isCritical: false,
    exceptionStrategy: {
      onFailure: ExceptionStrategy.SKIP,
      retryCount: 3,
      skipToNext: true
    },
    positionSource: PositionSource.MAP_PICK,
    lastMapPickAt: new Date(),
    calibratedAt: new Date(),
    updatedBy: '系统管理员',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// 巡检地图 Mock 数据
export const initialInspectionMaps: InspectionMap[] = [
  {
    id: 'map-001',
    name: '主厂房一层',
    description: '主厂房一层平面地图',
    imageUrl: mapImageUrl,
    settings: {
      scale: 1.0,
      origin: { x: 0, y: 0 },
      rotation: 0
    },
    regions: [
      { id: 'region-a', name: '反应区', color: '#1677ff', x: 60, y: 120, width: 220, height: 160 },
      { id: 'region-b', name: '储罐区', color: '#52c41a', x: 290, y: 300, width: 240, height: 170 },
      { id: 'region-c', name: '管廊区', color: '#fa8c16', x: 560, y: 160, width: 200, height: 180 }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// 途径点 Mock 数据
export const initialWaypoints: Waypoint[] = [
  {
    id: 'wp-001',
    mapId: 'map-001',
    name: '起点',
    position: { x: 50, y: 50, yaw: 0 },
    description: '机器人基站',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'wp-002',
    mapId: 'map-001',
    name: 'A区反应釜',
    position: { x: 100, y: 200, yaw: 0 },
    description: '反应釜车间入口',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'wp-003',
    mapId: 'map-001',
    name: 'B区储罐',
    position: { x: 300, y: 400, yaw: 90 },
    description: '储罐区入口',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// 途径点连线 Mock 数据
export const initialWaypointEdges: WaypointEdge[] = [
  {
    id: 'edge-001',
    fromWaypointId: 'wp-001',
    toWaypointId: 'wp-002',
    distance: 150,
    estimatedTimeSec: 30,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'edge-002',
    fromWaypointId: 'wp-002',
    toWaypointId: 'wp-003',
    distance: 250,
    estimatedTimeSec: 45,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// 巡检路线 Mock 数据
export const initialInspectionRoutes: InspectionRoute[] = [
  {
    id: 'route-001',
    name: '日常巡检路线',
    code: 'ROUTE-DAILY-001',
    description: '主厂房日常巡检路线',
    mapId: 'map-001',
    waypointIds: ['wp-001', 'wp-002', 'wp-003'],
    inspectionPointIds: ['point-001', 'point-002'],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// 巡检设备 Mock 数据
export const initialInspectionDevices: InspectionDevice[] = [
  {
    id: 'device-001',
    inspectionPointId: 'point-001',
    name: '1号反应釜',
    code: 'FAC-RX-001',
    deviceNo: 'FAC-RX-001',
    deviceClassification: '反应设备',
    facilityPositionNo: 'RX-101',
    specModel: 'TM-900',
    owner: '张工',
    manufacturer: '华南仪表',
    expiryDate: '2028-12-31',
    usageCertificateNo: 'UC-0001',
    authorityCertificateNo: 'AUTH-0001',
    commissioningDate: '2026-01-10',
    lastInspectionTime: '2026-04-15',
    nextInspectionTime: '2026-05-15',
    expiryWarningDays: 60,
    inspectionPostName: '巡检一岗',
    mapCoordinate: '121.4737,31.2304',
    areaId: 'region-a',
    areaName: '反应区',
    installationId: 'inst-001',
    installationName: '反应装置',
    departmentName: '生产一部',
    storageLocation: 'A区反应釜区',
    outDate: '2025-11-20',
    factoryNo: 'F-001-889',
    issueDate: '2025-12-03',
    systemName: '反应装置主体',
    detectionCycle: '每30天',
    lastInspectionConclusion: '合格',
    inspectionWarningDays: 10,
    facilityKind: 'normal',
    deviceCategory: '普通设施',
    custodianPostName: '设备管理员岗',
    nfcId: 'NFC-DEV-0001',
    type: '反应釜',
    sequence: 1,
    ptzPreset: { x: 10, y: 5, z: 1.5 },
    referenceImageUrl: deviceImageUrl,
    referenceImageVersion: 'v1',
    status: DeviceStatus.ACTIVE,
    inspectionFrequency: { value: 4, unit: 'hour' },
    executionCycle: { startDate: '2026-01-01', endDate: '2026-12-31' },
    executionWindow: { startTime: '08:00', endTime: '18:00' },
    checkItems: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'device-002',
    inspectionPointId: 'point-001',
    name: '反应进料管线',
    code: 'PIPE-RX-IN-001',
    deviceNo: 'PIPE-RX-IN-001',
    deviceClassification: '工艺管道',
    facilityPositionNo: 'RX-P-101',
    owner: '李工',
    areaId: 'region-a',
    areaName: '反应区',
    installationId: 'inst-001',
    installationName: '反应装置',
    facilityKind: 'pipeline',
    deviceCategory: '管道类设施',
    type: '工艺管线',
    sequence: 2,
    ptzPreset: { x: 12, y: 5, z: 1.5 },
    referenceImageUrl: deviceImageUrl,
    status: DeviceStatus.ACTIVE,
    inspectionFrequency: { value: 6, unit: 'hour' },
    executionCycle: { startDate: '2026-01-01', endDate: '2026-12-31' },
    executionWindow: { startTime: '08:00', endTime: '20:00' },
    checkItems: [],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'device-003',
    inspectionPointId: 'point-002',
    name: '储罐出料管线',
    code: 'PIPE-TK-OUT-001',
    deviceNo: 'PIPE-TK-OUT-001',
    deviceClassification: '储运管道',
    facilityPositionNo: 'TK-P-201',
    owner: '王工',
    areaId: 'region-b',
    areaName: '储罐区',
    installationId: 'inst-002',
    installationName: '储罐装置',
    facilityKind: 'pipeline',
    deviceCategory: '管道类设施',
    type: '储运管线',
    sequence: 1,
    ptzPreset: { x: 20, y: 10, z: 2.0 },
    referenceImageUrl: deviceImageUrl,
    status: DeviceStatus.ACTIVE,
    inspectionFrequency: { value: 2, unit: 'hour' },
    executionCycle: { startDate: '2026-01-01', endDate: '2026-12-31' },
    executionWindow: { startTime: '00:00', endTime: '23:59' },
    checkItems: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export const initialInstallations: Installation[] = [
  {
    id: 'inst-001',
    name: '反应装置',
    code: 'INST-RX-001',
    installationPositionNo: 'RX-UNIT-01',
    areaId: 'region-a',
    areaName: '反应区',
    installationType: '反应系统',
    status: DeviceStatus.ACTIVE,
    remark: '核心反应单元',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'inst-002',
    name: '储罐装置',
    code: 'INST-TK-001',
    installationPositionNo: 'TK-UNIT-01',
    areaId: 'region-b',
    areaName: '储罐区',
    installationType: '储运系统',
    status: DeviceStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'inst-003',
    name: '管廊装置',
    code: 'INST-PL-001',
    installationPositionNo: 'PL-UNIT-01',
    areaId: 'region-c',
    areaName: '管廊区',
    installationType: '输送系统',
    status: DeviceStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export const initialFacilityComponents: FacilityComponent[] = [
  {
    id: 'fc-001',
    name: '1号反应釜压力表',
    componentType: 'meter',
    componentNo: 'COMP-MTR-001',
    componentPositionNo: 'R1-PG-01',
    areaId: 'region-a',
    areaName: '反应区',
    installationId: 'inst-001',
    installationName: '反应装置',
    facilityId: 'device-001',
    facilityName: '1号反应釜',
    ruleIds: ['dic-001', 'dic-002'],
    status: DeviceStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'fc-002',
    name: '进料阀门',
    componentType: 'valve',
    componentNo: 'COMP-VLV-001',
    componentPositionNo: 'R1-V-01',
    areaId: 'region-a',
    areaName: '反应区',
    installationId: 'inst-001',
    installationName: '反应装置',
    facilityId: 'device-002',
    facilityName: '反应进料管线',
    ruleIds: ['dic-003'],
    status: DeviceStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'fc-003',
    name: '储罐液位计传感器',
    componentType: 'sensor',
    componentNo: 'COMP-SEN-001',
    componentPositionNo: 'TK-L-01',
    areaId: 'region-b',
    areaName: '储罐区',
    installationId: 'inst-002',
    installationName: '储罐装置',
    facilityId: 'device-003',
    facilityName: '储罐出料管线',
    ruleIds: ['dic-001'],
    status: DeviceStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// 设备检测项 Mock 数据
export const initialInspectionDeviceCheckItems: InspectionDeviceCheckItem[] = [
  {
    id: 'check-001',
    deviceId: 'device-001',
    name: '温度',
    code: 'CHECK-TEMP-001',
    checkType: 'vision',
    priority: 'primary',
    inspectionFrequency: { value: 4, unit: 'hour' },
    executionWindow: { startTime: '08:00', endTime: '18:00' },
    unit: '℃',
    threshold: { min: 0, max: 200, warning: 150, critical: 180 },
    visionMapping: {
      sourceType: 'system',
      customImageUrl: '',
      recognitionMode: 'ocr'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'check-002',
    deviceId: 'device-002',
    name: '压力',
    code: 'CHECK-PRESS-001',
    checkType: 'vision',
    priority: 'secondary',
    inspectionFrequency: { value: 6, unit: 'hour' },
    executionWindow: { startTime: '08:00', endTime: '20:00' },
    unit: 'MPa',
    threshold: { min: 0, max: 10, warning: 8, critical: 9 },
    visionMapping: {
      sourceType: 'manual',
      customImageUrl: deviceImageUrl,
      recognitionMode: 'ai'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'check-003',
    deviceId: 'device-003',
    name: '液位',
    code: 'CHECK-LEVEL-001',
    checkType: 'vision',
    priority: 'primary',
    inspectionFrequency: { value: 2, unit: 'hour' },
    executionWindow: { startTime: '00:00', endTime: '23:59' },
    unit: 'm',
    threshold: { min: 0, max: 10, warning: 8, critical: 9 },
    visionMapping: {
      sourceType: 'system',
      customImageUrl: '',
      recognitionMode: 'ocr'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// 监测点（仪表设备）Mock 数据
export const initialMonitorPoints: MonitorPoint[] = [
  {
    id: 'mp-001',
    name: '1号反应釜温度计',
    code: 'MP-TEMP-001',
    inspectionPointId: 'point-001',
    deviceType: '温度计',
    metrics: [],
    position: { x: 10, y: 5, z: 1.5 },
    stayDuration: 30,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mp-002',
    name: '1号反应釜压力表',
    code: 'MP-PRESS-001',
    inspectionPointId: 'point-001',
    deviceType: '压力表',
    metrics: [],
    position: { x: 12, y: 5, z: 1.5 },
    stayDuration: 20,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mp-003',
    name: '进水阀门',
    code: 'MP-VALVE-001',
    inspectionPointId: 'point-001',
    deviceType: '阀门',
    metrics: [],
    position: { x: 15, y: 8, z: 0.5 },
    stayDuration: 15,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mp-004',
    name: '储罐液位计',
    code: 'MP-LEVEL-001',
    inspectionPointId: 'point-002',
    deviceType: '液位计',
    metrics: [],
    position: { x: 20, y: 10, z: 2.0 },
    stayDuration: 25,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'mp-005',
    name: '可燃气体检测仪',
    code: 'MP-GAS-001',
    inspectionPointId: 'point-002',
    deviceType: '气体检测仪',
    metrics: [],
    position: { x: 22, y: 12, z: 1.0 },
    stayDuration: 20,
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// 监测指标 Mock 数据
export const initialMetrics: Metric[] = [
  // 温度计指标
  {
    id: 'metric-001',
    name: '温度',
    code: 'M-TEMP-001',
    unit: '℃',
    threshold: { min: 0, max: 200, warning: 150, critical: 180 },
    monitorPointId: 'mp-001',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // 压力表指标
  {
    id: 'metric-002',
    name: '压力',
    code: 'M-PRESS-001',
    unit: 'MPa',
    threshold: { min: 0, max: 10, warning: 8, critical: 9 },
    monitorPointId: 'mp-002',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // 阀门指标
  {
    id: 'metric-003',
    name: '开度',
    code: 'M-VALVE-001',
    unit: '%',
    threshold: { min: 0, max: 100 },
    monitorPointId: 'mp-003',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'metric-004',
    name: '状态',
    code: 'M-VALVE-002',
    unit: '',
    threshold: { min: 0, max: 1 },
    monitorPointId: 'mp-003',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // 液位计指标
  {
    id: 'metric-005',
    name: '液位',
    code: 'M-LEVEL-001',
    unit: 'm',
    threshold: { min: 0, max: 10, warning: 8, critical: 9 },
    monitorPointId: 'mp-004',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  // 气体检测仪指标
  {
    id: 'metric-006',
    name: '甲烷浓度',
    code: 'M-GAS-001',
    unit: '%LEL',
    threshold: { min: 0, max: 100, warning: 25, critical: 50 },
    monitorPointId: 'mp-005',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'metric-007',
    name: '硫化氢浓度',
    code: 'M-GAS-002',
    unit: 'ppm',
    threshold: { min: 0, max: 100, warning: 10, critical: 20 },
    monitorPointId: 'mp-005',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// 巡检任务 Mock 数据
export const initialTasks: InspectionTask[] = [
  {
    id: 'task-001',
    planId: 'plan-001',
    name: '每日例行巡检',
    code: 'TASK-2024-001',
    robotId: 'robot-001',
    routeId: 'route-001',
    type: InspectionTaskType.POINT,
    status: InspectionTaskInstanceStatus.PENDING,
    inspectionPointIds: ['point-001', 'point-002'],
    currentInspectionPointIndex: 0,
    plannedExecuteAt: new Date().toISOString(),
    schedule: {
      startTime: new Date(),
      endTime: new Date(Date.now() + 20 * 60 * 1000)
    },
    config: {
      autoStart: false,
      notifyOnComplete: true,
      notifyOnError: true,
      autoResumeAfterInterrupt: false
    },
    exceptionStrategy: {
      inspectionPointFailure: ExceptionStrategy.SKIP,
      robotFailure: ExceptionStrategy.RETURN_TO_BASE,
      lowBattery: ExceptionStrategy.RETURN_TO_BASE,
      signalLost: ExceptionStrategy.WAIT_AND_RESUME,
      timeout: ExceptionStrategy.SKIP,
      maxRetryCount: 3,
      retryInterval: 30
    },
    exceptionLog: [],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// 巡检计划 Mock 数据
export const initialInspectionPlans: InspectionPlan[] = [
  {
    id: 'plan-001',
    name: '每日早班巡检',
    code: 'PLAN-DAILY-MORNING',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    robotId: 'robot-001',
    mapId: 'map-001',
    routeId: 'route-001',
    pointIds: ['point-001', 'point-002'],
    pointOrders: [
      { pointId: 'point-001', order: 1 },
      { pointId: 'point-002', order: 2 }
    ],
    status: InspectionPlanStatus.ACTIVE,
    type: InspectionTaskType.POINT,
    inspectionPointIds: ['point-001', 'point-002'],
    schedule: {
      type: ScheduleType.WEEKLY,
      daysOfWeek: [1, 2, 3, 4, 5],
      time: '08:00'
    },
    config: {
      autoStart: true,
      notifyOnComplete: true,
      notifyOnError: true,
      autoResumeAfterInterrupt: true
    },
    exceptionStrategy: {
      inspectionPointFailure: ExceptionStrategy.SKIP,
      robotFailure: ExceptionStrategy.RETURN_TO_BASE,
      lowBattery: ExceptionStrategy.RETURN_TO_BASE,
      signalLost: ExceptionStrategy.WAIT_AND_RESUME,
      timeout: ExceptionStrategy.SKIP,
      maxRetryCount: 3,
      retryInterval: 30
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'plan-002',
    name: '每周安全巡检',
    code: 'PLAN-WEEKLY-SAFETY',
    startTime: new Date().toISOString(),
    endTime: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    robotId: 'robot-002',
    mapId: 'map-001',
    routeId: 'route-001',
    pointIds: ['point-001', 'point-002'],
    pointOrders: [
      { pointId: 'point-001', order: 1 },
      { pointId: 'point-002', order: 2 }
    ],
    status: InspectionPlanStatus.ACTIVE,
    type: InspectionTaskType.POINT,
    inspectionPointIds: ['point-001', 'point-002'],
    schedule: {
      type: ScheduleType.WEEKLY,
      daysOfWeek: [6],
      time: '14:00'
    },
    config: {
      autoStart: true,
      notifyOnComplete: true,
      notifyOnError: true,
      autoResumeAfterInterrupt: false
    },
    exceptionStrategy: {
      inspectionPointFailure: ExceptionStrategy.SKIP,
      robotFailure: ExceptionStrategy.RETURN_TO_BASE,
      lowBattery: ExceptionStrategy.RETURN_TO_BASE,
      signalLost: ExceptionStrategy.WAIT_AND_RESUME,
      timeout: ExceptionStrategy.SKIP,
      maxRetryCount: 3,
      retryInterval: 30
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

export const initialStandardComponents: StandardComponent[] = [
  { id: 'std-comp-valve', name: '阀门', type: 'valve', description: '流体开关控制部件', createdAt: new Date(), updatedAt: new Date() },
  { id: 'std-comp-pressure-gauge', name: '压力表', type: 'meter', description: '压力数值检测部件', createdAt: new Date(), updatedAt: new Date() },
  { id: 'std-comp-temperature-gauge', name: '温度表', type: 'temperature_gauge', description: '温度数值检测部件', createdAt: new Date(), updatedAt: new Date() },
  { id: 'std-comp-flange', name: '法兰', type: 'flange', description: '管路连接密封部件', createdAt: new Date(), updatedAt: new Date() },
  { id: 'std-comp-pipe', name: '管体', type: 'pipe', description: '流体输送主体', createdAt: new Date(), updatedAt: new Date() },
  { id: 'std-comp-motor', name: '电机', type: 'motor', description: '驱动执行部件', createdAt: new Date(), updatedAt: new Date() },
  { id: 'std-comp-cable', name: '电缆', type: 'cable', description: '电力/信号连接线缆', createdAt: new Date(), updatedAt: new Date() },
  { id: 'std-comp-joint', name: '接头', type: 'joint', description: '电气或管路连接节点', createdAt: new Date(), updatedAt: new Date() },
  { id: 'std-comp-sensor', name: '传感器', type: 'sensor', description: '监测采集传感器部件', createdAt: new Date(), updatedAt: new Date() },
  { id: 'std-comp-screw', name: '螺杆', type: 'screw', description: '紧固传动类部件', createdAt: new Date(), updatedAt: new Date() }
]
