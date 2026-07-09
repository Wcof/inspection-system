import { ref } from 'vue'
import { MockService } from '@/mock/mockService'
import { useUndoRedo } from '@/utils/undo-redo'
import type {
  RoadNode, RoadEdge, RoadSegment, Junction,
  NavigationPoint, NoGoZone, TopologyCheckResult
} from '@/types/road-network'

/**
 * 路网数据加载/保存/撤销 composable
 */
export function useRoadNetworkData() {
  const nodes = ref<RoadNode[]>([])
  const edges = ref<RoadEdge[]>([])
  const segments = ref<RoadSegment[]>([])
  const junctions = ref<Junction[]>([])
  const navPoints = ref<NavigationPoint[]>([])
  const noGoZones = ref<NoGoZone[]>([])
  const lastTopologyCheck = ref<TopologyCheckResult | null>(null)
  const hasUnsavedChanges = ref(false)
  const selectedMapId = ref('')

  const { canUndo, canRedo, pushSnapshot, undo, redo, clear: clearUndoRedo } = useUndoRedo<string>()

  function loadData() {
    nodes.value = MockService.getRoadNodes()
    edges.value = MockService.getRoadEdges()
    segments.value = MockService.getRoadSegments()
    junctions.value = MockService.getJunctions()
    navPoints.value = MockService.getNavigationPoints()
    noGoZones.value = MockService.getNoGoZones()
    const checks = MockService.getTopologyChecks()
    if (checks.length > 0) lastTopologyCheck.value = checks[checks.length - 1]
  }

  function getSnapshot(): string {
    return JSON.stringify({
      nodes: nodes.value, edges: edges.value, segments: segments.value,
      junctions: junctions.value, navPoints: navPoints.value, noGoZones: noGoZones.value
    })
  }

  function restoreSnapshot(json: string) {
    try {
      const data = JSON.parse(json)
      if (data.nodes) nodes.value = data.nodes
      if (data.edges) edges.value = data.edges
      if (data.segments) segments.value = data.segments
      if (data.junctions) junctions.value = data.junctions
      if (data.navPoints) navPoints.value = data.navPoints
      if (data.noGoZones) noGoZones.value = data.noGoZones
      hasUnsavedChanges.value = true
    } catch { /* ignore */ }
  }

  function pushSnapshotBeforeChange() {
    pushSnapshot(getSnapshot())
  }

  function handleUndo() {
    const prev = undo(getSnapshot())
    if (prev) { restoreSnapshot(prev); return true }
    return false
  }

  function handleRedo() {
    const next = redo(getSnapshot())
    if (next) { restoreSnapshot(next); return true }
    return false
  }

  function saveAll() {
    nodes.value.forEach(n => MockService.saveRoadNode(n))
    edges.value.forEach(e => MockService.saveRoadEdge(e))
    segments.value.forEach(s => MockService.saveRoadSegment(s))
    junctions.value.forEach(j => MockService.saveJunction(j))
    navPoints.value.forEach(p => MockService.saveNavigationPoint(p))
    noGoZones.value.forEach(z => MockService.saveNoGoZone(z))

    // 清理已删除条目
    const nodeIds = new Set(nodes.value.map(n => n.id))
    const edgeIds = new Set(edges.value.map(e => e.id))
    const segIds = new Set(segments.value.map(s => s.id))
    const juncIds = new Set(junctions.value.map(j => j.id))
    const navIds = new Set(navPoints.value.map(p => p.id))
    const zoneIds = new Set(noGoZones.value.map(z => z.id))

    MockService.getRoadNodes().forEach(n => { if (!nodeIds.has(n.id)) MockService.deleteRoadNode(n.id) })
    MockService.getRoadEdges().forEach(e => { if (!edgeIds.has(e.id)) MockService.deleteRoadEdge(e.id) })
    MockService.getRoadSegments().forEach(s => { if (!segIds.has(s.id)) MockService.deleteRoadSegment(s.id) })
    MockService.getJunctions().forEach(j => { if (!juncIds.has(j.id)) MockService.deleteJunction(j.id) })
    MockService.getNavigationPoints().forEach(p => { if (!navIds.has(p.id)) MockService.deleteNavigationPoint(p.id) })
    MockService.getNoGoZones().forEach(z => { if (!zoneIds.has(z.id)) MockService.deleteNoGoZone(z.id) })

    hasUnsavedChanges.value = false
  }

  function discardAllChanges() {
    loadData()
    hasUnsavedChanges.value = false
    clearUndoRedo()
  }

  return {
    nodes, edges, segments, junctions, navPoints, noGoZones,
    lastTopologyCheck, hasUnsavedChanges, selectedMapId,
    canUndo, canRedo,
    loadData, saveAll, discardAllChanges,
    pushSnapshotBeforeChange, handleUndo, handleRedo, clearUndoRedo
  }
}
