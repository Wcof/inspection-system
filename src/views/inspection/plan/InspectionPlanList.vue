<template>
  <div class="inspection-plan-list">
    <a-page-header title="巡检规划" sub-title="围绕日常巡检、隐患排查、环境检查、作业监护组织机器人执行范围">
      <template #extra>
        <a-space>
          <a-button @click="refreshData">刷新</a-button>
          <a-button @click="openAllCoverageModal">覆盖检查</a-button>
          <a-button type="primary" @click="goToForm()">新建规划</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-card style="margin-top: 16px">
      <div class="search-panel">
        <a-form layout="vertical" :model="searchForm" @submit.prevent>
          <a-row :gutter="[16, 8]">
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="规划名称" class="search-item">
                <a-input v-model:value="searchForm.name" placeholder="请输入规划名称" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="规划编码" class="search-item">
                <a-input v-model:value="searchForm.code" placeholder="请输入规划编码" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="业务场景" class="search-item">
                <a-select v-model:value="searchForm.businessScene" placeholder="请选择业务场景" allow-clear>
                  <a-select-option value="daily_inspection">日常巡检</a-select-option>
                  <a-select-option value="hazard_screening">隐患排查</a-select-option>
                  <a-select-option value="environment_check">环境检查</a-select-option>
                  <a-select-option value="operation_guard">作业监护</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="规划类型" class="search-item">
                <a-select v-model:value="searchForm.planType" placeholder="请选择规划类型" allow-clear>
                  <a-select-option value="manual">人工</a-select-option>
                  <a-select-option value="auto">自动</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="巡检区域" class="search-item">
                <a-select v-model:value="searchForm.regionId" placeholder="按区域筛选" allow-clear show-search>
                  <a-select-option v-for="region in regionOptions" :key="region.id" :value="region.id">{{ region.name }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="设施" class="search-item">
                <a-select v-model:value="searchForm.deviceId" placeholder="按设施筛选" allow-clear show-search>
                  <a-select-option v-for="device in inspectionStore.inspectionDevices" :key="device.id" :value="device.id">{{ device.name }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="状态" class="search-item">
                <a-select v-model:value="searchForm.status" placeholder="请选择状态" allow-clear>
                  <a-select-option value="active">启用</a-select-option>
                  <a-select-option value="paused">暂停</a-select-option>
                  <a-select-option value="inactive">停用</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <div class="search-actions">
            <a-space>
              <a-button type="primary">搜索</a-button>
              <a-button @click="handleReset">重置</a-button>
            </a-space>
          </div>
        </a-form>
      </div>

      <a-alert
        type="info"
        show-icon
        style="margin-bottom: 12px"
        message="执行规划只定义要覆盖的业务区域与设施范围；具体任务由调度台结合资源、风险优先级和现场约束生成。"
      />

      <a-table :columns="columns" :data-source="filteredPlans" :loading="loading" row-key="id" :scroll="{ x: 1560 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'planType'">
            <a-tag :color="getSceneColor(record.businessScene)">{{ getSceneText(record.businessScene) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'taskSource'">
            <a-tag :color="record.planType === 'manual' ? 'blue' : 'purple'">{{ getPlanTypeText(record.planType) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'regionCount'">
            <a-space wrap>
              <a-tag v-for="region in record.regionNames" :key="region">{{ region }}</a-tag>
              <span v-if="!record.regionNames?.length">-</span>
            </a-space>
          </template>
          <template v-else-if="column.key === 'facilityCount'">
            {{ record.linkedDeviceIds?.length || 0 }}
          </template>
          <template v-else-if="column.key === 'componentConnectionCount'">
            {{ record.componentConnectionCount || 0 }}
          </template>
          <template v-else-if="column.key === 'ruleCount'">
            {{ record.ruleCount || 0 }}
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="getPlanStatusColor(record.status)">{{ getPlanStatusText(record.status) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="goToForm(record.id)">编辑</a-button>
              <a-button type="link" size="small" @click="viewTasks(record.id)">任务</a-button>
              <a-button v-if="record.status === 'active'" type="link" size="small" @click="pausePlan(record)">暂停</a-button>
              <a-button v-else type="link" size="small" @click="startPlan(record)">启动</a-button>
              <a-popconfirm
                v-if="record.status === 'paused'"
                title="确认终止该执行规划？终止后不会继续参与调度生成。"
                ok-text="确认终止"
                cancel-text="取消"
                @confirm="terminatePlan(record)"
              >
                <a-button type="link" size="small" danger>终止</a-button>
              </a-popconfirm>
              <a-popconfirm
                v-if="record.status === 'inactive'"
                title="确认删除该执行规划？删除后将无法在列表中恢复。"
                ok-text="确认删除"
                cancel-text="取消"
                @confirm="deletePlan(record)"
              >
                <a-button type="link" size="small" danger>删除</a-button>
              </a-popconfirm>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal
      v-model:open="coverageVisible"
      title="规划覆盖检查"
      width="min(1280px, 94vw)"
      :footer="null"
      wrap-class-name="coverage-check-modal"
    >
      <template v-if="currentCoverage">
        <a-alert
          :type="currentCoverage.hasMissingCoverage ? 'warning' : 'success'"
          show-icon
          :message="currentCoverage.hasMissingCoverage ? '当前规划集合存在未覆盖设施或规则缺口。' : '当前所有规划已覆盖相关设施。'"
          style="margin-bottom: 16px"
        />
        <a-descriptions bordered :column="2" size="small" style="margin-bottom: 12px">
          <a-descriptions-item label="检查范围">{{ currentCoverage.name }}</a-descriptions-item>
          <a-descriptions-item label="规划数量">{{ currentCoverage.planCount }}</a-descriptions-item>
          <a-descriptions-item label="已覆盖区域">{{ currentCoverage.regionCount }}</a-descriptions-item>
          <a-descriptions-item label="已覆盖设施">{{ currentCoverage.facilityCount }}</a-descriptions-item>
          <a-descriptions-item label="遗漏区域">{{ currentCoverage.missingRegions.length || 0 }}</a-descriptions-item>
          <a-descriptions-item label="遗漏设施">{{ currentCoverage.missingDevices.length || 0 }}</a-descriptions-item>
          <a-descriptions-item label="遗漏部件/连接">{{ currentCoverage.missingSubjects.length || 0 }}</a-descriptions-item>
          <a-descriptions-item label="遗漏巡检规则">{{ currentCoverage.missingRules.length || 0 }}</a-descriptions-item>
        </a-descriptions>

        <a-row :gutter="[16, 16]" class="coverage-card-grid">
          <a-col :xs="24" :lg="12" :xl="6">
            <a-card size="small" title="遗漏区域">
              <a-empty v-if="currentCoverage.missingRegions.length === 0" description="无遗漏区域" />
              <div v-for="item in currentCoverage.missingRegions" :key="item.regionId" class="coverage-missing-item">
                <div class="coverage-title">{{ item.regionName }}</div>
                <div class="coverage-meta">该区域尚未被任何执行规划覆盖</div>
              </div>
            </a-card>
          </a-col>
          <a-col :xs="24" :lg="12" :xl="6">
            <a-card size="small" title="遗漏设施">
              <a-empty v-if="currentCoverage.missingDevices.length === 0" description="无遗漏设施" />
              <div v-for="item in currentCoverage.missingDevices" :key="item.deviceId" class="coverage-missing-item danger">
                <div class="coverage-title">{{ item.deviceName }}</div>
                <div class="coverage-meta">所属区域：{{ item.regionName }}</div>
              </div>
            </a-card>
          </a-col>
          <a-col :xs="24" :lg="12" :xl="6">
            <a-card size="small" title="遗漏部件/连接">
              <a-empty v-if="currentCoverage.missingSubjects.length === 0" description="无遗漏部件/连接" />
              <div v-for="item in currentCoverage.missingSubjects" :key="item.subjectId" class="coverage-missing-item warning">
                <div class="coverage-title">{{ item.subjectName }}</div>
                <div class="coverage-meta">{{ item.regionName }} / {{ item.deviceName }} / {{ item.subjectType }}</div>
              </div>
            </a-card>
          </a-col>
          <a-col :xs="24" :lg="12" :xl="6">
            <a-card size="small" title="遗漏巡检规则">
              <a-empty v-if="currentCoverage.missingRules.length === 0" description="无遗漏巡检规则" />
              <div v-for="item in currentCoverage.missingRules" :key="item.id" class="coverage-missing-item warning">
                <div class="coverage-title">{{ item.ruleName }}</div>
                <div class="coverage-meta">{{ item.regionName }} / {{ item.deviceName }} / {{ item.subjectName }}</div>
              </div>
            </a-card>
          </a-col>
        </a-row>

        <div class="modal-actions">
          <a-space>
            <a-button @click="coverageVisible = false">关闭</a-button>
          </a-space>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useInspectionStore } from '@/stores/inspection'

type PlanRow = any

const router = useRouter()
const route = useRoute()
const inspectionStore = useInspectionStore()
const loading = ref(false)
const plans = ref<PlanRow[]>([])
const coverageVisible = ref(false)
const currentCoverage = ref<PlanRow | null>(null)

const searchForm = reactive({
  name: '',
  code: '',
  businessScene: undefined as string | undefined,
  planType: undefined as string | undefined,
  regionId: undefined as string | undefined,
  deviceId: undefined as string | undefined,
  status: undefined as string | undefined
})

const columns = [
  { title: '规划名称', dataIndex: 'name', key: 'name', width: 220 },
  { title: '编码', dataIndex: 'code', key: 'code', width: 150 },
  { title: '业务场景', key: 'planType', width: 130 },
  { title: '规划类型', key: 'taskSource', width: 120 },
  { title: '巡检区域', key: 'regionCount', width: 220 },
  { title: '巡检设施数', key: 'facilityCount', width: 120 },
  { title: '巡检部件/连接数', key: 'componentConnectionCount', width: 150 },
  { title: '巡检规则数', key: 'ruleCount', width: 120 },
  { title: '状态', key: 'status', width: 100 },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 180 },
  { title: '操作', key: 'actions', width: 180, fixed: 'right' }
]

const regionOptions = computed(() => {
  const regionMap = new Map<string, string>()
  inspectionStore.inspectionMaps.forEach((map: any) => {
    ;(map.regions || []).forEach((region: any) => regionMap.set(region.id, `${map.name} / ${region.name}`))
  })
  return Array.from(regionMap.entries()).map(([id, name]) => ({ id, name }))
})

function getRegionName(regionId?: string) {
  if (!regionId) return '未配置区域'
  return regionOptions.value.find((region) => region.id === regionId)?.name || regionId
}

function enrichPlan(plan: any) {
  const fallbackRegionIds = inspectionStore.inspectionPoints
    .filter((point: any) => (plan.inspectionPointIds || []).includes(point.id) && point.areaId)
    .map((point: any) => point.areaId)
  const regionIds = Array.from(new Set(plan.regionIds?.length ? plan.regionIds : fallbackRegionIds))
  const linkedDevices = inspectionStore.inspectionDevices.filter((device: any) => {
    if (plan.facilityIds?.length) return plan.facilityIds.includes(device.id)
    return regionIds.includes(device.areaId)
  })
  const linkedDetectionConfigs = linkedDevices.flatMap((device: any) => device.objectDetectionConfigs || [])
  const ruleIds = new Set<string>()
  linkedDetectionConfigs.forEach((config: any) => {
    if (config.enabled && config.ruleId) ruleIds.add(config.ruleId)
  })
  linkedDevices.forEach((device: any) => {
    ;(device.assetComponents || []).forEach((component: any) => (component.ruleIds || []).forEach((ruleId: string) => ruleIds.add(ruleId)))
    ;(device.connectionObjects || []).forEach((connection: any) => (connection.ruleIds || []).forEach((ruleId: string) => ruleIds.add(ruleId)))
  })
  const componentConnectionCount = linkedDevices.reduce((sum: number, device: any) => sum + (device.assetComponents?.length || 0) + (device.connectionObjects?.length || 0), 0)
  const missingRegions = regionOptions.value
    .filter((region) => !regionIds.includes(region.id))
    .slice(0, 2)
    .map((region) => region.name)
  const missingDevices = linkedDevices.filter((device: any) => !(device.objectDetectionConfigs || []).some((item: any) => item.enabled)).map((device: any) => device.name)
  const missingRules = linkedDetectionConfigs.filter((item: any) => !item.ruleId).slice(0, 3).map((item: any) => item.subjectName)
  const planType = plan.planType || (plan.schedule ? 'manual' : 'auto')
  const seed = String(plan.id || plan.code || plan.name || '')
  const sceneOptions = ['daily_inspection', 'hazard_screening', 'environment_check', 'operation_guard']
  return {
    ...plan,
    planType,
    regionIds,
    regionNames: regionIds.map((id) => regionOptions.value.find((region) => region.id === id)?.name || id),
    businessScene: plan.businessScene || sceneOptions[seed.length % sceneOptions.length],
    taskSource: planType,
    linkedDeviceIds: linkedDevices.map((item: any) => item.id),
    facilityIds: plan.facilityIds?.length ? plan.facilityIds : linkedDevices.map((item: any) => item.id),
    linkedCheckItemIds: linkedDetectionConfigs.map((item: any) => item.id),
    componentConnectionCount,
    ruleCount: ruleIds.size,
    hasMissingCoverage: Boolean(!regionIds.length || missingDevices.length || missingRules.length),
    missingRegions,
    missingDevices,
    missingRules,
    updatedAt: plan.updatedAt ? new Date(plan.updatedAt).toLocaleString() : '-'
  }
}

function fetchPlans() {
  loading.value = true
  try {
    inspectionStore.initialize()
    plans.value = inspectionStore.inspectionPlans.map(enrichPlan)
  } finally {
    loading.value = false
  }
}

function refreshData() {
  fetchPlans()
  message.success('执行规划已刷新')
}

const filteredPlans = computed(() => {
  const name = searchForm.name.trim().toLowerCase()
  const code = searchForm.code.trim().toLowerCase()
  return plans.value.filter((plan) => {
    const matchName = !name || String(plan.name).toLowerCase().includes(name)
    const matchCode = !code || String(plan.code).toLowerCase().includes(code)
    const matchScene = !searchForm.businessScene || plan.businessScene === searchForm.businessScene
    const matchPlanType = !searchForm.planType || plan.planType === searchForm.planType
    const matchRegion = !searchForm.regionId || (plan.regionIds || []).includes(searchForm.regionId)
    const matchDevice = !searchForm.deviceId || (plan.linkedDeviceIds || []).includes(searchForm.deviceId)
    const matchStatus = !searchForm.status || plan.status === searchForm.status
    return matchName && matchCode && matchScene && matchPlanType && matchRegion && matchDevice && matchStatus
  })
})

function handleReset() {
  searchForm.name = ''
  searchForm.code = ''
  searchForm.businessScene = undefined
  searchForm.planType = undefined
  searchForm.regionId = undefined
  searchForm.deviceId = undefined
  searchForm.status = undefined
}

function getPlanStatusText(status: string) {
  return ({ active: '启用', paused: '暂停', inactive: '终止' } as Record<string, string>)[status] || '-'
}

function getPlanStatusColor(status: string) {
  return ({ active: 'green', paused: 'orange', inactive: 'red' } as Record<string, string>)[status] || 'default'
}

function getSceneText(scene?: string) {
  return ({ daily_inspection: '日常巡检', hazard_screening: '隐患排查', environment_check: '环境检查', operation_guard: '作业监护' } as Record<string, string>)[scene || ''] || '日常巡检'
}

function getSceneColor(scene?: string) {
  return ({ daily_inspection: 'blue', hazard_screening: 'volcano', environment_check: 'green', operation_guard: 'purple' } as Record<string, string>)[scene || ''] || 'blue'
}

function getPlanTypeText(type?: string) {
  return ({ manual: '人工', auto: '自动' } as Record<string, string>)[type || ''] || '人工'
}

function goToForm(id?: string) {
  router.push(id ? `/management/plan/form/${id}` : '/management/plan/form')
}

function viewTasks(id: string) {
  router.push(`/management/task/list?planId=${id}`)
}

function openAllCoverageModal() {
  const enrichedPlans = plans.value.map(enrichPlan)
  const coveredRegionIds = new Set<string>()
  const coveredDeviceIds = new Set<string>()
  enrichedPlans.forEach((plan) => {
    ;(plan.regionIds || []).forEach((id: string) => coveredRegionIds.add(id))
    ;(plan.linkedDeviceIds || []).forEach((id: string) => coveredDeviceIds.add(id))
  })

  const missingRegions = regionOptions.value
    .filter((region) => !coveredRegionIds.has(region.id))
    .map((region) => ({
      regionId: region.id,
      regionName: region.name
    }))

  const missingDevices = inspectionStore.inspectionDevices
    .filter((device: any) => !coveredDeviceIds.has(device.id))
    .map((device: any) => ({
      deviceId: device.id,
      deviceName: device.name,
      regionId: device.areaId,
      regionName: getRegionName(device.areaId)
    }))

  const coveredDevices = inspectionStore.inspectionDevices.filter((device: any) => coveredDeviceIds.has(device.id))
  const missingSubjects: Array<{ subjectId: string; subjectName: string; subjectType: string; deviceName: string; regionName: string }> = []
  const missingRules: Array<{ id: string; ruleName: string; subjectName: string; deviceName: string; regionName: string }> = []

  coveredDevices.forEach((device: any) => {
    const regionName = getRegionName(device.areaId)
    const configs = device.objectDetectionConfigs || []
    const components = (device.assetComponents || []).map((component: any) => ({
      id: component.id,
      name: component.name,
      typeLabel: '部件',
      ruleIds: component.ruleIds || []
    }))
    const connections = (device.connectionObjects || []).map((connection: any) => ({
      id: connection.id,
      name: connection.name,
      typeLabel: '连接',
      ruleIds: connection.ruleIds || []
    }))

    ;[...components, ...connections].forEach((subject: any) => {
      const subjectConfigs = configs.filter((config: any) => config.subjectId === subject.id && config.enabled)
      const hasRule = subjectConfigs.some((config: any) => config.ruleId) || subject.ruleIds.length > 0
      if (!hasRule) {
        missingSubjects.push({
          subjectId: `${device.id}-${subject.id}`,
          subjectName: subject.name,
          subjectType: subject.typeLabel,
          deviceName: device.name,
          regionName
        })
      }
      subjectConfigs
        .filter((config: any) => !config.ruleId)
        .forEach((config: any) => {
          missingRules.push({
            id: config.id,
            ruleName: '未选择巡检规则',
            subjectName: config.subjectName || subject.name,
            deviceName: device.name,
            regionName
          })
        })
    })
  })

  currentCoverage.value = {
    name: '全部执行规划',
    planCount: enrichedPlans.length,
    regionCount: coveredRegionIds.size,
    facilityCount: coveredDeviceIds.size,
    missingRegions: missingRegions.slice(0, 12),
    missingDevices: missingDevices.slice(0, 12),
    missingSubjects: missingSubjects.slice(0, 12),
    missingRules: missingRules.slice(0, 12),
    hasMissingCoverage: missingRegions.length > 0 || missingDevices.length > 0 || missingSubjects.length > 0 || missingRules.length > 0
  }
  coverageVisible.value = true
}

function updatePlanStatus(record: PlanRow, status: 'active' | 'paused' | 'inactive') {
  inspectionStore.saveInspectionPlan({ ...record, status, updatedAt: new Date() })
  fetchPlans()
}

function pausePlan(record: PlanRow) {
  updatePlanStatus(record, 'paused')
  message.success('规划已暂停')
}

function startPlan(record: PlanRow) {
  updatePlanStatus(record, 'active')
  message.success('规划已启动')
}

function terminatePlan(record: PlanRow) {
  updatePlanStatus(record, 'inactive')
  message.success('规划已终止')
}

function deletePlan(record: PlanRow) {
  inspectionStore.deleteInspectionPlan(record.id)
  fetchPlans()
  message.success('规划已删除')
}

onMounted(fetchPlans)

onMounted(() => {
  const name = String(route.query.name || '').trim()
  if (name) {
    searchForm.name = name
  }
})
</script>

<style scoped lang="css">.inspection-plan-list {
  width: 100%;
}
.search-panel {
  margin-bottom: 12px;
  padding: 12px 12px 4px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}
.search-item {
  margin-bottom: 8px;
}
.search-actions {
  display: flex;
  justify-content: flex-end;
  margin: 4px 0 8px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
.inspection-plan-list :deep(.coverage-check-modal .ant-modal-body) {
  max-height: 78vh;
  overflow-y: auto;
}
.coverage-card-grid :deep(.ant-card) {
  height: 100%;
}
.coverage-card-grid :deep(.ant-card-body) {
  max-height: 360px;
  overflow-y: auto;
}
.coverage-missing-item {
  padding: 8px 10px;
  margin-bottom: 8px;
  border: 1px solid #e6f4ff;
  border-radius: 6px;
  background: #f6fbff;
}
.coverage-missing-item.warning {
  border-color: #ffe7ba;
  background: #fffaf0;
}
.coverage-missing-item.danger {
  border-color: #ffccc7;
  background: #fff2f0;
}
.coverage-title {
  color: #1f2937;
  font-weight: 600;
}
.coverage-meta {
  margin-top: 2px;
  color: #667085;
  font-size: 12px;
  line-height: 1.5;
  word-break: break-word;
}
</style>
