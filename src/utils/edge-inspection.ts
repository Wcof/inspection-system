export interface MockFrame {
  frameId: string
  timestamp: string
  detections: Array<{ type: string; confidence: number; label: string }>
}

export interface RoamingAnomaly {
  id: string
  type: string
  position: { x: number; y: number }
  detectedAt: string
}

export interface BlankAreaLog {
  type: 'blank_area_protection'
  reason: string
  timestamp: string
}

/**
 * 生成 mock 抽帧识别数据（24帧/秒模拟）。
 */
export function generateMockFrame(): MockFrame {
  const detectionTypes = ['normal', 'hazard', 'blank']
  const type = detectionTypes[Math.floor(Math.random() * detectionTypes.length)]
  return {
    frameId: `frame-${Date.now()}`,
    timestamp: new Date().toISOString(),
    detections: type === 'blank' ? [] : [
      { type, confidence: 0.85 + Math.random() * 0.15, label: type === 'hazard' ? '疑似泄漏' : '正常' }
    ]
  }
}

/**
 * 模拟漫游异常即时锚点。
 */
export function simulateRoamingAnomaly(): RoamingAnomaly {
  return {
    id: `anomaly-${Date.now()}`,
    type: 'roaming_hazard',
    position: { x: Math.random() * 1000, y: Math.random() * 1000 },
    detectedAt: new Date().toISOString()
  }
}

/**
 * 创建云台空旷区避空保护留痕。
 */
export function createBlankAreaLog(reason: string): BlankAreaLog {
  return {
    type: 'blank_area_protection',
    reason,
    timestamp: new Date().toISOString()
  }
}
