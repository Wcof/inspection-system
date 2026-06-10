export enum RobotStatus {
  ONLINE = 'online',
  OFFLINE = 'offline',
  CHARGING = 'charging',
  PATROLLING = 'patrolling',
  ERROR = 'error',
  PAUSED = 'paused',
  RETURNING = 'returning'
}

export enum ExceptionStrategy {
  SKIP = 'skip',
  RETRY = 'retry',
  RETURN_TO_BASE = 'return_to_base',
  WAIT_AND_RESUME = 'wait_and_resume',
  ABORT = 'abort',
  NOTIFY = 'notify'
}


export interface RobotVersionInfo {
  systemVersion?: string
  firmwareVersion: string
  hardwareVersion: string
  softwareVersion: string
  lastFirmwareUpdate?: Date
  lastSoftwareUpdate?: Date
}

export interface RobotAttachment {
  id: string
  name: string
  model: string
  category: 'chassis' | 'sensor' | 'gimbal' | 'power' | 'communication' | 'other'
  status: 'normal' | 'warning' | 'error' | 'offline'
  serialNumber?: string
  manufacturer?: string
  installedDate?: Date
  lastMaintenanceDate?: Date
  nextMaintenanceDate?: Date
  firmwareVersion?: string
  remark?: string
}

export interface RobotConnectionConfig {
  protocol: 'tcp' | 'ws' | 'wss'
  host: string
  port: number
  reconnectInterval: number
  heartbeatInterval: number
  timeout: number
  maxReconnectAttempts: number
}

export interface RobotExceptionStrategy {
  lowBattery: ExceptionStrategy
  signalLost: ExceptionStrategy
  robotFailure: ExceptionStrategy
  signalLostRetryCount: number
  retryInterval: number
  retryTimes: number
}

export interface RobotMaintenanceItem {
  id: string
  itemName: string
  period: string
  status: 'completed' | 'pending' | 'overdue'
  statusText: string
  lastTime: string
  nextTrigger: string
  operator: string
  pdfUrl: string | null
}

export interface Robot {
  id: string
  name: string
  serialNumber: string
  model: string
  manufacturer?: string
  explosionProofCert?: string
  explosionProofLevel?: string
  status: RobotStatus
  batteryLevel: number
  batteryThreshold: {
    low: number
    critical: number
  }
  lastOnlineTime: Date
  connectionConfig: RobotConnectionConfig
  exceptionStrategy: RobotExceptionStrategy
  versionInfo?: RobotVersionInfo
  attachments?: RobotAttachment[]
  maintenanceItems?: RobotMaintenanceItem[]
  createdAt: Date
  updatedAt: Date
}

export interface RobotFormData {
  name: string
  serialNumber: string
  model: string
  batteryThreshold: {
    low: number
    critical: number
  }
  connectionConfig: RobotConnectionConfig
  exceptionStrategy: RobotExceptionStrategy
}
