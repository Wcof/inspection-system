import { ExceptionStrategy } from './robot'

export enum ExceptionType {
  INSPECTION_POINT_FAILURE = 'inspection_point_failure',
  ROBOT_FAILURE = 'robot_failure',
  LOW_BATTERY = 'low_battery',
  SIGNAL_LOST = 'signal_lost',
  TASK_TIMEOUT = 'task_timeout',
  OBSTACLE_DETECTED = 'obstacle_detected'
}

export interface InspectionPointExceptionStrategy {
  onFailure: ExceptionStrategy
  retryCount: number
  skipToNext: boolean
}

export interface TaskExceptionStrategy {
  inspectionPointFailure: ExceptionStrategy
  robotFailure: ExceptionStrategy
  lowBattery: ExceptionStrategy
  signalLost: ExceptionStrategy
  timeout: ExceptionStrategy
  maxRetryCount: number
  retryInterval: number
}

export interface ExceptionLog {
  id: string
  taskId: string
  type: ExceptionType
  timestamp: Date
  inspectionPointId?: string
  description: string
  strategyApplied: ExceptionStrategy
  resolved: boolean
  resolvedAt?: Date
  resolutionNote?: string
}

export interface GlobalExceptionStrategy {
  id: string
  name: string
  defaultStrategy: Partial<TaskExceptionStrategy>
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}