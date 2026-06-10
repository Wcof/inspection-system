
<template>
  <div class="inspection-plan-form">
    <a-page-header :title="isEdit ? '编辑规划' : '新建规划'" @back="goBack" />

    <a-card style="margin-top: 16px">
      <a-alert
        type="info"
        show-icon
        style="margin-bottom: 16px"
        message="执行规划定义业务场景、规划类型、巡检区域和设施覆盖范围；总调度台负责结合风险、资源和现场约束生成具体任务。"
      />

      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="规划名称" required>
              <a-input v-model:value="form.name" placeholder="请输入规划名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="规划编码" required>
              <a-input v-model:value="form.code" placeholder="请输入规划编码" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="业务场景" required>
              <a-select v-model:value="form.businessScene">
                <a-select-option value="daily_inspection">日常巡检</a-select-option>
                <a-select-option value="hazard_screening">隐患排查</a-select-option>
                <a-select-option value="environment_check">环境检查</a-select-option>
                <a-select-option value="operation_guard">作业监护</a-select-option>
                <a-select-option value="work_ticket_guard">作业票监护</a-select-option>
                <a-select-option value="emergency_arrival">应急到场</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="规划类型" required>
              <a-select v-model:value="form.planType">
                <a-select-option value="manual">人工</a-select-option>
                <a-select-option value="auto">自动</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="状态">
              <a-select v-model:value="form.status">
                <a-select-option value="active">启用</a-select-option>
                <a-select-option value="paused">暂停</a-select-option>
                <a-select-option value="inactive">停用</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="风险优先级">
              <a-select v-model:value="form.riskLevel">
                <a-select-option value="normal">普通</a-select-option>
                <a-select-option value="warning">预警</a-select-option>
                <a-select-option value="alarm">告警</a-select-option>
                <a-select-option value="critical_alarm">严重告警</a-select-option>
                <a-select-option value="hazard">隐患</a-select-option>
                <a-select-option value="major_hazard">重大隐患</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="巡检区域" required>
              <a-select
                v-model:value="form.regionIds"
                mode="multiple"
                placeholder="请选择巡检区域"
                :max-tag-count="6"
                @change="handleRegionChange"
              >
                <a-select-option v-for="region in regionOptions" :key="region.id" :value="region.id">
                  {{ region.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="巡检装置" required>
              <a-select
                v-model:value="form.installationIds"
                mode="multiple"
                placeholder="请先选择巡检区域，再选择装置"
                :max-tag-count="6"
                :disabled="!form.regionIds.length"
                @change="handleInstallationChange"
              >
                <a-select-option v-for="installation in installationOptions" :key="installation.id" :value="installation.id">
                  {{ installation.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="巡检设施" required>
              <a-select
                v-model:value="form.facilityIds"
                mode="multiple"
                placeholder="请先选择区域和装置，再选择设施/管路"
                :max-tag-count="6"
                :disabled="!form.regionIds.length || !form.installationIds.length"
              >
                <a-select-option v-for="facility in facilityOptions" :key="facility.id" :value="facility.id">
                  {{ facility.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>


        <a-row :gutter="16">
          <a-col :span="24">
            <a-form-item label="起止日期">
              <a-range-picker
                v-model:value="inspectionDateRange"
                style="width: 100%"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                :allow-clear="false"
              />
            </a-form-item>
          </a-col>
        </a-row>


        <!-- 路线规划 -->
        <a-card size="small" title="路线规划" style="margin-bottom: 16px">
          <a-alert
            type="info"
            show-icon
            style="margin-bottom: 12px"
            message="在地图上依次点击候选点位绘制巡检路线。不同颜色的点位对应不同的巡检设施，纳入路线后显示为绿色。"
          />

          <PlanRouteCanvas
            ref="planRouteCanvasRef"
            :map-id="currentMapId"
            :waypoints="candidateWaypoints"
            :inspection-points="candidateInspectionPoints"
            :facility-point-groups="facilityPointGroups"
            @route-changed="handleRouteChanged"
          />
        </a-card>

        <a-card size="small" title="计划覆盖预览" style="margin-bottom: 16px">
          <a-descriptions :column="5" size="small" bordered>
            <a-descriptions-item label="巡检区域">{{ coverageSummary.regionCount }}</a-descriptions-item>
            <a-descriptions-item label="巡检装置">{{ coverageSummary.installationCount }}</a-descriptions-item>
            <a-descriptions-item label="巡检设施数">{{ coverageSummary.facilityCount }}</a-descriptions-item>
            <a-descriptions-item label="巡检巡检对象数">{{ coverageSummary.componentCount }}</a-descriptions-item>
            <a-descriptions-item label="巡检规则数">{{ coverageSummary.ruleCount }}</a-descriptions-item>
          </a-descriptions>
          <a-table
            style="margin-top: 12px"
            :columns="coverageDetailColumns"
            :data-source="coverageDetailRows"
            row-key="id"
            size="small"
            :pagination="{ pageSize: 6 }"
            :scroll="{ x: 1180 }"
            :locale="{ emptyText: '请选择巡检区域、装置和设施后查看覆盖明细' }"
          >
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'ruleNames'">
                <a-space wrap>
                  <a-tag v-for="rule in record.ruleNames" :key="rule">{{ rule }}</a-tag>
                  <span v-if="!record.ruleNames.length">-</span>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-card>

        <a-form-item label="执行说明">
          <a-textarea v-model:value="form.description" :rows="4" placeholder="可补充该计划的执行范围、检查原则与说明" />
        </a-form-item>

        <div class="form-actions">
          <a-space>
            <a-button @click="goBack">取消</a-button>
            <a-button type="primary" @click="handleSave">保存</a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import dayjs from 'dayjs'
import { useInspectionStore } from '@/stores/inspection'
import { getDetectionItemConfigs } from '@/views/implementation/detection-item-config/model'
import PlanRouteCanvas from './PlanRouteCanvas.vue'

const router = useRouter()
const route = useRoute()
const inspectionStore = useInspectionStore()

const isEdit = computed(() => Boolean(route.params.id))
const planRouteCanvasRef = ref<InstanceType<typeof PlanRouteCanvas>>()
const form = reactive<any>({
  id: '',
  name: '',
  code: '',
  planType: 'manual',
  businessScene: 'daily_inspection',
  riskLevel: 'normal',
  status: 'active',
  regionIds: [],
  installationIds: [],
  facilityIds: [],
  inspectionPointIds: [],
  inspectionTimeStart: dayjs().format('YYYY-MM-DD'),
  inspectionTimeEnd: dayjs().add(7, 'day').format('YYYY-MM-DD'),
  description: ''
})

const regionOptions = computed(() => {
  const regionMap = new Map<string, string>()
  inspectionStore.inspectionMaps.forEach((map: any) => {
    ;(map.regions || []).forEach((region: any) => regionMap.set(region.id, `${map.name} / ${region.name}`))
  })
  return Array.from(regionMap.entries()).map(([id, name]) => ({ id, name }))
})

const selectedPoints = computed(() => inspectionStore.inspectionPoints.filter((point: any) => form.regionIds.includes(point.areaId)))
const installationOptions = computed(() => {
  const map = new Map<string, string>()
  inspectionStore.inspectionDevices
    .filter((device: any) => form.regionIds.includes(device.areaId))
    .forEach((device: any) => {
      if (device.installationId && device.installationName) map.set(device.installationId, device.installationName)
    })
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
})
const facilityOptions = computed(() => inspectionStore.inspectionDevices.filter((device: any) => {
  const inRegion = form.regionIds.includes(device.areaId)
  const inInstallation = !form.installationIds.length || form.installationIds.includes(device.installationId)
  return inRegion && inInstallation
}))
const selectedFacilities = computed(() => facilityOptions.value.filter((device: any) => form.facilityIds.includes(device.id)))
const ruleNameMap = computed(() => new Map(getDetectionItemConfigs().map((item) => [item.id, item.name])))

// ─── 路线规划相关 ────────────────────────────────────
const currentMapId = computed(() =>
  inspectionStore.inspectionMaps[0]?.id || 'map-001'
)

const candidateWaypoints = computed(() =>
  inspectionStore.waypoints.filter((wp: any) => wp.mapId === currentMapId.value)
)

const candidateInspectionPoints = computed(() =>
  inspectionStore.inspectionPoints.filter((p: any) =>
    p.mapId === currentMapId.value && form.regionIds.includes(p.areaId)
  )
)

const FACILITY_COLORS = ['#1677ff', '#722ed1', '#eb2f96', '#13c2c2', '#2f54eb', '#fa541c', '#a0d911', '#fadb14']

const facilityPointGroups = computed(() =>
  selectedFacilities.value.map((device: any, index: number) => ({
    facilityId: device.id,
    facilityName: device.name,
    facilityColor: FACILITY_COLORS[index % FACILITY_COLORS.length],
    pointIds: inspectionStore.inspectionPoints
      .filter((p: any) => p.facilityDeviceId === device.id && p.mapId === currentMapId.value)
      .map((p: any) => p.id)
  }))
)

function handleRouteChanged(pointIds: string[]) {
  form.inspectionPointIds = pointIds.filter(id =>
    inspectionStore.inspectionPoints.some((p: any) => p.id === id)
  )
}
const inspectionDateRange = computed({
  get: (): [string, string] => [form.inspectionTimeStart, form.inspectionTimeEnd],
  set: (value: [string, string]) => {
    form.inspectionTimeStart = value?.[0] || dayjs().format('YYYY-MM-DD')
    form.inspectionTimeEnd = value?.[1] || dayjs().add(7, 'day').format('YYYY-MM-DD')
  }
})
const coverageDetailRows = computed(() => selectedFacilities.value.flatMap((device: any) => {
  const storeComponents = inspectionStore.facilityComponents.filter((component: any) => component.facilityId === device.id)
  const legacyComponents = (device.assetComponents || []).map((component: any) => ({
    ...component,
    facilityName: device.name,
    facilityId: device.id,
    areaName: device.areaName,
    installationName: device.installationName
  }))
  const components = storeComponents.length ? storeComponents : legacyComponents
  return components.map((component: any) => {
    const ruleIds = [...new Set(component.ruleIds || [])]
    return {
      id: `${device.id}-${component.id}`,
      regionName: device.areaName || component.areaName || '-',
      installationName: device.installationName || component.installationName || '-',
      facilityName: device.name,
      facilityCount: 1,
      componentName: component.name,
      componentCode: component.componentNo || component.code || '-',
      componentCount: 1,
      ruleCount: ruleIds.length,
      ruleNames: ruleIds.map((ruleId) => ruleNameMap.value.get(ruleId as string) || ruleId)
    }
  })
}))
const coverageSummary = computed(() => {
  const ruleIds = new Set<string>()
  selectedFacilities.value.forEach((device: any) => {
    ;(device.objectDetectionConfigs || []).forEach((config: any) => {
      if (config.enabled && config.ruleId) ruleIds.add(config.ruleId)
    })
  })
  coverageDetailRows.value.forEach((row: any) => row.ruleNames.forEach((ruleName: string) => {
    const matched = Array.from(ruleNameMap.value.entries()).find(([, name]) => name === ruleName)
    ruleIds.add(matched?.[0] || ruleName)
  }))
  return {
    regionCount: form.regionIds.length,
    installationCount: form.installationIds.length,
    facilityCount: selectedFacilities.value.length,
    componentCount: coverageDetailRows.value.length,
    ruleCount: ruleIds.size
  }
})

const coverageDetailColumns = [
  { title: '巡检区域', dataIndex: 'regionName', key: 'regionName', width: 150 },
  { title: '巡检装置', dataIndex: 'installationName', key: 'installationName', width: 150 },
  { title: '巡检设施', dataIndex: 'facilityName', key: 'facilityName', width: 180 },
  { title: '巡检设施数', dataIndex: 'facilityCount', key: 'facilityCount', width: 110 },
  { title: '巡检巡检对象', dataIndex: 'componentName', key: 'componentName', width: 180 },
  { title: '巡检对象编码', dataIndex: 'componentCode', key: 'componentCode', width: 140 },
  { title: '巡检巡检对象数', dataIndex: 'componentCount', key: 'componentCount', width: 110 },
  { title: '巡检规则数', dataIndex: 'ruleCount', key: 'ruleCount', width: 110 },
  { title: '巡检规则', key: 'ruleNames', width: 260 }
]

function loadDetail() {
  inspectionStore.initialize()
  if (!isEdit.value) return
  const detail = inspectionStore.getInspectionPlanById(route.params.id as string) as any
  if (!detail) return
  form.id = detail.id
  form.name = detail.name
  form.code = detail.code
  form.planType = detail.planType || (detail.schedule ? 'manual' : 'auto')
  form.businessScene = detail.businessScene || 'daily_inspection'
  form.riskLevel = detail.riskLevel || 'normal'
  form.status = detail.status
  const fallbackRegionIds = inspectionStore.inspectionPoints
    .filter((point: any) => (detail.inspectionPointIds || []).includes(point.id) && point.areaId)
    .map((point: any) => point.areaId)
  form.regionIds = [...new Set(detail.regionIds?.length ? detail.regionIds : fallbackRegionIds)]
  form.installationIds = detail.installationIds?.length
    ? [...detail.installationIds]
    : Array.from(new Set(
      inspectionStore.inspectionDevices
        .filter((device: any) => form.regionIds.includes(device.areaId) && device.installationId)
        .map((device: any) => device.installationId)
    ))
  form.facilityIds = detail.facilityIds?.length
    ? [...detail.facilityIds]
    : inspectionStore.inspectionDevices.filter((device: any) => form.regionIds.includes(device.areaId)).map((device: any) => device.id)
  form.inspectionPointIds = selectedPoints.value.map((point: any) => point.id)
  form.inspectionTimeStart = normalizePlanDate(detail.inspectionTimeStart || detail.startTime, dayjs().format('YYYY-MM-DD'))
  form.inspectionTimeEnd = normalizePlanDate(detail.inspectionTimeEnd || detail.endTime, dayjs().add(7, 'day').format('YYYY-MM-DD'))
  form.description = detail.description || ''
}

function normalizePlanDate(value: string | undefined, fallback: string) {
  if (!value) return fallback
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10)
  return fallback
}

function handleSave() {
  if (!form.name || !form.code || !form.regionIds.length || !form.installationIds.length || !form.facilityIds.length) {
    message.error('请补充规划名称、编码、巡检区域、巡检装置和巡检设施')
    return
  }

  // 解析路线配置
  const routeResolve = planRouteCanvasRef.value?.resolveRouteForSave()
  if (routeResolve?.type === 'invalid') {
    message.error(routeResolve.message)
    return
  }

  const inspectionPointIds = selectedPoints.value.map((point: any) => point.id)
  // 使用路线绘制的点位顺序，如果没有则使用推导的巡检点
  const pointIds = routeResolve?.type === 'valid'
    ? routeResolve.pointIds
    : inspectionPointIds

  const payload: any = {
    id: form.id || `plan-${Date.now()}`,
    name: form.name,
    code: form.code,
    robotId: 'robot-001',
    mapId: currentMapId.value,
    pointIds,
    pointOrders: pointIds.map((id: string, index: number) => ({ pointId: id, order: index + 1 })),
    status: form.status,
    type: 'point',
    inspectionPointIds,
    regionIds: [...form.regionIds],
    installationIds: [...form.installationIds],
    facilityIds: [...form.facilityIds],
    planType: form.planType,
    businessScene: form.businessScene,
    riskLevel: form.riskLevel,
    taskSource: form.planType,
    inspectionTimeStart: form.inspectionTimeStart,
    inspectionTimeEnd: form.inspectionTimeEnd,
    description: form.description,
    coverageSummary: coverageSummary.value,
    schedule: {
      type: form.planType,
      windowStart: form.inspectionTimeStart,
      windowEnd: form.inspectionTimeEnd
    },
    config: {
      autoStart: true,
      notifyOnComplete: true,
      notifyOnError: true,
      autoResumeAfterInterrupt: true
    },
    exceptionStrategy: {
      onTaskFailed: 'manual',
      onPointTimeout: 'skip',
      onRobotOffline: 'pause'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }

  inspectionStore.saveInspectionPlan(payload)
  message.success('执行规划已保存')
  router.push('/management/plan/list')
}

function goBack() {
  router.push('/management/plan/list')
}

function handleRegionChange() {
  const validInstallationIds = new Set(installationOptions.value.map((item) => item.id))
  form.installationIds = form.installationIds.filter((id: string) => validInstallationIds.has(id))
  const validFacilityIds = new Set(facilityOptions.value.map((device: any) => device.id))
  form.facilityIds = form.facilityIds.filter((id: string) => validFacilityIds.has(id))
}

function handleInstallationChange() {
  const validFacilityIds = new Set(facilityOptions.value.map((device: any) => device.id))
  form.facilityIds = form.facilityIds.filter((id: string) => validFacilityIds.has(id))
}

onMounted(loadDetail)
</script>

<style scoped lang="css">.inspection-plan-form {
  width: 100%;
}
.inspection-plan-form .form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
</style>
