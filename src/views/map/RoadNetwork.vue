<template>
  <div class="road-network">
    <!-- 顶部工具栏 -->
    <RoadNetworkToolbar
      :maps="inspectionStore.inspectionMaps"
      :selected-map-id="selectedMapId"
      :checking-topology="checkingTopology"
      @update:selected-map-id="selectedMapId = $event"
      @map-change="onMapChange"
      @topology-check="runTopologyCheck"
      @path-sim="pathSimVisible = true"
      @split-change="splitLayout.setLayout($event as any)"
    >
      <template #tools>
        <!-- 工具调色板集成在中间 -->
      </template>
      <template #saveBtn>
        <a-button v-if="data.hasUnsavedChanges.value" size="small" type="primary" ghost @click="saveAll" class="save-btn-unsaved">
          <SaveOutlined /> 保存路网
        </a-button>
        <a-button v-else size="small" type="primary" @click="saveAll">
          <SaveOutlined /> 保存
        </a-button>
      </template>
    </RoadNetworkToolbar>

    <!-- 工具调色板 -->
    <RoadToolPalette
      :active-tool="editorTool.activeTool.value"
      :place-node-type="placeNodeType"
      @select-tool="switchTool"
      @update:place-node-type="placeNodeType = $event"
      @finish-draw="finishCurrentDraw"
      @cancel-draw="cancelCurrentDraw"
    />

    <!-- 地图图层切换 -->
    <div class="rn-layer-bar">
      <RoadLayerToggleGroup
        :show-segments="showSegments" :show-junctions="showJunctionNodes"
        :show-inspection="showNavInspection" :show-parking="showNavParking"
        :show-charging="showNavCharging" :show-zones="showNoGoZones"
        :show-waypoints="showWaypointNodes"
        @toggle="toggleLayer"
      />
    </div>

    <!-- 主体三栏布局 -->
    <div class="rn-body">
      <!-- 左侧资源树 -->
      <RoadResourceTree
        :collapsed="sidebarCollapsed"
        :segments="mapSegments"
        :nav-points="mapNavPoints"
        :zones="mapNoGoZones"
        :selected-entity="selection.selectedEntity.value"
        @toggle="sidebarCollapsed = !sidebarCollapsed"
        @select="onTreeSelect"
        @hover="selection.hoverEntity.value = $event as any"
      />

      <!-- 中间地图编辑区 -->
      <SplitViewContainer
        :layout="splitLayout.splitLayout.value"
        :cloud-available="splitLayout.pointCloudAvailable.value"
        :cloud-disabled-reason="splitLayout.pointCloudDisabledReason.value"
      >
        <template #map2d>
          <Map2DViewport
            :view-box="viewBox"
            @map-click="onMapClick"
            @mouse-down="onMapMouseDown"
            @mouse-move="onMapMouseMove"
            @mouse-up="onMapMouseUp"
            @right-click="onRightClick"
            @zoom-in="zoomIn"
            @zoom-out="zoomOut"
            @fit-content="fitContent"
          >
            <!-- SVG 地图内容 -->
            <image v-if="currentMapImageUrl" :href="currentMapImageUrl" x="0" y="0" :width="mapWidth" :height="mapHeight" preserveAspectRatio="xMidYMid slice" />
            <rect v-else x="0" y="0" :width="mapWidth" :height="mapHeight" fill="#f0f2f5" />
            <g opacity="0.15">
              <line v-for="i in 16" :key="'gx'+i" :x1="i * 50" y1="0" :x2="i * 50" :y2="mapHeight" stroke="#999" stroke-width="0.5" />
              <line v-for="i in 12" :key="'gy'+i" x1="0" :y1="i * 50" :x2="mapWidth" :y2="i * 50" stroke="#999" stroke-width="0.5" />
            </g>

            <!-- 区域绘制草稿 -->
            <g v-if="areaDrawing.hasDraft() && areaDrawing.areaDraft.value">
              <polyline
                :points="getDraftAreaPoints()"
                fill="rgba(255,77,79,0.1)" stroke="#ff4d4f" stroke-width="1.5" stroke-dasharray="6 4" />
              <circle v-for="(pt, idx) in areaDrawing.areaDraft.value!.points" :key="'adp'+idx"
                :cx="pt.x" :cy="pt.y" r="4" fill="#ff4d4f" stroke="#fff" stroke-width="1" />
              <!-- 可闭合提示 -->
              <circle v-if="areaDrawing.areaDraft.value!.closeReady && areaDrawing.areaDraft.value!.points.length >= 2"
                :cx="areaDrawing.areaDraft.value!.points[0].x"
                :cy="areaDrawing.areaDraft.value!.points[0].y" r="8" fill="none" stroke="#ff4d4f" stroke-width="2" class="close-pulse" />
            </g>

            <!-- 已保存区域 -->
            <g v-if="showNoGoZones">
              <g v-for="zone in mapNoGoZones" :key="zone.id"
                :class="{ 'entity-dimmed': selection.selectedEntity.value && !(selection.selectedEntity.value.type === 'nogozone' && selection.selectedEntity.value.id === zone.id) }">
                <polygon
                  :points="zone.polygonPoints.map(p => `${p.x},${p.y}`).join(' ')"
                  :fill="noGoZoneFill(zone)" fill-opacity="0.25"
                  :stroke="noGoZoneStroke(zone)" stroke-width="1.5"
                  :class="getZoneHighlightClass(zone)"
                  @click.stop="onZoneClick(zone)" class="clickable" />
                <text :x="calcPolygonCenter(zone).x" :y="calcPolygonCenter(zone).y" text-anchor="middle" class="zone-label">{{ zone.name }}</text>
              </g>
            </g>

            <!-- 路段边 -->
            <g v-if="showSegments">
              <g v-for="edge in mapEdges" :key="edge.id"
                :class="{ 'entity-dimmed': selection.selectedEntity.value && !(selection.selectedEntity.value.type === 'segment' && selection.selectedEntity.value.id === edge.segmentId) }">
                <path :d="getEdgePath(edge)" fill="none"
                  :stroke="getEdgeColor(edge)" stroke-width="3"
                  :stroke-dasharray="!edge.bidirectional ? '8 4' : 'none'"
                  :class="{ 'edge-highlight': isPathEdge(edge.id), 'edge-hover': selection.isEntityHovered('segment', edge.segmentId || '') }"
                  @click.stop="selectSegmentByEdge(edge)" style="cursor: pointer;" />
                <text v-if="getEdgeSegment(edge)"
                  :x="((getNode(edge.fromNodeId)?.position.x || 0) + (getNode(edge.toNodeId)?.position.x || 0)) / 2"
                  :y="((getNode(edge.fromNodeId)?.position.y || 0) + (getNode(edge.toNodeId)?.position.y || 0)) / 2 - 8"
                  text-anchor="middle" class="edge-label">{{ getEdgeSegment(edge)?.name }}</text>
              </g>
            </g>

            <!-- 路段绘制草稿 -->
            <g v-if="segmentDrawing.hasDraft() && segmentDrawing.segmentDraft.value">
              <!-- 草稿节点 -->
              <circle v-for="n in segmentDrawing.segmentDraft.value.tempNodes" :key="n.id"
                :cx="n.position.x" :cy="n.position.y" r="6" fill="#1677ff" stroke="#fff" stroke-width="2" />
              <!-- 草稿边 -->
              <line v-for="e in segmentDrawing.segmentDraft.value.tempEdges" :key="e.id"
                :x1="getNode(e.fromNodeId)?.position.x || getTempNodePos(e.fromNodeId).x"
                :y1="getNode(e.fromNodeId)?.position.y || getTempNodePos(e.fromNodeId).y"
                :x2="getNode(e.toNodeId)?.position.x || getTempNodePos(e.toNodeId).x"
                :y2="getNode(e.toNodeId)?.position.y || getTempNodePos(e.toNodeId).y"
                stroke="#1677ff" stroke-width="2" />
              <!-- 鼠标跟随虚线 -->
              <line v-if="segmentDrawing.segmentDraft.value.nodeIds.length > 0"
                :x1="getLastDraftNodePos().x" :y1="getLastDraftNodePos().y"
                :x2="mousePos.x" :y2="mousePos.y"
                stroke="#1677ff" stroke-width="2" stroke-dasharray="6 4" />
            </g>

            <!-- 路口标记 -->
            <g v-for="j in mapJunctions" :key="'jg'+j.id"
              :class="{ 'entity-dimmed': selection.selectedEntity.value && !(selection.selectedEntity.value.type === 'junction' && selection.selectedEntity.value.id === j.id) }"
              @click.stop="selection.selectEntity('junction', j.id)" class="clickable">
              <rect :x="getJunctionNodePos(j).x - 12" :y="getJunctionNodePos(j).y - 12" width="24" height="24" rx="4"
                :fill="selection.selectedEntity.value?.type === 'junction' && selection.selectedEntity.value?.id === j.id ? '#1677ff' : '#faad14'"
                stroke="#fff" stroke-width="2" />
              <text :x="getJunctionNodePos(j).x" :y="getJunctionNodePos(j).y + 4" text-anchor="middle" class="junction-icon">J</text>
            </g>

            <!-- 节点 -->
            <g>
              <g v-for="node in mapNodes" :key="node.id"
                :class="{ 'entity-dimmed': selection.selectedEntity.value && !(selection.selectedEntity.value.type === 'node' && selection.selectedEntity.value.id === node.id) }"
                @mousedown.stop="onNodeMouseDown(node, $event)" class="clickable">
                <circle :cx="node.position.x" :cy="node.position.y" :r="getNodeRadius(node)"
                  :fill="getNodeColor(node)" :stroke="getNodeStroke(node)" stroke-width="2"
                  :class="{ 'node-selected': selection.selectedEntity.value?.type === 'node' && selection.selectedEntity.value?.id === node.id, 'entity-hover': selection.isEntityHovered('node', node.id) }" />
                <text v-if="node.nodeType !== 'waypoint'" :x="node.position.x" :y="node.position.y + 3.5" text-anchor="middle" class="nav-icon">{{ nodeIcon(node.nodeType) }}</text>
                <text v-if="node.name && !navNodeIds.has(node.id)" :x="node.position.x" :y="node.position.y - 10" text-anchor="middle" class="node-label">{{ node.name }}</text>
              </g>
            </g>

            <!-- 导航点位 -->
            <g>
              <g v-for="p in mapNavPoints" :key="'np'+p.id"
                :class="{ 'entity-dimmed': selection.selectedEntity.value && !(selection.selectedEntity.value.type === 'navpoint' && selection.selectedEntity.value.id === p.id) }"
                @mousedown.stop="onNavPointMouseDown(p, $event)" class="clickable">
                <circle :cx="p.position.x" :cy="p.position.y" r="8"
                  :fill="selection.selectedEntity.value?.type === 'navpoint' && selection.selectedEntity.value?.id === p.id ? '#1677ff' : navPointColor(p.navType)"
                  stroke="#fff" stroke-width="2"
                  :class="{ 'entity-hover': selection.isEntityHovered('navpoint', p.id) }" />
                <text :x="p.position.x" :y="p.position.y + 3.5" text-anchor="middle" class="nav-icon">{{ navPointIcon(p.navType) }}</text>
                <text :x="p.position.x" :y="p.position.y - 14" text-anchor="middle" class="node-label">{{ p.name }}</text>
              </g>
            </g>

            <!-- 路径模拟结果 -->
            <g v-if="simulationPath">
              <line v-for="(seg, idx) in simulationPath" :key="'sp'+idx"
                :x1="seg.x1" :y1="seg.y1" :x2="seg.x2" :y2="seg.y2"
                stroke="#ff4d4f" stroke-width="4" stroke-linecap="round" opacity="0.8" />
            </g>
          </Map2DViewport>
        </template>

        <template #pointcloud>
          <PointCloudViewport
            :available="splitLayout.pointCloudAvailable.value"
            :disabled-reason="splitLayout.pointCloudDisabledReason.value"
            :selected-entity-name="selectedEntityLabel"
          />
        </template>
      </SplitViewContainer>

      <!-- 右侧属性面板 -->
      <RoadPropertyPanel
        :collapsed="propertyCollapsed"
        :selected-entity="selection.selectedEntity.value"
        :property-editing="selection.propertyEditing.value"
        :edit-segment="selection.editingSegment.value"
        :edit-junction="selection.editingJunction.value"
        :edit-nav-point="selection.editingNavPoint.value"
        :edit-no-go-zone="selection.editingNoGoZone.value"
        @toggle="propertyCollapsed = !propertyCollapsed"
        @edit="selection.enterPropertyEdit()"
        @save="savePropertyEdit"
        @cancel="selection.cancelPropertyEdit()"
        @delete="deleteSelectedEntity"
        @color-change="() => {}"
      />
    </div>

    <!-- 右上状态摘要 -->
    <div class="rn-status-overlay">
      <RoadStatusSummary
        :counts="{
          segments: mapSegments.length,
          nodes: mapNodes.length,
          junctions: mapJunctions.length,
          navPoints: mapNavPoints.length,
          zones: mapNoGoZones.length
        }"
        :mouse-pos="mousePos"
        :topology-errors="lastTopologyCheck?.totalCritical"
      />
    </div>

    <!-- 绘制提示 -->
    <div v-if="editorTool.activeTool.value === 'drawSegment'" class="draw-hint">
      {{ segmentDrawing.hasDraft() ? '继续点击添加路径点，双击/完成结束' : '在地图上点击放置起点' }}
    </div>
    <div v-else-if="editorTool.activeTool.value === 'drawArea'" class="draw-hint">
      {{ areaDrawing.hasDraft() ? '继续点击添加顶点，点击起点闭合' : '在地图上点击落点绘制区域' }}
    </div>
    <div v-else-if="editorTool.activeTool.value === 'placeNode'" class="draw-hint placement-hint">
      <AimOutlined /> 点击地图放置{{ placeNodeLabel }}，连续放置；切换工具退出
    </div>

    <!-- 模态框 -->
    <CalibrationNoticeModal
      :open="calibration.showCalibrationModal.value"
      :point-name="calibration.calibratingPoint.value?.name"
      @close="calibration.closeCalibrationModal()"
      @calibrate="calibration.goToCalibration()"
    />

    <JunctionTypeModal
      :open="segmentDrawing.junctionModalVisible.value"
      :model-value="segmentDrawing.junctionTypeForPending.value"
      @update:model-value="segmentDrawing.junctionTypeForPending.value = $event as any"
      @confirm="segmentDrawing.confirmJunction()"
      @cancel="segmentDrawing.cancelJunction()"
    />

    <!-- 路径模拟弹窗 -->
    <a-modal v-model:open="pathSimVisible" title="路径模拟" @ok="runPathSimulation" @cancel="pathSimVisible = false" width="420px">
      <a-form layout="vertical" size="small">
        <a-form-item label="起点">
          <a-select v-model:value="simStartId" placeholder="选择起点" allow-clear show-search :filter-option="filterNodeOption" style="width:100%">
            <a-select-option v-for="n in allNavNodes" :key="n.id" :value="n.id">{{ n.label }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="终点">
          <a-select v-model:value="simEndId" placeholder="选择终点" allow-clear show-search :filter-option="filterNodeOption" style="width:100%">
            <a-select-option v-for="n in allNavNodes" :key="n.id" :value="n.id">{{ n.label }}</a-select-option>
          </a-select>
        </a-form-item>
        <a-form-item label="算法">
          <a-radio-group v-model:value="simAlgorithm">
            <a-radio value="shortest">最短路径</a-radio>
            <a-radio value="fastest">最快路径</a-radio>
            <a-radio value="safest">最安全路径</a-radio>
          </a-radio-group>
        </a-form-item>
      </a-form>
      <a-alert v-if="simResult" :type="simResult.found ? 'success' : 'error'"
        :message="simResult.found ? `找到路径: ${Math.round(simResult.totalDistance)}m, 预计 ${Math.round(simResult.estimatedTime)}s` : '无法找到可达路径'"
        show-icon style="margin-top: 8px" />
    </a-modal>

    <!-- 拓扑检查结果弹窗 -->
    <a-modal v-model:open="topologyVisible" title="拓扑检查结果" width="600px" :footer="null">
      <template v-if="lastTopologyCheck">
        <a-row :gutter="16" style="margin-bottom: 16px">
          <a-col :span="8"><a-statistic title="严重问题" :value="lastTopologyCheck.totalCritical" :value-style="{ color: '#ff4d4f' }" /></a-col>
          <a-col :span="8"><a-statistic title="警告问题" :value="lastTopologyCheck.totalWarning" :value-style="{ color: '#faad14' }" /></a-col>
          <a-col :span="8"><a-statistic title="提示问题" :value="lastTopologyCheck.totalInfo" :value-style="{ color: '#1677ff' }" /></a-col>
        </a-row>
        <a-list :data-source="lastTopologyCheck.issues" size="small" :pagination="{ pageSize: 10 }">
          <template #renderItem="{ item }">
            <a-list-item>
              <a-list-item-meta>
                <template #title>
                  <a-space>
                    <a-tag :color="item.severity === 'critical' ? 'red' : item.severity === 'warning' ? 'orange' : 'blue'" size="small">
                      {{ item.severity === 'critical' ? '严重' : item.severity === 'warning' ? '警告' : '提示' }}
                    </a-tag>
                    <span>{{ item.message }}</span>
                  </a-space>
                </template>
              </a-list-item-meta>
            </a-list-item>
          </template>
        </a-list>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, reactive, ref } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useRoute } from 'vue-router'
import { SaveOutlined } from '@ant-design/icons-vue'
import { useInspectionStore } from '@/stores/inspection'
import { MockService } from '@/mock/mockService'
import type {
  RoadNode, RoadEdge, NavigationPoint, NoGoZone,
  RoadNodeType, NavigationPointType,
  TopologyIssue,
  PathAlgorithm, PathResult
} from '@/types/road-network'
import type { EditorTool, PlaceNodeType } from '@/types/road-editor'

// ─── 子组件 ───
import RoadNetworkToolbar from './components/RoadNetworkToolbar.vue'
import RoadToolPalette from './components/RoadToolPalette.vue'
import RoadResourceTree from './components/RoadResourceTree.vue'
import RoadPropertyPanel from './components/RoadPropertyPanel.vue'
import RoadStatusSummary from './components/RoadStatusSummary.vue'
import CalibrationNoticeModal from './components/CalibrationNoticeModal.vue'
import JunctionTypeModal from './components/JunctionTypeModal.vue'
import SplitViewContainer from './components/SplitViewContainer.vue'
import Map2DViewport from './components/Map2DViewport.vue'
import PointCloudViewport from './components/PointCloudViewport.vue'
import RoadLayerToggleGroup from './components/RoadLayerToggleGroup.vue'

// ─── Composables ───
import { useRoadEditorTool } from './composables/useRoadEditorTool'
import { useRoadNetworkData } from './composables/useRoadNetworkData'
import { useRoadSelection } from './composables/useRoadSelection'
import { useRoadSegmentDrawing } from './composables/useRoadSegmentDrawing'
import { useRoadAreaDrawing } from './composables/useRoadAreaDrawing'
import { useRoadDragging } from './composables/useRoadDragging'
import { useRoadKeyboardShortcuts } from './composables/useRoadKeyboardShortcuts'
import { useRoadSplitLayout } from './composables/useRoadSplitLayout'
import { useRoadCalibration } from './composables/useRoadCalibration'
import { useRoadHazardPolicy } from './composables/useRoadHazardPolicy'

const route = useRoute()
const inspectionStore = useInspectionStore()

// ─── 数据层 ───
const data = useRoadNetworkData()
const { nodes, edges, segments, junctions, navPoints, noGoZones,
  lastTopologyCheck, hasUnsavedChanges, selectedMapId,
  saveAll: persistAll, pushSnapshotBeforeChange } = data

// ─── 工具状态 ───
const editorTool = useRoadEditorTool()
const placeNodeType = ref<PlaceNodeType>('inspection')

// ─── 选取 ───
const selection = useRoadSelection(nodes, segments, junctions, navPoints, noGoZones)

// ─── 绘制 ───
const segmentDrawing = useRoadSegmentDrawing(nodes, edges, segments, junctions, selectedMapId, pushSnapshotBeforeChange, hasUnsavedChanges)
const areaDrawing = useRoadAreaDrawing(noGoZones, selectedMapId, pushSnapshotBeforeChange, hasUnsavedChanges)

// ─── 校准 ───
const calibration = useRoadCalibration(navPoints, selectedMapId)

// ─── 拖拽 ───
const dragging = useRoadDragging(nodes, navPoints, noGoZones, editorTool.activeTool, selection.selectedEntity, pushSnapshotBeforeChange, hasUnsavedChanges, calibration.markPending)

// ─── 分屏 ───
const splitLayout = useRoadSplitLayout()

// ─── 危区策略 ───
const hazardPolicy = useRoadHazardPolicy(noGoZones, navPoints)

// ─── 快捷键 ───
useRoadKeyboardShortcuts(
  editorTool.activeTool, selection.selectedEntity,
  () => segmentDrawing.hasDraft(), () => areaDrawing.hasDraft(),
  () => segmentDrawing.discardDraft(), () => areaDrawing.discardDraft(),
  () => selection.clearSelection(), () => deleteSelectedEntity(),
  () => data.handleUndo(), () => data.handleRedo()
)

// ─── 地图状态 ───
const mapWidth = 800
const mapHeight = 600
const viewBox = ref(`0 0 ${mapWidth} ${mapHeight}`)
const scale = ref(1)
const panX = ref(0)
const panY = ref(0)
const isPanning = ref(false)
const mouseMovedDuringDrag = ref(false)
const panStart = reactive({ x: 0, y: 0 })
const mousePos = reactive({ x: 0, y: 0 })

// ─── 图层 ───
const showSegments = ref(true)
const showNoGoZones = ref(true)
const showWaypointNodes = ref(false)
const showJunctionNodes = ref(true)
const showNavInspection = ref(true)
const showNavParking = ref(true)
const showNavCharging = ref(true)

// ─── 面板折叠 ───
const sidebarCollapsed = ref(false)
const propertyCollapsed = ref(false)

// ─── 路径模拟 ───
const pathSimVisible = ref(false)
const simStartId = ref<string | null>(null)
const simEndId = ref<string | null>(null)
const simAlgorithm = ref<PathAlgorithm>('shortest')
const simResult = ref<PathResult | null>(null)
const simulationPath = ref<{ x1: number; y1: number; x2: number; y2: number }[] | null>(null)

// ─── 拓扑检查 ───
const checkingTopology = ref(false)
const topologyVisible = ref(false)

// ─── 计算属性 ───
const currentMap = computed(() => inspectionStore.inspectionMaps.find(m => m.id === selectedMapId.value))
const currentMapImageUrl = computed(() => currentMap.value?.imageUrl || '')

const mapNodes = computed(() => {
  return nodes.value.filter(n => {
    if (n.mapId !== selectedMapId.value) return false
    if (n.nodeType === 'waypoint') return showWaypointNodes.value
    if (n.nodeType === 'junction') return showJunctionNodes.value
    if (n.nodeType === 'inspection') return showNavInspection.value
    if (n.nodeType === 'parking') return showNavParking.value
    if (n.nodeType === 'charging') return showNavCharging.value
    return true
  })
})
const mapEdges = computed(() => {
  if (!showSegments.value) return []
  const currentSegIds = new Set(segments.value.filter(s => s.mapId === selectedMapId.value).map(s => s.id))
  return edges.value.filter(e => e.mapId === selectedMapId.value && e.segmentId && currentSegIds.has(e.segmentId))
})
const mapSegments = computed(() => segments.value.filter(s => s.mapId === selectedMapId.value))
const mapJunctions = computed(() => {
  if (!showJunctionNodes.value) return []
  return junctions.value.filter(j => j.mapId === selectedMapId.value)
})
const mapNavPoints = computed(() => {
  return navPoints.value.filter(p => {
    if (p.mapId !== selectedMapId.value) return false
    if (p.navType === 'inspection') return showNavInspection.value
    if (p.navType === 'parking') return showNavParking.value
    if (p.navType === 'charging') return showNavCharging.value
    return true
  })
})
const mapNoGoZones = computed(() => noGoZones.value.filter(z => z.mapId === selectedMapId.value))
const navNodeIds = computed(() => new Set(mapNavPoints.value.map(p => p.nodeId)))
const allNavNodes = computed(() => {
  const nodeItems = mapNodes.value.filter(n => n.name).map(n => ({ id: n.id, label: n.name || n.id }))
  const navItems = mapNavPoints.value.map(p => ({ id: p.nodeId, label: `${p.name} (${navPointTypeLabel(p.navType)})` }))
  return [...nodeItems, ...navItems]
})
const selectedEntityLabel = computed(() => {
  const s = selection.selectedEntity.value
  if (!s) return ''
  if (s.type === 'navpoint') {
    const p = navPoints.value.find(n => n.id === s.id)
    return p?.name || ''
  }
  return s.id
})
const placeNodeLabel = computed(() => {
  const map: Record<string, string> = { inspection: '巡检点', parking: '停车点', charging: '充电点' }
  return map[placeNodeType.value] || '点位'
})

// ─── 工具切换 ───
async function switchTool(nextTool: EditorTool) {
  if (editorTool.activeTool.value === nextTool) return

  // 检查是否有未完成草稿
  if (segmentDrawing.hasDraft() || areaDrawing.hasDraft()) {
    const ok = await new Promise<boolean>(resolve => {
      Modal.confirm({
        title: '确认切换',
        content: '当前绘制尚未完成，切换工具将丢弃未保存内容，确认？',
        onOk: () => resolve(true),
        onCancel: () => resolve(false)
      })
    })
    if (!ok) return
    segmentDrawing.discardDraft()
    areaDrawing.discardDraft()
  }

  // 退出编辑态
  if (selection.propertyEditing.value) {
    selection.cancelPropertyEdit()
  }

  editorTool.setActiveTool(nextTool)
  selection.clearSelection()

  if (nextTool === 'drawSegment') {
    segmentDrawing.startDrawing()
  } else if (nextTool === 'drawArea') {
    areaDrawing.startDrawing()
  }
}

function finishCurrentDraw() {
  if (editorTool.isTool('drawSegment')) {
    if (!segmentDrawing.hasDraft()) return
    const result = segmentDrawing.commitDraft()
    if (result) {
      selection.selectEntity('segment', result.segmentId)
      selection.enterPropertyEdit()
    }
  } else if (editorTool.isTool('drawArea')) {
    const result = areaDrawing.finishDrawing()
    if (result) {
      selection.selectEntity('nogozone', result.zoneId)
      selection.enterPropertyEdit()
    }
  }
  editorTool.setActiveTool('select')
}

function cancelCurrentDraw() {
  segmentDrawing.discardDraft()
  areaDrawing.discardDraft()
  editorTool.setActiveTool('select')
}

// ─── 保存 ───
function saveAll() {
  if (!selectedMapId.value) { message.warning('请先选择地图'); return }
  if (selection.propertyEditing.value) {
    savePropertyEdit()
  }
  persistAll()
  message.success('路网已保存')
}

function savePropertyEdit() {
  if (!selection.selectedEntity.value) return
  const { type, id } = selection.selectedEntity.value
  const now = new Date()

  if (type === 'segment' && selection.editingSegment.value) {
    const es = selection.editingSegment.value
    es.edgeIds.forEach(eid => {
      const edge = edges.value.find(e => e.id === eid)
      if (edge) { edge.bidirectional = es.bidirectional; edge.speedLimit = es.speedLimit; edge.width = es.width }
    })
    es.updatedAt = now
    const idx = segments.value.findIndex(s => s.id === id)
    if (idx >= 0) segments.value[idx] = { ...es }
  } else if (type === 'junction' && selection.editingJunction.value) {
    selection.editingJunction.value.updatedAt = now
    const idx = junctions.value.findIndex(j => j.id === id)
    if (idx >= 0) junctions.value[idx] = { ...selection.editingJunction.value }
  } else if (type === 'navpoint' && selection.editingNavPoint.value) {
    selection.editingNavPoint.value.updatedAt = now
    const idx = navPoints.value.findIndex(p => p.id === id)
    if (idx >= 0) navPoints.value[idx] = { ...selection.editingNavPoint.value }
  } else if (type === 'nogozone' && selection.editingNoGoZone.value) {
    // 危区策略校验
    const ez = selection.editingNoGoZone.value
    hazardPolicy.clearErrors()
    hazardPolicy.validateZ1SafeExit(ez)
    if (hazardPolicy.hazardPolicyErrors.value.length > 0) {
      message.warning(hazardPolicy.hazardPolicyErrors.value[0])
      return
    }
    ez.updatedAt = now
    const idx = noGoZones.value.findIndex(z => z.id === id)
    if (idx >= 0) noGoZones.value[idx] = { ...ez }
  }

  hasUnsavedChanges.value = true
  selection.propertyEditing.value = false
  message.success('属性已保存')
}

// ─── 删除选中实体 ───
function deleteSelectedEntity() {
  if (!selection.selectedEntity.value) return
  const { type, id } = selection.selectedEntity.value
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除吗？保存后才会持久化。`,
    okButtonProps: { danger: true },
    onOk() {
      pushSnapshotBeforeChange()
      deleteEntityLocally(type, id)
      hasUnsavedChanges.value = true
      message.success('已删除（未持久化）')
    }
  })
}

function deleteEntityLocally(type: string, id: string) {
  if (type === 'segment') {
    const seg = segments.value.find(s => s.id === id)
    if (seg) {
      const edgeIdsToRemove = new Set(seg.edgeIds)
      edges.value = edges.value.filter(e => !edgeIdsToRemove.has(e.id))
      nodes.value.forEach(n => { n.edgeIds = n.edgeIds.filter(eid => !edgeIdsToRemove.has(eid)) })
      segments.value = segments.value.filter(s => s.id !== id)
    }
  } else if (type === 'junction') {
    junctions.value = junctions.value.filter(j => j.id !== id)
  } else if (type === 'navpoint') {
    navPoints.value = navPoints.value.filter(p => p.id !== id)
  } else if (type === 'nogozone') {
    noGoZones.value = noGoZones.value.filter(z => z.id !== id)
  }
  selection.clearSelection()
}

// ─── 地图事件 ───
function onMapClick(e: MouseEvent) {
  if (!selectedMapId.value) return

  const svg = e.currentTarget as SVGSVGElement
  const rect = svg.getBoundingClientRect()
  const x = ((e.clientX - rect.left) / rect.width) * mapWidth / scale.value + panX.value
  const y = ((e.clientY - rect.top) / rect.height) * mapHeight / scale.value + panY.value

  if (isPanning.value) return

  if (editorTool.isTool('drawSegment')) {
    segmentDrawing.addNode(x, y)
  } else if (editorTool.isTool('drawArea')) {
    areaDrawing.addPoint(x, y)
  } else if (editorTool.isTool('placeNode')) {
    createNavPointAtPosition(x, y)
  } else if (editorTool.isTool('select')) {
    // 点击空白取消选中
    selection.clearSelection()
  }
}

function onNodeClick(node: RoadNode) {
  if (editorTool.isTool('drawSegment')) {
    segmentDrawing.connectToExistingNode(node.id)
    return
  }
  selection.selectEntity('node', node.id)
  calibration.checkSelectionForCalibration('navpoint', node.id)
}

function onNodeMouseDown(node: RoadNode, e: MouseEvent) {
  onNodeClick(node)
  const rect = (e.currentTarget as SVGSVGElement)?.closest('svg')?.getBoundingClientRect()
  if (!rect) return
  dragging.startDrag(
    { type: 'node', id: node.id },
    { x: ((e.clientX - rect.left) / rect.width) * mapWidth / scale.value + panX.value,
      y: ((e.clientY - rect.top) / rect.height) * mapHeight / scale.value + panY.value }
  )
}

function onNavPointMouseDown(p: NavigationPoint, e: MouseEvent) {
  selection.selectEntity('navpoint', p.id)
  const svg = (e.currentTarget as HTMLElement).closest('svg')
  const rect = svg?.getBoundingClientRect()
  if (!rect) return
  dragging.startDrag(
    { type: 'navpoint', id: p.id },
    { x: ((e.clientX - rect.left) / rect.width) * mapWidth / scale.value + panX.value,
      y: ((e.clientY - rect.top) / rect.height) * mapHeight / scale.value + panY.value }
  )
}

function onZoneClick(zone: NoGoZone) {
  selection.selectEntity('nogozone', zone.id)
}

function selectSegmentByEdge(edge: RoadEdge) {
  if (edge.segmentId) selection.selectEntity('segment', edge.segmentId)
}

function onTreeSelect(type: string, id: string) {
  selection.selectEntity(type, id)
  calibration.checkSelectionForCalibration(type, id)
}

function onMapMouseDown(e: MouseEvent) {
  if (e.button === 1 || (e.button === 0 && editorTool.isTool('select'))) {
    isPanning.value = true; panStart.x = e.clientX; panStart.y = e.clientY; mouseMovedDuringDrag.value = false
  }
}

function onMapMouseMove(e: MouseEvent) {
  const svg = (e.currentTarget as SVGSVGElement)
  if (!svg) return
  const rect = svg.getBoundingClientRect()
  const mx = ((e.clientX - rect.left) / rect.width) * mapWidth / scale.value + panX.value
  const my = ((e.clientY - rect.top) / rect.height) * mapHeight / scale.value + panY.value
  mousePos.x = mx; mousePos.y = my

  segmentDrawing.setPreviewPoint({ x: mx, y: my })
  areaDrawing.setPreviewPoint({ x: mx, y: my })

  if (isPanning.value) {
    const moved = Math.hypot(e.clientX - panStart.x, e.clientY - panStart.y)
    if (moved > 5) mouseMovedDuringDrag.value = true
    if (!mouseMovedDuringDrag.value) return
    const dx = (e.clientX - panStart.x) / rect.width * mapWidth / scale.value
    const dy = (e.clientY - panStart.y) / rect.height * mapHeight / scale.value
    panX.value -= dx; panY.value -= dy; panStart.x = e.clientX; panStart.y = e.clientY
    updateViewBox()
  }

  if (dragging.isDragging()) {
    dragging.moveDrag({ x: mx, y: my })
  }
}

function onMapMouseUp() {
  if (dragging.isDragging()) {
    dragging.endDrag()
  }
  isPanning.value = false
  mouseMovedDuringDrag.value = false
}

function onRightClick() {
  if (editorTool.isTool('drawArea')) {
    finishCurrentDraw()
  }
}

// ─── 新建点位 ───
function createNavPointAtPosition(x: number, y: number) {
  const now = new Date()
  const id = `nav-${Date.now()}`
  const code = `P${String(navPoints.value.length + 1).padStart(3, '0')}`
  const nodeId = `node-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`

  const newNode: RoadNode = {
    id: nodeId, nodeType: 'waypoint', position: { x, y },
    edgeIds: [], mapId: selectedMapId.value,
    createdAt: now, updatedAt: now
  }
  nodes.value.push(newNode)

  const name = `${placeNodeLabel.value} ${code}`
  const p: NavigationPoint = {
    id, name, code, mapId: selectedMapId.value, area: '',
    navType: placeNodeType.value as NavigationPointType,
    position: { x, y }, nodeId,
    createdAt: now, updatedAt: now
  }
  navPoints.value.push(p)
  hasUnsavedChanges.value = true
  selection.selectEntity('navpoint', id)
  selection.enterPropertyEdit()
  message.success(`已放置${placeNodeLabel.value}，继续点击放置下一个`)
}

// ─── 图层切换 ───
function toggleLayer(layer: string) {
  const toggleMap: Record<string, () => void> = {
    segments: () => { showSegments.value = !showSegments.value },
    junctions: () => { showJunctionNodes.value = !showJunctionNodes.value },
    inspection: () => { showNavInspection.value = !showNavInspection.value },
    parking: () => { showNavParking.value = !showNavParking.value },
    charging: () => { showNavCharging.value = !showNavCharging.value },
    zones: () => { showNoGoZones.value = !showNoGoZones.value },
    waypoints: () => { showWaypointNodes.value = !showWaypointNodes.value }
  }
  toggleMap[layer]?.()
}

// ─── 地图控制 ───
function zoomIn() { scale.value = Math.min(scale.value * 1.2, 5); updateViewBox() }
function zoomOut() { scale.value = Math.max(scale.value / 1.2, 0.3); updateViewBox() }
function updateViewBox() {
  const w = mapWidth / scale.value; const h = mapHeight / scale.value
  viewBox.value = `${panX.value} ${panY.value} ${w} ${h}`
}
function resetView() { scale.value = 1; panX.value = 0; panY.value = 0; updateViewBox() }

function fitContent() {
  const currentNodes = nodes.value.filter(n => n.mapId === selectedMapId.value && n.position)
  if (currentNodes.length === 0) { resetView(); return }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  currentNodes.forEach(n => {
    if (n.position.x < minX) minX = n.position.x
    if (n.position.y < minY) minY = n.position.y
    if (n.position.x > maxX) maxX = n.position.x
    if (n.position.y > maxY) maxY = n.position.y
  })
  noGoZones.value.filter(z => z.mapId === selectedMapId.value).forEach(z => {
    z.polygonPoints.forEach(p => {
      if (p.x < minX) minX = p.x; if (p.y < minY) minY = p.y
      if (p.x > maxX) maxX = p.x; if (p.y > maxY) maxY = p.y
    })
  })
  const padding = 60
  minX = Math.max(0, minX - padding); minY = Math.max(0, minY - padding)
  maxX = Math.min(mapWidth, maxX + padding); maxY = Math.min(mapHeight, maxY + padding)
  const contentW = maxX - minX; const contentH = maxY - minY
  if (contentW <= 0 || contentH <= 0) { resetView(); return }
  const scaleX = mapWidth / contentW; const scaleY = mapHeight / contentH
  scale.value = Math.min(scaleX, scaleY, 2)
  panX.value = minX - (mapWidth / scale.value - contentW) / 2
  panY.value = minY - (mapHeight / scale.value - contentH) / 2
  updateViewBox()
}

function onMapChange() {
  selection.clearSelection()
  segmentDrawing.discardDraft()
  areaDrawing.discardDraft()
  simulationPath.value = null; simResult.value = null
  data.clearUndoRedo()
  setTimeout(() => fitContent(), 100)
}

function filterNodeOption(input: string, option: any) {
  const item = allNavNodes.value.find(n => n.id === option.value)
  return (item?.label || '').toLowerCase().includes(input.toLowerCase())
}

// ─── SVG 辅助 ───
function getNode(nodeId: string) { return nodes.value.find(n => n.id === nodeId) }
function getTempNodePos(nodeId: string) {
  const node = segmentDrawing.segmentDraft.value?.tempNodes.find(n => n.id === nodeId)
  return node?.position || { x: 0, y: 0 }
}
function getLastDraftNodePos() {
  if (!segmentDrawing.segmentDraft.value) return { x: 0, y: 0 }
  const ids = segmentDrawing.segmentDraft.value.nodeIds
  const lastId = ids[ids.length - 1]
  const node = segmentDrawing.segmentDraft.value.tempNodes.find(n => n.id === lastId) || nodes.value.find(n => n.id === lastId)
  return node?.position || { x: 0, y: 0 }
}
function getDraftAreaPoints() {
  if (!areaDrawing.areaDraft.value) return ''
  return [...areaDrawing.areaDraft.value.points, mousePos].map(p => `${p.x},${p.y}`).join(' ')
}
function getJunctionNodePos(j: any) {
  const node = nodes.value.find(n => n.id === j.nodeId)
  return node ? node.position : { x: 0, y: 0 }
}
function getNodeRadius(node: RoadNode) {
  if (node.nodeType === 'junction') return 8
  if (['inspection', 'parking', 'charging'].includes(node.nodeType)) return 7
  return 5
}
function getNodeColor(node: RoadNode) {
  if (selection.selectedEntity.value?.type === 'node' && selection.selectedEntity.value?.id === node.id) return '#1677ff'
  const map: Record<string, string> = { junction: '#faad14', inspection: '#1677ff', parking: '#52c41a', charging: '#7cb305' }
  return map[node.nodeType] || '#8c8c8c'
}
function getNodeStroke(node: RoadNode) {
  if (selection.selectedEntity.value?.type === 'node' && selection.selectedEntity.value?.id === node.id) return '#0958d9'
  return '#fff'
}
function nodeIcon(t: RoadNodeType) {
  const map: Record<string, string> = { junction: 'J', inspection: '巡', parking: '停', charging: '充' }
  return map[t] || ''
}

function getEdgeColor(edge: RoadEdge) {
  if (isPathEdge(edge.id)) return '#ff4d4f'
  // 颜色实时预览：如果正在编辑该路段且修改了颜色，使用编辑副本的颜色
  if (selection.selectedEntity.value?.type === 'segment' && selection.selectedEntity.value?.id === edge.segmentId && selection.editingSegment.value?.color && selection.propertyEditing.value) {
    return selection.editingSegment.value.color
  }
  const seg = edge.segmentId ? segments.value.find(s => s.id === edge.segmentId) : null
  return seg?.color || '#1677ff'
}

function hasReverseEdge(edge: RoadEdge): boolean {
  return edges.value.some(e => e.id !== edge.id && e.fromNodeId === edge.toNodeId && e.toNodeId === edge.fromNodeId)
}

function getEdgePath(edge: RoadEdge): string {
  const p1 = getNode(edge.fromNodeId)?.position || { x: 0, y: 0 }
  const p2 = getNode(edge.toNodeId)?.position || { x: 0, y: 0 }
  if (!hasReverseEdge(edge)) return `M${p1.x},${p1.y} L${p2.x},${p2.y}`
  const mx = (p1.x + p2.x) / 2; const my = (p1.y + p2.y) / 2
  const dx = p2.x - p1.x; const dy = p2.y - p1.y
  const len = Math.hypot(dx, dy) || 1
  const offset = Math.min(20, len * 0.25)
  const dir = edge.fromNodeId < edge.toNodeId ? 1 : -1
  return `M${p1.x},${p1.y} Q${mx + (-dy / len) * offset * dir},${my + (dx / len) * offset * dir} ${p2.x},${p2.y}`
}

function getEdgeSegment(edge: RoadEdge) {
  return edge.segmentId ? segments.value.find(s => s.id === edge.segmentId) : null
}

function isPathEdge(edgeId: string) {
  return simResult.value?.pathEdgeIds.includes(edgeId) || false
}

function calcPolygonCenter(zone: NoGoZone) {
  if (!zone.polygonPoints.length) return { x: 0, y: 0 }
  return { x: zone.polygonPoints.reduce((s, p) => s + p.x, 0) / zone.polygonPoints.length, y: zone.polygonPoints.reduce((s, p) => s + p.y, 0) / zone.polygonPoints.length }
}

function noGoZoneFill(zone: NoGoZone) {
  if (zone.zoneType !== 'forbidden') return '#52c41a'
  const map: Record<string, string> = { permanent: '#ff4d4f', temporary: '#faad14', high_risk: '#ff7a45', maintenance: '#1677ff' }
  return map[zone.level] || '#d9d9d9'
}
function noGoZoneStroke(zone: NoGoZone) {
  if (zone.zoneType !== 'forbidden') return '#389e0d'
  const map: Record<string, string> = { permanent: '#cf1322', temporary: '#d48806', high_risk: '#d4380d', maintenance: '#0958d9' }
  return map[zone.level] || '#8c8c8c'
}

function getZoneHighlightClass(zone: NoGoZone) {
  const s = selection
  if (s.isEntitySelected('nogozone', zone.id)) return 'entity-highlight'
  if (s.isEntityHovered('nogozone', zone.id)) return 'entity-hover'
  return ''
}

function navPointColor(t: NavigationPointType) {
  const map: Record<string, string> = { inspection: '#1677ff', parking: '#52c41a', charging: '#7cb305' }
  return map[t] || '#8c8c8c'
}
function navPointIcon(t: NavigationPointType) {
  const map: Record<string, string> = { inspection: '巡', parking: '停', charging: '充' }
  return map[t] || 'N'
}
function navPointTypeLabel(t: NavigationPointType) {
  const map: Record<string, string> = { inspection: '巡检点', parking: '停车点', charging: '充电点' }
  return map[t] || t
}

// ─── 路径模拟 ───
function runPathSimulation() {
  if (!simStartId.value || !simEndId.value) { message.warning('请选择起点和终点'); return }
  simResult.value = null; simulationPath.value = null
  const result = dijkstra(simStartId.value, simEndId.value, simAlgorithm.value)
  simResult.value = result
  if (result.found) {
    const segs: { x1: number; y1: number; x2: number; y2: number }[] = []
    for (let i = 0; i < result.pathNodeIds.length - 1; i++) {
      const p1 = getNode(result.pathNodeIds[i])?.position || { x: 0, y: 0 }
      const p2 = getNode(result.pathNodeIds[i + 1])?.position || { x: 0, y: 0 }
      segs.push({ x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y })
    }
    simulationPath.value = segs
    message.success(`路径找到: ${Math.round(result.totalDistance)}m`)

    // 检查路径是否经过 Z2 禁入区
    hazardPolicy.validatePathNoZ2(result.pathNodeIds, (id) => {
      const n = nodes.value.find(nn => nn.id === id)
      return n?.position || { x: 0, y: 0 }
    })
    if (hazardPolicy.hazardPolicyErrors.value.length > 0) {
      message.warning(hazardPolicy.hazardPolicyErrors.value[0])
    }
  } else {
    message.error('无法找到可达路径')
  }
}

function dijkstra(startId: string, endId: string, algorithm: PathAlgorithm): PathResult {
  const adjMap = new Map<string, { edgeId: string; neighborId: string; weight: number }[]>()
  mapEdges.value.forEach(edge => {
    const weight = calcEdgeWeight(edge, algorithm)
    if (weight === Infinity) return
    if (!adjMap.has(edge.fromNodeId)) adjMap.set(edge.fromNodeId, [])
    adjMap.get(edge.fromNodeId)!.push({ edgeId: edge.id, neighborId: edge.toNodeId, weight })
    if (edge.bidirectional) {
      if (!adjMap.has(edge.toNodeId)) adjMap.set(edge.toNodeId, [])
      adjMap.get(edge.toNodeId)!.push({ edgeId: edge.id, neighborId: edge.fromNodeId, weight })
    }
  })
  const dist = new Map<string, number>()
  const prev = new Map<string, { nodeId: string; edgeId: string }>()
  const visited = new Set<string>()
  const pq: { nodeId: string; dist: number }[] = [{ nodeId: startId, dist: 0 }]
  dist.set(startId, 0)
  while (pq.length > 0) {
    pq.sort((a, b) => a.dist - b.dist)
    const { nodeId: current } = pq.shift()!
    if (visited.has(current)) continue
    visited.add(current)
    if (current === endId) break
    const neighbors = adjMap.get(current) || []
    for (const { edgeId, neighborId, weight } of neighbors) {
      if (visited.has(neighborId)) continue
      const newDist = (dist.get(current) || 0) + weight
      if (newDist < (dist.get(neighborId) || Infinity)) {
        dist.set(neighborId, newDist)
        prev.set(neighborId, { nodeId: current, edgeId })
        pq.push({ nodeId: neighborId, dist: newDist })
      }
    }
  }
  if (!prev.has(endId) && startId !== endId) {
    return { found: false, pathNodeIds: [], pathEdgeIds: [], totalDistance: 0, estimatedTime: 0, algorithm }
  }
  const pathNodeIds: string[] = []; const pathEdgeIds: string[] = []
  let cursor: string | undefined = endId
  while (cursor) {
    pathNodeIds.unshift(cursor)
    const p = prev.get(cursor)
    if (p) { pathEdgeIds.unshift(p.edgeId); cursor = p.nodeId } else break
  }
  const totalDistance = dist.get(endId) || 0
  let estimatedTime = 0
  for (const eid of pathEdgeIds) {
    const edge = edges.value.find(e => e.id === eid)
    if (edge) estimatedTime += (edge.distance / 1000) / (edge.speedLimit || 30) * 3600
  }
  return { found: true, pathNodeIds, pathEdgeIds, totalDistance, estimatedTime, algorithm }
}

function calcEdgeWeight(edge: RoadEdge, algorithm: PathAlgorithm): number {
  for (const zone of mapNoGoZones.value) {
    if (zone.zoneType === 'forbidden' && (zone.level === 'permanent' || zone.level === 'high_risk')) {
      const p1 = getNode(edge.fromNodeId)?.position || { x: 0, y: 0 }
      const p2 = getNode(edge.toNodeId)?.position || { x: 0, y: 0 }
      if (lineIntersectsPolygon(p1, p2, zone.polygonPoints)) return Infinity
    }
  }
  switch (algorithm) {
    case 'shortest': return edge.distance
    case 'fastest': return edge.distance / (edge.speedLimit || 30)
    case 'safest': return edge.distance * (edge.width < 2 ? 3 : edge.width < 3 ? 1.5 : 1) * (edge.speedLimit > 20 ? 1.5 : 1)
    default: return edge.distance
  }
}

function lineIntersectsPolygon(p1: { x: number; y: number }, p2: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean {
  const mx = (p1.x + p2.x) / 2; const my = (p1.y + p2.y) / 2
  let inside = false
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y, xj = polygon[j].x, yj = polygon[j].y
    if ((yi > my) !== (yj > my) && mx < (xj - xi) * (my - yi) / (yj - yi) + xi) inside = !inside
  }
  return inside
}

// ─── 拓扑检查 ───
function runTopologyCheck() {
  if (!selectedMapId.value) { message.warning('请先选择地图'); return }
  checkingTopology.value = true
  setTimeout(() => {
    const issues: TopologyIssue[] = []
    mapNodes.value.forEach(n => {
      if (n.edgeIds.length === 0) {
        issues.push({ id: `iso-node-${n.id}`, type: 'isolated_node', severity: 'warning', message: `节点 ${n.name || n.id} 未连接任何边`, relatedEntityId: n.id, relatedEntityType: 'node' })
      }
    })
    const navNodeIds = new Set(mapNavPoints.value.map(p => p.nodeId))
    mapNodes.value.forEach(n => {
      if (n.edgeIds.length === 1 && !navNodeIds.has(n.id)) {
        issues.push({ id: `dead-${n.id}`, type: 'dead_end', severity: 'info', message: `节点 ${n.name || n.id} 是死胡同`, relatedEntityId: n.id, relatedEntityType: 'node' })
      }
    })
    const visited = new Set<string>(); const components: string[][] = []
    mapNodes.value.forEach(n => {
      if (visited.has(n.id)) return
      const component: string[] = []; const queue = [n.id]; visited.add(n.id)
      while (queue.length > 0) {
        const current = queue.shift()!; component.push(current)
        const node = nodes.value.find(nn => nn.id === current)
        if (node) {
          node.edgeIds.forEach(eid => {
            const edge = edges.value.find(e => e.id === eid)
            if (edge) {
              const neighborId = edge.fromNodeId === current ? edge.toNodeId : edge.fromNodeId
              if (!visited.has(neighborId) && mapNodes.value.some(nn => nn.id === neighborId)) { visited.add(neighborId); queue.push(neighborId) }
            }
          })
        }
      }
      components.push(component)
    })
    if (components.length > 1) {
      issues.push({ id: 'disconnected', type: 'disconnected_component', severity: 'critical', message: `路网存在 ${components.length} 个不连通的子图`, relatedEntityType: 'node' })
    }
    const edgeKeySet = new Set<string>()
    mapEdges.value.forEach(e => {
      const key = [e.fromNodeId, e.toNodeId].sort().join('-')
      if (edgeKeySet.has(key)) {
        issues.push({ id: `overlap-${e.id}`, type: 'overlapping_edge', severity: 'warning', message: `边 ${e.id} 与其他边重叠`, relatedEntityId: e.id, relatedEntityType: 'edge' })
      }
      edgeKeySet.add(key)
    })
    const critical = issues.filter(i => i.severity === 'critical').length
    const warning = issues.filter(i => i.severity === 'warning').length
    const info = issues.filter(i => i.severity === 'info').length
    lastTopologyCheck.value = {
      id: `topo-${Date.now()}`, mapId: selectedMapId.value, checkTime: new Date(),
      issues, totalCritical: critical, totalWarning: warning, totalInfo: info
    }
    MockService.saveTopologyCheck(lastTopologyCheck.value)
    checkingTopology.value = false
    topologyVisible.value = true
    if (critical > 0) message.error(`发现 ${critical} 个严重问题`)
    else if (warning > 0) message.warning(`发现 ${warning} 个警告`)
    else message.success('拓扑检查通过')
  }, 500)
}

// ─── 初始化 ───
function onWindowMouseUp() {
  if (isPanning.value) {
    isPanning.value = false
    mouseMovedDuringDrag.value = false
  }
}

function beforeUnloadHandler(e: BeforeUnloadEvent) {
  if (hasUnsavedChanges.value) { e.preventDefault(); e.returnValue = '' }
}

onMounted(() => {
  inspectionStore.initialize()
  data.loadData()

  const queryMapId = typeof route.query.mapId === 'string' ? route.query.mapId : ''
  if (queryMapId && inspectionStore.inspectionMaps.some(m => m.id === queryMapId)) {
    selectedMapId.value = queryMapId
  } else if (!selectedMapId.value && inspectionStore.inspectionMaps.length > 0) {
    selectedMapId.value = inspectionStore.inspectionMaps[0].id
  }
  setTimeout(() => fitContent(), 200)
  window.addEventListener('beforeunload', beforeUnloadHandler)
  window.addEventListener('mouseup', onWindowMouseUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnloadHandler)
  window.removeEventListener('mouseup', onWindowMouseUp)
})
</script>

<style scoped lang="scss">
.road-network {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f7fa;
}

.rn-layer-bar {
  display: flex;
  justify-content: flex-end;
  padding: 4px 12px;
  background: #fafafa;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}

.rn-body { display: flex; flex: 1; min-height: 0; overflow: hidden; }

.rn-status-overlay {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 20;
}

.draw-hint {
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(22, 119, 255, 0.9);
  color: #fff;
  padding: 4px 16px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 30;
}
.draw-hint.placement-hint {
  background: rgba(82, 196, 26, 0.9) !important;
}

.clickable { cursor: pointer; }
.clickable:hover { filter: brightness(1.1); }
.edge-highlight { stroke: #ff4d4f !important; stroke-width: 4 !important; }
.node-selected { filter: drop-shadow(0 0 4px rgba(22, 119, 255, 0.6)); }
.entity-highlight { filter: drop-shadow(0 0 4px rgba(22, 119, 255, 0.6)); stroke-width: 2.5 !important; }
.entity-hover { animation: entity-hover-pulse 0.8s ease-in-out infinite; stroke-width: 3 !important; }
@keyframes entity-hover-pulse {
  0%, 100% { opacity: 1; filter: drop-shadow(0 0 2px rgba(22, 119, 255, 0.4)); }
  50% { opacity: 0.6; filter: drop-shadow(0 0 8px rgba(22, 119, 255, 0.8)); }
}
.entity-dimmed { opacity: 0.2; transition: opacity 0.2s; }
.entity-dimmed text { opacity: 0.2; }
.node-label { font-size: 10px; fill: #333; pointer-events: none; font-weight: 500; }
.edge-label { font-size: 9px; fill: #666; pointer-events: none; }
.zone-label { font-size: 11px; fill: #333; pointer-events: none; font-weight: 600; }
.junction-icon { font-size: 11px; fill: #fff; pointer-events: none; font-weight: 700; }
.nav-icon { font-size: 9px; fill: #fff; pointer-events: none; font-weight: 700; }
.close-pulse { animation: close-pulse 0.6s ease-in-out infinite; }
@keyframes close-pulse {
  0%, 100% { r: 6; opacity: 1; }
  50% { r: 10; opacity: 0.5; }
}

.save-btn-unsaved { animation: save-btn-pulse 1.5s ease-in-out infinite; }
@keyframes save-btn-pulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(22, 119, 255, 0.4); }
  50% { box-shadow: 0 0 0 4px rgba(22, 119, 255, 0.2); }
}
</style>
