<template>
  <div class="point-manage">
    <a-page-header
      :title="isListMode ? '点位管理' : `点位管理 - ${currentMap?.name || '未命名地图'}`"
      :sub-title="isListMode ? '统一管理巡检点、充电站、维修站、通行点，并通过 Tab 切换不同业务类型。' : '维护当前地图内的点位位置与基础属性。'"
    >
      <template #extra>
        <a-space v-if="isListMode">
          <a-button type="primary" @click="openCreateFromList">新增点位</a-button>
        </a-space>
        <a-space v-else>
          <a-button @click="backToList">返回点位列表</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-card v-if="isListMode" style="margin-top: 16px">
      <a-tabs v-model:activeKey="activeListTab">
        <a-tab-pane key="all" tab="全部">
          <a-table :columns="allColumns" :data-source="allTabRows" row-key="id">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'pointType'">
                <a-tag :color="getPointTypeColor(record.bizType)">{{ pointTypeText(record.bizType) }}</a-tag>
              </template>
              <template v-else-if="column.key === 'coordinate'">
                {{ formatCoordinate(record.raw.mapPosition) }}
              </template>
              <template v-else-if="column.key === 'reachable'">
                {{ getReachableText(record) }}
              </template>
              <template v-else-if="column.key === 'updatedAt'">
                {{ formatDate(record.raw.updatedAt) || '-' }}
              </template>
              <template v-else-if="column.key === 'actions'">
                <a-space>
                  <a-button type="link" size="small" @click="openTypeTab(record.bizType)">查看同类点位</a-button>
                  <a-button type="link" size="small" @click="goToMapScopedPage(record.mapId)">进入地图配置</a-button>
                  <a-button
                    v-if="record.bizType === 'inspection'"
                    type="link"
                    size="small"
                    @click="goToInspectionConfig(record.id)"
                  >
                    巡检配置
                  </a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <a-tab-pane key="inspection" tab="巡检点">
          <div class="search-panel">
            <a-form layout="vertical" :model="inspectionSearchForm" @submit.prevent>
              <a-row :gutter="[16, 8]">
                <a-col :xs="24" :sm="12" :md="8" :lg="6">
                  <a-form-item label="名称" class="search-item">
                    <a-input v-model:value="inspectionSearchForm.name" placeholder="请输入点位名称" allow-clear />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :md="8" :lg="6">
                  <a-form-item label="编码" class="search-item">
                    <a-input v-model:value="inspectionSearchForm.code" placeholder="请输入点位编码" allow-clear />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :md="8" :lg="6">
                  <a-form-item label="所属区域" class="search-item">
                    <a-select v-model:value="inspectionSearchForm.areaId" placeholder="请选择所属区域" allow-clear>
                      <a-select-option v-for="area in listAreaOptions" :key="area.id" :value="area.id">
                        {{ area.name }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :md="8" :lg="6">
                  <a-form-item label="校准状态" class="search-item">
                    <a-select v-model:value="inspectionSearchForm.calibrationStatus" placeholder="请选择校准状态" allow-clear>
                      <a-select-option value="calibrated">已校准</a-select-option>
                      <a-select-option value="pending">待校准</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :md="8" :lg="6">
                  <a-form-item label="更新时间" class="search-item">
                    <a-input v-model:value="inspectionSearchForm.updatedAt" placeholder="YYYY-MM-DD" allow-clear />
                  </a-form-item>
                </a-col>
              </a-row>
              <div class="search-actions">
                <a-space>
                  <a-button type="primary">搜索</a-button>
                  <a-button @click="resetInspectionSearch">重置</a-button>
                </a-space>
              </div>
            </a-form>
          </div>

          <a-table :columns="inspectionColumns" :data-source="inspectionTabRows" row-key="id">
            <template #expandedRowRender="{ record }">
              <div class="spatial-detail">
                <div class="spatial-summary">
                  <a-tag color="blue">装置区：{{ getWorkArea(record) }}</a-tag>
                  <a-tag color="green">覆盖对象 {{ getCoverageObjectCount(record) }}</a-tag>
                  <a-tag color="purple">采集位 {{ getCollectionPoseCount(record) }}</a-tag>
                  <a-tag color="orange">检测配置 {{ getDetectionConfigCount(record.id) }}</a-tag>
                </div>
                <a-alert
                  v-if="!record.raw.parkingPoints?.length"
                  type="warning"
                  show-icon
                  message="当前巡检点尚未补充采集位与检测配置"
                  description="可以先完成地图点位基础信息，再进入巡检配置页补充覆盖对象、采集位和检测配置。"
                />
                <a-row v-else :gutter="[12, 12]">
                  <a-col v-for="parking in record.raw.parkingPoints" :key="parking.id" :xs="24" :lg="12">
                    <div class="parking-card">
                      <div class="parking-title">
                        <span>{{ parking.name }}</span>
                        <a-tag :color="parking.constraint.reachable ? 'green' : 'red'">
                          {{ parking.constraint.reachable ? '可达' : '不可达' }}
                        </a-tag>
                      </div>
                      <a-descriptions size="small" :column="2" bordered>
                        <a-descriptions-item label="坐标">{{ parking.position.x }}, {{ parking.position.y }}</a-descriptions-item>
                        <a-descriptions-item label="朝向">{{ parking.position.yaw }}°</a-descriptions-item>
                        <a-descriptions-item label="倒车">{{ yesNo(parking.constraint.reverseRequired) }}</a-descriptions-item>
                        <a-descriptions-item label="原地掉头">{{ yesNo(parking.constraint.turnAroundRequired) }}</a-descriptions-item>
                        <a-descriptions-item label="窄路">{{ yesNo(parking.constraint.narrowRoad) }}</a-descriptions-item>
                        <a-descriptions-item label="坡道">{{ yesNo(parking.constraint.slope) }}</a-descriptions-item>
                        <a-descriptions-item label="便桥">{{ yesNo(parking.constraint.bridgeRequired) }}</a-descriptions-item>
                        <a-descriptions-item label="绕行">{{ yesNo(parking.constraint.detourRequired) }}</a-descriptions-item>
                      </a-descriptions>
                      <div class="pose-list">
                        <div v-for="pose in parking.collectionPoses" :key="pose.id" class="pose-item">
                          <b>{{ pose.targetName }}</b>
                          <span>{{ getDirectionText(pose.direction) }} / {{ getMethodText(pose.method) }} / {{ pose.distanceMeter }}m</span>
                          <span>云台 {{ pose.ptzYaw }}° / {{ pose.ptzPitch }}°，焦距 {{ pose.focalLength }}</span>
                          <span>可采条件：{{ pose.collectableCondition }}</span>
                        </div>
                      </div>
                    </div>
                  </a-col>
                </a-row>
              </div>
            </template>
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'previewImage'">
                <img
                  v-if="record.previewImageUrl"
                  :src="record.previewImageUrl"
                  alt="现场预览图"
                  style="width: 56px; height: 56px; object-fit: cover; border-radius: 4px"
                />
                <span v-else>-</span>
              </template>
              <template v-else-if="column.key === 'calibrationStatus'">
                <a-tag :color="record.raw.calibrationStatus === 'calibrated' ? 'green' : 'orange'">
                  {{ record.raw.calibrationStatus === 'calibrated' ? '已校准' : '待校准' }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'workArea'">
                {{ getWorkArea(record) }}
              </template>
              <template v-else-if="column.key === 'coverageObjectCount'">
                {{ getCoverageObjectCount(record) }}
              </template>
              <template v-else-if="column.key === 'collectionPoseCount'">
                {{ getCollectionPoseCount(record) }}
              </template>
              <template v-else-if="column.key === 'detectionConfigCount'">
                {{ getDetectionConfigCount(record.id) }}
              </template>
              <template v-else-if="column.key === 'missingConfig'">
                <a-tag :color="record.hasMissingConfig ? 'red' : 'green'">
                  {{ record.hasMissingConfig ? '存在漏配' : '配置完整' }}
                </a-tag>
              </template>
              <template v-else-if="column.key === 'updatedAt'">
                {{ formatDate(record.raw.updatedAt) || '-' }}
              </template>
              <template v-else-if="column.key === 'actions'">
                <a-space>
                  <a-button type="link" size="small" @click="goToPointDetail(record.id)">详情</a-button>
                  <a-button type="link" size="small" @click="goToInspectionConfig(record.id)">配置</a-button>
                  <a-button type="link" size="small" @click="viewDevices(record.id)">设施</a-button>
                  <a-button type="link" size="small" @click="handleCalibrate(record.raw)">校准</a-button>
                  <a-button type="link" size="small" danger @click="deleteListPoint(record)">删除</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <a-tab-pane key="charging" tab="充电站">
          <a-table :columns="baseTypeColumns" :data-source="chargingTabRows" row-key="id">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'coordinate'">
                {{ formatCoordinate(record.raw.mapPosition) }}
              </template>
              <template v-else-if="column.key === 'updatedAt'">
                {{ formatDate(record.raw.updatedAt) || '-' }}
              </template>
              <template v-else-if="column.key === 'actions'">
                <a-space>
                  <a-button type="link" size="small" @click="goToMapScopedPage(record.mapId)">地图配置</a-button>
                  <a-button type="link" size="small" @click="goToPointDetail(record.id)">详情</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <a-tab-pane key="maintenance" tab="维修站">
          <a-table :columns="baseTypeColumns" :data-source="maintenanceTabRows" row-key="id">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'coordinate'">
                {{ formatCoordinate(record.raw.mapPosition) }}
              </template>
              <template v-else-if="column.key === 'updatedAt'">
                {{ formatDate(record.raw.updatedAt) || '-' }}
              </template>
              <template v-else-if="column.key === 'actions'">
                <a-space>
                  <a-button type="link" size="small" @click="goToMapScopedPage(record.mapId)">地图配置</a-button>
                  <a-button type="link" size="small" @click="goToPointDetail(record.id)">详情</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>

        <a-tab-pane key="transit" tab="通行点">
          <a-table :columns="baseTypeColumns" :data-source="transitTabRows" row-key="id">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'coordinate'">
                {{ formatCoordinate(record.raw.mapPosition) }}
              </template>
              <template v-else-if="column.key === 'updatedAt'">
                {{ formatDate(record.raw.updatedAt) || '-' }}
              </template>
              <template v-else-if="column.key === 'actions'">
                <a-space>
                  <a-button type="link" size="small" @click="goToMapScopedPage(record.mapId)">地图配置</a-button>
                  <a-button type="link" size="small" @click="goToPointDetail(record.id)">详情</a-button>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-tab-pane>
      </a-tabs>
    </a-card>

    <template v-else>
      <div class="layout-grid">
        <a-card class="map-card" title="位置管理">
          <template #extra>
            <a-space v-if="mode !== 'moving'">
              <a-button type="primary" @click="enterAddMode">新增点位</a-button>
              <a-button @click="enterMoveMode">移动点位</a-button>
            </a-space>
            <a-space v-else>
              <a-button type="primary" @click="confirmMove">确认</a-button>
              <a-button @click="cancelMove">取消</a-button>
            </a-space>
          </template>

          <div class="map-stage" :style="mapStageStyle" @click="handleStageClick">
            <div class="map-mask" />
            <div class="map-tip">
              <template v-if="mode === 'adding'">新增模式：在地图中点击位置后填写点位信息。</template>
              <template v-else-if="mode === 'moving'">移动模式：先点击一个点位，再点击地图新位置。</template>
              <template v-else>查看模式：可点击点位高亮，或切换到新增/移动模式。</template>
            </div>

            <div
              v-for="point in points"
              :key="point.id"
              class="marker"
              :class="{ active: point.id === selectedPointId, moving: mode === 'moving' && point.id === activeMovePointId }"
              :style="{ left: `${point.mapX}%`, top: `${point.mapY}%` }"
              @click.stop="handlePointClick(point)"
            >
              <span class="marker-dot">{{ getShortType(point.bizType) }}</span>
              <span class="marker-text">{{ point.name }}</span>
            </div>
          </div>
        </a-card>

        <a-card title="属性管理列表">
          <a-table :columns="mapColumns" :data-source="points" row-key="id" :pagination="false" :scroll="{ y: 520 }">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'pointType'">
                <template v-if="editingId === record.id">
                  <a-select v-model:value="inlineEdit.type" style="width: 120px">
                    <a-select-option value="inspection">巡检点</a-select-option>
                    <a-select-option value="charging">充电站</a-select-option>
                    <a-select-option value="maintenance">维修站</a-select-option>
                    <a-select-option value="transit">通行点</a-select-option>
                  </a-select>
                </template>
                <a-tag v-else :color="getPointTypeColor(record.bizType)">{{ pointTypeText(record.bizType) }}</a-tag>
              </template>

              <template v-else-if="column.key === 'name'">
                <template v-if="editingId === record.id">
                  <a-input v-model:value="inlineEdit.name" />
                </template>
                <template v-else>{{ record.name }}</template>
              </template>

              <template v-else-if="column.key === 'location'">
                {{ record.mapX.toFixed(2) }}, {{ record.mapY.toFixed(2) }}
              </template>

              <template v-else-if="column.key === 'actions'">
                <a-space>
                  <template v-if="editingId === record.id">
                    <a-button type="link" size="small" @click="saveInlineEdit(record)">保存</a-button>
                    <a-button type="link" size="small" @click="cancelInlineEdit">取消</a-button>
                  </template>
                  <template v-else>
                    <a-button type="link" size="small" @click="openInlineEdit(record)">编辑</a-button>
                    <a-button type="link" size="small" danger @click="deletePoint(record)">删除</a-button>
                  </template>
                </a-space>
              </template>
            </template>
          </a-table>
        </a-card>
      </div>

      <a-modal v-model:open="addModalVisible" title="新增点位" @ok="createPoint" @cancel="cancelAdd">
        <a-form layout="vertical">
          <a-form-item label="点位名称" required>
            <a-input v-model:value="addForm.name" placeholder="请输入点位名称" />
          </a-form-item>
          <a-form-item label="点位类型" required>
            <a-select v-model:value="addForm.type">
              <a-select-option value="inspection">巡检点</a-select-option>
              <a-select-option value="charging">充电站</a-select-option>
              <a-select-option value="maintenance">维修站</a-select-option>
              <a-select-option value="transit">通行点</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="所属区域">
            <a-select v-model:value="addForm.areaId" allow-clear placeholder="请选择区域">
              <a-select-option v-for="area in areaOptions" :key="area.id" :value="area.id">{{ area.name }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="地图坐标">
            <a-input :value="`${addForm.mapX.toFixed(2)}, ${addForm.mapY.toFixed(2)}`" disabled />
          </a-form-item>
        </a-form>
      </a-modal>
    </template>

    <a-modal
      v-model:open="createFromListVisible"
      title="选择地图后新增点位"
      @ok="confirmCreateFromList"
      @cancel="createFromListVisible = false"
    >
      <a-form layout="vertical">
        <a-form-item label="地图" required>
          <a-select v-model:value="selectedMapForCreate" placeholder="请选择地图">
            <a-select-option v-for="map in inspectionStore.inspectionMaps" :key="map.id" :value="map.id">
              {{ map.name }}
            </a-select-option>
          </a-select>
        </a-form-item>
      </a-form>
    </a-modal>

    <a-modal v-model:open="calibrationModalVisible" title="校准坐标" width="600px" footer="">
      <div class="calibration-modal">
        <a-form layout="vertical" style="margin-bottom: 12px">
          <a-form-item label="选择机器人" required>
            <a-select v-model:value="selectedRobotId" placeholder="请选择机器人" @change="updateCalibration">
              <a-select-option v-for="robot in robotStore.robots" :key="robot.id" :value="robot.id">
                {{ robot.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
        </a-form>

        <div v-if="calibrationLoading" class="loading-container">
          <a-spin tip="正在获取机器人坐标..." />
        </div>
        <div v-else>
          <a-card title="机器人当前坐标">
            <a-row :gutter="16">
              <a-col :span="12">
                <a-descriptions :column="1">
                  <a-descriptions-item label="经度">{{ robotCoordinates.longitude.toFixed(6) }}</a-descriptions-item>
                  <a-descriptions-item label="纬度">{{ robotCoordinates.latitude.toFixed(6) }}</a-descriptions-item>
                  <a-descriptions-item label="海拔">{{ robotCoordinates.altitude.toFixed(2) }}</a-descriptions-item>
                </a-descriptions>
              </a-col>
              <a-col :span="12">
                <a-descriptions :column="1">
                  <a-descriptions-item label="地图X坐标">{{ robotCoordinates.mapX.toFixed(2) }}</a-descriptions-item>
                  <a-descriptions-item label="地图Y坐标">{{ robotCoordinates.mapY.toFixed(2) }}</a-descriptions-item>
                  <a-descriptions-item label="偏航角">{{ robotCoordinates.yaw.toFixed(2) }}</a-descriptions-item>
                </a-descriptions>
              </a-col>
            </a-row>
          </a-card>

          <div class="modal-actions">
            <a-space>
              <a-button @click="goToCockpit">前往驾驶舱</a-button>
              <a-button @click="cancelCalibration">取消</a-button>
              <a-button type="primary" @click="updateCalibration">更新</a-button>
              <a-button type="primary" @click="confirmCalibration">确认</a-button>
            </a-space>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import { useRobotStore } from '@/stores/robot'
import { CalibrationStatus, InspectionPointType, PositionSource } from '@/types/inspection'
import { ExceptionStrategy } from '@/types'
import type { CollectionMethod, CollectionPose, InspectionPoint, MapRegion } from '@/types/inspection'

type BizPointType = 'inspection' | 'charging' | 'maintenance' | 'transit'
type ListTabKey = 'all' | 'inspection' | 'charging' | 'maintenance' | 'transit'
type Mode = 'normal' | 'adding' | 'moving'

interface PointRow {
  id: string
  name: string
  code: string
  mapId: string
  mapName: string
  mapX: number
  mapY: number
  areaId?: string
  areaName?: string
  bizType: BizPointType
  raw: InspectionPoint
  previewImageUrl?: string
  hasMissingConfig: boolean
}

const workshopImage = new URL('../../车间.png', import.meta.url).href
const fallbackMapBackgroundUrl = new URL('../../地图.png', import.meta.url).href

const inspectionStore = useInspectionStore()
const robotStore = useRobotStore()
const route = useRoute()
const router = useRouter()

const selectedMapId = computed(() => (typeof route.query.mapId === 'string' ? route.query.mapId : ''))
const isListMode = computed(() => !selectedMapId.value)

const points = ref<PointRow[]>([])
const mode = ref<Mode>('normal')
const selectedPointId = ref('')
const activeMovePointId = ref('')
const currentPoint = ref<InspectionPoint | null>(null)
const calibrationModalVisible = ref(false)
const calibrationLoading = ref(false)
const selectedRobotId = ref('')
const robotCoordinates = ref({
  longitude: 0,
  latitude: 0,
  altitude: 0,
  mapX: 0,
  mapY: 0,
  yaw: 0
})

const editingId = ref('')
const inlineEdit = reactive({ name: '', type: 'inspection' as BizPointType })

const addModalVisible = ref(false)
const addForm = reactive({
  name: '',
  type: 'inspection' as BizPointType,
  areaId: '',
  mapX: 0,
  mapY: 0
})

const createFromListVisible = ref(false)
const selectedMapForCreate = ref('')
const moveDraft = ref<Record<string, { x: number; y: number }>>({})

const inspectionSearchForm = reactive({
  name: '',
  code: '',
  areaId: '',
  calibrationStatus: '',
  updatedAt: ''
})

const activeListTab = computed<ListTabKey>({
  get() {
    return normalizeListTab(route.query.tab)
  },
  set(value) {
    if (!isListMode.value) return
    router.replace({
      path: '/implementation/map/point-manage',
      query: value === 'all' ? {} : { tab: value }
    })
  }
})

const mapColumns = [
  { title: '点位名称', dataIndex: 'name', key: 'name' },
  { title: '点位编码', dataIndex: 'code', key: 'code', width: 160 },
  { title: '点位类型', key: 'pointType', width: 140 },
  { title: '所属区域', dataIndex: 'areaName', key: 'areaName', width: 150 },
  { title: '地图坐标', key: 'location', width: 170 },
  { title: '操作', key: 'actions', width: 140 }
]

const allColumns = [
  { title: '点位名称', dataIndex: 'name', key: 'name' },
  { title: '点位编码', dataIndex: 'code', key: 'code', width: 150 },
  { title: '点位类型', key: 'pointType', width: 110 },
  { title: '所属地图', dataIndex: 'mapName', key: 'mapName', width: 170 },
  { title: '所属区域 / 分区', dataIndex: 'areaName', key: 'areaName', width: 170 },
  { title: '坐标', key: 'coordinate', width: 140 },
  { title: '是否可达', key: 'reachable', width: 100 },
  { title: '更新时间', key: 'updatedAt', width: 170 },
  { title: '操作', key: 'actions', width: 260 }
]

const inspectionColumns = [
  { title: '巡检点名称', dataIndex: 'name', key: 'name' },
  { title: '编码', dataIndex: 'code', key: 'code', width: 130 },
  { title: '所属区域', dataIndex: 'areaName', key: 'areaName', width: 120 },
  { title: '装置区 / 分区', key: 'workArea', width: 150 },
  { title: '现场预览图', key: 'previewImage', width: 100 },
  { title: '覆盖对象', key: 'coverageObjectCount', width: 100 },
  { title: '采集位', key: 'collectionPoseCount', width: 90 },
  { title: '检测配置', key: 'detectionConfigCount', width: 100 },
  { title: '覆盖检查', key: 'missingConfig', width: 100 },
  { title: '校准状态', key: 'calibrationStatus', width: 100 },
  { title: '更新时间', key: 'updatedAt', width: 170 },
  { title: '操作', key: 'actions', width: 320 }
]

const baseTypeColumns = [
  { title: '点位名称', dataIndex: 'name', key: 'name' },
  { title: '点位编码', dataIndex: 'code', key: 'code', width: 150 },
  { title: '所属地图', dataIndex: 'mapName', key: 'mapName', width: 170 },
  { title: '所属区域', dataIndex: 'areaName', key: 'areaName', width: 170 },
  { title: '坐标', key: 'coordinate', width: 140 },
  { title: '更新时间', key: 'updatedAt', width: 170 },
  { title: '操作', key: 'actions', width: 180 }
]

const currentMap = computed(() => inspectionStore.inspectionMaps.find(map => map.id === selectedMapId.value))
const areaOptions = computed(() => currentMap.value?.regions || [])
const listAreaOptions = computed(() => {
  const map = new Map<string, string>()
  inspectionStore.inspectionMaps.forEach((item) => {
    item.regions?.forEach((region) => map.set(region.id, region.name))
  })
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
})

const allPointRows = computed<PointRow[]>(() =>
  inspectionStore.inspectionPoints.map((point) => buildPointRow(point))
)

const allTabRows = computed(() => allPointRows.value)
const inspectionBaseRows = computed(() => allPointRows.value.filter(point => point.bizType === 'inspection'))
const chargingTabRows = computed(() => allPointRows.value.filter(point => point.bizType === 'charging'))
const maintenanceTabRows = computed(() => allPointRows.value.filter(point => point.bizType === 'maintenance'))
const transitTabRows = computed(() => allPointRows.value.filter(point => point.bizType === 'transit'))

const inspectionTabRows = computed(() => {
  const name = inspectionSearchForm.name.trim().toLowerCase()
  const code = inspectionSearchForm.code.trim().toLowerCase()
  const areaId = inspectionSearchForm.areaId
  const calibrationStatus = inspectionSearchForm.calibrationStatus
  const updatedAt = inspectionSearchForm.updatedAt.trim()

  return inspectionBaseRows.value.filter((point) => {
    const matchesName = !name || point.name.toLowerCase().includes(name)
    const matchesCode = !code || point.code.toLowerCase().includes(code)
    const matchesArea = !areaId || point.areaId === areaId
    const matchesCalibration = !calibrationStatus || point.raw.calibrationStatus === calibrationStatus
    const updatedText = point.raw.updatedAt ? new Date(point.raw.updatedAt).toISOString().slice(0, 10) : ''
    const matchesUpdated = !updatedAt || updatedText.includes(updatedAt)
    return matchesName && matchesCode && matchesArea && matchesCalibration && matchesUpdated
  })
})

const mapStageStyle = computed(() => ({
  backgroundImage: `url(${currentMap.value?.imageUrl || fallbackMapBackgroundUrl})`,
  backgroundColor: '#eef3ff'
}))

function normalizeListTab(value: unknown): ListTabKey {
  if (value === 'inspection' || value === 'charging' || value === 'maintenance' || value === 'transit') return value
  return 'all'
}

function normalizeMapCoordinate(value?: number) {
  const raw = Number(value || 0)
  if (raw <= 100) return clamp(raw)
  if (raw <= 1000) return clamp(raw / 10)
  return clamp(raw / 20)
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Number(value.toFixed(2))))
}

function getBizTypeFromPoint(point: InspectionPoint): BizPointType {
  if (point.parkingPoints?.length) return 'inspection'
  const tag = String(point.description || '').match(/^\[(巡检点|停车点|充电点|充电站|维修站|通行点|临停点)\]/)?.[1]
  if (tag === '充电点' || tag === '充电站') return 'charging'
  if (tag === '维修站') return 'maintenance'
  if (tag === '通行点' || tag === '临停点') return 'transit'
  return 'inspection'
}

function getDescriptionByBizType(type: BizPointType, name: string) {
  if (type === 'charging') return `[充电站] ${name}`
  if (type === 'maintenance') return `[维修站] ${name}`
  if (type === 'transit') return `[通行点] ${name}`
  return `[巡检点] ${name}`
}

function pointTypeText(type: BizPointType) {
  if (type === 'charging') return '充电站'
  if (type === 'maintenance') return '维修站'
  if (type === 'transit') return '通行点'
  return '巡检点'
}

function getPointTypeColor(type: BizPointType) {
  if (type === 'charging') return 'green'
  if (type === 'maintenance') return 'orange'
  if (type === 'transit') return 'cyan'
  return 'blue'
}

function getShortType(type: BizPointType) {
  if (type === 'charging') return '充'
  if (type === 'maintenance') return '维'
  if (type === 'transit') return '通'
  return '巡'
}

function isMapExecutionPoint(point: InspectionPoint) {
  return !point.parkingPoints?.length
}

function buildPointRow(point: InspectionPoint): PointRow {
  const map = inspectionStore.inspectionMaps.find(item => item.id === point.mapId)
  const bizType = getBizTypeFromPoint(point)
  return {
    id: point.id,
    name: point.name,
    code: point.code,
    mapId: point.mapId,
    mapName: map?.name || point.mapId,
    mapX: normalizeMapCoordinate(point.mapPosition?.x),
    mapY: normalizeMapCoordinate(point.mapPosition?.y),
    areaId: point.areaId,
    areaName: resolveAreaName(point),
    bizType,
    raw: point,
    previewImageUrl: point.previewImageUrl || workshopImage,
    hasMissingConfig: hasMissingInspectionConfig(point)
  }
}

function resolveAreaName(point: InspectionPoint) {
  if (point.areaName) return point.areaName
  if (point.areaId) {
    return listAreaOptions.value.find(area => area.id === point.areaId)?.name || '未分区'
  }
  return '未分区'
}

function getReachableText(record: PointRow) {
  const parking = record.raw.parkingPoints?.[0]
  if (!parking) return record.bizType === 'inspection' ? '待配置' : '是'
  return parking.constraint.reachable ? '是' : '否'
}

function getWorkArea(record: PointRow) {
  return record.raw.workAreaName || record.areaName || '未配置装置区'
}

function getCollectionPoseCount(record: PointRow) {
  return (record.raw.parkingPoints || []).reduce((sum, parking) => sum + parking.collectionPoses.length, 0)
}

function getCoverageObjectCount(record: PointRow) {
  if (record.raw.coverageObjects?.length) return record.raw.coverageObjects.length
  const devices = inspectionStore.getInspectionDevicesByInspectionPointId(record.id)
  const componentCount = devices.reduce((sum, device) => sum + (device.assetComponents?.length || 0), 0)
  const connectionCount = devices.reduce((sum, device) => sum + (device.connectionObjects?.length || 0), 0)
  return componentCount + connectionCount + devices.length
}

function getDetectionConfigCount(pointId: string) {
  const point = inspectionStore.inspectionPoints.find(item => item.id === pointId)
  if (point?.detectionConfigs?.length) return point.detectionConfigs.filter(item => item.enabled).length
  return inspectionStore.getInspectionDevicesByInspectionPointId(pointId)
    .reduce((sum, device) => sum + (device.objectDetectionConfigs?.length || 0), 0)
}

function hasMissingInspectionConfig(point: InspectionPoint) {
  const row = buildPointRowForCheck(point)
  if (!row.parkingPointCount || !row.collectionPoseCount || !row.detectionConfigCount) return true
  return false
}

function buildPointRowForCheck(point: InspectionPoint) {
  const parkingPointCount = point.parkingPoints?.length || 0
  const collectionPoseCount = (point.parkingPoints || []).reduce((sum, parking) => sum + parking.collectionPoses.length, 0)
  const detectionConfigCount = getDetectionConfigCount(point.id)
  return { parkingPointCount, collectionPoseCount, detectionConfigCount }
}

function yesNo(value: boolean) {
  return value ? '是' : '否'
}

function getDirectionText(direction: CollectionPose['direction']) {
  return ({ front: '正拍', side: '侧拍', oblique: '斜拍', near: '近拍', overview: '全景' } as Record<CollectionPose['direction'], string>)[direction]
}

function getMethodText(method: CollectionMethod) {
  return ({ optical: '光学', thermal: '热成像', gas: '气体', safety: '安全行为', multi_spectrum: '多光谱' } as Record<CollectionMethod, string>)[method]
}

function formatCoordinate(mapPosition?: InspectionPoint['mapPosition']) {
  if (!mapPosition) return '-'
  return `${Number(mapPosition.x || 0).toFixed(2)}, ${Number(mapPosition.y || 0).toFixed(2)}`
}

function formatDate(date?: Date | string) {
  if (!date) return ''
  return new Date(date).toLocaleString()
}

function normalizeRegion(region: MapRegion) {
  if (region.x <= 100 && region.y <= 100 && region.width <= 100 && region.height <= 100) {
    return region
  }
  return {
    ...region,
    x: region.x / 8,
    y: region.y / 6,
    width: region.width / 8,
    height: region.height / 6
  }
}

function detectAreaByPoint(x: number, y: number) {
  const hit = areaOptions.value.find((region) => {
    const normalized = normalizeRegion(region)
    return x >= normalized.x && x <= normalized.x + normalized.width && y >= normalized.y && y <= normalized.y + normalized.height
  })
  return hit || null
}

function initializeBase() {
  inspectionStore.initialize()
  inspectionStore.fetchAllInspectionMaps()
  inspectionStore.fetchAllInspectionDevices()
  inspectionStore.fetchAllInspectionDeviceCheckItems()
  robotStore.initialize()
}

function loadPoints() {
  if (isListMode.value || !selectedMapId.value) {
    points.value = []
    return
  }

  const all = inspectionStore.inspectionPoints.filter(point => point.mapId === selectedMapId.value && isMapExecutionPoint(point))
  points.value = all.map((point) => buildPointRow(point))

  if (!selectedPointId.value && points.value[0]) {
    selectedPointId.value = points.value[0].id
  }
}

function openTypeTab(type: BizPointType) {
  activeListTab.value = type
}

function goToMapScopedPage(mapId: string, action?: 'create') {
  router.push({
    path: '/implementation/map/point-manage',
    query: action ? { mapId, action } : { mapId }
  })
}

function backToList() {
  router.push({
    path: '/implementation/map/point-manage',
    query: route.query.tab ? { tab: route.query.tab as string } : {}
  })
}

function openCreateFromList() {
  if (!inspectionStore.inspectionMaps.length) {
    message.warning('请先在地图管理中创建地图')
    return
  }
  if (inspectionStore.inspectionMaps.length === 1) {
    goToMapScopedPage(inspectionStore.inspectionMaps[0].id, 'create')
    return
  }
  selectedMapForCreate.value = ''
  createFromListVisible.value = true
}

function confirmCreateFromList() {
  if (!selectedMapForCreate.value) {
    message.warning('请先选择地图')
    return
  }
  createFromListVisible.value = false
  goToMapScopedPage(selectedMapForCreate.value, 'create')
}

function buildAndSavePoint(row: PointRow, patch: Partial<PointRow>) {
  const next = { ...row, ...patch }
  const area = areaOptions.value.find(item => item.id === next.areaId)
  inspectionStore.saveInspectionPoint({
    ...row.raw,
    name: next.name,
    code: next.code,
    mapId: next.mapId,
    pointType: InspectionPointType.FIXED,
    description: getDescriptionByBizType(next.bizType, next.name),
    areaId: next.areaId,
    areaName: area?.name || next.areaName || '',
    mapPosition: { x: next.mapX, y: next.mapY, yaw: row.raw.mapPosition?.yaw || 0 },
    positionSource: PositionSource.MANUAL_ADJUST,
    updatedAt: new Date()
  })
}

function openInlineEdit(record: PointRow) {
  editingId.value = record.id
  inlineEdit.name = record.name
  inlineEdit.type = record.bizType
}

function saveInlineEdit(record: PointRow) {
  const name = inlineEdit.name.trim()
  if (!name) {
    message.warning('请填写点位名称')
    return
  }
  buildAndSavePoint(record, { name, bizType: inlineEdit.type })
  editingId.value = ''
  message.success('点位属性已更新')
  loadPoints()
}

function cancelInlineEdit() {
  editingId.value = ''
}

function deletePoint(record: PointRow) {
  Modal.confirm({
    title: '确认删除该点位？',
    content: `点位 ${record.name} 删除后不可恢复。`,
    okText: '确认删除',
    okButtonProps: { danger: true },
    cancelText: '取消',
    onOk() {
      inspectionStore.deleteInspectionPoint(record.id)
      message.success('已删除点位')
      loadPoints()
    }
  })
}

function deleteListPoint(record: PointRow) {
  Modal.confirm({
    title: '确认删除',
    content: `确定要删除点位「${record.name}」吗？`,
    okText: '确定',
    cancelText: '取消',
    onOk() {
      inspectionStore.deleteInspectionPoint(record.id)
      message.success('删除成功')
    }
  })
}

function getClickPosition(event: MouseEvent) {
  const stage = event.currentTarget as HTMLElement
  const rect = stage.getBoundingClientRect()
  const x = clamp(((event.clientX - rect.left) / rect.width) * 100)
  const y = clamp(((event.clientY - rect.top) / rect.height) * 100)
  return { x, y }
}

function enterAddMode() {
  mode.value = 'adding'
  activeMovePointId.value = ''
  message.info('已进入新增模式，请在地图点击位置创建点位')
}

function enterMoveMode() {
  mode.value = 'moving'
  activeMovePointId.value = ''
  moveDraft.value = {}
  message.info('已进入移动模式，请先点击一个点位再点击地图新位置')
}

function handlePointClick(point: PointRow) {
  selectedPointId.value = point.id
  if (mode.value === 'moving') {
    activeMovePointId.value = point.id
    if (!moveDraft.value[point.id]) {
      moveDraft.value[point.id] = { x: point.mapX, y: point.mapY }
    }
  }
}

function handleStageClick(event: MouseEvent) {
  const position = getClickPosition(event)

  if (mode.value === 'adding') {
    addForm.name = ''
    addForm.type = activeListTab.value === 'all' ? 'inspection' : activeListTab.value
    addForm.mapX = position.x
    addForm.mapY = position.y
    const area = detectAreaByPoint(position.x, position.y)
    addForm.areaId = area?.id || ''
    addModalVisible.value = true
    return
  }

  if (mode.value === 'moving') {
    if (!activeMovePointId.value) {
      message.warning('请先点击一个点位')
      return
    }
    moveDraft.value[activeMovePointId.value] = { x: position.x, y: position.y }
    points.value = points.value.map((point) =>
      point.id === activeMovePointId.value
        ? { ...point, mapX: position.x, mapY: position.y }
        : point
    )
  }
}

function cancelAdd() {
  addModalVisible.value = false
  if (mode.value === 'adding') {
    mode.value = 'normal'
  }
}

function createPoint() {
  const name = addForm.name.trim()
  if (!name || !selectedMapId.value) {
    message.warning('请填写点位名称')
    return
  }
  const area = areaOptions.value.find(item => item.id === addForm.areaId)
  const newPoint: InspectionPoint = {
    id: `point-${Date.now()}`,
    name,
    code: `IP-${Math.floor(Math.random() * 900 + 100)}`,
    pointType: InspectionPointType.FIXED,
    description: getDescriptionByBizType(addForm.type, name),
    mapId: selectedMapId.value,
    areaId: addForm.areaId || undefined,
    areaName: area?.name || '',
    location: {
      longitude: Number((120 + addForm.mapX / 1000).toFixed(6)),
      latitude: Number((30 + addForm.mapY / 1000).toFixed(6)),
      altitude: 0
    },
    mapPosition: { x: addForm.mapX, y: addForm.mapY, yaw: 0 },
    sequence: points.value.length + 1,
    calibrationStatus: CalibrationStatus.PENDING,
    stayDurationSec: 30,
    monitorPoints: [],
    isCritical: false,
    exceptionStrategy: {
      onFailure: ExceptionStrategy.SKIP,
      retryCount: 3,
      skipToNext: true
    },
    positionSource: PositionSource.MAP_PICK,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  inspectionStore.saveInspectionPoint(newPoint)
  addModalVisible.value = false
  mode.value = 'normal'
  message.success('点位新增成功')
  loadPoints()
}

function confirmMove() {
  const draftIds = Object.keys(moveDraft.value)
  if (!draftIds.length) {
    message.warning('尚未移动任何点位')
    return
  }

  draftIds.forEach((id) => {
    const row = points.value.find(point => point.id === id)
    const draft = moveDraft.value[id]
    if (!row || !draft) return
    buildAndSavePoint(row, { mapX: draft.x, mapY: draft.y })
  })

  mode.value = 'normal'
  activeMovePointId.value = ''
  moveDraft.value = {}
  message.success('点位位置已更新')
  loadPoints()
}

function cancelMove() {
  mode.value = 'normal'
  activeMovePointId.value = ''
  moveDraft.value = {}
  loadPoints()
}

function handleRouteIntent() {
  if (isListMode.value) return
  if (route.query.action === 'create') {
    enterAddMode()
    router.replace({ path: '/implementation/map/point-manage', query: { mapId: selectedMapId.value } })
  }
}

function goToPointDetail(id: string) {
  router.push(`/implementation/point/detail/${id}`)
}

function goToInspectionConfig(id: string) {
  router.push(`/implementation/point/create/${id}`)
}

function viewDevices(id: string) {
  router.push(`/implementation/device/list?pointId=${id}`)
}

function resetInspectionSearch() {
  inspectionSearchForm.name = ''
  inspectionSearchForm.code = ''
  inspectionSearchForm.areaId = ''
  inspectionSearchForm.calibrationStatus = ''
  inspectionSearchForm.updatedAt = ''
}

function handleCalibrate(record: InspectionPoint) {
  currentPoint.value = record
  selectedRobotId.value = robotStore.robots[0]?.id || ''
  calibrationModalVisible.value = true
  fetchRobotCoordinates()
}

function fetchRobotCoordinates() {
  calibrationLoading.value = true
  if (!selectedRobotId.value) {
    calibrationLoading.value = false
    message.warning('请先选择机器人')
    return
  }

  const robot = robotStore.robots.find(r => r.id === selectedRobotId.value)
  const seed = selectedRobotId.value.split('').reduce((sum, c) => sum + c.charCodeAt(0), 0)
  const jitter = (factor: number) => ((seed % 17) - 8) * factor

  setTimeout(() => {
    if (currentPoint.value) {
      const baseLocation = currentPoint.value.location
      const baseMapPosition = currentPoint.value.mapPosition
      robotCoordinates.value = {
        longitude: baseLocation.longitude + jitter(0.000005),
        latitude: baseLocation.latitude + jitter(0.000005),
        altitude: (baseLocation.altitude || 0) + jitter(0.01),
        mapX: (baseMapPosition?.x || 0) + jitter(0.5),
        mapY: (baseMapPosition?.y || 0) + jitter(0.5),
        yaw: (baseMapPosition?.yaw || 0) + jitter(1.5)
      }
      if (robot) {
        message.success(`已获取机器人「${robot.name}」当前坐标`)
      }
    }
    calibrationLoading.value = false
  }, 1000)
}

function confirmCalibration() {
  if (!currentPoint.value) return
  inspectionStore.saveInspectionPoint({
    ...currentPoint.value,
    location: {
      longitude: robotCoordinates.value.longitude,
      latitude: robotCoordinates.value.latitude,
      altitude: robotCoordinates.value.altitude
    },
    mapPosition: {
      x: robotCoordinates.value.mapX,
      y: robotCoordinates.value.mapY,
      yaw: robotCoordinates.value.yaw
    },
    calibrationStatus: CalibrationStatus.CALIBRATED,
    calibratedAt: new Date(),
    updatedAt: new Date()
  })
  message.success('校准成功')
  calibrationModalVisible.value = false
  currentPoint.value = null
}

function updateCalibration() {
  fetchRobotCoordinates()
}

function cancelCalibration() {
  calibrationModalVisible.value = false
  currentPoint.value = null
}

function goToCockpit() {
  message.success('已跳转驾驶舱，正在执行校准')
  router.push('/management/cockpit/view')
}

watch(
  () => route.fullPath,
  () => {
    loadPoints()
    handleRouteIntent()
  }
)

onMounted(() => {
  initializeBase()
  loadPoints()
  handleRouteIntent()
})
</script>

<style scoped lang="css">
.point-manage {
  width: 100%;
}

.point-manage .search-panel {
  margin-bottom: 12px;
  padding: 12px 12px 4px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}

.point-manage .search-item {
  margin-bottom: 8px;
}

.point-manage .search-actions {
  display: flex;
  justify-content: flex-end;
  margin: 4px 0 8px;
}

.layout-grid {
  display: grid;
  grid-template-columns: 1.1fr 1fr;
  gap: 12px;
  margin-top: 16px;
}

.map-card {
  min-width: 0;
}

.map-stage {
  position: relative;
  min-height: 620px;
  border-radius: 12px;
  border: 1px solid #b4c9ff;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  overflow: hidden;
}

.map-mask {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(4, 12, 26, 0.12) 0%, rgba(4, 12, 26, 0.26) 100%);
}

.map-tip {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.9);
  color: #1f2937;
  font-size: 13px;
  line-height: 1.4;
}

.marker {
  position: absolute;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transform: translate(-50%, -50%);
  cursor: pointer;
  user-select: none;
}

.marker-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: #1677ff;
  color: #fff;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 8px 16px rgba(22, 119, 255, 0.35);
}

.marker-text {
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
  font-size: 12px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.18);
}

.marker.active .marker-dot,
.marker.moving .marker-dot {
  background: #ef4444;
  box-shadow: 0 8px 16px rgba(239, 68, 68, 0.35);
}

.spatial-detail {
  padding: 4px 0;
}

.spatial-summary {
  margin-bottom: 12px;
}

.parking-card {
  padding: 12px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fff;
}

.parking-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-weight: 600;
}

.pose-list {
  margin-top: 10px;
  display: grid;
  gap: 8px;
}

.pose-item {
  display: grid;
  gap: 2px;
  padding: 8px;
  border-radius: 6px;
  background: #fafafa;
  font-size: 12px;
  color: #475569;
}

.pose-item b {
  color: #1f2937;
}

.calibration-modal .loading-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.calibration-modal .modal-actions {
  margin-top: 20px;
  text-align: right;
}

@media (max-width: 992px) {
  .layout-grid {
    grid-template-columns: 1fr;
  }
}
</style>
