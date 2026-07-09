import { ref, type Ref } from 'vue'
import type { EntityType, EntityRef } from '@/types/road-editor'
import type { RoadNode, RoadSegment, Junction, NavigationPoint, NoGoZone } from '@/types/road-network'

/**
 * 选取/悬停 状态管理
 */
export function useRoadSelection(
  nodes: Ref<RoadNode[]>,
  segments: Ref<RoadSegment[]>,
  junctions: Ref<Junction[]>,
  navPoints: Ref<NavigationPoint[]>,
  noGoZones: Ref<NoGoZone[]>
) {
  const selectedEntity = ref<EntityRef | null>(null)
  const hoverEntity = ref<EntityRef | null>(null)

  // 编辑副本
  const editingSegment = ref<RoadSegment | null>(null)
  const editingJunction = ref<Junction | null>(null)
  const editingNavPoint = ref<NavigationPoint | null>(null)
  const editingNoGoZone = ref<NoGoZone | null>(null)
  const editingNode = ref<RoadNode | null>(null)
  const editingNodeJunction = ref<Junction | null>(null)

  const propertyEditing = ref(false)

  function selectEntity(type: string, id: string) {
    // 不允许空值
    if (!type || !id) return

    selectedEntity.value = { type: type as EntityType, id }

    switch (type) {
      case 'segment': {
        const seg = segments.value.find(s => s.id === id)
        editingSegment.value = seg ? { ...seg } : null
        editingJunction.value = null
        editingNavPoint.value = null
        editingNoGoZone.value = null
        editingNode.value = null
        editingNodeJunction.value = null
        break
      }
      case 'junction': {
        const junc = junctions.value.find(j => j.id === id)
        editingJunction.value = junc ? { ...junc } : null
        editingSegment.value = null
        editingNavPoint.value = null
        editingNoGoZone.value = null
        editingNode.value = null
        editingNodeJunction.value = null
        break
      }
      case 'navpoint': {
        const np = navPoints.value.find(p => p.id === id)
        editingNavPoint.value = np ? { ...np } : null
        editingSegment.value = null
        editingJunction.value = null
        editingNoGoZone.value = null
        editingNode.value = null
        editingNodeJunction.value = null
        break
      }
      case 'nogozone': {
        const zone = noGoZones.value.find(z => z.id === id)
        editingNoGoZone.value = zone ? { ...zone } : null
        editingSegment.value = null
        editingJunction.value = null
        editingNavPoint.value = null
        editingNode.value = null
        editingNodeJunction.value = null
        break
      }
      case 'node': {
        const node = nodes.value.find(n => n.id === id)
        editingNode.value = node ? { ...node } : null
        // 自动关联路口数据
        if (editingNode.value?.nodeType === 'junction') {
          const found = junctions.value.find(j => j.nodeId === id)
          editingNodeJunction.value = found ? { ...found } : null
        } else {
          editingNodeJunction.value = null
        }
        editingSegment.value = null
        editingJunction.value = null
        editingNavPoint.value = null
        editingNoGoZone.value = null
        break
      }
      default:
        clearEditing()
    }
    propertyEditing.value = false
  }

  function clearSelection() {
    selectedEntity.value = null
    clearEditing()
    propertyEditing.value = false
  }

  function clearEditing() {
    editingSegment.value = null
    editingJunction.value = null
    editingNavPoint.value = null
    editingNoGoZone.value = null
    editingNode.value = null
    editingNodeJunction.value = null
  }

  function enterPropertyEdit() {
    propertyEditing.value = true
  }

  function cancelPropertyEdit() {
    // 重新加载原始数据
    if (selectedEntity.value) {
      selectEntity(selectedEntity.value.type, selectedEntity.value.id)
    }
    propertyEditing.value = false
  }

  function isEntitySelected(type: string, id: string): boolean {
    return selectedEntity.value?.type === type && selectedEntity.value?.id === id
  }

  function isEntityHovered(type: string, id: string): boolean {
    return hoverEntity.value?.type === type && hoverEntity.value?.id === id
  }

  return {
    selectedEntity, hoverEntity,
    editingSegment, editingJunction, editingNavPoint, editingNoGoZone,
    editingNode, editingNodeJunction,
    propertyEditing,
    selectEntity, clearSelection, clearEditing,
    enterPropertyEdit, cancelPropertyEdit,
    isEntitySelected, isEntityHovered
  }
}
