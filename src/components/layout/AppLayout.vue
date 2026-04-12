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
                调度台
              </span>
            </template>
            <a-menu-item key="management-dispatch-center">
              <router-link to="/management/dispatch/center">总调度台</router-link>
            </a-menu-item>
            <a-menu-item key="management-dispatch-plan-list">
              <router-link to="/management/plan/list">巡检计划</router-link>
            </a-menu-item>
            <a-menu-item key="management-dispatch-task-list">
              <router-link to="/management/task/list">巡检任务</router-link>
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
              <router-link to="/management/exception/list">异常列表</router-link>
            </a-menu-item>
          </a-sub-menu>
          <a-sub-menu key="management-report">
            <template #title>
              <span>
                <a-icon type="line-chart" />
                报表统计
              </span>
            </template>
            <a-menu-item key="management-report-statistics">
              <router-link to="/management/report/statistics">巡检分析</router-link>
            </a-menu-item>
          </a-sub-menu>
        </template>

        <template v-else-if="currentSystem === 'implementation'">
          <a-sub-menu key="implementation-map">
            <template #title>
              <span>
                <a-icon type="environment" />
                地图管理
              </span>
            </template>
            <a-menu-item key="implementation-map-list">
              <router-link to="/implementation/map/list">地图列表</router-link>
            </a-menu-item>
          </a-sub-menu>
          <a-sub-menu key="implementation-robot">
            <template #title>
              <span>
                <a-icon type="robot" />
                机器人管理
              </span>
            </template>
            <a-menu-item key="implementation-robot-list">
              <router-link to="/implementation/robot/list">机器人管理</router-link>
            </a-menu-item>
            <a-menu-item key="implementation-robot-simulation">
              <router-link to="/implementation/robot/simulation">机器人仿真</router-link>
            </a-menu-item>
          </a-sub-menu>
          <a-sub-menu key="implementation-point-device">
            <template #title>
              <span>
                <a-icon type="appstore" />
                点位与设备管理
              </span>
            </template>
            <a-menu-item key="implementation-point">
              <router-link to="/implementation/point/list">点位管理</router-link>
            </a-menu-item>
            <a-menu-item key="implementation-calibration">
              <router-link to="/implementation/calibration/list">校准记录</router-link>
            </a-menu-item>
            <a-menu-item key="implementation-device">
              <router-link to="/implementation/device/list">设施设备管理</router-link>
            </a-menu-item>
            <a-menu-item key="implementation-metric">
              <router-link to="/implementation/metric/list">检测项管理</router-link>
            </a-menu-item>
          </a-sub-menu>
          <a-sub-menu key="implementation-dispatch-config">
            <template #title>
              <span>
                <a-icon type="setting" />
                调度配置
              </span>
            </template>
            <a-menu-item key="implementation-dispatch-rule-config">
              <router-link to="/implementation/dispatch/rule-config">调度规则配置</router-link>
            </a-menu-item>
            <a-menu-item key="implementation-dispatch-resource-config">
              <router-link to="/implementation/dispatch/resource-config">资源基础配置</router-link>
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
      <a-layout-content style="margin: 24px; padding: 24px; background: #fff; min-height: 280px">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

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

// 开放的菜单
const openKeys = computed(() => {
  if (currentSystem.value === 'management') {
    return ['management-dispatch', 'management-exception', 'management-report']
  }
  return ['implementation-map', 'implementation-robot', 'implementation-point-device', 'implementation-dispatch-config']
})

// 当前选中的菜单项
const currentKey = computed(() => {
  const path = route.path
  
  if (path.startsWith('/management/dispatch/center')) return 'management-dispatch-center'
  if (path.startsWith('/management/plan/list')) return 'management-dispatch-plan-list'
  if (path.startsWith('/management/task/list')) return 'management-dispatch-task-list'
  if (path.startsWith('/management/exception/list')) return 'management-exception-list'
  if (path.startsWith('/management/report/statistics')) return 'management-report-statistics'

  if (path.startsWith('/implementation/map/list')) return 'implementation-map-list'
  if (path.startsWith('/implementation/map/editor')) return 'implementation-map-list'
  if (path.startsWith('/implementation/map/point-manage')) return 'implementation-map-list'
  if (path.startsWith('/implementation/robot/list')) return 'implementation-robot-list'
  if (path.startsWith('/implementation/robot/simulation')) return 'implementation-robot-simulation'
  if (path.startsWith('/implementation/point/list')) return 'implementation-point'
  if (path.startsWith('/implementation/calibration/list')) return 'implementation-calibration'
  if (path.startsWith('/implementation/device/list')) return 'implementation-device'
  if (path.startsWith('/implementation/metric/list')) return 'implementation-metric'
  if (path.startsWith('/implementation/dispatch/rule-config')) return 'implementation-dispatch-rule-config'
  if (path.startsWith('/implementation/dispatch/resource-config')) return 'implementation-dispatch-resource-config'

  // 默认值
  return currentSystem.value === 'management' ? 'management-dispatch-center' : 'implementation-map-list'
})
</script>

<style scoped lang="scss">
.logo {
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
  
  .title {
    margin: 0;
    font-size: 18px;
    font-weight: 500;
    color: rgba(0, 0, 0, 0.85);
  }

  .system-switcher {
    margin-left: 24px;
  }
}
</style>
