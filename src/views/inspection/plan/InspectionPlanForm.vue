<template>
  <div class="inspection-plan-form">
    <a-page-header :title="isEdit ? '编辑巡检计划' : '新建巡检计划'" @back="goBack">
    </a-page-header>

    <a-card style="margin-top: 16px">
      <a-form :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="计划名称" name="name" :rules="[{ required: true, message: '请输入计划名称' }]">
              <a-input v-model:value="form.name" placeholder="请输入计划名称" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="机器人" name="robotId">
              <a-select v-model:value="form.robotId" placeholder="请选择机器人（非必填）" style="width: 100%" allow-clear>
                <a-select-option v-for="robot in robots" :key="robot.id" :value="robot.id">
                  {{ robot.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12" v-if="form.type !== 'global'">
            <a-form-item label="区域" name="mapId" :rules="[{ required: true, message: '请选择区域' }]">
              <a-select v-model:value="form.mapId" placeholder="请选择区域" style="width: 100%" @change="handleMapChange">
                <a-select-option v-for="map in maps" :key="map.id" :value="map.id">
                  {{ map.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="计划类型" name="type" :rules="[{ required: true, message: '请选择计划类型' }]">
              <a-select v-model:value="form.type" placeholder="请选择计划类型" style="width: 100%" @change="handleTypeChange">
                <a-select-option value="point">点位巡检</a-select-option>
                <a-select-option value="patrol">巡逻巡检</a-select-option>
                <a-select-option value="global">全局巡检</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="巡检时间" name="inspectionTime" :rules="[{ required: true, message: '请选择巡检时间' }]">
              <a-time-range-picker
                v-model:value="inspectionTimeRange"
                format="HH:mm"
                value-format="HH:mm"
                style="width: 100%"
              />
            </a-form-item>
          </a-col>
        </a-row>



        <a-form-item label="调度类型" name="scheduleType" :rules="[{ required: true, message: '请选择调度类型' }]">
          <a-select v-model:value="form.scheduleType" placeholder="请选择调度类型" style="width: 100%" @change="handleScheduleTypeChange">
            <a-select-option value="weekly">每周</a-select-option>
            <a-select-option value="monthly">每月</a-select-option>
            <a-select-option value="once">一次性</a-select-option>
          </a-select>
        </a-form-item>

        <div v-if="form.scheduleType === 'weekly'">
          <a-form-item label="星期">
            <a-checkbox-group v-model:value="form.schedule.daysOfWeek">
              <a-checkbox :value="1">周一</a-checkbox>
              <a-checkbox :value="2">周二</a-checkbox>
              <a-checkbox :value="3">周三</a-checkbox>
              <a-checkbox :value="4">周四</a-checkbox>
              <a-checkbox :value="5">周五</a-checkbox>
              <a-checkbox :value="6">周六</a-checkbox>
              <a-checkbox :value="0">周日</a-checkbox>
            </a-checkbox-group>
          </a-form-item>
        </div>

        <div v-if="form.scheduleType === 'monthly'">
          <a-form-item label="日期">
            <a-checkbox-group v-model:value="form.schedule.daysOfMonth">
              <a-checkbox v-for="day in 30" :key="day" :value="day">{{ day }}号</a-checkbox>
            </a-checkbox-group>
          </a-form-item>
        </div>

        <div v-if="form.type !== 'global'">
          <a-form-item label="巡检点" name="inspectionPointIds" :rules="[{ required: true, message: '请选择巡检点' }]">
            <a-transfer
              v-model:target-keys="selectedPointIds"
              :data-source="availablePointOptions"
              :titles="['可选巡检点', '已选巡检点']"
              :list-style="{ width: '300px', height: '300px' }"
              @change="handlePointChange"
            >
              <template #render="{ record }">
                {{ record.name }} ({{ record.code }})
              </template>
            </a-transfer>
          </a-form-item>

          <a-form-item label="点位顺序编排">
            <a-table :data-source="sortedPoints" row-key="id" :pagination="false">
              <a-table-column title="顺序" key="order" width="80">
                <template #default="{ index }">
                  {{ index + 1 }}
                </template>
              </a-table-column>
              <a-table-column title="名称" data-index="name" key="name" />
              <a-table-column title="编码" data-index="code" key="code" width="160" />
              <a-table-column title="操作" key="actions" width="160">
                <template #default="{ index }">
                  <a-space>
                    <a-button size="small" @click="movePointUp(index)" :disabled="index === 0">上移</a-button>
                    <a-button size="small" @click="movePointDown(index)" :disabled="index === sortedPoints.length - 1">下移</a-button>
                  </a-space>
                </template>
              </a-table-column>
            </a-table>
          </a-form-item>
        </div>

        <a-divider>配置</a-divider>

        <a-row :gutter="16">
          <a-col :span="6">
            <a-form-item label="自动开始">
              <a-switch v-model:checked="form.config.autoStart" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="完成通知">
              <a-switch v-model:checked="form.config.notifyOnComplete" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="错误通知">
              <a-switch v-model:checked="form.config.notifyOnError" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="中断后自动恢复">
              <a-switch v-model:checked="form.config.autoResumeAfterInterrupt" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item>
          <a-space>
            <a-button type="primary" @click="handleSave" :loading="saving">保存</a-button>
            <a-button @click="goBack">取消</a-button>
          </a-space>
        </a-form-item>
      </a-form>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import { useRobotStore } from '@/stores/robot'
import { InspectionPlanStatus, InspectionTaskType, InspectionTaskInstanceStatus, ScheduleType } from '@/types/inspection'
import type { InspectionPlan, InspectionPoint, InspectionMap } from '@/types/inspection'
import { message } from 'ant-design-vue'
import { ExceptionStrategy } from '@/types'
import dayjs from 'dayjs'

const router = useRouter()
const route = useRoute()
const inspectionStore = useInspectionStore()
const robotStore = useRobotStore()

const saving = ref(false)
const isEdit = computed(() => !!route.params.id)
const robots = ref<any[]>([])
const maps = ref<InspectionMap[]>([])
const availablePoints = ref<InspectionPoint[]>([])
const availablePointOptions = computed(() => {
  return availablePoints.value.map(point => ({
    key: point.id,
    name: point.name,
    code: point.code
  }))
})
const selectedPointIds = ref<string[]>([])
const sortedPoints = ref<InspectionPoint[]>([])
const inspectionTimeRange = ref<string[]>([])

type PlanFormType = InspectionTaskType | 'global'
type InspectionPlanFormModel = Omit<InspectionPlan, 'type' | 'schedule'> & { type: PlanFormType; scheduleType: ScheduleType; schedule: any }

const form = reactive<InspectionPlanFormModel>({
  id: '',
  name: '',
  code: '',
  robotId: '',
  mapId: '',
  routeId: undefined,
  pointIds: [],
  pointOrders: [],
  status: InspectionPlanStatus.INACTIVE,
  type: InspectionTaskType.POINT,
  scheduleType: ScheduleType.WEEKLY,
  inspectionPointIds: [],
  inspectionPoints: undefined,
  path: undefined,
  schedule: {
    type: ScheduleType.WEEKLY,
    daysOfWeek: []
  },
  config: {
    autoStart: false,
    notifyOnComplete: false,
    notifyOnError: false,
    autoResumeAfterInterrupt: false
  },
  exceptionStrategy: {
    inspectionPointFailure: ExceptionStrategy.SKIP,
    robotFailure: ExceptionStrategy.SKIP,
    lowBattery: ExceptionStrategy.SKIP,
    signalLost: ExceptionStrategy.SKIP,
    timeout: ExceptionStrategy.SKIP,
    maxRetryCount: 3,
    retryInterval: 5000
  },
  createdAt: new Date(),
  updatedAt: new Date()
})

function goBack() {
  router.push('/management/plan/list')
}

function handleMapChange(mapId: string, resetSelection = true) {
  // 根据选择的地图过滤巡检点
  availablePoints.value = inspectionStore.inspectionPoints.filter(point => point.mapId === mapId)
  if (resetSelection) {
    selectedPointIds.value = []
    sortedPoints.value = []
  }
}

function handlePointChange(targetKeys: string[]) {
  selectedPointIds.value = targetKeys
  // 更新已选巡检点列表
  sortedPoints.value = targetKeys.map(id => inspectionStore.inspectionPoints.find(p => p.id === id)).filter(Boolean) as InspectionPoint[]
}

function handleTypeChange(type: string) {
  form.type = type as any
  if (type === 'global') {
    // 全局巡检不需要地图和点位
    form.mapId = ''
    selectedPointIds.value = []
    sortedPoints.value = []
  }
}

function handleScheduleTypeChange(type: ScheduleType | string) {
  const selectedType = type as ScheduleType
  form.scheduleType = selectedType
  form.schedule.type = selectedType
  // 重置调度配置
  if (selectedType === ScheduleType.WEEKLY) {
    form.schedule = {
      type: ScheduleType.WEEKLY,
      daysOfWeek: []
    }
  } else if (selectedType === ScheduleType.MONTHLY) {
    form.schedule = {
      type: ScheduleType.MONTHLY,
      daysOfMonth: []
    }
  } else if (selectedType === ScheduleType.ONCE) {
    form.schedule = {
      type: ScheduleType.ONCE
    }
  }
}

async function handleSave() {
  // 校验必填项
  if (!form.name || inspectionTimeRange.value.length !== 2) {
    message.error('请填写必填项')
    return
  }

  const startAt = parseTodayTime(inspectionTimeRange.value[0])
  const endAt = parseTodayTime(inspectionTimeRange.value[1])
  if (Number.isNaN(startAt.getTime()) || Number.isNaN(endAt.getTime())) {
    message.error('巡检时间格式无效')
    return
  }
  if (startAt >= endAt) {
    message.error('开始时间必须早于截止时间')
    return
  }

  if (form.type !== 'global' && (!form.mapId || selectedPointIds.value.length === 0)) {
    message.error('请选择区域和巡检点')
    return
  }

  if (!form.scheduleType) {
    message.error('请选择调度类型')
    return
  }

  if (form.scheduleType === ScheduleType.WEEKLY) {
    if (!Array.isArray(form.schedule.daysOfWeek) || form.schedule.daysOfWeek.length === 0) {
      message.error('请选择每周执行日期')
      return
    }
  }

  if (form.scheduleType === ScheduleType.MONTHLY) {
    if (!Array.isArray(form.schedule.daysOfMonth) || form.schedule.daysOfMonth.length === 0) {
      message.error('请选择每月执行日期')
      return
    }
    if (form.schedule.daysOfMonth.some((day: number) => day < 1 || day > 30)) {
      message.error('每月执行日期仅支持 1-30 号')
      return
    }
  }

  // 校验所选巡检点是否都关联了设备
  if (form.type !== 'global') {
    const hasDeviceIssues = selectedPointIds.value.some(pointId => {
      const devices = inspectionStore.getInspectionDevicesByInspectionPointId(pointId)
      return devices.length === 0
    })

    if (hasDeviceIssues) {
      message.error('部分巡检点未关联设备')
      return
    }
  }

  saving.value = true
  try {
    // 自动生成编码
    if (!form.code) {
      form.code = `INS-${Date.now()}`
    }

    // 构建点位顺序
    const pointOrders = sortedPoints.value.map((point, index) => ({
      pointId: point.id,
      order: index + 1
    }))

    const orderedPointIds = sortedPoints.value.map(point => point.id)
    const inspectionPointIds = form.type === 'global'
      ? []
      : (orderedPointIds.length > 0 ? orderedPointIds : selectedPointIds.value)

    // 生成路径（模拟）
    let path = undefined
    if (form.type !== 'global') {
      path = generatePath(form.mapId!, inspectionPointIds)
    }

    const planData: any = {
      id: isEdit.value ? route.params.id as string : `plan-${Date.now()}`,
      name: form.name!,
      code: form.code!,
      robotId: form.robotId || '',
      mapId: form.mapId!,
      pointIds: inspectionPointIds,
      pointOrders,
      type: form.type!,
      inspectionPointIds,
      path,
      schedule: form.schedule as any,
      status: isEdit.value ? form.status : 'active',
      startTime: startAt.toISOString(),
      endTime: endAt.toISOString(),
      inspectionTimeStart: startAt.toISOString(),
      inspectionTimeEnd: endAt.toISOString(),
      config: form.config!,
      exceptionStrategy: form.exceptionStrategy!,
      createdAt: isEdit.value ? new Date() : new Date(),
      updatedAt: new Date()
    }

    inspectionStore.saveInspectionPlan(planData)
    
    // 生成mock任务
    generateMockTasks(planData)
    
    message.success(isEdit.value ? '更新成功' : '创建成功')
    goBack()
  } finally {
    saving.value = false
  }
}

// 生成mock任务
function generateMockTasks(plan: any) {
  const start = new Date(plan.startTime)
  const end = new Date(plan.endTime)
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
    return
  }
  const tasks: any[] = []
  
  // 生成触发时间点
  const triggerTimes = generateTriggerTimes(plan.schedule, start, end)
  
  // 为每个触发点生成任务
  triggerTimes.forEach((time, index) => {
    const taskTime = new Date(time)
    const suffix = `${Date.now()}-${index}`
    const task = {
      id: `task-${suffix}`,
      planId: plan.id,
      name: `${plan.name} - ${taskTime.toLocaleString()}`,
      code: `TASK-${suffix}`,
      robotId: plan.robotId,
      routeId: plan.path?.id || 'route-001',
      mapId: plan.mapId,
      type: plan.type === InspectionTaskType.PATROL ? InspectionTaskType.PATROL : InspectionTaskType.POINT,
      inspectionPointIds: plan.inspectionPointIds,
      currentInspectionPointIndex: 0,
      status: InspectionTaskInstanceStatus.PENDING,
      config: plan.config,
      exceptionStrategy: plan.exceptionStrategy,
      exceptionLog: [],
      plannedExecuteAt: time,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    tasks.push(task)
  })
  
  // 保存任务
  tasks.forEach(task => {
    // 去重：使用 planId + plannedExecuteAt
    const existingTask = inspectionStore.tasks.find((t: any) => 
      t.planId === task.planId && t.plannedExecuteAt === task.plannedExecuteAt
    )
    if (!existingTask) {
      inspectionStore.saveTask(task)
    }
  })
}

// 生成触发时间点
function generateTriggerTimes(schedule: any, start: Date, end: Date): string[] {
  const times: string[] = []
  const baseHours = start.getHours()
  const baseMinutes = start.getMinutes()
  
  if (schedule.type === 'once') {
    times.push(start.toISOString())
  } else if (schedule.type === 'weekly') {
    if (!Array.isArray(schedule.daysOfWeek) || schedule.daysOfWeek.length === 0) {
      return times
    }
    
    let current = new Date(start)
    current.setHours(baseHours, baseMinutes, 0, 0)
    
    while (current <= end) {
      if (current >= start && schedule.daysOfWeek.includes(current.getDay())) {
        times.push(current.toISOString())
      }
      current.setDate(current.getDate() + 1)
    }
  } else if (schedule.type === 'monthly') {
    if (!Array.isArray(schedule.daysOfMonth) || schedule.daysOfMonth.length === 0) {
      return times
    }
    
    let current = new Date(start)
    current.setHours(baseHours, baseMinutes, 0, 0)
    
    while (current <= end) {
      if (current >= start && schedule.daysOfMonth.includes(current.getDate())) {
        times.push(current.toISOString())
      }
      current.setDate(current.getDate() + 1)
    }
  }
  
  return times
}

function parseTodayTime(timeText?: string): Date {
  const [hourText = '00', minuteText = '00'] = (timeText || '').split(':')
  const now = new Date()
  now.setHours(Number(hourText), Number(minuteText), 0, 0)
  return now
}

// 模拟生成路径
function generatePath(mapId: string, pointIds: string[]): any {
  // 实际项目中应调用真实的路径生成服务
  return {
    id: `path-${Date.now()}`,
    mapId,
    waypointIds: [],
    inspectionPointIds: pointIds,
    totalDistance: pointIds.length * 10,
    estimatedTimeSec: pointIds.length * 60
  }
}

onMounted(() => {
  inspectionStore.initialize()
  robotStore.initialize()
  robots.value = robotStore.robots
  maps.value = inspectionStore.inspectionMaps
  
  if (isEdit.value) {
    const plan = inspectionStore.getInspectionPlanById(route.params.id as string)
    if (plan) {
      Object.assign(form, plan)
      selectedPointIds.value = plan.inspectionPointIds
      handleMapChange(plan.mapId, false)
      if (plan.pointOrders && plan.pointOrders.length > 0) {
        sortedPoints.value = plan.pointOrders
          .sort((a, b) => a.order - b.order)
          .map(order => inspectionStore.inspectionPoints.find(p => p.id === order.pointId))
          .filter(Boolean) as InspectionPoint[]
      } else {
        sortedPoints.value = plan.inspectionPointIds
          .map(id => inspectionStore.inspectionPoints.find(p => p.id === id))
          .filter(Boolean) as InspectionPoint[]
      }

      if (plan.schedule?.type) {
        form.scheduleType = plan.schedule.type
      }
      if ((plan as any).startTime && (plan as any).endTime) {
        inspectionTimeRange.value = [
          dayjs((plan as any).startTime).format('HH:mm'),
          dayjs((plan as any).endTime).format('HH:mm')
        ]
      }
    }
  }
})

function movePointUp(index: number) {
  if (index <= 0) return
  const target = sortedPoints.value[index]
  sortedPoints.value.splice(index, 1)
  sortedPoints.value.splice(index - 1, 0, target)
}

function movePointDown(index: number) {
  if (index >= sortedPoints.value.length - 1) return
  const target = sortedPoints.value[index]
  sortedPoints.value.splice(index, 1)
  sortedPoints.value.splice(index + 1, 0, target)
}
</script>

<style scoped lang="scss">
.inspection-plan-form {
  width: 100%;
}

.point-item {
  display: flex;
  align-items: center;
  
  .point-index {
    font-weight: bold;
    margin-right: 12px;
    width: 24px;
  }
  
  .point-name {
    margin-right: 8px;
  }
  
  .point-code {
    color: #999;
    font-size: 12px;
  }
}
</style>
