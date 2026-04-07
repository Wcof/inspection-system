import type { InspectionPath } from './path'
import type { InspectionPointExceptionStrategy, TaskExceptionStrategy, ExceptionLog } from './exception'

export enum InspectionTaskType {
  POINT = 'point',
  PATROL = 'patrol'
}

export enum InspectionPlanStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PAUSED = 'paused'
}

export enum InspectionTaskInstanceStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  FAILED = 'failed'
}

export enum CalibrationStatus {
  PENDING = 'pending',
  CALIBRATED = 'calibrated'
}

export enum InspectionPointType {
  FIXED = 'fixed',
  AREA = 'area'
}

export enum PositionSource {
  MAP_PICK = 'map_pick',
  MANUAL_ADJUST = 'manual_adjust'
}

export enum DeviceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export enum ScheduleType {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  ONCE = 'once'
}

export interface MapPosition {
  x: number
  y: number
  yaw?: number
}

export interface PTZPreset {
  x: number
  y: number
  z?: number
}

export interface InspectionMap {
  id: string
  name: string
  description: string
  imageUrl?: string
  settings?: MapSettings
  relatedMaps?: string
  mapPackageName?: string
  mapPackageUrl?: string
  mapPackageSize?: number
  mapPackageUploadedAt?: string
  mapTiles?: MapTile[]
  mapType?: string // 地图类型：工厂、园区、仓库等
  area?: string // 区域：A区、B区等
  scaleUnit?: string // 比例尺单位：米、英尺等
  dimensions?: {
    width: number // 宽度
    height: number // 高度
  }
  status?: 'active' | 'draft' | 'archived' // 状态
  version?: string // 版本
  createdBy?: string // 创建人
  updatedBy?: string // 更新人
  robotCompatibility?: string[] // 兼容的机器人型号
  usageNotes?: string // 使用说明
  geographicCoordinates?: {
    latitude: number // 纬度
    longitude: number // 经度
  }
  createdAt: Date
  updatedAt: Date
}

export interface MapTile {
  id: string
  name: string
  index: number
  offsetStart: number
  offsetEnd: number
  size: number
  status: 'ready' | 'processing' | 'failed'
}

export interface MapSettings {
  scale: number
  origin: { x: number; y: number }
  rotation: number
}

export interface Waypoint {
  id: string
  mapId: string
  name: string
  position: MapPosition
  description?: string
  createdAt: Date
  updatedAt: Date
}

export interface WaypointEdge {
  id: string
  fromWaypointId: string
  toWaypointId: string
  distance?: number
  estimatedTimeSec?: number
  createdAt: Date
  updatedAt: Date
}

export interface InspectionRoute {
  id: string
  name: string
  code: string
  description: string
  mapId: string
  waypointIds: string[]
  inspectionPointIds: string[]
  createdAt: Date
  updatedAt: Date
}

export interface InspectionRouteFormData {
  name: string
  code: string
  description: string
  mapId: string
  waypointIds: string[]
  inspectionPointIds: string[]
}

export interface InspectionDevice {
  id: string
  inspectionPointId: string
  name: string
  code: string
  type: string
  sequence: number
  ptzPreset?: PTZPreset
  referenceImageUrl?: string
  referenceImageVersion?: string
  status: DeviceStatus
  checkItems: InspectionDeviceCheckItem[]
  createdAt: Date
  updatedAt: Date
}

export interface InspectionDeviceFormData {
  inspectionPointId: string
  name: string
  code: string
  type: string
  sequence: number
  ptzPreset?: PTZPreset
  referenceImageUrl?: string
  status?: DeviceStatus
}

export interface InspectionDeviceCheckItem {
  id: string
  deviceId: string
  name: string
  code: string
  checkType?: 'threshold' | 'vision'
  unit: string
  threshold: {
    min?: number
    max?: number
    warning?: number
    critical?: number
  }
  visionMapping?: {
    sourceType: 'reference_image' | 'template_image' | 'system' | 'manual'
    templateImageUrl?: string
    customImageUrl?: string
    recognitionMode: 'template' | 'ocr' | 'ai'
    judgement?: {
      type: 'numeric_range' | 'threshold_compare' | 'enum_match' | 'text_match'
      normalMin?: number
      normalMax?: number
      comparison?: 'gt' | 'gte' | 'lt' | 'lte'
      threshold?: number
      normalValues?: string[]
      keyword?: string
    }
    confidenceThreshold?: number
    roi?: {
      x: number
      y: number
      width: number
      height: number
    }
  }
  createdAt: Date
  updatedAt: Date
}

export interface InspectionDeviceCheckItemFormData {
  deviceId: string
  name: string
  code: string
  checkType?: 'threshold' | 'vision'
  unit: string
  threshold: {
    min?: number
    max?: number
    warning?: number
    critical?: number
  }
  visionMapping?: {
    sourceType: 'reference_image' | 'template_image' | 'system' | 'manual'
    templateImageUrl?: string
    customImageUrl?: string
    recognitionMode: 'template' | 'ocr' | 'ai'
    judgement?: {
      type: 'numeric_range' | 'threshold_compare' | 'enum_match' | 'text_match'
      normalMin?: number
      normalMax?: number
      comparison?: 'gt' | 'gte' | 'lt' | 'lte'
      threshold?: number
      normalValues?: string[]
      keyword?: string
    }
    confidenceThreshold?: number
    roi?: {
      x: number
      y: number
      width: number
      height: number
    }
  }
}

export interface InspectionTaskSnapshot {
  id: string
  taskId: string
  route: {
    id: string
    name: string
    waypointIds: string[]
    inspectionPointIds: string[]
  }
  points: Array<{
    id: string
    name: string
    sequence: number
    mapPosition: MapPosition
    stayDurationSec: number
  }>
  devices: Array<{
    id: string
    inspectionPointId: string
    name: string
    sequence: number
    ptzPreset?: PTZPreset
    referenceImageUrl?: string
    referenceImageVersion?: string
  }>
  createdAt: string
}

export interface InspectionTaskResult {
  id: string
  taskId: string
  inspectionPointId: string
  deviceId?: string
  checkItemId?: string
  value?: string | number
  status: 'normal' | 'warning' | 'critical' | 'skipped'
  imageUrl?: string
  exceptionLogId?: string
  recordedAt: string
  createdAt: Date
  updatedAt: Date
}

export interface WeeklySchedule {
  type: ScheduleType.WEEKLY
  daysOfWeek: number[]
  time: string
}

export interface MonthlySchedule {
  type: ScheduleType.MONTHLY
  daysOfMonth: number[]
  time: string
}

export interface OnceSchedule {
  type: ScheduleType.ONCE
  dateTime: string
}

export type InspectionSchedule = WeeklySchedule | MonthlySchedule | OnceSchedule

export interface Metric {
  id: string
  name: string
  code: string
  unit: string
  threshold: {
    min?: number
    max?: number
    warning?: number
    critical?: number
  }
  monitorPointId: string
  createdAt: Date
  updatedAt: Date
}

export interface MetricFormData {
  name: string
  code: string
  unit: string
  threshold: {
    min?: number
    max?: number
    warning?: number
    critical?: number
  }
  monitorPointId: string
}

export interface MonitorPoint {
  id: string
  name: string
  code: string
  inspectionPointId: string
  deviceType: string
  metrics: Metric[]
  position?: {
    x: number
    y: number
    z: number
  }
  stayDuration: number
  createdAt: Date
  updatedAt: Date
}

export interface MonitorPointFormData {
  name: string
  code: string
  deviceType: string
  stayDuration: number
  inspectionPointId: string
  position?: {
    x: number
    y: number
    z: number
  }
}

export interface InspectionPoint {
  id: string
  name: string
  code: string
  pointType: InspectionPointType
  description: string
  mapId: string
  location: {
    longitude: number
    latitude: number
    altitude?: number
  }
  mapPosition?: MapPosition
  areaStartMapPosition?: MapPosition
  areaEndMapPosition?: MapPosition
  waypointId?: string
  sequence: number
  calibrationStatus: CalibrationStatus
  stayDurationSec: number
  facilityDeviceId?: string
  monitorPoints: MonitorPoint[]
  isCritical: boolean
  exceptionStrategy: InspectionPointExceptionStrategy
  positionSource: PositionSource
  lastMapPickAt?: Date
  lastManualAdjustAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface InspectionPointFormData {
  name: string
  code: string
  pointType: InspectionPointType
  description: string
  mapId: string
  location: {
    longitude: number
    latitude: number
    altitude?: number
  }
  mapPosition?: MapPosition
  areaStartMapPosition?: MapPosition
  areaEndMapPosition?: MapPosition
  waypointId?: string
  sequence: number
  stayDurationSec: number
  calibrationStatus?: CalibrationStatus
  facilityDeviceId: string
  isCritical: boolean
  exceptionStrategy: InspectionPointExceptionStrategy
  positionSource: PositionSource
}

export interface InspectionTask {
  id: string
  planId?: string
  name: string
  code: string
  robotId: string
  routeId: string
  snapshotId?: string
  type: InspectionTaskType
  status: InspectionTaskInstanceStatus
  inspectionPointIds: string[]
  inspectionPoints?: InspectionPoint[]
  path?: InspectionPath
  currentInspectionPointIndex: number
  plannedExecuteAt?: string
  schedule?: {
    startTime: Date
    endTime: Date
    repeatInterval?: number
    repeatUnit?: 'minute' | 'hour' | 'day' | 'week'
  }
  config: {
    autoStart: boolean
    notifyOnComplete: boolean
    notifyOnError: boolean
    autoResumeAfterInterrupt: boolean
  }
  exceptionStrategy: TaskExceptionStrategy
  exceptionLog: ExceptionLog[]
  createdAt: Date
  updatedAt: Date
}

export interface InspectionTaskFormData {
  name: string
  code: string
  robotId: string
  type: InspectionTaskType
  inspectionPointIds: string[]
  schedule?: {
    startTime: Date
    endTime: Date
    repeatInterval?: number
    repeatUnit?: 'minute' | 'hour' | 'day' | 'week'
  }
  config: {
    autoStart: boolean
    notifyOnComplete: boolean
    notifyOnError: boolean
    autoResumeAfterInterrupt: boolean
  }
  exceptionStrategy: TaskExceptionStrategy
}

export interface InspectionPlan {
  id: string
  name: string
  code: string
  startTime?: string
  endTime?: string
  robotId: string
  mapId: string
  routeId?: string
  pointIds?: string[]
  pointOrders?: { pointId: string; order: number }[]
  status: InspectionPlanStatus
  type: InspectionTaskType
  inspectionPointIds: string[]
  inspectionPoints?: InspectionPoint[]
  path?: InspectionPath
  schedule: InspectionSchedule
  config: {
    autoStart: boolean
    notifyOnComplete: boolean
    notifyOnError: boolean
    autoResumeAfterInterrupt: boolean
  }
  exceptionStrategy: TaskExceptionStrategy
  createdAt: Date
  updatedAt: Date
}

export interface InspectionPlanFormData {
  name: string
  code: string
  robotId: string
  mapId: string
  routeId?: string
  pointIds?: string[]
  pointOrders?: { pointId: string; order: number }[]
  status: InspectionPlanStatus
  type: InspectionTaskType
  inspectionPointIds: string[]
  schedule: InspectionSchedule
  config: {
    autoStart: boolean
    notifyOnComplete: boolean
    notifyOnError: boolean
    autoResumeAfterInterrupt: boolean
  }
  exceptionStrategy: TaskExceptionStrategy
}

export interface InspectionTaskInstance {
  id: string
  planId: string
  plan?: InspectionPlan
  name: string
  code: string
  robotId: string
  status: InspectionTaskInstanceStatus
  inspectionPointIds: string[]
  inspectionPoints?: InspectionPoint[]
  path?: InspectionPath
  currentInspectionPointIndex: number
  progress: number
  exceptionLog: ExceptionLog[]
  startedAt?: Date
  completedAt?: Date
  createdAt: Date
  updatedAt: Date
}
