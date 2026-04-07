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
        <a-sub-menu key="map">
          <template #title>
            <span>
              <a-icon type="environment" />
              地图管理
            </span>
          </template>
          <a-menu-item key="map-map-list">
            <router-link to="/map/map-list">地图列表</router-link>
          </a-menu-item>
          <a-menu-item key="map-point-manage">
            <router-link to="/map/point-manage">点位管理</router-link>
          </a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="facility">
          <template #title>
            <span>
              <a-icon type="appstore" />
              设施设备管理
            </span>
          </template>
          <a-menu-item key="facility-robot">
            <router-link to="/facility/robot">机器人管理</router-link>
          </a-menu-item>
          <a-menu-item key="facility-inspection-point">
            <router-link to="/facility/inspection-point">巡检点管理</router-link>
          </a-menu-item>
          <a-menu-item key="facility-device">
            <router-link to="/facility/device">设备设施</router-link>
          </a-menu-item>
        </a-sub-menu>
        <a-sub-menu key="smart-inspection">
          <template #title>
            <span>
              <a-icon type="line-chart" />
              智能巡检
            </span>
          </template>

          <a-menu-item key="smart-inspection-plan">
            <router-link to="/smart-inspection/plan">巡检计划</router-link>
          </a-menu-item>
          <a-menu-item key="smart-inspection-task">
            <router-link to="/smart-inspection/task">巡检任务</router-link>
          </a-menu-item>
          <a-menu-item key="smart-inspection-statistics">
            <router-link to="/smart-inspection/statistics">巡检统计</router-link>
          </a-menu-item>
          <a-menu-item key="smart-inspection-exception">
            <router-link to="/smart-inspection/exception">异常日志</router-link>
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
      <a-layout-content style="margin: 24px; padding: 24px; background: #fff; min-height: 280px">
        <router-view />
      </a-layout-content>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const openKeys = ['map', 'facility', 'smart-inspection']

const currentKey = computed(() => {
  const path = route.path
  if (path.startsWith('/map/map-list')) return 'map-map-list'
  if (path.startsWith('/map/point-manage')) return 'map-point-manage'
  if (path.startsWith('/map')) return 'map'
  if (path.startsWith('/facility/robot')) return 'facility-robot'
  if (path.startsWith('/facility/inspection-point')) return 'facility-inspection-point'
  if (path.startsWith('/facility/device')) return 'facility-device'
  if (path.startsWith('/facility')) return 'facility'

  if (path.startsWith('/smart-inspection/plan')) return 'smart-inspection-plan'
  if (path.startsWith('/smart-inspection/task')) return 'smart-inspection-task'
  if (path.startsWith('/smart-inspection/statistics')) return 'smart-inspection-statistics'
  if (path.startsWith('/smart-inspection/exception')) return 'smart-inspection-exception'
  if (path.startsWith('/smart-inspection')) return 'smart-inspection'
  return 'map-map-list'
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
}
</style>
