<template>
  <div>
    <a-page-header :title="isEdit ? '编辑安全策略' : '新增安全策略'" @back="goBack" />

    <a-card style="margin-top: 16px">
      <a-form layout="vertical">
        <!-- 基本信息 -->
        <a-divider orientation="left" style="margin-top: 0">基本信息</a-divider>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item label="策略名称" required>
              <a-input v-model:value="form.name" placeholder="如：装置区安全策略" />
            </a-form-item>
          </a-col>
          <a-col :span="4">
            <a-form-item label="优先级">
              <a-select v-model:value="form.priority">
                <a-select-option v-for="opt in priorityOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="4">
            <a-form-item label="启用状态">
              <a-switch v-model:checked="form.enabled" checked-children="启用" un-checked-children="停用" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="状态">
              <a-select v-model:value="form.status">
                <a-select-option v-for="s in statusOptions" :key="s" :value="s">{{ s }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="24">
            <a-form-item label="策略说明">
              <a-textarea v-model:value="form.description" :rows="2" placeholder="描述该策略的适用场景和注意事项" />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 速度与安全距离 -->
        <a-divider orientation="left">速度与安全距离</a-divider>
        <a-row :gutter="16">
          <a-col :span="6">
            <a-form-item label="正常行驶速度 (km/h)">
              <a-input-number v-model:value="form.normalSpeed" :min="0.1" :max="20" :step="0.1" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item label="最高限速 (km/h)">
              <a-input-number v-model:value="form.maxSpeed" :min="0.1" :max="30" :step="0.1" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item>
              <template #label>
                <a-tooltip title="机器人与障碍物之间的最小物理安全距离，与速度无关">
                  最小安全距离 (m) <a-icon type="question-circle" />
                </a-tooltip>
              </template>
              <a-input-number v-model:value="form.minSafeDistance" :min="0" :max="5" :step="0.05" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item>
              <template #label>
                <a-tooltip title="速度每增加 1km/h，安全边界在最小距离基础上按此比例膨胀。公式：实际安全距离 = 最小安全距离 × (1 + 速度 × 膨胀系数/100)">
                  速度膨胀系数 (%) <a-icon type="question-circle" />
                </a-tooltip>
              </template>
              <a-input-number v-model:value="form.speedExpansionFactor" :min="0" :max="200" :step="5" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>
        <a-row :gutter="16">
          <a-col :span="6">
            <a-form-item label="前方无障碍检测距离 (m)">
              <a-input-number v-model:value="form.clearDistanceForFullSpeed" :min="5" :max="100" :step="5" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="18">
            <a-form-item>
              <template #label>
                <a-tooltip title="前方检测距离内无障碍物时以最高限速行驶，否则以正常速度行驶">
                  速度自适应说明 <a-icon type="question-circle" />
                </a-tooltip>
              </template>
              <a-alert :message="`当前策略：前方 ${form.clearDistanceForFullSpeed}m 内无障碍 → ${form.maxSpeed}km/h；有障碍 → ${form.normalSpeed}km/h`" type="info" banner />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 避障策略 -->
        <a-divider orientation="left">避障策略</a-divider>
        <a-row :gutter="16">
          <a-col :span="6">
            <a-form-item>
              <template #label>
                <a-tooltip title="正常通行时，障碍物安全边界在最小安全距离基础上的膨胀范围下限">
                  最小膨胀系数 (%) <a-icon type="question-circle" />
                </a-tooltip>
              </template>
              <a-input-number v-model:value="form.obstacleExpansionMin" :min="0" :max="100" :step="5" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item>
              <template #label>
                <a-tooltip title="正常通行时，障碍物安全边界在最小安全距离基础上的膨胀范围上限">
                  最大膨胀系数 (%) <a-icon type="question-circle" />
                </a-tooltip>
              </template>
              <a-input-number v-model:value="form.obstacleExpansionMax" :min="0" :max="200" :step="5" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item>
              <template #label>
                <a-tooltip title="通行条件极有限时，允许机器人贴近最小安全距离通过（仅限窄道等特殊场景）">
                  允许擦边通行 <a-icon type="question-circle" />
                </a-tooltip>
              </template>
              <a-switch v-model:checked="form.allowEdgePass" checked-children="是" un-checked-children="否" />
            </a-form-item>
          </a-col>
          <a-col :span="6">
            <a-form-item>
              <template #label>
                <a-tooltip title="允许擦边通行时的最小通道宽度（米）">
                  擦边最小通道宽度 (m) <a-icon type="question-circle" />
                </a-tooltip>
              </template>
              <a-input-number v-model:value="form.edgePassMinWidth" :min="0.5" :max="3" :step="0.1" :precision="1" style="width: 100%" />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 遥控安全 -->
        <a-divider orientation="left">遥控安全</a-divider>
        <a-row :gutter="16">
          <a-col :span="8">
            <a-form-item>
              <template #label>
                <a-tooltip title="远程遥控时，超过该时间无新指令，车机自动降速或停车">
                  指令超时时间 (秒) <a-icon type="question-circle" />
                </a-tooltip>
              </template>
              <a-input-number v-model:value="form.commandTimeoutSec" :min="0.1" :max="5" :step="0.1" :precision="1" style="width: 100%" />
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item label="超时处理方式">
              <a-select v-model:value="form.timeoutAction">
                <a-select-option v-for="opt in timeoutActionOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="8">
            <a-form-item>
              <template #label>
                <a-tooltip title="遥控时是否保持避障功能开启">
                  遥控保持避障 <a-icon type="question-circle" />
                </a-tooltip>
              </template>
              <a-switch v-model:checked="form.remoteObstacleAvoidance" checked-children="开启" un-checked-children="关闭" />
            </a-form-item>
          </a-col>
        </a-row>

        <!-- 特殊路段处理 -->
        <a-divider orientation="left">特殊路段处理</a-divider>

        <!-- 窄道 -->
        <a-card size="small" style="margin-bottom: 12px" :bordered="true">
          <template #title>
            <a-space>
              <a-switch v-model:checked="form.narrowRoad.enabled" size="small" />
              <span>窄道处理</span>
              <a-tag v-if="form.narrowRoad.enabled" color="orange" size="small">启用</a-tag>
            </a-space>
          </template>
          <a-row :gutter="16" v-if="form.narrowRoad.enabled">
            <a-col :span="6">
              <a-form-item label="窄道判定宽度 (m)">
                <a-input-number v-model:value="form.narrowRoad.narrowWidthThreshold" :min="0.5" :max="3" :step="0.1" :precision="1" style="width: 100%" />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="窄道限速 (km/h)">
                <a-input-number v-model:value="form.narrowRoad.speedLimit" :min="0.1" :max="5" :step="0.1" style="width: 100%" />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="安全边界收缩至 (m)">
                <a-input-number v-model:value="form.narrowRoad.safeDistanceOverride" :min="0" :max="1" :step="0.05" style="width: 100%" />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="语音提醒">
                <a-switch v-model:checked="form.narrowRoad.voiceAlert" checked-children="开" un-checked-children="关" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-card>

        <!-- 便桥 -->
        <a-card size="small" style="margin-bottom: 12px" :bordered="true">
          <template #title>
            <a-space>
              <a-switch v-model:checked="form.bridge.enabled" size="small" />
              <span>便桥处理</span>
              <a-tag v-if="form.bridge.enabled" color="purple" size="small">启用</a-tag>
            </a-space>
          </template>
          <a-row :gutter="16" v-if="form.bridge.enabled">
            <a-col :span="5">
              <a-form-item label="便桥限速 (km/h)">
                <a-input-number v-model:value="form.bridge.speedLimit" :min="0.1" :max="5" :step="0.1" style="width: 100%" />
              </a-form-item>
            </a-col>
            <a-col :span="5">
              <a-form-item label="最小宽度 (m)">
                <a-input-number v-model:value="form.bridge.minWidth" :min="0.5" :max="3" :step="0.1" :precision="1" style="width: 100%" />
              </a-form-item>
            </a-col>
            <a-col :span="5">
              <a-form-item label="最大坡度 (°)">
                <a-input-number v-model:value="form.bridge.maxSlope" :min="0" :max="30" :step="1" style="width: 100%" />
              </a-form-item>
            </a-col>
            <a-col :span="5">
              <a-form-item label="冰雪路面降速 (%)">
                <a-input-number v-model:value="form.bridge.iceSlowdownPercent" :min="0" :max="100" :step="10" style="width: 100%" />
              </a-form-item>
            </a-col>
            <a-col :span="4">
              <a-form-item label="语音提醒">
                <a-switch v-model:checked="form.bridge.voiceAlert" checked-children="开" un-checked-children="关" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-card>

        <!-- 盲区 -->
        <a-card size="small" style="margin-bottom: 12px" :bordered="true">
          <template #title>
            <a-space>
              <a-switch v-model:checked="form.blindCorner.enabled" size="small" />
              <span>转角盲区处理</span>
              <a-tag v-if="form.blindCorner.enabled" color="red" size="small">启用</a-tag>
            </a-space>
          </template>
          <a-row :gutter="16" v-if="form.blindCorner.enabled">
            <a-col :span="6">
              <a-form-item label="盲区限速 (km/h)">
                <a-input-number v-model:value="form.blindCorner.speedLimit" :min="0.1" :max="3" :step="0.1" style="width: 100%" />
              </a-form-item>
            </a-col>
            <a-col :span="6">
              <a-form-item label="语音提醒">
                <a-switch v-model:checked="form.blindCorner.voiceAlert" checked-children="开" un-checked-children="关" />
              </a-form-item>
            </a-col>
            <a-col :span="12">
              <a-form-item label="语音播报内容">
                <a-input v-model:value="form.blindCorner.voiceMessage" placeholder="如：注意安全，机器人正在通过" />
              </a-form-item>
            </a-col>
          </a-row>
        </a-card>

        <!-- 操作按钮 -->
        <div style="margin-top: 16px; display: flex; justify-content: flex-end">
          <a-space>
            <a-button @click="goBack">取消</a-button>
            <a-button type="primary" @click="save(form.status)">保存</a-button>
            <a-button type="primary" @click="save('启用')">保存并启用</a-button>
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
import {
  getSafetyStrategies,
  upsertSafetyStrategy,
  priorityOptions,
  timeoutActionOptions,
  statusOptions,
  type PublishStatus,
  type SafetyStrategy
} from './model'

const route = useRoute()
const router = useRouter()
const isEdit = computed(() => route.path.includes('/edit/'))
const editId = computed(() => String(route.params.id || ''))
const source = computed(() => getSafetyStrategies().find(item => item.id === editId.value))

const defaultForm = (): SafetyStrategy => ({
  id: `ss-${Date.now()}`,
  name: '',
  description: '',
  priority: 'medium',
  status: '草稿',
  enabled: false,
  normalSpeed: 2,
  maxSpeed: 4,
  minSafeDistance: 0.2,
  speedExpansionFactor: 30,
  clearDistanceForFullSpeed: 20,
  obstacleExpansionMin: 20,
  obstacleExpansionMax: 50,
  allowEdgePass: false,
  edgePassMinWidth: 1.1,
  commandTimeoutSec: 0.4,
  timeoutAction: 'slowdown_then_stop',
  remoteObstacleAvoidance: true,
  narrowRoad: { enabled: false, narrowWidthThreshold: 1.5, speedLimit: 0.5, safeDistanceOverride: 0.2, voiceAlert: false },
  bridge: { enabled: false, speedLimit: 1, minWidth: 1.5, maxSlope: 15, iceSlowdownPercent: 50, voiceAlert: false },
  blindCorner: { enabled: false, speedLimit: 1, voiceAlert: false, voiceMessage: '' },
  referenceCount: 0,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
})

const form = reactive<SafetyStrategy>(source.value ? JSON.parse(JSON.stringify(source.value)) : defaultForm())

function goBack() {
  router.push('/implementation/safety-strategy/list')
}

function save(status: PublishStatus) {
  if (!form.name.trim()) {
    message.error('请输入策略名称')
    return
  }
  if (form.maxSpeed <= form.normalSpeed) {
    message.error('最高限速必须大于正常速度')
    return
  }
  if (form.obstacleExpansionMax < form.obstacleExpansionMin) {
    message.error('最大膨胀系数不能小于最小值')
    return
  }

  form.status = status
  form.enabled = status === '启用'
  form.updatedAt = new Date().toISOString()
  if (!isEdit.value) {
    form.createdAt = new Date().toISOString()
  }
  upsertSafetyStrategy(JSON.parse(JSON.stringify(form)))
  message.success(status === '启用' ? '已保存并启用' : status === '停用' ? '已保存并停用' : '草稿已保存')
  goBack()
}

onMounted(() => {
  if (source.value) {
    Object.assign(form, JSON.parse(JSON.stringify(source.value)))
  }
})
</script>
