/**
 * 倒车动作模板枚举迁移函数。
 * 将 RoadSegment 旧的布尔字段 allowReverse/allowUTurn
 * 映射为新的 reverseActionTemplate 枚举。
 * 
 * 映射规则:
 * - false, false → straight_pass (直行通过)
 * - false, true  → uturn_reenter (掉头再进)
 * - true, false  → reverse_pass (倒车通过)
 * - true, true   → slow_pass (减速通过)
 */
export function migrateReverseAction(
  allowReverse?: boolean,
  allowUTurn?: boolean
): 'straight_pass' | 'slow_pass' | 'stop_then_straight' | 'reverse_pass' | 'uturn_reenter' {
  if (allowReverse === true && allowUTurn === true) return 'slow_pass'
  if (allowReverse === true && allowUTurn !== true) return 'reverse_pass'
  if (allowReverse !== true && allowUTurn === true) return 'uturn_reenter'
  return 'straight_pass'
}
