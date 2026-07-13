import { ref, type Ref } from 'vue'
import type { SegmentDraft, MapPoint } from '@/types/road-editor'
import type { RoadNode, RoadEdge, RoadSegment, Junction } from '@/types/road-network'

export interface SegmentDraft {
  id: string
  nodeIds: string[]
  tempNodes: import('./road-network').RoadNode[]
  tempEdges: import('./road-network').RoadEdge[]
  previewPoint?: MapPoint | null
  /** 草稿阶段暂存的对正式节点 edgeIds 的修改，commit 后才应用 */
  pendingExistingNodeEdgeIds?: Record<string, string[]>
}

/**
 * 绘制路网工具 — 草稿态管理
 * 绘制过程中只写草稿，完成时 commit，取消时 discard
 */
export function useRoadSegmentDrawing(
  nodes: Ref<RoadNode[]>,
  edges: Ref<RoadEdge[]>,
  segments: Ref<RoadSegment[]>,
  junctions: Ref<Junction[]>,
  selectedMapId: Ref<string>,
  pushSnapshotBeforeChange: () => void,
  hasUnsavedChanges: Ref<boolean>
) {
  const segmentDraft = ref<SegmentDraft | null>(null)
  const junctionModalVisible = ref(false)
  const junctionPendingNodeId = ref('')
  const junctionTypeForPending = ref<'t_junction' | 'cross' | 'normal'>('normal')
  const junctionSegIds = ref<string[]>([])

  function startDrawing() {
    pushSnapshotBeforeChange()
    const segId = `seg-${Date.now()}`
    segmentDraft.value = {
      id: segId,
      nodeIds: [],
      tempNodes: [],
      tempEdges: [],
      previewPoint: null
    }
  }

  function addNode(x: number, y: number) {
    if (!segmentDraft.value) return
    const draft = segmentDraft.value

    const nodeId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const now = new Date()
    const newNode: RoadNode = {
      id: nodeId, nodeType: 'waypoint', position: { x, y },
      edgeIds: [], mapId: selectedMapId.value,
      createdAt: now, updatedAt: now
    }

    draft.tempNodes.push(newNode)

    // 如果已经有上一个节点，创建边
    if (draft.nodeIds.length > 0) {
      const lastId = draft.nodeIds[draft.nodeIds.length - 1]
      const lastNode = draft.tempNodes.find(n => n.id === lastId) || nodes.value.find(n => n.id === lastId)
      if (lastNode) {
        const distance = Math.hypot(x - lastNode.position.x, y - lastNode.position.y)
        const edgeId = `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

        const newEdge: RoadEdge = {
          id: edgeId, fromNodeId: lastId, toNodeId: nodeId,
          segmentId: draft.id, distance, bidirectional: true,
          speedLimit: 30, width: 3,
          mapId: selectedMapId.value, createdAt: now, updatedAt: now
        }
        draft.tempEdges.push(newEdge)

        // 更新节点 edgeIds
        newNode.edgeIds.push(edgeId)
        const lastNodeRef = draft.tempNodes.find(n => n.id === lastId)
        if (lastNodeRef) lastNodeRef.edgeIds.push(edgeId)
      }
    }

    draft.nodeIds.push(nodeId)
  }

  /** 连接到已有节点（点击已有节点时调用） — 草稿阶段不修改正式节点 edgeIds */
  function connectToExistingNode(nodeId: string) {
    if (!segmentDraft.value) return
    const draft = segmentDraft.value
    const existingNode = nodes.value.find(n => n.id === nodeId)
    if (!existingNode) return

    const lastId = draft.nodeIds[draft.nodeIds.length - 1]

    // 如果还没节点，以已有节点为起点
    if (!lastId) {
      draft.nodeIds.push(nodeId)
      return
    }

    const lastNode = draft.tempNodes.find(n => n.id === lastId) || nodes.value.find(n => n.id === lastId)
    if (!lastNode) return

    const distance = Math.hypot(
      existingNode.position.x - lastNode.position.x,
      existingNode.position.y - lastNode.position.y
    )
    const edgeId = `edge-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const now = new Date()

    const newEdge: RoadEdge = {
      id: edgeId, fromNodeId: lastId, toNodeId: nodeId,
      segmentId: draft.id, distance, bidirectional: true,
      speedLimit: 30, width: 3,
      mapId: selectedMapId.value, createdAt: now, updatedAt: now
    }
    draft.tempEdges.push(newEdge)

    // 草稿阶段暂存对正式节点 edgeIds 的修改，不直接改正式节点
    const lastNodeRef = draft.tempNodes.find(n => n.id === lastId)
    if (lastNodeRef) lastNodeRef.edgeIds.push(edgeId)

    // 记录对正式节点 edgeIds 的待应用修改
    if (!draft.pendingExistingNodeEdgeIds) {
      draft.pendingExistingNodeEdgeIds = {}
    }
    if (!draft.pendingExistingNodeEdgeIds[nodeId]) {
      draft.pendingExistingNodeEdgeIds[nodeId] = [...(existingNode.edgeIds || [])]
    }
    draft.pendingExistingNodeEdgeIds[nodeId].push(edgeId)

    draft.nodeIds.push(nodeId)
  }

  /** commit 草稿到正式数据 */
  function commitDraft() {
    if (!segmentDraft.value) return
    const draft = segmentDraft.value
    if (draft.nodeIds.length < 2) return

    pushSnapshotBeforeChange()

    // 1) 添加临时节点
    draft.tempNodes.forEach(n => {
      if (!nodes.value.find(en => en.id === n.id)) {
        nodes.value.push(n)
      }
    })

    // 2) 添加临时边到正式 edges
    draft.tempEdges.forEach(e => {
      if (!edges.value.find(ee => ee.id === e.id)) {
        edges.value.push(e)
      }
    })

    // 3) 应用草稿阶段对正式节点 edgeIds 的挂起修改
    if (draft.pendingExistingNodeEdgeIds) {
      Object.entries(draft.pendingExistingNodeEdgeIds).forEach(([nodeId, newEdgeIds]) => {
        const node = nodes.value.find(n => n.id === nodeId)
        if (node) {
          node.edgeIds = newEdgeIds
        }
      })
    }

    // 3) 创建路段
    const segCode = `S${String(segments.value.length + 1).padStart(4, '0')}`
    const now = new Date()
    const firstNode = nodes.value.find(n => n.id === draft.nodeIds[0])
    const lastNode = nodes.value.find(n => n.id === draft.nodeIds[draft.nodeIds.length - 1])

    let totalLength = 0
    draft.tempEdges.forEach(e => { totalLength += e.distance })

    const newSegment: RoadSegment = {
      id: draft.id, name: `路段 ${segCode}`, code: segCode,
      mapId: selectedMapId.value, area: '', segmentType: 'trunk', status: 'active',
      nodeIds: [...draft.nodeIds], edgeIds: draft.tempEdges.map(e => e.id),
      length: totalLength, width: 3,
      startPoint: firstNode?.position || { x: 0, y: 0 },
      endPoint: lastNode?.position || { x: 0, y: 0 },
      bidirectional: true, speedLimit: 30, safetyLevel: 'normal' as const,
      allowReverse: false, allowUTurn: false, allowSpin: false,
      color: '#1677ff', createdAt: now, updatedAt: now
    }
    segments.value.push(newSegment)

    // 4) 自动路口检测
    draft.nodeIds.forEach(nid => {
      autoDetectJunction(nid)
    })

    hasUnsavedChanges.value = true
    segmentDraft.value = null

    return { segmentId: draft.id }
  }

  function discardDraft() {
    segmentDraft.value = null
  }

  function hasDraft(): boolean {
    return segmentDraft.value !== null && segmentDraft.value.nodeIds.length > 0
  }

  function setPreviewPoint(point: MapPoint | null) {
    if (segmentDraft.value) {
      segmentDraft.value.previewPoint = point
    }
  }

  // 自动路口检测
  function autoDetectJunction(nodeId: string) {
    const node = nodes.value.find(n => n.id === nodeId)
    if (!node) return
    if (node.edgeIds.length >= 3 && node.nodeType === 'waypoint') {
      const existing = junctions.value.find(j => j.nodeId === nodeId)
      if (existing) {
        const segIds = new Set<string>()
        node.edgeIds.forEach(eid => {
          const edge = edges.value.find(e => e.id === eid)
          if (edge?.segmentId) segIds.add(edge.segmentId)
        })
        existing.connectedSegmentIds = [...segIds]
        return
      }

      const segIds = new Set<string>()
      node.edgeIds.forEach(eid => {
        const edge = edges.value.find(e => e.id === eid)
        if (edge?.segmentId) segIds.add(edge.segmentId)
      })
      junctionPendingNodeId.value = nodeId
      junctionTypeForPending.value = 'normal'
      junctionSegIds.value = [...segIds]
      junctionModalVisible.value = true
    }
  }

  function confirmJunction() {
    const nodeId = junctionPendingNodeId.value
    if (!nodeId) return
    const node = nodes.value.find(n => n.id === nodeId)
    if (!node) return

    const jId = `junc-${Date.now()}`
    const jCode = `J${String(junctions.value.length + 1).padStart(3, '0')}`

    const j: Junction = {
      id: jId, name: jCode, code: jCode, mapId: selectedMapId.value,
      nodeId, connectedSegmentIds: [...junctionSegIds.value],
      junctionType: junctionTypeForPending.value,
      priority: 'main_road', conflictMode: 'mutex',
      allowLeftTurn: true, allowRightTurn: true, allowStraight: true, allowUTurn: false,
      createdAt: new Date(), updatedAt: new Date()
    }
    junctions.value.push(j)
    hasUnsavedChanges.value = true
    junctionModalVisible.value = false
    junctionPendingNodeId.value = ''
  }

  function cancelJunction() {
    const nodeId = junctionPendingNodeId.value
    if (nodeId) {
      const node = nodes.value.find(n => n.id === nodeId)
      if (node) node.nodeType = 'waypoint'
    }
    junctionModalVisible.value = false
    junctionPendingNodeId.value = ''
  }

  return {
    segmentDraft, junctionModalVisible, junctionPendingNodeId,
    junctionTypeForPending, junctionSegIds,
    startDrawing, addNode, connectToExistingNode,
    commitDraft, discardDraft, hasDraft, setPreviewPoint,
    confirmJunction, cancelJunction
  }
}
