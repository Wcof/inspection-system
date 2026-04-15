<template>
  <div class="facility-device-list">
    <a-page-header title="设备设施" sub-title="管理巡检点下的设备设施" />

    <a-layout class="device-layout">
      <a-layout-sider width="280" class="point-sider">
        <div class="tree-panel">
          <a-input
            v-model:value="treeSearchValue"
            placeholder="搜索分区名称"
            allow-clear
            style="margin-bottom: 16px"
          />
          <a-tree
            v-model:selectedKeys="selectedTreeKeys"
            :tree-data="filteredTreeData"
            :field-names="{ title: 'title', key: 'key', children: 'children' }"
            @select="handleTreeSelect"
          />
        </div>
      </a-layout-sider>

      <a-layout-content class="list-content">
        <div class="content-header">
          <div class="header-left">
            <span class="header-title">设备列表</span>
            <a-tag color="blue">{{ selectedPointName }}</a-tag>
            <span class="header-count">共 {{ filteredDevices.length }} 台</span>
          </div>
          <a-space>
            <a-tooltip v-if="selectedTreeKey === 'all'" title="请先在左侧选择分区">
              <a-button type="primary" disabled>
                <a-icon type="plus" />
                新建设备
              </a-button>
            </a-tooltip>
            <a-button v-else type="primary" @click="goToForm">
              <a-icon type="plus" />
              新建设备
            </a-button>
          </a-space>
        </div>

        <div class="search-panel">
          <a-form layout="inline" :model="searchForm" @submit.prevent class="search-form">
            <a-form-item label="名称" class="search-field">
              <a-input v-model:value="searchForm.name" placeholder="设备名称" allow-clear />
            </a-form-item>
            <a-form-item label="编码" class="search-field">
              <a-input v-model:value="searchForm.code" placeholder="设备编码" allow-clear />
            </a-form-item>
            <a-form-item label="巡检点" class="search-field">
              <a-select v-model:value="searchForm.inspectionPointId" placeholder="请选择巡检点" allow-clear>
                <a-select-option v-for="point in inspectionPoints" :key="point.id" :value="point.id">
                  {{ point.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="类型" class="search-field">
              <a-select v-model:value="searchForm.type" placeholder="请选择设备类型" allow-clear>
                <a-select-option v-for="type in deviceTypeOptions" :key="type" :value="type">
                  {{ type }}
                </a-select-option>
              </a-select>
            </a-form-item>
            <a-form-item label="创建时间" class="search-field">
              <a-input v-model:value="searchForm.createdAt" placeholder="YYYY-MM-DD" allow-clear />
            </a-form-item>
            <a-form-item class="search-actions">
              <a-space>
                <a-button type="primary" @click="handleSearch">搜索</a-button>
                <a-button @click="handleReset">重置</a-button>
              </a-space>
            </a-form-item>
          </a-form>
        </div>

        <a-table
          :columns="columns"
          :data-source="filteredDevices"
          :loading="loading"
          row-key="id"
          size="middle"
          :scroll="{ x: 1280 }"
        >
          <template #bodyCell="{ column, record }">
            <template v-if="column.key === 'inspectionPoint'">
              {{ pointNameMap[record.inspectionPointId] || '-' }}
            </template>
            <template v-if="column.key === 'referenceImage'">
              <img :src="getReferenceImageUrl(record)" alt="参考图" style="width: 60px; height: 60px; object-fit: cover; cursor: zoom-in; border-radius: 4px" />
            </template>
            <template v-if="column.key === 'ptz'">
              <span v-if="record.ptzPreset">
                X: {{ record.ptzPreset.x }}, Y: {{ record.ptzPreset.y }}
                <span v-if="record.ptzPreset.z">, Z: {{ record.ptzPreset.z }}</span>
              </span>
              <span v-else>-</span>
            </template>
            <template v-if="column.key === 'checkItemCount'">
              {{ record.checkItems?.length || 0 }}
            </template>
            <template v-if="column.key === 'actions'">
              <a-space>
                <a-button type="link" size="small" @click="goToForm(record.id)">编辑</a-button>
                <a-button type="link" size="small" danger @click="handleDelete(record.id)">删除</a-button>
              </a-space>
            </template>
          </template>
        </a-table>
      </a-layout-content>
    </a-layout>

    <a-modal
      v-model:visible="checkItemModalVisible"
      title="检测项管理"
      width="1280px"
      @cancel="handleCloseCheckItems"
      :footer="false"
    >
      <div style="margin-bottom: 16px">
        <a-button type="primary" @click="handleAddCheckItem">
          <a-icon type="plus" />
          添加检测项
        </a-button>
      </div>

      <a-table :columns="checkItemColumns" :data-source="checkItems" row-key="id" :pagination="false">
        <template #bodyCell="{ column, record, index }">
          <template v-if="column.key === 'name'">
            <a-input v-if="record.isNew || record.isEditing" v-model:value="record.name" placeholder="请输入名称" />
            <template v-else>{{ record.name }}</template>
          </template>

          <template v-if="column.key === 'code'">
            <a-input v-if="record.isNew || record.isEditing" v-model:value="record.code" placeholder="请输入编码" />
            <template v-else>{{ record.code }}</template>
          </template>

          <template v-if="column.key === 'checkType'">
            <a-tag color="blue">图像识别</a-tag>
          </template>

          <template v-if="column.key === 'itemType'">
            <a-select
              v-if="record.isNew || record.isEditing"
              v-model:value="record.itemType"
              placeholder="请选择类型"
              style="width: 100%"
              @change="handleItemTypeChange(record)"
            >
              <a-select-option v-for="type in checkItemTypeOptions" :key="type" :value="type">
                {{ type }}
              </a-select-option>
            </a-select>
            <template v-else>{{ record.itemType || '-' }}</template>
          </template>

          <template v-if="column.key === 'min'">
            <a-input-number
              v-if="(record.isNew || record.isEditing) && isThresholdFieldEnabled(record.itemType, 'min')"
              v-model:value="record.threshold.min"
              placeholder="最小值"
              style="width: 100%"
            />
            <template v-else-if="!isThresholdFieldEnabled(record.itemType, 'min')">-</template>
            <template v-else>{{ record.threshold?.min ?? '-' }}</template>
          </template>

          <template v-if="column.key === 'max'">
            <a-input-number
              v-if="(record.isNew || record.isEditing) && isThresholdFieldEnabled(record.itemType, 'max')"
              v-model:value="record.threshold.max"
              placeholder="最大值"
              style="width: 100%"
            />
            <template v-else-if="!isThresholdFieldEnabled(record.itemType, 'max')">-</template>
            <template v-else>{{ record.threshold?.max ?? '-' }}</template>
          </template>


          <template v-if="column.key === 'mappingSource'">
            <template v-if="record.isNew || record.isEditing">
              <a-select v-model:value="record.visionMapping.sourceType" style="width: 100%">
                <a-select-option value="system">系统配置</a-select-option>
                <a-select-option value="manual">手动上传</a-select-option>
              </a-select>
            </template>
            <template v-else>
              <span v-if="record.visionMapping.sourceType === 'manual'">手动上传</span>
              <span v-else>系统配置</span>
            </template>
          </template>

          <template v-if="column.key === 'image'">
              <template v-if="record.isNew || record.isEditing">
                <template v-if="record.visionMapping.sourceType === 'system'">
                  <a-popover
                    trigger="click"
                    content=""
                  >
                    <template #content>
                      <img 
                        :src="getSystemImageUrl(record)" 
                        alt="系统配置图像" 
                        style="max-width: 400px; max-height: 300px;"
                      />
                    </template>
                    <img 
                      :src="getSystemImageUrl(record)" 
                      alt="系统配置图像" 
                      style="width: 60px; height: 60px; object-fit: cover; cursor: pointer;"
                    />
                  </a-popover>
                </template>
                <template v-else>
                  <a-upload
                    :show-upload-list="false"
                    :before-upload="(file: File) => handleImageUpload(file, record)"
                  >
                    <a-button>
                      <a-icon type="upload" /> 上传图片
                    </a-button>
                  </a-upload>
                  <img 
                    v-if="record.visionMapping.customImageUrl"
                    :src="record.visionMapping.customImageUrl" 
                    alt="手动上传图像" 
                    style="width: 60px; height: 60px; object-fit: cover; margin-left: 8px;"
                  />
                </template>
              </template>
            <template v-else>
              <template v-if="record.visionMapping.sourceType === 'system'">
                <a-popover
                  trigger="click"
                  content=""
                >
                  <template #content>
                    <img 
                      :src="getSystemImageUrl(record)" 
                      alt="系统配置图像" 
                      style="max-width: 400px; max-height: 300px;"
                    />
                  </template>
                  <img 
                    :src="getSystemImageUrl(record)" 
                    alt="系统配置图像" 
                    style="width: 60px; height: 60px; object-fit: cover; cursor: pointer;"
                  />
                </a-popover>
              </template>
              <template v-else-if="record.visionMapping.customImageUrl">
                <a-popover
                  trigger="click"
                  content=""
                >
                  <template #content>
                    <img 
                      :src="record.visionMapping.customImageUrl" 
                      alt="手动上传图像" 
                      style="max-width: 400px; max-height: 300px;"
                    />
                  </template>
                  <img 
                    :src="record.visionMapping.customImageUrl" 
                    alt="手动上传图像" 
                    style="width: 60px; height: 60px; object-fit: cover; cursor: pointer;"
                  />
                </a-popover>
              </template>
              <template v-else>
                <span>-</span>
              </template>
            </template>
          </template>

          <template v-if="column.key === 'recognitionMode'">
            <template v-if="record.isNew || record.isEditing">
              <a-select v-model:value="record.visionMapping.recognitionMode" style="width: 100%">
                <a-select-option value="ocr">OCR 识别</a-select-option>
                <a-select-option value="ai">AI 识别</a-select-option>
              </a-select>
            </template>
            <template v-else>
              {{ record.visionMapping.recognitionMode === 'ai' ? 'AI 识别' : 'OCR 识别' }}
            </template>
          </template>

          <template v-if="column.key === 'actions'">
            <template v-if="record.isNew">
              <a-space>
                <a-button type="link" @click="handleSaveCheckItem(index)">保存</a-button>
                <a-button type="link" danger @click="handleCancelCheckItem(index)">取消</a-button>
              </a-space>
            </template>
            <template v-else-if="record.isEditing">
              <a-space>
                <a-button type="link" @click="handleSaveEditCheckItem(index)">保存</a-button>
                <a-button type="link" danger @click="handleCancelEditCheckItem(index)">取消</a-button>
              </a-space>
            </template>
            <template v-else>
              <a-space>
                <a-button type="link" @click="handleEditCheckItem(index)">编辑</a-button>
                <a-button type="link" danger @click="handleDeleteCheckItem(record.id)">删除</a-button>
              </a-space>
            </template>
          </template>
        </template>
      </a-table>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import {
  CalibrationStatus,
  DeviceStatus,
  InspectionPointType,
  PositionSource,
  type InspectionDevice,
  type InspectionPoint
} from '@/types/inspection'
import { message, Modal } from 'ant-design-vue'
const deviceMockImage = new URL('../../../设备.png', import.meta.url).href

const router = useRouter()
const route = useRoute()
const inspectionStore = useInspectionStore()

const devices = ref<InspectionDevice[]>([])
const inspectionPoints = ref<InspectionPoint[]>([])
const loading = ref(false)
const checkItemModalVisible = ref(false)
const currentDeviceId = ref<string | null>(null)
const checkItems = ref<any[]>([])

const searchForm = reactive({
  name: '',
  code: '',
  inspectionPointId: undefined as string | undefined,
  type: '',
  createdAt: ''
})

const treeSearchValue = ref('')
const selectedTreeKeys = ref<string[]>(['all'])
const selectedTreeKey = computed(() => selectedTreeKeys.value[0] || 'all')
const maps = computed(() => inspectionStore.inspectionMaps)

const treeData = computed(() => {
  const regionMap = new Map<string, { id: string; name: string }>()
  maps.value.forEach(map => {
    ;(map.regions || []).forEach(region => regionMap.set(region.id, { id: region.id, name: region.name }))
  })
  return [{
    title: '全部',
    key: 'all',
    children: Array.from(regionMap.values()).map(region => ({ title: region.name, key: `region:${region.id}` }))
  }]
})

const filteredTreeData = computed(() => {
  if (!treeSearchValue.value.trim()) return treeData.value
  const searchValue = treeSearchValue.value.trim().toLowerCase()
  const filteredRegions = (treeData.value[0].children || []).filter((item: any) =>
    String(item.title || '').toLowerCase().includes(searchValue)
  )
  return [{
    title: '全部',
    key: 'all',
    children: filteredRegions
  }]
})

const selectedRegionIdFromTree = computed(() => {
  if (selectedTreeKey.value === 'all') return undefined
  return selectedTreeKey.value.replace('region:', '')
})

const selectedPointName = computed(() => {
  if (!selectedRegionIdFromTree.value) return '全部分区'
  const regionNode = (treeData.value[0].children || []).find((item: any) => item.key === `region:${selectedRegionIdFromTree.value}`)
  return regionNode?.title || '未命名分区'
})

const pointNameMap = computed<Record<string, string>>(() => {
  const map: Record<string, string> = {}
  inspectionPoints.value.forEach(point => { map[point.id] = point.name })
  return map
})

const columns = [
  { title: '序号', dataIndex: 'sequence', key: 'sequence', width: 80 },
  { title: '设备名称', dataIndex: 'name', key: 'name' },
  { title: '编码', dataIndex: 'code', key: 'code' },
  { title: '所属巡检点', key: 'inspectionPoint', width: 150 },
  { title: '类型', dataIndex: 'type', key: 'type' },
  { title: '云台坐标', key: 'ptz', width: 180 },
  { title: '参考图', key: 'referenceImage', width: 100 },
  { title: '检测项数量', key: 'checkItemCount', width: 120 },
  { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
  { title: '操作', key: 'actions', width: 200 }
]

const checkItemColumns = [
  { title: '名称', dataIndex: 'name', key: 'name', width: 120 },
  { title: '编码', dataIndex: 'code', key: 'code', width: 120 },
  { title: '检测方式', key: 'checkType', width: 110 },
  { title: '图像映射', key: 'mappingSource', width: 120 },
  { title: '图像', key: 'image', width: 150 },
  { title: '识别模式', key: 'recognitionMode', width: 140 },
  { title: '类型', dataIndex: 'itemType', key: 'itemType', width: 110 },
  { title: '最小值', key: 'min', width: 100 },
  { title: '最大值', key: 'max', width: 100 },
  { title: '操作', key: 'actions', width: 170 }
]

const deviceTypeOptions = computed(() => Array.from(new Set(inspectionStore.inspectionDevices.map(device => device.type))).filter(Boolean))
const checkItemTypeOptions = ['温度', '外观', '压力', '液位', '振动', '声音', '电流', '电压', '状态']
type ThresholdKey = 'min' | 'max'

const thresholdFieldRuleMap: Record<string, ThresholdKey[]> = {
  温度: ['min', 'max'],
  压力: ['min', 'max'],
  液位: ['min', 'max'],
  振动: ['min', 'max'],
  声音: ['min', 'max'],
  电流: ['min', 'max'],
  电压: ['min', 'max'],
  外观: [],
  状态: []
}

function isThresholdFieldEnabled(itemType: string, field: ThresholdKey): boolean {
  const enabledFields = thresholdFieldRuleMap[itemType] || []
  return enabledFields.includes(field)
}

function inferCheckItemType(unit?: string, name?: string): string {
  if (unit && checkItemTypeOptions.includes(unit)) return unit
  const lowerName = (name || '').toLowerCase()
  if (lowerName.includes('温度')) return '温度'
  if (lowerName.includes('外观')) return '外观'
  if (lowerName.includes('压力')) return '压力'
  if (lowerName.includes('液位')) return '液位'
  if (lowerName.includes('振动')) return '振动'
  if (lowerName.includes('声音')) return '声音'
  if (lowerName.includes('电流')) return '电流'
  if (lowerName.includes('电压')) return '电压'
  return '状态'
}

function buildDefaultCheckItems(deviceId: string) {
  const now = new Date()
  return [
    {
      id: `check-${Date.now()}-temp`,
      deviceId,
      name: '温度',
      code: 'CHECK-TEMP',
      checkType: 'vision',
      itemType: '温度',
      threshold: { min: 0, max: 100 },
      visionMapping: { sourceType: 'system', customImageUrl: '', recognitionMode: 'ocr' },
      isNew: true,
      isEditing: true,
      createdAt: now,
      updatedAt: now
    },
    {
      id: `check-${Date.now()}-appearance`,
      deviceId,
      name: '外观',
      code: 'CHECK-APPEARANCE',
      checkType: 'vision',
      itemType: '外观',
      threshold: { min: undefined, max: undefined },
      visionMapping: { sourceType: 'system', customImageUrl: '', recognitionMode: 'ai' },
      isNew: true,
      isEditing: true,
      createdAt: now,
      updatedAt: now
    }
  ]
}

function resetDisabledThresholdFields(item: any) {
  const allFields: ThresholdKey[] = ['min', 'max']
  allFields.forEach(field => {
    if (!isThresholdFieldEnabled(item.itemType, field)) {
      item.threshold[field] = undefined
    }
  })
}

function handleItemTypeChange(item: any) {
  if (!item.threshold) {
    item.threshold = { min: undefined, max: undefined }
  }
  resetDisabledThresholdFields(item)
}

function normalizeVisionMapping(mapping: any) {
  const sourceType = mapping?.sourceType === 'manual' || mapping?.sourceType === 'template_image' ? 'manual' : 'system'
  const customImageUrl = mapping?.customImageUrl || mapping?.templateImageUrl || ''
  const recognitionMode = mapping?.recognitionMode === 'ai' ? 'ai' : 'ocr'
  return { sourceType, customImageUrl, recognitionMode }
}

function normalizeCheckItem(item: any) {
  const normalized = {
    ...item,
    checkType: 'vision',
    itemType: inferCheckItemType(item?.unit, item?.name),
    threshold: {
      min: item?.threshold?.min,
      max: item?.threshold?.max
    },
    visionMapping: normalizeVisionMapping(item?.visionMapping)
  }
  resetDisabledThresholdFields(normalized)
  return normalized
}

function validateCheckItem(item: any) {
  if (!item.name || !item.code) {
    message.error('请填写检测项名称和编码')
    return false
  }
  if (!item.itemType) {
    message.error('请选择检测项类型')
    return false
  }
  if (item.visionMapping?.sourceType === 'manual' && !item.visionMapping?.customImageUrl?.trim()) {
    message.error('选择手动上传时必须填写图片URL')
    return false
  }
  if (!item.visionMapping?.recognitionMode) {
    message.error('请选择识别模式')
    return false
  }
  return true
}

function fetchDevices() {
  loading.value = true
  try {
    inspectionStore.fetchAllInspectionPoints()
    inspectionStore.fetchAllInspectionDevices()
    inspectionStore.fetchAllInspectionMaps()
    inspectionStore.fetchAllInspectionDeviceCheckItems()
    inspectionPoints.value = inspectionStore.inspectionPoints
    if (selectedRegionIdFromTree.value) {
      const pointIds = inspectionPoints.value.filter(point => point.areaId === selectedRegionIdFromTree.value).map(point => point.id)
      devices.value = inspectionStore.inspectionDevices.filter(device => pointIds.includes(device.inspectionPointId))
    } else {
      devices.value = inspectionStore.inspectionDevices
    }
    devices.value = devices.value.map(device => ({
      ...device,
      checkItems: inspectionStore.getInspectionDeviceCheckItemsByDeviceId(device.id)
    }))
  } finally {
    loading.value = false
  }
}

function handleTreeSelect(keys: string[]) {
  selectedTreeKeys.value = keys
  fetchDevices()
}

function handleSearch() {}

function handleReset() {
  searchForm.name = ''
  searchForm.code = ''
  searchForm.inspectionPointId = undefined
  searchForm.type = ''
  searchForm.createdAt = ''
  selectedTreeKeys.value = ['all']
  treeSearchValue.value = ''
  fetchDevices()
}

const filteredDevices = computed(() => {
  const name = searchForm.name.trim().toLowerCase()
  const code = searchForm.code.trim().toLowerCase()
  const inspectionPointId = searchForm.inspectionPointId
  const type = searchForm.type.trim().toLowerCase()
  const createdAt = searchForm.createdAt.trim()
  return devices.value.filter(device => {
    const matchesName = !name || device.name.toLowerCase().includes(name)
    const matchesCode = !code || device.code.toLowerCase().includes(code)
    const matchesPoint = !inspectionPointId || device.inspectionPointId === inspectionPointId
    const matchesType = !type || device.type.toLowerCase().includes(type)
    const createdText = device.createdAt ? new Date(device.createdAt).toISOString().slice(0, 10) : ''
    const matchesCreated = !createdAt || createdText.includes(createdAt)
    return matchesName && matchesCode && matchesPoint && matchesType && matchesCreated
  })
})

function goToForm(id?: string) {
  if (id) {
    router.push(`/implementation/device/form/${id}`)
  } else if (selectedRegionIdFromTree.value) {
    const point = inspectionPoints.value.find(item => item.areaId === selectedRegionIdFromTree.value)
    if (point) router.push(`/implementation/device/form?pointId=${point.id}`)
  }
}

function openCheckItems(deviceId: string) {
  currentDeviceId.value = deviceId
  const existingItems = inspectionStore.getInspectionDeviceCheckItemsByDeviceId(deviceId)
  checkItems.value = existingItems.map((item: any) => ({
    ...normalizeCheckItem(item),
    isEditing: false
  }))
  if (!checkItems.value.length) {
    checkItems.value = buildDefaultCheckItems(deviceId)
  }
  checkItemModalVisible.value = true
}

function handleAddCheckItem() {
  checkItems.value.push({
    id: `temp-${Date.now()}`,
    deviceId: currentDeviceId.value || '',
    name: '',
    code: '',
    checkType: 'vision',
    itemType: '温度',
    threshold: { min: undefined, max: undefined },
    visionMapping: { sourceType: 'system', customImageUrl: '', recognitionMode: 'ocr' },
    isNew: true,
    isEditing: true,
    createdAt: new Date(),
    updatedAt: new Date()
  })
}

function handleEditCheckItem(index: number) {
  const item = checkItems.value[index]
  checkItems.value[index] = { ...item, isEditing: true, _backup: JSON.parse(JSON.stringify(item)) }
}

function handleSaveCheckItem(index: number) {
  const item = normalizeCheckItem(checkItems.value[index])
  if (!validateCheckItem(item)) return

  inspectionStore.saveInspectionDeviceCheckItem({
    deviceId: currentDeviceId.value || '',
    name: item.name,
    code: item.code,
    checkType: 'vision',
    unit: item.itemType,
    threshold: { ...item.threshold },
    visionMapping: {
      sourceType: item.visionMapping.sourceType,
      customImageUrl: item.visionMapping.sourceType === 'manual' ? item.visionMapping.customImageUrl?.trim() : undefined,
      recognitionMode: item.visionMapping.recognitionMode
    }
  })

  checkItems.value = inspectionStore.getInspectionDeviceCheckItemsByDeviceId(currentDeviceId.value!).map(normalizeCheckItem)
  message.success('添加成功')
}

function handleSaveEditCheckItem(index: number) {
  const item = normalizeCheckItem(checkItems.value[index])
  if (!validateCheckItem(item)) return

  inspectionStore.saveInspectionDeviceCheckItem({
    id: item.id,
    deviceId: currentDeviceId.value || '',
    name: item.name,
    code: item.code,
    checkType: 'vision',
    unit: item.itemType,
    threshold: { ...item.threshold },
    visionMapping: {
      sourceType: item.visionMapping.sourceType,
      customImageUrl: item.visionMapping.sourceType === 'manual' ? item.visionMapping.customImageUrl?.trim() : undefined,
      recognitionMode: item.visionMapping.recognitionMode
    }
  })

  checkItems.value = inspectionStore.getInspectionDeviceCheckItemsByDeviceId(currentDeviceId.value!).map(normalizeCheckItem)
  message.success('编辑成功')
}

function handleCancelCheckItem(index: number) {
  checkItems.value.splice(index, 1)
}

function handleCancelEditCheckItem(index: number) {
  const item = checkItems.value[index]
  if (item._backup) {
    checkItems.value[index] = { ...item._backup, isEditing: false, _backup: null }
  } else {
    checkItems.value[index].isEditing = false
  }
}

function handleDeleteCheckItem(id: string) {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这个检测项吗？',
    okText: '确定',
    cancelText: '取消',
    onOk() {
      inspectionStore.deleteInspectionDeviceCheckItem(id)
      if (currentDeviceId.value) {
        checkItems.value = inspectionStore.getInspectionDeviceCheckItemsByDeviceId(currentDeviceId.value).map(normalizeCheckItem)
      }
      message.success('删除成功')
    }
  })
}

function handleCloseCheckItems() {
  checkItemModalVisible.value = false
  currentDeviceId.value = null
  checkItems.value = []
}

function handleImageUpload(file: File, record: any) {
  // 模拟上传，实际项目中应该调用真实的上传接口
  const reader = new FileReader()
  reader.onload = (e) => {
    record.visionMapping.customImageUrl = e.target?.result as string
    message.success('图片上传成功')
  }
  reader.readAsDataURL(file)
  return false // 阻止自动上传
}

function getSystemImageUrl(_record: any) {
  // 模拟系统配置图像，实际项目中应该从设备的参考图或其他系统配置中获取
  return 'https://neeko-copilot.bytedance.net/api/text2image?prompt=system%20configured%20device%20image&size=512x512'
}

function getReferenceImageUrl(_record: InspectionDevice) {
  return deviceMockImage
}

function ensureRegionMockHierarchy() {
  inspectionStore.fetchAllInspectionMaps()
  inspectionStore.fetchAllInspectionPoints()
  inspectionStore.fetchAllInspectionDevices()
  inspectionStore.fetchAllInspectionDeviceCheckItems()

  const maps = inspectionStore.inspectionMaps
  const now = new Date()

  maps.forEach((map) => {
    ;(map.regions || []).forEach((region, idx) => {
      const existingPoint = inspectionStore.inspectionPoints.find((p) => p.areaId === region.id)
      const pointId = existingPoint?.id || `mock-point-${region.id}`
      if (!existingPoint) {
        inspectionStore.saveInspectionPoint({
          id: pointId,
          name: `${region.name}巡检点`,
          code: `IP-${region.id.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-6) || idx + 1}`,
          pointType: InspectionPointType.FIXED,
          description: `[巡检点] ${region.name}默认巡检点`,
          mapId: map.id,
          areaId: region.id,
          areaName: region.name,
          location: {
            longitude: (map.geographicCoordinates?.longitude || 121.4737) + (idx + 1) * 0.0001,
            latitude: (map.geographicCoordinates?.latitude || 31.2304) + (idx + 1) * 0.0001,
            altitude: 0
          },
          mapPosition: {
            x: Math.round(region.x + Math.max(30, region.width / 2)),
            y: Math.round(region.y + Math.max(30, region.height / 2)),
            yaw: 0
          },
          sequence: idx + 1,
          calibrationStatus: CalibrationStatus.PENDING,
          stayDurationSec: 30,
          monitorPoints: [],
          isCritical: false,
          exceptionStrategy: { onFailure: 'skip', retryCount: 2, skipToNext: true } as any,
          positionSource: PositionSource.MAP_PICK,
          lastMapPickAt: now,
          updatedBy: '系统管理员',
          createdAt: now,
          updatedAt: now
        } as InspectionPoint)
      }

      const existingDevice = inspectionStore.inspectionDevices.find((d) => d.inspectionPointId === pointId)
      const deviceId = existingDevice?.id || `mock-device-${region.id}`
      if (!existingDevice) {
        inspectionStore.saveInspectionDevice({
          id: deviceId,
          inspectionPointId: pointId,
          name: `${region.name}温度计`,
          code: `DEV-${region.id.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-6) || idx + 1}`,
          type: '温度计',
          sequence: 1,
          ptzPreset: { x: 12 + idx, y: 8 + idx, z: 1.5 },
          referenceImageUrl:
            'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=industrial%20meter%20inspection&image_size=square',
          status: DeviceStatus.ACTIVE,
          checkItems: [],
          createdAt: now,
          updatedAt: now
        } as InspectionDevice)
      }

      const existingItem = inspectionStore.inspectionDeviceCheckItems.find((item) => item.deviceId === deviceId)
      if (!existingItem) {
        inspectionStore.saveInspectionDeviceCheckItem({
          id: `mock-check-${region.id}`,
          deviceId,
          name: '温度',
          code: `CHECK-${region.id.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(-6) || idx + 1}`,
          checkType: 'vision',
          priority: 'primary',
          inspectionFrequency: { value: 4, unit: 'hour' },
          executionWindow: { startTime: '08:00', endTime: '18:00' },
          unit: '温度',
          threshold: { min: 0, max: 100 },
          visionMapping: { sourceType: 'system', recognitionMode: 'ocr', customImageUrl: '' },
          createdAt: now,
          updatedAt: now
        } as any)
      }
    })
  })

  inspectionStore.fetchAllInspectionPoints()
  inspectionStore.fetchAllInspectionDevices()
  inspectionStore.fetchAllInspectionDeviceCheckItems()
}

function handleDelete(id: string) {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这个设备吗？',
    okText: '确定',
    cancelText: '取消',
    onOk() {
      inspectionStore.deleteInspectionDevice(id)
      fetchDevices()
      message.success('删除成功')
    }
  })
}

onMounted(() => {
  inspectionStore.initialize()
  inspectionStore.fetchAllInspectionMaps()
  ensureRegionMockHierarchy()
  inspectionPoints.value = inspectionStore.inspectionPoints
  if (route.query.pointId) {
    const point = inspectionPoints.value.find(item => item.id === route.query.pointId)
    if (point?.areaId) selectedTreeKeys.value = [`region:${point.areaId}`]
  }
  
  // 处理从检测项管理页跳转过来的查询参数
  if (route.query.deviceId) {
    const deviceId = route.query.deviceId as string
    const device = inspectionStore.inspectionDevices.find(d => d.id === deviceId)
    if (device) {
      // 定位到对应设备的巡检点
      const point = inspectionPoints.value.find(item => item.id === device.inspectionPointId)
      if (point?.areaId) selectedTreeKeys.value = [`region:${point.areaId}`]
      fetchDevices()
      
      // 打开检测项管理弹窗
      setTimeout(() => {
        openCheckItems(deviceId)
        
        // 如果有checkItemId，找到并滚动到对应检测项
        if (route.query.checkItemId) {
          // 这里可以进一步实现滚动到特定检测项并进入编辑态的功能
        }
      }, 100)
    }
  } else {
    fetchDevices()
  }
})
</script>

<style scoped lang="scss">
.facility-device-list {
  width: 100%;
  height: 100%;

  .device-layout {
    margin-top: 16px;
    min-height: 600px;
    background: #fff;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    overflow: hidden;
  }

  .point-sider {
    background: #fcfcfc;
    border-right: 1px solid #f0f0f0;
  }

  .tree-panel {
    padding: 16px;
    height: 100%;
    overflow: auto;
  }

  .list-content {
    padding: 0 16px 16px;
    background: #fff;
  }

  .content-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0;
    border-bottom: 1px solid #f0f0f0;
    margin-bottom: 16px;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .header-title {
    font-size: 16px;
    font-weight: 600;
    color: #262626;
  }

  .header-count {
    color: #8c8c8c;
    font-size: 12px;
  }

  .search-panel {
    margin-bottom: 12px;
    padding: 12px 12px 0;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    background: #fafafa;
  }

  .search-form {
    display: flex;
    flex-wrap: wrap;
    row-gap: 8px;
  }

  .search-field {
    :deep(.ant-form-item-control-input) {
      min-width: 180px;
    }
  }

  .search-actions {
    margin-left: auto;
  }

  :deep(.ant-table) {
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    overflow: hidden;
  }

  :deep(.ant-table-thead > tr > th) {
    background: #fafafa;
    font-weight: 600;
    white-space: nowrap;
  }

  :deep(.ant-table-tbody > tr > td) {
    vertical-align: middle;
  }

  @media (max-width: 1280px) {
    .search-actions {
      margin-left: 0;
    }
  }

  .sub-text {
    display: inline-block;
    margin-left: 8px;
    color: #8c8c8c;
    max-width: 140px;
    overflow: hidden;
    text-overflow: ellipsis;
    vertical-align: bottom;
    white-space: nowrap;
  }
}
</style>
