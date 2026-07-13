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
  PROCESSING = 'processing',
  CANCELLED = 'cancelled',
  TERMINATED = 'terminated',
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

export type InspectionPointBizType = 'inspection' | 'charging' | 'parking' | 'maintenance' | 'standby'
export type InspectionMode = 'fixed' | 'area'

export enum PositionSource {
  MAP_PICK = 'map_pick',
  MANUAL_ADJUST = 'manual_adjust'
}

export enum DeviceStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
  SCRAPPED = 'scrapped'
}

export type FacilityKind = 'normal' | 'pipeline'

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

export type CollectionMethod = 'optical' | 'thermal' | 'gas' | 'safety' | 'multi_spectrum'

export interface ParkingPointConstraint {
  reachable: boolean
  reverseRequired: boolean
  turnAroundRequired: boolean
  narrowRoad: boolean
  slope: boolean
  bridgeRequired: boolean
  detourRequired: boolean
}

export interface CollectionPose {
  id: string
  parkingPointId: string
  targetName: string
  targetType: 'asset' | 'component' | 'connection' | 'area_environment' | 'safety_behavior'
  direction: 'front' | 'side' | 'oblique' | 'near' | 'overview'
  distanceMeter: number
  ptzYaw: number
  ptzPitch: number
  focalLength: string
  method: CollectionMethod
  collectableCondition: string
}

export interface InspectionPointCoverageObject {
  id: string
  type: 'asset' | 'component' | 'connection' | 'area_environment' | 'safety_behavior'
  name: string
  deviceId?: string
  componentId?: string
  connectionId?: string
  areaName?: string
  coverageType: 'primary' | 'secondary' | 'backup'
  coverageStatus: 'coverable' | 'partial' | 'uncoverable'
  requiredCoverage: boolean
  remark?: string
}

export interface ParkingPoint {
  id: string
  inspectionPointId: string
  name: string
  position: MapPosition
  constraint: ParkingPointConstraint
  collectionPoses: CollectionPose[]
}

export interface InspectedAssetComponent {
  id: string
  assetId: string
  name: string
  type: 'valve' | 'meter' | 'temperature_gauge' | 'flange' | 'motor' | 'pipe' | 'cable' | 'joint' | 'sensor' | 'screw' | 'other'
  subType?: string
  subTypeName?: string
  ruleIds?: string[]
  priority?: 'high' | 'medium' | 'low'
  inspectionCycle?: string
  inspectionWindow?: string
}

export interface Installation {
  id: string
  name: string
  code: string
  installationPositionNo?: string
  areaId: string
  areaName: string
  installationType: string
  status: DeviceStatus
  remark?: string
  createdAt: Date
  updatedAt: Date
}

export interface FacilityComponent {
  id: string
  name: string
  componentType: InspectedAssetComponent['type']
  componentNo: string
  componentPositionNo: string
  areaId: string
  areaName: string
  installationId: string
  installationName: string
  facilityId: string
  facilityName: string
  ruleIds: string[]
  priority?: 'high' | 'medium' | 'low'
  inspectionCycle?: string
  inspectionWindow?: string
  referenceImageUrl?: string
  status: DeviceStatus
  remark?: string
  createdAt: Date
  updatedAt: Date
}

export interface ConnectionObject {
  id: string
  name: string
  endpointA: string
  endpointB: string
  sourceComponentId?: string
  sinkScope?: 'self' | 'other'
  sinkDeviceId?: string
  sinkComponentId?: string
  endpointAPath?: [string, string]
  endpointBPath?: [string, string]
  ruleIds?: string[]
  priority?: 'high' | 'medium' | 'low'
  inspectionCycle?: string
  inspectionWindow?: string
  detectionFocus: string
}

export type ObjectDetectionSubjectType = 'component' | 'connection' | 'asset' | 'area_environment'
export type DetectionFailureStrategy = 'manual_review' | 'supplement_task' | 'mark_uninspectable'

export interface ObjectDetectionConfig {
  id: string
  deviceId: string
  subjectType: ObjectDetectionSubjectType
  subjectId: string
  subjectName: string
  ruleId: string
  collectionPoseId?: string
  requiredCoverage: boolean
  failureStrategy: DetectionFailureStrategy
  enabled: boolean
  remark?: string
  updatedAt: string
}

export interface InspectionPointDetectionConfig {
  id: string
  inspectionPointId: string
  subjectType: ObjectDetectionSubjectType | 'safety_behavior'
  subjectId: string
  subjectName: string
  ruleId: string
  collectionPoseId?: string
  requiredCoverage: boolean
  failureStrategy: DetectionFailureStrategy
  enabled: boolean
  remark?: string
  updatedAt: string
}

export interface InspectionPointExecutionRecord {
  id: string
  inspectionPointId: string
  taskName: string
  executedAt: string
  resultSummary: string
  executor?: string
}

export interface FacilityParkingPointBinding {
  id: string
  inspectionPointId: string
  inspectionPointName: string
  parkingPointId: string
  parkingPointName: string
  executionOrder?: number
  sequence?: number
  componentIds: string[]
  ruleIds?: string[]
  inspectionMode?: 'fixed' | 'area'
  parkingPointIds?: string[]
  parkingPointNames?: string[]
  targetObjectRefs?: string[]
}

export interface StandardComponent {
  id: string
  name: string
  type: 'valve' | 'meter' | 'temperature_gauge' | 'flange' | 'pipe' | 'motor' | 'cable' | 'joint' | 'sensor' | 'screw' | 'other'
  description?: string
  createdAt: Date
  updatedAt: Date
}

export type DetectionSubjectType = 'asset' | 'component' | 'connection' | 'area_environment' | 'safety_behavior'
export type DetectionCapabilityType = 'meter_reading' | 'valve_status' | 'flange_tightness' | 'temperature' | 'gas' | 'safety_behavior' | 'area_environment'
export type CollectionQualityStatus = 'normal' | 'warning' | 'alarm' | 'critical_alarm' | 'skipped' | 'not_arrived' | 'blocked' | 'bad_angle' | 'blurred' | 'reflection' | 'target_missing' | 'unreadable'

export interface EvidenceChain {
  opticalImageUrl?: string
  thermalImageUrl?: string
  sampledAt: string
  robotPose: string
  recognizedValue: string
  confidence: number
  ruleVersion: string
  manualReviewConclusion: string
}

export interface PTZPreset {
  x: number
  y: number
  z?: number
}

export interface MapRegion {
  id: string
  name: string
  color: string
  x: number
  y: number
  width: number
  height: number
  polygonPoints?: string
  showName?: boolean
  code?: string
  zoneType?: 'normal' | 'forbidden'
  /** 区域类型（业务分类） */
  areaCategory?: string
  description?: string
  responsiblePerson?: string
  contactPhone?: string
  status?: string
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
  regions?: MapRegion[]
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

/** @deprecated 使用 road-network.ts 中的 RoadNode + NavigationPoint 替代 */
export interface Waypoint {
  id: string
  mapId: string
  name: string
  position: MapPosition
  description?: string
  createdAt: Date
  updatedAt: Date
}

/** @deprecated 使用 road-network.ts 中的 RoadEdge 替代 */
export interface WaypointEdge {
  id: string
  fromWaypointId: string
  toWaypointId: string
  distance?: number
  estimatedTimeSec?: number
  createdAt: Date
  updatedAt: Date
}

/** @deprecated 使用 road-network.ts 中的 PathResult + RoadSegment 替代 */
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
  deviceNo?: string
  deviceClassification?: string
  specModel?: string
  owner?: string
  manufacturer?: string
  expiryDate?: string
  usageCertificateNo?: string
  authorityCertificateNo?: string
  commissioningDate?: string
  lastInspectionTime?: string
  nextInspectionTime?: string
  expiryWarningDays?: number
  inspectionPostName?: string
  mapCoordinate?: string
  areaId?: string
  areaName?: string
  installationId?: string
  installationName?: string
  facilityPositionNo?: string
  facilityKind?: FacilityKind
  departmentName?: string
  storageLocation?: string
  outDate?: string
  factoryNo?: string
  issueDate?: string
  certificateIssueDate?: string
  systemName?: string
  usageDepartmentName?: string
  detectionCycle?: string
  inspectionCycle?: string
  inspectionWindow?: string
  lastInspectionConclusion?: string
  inspectionWarningDays?: number
  deviceCategory?: string
  custodianPostName?: string
  nfcId?: string
  institutionApprovalCertificate?: string
  failureWarningDays?: number
  type: string
  sequence: number
  ptzPreset?: PTZPreset
  referenceImageUrl?: string
  referenceImageVersion?: string
  source?: 'manual' | 'synced'
  status: DeviceStatus
  checkItems: InspectionDeviceCheckItem[]
  assetComponents?: InspectedAssetComponent[]
  connectionObjects?: ConnectionObject[]
  objectDetectionConfigs?: ObjectDetectionConfig[]
  parkingPointBindings?: FacilityParkingPointBinding[]
  inspectionFrequency?: { value: number; unit: 'hour'|'day'|'week' }
  executionCycle?: { startDate: string; endDate: string }
  executionWindow?: { startTime: string; endTime: string }
  createdAt: Date
  updatedAt: Date
}

export interface InspectionDeviceFormData {
  inspectionPointId: string
  name: string
  code: string
  deviceNo?: string
  deviceClassification?: string
  specModel?: string
  owner?: string
  manufacturer?: string
  expiryDate?: string
  usageCertificateNo?: string
  authorityCertificateNo?: string
  commissioningDate?: string
  lastInspectionTime?: string
  nextInspectionTime?: string
  expiryWarningDays?: number
  inspectionPostName?: string
  mapCoordinate?: string
  areaId?: string
  areaName?: string
  installationId?: string
  installationName?: string
  facilityPositionNo?: string
  facilityKind?: FacilityKind
  departmentName?: string
  storageLocation?: string
  outDate?: string
  factoryNo?: string
  issueDate?: string
  certificateIssueDate?: string
  systemName?: string
  usageDepartmentName?: string
  detectionCycle?: string
  inspectionCycle?: string
  inspectionWindow?: string
  lastInspectionConclusion?: string
  inspectionWarningDays?: number
  deviceCategory?: string
  custodianPostName?: string
  nfcId?: string
  institutionApprovalCertificate?: string
  failureWarningDays?: number
  type: string
  sequence: number
  ptzPreset?: PTZPreset
  referenceImageUrl?: string
  source?: 'manual' | 'synced'
  status?: DeviceStatus
  assetComponents?: InspectedAssetComponent[]
  connectionObjects?: ConnectionObject[]
  objectDetectionConfigs?: ObjectDetectionConfig[]
  parkingPointBindings?: FacilityParkingPointBinding[]
  inspectionFrequency?: { value: number; unit: 'hour'|'day'|'week' }
  executionCycle?: { startDate: string; endDate: string }
  executionWindow?: { startTime: string; endTime: string }
}

export interface InspectionDeviceCheckItem {
  id: string
  deviceId: string
  name: string
  code: string
  checkType?: 'threshold' | 'vision'
  priority?: 'primary' | 'secondary'
  subjectType?: DetectionSubjectType
  subjectId?: string
  targetObject?: string
  detectionType?: DetectionCapabilityType
  collectableCondition?: string
  inspectionFrequency?: { value: number; unit: 'hour' | 'day' | 'week' }
  executionCycle?: { startDate: string; endDate: string }
  executionWindow?: { startTime: string; endTime: string }
  ruleIds?: string[]
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
  priority?: 'primary' | 'secondary'
  inspectionFrequency?: { value: number; unit: 'hour' | 'day' | 'week' }
  executionCycle?: { startDate: string; endDate: string }
  executionWindow?: { startTime: string; endTime: string }
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
  parkingRoute?: Array<{
    id: string
    inspectionPointId: string
    inspectionPointName: string
    parkingPointId: string
    parkingPointName: string
    sequence: number
    position: MapPosition
    arrivalStatus: 'arrived' | 'not_arrived' | 'unreachable' | 'blocked' | 'low_battery_return' | 'localization_error' | 'communication_error'
    failureReason?: string
  }>
  collectionActions?: Array<{
    id: string
    inspectionPointId: string
    pointName: string
    parkingPointId: string
    parkingPointName: string
    collectionPoseId: string
    collectionAction: string
    targetObject: string
    ruleId?: string
    ruleName?: string
    requiredCoverage: boolean
  }>
  createdAt: string
}

export type InspectionResultStatus = 'normal' | 'warning' | 'alarm' | 'critical' | 'critical_alarm' | 'hazard' | 'major_hazard' | 'skipped' | 'uninspectable' | 'unreadable' | 'blocked' | 'bad_angle' | 'target_missing' | 'monitor_failure' | 'not_arrived' | 'unknown'

export interface InspectionTaskResult {
  id: string
  taskId: string
  inspectionPointId: string
  parkingPointId?: string
  collectionPoseId?: string
  collectionActionId?: string
  subjectName?: string
  deviceId?: string
  checkItemId?: string
  value?: string | number
  status: InspectionResultStatus
  qualityStatus?: CollectionQualityStatus | 'uninspectable' | 'monitor_failure' | 'unknown'
  evidence?: EvidenceChain
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
  pointBizType?: InspectionPointBizType
  inspectionMode?: InspectionMode
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
  areaId?: string
  areaName?: string
  areaIds?: string[]
  areaNames?: string[]
  sourcePointIds?: string[]
  sourceParkingPointIds?: string[]
  previewImageUrl?: string
  workAreaName?: string
  parkingPoints?: ParkingPoint[]
  coverageObjects?: InspectionPointCoverageObject[]
  detectionConfigs?: InspectionPointDetectionConfig[]
  executionRecords?: InspectionPointExecutionRecord[]
  calibratedAt?: Date
  updatedBy?: string
  createdAt: Date
  updatedAt: Date
}

export interface InspectionPointFormData {
  name: string
  code: string
  pointType: InspectionPointType
  pointBizType?: InspectionPointBizType
  inspectionMode?: InspectionMode
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
  areaId?: string
  areaName?: string
  areaIds?: string[]
  areaNames?: string[]
  sourcePointIds?: string[]
  sourceParkingPointIds?: string[]
  previewImageUrl?: string
  workAreaName?: string
  parkingPoints?: ParkingPoint[]
  coverageObjects?: InspectionPointCoverageObject[]
  detectionConfigs?: InspectionPointDetectionConfig[]
  executionRecords?: InspectionPointExecutionRecord[]
  calibratedAt?: Date
  updatedBy?: string
}

export interface InspectionTask {
  id: string
  planId?: string
  name: string
  code: string
  robotId: string
  routeId?: string
  snapshotId?: string
  businessScene?: 'daily_inspection' | 'hazard_screening' | 'environment_check' | 'operation_guard' | 'work_ticket_guard' | 'emergency_arrival'
  taskSource?: 'execution_plan' | 'dispatch_insert' | 'auto_recheck' | 'work_ticket' | 'third_party' | 'emergency' | 'manual'
  dispatchType?: 'insert' | 'recheck' | 'work_ticket' | 'third_party' | 'emergency' | 'charging' | 'parking' | 'replace_robot'
  priorityLevel?: 'normal' | 'high' | 'emergency'
  thirdPartyTaskNo?: string
  sourceSystemId?: string
  sourceSystemCode?: string
  sourceSystemName?: string
  syncBatchId?: string
  syncedAt?: string
  sourcePayloadDigest?: string
  interruptsCurrentTask?: boolean
  feedbackStatus?: 'pending' | 'success' | 'failed'
  riskLevel?: 'normal' | 'warning' | 'alarm' | 'critical_alarm' | 'hazard' | 'major_hazard'
  exceptionCount?: number
  uninspectableCount?: number
  reviewPendingCount?: number
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
  taskSource?: 'execution_plan' | 'dispatch_insert' | 'auto_recheck' | 'work_ticket' | 'third_party' | 'emergency' | 'manual'
  dispatchType?: 'insert' | 'recheck' | 'work_ticket' | 'third_party' | 'emergency' | 'charging' | 'parking' | 'replace_robot'
  businessScene?: 'daily_inspection' | 'hazard_screening' | 'environment_check' | 'operation_guard' | 'work_ticket_guard' | 'emergency_arrival'
  priorityLevel?: 'normal' | 'high' | 'emergency'
  riskLevel?: 'normal' | 'warning' | 'alarm' | 'critical_alarm' | 'hazard' | 'major_hazard'
  thirdPartyTaskNo?: string
  sourceSystemId?: string
  sourceSystemCode?: string
  sourceSystemName?: string
  syncBatchId?: string
  syncedAt?: string
  plannedExecuteAt?: string
  interruptsCurrentTask?: boolean
  feedbackStatus?: 'pending' | 'success' | 'failed'
  planId?: string
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
  planType?: 'manual' | 'auto'
  businessScene?: 'daily_inspection' | 'hazard_screening' | 'environment_check' | 'operation_guard' | 'work_ticket_guard' | 'emergency_arrival'
  riskLevel?: 'normal' | 'warning' | 'alarm' | 'critical_alarm' | 'hazard' | 'major_hazard'
  regionIds?: string[]
  facilityIds?: string[]
  componentConnectionIds?: string[]
  ruleIds?: string[]
  startTime?: string
  endTime?: string
  robotId?: string
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
  robotId?: string
  mapId: string
  routeId?: string
  pointIds?: string[]
  pointOrders?: { pointId: string; order: number }[]
  status: InspectionPlanStatus
  type: InspectionTaskType
  inspectionPointIds: string[]
  businessScene?: 'daily_inspection' | 'hazard_screening' | 'environment_check' | 'operation_guard' | 'work_ticket_guard' | 'emergency_arrival'
  riskLevel?: 'normal' | 'warning' | 'alarm' | 'critical_alarm' | 'hazard' | 'major_hazard'
  ruleIds?: string[]
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
