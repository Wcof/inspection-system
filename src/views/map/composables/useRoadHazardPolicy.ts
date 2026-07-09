import { ref, type Ref } from 'vue'
import type { NoGoZone, NavigationPoint, HazardPolicyConfig } from '@/types/road-network'

/**
 * 危区策略 composable
 * 管理 Z0/Z1/Z2 区域配置与基础校验
 */
export function useRoadHazardPolicy(
  noGoZones: Ref<NoGoZone[]>,
  navPoints: Ref<NavigationPoint[]>
) {
  const hazardPolicyErrors = ref<string[]>([])

  function clearErrors() {
    hazardPolicyErrors.value = []
  }

  /** 校验 Z1 区域必须配置 safe_exit 撤离点 */
  function validateZ1SafeExit(zone: NoGoZone): boolean {
    if (zone.zoneClass !== 'Z1') return true
    const policy = zone.hazardPolicy
    if (!policy?.safeExitPointIds || policy.safeExitPointIds.length === 0) {
      hazardPolicyErrors.value.push(`Z1 区域 "${zone.name}" 至少需要配置一个 safe_exit 撤离点`)
      return false
    }
    return true
  }

  /** 校验充电点是否在 Z0 普通区 */
  function validateChargingPointLocation(point: NavigationPoint): boolean {
    if (point.navType !== 'charging') return true
    for (const zone of noGoZones.value) {
      if (zone.zoneClass === 'Z1' || zone.zoneClass === 'Z2') {
        if (pointInPolygon(point.position.x, point.position.y, zone.polygonPoints)) {
          hazardPolicyErrors.value.push(
            `充电点 "${point.name}" 位于 ${zone.zoneClass === 'Z1' ? '危区 Z1' : '禁入区 Z2'} "${zone.name}"，充电点必须位于普通区 Z0`
          )
          return false
        }
      }
    }
    return true
  }

  /** 校验路径是否经过 Z2 禁入区 */
  function validatePathNoZ2(pathNodeIds: string[], getNodePosition: (id: string) => { x: number; y: number }): boolean {
    const z2Zones = noGoZones.value.filter(z => z.zoneClass === 'Z2')
    if (z2Zones.length === 0) return true

    for (let i = 0; i < pathNodeIds.length - 1; i++) {
      const p1 = getNodePosition(pathNodeIds[i])
      const p2 = getNodePosition(pathNodeIds[i + 1])
      for (const zone of z2Zones) {
        const mx = (p1.x + p2.x) / 2
        const my = (p1.y + p2.y) / 2
        if (pointInPolygon(mx, my, zone.polygonPoints)) {
          hazardPolicyErrors.value.push(`路径经过 Z2 禁入区 "${zone.name}"，请调整路网或绕行`)
          return false
        }
      }
    }
    return true
  }

  /** 校验 Z1 温度阈值顺序: wait < block < evacuate */
  function validateTemperatureThresholds(policy: HazardPolicyConfig): boolean {
    const { waitThreshold, blockThreshold, evacuateThreshold } = policy
    if (waitThreshold != null && blockThreshold != null && evacuateThreshold != null) {
      if (!(waitThreshold < blockThreshold && blockThreshold < evacuateThreshold)) {
        hazardPolicyErrors.value.push('Hz_T 阈值顺序必须满足: Hz_T_wait < Hz_T_block < Hz_T_evacuate')
        return false
      }
    }
    return true
  }

  /** 校验所有区域 */
  function validateAll(): boolean {
    clearErrors()
    let valid = true
    for (const zone of noGoZones.value) {
      if (!validateZ1SafeExit(zone)) valid = false
      if (zone.hazardPolicy) {
        if (!validateTemperatureThresholds(zone.hazardPolicy)) valid = false
      }
    }
    for (const point of navPoints.value) {
      if (!validateChargingPointLocation(point)) valid = false
    }
    return valid
  }

  return {
    hazardPolicyErrors,
    validateZ1SafeExit, validateChargingPointLocation,
    validatePathNoZ2, validateTemperatureThresholds,
    validateAll, clearErrors
  }
}

/** 点在多边形内判断（射线法） */
function pointInPolygon(x: number, y: number, polygon: { x: number; y: number }[]): boolean {
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y
    const xj = polygon[j].x, yj = polygon[j].y
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}
