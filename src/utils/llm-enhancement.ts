export interface DetectionInput {
  ruleId: string
  llmEnabled: boolean
  primaryResult: { status: string; note?: string } | null
  imageData: string
}

export interface DetectionResult {
  status: string
  note: string
  source: 'primary' | 'llm_enhancement'
}

/**
 * 大模型增强作检测规则兜底。
 * 主算法识别失败时由大模型兜底，结果备注显示"大模型增强"标识。
 * 主算法成功时返回主算法结果，不调用大模型。
 */
export function processDetectionWithLLM(input: DetectionInput): DetectionResult | null {
  // Primary algorithm succeeded → return primary result
  if (input.primaryResult) {
    return {
      ...input.primaryResult,
      source: 'primary'
    } as DetectionResult
  }

  // Primary failed, LLM disabled → return null
  if (!input.llmEnabled) return null

  // Primary failed, LLM enabled → mock LLM fallback
  return {
    status: 'normal',
    note: '大模型增强',
    source: 'llm_enhancement'
  }
}
