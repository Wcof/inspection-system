export type DetectionType = '图像识别' | '热成像' | '气体检测' | '远传对比' | '安全行为' | '设备状态' | '环境监测' | '其他'
export type DetectionCategory = DetectionType
export type CollectMethod = '光学图像' | '热成像' | '气体传感器' | '声音采集' | '远传数据' | '组合采集'
export type PublishStatus = '草稿' | '启用' | '停用'
export type ResultType = '数值型' | '状态型' | '布尔型' | '等级型' | '文本型' | '图像识别型'

export interface RuleItem {
  id: string
  name: string
  version: string
  algorithm: string
  status: '启用' | '停用'
  /** 大模型增强兜底开关：主算法识别失败时由大模型兜底 */
  llmEnabled?: boolean
}

export interface ResultDef {
  id: string
  name: string
  code: string
  group: '业务结果' | '采集质量结果'
  riskLevel: string
  needReview: boolean
  generateException: boolean
  indicator?: string
  unit?: string
  normalRange?: string
  warningThreshold?: string
  alarmThreshold?: string
  severeThreshold?: string
  judgmentBasis?: string
  voiceBroadcastText?: string
}

export interface DetectionItemConfig {
  id: string
  name: string
  code: string
  detectionType: DetectionType
  detectionAlgorithm: string
  category?: string
  description: string
  resultType: ResultType
  needEvidence: boolean
  collectMethod: CollectMethod
  collectDirection: string
  collectDistance: string
  collectNote: string
  rules: RuleItem[]
  results: ResultDef[]
  version: string
  status: PublishStatus
  publishStatus: PublishStatus
  enabled: boolean
  referenceCount: number
  updatedAt: string
  createdAt: string
}

const STORAGE_KEY = 'inspection_detection_item_configs_v1'

export const detectionTypeOptions: DetectionType[] = ['图像识别', '热成像', '气体检测', '远传对比', '安全行为', '设备状态', '环境监测', '其他']

export const detectionAlgorithmOptions: Record<DetectionType, string[]> = {
  图像识别: ['外观识别', '仪表读数识别', '指针状态识别', '目标缺失识别'],
  热成像: ['温度异常识别', '热点识别'],
  气体检测: ['CH4 浓度检测', 'H2S 浓度检测', 'VOC 浓度检测'],
  远传对比: ['远传-视觉比对', '远传-阈值比对'],
  安全行为: ['未戴安全帽识别', '闯入危险区识别', '吸烟识别'],
  设备状态: ['开关状态识别', '运行状态识别'],
  环境监测: ['区域环境检测', '烟雾检测'],
  其他: ['通用检测']
}

const now = () => new Date().toISOString()

function createResult(base: Partial<ResultDef> = {}): ResultDef {
  return {
    id: `result-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    name: '',
    code: '',
    group: '业务结果',
    riskLevel: '提示',
    needReview: false,
    generateException: false,
    indicator: '',
    unit: '',
    normalRange: '',
    warningThreshold: '',
    alarmThreshold: '',
    severeThreshold: '',
    judgmentBasis: '',
    voiceBroadcastText: '',
    ...base
  }
}

export function defaultResultsByDetectionType(type: DetectionType): ResultDef[] {
  if (type === '热成像') {
    return [
      createResult({ name: '正常', code: 'NORMAL', indicator: '最高温', unit: '℃', normalRange: '<=60', judgmentBasis: '温度在正常范围内' }),
      createResult({ name: '预警', code: 'WARNING', indicator: '最高温', unit: '℃', warningThreshold: '>60', needReview: true, generateException: true, judgmentBasis: '温度超过预警阈值' }),
      createResult({ name: '告警', code: 'ALARM', indicator: '最高温', unit: '℃', alarmThreshold: '>80', needReview: true, generateException: true, judgmentBasis: '温度超过告警阈值' })
    ]
  }
  if (type === '气体检测') {
    return [
      createResult({ name: '正常', code: 'NORMAL', indicator: '气体浓度', unit: 'ppm', normalRange: '<=10', judgmentBasis: '浓度在正常范围内' }),
      createResult({ name: '预警', code: 'WARNING', indicator: '气体浓度', unit: 'ppm', warningThreshold: '>10', needReview: true, generateException: true, judgmentBasis: '浓度超过预警阈值' }),
      createResult({ name: '告警', code: 'ALARM', indicator: '气体浓度', unit: 'ppm', alarmThreshold: '>25', needReview: true, generateException: true, judgmentBasis: '浓度超过告警阈值' })
    ]
  }
  if (type === '图像识别' || type === '安全行为') {
    return [
      createResult({ name: '正常', code: 'NORMAL', indicator: '识别结果', judgmentBasis: '未识别到异常特征' }),
      createResult({ name: '异常', code: 'ABNORMAL', indicator: '识别结果', riskLevel: '告警', needReview: true, generateException: true, judgmentBasis: '识别到异常特征' }),
      createResult({ name: '无法识别', code: 'UNREADABLE', group: '采集质量结果', indicator: '识别结果', riskLevel: '预警', needReview: true, generateException: true, judgmentBasis: '目标模糊、反光或遮挡' })
    ]
  }
  return [
    createResult({ name: '正常', code: 'NORMAL', judgmentBasis: '结果符合正常口径' }),
    createResult({ name: '异常', code: 'ABNORMAL', riskLevel: '告警', needReview: true, generateException: true, judgmentBasis: '结果符合异常口径' })
  ]
}

export function resultTypeByDetectionType(type: DetectionType): ResultType {
  if (type === '热成像' || type === '气体检测' || type === '环境监测') return '数值型'
  if (type === '图像识别') return '图像识别型'
  return '状态型'
}

export function collectMethodByDetectionType(type: DetectionType): CollectMethod {
  if (type === '热成像') return '热成像'
  if (type === '气体检测') return '气体传感器'
  if (type === '远传对比') return '远传数据'
  return '光学图像'
}

function detectionTypeFromLegacy(value?: string): DetectionType {
  if (!value) return '图像识别'
  if (value === '视觉识别') return '图像识别'
  if (detectionTypeOptions.includes(value as DetectionType)) return value as DetectionType
  return '其他'
}

function ensureAlgorithm(type: DetectionType, value?: string) {
  const candidates = detectionAlgorithmOptions[type]
  if (value && candidates.includes(value)) return value
  return candidates[0]
}

function normalizeStatus(item: Partial<DetectionItemConfig>): PublishStatus {
  if (item.status === '草稿' || item.status === '启用' || item.status === '停用') return item.status
  const legacyStatus = (item as any).publishStatus
  if (legacyStatus === '草稿') return '草稿'
  if (legacyStatus === '已发布') return item.enabled === false ? '停用' : '启用'
  if (legacyStatus === '已停用') return '停用'
  return item.enabled ? '启用' : '草稿'
}

function normalizeConfig(item: Partial<DetectionItemConfig>): DetectionItemConfig {
  const detectionType = detectionTypeFromLegacy((item as any).detectionType || item.category)
  const status = normalizeStatus(item)
  return {
    id: item.id || `dic-${Date.now()}`,
    name: item.name || '',
    code: item.code || '',
    detectionType,
    detectionAlgorithm: ensureAlgorithm(detectionType, (item as any).detectionAlgorithm || item.name),
    category: detectionType,
    description: item.description || '',
    resultType: item.resultType || resultTypeByDetectionType(detectionType),
    needEvidence: item.needEvidence ?? true,
    collectMethod: item.collectMethod || collectMethodByDetectionType(detectionType),
    collectDirection: item.collectDirection || '',
    collectDistance: item.collectDistance || '',
    collectNote: item.collectNote || '',
    rules: item.rules?.length
      ? item.rules
      : [{ id: `rule-${Date.now()}`, name: ensureAlgorithm(detectionType, (item as any).detectionAlgorithm || item.name), version: 'V1.0', algorithm: ensureAlgorithm(detectionType, (item as any).detectionAlgorithm || item.name), status: '启用' }],
    results: (item.results?.length ? item.results : defaultResultsByDetectionType(detectionType)).map(result => ({
      ...createResult(),
      ...result,
      voiceBroadcastText: result.voiceBroadcastText || ''
    })),
    version: item.version || 'V1.0',
    status,
    publishStatus: status,
    enabled: status === '启用',
    referenceCount: item.referenceCount ?? 0,
    updatedAt: item.updatedAt || now(),
    createdAt: item.createdAt || now()
  }
}

const defaultData: DetectionItemConfig[] = [
  normalizeConfig({
    id: 'dic-001',
    name: '仪表读数识别',
    code: 'METER_READING',
    detectionType: '图像识别',
    detectionAlgorithm: '仪表读数识别',
    description: '通过光学图像识别仪表表盘读数，并判断读数是否处于正常范围。',
    resultType: '数值型',
    needEvidence: true,
    collectMethod: '光学图像',
    collectDirection: '正拍',
    collectDistance: '0.5m - 2m',
    collectNote: '需要表盘清晰，避免反光和遮挡。',
    rules: [
      { id: 'r-001', name: '仪表读数识别', version: 'V1.0', algorithm: 'OCR+表盘定位', status: '启用' }
    ],
    results: [
      createResult({ id: 'rs-001', name: '正常', code: 'NORMAL', indicator: '仪表读数', judgmentBasis: '读数处于允许范围内' }),
      createResult({ id: 'rs-002', name: '告警', code: 'ALARM', indicator: '仪表读数', riskLevel: '告警', needReview: true, generateException: true, judgmentBasis: '读数超过告警阈值', voiceBroadcastText: '检测到仪表读数异常，请立即复核。' }),
      createResult({ id: 'rs-003', name: '无法识别', code: 'UNREADABLE', group: '采集质量结果', indicator: '仪表读数', riskLevel: '预警', needReview: true, generateException: true, judgmentBasis: '画面模糊或表盘遮挡' })
    ],
    status: '启用',
    publishStatus: '启用',
    enabled: true,
    referenceCount: 12
  }),
  normalizeConfig({
    id: 'dic-002',
    name: '压力表外观破损检测',
    code: 'PRESSURE_GAUGE_DAMAGE',
    detectionType: '图像识别',
    detectionAlgorithm: '外观识别',
    description: '识别压力表表盘、外壳、玻璃罩是否存在破损或明显异常。',
    status: '启用',
    publishStatus: '启用',
    enabled: true
  }),
  normalizeConfig({
    id: 'dic-003',
    name: '压力表指针异常检测',
    code: 'PRESSURE_GAUGE_POINTER',
    detectionType: '图像识别',
    detectionAlgorithm: '指针状态识别',
    description: '识别压力表指针姿态是否异常。',
    status: '启用',
    publishStatus: '启用',
    enabled: true
  })
]

export function getDetectionItemConfigs(): DetectionItemConfig[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData))
    return defaultData
  }
  try {
    const parsed = JSON.parse(raw) as Partial<DetectionItemConfig>[]
    const normalized = parsed.map(normalizeConfig)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized))
    return normalized
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData))
    return defaultData
  }
}

export function saveDetectionItemConfigs(items: DetectionItemConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items.map(normalizeConfig)))
}

export function isDetectionRuleActive(item: DetectionItemConfig) {
  return normalizeStatus(item) === '启用'
}

export function upsertDetectionItemConfig(item: DetectionItemConfig) {
  const items = getDetectionItemConfigs()
  const index = items.findIndex(existing => existing.id === item.id)
  const normalized = normalizeConfig(item)
  if (index >= 0) items[index] = normalized
  else items.push(normalized)
  saveDetectionItemConfigs(items)
}

export function deleteDetectionItemConfig(id: string) {
  saveDetectionItemConfigs(getDetectionItemConfigs().filter(item => item.id !== id))
}
