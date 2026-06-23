export interface DispatchResourcePool {
  id: string
  areaId: string
  preferredRobotIds: string[]
  disabledTimeWindows: { robotId: string; start: string; end: string; reason?: string }[]
  robotTypeWhitelist: { robotType: string; allowedAreaIds: string[] }[]
}
