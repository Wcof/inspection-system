import { describe, it, expect, beforeEach } from 'vitest'
import { MockService } from '@/mock/mockService'

describe('AI Knowledge Base', () => {
  beforeEach(() => {
    localStorage.clear()
    MockService.initializeData()
  })

  it('should save and read knowledge files', () => {
    const file = { id: 'kf-1', name: '安全规程.pdf', type: 'pdf' as const, uploadTime: new Date().toISOString() }
    MockService.saveKnowledgeFile(file)
    const files = MockService.getKnowledgeFiles()
    expect(files).toHaveLength(1)
    expect(files[0].name).toBe('安全规程.pdf')
  })

  it('should delete knowledge files', () => {
    MockService.saveKnowledgeFile({ id: 'kf-1', name: '规程.pdf', type: 'pdf', uploadTime: new Date().toISOString() })
    MockService.deleteKnowledgeFile('kf-1')
    expect(MockService.getKnowledgeFiles()).toHaveLength(0)
  })
})

describe('AI Chat Sessions', () => {
  beforeEach(() => {
    localStorage.clear()
    MockService.initializeData()
  })

  it('should create and read chat sessions with carrier field', () => {
    const session = MockService.saveAIChatSession({
      title: '设备参数查询',
      carrier: { device: 'robot', robotId: 'robot-1', time: new Date().toISOString() }
    })
    expect(session.id).toBeTruthy()
    expect(session.carrier.device).toBe('robot')

    const sessions = MockService.getAIChatSessions()
    expect(sessions.length).toBeGreaterThan(0)
  })

  it('should save and read chat messages', () => {
    MockService.saveAIChatMessage({
      sessionId: 'session-1',
      role: 'user',
      content: '查询储罐液位正常范围',
      carrier: { device: 'pc', time: new Date().toISOString() }
    })
    const msgs = MockService.getAIChatMessages('session-1')
    expect(msgs).toHaveLength(1)
    expect(msgs[0].content).toContain('储罐')
  })
})
