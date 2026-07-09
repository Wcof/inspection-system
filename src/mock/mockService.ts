import { storage, STORAGE_KEYS } from '@/utils/storage'
import {
  initialRobots,
  initialInspectionPoints,
  initialTasks,
  initialInspectionMaps,
  initialWaypoints,
  initialWaypointEdges,
  initialInspectionRoutes,
  initialInspectionDevices,
  initialInstallations,
  initialFacilityComponents,
  initialInspectionDeviceCheckItems,
  initialInspectionPlans,
  initialStandardComponents,
  initialRoadNodes,
  initialRoadEdges,
  initialRoadSegments,
  initialJunctions,
  initialNavigationPoints,
  initialNoGoZones
} from './initialData'
import { Robot, InspectionPoint, MonitorPoint, Metric, InspectionTask, InspectionPath } from '@/types'
import type {
  InspectionMap,
  WaypointEdge,
  InspectionRoute,
  InspectionDevice,
  InspectionDeviceCheckItem,
  InspectionTaskSnapshot,
  InspectionTaskResult,
  InspectionPlan,
  StandardComponent
  ,
  Installation,
  FacilityComponent
} from '@/types/inspection'
import type {
  RoadNode, RoadEdge, RoadSegment, Junction, NavigationPoint,
  NoGoZone, Geofence, RoadNetworkVersion, TopologyCheckResult
} from '@/types/road-network'
import { migrateToV2 } from './migrations'

export class MockService {
  // 初始化数据
  static initializeData(): void {
    if (!storage.get(STORAGE_KEYS.ROBOTS)) {
      storage.set(STORAGE_KEYS.ROBOTS, initialRobots)
    }
    if (!storage.get(STORAGE_KEYS.INSPECTION_POINTS)) {
      storage.set(STORAGE_KEYS.INSPECTION_POINTS, initialInspectionPoints)
    }
    if (!storage.get(STORAGE_KEYS.TASKS)) {
      storage.set(STORAGE_KEYS.TASKS, initialTasks)
    }
    
    if (!storage.get(STORAGE_KEYS.INSPECTION_MAPS)) {
      storage.set(STORAGE_KEYS.INSPECTION_MAPS, initialInspectionMaps)
    }
    if (!storage.get(STORAGE_KEYS.WAYPOINTS)) {
      storage.set(STORAGE_KEYS.WAYPOINTS, initialWaypoints)
    }
    if (!storage.get(STORAGE_KEYS.WAYPOINT_EDGES)) {
      storage.set(STORAGE_KEYS.WAYPOINT_EDGES, initialWaypointEdges)
    }
    if (!storage.get(STORAGE_KEYS.INSPECTION_ROUTES)) {
      storage.set(STORAGE_KEYS.INSPECTION_ROUTES, initialInspectionRoutes)
    }
    if (!storage.get(STORAGE_KEYS.INSPECTION_DEVICES)) {
      storage.set(STORAGE_KEYS.INSPECTION_DEVICES, initialInspectionDevices)
    }
    if (!storage.get(STORAGE_KEYS.INSTALLATIONS)) {
      storage.set(STORAGE_KEYS.INSTALLATIONS, initialInstallations)
    }
    if (!storage.get(STORAGE_KEYS.FACILITY_COMPONENTS)) {
      storage.set(STORAGE_KEYS.FACILITY_COMPONENTS, initialFacilityComponents)
    }
    if (!storage.get(STORAGE_KEYS.INSPECTION_DEVICE_CHECK_ITEMS)) {
      storage.set(STORAGE_KEYS.INSPECTION_DEVICE_CHECK_ITEMS, initialInspectionDeviceCheckItems)
    }
    if (!storage.get(STORAGE_KEYS.PLANS)) {
      storage.set(STORAGE_KEYS.PLANS, initialInspectionPlans)
    }
    if (!storage.get(STORAGE_KEYS.STANDARD_COMPONENTS)) {
      storage.set(STORAGE_KEYS.STANDARD_COMPONENTS, initialStandardComponents)
    }
    if (!storage.get(STORAGE_KEYS.ROAD_NODES)) {
      storage.set(STORAGE_KEYS.ROAD_NODES, initialRoadNodes)
    }
    if (!storage.get(STORAGE_KEYS.ROAD_EDGES)) {
      storage.set(STORAGE_KEYS.ROAD_EDGES, initialRoadEdges)
    }
    if (!storage.get(STORAGE_KEYS.ROAD_SEGMENTS)) {
      storage.set(STORAGE_KEYS.ROAD_SEGMENTS, initialRoadSegments)
    }
    if (!storage.get(STORAGE_KEYS.JUNCTIONS)) {
      storage.set(STORAGE_KEYS.JUNCTIONS, initialJunctions)
    }
    if (!storage.get(STORAGE_KEYS.NAV_POINTS)) {
      storage.set(STORAGE_KEYS.NAV_POINTS, initialNavigationPoints)
    }
    if (!storage.get(STORAGE_KEYS.NO_GO_ZONES)) {
      storage.set(STORAGE_KEYS.NO_GO_ZONES, initialNoGoZones)
    }

    migrateToV2()
  }
  
  // 机器人相关
  static getRobots(): Robot[] {
    return storage.get<Robot[]>(STORAGE_KEYS.ROBOTS) || []
  }
  
  static getRobotById(id: string): Robot | undefined {
    const robots = this.getRobots()
    return robots.find(r => r.id === id)
  }
  
  static saveRobot(robot: Robot): void {
    const robots = this.getRobots()
    const index = robots.findIndex(r => r.id === robot.id)
    if (index >= 0) {
      robots[index] = robot
    } else {
      robots.push(robot)
    }
    storage.set(STORAGE_KEYS.ROBOTS, robots)
  }
  
  static deleteRobot(id: string): void {
    const robots = this.getRobots().filter(r => r.id !== id)
    storage.set(STORAGE_KEYS.ROBOTS, robots)
  }
  
  // 巡检点相关
  static getInspectionPoints(): InspectionPoint[] {
    return storage.get<InspectionPoint[]>(STORAGE_KEYS.INSPECTION_POINTS) || []
  }
  
  static getInspectionPointById(id: string): InspectionPoint | undefined {
    const points = this.getInspectionPoints()
    return points.find(p => p.id === id)
  }
  
  static saveInspectionPoint(point: InspectionPoint): void {
    const points = this.getInspectionPoints()
    const index = points.findIndex(p => p.id === point.id)
    if (index >= 0) {
      points[index] = point
    } else {
      points.push(point)
    }
    storage.set(STORAGE_KEYS.INSPECTION_POINTS, points)
  }
  
  static deleteInspectionPoint(id: string): void {
    const points = this.getInspectionPoints().filter(p => p.id !== id)
    storage.set(STORAGE_KEYS.INSPECTION_POINTS, points)
  }
  
  // 监测点相关
  static getMonitorPoints(): MonitorPoint[] {
    return storage.get<MonitorPoint[]>(STORAGE_KEYS.MONITOR_POINTS) || []
  }
  
  static getMonitorPointsByInspectionPointId(inspectionPointId: string): MonitorPoint[] {
    return this.getMonitorPoints().filter(mp => mp.inspectionPointId === inspectionPointId)
  }
  
  static saveMonitorPoint(monitorPoint: MonitorPoint): void {
    const monitorPoints = this.getMonitorPoints()
    const index = monitorPoints.findIndex(mp => mp.id === monitorPoint.id)
    if (index >= 0) {
      monitorPoints[index] = monitorPoint
    } else {
      monitorPoints.push(monitorPoint)
    }
    storage.set(STORAGE_KEYS.MONITOR_POINTS, monitorPoints)
  }
  
  static deleteMonitorPoint(id: string): void {
    const monitorPoints = this.getMonitorPoints().filter(mp => mp.id !== id)
    storage.set(STORAGE_KEYS.MONITOR_POINTS, monitorPoints)
  }
  
  // 监测指标相关
  static getMetrics(): Metric[] {
    return storage.get<Metric[]>(STORAGE_KEYS.METRICS) || []
  }
  
  static getMetricsByMonitorPointId(monitorPointId: string): Metric[] {
    return this.getMetrics().filter(m => m.monitorPointId === monitorPointId)
  }
  
  static saveMetric(metric: Metric): void {
    const metrics = this.getMetrics()
    const index = metrics.findIndex(m => m.id === metric.id)
    if (index >= 0) {
      metrics[index] = metric
    } else {
      metrics.push(metric)
    }
    storage.set(STORAGE_KEYS.METRICS, metrics)
  }
  
  static deleteMetric(id: string): void {
    const metrics = this.getMetrics().filter(m => m.id !== id)
    storage.set(STORAGE_KEYS.METRICS, metrics)
  }
  
  // 任务相关
  static getTasks(): InspectionTask[] {
    return storage.get<InspectionTask[]>(STORAGE_KEYS.TASKS) || []
  }
  
  static getTaskById(id: string): InspectionTask | undefined {
    const tasks = this.getTasks()
    return tasks.find(t => t.id === id)
  }
  
  static saveTask(task: InspectionTask): void {
    const tasks = this.getTasks()
    const index = tasks.findIndex(t => t.id === task.id)
    if (index >= 0) {
      tasks[index] = task
    } else {
      tasks.push(task)
    }
    storage.set(STORAGE_KEYS.TASKS, tasks)
  }
  
  static deleteTask(id: string): void {
    const tasks = this.getTasks().filter(t => t.id !== id)
    storage.set(STORAGE_KEYS.TASKS, tasks)
  }
  
  // 路径相关
  static getPaths(): InspectionPath[] {
    return storage.get<InspectionPath[]>(STORAGE_KEYS.PATHS) || []
  }
  
  static getPathByTaskId(taskId: string): InspectionPath | undefined {
    const paths = this.getPaths()
    return paths.find(p => p.taskId === taskId)
  }
  
  static savePath(path: InspectionPath): void {
    const paths = this.getPaths()
    const index = paths.findIndex(p => p.id === path.id)
    if (index >= 0) {
      paths[index] = path
    } else {
      paths.push(path)
    }
    storage.set(STORAGE_KEYS.PATHS, paths)
  }
  
  static deletePath(id: string): void {
    const paths = this.getPaths().filter(p => p.id !== id)
    storage.set(STORAGE_KEYS.PATHS, paths)
  }
  
  // 巡检地图相关
  static getInspectionMaps(): InspectionMap[] {
    return storage.get<InspectionMap[]>(STORAGE_KEYS.INSPECTION_MAPS) || []
  }
  
  static getInspectionMapById(id: string): InspectionMap | undefined {
    const maps = this.getInspectionMaps()
    return maps.find(m => m.id === id)
  }
  
  static saveInspectionMap(map: InspectionMap): void {
    const maps = this.getInspectionMaps()
    const index = maps.findIndex(m => m.id === map.id)
    if (index >= 0) {
      maps[index] = map
    } else {
      maps.push(map)
    }
    storage.set(STORAGE_KEYS.INSPECTION_MAPS, maps)
  }
  
  static deleteInspectionMap(id: string): void {
    const maps = this.getInspectionMaps().filter(m => m.id !== id)
    storage.set(STORAGE_KEYS.INSPECTION_MAPS, maps)
  }
  
  // 途径点相关 (已废弃，使用导航点替代)
  /** @deprecated 使用 getNavigationPoints 替代 */
  static getWaypoints(): NavigationPoint[] {
    return this.getNavigationPoints()
  }
  
  /** @deprecated 使用 getNavigationPointsByMapId 替代 */
  static getWaypointsByMapId(mapId: string): NavigationPoint[] {
    return this.getNavigationPointsByMapId(mapId)
  }
  
  /** @deprecated 使用 getNavigationPointById 替代（注意方法名变化） */
  static getWaypointById(id: string): NavigationPoint | undefined {
    return this.getNavigationPoints().find(p => p.id === id)
  }
  
  /** @deprecated 使用 saveNavigationPoint 替代 */
  static saveWaypoint(point: NavigationPoint): void {
    this.saveNavigationPoint(point)
  }
  
  /** @deprecated 使用 deleteNavigationPoint 替代 */
  static deleteWaypoint(id: string): void {
    this.deleteNavigationPoint(id)
  }
  
  // 途径点连线相关
  static getWaypointEdges(): WaypointEdge[] {
    return storage.get<WaypointEdge[]>(STORAGE_KEYS.WAYPOINT_EDGES) || []
  }
  
  static getWaypointEdgesByMapId(mapId: string): WaypointEdge[] {
    const waypoints = this.getWaypointsByMapId(mapId)
    const waypointIds = waypoints.map(w => w.id)
    return this.getWaypointEdges().filter(e => 
      waypointIds.includes(e.fromWaypointId) && waypointIds.includes(e.toWaypointId)
    )
  }
  
  static saveWaypointEdge(edge: WaypointEdge): void {
    const edges = this.getWaypointEdges()
    const index = edges.findIndex(e => e.id === edge.id)
    if (index >= 0) {
      edges[index] = edge
    } else {
      edges.push(edge)
    }
    storage.set(STORAGE_KEYS.WAYPOINT_EDGES, edges)
  }
  
  static deleteWaypointEdge(id: string): void {
    const edges = this.getWaypointEdges().filter(e => e.id !== id)
    storage.set(STORAGE_KEYS.WAYPOINT_EDGES, edges)
  }
  
  // 巡检路线相关
  static getInspectionRoutes(): InspectionRoute[] {
    return storage.get<InspectionRoute[]>(STORAGE_KEYS.INSPECTION_ROUTES) || []
  }
  
  static getInspectionRouteById(id: string): InspectionRoute | undefined {
    const routes = this.getInspectionRoutes()
    return routes.find(r => r.id === id)
  }
  
  static saveInspectionRoute(route: InspectionRoute): void {
    const routes = this.getInspectionRoutes()
    const index = routes.findIndex(r => r.id === route.id)
    if (index >= 0) {
      routes[index] = route
    } else {
      routes.push(route)
    }
    storage.set(STORAGE_KEYS.INSPECTION_ROUTES, routes)
  }
  
  static deleteInspectionRoute(id: string): void {
    const routes = this.getInspectionRoutes().filter(r => r.id !== id)
    storage.set(STORAGE_KEYS.INSPECTION_ROUTES, routes)
  }
  
  // 巡检设备相关
  static getInspectionDevices(): InspectionDevice[] {
    return storage.get<InspectionDevice[]>(STORAGE_KEYS.INSPECTION_DEVICES) || []
  }
  
  static getInspectionDevicesByInspectionPointId(inspectionPointId: string): InspectionDevice[] {
    return this.getInspectionDevices().filter(d => d.inspectionPointId === inspectionPointId)
  }
  
  static getInspectionDeviceById(id: string): InspectionDevice | undefined {
    const devices = this.getInspectionDevices()
    return devices.find(d => d.id === id)
  }
  
  static saveInspectionDevice(device: InspectionDevice): void {
    const devices = this.getInspectionDevices()
    const index = devices.findIndex(d => d.id === device.id)
    if (index >= 0) {
      devices[index] = device
    } else {
      devices.push(device)
    }
    storage.set(STORAGE_KEYS.INSPECTION_DEVICES, devices)
  }
  
  static deleteInspectionDevice(id: string): void {
    const devices = this.getInspectionDevices().filter(d => d.id !== id)
    storage.set(STORAGE_KEYS.INSPECTION_DEVICES, devices)
  }

  static getInstallations(): Installation[] {
    return storage.get<Installation[]>(STORAGE_KEYS.INSTALLATIONS) || []
  }

  static saveInstallation(installation: Installation): void {
    const installations = this.getInstallations()
    const index = installations.findIndex(item => item.id === installation.id)
    if (index >= 0) installations[index] = installation
    else installations.push(installation)
    storage.set(STORAGE_KEYS.INSTALLATIONS, installations)
  }

  static deleteInstallation(id: string): void {
    const installations = this.getInstallations().filter(item => item.id !== id)
    storage.set(STORAGE_KEYS.INSTALLATIONS, installations)
  }

  static getFacilityComponents(): FacilityComponent[] {
    return storage.get<FacilityComponent[]>(STORAGE_KEYS.FACILITY_COMPONENTS) || []
  }

  static getFacilityComponentsByFacilityId(facilityId: string): FacilityComponent[] {
    return this.getFacilityComponents().filter(item => item.facilityId === facilityId)
  }

  static getFacilityComponentsByInstallationId(installationId: string): FacilityComponent[] {
    return this.getFacilityComponents().filter(item => item.installationId === installationId)
  }

  static saveFacilityComponent(component: FacilityComponent): void {
    const components = this.getFacilityComponents()
    const index = components.findIndex(item => item.id === component.id)
    if (index >= 0) components[index] = component
    else components.push(component)
    storage.set(STORAGE_KEYS.FACILITY_COMPONENTS, components)
  }

  static deleteFacilityComponent(id: string): void {
    const components = this.getFacilityComponents().filter(item => item.id !== id)
    storage.set(STORAGE_KEYS.FACILITY_COMPONENTS, components)
  }
  
  // 设备检测项相关
  static getInspectionDeviceCheckItems(): InspectionDeviceCheckItem[] {
    return storage.get<InspectionDeviceCheckItem[]>(STORAGE_KEYS.INSPECTION_DEVICE_CHECK_ITEMS) || []
  }
  
  static getInspectionDeviceCheckItemsByDeviceId(deviceId: string): InspectionDeviceCheckItem[] {
    return this.getInspectionDeviceCheckItems().filter(c => c.deviceId === deviceId)
  }
  
  static saveInspectionDeviceCheckItem(item: InspectionDeviceCheckItem): void {
    const items = this.getInspectionDeviceCheckItems()
    const index = items.findIndex(i => i.id === item.id)
    if (index >= 0) {
      items[index] = item
    } else {
      items.push(item)
    }
    storage.set(STORAGE_KEYS.INSPECTION_DEVICE_CHECK_ITEMS, items)
  }
  
  static deleteInspectionDeviceCheckItem(id: string): void {
    const items = this.getInspectionDeviceCheckItems().filter(i => i.id !== id)
    storage.set(STORAGE_KEYS.INSPECTION_DEVICE_CHECK_ITEMS, items)
  }

  // 标准巡检对象库
  static getStandardComponents(): StandardComponent[] {
    return storage.get<StandardComponent[]>(STORAGE_KEYS.STANDARD_COMPONENTS) || []
  }

  static saveStandardComponent(component: StandardComponent): void {
    const components = this.getStandardComponents()
    const index = components.findIndex(item => item.id === component.id)
    if (index >= 0) {
      components[index] = component
    } else {
      components.push(component)
    }
    storage.set(STORAGE_KEYS.STANDARD_COMPONENTS, components)
  }

  static deleteStandardComponent(id: string): void {
    const components = this.getStandardComponents().filter(item => item.id !== id)
    storage.set(STORAGE_KEYS.STANDARD_COMPONENTS, components)
  }
  
  // 任务快照相关
  static getInspectionTaskSnapshots(): InspectionTaskSnapshot[] {
    return storage.get<InspectionTaskSnapshot[]>(STORAGE_KEYS.INSPECTION_TASK_SNAPSHOTS) || []
  }
  
  static getInspectionTaskSnapshotByTaskId(taskId: string): InspectionTaskSnapshot | undefined {
    const snapshots = this.getInspectionTaskSnapshots()
    return snapshots.find(s => s.taskId === taskId)
  }
  
  static saveInspectionTaskSnapshot(snapshot: InspectionTaskSnapshot): void {
    const snapshots = this.getInspectionTaskSnapshots()
    const index = snapshots.findIndex(s => s.id === snapshot.id)
    if (index >= 0) {
      snapshots[index] = snapshot
    } else {
      snapshots.push(snapshot)
    }
    storage.set(STORAGE_KEYS.INSPECTION_TASK_SNAPSHOTS, snapshots)
  }
  
  // 任务结果相关
  static getInspectionTaskResults(): InspectionTaskResult[] {
    return storage.get<InspectionTaskResult[]>(STORAGE_KEYS.INSPECTION_TASK_RESULTS) || []
  }
  
  static getInspectionTaskResultsByTaskId(taskId: string): InspectionTaskResult[] {
    return this.getInspectionTaskResults().filter(r => r.taskId === taskId)
  }
  
  static saveInspectionTaskResult(result: InspectionTaskResult): void {
    const results = this.getInspectionTaskResults()
    const index = results.findIndex(r => r.id === result.id)
    if (index >= 0) {
      results[index] = result
    } else {
      results.push(result)
    }
    storage.set(STORAGE_KEYS.INSPECTION_TASK_RESULTS, results)
  }

  // 巡检计划相关
  static getInspectionPlans(): InspectionPlan[] {
    return storage.get<InspectionPlan[]>(STORAGE_KEYS.PLANS) || []
  }

  static getInspectionPlanById(id: string): InspectionPlan | undefined {
    const plans = this.getInspectionPlans()
    return plans.find(p => p.id === id)
  }

  static saveInspectionPlan(plan: InspectionPlan): void {
    const plans = this.getInspectionPlans()
    const index = plans.findIndex(p => p.id === plan.id)
    if (index >= 0) {
      plans[index] = plan
    } else {
      plans.push(plan)
    }
    storage.set(STORAGE_KEYS.PLANS, plans)
  }

  static deleteInspectionPlan(id: string): void {
    const plans = this.getInspectionPlans().filter(p => p.id !== id)
    storage.set(STORAGE_KEYS.PLANS, plans)
  }

  // ═══════════════════════════════════════
  // 路网管理 — 统一拓扑模型
  // ═══════════════════════════════════════

  // ── 节点 ──
  static getRoadNodes(): RoadNode[] {
    return storage.get<RoadNode[]>(STORAGE_KEYS.ROAD_NODES) || []
  }

  static getRoadNodesByMapId(mapId: string): RoadNode[] {
    return this.getRoadNodes().filter(n => n.mapId === mapId)
  }

  static saveRoadNode(node: RoadNode): void {
    const nodes = this.getRoadNodes()
    const index = nodes.findIndex(n => n.id === node.id)
    if (index >= 0) nodes[index] = node
    else nodes.push(node)
    storage.set(STORAGE_KEYS.ROAD_NODES, nodes)
  }

  /** 删除节点并级联清理关联边和引用 */
  static deleteRoadNode(id: string): void {
    // 1. 删除所有关联边
    const edges = this.getRoadEdges().filter(e => e.fromNodeId === id || e.toNodeId === id)
    edges.forEach(e => this.deleteRoadEdge(e.id))
    // 2. 从所有节点的 edgeIds 中移除关联边 ID（已由 deleteRoadEdge 处理）
    // 3. 删除节点
    const nodes = this.getRoadNodes().filter(n => n.id !== id)
    storage.set(STORAGE_KEYS.ROAD_NODES, nodes)
  }

  // ── 边 ──
  static getRoadEdges(): RoadEdge[] {
    return storage.get<RoadEdge[]>(STORAGE_KEYS.ROAD_EDGES) || []
  }

  static getRoadEdgesByMapId(mapId: string): RoadEdge[] {
    return this.getRoadEdges().filter(e => e.mapId === mapId)
  }

  static saveRoadEdge(edge: RoadEdge): void {
    const edges = this.getRoadEdges()
    const index = edges.findIndex(e => e.id === edge.id)
    if (index >= 0) edges[index] = edge
    else edges.push(edge)
    storage.set(STORAGE_KEYS.ROAD_EDGES, edges)
  }

  /** 删除边并清理节点的 edgeIds 引用 */
  static deleteRoadEdge(id: string): void {
    const edge = this.getRoadEdges().find(e => e.id === id)
    if (edge) {
      // 清理 fromNode 的 edgeIds
      const fromNode = this.getRoadNodes().find(n => n.id === edge.fromNodeId)
      if (fromNode) {
        fromNode.edgeIds = fromNode.edgeIds.filter(eid => eid !== id)
        this.saveRoadNode(fromNode)
      }
      // 清理 toNode 的 edgeIds
      const toNode = this.getRoadNodes().find(n => n.id === edge.toNodeId)
      if (toNode) {
        toNode.edgeIds = toNode.edgeIds.filter(eid => eid !== id)
        this.saveRoadNode(toNode)
      }
    }
    const edges = this.getRoadEdges().filter(e => e.id !== id)
    storage.set(STORAGE_KEYS.ROAD_EDGES, edges)
  }

  // ── 路段（边的聚合） ──
  static getRoadSegments(): RoadSegment[] {
    return storage.get<RoadSegment[]>(STORAGE_KEYS.ROAD_SEGMENTS) || []
  }

  static getRoadSegmentsByMapId(mapId: string): RoadSegment[] {
    return this.getRoadSegments().filter(s => s.mapId === mapId)
  }

  static saveRoadSegment(segment: RoadSegment): void {
    const segments = this.getRoadSegments()
    const index = segments.findIndex(s => s.id === segment.id)
    if (index >= 0) segments[index] = segment
    else segments.push(segment)
    storage.set(STORAGE_KEYS.ROAD_SEGMENTS, segments)
  }

  /** 删除路段并级联删除关联边和节点 */
  static deleteRoadSegment(id: string): void {
    const segment = this.getRoadSegments().find(s => s.id === id)
    if (segment) {
      // 删除关联边（会自动清理节点的 edgeIds）
      segment.edgeIds.forEach(eid => this.deleteRoadEdge(eid))
      // 删除孤立节点（edgeIds 为空的节点）
      segment.nodeIds.forEach(nid => {
        const node = this.getRoadNodes().find(n => n.id === nid)
        if (node && node.edgeIds.length === 0) {
          const nodes = this.getRoadNodes().filter(n => n.id !== nid)
          storage.set(STORAGE_KEYS.ROAD_NODES, nodes)
        }
      })
    }
    const segments = this.getRoadSegments().filter(s => s.id !== id)
    storage.set(STORAGE_KEYS.ROAD_SEGMENTS, segments)
  }

  // ── 路口 ──
  static getJunctions(): Junction[] {
    return storage.get<Junction[]>(STORAGE_KEYS.JUNCTIONS) || []
  }

  static getJunctionsByMapId(mapId: string): Junction[] {
    return this.getJunctions().filter(j => j.mapId === mapId)
  }

  static saveJunction(junction: Junction): void {
    const junctions = this.getJunctions()
    const index = junctions.findIndex(j => j.id === junction.id)
    if (index >= 0) junctions[index] = junction
    else junctions.push(junction)
    storage.set(STORAGE_KEYS.JUNCTIONS, junctions)
  }

  static deleteJunction(id: string): void {
    const junctions = this.getJunctions().filter(j => j.id !== id)
    storage.set(STORAGE_KEYS.JUNCTIONS, junctions)
  }

  // ── 导航点 ──
  static getNavigationPoints(): NavigationPoint[] {
    return storage.get<NavigationPoint[]>(STORAGE_KEYS.NAV_POINTS) || []
  }

  static getNavigationPointsByMapId(mapId: string): NavigationPoint[] {
    return this.getNavigationPoints().filter(p => p.mapId === mapId)
  }

  static saveNavigationPoint(point: NavigationPoint): void {
    const points = this.getNavigationPoints()
    const index = points.findIndex(p => p.id === point.id)
    if (index >= 0) points[index] = point
    else points.push(point)
    storage.set(STORAGE_KEYS.NAV_POINTS, points)
  }

  static deleteNavigationPoint(id: string): void {
    const points = this.getNavigationPoints().filter(p => p.id !== id)
    storage.set(STORAGE_KEYS.NAV_POINTS, points)
  }

  /** @deprecated 使用 getNavigationPoints 替代 */
  static getNavPoints = MockService.getNavigationPoints
  /** @deprecated 使用 saveNavigationPoint 替代 */
  static saveNavPoint = MockService.saveNavigationPoint
  /** @deprecated 使用 deleteNavigationPoint 替代 */
  static deleteNavPoint = MockService.deleteNavigationPoint

  // ── 绘制区域 ──
  static getNoGoZones(): NoGoZone[] {
    return storage.get<NoGoZone[]>(STORAGE_KEYS.NO_GO_ZONES) || []
  }

  static getNoGoZonesByMapId(mapId: string): NoGoZone[] {
    return this.getNoGoZones().filter(z => z.mapId === mapId)
  }

  static saveNoGoZone(zone: NoGoZone): void {
    const zones = this.getNoGoZones()
    const index = zones.findIndex(z => z.id === zone.id)
    if (index >= 0) zones[index] = zone
    else zones.push(zone)
    storage.set(STORAGE_KEYS.NO_GO_ZONES, zones)
  }

  static deleteNoGoZone(id: string): void {
    const zones = this.getNoGoZones().filter(z => z.id !== id)
    storage.set(STORAGE_KEYS.NO_GO_ZONES, zones)
  }

  // ── 电子围栏 ──
  static getGeofences(): Geofence[] {
    return storage.get<Geofence[]>(STORAGE_KEYS.GEOFENCES) || []
  }

  static getGeofencesByMapId(mapId: string): Geofence[] {
    return this.getGeofences().filter(g => g.mapId === mapId)
  }

  static saveGeofence(geofence: Geofence): void {
    const geofences = this.getGeofences()
    const index = geofences.findIndex(g => g.id === geofence.id)
    if (index >= 0) geofences[index] = geofence
    else geofences.push(geofence)
    storage.set(STORAGE_KEYS.GEOFENCES, geofences)
  }

  static deleteGeofence(id: string): void {
    const geofences = this.getGeofences().filter(g => g.id !== id)
    storage.set(STORAGE_KEYS.GEOFENCES, geofences)
  }

  // ── 路网版本（含快照） ──
  static getRoadNetworkVersions(): RoadNetworkVersion[] {
    return storage.get<RoadNetworkVersion[]>(STORAGE_KEYS.ROAD_NETWORK_VERSIONS) || []
  }

  static saveRoadNetworkVersion(version: RoadNetworkVersion): void {
    const versions = this.getRoadNetworkVersions()
    const index = versions.findIndex(v => v.id === version.id)
    if (index >= 0) versions[index] = version
    else versions.push(version)
    storage.set(STORAGE_KEYS.ROAD_NETWORK_VERSIONS, versions)
  }

  static deleteRoadNetworkVersion(id: string): void {
    const versions = this.getRoadNetworkVersions().filter(v => v.id !== id)
    storage.set(STORAGE_KEYS.ROAD_NETWORK_VERSIONS, versions)
  }

  // ── 拓扑检查结果 ──
  static getTopologyChecks(): TopologyCheckResult[] {
    return storage.get<TopologyCheckResult[]>(STORAGE_KEYS.TOPOLOGY_CHECKS) || []
  }

  static saveTopologyCheck(check: TopologyCheckResult): void {
    const checks = this.getTopologyChecks()
    const index = checks.findIndex(c => c.id === check.id)
    if (index >= 0) checks[index] = check
    else checks.push(check)
    storage.set(STORAGE_KEYS.TOPOLOGY_CHECKS, checks)
  }

  /** 从快照恢复全部路网数据 */
  static restoreRoadNetworkFromSnapshot(snapshot: import('@/types/road-network').RoadNetworkSnapshot): void {
    storage.set(STORAGE_KEYS.ROAD_NODES, snapshot.nodes)
    storage.set(STORAGE_KEYS.ROAD_EDGES, snapshot.edges)
    storage.set(STORAGE_KEYS.ROAD_SEGMENTS, snapshot.segments)
    storage.set(STORAGE_KEYS.JUNCTIONS, snapshot.junctions || [])
    storage.set(STORAGE_KEYS.NAV_POINTS, snapshot.navPoints || [])
    storage.set(STORAGE_KEYS.NO_GO_ZONES, snapshot.noGoZones || [])
  }

  /** 获取当前路网的所有数据快照（用于版本管理/撤销） */
  static captureRoadNetworkSnapshot(): import('@/types/road-network').RoadNetworkSnapshot {
    return {
      nodes: this.getRoadNodes(),
      edges: this.getRoadEdges(),
      segments: this.getRoadSegments(),
      junctions: this.getJunctions(),
      navPoints: this.getNavigationPoints(),
      noGoZones: this.getNoGoZones()
    }
  }

  /**
   * 将 InspectionMap 中的 MapRegion 数据同步到 NoGoZone 存储
   * （用于区域管理页面与路网管理页面的数据打通）
   */
  static syncRegionsToNoGoZones(mapId: string): void {
    const maps = this.getInspectionMaps()
    const map = maps.find(m => m.id === mapId)
    if (!map?.regions) return

    const existingZones = this.getNoGoZonesByMapId(mapId)
    const existingIds = new Set(existingZones.map(z => z.id))

    map.regions.forEach(region => {
      if (!existingIds.has(region.id)) {
        const polygonPoints = region.polygonPoints
          ? region.polygonPoints.split(' ').filter(Boolean).map(p => {
              const [x, y] = p.split(',').map(Number)
              return { x, y }
            })
          : [
              { x: region.x, y: region.y },
              { x: region.x + region.width, y: region.y },
              { x: region.x + region.width, y: region.y + region.height },
              { x: region.x, y: region.y + region.height }
            ]
        const noGo: NoGoZone = {
          id: region.id,
          name: region.name,
          code: region.code || `RG${String(existingZones.length + 1).padStart(3, '0')}`,
          mapId,
          zoneType: region.zoneType || 'normal',
          level: 'permanent',
          polygonPoints,
          description: region.description,
          responsiblePerson: region.responsiblePerson,
          contactPhone: region.contactPhone,
          createdAt: new Date(),
          updatedAt: new Date()
        }
        this.saveNoGoZone(noGo)
      }
    })
  }

  /**
   * 通过 NavigationPoint 查找关联的 InspectionPoint
   */
  static getInspectionPointByNavPoint(navPointId: string): InspectionPoint | undefined {
    const navPoint = this.getNavigationPoints().find(p => p.id === navPointId)
    if (!navPoint?.inspectionPointId) return undefined
    return this.getInspectionPoints().find(p => p.id === navPoint.inspectionPointId)
  }

  /**
   * 通过 InspectionPoint 查找关联的 NavigationPoint
   */
  static getNavPointByInspectionPoint(inspectionPointId: string): NavigationPoint | undefined {
    return this.getNavigationPoints().find(p => p.inspectionPointId === inspectionPointId)
  }

  /**
   * 创建或更新 NavigationPoint 与 InspectionPoint 的关联
   */
  static linkNavPointToInspectionPoint(navPointId: string, inspectionPointId: string): void {
    const navPoint = this.getNavigationPoints().find(p => p.id === navPointId)
    if (navPoint) {
      navPoint.inspectionPointId = inspectionPointId
      this.saveNavigationPoint(navPoint)
    }
  }

  // ── Dispatch Resource Pools ──
  static getDispatchResourcePools() {
    return storage.get<any[]>(STORAGE_KEYS.DISPATCH_RESOURCE_POOLS) || []
  }

  static saveDispatchResourcePool(pool: any) {
    const pools = this.getDispatchResourcePools()
    const idx = pools.findIndex(p => p.id === pool.id)
    if (idx >= 0) pools[idx] = pool
    else pools.push(pool)
    storage.set(STORAGE_KEYS.DISPATCH_RESOURCE_POOLS, pools)
  }

  // ── Dispatch Rules ──
  static getDispatchRules() {
    return storage.get<any[]>(STORAGE_KEYS.DISPATCH_RULES) || []
  }

  static saveDispatchRule(rule: any) {
    const rules = this.getDispatchRules()
    const idx = rules.findIndex(r => r.id === rule.id)
    if (idx >= 0) rules[idx] = rule
    else rules.push(rule)
    storage.set(STORAGE_KEYS.DISPATCH_RULES, rules)
  }

  // ── AI 知识库文件 ──
  static getKnowledgeFiles(): any[] {
    return storage.get<any[]>(STORAGE_KEYS.KNOWLEDGE_FILES) || []
  }

  static saveKnowledgeFile(file: any): void {
    const files = this.getKnowledgeFiles()
    const idx = files.findIndex(f => f.id === file.id)
    if (idx >= 0) files[idx] = file
    else files.push(file)
    storage.set(STORAGE_KEYS.KNOWLEDGE_FILES, files)
  }

  static deleteKnowledgeFile(id: string): void {
    const files = this.getKnowledgeFiles().filter(f => f.id !== id)
    storage.set(STORAGE_KEYS.KNOWLEDGE_FILES, files)
  }

  // ── AI 聊天会话 ──
  static getAIChatSessions(): any[] {
    return storage.get<any[]>(STORAGE_KEYS.AI_CHAT_SESSIONS) || []
  }

  static saveAIChatSession(session: any): any {
    const sessions = this.getAIChatSessions()
    const newSession = { ...session, id: session.id || `session-${Date.now()}`, createdAt: new Date().toISOString() }
    const idx = sessions.findIndex(s => s.id === newSession.id)
    if (idx >= 0) sessions[idx] = newSession
    else sessions.push(newSession)
    storage.set(STORAGE_KEYS.AI_CHAT_SESSIONS, sessions)
    return newSession
  }

  static deleteAIChatSession(id: string): void {
    const sessions = this.getAIChatSessions().filter(s => s.id !== id)
    storage.set(STORAGE_KEYS.AI_CHAT_SESSIONS, sessions)
  }

  // ── AI 聊天消息 ──
  static getAIChatMessages(sessionId: string): any[] {
    const all = storage.get<any[]>(STORAGE_KEYS.AI_CHAT_MESSAGES) || []
    return all.filter(m => m.sessionId === sessionId)
  }

  static saveAIChatMessage(msg: any): any {
    const all = storage.get<any[]>(STORAGE_KEYS.AI_CHAT_MESSAGES) || []
    const newMsg = { ...msg, id: msg.id || `msg-${Date.now()}`, createdAt: new Date().toISOString() }
    all.push(newMsg)
    storage.set(STORAGE_KEYS.AI_CHAT_MESSAGES, all)
    return newMsg
  }

  // ── 作业票 ──
  static getWorkTickets(): any[] {
    return storage.get<any[]>(STORAGE_KEYS.WORK_TICKETS) || []
  }

  static saveWorkTicket(ticket: any): void {
    const tickets = this.getWorkTickets()
    const idx = tickets.findIndex(t => t.id === ticket.id)
    if (idx >= 0) tickets[idx] = ticket
    else tickets.push(ticket)
    storage.set(STORAGE_KEYS.WORK_TICKETS, tickets)
  }

  // ── 检测算法配置（字典/CRD） ──

  static getDetectionAlgorithmConfigs(): import('@/types/ai').DetectionAlgorithmConfig[] {
    const list = storage.get<import('@/types/ai').DetectionAlgorithmConfig[]>(STORAGE_KEYS.DETECTION_ALGORITHM_CONFIGS)
    if (list) return list
    const initial: import('@/types/ai').DetectionAlgorithmConfig[] = [
      { id: 'dac-001', detectionType: '图像识别', name: '外观识别', modelType: 'small', remark: '识别设备外观是否完好', createdAt: new Date().toISOString() },
      { id: 'dac-002', detectionType: '图像识别', name: '仪表读数识别', modelType: 'small', remark: 'OCR+表盘定位，读取仪表数值', createdAt: new Date().toISOString() },
      { id: 'dac-003', detectionType: '热成像', name: '温度异常识别', modelType: 'small', remark: '热成像检测温度异常点', createdAt: new Date().toISOString() },
      { id: 'dac-004', detectionType: '气体检测', name: 'CH4 浓度检测', modelType: 'large', remark: '甲烷气体浓度检测', createdAt: new Date().toISOString() }
    ]
    storage.set(STORAGE_KEYS.DETECTION_ALGORITHM_CONFIGS, initial)
    return initial
  }

  static saveDetectionAlgorithmConfig(config: import('@/types/ai').DetectionAlgorithmConfig): void {
    const list = this.getDetectionAlgorithmConfigs()
    const idx = list.findIndex(c => c.id === config.id)
    if (idx >= 0) list[idx] = config
    else list.push(config)
    storage.set(STORAGE_KEYS.DETECTION_ALGORITHM_CONFIGS, list)
  }

  static deleteDetectionAlgorithmConfig(id: string): void {
    const list = this.getDetectionAlgorithmConfigs().filter(c => c.id !== id)
    storage.set(STORAGE_KEYS.DETECTION_ALGORITHM_CONFIGS, list)
  }

  static restoreFromSnapshot(snapshot: import('@/types/road-network').RoadNetworkSnapshot): void {
    storage.set(STORAGE_KEYS.ROAD_NODES, snapshot.nodes)
    storage.set(STORAGE_KEYS.ROAD_EDGES, snapshot.edges)
    storage.set(STORAGE_KEYS.ROAD_SEGMENTS, snapshot.segments)
    storage.set(STORAGE_KEYS.JUNCTIONS, snapshot.junctions)
    storage.set(STORAGE_KEYS.NAV_POINTS, snapshot.navPoints)
    storage.set(STORAGE_KEYS.NO_GO_ZONES, snapshot.noGoZones)
  }
}
