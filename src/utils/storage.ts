const STORAGE_KEYS = {
  ROBOTS: 'inspection_robots',
  INSPECTION_POINTS: 'inspection_points',
  MONITOR_POINTS: 'monitor_points',
  METRICS: 'metrics',
  TASKS: 'inspection_tasks',
  PATHS: 'inspection_paths',
  EXCEPTION_LOGS: 'exception_logs',
  STRATEGIES: 'exception_strategies',
  PLANS: 'inspection_plans',
  SCHEMA_VERSION: 'schema_version',
  INSPECTION_MAPS: 'inspection_maps',
  WAYPOINTS: 'waypoints',
  WAYPOINT_EDGES: 'waypoint_edges',
  INSPECTION_ROUTES: 'inspection_routes',
  INSPECTION_DEVICES: 'inspection_devices',
  INSTALLATIONS: 'installations',
  FACILITY_COMPONENTS: 'facility_components',
  INSPECTION_DEVICE_CHECK_ITEMS: 'inspection_device_check_items',
  SYSTEM_CONFIG: 'system_config',
  STANDARD_COMPONENTS: 'standard_components',
  INSPECTION_TASK_SNAPSHOTS: 'inspection_task_snapshots',
  INSPECTION_TASK_RESULTS: 'inspection_task_results',
  ROAD_NODES: 'road_nodes',
  ROAD_EDGES: 'road_edges',
  ROAD_SEGMENTS: 'road_segments',
  JUNCTIONS: 'junctions',
  NAV_POINTS: 'nav_points',
  NO_GO_ZONES: 'no_go_zones',
  GEOFENCES: 'geofences',
  ROAD_NETWORK_VERSIONS: 'road_network_versions',
  TOPOLOGY_CHECKS: 'topology_checks',
  DISPATCH_RESOURCE_POOLS: 'dispatch_resource_pools',
  DISPATCH_RULES: 'dispatch_rules'
}

export const storage = {
  get<T>(key: string): T | null {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  },
  
  set<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value))
  },
  
  remove(key: string): void {
    localStorage.removeItem(key)
  },
  
  clear(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key)
    })
  }
}

export { STORAGE_KEYS }
