<template>
  <div class="road-resource-tree" :class="{ collapsed }">
    <div class="panel-collapse-btn" @click="$emit('toggle')">
      <MenuFoldOutlined v-if="!collapsed" />
      <MenuUnfoldOutlined v-else />
    </div>
    <template v-if="!collapsed">
      <div class="tree-search">
        <a-input-search v-model:value="searchText" placeholder="搜索路段/点位/区域" size="small" allow-clear />
      </div>
      <a-tabs v-model:activeKey="activeTab" size="small" class="tree-tabs">
        <a-tab-pane key="segment" tab="路段">
          <div class="tree-list">
            <div v-for="item in filteredSegments" :key="item.id"
              class="tree-item"
              :class="{ active: isItemActive('segment', item.id) }"
              @click="$emit('select', 'segment', item.id)"
              @mouseenter="$emit('hover', { type: 'segment', id: item.id })"
              @mouseleave="$emit('hover', null)">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-meta">
                <a-tag size="small" style="font-size:10px;line-height:16px">{{ item.code }}</a-tag>
                <a-tag :color="statusColor(item.status)" size="small">{{ statusLabel(item.status) }}</a-tag>
                <span class="meta-text">{{ Math.round(item.length) }}m</span>
              </div>
            </div>
            <a-empty v-if="filteredSegments.length === 0" :image-style="{ height: '32px' }" description="暂无路段" />
          </div>
        </a-tab-pane>
        <a-tab-pane key="navpoint" tab="点位">
          <div class="tree-list">
            <div v-for="item in filteredNavPoints" :key="item.id"
              class="tree-item"
              :class="{ active: isItemActive('navpoint', item.id) }"
              @click="$emit('select', 'navpoint', item.id)"
              @mouseenter="$emit('hover', { type: 'navpoint', id: item.id })"
              @mouseleave="$emit('hover', null)">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-meta">
                <span class="meta-text">{{ item.code }}</span>
                <a-tag size="small" :color="navTypeColor(item.navType)">{{ navTypeLabel(item.navType) }}</a-tag>
              </div>
            </div>
            <a-empty v-if="filteredNavPoints.length === 0" :image-style="{ height: '32px' }" description="暂无点位" />
          </div>
        </a-tab-pane>
        <a-tab-pane key="nogozone" tab="区域">
          <div class="tree-list">
            <div v-for="item in filteredZones" :key="item.id"
              class="tree-item"
              :class="{ active: isItemActive('nogozone', item.id) }"
              @click="$emit('select', 'nogozone', item.id)"
              @mouseenter="$emit('hover', { type: 'nogozone', id: item.id })"
              @mouseleave="$emit('hover', null)">
              <div class="item-name">{{ item.name }}</div>
              <div class="item-meta">
                <a-tag :color="item.zoneType === 'forbidden' ? zoneLevelColor(item.level) : 'green'" size="small">
                  {{ item.zoneType === 'forbidden' ? zoneLevelLabel(item.level) : '正常通行' }}
                </a-tag>
              </div>
            </div>
            <a-empty v-if="filteredZones.length === 0" :image-style="{ height: '32px' }" description="暂无区域" />
          </div>
        </a-tab-pane>
      </a-tabs>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons-vue'
import type { RoadSegment, NavigationPoint, NoGoZone, RoadSegmentStatus, NavigationPointType, NoGoZoneLevel } from '@/types/road-network'

const props = defineProps<{
  collapsed: boolean
  segments: RoadSegment[]
  navPoints: NavigationPoint[]
  zones: NoGoZone[]
  selectedEntity: { type: string; id: string } | null
}>()

defineEmits<{
  (e: 'toggle'): void
  (e: 'select', type: string, id: string): void
  (e: 'hover', entity: { type: string; id: string } | null): void
}>()

const activeTab = ref('segment')
const searchText = ref('')

const filteredSegments = computed(() => {
  let list = props.segments
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(s => s.name.toLowerCase().includes(q) || s.code.toLowerCase().includes(q))
  }
  return list
})

const filteredNavPoints = computed(() => {
  let list = props.navPoints
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))
  }
  return list
})

const filteredZones = computed(() => {
  let list = props.zones
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(z => z.name.toLowerCase().includes(q) || z.code.toLowerCase().includes(q))
  }
  return list
})

function isItemActive(type: string, id: string) {
  return props.selectedEntity?.type === type && props.selectedEntity?.id === id
}

function statusColor(s: RoadSegmentStatus) {
  const map: Record<string, string> = { active: 'green', inactive: 'default', construction: 'orange', blocked: 'red', maintenance: 'blue' }
  return map[s] || 'default'
}
function statusLabel(s: RoadSegmentStatus) {
  const map: Record<string, string> = { active: '启用', inactive: '停用', construction: '施工中', blocked: '禁行', maintenance: '维护中' }
  return map[s] || s
}
function navTypeColor(t: NavigationPointType) {
  const map: Record<string, string> = { inspection: 'blue', parking: 'green', charging: 'lime' }
  return map[t] || 'default'
}
function navTypeLabel(t: NavigationPointType) {
  const map: Record<string, string> = { inspection: '巡检点', parking: '停车点', charging: '充电点' }
  return map[t] || t
}
function zoneLevelLabel(l: NoGoZoneLevel) {
  const map: Record<string, string> = { permanent: '永久禁行', temporary: '临时禁行', high_risk: '高风险', maintenance: '维修区域' }
  return map[l] || l
}
function zoneLevelColor(l: NoGoZoneLevel) {
  const map: Record<string, string> = { permanent: 'red', temporary: 'orange', high_risk: 'volcano', maintenance: 'blue' }
  return map[l] || 'default'
}
</script>

<style scoped lang="scss">
.road-resource-tree {
  width: 20%; min-width: 220px; max-width: 300px;
  background: #fff; border-right: 1px solid #f0f0f0;
  display: flex; flex-direction: column; overflow: hidden;
  position: relative;
  transition: width 0.3s ease, min-width 0.3s ease;
  .panel-collapse-btn {
    position: absolute; right: 0; top: 50%; transform: translateY(-50%);
    width: 20px; height: 48px; background: #fff;
    border: 1px solid #e8e8e8; border-right: none;
    border-radius: 4px 0 0 4px;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; z-index: 10; font-size: 12px; color: #86909c;
    &:hover { background: #f0f5ff; color: #1677ff; }
  }
  .tree-search { padding: 8px 8px 4px; flex-shrink: 0; }
  .tree-tabs { height: 100%; display: flex; flex-direction: column;
    :deep(.ant-tabs-content) { flex: 1; overflow: hidden; }
    :deep(.ant-tabs-tabpane) { height: 100%; overflow-y: auto; }
  }
  .tree-list { padding: 4px 8px; }
  .tree-item {
    padding: 8px 10px; border-radius: 6px; cursor: pointer;
    transition: background 0.15s; margin-bottom: 2px;
    &:hover { background: #f0f5ff; }
    &.active { background: #e6f4ff; border-left: 3px solid #1677ff; }
    .item-name { font-size: 13px; font-weight: 500; color: #1d2129; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-meta { display: flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 12px; .meta-text { color: #86909c; } }
  }
  &.collapsed {
    width: 36px; min-width: 36px; max-width: 36px;
    .panel-collapse-btn { right: 0; }
  }
}
</style>
