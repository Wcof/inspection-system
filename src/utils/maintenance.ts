export enum LifecycleThreshold {
  OK = 30,
  WARNING = 10,
  URGENT = 0,
  EXPIRED = -1
}

export interface LifecycleCheckResult {
  level: 'ok' | 'warning' | 'urgent' | 'expired'
  threshold: LifecycleThreshold
  remainingPct: number
}

/**
 * 检查组件剩余寿命百分比，返回梯度级别。
 * - ≥30%: ok
 * - 10%~30%: warning（预警黄）
 * - 0%~10%: urgent（urgent 橙）
 * - 0%: expired（过期红）
 */
export function checkComponentLifespan(remainingPct: number): LifecycleCheckResult {
  if (remainingPct <= 0) {
    return { level: 'expired', threshold: LifecycleThreshold.EXPIRED, remainingPct: 0 }
  }
  if (remainingPct < LifecycleThreshold.URGENT) {
    // URGENT = 0, so this would be remainingPct < 0, already caught above
    return { level: 'expired', threshold: LifecycleThreshold.EXPIRED, remainingPct }
  }
  if (remainingPct < LifecycleThreshold.WARNING) {
    return { level: 'urgent', threshold: LifecycleThreshold.URGENT, remainingPct }
  }
  if (remainingPct < LifecycleThreshold.OK) {
    return { level: 'warning', threshold: LifecycleThreshold.WARNING, remainingPct }
  }
  return { level: 'ok', threshold: LifecycleThreshold.OK, remainingPct }
}
