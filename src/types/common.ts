export interface PaginationParams {
  page: number
  pageSize: number
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

export interface Coordinate {
  longitude: number
  latitude: number
  altitude?: number
}

export interface BaseEntity {
  id: string
  createdAt: Date
  updatedAt: Date
}