<template>
  <a-dropdown :trigger="['click']">
    <a-button size="small"><AppstoreOutlined /> 分屏</a-button>
    <template #overlay>
      <a-menu @click="(e: any) => $emit('change', e.key)" :selected-keys="[layout]">
        <a-menu-item key="single2d">单画面 - 二维地图</a-menu-item>
        <a-menu-item key="singleCloud">单画面 - 点云图</a-menu-item>
        <a-menu-item key="pip2dMain">画中画 - 二维主画面</a-menu-item>
        <a-menu-item key="pipCloudMain">画中画 - 点云主画面</a-menu-item>
        <a-menu-item key="verticalEqual">左右等分</a-menu-item>
        <a-menu-item key="horizontalEqual">上下等分</a-menu-item>
      </a-menu>
    </template>
  </a-dropdown>
</template>

<script setup lang="ts">
import { AppstoreOutlined } from '@ant-design/icons-vue'

defineProps<{
  layout: string
}>()

defineEmits<{
  (e: 'change', layout: string): void
}>()
</script>
