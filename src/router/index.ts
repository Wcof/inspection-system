import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/management/dispatch/center'
  },
  
  // 管理端路由
  {
    path: '/management',
    name: 'Management',
    meta: { title: '管理端' },
    children: [
      // 巡检计划（挂在调度台体系下）
      {
        path: 'plan',
        name: 'ManagementPlan',
        meta: { title: '巡检计划' },
        children: [
          {
            path: 'list',
            name: 'ManagementPlanList',
            component: () => import('../views/inspection/plan/InspectionPlanList.vue'),
            meta: { title: '巡检计划' }
          },
          {
            path: 'form/:id?',
            name: 'ManagementPlanForm',
            component: () => import('../views/inspection/plan/InspectionPlanForm.vue'),
            meta: { title: '计划编辑' }
          },
          {
            path: 'detail/:id',
            name: 'ManagementPlanDetail',
            component: () => import('../views/management/plan/InspectionPlanDetail.vue'),
            meta: { title: '计划详情' }
          }
        ]
      },
      // 调度台
      {
        path: 'dispatch',
        name: 'ManagementDispatch',
        meta: { title: '调度台' },
        children: [
          {
            path: 'center',
            name: 'ManagementDispatchCenter',
            component: () => import('../views/management/DispatchCenter.vue'),
            meta: { title: '总调度台' }
          }
        ]
      },
      // 任务中心
      {
        path: 'task',
        name: 'ManagementTask',
        meta: { title: '巡检任务' },
        children: [
          {
            path: 'list',
            name: 'ManagementTaskList',
            component: () => import('../views/inspection/task/InspectionTaskList.vue'),
            meta: { title: '巡检任务' }
          },
          {
            path: 'detail/:id',
            name: 'ManagementTaskDetail',
            component: () => import('../views/inspection/task/InspectionTaskDetail.vue'),
            meta: { title: '任务详情' }
          },
          {
            path: 'trace/:id',
            name: 'ManagementTaskTrace',
            component: () => import('../views/management/task/ExecutionTrace.vue'),
            meta: { title: '执行轨迹' }
          },
          {
            path: 'result/:id',
            name: 'ManagementTaskResult',
            component: () => import('../views/management/task/CheckResult.vue'),
            meta: { title: '检查结果' }
          },
          {
            path: 'review/:id',
            name: 'ManagementTaskReview',
            component: () => import('../views/management/task/TaskReview.vue'),
            meta: { title: '任务复盘' }
          }
        ]
      },
      // 异常中心
      {
        path: 'exception',
        name: 'ManagementException',
        meta: { title: '异常中心' },
        children: [
          {
            path: 'list',
            name: 'ManagementExceptionList',
            component: () => import('../views/inspection/ExceptionLogViewer.vue'),
            meta: { title: '异常列表' }
          }
        ]
      },
      // 报表统计
      {
        path: 'report',
        name: 'ManagementReport',
        meta: { title: '报表统计' },
        children: [
          {
            path: 'statistics',
            name: 'ManagementReportStatistics',
            component: () => import('../views/smart-inspection/InspectionStatistics.vue'),
            meta: { title: '巡检分析' }
          }
        ]
      }
    ]
  },
  
  // 实施平台路由
  {
    path: '/implementation',
    name: 'Implementation',
    meta: { title: '实施平台' },
    children: [
      {
        path: 'map',
        name: 'ImplementationMap',
        meta: { title: '地图管理' },
        children: [
          {
            path: 'list',
            name: 'ImplementationMapList',
            component: () => import('../views/map/MapList.vue'),
            meta: { title: '地图列表' }
          },
          {
            path: 'editor/:id?',
            name: 'ImplementationMapEditor',
            component: () => import('../views/map/MapEditor.vue'),
            meta: { title: '地图编辑' }
          },
          {
            path: 'point-manage',
            name: 'ImplementationMapPointManage',
            component: () => import('../views/map/PointManage.vue'),
            meta: { title: '点位管理' }
          }
        ]
      },
      {
        path: 'robot',
        name: 'ImplementationRobot',
        meta: { title: '机器人管理' },
        children: [
          {
            path: 'list',
            name: 'ImplementationRobotList',
            component: () => import('../views/robot/RobotList.vue'),
            meta: { title: '机器人管理' }
          },
          {
            path: 'detail/:id',
            name: 'ImplementationRobotDetail',
            component: () => import('../views/robot/RobotDetail.vue'),
            meta: { title: '机器人详情' }
          },
          {
            path: 'form/:id?',
            name: 'ImplementationRobotForm',
            component: () => import('../views/robot/RobotForm.vue'),
            meta: { title: '机器人编辑' }
          },
          {
            path: 'simulation',
            name: 'ImplementationRobotSimulation',
            component: () => import('../views/implementation/RobotSimulation.vue'),
            meta: { title: '机器人仿真' }
          }
        ]
      },
      {
        path: 'point',
        name: 'ImplementationPoint',
        meta: { title: '点位管理' },
        children: [
          {
            path: 'list',
            name: 'ImplementationPointList',
            component: () => import('../views/inspection/InspectionPointList.vue'),
            meta: { title: '点位管理' }
          },
          {
            path: 'form/:id?',
            name: 'ImplementationPointForm',
            component: () => import('../views/inspection/InspectionPointForm.vue'),
            meta: { title: '点位编辑' }
          }
        ]
      },
      {
        path: 'calibration',
        name: 'ImplementationCalibration',
        meta: { title: '校准记录' },
        children: [
          {
            path: 'list',
            name: 'ImplementationCalibrationList',
            component: () => import('../views/implementation/CalibrationRecord.vue'),
            meta: { title: '校准记录' }
          }
        ]
      },
      {
        path: 'device',
        name: 'ImplementationDevice',
        meta: { title: '设施设备管理' },
        children: [
          {
            path: 'list',
            name: 'ImplementationDeviceList',
            component: () => import('../views/inspection/device/FacilityDeviceList.vue'),
            meta: { title: '设施设备管理' }
          },
          {
            path: 'form/:id?',
            name: 'ImplementationDeviceForm',
            component: () => import('../views/inspection/device/FacilityDeviceForm.vue'),
            meta: { title: '设施设备编辑' }
          }
        ]
      },
      {
        path: 'metric',
        name: 'ImplementationMetric',
        meta: { title: '检测项管理' },
        children: [
          {
            path: 'list',
            name: 'ImplementationMetricList',
            component: () => import('../views/implementation/MetricManagement.vue'),
            meta: { title: '检测项管理' }
          }
        ]
      },
      {
        path: 'dispatch',
        name: 'ImplementationDispatchConfig',
        meta: { title: '调度配置' },
        children: [
          {
            path: 'rule-config',
            name: 'ImplementationDispatchRuleConfig',
            component: () => import('../views/implementation/DispatchRuleConfig.vue'),
            meta: { title: '调度规则配置' }
          },
          {
            path: 'resource-config',
            name: 'ImplementationDispatchResourceConfig',
            component: () => import('../views/implementation/ResourceBaseConfig.vue'),
            meta: { title: '资源基础配置' }
          }
        ]
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  document.title = to.meta.title as string || '安全生产巡检任务管理系统'
  next()
})

export default router
