/**
 * 路网编辑器 — 工具状态与草稿类型
 */

/** 编辑器工具模式 */
export type EditorTool = 'select' | 'drawSegment' | 'placeNode' | 'drawArea'

/** 实体类型 */
export type EntityType =
  | 'segment'
  | 'edge'
  | 'node'
  | 'junction'
  | 'navpoint'
  | 'nogozone'

/** 实体引用 */
export interface EntityRef {
  type: EntityType
  id: string
}

/** 地图坐标点 */
export interface MapPoint {
  x: number
  y: number
}

/** 路段绘制草稿 */
export interface SegmentDraft {
  id: string
  nodeIds: string[]
  tempNodes: import('./road-network').RoadNode[]
  tempEdges: import('./road-network').RoadEdge[]
  previewPoint?: MapPoint | null
}

/** 区域绘制草稿 */
export interface AreaDraft {
  points: MapPoint[]
  previewPoint?: MapPoint | null
  closeReady: boolean
}

/** 分屏布局模式 */
export type RoadSplitLayout =
  | 'single2d'
  | 'singleCloud'
  | 'pip2dMain'
  | 'pipCloudMain'
  | 'verticalEqual'
  | 'horizontalEqual'

/** 放置点位类型 */
export type PlaceNodeType = 'inspection' | 'parking' | 'charging'
