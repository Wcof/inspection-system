import { ref, type Ref } from 'vue'
import type { EntityRef, MapPoint } from '@/types/road-editor'
import type { RoadNode, NavigationPoint, NoGoZone } from '@/types/road-network'

/**
 * 拖拽移动 composable
 * 支持节点/点位拖拽、区域顶点拖拽、区域整体平移
 */
export function useRoadDragging(
  nodes: Ref<RoadNode[]>,
  navPoints: Ref<NavigationPoint[]>,
  noGoZones: Ref<NoGoZone[]>,
  activeTool: Ref<string>,
  selectedEntity: Ref<EntityRef | null>,
  pushSnapshotBeforeChange: () => void,
  hasUnsavedChanges: Ref<boolean>,
  markPending: (pointId: string) => void
) {
  const dragging = ref<{
    entity: EntityRef
    startMouse: MapPoint
    startPositions: Record<string, MapPoint>
    /** 区域拖拽时是否是中心手柄拖拽 */
    isCenterDrag?: boolean
  } | null>(null)

  function getEntityPositions(entity: EntityRef): Record<string, MapPoint> {
    const result: Record<string, MapPoint> = {}

    if (entity.type === 'node') {
      const node = nodes.value.find(n => n.id === entity.id)
      if (node) result[entity.id] = { ...node.position }
    } else if (entity.type === 'navpoint') {
      const np = navPoints.value.find(p => p.id === entity.id)
      if (np) {
        result[entity.id] = { ...np.position }
        // 同时记录关联节点位置
        const node = nodes.value.find(n => n.id === np.nodeId)
        if (node) result[np.nodeId] = { ...node.position }
      }
    } else if (entity.type === 'nogozone') {
      const zone = noGoZones.value.find(z => z.id === entity.id)
      if (zone) {
        zone.polygonPoints.forEach((p, i) => {
          result[`${entity.id}-vert-${i}`] = { ...p }
        })
      }
    }

    return result
  }

  function startDrag(entity: EntityRef, mouse: MapPoint, isCenterDrag = false) {
    if (activeTool.value !== 'select') return
    if (!selectedEntity.value || selectedEntity.value.type !== entity.type || selectedEntity.value.id !== entity.id) return

    pushSnapshotBeforeChange()
    dragging.value = {
      entity,
      startMouse: mouse,
      startPositions: getEntityPositions(entity),
      isCenterDrag
    }
  }

  function moveDrag(mouse: MapPoint) {
    if (!dragging.value) return
    const { entity, startMouse, startPositions, isCenterDrag } = dragging.value
    const dx = mouse.x - startMouse.x
    const dy = mouse.y - startMouse.y

    if (entity.type === 'node') {
      const node = nodes.value.find(n => n.id === entity.id)
      if (node) {
        const orig = startPositions[entity.id]
        if (orig) {
          node.position.x = orig.x + dx
          node.position.y = orig.y + dy
        }
      }
    } else if (entity.type === 'navpoint') {
      const np = navPoints.value.find(p => p.id === entity.id)
      if (np) {
        const orig = startPositions[entity.id]
        if (orig) {
          np.position.x = orig.x + dx
          np.position.y = orig.y + dy
        }
        // 同时移动关联节点
        const node = nodes.value.find(n => n.id === np.nodeId)
        const nodeOrig = startPositions[np.nodeId]
        if (node && nodeOrig) {
          node.position.x = nodeOrig.x + dx
          node.position.y = nodeOrig.y + dy
        }
      }
    } else if (entity.type === 'nogozone') {
      const zone = noGoZones.value.find(z => z.id === entity.id)
      if (zone) {
        if (isCenterDrag) {
          // 整体平移
          zone.polygonPoints.forEach((p, i) => {
            const orig = startPositions[`${entity.id}-vert-${i}`]
            if (orig) {
              p.x = orig.x + dx
              p.y = orig.y + dy
            }
          })
        } else {
          // 顶点拖拽 — 通过 moveDragVertex 处理
      }
      }
    }
  }

  /** 拖拽单个区域顶点 */
  function moveDragVertex(mouse: MapPoint, vertexIndex: number) {
    if (!dragging.value || dragging.value.entity.type !== 'nogozone') return
    const { startMouse, startPositions } = dragging.value
    const dx = mouse.x - startMouse.x
    const dy = mouse.y - startMouse.y

    const zone = noGoZones.value.find(z => z.id === dragging.value!.entity.id)
    if (zone && vertexIndex >= 0 && vertexIndex < zone.polygonPoints.length) {
      const orig = startPositions[`${dragging.value.entity.id}-vert-${vertexIndex}`]
      if (orig) {
        zone.polygonPoints[vertexIndex].x = orig.x + dx
        zone.polygonPoints[vertexIndex].y = orig.y + dy
      }
    }
  }

  function endDrag() {
    if (!dragging.value) return

    if (dragging.value.entity.type === 'navpoint') {
      markPending(dragging.value.entity.id)
    }

    hasUnsavedChanges.value = true
    dragging.value = null
  }

  function isDragging(): boolean {
    return dragging.value !== null
  }

  return {
    dragging,
    startDrag, moveDrag, moveDragVertex, endDrag, isDragging
  }
}
