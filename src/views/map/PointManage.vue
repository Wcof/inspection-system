<template>
  <div class="point-manage">
    <a-page-header
      :title="isListMode ? '点位管理' : `点位编辑 - ${currentMap?.name || '未命名地图'}`"
      :sub-title="isListMode ? '统一管理巡检点、充电点、维修站、通行点，并通过 Tab 切换不同业务类型。' : '维护当前地图内的点位位置与基础属性。'"
    >
      <template #extra>
        <a-space v-if="isListMode">
          <a-button type="primary" @click="openCreateFromList">编辑点位</a-button>
        </a-space>
        <a-space v-else>
          <a-button @click="backToList">返回点位列表</a-button>
        </a-space>
      </template>
    </a-page-header>

    <a-card v-if="isListMode" style="margin-top: 16px">
      <a-tabs v-model:activeKey="activeListTab">
        <a-tab-pane key="all" tab="全部">
          <div class="search-panel">
            <a-form layout="vertical" :model="listSearchForm" @submit.prevent>
              <a-row :gutter="[16, 8]">
                <a-col :xs="24" :sm="12" :md="8" :lg="6">
                  <a-form-item label="名称" class="search-item">
                    <a-input v-model:value="listSearchForm.name" placeholder="请输入点位名称" allow-clear />
                  </a-form-item>
                </a-col>
              </a-row>
              <div class="search-actions">
                <a-space>
                  <a-button type="primary">搜索</a-button>
                  <a-button @click="resetListSearch">重置</a-button>
                </a-space>
              </div>
            </a-form>
          </div>

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
                  <a-button type="link" size="small" @click="goToPointPosition(record)">查看位置</a-button>
                  <a-button type="link" size="small" @click="goToPointDetail(record.id)">详情</a-button>
                  <a-button type="link" size="small" :disabled="record.bizType !== 'inspection'" @click="goToInspectionConfig(record.id)">
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
                  <a-form-item label="巡检区域" class="search-item">
                    <a-select v-model:value="inspectionSearchForm.areaId" placeholder="请选择巡检区域" allow-clear>
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
              <template v-else-if="column.key === 'coveredInstallationNames'">
                <a-tooltip v-if="getCoveredInstallationNames(record).length">
                  <template #title>{{ getCoveredInstallationNames(record).join('、') }}</template>
                  <span>{{ truncateNames(getCoveredInstallationNames(record)) }}</span>
                </a-tooltip>
                <span v-else>-</span>
              </template>
              <template v-else-if="column.key === 'coveredFacilityNames'">
                <a-tooltip v-if="getCoveredFacilityNames(record).length">
                  <template #title>{{ getCoveredFacilityNames(record).join('、') }}</template>
                  <span>{{ truncateNames(getCoveredFacilityNames(record)) }}</span>
                </a-tooltip>
                <span v-else>-</span>
              </template>
              <template v-else-if="column.key === 'coveredComponentNames'">
                <a-tooltip v-if="getCoveredComponentNames(record).length">
                  <template #title>{{ getCoveredComponentNames(record).join('、') }}</template>
                  <span>{{ truncateNames(getCoveredComponentNames(record)) }}</span>
                </a-tooltip>
                <span v-else>-</span>
              </template>
              <template v-else-if="column.key === 'coveredRuleNames'">
                <a-tooltip v-if="getCoveredRuleNames(record).length">
                  <template #title>{{ getCoveredRuleNames(record).join('、') }}</template>
                  <span>{{ truncateNames(getCoveredRuleNames(record)) }}</span>
                </a-tooltip>
                <span v-else>-</span>
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

        <a-tab-pane key="charging" tab="充电点">
          <div class="search-panel">
            <a-form layout="vertical" :model="chargingSearchForm" @submit.prevent>
              <a-row :gutter="[16, 8]">
                <a-col :xs="24" :sm="12" :md="8" :lg="6">
                  <a-form-item label="名称" class="search-item">
                    <a-input v-model:value="chargingSearchForm.name" placeholder="请输入点位名称" allow-clear />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :md="8" :lg="6">
                  <a-form-item label="编码" class="search-item">
                    <a-input v-model:value="chargingSearchForm.code" placeholder="请输入点位编码" allow-clear />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :md="8" :lg="6">
                  <a-form-item label="巡检区域" class="search-item">
                    <a-select v-model:value="chargingSearchForm.areaId" placeholder="请选择巡检区域" allow-clear>
                      <a-select-option v-for="area in listAreaOptions" :key="area.id" :value="area.id">
                        {{ area.name }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :md="8" :lg="6">
                  <a-form-item label="更新时间" class="search-item">
                    <a-input v-model:value="chargingSearchForm.updatedAt" placeholder="YYYY-MM-DD" allow-clear />
                  </a-form-item>
                </a-col>
              </a-row>
              <div class="search-actions">
                <a-space>
                  <a-button type="primary">搜索</a-button>
                  <a-button @click="resetChargingSearch">重置</a-button>
                </a-space>
              </div>
            </a-form>
          </div>

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

        <a-tab-pane key="parking" tab="停车点">
          <div class="search-panel">
            <a-form layout="vertical" :model="parkingSearchForm" @submit.prevent>
              <a-row :gutter="[16, 8]">
                <a-col :xs="24" :sm="12" :md="8" :lg="6">
                  <a-form-item label="名称" class="search-item">
                    <a-input v-model:value="parkingSearchForm.name" placeholder="请输入点位名称" allow-clear />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :md="8" :lg="6">
                  <a-form-item label="编码" class="search-item">
                    <a-input v-model:value="parkingSearchForm.code" placeholder="请输入点位编码" allow-clear />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :md="8" :lg="6">
                  <a-form-item label="巡检区域" class="search-item">
                    <a-select v-model:value="parkingSearchForm.areaId" placeholder="请选择巡检区域" allow-clear>
                      <a-select-option v-for="area in listAreaOptions" :key="area.id" :value="area.id">
                        {{ area.name }}
                      </a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :md="8" :lg="6">
                  <a-form-item label="更新时间" class="search-item">
                    <a-input v-model:value="parkingSearchForm.updatedAt" placeholder="YYYY-MM-DD" allow-clear />
                  </a-form-item>
                </a-col>
              </a-row>
              <div class="search-actions">
                <a-space>
                  <a-button type="primary">搜索</a-button>
                  <a-button @click="resetParkingSearch">重置</a-button>
                </a-space>
              </div>
            </a-form>
          </div>

          <a-table :columns="baseTypeColumns" :data-source="parkingTabRows" row-key="id">
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
      <div class="layout-stack">
        <a-card class="map-card" title="位置管理">
          <template #extra>
            <a-space v-if="mode !== 'moving'" class="card-actions">
              <template v-if="mode !== 'adding'">
                <a-button type="primary" @click="enterAddMode">新增点位</a-button>
                <a-button @click="enterMoveMode">移动点位</a-button>
              </template>
              <template v-else>
                <a-button type="primary" danger @click="cancelAdd">取消新增</a-button>
              </template>
            </a-space>
            <a-space v-else class="card-actions">
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
              v-if="pendingAddPreview"
              class="marker pending"
              :style="{ left: `${pendingAddPreview.mapX}%`, top: `${pendingAddPreview.mapY}%` }"
            >
              <span class="marker-dot">新</span>
              <span class="marker-text">{{ addForm.name || pendingAddPreview.name || '待新增点位' }}</span>
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
              <!-- 选中点位时显示移动手柄 -->
              <span v-if="point.id === selectedPointId && mode === 'normal'" class="move-handle" @mousedown.stop="startPointDrag(point, $event)">移</span>
            </div>
          </div>
        </a-card>

        <a-card class="list-card" title="点位列表">
          <div class="search-panel compact">
            <a-form layout="vertical" :model="mapSearchForm" @submit.prevent>
              <a-row :gutter="[12, 8]" align="bottom">
                <a-col :xs="24" :sm="12" :md="10">
                  <a-form-item label="点位名称" class="search-item">
                    <a-input v-model:value="mapSearchForm.name" placeholder="请输入点位名称" allow-clear />
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="12" :md="8">
                  <a-form-item label="点位类型" class="search-item">
                    <a-select v-model:value="mapSearchForm.type" placeholder="请选择点位类型" allow-clear>
                      <a-select-option value="inspection">巡检点</a-select-option>
                      <a-select-option value="parking">停车点</a-select-option>
                      <a-select-option value="charging">充电点</a-select-option>
                    </a-select>
                  </a-form-item>
                </a-col>
                <a-col :xs="24" :sm="24" :md="6">
                  <div class="search-actions inline">
                    <a-space>
                      <a-button type="primary">搜索</a-button>
                      <a-button @click="resetMapSearch">重置</a-button>
                    </a-space>
                  </div>
                </a-col>
              </a-row>
            </a-form>
          </div>
          <a-table :columns="mapColumns" :data-source="filteredMapPoints" row-key="id" :pagination="false" :scroll="{ x: 900, y: 360 }" size="small">
            <template #bodyCell="{ column, record }">
              <template v-if="column.key === 'pointType'">
                <template v-if="editingId === record.id">
                  <a-select v-model:value="inlineEdit.type" style="width: 120px">
                    <a-select-option value="inspection">巡检点</a-select-option>
                    <a-select-option value="parking">停车点</a-select-option>
                    <a-select-option value="charging">充电点</a-select-option>
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

      <a-modal v-model:open="addModalVisible" title="新增点位" @ok="createPoint" @cancel="cancelAdd" width="520px">
        <a-form layout="vertical">
          <a-form-item label="点位类型" required>
            <a-select v-model:value="addForm.type" style="width: 100%">
              <a-select-option value="inspection">巡检点</a-select-option>
              <a-select-option value="parking">停车点</a-select-option>
              <a-select-option value="charging">充电点</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="点位名称" required>
            <a-input v-model:value="addForm.name" placeholder="请输入点位名称" />
          </a-form-item>
          <a-form-item label="所属区域">
            <a-select v-model:value="addForm.areaId" allow-clear placeholder="请选择区域">
              <a-select-option v-for="area in areaOptions" :key="area.id" :value="area.id">{{ area.name }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item label="描述">
            <a-textarea v-model:value="addForm.description" :rows="2" placeholder="点位描述信息" />
          </a-form-item>
          <a-form-item label="地图坐标">
            <a-input :value="`${addForm.mapX.toFixed(2)}, ${addForm.mapY.toFixed(2)}`" disabled />
          </a-form-item>

          <!-- 充电点专属 -->
          <template v-if="addForm.type === 'charging'">
            <a-divider orientation="left">充电属性</a-divider>
            <a-form-item label="充电方式">
              <a-select v-model:value="addForm.chargingMethod" style="width: 100%">
                <a-select-option value="auto">自动对接</a-select-option>
                <a-select-option value="manual">手动连接</a-select-option>
                <a-select-option value="wireless">无线充电</a-select-option>
              </a-select>
            </a-form-item>
            <a-row :gutter="8">
              <a-col :span="12"><a-form-item label="充电功率(kW)"><a-input-number v-model:value="addForm.chargingPower" :min="0" style="width:100%" /></a-form-item></a-col>
              <a-col :span="12"><a-form-item label="预计时长(min)"><a-input-number v-model:value="addForm.estimatedChargingTime" :min="0" style="width:100%" /></a-form-item></a-col>
            </a-row>
          </template>

          <!-- 停车点专属 -->
          <template v-if="addForm.type === 'parking'">
            <a-divider orientation="left">停车属性</a-divider>
            <a-row :gutter="8">
              <a-col :span="12"><a-form-item label="停车优先级"><a-input-number v-model:value="addForm.parkingPriority" :min="1" :max="10" style="width:100%" /></a-form-item></a-col>
              <a-col :span="12"><a-form-item label="允许等待(秒)"><a-input-number v-model:value="addForm.maxWaitingTime" :min="0" style="width:100%" /></a-form-item></a-col>
            </a-row>
          </template>
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

    <a-modal
      v-model:open="locationModalVisible"
      title="查看点位位置"
      width="960px"
      :footer="null"
      destroy-on-close
    >
      <div v-if="locationPreviewPoint" class="location-preview">
        <div class="location-preview-header">
          <div>
            <div class="location-preview-title">{{ locationPreviewPoint.name }}</div>
            <div class="location-preview-meta">
              {{ locationPreviewPoint.mapName }} / {{ locationPreviewPoint.areaName || '未分区' }}
            </div>
          </div>
          <a-space>
            <a-tag :color="getPointTypeColor(locationPreviewPoint.bizType)">
              {{ pointTypeText(locationPreviewPoint.bizType) }}
            </a-tag>
            <a-tag color="red">当前点位</a-tag>
          </a-space>
        </div>

        <div class="location-preview-stage" :style="locationPreviewMapStyle">
          <div class="map-mask" />
          <div class="location-preview-tip">
            坐标：{{ locationPreviewPoint.mapX.toFixed(2) }}, {{ locationPreviewPoint.mapY.toFixed(2) }}
          </div>
          <div
            v-for="point in locationPreviewContextPoints"
            :key="point.id"
            class="marker location-marker"
            :class="{ dimmed: point.id !== locationPreviewPoint.id }"
            :style="{ left: `${point.mapX}%`, top: `${point.mapY}%` }"
          >
            <span class="marker-dot">{{ getShortType(point.bizType) }}</span>
            <span class="marker-text">{{ point.name }}</span>
          </div>

          <div
            class="current-location-pin"
            :style="{ left: `${locationPreviewPoint.mapX}%`, top: `${locationPreviewPoint.mapY}%` }"
          >
            <span class="pin-pulse" />
            <span class="pin-head">{{ getShortType(locationPreviewPoint.bizType) }}</span>
            <span class="pin-tail" />
            <span class="pin-label">当前点位：{{ locationPreviewPoint.name }}</span>
          </div>
        </div>

        <a-descriptions size="small" :column="3" bordered class="location-preview-descriptions">
          <a-descriptions-item label="点位编码">{{ locationPreviewPoint.code || '-' }}</a-descriptions-item>
          <a-descriptions-item label="所属地图">{{ locationPreviewPoint.mapName }}</a-descriptions-item>
          <a-descriptions-item label="巡检区域">{{ locationPreviewPoint.areaName || '未分区' }}</a-descriptions-item>
          <a-descriptions-item label="点位类型">{{ pointTypeText(locationPreviewPoint.bizType) }}</a-descriptions-item>
          <a-descriptions-item label="是否可达">{{ getReachableText(locationPreviewPoint) }}</a-descriptions-item>
          <a-descriptions-item label="更新时间">{{ formatDate(locationPreviewPoint.raw.updatedAt) || '-' }}</a-descriptions-item>
        </a-descriptions>
      </div>
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
import { computed, onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { message, Modal } from 'ant-design-vue'
import { useRoute, useRouter } from 'vue-router'
import { useInspectionStore } from '@/stores/inspection'
import { useRobotStore } from '@/stores/robot'
import { MockService } from '@/mock/mockService'
import { CalibrationStatus, InspectionPointType, PositionSource } from '@/types/inspection'
import { ExceptionStrategy } from '@/types'
import type { InspectionPoint, MapRegion } from '@/types/inspection'
import type { NavigationPoint } from '@/types/road-network'
import { getDetectionItemConfigs } from '@/views/implementation/detection-item-config/model'

type BizPointType = 'inspection' | 'parking' | 'charging'
type ListTabKey = 'all' | 'inspection' | 'parking' | 'charging'
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
  /** 关联的导航点 ID（打通 InspectionPoint ↔ NavigationPoint） */
  navPointId?: string
}

const workshopImage = new URL('../../车间.png', import.meta.url).href
const fallbackMapBackgroundUrl = new URL('../../地图.png', import.meta.url).href

const inspectionStore = useInspectionStore()
const robotStore = useRobotStore()
const route = useRoute()
const router = useRouter()

const selectedMapId = computed(() => (typeof route.query.mapId === 'string' ? route.query.mapId : ''))
const selectedQueryPointId = computed(() => (typeof route.query.pointId === 'string' ? route.query.pointId : ''))
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
const isDraggingPoint = ref(false)
const dragPointStartPos = ref<{ x: number; y: number } | null>(null)

const addModalVisible = ref(false)
const pendingAddPreview = ref<{ mapX: number; mapY: number; name?: string } | null>(null)
const addForm = reactive({
  name: '',
  type: 'inspection' as BizPointType,
  areaId: '',
  mapX: 0,
  mapY: 0,
  description: '',
  // 充电点专属
  chargingMethod: 'auto' as string,
  chargingPower: 22,
  estimatedChargingTime: 60,
  // 停车点专属
  parkingPriority: 1,
  maxWaitingTime: 120
})
const mapSearchForm = reactive({
  name: '',
  type: '' as '' | BizPointType
})

const createFromListVisible = ref(false)
const selectedMapForCreate = ref('')
const moveDraft = ref<Record<string, { x: number; y: number }>>({})
const locationModalVisible = ref(false)
const locationPreviewPoint = ref<PointRow | null>(null)

const inspectionSearchForm = reactive({
  name: '',
  code: '',
  areaId: '',
  calibrationStatus: '',
  updatedAt: ''
})
const chargingSearchForm = reactive({
  name: '',
  code: '',
  areaId: '',
  updatedAt: ''
})
const parkingSearchForm = reactive({
  name: '',
  code: '',
  areaId: '',
  updatedAt: ''
})
const listSearchForm = reactive({
  name: ''
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
  { title: '点位名称', dataIndex: 'name', key: 'name', width: 220, ellipsis: true },
  { title: '点位类型', key: 'pointType', width: 110 },
  { title: '巡检区域', dataIndex: 'areaName', key: 'areaName', width: 140, ellipsis: true },
  { title: '地图坐标', key: 'location', width: 150 },
  { title: '操作', key: 'actions', width: 150 }
]

const allColumns = [
  { title: '点位名称', dataIndex: 'name', key: 'name' },
  { title: '点位编码', dataIndex: 'code', key: 'code', width: 150 },
  { title: '点位类型', key: 'pointType', width: 110 },
  { title: '所属地图', dataIndex: 'mapName', key: 'mapName', width: 170 },
  { title: '巡检区域', dataIndex: 'areaName', key: 'areaName', width: 170 },
  { title: '坐标', key: 'coordinate', width: 140 },
  { title: '是否可达', key: 'reachable', width: 100 },
  { title: '更新时间', key: 'updatedAt', width: 170 },
  { title: '操作', key: 'actions', width: 220 }
]

const inspectionColumns = [
  { title: '巡检点名称', dataIndex: 'name', key: 'name' },
  { title: '编码', dataIndex: 'code', key: 'code', width: 130 },
  { title: '巡检区域', dataIndex: 'areaName', key: 'areaName', width: 120 },
  { title: '装置区 / 分区', key: 'workArea', width: 150 },
  { title: '现场预览图', key: 'previewImage', width: 100 },
  { title: '覆盖装置', key: 'coveredInstallationNames', width: 160 },
  { title: '覆盖设施', key: 'coveredFacilityNames', width: 160 },
  { title: '覆盖对象', key: 'coveredComponentNames', width: 160 },
  { title: '覆盖检测规则', key: 'coveredRuleNames', width: 180 },
  { title: '校准状态', key: 'calibrationStatus', width: 100 },
  { title: '更新时间', key: 'updatedAt', width: 170 },
  { title: '操作', key: 'actions', width: 320 }
]

const baseTypeColumns = [
  { title: '点位名称', dataIndex: 'name', key: 'name' },
  { title: '点位编码', dataIndex: 'code', key: 'code', width: 150 },
  { title: '所属地图', dataIndex: 'mapName', key: 'mapName', width: 170 },
  { title: '巡检区域', dataIndex: 'areaName', key: 'areaName', width: 170 },
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

const filteredListRows = computed(() => {
  const name = listSearchForm.name.trim().toLowerCase()
  return allPointRows.value.filter((point) => {
    return !name || point.name.toLowerCase().includes(name)
  })
})

const allTabRows = computed(() => filteredListRows.value)
const inspectionBaseRows = computed(() => filteredListRows.value.filter(point => point.bizType === 'inspection'))
const chargingBaseRows = computed(() => filteredListRows.value.filter(point => point.bizType === 'charging'))
const parkingBaseRows = computed(() => filteredListRows.value.filter(point => point.bizType === 'parking'))

const chargingTabRows = computed(() => {
  const name = chargingSearchForm.name.trim().toLowerCase()
  const code = chargingSearchForm.code.trim().toLowerCase()
  const areaId = chargingSearchForm.areaId
  const updatedAt = chargingSearchForm.updatedAt.trim()
  return chargingBaseRows.value.filter((point) => {
    const matchesName = !name || point.name.toLowerCase().includes(name)
    const matchesCode = !code || point.code.toLowerCase().includes(code)
    const matchesArea = !areaId || point.areaId === areaId
    const updatedText = point.raw.updatedAt ? new Date(point.raw.updatedAt).toISOString().slice(0, 10) : ''
    const matchesUpdated = !updatedAt || updatedText.includes(updatedAt)
    return matchesName && matchesCode && matchesArea && matchesUpdated
  })
})

const parkingTabRows = computed(() => {
  const name = parkingSearchForm.name.trim().toLowerCase()
  const code = parkingSearchForm.code.trim().toLowerCase()
  const areaId = parkingSearchForm.areaId
  const updatedAt = parkingSearchForm.updatedAt.trim()
  return parkingBaseRows.value.filter((point) => {
    const matchesName = !name || point.name.toLowerCase().includes(name)
    const matchesCode = !code || point.code.toLowerCase().includes(code)
    const matchesArea = !areaId || point.areaId === areaId
    const updatedText = point.raw.updatedAt ? new Date(point.raw.updatedAt).toISOString().slice(0, 10) : ''
    const matchesUpdated = !updatedAt || updatedText.includes(updatedAt)
    return matchesName && matchesCode && matchesArea && matchesUpdated
  })
})

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

const locationPreviewMap = computed(() => {
  if (!locationPreviewPoint.value) return null
  return inspectionStore.inspectionMaps.find(map => map.id === locationPreviewPoint.value?.mapId) || null
})

const locationPreviewMapStyle = computed(() => ({
  backgroundImage: `url(${locationPreviewMap.value?.imageUrl || fallbackMapBackgroundUrl})`,
  backgroundColor: '#eef3ff'
}))

const locationPreviewContextPoints = computed(() => {
  if (!locationPreviewPoint.value) return []
  const currentId = locationPreviewPoint.value.id
  return allPointRows.value
    .filter(point => point.mapId === locationPreviewPoint.value?.mapId)
    .filter(point => point.id !== currentId)
    .sort((left, right) => {
      return left.name.localeCompare(right.name)
    })
})

const filteredMapPoints = computed(() => {
  const name = mapSearchForm.name.trim().toLowerCase()
  const type = mapSearchForm.type
  return points.value.filter((point) => {
    const matchesName = !name || point.name.toLowerCase().includes(name)
    const matchesType = !type || point.bizType === type
    return matchesName && matchesType
  })
})

function normalizeListTab(value: unknown): ListTabKey {
  if (value === 'inspection' || value === 'charging' || value === 'parking') return value
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
  const tag = String(point.description || '').match(/^\[(巡检点|充电点|停车点)\]/)?.[1]
  if (tag === '充电点') return 'charging'
  if (tag === '停车点') return 'parking'
  return 'inspection'
}

function getDescriptionByBizType(type: BizPointType, name: string) {
  if (type === 'charging') return `[充电点] ${name}`
  if (type === 'parking') return `[停车点] ${name}`
  return `[巡检点] ${name}`
}

function pointTypeText(type: BizPointType) {
  if (type === 'charging') return '充电点'
  if (type === 'parking') return '停车点'
  return '巡检点'
}

function getPointTypeColor(type: BizPointType) {
  if (type === 'charging') return 'green'
  if (type === 'parking') return 'orange'
  return 'blue'
}

function getShortType(type: BizPointType) {
  if (type === 'charging') return '充'
  if (type === 'parking') return '停'
  return '巡'
}

function buildPointRow(point: InspectionPoint): PointRow {
  const map = inspectionStore.inspectionMaps.find(item => item.id === point.mapId)
  const bizType = getBizTypeFromPoint(point)
  // 查找关联的导航点
  const navPoint = MockService.getNavPointByInspectionPoint(point.id)
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
    navPointId: navPoint?.id
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

function getCoveredFacilityIds(record: PointRow) {
  const ids = new Set<string>()
  ;(record.raw.coverageObjects || []).forEach((item) => {
    if (item.deviceId) ids.add(item.deviceId)
  })
  if (!ids.size) {
    inspectionStore.getInspectionDevicesByInspectionPointId(record.id).forEach((device) => ids.add(device.id))
  }
  return ids
}

function getCoveredComponentIds(record: PointRow) {
  const ids = new Set<string>()
  ;(record.raw.coverageObjects || []).forEach((item) => {
    if (item.componentId) ids.add(item.componentId)
  })
  if (!ids.size) {
    getCoveredFacilityIds(record).forEach((facilityId) => {
      inspectionStore.getFacilityComponentsByFacilityId(facilityId).forEach((component) => ids.add(component.id))
    })
  }
  return ids
}

function getCoveredInstallationNames(record: PointRow): string[] {
  const names: string[] = []
  const seen = new Set<string>()
  getCoveredFacilityIds(record).forEach((facilityId) => {
    const facility = inspectionStore.inspectionDevices.find((item) => item.id === facilityId)
    if (facility?.installationId && !seen.has(facility.installationId)) {
      seen.add(facility.installationId)
      const installation = inspectionStore.installations.find((item) => item.id === facility.installationId)
      names.push(installation?.name || facility.installationName || facility.installationId)
    }
  })
  return names
}

function getCoveredFacilityNames(record: PointRow): string[] {
  const names: string[] = []
  const seen = new Set<string>()
  getCoveredFacilityIds(record).forEach((facilityId) => {
    if (!seen.has(facilityId)) {
      seen.add(facilityId)
      const facility = inspectionStore.inspectionDevices.find((item) => item.id === facilityId)
      names.push(facility?.name || facilityId)
    }
  })
  return names
}

function getCoveredComponentNames(record: PointRow): string[] {
  const names: string[] = []
  const seen = new Set<string>()
  getCoveredComponentIds(record).forEach((componentId) => {
    if (!seen.has(componentId)) {
      seen.add(componentId)
      const component = inspectionStore.facilityComponents.find((item) => item.id === componentId)
      names.push(component?.name || componentId)
    }
  })
  return names
}

function getCoveredRuleNames(record: PointRow): string[] {
  const ruleIds = new Set<string>()
  ;(record.raw.detectionConfigs || []).forEach((item) => {
    if (item.enabled && item.ruleId) ruleIds.add(item.ruleId)
  })
  if (!ruleIds.size) {
    getCoveredComponentIds(record).forEach((componentId) => {
      const component = inspectionStore.facilityComponents.find((item) => item.id === componentId)
      ;(component?.ruleIds || []).forEach((ruleId) => ruleIds.add(ruleId))
    })
  }
  const ruleOptions = getDetectionItemConfigs()
  return Array.from(ruleIds).map((ruleId) => {
    const rule = ruleOptions.find((r) => r.id === ruleId)
    return rule?.name || ruleId
  })
}

function truncateNames(names: string[], max = 2): string {
  if (names.length <= max) return names.join('、')
  return `${names.slice(0, max).join('、')} +${names.length - max}`
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

  const all = inspectionStore.inspectionPoints.filter(point => point.mapId === selectedMapId.value)
  points.value = all.map((point) => buildPointRow(point))

  if (selectedQueryPointId.value && points.value.some(point => point.id === selectedQueryPointId.value)) {
    selectedPointId.value = selectedQueryPointId.value
    return
  }

  if (!selectedPointId.value && points.value[0]) {
    selectedPointId.value = points.value[0].id
  }
}

function goToMapScopedPage(mapId: string, action?: 'create') {
  router.push({
    path: '/implementation/map/point-manage',
    query: action ? { mapId, action } : { mapId }
  })
}

function goToPointPosition(record: PointRow) {
  locationPreviewPoint.value = record
  locationModalVisible.value = true
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
      // 同步清理关联的导航点
      const navPoint = MockService.getNavPointByInspectionPoint(record.id)
      if (navPoint) {
        MockService.deleteNavigationPoint(navPoint.id)
      }
      message.success('已删除点位及关联导航点')
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
    pendingAddPreview.value = {
      mapX: position.x,
      mapY: position.y,
      name: ''
    }
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
  pendingAddPreview.value = null
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
  const pointId = `point-${Date.now()}`
  const mapX = addForm.mapX
  const mapY = addForm.mapY
  const now = new Date()
  const newPoint: InspectionPoint = {
    id: pointId,
    name,
    code: `IP-${Math.floor(Math.random() * 900 + 100)}`,
    pointType: InspectionPointType.FIXED,
    description: getDescriptionByBizType(addForm.type, name),
    mapId: selectedMapId.value,
    areaId: addForm.areaId || undefined,
    areaName: area?.name || '',
    location: {
      longitude: Number((120 + mapX / 1000).toFixed(6)),
      latitude: Number((30 + mapY / 1000).toFixed(6)),
      altitude: 0
    },
    mapPosition: { x: mapX, y: mapY, yaw: 0 },
    sequence: points.value.length + 1,
    calibrationStatus: CalibrationStatus.PENDING,
    stayDurationSec: 0,
    monitorPoints: [],
    isCritical: false,
    exceptionStrategy: {
      onFailure: ExceptionStrategy.SKIP,
      retryCount: 3,
      skipToNext: true
    },
    positionSource: PositionSource.MAP_PICK,
    createdAt: now,
    updatedAt: now
  }

  inspectionStore.saveInspectionPoint(newPoint)

  // 同步创建 NavigationPoint，打通业务点位与路网导航点位
  const navPointId = `navlink-${Date.now()}`
  const navPoint: NavigationPoint = {
    id: navPointId,
    name,
    code: newPoint.code,
    mapId: selectedMapId.value,
    area: area?.name || '',
    navType: addForm.type,
    position: { x: mapX, y: mapY },
    nodeId: '', // 暂时没有路网节点，用户后续在路网管理页面关联
    inspectionPointId: pointId,
    stayDurationSec: addForm.type === 'inspection' ? 30 : undefined,
    chargingMethod: addForm.type === 'charging' ? addForm.chargingMethod : undefined,
    chargingPower: addForm.type === 'charging' ? addForm.chargingPower : undefined,
    estimatedChargingTime: addForm.type === 'charging' ? addForm.estimatedChargingTime : undefined,
    parkingPriority: addForm.type === 'parking' ? addForm.parkingPriority : undefined,
    maxWaitingTime: addForm.type === 'parking' ? addForm.maxWaitingTime : undefined,
    createdAt: now,
    updatedAt: now
  }
  MockService.saveNavigationPoint(navPoint)

  addModalVisible.value = false
  pendingAddPreview.value = null
  message.success('点位新增成功，已同步创建导航点，可继续点击地图新增')
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

function resetMapSearch() {
  mapSearchForm.name = ''
  mapSearchForm.type = ''
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

function resetChargingSearch() {
  chargingSearchForm.name = ''
  chargingSearchForm.code = ''
  chargingSearchForm.areaId = ''
  chargingSearchForm.updatedAt = ''
}

function resetParkingSearch() {
  parkingSearchForm.name = ''
  parkingSearchForm.code = ''
  parkingSearchForm.areaId = ''
  parkingSearchForm.updatedAt = ''
}

function resetListSearch() {
  listSearchForm.name = ''
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
  window.addEventListener('keydown', onKeyDown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeyDown)
})

function onKeyDown(e: KeyboardEvent) {
  if (e.key === 'Delete' && selectedPointId.value) {
    const point = points.value.find((p: any) => p.id === selectedPointId.value)
    if (point) {
      deletePoint(point)
    }
  }
}

// ─── 点位拖拽移动 ───
function startPointDrag(point: PointRow, event: MouseEvent) {
  isDraggingPoint.value = true
  activeMovePointId.value = point.id
  dragPointStartPos.value = { x: event.clientX, y: event.clientY }
  const onMove = (e: MouseEvent) => {
    if (!isDraggingPoint.value) return
    const stage = document.querySelector('.map-stage') as HTMLElement
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    const newMapX = ((e.clientX - rect.left) / rect.width) * 100
    const newMapY = ((e.clientY - rect.top) / rect.height) * 100
    const pt = points.value.find((p: any) => p.id === point.id)
    if (pt) {
      pt.mapX = Math.max(0, Math.min(100, newMapX))
      pt.mapY = Math.max(0, Math.min(100, newMapY))
    }
  }
  const onUp = () => {
    isDraggingPoint.value = false
    activeMovePointId.value = ''
    dragPointStartPos.value = null
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    // 保存移动后的位置
    const pt = points.value.find((p: any) => p.id === point.id)
    if (pt) {
      const original = inspectionStore.inspectionPoints.find((p: any) => p.id === point.id)
      if (original) {
        inspectionStore.saveInspectionPoint({
          ...original,
          mapPosition: { x: pt.mapX, y: pt.mapY },
          updatedAt: new Date()
        })
        message.success('点位已移动')
      }
    }
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

// ─── 属性面板三态（点位列表已有行内编辑，此处保留接口供未来右侧面板使用） ───
// enterPropertyEdit / savePropertyEdit / cancelPropertyEdit 已在行内编辑中实现
</script>

<style scoped lang="css">
.move-handle {
  position: absolute;
  top: -18px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  cursor: move;
  user-select: none;
  z-index: 10;
}
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

.point-manage .search-panel.compact {
  margin-bottom: 12px;
  padding: 12px;
}

.point-manage .search-item {
  margin-bottom: 0;
}

.point-manage .search-actions {
  display: flex;
  justify-content: flex-end;
  margin: 0;
}

.point-manage .search-actions.inline {
  min-height: 32px;
  align-items: flex-end;
}

.point-manage .card-actions {
  display: inline-flex;
  align-items: center;
}

.point-manage :deep(.map-card .ant-card-head),
.point-manage :deep(.list-card .ant-card-head) {
  min-height: 52px;
  padding: 0 16px;
}

.point-manage :deep(.map-card .ant-card-head-wrapper),
.point-manage :deep(.list-card .ant-card-head-wrapper) {
  align-items: center;
}

.point-manage :deep(.map-card .ant-card-head-title),
.point-manage :deep(.list-card .ant-card-head-title) {
  padding: 12px 0;
  line-height: 28px;
}

.point-manage :deep(.map-card .ant-card-extra),
.point-manage :deep(.list-card .ant-card-extra) {
  display: flex;
  align-items: center;
  padding: 0;
}

.point-manage :deep(.ant-btn) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.point-manage :deep(.search-actions .ant-space),
.point-manage :deep(.card-actions.ant-space),
.point-manage :deep(.ant-table-cell .ant-space) {
  align-items: center;
}

.layout-stack {
  display: grid;
  grid-template-rows: auto auto;
  gap: 16px;
  margin-top: 16px;
}

.map-card {
  min-width: 0;
  overflow: hidden;
}

.list-card {
  min-width: 0;
}

.point-manage :deep(.map-card .ant-card-body) {
  padding: 12px;
}

.point-manage :deep(.list-card .ant-card-body) {
  padding: 12px;
}

.point-manage :deep(.list-card .ant-table-thead > tr > th) {
  white-space: nowrap;
}

.point-manage :deep(.list-card .ant-table-tbody > tr > td) {
  padding-top: 10px;
  padding-bottom: 10px;
  vertical-align: middle;
}

.map-stage {
  position: relative;
  height: clamp(480px, 58vh, 640px);
  min-height: 0;
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
  z-index: 1;
  background: linear-gradient(180deg, rgba(4, 12, 26, 0.12) 0%, rgba(4, 12, 26, 0.26) 100%);
}

.map-tip {
  position: absolute;
  top: 12px;
  left: 12px;
  z-index: 2;
  box-sizing: border-box;
  width: fit-content;
  max-width: min(520px, calc(100% - 24px));
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.9);
  color: #1f2937;
  font-size: 13px;
  line-height: 1.4;
  max-width: 520px;
  white-space: normal;
  word-break: break-word;
}

.marker {
  position: absolute;
  z-index: 3;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  max-width: min(260px, calc(100% - 24px));
  transform: translate(-50%, -50%);
  cursor: pointer;
  user-select: none;
}

.marker.active,
.marker.moving,
.marker.pending {
  z-index: 4;
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
  max-width: 190px;
  padding: 4px 8px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.92);
  color: #0f172a;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.18);
}

.marker.active .marker-dot,
.marker.moving .marker-dot {
  background: #ef4444;
  box-shadow: 0 8px 16px rgba(239, 68, 68, 0.35);
}

.marker.pending .marker-dot {
  background: #fa8c16;
  box-shadow: 0 8px 16px rgba(250, 140, 22, 0.35);
}

.marker.pending .marker-text {
  border: 1px dashed rgba(250, 140, 22, 0.45);
}

.location-preview {
  display: grid;
  gap: 14px;
}

.location-preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.location-preview-title {
  color: #0f172a;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
}

.location-preview-meta {
  color: #64748b;
  font-size: 13px;
}

.location-preview-stage {
  position: relative;
  height: 520px;
  border: 1px solid #b4c9ff;
  border-radius: 12px;
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  overflow: hidden;
}

.location-preview-tip {
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

.location-marker {
  pointer-events: none;
}

.location-marker.dimmed {
  opacity: 0.42;
}

.location-preview-descriptions {
  margin-top: 2px;
}

.current-location-pin {
  position: absolute;
  z-index: 8;
  display: grid;
  justify-items: center;
  transform: translate(-50%, -100%);
  pointer-events: none;
}

.pin-pulse {
  position: absolute;
  top: 12px;
  width: 48px;
  height: 48px;
  border-radius: 999px;
  background: rgba(239, 68, 68, 0.22);
  animation: pin-pulse 1.6s ease-out infinite;
}

.pin-head {
  position: relative;
  z-index: 2;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 3px solid #fff;
  border-radius: 999px;
  background: #ef4444;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 10px 24px rgba(127, 29, 29, 0.42);
  line-height: 1;
}

.pin-head::after {
  position: absolute;
  bottom: -12px;
  left: 50%;
  width: 0;
  height: 0;
  border-top: 14px solid #ef4444;
  border-right: 9px solid transparent;
  border-left: 9px solid transparent;
  content: '';
  transform: translateX(-50%);
}

.pin-tail {
  width: 10px;
  height: 10px;
  margin-top: 10px;
  border: 2px solid #fff;
  border-radius: 999px;
  background: #ef4444;
  box-shadow: 0 4px 10px rgba(127, 29, 29, 0.32);
}

.pin-label {
  position: absolute;
  left: 50%;
  top: 46px;
  min-width: 150px;
  max-width: 260px;
  padding: 6px 10px;
  border: 1px solid rgba(239, 68, 68, 0.28);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.96);
  color: #991b1b;
  font-size: 12px;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  box-shadow: 0 8px 20px rgba(15, 23, 42, 0.16);
  transform: translateX(-50%);
}

@keyframes pin-pulse {
  0% {
    opacity: 0.75;
    transform: scale(0.62);
  }
  100% {
    opacity: 0;
    transform: scale(1.45);
  }
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
  .map-stage {
    height: 480px;
  }
}
</style>
