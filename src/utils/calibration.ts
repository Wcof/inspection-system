import { writeAuditLog } from '@/utils/audit'

export interface CalibrationResult {
  success: boolean
  robotId: string
  component: string
  message: string
}

/**
 * 远程一键零位校准。
 * mock 对齐机械绝对零点 + 重载 SLAM 标定文件。
 * 完成后写审计日志。
 */
export function calibrateRobot(robotId: string, component: string): CalibrationResult {
  const result: CalibrationResult = {
    success: true,
    robotId,
    component,
    message: `校准完成: ${component} 已对齐机械绝对零点并重载 SLAM 标定文件`
  }

  writeAuditLog({
    action: 'calibrate',
    operator: 'maintenance',
    targetId: robotId,
    targetType: 'robot',
    afterValue: { component, status: 'calibrated' },
    reason: `远程一键零位校准: ${component}`
  })

  return result
}
