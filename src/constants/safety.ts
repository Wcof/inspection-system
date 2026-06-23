// 看门狗时效锁阈值（固定不可配）
export const WATCHDOG_TIMEOUT_MS = 350  // 0.3~0.4 秒中值

// 充电点监控阈值（固定不可配）
export const CHARGING_EFFICIENCY_THRESHOLD = 0.8    // 转换效率 ≥ 80%
export const CHARGING_POWER_THRESHOLD = 1           // 输出功率 = 1 kW
export const CHARGING_ACTUAL_POWER = 800            // 实际充电功率 = 800 W
