import { storage, STORAGE_KEYS } from '@/utils/storage'
import type {
  MonitorPoint,
  Metric,
  InspectionPoint,
  InspectionDevice,
  InspectionDeviceCheckItem,
  InspectionMap,
  CalibrationStatus,
  ParkingPoint,
  CollectionPose,
  InspectedAssetComponent,
  ConnectionObject,
  FacilityParkingPointBinding,
  InspectionPointCoverageObject,
  InspectionPointDetectionConfig,
  DetectionCapabilityType,
  DetectionSubjectType
} from '@/types/inspection'
import { DeviceStatus, PositionSource } from '@/types/inspection'

const SCHEMA_VERSION = 4
const mapImageUrl = new URL('../地图.png', import.meta.url).href
const workshopImageUrl = new URL('../车间.png', import.meta.url).href
const deviceImageUrl = new URL('../设备.png', import.meta.url).href

export function migrateToV2(): void {
  normalizeImageReferences()

  const currentVersion = storage.get<number>(STORAGE_KEYS.SCHEMA_VERSION) || 1
  
  if (currentVersion >= SCHEMA_VERSION) {
    return
  }
  
  console.log('Migrating data to schema version 2...')
  
  migrateMonitorPointsToInspectionDevices()
  migrateMetricsToCheckItems()
  migrateInspectionPoints()
  enrichFiveLayerModel()
  
  storage.set(STORAGE_KEYS.SCHEMA_VERSION, SCHEMA_VERSION)
  console.log('Migration completed successfully!')
}

function normalizeImageReferences(): void {
  const maps = storage.get<InspectionMap[]>(STORAGE_KEYS.INSPECTION_MAPS) || []
  if (maps.length) {
    const nextMaps = maps.map((item) => ({ ...item, imageUrl: mapImageUrl }))
    storage.set(STORAGE_KEYS.INSPECTION_MAPS, nextMaps)
  }

  const points = storage.get<InspectionPoint[]>(STORAGE_KEYS.INSPECTION_POINTS) || []
  if (points.length) {
    const nextPoints = points.map((item) => ({ ...item, previewImageUrl: workshopImageUrl }))
    storage.set(STORAGE_KEYS.INSPECTION_POINTS, nextPoints)
  }

  const devices = storage.get<InspectionDevice[]>(STORAGE_KEYS.INSPECTION_DEVICES) || []
  if (devices.length) {
    const nextDevices = devices.map((item) => ({ ...item, referenceImageUrl: deviceImageUrl }))
    storage.set(STORAGE_KEYS.INSPECTION_DEVICES, nextDevices)
  }

  const checkItems = storage.get<InspectionDeviceCheckItem[]>(STORAGE_KEYS.INSPECTION_DEVICE_CHECK_ITEMS) || []
  if (checkItems.length) {
    const nextCheckItems = checkItems.map((item) => ({
      ...item,
      visionMapping: item.visionMapping
        ? { ...item.visionMapping, customImageUrl: deviceImageUrl }
        : item.visionMapping
    }))
    storage.set(STORAGE_KEYS.INSPECTION_DEVICE_CHECK_ITEMS, nextCheckItems)
  }
}

function migrateMonitorPointsToInspectionDevices(): void {
  const monitorPoints = storage.get<MonitorPoint[]>(STORAGE_KEYS.MONITOR_POINTS) || []
  
  if (monitorPoints.length === 0) {
    return
  }
  
  const inspectionDevices: InspectionDevice[] = monitorPoints.map((mp, index) => ({
    id: mp.id,
    inspectionPointId: mp.inspectionPointId,
    name: mp.name,
    code: mp.code,
    type: mp.deviceType,
    sequence: index + 1,
    ptzPreset: mp.position ? {
      x: mp.position.x,
      y: mp.position.y,
      z: mp.position.z
    } : undefined,
    status: DeviceStatus.ACTIVE,
    checkItems: [],
    createdAt: mp.createdAt,
    updatedAt: mp.updatedAt
  }))
  
  storage.set(STORAGE_KEYS.INSPECTION_DEVICES, inspectionDevices)
}

function migrateMetricsToCheckItems(): void {
  const metrics = storage.get<Metric[]>(STORAGE_KEYS.METRICS) || []
  
  if (metrics.length === 0) {
    return
  }
  
  const checkItems: InspectionDeviceCheckItem[] = metrics.map(metric => ({
    id: metric.id,
    deviceId: metric.monitorPointId,
    name: metric.name,
    code: metric.code,
    unit: metric.unit,
    threshold: metric.threshold,
    createdAt: metric.createdAt,
    updatedAt: metric.updatedAt
  }))
  
  storage.set(STORAGE_KEYS.INSPECTION_DEVICE_CHECK_ITEMS, checkItems)
}

function migrateInspectionPoints(): void {
  const inspectionPoints = storage.get<InspectionPoint[]>(STORAGE_KEYS.INSPECTION_POINTS) || []
  
  if (inspectionPoints.length === 0) {
    return
  }
  
  const migratedPoints: InspectionPoint[] = inspectionPoints.map((point, index) => ({
    ...point,
    mapId: point.mapId || 'map-001',
    mapPosition: undefined,
    waypointId: undefined,
    sequence: index + 1,
    calibrationStatus: 'pending' as CalibrationStatus,
    stayDurationSec: 30,
    positionSource: PositionSource.MAP_PICK
  }))
  
  storage.set(STORAGE_KEYS.INSPECTION_POINTS, migratedPoints)
}

function enrichFiveLayerModel(): void {
  const points = storage.get<InspectionPoint[]>(STORAGE_KEYS.INSPECTION_POINTS) || []
  if (points.length) {
    storage.set(STORAGE_KEYS.INSPECTION_POINTS, points.map(enrichInspectionPoint))
  }

  const devices = storage.get<InspectionDevice[]>(STORAGE_KEYS.INSPECTION_DEVICES) || []
  if (devices.length) {
    storage.set(STORAGE_KEYS.INSPECTION_DEVICES, devices.map(enrichInspectionDevice))
  }

  const enrichedDevices = storage.get<InspectionDevice[]>(STORAGE_KEYS.INSPECTION_DEVICES) || []
  const checkItems = storage.get<InspectionDeviceCheckItem[]>(STORAGE_KEYS.INSPECTION_DEVICE_CHECK_ITEMS) || []
  if (checkItems.length) {
    storage.set(
      STORAGE_KEYS.INSPECTION_DEVICE_CHECK_ITEMS,
      checkItems.map(item => enrichCheckItem(item, enrichedDevices.find(device => device.id === item.deviceId)))
    )
  }
}

function enrichInspectionPoint(point: InspectionPoint): InspectionPoint {
  const normalized = {
    ...point,
    pointBizType: point.pointBizType || inferPointBizType(point),
    inspectionMode: point.inspectionMode || (point.pointType === 'area' ? 'area' : 'fixed')
  } as InspectionPoint
  if (normalized.parkingPoints?.length && normalized.coverageObjects?.length && normalized.detectionConfigs?.length) return normalized
  const spatialModel = buildSpatialModel(point)
  const coverageObjects = normalized.coverageObjects?.length ? normalized.coverageObjects : buildCoverageObjects(normalized)
  const detectionConfigs = normalized.detectionConfigs?.length ? normalized.detectionConfigs : buildPointDetectionConfigs(normalized, coverageObjects, spatialModel.parkingPoints)
  return {
    ...normalized,
    workAreaName: normalized.workAreaName || spatialModel.workArea,
    parkingPoints: normalized.parkingPoints?.length ? normalized.parkingPoints : spatialModel.parkingPoints,
    coverageObjects,
    detectionConfigs,
    executionRecords: normalized.executionRecords?.length ? normalized.executionRecords : buildExecutionRecords(normalized)
  }
}

function inferPointBizType(point: InspectionPoint): InspectionPoint['pointBizType'] {
  const tag = String(point.description || '').match(/^\[(巡检点|停车点|充电点|充电站|维修站|通行点|临停点)\]/)?.[1]
  if (tag === '充电点' || tag === '充电站') return 'charging'
  if (tag === '维修站') return 'maintenance'
  if (tag === '通行点' || tag === '临停点') return 'standby'
  return 'inspection'
}

function buildSpatialModel(point: InspectionPoint): { workArea: string; parkingPoints: ParkingPoint[] } {
  const pointNo = Number(String(point.id).replace(/\D/g, '')) || 1
  const baseX = Number(point.mapPosition?.x || 120)
  const baseY = Number(point.mapPosition?.y || 120)
  const workArea = point.areaName || (pointNo % 2 === 0 ? '泵组作业区' : '反应装置区')
  const parkingPoints: ParkingPoint[] = [
    {
      id: `${point.id}-parking-front`,
      inspectionPointId: point.id,
      name: `${point.name}-正前方停车点`,
      position: { x: Math.round(baseX), y: Math.round(baseY), yaw: point.mapPosition?.yaw || 0 },
      constraint: {
        reachable: true,
        reverseRequired: pointNo % 3 === 0,
        turnAroundRequired: pointNo % 2 === 0,
        narrowRoad: pointNo % 2 === 1,
        slope: false,
        bridgeRequired: pointNo % 4 === 0,
        detourRequired: false
      },
      collectionPoses: buildCollectionPoses(point, 'front')
    },
    {
      id: `${point.id}-parking-side`,
      inspectionPointId: point.id,
      name: `${point.name}-侧向停车点`,
      position: { x: Math.round(baseX + 18), y: Math.round(baseY + 12), yaw: 90 },
      constraint: {
        reachable: true,
        reverseRequired: true,
        turnAroundRequired: false,
        narrowRoad: true,
        slope: pointNo % 5 === 0,
        bridgeRequired: false,
        detourRequired: pointNo % 3 === 0
      },
      collectionPoses: buildCollectionPoses(point, 'side')
    }
  ]
  return { workArea, parkingPoints }
}

function buildCollectionPoses(point: InspectionPoint, side: 'front' | 'side'): CollectionPose[] {
  const prefix = side === 'front' ? '正拍' : '侧拍'
  return [
    {
      id: `${point.id}-${side}-meter`,
      parkingPointId: `${point.id}-parking-${side}`,
      targetName: `${prefix}压力表读数`,
      targetType: 'component',
      direction: side === 'front' ? 'front' : 'side',
      distanceMeter: side === 'front' ? 1.8 : 2.4,
      ptzYaw: side === 'front' ? 0 : 35,
      ptzPitch: -12,
      focalLength: side === 'front' ? '35mm' : '50mm',
      method: 'optical',
      collectableCondition: '无遮挡、无强反光、表盘刻度完整'
    },
    {
      id: `${point.id}-${side}-flange`,
      parkingPointId: `${point.id}-parking-${side}`,
      targetName: `${prefix}阀门/法兰紧密度`,
      targetType: 'connection',
      direction: side === 'front' ? 'oblique' : 'side',
      distanceMeter: side === 'front' ? 2.2 : 1.6,
      ptzYaw: side === 'front' ? 18 : 60,
      ptzPitch: -8,
      focalLength: '70mm',
      method: 'thermal',
      collectableCondition: '连接面可见，热成像目标不被管线遮挡'
    }
  ]
}

function enrichInspectionDevice(device: InspectionDevice): InspectionDevice {
  const parkingPointBindings = device.parkingPointBindings?.length ? device.parkingPointBindings : buildParkingPointBindings(device)
  return {
    ...device,
    source: device.source || 'manual',
    assetComponents: device.assetComponents?.length ? device.assetComponents : buildAssetComponents(device.id),
    connectionObjects: device.connectionObjects?.length ? device.connectionObjects : buildConnectionObjects(device.id),
    parkingPointBindings
  }
}

function buildAssetComponents(deviceId: string): InspectedAssetComponent[] {
  return [
    { id: `${deviceId}-valve`, assetId: deviceId, name: '入口阀门', type: 'valve' },
    { id: `${deviceId}-meter`, assetId: deviceId, name: '压力表', type: 'meter' },
    { id: `${deviceId}-flange`, assetId: deviceId, name: '出口法兰', type: 'flange' },
    { id: `${deviceId}-motor`, assetId: deviceId, name: '驱动电机', type: 'motor' }
  ]
}

function buildConnectionObjects(deviceId: string): ConnectionObject[] {
  return [
    { id: `${deviceId}-conn-valve-pipe`, name: '阀门-管线', endpointA: '入口阀门', endpointB: '入口管线', detectionFocus: '开闭状态/泄漏' },
    { id: `${deviceId}-conn-flange-pipe`, name: '法兰-管线', endpointA: '出口法兰', endpointB: '出口管线', detectionFocus: '紧密度/温升' },
    { id: `${deviceId}-conn-pump-out`, name: '泵出口-管线', endpointA: '泵出口', endpointB: '出口管线', detectionFocus: '振动/温升' }
  ]
}

function buildParkingPointBindings(device: InspectionDevice): FacilityParkingPointBinding[] {
  const points = storage.get<InspectionPoint[]>(STORAGE_KEYS.INSPECTION_POINTS) || []
  const point = points.find(item => item.id === device.inspectionPointId)
  const parkingPoints = point?.parkingPoints || []
  const components = buildAssetComponents(device.id)
  return parkingPoints.slice(0, 2).map((parking, index) => ({
    id: `${device.id}-binding-${parking.id}`,
    inspectionPointId: point?.id || device.inspectionPointId,
    inspectionPointName: point?.name || device.inspectionPointId,
    parkingPointId: parking.id,
    parkingPointName: parking.name,
    componentIds: components
      .filter((_, componentIndex) => (componentIndex + index) % 2 === 0)
      .map(component => component.id)
  }))
}

function buildCoverageObjects(point: InspectionPoint): InspectionPointCoverageObject[] {
  const devices = (storage.get<InspectionDevice[]>(STORAGE_KEYS.INSPECTION_DEVICES) || []).filter(device => device.inspectionPointId === point.id)
  if (devices.length) {
    return devices.flatMap((device) => {
      const components: InspectionPointCoverageObject[] = (device.assetComponents || buildAssetComponents(device.id)).slice(0, 2).map((component, index) => ({
        id: `${point.id}-coverage-component-${component.id}`,
        type: 'component' as const,
        name: component.name,
        deviceId: device.id,
        componentId: component.id,
        coverageType: index === 0 ? 'primary' : 'secondary',
        coverageStatus: 'coverable' as const,
        requiredCoverage: index === 0
      }))
      const connections: InspectionPointCoverageObject[] = (device.connectionObjects || buildConnectionObjects(device.id)).slice(0, 1).map(connection => ({
        id: `${point.id}-coverage-connection-${connection.id}`,
        type: 'connection' as const,
        name: connection.name,
        deviceId: device.id,
        connectionId: connection.id,
        coverageType: 'backup' as const,
        coverageStatus: 'partial' as const,
        requiredCoverage: false
      }))
      return [
        {
          id: `${point.id}-coverage-asset-${device.id}`,
          type: 'asset' as const,
          name: device.name,
          deviceId: device.id,
          coverageType: 'primary' as const,
          coverageStatus: 'coverable' as const,
          requiredCoverage: true
        },
        ...components,
        ...connections
      ]
    })
  }

  return [
    {
      id: `${point.id}-coverage-area`,
      type: 'area_environment',
      name: `${point.areaName || point.name}区域环境`,
      areaName: point.areaName || point.name,
      coverageType: 'primary',
      coverageStatus: 'coverable',
      requiredCoverage: true
    }
  ]
}

function buildPointDetectionConfigs(point: InspectionPoint, coverageObjects: InspectionPointCoverageObject[], parkingPoints: ParkingPoint[]): InspectionPointDetectionConfig[] {
  const poseIds = parkingPoints.flatMap(parking => parking.collectionPoses.map(pose => pose.id))
  return coverageObjects.slice(0, 4).map((item, index) => ({
    id: `${point.id}-dc-${item.id}`,
    inspectionPointId: point.id,
    subjectType: item.type === 'component' || item.type === 'connection' || item.type === 'asset' || item.type === 'area_environment' ? item.type : 'area_environment',
    subjectId: item.componentId || item.connectionId || item.deviceId || item.id,
    subjectName: item.name,
    ruleId: `mock-rule-${index + 1}`,
    collectionPoseId: poseIds[index % Math.max(1, poseIds.length)],
    requiredCoverage: item.requiredCoverage,
    failureStrategy: index % 2 === 0 ? 'manual_review' : 'supplement_task',
    enabled: true,
    remark: index === 0 ? '默认关键检测配置' : '',
    updatedAt: new Date().toISOString()
  }))
}

function buildExecutionRecords(point: InspectionPoint) {
  return [
    {
      id: `${point.id}-record-1`,
      inspectionPointId: point.id,
      taskName: `计划巡检-${point.name}`,
      executedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      resultSummary: '已完成，存在 1 项需人工复核',
      executor: '机器人A001'
    },
    {
      id: `${point.id}-record-2`,
      inspectionPointId: point.id,
      taskName: `临时复检-${point.name}`,
      executedAt: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
      resultSummary: '已完成，覆盖正常',
      executor: '机器人A002'
    }
  ]
}

function enrichCheckItem(item: InspectionDeviceCheckItem, device?: InspectionDevice): InspectionDeviceCheckItem {
  const detectionType = item.detectionType || inferDetectionType(item.name)
  const subjectType = item.subjectType || inferSubjectType(detectionType)
  return {
    ...item,
    subjectType,
    targetObject: item.targetObject || inferTargetObject(item.name, subjectType, device),
    detectionType,
    collectableCondition: item.collectableCondition || inferCollectableCondition(detectionType)
  }
}

function inferDetectionType(name: string): DetectionCapabilityType {
  if (name.includes('气') || name.includes('氧') || name.includes('硫化氢') || name.includes('一氧化碳')) return 'gas'
  if (name.includes('阀')) return 'valve_status'
  if (name.includes('法兰') || name.includes('连接')) return 'flange_tightness'
  if (name.includes('温')) return 'temperature'
  if (name.includes('表') || name.includes('压力') || name.includes('液位')) return 'meter_reading'
  return 'area_environment'
}

function inferSubjectType(detectionType: DetectionCapabilityType): DetectionSubjectType {
  if (detectionType === 'gas' || detectionType === 'area_environment') return 'area_environment'
  if (detectionType === 'flange_tightness') return 'connection'
  if (detectionType === 'safety_behavior') return 'safety_behavior'
  return 'component'
}

function inferTargetObject(name: string, subjectType: DetectionSubjectType, device?: InspectionDevice): string {
  if (subjectType === 'area_environment') return device?.areaName || '巡检点附近区域'
  if (subjectType === 'connection') return '法兰-管线'
  if (name.includes('阀')) return '入口阀门'
  if (name.includes('电机')) return '驱动电机'
  if (name.includes('表') || name.includes('压力')) return '压力表'
  return device?.assetComponents?.[0]?.name || device?.name || '资产实例'
}

function inferCollectableCondition(detectionType: DetectionCapabilityType): string {
  if (detectionType === 'gas') return '按区域最近一次采样值判断，需显示采样时间'
  if (detectionType === 'flange_tightness') return '连接面可见，无遮挡或强反光'
  if (detectionType === 'valve_status') return '侧拍阀杆/手柄，角度满足开闭识别'
  if (detectionType === 'meter_reading') return '正拍表盘，刻度清晰'
  return '按采集位条件执行'
}
