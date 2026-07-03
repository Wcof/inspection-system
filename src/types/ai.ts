/** 知识库文件类型 */
export type KnowledgeFileType = 'pdf' | 'doc' | 'image' | 'video' | 'other'

/** 知识库文件 */
export interface KnowledgeFile {
  id: string
  name: string
  type: KnowledgeFileType
  uploadTime: string
  size?: string
  description?: string
  tags?: string[]
}

/** 会话载体字段 — 标识来源设备 */
export interface ChatCarrier {
  device: 'computer' | 'robot' | 'mobile'
  robotId?: string
  time: string
}

/** AI 聊天会话 */
export interface ChatSession {
  id: string
  title: string
  carrier: ChatCarrier
  createdAt: string
  updatedAt?: string
  messageCount?: number
}

/** AI 聊天消息 */
export interface ChatMessage {
  id: string
  sessionId: string
  role: 'user' | 'assistant'
  content: string
  createdAt: string
  references?: string[]
}

/** 检测算法配置 — 检测类型下可引用的算法列表（字典/CRD） */
export interface DetectionAlgorithmConfig {
  id: string
  /** 所属检测类型（如图像识别、热成像等） */
  detectionType: string
  /** 算法名称 */
  name: string
  /** 算法类型：small=小模型, large=大模型 */
  modelType: 'small' | 'large'
  /** 备注 */
  remark?: string
  createdAt: string
}

/** 检测类型选项 */
export const algorithmDetectionTypeOptions = [
  '图形', '图像识别', '热成像', '气体检测', '远传对比', '安全行为', '设备状态', '环境监测', '其他'
]
