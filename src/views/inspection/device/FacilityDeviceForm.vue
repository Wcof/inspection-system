<template>
  <div class="facility-device-form">
    <a-page-header :title="isEdit ? '编辑巡检设备' : '新建巡检设备'" @back="goBack" />

    <a-modal
      v-model:open="wizardVisible"
      title="设备设施采集向导"
      width="1360px"
      :get-container="false"
      :mask-closable="false"
      :keyboard="false"
      @cancel="handleCancelWizard"
      @ok="handleConfirmWizard"
    >
      <div class="wizard-head">
        <a-form layout="inline">
          <a-form-item label="选择机器人" required>
            <a-select
              v-model:value="wizardRobotId"
              placeholder="请选择机器人"
              style="width: 280px"
            >
              <a-select-option v-for="robot in robots" :key="robot.id" :value="robot.id">
                {{ robot.name }}
              </a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item>
            <a-button @click="refreshPtzSnapshot">刷新实时画面</a-button>
          </a-form-item>
        </a-form>
      </div>

      <div class="wizard-body">
        <div class="wizard-left">
          <div class="panel-title">实时云台画面（拖拽框选）</div>
          <div
            class="ptz-canvas"
            ref="canvasRef"
            @pointerdown.prevent="handleCanvasPointerDown"
            @pointermove.prevent="handleCanvasPointerMove"
            @pointerup.prevent="handleCanvasPointerUp"
            @pointercancel.prevent="handleCanvasPointerUp"
            @pointerleave.prevent="handleCanvasPointerUp"
          >
            <img :src="wizardPreviewImage" alt="云台画面" class="ptz-image" @error="handlePreviewImageError" />
            <template v-if="wizardRoi.width > 0 && wizardRoi.height > 0">
              <div class="roi-mask roi-mask-top" :style="{ top: '0px', height: `${wizardRoi.y}px` }" />
              <div class="roi-mask roi-mask-left" :style="{ top: `${wizardRoi.y}px`, left: '0px', height: `${wizardRoi.height}px`, width: `${wizardRoi.x}px` }" />
              <div
                class="roi-mask roi-mask-right"
                :style="{ top: `${wizardRoi.y}px`, height: `${wizardRoi.height}px`, left: `${wizardRoi.x + wizardRoi.width}px`, width: `calc(100% - ${wizardRoi.x + wizardRoi.width}px)` }"
              />
              <div class="roi-mask roi-mask-bottom" :style="{ left: '0px', top: `${wizardRoi.y + wizardRoi.height}px`, height: `calc(100% - ${wizardRoi.y + wizardRoi.height}px)` }" />
            </template>
            <div
              v-if="wizardRoi.width > 0 && wizardRoi.height > 0"
              class="roi-box"
              :style="{
                left: `${wizardRoi.x}px`,
                top: `${wizardRoi.y}px`,
                width: `${wizardRoi.width}px`,
                height: `${wizardRoi.height}px`
              }"
            >
              <span class="roi-meta">{{ wizardRoi.width }} × {{ wizardRoi.height }}</span>
              <span class="roi-handle roi-handle-tl" />
              <span class="roi-handle roi-handle-tr" />
              <span class="roi-handle roi-handle-bl" />
              <span class="roi-handle roi-handle-br" />
            </div>
          </div>
        </div>

        <div class="wizard-right">
          <div class="panel-title">设备信息与检测项</div>
          <a-form layout="vertical">
            <a-row :gutter="12">
              <a-col :span="12">
                <a-form-item label="设备名称" required>
                  <a-input v-model:value="form.name" placeholder="例如：1号反应釜温度计" />
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="设备编码" required>
                  <a-input v-model:value="form.code" placeholder="例如：DEV-TEMP-001" />
                </a-form-item>
              </a-col>
            </a-row>

            <a-row :gutter="12">
              <a-col :span="12">
                <a-form-item label="所属巡检点" required>
                  <a-select v-model:value="form.inspectionPointId" placeholder="请选择巡检点">
                    <a-select-option v-for="point in inspectionPoints" :key="point.id" :value="point.id">
                      {{ point.name }}
                    </a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
              <a-col :span="12">
                <a-form-item label="设备类型" required>
                  <a-select v-model:value="form.type" placeholder="请选择设备类型">
                    <a-select-option value="temperature_meter">温度计</a-select-option>
                    <a-select-option value="pressure_meter">压力表</a-select-option>
                    <a-select-option value="level_meter">液位计</a-select-option>
                    <a-select-option value="camera">摄像头</a-select-option>
                    <a-select-option value="other">其他</a-select-option>
                  </a-select>
                </a-form-item>
              </a-col>
            </a-row>

            <a-alert type="info" show-icon style="margin-bottom: 12px">
              <template #message>
                框选结果：X={{ wizardRoi.x }}，Y={{ wizardRoi.y }}，宽={{ wizardRoi.width }}，高={{ wizardRoi.height }}
              </template>
            </a-alert>

            <a-card size="small" title="云台坐标信息">
              <a-row :gutter="12">
                <a-col :span="6"><div class="ptz-item">X：{{ wizardPtz.x }}</div></a-col>
                <a-col :span="6"><div class="ptz-item">Y：{{ wizardPtz.y }}</div></a-col>
                <a-col :span="6"><div class="ptz-item">焦距：{{ wizardPtz.z }}</div></a-col>
                <a-col :span="6"><div class="ptz-item">角度：{{ wizardPtz.angle }}°</div></a-col>
              </a-row>
            </a-card>

            <div class="wizard-check-items">
              <div class="wizard-check-head">
                <span>检测项配置</span>
                <a-space>
                  <a-button size="small" @click="handleAddCheckItem">添加检测项</a-button>
                  <a-button size="small" @click="addDefaultCheckItems">填充默认检测项</a-button>
                </a-space>
              </div>
              <a-table
                :columns="wizardCheckColumns"
                :data-source="checkItems"
                row-key="id"
                size="small"
                :pagination="false"
                :scroll="{ x: 1320, y: 320 }"
              >
                <template #bodyCell="{ column, record, index }">
                  <template v-if="column.key === 'name'">
                    <a-input v-if="record.isEditing" v-model:value="record.name" placeholder="请输入名称" />
                    <template v-else>{{ record.name }}</template>
                  </template>

                  <template v-if="column.key === 'code'">
                    <a-input v-if="record.isEditing" v-model:value="record.code" placeholder="请输入编码" />
                    <template v-else>{{ record.code }}</template>
                  </template>

                  <template v-if="column.key === 'checkType'">
                    <a-tag color="blue">图像识别</a-tag>
                  </template>

                  <template v-if="column.key === 'itemType'">
                    <a-select
                      v-if="record.isEditing"
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
                      v-if="record.isEditing && isThresholdFieldEnabled(record.itemType, 'min')"
                      v-model:value="record.threshold.min"
                      placeholder="最小值"
                      style="width: 100%"
                    />
                    <template v-else-if="!isThresholdFieldEnabled(record.itemType, 'min')">-</template>
                    <template v-else>{{ record.threshold?.min ?? '-' }}</template>
                  </template>

                  <template v-if="column.key === 'max'">
                    <a-input-number
                      v-if="record.isEditing && isThresholdFieldEnabled(record.itemType, 'max')"
                      v-model:value="record.threshold.max"
                      placeholder="最大值"
                      style="width: 100%"
                    />
                    <template v-else-if="!isThresholdFieldEnabled(record.itemType, 'max')">-</template>
                    <template v-else>{{ record.threshold?.max ?? '-' }}</template>
                  </template>


                  <template v-if="column.key === 'mappingSource'">
                    <template v-if="record.isEditing">
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
                    <template v-if="record.isEditing">
                      <template v-if="record.visionMapping.sourceType === 'system'">
                        <a-popover trigger="click" content="">
                          <template #content>
                            <img :src="getSystemImageUrl(record)" alt="系统配置图像" style="max-width: 400px; max-height: 300px;" />
                          </template>
                          <img :src="getSystemImageUrl(record)" alt="系统配置图像" style="width: 60px; height: 60px; object-fit: cover; cursor: pointer;" />
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
                        <a-popover trigger="click" content="">
                          <template #content>
                            <img :src="getSystemImageUrl(record)" alt="系统配置图像" style="max-width: 400px; max-height: 300px;" />
                          </template>
                          <img :src="getSystemImageUrl(record)" alt="系统配置图像" style="width: 60px; height: 60px; object-fit: cover; cursor: pointer;" />
                        </a-popover>
                      </template>
                      <template v-else-if="record.visionMapping.customImageUrl">
                        <a-popover trigger="click" content="">
                          <template #content>
                            <img :src="record.visionMapping.customImageUrl" alt="手动上传图像" style="max-width: 400px; max-height: 300px;" />
                          </template>
                          <img :src="record.visionMapping.customImageUrl" alt="手动上传图像" style="width: 60px; height: 60px; object-fit: cover; cursor: pointer;" />
                        </a-popover>
                      </template>
                      <template v-else>
                        <span>-</span>
                      </template>
                    </template>
                  </template>

                  <template v-if="column.key === 'recognitionMode'">
                    <template v-if="record.isEditing">
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
                    <a-space v-if="record.isEditing">
                      <a-button type="link" @click="handleConfirmRow(index)">保存</a-button>
                      <a-button type="link" danger @click="handleCancelEdit(index)">取消</a-button>
                    </a-space>
                    <a-space v-else>
                      <a-button type="link" @click="handleEditRow(index)">编辑</a-button>
                      <a-button type="link" danger @click="handleDeleteCheckItem(index)">删除</a-button>
                    </a-space>
                  </template>
                </template>
              </a-table>
            </div>
          </a-form>
        </div>
      </div>
    </a-modal>

    <a-card v-if="false" style="margin-top: 16px">
      <a-form :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="设备名称" name="name" :rules="[{ required: true, message: '请输入设备名称' }]">
              <a-input v-model:value="form.name" placeholder="请输入设备名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="编码" name="code" :rules="[{ required: true, message: '请输入编码' }]">
              <a-input v-model:value="form.code" placeholder="请输入编码" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="所属巡检点" name="inspectionPointId" :rules="[{ required: true, message: '请选择巡检点' }]">
              <a-select v-model:value="form.inspectionPointId" placeholder="请选择巡检点" style="width: 100%">
                <a-select-option v-for="point in inspectionPoints" :key="point.id" :value="point.id">
                  {{ point.name }}
                </a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="设备类型" name="type" :rules="[{ required: true, message: '请选择设备类型' }]">
              <a-select v-model:value="form.type" placeholder="请选择设备类型" style="width: 100%">
                <a-select-option value="valve">阀门</a-select-option>
                <a-select-option value="pump">泵</a-select-option>
                <a-select-option value="motor">电机</a-select-option>
                <a-select-option value="other">其他</a-select-option>
              </a-select>
            </a-form-item>
          </a-col>
        </a-row>

        <a-divider>检测项管理</a-divider>

        <div class="check-items-toolbar">
          <a-button type="primary" @click="handleAddCheckItem">
            <a-icon type="plus" />
            添加检测项
          </a-button>
        </div>

        <a-table :columns="checkItemColumns" :data-source="checkItems" row-key="id" :pagination="false">
          <template #bodyCell="{ column, record, index }">
            <template v-if="column.key === 'name'">
              <a-input v-if="record.isEditing" v-model:value="record.name" placeholder="请输入名称" />
              <template v-else>{{ record.name }}</template>
            </template>

            <template v-if="column.key === 'code'">
              <a-input v-if="record.isEditing" v-model:value="record.code" placeholder="请输入编码" />
              <template v-else>{{ record.code }}</template>
            </template>

            <template v-if="column.key === 'checkType'">
              <a-tag color="blue">图像识别</a-tag>
            </template>

            <template v-if="column.key === 'itemType'">
              <a-select
                v-if="record.isEditing"
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
                v-if="record.isEditing && isThresholdFieldEnabled(record.itemType, 'min')"
                v-model:value="record.threshold.min"
                placeholder="最小值"
                style="width: 100%"
              />
              <template v-else-if="!isThresholdFieldEnabled(record.itemType, 'min')">-</template>
              <template v-else>{{ record.threshold?.min ?? '-' }}</template>
            </template>

            <template v-if="column.key === 'max'">
              <a-input-number
                v-if="record.isEditing && isThresholdFieldEnabled(record.itemType, 'max')"
                v-model:value="record.threshold.max"
                placeholder="最大值"
                style="width: 100%"
              />
              <template v-else-if="!isThresholdFieldEnabled(record.itemType, 'max')">-</template>
              <template v-else>{{ record.threshold?.max ?? '-' }}</template>
            </template>


            <template v-if="column.key === 'mappingSource'">
              <template v-if="record.isEditing">
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
              <template v-if="record.isEditing">
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
              <template v-if="record.isEditing">
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
              <a-space v-if="record.isEditing">
                <a-button type="link" @click="handleConfirmRow(index)">保存</a-button>
                <a-button type="link" danger @click="handleCancelEdit(index)">取消</a-button>
              </a-space>
              <a-space v-else>
                <a-button type="link" @click="handleEditRow(index)">编辑</a-button>
                <a-button type="link" danger @click="handleDeleteCheckItem(index)">删除</a-button>
              </a-space>
            </template>
          </template>
        </a-table>

        <a-form-item style="margin-top: 20px">
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
import type { InspectionDevice, InspectionPoint } from '@/types/inspection'
import { DeviceStatus } from '@/types/inspection'
import { message, Modal } from 'ant-design-vue'

const router = useRouter()
const route = useRoute()
const inspectionStore = useInspectionStore()
const robotStore = useRobotStore()

const saving = ref(false)
const isEdit = computed(() => !!route.params.id)
const inspectionPoints = ref<InspectionPoint[]>([])
const existingDevice = ref<InspectionDevice | undefined>(undefined)
const robots = computed(() => robotStore.robots)
const wizardVisible = ref(false)
const wizardRobotId = ref('')
const canvasRef = ref<HTMLElement | null>(null)
const isDrawing = ref(false)
const wizardCheckColumns = [
  { title: '名称', dataIndex: 'name', key: 'name', width: 160 },
  { title: '编码', dataIndex: 'code', key: 'code', width: 160 },
  { title: '检测方式', key: 'checkType', width: 110 },
  { title: '图像映射', key: 'mappingSource', width: 120 },
  { title: '图像', key: 'image', width: 150 },
  { title: '识别模式', key: 'recognitionMode', width: 140 },
  { title: '类型', dataIndex: 'itemType', key: 'itemType', width: 120 },
  { title: '最小值', key: 'min', width: 100 },
  { title: '最大值', key: 'max', width: 100 },
  { title: '操作', key: 'actions', width: 180 }
]
const wizardRoi = reactive({ x: 0, y: 0, width: 0, height: 0 })
const wizardPtz = reactive({ x: 0, y: 0, z: 0, angle: 0 })
const drawStart = reactive({ x: 0, y: 0 })
const mockFrameIndex = ref(0)

function buildMockPtzFrame(label: string, seed: number) {
  const tintA = ['#0f172a', '#111827', '#1e293b'][seed % 3]
  const tintB = ['#1d4ed8', '#0ea5e9', '#22c55e'][seed % 3]
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${tintA}"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
    <linearGradient id="hl" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${tintB}" stop-opacity="0.18"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.05"/>
    </linearGradient>
  </defs>
  <rect width="1280" height="720" fill="url(#bg)"/>
  <rect x="40" y="40" width="1200" height="640" rx="16" fill="url(#hl)" stroke="#334155" stroke-width="2"/>
  <line x1="640" y1="70" x2="640" y2="650" stroke="#94a3b8" stroke-opacity="0.4" stroke-dasharray="8 8"/>
  <line x1="70" y1="360" x2="1210" y2="360" stroke="#94a3b8" stroke-opacity="0.4" stroke-dasharray="8 8"/>
  <circle cx="640" cy="360" r="46" fill="none" stroke="${tintB}" stroke-width="2"/>
  <rect x="92" y="92" width="260" height="34" rx="8" fill="#0b1220" fill-opacity="0.75" stroke="#334155"/>
  <text x="108" y="115" fill="#e2e8f0" font-size="16" font-family="Arial, sans-serif">MOCK PTZ FEED · ${label}</text>
  <rect x="930" y="92" width="258" height="34" rx="8" fill="#0b1220" fill-opacity="0.75" stroke="#334155"/>
  <text x="946" y="115" fill="#e2e8f0" font-size="16" font-family="Arial, sans-serif">TIME ${new Date().toLocaleTimeString()}</text>
</svg>`
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
}

const mockPtzFrames = [
  buildMockPtzFrame('反应釜区域 A', 0),
  buildMockPtzFrame('压力管线 B', 1),
  buildMockPtzFrame('储罐通道 C', 2)
]
const wizardPreviewImage = ref(mockPtzFrames[0])
const fallbackPtzFrame = buildMockPtzFrame('默认巡检画面', 1)

const form = reactive<Partial<InspectionDevice>>({
  name: '',
  code: '',
  inspectionPointId: undefined,
  type: '',
  ptzPreset: { x: 0, y: 0, z: 0 },
  status: DeviceStatus.ACTIVE,
  checkItems: []
})

const checkItems = ref<any[]>([])
const deletedCheckItemIds = ref<string[]>([])
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

const checkItemColumns = [
  { title: '名称', dataIndex: 'name', key: 'name', width: 140 },
  { title: '编码', dataIndex: 'code', key: 'code', width: 140 },
  { title: '检测方式', key: 'checkType', width: 110 },
  { title: '图像映射', key: 'mappingSource', width: 120 },
  { title: '图像', key: 'image', width: 150 },
  { title: '识别模式', key: 'recognitionMode', width: 140 },
  { title: '类型', dataIndex: 'itemType', key: 'itemType', width: 120 },
  { title: '最小值', key: 'min', width: 100 },
  { title: '最大值', key: 'max', width: 100 },
  { title: '操作', key: 'actions', width: 180 }
]

function goBack() {
  router.push('/facility/device')
}

function normalizeVisionMapping(mapping: any) {
  const sourceType = mapping?.sourceType === 'manual' || mapping?.sourceType === 'template_image' ? 'manual' : 'system'
  const customImageUrl = mapping?.customImageUrl || mapping?.templateImageUrl || ''
  const recognitionMode = mapping?.recognitionMode === 'ai' ? 'ai' : 'ocr'
  return { sourceType, customImageUrl, recognitionMode }
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

function isThresholdFieldEnabled(itemType: string, field: ThresholdKey): boolean {
  const enabledFields = thresholdFieldRuleMap[itemType] || []
  return enabledFields.includes(field)
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

function buildEditableCheckItem(item: any) {
  const normalized = normalizeCheckItem(item)
  return {
    ...normalized,
    isNew: !item?.id,
    isEditing: !item?.id,
    _backup: null as any
  }
}

function validateCheckItemRow(row: any) {
  if (!row.name || !row.code) {
    message.error('请填写检测项名称和编码')
    return false
  }
  if (!row.itemType) {
    message.error('请选择检测项类型')
    return false
  }
  if (row.visionMapping?.sourceType === 'manual' && !row.visionMapping?.customImageUrl?.trim()) {
    message.error('选择手动上传时必须填写图片URL')
    return false
  }
  if (!row.visionMapping?.recognitionMode) {
    message.error('请选择识别模式')
    return false
  }
  return true
}

function handleAddCheckItem() {
  checkItems.value.push({
    id: `temp-${Date.now()}`,
    deviceId: '',
    name: '',
    code: '',
    checkType: 'vision',
    itemType: '温度',
    threshold: {
      min: undefined,
      max: undefined
    },
    visionMapping: {
      sourceType: 'system',
      customImageUrl: '',
      recognitionMode: 'ocr'
    },
    isNew: true,
    isEditing: true,
    _backup: null
  })
}

function handleEditRow(index: number) {
  const row = checkItems.value[index]
  row._backup = JSON.parse(JSON.stringify(row))
  row.isEditing = true
}

function handleConfirmRow(index: number) {
  const row = checkItems.value[index]
  if (!validateCheckItemRow(row)) return
  resetDisabledThresholdFields(row)
  row.isEditing = false
  row._backup = null
}

function handleCancelEdit(index: number) {
  const row = checkItems.value[index]
  if (row.isNew) {
    checkItems.value.splice(index, 1)
    return
  }
  if (row._backup) {
    checkItems.value[index] = {
      ...row._backup,
      isNew: false,
      isEditing: false,
      _backup: null
    }
    return
  }
  row.isEditing = false
}

function handleDeleteCheckItem(index: number) {
  const row = checkItems.value[index]
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这个检测项吗？',
    okText: '确定',
    cancelText: '取消',
    onOk() {
      if (!row.isNew && row.id) {
        deletedCheckItemIds.value.push(row.id)
      }
      checkItems.value.splice(index, 1)
      message.success('删除成功')
    }
  })
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

function addDefaultCheckItems() {
  if (checkItems.value.length > 0) return
  const now = Date.now()
  checkItems.value.push(
    buildEditableCheckItem({
      id: `temp-${now}-temp`,
      name: '温度',
      code: 'CHECK-TEMP',
      itemType: '温度',
      threshold: { min: 0, max: 100 },
      visionMapping: { sourceType: 'system', customImageUrl: '', recognitionMode: 'ocr' }
    }),
    buildEditableCheckItem({
      id: `temp-${now}-appearance`,
      name: '外观',
      code: 'CHECK-APPEARANCE',
      itemType: '外观',
      threshold: {},
      visionMapping: { sourceType: 'system', customImageUrl: '', recognitionMode: 'ai' }
    })
  )
  checkItems.value.forEach(item => {
    item.isEditing = false
    item.isNew = true
  })
  applyRoiToCheckItems()
}

function refreshPtzSnapshot() {
  mockFrameIndex.value = (mockFrameIndex.value + 1) % mockPtzFrames.length
  wizardPreviewImage.value = mockPtzFrames[mockFrameIndex.value]
}

function handlePreviewImageError() {
  wizardPreviewImage.value = fallbackPtzFrame
}

function updatePtzByRoi() {
  wizardPtz.x = wizardRoi.x
  wizardPtz.y = wizardRoi.y
  wizardPtz.z = Math.max(1, Math.round((wizardRoi.width + wizardRoi.height) / 40))
  wizardPtz.angle = Math.round((wizardRoi.x / 640) * 180)
  form.ptzPreset = { x: wizardPtz.x, y: wizardPtz.y, z: wizardPtz.z }
}

function applyRoiToCheckItems() {
  checkItems.value.forEach((item: any) => {
    if (!item.visionMapping) {
      item.visionMapping = { sourceType: 'system', customImageUrl: '', recognitionMode: 'ocr' }
    }
    item.visionMapping.roi = {
      x: wizardRoi.x,
      y: wizardRoi.y,
      width: wizardRoi.width,
      height: wizardRoi.height
    }
  })
}

function getPointerPos(event: PointerEvent) {
  const el = canvasRef.value
  if (!el) return null
  const rect = el.getBoundingClientRect()
  const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left))
  const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top))
  return { x, y }
}

function handleCanvasPointerDown(event: PointerEvent) {
  const el = canvasRef.value
  const point = getPointerPos(event)
  if (!el || !point) return
  if (event.button !== 0) return
  el.setPointerCapture?.(event.pointerId)
  drawStart.x = Math.round(point.x)
  drawStart.y = Math.round(point.y)
  wizardRoi.x = drawStart.x
  wizardRoi.y = drawStart.y
  wizardRoi.width = 0
  wizardRoi.height = 0
  isDrawing.value = true
}

function handleCanvasPointerMove(event: PointerEvent) {
  if (!isDrawing.value) return
  const point = getPointerPos(event)
  if (!point) return
  const currentX = point.x
  const currentY = point.y
  wizardRoi.x = Math.round(Math.min(drawStart.x, currentX))
  wizardRoi.y = Math.round(Math.min(drawStart.y, currentY))
  wizardRoi.width = Math.round(Math.abs(currentX - drawStart.x))
  wizardRoi.height = Math.round(Math.abs(currentY - drawStart.y))
}

function handleCanvasPointerUp(event?: PointerEvent) {
  const el = canvasRef.value
  if (el && event?.pointerId !== undefined && el.hasPointerCapture?.(event.pointerId)) {
    el.releasePointerCapture?.(event.pointerId)
  }
  if (!isDrawing.value) return
  isDrawing.value = false
  if (wizardRoi.width < 8 || wizardRoi.height < 8) {
    wizardRoi.width = 0
    wizardRoi.height = 0
    return
  }
  updatePtzByRoi()
  applyRoiToCheckItems()
}

function handleCancelWizard() {
  goBack()
}

function handleConfirmWizard() {
  if (!wizardRobotId.value) {
    message.error('请先选择机器人')
    return
  }
  if (!form.name || !form.code || !form.inspectionPointId || !form.type) {
    message.error('请完善右侧设备基础信息')
    return
  }
  const hasRoi = wizardRoi.width > 0 && wizardRoi.height > 0
  const hasExistingPtz = !!existingDevice.value?.ptzPreset
  if (!hasRoi && !hasExistingPtz) {
    message.error('请在左侧画面中先完成框选')
    return
  }
  if (checkItems.value.length === 0) {
    addDefaultCheckItems()
  }
  handleSave()
}

async function handleSave() {
  if (!form.name || !form.code || !form.inspectionPointId || !form.type) {
    message.error('请填写必填项')
    return
  }

  const editingRow = checkItems.value.find(item => item.isEditing)
  if (editingRow) {
    message.error('请先保存或取消当前正在编辑的检测项')
    return
  }

  for (const item of checkItems.value) {
    if (!validateCheckItemRow(item)) return
  }

  saving.value = true
  try {
    const deviceId = isEdit.value ? route.params.id as string : `device-${Date.now()}`
    const now = new Date()

    const deviceData: InspectionDevice = {
      id: deviceId,
      name: form.name!,
      code: form.code!,
      inspectionPointId: form.inspectionPointId!,
      type: form.type!,
      sequence: existingDevice.value?.sequence || 1,
      ptzPreset: form.ptzPreset || existingDevice.value?.ptzPreset,
      referenceImageUrl: existingDevice.value?.referenceImageUrl,
      referenceImageVersion: existingDevice.value?.referenceImageVersion,
      status: form.status || DeviceStatus.ACTIVE,
      checkItems: [],
      createdAt: existingDevice.value?.createdAt || now,
      updatedAt: now
    }
    inspectionStore.saveInspectionDevice(deviceData)

    deletedCheckItemIds.value.forEach(id => inspectionStore.deleteInspectionDeviceCheckItem(id))

    checkItems.value.forEach(item => {
      const normalized = normalizeCheckItem(item)
      inspectionStore.saveInspectionDeviceCheckItem({
        id: item.isNew ? undefined : normalized.id,
        deviceId,
        name: normalized.name,
        code: normalized.code,
        checkType: 'vision',
        unit: normalized.itemType,
        threshold: normalized.threshold,
        visionMapping: {
          sourceType: normalized.visionMapping.sourceType,
          customImageUrl: normalized.visionMapping.sourceType === 'manual' ? normalized.visionMapping.customImageUrl?.trim() : undefined,
          recognitionMode: normalized.visionMapping.recognitionMode
        },
        createdAt: item.isNew ? now : (normalized.createdAt || now),
        updatedAt: now
      } as any)
    })

    message.success(isEdit.value ? '更新成功' : '创建成功')
    goBack()
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  inspectionStore.initialize()
  robotStore.initialize()
  inspectionPoints.value = inspectionStore.inspectionPoints
  wizardRobotId.value = robots.value[0]?.id || ''

  if (route.query.pointId) {
    form.inspectionPointId = route.query.pointId as string
  }

  if (isEdit.value) {
    const device = inspectionStore.inspectionDevices.find(d => d.id === route.params.id)
    if (device) {
      existingDevice.value = device
      Object.assign(form, {
        name: device.name,
        code: device.code,
        inspectionPointId: device.inspectionPointId,
        type: device.type,
        ptzPreset: device.ptzPreset,
        status: device.status
      })
      checkItems.value = inspectionStore.getInspectionDeviceCheckItemsByDeviceId(device.id).map(item => buildEditableCheckItem(item))
    }
  }

  wizardVisible.value = true
  if (checkItems.value.length === 0) {
    addDefaultCheckItems()
  }
})
</script>

<style scoped lang="scss">
.facility-device-form {
  width: 100%;

  .check-items-toolbar {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 12px;
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

  .wizard-head {
    margin-bottom: 12px;
    padding: 8px 0 4px;
    border-bottom: 1px solid #f0f0f0;
  }

  .wizard-body {
    display: grid;
    grid-template-columns: minmax(720px, 1.35fr) minmax(460px, 1fr);
    gap: 16px;
    min-height: 540px;
    align-items: stretch;
  }

  .wizard-left,
  .wizard-right {
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    padding: 12px;
    background: #fff;
    min-height: 540px;
  }

  .wizard-right {
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow: hidden;
  }

  .panel-title {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 10px;
    color: #262626;
  }

  .ptz-canvas {
    position: relative;
    width: 100%;
    height: calc(100% - 34px);
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
    overflow: hidden;
    background:
      radial-gradient(circle at 30% 20%, rgba(30, 64, 175, 0.28), transparent 40%),
      radial-gradient(circle at 80% 70%, rgba(14, 165, 233, 0.2), transparent 45%),
      linear-gradient(135deg, #0b1220 0%, #020617 100%);
    cursor: crosshair;
    touch-action: none;
    isolation: isolate;
  }

  .ptz-image {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: cover;
    user-select: none;
    pointer-events: none;
  }

  .roi-box {
    position: absolute;
    border: 2px solid #1677ff;
    background: rgba(22, 119, 255, 0.15);
    box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.6);
    z-index: 3;
  }

  .roi-mask {
    position: absolute;
    left: 0;
    width: 100%;
    background: rgba(0, 0, 0, 0.45);
    pointer-events: none;
    z-index: 2;
  }

  .roi-mask-left,
  .roi-mask-right {
    width: auto;
  }

  .roi-mask-top {
    top: 0;
  }

  .roi-mask-left {
    left: 0;
  }

  .roi-mask-right {
    right: 0;
  }

  .roi-mask-bottom {
    bottom: 0;
  }

  .roi-meta {
    position: absolute;
    top: -26px;
    left: 0;
    padding: 2px 8px;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.72);
    color: #fff;
    font-size: 12px;
    line-height: 20px;
    white-space: nowrap;
    z-index: 4;
  }

  .roi-handle {
    position: absolute;
    width: 8px;
    height: 8px;
    background: #1677ff;
    border: 1px solid #fff;
    border-radius: 1px;
  }

  .roi-handle-tl {
    top: -5px;
    left: -5px;
  }

  .roi-handle-tr {
    top: -5px;
    right: -5px;
  }

  .roi-handle-bl {
    bottom: -5px;
    left: -5px;
  }

  .roi-handle-br {
    bottom: -5px;
    right: -5px;
  }

  .ptz-item {
    font-size: 13px;
    color: #595959;
  }

  .wizard-check-items {
    margin-top: 12px;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border: 1px solid #f0f0f0;
    border-radius: 8px;
    padding: 10px;
    background: #fafafa;
  }

  .wizard-check-head {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
    gap: 8px;
    flex-wrap: wrap;
  }

  :deep(.wizard-check-items .ant-table-wrapper) {
    flex: 1;
    min-height: 0;
  }

  :deep(.wizard-check-items .ant-table) {
    border: 1px solid #f0f0f0;
    border-radius: 6px;
    background: #fff;
  }

  :deep(.wizard-check-items .ant-table-thead > tr > th) {
    white-space: nowrap;
  }

  :deep(.wizard-check-items .ant-table-tbody > tr > td) {
    white-space: nowrap;
    vertical-align: middle;
  }

  :deep(.wizard-check-items .ant-space) {
    flex-wrap: nowrap;
  }

  @media (max-width: 1024px) {
    .wizard-body {
      grid-template-columns: 1fr;
    }

    .ptz-canvas {
      height: 320px;
    }
  }
}
</style>
