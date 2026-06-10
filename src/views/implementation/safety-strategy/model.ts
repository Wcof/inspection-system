export type Priority = 'high' | 'medium' | 'low'
export type TimeoutAction = 'slowdown' | 'stop' | 'slowdown_then_stop'
export type PublishStatus = '草稿' | '启用' | '停用'

export interface NarrowRoadConfig {
  enabled: boolean
  narrowWidthThreshold: number
  speedLimit: number
  safeDistanceOverride: number
  voiceAlert: boolean
}

export interface BridgeConfig {
  enabled: boolean
  speedLimit: number
  minWidth: number
  maxSlope: number
  iceSlowdownPercent: number
  voiceAlert: boolean
}

export interface BlindCornerConfig {
  enabled: boolean
  speedLimit: number
  voiceAlert: boolean
  voiceMessage: string
}

export interface SafetyStrategy {
  id: string
  name: string
  description: string
  priority: Priority
  status: PublishStatus
  enabled: boolean
  // 速度与安全距离
  normalSpeed: number
  maxSpeed: number
  minSafeDistance: number
  speedExpansionFactor: number
  clearDistanceForFullSpeed: number
  // 避障策略
  obstacleExpansionMin: number
  obstacleExpansionMax: number
  allowEdgePass: boolean
  edgePassMinWidth: number
  // 遥控安全
  commandTimeoutSec: number
  timeoutAction: TimeoutAction
  remoteObstacleAvoidance: boolean
  // 特殊路段
  narrowRoad: NarrowRoadConfig
  bridge: BridgeConfig
  blindCorner: BlindCornerConfig
  // 管理
  referenceCount: number
  createdAt: string
  updatedAt: string
}

const STORAGE_KEY = 'safety_strategies_v1'

const now = () => new Date().toISOString()

function normalizeStrategy(item: Partial<SafetyStrategy>): SafetyStrategy {
  const status: PublishStatus = item.status === '启用' || item.status === '停用' || item.status === '草稿'
    ? item.status
    : item.enabled ? '启用' : '草稿'

  return {
    id: item.id || `ss-${Date.now()}`,
    name: item.name || '',
    description: item.description || '',
    priority: item.priority || 'medium',
    status,
    enabled: status === '启用',
    normalSpeed: item.normalSpeed ?? 2,
    maxSpeed: item.maxSpeed ?? 4,
    minSafeDistance: item.minSafeDistance ?? 0.2,
    speedExpansionFactor: item.speedExpansionFactor ?? 30,
    clearDistanceForFullSpeed: item.clearDistanceForFullSpeed ?? 20,
    obstacleExpansionMin: item.obstacleExpansionMin ?? 20,
    obstacleExpansionMax: item.obstacleExpansionMax ?? 50,
    allowEdgePass: item.allowEdgePass ?? false,
    edgePassMinWidth: item.edgePassMinWidth ?? 1.1,
    commandTimeoutSec: item.commandTimeoutSec ?? 0.4,
    timeoutAction: item.timeoutAction || 'slowdown_then_stop',
    remoteObstacleAvoidance: item.remoteObstacleAvoidance ?? true,
    narrowRoad: item.narrowRoad || { enabled: false, narrowWidthThreshold: 1.5, speedLimit: 0.5, safeDistanceOverride: 0.2, voiceAlert: false },
    bridge: item.bridge || { enabled: false, speedLimit: 1, minWidth: 1.5, maxSlope: 15, iceSlowdownPercent: 50, voiceAlert: false },
    blindCorner: item.blindCorner || { enabled: false, speedLimit: 1, voiceAlert: false, voiceMessage: '' },
    referenceCount: item.referenceCount ?? 0,
    createdAt: item.createdAt || now(),
    updatedAt: item.updatedAt || now()
  }
}

const defaultData: SafetyStrategy[] = [
  normalizeStrategy({
    id: 'ss-1',
    name: '马路通行策略',
    description: '适用于厂区主干道，允许较高速度，安全距离适中',
    priority: 'medium',
    status: '启用',
    normalSpeed: 3,
    maxSpeed: 6,
    minSafeDistance: 0.3,
    speedExpansionFactor: 30,
    clearDistanceForFullSpeed: 30,
    obstacleExpansionMin: 20,
    obstacleExpansionMax: 50,
    allowEdgePass: false,
    edgePassMinWidth: 1.1,
    commandTimeoutSec: 0.4,
    timeoutAction: 'slowdown_then_stop',
    remoteObstacleAvoidance: true,
    narrowRoad: { enabled: false, narrowWidthThreshold: 1.5, speedLimit: 0.5, safeDistanceOverride: 0.2, voiceAlert: false },
    bridge: { enabled: false, speedLimit: 1, minWidth: 1.5, maxSlope: 15, iceSlowdownPercent: 50, voiceAlert: false },
    blindCorner: { enabled: true, speedLimit: 1, voiceAlert: true, voiceMessage: '注意安全，机器人正在通过路口' },
    referenceCount: 3,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-08T00:00:00.000Z'
  }),
  normalizeStrategy({
    id: 'ss-2',
    name: '装置区安全策略',
    description: '适用于装置区内部，低速行驶，严格安全边界',
    priority: 'high',
    status: '启用',
    normalSpeed: 1,
    maxSpeed: 2,
    minSafeDistance: 0.2,
    speedExpansionFactor: 50,
    clearDistanceForFullSpeed: 15,
    obstacleExpansionMin: 30,
    obstacleExpansionMax: 80,
    allowEdgePass: false,
    edgePassMinWidth: 1.1,
    commandTimeoutSec: 0.3,
    timeoutAction: 'stop',
    remoteObstacleAvoidance: true,
    narrowRoad: { enabled: true, narrowWidthThreshold: 1.5, speedLimit: 0.3, safeDistanceOverride: 0.15, voiceAlert: true },
    bridge: { enabled: false, speedLimit: 0.5, minWidth: 1.5, maxSlope: 10, iceSlowdownPercent: 60, voiceAlert: false },
    blindCorner: { enabled: true, speedLimit: 0.5, voiceAlert: true, voiceMessage: '注意安全，机器人正在转弯' },
    referenceCount: 5,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-08T00:00:00.000Z'
  }),
  normalizeStrategy({
    id: 'ss-3',
    name: '罐区安全策略',
    description: '适用于罐区，极低速度，最大安全边界',
    priority: 'high',
    status: '启用',
    normalSpeed: 0.8,
    maxSpeed: 1.5,
    minSafeDistance: 0.25,
    speedExpansionFactor: 60,
    clearDistanceForFullSpeed: 10,
    obstacleExpansionMin: 40,
    obstacleExpansionMax: 100,
    allowEdgePass: false,
    edgePassMinWidth: 1.2,
    commandTimeoutSec: 0.3,
    timeoutAction: 'stop',
    remoteObstacleAvoidance: true,
    narrowRoad: { enabled: false, narrowWidthThreshold: 1.5, speedLimit: 0.3, safeDistanceOverride: 0.15, voiceAlert: false },
    bridge: { enabled: false, speedLimit: 0.5, minWidth: 1.5, maxSlope: 10, iceSlowdownPercent: 60, voiceAlert: false },
    blindCorner: { enabled: true, speedLimit: 0.3, voiceAlert: true, voiceMessage: '注意安全，机器人正在罐区通行' },
    referenceCount: 2,
    createdAt: '2026-06-01T00:00:00.000Z',
    updatedAt: '2026-06-07T00:00:00.000Z'
  })
]

export function getSafetyStrategies(): SafetyStrategy[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData))
    return defaultData
  }
  try {
    const parsed = JSON.parse(raw) as Partial<SafetyStrategy>[]
    const normalized = parsed.map(normalizeStrategy)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
    return normalized
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData))
    return defaultData
  }
}

export function saveSafetyStrategies(items: SafetyStrategy[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.map(normalizeStrategy)))
}

export function upsertSafetyStrategy(item: SafetyStrategy) {
  const items = getSafetyStrategies()
  const index = items.findIndex(existing => existing.id === item.id)
  const normalized = normalizeStrategy(item)
  if (index >= 0) items[index] = normalized
  else items.push(normalized)
  saveSafetyStrategies(items)
}

export function deleteSafetyStrategy(id: string) {
  saveSafetyStrategies(getSafetyStrategies().filter(item => item.id !== id))
}

export const priorityOptions: { label: string; value: Priority }[] = [
  { label: '高', value: 'high' },
  { label: '中', value: 'medium' },
  { label: '低', value: 'low' }
]

export const timeoutActionOptions: { label: string; value: TimeoutAction }[] = [
  { label: '自动降速', value: 'slowdown' },
  { label: '自动停车', value: 'stop' },
  { label: '先降速后停车', value: 'slowdown_then_stop' }
]

export const priorityMap: Record<Priority, string> = { high: '高', medium: '中', low: '低' }

export const statusOptions: PublishStatus[] = ['草稿', '启用', '停用']
