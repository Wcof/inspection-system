<template>
  <a-layout style="min-height: 100vh">
    <a-layout-sider width="200" style="background: #fff">
      <div class="logo" />
      <a-menu
        mode="inline"
        :selected-keys="[currentKey]"
        :open-keys="openKeys"
        style="height: 100%; border-right: 0"
      >
        <template v-if="currentSystem === 'management'">
        <a-sub-menu key="management-dispatch">
            <template #title>
              <span>
                <a-icon type="control" />
                总调度台
              </span>
            </template>
            <a-menu-item key="management-dispatch-center">
              <router-link to="/management/dispatch/center">总调度台</router-link>
            </a-menu-item>
          </a-sub-menu>
          <a-sub-menu key="management-plan">
            <template #title>
              <span>
                <a-icon type="schedule" />
                规划与执行
              </span>
            </template>
            <a-menu-item key="management-plan-list">
              <router-link to="/management/plan/list">巡检规划</router-link>
            </a-menu-item>
            <a-menu-item key="management-task-list">
              <router-link to="/management/task/list">执行任务</router-link>
            </a-menu-item>
            <a-menu-item key="management-task-temp-list">
              <router-link to="/management/task/temp-list">临时任务</router-link>
            </a-menu-item>
          </a-sub-menu>
          <a-sub-menu key="management-exception">
            <template #title>
              <span>
                <a-icon type="warning" />
                异常中心
              </span>
            </template>
            <a-menu-item key="management-exception-list">
              <router-link to="/management/exception/list">异常告警</router-link>
            </a-menu-item>
          </a-sub-menu>
          <a-sub-menu key="management-report">
            <template #title>
              <span>
                <a-icon type="line-chart" />
                报表统计
              </span>
            </template>
            <a-menu-item key="management-report-overview">
              <router-link to="/management/report/overview">统计总览</router-link>
            </a-menu-item>
            <a-menu-item key="management-report-inspection-point-analysis">
              <router-link to="/management/report/inspection-point-analysis">巡检点分析</router-link>
            </a-menu-item>
            <a-menu-item key="management-report-facility-device-analysis">
              <router-link to="/management/report/facility-device-analysis">设施设备分析</router-link>
            </a-menu-item>
            <a-menu-item key="management-report-gas-analysis">
              <router-link to="/management/report/gas-analysis">气体分析</router-link>
            </a-menu-item>
            <a-menu-item key="management-report-safety-behavior-analysis">
              <router-link to="/management/report/safety-behavior-analysis">安全行为分析</router-link>
            </a-menu-item>
          </a-sub-menu>
        </template>

        <template v-else-if="currentSystem === 'implementation'">
          <a-sub-menu key="implementation-map">
            <template #title>
              <span>
                <a-icon type="environment" />
                地图空间
              </span>
            </template>
            <a-menu-item key="implementation-map-list">
              <router-link to="/implementation/map/list">地图管理</router-link>
            </a-menu-item>
            <a-menu-item key="implementation-map-point-manage">
              <router-link to="/implementation/map/point-manage">点位管理</router-link>
            </a-menu-item>
            <a-menu-item key="implementation-map-area-manage">
              <router-link to="/implementation/map/area-manage">区域管理</router-link>
            </a-menu-item>
          </a-sub-menu>
          <a-sub-menu key="implementation-asset-detection">
            <template #title>
              <span>
                <a-icon type="appstore" />
                资产设备
              </span>
            </template>
            <a-menu-item key="implementation-installation-list">
              <router-link to="/implementation/device/installation-list">装置管理</router-link>
            </a-menu-item>
            <a-menu-item key="implementation-device">
              <router-link to="/implementation/device/list">设施管理</router-link>
            </a-menu-item>
            <a-menu-item key="implementation-device-component-usage">
              <router-link to="/implementation/device/component-usage">部件管理</router-link>
            </a-menu-item>
            <a-menu-item key="implementation-robot-list">
              <router-link to="/implementation/robot/list">机器人管理</router-link>
            </a-menu-item>
          </a-sub-menu>
          <a-sub-menu key="implementation-point-collection">
            <template #title>
              <span>
                <a-icon type="cluster" />
                检测规则
              </span>
            </template>
            <a-menu-item key="implementation-detection-item-config">
              <router-link to="/implementation/detection-item-config/list">检测规则配置</router-link>
            </a-menu-item>
          </a-sub-menu>
          <a-sub-menu key="implementation-dispatch-config">
            <template #title>
              <span>
                <a-icon type="setting" />
                系统配置
              </span>
            </template>
            <a-menu-item key="implementation-device-iot-list">
              <router-link to="/implementation/device/iot-list">设备管理</router-link>
            </a-menu-item>
            <a-menu-item key="implementation-dispatch-rule-config">
              <router-link to="/implementation/dispatch/rule-config">调度规则配置</router-link>
            </a-menu-item>
            <a-menu-item key="implementation-dispatch-resource-config">
              <router-link to="/implementation/dispatch/resource-config">资源基础配置</router-link>
            </a-menu-item>
            <a-menu-item key="implementation-device-component-types">
              <router-link to="/implementation/device/component-types">部件类型配置</router-link>
            </a-menu-item>
            <a-menu-item key="implementation-dispatch-notify-config">
              <router-link to="/implementation/dispatch/notify-config">通知配置</router-link>
            </a-menu-item>
            <a-menu-item key="implementation-dispatch-edge-inspection">
              <router-link to="/implementation/dispatch/edge-inspection">边巡边检</router-link>
            </a-menu-item>
          </a-sub-menu>
        </template>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header style="background: #fff; padding: 0 24px; border-bottom: 1px solid #f0f0f0">
        <div class="header-content">
          <h1 class="title">安全生产巡检任务管理系统</h1>
          <div class="system-switcher">
            <a-radio-group v-model:value="currentSystem" @change="handleSystemChange">
              <a-radio-button value="management">管理端</a-radio-button>
              <a-radio-button value="implementation">实施端</a-radio-button>
            </a-radio-group>
          </div>
        </div>
      </a-layout-header>
      <a-layout-content
        style="margin: 24px; padding: 24px; background: #fff; min-height: 280px"
        @click.capture="handleContentClick"
      >
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>

  <a-modal
    v-model:open="imagePreviewVisible"
    title="图片预览"
    :footer="null"
    width="80vw"
    centered
    destroy-on-close
  >
    <div class="preview-modal-body">
      <img v-if="imagePreviewSrc" :src="imagePreviewSrc" alt="图片预览" class="preview-modal-image" />
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()
const imagePreviewVisible = ref(false)
const imagePreviewSrc = ref('')

const currentSystem = ref('management')

watch(
  () => route.path,
  (newPath) => {
    if (newPath.startsWith('/management')) {
      currentSystem.value = 'management'
    } else if (newPath.startsWith('/implementation')) {
      currentSystem.value = 'implementation'
    }
  },
  { immediate: true }
)

const handleSystemChange = () => {
  if (currentSystem.value === 'management') {
    router.push('/management/dispatch/center')
  } else {
    router.push('/implementation/map/list')
  }
}

const handleContentClick = (event: MouseEvent) => {
  const container = event.currentTarget as HTMLElement | null
  const target = event.target as HTMLElement | null
  if (!container || !target) return
  const image = target.closest('img') as HTMLImageElement | null
  if (!image || !container.contains(image)) return
  if (!image.src) return
  imagePreviewSrc.value = image.src
  imagePreviewVisible.value = true
}

// 开放的菜单
const openKeys = computed(() => {
  if (currentSystem.value === 'management') {
    return ['management-plan', 'management-dispatch', 'management-task', 'management-exception', 'management-report']
  }
  return ['implementation-map', 'implementation-point-collection', 'implementation-asset-detection', 'implementation-robot-resource', 'implementation-dispatch-config']
})

// 当前选中的菜单项
const currentKey = computed(() => {
  const path = route.path
  
  if (path.startsWith('/management/dispatch/center')) return 'management-dispatch-center'
  if (path.startsWith('/management/plan')) return 'management-plan-list'
  if (path.startsWith('/management/task/temp-list')) return 'management-task-temp-list'
  if (path.startsWith('/management/task')) return 'management-task-list'
  if (path.startsWith('/management/cockpit/view')) return 'management-cockpit-view'
  if (path.startsWith('/management/cockpit')) return 'management-cockpit-view'
  if (path.startsWith('/management/exception/list')) return 'management-exception-list'
  if (path.startsWith('/management/report/overview')) return 'management-report-overview'
  if (path.startsWith('/management/report/statistics')) return 'management-report-overview'
  if (path.startsWith('/management/report/inspection-point-analysis')) return 'management-report-inspection-point-analysis'
  if (path.startsWith('/management/report/facility-device-analysis')) return 'management-report-facility-device-analysis'
  if (path.startsWith('/management/report/gas-analysis')) return 'management-report-gas-analysis'
  if (path.startsWith('/management/report/safety-behavior-analysis')) return 'management-report-safety-behavior-analysis'

  if (path.startsWith('/implementation/map/list')) return 'implementation-map-list'
  if (path.startsWith('/implementation/map/editor')) return 'implementation-map-list'
  if (path.startsWith('/implementation/map/point-manage')) {
    return route.query.tab === 'inspection' ? 'implementation-point' : 'implementation-map-point-manage'
  }
  if (path.startsWith('/implementation/map/area-manage')) return 'implementation-map-area-manage'
  if (path.startsWith('/implementation/robot/list')) return 'implementation-robot-list'
  if (path.startsWith('/implementation/robot/simulation')) return 'implementation-robot-simulation'
  if (path.startsWith('/implementation/point/list')) return 'implementation-point'
  if (path.startsWith('/implementation/point/create')) return 'implementation-point'
  if (path.startsWith('/implementation/point/detail')) return 'implementation-point'
  if (path.startsWith('/implementation/point/edit')) return 'implementation-point'
  if (path.startsWith('/implementation/point/form')) return 'implementation-point'
  if (path.startsWith('/implementation/device/list')) return 'implementation-device'
  if (path.startsWith('/implementation/device/component-usage')) return 'implementation-device-component-usage'
  if (path.startsWith('/implementation/device/installation-list')) return 'implementation-installation-list'
  if (path.startsWith('/implementation/device/installation-form')) return 'implementation-installation-list'
  if (path.startsWith('/implementation/device/installation-detail')) return 'implementation-installation-list'
  if (path.startsWith('/implementation/device/iot-list')) return 'implementation-device-iot-list'
  if (path.startsWith('/implementation/device/component-types')) return 'implementation-device-component-types'
  if (path.startsWith('/implementation/device/detail')) return 'implementation-device'
  if (path.startsWith('/implementation/device/form')) return 'implementation-device'
  if (path.startsWith('/implementation/detection-item-config')) return 'implementation-detection-item-config'
  if (path.startsWith('/implementation/metric/list')) return 'implementation-metric'
  if (path.startsWith('/implementation/dispatch/rule-config')) return 'implementation-dispatch-rule-config'
  if (path.startsWith('/implementation/dispatch/resource-config')) return 'implementation-dispatch-resource-config'
  if (path.startsWith('/implementation/dispatch/cockpit')) return 'management-cockpit-view'
  if (path.startsWith('/implementation/dispatch/notify-config')) return 'implementation-dispatch-notify-config'
  if (path.startsWith('/implementation/dispatch/edge-inspection')) return 'implementation-dispatch-edge-inspection'

  // 默认值
  return currentSystem.value === 'management' ? 'management-dispatch-center' : 'implementation-map-list'
})
</script>

<style scoped lang="css">.logo {
  height: 32px;
  margin: 16px;
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 64px;
}
.header-content .title {
  margin: 0;
  font-size: 18px;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.85);
}
.header-content .system-switcher {
  margin-left: 24px;
}
.preview-modal-body {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 260px;
  max-height: 72vh;
  overflow: auto;
}
.preview-modal-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}
</style>
