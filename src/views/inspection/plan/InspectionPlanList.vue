<template>
  <div class="inspection-plan-list">
    <a-page-header title="巡检计划" sub-title="计划层仅表达组织与执行方式，不再表达周期">
      <template #extra>
        <a-space>
          <a-button @click="refreshData">刷新</a-button>
          <a-button type="primary" @click="goToForm()">新建计划</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-card style="margin-top: 16px">
      <div class="search-panel">
        <a-form layout="vertical" :model="searchForm" @submit.prevent>
          <a-row :gutter="[16, 8]">
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="计划名称" class="search-item">
                <a-input v-model:value="searchForm.name" placeholder="请输入计划名称" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="计划编码" class="search-item">
                <a-input v-model:value="searchForm.code" placeholder="请输入计划编码" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="计划类型" class="search-item">
                <a-select v-model:value="searchForm.planType" placeholder="请选择计划类型" allow-clear>
                  <a-select-option value="manual">人工计划</a-select-option>
                  <a-select-option value="auto">自动调度计划</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="是否存在遗漏" class="search-item">
                <a-select v-model:value="searchForm.hasMissing" placeholder="请选择" allow-clear>
                  <a-select-option value="yes">存在遗漏</a-select-option>
                  <a-select-option value="no">无遗漏</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="巡检点" class="search-item">
                <a-select v-model:value="searchForm.pointId" placeholder="按巡检点筛选" allow-clear show-search>
                  <a-select-option v-for="point in inspectionStore.inspectionPoints" :key="point.id" :value="point.id">{{ point.name }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="设施设备" class="search-item">
                <a-select v-model:value="searchForm.deviceId" placeholder="按设备筛选" allow-clear show-search>
                  <a-select-option v-for="device in inspectionStore.inspectionDevices" :key="device.id" :value="device.id">{{ device.name }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="检测项" class="search-item">
                <a-select v-model:value="searchForm.checkItemId" placeholder="按检测项筛选" allow-clear show-search>
                  <a-select-option v-for="item in inspectionStore.inspectionDeviceCheckItems" :key="item.id" :value="item.id">{{ item.name }}</a-select-option>
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
        message="当前计划生成任务的生成周期为任务开始前 7 天。"
      />

      <a-table :columns="columns" :data-source="filteredPlans" :loading="loading" row-key="id" :scroll="{ x: 1560 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'planType'">
            <a-tag :color="record.planType === 'manual' ? 'blue' : 'purple'">
              {{ record.planType === 'manual' ? '人工计划' : '自动调度计划' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'taskSource'">
            {{ record.planType === 'manual' ? '人工创建' : '自动生成' }}
          </template>
          <template v-else-if="column.key === 'pointCount'">
            {{ record.inspectionPointIds?.length || 0 }}
          </template>
          <template v-else-if="column.key === 'checkItemCount'">
            {{ getCheckItemCount(record) }}
          </template>
          <template v-else-if="column.key === 'missingCoverage'">
            <a-tag :color="record.hasMissingCoverage ? 'red' : 'green'">
              {{ record.hasMissingCoverage ? '存在遗漏' : '无遗漏' }}
            </a-tag>
          </template>
          <template v-else-if="column.key === 'status'">
            <a-tag :color="getPlanStatusColor(record.status)">{{ getPlanStatusText(record.status) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-space>
              <a-button type="link" size="small" @click="goToForm(record.id)">编辑</a-button>
              <a-button type="link" size="small" @click="viewTasks(record.id)">任务</a-button>
              <a-button type="link" size="small" @click="openCoverageModal(record)">计划检查</a-button>
              <a-button type="link" size="small" @click="toggleStatus(record)">{{ record.status === 'active' ? '暂停' : '启用' }}</a-button>
            </a-space>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-modal v-model:open="coverageVisible" title="计划覆盖检查" width="820px" :footer="null">
      <template v-if="currentCoverage">
        <a-alert
          :type="currentCoverage.hasMissingCoverage ? 'warning' : 'success'"
          show-icon
          :message="currentCoverage.hasMissingCoverage ? '检测到覆盖遗漏，可自动补充或人工补充。' : '当前计划未发现覆盖遗漏。'"
          style="margin-bottom: 16px"
        />
        <a-descriptions bordered :column="2" size="small" style="margin-bottom: 12px">
          <a-descriptions-item label="计划名称">{{ currentCoverage.name }}</a-descriptions-item>
          <a-descriptions-item label="计划类型">{{ currentCoverage.planType === 'manual' ? '人工计划' : '自动调度计划' }}</a-descriptions-item>
          <a-descriptions-item label="遗漏巡检点">{{ currentCoverage.missingPoints.length || 0 }}</a-descriptions-item>
          <a-descriptions-item label="遗漏检测项">{{ currentCoverage.missingCheckItems.length || 0 }}</a-descriptions-item>
          <a-descriptions-item label="遗漏设备">{{ currentCoverage.missingDevices.length || 0 }}</a-descriptions-item>
          <a-descriptions-item label="结果">{{ currentCoverage.hasMissingCoverage ? '需补充' : '通过' }}</a-descriptions-item>
        </a-descriptions>

        <a-row :gutter="12">
          <a-col :span="8">
            <a-card size="small" title="遗漏巡检点">
              <a-empty v-if="currentCoverage.missingPoints.length === 0" description="无" />
              <a-tag v-for="item in currentCoverage.missingPoints" :key="item" style="margin-bottom: 8px">{{ item }}</a-tag>
            </a-card>
          </a-col>
          <a-col :span="8">
            <a-card size="small" title="遗漏检测项">
              <a-empty v-if="currentCoverage.missingCheckItems.length === 0" description="无" />
              <a-tag v-for="item in currentCoverage.missingCheckItems" :key="item" color="orange" style="margin-bottom: 8px">{{ item }}</a-tag>
            </a-card>
          </a-col>
          <a-col :span="8">
            <a-card size="small" title="遗漏设备">
              <a-empty v-if="currentCoverage.missingDevices.length === 0" description="无" />
              <a-tag v-for="item in currentCoverage.missingDevices" :key="item" color="red" style="margin-bottom: 8px">{{ item }}</a-tag>
            </a-card>
          </a-col>
        </a-row>

        <div class="modal-actions">
          <a-space>
            <a-button @click="coverageVisible = false">关闭</a-button>
            <a-button :disabled="!currentCoverage.hasMissingCoverage" @click="manualSupplement">人工补充</a-button>
            <a-button type="primary" :disabled="!currentCoverage.hasMissingCoverage" @click="autoSupplement">自动补充</a-button>
          </a-space>
        </div>
      </template>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useInspectionStore } from '@/stores/inspection'

type PlanRow = any

const router = useRouter()
const inspectionStore = useInspectionStore()
const loading = ref(false)
const plans = ref<PlanRow[]>([])
const coverageVisible = ref(false)
const currentCoverage = ref<PlanRow | null>(null)

const searchForm = reactive({
  name: '',
  code: '',
  planType: undefined as string | undefined,
  hasMissing: undefined as string | undefined,
  pointId: undefined as string | undefined,
  deviceId: undefined as string | undefined,
  checkItemId: undefined as string | undefined,
  status: undefined as string | undefined
})

const columns = [
  { title: '计划名称', dataIndex: 'name', key: 'name', width: 220 },
  { title: '编码', dataIndex: 'code', key: 'code', width: 150 },
  { title: '计划类型', key: 'planType', width: 140 },
  { title: '任务来源', key: 'taskSource', width: 120 },
  { title: '巡检点数量', key: 'pointCount', width: 120 },
  { title: '检测配置数量', key: 'checkItemCount', width: 120 },
  { title: '覆盖检查', key: 'missingCoverage', width: 120 },
  { title: '状态', key: 'status', width: 100 },
  { title: '更新时间', dataIndex: 'updatedAt', key: 'updatedAt', width: 180 },
  { title: '操作', key: 'actions', width: 240, fixed: 'right' }
]

function enrichPlan(plan: any) {
  const inspectionPointIds = plan.inspectionPointIds || []
  const linkedDevices = inspectionStore.inspectionDevices.filter((device: any) => inspectionPointIds.includes(device.inspectionPointId))
  const linkedDetectionConfigs = linkedDevices.flatMap((device: any) => device.objectDetectionConfigs || [])
  const missingPoints = inspectionStore.inspectionPoints
    .filter((point: any) => !inspectionPointIds.includes(point.id))
    .slice(0, 2)
    .map((point: any) => point.name)
  const missingDevices = linkedDevices.filter((device: any) => !(device.objectDetectionConfigs || []).some((item: any) => item.enabled)).map((device: any) => device.name)
  const missingCheckItems = linkedDetectionConfigs.filter((item: any) => !item.collectionPoseId || !item.ruleId).slice(0, 3).map((item: any) => item.subjectName)
  const planType = plan.planType || (plan.schedule ? 'manual' : 'auto')
  return {
    ...plan,
    planType,
    linkedDeviceIds: linkedDevices.map((item: any) => item.id),
    linkedCheckItemIds: linkedDetectionConfigs.map((item: any) => item.id),
    hasMissingCoverage: Boolean(plan.hasMissingCoverage || missingPoints.length || missingDevices.length || missingCheckItems.length),
    missingPoints,
    missingDevices,
    missingCheckItems,
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
  message.success('巡检计划已刷新')
}

function getCheckItemCount(plan: PlanRow) {
  return (plan.linkedCheckItemIds || []).length
}

const filteredPlans = computed(() => {
  const name = searchForm.name.trim().toLowerCase()
  const code = searchForm.code.trim().toLowerCase()
  return plans.value.filter((plan) => {
    const matchName = !name || String(plan.name).toLowerCase().includes(name)
    const matchCode = !code || String(plan.code).toLowerCase().includes(code)
    const matchType = !searchForm.planType || plan.planType === searchForm.planType
    const matchMissing = !searchForm.hasMissing || (searchForm.hasMissing === 'yes' ? plan.hasMissingCoverage : !plan.hasMissingCoverage)
    const matchPoint = !searchForm.pointId || (plan.inspectionPointIds || []).includes(searchForm.pointId)
    const matchDevice = !searchForm.deviceId || (plan.linkedDeviceIds || []).includes(searchForm.deviceId)
    const matchCheckItem = !searchForm.checkItemId || (plan.linkedCheckItemIds || []).includes(searchForm.checkItemId)
    const matchStatus = !searchForm.status || plan.status === searchForm.status
    return matchName && matchCode && matchType && matchMissing && matchPoint && matchDevice && matchCheckItem && matchStatus
  })
})

function handleReset() {
  searchForm.name = ''
  searchForm.code = ''
  searchForm.planType = undefined
  searchForm.hasMissing = undefined
  searchForm.pointId = undefined
  searchForm.deviceId = undefined
  searchForm.checkItemId = undefined
  searchForm.status = undefined
}

function getPlanStatusText(status: string) {
  return ({ active: '启用', paused: '暂停', inactive: '停用' } as Record<string, string>)[status] || '-'
}

function getPlanStatusColor(status: string) {
  return ({ active: 'green', paused: 'orange', inactive: 'default' } as Record<string, string>)[status] || 'default'
}

function goToForm(id?: string) {
  router.push(id ? `/management/plan/form/${id}` : '/management/plan/form')
}

function viewTasks(id: string) {
  router.push(`/management/task/list?planId=${id}`)
}

function openCoverageModal(record: PlanRow) {
  currentCoverage.value = enrichPlan(record)
  coverageVisible.value = true
}

function toggleStatus(record: PlanRow) {
  const nextStatus = record.status === 'active' ? 'paused' : 'active'
  inspectionStore.saveInspectionPlan({ ...record, status: nextStatus, updatedAt: new Date() })
  fetchPlans()
  message.success(`计划已${nextStatus === 'active' ? '启用' : '暂停'}`)
}

function autoSupplement() {
  if (!currentCoverage.value) return
  const next = { ...currentCoverage.value, hasMissingCoverage: false, missingPoints: [], missingDevices: [], missingCheckItems: [], updatedAt: new Date() }
  inspectionStore.saveInspectionPlan(next)
  fetchPlans()
  currentCoverage.value = next
  message.success('已自动补充缺失内容（演示数据）')
}

function manualSupplement() {
  if (!currentCoverage.value) return
  coverageVisible.value = false
  message.info('已为你打开计划编辑页，可进行人工补充')
  goToForm(currentCoverage.value.id)
}

onMounted(fetchPlans)
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
</style>
