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
        <!-- 1. 总调度台 -->
        <a-sub-menu key="dispatch-center">
          <template #title>
            <span>
              <a-icon type="control" />
              总调度台
            </span>
          </template>
          <a-menu-item key="dispatch-center-main">
            <router-link to="/management/dispatch/center">总调度台</router-link>
          </a-menu-item>
          <a-menu-item key="dispatch-console">
            <router-link to="/management/dispatch/console">控制台</router-link>
          </a-menu-item>
        </a-sub-menu>

        <!-- 2. 地图与路网 -->
        <a-sub-menu key="map-space">
          <template #title>
            <span>
              <a-icon type="environment" />
              地图与路网
            </span>
          </template>
          <a-menu-item key="map-list">
            <router-link to="/implementation/map/list">地图管理</router-link>
          </a-menu-item>
          <a-menu-item key="map-road-network">
            <router-link to="/implementation/map/road-network">路网管理</router-link>
          </a-menu-item>
          <a-menu-item key="map-area-manage">
            <router-link to="/implementation/map/area-manage">区域管理</router-link>
          </a-menu-item>
          <a-menu-item key="map-point-manage">
            <router-link to="/implementation/map/point-manage">点位管理</router-link>
          </a-menu-item>
        </a-sub-menu>

        <!-- 3. 设施设备管理 -->
        <a-sub-menu key="facility-device">
          <template #title>
            <span>
              <a-icon type="appstore" />
              设施设备管理
            </span>
          </template>
          <a-menu-item key="installation-list">
            <router-link to="/implementation/device/installation-list">装置管理</router-link>
          </a-menu-item>
          <a-menu-item key="device-list">
            <router-link to="/implementation/device/list">设施设备</router-link>
          </a-menu-item>
          <a-menu-item key="component-usage">
            <router-link to="/implementation/device/component-usage">巡检对象</router-link>
          </a-menu-item>
          <a-menu-item key="robot-list">
            <router-link to="/implementation/robot/list">机器人管理</router-link>
          </a-menu-item>
        </a-sub-menu>

        <!-- 4. 安全与检测 -->
        <a-sub-menu key="detection-rules">
          <template #title>
            <span>
              <a-icon type="cluster" />
              安全与检测
            </span>
          </template>
           <a-menu-item key="metric-list">
            <router-link to="/implementation/metric/list">检测对象</router-link>
          </a-menu-item>
          <a-menu-item key="detection-item-config">
            <router-link to="/implementation/detection-item-config/list">检测规则配置</router-link>
          </a-menu-item>
          <a-menu-item key="config-safety-strategy">
            <router-link to="/implementation/safety-strategy/list">安全策略配置</router-link>
          </a-menu-item>
        </a-sub-menu>

        <!-- 5. 规划与执行 -->
        <a-sub-menu key="plan-execution">
          <template #title>
            <span>
              <a-icon type="schedule" />
              规划与执行
            </span>
          </template>
          <a-menu-item key="plan-list">
            <router-link to="/management/plan/list">巡检规划</router-link>
          </a-menu-item>
          <a-menu-item key="task-list">
            <router-link to="/management/task/list">执行任务</router-link>
          </a-menu-item>
          <a-menu-item key="task-temp-list">
            <router-link to="/management/task/temp-list">临时任务</router-link>
          </a-menu-item>
        </a-sub-menu>

        <!-- 6. 异常中心 -->
        <a-sub-menu key="exception-center">
          <template #title>
            <span>
              <a-icon type="warning" />
              异常中心
            </span>
          </template>
          <a-menu-item key="exception-list">
            <router-link to="/management/exception/list">异常告警</router-link>
          </a-menu-item>
        </a-sub-menu>

        <!-- 7. 报表统计 -->
        <a-sub-menu key="report-stats">
          <template #title>
            <span>
              <a-icon type="line-chart" />
              报表统计
            </span>
          </template>
          <a-menu-item key="report-overview">
            <router-link to="/management/report/overview">统计总览</router-link>
          </a-menu-item>
          <a-menu-item key="report-inspection-point">
            <router-link to="/management/report/inspection-point-analysis">巡检点分析</router-link>
          </a-menu-item>
          <a-menu-item key="report-facility-device">
            <router-link to="/management/report/facility-device-analysis">设施设备分析</router-link>
          </a-menu-item>
          <a-menu-item key="report-gas">
            <router-link to="/management/report/gas-analysis">气体分析</router-link>
          </a-menu-item>
          <a-menu-item key="report-safety-behavior">
            <router-link to="/management/report/safety-behavior-analysis">安全行为分析</router-link>
          </a-menu-item>
        </a-sub-menu>

        <!-- 8. 系统配置 -->
        <a-sub-menu key="system-config">
          <template #title>
            <span>
              <a-icon type="setting" />
              系统配置
            </span>
          </template>
          <a-menu-item key="config-iot-list">
            <router-link to="/implementation/device/iot-list">设备管理</router-link>
          </a-menu-item>
          <a-menu-item key="config-dispatch-rule">
            <router-link to="/implementation/dispatch/rule-config">调度规则配置</router-link>
          </a-menu-item>
          <a-menu-item key="config-resource">
            <router-link to="/implementation/dispatch/resource-config">资源基础配置</router-link>
          </a-menu-item>
          <a-menu-item key="config-component-types">
            <router-link to="/implementation/device/component-types">巡检对象类型配置</router-link>
          </a-menu-item>
          <a-menu-item key="config-notify">
            <router-link to="/implementation/dispatch/notify-config">通知配置</router-link>
          </a-menu-item>
          <a-menu-item key="config-edge-inspection">
            <router-link to="/implementation/dispatch/edge-inspection">边巡边检</router-link>
          </a-menu-item>
        </a-sub-menu>
      </a-menu>
    </a-layout-sider>
    <a-layout>
      <a-layout-header style="background: #fff; padding: 0 24px; border-bottom: 1px solid #f0f0f0">
        <div class="header-content">
          <h1 class="title">安全生产巡检任务管理系统</h1>
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
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()
const imagePreviewVisible = ref(false)
const imagePreviewSrc = ref('')

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

// 当前展开的菜单
const openKeys = computed(() => {
  const path = route.path
  const keys: string[] = []

  if (path.startsWith('/implementation/map')) keys.push('map-space')
  if (path.startsWith('/implementation/device') || path.startsWith('/implementation/robot')) keys.push('facility-device')
  if (path.startsWith('/implementation/detection-item-config') || path.startsWith('/implementation/metric') || path.startsWith('/implementation/safety-strategy')) keys.push('detection-rules')
  if (path.startsWith('/management/dispatch')) keys.push('dispatch-center')
  if (path.startsWith('/management/plan') || path.startsWith('/management/task')) keys.push('plan-execution')
  if (path.startsWith('/management/exception')) keys.push('exception-center')
  if (path.startsWith('/management/report')) keys.push('report-stats')
  if (path.startsWith('/implementation/device/iot') || path.startsWith('/implementation/device/component-types') || path.startsWith('/implementation/dispatch')) keys.push('system-config')

  return keys
})

// 当前选中的菜单项
const currentKey = computed(() => {
  const path = route.path

  // 地图与路网
  if (path.startsWith('/implementation/map/list')) return 'map-list'
  if (path.startsWith('/implementation/map/editor')) return 'map-list'
  if (path.startsWith('/implementation/map/point-manage')) return 'map-point-manage'
  if (path.startsWith('/implementation/map/area-manage')) return 'map-area-manage'
  if (path.startsWith('/implementation/map/road-network')) return 'map-road-network'
  if (path.startsWith('/implementation/point/list')) return 'map-point-manage'
  if (path.startsWith('/implementation/point/create')) return 'map-point-manage'
  if (path.startsWith('/implementation/point/detail')) return 'map-point-manage'
  if (path.startsWith('/implementation/point/edit')) return 'map-point-manage'
  if (path.startsWith('/implementation/point/form')) return 'map-point-manage'

  // 设施设备管理
  if (path.startsWith('/implementation/device/installation-list')) return 'installation-list'
  if (path.startsWith('/implementation/device/installation-form')) return 'installation-list'
  if (path.startsWith('/implementation/device/installation-detail')) return 'installation-list'
  if (path.startsWith('/implementation/device/list')) return 'device-list'
  if (path.startsWith('/implementation/device/detail')) return 'device-list'
  if (path.startsWith('/implementation/device/form')) return 'device-list'
  if (path.startsWith('/implementation/device/component-usage')) return 'component-usage'
  if (path.startsWith('/implementation/device/detection-config')) return 'device-list'
  if (path.startsWith('/implementation/robot')) return 'robot-list'

  // 检测规则
  if (path.startsWith('/implementation/detection-item-config')) return 'detection-item-config'
  if (path.startsWith('/implementation/metric')) return 'metric-list'

  // 总调度台
  if (path.startsWith('/management/dispatch/center')) return 'dispatch-center-main'
  if (path.startsWith('/management/dispatch/console')) return 'dispatch-console'

  // 规划与执行
  if (path.startsWith('/management/plan')) return 'plan-list'
  if (path.startsWith('/management/task/temp-list')) return 'task-temp-list'
  if (path.startsWith('/management/task')) return 'task-list'

  // 异常中心
  if (path.startsWith('/management/exception')) return 'exception-list'

  // 报表统计
  if (path.startsWith('/management/report/overview')) return 'report-overview'
  if (path.startsWith('/management/report/statistics')) return 'report-overview'
  if (path.startsWith('/management/report/inspection-point-analysis')) return 'report-inspection-point'
  if (path.startsWith('/management/report/facility-device-analysis')) return 'report-facility-device'
  if (path.startsWith('/management/report/gas-analysis')) return 'report-gas'
  if (path.startsWith('/management/report/safety-behavior-analysis')) return 'report-safety-behavior'

  // 系统配置
  if (path.startsWith('/implementation/device/iot-list')) return 'config-iot-list'
  if (path.startsWith('/implementation/device/component-types')) return 'config-component-types'
  if (path.startsWith('/implementation/dispatch/rule-config')) return 'config-dispatch-rule'
  if (path.startsWith('/implementation/dispatch/resource-config')) return 'config-resource'
  if (path.startsWith('/implementation/dispatch/notify-config')) return 'config-notify'
  if (path.startsWith('/implementation/dispatch/edge-inspection')) return 'config-edge-inspection'
  if (path.startsWith('/implementation/safety-strategy')) return 'config-safety-strategy'

  // 默认
  return 'dispatch-center-main'
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
