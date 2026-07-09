/** 道路类型 */
export type RoadType = 'driving' | 'walking'

/** 节点类型 — 拓扑 + 业务语义 */
export type RoadNodeType = 'waypoint' | 'junction' | 'inspection' | 'parking' | 'charging'

/** 路段类型 */
export type RoadSegmentType = 'trunk' | 'branch' | 'patrol' | 'service'

/** 路段状态 */
export type RoadSegmentStatus = 'active' | 'inactive' | 'construction' | 'blocked' | 'maintenance'

/** 路口节点类型 */
export type JunctionNodeType = 't_junction' | 'cross' | 'normal'

/** 路口优先级 */
export type JunctionPriority = 'main_road' | 'side_road' | 'traffic_light' | 'robot_priority'

/** 路口冲突控制 */
export type JunctionConflictMode = 'mutex' | 'reservation' | 'time_window'

/** 导航点类型 — 机器人可导航/可停靠的业务空间点 */
export type NavigationPointType = 'inspection' | 'parking' | 'charging'

export type RoadCalibrationStatus = 'calibrated' | 'pending'
export type CalibrationSource = 'manual' | 'robot_pose' | 'map_drag'

export type ZoneClass = 'Z0' | 'Z1' | 'Z2'

/** 区域通行类型 */
export type ZoneType = 'normal' | 'forbidden'

/** 禁行区等级（仅 forbidden 类型使用） */
export type NoGoZoneLevel = 'permanent' | 'temporary' | 'high_risk' | 'maintenance'

/** 围栏告警类型 */
export type GeofenceAlertType = 'enter' | 'exit' | 'timeout' | 'breach'

/** 路网版本状态 */
export type RoadNetworkVersionStatus = 'draft' | 'review' | 'published' | 'archived'

/** 拓扑检查问题严重级别 */
export type TopologyIssueSeverity = 'critical' | 'warning' | 'info'

/** 拓扑检查问题类型 */
export type TopologyIssueType = 'isolated_node' | 'isolated_edge' | 'dead_end' | 'disconnected_component' | 'overlapping_edge' | 'self_intersecting' | 'width_insufficient' | 'radius_insufficient' | 'charging_unreachable'

/** 路径规划算法 */
export type PathAlgorithm = 'shortest' | 'fastest' | 'safest'

// ──────────────────────────────────────
// 核心拓扑结构：Node ← Edge → Segment
// ──────────────────────────────────────

/** 路网节点 — 拓扑图的顶点 */
export interface RoadNode {
  id: string
  name?: string
  nodeType: RoadNodeType
  position: { x: number; y: number; lng?: number; lat?: number }
  /** 该节点连接的边 ID 列表（自动维护） */
  edgeIds: string[]
  mapId: string
  /** 所属区域（业务节点使用） */
  area?: string
  /** 关联设施 */
  relatedFacilityId?: string
  /** 关联设备 */
  relatedDeviceId?: string
  /** 备注 */
  remark?: string
  createdAt: Date
  updatedAt: Date
}

/** 路段边 — 连接两个节点的有向/无向边 */
export interface RoadEdge {
  id: string
  fromNodeId: string
  toNodeId: string
  /** 所属路段 ID */
  segmentId?: string
  /** 实际距离 (米) */
  distance: number
  /** 是否双向通行 */
  bidirectional: boolean
  /** 限速 (km/h) */
  speedLimit: number
  /** 路宽 (米) */
  width: number
  mapId: string
  createdAt: Date
  updatedAt: Date
}

/** 路段 — 由多条边组成的连续路径，是边的聚合 */
export interface RoadSegment {
  id: string
  name: string
  code: string
  mapId: string
  area: string
  segmentType: RoadSegmentType
  status: RoadSegmentStatus
  /** 有序节点 ID 列表（自动维护） */
  nodeIds: string[]
  /** 有序边 ID 列表（自动维护） */
  edgeIds: string[]
  /** 总长度 (米，自动计算) */
  length: number
  /** 路宽 (米) */
  width: number
  /** 起点坐标 */
  startPoint: { x: number; y: number }
  /** 终点坐标 */
  endPoint: { x: number; y: number }
  // 通行属性
  bidirectional: boolean
  speedLimit: number
  widthLimit?: number
  heightLimit?: number
  maxLoad?: number
  // 机器人约束
  minTurnRadius?: number
  maxSlope?: number
  allowReverse: boolean
  allowUTurn: boolean
  allowSpin: boolean
  minSafeDistance?: number
  color?: string
  // ── 地面与机器人限制 ──
  surfaceMaterial?: string
  allowedRobotTypes?: string[]
  // ── 运行策略（ADR 0014）──
  heartbeatIntervalMs?: number  // 100~10000ms，空则用机器人默认
  voiceReminder?: {
    type: 'none' | 'approach_hazard' | 'narrow_road' | 'restricted_area' | 'custom'
    content?: string  // custom 时填
  }
  // ── 看门狗（ADR 0015）──
  watchdogAction?: 'decelerate' | 'emergency_stop'
  // ── 倒车动作模板（ADR 0017）──
  reverseActionTemplate?: 'straight_pass' | 'slow_pass' | 'stop_then_straight' | 'reverse_pass' | 'uturn_reenter'
  // ── 云台扫描策略（ADR 0012）──
  ptzScan?: {
    enabled: boolean
    scanMode: 'continuous_sweep' | 'back_and_forth' | 'fixed_yaw'
    yawStart: number        // 0~360
    yawEnd: number          // 0~360
    pitchMin: number        // -90~+30
    pitchMax: number        // -90~+30
    scanSpeed: number       // 5~60 °/s
    height: number          // 0.5~3.0 m
    hazardPointFlag?: boolean
    hazardTypes?: ('leak' | 'temperature_rise' | 'debris' | 'safety_behavior' | 'gas')[]
  }
  // ── 安全等级（ADR 0001）──
  safetyLevel?: 'normal' | 'warning' | 'danger'
  createdAt: Date
  updatedAt: Date
}

// ──────────────────────────────────────
// 业务实体
// ──────────────────────────────────────

/** 路口 — 多条路段交汇的业务概念 */
export interface Junction {
  id: string
  name: string
  code: string
  mapId: string
  /** 关联的拓扑节点 ID */
  nodeId: string
  /** 关联的路段 ID 列表 */
  connectedSegmentIds: string[]
  junctionType: JunctionNodeType
  priority: JunctionPriority
  conflictMode: JunctionConflictMode
  allowLeftTurn: boolean
  allowRightTurn: boolean
  allowStraight: boolean
  allowUTurn: boolean
  // ── 信号灯路口专用 ──
  signalCycleTime?: number
  greenPhaseDuration?: number
  yellowPhaseDuration?: number
  redPhaseDuration?: number
  waitStrategy?: string
  // ── 环岛专用 ──
  direction?: 'clockwise' | 'counterclockwise'
  exitCount?: number
  // ── Y型路口专用 ──
  yJunctionAngle?: number
  createdAt: Date
  updatedAt: Date
}

/** 导航点 — 机器人可导航/可停靠的业务空间点，必须绑定拓扑节点 */
export interface NavigationPoint {
  id: string
  name: string
  code: string
  mapId: string
  area: string
  navType: NavigationPointType
  position: { x: number; y: number }
  /** 必须关联到拓扑节点，保证可达性 */
  nodeId: string
  /** 关联的业务巡检点 ID（打通 NavigationPoint ↔ InspectionPoint） */
  inspectionPointId?: string
  /** 描述 */
  description?: string
  relatedFacilityId?: string
  relatedDeviceId?: string
  remark?: string
  // ── 巡检点专用 ──
  /** 巡检模式: fixed=定点巡检(停车检查), area=区域巡检(不强制停车) */
  inspectionMode?: 'fixed' | 'area'
  /** 工作区域/分区名称 */
  workAreaName?: string
  /** 朝向角 (0-360度) */
  yaw?: number
  stayDurationSec?: number
  photoStrategy?: string
  isRequiredInspection?: boolean
  relatedCheckItemIds?: string[]
  // ── 充电点专用 ──
  chargingMethod?: string
  chargingPower?: number
  estimatedChargingTime?: number
  // ── 停车点专用 ──
  parkingPriority?: number
  maxWaitingTime?: number
  // ── 停车约束 ──
  /** 是否需要倒车 */
  reverseRequired?: boolean
  /** 是否需要掉头 */
  turnAroundRequired?: boolean
  /** 是否窄路 */
  narrowRoad?: boolean
  /** 是否有坡道 */
  slope?: boolean
  // ── 通用扩展 ──
  gateAccess?: boolean
  elevatorAccess?: boolean
  /** 校准状态 — 拖拽点位后自动变为 pending */
  calibrationStatus?: RoadCalibrationStatus
  /** 最后校准时间 */
  calibratedAt?: Date | string
  /** 最后移动时间 */
  lastMovedAt?: Date | string
  /** 校准来源 */
  calibrationSource?: CalibrationSource
  createdAt: Date
  updatedAt: Date
}

/** @deprecated 使用 NavigationPoint 替代 */
export type NavPoint = NavigationPoint
/** @deprecated 使用 NavigationPointType 替代 */
export type NavPointType = NavigationPointType

export interface HazardPolicyConfig {
  /** 是否启用危区策略 */
  enabled?: boolean
  /** 高温等待阈值 (°C) */
  waitThreshold?: number | null
  /** 禁入阈值 (°C) */
  blockThreshold?: number | null
  /** 撤离阈值 (°C) */
  evacuateThreshold?: number | null
  /** 冷却保持时间 (秒) */
  cooldownHoldSec?: number | null
  /** 等待超时 (秒) */
  waitTimeoutSec?: number | null
  /** 边界缓冲 (米) */
  boundaryBufferM?: number | null
  /** 撤离点 ID 列表 */
  safeExitPointIds?: string[]
}

/** 绘制区域 — 多边形区域（正常通行 / 禁止通行 / 危区 Z1 / 禁入区 Z2） */
export interface NoGoZone {
  id: string
  name: string
  code: string
  mapId: string
  zoneType: ZoneType
  level: NoGoZoneLevel
  /** 危区分类: Z0 普通区 / Z1 危区 / Z2 禁止自主Nav2 */
  zoneClass?: ZoneClass
  /** 危区策略配置 */
  hazardPolicy?: HazardPolicyConfig
  polygonPoints: { x: number; y: number }[]
  /** 区域描述 */
  description?: string
  startTime?: string
  endTime?: string
  reason?: string
  // ── 管理信息 ──
  /** 进入限制人数 */
  entryLimit?: number
  /** 容量限制 */
  capacityLimit?: number
  /** 允许的机器人类型 */
  allowedRobotTypes?: string[]
  /** 责任人 */
  responsiblePerson?: string
  /** 联系电话 */
  contactPhone?: string
  createdAt: Date
  updatedAt: Date
}

/** 电子围栏 */
export interface Geofence {
  id: string
  name: string
  mapId: string
  polygonPoints: { x: number; y: number }[]
  alertTypes: GeofenceAlertType[]
  createdAt: Date
  updatedAt: Date
}

// ──────────────────────────────────────
// 版本快照
// ──────────────────────────────────────

/** 路网数据快照 — 版本管理的核心 */
export interface RoadNetworkSnapshot {
  nodes: RoadNode[]
  edges: RoadEdge[]
  segments: RoadSegment[]
  junctions: Junction[]
  navPoints: NavigationPoint[]
  noGoZones: NoGoZone[]
}

/** 路网版本 */
export interface RoadNetworkVersion {
  id: string
  mapId: string
  version: string
  status: RoadNetworkVersionStatus
  description?: string
  /** 数据快照 */
  snapshot?: RoadNetworkSnapshot
  publishedAt?: Date
  createdAt: Date
  updatedAt: Date
}

// ──────────────────────────────────────
// 检查与模拟
// ──────────────────────────────────────

/** 拓扑检查结果 */
export interface TopologyCheckResult {
  id: string
  mapId: string
  checkTime: Date
  issues: TopologyIssue[]
  totalCritical: number
  totalWarning: number
  totalInfo: number
}

/** 拓扑检查问题 */
export interface TopologyIssue {
  id: string
  type: TopologyIssueType
  severity: TopologyIssueSeverity
  message: string
  relatedEntityId?: string
  relatedEntityType?: 'node' | 'edge' | 'segment' | 'junction'
}

/** 路径规划结果 */
export interface PathResult {
  found: boolean
  pathNodeIds: string[]
  pathEdgeIds: string[]
  totalDistance: number
  estimatedTime: number
  algorithm: PathAlgorithm
}
