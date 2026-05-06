
<template>
  <div class="inspection-plan-form">
    <a-page-header :title="isEdit ? '编辑巡检计划' : '新建巡检计划'" @back="goBack" />

    <a-card style="margin-top: 16px">
      <a-alert
        type="info"
        show-icon
        style="margin-bottom: 16px"
        message="人工计划 = 固定执行；自动调度计划 = 调度台根据周期、窗口与资源动态生成执行结果。"
      />

      <a-form layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="计划名称" required>
              <a-input v-model:value="form.name" placeholder="请输入计划名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="计划编码" required>
              <a-input v-model:value="form.code" placeholder="请输入计划编码" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="计划类型" required>
              <a-radio-group v-model:value="form.planType">
                <a-radio-button value="manual">人工计划</a-radio-button>
              </a-radio-group>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="状态">
              <a-select v-model:value="form.status">
                <a-select-option value="active">启用</a-select-option>
                <a-select-option value="paused">暂停</a-select-option>
                <a-select-option value="inactive">停用</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="24">
            <a-form-item label="巡检点范围" required>
              <a-select
                v-model:value="form.inspectionPointIds"
                mode="multiple"
                placeholder="请选择巡检点"
                :max-tag-count="6"
              >
                <a-select-option v-for="point in inspectionStore.inspectionPoints" :key="point.id" :value="point.id">
                  {{ point.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row v-if="form.planType === 'manual'" :gutter="16">
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

        <a-alert
          v-else
          type="warning"
          show-icon
          style="margin-bottom: 16px"
          message="自动调度计划不在计划层展示周期与固定执行时间，最终任务由总调度台按规则动态拆分 / 合并 / 重排。"
        />

        <a-card size="small" title="计划覆盖预览" style="margin-bottom: 16px">
          <a-descriptions :column="4" size="small" bordered>
            <a-descriptions-item label="巡检点">{{ coverageSummary.pointCount }}</a-descriptions-item>
            <a-descriptions-item label="停车点">{{ coverageSummary.parkingPointCount }}</a-descriptions-item>
            <a-descriptions-item label="采集位">{{ coverageSummary.collectionPoseCount }}</a-descriptions-item>
            <a-descriptions-item label="检测配置">{{ coverageSummary.detectionConfigCount }}</a-descriptions-item>
            <a-descriptions-item label="覆盖检查">
              <a-tag :color="coverageSummary.hasMissingCoverage ? 'red' : 'green'">
                {{ coverageSummary.hasMissingCoverage ? '存在漏检风险' : '覆盖完整' }}
              </a-tag>
            </a-descriptions-item>
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
  status: 'active',
  inspectionPointIds: [],
  inspectionTimeStart: '08:00',
  inspectionTimeEnd: '18:00',
  description: ''
})

const selectedPoints = computed(() => inspectionStore.inspectionPoints.filter(point => form.inspectionPointIds.includes(point.id)))
const coverageSummary = computed(() => {
  const parkingPointCount = selectedPoints.value.reduce((sum, point) => sum + (point.parkingPoints?.length || 0), 0)
  const collectionPoseCount = selectedPoints.value.reduce((sum, point) => sum + (point.parkingPoints || []).reduce((poseSum, parking) => poseSum + parking.collectionPoses.length, 0), 0)
  const detectionConfigCount = selectedPoints.value.reduce((sum, point) => sum + (point.detectionConfigs?.filter(config => config.enabled).length || 0), 0)
  return {
    pointCount: selectedPoints.value.length,
    parkingPointCount,
    collectionPoseCount,
    detectionConfigCount,
    hasMissingCoverage: !selectedPoints.value.length || parkingPointCount === 0 || collectionPoseCount === 0 || detectionConfigCount === 0
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
  form.status = detail.status
  form.inspectionPointIds = [...(detail.inspectionPointIds || [])]
  form.inspectionTimeStart = detail.inspectionTimeStart || detail.startTime || '08:00'
  form.inspectionTimeEnd = detail.inspectionTimeEnd || detail.endTime || '18:00'
  form.description = detail.description || ''
}

function handleSave() {
  if (!form.name || !form.code || !form.inspectionPointIds.length) {
    message.error('请补充计划名称、编码和巡检点范围')
    return
  }

  const payload: any = {
    id: form.id || `plan-${Date.now()}`,
    name: form.name,
    code: form.code,
    robotId: 'robot-001',
    mapId: inspectionStore.inspectionMaps[0]?.id || 'map-001',
    routeId: '',
    pointIds: form.inspectionPointIds,
    pointOrders: form.inspectionPointIds.map((id: string, index: number) => ({ pointId: id, order: index + 1 })),
    status: form.status,
    type: 'point',
    inspectionPointIds: form.inspectionPointIds,
    planType: form.planType,
    inspectionTimeStart: form.planType === 'manual' ? form.inspectionTimeStart : '',
    inspectionTimeEnd: form.planType === 'manual' ? form.inspectionTimeEnd : '',
    description: form.description,
    hasMissingCoverage: coverageSummary.value.hasMissingCoverage,
    coverageSummary: coverageSummary.value,
    schedule: form.planType === 'manual'
      ? {
          type: 'manual-window',
          windowStart: form.inspectionTimeStart,
          windowEnd: form.inspectionTimeEnd
        }
      : undefined,
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
  message.success('巡检计划已保存')
  router.push('/management/plan/list')
}

function goBack() {
  router.push('/management/plan/list')
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
