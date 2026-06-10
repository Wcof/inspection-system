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
  DetectionSubjectType,
  InspectionTask,
  InspectionPlan,
  InspectionTaskSnapshot,
  InspectionTaskResult,
  ObjectDetectionConfig,
  Installation
} from '@/types/inspection'
import { DeviceStatus, PositionSource } from '@/types/inspection'
import type { NoGoZone } from '@/types/road-network'
import { initialInspectionPoints } from './initialData'

const SCHEMA_VERSION = 9
const CONSISTENCY_REPORT_KEY = 'inspection_mock_data_consistency_report'
const VALID_DETECTION_RULE_IDS = ['dic-001', 'dic-002', 'dic-003']
const mapImageUrl = new URL('../地图.png', import.meta.url).href
const workshopImageUrl = new URL('../车间.png', import.meta.url).href
const deviceImageUrl = new URL('../设备.png', import.meta.url).href

type ConsistencySeverity = 'error' | 'warning' | 'info'

interface MockDataConsistencyIssue {
  id: string
  module: string
  type: string
  objectId: string
  objectName: string
  severity: ConsistencySeverity
  message: string
  suggestion: string
}

interface MockDataConsistencyRepair {
  id: string
  module: string
  objectId: string
  objectName: string
  field: string
  reason: string
}

interface MockDataConsistencyReport {
  generatedAt: string
  issues: MockDataConsistencyIssue[]
  repairs: MockDataConsistencyRepair[]
}

export function migrateToV2(): void {
  normalizeImageReferences()
  normalizeInstallations()

  const currentVersion = storage.get<number>(STORAGE_KEYS.SCHEMA_VERSION) || 1

  if (currentVersion < SCHEMA_VERSION) {
    console.info(`Migrating data to schema version ${SCHEMA_VERSION}...`)

    if (currentVersion < 2) {
      migrateMonitorPointsToInspectionDevices()
      migrateMetricsToCheckItems()
      migrateInspectionPoints()
    }

    if (currentVersion < 7) {
      migrateNoGoZonesAddZoneType()
    }

    if (currentVersion < 8) {
      migrateInspectionPointsAddBizTypes()
    }

    if (currentVersion < 9) {
      migrateMapRegionsAddFields()
    }

    enrichFiveLayerModel()

    storage.set(STORAGE_KEYS.SCHEMA_VERSION, SCHEMA_VERSION)
    console.info('Migration completed successfully!')
  }

  enrichFiveLayerModel()
  runMockDataConsistencyCheck()
}

function normalizeInstallations(): void {
  const installations = storage.get<Installation[]>(STORAGE_KEYS.INSTALLATIONS) || []
  if (!installations.length) return
  const next = installations.map((item) => ({
    ...item,
    installationPositionNo: item.installationPositionNo || item.code || item.id
  }))
  storage.set(STORAGE_KEYS.INSTALLATIONS, next)
}

function migrateNoGoZonesAddZoneType(): void {
  const zones = storage.get<NoGoZone[]>(STORAGE_KEYS.NO_GO_ZONES) || []
  if (!zones.length) return
  const migrated = zones.map(zone => ({
    ...zone,
    zoneType: (zone as any).zoneType || 'forbidden' as const
  }))
  storage.set(STORAGE_KEYS.NO_GO_ZONES, migrated)
}

function migrateInspectionPointsAddBizTypes(): void {
  const existing = storage.get<InspectionPoint[]>(STORAGE_KEYS.INSPECTION_POINTS) || []
  const existingIds = new Set(existing.map(p => p.id))
  const newPoints = initialInspectionPoints.filter(p => !existingIds.has(p.id))
  if (newPoints.length) {
    storage.set(STORAGE_KEYS.INSPECTION_POINTS, [...existing, ...newPoints])
  }
}

function migrateMapRegionsAddFields(): void {
  const maps = storage.get<InspectionMap[]>(STORAGE_KEYS.INSPECTION_MAPS) || []
  if (!maps.length) return
  const defaultValues = {
    'region-a': { code: 'RG-A', zoneType: 'normal' as const, description: '反应釜车间及周边区域', responsiblePerson: '张工', contactPhone: '13800001001' },
    'region-b': { code: 'RG-B', zoneType: 'normal' as const, description: '储罐及进出料管线区域', responsiblePerson: '李工', contactPhone: '13800001002' },
    'region-c': { code: 'RG-C', zoneType: 'forbidden' as const, description: '管廊检修区域，非授权禁止进入', responsiblePerson: '王工', contactPhone: '13800001003' }
  }
  const nextMaps = maps.map(map => ({
    ...map,
    regions: (map.regions || []).map((region) => {
      if (region.code) return region
      const defaults = defaultValues[region.id as keyof typeof defaultValues] || { code: `RG-${region.id.slice(-1).toUpperCase()}`, zoneType: 'normal' as const }
      return { ...region, ...defaults }
    })
  }))
  storage.set(STORAGE_KEYS.INSPECTION_MAPS, nextMaps)
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
    const enrichedCheckItems = checkItems.map(item => enrichCheckItem(item, enrichedDevices.find(device => device.id === item.deviceId)))
    storage.set(
      STORAGE_KEYS.INSPECTION_DEVICE_CHECK_ITEMS,
      enrichedCheckItems
    )
    const checkItemsByDeviceId = new Map<string, InspectionDeviceCheckItem[]>()
    enrichedCheckItems.forEach((item) => {
      const rows = checkItemsByDeviceId.get(item.deviceId) || []
      rows.push(item)
      checkItemsByDeviceId.set(item.deviceId, rows)
    })
    storage.set(
      STORAGE_KEYS.INSPECTION_DEVICES,
      enrichedDevices.map((device) => ({
        ...device,
        checkItems: checkItemsByDeviceId.get(device.id) || []
      }))
    )
  }
}

export function runMockDataConsistencyCheck(): MockDataConsistencyReport {
  const issues: MockDataConsistencyIssue[] = []
  const repairs: MockDataConsistencyRepair[] = []
  const addIssue = (
    module: string,
    type: string,
    objectId: string,
    objectName: string,
    severity: ConsistencySeverity,
    message: string,
    suggestion: string
  ) => {
    issues.push({
      id: `issue-${issues.length + 1}`,
      module,
      type,
      objectId,
      objectName,
      severity,
      message,
      suggestion
    })
  }
  const addRepair = (module: string, objectId: string, objectName: string, field: string, reason: string) => {
    repairs.push({
      id: `repair-${repairs.length + 1}`,
      module,
      objectId,
      objectName,
      field,
      reason
    })
  }

  let points = storage.get<InspectionPoint[]>(STORAGE_KEYS.INSPECTION_POINTS) || []
  const maps = storage.get<InspectionMap[]>(STORAGE_KEYS.INSPECTION_MAPS) || []
  let devices = storage.get<InspectionDevice[]>(STORAGE_KEYS.INSPECTION_DEVICES) || []
  let tasks = storage.get<InspectionTask[]>(STORAGE_KEYS.TASKS) || []
  let plans = storage.get<InspectionPlan[]>(STORAGE_KEYS.PLANS) || []
  let snapshots = storage.get<InspectionTaskSnapshot[]>(STORAGE_KEYS.INSPECTION_TASK_SNAPSHOTS) || []
  let results = storage.get<InspectionTaskResult[]>(STORAGE_KEYS.INSPECTION_TASK_RESULTS) || []

  checkDuplicateIds(points, '点位', '巡检点/地图点位', addIssue)
  checkDuplicateIds(devices, '设施', '设施设备', addIssue)
  checkDuplicateIds(tasks, '任务', '执行任务', addIssue)
  checkDuplicateIds(plans, '规划', '执行规划', addIssue)

  const mapById = new Map(maps.map(map => [map.id, map]))
  points = points.map((point) => {
    let next = point
    if (point.mapId && !mapById.has(point.mapId)) {
      addIssue('空间数据', '无效地图引用', point.id, point.name, 'error', `点位引用了不存在的地图：${point.mapId}`, '需要重新选择有效地图，不自动修复。')
    }
    if (point.areaId && point.mapId) {
      const regionExists = (mapById.get(point.mapId)?.regions || []).some(region => region.id === point.areaId)
      if (!regionExists) {
        addIssue('空间数据', '无效区域引用', point.id, point.name, 'error', `点位引用了地图中不存在的区域：${point.areaId}`, '需要在地图区域中补充该区域或调整点位巡检区域。')
      }
    }
    if (point.pointBizType === 'inspection') {
      const needsParking = !point.parkingPoints?.length
      const needsPose = (point.parkingPoints || []).some(parking => !parking.collectionPoses?.length)
      if (needsParking || needsPose) {
        next = enrichInspectionPoint(point)
        addRepair('空间数据', point.id, point.name, needsParking ? 'parkingPoints' : 'collectionPoses', '巡检点缺少停车点或采集位，按点位坐标生成最小可演示空间模型。')
      }
    }
    if (point.pointBizType !== 'inspection' && ((point.coverageObjects?.length || 0) > 0 || (point.detectionConfigs?.length || 0) > 0)) {
      next = { ...next, coverageObjects: [], detectionConfigs: [] }
      addRepair('空间数据', point.id, point.name, 'coverageObjects/detectionConfigs', '非巡检点不能承接检测配置，已清理混入的巡检配置。')
    }
    return next
  })
  storage.set(STORAGE_KEYS.INSPECTION_POINTS, points)

  const refreshedPointById = new Map(points.map(point => [point.id, point]))
  devices = devices.map((device) => {
    let next = { ...device }
    const point = refreshedPointById.get(device.inspectionPointId)
    if (device.inspectionPointId && !point) {
      addIssue('设施数据', '无效巡检点引用', device.id, device.name, 'error', `设施引用了不存在的巡检点：${device.inspectionPointId}`, '无法判断可采点位，需人工重新绑定。')
    }
    if (!next.areaId && point?.areaId) {
      next.areaId = point.areaId
      next.areaName = next.areaName || point.areaName
      addRepair('设施数据', device.id, device.name, 'areaId/areaName', '设施缺少巡检区域，已按其巡检点巡检区域补齐。')
    }
    if (!next.areaId) {
      addIssue('设施数据', '缺少巡检区域', device.id, device.name, 'warning', '设施没有巡检区域，执行规划无法按区域反推覆盖范围。', '请人工补充设施巡检区域。')
    }

    const assetComponents = next.assetComponents?.length ? normalizeAssetComponents(next.assetComponents, next) : buildAssetComponents(next.id, next)
    const connectionObjects = next.connectionObjects?.length ? normalizeConnectionObjects(next.connectionObjects, next.id) : buildConnectionObjects(next.id, next)
    if (!next.assetComponents?.length) addRepair('设施数据', next.id, next.name, 'assetComponents', '设施缺少巡检对象，已按标准巡检对象库补齐阀门、仪表、法兰等最小示例。')
    if (!next.connectionObjects?.length) addRepair('设施数据', next.id, next.name, 'connectionObjects', '设施缺少连接对象，已补齐法兰-管线等最小示例。')

    assetComponents.forEach((component) => {
      if (!component.ruleIds?.length) {
        addIssue('检测配置', '巡检对象缺少检测规则', component.id, component.name, 'warning', '巡检对象没有可用检测规则，检测配置无法生成采集动作。', '已按巡检对象类型尝试补齐默认规则；若仍为空需人工选择规则。')
      }
      const invalidRules = (component.ruleIds || []).filter(ruleId => !VALID_DETECTION_RULE_IDS.includes(ruleId))
      if (invalidRules.length) {
        addIssue('检测配置', '无效规则引用', component.id, component.name, 'error', `巡检对象引用了不存在的检测规则：${invalidRules.join('、')}`, '需要替换为已发布的检测规则。')
      }
    })
    connectionObjects.forEach((connection) => {
      if (!connection.ruleIds?.length) {
        addIssue('检测配置', '连接对象缺少检测规则', connection.id, connection.name, 'warning', '连接对象没有可用检测规则，法兰/管线类风险无法检测。', '已按连接对象类型尝试补齐默认规则；若仍为空需人工选择规则。')
      }
      const invalidRules = (connection.ruleIds || []).filter(ruleId => !VALID_DETECTION_RULE_IDS.includes(ruleId))
      if (invalidRules.length) {
        addIssue('检测配置', '无效规则引用', connection.id, connection.name, 'error', `连接对象引用了不存在的检测规则：${invalidRules.join('、')}`, '需要替换为已发布的检测规则。')
      }
    })

    const bindings = next.parkingPointBindings?.length
      ? normalizeParkingPointBindings(next.parkingPointBindings, assetComponents, connectionObjects, point)
      : buildParkingPointBindings({ ...next, assetComponents, connectionObjects }, assetComponents, connectionObjects)
    if (!next.parkingPointBindings?.length && bindings.length) {
      addRepair('设施数据', next.id, next.name, 'parkingPointBindings', '设施缺少可采停车点，已按同巡检点下的停车点补齐。')
    }
    if (!bindings.length) {
      addIssue('设施数据', '缺少可采停车点', next.id, next.name, 'warning', '设施没有可采停车点，任务无法生成采集动作。', '需要在同区域巡检点中选择可采停车点。')
    }
    bindings.forEach((binding) => {
      const bindingPoint = refreshedPointById.get(binding.inspectionPointId)
      const validParkingIds = new Set((bindingPoint?.parkingPoints || []).map(parking => parking.id))
      const missingParkingIds = (binding.parkingPointIds?.length ? binding.parkingPointIds : [binding.parkingPointId]).filter(id => id && !validParkingIds.has(id))
      if (missingParkingIds.length) {
        addIssue('设施数据', '无效停车点引用', binding.id, next.name, 'error', `可采点位引用了不存在的停车点：${missingParkingIds.join('、')}`, '需要重新选择该巡检点下的停车点。')
      }
      const refs = binding.targetObjectRefs || []
      if (!refs.length) {
        addIssue('设施数据', '停车点未关联检测对象', binding.id, next.name, 'warning', '可采停车点没有关联巡检对象或连接对象。', '需要选择该停车点能检测的巡检对象/连接。')
      }
    })

    const objectDetectionConfigs = normalizeObjectDetectionConfigs(next, assetComponents, connectionObjects, bindings, point, addIssue, addRepair)
    next = {
      ...next,
      assetComponents,
      connectionObjects,
      parkingPointBindings: bindings,
      objectDetectionConfigs
    }
    return next
  })
  storage.set(STORAGE_KEYS.INSPECTION_DEVICES, devices)

  const refreshedDeviceById = new Map(devices.map(device => [device.id, device]))
  plans = ensurePlanCoverageFields(plans, devices, points, addRepair)
  storage.set(STORAGE_KEYS.PLANS, plans)
  const planByIdAfterEnrich = new Map(plans.map(plan => [plan.id, plan]))
  plans.forEach((plan) => {
    const invalidPointIds = (plan.inspectionPointIds || []).filter(pointId => !refreshedPointById.has(pointId))
    if (invalidPointIds.length) {
      addIssue('计划任务', '规划无效点位引用', plan.id, plan.name, 'error', `执行规划引用了不存在的点位：${invalidPointIds.join('、')}`, '需要从规划范围中移除无效点位。')
    }
    const facilityIds = (plan as any).facilityIds || []
    const invalidFacilityIds = facilityIds.filter((deviceId: string) => !refreshedDeviceById.has(deviceId))
    if (invalidFacilityIds.length) {
      addIssue('计划任务', '规划无效设施引用', plan.id, plan.name, 'error', `执行规划引用了不存在的设施：${invalidFacilityIds.join('、')}`, '需要从规划范围中移除无效设施。')
    }
  })

  const reportBeforeTasks = { addIssue, addRepair, refreshedPointById, refreshedDeviceById, planById: planByIdAfterEnrich }
  const taskData = ensureMockTaskSnapshots(tasks, snapshots, results, reportBeforeTasks)
  tasks = taskData.tasks
  snapshots = taskData.snapshots
  results = ensureTaskResultsFromSnapshots(tasks, snapshots, results, addRepair)
  storage.set(STORAGE_KEYS.TASKS, tasks)
  storage.set(STORAGE_KEYS.INSPECTION_TASK_SNAPSHOTS, snapshots)
  storage.set(STORAGE_KEYS.INSPECTION_TASK_RESULTS, results)

  const report: MockDataConsistencyReport = {
    generatedAt: new Date().toISOString(),
    issues,
    repairs
  }
  storage.set(CONSISTENCY_REPORT_KEY, report)
  if (issues.length || repairs.length) {
    console.info(`[MockDataConsistency] issues=${issues.length}, repairs=${repairs.length}`)
  }
  return report
}

function checkDuplicateIds<T extends { id: string; name?: string }>(
  items: T[],
  module: string,
  type: string,
  addIssue: (
    module: string,
    type: string,
    objectId: string,
    objectName: string,
    severity: ConsistencySeverity,
    message: string,
    suggestion: string
  ) => void
) {
  const seen = new Set<string>()
  items.forEach((item) => {
    if (seen.has(item.id)) {
      addIssue(module, '重复 ID', item.id, item.name || item.id, 'error', `${type}存在重复 ID：${item.id}`, '必须人工调整重复 ID，避免页面详情和引用链指向错误对象。')
    }
    seen.add(item.id)
  })
}

function ensurePlanCoverageFields(
  plans: InspectionPlan[],
  devices: InspectionDevice[],
  points: InspectionPoint[],
  addRepair: (module: string, objectId: string, objectName: string, field: string, reason: string) => void
): InspectionPlan[] {
  return plans.map((plan, index) => {
    const pointIds = new Set(plan.inspectionPointIds || plan.pointIds || [])
    const planDevices = devices.filter(device =>
      pointIds.has(device.inspectionPointId) ||
      (device.parkingPointBindings || []).some(binding => pointIds.has(binding.inspectionPointId))
    )
    const regionIds = plan.regionIds?.length
      ? plan.regionIds
      : Array.from(new Set([
        ...points.filter(point => pointIds.has(point.id) && point.areaId).map(point => point.areaId as string),
        ...planDevices.filter(device => device.areaId).map(device => device.areaId as string)
      ]))
    const facilityIds = plan.facilityIds?.length ? plan.facilityIds : planDevices.map(device => device.id)
    const componentConnectionIds = plan.componentConnectionIds?.length
      ? plan.componentConnectionIds
      : planDevices.flatMap(device => [
        ...(device.assetComponents || []).map(component => `component:${component.id}`),
        ...(device.connectionObjects || []).map(connection => `connection:${connection.id}`)
      ])
    const ruleIds = plan.ruleIds?.length
      ? plan.ruleIds
      : Array.from(new Set(planDevices.flatMap(device => [
        ...(device.objectDetectionConfigs || []).map(config => config.ruleId),
        ...(device.assetComponents || []).flatMap(component => component.ruleIds || []),
        ...(device.connectionObjects || []).flatMap(connection => connection.ruleIds || [])
      ]).filter(Boolean)))
    const next = {
      ...plan,
      planType: plan.planType || (index === 0 ? 'auto' : 'manual'),
      businessScene: plan.businessScene || (index === 1 ? 'hazard_screening' : 'daily_inspection'),
      riskLevel: plan.riskLevel || (index === 1 ? 'warning' : 'normal'),
      regionIds,
      facilityIds,
      componentConnectionIds,
      ruleIds
    }
    const repairedFields = [
      !plan.regionIds?.length && regionIds.length ? 'regionIds' : '',
      !plan.facilityIds?.length && facilityIds.length ? 'facilityIds' : '',
      !plan.componentConnectionIds?.length && componentConnectionIds.length ? 'componentConnectionIds' : '',
      !plan.ruleIds?.length && ruleIds.length ? 'ruleIds' : ''
    ].filter(Boolean)
    if (repairedFields.length) {
      addRepair('计划任务', plan.id, plan.name, repairedFields.join('/'), '执行规划缺少区域、设施、巡检对象/连接或规则引用，已按点位与设施关系补齐。')
    }
    return next
  })
}

function ensureTaskResultsFromSnapshots(
  tasks: InspectionTask[],
  snapshots: InspectionTaskSnapshot[],
  results: InspectionTaskResult[],
  addRepair: (module: string, objectId: string, objectName: string, field: string, reason: string) => void
): InspectionTaskResult[] {
  const nextResults = [...results]
  const resultsByTaskId = new Map<string, InspectionTaskResult[]>()
  nextResults.forEach((result) => {
    const rows = resultsByTaskId.get(result.taskId) || []
    rows.push(result)
    resultsByTaskId.set(result.taskId, rows)
  })

  tasks.forEach((task) => {
    const taskResults = resultsByTaskId.get(task.id) || []
    const snapshot = snapshots.find(item => item.taskId === task.id)
    if (!snapshot?.collectionActions?.length) return
    if (taskResults.length >= snapshot.collectionActions.length) return

    const existedActionIds = new Set(taskResults.map(result => result.collectionActionId).filter(Boolean))
    snapshot.collectionActions.forEach((action, index) => {
      if (existedActionIds.has(action.id)) return
      const status = getMockResultStatus(index)
      const sampledAt = new Date(Date.now() - (index + 1) * 6 * 60 * 1000).toISOString()
      nextResults.push({
        id: `result-${action.id}`,
        taskId: task.id,
        inspectionPointId: action.inspectionPointId,
        parkingPointId: action.parkingPointId,
        collectionPoseId: action.collectionPoseId,
        collectionActionId: action.id,
        subjectName: action.targetObject,
        value: getMockResultValue(status, index),
        status,
        qualityStatus: getMockQualityStatus(status),
        evidence: {
          opticalImageUrl: deviceImageUrl,
          thermalImageUrl: workshopImageUrl,
          sampledAt,
          robotPose: `X${120 + index * 4}, Y${90 + index * 3}, Yaw${(index * 22) % 360}°`,
          recognizedValue: getMockRecognizedValue(status, index),
          confidence: ['normal', 'warning', 'alarm', 'critical_alarm'].includes(status) ? 0.92 : 0.46,
          ruleVersion: action.ruleId ? `${action.ruleId}-V1` : 'DEFAULT-V1',
          manualReviewConclusion: ['normal', 'warning'].includes(status) ? '抽检通过' : '需人工复核'
        },
        exceptionLogId: ['alarm', 'critical_alarm', 'blocked', 'bad_angle', 'target_missing', 'uninspectable', 'not_arrived'].includes(status)
          ? `alert-${task.id}-${index + 1}`
          : undefined,
        recordedAt: sampledAt,
        createdAt: new Date(sampledAt),
        updatedAt: new Date(sampledAt)
      })
    })
    addRepair('计划任务', task.id, task.name, 'InspectionTaskResult/evidence', '任务结果或证据链不完整，已按任务快照补齐光学图、热成像图、采样时间、机器人位姿和复核结论。')
  })

  return nextResults
}

function getMockResultStatus(index: number): InspectionTaskResult['status'] {
  const statuses: InspectionTaskResult['status'][] = ['normal', 'warning', 'alarm', 'critical_alarm', 'blocked', 'bad_angle', 'target_missing', 'uninspectable', 'not_arrived', 'unreadable']
  return statuses[index % statuses.length]
}

function getMockQualityStatus(status: InspectionTaskResult['status']): InspectionTaskResult['qualityStatus'] {
  if (status === 'normal' || status === 'warning' || status === 'alarm' || status === 'critical_alarm') return 'normal'
  if (status === 'uninspectable') return 'uninspectable'
  if (status === 'monitor_failure') return 'monitor_failure'
  if (status === 'unknown' || status === 'hazard' || status === 'major_hazard' || status === 'critical') return 'unknown'
  return status as InspectionTaskResult['qualityStatus']
}

function getMockResultValue(status: InspectionTaskResult['status'], index: number) {
  if (status === 'normal') return `${(12 + index * 0.8).toFixed(1)}`
  if (status === 'warning') return `${(25 + index * 1.3).toFixed(1)}`
  if (status === 'alarm' || status === 'critical_alarm') return `${(40 + index * 1.5).toFixed(1)}`
  return status
}

function getMockRecognizedValue(status: InspectionTaskResult['status'], index: number) {
  const textMap: Partial<Record<InspectionTaskResult['status'], string>> = {
    normal: `识别值 ${(12 + index * 0.8).toFixed(1)}，处于正常区间`,
    warning: `识别值 ${(25 + index * 1.3).toFixed(1)}，达到预警阈值`,
    alarm: '检测对象存在异常，需要确认',
    critical_alarm: '检测对象达到严重告警阈值',
    blocked: '目标被遮挡，不计入有效覆盖',
    bad_angle: '采集角度不足，不计入有效覆盖',
    target_missing: '目标缺失，不计入有效覆盖',
    uninspectable: '现场不可检，需要补检或人工复核',
    not_arrived: '机器人未到达停车点'
  }
  return textMap[status] || String(status)
}

function normalizeObjectDetectionConfigs(
  device: InspectionDevice,
  assetComponents: InspectedAssetComponent[],
  connectionObjects: ConnectionObject[],
  bindings: FacilityParkingPointBinding[],
  point: InspectionPoint | undefined,
  addIssue: (
    module: string,
    type: string,
    objectId: string,
    objectName: string,
    severity: ConsistencySeverity,
    message: string,
    suggestion: string
  ) => void,
  addRepair: (module: string, objectId: string, objectName: string, field: string, reason: string) => void
): ObjectDetectionConfig[] {
  const now = new Date().toISOString()
  const componentById = new Map(assetComponents.map(component => [component.id, component]))
  const connectionById = new Map(connectionObjects.map(connection => [connection.id, connection]))
  const poseIds = new Set((point?.parkingPoints || []).flatMap(parking => parking.collectionPoses.map(pose => pose.id)))
  const existing = device.objectDetectionConfigs || []
  const result: ObjectDetectionConfig[] = []
  const seen = new Set<string>()

  const addConfig = (
    subjectType: ObjectDetectionConfig['subjectType'],
    subjectId: string,
    subjectName: string,
    ruleId: string,
    collectionPoseId?: string
  ) => {
    if (!VALID_DETECTION_RULE_IDS.includes(ruleId)) return
    const key = `${subjectType}:${subjectId}:${ruleId}:${collectionPoseId || ''}`
    if (seen.has(key)) return
    seen.add(key)
    const old = existing.find(item => item.subjectType === subjectType && item.subjectId === subjectId && item.ruleId === ruleId)
    result.push({
      id: old?.id || `odc-${device.id}-${subjectType}-${subjectId}-${ruleId}`,
      deviceId: device.id,
      subjectType,
      subjectId,
      subjectName,
      ruleId,
      collectionPoseId: collectionPoseId || old?.collectionPoseId,
      requiredCoverage: old?.requiredCoverage ?? true,
      failureStrategy: old?.failureStrategy || 'manual_review',
      enabled: old?.enabled ?? true,
      remark: old?.remark,
      updatedAt: old?.updatedAt || now
    })
  }

  existing.forEach((config) => {
    const subjectExists = config.subjectType === 'component'
      ? componentById.has(config.subjectId)
      : config.subjectType === 'connection'
        ? connectionById.has(config.subjectId)
        : config.subjectType === 'asset'
          ? config.subjectId === device.id
          : true
    if (!subjectExists) {
      addIssue('检测配置', '检测配置主体无效', config.id, config.subjectName, 'error', `检测配置引用了不存在的检测主体：${config.subjectType}/${config.subjectId}`, '需要删除该配置或重新选择设施下的巡检对象/连接。')
      return
    }
    if (!VALID_DETECTION_RULE_IDS.includes(config.ruleId)) {
      addIssue('检测配置', '检测配置规则无效', config.id, config.subjectName, 'error', `检测配置引用了不存在的规则：${config.ruleId}`, '需要替换为已发布检测规则。')
      return
    }
    if (config.collectionPoseId && !poseIds.has(config.collectionPoseId)) {
      addIssue('检测配置', '采集位引用无效', config.id, config.subjectName, 'warning', `检测配置引用了不存在的采集位：${config.collectionPoseId}`, '需要在巡检点配置中重新选择采集位。')
    }
  })

  bindings.forEach((binding) => {
    const parkingIds = binding.parkingPointIds?.length ? binding.parkingPointIds : [binding.parkingPointId].filter(Boolean)
    const parking = (point?.parkingPoints || []).find(item => parkingIds.includes(item.id))
    const refs = binding.targetObjectRefs?.length ? binding.targetObjectRefs : (binding.componentIds || []).map(id => `component:${id}`)
    refs.forEach((ref) => {
      const [type, subjectId] = ref.split(':')
      if (type === 'component') {
        const component = componentById.get(subjectId)
        if (!component) return
        const poseId = getBestPoseId(parking, 'component')
          ; (component.ruleIds || []).forEach(ruleId => addConfig('component', component.id, component.name, ruleId, poseId))
        return
      }
      if (type === 'connection') {
        const connection = connectionById.get(subjectId)
        if (!connection) return
        const poseId = getBestPoseId(parking, 'connection')
          ; (connection.ruleIds || []).forEach(ruleId => addConfig('connection', connection.id, connection.name, ruleId, poseId))
      }
    })
  })

  if (!existing.length && result.length) {
    addRepair('检测配置', device.id, device.name, 'objectDetectionConfigs', '设施缺少对象检测配置，已按停车点、检测对象和规则生成最小检测配置。')
  }
  if (!result.length) {
    addIssue('检测配置', '缺少检测配置', device.id, device.name, 'warning', '设施没有有效对象检测配置，执行任务无法生成检测动作。', '请为设施的巡检对象或连接对象选择检测规则。')
  }
  return result
}

function ensureMockTaskSnapshots(
  tasks: InspectionTask[],
  snapshots: InspectionTaskSnapshot[],
  results: InspectionTaskResult[],
  context: {
    addIssue: (
      module: string,
      type: string,
      objectId: string,
      objectName: string,
      severity: ConsistencySeverity,
      message: string,
      suggestion: string
    ) => void
    addRepair: (module: string, objectId: string, objectName: string, field: string, reason: string) => void
    refreshedPointById: Map<string, InspectionPoint>
    refreshedDeviceById: Map<string, InspectionDevice>
    planById: Map<string, InspectionPlan>
  }
): { tasks: InspectionTask[]; snapshots: InspectionTaskSnapshot[] } {
  const snapshotByTaskId = new Map(snapshots.map(snapshot => [snapshot.taskId, snapshot]))
  const resultTaskIds = new Set(results.map(result => result.taskId))
  const nextSnapshots = [...snapshots]
  const nextTasks = tasks.map((task) => {
    const plan = task.planId ? context.planById.get(task.planId) : undefined
    const taskSource: InspectionTask['taskSource'] = task.taskSource || (plan ? 'execution_plan' : 'dispatch_insert')
    const taskBase = {
      ...task,
      businessScene: task.businessScene || plan?.businessScene || 'daily_inspection',
      taskSource,
      riskLevel: task.riskLevel || plan?.riskLevel || 'normal'
    }
    if (task.planId && !context.planById.has(task.planId)) {
      context.addIssue('计划任务', '任务无效规划引用', task.id, task.name, 'error', `任务引用了不存在的执行规划：${task.planId}`, '需要重新派生任务或修正规划 ID。')
    }
    const taskPoints = (task.inspectionPointIds || []).map(pointId => context.refreshedPointById.get(pointId)).filter(Boolean) as InspectionPoint[]
    const invalidPointIds = (task.inspectionPointIds || []).filter(pointId => !context.refreshedPointById.has(pointId))
    if (invalidPointIds.length) {
      context.addIssue('计划任务', '任务无效点位引用', task.id, task.name, 'error', `任务引用了不存在的点位：${invalidPointIds.join('、')}`, '需要重新生成任务或调整任务范围。')
    }
    if (!taskPoints.length) {
      context.addIssue('计划任务', '任务无有效点位', task.id, task.name, 'warning', '任务没有可执行点位，无法生成路线和采集动作。', '需要重新选择巡检区域或点位。')
      return taskBase
    }
    const existed = snapshotByTaskId.get(task.id)
    if (existed?.collectionActions?.length && resultTaskIds.has(task.id)) return taskBase

    const snapshot = buildTaskSnapshotFromMockData(task, taskPoints, context.refreshedDeviceById)
    const index = nextSnapshots.findIndex(item => item.taskId === task.id)
    if (index >= 0) nextSnapshots[index] = snapshot
    else nextSnapshots.push(snapshot)
    context.addRepair('计划任务', task.id, task.name, 'snapshotId/InspectionTaskSnapshot', '任务缺少可用快照或采集动作，已按点位、停车点、检测规则生成任务快照。')
    return { ...taskBase, snapshotId: snapshot.id }
  })
  return { tasks: nextTasks, snapshots: nextSnapshots }
}

function buildTaskSnapshotFromMockData(
  task: InspectionTask,
  taskPoints: InspectionPoint[],
  deviceById: Map<string, InspectionDevice>
): InspectionTaskSnapshot {
  const createdAt = new Date().toISOString()
  const parkingRoute: NonNullable<InspectionTaskSnapshot['parkingRoute']> = []
  const collectionActions: NonNullable<InspectionTaskSnapshot['collectionActions']> = []
  let sequence = 1
  taskPoints.forEach((point) => {
    ; (point.parkingPoints || []).forEach((parking) => {
      parkingRoute.push({
        id: `${task.id}-${parking.id}`,
        inspectionPointId: point.id,
        inspectionPointName: point.name,
        parkingPointId: parking.id,
        parkingPointName: parking.name,
        sequence: sequence++,
        position: parking.position,
        arrivalStatus: parking.constraint.reachable ? 'arrived' : 'unreachable',
        failureReason: parking.constraint.reachable ? undefined : '停车点不可达'
      })
        ; (parking.collectionPoses || []).forEach((pose) => {
          const config = (point.detectionConfigs || []).find(item => !item.collectionPoseId || item.collectionPoseId === pose.id)
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
            ruleName: config?.ruleId || '默认大模型规则',
            requiredCoverage: config?.requiredCoverage ?? true
          })
        })
    })
  })
  const pointIds = new Set(taskPoints.map(point => point.id))
  const devices = Array.from(deviceById.values())
    .filter(device =>
      pointIds.has(device.inspectionPointId) ||
      (device.parkingPointBindings || []).some(binding => pointIds.has(binding.inspectionPointId))
    )
    .map(device => ({
      id: device.id,
      inspectionPointId: device.inspectionPointId,
      name: device.name,
      sequence: device.sequence || 1,
      ptzPreset: device.ptzPreset,
      referenceImageUrl: device.referenceImageUrl,
      referenceImageVersion: device.referenceImageVersion
    }))

  return {
    id: `snapshot-${task.id}`,
    taskId: task.id,
    route: {
      id: task.routeId,
      name: task.routeId || '任务路线',
      waypointIds: [],
      inspectionPointIds: task.inspectionPointIds || []
    },
    points: taskPoints.map((point, index) => ({
      id: point.id,
      name: point.name,
      sequence: index + 1,
      mapPosition: point.mapPosition || { x: 0, y: 0, yaw: 0 },
      stayDurationSec: point.stayDurationSec
    })),
    devices,
    parkingRoute,
    collectionActions,
    createdAt
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
  if (tag === '停车点') return 'parking'
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
  const mockFacility = getMockFacilityProfile(device)
  const profiledDevice = { ...device, ...mockFacility }
  const point = (storage.get<InspectionPoint[]>(STORAGE_KEYS.INSPECTION_POINTS) || []).find(item => item.id === device.inspectionPointId)
  const assetComponents = device.assetComponents?.length ? normalizeAssetComponents(device.assetComponents, profiledDevice) : buildAssetComponents(device.id, profiledDevice)
  const connectionObjects = device.connectionObjects?.length ? normalizeConnectionObjects(device.connectionObjects, device.id) : buildConnectionObjects(device.id, profiledDevice)
  const parkingPointBindings = device.parkingPointBindings?.length
    ? normalizeParkingPointBindings(device.parkingPointBindings, assetComponents, connectionObjects, point)
    : buildParkingPointBindings(device, assetComponents, connectionObjects)
  const objectDetectionConfigs = device.objectDetectionConfigs?.length
    ? device.objectDetectionConfigs
    : buildObjectDetectionConfigs(device, parkingPointBindings, assetComponents, connectionObjects, point)
  const inspectionCycle = device.inspectionCycle || formatInspectionFrequency(device.inspectionFrequency)
  const inspectionWindow = device.inspectionWindow || formatExecutionWindow(device.executionWindow)
  const certificateIssueDate = device.certificateIssueDate || device.issueDate || device.commissioningDate || ''
  const usageDepartmentName = device.usageDepartmentName || device.departmentName || point?.areaName || ''
  const institutionApprovalCertificate = device.institutionApprovalCertificate || device.authorityCertificateNo || ''
  const failureWarningDays = device.failureWarningDays ?? device.expiryWarningDays ?? device.inspectionWarningDays
  const deviceNo = device.deviceNo || device.code || buildDeviceNo(device.id)
  const code = device.code || device.deviceNo || buildDeviceCode(device.id)
  return {
    ...device,
    ...mockFacility,
    code: mockFacility.code || code,
    deviceNo: mockFacility.deviceNo || deviceNo,
    deviceClassification: mockFacility.deviceClassification || device.deviceClassification || inferDeviceClassification(device),
    areaId: device.areaId || point?.areaId || '',
    areaName: device.areaName || point?.areaName || '',
    facilityKind: mockFacility.facilityKind || normalizeFacilityKind(device.facilityKind, device),
    deviceCategory: getFacilityKindText(mockFacility.facilityKind || normalizeFacilityKind(device.facilityKind, device)),
    owner: device.owner || '待分配',
    manufacturer: device.manufacturer || inferManufacturer(device),
    storageLocation: mockFacility.storageLocation || device.storageLocation || `${point?.areaName || '现场区域'}设备位`,
    systemName: device.systemName || inferSystemName(device, point),
    factoryNo: device.factoryNo || `${device.id.toUpperCase()}-FAC`,
    certificateIssueDate,
    usageDepartmentName,
    inspectionCycle,
    inspectionWindow,
    institutionApprovalCertificate,
    failureWarningDays,
    mapCoordinate: device.mapCoordinate || formatMapCoordinate(device),
    inspectionPostName: device.inspectionPostName || `${point?.areaName || '现场'}巡检岗`,
    custodianPostName: device.custodianPostName || '设备管理员岗',
    lastInspectionConclusion: device.lastInspectionConclusion || '待复核',
    detectionCycle: device.detectionCycle || inspectionCycle || '按计划执行',
    referenceImageUrl: device.referenceImageUrl || deviceImageUrl,
    source: device.source || 'manual',
    assetComponents,
    connectionObjects,
    parkingPointBindings,
    objectDetectionConfigs
  }
}

function getMockFacilityProfile(device: InspectionDevice): Partial<InspectionDevice> {
  const profiles: Record<string, Partial<InspectionDevice>> = {
    'mp-001': {
      name: '1号反应釜',
      code: 'FAC-RX-001',
      deviceNo: 'FAC-RX-001',
      deviceClassification: '反应设备',
      facilityPositionNo: 'RX-101',
      facilityKind: 'normal',
      deviceCategory: '普通设施',
      type: '反应釜',
      storageLocation: 'A区反应釜区',
      installationId: 'inst-001',
      installationName: '反应装置'
    },
    'mp-002': {
      name: '反应进料管线',
      code: 'PIPE-RX-IN-001',
      deviceNo: 'PIPE-RX-IN-001',
      deviceClassification: '工艺管道',
      facilityPositionNo: 'RX-P-101',
      facilityKind: 'pipeline',
      deviceCategory: '管道类设施',
      type: '工艺管线',
      storageLocation: 'A区反应进料管廊',
      installationId: 'inst-001',
      installationName: '反应装置'
    },
    'mp-003': {
      name: '反应出料管线',
      code: 'PIPE-RX-OUT-001',
      deviceNo: 'PIPE-RX-OUT-001',
      deviceClassification: '工艺管道',
      facilityPositionNo: 'RX-P-102',
      facilityKind: 'pipeline',
      deviceCategory: '管道类设施',
      type: '工艺管线',
      storageLocation: 'A区反应出料管廊',
      installationId: 'inst-001',
      installationName: '反应装置'
    },
    'mp-004': {
      name: '储罐出料管线',
      code: 'PIPE-TK-OUT-001',
      deviceNo: 'PIPE-TK-OUT-001',
      deviceClassification: '储运管道',
      facilityPositionNo: 'TK-P-201',
      facilityKind: 'pipeline',
      deviceCategory: '管道类设施',
      type: '储运管线',
      storageLocation: 'B区储罐管廊',
      installationId: 'inst-002',
      installationName: '储罐装置'
    },
    'device-001': {
      name: '1号反应釜',
      code: 'FAC-RX-001',
      deviceNo: 'FAC-RX-001',
      deviceClassification: '反应设备',
      facilityPositionNo: 'RX-101',
      facilityKind: 'normal',
      deviceCategory: '普通设施',
      type: '反应釜',
      storageLocation: 'A区反应釜区',
      installationId: 'inst-001',
      installationName: '反应装置'
    },
    'device-002': {
      name: '反应进料管线',
      code: 'PIPE-RX-IN-001',
      deviceNo: 'PIPE-RX-IN-001',
      deviceClassification: '工艺管道',
      facilityPositionNo: 'RX-P-101',
      facilityKind: 'pipeline',
      deviceCategory: '管道类设施',
      type: '工艺管线',
      storageLocation: 'A区反应进料管廊',
      installationId: 'inst-001',
      installationName: '反应装置'
    },
    'device-003': {
      name: '储罐出料管线',
      code: 'PIPE-TK-OUT-001',
      deviceNo: 'PIPE-TK-OUT-001',
      deviceClassification: '储运管道',
      facilityPositionNo: 'TK-P-201',
      facilityKind: 'pipeline',
      deviceCategory: '管道类设施',
      type: '储运管线',
      storageLocation: 'B区储罐管廊',
      installationId: 'inst-002',
      installationName: '储罐装置'
    }
  }
  return profiles[device.id] || {}
}

function normalizeFacilityKind(kind: InspectionDevice['facilityKind'], device: InspectionDevice): 'normal' | 'pipeline' {
  if (kind === 'pipeline') return 'pipeline'
  if (kind === 'normal') return 'normal'
  return inferFacilityKind(device)
}

function inferFacilityKind(device: InspectionDevice): 'normal' | 'pipeline' {
  const keywords = [device.name, device.systemName, device.installationName, device.type, device.deviceClassification]
    .filter(Boolean)
    .join(' ')
  return /管|廊|输送|管线|管道/i.test(keywords) ? 'pipeline' : 'normal'
}

function getFacilityKindText(kind: 'normal' | 'pipeline'): string {
  return kind === 'pipeline' ? '管道类设施' : '普通设施'
}

function buildAssetComponents(deviceId: string, device?: InspectionDevice): InspectedAssetComponent[] {
  const inferredType = inferPrimaryComponentType(device)
  const inferredName = inferPrimaryComponentName(device, inferredType)
  return normalizeAssetComponents([
    { id: `${deviceId}-primary`, assetId: deviceId, name: inferredName, type: inferredType, subTypeName: getDefaultComponentSubTypeName(inferredType, inferredName) },
    { id: `${deviceId}-valve`, assetId: deviceId, name: '入口阀门', type: 'valve', subType: 'pressure_valve', subTypeName: '压力阀' },
    { id: `${deviceId}-flange`, assetId: deviceId, name: '出口法兰', type: 'flange', subType: 'pipe_flange', subTypeName: '管道法兰' }
  ], device)
}

function normalizeAssetComponents(components: InspectedAssetComponent[], device?: InspectionDevice): InspectedAssetComponent[] {
  return components.map((component) => ({
    ...component,
    assetId: component.assetId || device?.id || '',
    name: normalizeMockComponentName(component, device),
    subTypeName: component.subTypeName || getDefaultComponentSubTypeName(component.type, normalizeMockComponentName(component, device)),
    ruleIds: component.ruleIds?.length ? component.ruleIds : getDefaultRuleIdsForComponent(component.type, normalizeMockComponentName(component, device))
  }))
}

function normalizeMockComponentName(component: InspectedAssetComponent, device?: InspectionDevice) {
  if (!device || !/^(mp|device)-/.test(device.id)) return component.name
  if (component.id.endsWith('-primary')) return inferPrimaryComponentName(device, component.type)
  return component.name
}

function getDefaultComponentSubTypeName(type: InspectedAssetComponent['type'], name: string) {
  if (type === 'valve') {
    if (name.includes('压力')) return '压力阀'
    if (name.includes('水')) return '普通水阀'
    if (name.includes('气')) return '气动阀'
    return '普通工艺阀'
  }
  if (type === 'meter') return '压力表'
  if (type === 'temperature_gauge') return '温度表'
  if (type === 'flange') return '管道法兰'
  if (type === 'pipe') return '工艺管段'
  if (type === 'sensor') return '现场传感器'
  return ''
}

function buildConnectionObjects(deviceId: string, device?: InspectionDevice): ConnectionObject[] {
  const primaryComponent = inferPrimaryComponentName(device, inferPrimaryComponentType(device))
  return normalizeConnectionObjects([
    { id: `${deviceId}-conn-primary-valve`, name: `${primaryComponent}-入口阀门`, endpointA: primaryComponent, endpointB: '入口阀门', detectionFocus: '联动状态/外观' },
    { id: `${deviceId}-conn-flange-pipe`, name: '法兰-管线', endpointA: '出口法兰', endpointB: '出口管线', detectionFocus: '紧密度/温升' }
  ], deviceId)
}

function normalizeConnectionObjects(connections: ConnectionObject[], deviceId: string): ConnectionObject[] {
  return connections.map((connection) => ({
    ...connection,
    sinkScope: connection.sinkScope || 'self',
    sinkDeviceId: connection.sinkDeviceId || deviceId,
    ruleIds: connection.ruleIds?.length ? connection.ruleIds : getDefaultRuleIdsForConnection(connection.name, connection.detectionFocus)
  }))
}

function buildParkingPointBindings(
  device: InspectionDevice,
  assetComponents: InspectedAssetComponent[],
  connectionObjects: ConnectionObject[]
): FacilityParkingPointBinding[] {
  const points = storage.get<InspectionPoint[]>(STORAGE_KEYS.INSPECTION_POINTS) || []
  const point = points.find(item => item.id === device.inspectionPointId)
  const parkingPoints = point?.parkingPoints || []
  return parkingPoints.slice(0, 2).map((parking, index) => ({
    id: `${device.id}-binding-${parking.id}`,
    inspectionPointId: point?.id || device.inspectionPointId,
    inspectionPointName: point?.name || device.inspectionPointId,
    parkingPointId: parking.id,
    parkingPointName: parking.name,
    componentIds: assetComponents
      .filter((_, componentIndex) => (componentIndex + index) % 2 === 0)
      .map(component => component.id),
    inspectionMode: 'fixed',
    parkingPointIds: [parking.id],
    parkingPointNames: [parking.name],
    targetObjectRefs: [
      ...assetComponents
        .filter((_, componentIndex) => (componentIndex + index) % 2 === 0)
        .map(component => `component:${component.id}`),
      ...connectionObjects
        .filter((_, connectionIndex) => connectionIndex === index)
        .map(connection => `connection:${connection.id}`)
    ]
  }))
}

function normalizeParkingPointBindings(
  bindings: FacilityParkingPointBinding[],
  assetComponents: InspectedAssetComponent[],
  connectionObjects: ConnectionObject[],
  point?: InspectionPoint
): FacilityParkingPointBinding[] {
  return bindings.map((binding) => {
    const parkingIds = binding.parkingPointIds?.length ? binding.parkingPointIds : [binding.parkingPointId].filter(Boolean)
    const parkingNames = binding.parkingPointNames?.length
      ? binding.parkingPointNames
      : [binding.parkingPointName].filter(Boolean)
    const componentRefs = (binding.componentIds || []).map(id => `component:${id}`)
    const targetObjectRefs = binding.targetObjectRefs?.length
      ? binding.targetObjectRefs
      : componentRefs.length
        ? componentRefs
        : assetComponents.slice(0, 1).map(component => `component:${component.id}`)
    const normalizedNames = parkingNames.length
      ? parkingNames
      : parkingIds.map((parkingId) => point?.parkingPoints?.find(item => item.id === parkingId)?.name || parkingId)
    return {
      ...binding,
      inspectionPointName: binding.inspectionPointName || point?.name || binding.inspectionPointId,
      inspectionMode: binding.inspectionMode || (parkingIds.length > 1 ? 'area' : 'fixed'),
      parkingPointId: binding.parkingPointId || parkingIds[0] || '',
      parkingPointName: binding.parkingPointName || normalizedNames[0] || '',
      parkingPointIds: parkingIds,
      parkingPointNames: normalizedNames,
      componentIds: componentRefs.length
        ? componentRefs.map(ref => ref.split(':')[1])
        : targetObjectRefs.filter(ref => ref.startsWith('component:')).map(ref => ref.split(':')[1]),
      targetObjectRefs: targetObjectRefs.filter((ref) => {
        const [type, id] = ref.split(':')
        return type === 'component'
          ? assetComponents.some(item => item.id === id)
          : connectionObjects.some(item => item.id === id)
      })
    }
  })
}

function buildObjectDetectionConfigs(
  device: InspectionDevice,
  bindings: FacilityParkingPointBinding[],
  assetComponents: InspectedAssetComponent[],
  connectionObjects: ConnectionObject[],
  point?: InspectionPoint
) {
  const configs: InspectionDevice['objectDetectionConfigs'] = []
  const now = new Date().toISOString()
  const seen = new Set<string>()

  const createConfig = (
    subjectType: 'component' | 'connection',
    subjectId: string,
    subjectName: string,
    ruleId: string,
    collectionPoseId?: string
  ) => {
    const key = `${subjectType}-${subjectId}-${ruleId}-${collectionPoseId || 'none'}`
    if (seen.has(key)) return
    seen.add(key)
    configs.push({
      id: `${device.id}-${subjectType}-${subjectId}-${ruleId}`,
      deviceId: device.id,
      subjectType,
      subjectId,
      subjectName,
      ruleId,
      collectionPoseId,
      requiredCoverage: true,
      failureStrategy: 'manual_review',
      enabled: true,
      updatedAt: now
    })
  }

  bindings.forEach((binding) => {
    const parkingIds = binding.parkingPointIds?.length ? binding.parkingPointIds : [binding.parkingPointId].filter(Boolean)
    const parkingId = parkingIds[0]
    const parking = point?.parkingPoints?.find(item => item.id === parkingId)
    const targetRefs = binding.targetObjectRefs?.length ? binding.targetObjectRefs : (binding.componentIds || []).map(id => `component:${id}`)
    targetRefs.forEach((ref) => {
      const [type, subjectId] = ref.split(':')
      if (type === 'component') {
        const component = assetComponents.find(item => item.id === subjectId)
        if (!component) return
        const poseId = getBestPoseId(parking, 'component')
          ; (component.ruleIds || []).forEach(ruleId => createConfig('component', component.id, component.name, ruleId, poseId))
        return
      }
      const connection = connectionObjects.find(item => item.id === subjectId)
      if (!connection) return
      const poseId = getBestPoseId(parking, 'connection')
        ; (connection.ruleIds || []).forEach(ruleId => createConfig('connection', connection.id, connection.name, ruleId, poseId))
    })
  })

  return configs
}

function getBestPoseId(parking: ParkingPoint | undefined, targetType: 'component' | 'connection') {
  if (!parking) return undefined
  return parking.collectionPoses.find(pose => pose.targetType === targetType)?.id || parking.collectionPoses[0]?.id
}

function buildDeviceNo(deviceId: string) {
  const suffix = deviceId.replace(/\D/g, '').slice(-4).padStart(4, '0')
  return `EQ-2026-${suffix}`
}

function buildDeviceCode(deviceId: string) {
  return buildDeviceNo(deviceId)
}

function inferDeviceClassification(device: InspectionDevice) {
  const tag = `${device.type || ''}${device.name || ''}`
  if (tag.includes('温')) return '温度监测'
  if (tag.includes('压')) return '压力监测'
  if (tag.includes('液位')) return '液位监测'
  if (tag.includes('阀')) return '阀门状态'
  if (tag.includes('气')) return '气体监测'
  return '现场设备监测'
}

function inferManufacturer(device: InspectionDevice) {
  const tag = `${device.type || ''}${device.name || ''}`
  if (tag.includes('温') || tag.includes('压') || tag.includes('液位')) return '华南仪表'
  if (tag.includes('阀')) return '中控阀业'
  if (tag.includes('气')) return '安环传感'
  return '现场设备厂家'
}

function inferSystemName(device: InspectionDevice, point?: InspectionPoint) {
  return device.systemName || `${point?.areaName || '现场'}巡检系统`
}

function formatMapCoordinate(device: InspectionDevice) {
  const preset = device.ptzPreset
  return preset ? `${preset.x},${preset.y},${preset.z}` : ''
}

function formatInspectionFrequency(frequency?: InspectionDevice['inspectionFrequency']) {
  if (!frequency?.value || !frequency.unit) return ''
  const unitMap = { hour: '小时', day: '天', week: '周' } as const
  return `每${frequency.value}${unitMap[frequency.unit]}`
}

function formatExecutionWindow(window?: InspectionDevice['executionWindow']) {
  if (!window?.startTime || !window?.endTime) return ''
  return `${window.startTime}-${window.endTime}`
}

function inferPrimaryComponentType(device?: InspectionDevice): InspectedAssetComponent['type'] {
  const tag = `${device?.type || ''}${device?.name || ''}`
  if (tag.includes('温')) return 'temperature_gauge'
  if (tag.includes('压') || tag.includes('液位') || tag.includes('表')) return 'meter'
  if (tag.includes('阀')) return 'valve'
  if (tag.includes('电机')) return 'motor'
  if (tag.includes('传感')) return 'sensor'
  return 'other'
}

function inferPrimaryComponentName(device: InspectionDevice | undefined, type: InspectedAssetComponent['type']) {
  if (device?.name) return device.name
  const map: Record<InspectedAssetComponent['type'], string> = {
    valve: '入口阀门',
    meter: '压力表',
    temperature_gauge: '温度表',
    flange: '法兰',
    motor: '电机',
    pipe: '管体',
    cable: '电缆',
    joint: '接头',
    sensor: '传感器',
    screw: '螺杆',
    other: '现场巡检对象'
  }
  return map[type]
}

function getDefaultRuleIdsForComponent(type: InspectedAssetComponent['type'], name: string) {
  const text = `${type}${name}`
  if (text.includes('压力')) return ['dic-001', 'dic-002', 'dic-003']
  if (text.includes('温') || type === 'temperature_gauge') return ['dic-001']
  if (text.includes('液位')) return ['dic-001']
  if (text.includes('阀') || type === 'valve') return ['dic-002']
  if (text.includes('法兰') || type === 'flange') return ['dic-002']
  if (text.includes('电机') || type === 'motor') return ['dic-002']
  return ['dic-002']
}

function getDefaultRuleIdsForConnection(name: string, detectionFocus?: string) {
  const text = `${name}${detectionFocus || ''}`
  if (text.includes('法兰')) return ['dic-002']
  if (text.includes('阀')) return ['dic-002']
  if (text.includes('温')) return ['dic-001']
  if (text.includes('液位')) return ['dic-001']
  if (text.includes('气')) return ['dic-001']
  return []
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
