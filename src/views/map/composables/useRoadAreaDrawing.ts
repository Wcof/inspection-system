import { ref, type Ref } from 'vue'
import type { AreaDraft, MapPoint } from '@/types/road-editor'
import type { NoGoZone } from '@/types/road-network'

/**
 * 绘制区域工具 — 多边形草稿态管理
 */
export function useRoadAreaDrawing(
  noGoZones: Ref<NoGoZone[]>,
  selectedMapId: Ref<string>,
  pushSnapshotBeforeChange: () => void,
  hasUnsavedChanges: Ref<boolean>
) {
  const areaDraft = ref<AreaDraft | null>(null)
  const AREA_CLOSE_THRESHOLD = 14

  function startDrawing() {
    pushSnapshotBeforeChange()
    areaDraft.value = {
      points: [],
      previewPoint: null,
      closeReady: false
    }
  }

  function addPoint(x: number, y: number) {
    if (!areaDraft.value) return
    const draft = areaDraft.value

    // 如果已有点且靠近起点，自动闭合
    if (draft.points.length >= 2) {
      const first = draft.points[0]
      const dist = Math.hypot(x - first.x, y - first.y)
      if (dist < 20) {
        finishDrawing()
        return
      }
    }

    draft.points.push({ x, y })
    updateCloseReady(x, y)
  }

  function updateCloseReady(x: number, y: number) {
    if (!areaDraft.value || areaDraft.value.points.length < 2) return
    const first = areaDraft.value.points[0]
    const dx = x - first.x
    const dy = y - first.y
    areaDraft.value.closeReady = Math.sqrt(dx * dx + dy * dy) <= AREA_CLOSE_THRESHOLD
  }

  function setPreviewPoint(point: MapPoint | null) {
    if (areaDraft.value) {
      areaDraft.value.previewPoint = point
      if (point) {
        updateCloseReady(point.x, point.y)
      }
    }
  }

  function finishDrawing() {
    if (!areaDraft.value) return
    const draft = areaDraft.value
    if (draft.points.length < 3) return

    pushSnapshotBeforeChange()

    const now = new Date()
    const id = `nogo-${Date.now()}`
    const zone: NoGoZone = {
      id, name: `区域 ${noGoZones.value.length + 1}`,
      code: `NG${String(noGoZones.value.length + 1).padStart(3, '0')}`,
      mapId: selectedMapId.value, zoneType: 'normal', level: 'permanent',
      polygonPoints: [...draft.points],
      reason: '', createdAt: now, updatedAt: now
    }
    noGoZones.value.push(zone)
    hasUnsavedChanges.value = true
    areaDraft.value = null

    return { zoneId: id }
  }

  function discardDraft() {
    areaDraft.value = null
  }

  function hasDraft(): boolean {
    return areaDraft.value !== null && areaDraft.value.points.length > 0
  }

  return {
    areaDraft, AREA_CLOSE_THRESHOLD,
    startDrawing, addPoint, setPreviewPoint,
    finishDrawing, discardDraft, hasDraft
  }
}
