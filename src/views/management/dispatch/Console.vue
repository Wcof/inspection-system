<template>
  <div class="console-page">
    <div v-if="!hasRobots" class="empty-state">
      <a-empty description="暂无可用机器人，请先在机器人管理中添加">
        <a-button type="primary" @click="$router.push('/implementation/robot/list')">
          前往机器人管理
        </a-button>
      </a-empty>
    </div>

    <template v-else>
      <div class="console-header">
        <div class="console-brand">
          <span class="brand-radar"></span>
          <span class="brand-text">机器人调度控制台</span>
        </div>

        <div class="console-time-status">
          <span class="status-indicator online"></span>
          <span class="status-text">系统正常</span>
          <span class="divider">|</span>
          <span class="time-text">{{ formattedTime }}</span>
          <span class="divider">|</span>
          <a-button size="small" type="link" style="color: #1677ff" @click="openAIChat">
            <RobotOutlined /> AI 智库
          </a-button>
        </div>
      </div>

      <!-- 监控模式：无操控区域 -->
      <ControlPanel
        v-if="activeTab === 'monitor'"
        :showControlPad="false"
        :activeTab="activeTab"
        @update:activeTab="activeTab = $event"
      />

      <!-- 操控模式：桌面端操控区域 -->
      <ControlPanel
        v-else-if="activeTab === 'control'"
        :showControlPad="true"
        controlPadType="desktop"
        :activeTab="activeTab"
        @update:activeTab="activeTab = $event"
      />

      <!-- 配置模式：显示配置图片 -->
      <div v-else-if="activeTab === 'config'" class="config-view">
        <div class="config-header">
          <div class="console-brand">
            <span class="brand-radar"></span>
            <span class="brand-text">机器人调度控制台</span>
          </div>
          <div class="config-tabs">
            <button
              v-for="tab in tabs"
              :key="tab.key"
              class="console-tab"
              :class="{ active: activeTab === tab.key }"
              @click="activeTab = tab.key"
            >
              {{ tab.label }}
            </button>
          </div>
          <div class="console-time-status">
            <span class="status-indicator online"></span>
            <span class="status-text">系统正常</span>
            <span class="divider">|</span>
            <span class="time-text">{{ formattedTime }}</span>
            <span class="divider">|</span>
            <a-button size="small" type="link" style="color: #1677ff" @click="openAIChat">
              <RobotOutlined /> AI 智库
            </a-button>
          </div>
        </div>
        <div class="config-content">
          <img :src="configImage" alt="配置" class="config-image" />
        </div>
      </div>

      <!-- IPAD 模式：移动端操控区域（原有行为） -->
      <ControlPanel
        v-else-if="activeTab === 'ipad'"
        :showControlPad="true"
        controlPadType="mobile"
        :activeTab="activeTab"
        @update:activeTab="activeTab = $event"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { MockService } from '@/mock/mockService'
import { RobotOutlined } from '@ant-design/icons-vue'
import ControlPanel from './console/ControlPanel.vue'
import configImage from '@/pz.png'

const router = useRouter()

// Tab 定义
type TabKey = 'monitor' | 'control' | 'config' | 'ipad'

const tabs: { key: TabKey; label: string }[] = [
  { key: 'monitor', label: '监控' },
  { key: 'control', label: '操控' },
  { key: 'config', label: '配置' },
  { key: 'ipad', label: 'IPAD' },
]

const activeTab = ref<TabKey>('monitor')

const currentTime = ref(new Date())
let timer: ReturnType<typeof setInterval> | null = null

const formattedTime = ref('')

const robots = ref(MockService.getRobots())
const hasRobots = computed(() => robots.value.length > 0)

function updateTime() {
  currentTime.value = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  const y = currentTime.value.getFullYear()
  const m = pad(currentTime.value.getMonth() + 1)
  const d = pad(currentTime.value.getDate())
  const hh = pad(currentTime.value.getHours())
  const mm = pad(currentTime.value.getMinutes())
  const ss = pad(currentTime.value.getSeconds())
  formattedTime.value = `${y}-${m}-${d} ${hh}:${mm}:${ss}`
}

onMounted(() => {
  updateTime()
  timer = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

function openAIChat() {
  const session = MockService.saveAIChatSession({
    title: `控制台对话-${new Date().toLocaleString('zh-CN', { hour12: false })}`,
    carrier: { device: 'robot', time: new Date().toISOString() }
  })
  router.push(`/implementation/ai/chat#session-${session.id}`)
}
</script>

<style scoped lang="less">
.console-page {
  height: calc(100vh - 64px);
  margin: -24px;
  padding: 0;
  display: flex;
  flex-direction: column;
  background: radial-gradient(circle at 50% 50%, #0d1224 0%, #04060f 100%);
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, monospace;
}

.console-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: rgba(10, 16, 35, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 212, 255, 0.15);
  height: 52px;
}

.config-view {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  background-color: #04060f;
}

.config-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  background: rgba(10, 16, 35, 0.85);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 212, 255, 0.15);
  height: 52px;
}

.config-tabs {
  display: flex;
  gap: 4px;
  padding: 4px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
  border: 1px solid rgba(0, 212, 255, 0.1);
}

.console-tab {
  display: flex;
  align-items: center;
  padding: 6px 16px;
  border: 1px solid transparent;
  border-radius: 6px;
  background: transparent;
  color: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  font-weight: 500;
  white-space: nowrap;

  &:hover {
    color: rgba(255, 255, 255, 0.8);
    background: rgba(0, 212, 255, 0.05);
  }

  &.active {
    color: #00d4ff;
    background: rgba(0, 212, 255, 0.1);
    border-color: rgba(0, 212, 255, 0.3);
    box-shadow: 0 0 12px rgba(0, 212, 255, 0.15);
  }
}

.config-content {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  overflow: auto;
}

.config-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.5);
}

.console-brand {
  display: flex;
  align-items: center;
  gap: 10px;
  user-select: none;

  .brand-radar {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background-color: #00d4ff;
    position: relative;
    box-shadow: 0 0 8px #00d4ff;

    &::after {
      content: '';
      position: absolute;
      inset: -6px;
      border: 1px solid #00d4ff;
      border-radius: 50%;
      animation: pulse-radar 2s infinite linear;
    }
  }

  .brand-text {
    font-size: 15px;
    font-weight: 800;
    letter-spacing: 1.5px;
    background: linear-gradient(90deg, #00d4ff, #0088ff);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-shadow: 0 0 15px rgba(0, 212, 255, 0.2);
  }
}

.console-time-status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.45);
  font-family: monospace;
  font-size: 12px;

  .status-indicator {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #52c41a;
    box-shadow: 0 0 6px #52c41a;

    &.online {
      animation: pulse-green 1.5s infinite alternate;
    }
  }

  .status-text {
    color: #52c41a;
    font-weight: bold;
    letter-spacing: 0.5px;
  }

  .divider {
    color: rgba(255, 255, 255, 0.15);
    margin: 0 4px;
  }

  .time-text {
    color: rgba(255, 255, 255, 0.6);
    letter-spacing: 0.5px;
  }
}

@keyframes pulse-radar {
  0% {
    transform: scale(0.6);
    opacity: 1;
  }
  100% {
    transform: scale(2.2);
    opacity: 0;
  }
}

@keyframes pulse-green {
  0% {
    opacity: 0.4;
    box-shadow: 0 0 2px #52c41a;
  }
  100% {
    opacity: 1;
    box-shadow: 0 0 8px #52c41a;
  }
}
</style>

<style lang="less">
.ant-image-preview-root,
.ant-image-preview-wrap,
.ant-modal-wrap.ant-image-preview-wrap {
  display: none !important;
  pointer-events: none !important;
}

.ant-modal-wrap.hud-modal {
  display: flex !important;
  pointer-events: auto !important;
}
</style>
