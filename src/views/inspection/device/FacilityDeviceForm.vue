<template>
  <div class="facility-device-form">
    <a-page-header :title="isEdit ? '编辑设施' : '新增设施'" @back="goBack" />
    <a-card style="margin-top: 16px">
      <a-form layout="vertical">
        <a-card size="small" title="基础信息">
          <a-row :gutter="16">
            <a-col :span="8"><a-form-item label="设施名称" required><a-input v-model:value="form.name" /></a-form-item></a-col>
            <a-col :span="8"><a-form-item label="设施分类" required><a-input v-model:value="form.deviceClassification" /></a-form-item></a-col>
            <a-col :span="8"><a-form-item label="设施编号" required><a-input v-model:value="form.deviceNo" @change="syncCodeWithDeviceNo" /></a-form-item></a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="8"><a-form-item label="规格型号"><a-input v-model:value="form.specModel" /></a-form-item></a-col>
            <a-col :span="8">
              <a-form-item label="所在区域" required>
                <a-select v-model:value="form.areaId" allow-clear placeholder="请选择区域" @change="onAreaChange">
                  <a-select-option v-for="area in areas" :key="area.id" :value="area.id">{{ area.name }}</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
            <a-col :span="8"><a-form-item label="设施类别" required><a-input v-model:value="form.deviceCategory" /></a-form-item></a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="8"><a-form-item label="责任人" required><a-input v-model:value="form.owner" /></a-form-item></a-col>
            <a-col :span="8"><a-form-item label="设施状态"><a-select v-model:value="form.status"><a-select-option value="active">在用</a-select-option><a-select-option value="inactive">停用</a-select-option><a-select-option value="maintenance">维护中</a-select-option><a-select-option value="scrapped">报废</a-select-option></a-select></a-form-item></a-col>
            <a-col :span="8"><a-form-item label="出厂厂家"><a-input v-model:value="form.manufacturer" /></a-form-item></a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="8"><a-form-item label="出厂编号"><a-input v-model:value="form.factoryNo" /></a-form-item></a-col>
            <a-col :span="8"><a-form-item label="投用日期"><a-date-picker v-model:value="form.commissioningDate" value-format="YYYY-MM-DD" style="width: 100%" /></a-form-item></a-col>
            <a-col :span="8"><a-form-item label="发证日期"><a-date-picker v-model:value="form.certificateIssueDate" value-format="YYYY-MM-DD" style="width: 100%" /></a-form-item></a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="8"><a-form-item label="使用证号"><a-input v-model:value="form.usageCertificateNo" /></a-form-item></a-col>
            <a-col :span="8"><a-form-item label="系统名称"><a-input v-model:value="form.systemName" /></a-form-item></a-col>
            <a-col :span="8"><a-form-item label="检查岗位名称"><a-input v-model:value="form.inspectionPostName" /></a-form-item></a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="8"><a-form-item label="失效日期"><a-date-picker v-model:value="form.expiryDate" value-format="YYYY-MM-DD" style="width: 100%" /></a-form-item></a-col>
            <a-col :span="8"><a-form-item label="最近检测时间"><a-date-picker v-model:value="form.lastInspectionTime" value-format="YYYY-MM-DD" style="width: 100%" /></a-form-item></a-col>
            <a-col :span="8"><a-form-item label="机构核准证书"><a-input v-model:value="form.institutionApprovalCertificate" /></a-form-item></a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="8"><a-form-item label="使用部门名称"><a-input v-model:value="form.usageDepartmentName" /></a-form-item></a-col>
            <a-col :span="8"><a-form-item label="保管岗位名称"><a-input v-model:value="form.custodianPostName" /></a-form-item></a-col>
            <a-col :span="8"><a-form-item label="出日期"><a-date-picker v-model:value="form.outDate" value-format="YYYY-MM-DD" style="width: 100%" /></a-form-item></a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="8"><a-form-item label="下次检测时间"><a-date-picker v-model:value="form.nextInspectionTime" value-format="YYYY-MM-DD" style="width: 100%" /></a-form-item></a-col>
            <a-col :span="8"><a-form-item label="NFCID"><a-input v-model:value="form.nfcId" /></a-form-item></a-col>
            <a-col :span="8"><a-form-item label="存放位置"><a-input v-model:value="form.storageLocation" /></a-form-item></a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="8"><a-form-item label="地图坐标"><a-input v-model:value="form.mapCoordinate" placeholder="例如 120.12,30.16" /></a-form-item></a-col>
            <a-col :span="8"><a-form-item label="检测周期"><a-input v-model:value="form.detectionCycle" placeholder="例如 30天" /></a-form-item></a-col>
            <a-col :span="8"><a-form-item label="失效预警天数"><a-input-number v-model:value="form.failureWarningDays" :min="0" style="width: 100%" /></a-form-item></a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="8"><a-form-item label="巡检周期"><a-input v-model:value="form.inspectionCycle" placeholder="例如 每日/每周" /></a-form-item></a-col>
            <a-col :span="8"><a-form-item label="最近检测结论"><a-input v-model:value="form.lastInspectionConclusion" /></a-form-item></a-col>
            <a-col :span="8"><a-form-item label="检测预警天数"><a-input-number v-model:value="form.inspectionWarningDays" :min="0" style="width: 100%" /></a-form-item></a-col>
          </a-row>

          <a-row :gutter="16">
            <a-col :span="8"><a-form-item label="巡检窗口"><a-input v-model:value="form.inspectionWindow" placeholder="例如 08:00-18:00" /></a-form-item></a-col>
            <a-col :span="8"><a-form-item label="设施编码"><a-input v-model:value="form.code" placeholder="默认同设施编号" /></a-form-item></a-col>
            <a-col :span="8">
              <a-form-item label="来源">
                <a-select v-model:value="form.source">
                  <a-select-option value="manual">手动维护</a-select-option>
                  <a-select-option value="synced">三方同步</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>

          <a-form-item label="参考图（单张）">
            <a-space direction="vertical" style="width: 100%">
              <a-upload :show-upload-list="false" :before-upload="() => false" @change="handleUploadChange">
                <a-button>上传参考图</a-button>
              </a-upload>
              <img :src="form.referenceImageUrl || defaultDeviceImage" class="preview-image" alt="reference" />
            </a-space>
          </a-form-item>
        </a-card>

        <a-card size="small" title="设施部件配置（建议只配置需要检测的部件/连接处）" class="model-card">
          <a-tabs>
            <a-tab-pane key="components" tab="部件">
              <a-table :data-source="assetComponents" row-key="localKey" :pagination="false" size="small" :scroll="{ x: 1550 }">
                <a-table-column title="部件名称" width="180">
                  <template #default="{ record }"><a-input v-model:value="record.name" /></template>
                </a-table-column>
                <a-table-column title="部件类型" width="180">
                  <template #default="{ record }">
                    <a-select v-model:value="record.type" style="width: 100%">
                      <a-select-option value="valve">阀门</a-select-option>
                      <a-select-option value="meter">压力表</a-select-option>
                      <a-select-option value="temperature_gauge">温度表</a-select-option>
                      <a-select-option value="flange">法兰</a-select-option>
                      <a-select-option value="motor">电机</a-select-option>
                      <a-select-option value="pipe">管体</a-select-option>
                      <a-select-option value="cable">电缆</a-select-option>
                      <a-select-option value="joint">接头</a-select-option>
                      <a-select-option value="sensor">传感器</a-select-option>
                      <a-select-option value="screw">螺杆</a-select-option>
                      <a-select-option value="other">其他</a-select-option>
                    </a-select>
                  </template>
                </a-table-column>
                <a-table-column title="优先级" width="130">
                  <template #default="{ record }">
                    <a-select v-model:value="record.priority" style="width: 100%" allow-clear placeholder="继承设施">
                      <a-select-option value="high">高</a-select-option>
                      <a-select-option value="medium">中</a-select-option>
                      <a-select-option value="low">低</a-select-option>
                    </a-select>
                  </template>
                </a-table-column>
                <a-table-column title="检测规则" width="340">
                  <template #default="{ record }">
                    <a-select v-model:value="record.ruleIds" mode="multiple" style="width: 100%" :options="getComponentRuleOptions(record)" option-filter-prop="label" show-search />
                  </template>
                </a-table-column>
                <a-table-column title="巡检周期" width="150">
                  <template #default="{ record }"><a-input v-model:value="record.inspectionCycle" :placeholder="form.inspectionCycle || '继承设施'" /></template>
                </a-table-column>
                <a-table-column title="巡检窗口" width="170">
                  <template #default="{ record }"><a-input v-model:value="record.inspectionWindow" :placeholder="form.inspectionWindow || '继承设施'" /></template>
                </a-table-column>
                <a-table-column title="操作" width="90">
                  <template #default="{ index }"><a-button type="link" size="small" danger @click="assetComponents.splice(index, 1)">删除</a-button></template>
                </a-table-column>
              </a-table>
              <a-button size="small" style="margin-top: 10px" @click="addAssetComponent">新增部件</a-button>
            </a-tab-pane>

            <a-tab-pane key="connections" tab="连接处">
              <a-table :data-source="connectionObjects" row-key="localKey" :pagination="false" size="small" :scroll="{ x: 1900 }">
                <a-table-column title="连接说明" width="180">
                  <template #default="{ record }"><a-input v-model:value="record.name" /></template>
                </a-table-column>
                <a-table-column title="当前设施部件" width="220">
                  <template #default="{ record }">
                    <a-select v-model:value="record.sourceComponentId" style="width: 100%" @change="syncConnectionEndpoint(record)">
                      <a-select-option v-for="component in assetComponents" :key="component.id" :value="component.id">{{ component.name }}</a-select-option>
                    </a-select>
                  </template>
                </a-table-column>
                <a-table-column title="连接范围" width="140">
                  <template #default="{ record }">
                    <a-select v-model:value="record.sinkScope" style="width: 100%" @change="onSinkScopeChange(record)">
                      <a-select-option value="self">本设施</a-select-option>
                      <a-select-option value="other">其他设施</a-select-option>
                    </a-select>
                  </template>
                </a-table-column>
                <a-table-column title="连接设施" width="220">
                  <template #default="{ record }">
                    <a-input v-if="record.sinkScope !== 'other'" :value="currentDeviceLabel" disabled />
                    <a-select v-else v-model:value="record.sinkDeviceId" style="width: 100%" @change="onSinkDeviceChange(record)">
                      <a-select-option v-for="device in otherDeviceOptions" :key="device.id" :value="device.id">{{ device.name }}{{ device.deviceNo ? `（${device.deviceNo}）` : '' }}</a-select-option>
                    </a-select>
                  </template>
                </a-table-column>
                <a-table-column title="连接部件" width="220">
                  <template #default="{ record }">
                    <a-select v-model:value="record.sinkComponentId" style="width: 100%" @change="syncConnectionEndpoint(record)">
                      <a-select-option v-for="component in getSinkComponentOptions(record)" :key="component.id" :value="component.id">{{ component.name }}</a-select-option>
                    </a-select>
                  </template>
                </a-table-column>
                <a-table-column title="优先级" width="130">
                  <template #default="{ record }">
                    <a-select v-model:value="record.priority" style="width: 100%" allow-clear placeholder="继承设施">
                      <a-select-option value="high">高</a-select-option>
                      <a-select-option value="medium">中</a-select-option>
                      <a-select-option value="low">低</a-select-option>
                    </a-select>
                  </template>
                </a-table-column>
                <a-table-column title="检测规则" width="320">
                  <template #default="{ record }">
                    <a-select v-model:value="record.ruleIds" mode="multiple" style="width: 100%" :options="connectionRuleOptions" option-filter-prop="label" show-search />
                  </template>
                </a-table-column>
                <a-table-column title="巡检周期" width="150">
                  <template #default="{ record }"><a-input v-model:value="record.inspectionCycle" :placeholder="form.inspectionCycle || '继承设施'" /></template>
                </a-table-column>
                <a-table-column title="巡检窗口" width="170">
                  <template #default="{ record }"><a-input v-model:value="record.inspectionWindow" :placeholder="form.inspectionWindow || '继承设施'" /></template>
                </a-table-column>
                <a-table-column title="操作" width="90">
                  <template #default="{ index }"><a-button type="link" size="small" danger @click="connectionObjects.splice(index, 1)">删除</a-button></template>
                </a-table-column>
              </a-table>
              <a-button size="small" style="margin-top: 10px" @click="addConnectionObject">新增连接对象</a-button>
            </a-tab-pane>
          </a-tabs>
        </a-card>

        <a-card size="small" title="点位与关联" class="model-card">
          <a-alert
            type="warning"
            show-icon
            style="margin-bottom: 12px"
            message="固定巡检仅允许绑定一个停车点；区域巡检可绑定多个停车点，并同时关联检测部件或连接对象。"
          />
          <a-table :data-source="parkingBindings" row-key="localKey" :pagination="false" size="small" :scroll="{ x: 1400 }">
            <a-table-column title="停车点" width="320">
              <template #default="{ record }">
                <a-select
                  v-model:value="record.parkingSelection"
                  :mode="record.inspectionMode === 'area' ? 'multiple' : undefined"
                  style="width: 100%"
                  allow-clear
                  placeholder="选择停车点"
                  :options="parkingSelectOptions"
                  @change="onBindingParkingChange(record)"
                />
              </template>
            </a-table-column>
            <a-table-column title="巡检模式" width="180">
              <template #default="{ record }">
                <a-select v-model:value="record.inspectionMode" style="width: 100%" @change="onBindingModeChange(record)">
                  <a-select-option value="fixed">固定巡检</a-select-option>
                  <a-select-option value="area">区域巡检</a-select-option>
                </a-select>
              </template>
            </a-table-column>
            <a-table-column title="关联部件（检测部件或连接）" width="420">
              <template #default="{ record }">
                <a-select
                  v-model:value="record.targetObjectRefs"
                  mode="multiple"
                  style="width: 100%"
                  allow-clear
                  placeholder="选择检测部件或连接对象"
                  :options="targetObjectOptions"
                />
              </template>
            </a-table-column>
            <a-table-column title="操作" width="90">
              <template #default="{ index }"><a-button type="link" size="small" danger @click="parkingBindings.splice(index, 1)">删除</a-button></template>
            </a-table-column>
          </a-table>
          <a-button size="small" style="margin-top: 10px" @click="openParkingPicker">配置巡检点（停车点）</a-button>
        </a-card>

        <div class="form-actions">
          <a-space>
            <a-button @click="goBack">取消</a-button>
            <a-button type="primary" @click="handleSave">保存</a-button>
          </a-space>
        </div>
      </a-form>
    </a-card>

    <a-modal
      v-model:open="parkingPickerVisible"
      title="框选巡检点（停车点）"
      width="1080px"
      :destroy-on-close="true"
      @ok="confirmParkingPicker"
      @cancel="closeParkingPicker"
    >
      <div class="parking-picker">
        <div class="parking-picker-main">
          <div class="parking-picker-toolbar">
            <a-space>
              <span>地图</span>
              <a-select v-model:value="selectedPickerMapId" style="width: 240px" placeholder="请选择地图" @change="clearPickerSelection">
                <a-select-option v-for="map in pickerMapOptions" :key="map.id" :value="map.id">{{ map.name }}</a-select-option>
              </a-select>
              <a-button size="small" @click="clearPickerSelection">清空选择</a-button>
            </a-space>
          </div>

          <div
            class="parking-picker-map"
            :style="pickerMapStyle"
            @mousedown="startPickerDrag"
            @mousemove="movePickerDrag"
            @mouseup="endPickerDrag"
            @mouseleave="endPickerDrag"
          >
            <div class="parking-picker-mask" />
            <div class="parking-picker-tip">拖拽框选停车点，也可以点击单个停车点进行增减选择。</div>
            <div
              v-if="selectionBox.visible"
              class="selection-box"
              :style="selectionBoxStyle"
            />
            <div
              v-for="parking in pickerParkingRows"
              :key="parking.parkingId"
              class="parking-point-marker"
              :class="{ selected: pickerSelectedIds.has(parking.parkingId) }"
              :style="{ left: `${parking.x}%`, top: `${parking.y}%` }"
              @mousedown.stop
              @click.stop="togglePickerParking(parking.parkingId)"
            >
              <span class="parking-point-dot">停</span>
              <span class="parking-point-label">{{ parking.pointName }} / {{ parking.parkingName }}</span>
            </div>
          </div>
        </div>

        <div class="parking-picker-side">
          <div class="parking-picker-side-title">本次已选停车点（{{ selectedPickerParkingRows.length }}）</div>
          <a-empty v-if="!selectedPickerParkingRows.length" description="尚未选择停车点" />
          <a-list v-else size="small" bordered :data-source="selectedPickerParkingRows">
            <template #renderItem="{ item }">
              <a-list-item>
                <div class="selected-parking-item">
                  <div class="selected-parking-info">
                    <b>{{ item.parkingName }}</b>
                    <span>{{ item.pointName }}</span>
                  </div>
                  <button class="parking-thumb" type="button" @click="openParkingPreview(item)">
                    <span class="parking-thumb-map" :style="parkingVisualPreviewStyle">
                      <span class="parking-thumb-mask" />
                      <span class="parking-thumb-dot" :style="{ left: `${item.x}%`, top: `${item.y}%` }" />
                    </span>
                    <span class="parking-thumb-text">预览</span>
                  </button>
                </div>
              </a-list-item>
            </template>
          </a-list>
        </div>
      </div>
    </a-modal>

    <a-modal
      v-model:open="parkingPreviewVisible"
      title="停车点位置预览"
      width="720px"
      :footer="null"
      destroy-on-close
    >
      <div v-if="previewParking" class="parking-preview">
        <div class="parking-preview-title">
          <b>{{ previewParking.parkingName }}</b>
          <span>{{ previewParking.pointName }}</span>
        </div>
        <div class="parking-preview-map" :style="parkingVisualPreviewStyle">
          <div class="parking-picker-mask" />
          <div
            class="parking-preview-marker"
            :style="{ left: `${previewParking.x}%`, top: `${previewParking.y}%` }"
          >
            <span class="parking-preview-pulse" />
            <span class="parking-preview-dot">停</span>
            <span class="parking-preview-label">{{ previewParking.parkingName }}</span>
          </div>
        </div>
      </div>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { message } from 'ant-design-vue'
import { useInspectionStore } from '@/stores/inspection'
import type { ConnectionObject, FacilityParkingPointBinding, InspectedAssetComponent, ObjectDetectionConfig } from '@/types/inspection'
import { DeviceStatus } from '@/types/inspection'
import { getDetectionItemConfigs, type DetectionItemConfig } from '@/views/implementation/detection-item-config/model'

interface AssetComponentRow extends InspectedAssetComponent {
  localKey: string
}

interface ConnectionObjectRow extends ConnectionObject {
  localKey: string
}

interface ParkingBindingRow extends FacilityParkingPointBinding {
  localKey: string
  parkingSelection?: string | string[]
}

interface PickerParkingRow {
  parkingId: string
  parkingName: string
  pointId: string
  pointName: string
  mapId: string
  x: number
  y: number
  rawX: number
  rawY: number
}

const route = useRoute()
const router = useRouter()
const inspectionStore = useInspectionStore()
const isEdit = computed(() => Boolean(route.params.id))
const defaultDeviceImage = new URL('../../../设施.png', import.meta.url).href
const fallbackMapBackgroundUrl = new URL('../../../地图.png', import.meta.url).href

const form = reactive<any>({
  id: '',
  name: '',
  code: '',
  deviceNo: '',
  deviceClassification: '',
  specModel: '',
  owner: '',
  manufacturer: '',
  areaId: '',
  areaName: '',
  storageLocation: '',
  systemName: '',
  lastInspectionTime: '',
  nextInspectionTime: '',
  mapCoordinate: '',
  deviceCategory: '',
  referenceImageUrl: '',
  status: 'active',
  source: 'manual',
  factoryNo: '',
  commissioningDate: '',
  certificateIssueDate: '',
  usageCertificateNo: '',
  inspectionPostName: '',
  expiryDate: '',
  institutionApprovalCertificate: '',
  usageDepartmentName: '',
  custodianPostName: '',
  outDate: '',
  nfcId: '',
  detectionCycle: '',
  failureWarningDays: undefined,
  inspectionCycle: '',
  lastInspectionConclusion: '',
  inspectionWarningDays: undefined,
  inspectionWindow: ''
})

const assetComponents = ref<AssetComponentRow[]>([])
const connectionObjects = ref<ConnectionObjectRow[]>([])
const parkingBindings = ref<ParkingBindingRow[]>([])
const existingObjectDetectionConfigs = ref<ObjectDetectionConfig[]>([])
const parkingPickerVisible = ref(false)
const selectedPickerMapId = ref('')
const pickerSelectedIds = ref<Set<string>>(new Set())
const parkingPreviewVisible = ref(false)
const previewParking = ref<PickerParkingRow | null>(null)
const dragStart = ref<{ x: number; y: number } | null>(null)
const selectionBox = reactive({
  visible: false,
  startX: 0,
  startY: 0,
  endX: 0,
  endY: 0
})

const currentDeviceId = computed(() => form.id || 'new-device')
const currentDeviceLabel = computed(() => `${form.name || '当前设施'}${form.deviceNo ? `（${form.deviceNo}）` : ''}`)
const otherDeviceOptions = computed(() => inspectionStore.inspectionDevices.filter(device => device.id !== currentDeviceId.value && (device.assetComponents || []).length))
const detectionRules = computed(() => getDetectionItemConfigs().filter(item => item.publishStatus === '已发布' && item.enabled))

const parkingSelectOptions = computed(() => inspectionStore.inspectionPoints
  .filter(point => point.pointBizType === 'inspection' || !point.pointBizType)
  .flatMap(point => (point.parkingPoints || []).map(parking => ({
    value: parking.id,
    label: `${point.name} / ${parking.name}`,
    pointId: point.id,
    pointName: point.name,
    parkingName: parking.name
  }))))

const pickerMapOptions = computed(() => inspectionStore.inspectionMaps.filter(map =>
  inspectionStore.inspectionPoints.some(point => point.mapId === map.id && (point.parkingPoints || []).length)
))

const currentPickerMap = computed(() => pickerMapOptions.value.find(map => map.id === selectedPickerMapId.value))

const pickerMapStyle = computed(() => ({
  backgroundImage: `url(${currentPickerMap.value?.imageUrl || fallbackMapBackgroundUrl})`,
  backgroundColor: '#eef3ff'
}))

const parkingVisualPreviewStyle = computed(() => ({
  backgroundImage: `url(${form.referenceImageUrl || defaultDeviceImage})`,
  backgroundColor: '#f8fafc'
}))

const pickerRawParkingRows = computed(() =>
  inspectionStore.inspectionPoints
    .filter(point => point.mapId === selectedPickerMapId.value)
    .filter(point => point.pointBizType === 'inspection' || !point.pointBizType)
    .flatMap(point => (point.parkingPoints || []).map(parking => ({
      parkingId: parking.id,
      parkingName: parking.name,
      pointId: point.id,
      pointName: point.name,
      mapId: point.mapId,
      rawX: Number(parking.position?.x ?? point.mapPosition?.x ?? 0),
      rawY: Number(parking.position?.y ?? point.mapPosition?.y ?? 0)
    })))
)

const pickerParkingRows = computed<PickerParkingRow[]>(() => {
  const rows = pickerRawParkingRows.value
  const xs = rows.map(item => item.rawX)
  const ys = rows.map(item => item.rawY)
  const minX = Math.min(...xs)
  const maxX = Math.max(...xs)
  const minY = Math.min(...ys)
  const maxY = Math.max(...ys)
  const centerX = (minX + maxX) / 2
  const centerY = (minY + maxY) / 2
  const spreadX = maxX - minX
  const spreadY = maxY - minY

  return rows.map(item => ({
    ...item,
    x: normalizeMapCoordinateToCenter(item.rawX, centerX, spreadX),
    y: normalizeMapCoordinateToCenter(item.rawY, centerY, spreadY)
  }))
})

const selectedPickerParkingRows = computed(() => {
  const selectedIds = pickerSelectedIds.value
  return pickerParkingRows.value.filter(item => selectedIds.has(item.parkingId))
})

const selectionBoxStyle = computed(() => {
  const left = Math.min(selectionBox.startX, selectionBox.endX)
  const top = Math.min(selectionBox.startY, selectionBox.endY)
  const width = Math.abs(selectionBox.endX - selectionBox.startX)
  const height = Math.abs(selectionBox.endY - selectionBox.startY)
  return {
    left: `${left}%`,
    top: `${top}%`,
    width: `${width}%`,
    height: `${height}%`
  }
})

const targetObjectOptions = computed(() => [
  ...assetComponents.value.map(component => ({ value: `component:${component.id}`, label: `部件 / ${component.name}` })),
  ...connectionObjects.value.map(connection => ({ value: `connection:${connection.id}`, label: `连接 / ${connection.name}` }))
])

const connectionRuleOptions = computed(() => detectionRules.value
  .slice()
  .sort((a, b) => Number(isConnectionRule(b)) - Number(isConnectionRule(a)))
  .map(rule => ({
    value: rule.id,
    label: `${isConnectionRule(rule) ? '推荐 - ' : ''}${rule.name}（${rule.category}）`
  })))

const componentTypeText: Record<InspectedAssetComponent['type'], string> = {
  valve: '阀门',
  meter: '压力表',
  temperature_gauge: '温度表',
  flange: '法兰',
  motor: '电机',
  pipe: '管体',
  cable: '电缆',
  joint: '接头',
  sensor: '传感器',
  screw: '螺杆',
  other: '其他'
}

const areas = computed(() => {
  const map = new Map<string, string>()
  inspectionStore.inspectionMaps.forEach((inspectionMap) => {
    inspectionMap.regions?.forEach((region) => map.set(region.id, region.name))
  })
  return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
})

function seedAssetModel(deviceId: string) {
  form.id = deviceId
  form.code = form.deviceNo || ''
  assetComponents.value = [
    { id: `${deviceId}-valve`, localKey: `${deviceId}-valve`, assetId: deviceId, name: '入口阀门', type: 'valve', subType: 'pressure_valve', subTypeName: '压力阀', ruleIds: [], priority: undefined, inspectionCycle: '', inspectionWindow: '' },
    { id: `${deviceId}-meter`, localKey: `${deviceId}-meter`, assetId: deviceId, name: '压力表', type: 'meter', subType: 'mechanical_pressure_gauge', subTypeName: '机械压力表', ruleIds: [], priority: undefined, inspectionCycle: '', inspectionWindow: '' },
    { id: `${deviceId}-flange`, localKey: `${deviceId}-flange`, assetId: deviceId, name: '出口法兰', type: 'flange', subType: 'pipe_flange', subTypeName: '管道法兰', ruleIds: [], priority: undefined, inspectionCycle: '', inspectionWindow: '' }
  ]
  connectionObjects.value = [
    {
      id: `${deviceId}-conn-valve-pipe`,
      localKey: `${deviceId}-conn-valve-pipe`,
      name: '阀门-管线',
      endpointA: '当前设施 / 入口阀门',
      endpointB: '当前设施 / 压力表',
      sourceComponentId: `${deviceId}-valve`,
      sinkScope: 'self',
      sinkDeviceId: deviceId,
      sinkComponentId: `${deviceId}-meter`,
      ruleIds: [],
      priority: undefined,
      inspectionCycle: '',
      inspectionWindow: '',
      detectionFocus: '开闭状态/泄漏'
    }
  ]
  parkingBindings.value = []
}

function loadDetail() {
  inspectionStore.initialize()
  if (!isEdit.value) {
    seedAssetModel(`device-${Date.now()}`)
    return
  }
  const detail = inspectionStore.inspectionDevices.find(item => item.id === String(route.params.id))
  if (!detail) return
  existingObjectDetectionConfigs.value = Array.isArray(detail.objectDetectionConfigs) ? detail.objectDetectionConfigs : []

  Object.assign(form, {
    id: detail.id,
    name: detail.name,
    code: detail.code || detail.deviceNo,
    deviceNo: detail.deviceNo || detail.code,
    deviceClassification: detail.deviceClassification || '',
    specModel: detail.specModel || '',
    owner: detail.owner || '',
    manufacturer: detail.manufacturer || '',
    areaId: detail.areaId || '',
    areaName: detail.areaName || '',
    storageLocation: detail.storageLocation || '',
    systemName: detail.systemName || '',
    lastInspectionTime: detail.lastInspectionTime || '',
    nextInspectionTime: detail.nextInspectionTime || '',
    mapCoordinate: detail.mapCoordinate || '',
    deviceCategory: detail.deviceCategory || '',
    referenceImageUrl: detail.referenceImageUrl || '',
    status: detail.status || 'active',
    source: detail.source || 'manual',
    factoryNo: detail.factoryNo || '',
    commissioningDate: detail.commissioningDate || '',
    certificateIssueDate: detail.certificateIssueDate || detail.issueDate || '',
    usageCertificateNo: detail.usageCertificateNo || '',
    inspectionPostName: detail.inspectionPostName || '',
    expiryDate: detail.expiryDate || '',
    institutionApprovalCertificate: detail.institutionApprovalCertificate || detail.authorityCertificateNo || '',
    usageDepartmentName: detail.usageDepartmentName || detail.departmentName || '',
    custodianPostName: detail.custodianPostName || '',
    outDate: detail.outDate || '',
    nfcId: detail.nfcId || '',
    detectionCycle: detail.detectionCycle || '',
    failureWarningDays: detail.failureWarningDays,
    inspectionCycle: detail.inspectionCycle || '',
    lastInspectionConclusion: detail.lastInspectionConclusion || '',
    inspectionWarningDays: detail.inspectionWarningDays,
    inspectionWindow: detail.inspectionWindow || ''
  })

  assetComponents.value = (detail.assetComponents || []).map((item, index) => ({
    ...item,
    ruleIds: Array.isArray(item.ruleIds) ? item.ruleIds : getRuleIdsFromUnifiedConfig('component', item.id),
    localKey: `${item.id}-${index}`
  }))

  connectionObjects.value = (detail.connectionObjects || []).map((item, index) => ({
    ...item,
    ruleIds: Array.isArray(item.ruleIds) ? item.ruleIds : getRuleIdsFromUnifiedConfig('connection', item.id),
    localKey: `${item.id}-${index}`,
    sinkScope: item.sinkScope || 'self',
    sinkDeviceId: item.sinkDeviceId || currentDeviceId.value
  }))

  parkingBindings.value = (detail.parkingPointBindings || []).map((item, index) => {
    const parkingIds = item.parkingPointIds?.length ? item.parkingPointIds : [item.parkingPointId].filter(Boolean)
    return {
      ...item,
      localKey: `${item.id}-${index}`,
      inspectionMode: item.inspectionMode || (parkingIds.length > 1 ? 'area' : 'fixed'),
      targetObjectRefs: item.targetObjectRefs?.length ? item.targetObjectRefs : (item.componentIds || []).map(id => `component:${id}`),
      parkingSelection: (item.inspectionMode || (parkingIds.length > 1 ? 'area' : 'fixed')) === 'area' ? parkingIds : (parkingIds[0] || '')
    }
  })
}

function handleUploadChange(info: any) {
  const file = info?.file?.originFileObj
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    form.referenceImageUrl = String(reader.result || '')
  }
  reader.readAsDataURL(file)
}

function syncCodeWithDeviceNo() {
  if (!form.code || form.code === form.deviceNo) {
    form.code = form.deviceNo
  }
}

function addAssetComponent() {
  const id = `component-${Date.now()}`
  assetComponents.value.push({ id, localKey: id, assetId: currentDeviceId.value, name: '新增部件', type: 'valve', ruleIds: [], priority: undefined, inspectionCycle: '', inspectionWindow: '' })
}

function addConnectionObject() {
  const id = `connection-${Date.now()}`
  const firstSource = assetComponents.value[0]?.id
  const firstSink = assetComponents.value[1]?.id || firstSource
  connectionObjects.value.push({
    id,
    localKey: id,
    name: '新增连接对象',
    endpointA: formatSourceEndpoint(firstSource),
    endpointB: formatSinkEndpoint('self', currentDeviceId.value, firstSink),
    sourceComponentId: firstSource,
    sinkScope: 'self',
    sinkDeviceId: currentDeviceId.value,
    sinkComponentId: firstSink,
    ruleIds: [],
    priority: undefined,
    inspectionCycle: '',
    inspectionWindow: '',
    detectionFocus: '泄漏/紧密度'
  })
}

function buildParkingBindingFromRows(rows: PickerParkingRow[]) {
  const firstParking = rows[0]
  const selectedIds = rows.map(item => item.parkingId)
  const selectedNames = rows.map(item => item.parkingName)
  return {
    id: `binding-${Date.now()}`,
    localKey: `binding-${Date.now()}`,
    inspectionPointId: firstParking?.pointId || '',
    inspectionPointName: firstParking?.pointName || '',
    parkingPointId: firstParking?.parkingId || '',
    parkingPointName: firstParking?.parkingName || '',
    componentIds: [],
    inspectionMode: rows.length > 1 ? 'area' : 'fixed',
    parkingPointIds: selectedIds,
    parkingPointNames: selectedNames,
    targetObjectRefs: [],
    parkingSelection: rows.length > 1 ? selectedIds : (selectedIds[0] || '')
  } as ParkingBindingRow
}

function openParkingPicker() {
  if (!pickerMapOptions.value.length) {
    message.warning('当前暂无可选择的停车点，请先在点位管理中维护巡检点停车点')
    return
  }
  selectedPickerMapId.value = selectedPickerMapId.value || pickerMapOptions.value[0].id
  pickerSelectedIds.value = new Set()
  resetSelectionBox()
  parkingPickerVisible.value = true
}

function closeParkingPicker() {
  parkingPickerVisible.value = false
  resetSelectionBox()
}

function clearPickerSelection() {
  pickerSelectedIds.value = new Set()
}

function togglePickerParking(parkingId: string) {
  const next = new Set(pickerSelectedIds.value)
  if (next.has(parkingId)) {
    next.delete(parkingId)
  } else {
    next.add(parkingId)
  }
  pickerSelectedIds.value = next
}

function confirmParkingPicker() {
  if (!selectedPickerParkingRows.value.length) {
    message.warning('请先框选停车点')
    return
  }
  parkingBindings.value.push(buildParkingBindingFromRows(selectedPickerParkingRows.value))
  message.success(`已回填 ${selectedPickerParkingRows.value.length} 个停车点`)
  closeParkingPicker()
}

function openParkingPreview(parking: PickerParkingRow) {
  previewParking.value = parking
  parkingPreviewVisible.value = true
}

function getPickerPosition(event: MouseEvent) {
  const stage = event.currentTarget as HTMLElement
  const rect = stage.getBoundingClientRect()
  return {
    x: clamp(((event.clientX - rect.left) / rect.width) * 100),
    y: clamp(((event.clientY - rect.top) / rect.height) * 100)
  }
}

function startPickerDrag(event: MouseEvent) {
  if (event.button !== 0) return
  const position = getPickerPosition(event)
  dragStart.value = position
  selectionBox.visible = true
  selectionBox.startX = position.x
  selectionBox.startY = position.y
  selectionBox.endX = position.x
  selectionBox.endY = position.y
}

function movePickerDrag(event: MouseEvent) {
  if (!dragStart.value) return
  const position = getPickerPosition(event)
  selectionBox.endX = position.x
  selectionBox.endY = position.y
}

function endPickerDrag() {
  if (!dragStart.value || !selectionBox.visible) return
  const minX = Math.min(selectionBox.startX, selectionBox.endX)
  const maxX = Math.max(selectionBox.startX, selectionBox.endX)
  const minY = Math.min(selectionBox.startY, selectionBox.endY)
  const maxY = Math.max(selectionBox.startY, selectionBox.endY)
  const hasDragArea = Math.abs(selectionBox.endX - selectionBox.startX) > 1 || Math.abs(selectionBox.endY - selectionBox.startY) > 1
  if (hasDragArea) {
    const next = new Set(pickerSelectedIds.value)
    const tolerance = 3
    pickerParkingRows.value
      .filter(item => item.x >= minX - tolerance && item.x <= maxX + tolerance && item.y >= minY - tolerance && item.y <= maxY + tolerance)
      .forEach(item => next.add(item.parkingId))
    pickerSelectedIds.value = next
  }
  resetSelectionBox()
}

function resetSelectionBox() {
  dragStart.value = null
  selectionBox.visible = false
  selectionBox.startX = 0
  selectionBox.startY = 0
  selectionBox.endX = 0
  selectionBox.endY = 0
}

function normalizeMapCoordinateToCenter(value: number, center: number, spread: number) {
  if (!Number.isFinite(value)) return 50
  if (spread <= 0) return 50
  const visualSpan = 46
  const normalized = 50 + ((value - center) / spread) * visualSpan
  return clamp(normalized)
}

function clamp(value: number) {
  return Math.max(0, Math.min(100, Number(value.toFixed(2))))
}

function onAreaChange(value: string) {
  const area = areas.value.find(item => item.id === value)
  form.areaName = area?.name || ''
}

function onBindingModeChange(record: ParkingBindingRow) {
  if (record.inspectionMode === 'fixed') {
    const values = Array.isArray(record.parkingSelection) ? record.parkingSelection : [record.parkingSelection].filter(Boolean)
    record.parkingSelection = values[0] || ''
  } else {
    const values = (Array.isArray(record.parkingSelection) ? record.parkingSelection : [record.parkingSelection].filter(Boolean))
      .filter((item): item is string => Boolean(item))
    record.parkingSelection = values
  }
  onBindingParkingChange(record)
}

function onBindingParkingChange(record: ParkingBindingRow) {
  const values = Array.isArray(record.parkingSelection) ? record.parkingSelection : [record.parkingSelection].filter(Boolean)
  const selected = parkingSelectOptions.value.filter(item => values.includes(item.value))
  const first = selected[0]
  record.inspectionPointId = first?.pointId || ''
  record.inspectionPointName = first?.pointName || ''
  record.parkingPointId = first?.value || ''
  record.parkingPointName = first?.parkingName || ''
  record.parkingPointIds = selected.map(item => item.value)
  record.parkingPointNames = selected.map(item => item.parkingName)
}

function formatSourceEndpoint(componentId?: string) {
  const component = assetComponents.value.find(item => item.id === componentId)
  return `${form.name || '当前设施'} / ${component?.name || componentId || ''}`
}

function formatSinkEndpoint(scope: 'self' | 'other' = 'self', deviceId?: string, componentId?: string) {
  const device = scope === 'self'
    ? { id: currentDeviceId.value, name: form.name || '当前设施', deviceNo: form.deviceNo, assetComponents: assetComponents.value }
    : inspectionStore.inspectionDevices.find(item => item.id === deviceId)
  const component = (device?.assetComponents || []).find(item => item.id === componentId)
  return `${device?.name || deviceId || ''}${device?.deviceNo ? `（${device.deviceNo}）` : ''} / ${component?.name || componentId || ''}`
}

function syncConnectionEndpoint(record: ConnectionObjectRow) {
  record.endpointA = formatSourceEndpoint(record.sourceComponentId)
  record.endpointB = formatSinkEndpoint(record.sinkScope, record.sinkDeviceId, record.sinkComponentId)
}

function onSinkScopeChange(record: ConnectionObjectRow) {
  if (record.sinkScope === 'other') {
    const firstOther = otherDeviceOptions.value[0]
    record.sinkDeviceId = firstOther?.id
    record.sinkComponentId = firstOther?.assetComponents?.[0]?.id
  } else {
    record.sinkDeviceId = currentDeviceId.value
    record.sinkComponentId = assetComponents.value[0]?.id
  }
  syncConnectionEndpoint(record)
}

function onSinkDeviceChange(record: ConnectionObjectRow) {
  const device = inspectionStore.inspectionDevices.find(item => item.id === record.sinkDeviceId)
  record.sinkComponentId = device?.assetComponents?.[0]?.id
  syncConnectionEndpoint(record)
}

function getSinkComponentOptions(record: ConnectionObjectRow) {
  if (record.sinkScope === 'other') {
    return inspectionStore.inspectionDevices.find(item => item.id === record.sinkDeviceId)?.assetComponents || []
  }
  return assetComponents.value
}

function getComponentRuleOptions(component: AssetComponentRow) {
  return detectionRules.value
    .slice()
    .sort((a, b) => Number(isComponentRule(b, component)) - Number(isComponentRule(a, component)))
    .map(rule => ({
      value: rule.id,
      label: `${isComponentRule(rule, component) ? '推荐 - ' : ''}${rule.name}（${rule.category}）`
    }))
}

function getRuleIdsFromUnifiedConfig(subjectType: ObjectDetectionConfig['subjectType'], subjectId: string) {
  return existingObjectDetectionConfigs.value
    .filter(item => item.subjectType === subjectType && item.subjectId === subjectId && item.enabled)
    .map(item => item.ruleId)
}

function buildObjectDetectionConfigs(deviceId: string): ObjectDetectionConfig[] {
  const previous = existingObjectDetectionConfigs.value
  const now = new Date().toISOString()
  const configs: ObjectDetectionConfig[] = []

  function createConfig(subjectType: ObjectDetectionConfig['subjectType'], subjectId: string, subjectName: string, ruleId: string) {
    const old = previous.find(item => item.subjectType === subjectType && item.subjectId === subjectId && item.ruleId === ruleId)
    configs.push({
      id: old?.id || `odc-${deviceId}-${subjectType}-${subjectId}-${ruleId}`,
      deviceId,
      subjectType,
      subjectId,
      subjectName,
      ruleId,
      collectionPoseId: old?.collectionPoseId,
      requiredCoverage: old?.requiredCoverage ?? true,
      failureStrategy: old?.failureStrategy || 'manual_review',
      enabled: true,
      remark: old?.remark,
      updatedAt: now
    })
  }

  assetComponents.value.forEach((component) => {
    ;(component.ruleIds || []).forEach(ruleId => createConfig('component', component.id, component.name, ruleId))
  })
  connectionObjects.value.forEach((connection) => {
    ;(connection.ruleIds || []).forEach(ruleId => createConfig('connection', connection.id, connection.name, ruleId))
  })
  return configs
}

function isComponentRule(rule: DetectionItemConfig, component: AssetComponentRow) {
  const targetTypes = rule.targetTypes || []
  const targetDetails = rule.targetDetails || ''
  const typeText = componentTypeText[component.type] || component.type
  return targetTypes.includes('设施部件') || targetDetails.includes(component.name) || targetDetails.includes(typeText)
}

function isConnectionRule(rule: DetectionItemConfig) {
  const targetTypes = rule.targetTypes || []
  const targetDetails = rule.targetDetails || ''
  return targetTypes.includes('连接部位') || targetDetails.includes('法兰') || targetDetails.includes('连接') || targetDetails.includes('管线')
}

function normalizeParkingBindings() {
  return parkingBindings.value.map(({ localKey, parkingSelection, ...item }) => {
    const refs = item.targetObjectRefs || []
    const componentIds = refs.filter(ref => ref.startsWith('component:')).map(ref => ref.split(':')[1])
    return {
      ...item,
      inspectionMode: item.inspectionMode || 'fixed',
      parkingPointIds: item.parkingPointIds?.length ? item.parkingPointIds : [item.parkingPointId].filter(Boolean),
      parkingPointNames: item.parkingPointNames?.length ? item.parkingPointNames : [item.parkingPointName].filter(Boolean),
      targetObjectRefs: refs,
      componentIds
    }
  })
}

function handleSave() {
  if (!form.deviceNo || !form.deviceClassification || !form.owner || !form.name || !form.areaId || !form.deviceCategory) {
    message.error('请补充必填信息：设施名称、设施分类、设施编号、所在区域、设施类别、责任人')
    return
  }

  const payloadId = form.id || `device-${Date.now()}`
  const normalizedBindings = normalizeParkingBindings()
  const primaryPointId = normalizedBindings[0]?.inspectionPointId || ''
  const payload = {
    id: payloadId,
    inspectionPointId: primaryPointId,
    name: form.name,
    code: form.code || form.deviceNo,
    deviceNo: form.deviceNo,
    deviceClassification: form.deviceClassification,
    specModel: form.specModel,
    owner: form.owner,
    manufacturer: form.manufacturer,
    areaId: form.areaId,
    areaName: form.areaName,
    storageLocation: form.storageLocation,
    systemName: form.systemName,
    lastInspectionTime: form.lastInspectionTime,
    nextInspectionTime: form.nextInspectionTime,
    mapCoordinate: form.mapCoordinate,
    deviceCategory: form.deviceCategory,
    referenceImageUrl: form.referenceImageUrl || defaultDeviceImage,
    status: form.status as DeviceStatus,
    source: form.source as 'manual' | 'synced',
    factoryNo: form.factoryNo,
    commissioningDate: form.commissioningDate,
    certificateIssueDate: form.certificateIssueDate,
    usageCertificateNo: form.usageCertificateNo,
    inspectionPostName: form.inspectionPostName,
    expiryDate: form.expiryDate,
    institutionApprovalCertificate: form.institutionApprovalCertificate,
    usageDepartmentName: form.usageDepartmentName,
    custodianPostName: form.custodianPostName,
    outDate: form.outDate,
    nfcId: form.nfcId,
    detectionCycle: form.detectionCycle,
    failureWarningDays: form.failureWarningDays,
    inspectionCycle: form.inspectionCycle,
    lastInspectionConclusion: form.lastInspectionConclusion,
    inspectionWarningDays: form.inspectionWarningDays,
    inspectionWindow: form.inspectionWindow,
    type: 'general',
    sequence: 1,
    assetComponents: assetComponents.value.map(({ localKey, ...item }) => ({ ...item, assetId: payloadId })),
    connectionObjects: connectionObjects.value.map(({ localKey, ...item }) => item),
    parkingPointBindings: normalizedBindings,
    objectDetectionConfigs: buildObjectDetectionConfigs(payloadId),
    createdAt: new Date(),
    updatedAt: new Date()
  }

  inspectionStore.saveInspectionDevice(payload)
  message.success('设施信息已保存')
  router.push('/implementation/device/list')
}

function goBack() {
  router.push('/implementation/device/list')
}

onMounted(loadDetail)
</script>

<style scoped lang="css">
.preview-image {
  margin-top: 6px;
  width: 260px;
  height: 140px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #f0f0f0;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.model-card {
  margin-top: 16px;
}

.parking-picker {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: 16px;
}

.parking-picker-main,
.parking-picker-side {
  min-width: 0;
}

.parking-picker-toolbar {
  margin-bottom: 10px;
}

.parking-picker-map {
  position: relative;
  height: 560px;
  border: 1px solid #b4c9ff;
  border-radius: 12px;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  overflow: hidden;
  user-select: none;
}

.parking-picker-mask {
  position: absolute;
  inset: 0;
  z-index: 1;
  background: linear-gradient(180deg, rgba(4, 12, 26, 0.08) 0%, rgba(4, 12, 26, 0.22) 100%);
}

.parking-picker-tip {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 5;
  max-width: calc(100% - 24px);
  padding: 8px 10px;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.92);
  color: #1f2937;
  font-size: 13px;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.12);
}

.selection-box {
  position: absolute;
  z-index: 6;
  border: 1px solid #1677ff;
  background: rgba(22, 119, 255, 0.16);
  pointer-events: none;
}

.parking-point-marker {
  position: absolute;
  z-index: 4;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  max-width: 240px;
  transform: translate(-50%, -50%);
  cursor: pointer;
}

.parking-point-dot {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 2px solid #fff;
  border-radius: 999px;
  background: #1677ff;
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 8px 16px rgba(22, 119, 255, 0.35);
}

.parking-point-label {
  max-width: 180px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.94);
  color: #0f172a;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.18);
}

.parking-point-marker.selected {
  z-index: 7;
}

.parking-point-marker.selected .parking-point-dot {
  background: #ef4444;
  box-shadow: 0 0 0 6px rgba(239, 68, 68, 0.16), 0 10px 20px rgba(239, 68, 68, 0.36);
}

.parking-point-marker.selected .parking-point-label {
  border: 1px solid rgba(239, 68, 68, 0.35);
  color: #991b1b;
  font-weight: 600;
}

.parking-picker-side-title {
  margin-bottom: 10px;
  color: #0f172a;
  font-weight: 600;
}

.selected-parking-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  width: 100%;
}

.selected-parking-info {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.selected-parking-info span {
  color: #64748b;
  font-size: 12px;
}

.parking-thumb {
  flex: 0 0 auto;
  width: 74px;
  padding: 0;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  overflow: hidden;
}

.parking-thumb:hover {
  border-color: #1677ff;
  box-shadow: 0 4px 12px rgba(22, 119, 255, 0.16);
}

.parking-thumb-map {
  position: relative;
  display: block;
  height: 46px;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
}

.parking-thumb-mask {
  position: absolute;
  inset: 0;
  background: rgba(15, 23, 42, 0.14);
}

.parking-thumb-dot {
  position: absolute;
  z-index: 2;
  width: 10px;
  height: 10px;
  border: 2px solid #fff;
  border-radius: 999px;
  background: #ef4444;
  box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.22);
  transform: translate(-50%, -50%);
}

.parking-thumb-text {
  display: block;
  padding: 2px 0 3px;
  color: #475569;
  font-size: 11px;
  line-height: 1.3;
  text-align: center;
}

.parking-preview {
  display: grid;
  gap: 12px;
}

.parking-preview-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.parking-preview-title span {
  color: #64748b;
  font-size: 13px;
}

.parking-preview-map {
  position: relative;
  height: 420px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  overflow: hidden;
}

.parking-preview-marker {
  position: absolute;
  z-index: 5;
  display: grid;
  justify-items: center;
  transform: translate(-50%, -50%);
}

.parking-preview-pulse {
  position: absolute;
  width: 54px;
  height: 54px;
  border-radius: 999px;
  background: rgba(239, 68, 68, 0.2);
}

.parking-preview-dot {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: 3px solid #fff;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 10px 24px rgba(127, 29, 29, 0.42);
}

.parking-preview-label {
  margin-top: 8px;
  max-width: 240px;
  padding: 5px 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  color: #991b1b;
  font-size: 12px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.16);
}

@media (max-width: 992px) {
  .parking-picker {
    grid-template-columns: 1fr;
  }

  .parking-picker-map {
    height: 420px;
  }
}
</style>
