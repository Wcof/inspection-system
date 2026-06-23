import { describe, it, expect, beforeEach } from 'vitest'
import { MockService } from '@/mock/mockService'

describe('Work ticket push (T9b)', () => {
  beforeEach(() => {
    localStorage.clear()
    MockService.initializeData()
  })

  it('should save and read work tickets', () => {
    const ticket = {
      id: 'wt-1',
      title: '储罐区检修作业票',
      areaId: 'area-1',
      allowedPersonnel: ['张三', '李四'],
      startTime: '09:00',
      endTime: '17:00'
    }
    MockService.saveWorkTicket(ticket)
    const tickets = MockService.getWorkTickets()
    expect(tickets).toHaveLength(1)
    expect(tickets[0].allowedPersonnel).toContain('张三')
  })
})

describe('Personnel verification (T10)', () => {
  beforeEach(() => {
    localStorage.clear()
    MockService.initializeData()
  })

  it('should create personnel verification result with mismatch', async () => {
    const { verifyPersonnel } = await import('@/utils/dispatch-engine')
    const result = verifyPersonnel({
      taskId: 'task-001',
      ticketId: 'wt-1',
      allowedPersonnel: ['张三', '李四'],
      recognizedPersonnel: ['王五']
    })
    expect(result.matched).toBe(false)
    expect(result.unrecognizedPersonnel).toEqual(['王五'])
    expect(result.missingPersonnel).toEqual(['张三', '李四'])
  })

  it('should create personnel verification result with full match', async () => {
    const { verifyPersonnel } = await import('@/utils/dispatch-engine')
    const result = verifyPersonnel({
      taskId: 'task-001',
      ticketId: 'wt-1',
      allowedPersonnel: ['张三', '李四'],
      recognizedPersonnel: ['张三', '李四']
    })
    expect(result.matched).toBe(true)
    expect(result.missingPersonnel).toEqual([])
  })
})
