<template>
  <div class="component-usage-detail">
    <a-page-header :title="`${objectInfo?.name || '部件/连接'}详情`" @back="goBack">
      <template #extra>
        <a-button type="primary" @click="goToEdit">编辑设施</a-button>
      </template>
    </a-page-header>

    <a-card style="margin-top: 16px">
      <a-descriptions bordered :column="3" size="small">
        <a-descriptions-item label="名称">{{ objectInfo?.name || '-' }}</a-descriptions-item>
        <a-descriptions-item label="类型">
          <a-tag :color="objectType === 'component' ? 'blue' : 'purple'">{{ objectType === 'component' ? '部件' : '连接' }}</a-tag>
        </a-descriptions-item>
        <a-descriptions-item label="细分类型">{{ objectType === 'component' ? getComponentTypeText(objectInfo?.type) : '连接' }}</a-descriptions-item>
        <a-descriptions-item label="所属区域">{{ device?.areaName || '-' }}</a-descriptions-item>
        <a-descriptions-item label="所属设施">{{ device?.name || '-' }}</a-descriptions-item>
        <a-descriptions-item label="设备编号">{{ device?.deviceNo || device?.code || '-' }}</a-descriptions-item>
        <a-descriptions-item label="优先级">{{ priorityText }}</a-descriptions-item>
        <a-descriptions-item label="巡检周期">{{ inspectionCycleText }}</a-descriptions-item>
        <a-descriptions-item label="巡检窗口">{{ inspectionWindowText }}</a-descriptions-item>
      </a-descriptions>
    </a-card>

    <a-card style="margin-top: 16px">
      <a-tabs>
        <a-tab-pane key="relation" tab="关联信息">
          <a-alert
            type="info"
            show-icon
            style="margin-bottom: 12px"
            message="关联配置用于从部件/连接视角回看：哪些停车点会采它、当前生效哪些检测规则。真实数据优先来自设施编辑页，缺失时使用前端 mock 占位帮助识别业务链路。"
          />
          <a-row :gutter="[16, 16]">
            <a-col :xs="24" :xl="12">
              <a-card size="small" title="关联停车点">
                <a-table :columns="parkingColumns" :data-source="parkingRows" row-key="id" :pagination="false" size="small" />
              </a-card>
            </a-col>
            <a-col :xs="24" :xl="12">
              <a-card size="small" title="关联检测规则">
                <a-table :columns="ruleColumns" :data-source="ruleRows" row-key="id" :pagination="false" size="small">
                  <template #bodyCell="{ column, record }">
                    <template v-if="column.key === 'category'">
                      <a-tag>{{ record.category }}</a-tag>
                    </template>
                    <template v-else-if="column.key === 'status'">
                      <a-tag :color="record.status === '启用' ? 'green' : 'default'">{{ record.status }}</a-tag>
                    </template>
                  </template>
                </a-table>
              </a-card>
            </a-col>
          </a-row>
        </a-tab-pane>

        <a-tab-pane key="history" tab="检测历史数据">
          <a-alert
            type="info"
            show-icon
            style="margin-bottom: 12px"
            message="当前为前端 mock 历史数据，用于表达从部件/连接视角查看历史检测记录、结果和证据入口。"
          />
          <a-table :columns="historyColumns" :data-source="historyRows" row-key="id" :pagination="{ pageSize: 8 }">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'status'">
                <a-tag :color="record.status === '正常' ? 'green' : record.status === '预警' ? 'orange' : 'red'">{{ record.status }}</a-tag>
              </template>
              <template v-else-if="column.key === 'evidence'">
                <div class="evidence-thumbs">
                  <div class="evidence-thumb">
                    <img :src="record.opticalImage" alt="光学成像" />
                    <span>光学</span>
                  </div>
                  <div class="evidence-thumb thermal">
                    <img :src="record.thermalImage" alt="热成像" />
                    <span>热成像</span>
                  </div>
                </div>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import { getDetectionItemConfigs } from '@/views/implementation/detection-item-config/model'

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()
const defaultDeviceImage = new URL('../../../设备.png', import.meta.url).href
const workshopImage = new URL('../../../车间.png', import.meta.url).href

const deviceId = computed(() => String(route.params.deviceId || ''))
const objectType = computed(() => String(route.params.objectType || 'component') as 'component' | 'connection')
const objectId = computed(() => String(route.params.objectId || ''))
const device = computed(() => inspectionStore.inspectionDevices.find(item => item.id === deviceId.value))

const objectInfo = computed<any>(() => {
  if (objectType.value === 'connection') {
    return (device.value?.connectionObjects || []).find(item => item.id === objectId.value)
  }
  return (device.value?.assetComponents || []).find(item => item.id === objectId.value)
})

const targetRef = computed(() => `${objectType.value}:${objectId.value}`)
const prioritySource = computed(() => objectInfo.value?.priority ? '部件/连接自定义' : '继承设施')
const inheritedPriority = computed(() => objectInfo.value?.priority || (device.value as any)?.priority || 'medium')
const priorityText = computed(() => `${getPriorityText(inheritedPriority.value)}（${prioritySource.value}）`)
const inspectionCycleSource = computed(() => objectInfo.value?.inspectionCycle ? '部件/连接自定义' : device.value?.inspectionCycle ? '继承设施' : '默认值')
const inspectionWindowSource = computed(() => objectInfo.value?.inspectionWindow ? '部件/连接自定义' : device.value?.inspectionWindow ? '继承设施' : '默认值')
const inheritedInspectionCycle = computed(() => objectInfo.value?.inspectionCycle || device.value?.inspectionCycle || '每日 1 次')
const inheritedInspectionWindow = computed(() => objectInfo.value?.inspectionWindow || device.value?.inspectionWindow || '08:00-18:00')
const inspectionCycleText = computed(() => `${normalizeCycleText(inheritedInspectionCycle.value)}（${inspectionCycleSource.value}）`)
const inspectionWindowText = computed(() => `${normalizeWindowText(inheritedInspectionWindow.value)}（${inspectionWindowSource.value}）`)

const parkingRows = computed(() => {
  const rows: Array<{ id: string; pointName: string; parkingName: string; mode: string }> = []
  ;(device.value?.parkingPointBindings || []).forEach((binding: any) => {
    if (!(binding.targetObjectRefs || []).includes(targetRef.value)) return
    const parkingIds = binding.parkingPointIds?.length ? binding.parkingPointIds : [binding.parkingPointId].filter(Boolean)
    const parkingNames = binding.parkingPointNames?.length ? binding.parkingPointNames : [binding.parkingPointName].filter(Boolean)
    parkingIds.forEach((parkingId: string, index: number) => {
      rows.push({
        id: `${binding.id}-${parkingId}`,
        pointName: binding.inspectionPointName || '-',
        parkingName: parkingNames[index] || parkingId,
        mode: binding.inspectionMode === 'area' ? '区域巡检' : '固定巡检'
      })
    })
  })
  if (rows.length) return rows
  return [
    {
      id: `${deviceId.value}-${objectId.value}-mock-parking-front`,
      pointName: 'mock：设备正前方巡检点',
      parkingName: 'P1 正前方停车点',
      mode: '固定巡检'
    },
    {
      id: `${deviceId.value}-${objectId.value}-mock-parking-side`,
      pointName: 'mock：设备侧向巡检点',
      parkingName: 'P2 侧向停车点',
      mode: '区域巡检'
    }
  ]
})

const ruleRows = computed(() => {
  const rules = getDetectionItemConfigs()
  const hasConfiguredRules = Boolean(objectInfo.value?.ruleIds?.length)
  const configuredRuleIds = hasConfiguredRules
    ? objectInfo.value.ruleIds
    : rules
      .filter(rule => isRuleMatched(rule))
      .slice(0, 3)
      .map(rule => rule.id)
  return configuredRuleIds.map((ruleId: string) => {
    const rule = rules.find(item => item.id === ruleId)
    return {
      id: ruleId,
      name: rule?.name || ruleId,
      category: rule?.category || '-',
      version: rule?.version || 'V1',
      source: hasConfiguredRules ? '部件/连接显式关联' : '按对象类别 mock 匹配',
      status: rule?.enabled === false ? '停用' : '启用'
    }
  })
})

const historyRows = computed(() => {
  const baseRules = ruleRows.value.length ? ruleRows.value : [{ id: 'rule-default', name: '默认视觉识别', category: '视觉识别', status: '启用' }]
  const baseParkings = parkingRows.value.length ? parkingRows.value : [{ id: 'parking-default', parkingName: '未关联停车点' }]
  return Array.from({ length: 8 }).map((_, index) => {
    const rule = baseRules[index % baseRules.length]
    const parking = baseParkings[index % baseParkings.length]
    const status = index % 5 === 0 ? '告警' : index % 3 === 0 ? '预警' : '正常'
    return {
      id: `history-${index}`,
      planName: index % 2 === 0 ? '化工区日常巡检计划' : '重点设备专项巡检计划',
      taskName: `巡检任务-${String(2400 + index)}`,
      robotName: index % 2 === 0 ? '巡检机器人 R-01' : '防爆巡检机器人 R-03',
      time: `2026-04-${String(24 - index).padStart(2, '0')} 10:${String(12 + index).padStart(2, '0')}`,
      parkingName: parking.parkingName,
      ruleName: rule.name,
      status,
      recognitionValue: buildRecognitionValue(rule.name, status, index),
      conclusion: buildConclusion(rule.name, status),
      opticalImage: defaultDeviceImage,
      thermalImage: workshopImage
    }
  })
})

const parkingColumns = [
  { title: '停车点', dataIndex: 'parkingName', key: 'parkingName' },
  { title: '所属巡检点', dataIndex: 'pointName', key: 'pointName' },
  { title: '巡检模式', dataIndex: 'mode', key: 'mode', width: 120 }
]

const ruleColumns = [
  { title: '检测规则', dataIndex: 'name', key: 'name' },
  { title: '检测类别', key: 'category', width: 130 },
  { title: '规则版本', dataIndex: 'version', key: 'version', width: 100 },
  { title: '生效来源', dataIndex: 'source', key: 'source', width: 160 },
  { title: '状态', dataIndex: 'status', key: 'status', width: 100 }
]

const historyColumns = [
  { title: '计划名称', dataIndex: 'planName', key: 'planName', width: 180 },
  { title: '任务名称', dataIndex: 'taskName', key: 'taskName', width: 150 },
  { title: '检测机器人', dataIndex: 'robotName', key: 'robotName', width: 160 },
  { title: '停车点', dataIndex: 'parkingName', key: 'parkingName' },
  { title: '检测规则', dataIndex: 'ruleName', key: 'ruleName' },
  { title: '检测时间', dataIndex: 'time', key: 'time', width: 180 },
  { title: '检测结果', key: 'status', width: 110 },
  { title: '识别值/说明', dataIndex: 'recognitionValue', key: 'recognitionValue', width: 220 },
  { title: '检测结论', dataIndex: 'conclusion', key: 'conclusion', width: 240 },
  { title: '证据', key: 'evidence', width: 170 }
]

function getComponentTypeText(type?: string) {
  const map: Record<string, string> = {
    valve: '阀门',
    meter: '压力表',
    temperature_gauge: '温度表',
    flange: '法兰',
    pipe: '管体',
    motor: '电机',
    cable: '电缆',
    joint: '接头',
    sensor: '传感器',
    screw: '螺杆',
    other: '其他'
  }
  return type ? map[type] || type : '-'
}

function getPriorityText(priority?: string) {
  return ({ high: '高', medium: '中', low: '低' } as Record<string, string>)[priority || ''] || priority || '中'
}

function normalizeCycleText(value?: string) {
  if (!value || value === '继承设施') return '每日 1 次'
  if (value === '每日') return '每日 1 次'
  if (value === '每周') return '每周 1 次'
  return value
}

function normalizeWindowText(value?: string) {
  if (!value || value === '继承设施') return '08:00-18:00'
  return value
}

function isRuleMatched(rule: any) {
  const targetTypes = rule.targetTypes || []
  const targetDetails = rule.targetDetails || ''
  if (objectType.value === 'connection') {
    return targetTypes.includes('连接部位') || targetDetails.includes('连接') || targetDetails.includes('法兰')
  }
  const name = objectInfo.value?.name || ''
  const typeText = getComponentTypeText(objectInfo.value?.type)
  return targetTypes.includes('设施部件') || targetDetails.includes(name) || targetDetails.includes(typeText)
}

function buildConclusion(ruleName: string, status: string) {
  if (ruleName.includes('热') || ruleName.includes('温')) {
    return status === '正常' ? '温度分布正常，未发现异常热点' : status === '预警' ? '局部温升偏高，建议复核趋势' : '热成像识别到明显异常热点'
  }
  if (ruleName.includes('气')) {
    return status === '正常' ? '气体浓度处于正常范围' : status === '预警' ? '气体浓度接近预警阈值' : '气体检测超过告警阈值'
  }
  return status === '正常' ? '图像识别正常，外观与状态未见异常' : status === '预警' ? '视觉识别存在轻微偏差，建议人工复核' : '视觉识别命中异常特征'
}

function buildRecognitionValue(ruleName: string, status: string, index: number) {
  if (ruleName.includes('热') || ruleName.includes('温')) {
    return status === '正常' ? `${42 + index}℃，最高温差 2.1℃` : status === '预警' ? `${68 + index}℃，局部温升偏高` : `${86 + index}℃，疑似过热点`
  }
  if (ruleName.includes('气')) {
    return status === '正常' ? 'LEL 8%，VOC 12ppm' : status === '预警' ? 'LEL 18%，接近预警阈值' : 'LEL 35%，超过告警阈值'
  }
  if (ruleName.includes('读数') || ruleName.includes('仪表')) {
    return status === '正常' ? `识别读数 ${1.2 + index / 10}MPa` : status === '预警' ? '读数接近上限，置信度 0.86' : '读数超限，置信度 0.91'
  }
  return status === '正常' ? '外观完整、状态正常、置信度 0.94' : status === '预警' ? '局部锈蚀/遮挡，置信度 0.82' : '识别到裂纹/渗漏疑似特征，置信度 0.89'
}

function goBack() {
  router.push('/implementation/device/component-usage')
}

function goToEdit() {
  router.push(`/implementation/device/form/${deviceId.value}`)
}

onMounted(() => inspectionStore.initialize())
</script>

<style scoped lang="css">
.component-usage-detail {
  width: 100%;
}

.evidence-thumbs {
  display: flex;
  gap: 8px;
}

.evidence-thumb {
  display: grid;
  gap: 3px;
  width: 64px;
  color: #64748b;
  font-size: 11px;
  text-align: center;
}

.evidence-thumb img {
  width: 64px;
  height: 42px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
  object-fit: cover;
}

.evidence-thumb.thermal img {
  filter: saturate(1.4) hue-rotate(180deg) contrast(1.08);
}
</style>
