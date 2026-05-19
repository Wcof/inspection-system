import { storage, STORAGE_KEYS } from '@/utils/storage'
import { 
  initialRobots, 
  initialInspectionPoints, 
  initialMonitorPoints, 
  initialMetrics, 
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
  initialStandardComponents
} from './initialData'
import { Robot, InspectionPoint, MonitorPoint, Metric, InspectionTask, InspectionPath } from '@/types'
import type {
  InspectionMap,
  Waypoint,
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
    if (!storage.get(STORAGE_KEYS.MONITOR_POINTS)) {
      storage.set(STORAGE_KEYS.MONITOR_POINTS, initialMonitorPoints)
    }
    if (!storage.get(STORAGE_KEYS.METRICS)) {
      storage.set(STORAGE_KEYS.METRICS, initialMetrics)
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
  
  // 途径点相关
  static getWaypoints(): Waypoint[] {
    return storage.get<Waypoint[]>(STORAGE_KEYS.WAYPOINTS) || []
  }
  
  static getWaypointsByMapId(mapId: string): Waypoint[] {
    return this.getWaypoints().filter(w => w.mapId === mapId)
  }
  
  static getWaypointById(id: string): Waypoint | undefined {
    const waypoints = this.getWaypoints()
    return waypoints.find(w => w.id === id)
  }
  
  static saveWaypoint(waypoint: Waypoint): void {
    const waypoints = this.getWaypoints()
    const index = waypoints.findIndex(w => w.id === waypoint.id)
    if (index >= 0) {
      waypoints[index] = waypoint
    } else {
      waypoints.push(waypoint)
    }
    storage.set(STORAGE_KEYS.WAYPOINTS, waypoints)
  }
  
  static deleteWaypoint(id: string): void {
    const waypoints = this.getWaypoints().filter(w => w.id !== id)
    storage.set(STORAGE_KEYS.WAYPOINTS, waypoints)
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

  // 标准部件库
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
}
