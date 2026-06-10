import { Robot, RobotStatus, ExceptionStrategy } from '@/types'
import {
  InspectionPoint,
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
  StandardComponent,
  InspectedAssetComponent
} from '@/types/inspection'
import type { RoadNode, RoadEdge, RoadSegment, Junction, NavigationPoint, NoGoZone } from '@/types/road-network'

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
    manufacturer: '极客光年智能装备',
    explosionProofCert: 'CNEx26.2045X',
    explosionProofLevel: 'Ex d IIC T4 Gb',
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
    versionInfo: {
      systemVersion: 'RobotOS v2.4',
      firmwareVersion: 'FW-3.2.1',
      hardwareVersion: 'HW-Rev.C',
      softwareVersion: 'APP-2.8.0',
      lastFirmwareUpdate: new Date('2026-05-15'),
      lastSoftwareUpdate: new Date('2026-06-01')
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'robot-002',
    name: '巡检机器人-02',
    serialNumber: 'RBT-2024-002',
    model: 'Patrol-X1',
    manufacturer: '极客光年智能装备',
    explosionProofCert: 'CNEx26.2046X',
    explosionProofLevel: 'Ex d IIC T4 Gb',
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
    versionInfo: {
      systemVersion: 'RobotOS v2.4',
      firmwareVersion: 'FW-3.2.0',
      hardwareVersion: 'HW-Rev.C',
      softwareVersion: 'APP-2.7.5',
      lastFirmwareUpdate: new Date('2026-04-20'),
      lastSoftwareUpdate: new Date('2026-05-28')
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
    waypointId: 'wp-002',
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
    waypointId: 'wp-003',
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
  },
  {
    id: 'point-003',
    name: '管廊区巡检点',
    code: 'IP-C-001',
    pointType: InspectionPointType.FIXED,
    description: '[巡检点] C区管廊巡检点',
    mapId: 'map-001',
    areaId: 'region-c',
    areaName: '管廊区',
    previewImageUrl: workshopImageUrl,
    location: { longitude: 121.4743, latitude: 31.2310, altitude: 0 },
    mapPosition: { x: 600, y: 250, yaw: 0 },
    waypointId: 'wp-006',
    sequence: 3,
    calibrationStatus: CalibrationStatus.CALIBRATED,
    stayDurationSec: 20,
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
  },
  {
    id: 'point-004',
    name: '储罐区等待点',
    code: 'IP-B-002',
    pointType: InspectionPointType.FIXED,
    description: '[巡检点] 储罐区中部等待巡检点',
    mapId: 'map-001',
    areaId: 'region-b',
    areaName: '储罐区',
    previewImageUrl: workshopImageUrl,
    location: { longitude: 121.4741, latitude: 31.2308, altitude: 0 },
    mapPosition: { x: 400, y: 350, yaw: 180 },
    waypointId: 'wp-008',
    sequence: 4,
    calibrationStatus: CalibrationStatus.CALIBRATED,
    stayDurationSec: 15,
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
  },
  // 充电站 Mock 数据
  {
    id: 'point-005',
    name: 'A区充电站',
    code: 'IC-A-001',
    pointType: InspectionPointType.FIXED,
    description: '[充电站] 反应区西侧充电站',
    mapId: 'map-001',
    areaId: 'region-a',
    areaName: '反应区',
    previewImageUrl: workshopImageUrl,
    location: { longitude: 121.4735, latitude: 31.2302, altitude: 0 },
    mapPosition: { x: 150, y: 100, yaw: 0 },
    waypointId: 'wp-001',
    sequence: 5,
    calibrationStatus: CalibrationStatus.CALIBRATED,
    stayDurationSec: 0,
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
  },
  {
    id: 'point-006',
    name: 'C区充电站',
    code: 'IC-C-001',
    pointType: InspectionPointType.FIXED,
    description: '[充电站] 管廊区东侧充电站',
    mapId: 'map-001',
    areaId: 'region-c',
    areaName: '管廊区',
    previewImageUrl: workshopImageUrl,
    location: { longitude: 121.4745, latitude: 31.2312, altitude: 0 },
    mapPosition: { x: 700, y: 500, yaw: 0 },
    waypointId: 'wp-009',
    sequence: 6,
    calibrationStatus: CalibrationStatus.CALIBRATED,
    stayDurationSec: 0,
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
  },
  // 停车点 Mock 数据
  {
    id: 'point-007',
    name: 'A区停车点',
    code: 'IPK-A-001',
    pointType: InspectionPointType.FIXED,
    description: '[停车点] 反应区北侧停车点',
    mapId: 'map-001',
    areaId: 'region-a',
    areaName: '反应区',
    previewImageUrl: workshopImageUrl,
    location: { longitude: 121.4736, latitude: 31.2305, altitude: 0 },
    mapPosition: { x: 200, y: 50, yaw: 0 },
    waypointId: 'wp-002',
    sequence: 7,
    calibrationStatus: CalibrationStatus.CALIBRATED,
    stayDurationSec: 0,
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
  },
  {
    id: 'point-008',
    name: 'B区停车点',
    code: 'IPK-B-001',
    pointType: InspectionPointType.FIXED,
    description: '[停车点] 储罐区南侧停车点',
    mapId: 'map-001',
    areaId: 'region-b',
    areaName: '储罐区',
    previewImageUrl: workshopImageUrl,
    location: { longitude: 121.4742, latitude: 31.2306, altitude: 0 },
    mapPosition: { x: 500, y: 550, yaw: 0 },
    waypointId: 'wp-003',
    sequence: 8,
    calibrationStatus: CalibrationStatus.CALIBRATED,
    stayDurationSec: 0,
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
      { id: 'region-a', name: '反应区', color: '#1677ff', x: 60, y: 120, width: 220, height: 160, code: 'RG-A', zoneType: 'normal', description: '反应釜车间及周边区域', responsiblePerson: '张工', contactPhone: '13800001001' },
      { id: 'region-b', name: '储罐区', color: '#52c41a', x: 290, y: 300, width: 240, height: 170, code: 'RG-B', zoneType: 'normal', description: '储罐及进出料管线区域', responsiblePerson: '李工', contactPhone: '13800001002' },
      { id: 'region-c', name: '管廊区', color: '#fa8c16', x: 560, y: 160, width: 200, height: 180, code: 'RG-C', zoneType: 'forbidden', description: '管廊检修区域，非授权禁止进入', responsiblePerson: '王工', contactPhone: '13800001003' }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// 途径点 Mock 数据（与路网节点对齐）
export const initialWaypoints: Waypoint[] = [
  {
    id: 'wp-001',
    mapId: 'map-001',
    name: '西入口',
    position: { x: 30, y: 200, yaw: 0 },
    description: '机器人基站 / 主厂房西入口（对应路网节点 rn-01）',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'wp-002',
    mapId: 'map-001',
    name: '反应区西',
    position: { x: 100, y: 200, yaw: 0 },
    description: '反应釜车间入口（对应路网节点 rn-02 / 巡检点 point-001）',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'wp-003',
    mapId: 'map-001',
    name: '中央路口',
    position: { x: 250, y: 200, yaw: 0 },
    description: '主厂房中央交叉路口（对应路网节点 rn-03 / 路口 junc-01）',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'wp-004',
    mapId: 'map-001',
    name: '储罐区北',
    position: { x: 400, y: 200, yaw: 0 },
    description: '储罐区北侧通道（对应路网节点 rn-04）',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'wp-005',
    mapId: 'map-001',
    name: '管廊区西',
    position: { x: 560, y: 200, yaw: 0 },
    description: '管廊区西侧入口（对应路网节点 rn-05）',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'wp-006',
    mapId: 'map-001',
    name: '管廊南',
    position: { x: 600, y: 250, yaw: 0 },
    description: '管廊区南侧巡检点（对应路网节点 rn-14 / 巡检点 point-003）',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'wp-007',
    mapId: 'map-001',
    name: '储罐区西',
    position: { x: 250, y: 350, yaw: 90 },
    description: '储罐区西侧通道（对应路网节点 rn-07）',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'wp-008',
    mapId: 'map-001',
    name: '储罐区中',
    position: { x: 400, y: 350, yaw: 180 },
    description: '储罐区中部等待点（对应路网节点 rn-08 / 巡检点 point-004）',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'wp-009',
    mapId: 'map-001',
    name: '储罐巡检点',
    position: { x: 300, y: 400, yaw: 90 },
    description: '储罐区巡检点（对应路网节点 rn-09 / 巡检点 point-002）',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'wp-010',
    mapId: 'map-001',
    name: '储罐区东',
    position: { x: 500, y: 400, yaw: 0 },
    description: '储罐区东侧通道（对应路网节点 rn-11）',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'wp-011',
    mapId: 'map-001',
    name: '管廊连接',
    position: { x: 600, y: 350, yaw: 0 },
    description: '管廊区连接点（对应路网节点 rn-13）',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'wp-012',
    mapId: 'map-001',
    name: '充电站',
    position: { x: 680, y: 350, yaw: 0 },
    description: '机器人充电站（对应路网节点 rn-12 / 导航点 nav-05）',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'wp-013',
    mapId: 'map-001',
    name: '东出口',
    position: { x: 750, y: 200, yaw: 0 },
    description: '主厂房东出口（对应路网节点 rn-06）',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'wp-014',
    mapId: 'map-001',
    name: '管廊北路口',
    position: { x: 560, y: 160, yaw: 0 },
    description: '管廊区北侧路口（对应路网节点 rn-15 / 路口 junc-02）',
    createdAt: new Date(),
    updatedAt: new Date()
  }
]

// 途径点连线 Mock 数据（与路网边对齐）
export const initialWaypointEdges: WaypointEdge[] = [
  // 东主路 rs-01: rn-01 → rn-02 → rn-03 → rn-04 → rn-05 → rn-06
  { id: 'edge-001', fromWaypointId: 'wp-001', toWaypointId: 'wp-002', distance: 70, estimatedTimeSec: 15, createdAt: new Date(), updatedAt: new Date() },
  { id: 'edge-002', fromWaypointId: 'wp-002', toWaypointId: 'wp-003', distance: 150, estimatedTimeSec: 30, createdAt: new Date(), updatedAt: new Date() },
  { id: 'edge-003', fromWaypointId: 'wp-003', toWaypointId: 'wp-004', distance: 150, estimatedTimeSec: 30, createdAt: new Date(), updatedAt: new Date() },
  { id: 'edge-004', fromWaypointId: 'wp-004', toWaypointId: 'wp-005', distance: 160, estimatedTimeSec: 32, createdAt: new Date(), updatedAt: new Date() },
  { id: 'edge-005', fromWaypointId: 'wp-005', toWaypointId: 'wp-014', distance: 40, estimatedTimeSec: 8, createdAt: new Date(), updatedAt: new Date() },
  { id: 'edge-006', fromWaypointId: 'wp-014', toWaypointId: 'wp-013', distance: 190, estimatedTimeSec: 38, createdAt: new Date(), updatedAt: new Date() },
  // 反应区-储罐区通道 rs-02: rn-03 → rn-07 → rn-09
  { id: 'edge-007', fromWaypointId: 'wp-003', toWaypointId: 'wp-007', distance: 150, estimatedTimeSec: 30, createdAt: new Date(), updatedAt: new Date() },
  { id: 'edge-008', fromWaypointId: 'wp-007', toWaypointId: 'wp-009', distance: 70, estimatedTimeSec: 14, createdAt: new Date(), updatedAt: new Date() },
  // 储罐区北通道 rs-03: rn-04 → rn-08
  { id: 'edge-009', fromWaypointId: 'wp-004', toWaypointId: 'wp-008', distance: 150, estimatedTimeSec: 30, createdAt: new Date(), updatedAt: new Date() },
  // 储罐区巡检环路 rs-04: rn-07 → rn-08 → rn-11 → rn-09
  { id: 'edge-010', fromWaypointId: 'wp-007', toWaypointId: 'wp-008', distance: 150, estimatedTimeSec: 30, createdAt: new Date(), updatedAt: new Date() },
  { id: 'edge-011', fromWaypointId: 'wp-008', toWaypointId: 'wp-010', distance: 100, estimatedTimeSec: 20, createdAt: new Date(), updatedAt: new Date() },
  { id: 'edge-012', fromWaypointId: 'wp-010', toWaypointId: 'wp-009', distance: 100, estimatedTimeSec: 20, createdAt: new Date(), updatedAt: new Date() },
  // 南侧通道 rs-05: rn-03 → rn-10
  { id: 'edge-013', fromWaypointId: 'wp-003', toWaypointId: 'wp-007', distance: 150, estimatedTimeSec: 30, createdAt: new Date(), updatedAt: new Date() },
  // 管廊巡检通道 rs-06: rn-15 → rn-14 → rn-13 → rn-12
  { id: 'edge-014', fromWaypointId: 'wp-014', toWaypointId: 'wp-006', distance: 90, estimatedTimeSec: 18, createdAt: new Date(), updatedAt: new Date() },
  { id: 'edge-015', fromWaypointId: 'wp-006', toWaypointId: 'wp-011', distance: 100, estimatedTimeSec: 20, createdAt: new Date(), updatedAt: new Date() },
  { id: 'edge-016', fromWaypointId: 'wp-011', toWaypointId: 'wp-012', distance: 80, estimatedTimeSec: 16, createdAt: new Date(), updatedAt: new Date() },
  // 管廊区东西连接
  { id: 'edge-017', fromWaypointId: 'wp-005', toWaypointId: 'wp-006', distance: 50, estimatedTimeSec: 10, createdAt: new Date(), updatedAt: new Date() }
]

// 巡检路线 Mock 数据（与路网路段对齐）
export const initialInspectionRoutes: InspectionRoute[] = [
  {
    id: 'route-001',
    name: '日常巡检路线',
    code: 'ROUTE-DAILY-001',
    description: '主厂房全线日常巡检路线（东主路 + 储罐区环路 + 管廊通道）',
    mapId: 'map-001',
    waypointIds: ['wp-001', 'wp-002', 'wp-003', 'wp-007', 'wp-009', 'wp-008', 'wp-010', 'wp-004', 'wp-005', 'wp-014', 'wp-006', 'wp-011', 'wp-012'],
    inspectionPointIds: ['point-001', 'point-002', 'point-003', 'point-004'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'route-002',
    name: '反应区巡检路线',
    code: 'ROUTE-REACT-001',
    description: '反应区专项巡检路线（东主路反应区段）',
    mapId: 'map-001',
    waypointIds: ['wp-001', 'wp-002', 'wp-003'],
    inspectionPointIds: ['point-001'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'route-003',
    name: '储罐区巡检环路',
    code: 'ROUTE-TANK-001',
    description: '储罐区环形巡检路线（储罐区巡检环路 rs-04）',
    mapId: 'map-001',
    waypointIds: ['wp-007', 'wp-008', 'wp-010', 'wp-009'],
    inspectionPointIds: ['point-002', 'point-004'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'route-004',
    name: '管廊巡检路线',
    code: 'ROUTE-PIPE-001',
    description: '管廊区巡检路线（管廊巡检通道 rs-06）',
    mapId: 'map-001',
    waypointIds: ['wp-014', 'wp-006', 'wp-011', 'wp-012'],
    inspectionPointIds: ['point-003'],
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'route-005',
    name: '全线巡检路线',
    code: 'ROUTE-FULL-001',
    description: '覆盖全部区域的完整巡检路线（东主路全程 + 储罐区环路 + 管廊通道）',
    mapId: 'map-001',
    waypointIds: ['wp-001', 'wp-002', 'wp-003', 'wp-007', 'wp-009', 'wp-008', 'wp-010', 'wp-004', 'wp-005', 'wp-014', 'wp-006', 'wp-011', 'wp-012', 'wp-013'],
    inspectionPointIds: ['point-001', 'point-002', 'point-003', 'point-004'],
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
  },
  {
    id: 'device-004',
    inspectionPointId: 'point-001',
    name: '进水阀门',
    code: 'VALVE-RX-IN-001',
    deviceNo: 'VALVE-RX-IN-001',
    deviceClassification: '阀门执行机构',
    facilityPositionNo: 'RX-V-101',
    owner: '赵工',
    areaId: 'region-a',
    areaName: '反应区',
    installationId: 'inst-001',
    installationName: '反应装置',
    facilityKind: 'normal',
    deviceCategory: '普通设施',
    type: '阀组',
    sequence: 3,
    ptzPreset: { x: 15, y: 8, z: 0.5 },
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
    id: 'device-005',
    inspectionPointId: 'point-002',
    name: '可燃气体检测仪',
    code: 'GAS-TK-001',
    deviceNo: 'GAS-TK-001',
    deviceClassification: '气体检测设备',
    facilityPositionNo: 'TK-G-201',
    owner: '周工',
    areaId: 'region-b',
    areaName: '储罐区',
    installationId: 'inst-002',
    installationName: '储罐装置',
    facilityKind: 'normal',
    deviceCategory: '普通设施',
    type: '气体检测仪',
    sequence: 2,
    ptzPreset: { x: 22, y: 12, z: 1.0 },
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
  },
  {
    id: 'fc-004',
    name: '进水阀门执行器',
    componentType: 'valve',
    componentNo: 'COMP-VLV-002',
    componentPositionNo: 'RX-V-101-ACT',
    areaId: 'region-a',
    areaName: '反应区',
    installationId: 'inst-001',
    installationName: '反应装置',
    facilityId: 'device-004',
    facilityName: '进水阀门',
    ruleIds: ['dic-002'],
    status: DeviceStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'fc-005',
    name: '可燃气体传感器',
    componentType: 'sensor',
    componentNo: 'COMP-GAS-001',
    componentPositionNo: 'TK-G-201-SEN',
    areaId: 'region-b',
    areaName: '储罐区',
    installationId: 'inst-002',
    installationName: '储罐装置',
    facilityId: 'device-005',
    facilityName: '可燃气体检测仪',
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
    subjectId: 'fc-001',
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
    subjectId: 'fc-002',
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
    subjectId: 'fc-003',
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
  },
  {
    id: 'check-004',
    deviceId: 'device-004',
    name: '开度',
    code: 'CHECK-VALVE-001',
    checkType: 'vision',
    priority: 'secondary',
    subjectId: 'fc-004',
    inspectionFrequency: { value: 6, unit: 'hour' },
    executionWindow: { startTime: '08:00', endTime: '20:00' },
    unit: '%',
    threshold: { min: 0, max: 100 },
    visionMapping: {
      sourceType: 'manual',
      customImageUrl: deviceImageUrl,
      recognitionMode: 'ai'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'check-005',
    deviceId: 'device-004',
    name: '状态',
    code: 'CHECK-VALVE-002',
    checkType: 'vision',
    priority: 'secondary',
    subjectId: 'fc-004',
    inspectionFrequency: { value: 6, unit: 'hour' },
    executionWindow: { startTime: '08:00', endTime: '20:00' },
    unit: '',
    threshold: { min: 0, max: 1 },
    visionMapping: {
      sourceType: 'manual',
      customImageUrl: deviceImageUrl,
      recognitionMode: 'ai'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'check-006',
    deviceId: 'device-005',
    name: '甲烷浓度',
    code: 'CHECK-GAS-001',
    checkType: 'vision',
    priority: 'primary',
    subjectId: 'fc-005',
    inspectionFrequency: { value: 2, unit: 'hour' },
    executionWindow: { startTime: '00:00', endTime: '23:59' },
    unit: '%LEL',
    threshold: { min: 0, max: 100, warning: 25, critical: 50 },
    visionMapping: {
      sourceType: 'system',
      customImageUrl: '',
      recognitionMode: 'ocr'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: 'check-007',
    deviceId: 'device-005',
    name: '硫化氢浓度',
    code: 'CHECK-GAS-002',
    checkType: 'vision',
    priority: 'primary',
    subjectId: 'fc-005',
    inspectionFrequency: { value: 2, unit: 'hour' },
    executionWindow: { startTime: '00:00', endTime: '23:59' },
    unit: 'ppm',
    threshold: { min: 0, max: 100, warning: 10, critical: 20 },
    visionMapping: {
      sourceType: 'system',
      customImageUrl: '',
      recognitionMode: 'ocr'
    },
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
  { id: 'std-comp-valve', name: '阀门', type: 'valve', description: '流体开关控制巡检对象', createdAt: new Date(), updatedAt: new Date() },
  { id: 'std-comp-pressure-gauge', name: '压力表', type: 'meter', description: '压力数值检测巡检对象', createdAt: new Date(), updatedAt: new Date() },
  { id: 'std-comp-temperature-gauge', name: '温度表', type: 'temperature_gauge', description: '温度数值检测巡检对象', createdAt: new Date(), updatedAt: new Date() },
  { id: 'std-comp-flange', name: '法兰', type: 'flange', description: '管路连接密封巡检对象', createdAt: new Date(), updatedAt: new Date() },
  { id: 'std-comp-pipe', name: '管体', type: 'pipe', description: '流体输送主体', createdAt: new Date(), updatedAt: new Date() },
  { id: 'std-comp-motor', name: '电机', type: 'motor', description: '驱动执行巡检对象', createdAt: new Date(), updatedAt: new Date() },
  { id: 'std-comp-cable', name: '电缆', type: 'cable', description: '电力/信号连接线缆', createdAt: new Date(), updatedAt: new Date() },
  { id: 'std-comp-joint', name: '接头', type: 'joint', description: '电气或管路连接节点', createdAt: new Date(), updatedAt: new Date() },
  { id: 'std-comp-sensor', name: '传感器', type: 'sensor', description: '监测采集传感器巡检对象', createdAt: new Date(), updatedAt: new Date() },
  { id: 'std-comp-screw', name: '螺杆', type: 'screw', description: '紧固传动类巡检对象', createdAt: new Date(), updatedAt: new Date() }
]

// ═══════════════════════════════════════
// 路网管理 Mock 数据（map-001）
// ═══════════════════════════════════════
// 坐标系与 map-001 对齐（800×600 画布）
// 区域: 反应区(60,120,220×160) 储罐区(290,300,240×170) 管廊区(560,160,200×180)
// 巡检点: point-001(100,200) point-002(300,400)

// 节点 — 道路网络的拓扑顶点
export const initialRoadNodes: RoadNode[] = [
  // ── 主干路节点（东西向） ──
  { id: 'rn-01', name: '西入口', nodeType: 'waypoint', position: { x: 30, y: 200 }, edgeIds: ['re-01'], mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  { id: 'rn-02', name: '反应区西', nodeType: 'waypoint', position: { x: 100, y: 200 }, edgeIds: ['re-01', 're-02'], mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  { id: 'rn-03', name: '中央路口', nodeType: 'junction', position: { x: 250, y: 200 }, edgeIds: ['re-02', 're-03', 're-06', 're-10'], mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  { id: 'rn-04', name: '储罐区北', nodeType: 'waypoint', position: { x: 400, y: 200 }, edgeIds: ['re-03', 're-04', 're-07'], mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  { id: 'rn-05', name: '管廊区西', nodeType: 'waypoint', position: { x: 560, y: 200 }, edgeIds: ['re-04', 're-05'], mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  { id: 'rn-06', name: '东出口', nodeType: 'waypoint', position: { x: 750, y: 200 }, edgeIds: ['re-05'], mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  // ── 南北向连接路 ──
  { id: 'rn-07', name: '储罐区西', nodeType: 'waypoint', position: { x: 250, y: 350 }, edgeIds: ['re-06', 're-08', 're-09'], mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  { id: 'rn-08', name: '储罐区中', nodeType: 'waypoint', position: { x: 400, y: 350 }, edgeIds: ['re-07', 're-08', 're-11'], mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  { id: 'rn-09', name: '储罐巡检点', nodeType: 'inspection', position: { x: 300, y: 400 }, edgeIds: ['re-09', 're-12'], mapId: 'map-001', area: '储罐区', createdAt: new Date(), updatedAt: new Date() },
  { id: 'rn-10', name: '南出口', nodeType: 'waypoint', position: { x: 250, y: 520 }, edgeIds: ['re-10'], mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  { id: 'rn-11', name: '储罐区东', nodeType: 'waypoint', position: { x: 500, y: 400 }, edgeIds: ['re-11', 're-12'], mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  // ── 充电桩 ──
  { id: 'rn-12', name: '充电站', nodeType: 'charging', position: { x: 680, y: 350 }, edgeIds: ['re-13'], mapId: 'map-001', area: '充电区', createdAt: new Date(), updatedAt: new Date() },
  { id: 'rn-13', name: '管廊连接', nodeType: 'waypoint', position: { x: 600, y: 350 }, edgeIds: ['re-13', 're-14'], mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  { id: 'rn-14', name: '管廊南', nodeType: 'waypoint', position: { x: 600, y: 250 }, edgeIds: ['re-14', 're-15'], mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  { id: 'rn-15', name: '管廊北路口', nodeType: 'junction', position: { x: 560, y: 160 }, edgeIds: ['re-15', 're-05'], mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
]

// 边 — 连接两个节点的路段
export const initialRoadEdges: RoadEdge[] = [
  // 主干路（东西向）
  { id: 're-01', fromNodeId: 'rn-01', toNodeId: 'rn-02', segmentId: 'rs-01', distance: 70, bidirectional: true, speedLimit: 15, width: 4, mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  { id: 're-02', fromNodeId: 'rn-02', toNodeId: 'rn-03', segmentId: 'rs-01', distance: 150, bidirectional: true, speedLimit: 15, width: 4, mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  { id: 're-03', fromNodeId: 'rn-03', toNodeId: 'rn-04', segmentId: 'rs-01', distance: 150, bidirectional: true, speedLimit: 15, width: 4, mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  { id: 're-04', fromNodeId: 'rn-04', toNodeId: 'rn-05', segmentId: 'rs-01', distance: 160, bidirectional: true, speedLimit: 15, width: 4, mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  { id: 're-05', fromNodeId: 'rn-05', toNodeId: 'rn-06', segmentId: 'rs-01', distance: 190, bidirectional: true, speedLimit: 15, width: 4, mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  // 南北向连接路
  { id: 're-06', fromNodeId: 'rn-03', toNodeId: 'rn-07', segmentId: 'rs-02', distance: 150, bidirectional: true, speedLimit: 10, width: 3, mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  { id: 're-07', fromNodeId: 'rn-04', toNodeId: 'rn-08', segmentId: 'rs-03', distance: 150, bidirectional: true, speedLimit: 10, width: 3, mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  { id: 're-08', fromNodeId: 'rn-07', toNodeId: 'rn-08', segmentId: 'rs-04', distance: 150, bidirectional: true, speedLimit: 10, width: 3, mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  { id: 're-09', fromNodeId: 'rn-07', toNodeId: 'rn-09', segmentId: 'rs-02', distance: 70, bidirectional: true, speedLimit: 10, width: 3, mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  { id: 're-10', fromNodeId: 'rn-03', toNodeId: 'rn-10', segmentId: 'rs-05', distance: 320, bidirectional: true, speedLimit: 10, width: 3, mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  { id: 're-11', fromNodeId: 'rn-08', toNodeId: 'rn-11', segmentId: 'rs-04', distance: 100, bidirectional: true, speedLimit: 10, width: 3, mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  { id: 're-12', fromNodeId: 'rn-09', toNodeId: 'rn-11', segmentId: 'rs-04', distance: 200, bidirectional: true, speedLimit: 10, width: 3, mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  // 管廊通道
  { id: 're-13', fromNodeId: 'rn-13', toNodeId: 'rn-12', segmentId: 'rs-06', distance: 80, bidirectional: false, speedLimit: 5, width: 2.5, mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  { id: 're-14', fromNodeId: 'rn-13', toNodeId: 'rn-14', segmentId: 'rs-06', distance: 100, bidirectional: true, speedLimit: 8, width: 2.5, mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
  { id: 're-15', fromNodeId: 'rn-14', toNodeId: 'rn-15', segmentId: 'rs-06', distance: 90, bidirectional: true, speedLimit: 8, width: 2.5, mapId: 'map-001', createdAt: new Date(), updatedAt: new Date() },
]

// 路段 — 由多条边组成的命名道路
export const initialRoadSegments: RoadSegment[] = [
  {
    id: 'rs-01', name: '东主路', code: 'S0001', mapId: 'map-001', area: '全园区',
    segmentType: 'trunk', status: 'active',
    nodeIds: ['rn-01', 'rn-02', 'rn-03', 'rn-04', 'rn-05', 'rn-06'],
    edgeIds: ['re-01', 're-02', 're-03', 're-04', 're-05'],
    length: 720, width: 4,
    startPoint: { x: 30, y: 200 }, endPoint: { x: 750, y: 200 },
    bidirectional: true, speedLimit: 15,
    allowReverse: false, allowUTurn: false, allowSpin: false,
    color: '#1677ff', createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'rs-02', name: '反应区-储罐区通道', code: 'S0002', mapId: 'map-001', area: '反应区-储罐区',
    segmentType: 'branch', status: 'active',
    nodeIds: ['rn-03', 'rn-07', 'rn-09'],
    edgeIds: ['re-06', 're-09'],
    length: 220, width: 3,
    startPoint: { x: 250, y: 200 }, endPoint: { x: 300, y: 400 },
    bidirectional: true, speedLimit: 10,
    allowReverse: false, allowUTurn: true, allowSpin: false,
    color: '#52c41a', createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'rs-03', name: '储罐区北通道', code: 'S0003', mapId: 'map-001', area: '储罐区',
    segmentType: 'patrol', status: 'active',
    nodeIds: ['rn-04', 'rn-08'],
    edgeIds: ['re-07'],
    length: 150, width: 3,
    startPoint: { x: 400, y: 200 }, endPoint: { x: 400, y: 350 },
    bidirectional: true, speedLimit: 10,
    allowReverse: false, allowUTurn: true, allowSpin: false,
    color: '#fa8c16', createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'rs-04', name: '储罐区巡检环路', code: 'S0004', mapId: 'map-001', area: '储罐区',
    segmentType: 'patrol', status: 'active',
    nodeIds: ['rn-07', 'rn-08', 'rn-11', 'rn-09'],
    edgeIds: ['re-08', 're-11', 're-12'],
    length: 450, width: 3,
    startPoint: { x: 250, y: 350 }, endPoint: { x: 300, y: 400 },
    bidirectional: true, speedLimit: 10,
    allowReverse: true, allowUTurn: true, allowSpin: true,
    color: '#fa8c16', createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'rs-05', name: '南侧通道', code: 'S0005', mapId: 'map-001', area: '全园区',
    segmentType: 'branch', status: 'active',
    nodeIds: ['rn-03', 'rn-10'],
    edgeIds: ['re-10'],
    length: 320, width: 3,
    startPoint: { x: 250, y: 200 }, endPoint: { x: 250, y: 520 },
    bidirectional: true, speedLimit: 10,
    allowReverse: false, allowUTurn: false, allowSpin: false,
    color: '#722ed1', createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'rs-06', name: '管廊巡检通道', code: 'S0006', mapId: 'map-001', area: '管廊区',
    segmentType: 'service', status: 'active',
    nodeIds: ['rn-13', 'rn-12', 'rn-14', 'rn-15'],
    edgeIds: ['re-13', 're-14', 're-15'],
    length: 270, width: 2.5,
    startPoint: { x: 600, y: 350 }, endPoint: { x: 560, y: 160 },
    bidirectional: false, speedLimit: 8,
    allowReverse: false, allowUTurn: false, allowSpin: false,
    color: '#13c2c2', createdAt: new Date(), updatedAt: new Date()
  },
]

// 路口 — 多路段交汇点
export const initialJunctions: Junction[] = [
  {
    id: 'junc-01', name: '中央路口', code: 'J001', mapId: 'map-001',
    nodeId: 'rn-03',
    connectedSegmentIds: ['rs-01', 'rs-02', 'rs-05'],
    junctionType: 'cross', priority: 'main_road', conflictMode: 'mutex',
    allowLeftTurn: true, allowRightTurn: true, allowStraight: true, allowUTurn: false,
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'junc-02', name: '管廊北路口', code: 'J002', mapId: 'map-001',
    nodeId: 'rn-15',
    connectedSegmentIds: ['rs-01', 'rs-06'],
    junctionType: 't_junction', priority: 'main_road', conflictMode: 'mutex',
    allowLeftTurn: false, allowRightTurn: true, allowStraight: true, allowUTurn: false,
    createdAt: new Date(), updatedAt: new Date()
  },
]

// 导航点 — 机器人可导航/可停靠的业务空间点
export const initialNavigationPoints: NavigationPoint[] = [
  { id: 'nav-01', name: '机器人基站', code: 'P001', mapId: 'map-001', area: '入口', navType: 'charging', position: { x: 30, y: 200 }, nodeId: 'rn-01', description: '机器人起始位置和充电站', remark: '机器人起始位置/充电站', createdAt: new Date(), updatedAt: new Date() },
  { id: 'nav-02', name: '反应釜巡检点', code: 'P002', mapId: 'map-001', area: '反应区', navType: 'inspection', position: { x: 100, y: 200 }, nodeId: 'rn-02', description: '反应釜区域巡检点', inspectionMode: 'fixed', workAreaName: 'A区', yaw: 90, stayDurationSec: 30, isRequiredInspection: true, relatedFacilityId: 'device-001', remark: '对应巡检点 point-001', createdAt: new Date(), updatedAt: new Date() },
  { id: 'nav-03', name: '储罐区巡检点', code: 'P003', mapId: 'map-001', area: '储罐区', navType: 'inspection', position: { x: 300, y: 400 }, nodeId: 'rn-09', description: '储罐区巡检点', inspectionMode: 'fixed', workAreaName: 'B区', yaw: 180, stayDurationSec: 45, isRequiredInspection: true, relatedFacilityId: 'device-005', remark: '对应巡检点 point-002', createdAt: new Date(), updatedAt: new Date() },
  { id: 'nav-04', name: '管廊巡检点', code: 'P004', mapId: 'map-001', area: '管廊区', navType: 'inspection', position: { x: 600, y: 250 }, nodeId: 'rn-14', description: '管廊区域巡检', inspectionMode: 'area', workAreaName: 'C区', yaw: 270, stayDurationSec: 60, remark: '管廊区域巡检', createdAt: new Date(), updatedAt: new Date() },
  { id: 'nav-05', name: '充电桩', code: 'P005', mapId: 'map-001', area: '管廊区', navType: 'charging', position: { x: 680, y: 350 }, nodeId: 'rn-12', description: '机器人充电点', chargingMethod: 'auto', chargingPower: 22, estimatedChargingTime: 60, remark: '机器人充电点', createdAt: new Date(), updatedAt: new Date() },
  { id: 'nav-06', name: '停车点A', code: 'P006', mapId: 'map-001', area: '储罐区', navType: 'parking', position: { x: 400, y: 350 }, nodeId: 'rn-08', description: '多机器人会车等待', parkingPriority: 1, maxWaitingTime: 120, reverseRequired: false, turnAroundRequired: true, narrowRoad: false, slope: false, remark: '多机器人会车等待', createdAt: new Date(), updatedAt: new Date() },
]

// 绘制区域
export const initialNoGoZones: NoGoZone[] = [
  {
    id: 'nogo-01', name: '高温反应区', code: 'NG001', mapId: 'map-001', zoneType: 'forbidden', level: 'high_risk',
    polygonPoints: [
      { x: 150, y: 130 }, { x: 250, y: 130 }, { x: 250, y: 190 }, { x: 150, y: 190 }
    ],
    description: '高温作业区域，温度超过安全阈值',
    reason: '高温作业区域，机器人禁止通行',
    entryLimit: 0, capacityLimit: 0,
    responsiblePerson: '张工', contactPhone: '13800138001',
    createdAt: new Date(), updatedAt: new Date()
  },
  {
    id: 'nogo-02', name: '施工区域', code: 'NG002', mapId: 'map-001', zoneType: 'forbidden', level: 'temporary',
    polygonPoints: [
      { x: 450, y: 280 }, { x: 540, y: 280 }, { x: 540, y: 340 }, { x: 450, y: 340 }
    ],
    description: '管道施工区域，临时禁行',
    startTime: '2026-06-01', endTime: '2026-06-30',
    reason: '管道施工，临时禁行',
    entryLimit: 5, capacityLimit: 10,
    responsiblePerson: '李工', contactPhone: '13800138002',
    createdAt: new Date(), updatedAt: new Date()
  },
]

const checkItemsByDeviceId = new Map<string, InspectionDeviceCheckItem[]>()
initialInspectionDeviceCheckItems.forEach((checkItem) => {
  const list = checkItemsByDeviceId.get(checkItem.deviceId) || []
  list.push(checkItem)
  checkItemsByDeviceId.set(checkItem.deviceId, list)
})

initialInspectionDevices.forEach((device) => {
  device.checkItems = checkItemsByDeviceId.get(device.id) || []
})

// 将 FacilityComponent 接入 InspectionDevice.assetComponents（树结构部件层）
const assetComponentsByFacilityId = new Map<string, InspectedAssetComponent[]>()
initialFacilityComponents.forEach((fc) => {
  const list = assetComponentsByFacilityId.get(fc.facilityId) || []
  list.push({
    id: fc.id,
    assetId: fc.facilityId,
    name: fc.name,
    type: fc.componentType as InspectedAssetComponent['type'],
    ruleIds: fc.ruleIds
  })
  assetComponentsByFacilityId.set(fc.facilityId, list)
})

initialInspectionDevices.forEach((device) => {
  if (!device.assetComponents || device.assetComponents.length === 0) {
    device.assetComponents = assetComponentsByFacilityId.get(device.id) || []
  }
})
