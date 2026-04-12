<template>
  <div class="inspection-route-form">
    <a-page-header :title="isEdit ? '编辑巡检路线' : '新建巡检路线'" @back="goBack">
    </a-page-header>

    <a-card style="margin-top: 16px">
      <a-form :model="form" layout="vertical">
        <a-row :gutter="16">
          <a-col :span="12">
            <a-form-item label="路线名称" name="name" :rules="[{ required: true, message: '请输入路线名称' }]">
              <a-input v-model:value="form.name" placeholder="请输入路线名称" />
            </a-form-item>
          </a-col>
          <a-col :span="12">
            <a-form-item label="编码" name="code" :rules="[{ required: true, message: '请输入编码' }]">
              <a-input v-model:value="form.code" placeholder="请输入编码" />
            </a-form-item>
          </a-col>
        </a-row>

        <a-form-item label="描述" name="description">
          <a-textarea v-model:value="form.description" placeholder="请输入描述" :rows="3" />
        </a-form-item>

        <a-form-item label="选择地图" name="mapId" :rules="[{ required: true, message: '请选择地图' }]">
          <a-select v-model:value="form.mapId" placeholder="请选择地图" style="width: 100%">
            <a-select-option v-for="map in inspectionMaps" :key="map.id" :value="map.id">
              {{ map.name }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-divider>选择途径点</a-divider>

        <a-form-item label="途径点">
          <a-transfer
            v-model:value="form.waypointIds"
            :data-source="waypointOptions"
            :titles="['可选途径点', '已选途径点']"
            :show-search="true"
            filter-option
            :row-key="(record: any) => record.key"
          >
            <template #item="{ item }">
              <span>{{ item.title }}</span>
            </template>
          </a-transfer>
        </a-form-item>

        <a-divider>选择巡检点</a-divider>

        <a-form-item label="巡检点">
          <a-transfer
            v-model:value="form.inspectionPointIds"
            :data-source="inspectionPointOptions"
            :titles="['可选巡检点', '已选巡检点']"
            :show-search="true"
            filter-option
            :row-key="(record: any) => record.key"
          >
            <template #item="{ item }">
              <span>{{ item.title }}</span>
            </template>
          </a-transfer>
        </a-form-item>

        <a-form-item>
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
import type { InspectionRoute, InspectionMap, Waypoint, InspectionPoint } from '@/types/inspection'
import { message } from 'ant-design-vue'

const router = useRouter()
const route = useRoute()
const inspectionStore = useInspectionStore()

const saving = ref(false)
const isEdit = computed(() => !!route.params.id)
const inspectionMaps = ref<InspectionMap[]>([])
const waypoints = ref<Waypoint[]>([])
const inspectionPoints = ref<InspectionPoint[]>([])

const form = reactive<Partial<InspectionRoute>>({
  name: '',
  code: '',
  description: '',
  mapId: undefined,
  waypointIds: [],
  inspectionPointIds: []
})

const waypointOptions = computed(() => {
  return waypoints.value.map(wp => ({
    key: wp.id,
    title: wp.name,
    description: wp.description
  }))
})

const inspectionPointOptions = computed(() => {
  return inspectionPoints.value.map(ip => ({
    key: ip.id,
    title: ip.name,
    description: ip.description
  }))
})

function goBack() {
  router.push('/management/inspection/route')
}

async function handleSave() {
  if (!form.name || !form.code || !form.mapId) {
    message.error('请填写必填项')
    return
  }

  saving.value = true
  try {
    const routeData: InspectionRoute = {
      id: isEdit.value ? route.params.id as string : `route-${Date.now()}`,
      name: form.name!,
      code: form.code!,
      description: form.description || '',
      mapId: form.mapId!,
      waypointIds: form.waypointIds || [],
      inspectionPointIds: form.inspectionPointIds || [],
      createdAt: isEdit.value ? new Date() : new Date(),
      updatedAt: new Date()
    }

    inspectionStore.saveInspectionRoute(routeData)
    message.success(isEdit.value ? '更新成功' : '创建成功')
    goBack()
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  inspectionStore.initialize()
  inspectionMaps.value = inspectionStore.inspectionMaps
  waypoints.value = inspectionStore.waypoints
  inspectionPoints.value = inspectionStore.inspectionPoints
  
  if (isEdit.value) {
    const routeData = inspectionStore.getInspectionRouteById(route.params.id as string)
    if (routeData) {
      Object.assign(form, routeData)
    }
  }
})
</script>

<style scoped lang="scss">
.inspection-route-form {
  width: 100%;
}
</style>
