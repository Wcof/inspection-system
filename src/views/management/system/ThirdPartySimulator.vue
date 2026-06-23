<template>
  <div class="third-party-simulator">
    <a-card title="第三方系统模拟" :bordered="false">
      <a-row :gutter="16">
        <a-col :span="12">
          <a-card title="作业票系统" size="small" style="margin-bottom: 16px">
            <a-button type="primary" block @click="pushWorkTicket">
              推送作业票
            </a-button>
            <p v-if="lastTicket" style="margin-top: 12px; color: #52c41a">
              已推送作业票: {{ lastTicket.title }}
            </p>
          </a-card>
        </a-col>
        <a-col :span="12">
          <a-card title="人员识别系统" size="small" style="margin-bottom: 16px">
            <a-button type="primary" block @click="pushPersonnelRecognition">
              推送现场人员识别结果
            </a-button>
            <p v-if="lastRecognition" style="margin-top: 12px; color: #52c41a">
              已推送识别: {{ lastRecognition.personnel?.join(', ') }}
            </p>
          </a-card>
        </a-col>
      </a-row>
      <a-card title="事件日志" size="small">
        <a-list :data-source="logs" size="small">
          <template #renderItem="{ item }">
            <a-list-item>{{ item }}</a-list-item>
          </template>
          <template v-if="logs.length === 0">
            <a-empty description="暂无事件" />
          </template>
        </a-list>
      </a-card>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { MockService } from '@/mock/mockService'

const logs = ref<string[]>([])
const lastTicket = ref<{ title: string } | null>(null)
const lastRecognition = ref<{ personnel: string[] } | null>(null)

function pushWorkTicket() {
  const ticket = {
    id: `wt-${Date.now()}`,
    title: '检修作业票',
    areaId: 'area-1',
    allowedPersonnel: ['张三', '李四', '王五'],
    startTime: new Date().toLocaleTimeString(),
    endTime: new Date(Date.now() + 8 * 3600000).toLocaleTimeString()
  }
  MockService.saveWorkTicket(ticket)
  lastTicket.value = ticket
  logs.value.unshift(`[${new Date().toLocaleTimeString()}] 推送作业票: ${ticket.title} (允许人员: ${ticket.allowedPersonnel.join(', ')})`)
}

function pushPersonnelRecognition() {
  const personnel = ['张三', '赵六']
  lastRecognition.value = { personnel }
  logs.value.unshift(`[${new Date().toLocaleTimeString()}] 现场识别: ${personnel.join(', ')}`)
}
</script>
