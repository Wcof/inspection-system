import { ref } from 'vue'
import type { RoadSplitLayout } from '@/types/road-editor'

/**
 * 分屏布局管理 composable
 */
export function useRoadSplitLayout() {
  const splitLayout = ref<RoadSplitLayout>('single2d')
  const pointCloudAvailable = ref(true)
  const pointCloudDisabledReason = ref<'network' | 'performance' | 'manual' | null>(null)

  function setLayout(layout: RoadSplitLayout) {
    splitLayout.value = layout
  }

  function disablePointCloud(reason: 'network' | 'performance' | 'manual') {
    pointCloudAvailable.value = false
    pointCloudDisabledReason.value = reason
  }

  function enablePointCloud() {
    pointCloudAvailable.value = true
    pointCloudDisabledReason.value = null
  }

  function isSplit(): boolean {
    return splitLayout.value !== 'single2d' && splitLayout.value !== 'singleCloud'
  }

  function showMap2D(): boolean {
    return splitLayout.value !== 'singleCloud'
  }

  function showPointCloudView(): boolean {
    return splitLayout.value !== 'single2d' && pointCloudAvailable.value
  }

  const splitLayoutLabel = (layout: RoadSplitLayout): string => {
    const labels: Record<RoadSplitLayout, string> = {
      'single2d': '单画面 - 二维地图',
      'singleCloud': '单画面 - 点云图',
      'pip2dMain': '画中画 - 二维主画面',
      'pipCloudMain': '画中画 - 点云主画面',
      'verticalEqual': '左右等分',
      'horizontalEqual': '上下等分'
    }
    return labels[layout]
  }

  return {
    splitLayout, pointCloudAvailable, pointCloudDisabledReason,
    setLayout, disablePointCloud, enablePointCloud,
    isSplit, showMap2D, showPointCloudView,
    splitLayoutLabel
  }
}
