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
        meta: { title: '执行规划' },
        children: [
          {
            path: 'list',
            name: 'ManagementPlanList',
            component: () => import('../views/inspection/plan/InspectionPlanList.vue'),
            meta: { title: '执行规划' }
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
      // 驾驶舱（管理端一级，调度台同级）
      {
        path: 'cockpit',
        name: 'ManagementCockpit',
        meta: { title: '驾驶舱' },
        redirect: '/management/cockpit/view',
        children: [
          {
            path: 'view',
            name: 'ManagementCockpitView',
            component: () => import('../views/implementation/CockpitView.vue'),
            meta: { title: '驾驶舱' }
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
            path: 'temp-list',
            name: 'ManagementTemporaryTaskList',
            component: () => import('../views/inspection/task/TemporaryTaskList.vue'),
            meta: { title: '临时任务' }
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
          },
          {
            path: 'detail/:id',
            name: 'ManagementExceptionDetail',
            component: () => import('../views/management/exception/ExceptionDetail.vue'),
            meta: { title: '异常详情' }
          },
          {
            path: 'handle/:id',
            name: 'ManagementExceptionHandle',
            component: () => import('../views/management/exception/ExceptionHandle.vue'),
            meta: { title: '异常处理' }
          }
        ]
      },
      // 报表统计
      {
        path: 'report',
        name: 'ManagementReport',
        meta: { title: '报表统计' },
        redirect: '/management/report/overview',
        children: [
          {
            path: 'statistics',
            name: 'ManagementReportStatistics',
            redirect: '/management/report/overview'
          },
          {
            path: 'overview',
            name: 'ManagementReportOverview',
            component: () => import('../views/management/report/ReportOverview.vue'),
            meta: { title: '统计总览' }
          },
          {
            path: 'inspection-point-analysis',
            name: 'ManagementReportInspectionPointAnalysis',
            component: () => import('../views/management/report/ReportInspectionPointAnalysis.vue'),
            meta: { title: '巡检点分析' }
          },
          {
            path: 'facility-device-analysis',
            name: 'ManagementReportFacilityDeviceAnalysis',
            component: () => import('../views/management/report/ReportFacilityDeviceAnalysis.vue'),
            meta: { title: '设施设备分析' }
          },
          {
            path: 'gas-analysis',
            name: 'ManagementReportGasAnalysis',
            component: () => import('../views/management/report/ReportGasAnalysis.vue'),
            meta: { title: '气体分析' }
          },
          {
            path: 'safety-behavior-analysis',
            name: 'ManagementReportSafetyBehaviorAnalysis',
            component: () => import('../views/management/report/ReportSafetyBehaviorAnalysis.vue'),
            meta: { title: '安全行为分析' }
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
        meta: { title: '地图空间' },
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
          },
          {
            path: 'area-manage',
            name: 'ImplementationMapAreaManage',
            component: () => import('../views/map/AreaManage.vue'),
            meta: { title: '区域管理' }
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
            meta: { title: '详情' }
          }
        ]
      },
      {
        path: 'point',
        name: 'ImplementationPoint',
        meta: { title: '点位采集' },
        children: [
          {
            path: 'list',
            name: 'ImplementationPointList',
            redirect: () => ({ path: '/implementation/map/point-manage', query: { tab: 'inspection' } }),
            meta: { title: '点位采集' }
          },
          {
            path: 'create/:id?',
            name: 'ImplementationPointCreate',
            component: () => import('../views/inspection/InspectionPointCreate.vue'),
            meta: { title: '巡检点配置' }
          },
          {
            path: 'detail/:id',
            name: 'ImplementationPointDetail',
            component: () => import('../views/inspection/InspectionPointDetail.vue'),
            meta: { title: '巡检点详情' }
          },
          {
            path: 'form/:id?',
            name: 'ImplementationPointForm',
            redirect: to => ({ path: `/implementation/point/detail/${to.params.id || ''}` }),
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
        meta: { title: ' 资产设备' },
        children: [
          {
            path: 'list',
            name: 'ImplementationDeviceList',
            component: () => import('../views/inspection/device/FacilityDeviceList.vue'),
            meta: { title: '资产对象' }
          },
          {
            path: 'standard-components',
            name: 'ImplementationStandardComponentLibrary',
            component: () => import('../views/inspection/device/StandardComponentLibrary.vue'),
            meta: { title: '标准部件库' }
          },
          {
            path: 'component-usage',
            name: 'ImplementationComponentUsageList',
            component: () => import('../views/inspection/device/ComponentUsageList.vue'),
            meta: { title: '设施部件' }
          },
          {
            path: 'iot-list',
            name: 'ImplementationIoTDeviceList',
            component: () => import('../views/inspection/device/IoTDeviceList.vue'),
            meta: { title: '设备管理' }
          },
          {
            path: 'component-types',
            name: 'ImplementationComponentTypeConfig',
            component: () => import('../views/inspection/device/ComponentTypeConfig.vue'),
            meta: { title: '部件类型配置' }
          },
          {
            path: 'detail/:id',
            name: 'ImplementationDeviceDetail',
            component: () => import('../views/inspection/device/FacilityDeviceDetail.vue'),
            meta: { title: '设施详情' }
          },
          {
            path: 'detection-config/:deviceId/:componentId?',
            name: 'ImplementationObjectDetectionConfig',
            component: () => import('../views/inspection/device/ObjectDetectionConfig.vue'),
            meta: { title: '检测配置' }
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
        path: 'detection-item-config',
        name: 'ImplementationDetectionItemConfig',
        meta: { title: '检测项配置' },
        children: [
          {
            path: 'list',
            name: 'ImplementationDetectionItemConfigList',
            component: () => import('../views/implementation/detection-item-config/DetectionItemConfigList.vue'),
            meta: { title: '检测项配置' }
          },
          {
            path: 'create',
            name: 'ImplementationDetectionItemConfigCreate',
            component: () => import('../views/implementation/detection-item-config/DetectionItemConfigForm.vue'),
            meta: { title: '新增检测规则' }
          },
          {
            path: 'detail/:id',
            name: 'ImplementationDetectionItemConfigDetail',
            component: () => import('../views/implementation/detection-item-config/DetectionItemConfigDetail.vue'),
            meta: { title: '检测项配置详情' }
          },
          {
            path: 'edit/:id',
            name: 'ImplementationDetectionItemConfigEdit',
            component: () => import('../views/implementation/detection-item-config/DetectionItemConfigForm.vue'),
            meta: { title: '编辑检测项配置' }
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
          },
          {
            path: 'cockpit',
            name: 'ImplementationDispatchCockpit',
            redirect: '/management/cockpit/view'
          },
          {
            path: 'notify-config',
            name: 'ImplementationDispatchNotifyConfig',
            component: () => import('../views/implementation/NotifyConfig.vue'),
            meta: { title: '通知配置' }
          },
          {
            path: 'edge-inspection',
            name: 'ImplementationDispatchEdgeInspection',
            component: () => import('../views/implementation/EdgeInspection.vue'),
            meta: { title: '边巡边检' }
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
