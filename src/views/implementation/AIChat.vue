<template>
  <div class="ai-chat-page">
    <a-page-header title="AI 智库问答" sub-title="行走的安全生产知识库，支持文字输入 mock 语音交互">
      <template #extra>
        <a-button type="primary" @click="handleNewSession">
          <PlusOutlined /> 新建会话
        </a-button>
      </template>
    </a-page-header>

    <a-row :gutter="16" style="margin-top: 16px; height: calc(100vh - 200px)">
      <!-- 左侧会话列表 -->
      <a-col :span="6">
        <a-card style="height: 100%; overflow-y: auto">
          <template #title>
            <a-space>
              <MessageOutlined /> 会话列表
              <a-badge :count="sessions.length" :overflow-count="99" />
            </a-space>
          </template>
          <a-list :data-source="sessions" size="small">
            <template #renderItem="{ item }">
              <a-list-item
                :class="{ 'selected-session': currentSessionId === item.id }"
                style="cursor: pointer; padding: 8px 12px"
                @click="selectSession(item.id)"
              >
                <a-list-item-meta>
                  <template #title>
                    <a-space>
                      <span>{{ item.title }}</span>
                      <a-tag v-if="item.carrier?.device === 'robot'" color="blue" size="small">机器人</a-tag>
                      <a-tag v-else size="small">电脑</a-tag>
                    </a-space>
                  </template>
                  <template #description>
                    <span style="font-size: 12px">{{ formatDate(item.createdAt) }}</span>
                  </template>
                </a-list-item-meta>
                <template #actions>
                  <a-popconfirm title="删除此会话？" @confirm="deleteSession(item.id)">
                    <a-button type="link" size="small" danger>
                      <DeleteOutlined />
                    </a-button>
                  </a-popconfirm>
                </template>
              </a-list-item>
            </template>
            <template #emptyText>
              <a-empty description="暂无会话，点击上方新建" />
            </template>
          </a-list>
        </a-card>
      </a-col>

      <!-- 右侧对话内容 -->
      <a-col :span="18">
        <a-card style="height: 100%; display: flex; flex-direction: column">
          <template #title>
            <a-space>
              <RobotOutlined /> {{ currentSession?.title || 'AI 智库对话' }}
              <a-tag v-if="currentSession?.carrier?.robotId" color="blue">
                载体: {{ currentSession.carrier.device === 'robot' ? '机器人' : '电脑' }}
                {{ currentSession.carrier.robotId ? '-' + currentSession.carrier.robotId : '' }}
              </a-tag>
            </a-space>
          </template>

          <!-- 消息列表 -->
          <div ref="messageContainer" class="message-container">
            <div v-if="!currentSessionId" class="chat-welcome">
              <RobotOutlined style="font-size: 64px; color: #1677ff" />
              <h3>AI 智库问答</h3>
              <p>输入你想要的安全生产相关问题，AI 将基于知识库进行解答</p>
            </div>

            <div v-for="msg in messages" :key="msg.id" class="message-item" :class="msg.role">
              <a-avatar :icon="msg.role === 'assistant' ? h(RobotOutlined) : h(UserOutlined)"
                        :style="msg.role === 'assistant' ? { background: '#1677ff' } : { background: '#52c41a' }" />
              <div class="message-content">
                <div class="message-text" style="white-space: pre-wrap">{{ msg.content }}</div>
                <div v-if="msg.references?.length" class="message-references">
                  <a-tag v-for="ref in msg.references" :key="ref" color="blue" size="small">
                    <FileTextOutlined /> {{ ref }}
                  </a-tag>
                </div>
                <div class="message-time">{{ formatDate(msg.createdAt) }}</div>
              </div>
            </div>
          </div>

          <!-- 输入区域 -->
          <div class="chat-input-area">
            <a-input-search
              v-model:value="inputText"
              placeholder="输入安全生产相关问题..."
              enter-button="发送"
              size="large"
              @search="sendMessage"
              :disabled="!currentSessionId"
            />
          </div>
        </a-card>
      </a-col>
    </a-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, h } from 'vue'
import { message } from 'ant-design-vue'
import {
  PlusOutlined, DeleteOutlined, MessageOutlined,
  RobotOutlined, UserOutlined, FileTextOutlined
} from '@ant-design/icons-vue'
import { MockService } from '@/mock/mockService'
import type { ChatSession, ChatMessage } from '@/types/ai'

const sessions = ref<ChatSession[]>([])
const messages = ref<ChatMessage[]>([])
const currentSessionId = ref('')
const inputText = ref('')
const messageContainer = ref<HTMLElement | null>(null)

const currentSession = computed(() => sessions.value.find(s => s.id === currentSessionId.value))

onMounted(() => {
  loadSessions()
})

function loadSessions() {
  sessions.value = MockService.getAIChatSessions().map((s: any) => ({
    ...s,
    carrier: s.carrier || { device: 'computer', time: new Date().toISOString() }
  }))
}

function formatDate(value: string) {
  return new Date(value).toLocaleString('zh-CN', { hour12: false })
}

function selectSession(id: string) {
  currentSessionId.value = id
  loadMessages(id)
}

function loadMessages(sessionId: string) {
  messages.value = MockService.getAIChatMessages(sessionId).map((m: any) => ({
    ...m,
    role: m.role as 'user' | 'assistant'
  }))
  scrollToBottom()
}

function handleNewSession() {
  const name = `新对话-${sessions.value.length + 1}`
  const session = MockService.saveAIChatSession({
    title: name,
    carrier: { device: 'computer', time: new Date().toISOString() },
    messageCount: 0
  })
  loadSessions()
  currentSessionId.value = session.id
  messages.value = []
  inputText.value = ''
  message.success('已创建新会话')
}

async function sendMessage() {
  const text = inputText.value.trim()
  if (!text || !currentSessionId.value) return

  // 保存用户消息
  MockService.saveAIChatMessage({
    sessionId: currentSessionId.value,
    role: 'user',
    content: text,
    createdAt: new Date().toISOString()
  })

  inputText.value = ''
  loadMessages(currentSessionId.value)

  // Mock AI 回复（模拟延迟）
  await new Promise(resolve => setTimeout(resolve, 800))
  const reply = mockAIResponse(text)
  MockService.saveAIChatMessage({
    sessionId: currentSessionId.value,
    role: 'assistant',
    content: reply.content,
    references: reply.references,
    createdAt: new Date().toISOString()
  })

  loadMessages(currentSessionId.value)
  updateSessionMessageCount()
}

function mockAIResponse(query: string): { content: string; references?: string[] } {
  const queryLower = query.toLowerCase()
  if (queryLower.includes('温度') || queryLower.includes('温升')) {
    return {
      content: '根据《设备巡检温度监测规程》第3.2条：\n\n1. 正常设备表面温升≤30K（环境温度≤40℃时）\n2. 预警阈值：温升>30K 且 ≤50K\n3. 告警阈值：温升>50K\n\n建议定期对高温区域进行红外热成像扫描。',
      references: ['设备巡检温度监测规程.pdf', '红外热成像检测标准V2.1']
    }
  }
  if (queryLower.includes('气体') || queryLower.includes('泄露') || queryLower.includes('泄漏')) {
    return {
      content: '根据《危险化学品泄漏应急处置规程》：\n\n1. 泄漏检测阈值：CH4≥10ppm、H2S≥5ppm、VOC≥20ppm\n2. 发现泄漏立即启动三级响应：\n   - 一级（少量泄漏）：现场警示+通知巡检\n   - 二级（中等泄漏）：区域疏散+启动排风\n   - 三级（大量泄漏）：全厂疏散+启动应急方案\n\n当前厂区已部署5台气体检测机器人，覆盖率达92%。',
      references: ['危险化学品泄漏应急处置规程.pdf', '气体检测机器人部署方案.pdf']
    }
  }
  if (queryLower.includes('安全帽') || queryLower.includes('防护')) {
    return {
      content: '根据《厂区安全行为规范》：\n\n1. 进入生产区域必须佩戴安全帽、穿防护服\n2. 安全帽需在有效期内（生产日期后30个月）\n3. 违规行为一经识别，系统自动记录并通知安全员\n\n2026年6月已识别未佩戴安全帽行为12起，均已闭环整改。',
      references: ['厂区安全行为规范V3.0.pdf', '安全行为 AI 识别报告-6月.pdf']
    }
  }
  return {
    content: `已收到您的提问：「${query}」\n\n根据知识库检索，此问题涉及多个文档条目，建议查阅「安全生产综合管理规程」第5章获取详细说明。如需更精确的解答，请补充具体场景信息（设备类型、检\测指标等）。`,
    references: ['安全生产综合管理规程.pdf']
  }
}

function updateSessionMessageCount() {
  const msgs = MockService.getAIChatMessages(currentSessionId.value)
  const count = msgs.length
  MockService.saveAIChatSession({
    id: currentSessionId.value,
    messageCount: count,
    updatedAt: new Date().toISOString()
  })
  loadSessions()
}

function deleteSession(id: string) {
  MockService.deleteAIChatSession(id)
  if (currentSessionId.value === id) {
    currentSessionId.value = ''
    messages.value = []
  }
  loadSessions()
  message.success('会话已删除')
}

async function scrollToBottom() {
  await nextTick()
  if (messageContainer.value) {
    messageContainer.value.scrollTop = messageContainer.value.scrollHeight
  }
}
</script>

<style scoped>
.ai-chat-page {
  height: 100%;
}
.message-container {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  min-height: 400px;
}
.chat-welcome {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #999;
}
.chat-welcome h3 {
  margin-top: 16px;
  color: #333;
}
.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}
.message-item.assistant {
  flex-direction: row;
}
.message-item.user {
  flex-direction: row-reverse;
}
.message-content {
  max-width: 70%;
  background: #f5f5f5;
  padding: 10px 14px;
  border-radius: 8px;
}
.message-item.user .message-content {
  background: #1677ff;
  color: #fff;
}
.message-time {
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}
.message-item.user .message-time {
  color: rgba(255,255,255,0.7);
}
.message-references {
  margin-top: 8px;
}
.chat-input-area {
  padding: 12px 16px;
  border-top: 1px solid #f0f0f0;
}
.selected-session {
  background: #e6f4ff;
  border-radius: 4px;
}
</style>
