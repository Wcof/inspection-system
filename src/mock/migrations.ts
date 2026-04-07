import { storage, STORAGE_KEYS } from '@/utils/storage'
import type {
  MonitorPoint,
  Metric,
  InspectionPoint,
  InspectionDevice,
  InspectionDeviceCheckItem,
  CalibrationStatus
} from '@/types/inspection'
import { DeviceStatus, PositionSource } from '@/types/inspection'

const SCHEMA_VERSION = 2

export function migrateToV2(): void {
  const currentVersion = storage.get<number>(STORAGE_KEYS.SCHEMA_VERSION) || 1
  
  if (currentVersion >= SCHEMA_VERSION) {
    return
  }
  
  console.log('Migrating data to schema version 2...')
  
  migrateMonitorPointsToInspectionDevices()
  migrateMetricsToCheckItems()
  migrateInspectionPoints()
  
  storage.set(STORAGE_KEYS.SCHEMA_VERSION, SCHEMA_VERSION)
  console.log('Migration completed successfully!')
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
