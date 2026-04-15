<template>
  <div class="area-manage">
    <a-page-header title="区域管理" sub-title="对地图进行分区框选与维护" @back="goBack">
      <template #extra>
        <a-select v-model:value="activeMapId" style="width: 260px" placeholder="请选择地图">
          <a-select-option v-for="map in maps" :key="map.id" :value="map.id">
            {{ map.name }}
          </a-select-option>
        </a-select>
      </template>
    </a-page-header>

    <a-card style="margin-top: 16px">
      <a-row :gutter="16">
        <a-col :span="16">
          <div class="map-panel">
            <div class="panel-toolbar">
              <a-space>
                <a-button type="primary" :ghost="!drawMode" @click="toggleDrawMode">新建分区</a-button>
                <span class="help-text">
                  <template v-if="drawMode">按下并拖拽框选地图区域</template>
                  <template v-else>选择右侧分区后可在地图中拖动位置</template>
                </span>
              </a-space>
            </div>
            <div
              ref="stageRef"
              class="map-stage"
              @pointerdown.prevent="onPointerDown"
              @pointermove.prevent="onPointerMove"
              @pointerup.prevent="onPointerUp"
              @pointerleave.prevent="onPointerUp"
              @pointercancel.prevent="onPointerUp"
            >
              <img v-if="activeMap?.imageUrl" :src="activeMap.imageUrl" class="map-image" alt="地图预览" />
              <div v-else class="map-placeholder">{{ activeMap?.name || '未选择地图' }}</div>

              <div
                v-for="region in regions"
                :key="region.id"
                class="region-box"
                :data-region-id="region.id"
                :class="{ selected: selectedRegionId === region.id }"
                :style="{
                  left: `${region.x}px`,
                  top: `${region.y}px`,
                  width: `${region.width}px`,
                  height: `${region.height}px`,
                  borderColor: region.color,
                  background: `${region.color}1f`
                }"
                @click.stop="selectRegion(region.id)"
              >
                <span class="region-label" :style="{ background: region.color }">{{ region.name }}</span>
                <span v-if="editingRegionId === region.id" class="region-move-tip">可拖动移动</span>
              </div>

              <div
                v-if="draftRect.width > 0 && draftRect.height > 0"
                class="region-box draft"
                :style="{
                  left: `${draftRect.x}px`,
                  top: `${draftRect.y}px`,
                  width: `${draftRect.width}px`,
                  height: `${draftRect.height}px`,
                  borderColor: draftColor,
                  background: `${draftColor}1f`
                }"
              />
            </div>
          </div>
        </a-col>
        <a-col :span="8">
            <div class="form-panel">
            <a-table
              :data-source="regions"
              row-key="id"
              size="small"
              :pagination="false"
              :scroll="{ y: 460 }"
              :row-class-name="rowClassName"
              @row-click="() => {}"
            >
              <a-table-column title="分区名称" data-index="name">
                <template #default="{ record }">
                  <a-input v-if="editingRegionId === record.id" v-model:value="editingRegionName" size="small" />
                  <span v-else>{{ record.name }}</span>
                </template>
              </a-table-column>
              <a-table-column title="颜色" width="90">
                <template #default="{ record }">
                  <a-tag :color="record.color">{{ record.color }}</a-tag>
                </template>
              </a-table-column>
            <a-table-column title="操作" width="160">
                <template #default="{ record }">
                  <a-space :size="2">
                    <template v-if="editingRegionId === record.id">
                      <a-button type="link" size="small" @click="saveEdit(record.id)">保存</a-button>
                      <a-button type="link" size="small" @click="cancelEdit">取消</a-button>
                    </template>
                    <template v-else>
                      <a-button type="link" size="small" @click="startEdit(record.id)">编辑</a-button>
                      <a-popconfirm title="确认删除该分区吗？" ok-text="确认" cancel-text="取消" @confirm="removeRegion(record.id)">
                        <a-button type="link" size="small" danger>删除</a-button>
                      </a-popconfirm>
                    </template>
                  </a-space>
                </template>
              </a-table-column>
            </a-table>
          </div>
        </a-col>
      </a-row>
    </a-card>

    <a-modal
      v-model:open="createRegionVisible"
      title="新建分区"
      ok-text="确认创建"
      cancel-text="取消"
      @ok="confirmCreateRegion"
      @cancel="cancelCreateRegion"
    >
      <a-form layout="vertical">
        <a-form-item label="分区名称" required>
          <a-input v-model:value="createRegionName" placeholder="请输入分区名称" maxlength="20" />
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useInspectionStore } from '@/stores/inspection'
import type { MapRegion } from '@/types/inspection'

const router = useRouter()
const route = useRoute()
const inspectionStore = useInspectionStore()
const stageRef = ref<HTMLElement | null>(null)
const activeMapId = ref('')
const drawMode = ref(false)
const editingRegionId = ref('')
const editingRegionName = ref('')
const selectedRegionId = ref('')
const drawing = ref(false)
const moving = ref(false)
const createRegionVisible = ref(false)
const createRegionName = ref('')
const startPoint = reactive({ x: 0, y: 0 })
const draftRect = reactive({ x: 0, y: 0, width: 0, height: 0 })
const pendingRect = reactive({ x: 0, y: 0, width: 0, height: 0 })
const regions = ref<MapRegion[]>([])
const palette = ['#1677ff', '#52c41a', '#fa8c16', '#eb2f96', '#722ed1', '#13c2c2']

const maps = computed(() => inspectionStore.inspectionMaps)
const activeMap = computed(() => maps.value.find((m) => m.id === activeMapId.value))
const selectedRegion = computed(() => regions.value.find((r) => r.id === selectedRegionId.value))
const draftColor = computed(() => palette[regions.value.length % palette.length])

function goBack() {
  router.push('/implementation/map/list')
}

function toggleDrawMode() {
  drawMode.value = !drawMode.value
  moving.value = false
  editingRegionId.value = ''
}

function selectRegion(id: string) {
  selectedRegionId.value = id
}

function startEdit(regionId: string) {
  selectRegion(regionId)
  const region = selectedRegion.value
  if (!region) return
  drawMode.value = false
  moving.value = false
  editingRegionId.value = region.id
  editingRegionName.value = region.name
  message.info('已进入编辑模式：可拖动地图中的分区框调整位置')
}

function saveEdit(regionId: string) {
  const name = editingRegionName.value.trim()
  if (!name) {
    message.error('分区名称不能为空')
    return
  }
  const region = regions.value.find((r) => r.id === regionId)
  if (region) {
    region.name = name
  }
  editingRegionId.value = ''
  editingRegionName.value = ''
  moving.value = false
}

function cancelEdit() {
  editingRegionId.value = ''
  editingRegionName.value = ''
  moving.value = false
}

function removeRegion(regionId: string) {
  const removingSelected = selectedRegionId.value === regionId
  regions.value = regions.value.filter((r) => r.id !== regionId)
  if (removingSelected) {
    selectedRegionId.value = ''
    editingRegionId.value = ''
    editingRegionName.value = ''
    moving.value = false
  }
}

function getLocalPoint(event: PointerEvent) {
  if (!stageRef.value) return null
  const rect = stageRef.value.getBoundingClientRect()
  return {
    x: Math.max(0, Math.min(rect.width, event.clientX - rect.left)),
    y: Math.max(0, Math.min(rect.height, event.clientY - rect.top))
  }
}

function onPointerDown(event: PointerEvent) {
  const p = getLocalPoint(event)
  if (!p) return

  if (drawMode.value) {
    startPoint.x = p.x
    startPoint.y = p.y
    drawing.value = true
    draftRect.x = p.x
    draftRect.y = p.y
    draftRect.width = 0
    draftRect.height = 0
    return
  }

  const target = event.target as HTMLElement | null
  const regionId = target?.closest('.region-box')?.getAttribute('data-region-id')
  if (editingRegionId.value && selectedRegion.value && regionId === selectedRegion.value.id) {
    moving.value = true
    startPoint.x = p.x
    startPoint.y = p.y
  } else {
    moving.value = false
  }
}

function onPointerMove(event: PointerEvent) {
  const p = getLocalPoint(event)
  if (!p) return
  if (drawing.value) {
    draftRect.x = Math.min(startPoint.x, p.x)
    draftRect.y = Math.min(startPoint.y, p.y)
    draftRect.width = Math.abs(p.x - startPoint.x)
    draftRect.height = Math.abs(p.y - startPoint.y)
  } else if (moving.value && selectedRegion.value) {
    const dx = p.x - startPoint.x
    const dy = p.y - startPoint.y
    selectedRegion.value.x = Math.max(0, selectedRegion.value.x + dx)
    selectedRegion.value.y = Math.max(0, selectedRegion.value.y + dy)
    startPoint.x = p.x
    startPoint.y = p.y
  }
}

function onPointerUp() {
  if (drawing.value) {
    drawing.value = false
    if (draftRect.width < 10 || draftRect.height < 10) {
      draftRect.width = 0
      draftRect.height = 0
      return
    }
    pendingRect.x = Math.round(draftRect.x)
    pendingRect.y = Math.round(draftRect.y)
    pendingRect.width = Math.round(draftRect.width)
    pendingRect.height = Math.round(draftRect.height)
    createRegionName.value = `分区-${regions.value.length + 1}`
    createRegionVisible.value = true
    draftRect.width = 0
    draftRect.height = 0
    drawMode.value = false
  }
  moving.value = false
}

function resetPendingRect() {
  pendingRect.x = 0
  pendingRect.y = 0
  pendingRect.width = 0
  pendingRect.height = 0
}

function confirmCreateRegion() {
  const regionName = createRegionName.value.trim()
  if (!regionName) {
    message.error('请填写分区名称')
    return
  }
  const id = `region-${Date.now()}`
  regions.value.push({
    id,
    name: regionName,
    color: draftColor.value,
    x: pendingRect.x,
    y: pendingRect.y,
    width: pendingRect.width,
    height: pendingRect.height
  })
  selectedRegionId.value = id
  createRegionVisible.value = false
  createRegionName.value = ''
  resetPendingRect()
}

function cancelCreateRegion() {
  createRegionVisible.value = false
  createRegionName.value = ''
  resetPendingRect()
}

function reloadRegions() {
  regions.value = (activeMap.value?.regions || []).map((r) => ({ ...r }))
  selectedRegionId.value = ''
  editingRegionId.value = ''
  editingRegionName.value = ''
  moving.value = false
  drawMode.value = false
}

function rowClassName(record: MapRegion) {
  return selectedRegionId.value === record.id ? 'selected-row' : ''
}

onMounted(() => {
  inspectionStore.initialize()
  inspectionStore.fetchAllInspectionMaps()
  activeMapId.value = (route.query.mapId as string) || inspectionStore.inspectionMaps[0]?.id || ''
  reloadRegions()
})
</script>

<style scoped lang="scss">
.area-manage {
  width: 100%;

  .map-panel,
  .form-panel {
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    background: #fff;
    overflow: hidden;
  }

  .panel-toolbar {
    padding: 10px 12px;
    border-bottom: 1px solid #f0f0f0;
    background: #fafafa;
  }

  .help-text {
    color: #8c8c8c;
    font-size: 12px;
  }

  .map-stage {
    position: relative;
    height: 560px;
    background: #f6f8fb;
    overflow: hidden;
    cursor: crosshair;
    touch-action: none;
  }

  .map-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
    user-select: none;
    pointer-events: none;
  }

  .map-placeholder {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    color: #8c8c8c;
  }

  .region-box {
    position: absolute;
    border: 2px solid;
    box-sizing: border-box;
    border-radius: 2px;
  }

  .region-box.selected {
    box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.3);
  }

  .region-box.draft {
    border-style: dashed;
  }

  .region-label {
    position: absolute;
    left: 0;
    top: -24px;
    font-size: 12px;
    color: #fff;
    padding: 2px 8px;
    border-radius: 3px;
    white-space: nowrap;
  }

  .region-move-tip {
    position: absolute;
    right: 4px;
    bottom: 4px;
    font-size: 12px;
    line-height: 1;
    color: #fff;
    padding: 4px 6px;
    border-radius: 2px;
    background: rgba(0, 0, 0, 0.45);
    pointer-events: none;
  }

  :deep(.selected-row td) {
    background: #e6f7ff !important;
  }
}
</style>
