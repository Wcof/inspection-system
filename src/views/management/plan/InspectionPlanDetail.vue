<template>
  <div class="inspection-plan-detail">
    <a-page-header title="执行规划详情" sub-title="区域 -> 装置 -> 设施/管路 -> 部件 -> 检测规则" @back="goBack">
      <template #extra>
        <a-space>
          <a-button @click="goBack">返回列表</a-button>
          <a-button type="primary" @click="goEdit">编辑规划</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-card style="margin-top: 16px">
      <a-descriptions bordered :column="3" size="small">
        <a-descriptions-item label="规划名称">{{ plan?.name || '-' }}</a-descriptions-item>
        <a-descriptions-item label="规划编码">{{ plan?.code || '-' }}</a-descriptions-item>
        <a-descriptions-item label="规划状态">
          <a-tag :color="getStatusColor(plan?.status)">{{ getStatusText(plan?.status) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="业务场景">
          <a-tag :color="getSceneColor(plan?.businessScene)">{{ getSceneText(plan?.businessScene) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="规划类型">
          <a-tag :color="plan?.planType === 'auto' ? 'purple' : 'blue'">{{ plan?.planType === 'auto' ? '自动' : '人工' }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="风险优先级">
          <a-tag :color="getRiskColor(plan?.riskLevel)">{{ getRiskText(plan?.riskLevel) }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="执行时间窗">{{ plan?.inspectionTimeStart || '-' }} ~ {{ plan?.inspectionTimeEnd || '-' }}</a-descriptions-item>
        <a-descriptions-item label="创建时间">{{ toDateTime(plan?.createdAt) }}</a-descriptions-item>
        <a-descriptions-item label="更新时间">{{ toDateTime(plan?.updatedAt) }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-row :gutter="16" style="margin-top: 16px">
      <a-col :xs="24" :lg="12">
        <a-card title="覆盖范围">
          <a-descriptions bordered :column="2" size="small" style="margin-bottom: 12px">
            <a-descriptions-item label="区域">{{ coverageSummary.regionCount }}</a-descriptions-item>
            <a-descriptions-item label="装置">{{ coverageSummary.installationCount }}</a-descriptions-item>
            <a-descriptions-item label="设施/管路">{{ coverageSummary.facilityCount }}</a-descriptions-item>
            <a-descriptions-item label="部件">{{ coverageSummary.componentCount }}</a-descriptions-item>
            <a-descriptions-item label="规则">{{ coverageSummary.ruleCount }}</a-descriptions-item>
          </a-descriptions>
          <div class="group-list">
            <div class="group-item">
              <h4>区域</h4>
              <a-tag v-for="item in regionNames" :key="item">{{ item }}</a-tag>
              <span v-if="!regionNames.length">-</span>
            </div>
            <div class="group-item">
              <h4>装置</h4>
              <a-tag v-for="item in installationNames" :key="item">{{ item }}</a-tag>
              <span v-if="!installationNames.length">-</span>
            </div>
            <div class="group-item">
              <h4>设施/管路</h4>
              <a-tag v-for="item in facilityNames" :key="item">{{ item }}</a-tag>
              <span v-if="!facilityNames.length">-</span>
            </div>
            <div class="group-item">
              <h4>部件</h4>
              <a-tag v-for="item in componentNames" :key="item">{{ item }}</a-tag>
              <span v-if="!componentNames.length">-</span>
            </div>
          </div>
        </a-card>
      </a-col>
      <a-col :xs="24" :lg="12">
        <a-card title="调度配置">
          <a-descriptions bordered :column="1" size="small">
            <a-descriptions-item label="调度策略">{{ plan?.planType === 'auto' ? '自动调度优先' : '人工调度优先' }}</a-descriptions-item>
            <a-descriptions-item label="任务生成">{{ plan?.status === 'active' ? '启用中，可派生任务' : '暂停/终止，不继续派生' }}</a-descriptions-item>
            <a-descriptions-item label="异常策略">任务失败人工确认，点位超时可跳过，机器人离线暂停</a-descriptions-item>
            <a-descriptions-item label="业务备注">{{ plan?.description || '-' }}</a-descriptions-item>
          </a-descriptions>
        </a-card>
      </a-col>
    </a-row>

    <a-card title="派生任务" style="margin-top: 16px">
      <a-table :columns="taskColumns" :data-source="derivedTasks" row-key="id" :pagination="{ pageSize: 6 }">
        <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'status'">
            <a-tag :color="getTaskStatusColor(record.status)">{{ getTaskStatusText(record.status) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'businessScene'">
            <a-tag :color="getSceneColor(record.businessScene)">{{ getSceneText(record.businessScene) }}</a-tag>
          </template>
          <template v-else-if="column.key === 'actions'">
            <a-button type="link" size="small" @click="goTaskDetail(record.id)">任务详情</a-button>
          </template>
        </template>
      </a-table>
    </a-card>

    <a-card title="覆盖缺口" style="margin-top: 16px">
      <a-row :gutter="16">
        <a-col :xs="24" :lg="12">
          <a-descriptions bordered :column="1" size="small">
            <a-descriptions-item label="遗漏区域">{{ missingRegions.length }}</a-descriptions-item>
            <a-descriptions-item label="遗漏装置">{{ missingInstallations.length }}</a-descriptions-item>
            <a-descriptions-item label="遗漏设施/管路">{{ missingFacilities.length }}</a-descriptions-item>
            <a-descriptions-item label="遗漏部件">{{ missingComponents.length }}</a-descriptions-item>
            <a-descriptions-item label="遗漏规则">{{ missingRules.length }}</a-descriptions-item>
            <a-descriptions-item label="未绑定点位">{{ unboundFacilities.length }}</a-descriptions-item>
          </a-descriptions>
        </a-col>
        <a-col :xs="24" :lg="12">
          <div class="gap-list">
            <div class="gap-item"><strong>遗漏区域：</strong>{{ joinNames(missingRegions) }}</div>
            <div class="gap-item"><strong>遗漏装置：</strong>{{ joinNames(missingInstallations) }}</div>
            <div class="gap-item"><strong>遗漏设施/管路：</strong>{{ joinNames(missingFacilities) }}</div>
            <div class="gap-item"><strong>遗漏部件：</strong>{{ joinNames(missingComponents) }}</div>
            <div class="gap-item"><strong>遗漏规则：</strong>{{ joinNames(missingRules) }}</div>
            <div class="gap-item"><strong>未绑定点位：</strong>{{ joinNames(unboundFacilities) }}</div>
          </div>
        </a-col>
      </a-row>
    </a-card>

    <a-card title="最近执行记录" style="margin-top: 16px">
      <a-timeline>
        <a-timeline-item v-for="item in recentExecutions" :key="item.id" :color="item.color">
          <div class="timeline-title">{{ item.title }}</div>
          <div class="timeline-meta">{{ item.time }}</div>
          <div class="timeline-content">{{ item.content }}</div>
        </a-timeline-item>
      </a-timeline>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()
const plan = ref<any>()

const taskColumns = [
  { title: '任务名称', dataIndex: 'name', key: 'name' },
  { title: '任务编码', dataIndex: 'code', key: 'code', width: 170 },
  { title: '业务场景', key: 'businessScene', width: 130 },
  { title: '状态', key: 'status', width: 110 },
  { title: '创建时间', key: 'createdAt', width: 180 },
  { title: '操作', key: 'actions', width: 100 }
]

const regionNames = computed(() => {
  const regionMap = new Map<string, string>()
  inspectionStore.inspectionMaps.forEach((map: any) => {
    ;(map.regions || []).forEach((region: any) => regionMap.set(region.id, `${map.name} / ${region.name}`))
  })
  return (plan.value?.regionIds || []).map((id: string) => regionMap.get(id) || id)
})

const facilities = computed(() => {
  const ids = new Set(plan.value?.facilityIds || [])
  return inspectionStore.inspectionDevices.filter((item: any) => ids.size ? ids.has(item.id) : (plan.value?.regionIds || []).includes(item.areaId))
})

const installationNames = computed(() => Array.from(new Set(facilities.value.map((item: any) => item.installationName).filter(Boolean))))
const facilityNames = computed(() => facilities.value.map((item: any) => item.name))
const componentNames = computed(() => {
  const list: string[] = []
  facilities.value.forEach((item: any) => {
    ;(item.assetComponents || []).forEach((component: any) => list.push(component.name))
  })
  return list
})

const coverageSummary = computed(() => {
  const ruleIds = new Set<string>()
  facilities.value.forEach((item: any) => {
    ;(item.objectDetectionConfigs || []).forEach((cfg: any) => { if (cfg.ruleId) ruleIds.add(cfg.ruleId) })
    ;(item.assetComponents || []).forEach((component: any) => (component.ruleIds || []).forEach((id: string) => ruleIds.add(id)))
  })
  return {
    regionCount: (plan.value?.regionIds || []).length,
    installationCount: installationNames.value.length,
    facilityCount: facilities.value.length,
    componentCount: componentNames.value.length,
    ruleCount: ruleIds.size
  }
})

const derivedTasks = computed(() => {
  const source = inspectionStore.tasks.filter((item: any) => item.planId === plan.value?.id)
  return source.map((item: any) => ({
    ...item,
    createdAt: toDateTime(item.createdAt)
  }))
})

const allRegions = computed(() => {
  const list: string[] = []
  inspectionStore.inspectionMaps.forEach((map: any) => {
    ;(map.regions || []).forEach((region: any) => list.push(`${map.name} / ${region.name}`))
  })
  return list
})

const allInstallations = computed(() => Array.from(new Set(inspectionStore.inspectionDevices.map((item: any) => item.installationName).filter(Boolean))))
const allFacilities = computed(() => inspectionStore.inspectionDevices.map((item: any) => item.name))
const allComponents = computed(() => {
  const list: string[] = []
  inspectionStore.inspectionDevices.forEach((item: any) => (item.assetComponents || []).forEach((c: any) => list.push(c.name)))
  return list
})
const allRules = computed(() => {
  const set = new Set<string>()
  inspectionStore.inspectionDevices.forEach((item: any) => {
    ;(item.objectDetectionConfigs || []).forEach((cfg: any) => cfg.ruleId && set.add(cfg.ruleId))
    ;(item.assetComponents || []).forEach((c: any) => (c.ruleIds || []).forEach((id: string) => set.add(id)))
  })
  return Array.from(set)
})

const missingRegions = computed(() => allRegions.value.filter((name) => !regionNames.value.includes(name)))
const missingInstallations = computed(() => allInstallations.value.filter((name) => !installationNames.value.includes(name)))
const missingFacilities = computed(() => allFacilities.value.filter((name) => !facilityNames.value.includes(name)))
const missingComponents = computed(() => allComponents.value.filter((name) => !componentNames.value.includes(name)))
const missingRules = computed(() => {
  const set = new Set<string>()
  facilities.value.forEach((item: any) => {
    ;(item.objectDetectionConfigs || []).forEach((cfg: any) => cfg.ruleId && set.add(cfg.ruleId))
    ;(item.assetComponents || []).forEach((c: any) => (c.ruleIds || []).forEach((id: string) => set.add(id)))
  })
  return allRules.value.filter((id) => !set.has(id))
})
const unboundFacilities = computed(() => facilities.value.filter((item: any) => !(item.parkingPointBindings || []).length).map((item: any) => item.name))

const recentExecutions = computed(() => {
  const source = derivedTasks.value.slice(0, 5)
  return source.map((item: any, index: number) => ({
    id: item.id,
    title: `${item.name} / ${getTaskStatusText(item.status)}`,
    time: item.createdAt,
    content: `任务来源：${getSceneText(item.businessScene)}，执行点位 ${(item.inspectionPointIds || []).length} 个。`,
    color: index === 0 ? 'green' : 'blue'
  }))
})

function loadDetail() {
  inspectionStore.initialize()
  const id = String(route.params.id || '')
  plan.value = inspectionStore.getInspectionPlanById(id)
}

function toDateTime(value: any) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString()
}

function getStatusText(status?: string) {
  return ({ active: '启用', paused: '暂停', inactive: '终止' } as Record<string, string>)[status || ''] || '-'
}

function getStatusColor(status?: string) {
  return ({ active: 'green', paused: 'orange', inactive: 'red' } as Record<string, string>)[status || ''] || 'default'
}

function getSceneText(scene?: string) {
  return ({
    daily_inspection: '日常巡检',
    hazard_screening: '隐患排查',
    environment_check: '环境检查',
    operation_guard: '作业监护',
    work_ticket_guard: '作业票监护',
    emergency_arrival: '应急到场'
  } as Record<string, string>)[scene || ''] || '日常巡检'
}

function getSceneColor(scene?: string) {
  return ({
    daily_inspection: 'blue',
    hazard_screening: 'volcano',
    environment_check: 'green',
    operation_guard: 'purple',
    work_ticket_guard: 'gold',
    emergency_arrival: 'red'
  } as Record<string, string>)[scene || ''] || 'blue'
}

function getRiskText(level?: string) {
  return ({ normal: '普通', warning: '预警', alarm: '告警', critical_alarm: '严重告警', hazard: '隐患', major_hazard: '重大隐患' } as Record<string, string>)[level || ''] || '普通'
}

function getRiskColor(level?: string) {
  return ({ normal: 'default', warning: 'gold', alarm: 'orange', critical_alarm: 'red', hazard: 'volcano', major_hazard: 'magenta' } as Record<string, string>)[level || ''] || 'default'
}

function getTaskStatusText(status?: string) {
  return ({ pending: '待执行', running: '执行中', completed: '已完成', paused: '已暂停', cancelled: '已取消', failed: '失败' } as Record<string, string>)[status || ''] || '-'
}

function getTaskStatusColor(status?: string) {
  return ({ pending: 'default', running: 'blue', completed: 'green', paused: 'orange', cancelled: 'default', failed: 'red' } as Record<string, string>)[status || ''] || 'default'
}

function joinNames(list: string[]) {
  return list.length ? list.slice(0, 8).join('、') : '-'
}

function goTaskDetail(id: string) {
  router.push(`/management/task/detail/${id}`)
}

function goEdit() {
  if (!plan.value?.id) return
  router.push(`/management/plan/form/${plan.value.id}`)
}

function goBack() {
  router.push('/management/plan/list')
}

onMounted(loadDetail)
</script>

<style scoped lang="css">
.inspection-plan-detail {
  width: 100%;
}
.group-list {
  display: grid;
  gap: 10px;
}
.group-item h4 {
  margin: 0 0 6px;
  font-size: 13px;
}
.gap-list {
  display: grid;
  gap: 8px;
}
.gap-item {
  color: #334155;
  font-size: 13px;
}
.timeline-title {
  font-weight: 600;
}
.timeline-meta {
  color: #64748b;
  font-size: 12px;
}
.timeline-content {
  color: #475569;
}
</style>
