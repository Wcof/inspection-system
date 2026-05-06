<template>
  <div class="inspection-point-detail">
    <a-page-header
      :title="`${form.name || currentPoint?.name || '巡检点'}详情`"
      sub-title="基础信息、覆盖对象、采集位、检测配置、覆盖检查与执行记录统一在此查看和维护。"
      @back="goBack"
    >
      <template #extra>
        <a-space>
          <a-button @click="goToConfig">进入配置页</a-button>
          <a-button type="primary" @click="handleSave">保存基础信息</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-card style="margin-top: 16px">
      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="8"><a-form-item label="点位名称" required><a-input v-model:value="form.name" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="点位编码" required><a-input v-model:value="form.code" /></a-form-item></a-col>
          <a-col :span="8">
            <a-form-item label="业务类型" required>
              <a-select v-model:value="form.pointBizType">
                <a-select-option value="inspection">巡检点</a-select-option>
                <a-select-option value="charging">充电站</a-select-option>
                <a-select-option value="maintenance">维修站</a-select-option>
                <a-select-option value="standby">停靠点</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="巡检模式" :required="form.pointBizType === 'inspection'">
              <a-select v-model:value="form.inspectionMode" :disabled="form.pointBizType !== 'inspection'">
                <a-select-option value="fixed">固定巡检点（停车检查）</a-select-option>
                <a-select-option value="area">区域巡检点（不强制停车）</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="所属地图">
              <a-select v-model:value="form.mapId" disabled>
                <a-select-option v-for="map in inspectionStore.inspectionMaps" :key="map.id" :value="map.id">{{ map.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="所属区域">
              <a-select v-model:value="form.areaId" allow-clear @change="onAreaChange">
                <a-select-option v-for="area in areaOptions" :key="area.id" :value="area.id">{{ area.name }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="8"><a-form-item label="装置区 / 分区"><a-input v-model:value="form.workAreaName" /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="地图坐标"><a-input :value="coordinateText" disabled /></a-form-item></a-col>
          <a-col :span="8"><a-form-item label="车头朝向"><a-input-number v-model:value="form.yaw" :min="0" :max="360" style="width: 100%" /></a-form-item></a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="4"><a-form-item label="可达"><a-switch v-model:checked="constraintForm.reachable" /></a-form-item></a-col>
          <a-col :span="4"><a-form-item label="允许倒车"><a-switch v-model:checked="constraintForm.reverseRequired" /></a-form-item></a-col>
          <a-col :span="4"><a-form-item label="允许掉头"><a-switch v-model:checked="constraintForm.turnAroundRequired" /></a-form-item></a-col>
          <a-col :span="4"><a-form-item label="窄路"><a-switch v-model:checked="constraintForm.narrowRoad" /></a-form-item></a-col>
          <a-col :span="4"><a-form-item label="坡道"><a-switch v-model:checked="constraintForm.slope" /></a-form-item></a-col>
          <a-col :span="4"><a-form-item label="便桥"><a-switch v-model:checked="constraintForm.bridgeRequired" /></a-form-item></a-col>
        </a-row>
      </a-form>
    </a-card>

    <a-row :gutter="[16, 16]" style="margin-top: 16px">
      <a-col :span="24">
        <a-card title="覆盖对象">
          <a-table :columns="coverageColumns" :data-source="coverageRows" row-key="id" :pagination="false" />
        </a-card>
      </a-col>

      <a-col :span="24">
        <a-card title="采集位">
          <a-table :columns="poseColumns" :data-source="poseRows" row-key="id" :pagination="false" />
        </a-card>
      </a-col>

      <a-col :span="24">
        <a-card title="检测配置">
          <a-table :columns="detectionColumns" :data-source="detectionRows" row-key="id" :pagination="false" />
        </a-card>
      </a-col>

      <a-col :span="24">
        <a-card title="覆盖检查">
          <a-descriptions bordered :column="4" size="small">
            <a-descriptions-item label="覆盖对象">{{ coverageRows.length }}</a-descriptions-item>
            <a-descriptions-item label="采集位">{{ poseRows.length }}</a-descriptions-item>
            <a-descriptions-item label="检测配置">{{ detectionRows.length }}</a-descriptions-item>
            <a-descriptions-item label="检查结果">
              <a-tag :color="coverageCheckStatus.color">{{ coverageCheckStatus.text }}</a-tag>
            </a-descriptions-item>
          </a-descriptions>
          <a-alert
            style="margin-top: 12px"
            :type="coverageCheckStatus.type"
            show-icon
            :message="coverageCheckStatus.message"
            :description="coverageCheckStatus.description"
          />
        </a-card>
      </a-col>

      <a-col :span="24">
        <a-card title="执行记录">
          <a-table :columns="recordColumns" :data-source="executionRows" row-key="id" :pagination="false" />
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useInspectionStore } from '@/stores/inspection'
import type { InspectionPoint, ParkingPointConstraint } from '@/types/inspection'
import { CalibrationStatus, InspectionPointType, PositionSource } from '@/types/inspection'
import { getDetectionItemConfigs } from '@/views/implementation/detection-item-config/model'

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()

const currentPoint = computed(() => inspectionStore.inspectionPoints.find(item => item.id === String(route.params.id)))

const form = reactive({
  id: '',
  name: '',
  code: '',
  mapId: '',
  areaId: '',
  areaName: '',
  pointBizType: 'inspection' as NonNullable<InspectionPoint['pointBizType']>,
  inspectionMode: 'fixed' as NonNullable<InspectionPoint['inspectionMode']>,
  workAreaName: '',
  yaw: 0
})

const constraintForm = reactive<ParkingPointConstraint>({
  reachable: true,
  reverseRequired: false,
  turnAroundRequired: false,
  narrowRoad: false,
  slope: false,
  bridgeRequired: false,
  detourRequired: false
})

const coverageColumns = [
  { title: '对象名称', dataIndex: 'name', key: 'name' },
  { title: '对象类型', dataIndex: 'typeText', key: 'typeText', width: 140 },
  { title: '所属设施', dataIndex: 'deviceName', key: 'deviceName', width: 180 },
  { title: '覆盖类型', dataIndex: 'coverageTypeText', key: 'coverageTypeText', width: 110 },
  { title: '覆盖状态', dataIndex: 'coverageStatusText', key: 'coverageStatusText', width: 110 },
  { title: '必须覆盖', dataIndex: 'requiredCoverageText', key: 'requiredCoverageText', width: 110 },
  { title: '备注', dataIndex: 'remark', key: 'remark' }
]

const poseColumns = [
  { title: '停车点', dataIndex: 'parkingPointName', key: 'parkingPointName', width: 160 },
  { title: '采集位目标', dataIndex: 'targetName', key: 'targetName' },
  { title: '对象类型', dataIndex: 'targetTypeText', key: 'targetTypeText', width: 120 },
  { title: '采集方向', dataIndex: 'directionText', key: 'directionText', width: 110 },
  { title: '采集设备', dataIndex: 'methodText', key: 'methodText', width: 110 },
  { title: '目标距离', dataIndex: 'distanceText', key: 'distanceText', width: 110 },
  { title: '可采条件', dataIndex: 'collectableCondition', key: 'collectableCondition' }
]

const detectionColumns = [
  { title: '检测主体', dataIndex: 'subjectName', key: 'subjectName' },
  { title: '主体类型', dataIndex: 'subjectTypeText', key: 'subjectTypeText', width: 120 },
  { title: '检测规则', dataIndex: 'ruleName', key: 'ruleName' },
  { title: '采集位', dataIndex: 'collectionPoseName', key: 'collectionPoseName', width: 220 },
  { title: '覆盖要求', dataIndex: 'requiredCoverageText', key: 'requiredCoverageText', width: 110 },
  { title: '失败策略', dataIndex: 'failureStrategyText', key: 'failureStrategyText', width: 120 },
  { title: '状态', dataIndex: 'enabledText', key: 'enabledText', width: 90 }
]

const recordColumns = [
  { title: '任务名称', dataIndex: 'taskName', key: 'taskName' },
  { title: '执行时间', dataIndex: 'executedAtText', key: 'executedAtText', width: 190 },
  { title: '结果摘要', dataIndex: 'resultSummary', key: 'resultSummary' },
  { title: '执行载体', dataIndex: 'executor', key: 'executor', width: 140 }
]

const areaOptions = computed(() => {
  const map = inspectionStore.inspectionMaps.find(item => item.id === form.mapId)
  return map?.regions || []
})

const coordinateText = computed(() => {
  const point = currentPoint.value
  return point?.mapPosition ? `${point.mapPosition.x}, ${point.mapPosition.y}` : '-'
})

const coverageRows = computed(() => (currentPoint.value?.coverageObjects || []).map((item) => ({
  ...item,
  typeText: getCoverageTypeText(item.type),
  deviceName: item.deviceId ? inspectionStore.inspectionDevices.find(device => device.id === item.deviceId)?.name || '-' : item.areaName || '-',
  coverageTypeText: ({ primary: '主覆盖', secondary: '辅助覆盖', backup: '备用覆盖' } as Record<string, string>)[item.coverageType] || item.coverageType,
  coverageStatusText: ({ coverable: '可覆盖', partial: '部分覆盖', uncoverable: '不可覆盖' } as Record<string, string>)[item.coverageStatus] || item.coverageStatus,
  requiredCoverageText: item.requiredCoverage ? '是' : '否'
})))

const poseRows = computed(() => (currentPoint.value?.parkingPoints || []).flatMap((parking) =>
  parking.collectionPoses.map((pose) => ({
    ...pose,
    parkingPointName: parking.name,
    targetTypeText: getCoverageTypeText(pose.targetType),
    directionText: ({ front: '正拍', side: '侧拍', oblique: '斜拍', near: '近拍', overview: '全景' } as Record<string, string>)[pose.direction] || pose.direction,
    methodText: ({ optical: '光学', thermal: '热成像', gas: '气体', safety: '安全行为', multi_spectrum: '多光谱' } as Record<string, string>)[pose.method] || pose.method,
    distanceText: `${pose.distanceMeter}m`
  }))
))

const detectionRows = computed(() => {
  const rules = getDetectionItemConfigs()
  const poseMap = new Map(poseRows.value.map(item => [item.id, `${item.parkingPointName} / ${item.targetName}`]))
  return (currentPoint.value?.detectionConfigs || []).map((config) => {
    const rule = rules.find(item => item.id === config.ruleId)
    return {
      ...config,
      subjectTypeText: getCoverageTypeText(config.subjectType),
      ruleName: rule?.name || config.ruleId,
      collectionPoseName: config.collectionPoseId ? poseMap.get(config.collectionPoseId) || '-' : '-',
      requiredCoverageText: config.requiredCoverage ? '必须覆盖' : '可选覆盖',
      failureStrategyText: ({ manual_review: '人工复核', supplement_task: '生成补检', mark_uninspectable: '标记不可检' } as Record<string, string>)[config.failureStrategy] || config.failureStrategy,
      enabledText: config.enabled ? '启用' : '停用'
    }
  })
})

const executionRows = computed(() => (currentPoint.value?.executionRecords || []).map(item => ({
  ...item,
  executedAtText: new Date(item.executedAt).toLocaleString()
})))

const coverageCheckStatus = computed(() => {
  const point = currentPoint.value
  const coverageCount = point?.coverageObjects?.length || 0
  const poseCount = poseRows.value.length
  const configCount = detectionRows.value.filter(item => item.enabled).length
  if (!coverageCount) {
    return { text: '未配置对象', color: 'red', type: 'warning' as const, message: '当前巡检点未配置覆盖对象', description: '请先进入配置页，选择设施、部件或连接对象作为巡检覆盖范围。' }
  }
  if (!poseCount || !configCount) {
    return { text: '存在漏配', color: 'orange', type: 'warning' as const, message: '当前巡检点采集位或检测配置不完整', description: '请补齐采集位和检测配置，避免执行时出现漏检。' }
  }
  return { text: '配置完整', color: 'green', type: 'success' as const, message: '当前巡检点覆盖配置完整', description: '已具备覆盖对象、采集位和检测配置，可用于任务执行。' }
})

function loadDetail() {
  inspectionStore.initialize()
  const point = currentPoint.value
  if (!point) return
  form.id = point.id
  form.name = point.name
  form.code = point.code
  form.mapId = point.mapId
  form.areaId = point.areaId || ''
  form.areaName = point.areaName || ''
  form.pointBizType = point.pointBizType || 'inspection'
  form.inspectionMode = point.inspectionMode || (point.pointType === 'area' ? 'area' : 'fixed')
  form.workAreaName = point.workAreaName || ''
  form.yaw = Number(point.mapPosition?.yaw || 0)
  Object.assign(constraintForm, point.parkingPoints?.[0]?.constraint || constraintForm)
}

function handleSave() {
  const point = currentPoint.value
  if (!point || !form.name.trim() || !form.code.trim()) {
    message.error('请补充点位名称和编码')
    return
  }
  const nextParkingPoints = (point.parkingPoints || []).map((parking, index) => ({
    ...parking,
    constraint: index === 0 ? { ...constraintForm } : parking.constraint,
    position: {
      ...parking.position,
      yaw: index === 0 ? form.yaw : parking.position.yaw
    }
  }))
  inspectionStore.saveInspectionPoint({
    ...point,
    name: form.name.trim(),
    code: form.code.trim(),
    areaId: form.areaId || undefined,
    areaName: form.areaName || '',
    pointBizType: form.pointBizType,
    inspectionMode: form.inspectionMode,
    pointType: form.inspectionMode === 'area' ? InspectionPointType.AREA : InspectionPointType.FIXED,
    description: `[${getBizTypeText(form.pointBizType)}] ${form.name.trim()}`,
    workAreaName: form.workAreaName || form.areaName,
    parkingPoints: nextParkingPoints,
    updatedAt: new Date(),
    calibratedAt: point.calibratedAt,
    calibrationStatus: point.calibrationStatus || CalibrationStatus.PENDING,
    positionSource: point.positionSource || PositionSource.MAP_PICK
  })
  message.success('巡检点基础信息已保存')
}

function onAreaChange(value: string) {
  const area = areaOptions.value.find(item => item.id === value)
  form.areaName = area?.name || ''
}

function getCoverageTypeText(type: string) {
  return ({
    asset: '设施',
    component: '设施部件',
    connection: '连接部位',
    area_environment: '区域环境',
    safety_behavior: '人员行为'
  } as Record<string, string>)[type] || type
}

function getBizTypeText(type: string) {
  return ({ inspection: '巡检点', charging: '充电站', maintenance: '维修站', standby: '停靠点' } as Record<string, string>)[type] || '巡检点'
}

function goToConfig() {
  router.push(`/implementation/point/create/${route.params.id}`)
}

function goBack() {
  router.push({ path: '/implementation/map/point-manage', query: { tab: 'inspection' } })
}

onMounted(loadDetail)
</script>

<style scoped lang="css">
.inspection-point-detail {
  width: 100%;
}
</style>
