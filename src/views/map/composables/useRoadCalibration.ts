import { ref, type Ref } from 'vue'
import { useRouter } from 'vue-router'
import type { NavigationPoint } from '@/types/road-network'

/**
 * 点位校准状态管理 composable
 */
export function useRoadCalibration(
  navPoints: Ref<NavigationPoint[]>,
  selectedMapId: Ref<string>
) {
  const router = useRouter()
  const calibratingPoint = ref<NavigationPoint | null>(null)
  const showCalibrationModal = ref(false)

  function markPending(pointId: string) {
    const point = navPoints.value.find(p => p.id === pointId)
    if (!point) return
    point.calibrationStatus = 'pending'
    point.lastMovedAt = new Date().toISOString()
    point.calibrationSource = 'map_drag'
  }

  function checkPending(pointId: string): boolean {
    const point = navPoints.value.find(p => p.id === pointId)
    return point?.calibrationStatus === 'pending'
  }

  function openCalibrationModal(point: NavigationPoint) {
    calibratingPoint.value = point
    showCalibrationModal.value = true
  }

  function closeCalibrationModal() {
    calibratingPoint.value = null
    showCalibrationModal.value = false
  }

  function goToCalibration() {
    if (!calibratingPoint.value) return
    const pointId = calibratingPoint.value.id
    closeCalibrationModal()
    router.push({
      path: '/implementation/map/point-manage',
      query: {
        mapId: selectedMapId.value,
        pointId,
        action: 'calibrate'
      }
    })
  }

  /** 选中实体时检查是否需要校准提示 */
  function checkSelectionForCalibration(entityType: string, entityId: string) {
    if (entityType === 'navpoint') {
      const point = navPoints.value.find(p => p.id === entityId)
      if (point?.calibrationStatus === 'pending') {
        openCalibrationModal(point)
      }
    }
  }

  function hasPendingPoints(): boolean {
    return navPoints.value.some(p => p.calibrationStatus === 'pending')
  }

  return {
    calibratingPoint, showCalibrationModal,
    markPending, checkPending,
    openCalibrationModal, closeCalibrationModal,
    goToCalibration, checkSelectionForCalibration,
    hasPendingPoints
  }
}
