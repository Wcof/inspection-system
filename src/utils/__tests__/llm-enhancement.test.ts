import { describe, it, expect } from 'vitest'
import { processDetectionWithLLM } from '@/utils/llm-enhancement'

describe('LLM Enhancement - detection fallback', () => {
  it('should return LLM result when primary algorithm fails and LLM is enabled', () => {
    const result = processDetectionWithLLM({
      ruleId: 'rule-001',
      llmEnabled: true,
      primaryResult: null,
      imageData: 'mock-image-base64'
    })
    expect(result).not.toBeNull()
    expect(result!.note).toContain('大模型增强')
    expect(result!.status).toBe('normal')
  })

  it('should return null when LLM is disabled', () => {
    const result = processDetectionWithLLM({
      ruleId: 'rule-001',
      llmEnabled: false,
      primaryResult: null,
      imageData: 'mock-image-base64'
    })
    expect(result).toBeNull()
  })

  it('should return primary result when it succeeds, even if LLM is enabled', () => {
    const result = processDetectionWithLLM({
      ruleId: 'rule-001',
      llmEnabled: true,
      primaryResult: { status: 'normal', note: 'ok' },
      imageData: 'mock-image-base64'
    })
    expect(result).not.toBeNull()
    expect(result!.note).not.toContain('大模型增强')
    expect(result!.status).toBe('normal')
  })
})
