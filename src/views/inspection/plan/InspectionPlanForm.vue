
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
          <a-col :span="12">
            <a-form-item label="开始日期">
              <a-input v-model:value="form.inspectionTimeStart" placeholder="例如 08:00" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="结束日期">
              <a-input v-model:value="form.inspectionTimeEnd" placeholder="例如 18:00" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-card size="small" title="计划覆盖预览" style="margin-bottom: 16px">
          <a-descriptions :column="5" size="small" bordered>
            <a-descriptions-item label="巡检区域">{{ coverageSummary.regionCount }}</a-descriptions-item>
            <a-descriptions-item label="巡检装置">{{ coverageSummary.installationCount }}</a-descriptions-item>
            <a-descriptions-item label="巡检设施数">{{ coverageSummary.facilityCount }}</a-descriptions-item>
            <a-descriptions-item label="巡检部件数">{{ coverageSummary.componentCount }}</a-descriptions-item>
            <a-descriptions-item label="巡检规则数">{{ coverageSummary.ruleCount }}</a-descriptions-item>
          </a-descriptions>
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
import { computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useInspectionStore } from '@/stores/inspection'

const router = useRouter()
const route = useRoute()
const inspectionStore = useInspectionStore()

const isEdit = computed(() => Boolean(route.params.id))
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
  inspectionTimeStart: '08:00',
  inspectionTimeEnd: '18:00',
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
const coverageSummary = computed(() => {
  const ruleIds = new Set<string>()
  const componentCount = selectedFacilities.value.reduce((sum: number, device: any) => {
    ;(device.objectDetectionConfigs || []).forEach((config: any) => {
      if (config.enabled && config.ruleId) ruleIds.add(config.ruleId)
    })
    ;(device.assetComponents || []).forEach((component: any) => (component.ruleIds || []).forEach((ruleId: string) => ruleIds.add(ruleId)))
    return sum + (device.assetComponents?.length || 0)
  }, 0)
  return {
    regionCount: form.regionIds.length,
    installationCount: form.installationIds.length,
    facilityCount: selectedFacilities.value.length,
    componentCount,
    ruleCount: ruleIds.size
  }
})

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
  form.inspectionTimeStart = detail.inspectionTimeStart || detail.startTime || '08:00'
  form.inspectionTimeEnd = detail.inspectionTimeEnd || detail.endTime || '18:00'
  form.description = detail.description || ''
}

function handleSave() {
  if (!form.name || !form.code || !form.regionIds.length || !form.installationIds.length || !form.facilityIds.length) {
    message.error('请补充规划名称、编码、巡检区域、巡检装置和巡检设施')
    return
  }
  const inspectionPointIds = selectedPoints.value.map((point: any) => point.id)

  const payload: any = {
    id: form.id || `plan-${Date.now()}`,
    name: form.name,
    code: form.code,
    robotId: 'robot-001',
    mapId: inspectionStore.inspectionMaps[0]?.id || 'map-001',
    routeId: '',
    pointIds: inspectionPointIds,
    pointOrders: inspectionPointIds.map((id: string, index: number) => ({ pointId: id, order: index + 1 })),
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
