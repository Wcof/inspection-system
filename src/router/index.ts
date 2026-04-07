import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/map/map-list'
  },
  {
    path: '/map',
    name: 'Map',
    meta: { title: '地图管理' },
    children: [
      {
        path: 'map-list',
        name: 'MapList',
        component: () => import('../views/map/MapList.vue'),
        meta: { title: '地图列表' }
      },
      {
        path: 'point-manage',
        name: 'PointManage',
        component: () => import('../views/map/PointManage.vue'),
        meta: { title: '点位管理' }
      },
      {
        path: 'map-editor/:id?',
        name: 'MapEditor',
        component: () => import('../views/map/MapEditor.vue'),
        meta: { title: '地图编辑器' }
      }
    ]
  },
  {
    path: '/facility',
    name: 'Facility',
    meta: { title: '设施设备管理' },
    children: [
      {
        path: 'robot',
        name: 'Robot',
        component: () => import('../views/robot/RobotList.vue'),
        meta: { title: '机器人管理' }
      },
      {
        path: 'robot/detail/:id',
        name: 'RobotDetail',
        component: () => import('../views/robot/RobotDetail.vue'),
        meta: { title: '机器人详情' }
      },
      {
        path: 'robot/form/:id?',
        name: 'RobotForm',
        component: () => import('../views/robot/RobotForm.vue'),
        meta: { title: '机器人编辑' }
      },
      {
        path: 'inspection-point',
        name: 'InspectionPoint',
        component: () => import('../views/inspection/InspectionPointList.vue'),
        meta: { title: '巡检点管理' }
      },
      {
        path: 'inspection-point/form/:id?',
        name: 'InspectionPointForm',
        component: () => import('../views/inspection/InspectionPointForm.vue'),
        meta: { title: '巡检点编辑' }
      },
      {
        path: 'device',
        name: 'FacilityDevice',
        component: () => import('../views/inspection/device/FacilityDeviceList.vue'),
        meta: { title: '设备设施' }
      },
      {
        path: 'device/form/:id?',
        name: 'FacilityDeviceForm',
        component: () => import('../views/inspection/device/FacilityDeviceForm.vue'),
        meta: { title: '设备设施编辑' }
      }
    ]
  },

  {
    path: '/smart-inspection',
    name: 'SmartInspection',
    meta: { title: '智能巡检' },
    children: [

      {
        path: 'plan',
        name: 'InspectionPlan',
        component: () => import('../views/inspection/plan/InspectionPlanList.vue'),
        meta: { title: '巡检计划' }
      },
      {
        path: 'plan/form/:id?',
        name: 'InspectionPlanForm',
        component: () => import('../views/inspection/plan/InspectionPlanForm.vue'),
        meta: { title: '巡检计划编辑' }
      },
      {
        path: 'task',
        name: 'InspectionTask',
        component: () => import('../views/inspection/task/InspectionTaskList.vue'),
        meta: { title: '巡检任务' }
      },
      {
        path: 'task/detail/:id',
        name: 'InspectionTaskDetail',
        component: () => import('../views/inspection/task/InspectionTaskDetail.vue'),
        meta: { title: '巡检任务详情' }
      },
      {
        path: 'statistics',
        name: 'InspectionStatistics',
        component: () => import('../views/smart-inspection/InspectionStatistics.vue'),
        meta: { title: '巡检统计' }
      },
      {
        path: 'exception',
        name: 'ExceptionLog',
        component: () => import('../views/inspection/ExceptionLogViewer.vue'),
        meta: { title: '异常日志' }
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
