export type DetectionCategory = '视觉识别' | '热成像' | '气体检测' | '远传对比' | '安全行为' | '设备状态' | '环境监测' | '其他'
export type TargetType = '设施' | '设施部件' | '连接部位' | '区域环境' | '人员行为' | '机器人自身'
export type CollectMethod = '光学图像' | '热成像' | '气体传感器' | '声音采集' | '远传数据' | '组合采集'
export type PublishStatus = '草稿' | '已发布' | '已停用'
export type ResultType = '数值型' | '状态型' | '布尔型' | '等级型' | '文本型' | '图像识别型'

export interface RuleItem {
  id: string
  name: string
  version: string
  algorithm: string
  status: '启用' | '停用'
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
}

export interface ApplicableTarget {
  id: string
  deviceId: string
  deviceName: string
  subjectType: 'component' | 'connection'
  subjectId: string
  subjectName: string
}

export interface DetectionItemConfig {
  id: string
  name: string
  code: string
  category: DetectionCategory
  description: string
  resultType: ResultType
  needEvidence: boolean
  targetTypes: TargetType[]
  targetDetails: string
  applicableTargets?: ApplicableTarget[]
  collectMethod: CollectMethod
  collectDirection: string
  collectDistance: string
  collectNote: string
  rules: RuleItem[]
  results: ResultDef[]
  version: string
  publishStatus: PublishStatus
  enabled: boolean
  referenceCount: number
  updatedAt: string
  createdAt: string
}

const STORAGE_KEY = 'inspection_detection_item_configs_v1'

const defaultData: DetectionItemConfig[] = [
  {
    id: 'dic-001',
    name: '仪表读数识别',
    code: 'METER_READING',
    category: '视觉识别',
    description: '通过光学图像识别仪表表盘读数，并判断读数是否处于正常范围。',
    resultType: '数值型',
    needEvidence: true,
    targetTypes: ['设施部件'],
    targetDetails: '压力表、温度表、液位计',
    collectMethod: '光学图像',
    collectDirection: '正拍',
    collectDistance: '0.5m - 2m',
    collectNote: '需要表盘清晰，避免反光和遮挡。',
    rules: [
      { id: 'r-001', name: '表盘数值识别', version: 'V1.0', algorithm: 'OCR+表盘定位', status: '启用' },
      { id: 'r-002', name: '阈值判断', version: 'V1.0', algorithm: '上下限规则', status: '启用' }
    ],
    results: [
      { id: 'rs-001', name: '正常', code: 'NORMAL', group: '业务结果', riskLevel: '提示', needReview: false, generateException: false },
      { id: 'rs-002', name: '告警', code: 'ALARM', group: '业务结果', riskLevel: '告警', needReview: true, generateException: true },
      { id: 'rs-003', name: '无法读取', code: 'UNREADABLE', group: '采集质量结果', riskLevel: '预警', needReview: true, generateException: true }
    ],
    version: 'V1.0',
    publishStatus: '已发布',
    enabled: true,
    referenceCount: 12,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: 'dic-002',
    name: '压力表外观破损检测',
    code: 'PRESSURE_GAUGE_DAMAGE',
    category: '视觉识别',
    description: '通过光学图像识别压力表表盘、外壳、指针和玻璃罩是否存在破损、缺失或明显异常。',
    resultType: '图像识别型',
    needEvidence: true,
    targetTypes: ['设施部件'],
    targetDetails: '压力表',
    collectMethod: '光学图像',
    collectDirection: '正拍、侧拍',
    collectDistance: '0.5m - 2m',
    collectNote: '需要完整覆盖压力表外观，避免遮挡表盘、外壳和玻璃罩。',
    rules: [
      { id: 'r-003', name: '压力表外观缺陷识别', version: 'V1.0', algorithm: '视觉缺陷识别', status: '启用' }
    ],
    results: [
      { id: 'rs-004', name: '正常', code: 'NORMAL', group: '业务结果', riskLevel: '提示', needReview: false, generateException: false },
      { id: 'rs-005', name: '外观破损', code: 'DAMAGED', group: '业务结果', riskLevel: '告警', needReview: true, generateException: true },
      { id: 'rs-006', name: '被遮挡', code: 'BLOCKED', group: '采集质量结果', riskLevel: '预警', needReview: true, generateException: true }
    ],
    version: 'V1.0',
    publishStatus: '已发布',
    enabled: true,
    referenceCount: 0,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    id: 'dic-003',
    name: '压力表指针异常检测',
    code: 'PRESSURE_GAUGE_POINTER',
    category: '视觉识别',
    description: '识别压力表指针姿态是否异常，包括指针卡滞、偏转异常和无法定位等情况。',
    resultType: '状态型',
    needEvidence: true,
    targetTypes: ['设施部件'],
    targetDetails: '压力表',
    collectMethod: '光学图像',
    collectDirection: '正拍',
    collectDistance: '0.5m - 2m',
    collectNote: '需要表盘和指针清晰可见，避免反光导致指针无法识别。',
    rules: [
      { id: 'r-004', name: '指针姿态识别', version: 'V1.0', algorithm: '指针定位+姿态判断', status: '启用' }
    ],
    results: [
      { id: 'rs-007', name: '正常', code: 'NORMAL', group: '业务结果', riskLevel: '提示', needReview: false, generateException: false },
      { id: 'rs-008', name: '指针异常', code: 'POINTER_ABNORMAL', group: '业务结果', riskLevel: '告警', needReview: true, generateException: true },
      { id: 'rs-009', name: '无法读取', code: 'UNREADABLE', group: '采集质量结果', riskLevel: '预警', needReview: true, generateException: true }
    ],
    version: 'V1.0',
    publishStatus: '已发布',
    enabled: true,
    referenceCount: 0,
    updatedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }
]

export function getDetectionItemConfigs(): DetectionItemConfig[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData))
    return defaultData
  }
  try {
    return JSON.parse(raw) as DetectionItemConfig[]
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultData))
    return defaultData
  }
}

export function saveDetectionItemConfigs(items: DetectionItemConfig[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function upsertDetectionItemConfig(item: DetectionItemConfig) {
  const items = getDetectionItemConfigs()
  const index = items.findIndex(x => x.id === item.id)
  if (index >= 0) {
    items[index] = item
  } else {
    items.push(item)
  }
  saveDetectionItemConfigs(items)
}

export function deleteDetectionItemConfig(id: string) {
  const items = getDetectionItemConfigs().filter(item => item.id !== id)
  saveDetectionItemConfigs(items)
}

export const targetCategoryOptions: Record<TargetType, string[]> = {
  设施: ['反应釜', '储罐', '泵', '压缩机', '配电柜', '换热器'],
  设施部件: ['压力表', '温度表', '液位计', '阀门', '法兰', '电机', '管体', '电缆', '接头', '传感器', '螺杆'],
  连接部位: ['法兰连接', '阀门-管线', '泵出口-管线', '软连接', '接头连接', '管道接口'],
  区域环境: ['反应区环境', '储罐区环境', '管廊区域', '巡检点附近气体环境', '充电房环境'],
  人员行为: ['未戴安全帽', '未穿工装', '吸烟', '闯入危险区', '人员倒地'],
  机器人自身: ['电池', '轮组', '摄像头', '云台', '传感器模块', '充电触点']
}
