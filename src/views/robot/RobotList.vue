<template>
  <div class="robot-list">
    <div class="page-header">
      <h2>机器人管理</h2>
      <a-space>
        <a-button type="primary" @click="handleAdd">
          <template #icon>
            <PlusOutlined />
          </template>
          新增机器人
        </a-button>
        <a-button @click="handleImport">
          <template #icon>
            <UploadOutlined />
          </template>
          导入数据
        </a-button>
      </a-space>
    </div>
    
    <a-card style="margin-top: 16px">
      <div class="search-panel">
        <a-form layout="vertical" :model="searchForm" @submit.prevent>
          <a-row :gutter="[16, 8]">
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="序号" class="search-item">
                <a-input-number v-model:value="searchForm.index" :min="1" style="width: 100%" placeholder="请输入序号" />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="机器人名称" class="search-item">
                <a-input v-model:value="searchForm.name" placeholder="请输入机器人名称" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="序列号" class="search-item">
                <a-input v-model:value="searchForm.serialNumber" placeholder="请输入序列号" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="型号" class="search-item">
                <a-input v-model:value="searchForm.model" placeholder="请输入型号" allow-clear />
              </a-form-item>
            </a-col>
            <a-col :xs="24" :sm="12" :md="8" :lg="6">
              <a-form-item label="状态" class="search-item">
                <a-select v-model:value="searchForm.status" placeholder="请选择状态" allow-clear>
                  <a-select-option value="online">在线</a-select-option>
                  <a-select-option value="offline">离线</a-select-option>
                  <a-select-option value="charging">充电中</a-select-option>
                  <a-select-option value="patrolling">巡检中</a-select-option>
                  <a-select-option value="error">故障</a-select-option>
                  <a-select-option value="paused">暂停</a-select-option>
                  <a-select-option value="returning">返航</a-select-option>
                </a-select>
              </a-form-item>
            </a-col>
          </a-row>
          <div class="search-actions">
            <a-space>
              <a-button type="primary" @click="handleSearch">搜索</a-button>
              <a-button @click="handleReset">重置</a-button>
            </a-space>
          </div>
        </a-form>
      </div>
      <a-table :data-source="filteredRobots" row-key="id" :loading="loading">
        <a-table-column title="序号" data-index="index" width="80px">
          <template #default="{ index }">
            {{ index + 1 }}
          </template>
        </a-table-column>
        <a-table-column title="型号" data-index="model" width="120px" />
        <a-table-column title="机器人名称" data-index="name" />
        <a-table-column title="序列号" data-index="serialNumber" />
        <a-table-column title="状态" data-index="status" width="120px">
          <template #default="{ record }">
            <a-tag :color="getStatusColor(record.status)">{{ getStatusText(record.status) }}</a-tag>
          </template>
        </a-table-column>
        <a-table-column title="续航" width="100px">
          <template #default="{ record }">
            {{ getEnduranceText(record) }}
          </template>
        </a-table-column>
        <a-table-column title="总里程" width="110px">
          <template #default="{ record }">
            {{ getTotalMileage(record) }} km
          </template>
        </a-table-column>
        <a-table-column title="电量" data-index="batteryLevel" width="100px">
          <template #default="{ record }">
            <a-progress 
              :percent="record.batteryLevel" 
              :status="getBatteryStatus(record.batteryLevel)"
              size="small"
            />
          </template>
        </a-table-column>
        <a-table-column title="操作" width="280px" fixed="right">
          <template #default="{ record }">
            <a-space size="small">
              <a-button type="link" @click="handleView(record.id)">
                详情
              </a-button>
              <a-button type="link" @click="handleEdit(record.id)">
                编辑
              </a-button>
              <a-button type="link" @click="handleMigrate(record.id)">
                迁移
              </a-button>
              <a-button type="link" danger @click="handleDelete(record.id)">
                删除
              </a-button>
            </a-space>
          </template>
        </a-table-column>
      </a-table>
    </a-card>

    <!-- 迁移模态框 -->
    <a-modal
      v-model:open="migrateModalVisible"
      title="机器人数据迁移"
      width="600px"
      @ok="handleMigrateConfirm"
      @cancel="handleMigrateCancel"
    >
      <a-form :model="migrateForm" layout="vertical">
        <a-form-item label="源机器人">
          <a-input v-model:value="migrateForm.sourceRobotName" disabled />
        </a-form-item>
        
        <a-form-item label="迁移方式" required>
          <a-radio-group v-model:value="migrateForm.migrateType">
            <a-radio value="direct">直接迁移到其他机器人</a-radio>
            <a-radio value="export">导出为迁移包</a-radio>
          </a-radio-group>
        </a-form-item>

        <!-- 直接迁移到其他机器人 -->
        <a-form-item v-if="migrateForm.migrateType === 'direct'" label="目标机器人" required>
          <a-select v-model:value="migrateForm.targetRobotId" placeholder="请选择目标机器人">
            <a-select-option 
              v-for="robot in availableRobots" 
              :key="robot.id" 
              :value="robot.id"
            >
              {{ robot.name }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item v-if="migrateForm.migrateType === 'direct'" label="同名计划处理">
          <a-radio-group v-model:value="migrateForm.duplicatePlanHandling">
            <a-radio value="overwrite">覆盖同名计划</a-radio>
            <a-radio value="keep">保留同名计划</a-radio>
          </a-radio-group>
        </a-form-item>

        <!-- 导出为迁移包 -->
        <a-form-item v-if="migrateForm.migrateType === 'export'" label="导出内容">
          <a-checkbox-group v-model:value="migrateForm.exportContent">
            <a-checkbox value="plans">计划</a-checkbox>
            <a-checkbox value="config">配置</a-checkbox>
            <a-checkbox value="data">历史数据</a-checkbox>
          </a-checkbox-group>
        </a-form-item>

        <!-- 导入迁移包 -->
        <a-form-item v-if="migrateForm.migrateType === 'import'" label="导入迁移包">
          <a-upload
            name="file"
            :show-upload-list="false"
            :before-upload="handleImportFile"
          >
            <a-button>
              <template #icon>
                <UploadOutlined />
              </template>
              选择文件
            </a-button>
          </a-upload>
          <div v-if="migrateForm.importFile" style="margin-top: 8px">
            <a-tag>{{ migrateForm.importFile.name }}</a-tag>
          </div>
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- 导入模态框 -->
    <a-modal
      v-model:open="importModalVisible"
      title="导入机器人数据"
      width="600px"
      @ok="handleImportConfirm"
      @cancel="handleImportCancel"
    >
      <a-form :model="importForm" layout="vertical">
        <a-form-item label="目标机器人" required>
          <a-select v-model:value="importForm.targetRobotId" placeholder="请选择目标机器人">
            <a-select-option 
              v-for="robot in robots" 
              :key="robot.id" 
              :value="robot.id"
            >
              {{ robot.name }}
            </a-select-option>
          </a-select>
        </a-form-item>

        <a-form-item label="迁移包文件" required>
          <a-upload
            name="file"
            :show-upload-list="false"
            :before-upload="handleImportFile"
          >
            <a-button>
              <template #icon>
                <UploadOutlined />
              </template>
              选择文件
            </a-button>
          </a-upload>
          <div v-if="importForm.importFile" style="margin-top: 8px">
            <a-tag>{{ importForm.importFile.name }}</a-tag>
          </div>
        </a-form-item>

        <a-form-item label="导入选项">
          <a-checkbox-group v-model:value="importForm.importOptions">
            <a-checkbox value="overwrite">覆盖现有数据</a-checkbox>
            <a-checkbox value="merge">合并数据</a-checkbox>
          </a-checkbox-group>
        </a-form-item>
      </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed, ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { message, Modal } from 'ant-design-vue'
import { PlusOutlined, UploadOutlined } from '@ant-design/icons-vue'
import { useRobotStore } from '@/stores/robot'
import { useInspectionStore } from '@/stores/inspection'
import { RobotStatus } from '@/types'

const router = useRouter()
const robotStore = useRobotStore()
const inspectionStore = useInspectionStore()

const robots = computed(() => robotStore.robots)
const loading = computed(() => robotStore.loading)

// 迁移相关状态
const migrateModalVisible = ref(false)
const importModalVisible = ref(false)
const sourceRobotId = ref('')

const migrateForm = reactive({
  sourceRobotName: '',
  migrateType: 'direct',
  targetRobotId: '',
  duplicatePlanHandling: 'overwrite',
  exportContent: ['plans', 'config'],
  importFile: null as File | null
})

const importForm = reactive({
  targetRobotId: '',
  importFile: null as File | null,
  importOptions: ['merge']
})

// 搜索表单
const searchForm = reactive({
  index: undefined as number | undefined,
  name: '',
  serialNumber: '',
  model: '',
  status: ''
})

// 可用的目标机器人（排除源机器人）
const availableRobots = computed(() => {
  return robots.value.filter(robot => robot.id !== sourceRobotId.value)
})

// 过滤后的机器人列表
const filteredRobots = computed(() => {
  const index = searchForm.index
  const name = searchForm.name.trim().toLowerCase()
  const serial = searchForm.serialNumber.trim().toLowerCase()
  const model = searchForm.model.trim().toLowerCase()
  const status = searchForm.status
  return robots.value.filter((robot, idx) => {
    const matchesIndex = index === undefined || idx + 1 === index
    const matchesName = !name || robot.name.toLowerCase().includes(name)
    const matchesSerial = !serial || robot.serialNumber.toLowerCase().includes(serial)
    const matchesModel = !model || robot.model.toLowerCase().includes(model)
    const matchesStatus = !status || robot.status === status
    return matchesIndex && matchesName && matchesSerial && matchesModel && matchesStatus
  })
})

// 处理搜索
const handleSearch = () => {
}

// 处理重置
const handleReset = () => {
  searchForm.index = undefined
  searchForm.name = ''
  searchForm.serialNumber = ''
  searchForm.model = ''
  searchForm.status = ''
}

onMounted(() => {
  robotStore.initialize()
  robotStore.fetchAllRobots()
  inspectionStore.initialize()
})

const getStatusColor = (status: RobotStatus): string => {
  switch (status) {
    case RobotStatus.ONLINE:
      return 'green'
    case RobotStatus.CHARGING:
      return 'blue'
    case RobotStatus.PATROLLING:
      return 'orange'
    case RobotStatus.ERROR:
      return 'red'
    default:
      return 'default'
  }
}

const getStatusText = (status: RobotStatus): string => {
  switch (status) {
    case RobotStatus.ONLINE:
      return '在线'
    case RobotStatus.OFFLINE:
      return '离线'
    case RobotStatus.CHARGING:
      return '充电中'
    case RobotStatus.PATROLLING:
      return '巡检中'
    case RobotStatus.ERROR:
      return '异常'
    case RobotStatus.PAUSED:
      return '暂停'
    case RobotStatus.RETURNING:
      return '返回中'
    default:
      return status
  }
}

const getBatteryStatus = (level: number): 'success' | 'warning' | 'exception' | undefined => {
  if (level < 10) return 'exception'
  if (level < 20) return 'warning'
  return 'success'
}

const getTotalMileage = (robot: any): number => {
  const seed = robot.id.split('').reduce((acc: number, c: string) => acc + c.charCodeAt(0), 0)
  return 500 + (seed % 1200)
}

const getEnduranceText = (robot: any): string => {
  const hours = Math.max(1, Math.round((robot.batteryLevel / 100) * 10))
  return `${hours} 小时`
}

const handleAdd = () => {
  router.push('/implementation/robot/form')
}

const handleView = (id: string) => {
  router.push(`/implementation/robot/simulation?robotId=${id}`)
}

const handleEdit = (id: string) => {
  router.push(`/implementation/robot/form/${id}`)
}

const handleDelete = (id: string) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除该机器人吗？',
    onOk: () => {
      robotStore.deleteRobot(id)
      message.success('删除成功')
    }
  })
}

// 打开迁移模态框
const handleMigrate = (id: string) => {
  sourceRobotId.value = id
  const sourceRobot = robotStore.getRobotById(id)
  if (sourceRobot) {
    migrateForm.sourceRobotName = sourceRobot.name
    migrateForm.targetRobotId = ''
    migrateForm.importFile = null
    migrateModalVisible.value = true
  }
}

// 关闭迁移模态框
const handleMigrateCancel = () => {
  migrateModalVisible.value = false
  resetMigrateForm()
}

// 重置迁移表单
const resetMigrateForm = () => {
  migrateForm.sourceRobotName = ''
  migrateForm.migrateType = 'direct'
  migrateForm.targetRobotId = ''
  migrateForm.duplicatePlanHandling = 'overwrite'
  migrateForm.exportContent = ['plans', 'config']
  migrateForm.importFile = null
}

// 处理迁移确认
const handleMigrateConfirm = () => {
  if (migrateForm.migrateType === 'direct') {
    if (!migrateForm.targetRobotId) {
      message.error('请选择目标机器人')
      return
    }
    handleDirectMigrate()
  } else if (migrateForm.migrateType === 'export') {
    handleExportMigrate()
  }
  migrateModalVisible.value = false
  resetMigrateForm()
}

// 直接迁移到其他机器人
const handleDirectMigrate = () => {
  const sourceRobot = robotStore.getRobotById(sourceRobotId.value)
  const targetRobot = robotStore.getRobotById(migrateForm.targetRobotId)
  
  if (sourceRobot && targetRobot) {
    // 迁移计划
    const plans = inspectionStore.inspectionPlans.filter(plan => plan.robotId === sourceRobotId.value)
    const targetPlans = inspectionStore.inspectionPlans.filter(plan => plan.robotId === migrateForm.targetRobotId)
    const targetPlanNames = new Set(targetPlans.map(plan => plan.name))
    let migratedCount = 0
    let skippedCount = 0
    
    plans.forEach(plan => {
      let planToSave = { ...plan }
      planToSave.robotId = migrateForm.targetRobotId
      
      if (targetPlanNames.has(plan.name)) {
        switch (migrateForm.duplicatePlanHandling) {
          case 'overwrite':
            // 覆盖同名计划
            const existingPlan = targetPlans.find(p => p.name === plan.name)
            if (existingPlan) {
              planToSave.id = existingPlan.id
            }
            inspectionStore.saveInspectionPlan(planToSave)
            migratedCount++
            break
          case 'keep':
            // 保留同名计划，跳过迁移
            skippedCount++
            break
        }
      } else {
        // 无同名计划，直接迁移
        inspectionStore.saveInspectionPlan(planToSave)
        migratedCount++
      }
    })
    
    let messageText = `成功将 ${sourceRobot.name} 的 ${migratedCount} 个计划迁移到 ${targetRobot.name}`
    if (skippedCount > 0) {
      messageText += `，跳过了 ${skippedCount} 个同名计划`
    }
    message.success(messageText)
  }
}

// 导出为迁移包
const handleExportMigrate = () => {
  const sourceRobot = robotStore.getRobotById(sourceRobotId.value)
  if (sourceRobot) {
    const exportData = {
      robotId: sourceRobot.id,
      robotName: sourceRobot.name,
      exportTime: new Date().toISOString(),
      content: migrateForm.exportContent,
      data: {
        config: migrateForm.exportContent.includes('config') ? {
          batteryThreshold: sourceRobot.batteryThreshold,
          connectionConfig: sourceRobot.connectionConfig,
          exceptionStrategy: sourceRobot.exceptionStrategy
        } : {},
        plans: migrateForm.exportContent.includes('plans') ? 
          inspectionStore.inspectionPlans.filter(plan => plan.robotId === sourceRobot.id) : [],
        data: migrateForm.exportContent.includes('data') ? 
          inspectionStore.getTaskResultsByRobotId(sourceRobot.id) : []
      }
    }
    
    // 创建下载链接
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `robot-migrate-${sourceRobot.name}-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    message.success('迁移包导出成功')
  }
}

// 处理导入文件
const handleImportFile = (file: File) => {
  if (file.type !== 'application/json') {
    message.error('请上传 JSON 文件')
    return false
  }
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const content = e.target?.result as string
      JSON.parse(content) // 验证文件格式
      if (migrateModalVisible.value) {
        migrateForm.importFile = file
      } else if (importModalVisible.value) {
        importForm.importFile = file
      }
      message.success('文件上传成功')
    } catch (error) {
      message.error('文件格式错误')
    }
  }
  reader.readAsText(file)
  return false
}

// 打开导入模态框
const handleImport = () => {
  importForm.targetRobotId = ''
  importForm.importFile = null
  importForm.importOptions = ['merge']
  importModalVisible.value = true
}

// 关闭导入模态框
const handleImportCancel = () => {
  importModalVisible.value = false
  resetImportForm()
}

// 重置导入表单
const resetImportForm = () => {
  importForm.targetRobotId = ''
  importForm.importFile = null
  importForm.importOptions = ['merge']
}

// 处理导入确认
const handleImportConfirm = () => {
  if (!importForm.targetRobotId) {
    message.error('请选择目标机器人')
    return
  }
  if (!importForm.importFile) {
    message.error('请选择迁移包文件')
    return
  }
  
  handleImportData()
  importModalVisible.value = false
  resetImportForm()
}

// 处理导入数据
const handleImportData = () => {
  if (importForm.importFile) {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string
        const importData = JSON.parse(content)
        const targetRobot = robotStore.getRobotById(importForm.targetRobotId)
        
        if (targetRobot) {
          // 导入配置
          if (importData.content.includes('config') && importData.data.config) {
            targetRobot.batteryThreshold = importData.data.config.batteryThreshold
            targetRobot.connectionConfig = importData.data.config.connectionConfig
            targetRobot.exceptionStrategy = importData.data.config.exceptionStrategy
            robotStore.saveRobot(targetRobot)
          }
          
          // 导入计划
          if (importData.content.includes('plans') && importData.data.plans) {
            importData.data.plans.forEach((plan: any) => {
              plan.robotId = importForm.targetRobotId
              inspectionStore.saveInspectionPlan(plan)
            })
          }
          
          message.success(`成功导入数据到 ${targetRobot.name}`)
        }
      } catch (error) {
        message.error('导入失败：文件格式错误')
      }
    }
    reader.readAsText(importForm.importFile)
  }
}
</script>

<style scoped lang="css">.robot-list :deep(.ant-card) {
  border-radius: 10px;
  border-color: #f0f0f0;
  box-shadow: none;
}
.robot-list :deep(.ant-card-body) {
  padding: 16px;
}
.robot-list .search-panel {
  margin-bottom: 12px;
  padding: 12px 12px 4px;
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  background: #fafafa;
}
.robot-list .search-item {
  margin-bottom: 8px;
}
.robot-list .search-actions {
  display: flex;
  justify-content: flex-end;
  margin: 4px 0 8px;
}
.robot-list :deep(.ant-table) {
  border: 1px solid #f0f0f0;
  border-radius: 8px;
  overflow: hidden;
}
.robot-list :deep(.ant-table-thead > tr > th) {
  background: #fafafa;
  font-weight: 600;
  white-space: nowrap;
}
.robot-list :deep(.ant-table-tbody > tr > td) {
  vertical-align: middle;
}
.robot-list .page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.robot-list .page-header h2 {
  margin: 0;
  font-size: 20px;
}
@media (max-width: 992px) {
  .robot-list :deep(.ant-card-body) {
    padding: 12px;
  }
  .robot-list .page-header {
    gap: 12px;
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
