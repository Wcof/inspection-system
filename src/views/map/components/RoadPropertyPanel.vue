<template>
  <div class="road-property-panel" :class="{ collapsed }">
    <div class="panel-collapse-btn right" @click="$emit('toggle')">
      <MenuUnfoldOutlined v-if="!collapsed" />
      <MenuFoldOutlined v-else />
    </div>
    <template v-if="!collapsed && selectedEntity">
      <div class="prop-header">
        <span class="prop-title">{{ title }}</span>
        <a-space size="small">
          <a-button v-if="!propertyEditing" size="small" type="link" @click="$emit('edit')">编辑</a-button>
          <template v-else>
            <a-button size="small" type="primary" ghost @click="$emit('save')">保存</a-button>
            <a-button size="small" @click="$emit('cancel')">取消</a-button>
          </template>
          <a-popconfirm title="确认删除？" @confirm="$emit('delete')" ok-text="确认删除" cancel-text="取消">
            <a-button size="small" danger type="link">删除</a-button>
          </a-popconfirm>
        </a-space>
      </div>

      <!-- 路段属性 -->
      <template v-if="entityType === 'segment' && editSegment">
        <a-form layout="vertical" size="small" class="prop-form" :class="{ 'form-readonly': !propertyEditing }">
          <a-divider orientation="left">基础信息</a-divider>
          <a-form-item label="路段名称"><a-input v-model:value="editSegment.name" /></a-form-item>
          <a-form-item label="路段编码"><a-input v-model:value="editSegment.code" /></a-form-item>
          <a-form-item label="路段类型">
            <a-select v-model:value="editSegment.segmentType">
              <a-select-option value="trunk">主干路</a-select-option>
              <a-select-option value="branch">次干路</a-select-option>
              <a-select-option value="patrol">巡检通道</a-select-option>
              <a-select-option value="service">服务通道</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="状态">
            <a-select v-model:value="editSegment.status">
              <a-select-option value="active">启用</a-select-option>
              <a-select-option value="inactive">停用</a-select-option>
              <a-select-option value="construction">施工中</a-select-option>
              <a-select-option value="blocked">禁行</a-select-option>
              <a-select-option value="maintenance">维护中</a-select-option>
            </a-select>
          </a-form-item>
          <a-divider orientation="left">通行属性</a-divider>
          <a-form-item label="通行方向">
            <a-radio-group v-model:value="editSegment.bidirectional">
              <a-radio :value="true">双向通行</a-radio>
              <a-radio :value="false">单向通行</a-radio>
            </a-radio-group>
          </a-form-item>
          <a-row :gutter="8">
            <a-col :span="12"><a-form-item label="限速(km/h)"><a-input-number v-model:value="editSegment.speedLimit" :min="0" style="width:100%" /></a-form-item></a-col>
            <a-col :span="12"><a-form-item label="路宽(m)"><a-input-number v-model:value="editSegment.width" :min="0" style="width:100%" /></a-form-item></a-col>
          </a-row>
          <a-form-item label="颜色（实时预览）">
            <a-input v-model:value="editSegment.color" placeholder="#1677ff" @update:value="(v: string) => $emit('colorChange', v)" />
            <div class="color-preview" :style="{ background: editSegment.color || '#1677ff' }"></div>
          </a-form-item>
          <a-form-item label="长度">{{ Math.round(editSegment.length) }} m（自动计算）</a-form-item>
          <a-form-item label="节点数">{{ editSegment.nodeIds.length }} 个</a-form-item>
        </a-form>
      </template>

      <!-- 点位属性 -->
      <template v-if="entityType === 'navpoint' && editNavPoint">
        <a-form layout="vertical" size="small" class="prop-form" :class="{ 'form-readonly': !propertyEditing }">
          <a-divider orientation="left">基础信息</a-divider>
          <a-form-item label="点位名称"><a-input v-model:value="editNavPoint.name" /></a-form-item>
          <a-form-item label="点位编码"><a-input v-model:value="editNavPoint.code" /></a-form-item>
          <a-form-item label="点位类型">
            <a-select v-model:value="editNavPoint.navType">
              <a-select-option value="inspection">巡检点</a-select-option>
              <a-select-option value="parking">停车点</a-select-option>
              <a-select-option value="charging">充电点</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="校准状态">
            <a-tag :color="editNavPoint.calibrationStatus === 'pending' ? 'orange' : 'green'">
              {{ editNavPoint.calibrationStatus === 'pending' ? '待校准' : '已校准' }}
            </a-tag>
          </a-form-item>
          <template v-if="editNavPoint.navType === 'charging'">
            <a-divider orientation="left">充电属性</a-divider>
            <a-form-item label="充电方式">
              <a-select v-model:value="editNavPoint.chargingMethod">
                <a-select-option value="auto">自动对接</a-select-option>
                <a-select-option value="manual">手动连接</a-select-option>
                <a-select-option value="wireless">无线充电</a-select-option>
              </a-select>
            </a-form-item>
          </template>
          <template v-if="editNavPoint.navType === 'parking'">
            <a-divider orientation="left">停车属性</a-divider>
            <a-row :gutter="8">
              <a-col :span="12"><a-form-item label="优先级"><a-input-number v-model:value="editNavPoint.parkingPriority" :min="1" :max="10" style="width:100%" /></a-form-item></a-col>
              <a-col :span="12"><a-form-item label="等待(秒)"><a-input-number v-model:value="editNavPoint.maxWaitingTime" :min="0" style="width:100%" /></a-form-item></a-col>
            </a-row>
          </template>
          <a-form-item label="描述"><a-textarea v-model:value="editNavPoint.description" :rows="2" /></a-form-item>
        </a-form>
      </template>

      <!-- 区域属性 -->
      <template v-if="entityType === 'nogozone' && editNoGoZone">
        <a-form layout="vertical" size="small" class="prop-form" :class="{ 'form-readonly': !propertyEditing }">
          <a-divider orientation="left">基础信息</a-divider>
          <a-form-item label="区域名称"><a-input v-model:value="editNoGoZone.name" /></a-form-item>
          <a-form-item label="区域编码"><a-input v-model:value="editNoGoZone.code" /></a-form-item>
          <a-form-item label="区域类型">
            <a-select v-model:value="editNoGoZone.zoneType">
              <a-select-option value="normal">正常通行</a-select-option>
              <a-select-option value="forbidden">禁止通行</a-select-option>
            </a-select>
          </a-form-item>
          <a-divider orientation="left">危区策略</a-divider>
          <a-form-item label="危区分类">
            <a-select v-model:value="editNoGoZone.zoneClass">
              <a-select-option value="Z0">普通区 Z0</a-select-option>
              <a-select-option value="Z1">危区 Z1</a-select-option>
              <a-select-option value="Z2">禁入区 Z2</a-select-option>
            </a-select>
          </a-form-item>
          <template v-if="editNoGoZone.zoneClass === 'Z1'">
            <a-collapse ghost size="small">
              <a-collapse-panel key="hazard" header="高级策略">
                <a-form-item label="高温等待阈值(°C)">
                  <a-input-number :value="editNoGoZone.hazardPolicy?.waitThreshold ?? null" :min="0" style="width:100%" @update:value="(v: any) => { if (editNoGoZone) { editNoGoZone.hazardPolicy = editNoGoZone.hazardPolicy || {}; editNoGoZone.hazardPolicy.waitThreshold = v } }" />
                </a-form-item>
                <a-form-item label="禁入阈值(°C)">
                  <a-input-number :value="editNoGoZone.hazardPolicy?.blockThreshold ?? null" :min="0" style="width:100%" @update:value="(v: any) => { if (editNoGoZone) { editNoGoZone.hazardPolicy = editNoGoZone.hazardPolicy || {}; editNoGoZone.hazardPolicy.blockThreshold = v } }" />
                </a-form-item>
                <a-form-item label="撤离阈值(°C)">
                  <a-input-number :value="editNoGoZone.hazardPolicy?.evacuateThreshold ?? null" :min="0" style="width:100%" @update:value="(v: any) => { if (editNoGoZone) { editNoGoZone.hazardPolicy = editNoGoZone.hazardPolicy || {}; editNoGoZone.hazardPolicy.evacuateThreshold = v } }" />
                </a-form-item>
              </a-collapse-panel>
            </a-collapse>
          </template>
          <template v-if="editNoGoZone.zoneType === 'forbidden'">
            <a-form-item label="禁行等级">
              <a-select v-model:value="editNoGoZone.level">
                <a-select-option value="permanent">永久禁行</a-select-option>
                <a-select-option value="temporary">临时禁行</a-select-option>
                <a-select-option value="high_risk">高风险区域</a-select-option>
                <a-select-option value="maintenance">维修区域</a-select-option>
              </a-select>
            </a-form-item>
          </template>
        </a-form>
      </template>

      <!-- 路口属性 -->
      <template v-if="entityType === 'junction' && editJunction">
        <a-form layout="vertical" size="small" class="prop-form" :class="{ 'form-readonly': !propertyEditing }">
          <a-divider orientation="left">路口信息</a-divider>
          <a-form-item label="路口名称"><a-input v-model:value="editJunction.name" /></a-form-item>
          <a-form-item label="路口类型">
            <a-select v-model:value="editJunction.junctionType">
              <a-select-option value="normal">其他</a-select-option>
              <a-select-option value="t_junction">T字形</a-select-option>
              <a-select-option value="cross">十字形</a-select-option>
            </a-select>
          </a-form-item>
        </a-form>
      </template>
    </template>

    <template v-else-if="!collapsed">
      <div class="prop-empty">
        <a-empty :image-style="{ height: '48px' }">
          <template #description><span style="color: #999">点击地图元素或左侧列表<br/>查看和编辑属性</span></template>
        </a-empty>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons-vue'
import type { RoadSegment, Junction, NavigationPoint, NoGoZone } from '@/types/road-network'

const props = defineProps<{
  collapsed: boolean
  selectedEntity: { type: string; id: string } | null
  propertyEditing: boolean
  editSegment?: RoadSegment | null
  editJunction?: Junction | null
  editNavPoint?: NavigationPoint | null
  editNoGoZone?: NoGoZone | null
}>()

defineEmits<{
  (e: 'toggle'): void
  (e: 'edit'): void
  (e: 'save'): void
  (e: 'cancel'): void
  (e: 'delete'): void
  (e: 'colorChange', color: string): void
}>()

const entityType = computed(() => props.selectedEntity?.type || '')

const title = computed(() => {
  if (!props.selectedEntity) return ''
  const map: Record<string, string> = { segment: '路段属性', junction: '路口属性', navpoint: '点位属性', nogozone: '区域属性', node: '节点属性' }
  return map[props.selectedEntity.type] || '属性'
})
</script>

<style scoped lang="scss">
.road-property-panel {
  width: 25%; min-width: 260px; max-width: 360px;
  background: #fff; border-left: 1px solid #f0f0f0;
  display: flex; flex-direction: column; overflow-y: auto;
  position: relative;
  transition: width 0.3s ease, min-width 0.3s ease;
  .panel-collapse-btn {
    position: absolute; left: 0; top: 50%; transform: translateY(-50%);
    width: 20px; height: 48px; background: #fff;
    border: 1px solid #e8e8e8; border-left: none;
    border-radius: 0 4px 4px 0;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; z-index: 10; font-size: 12px; color: #86909c;
    &:hover { background: #f0f5ff; color: #1677ff; }
  }
  .prop-header {
    display: flex; justify-content: space-between; align-items: center;
    padding: 10px 12px; border-bottom: 1px solid #f0f0f0; flex-shrink: 0;
    .prop-title { font-size: 14px; font-weight: 600; color: #1d2129; }
  }
  .prop-form { padding: 8px 12px; flex: 1; overflow-y: auto; }
  .form-readonly {
    pointer-events: none;
    opacity: 0.65;
    :deep(.ant-input),
    :deep(.ant-select-selector),
    :deep(.ant-input-number),
    :deep(.ant-input-textarea textarea),
    :deep(.ant-btn) {
      background: #f5f5f5 !important;
      border-color: #d9d9d9 !important;
      color: #00000040 !important;
      cursor: not-allowed !important;
    }
  }
  .color-preview {
    width: 24px; height: 24px; border-radius: 4px;
    margin-top: 4px; border: 1px solid #e8e8e8;
  }
  .prop-empty { display: flex; align-items: center; justify-content: center; height: 100%; }
  &.collapsed { width: 36px; min-width: 36px; max-width: 36px; overflow: hidden; }
}
</style>
