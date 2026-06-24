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
