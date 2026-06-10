<template>
  <div class="camera-views" :class="'layout-' + layout">
    <!-- 工具栏 -->
    <div class="toolbar">
      <!-- 语音对话按钮 -->
      <button
        class="toolbar-btn"
        :class="{ active: voiceActive }"
        @click="toggleVoice"
        :title="voiceActive ? '结束语音' : '语音对话'"
      >
        <svg v-if="!voiceActive" class="toolbar-icon" viewBox="0 0 20 20">
          <path d="M10 2a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" stroke="currentColor" stroke-width="1.5" fill="none"/>
          <path d="M5 9a5 5 0 0 0 10 0" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          <line x1="10" y1="14" x2="10" y2="17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="7" y1="17" x2="13" y2="17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <svg v-else class="toolbar-icon voice-active-icon" viewBox="0 0 20 20">
          <path d="M10 2a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3z" fill="currentColor" opacity="0.9"/>
          <path d="M5 9a5 5 0 0 0 10 0" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/>
          <line x1="10" y1="14" x2="10" y2="17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <line x1="7" y1="17" x2="13" y2="17" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          <!-- 声波动画 -->
          <circle class="wave wave1" cx="10" cy="8" r="5" fill="none" stroke="currentColor" stroke-width="0.8"/>
          <circle class="wave wave2" cx="10" cy="8" r="7" fill="none" stroke="currentColor" stroke-width="0.6"/>
        </svg>
        <span class="toolbar-text">{{ voiceActive ? '结束语音' : '语音对话' }}</span>
      </button>

      <!-- 布局切换按钮 -->
      <div class="layout-switcher" ref="switcherRef">
        <button class="toolbar-btn" @click.stop="showMenu = !showMenu" title="画面布局">
          <svg viewBox="0 0 20 20" class="toolbar-icon">
            <rect v-if="layout === 'single'" x="2" y="2" width="16" height="16" rx="2" fill="currentColor" opacity="0.9"/>
            <rect v-else-if="layout !== 'pip'" x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.2" fill="none" opacity="0.5"/>
            <template v-if="layout === 'pip'">
              <rect x="2" y="2" width="16" height="16" rx="2" stroke="currentColor" stroke-width="1.2" fill="none" opacity="0.5"/>
              <rect x="10" y="10" width="7" height="7" rx="1" fill="currentColor" opacity="0.9"/>
            </template>
            <template v-if="layout === 'triple'">
              <rect x="2" y="2" width="4.5" height="16" rx="1" fill="currentColor" opacity="0.9"/>
              <rect x="7.75" y="2" width="4.5" height="16" rx="1" fill="currentColor" opacity="0.9"/>
              <rect x="13.5" y="2" width="4.5" height="16" rx="1" fill="currentColor" opacity="0.9"/>
            </template>
            <template v-if="layout === 'main-bottom'">
              <rect x="2" y="2" width="16" height="9" rx="1.5" fill="currentColor" opacity="0.9"/>
              <rect x="2" y="12.5" width="7.5" height="5.5" rx="1" fill="currentColor" opacity="0.7"/>
              <rect x="10.5" y="12.5" width="7.5" height="5.5" rx="1" fill="currentColor" opacity="0.7"/>
            </template>
            <template v-if="layout === 'main-right'">
              <rect x="2" y="2" width="9" height="16" rx="1.5" fill="currentColor" opacity="0.9"/>
              <rect x="12.5" y="2" width="5.5" height="7.5" rx="1" fill="currentColor" opacity="0.7"/>
              <rect x="12.5" y="10.5" width="5.5" height="7.5" rx="1" fill="currentColor" opacity="0.7"/>
            </template>
          </svg>
          <span class="toolbar-text">布局</span>
        </button>

        <!-- 下拉菜单 -->
        <Teleport to="body">
          <Transition name="menu-fade">
            <div v-if="showMenu" class="layout-menu" :style="menuPos" @click.stop>
              <button
                v-for="opt in layoutOptions"
                :key="opt.key"
                class="layout-option"
                :class="{ active: layout === opt.key }"
                @click="selectLayout(opt.key)"
              >
                <svg viewBox="0 0 40 28" class="option-preview">
                  <rect v-if="opt.key === 'single'" x="1" y="1" width="38" height="26" rx="2" :fill="layout === opt.key ? '#00d4ff' : 'rgba(255,255,255,0.3)'" :opacity="layout === opt.key ? 0.25 : 0.15"/>
                  <rect v-if="opt.key === 'single'" x="1" y="1" width="38" height="26" rx="2" :stroke="layout === opt.key ? '#00d4ff' : 'rgba(255,255,255,0.4)'" stroke-width="1" fill="none"/>
                  <template v-if="opt.key === 'pip'">
                    <rect x="1" y="1" width="38" height="26" rx="2" :stroke="layout === opt.key ? '#00d4ff' : 'rgba(255,255,255,0.4)'" stroke-width="1" fill="none"/>
                    <rect x="24" y="15" width="14" height="11" rx="1.5" :fill="layout === opt.key ? '#00d4ff' : 'rgba(255,255,255,0.3)'" :opacity="layout === opt.key ? 0.35 : 0.2"/>
                  </template>
                  <template v-if="opt.key === 'triple'">
                    <rect x="1" y="1" width="11.5" height="26" rx="1.5" :fill="layout === opt.key ? '#00d4ff' : 'rgba(255,255,255,0.3)'" :opacity="layout === opt.key ? 0.25 : 0.15"/>
                    <rect x="14.25" y="1" width="11.5" height="26" rx="1.5" :fill="layout === opt.key ? '#00d4ff' : 'rgba(255,255,255,0.3)'" :opacity="layout === opt.key ? 0.25 : 0.15"/>
                    <rect x="27.5" y="1" width="11.5" height="26" rx="1.5" :fill="layout === opt.key ? '#00d4ff' : 'rgba(255,255,255,0.3)'" :opacity="layout === opt.key ? 0.25 : 0.15"/>
                  </template>
                  <template v-if="opt.key === 'main-bottom'">
                    <rect x="1" y="1" width="38" height="15" rx="1.5" :fill="layout === opt.key ? '#00d4ff' : 'rgba(255,255,255,0.3)'" :opacity="layout === opt.key ? 0.25 : 0.15"/>
                    <rect x="1" y="18" width="18" height="9" rx="1.5" :fill="layout === opt.key ? '#00d4ff' : 'rgba(255,255,255,0.3)'" :opacity="layout === opt.key ? 0.2 : 0.12"/>
                    <rect x="21" y="18" width="18" height="9" rx="1.5" :fill="layout === opt.key ? '#00d4ff' : 'rgba(255,255,255,0.3)'" :opacity="layout === opt.key ? 0.2 : 0.12"/>
                  </template>
                  <template v-if="opt.key === 'main-right'">
                    <rect x="1" y="1" width="22" height="26" rx="1.5" :fill="layout === opt.key ? '#00d4ff' : 'rgba(255,255,255,0.3)'" :opacity="layout === opt.key ? 0.25 : 0.15"/>
                    <rect x="25" y="1" width="14" height="12" rx="1.5" :fill="layout === opt.key ? '#00d4ff' : 'rgba(255,255,255,0.3)'" :opacity="layout === opt.key ? 0.2 : 0.12"/>
                    <rect x="25" y="15" width="14" height="12" rx="1.5" :fill="layout === opt.key ? '#00d4ff' : 'rgba(255,255,255,0.3)'" :opacity="layout === opt.key ? 0.2 : 0.12"/>
                  </template>
                </svg>
                <span class="option-label">{{ opt.label }}</span>
                <svg v-if="layout === opt.key" class="option-check" viewBox="0 0 16 16"><path d="M3 8L6.5 11.5L13 4.5" stroke="#00d4ff" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </button>
            </div>
          </Transition>
        </Teleport>
      </div>
    </div>

    <!-- 缩略图列表（pip 模式） -->
    <template v-if="layout === 'pip'">
      <div
        v-for="item in thumbItems"
        :key="item.key"
        class="camera-thumb"
        @click="clickThumb(item.key)"
      >
        <img :src="item.img" :alt="item.label" />
        <div class="live-tag">
          <span class="live-dot blinking-red"></span>
          <span class="live-text">{{ item.tag }}</span>
        </div>
        <div class="scanlines-overlay"></div>
        <span class="camera-label">{{ item.label }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, nextTick, watch, onMounted, onUnmounted } from 'vue'
import visibleLightImg from '@/巡检光学.png'
import thermalImg from '@/巡检热成.png'
import binocularImg from '@/双目.png'

export type LayoutMode = 'single' | 'pip' | 'triple' | 'main-bottom' | 'main-right'

const ALL_VIEWS = [
  { key: 'binocular' as const, label: '双目', tag: '摄像头 00 (双目)', img: binocularImg },
  { key: 'visible' as const, label: '可见光', tag: '摄像头 01 (可见光)', img: visibleLightImg },
  { key: 'thermal' as const, label: '热成像', tag: '摄像头 02 (热成像)', img: thermalImg },
]

const layoutOptions: { key: LayoutMode; label: string }[] = [
  { key: 'single', label: '单画面' },
  { key: 'pip', label: '画中画' },
  { key: 'triple', label: '三等分' },
  { key: 'main-bottom', label: '主+双下' },
  { key: 'main-right', label: '主+双右' },
]

const props = defineProps<{
  mainView: 'binocular' | 'visible' | 'thermal'
  layout: LayoutMode
}>()

const emit = defineEmits<{
  'switch-main': [view: 'binocular' | 'visible' | 'thermal']
  'update:layout': [layout: LayoutMode]
}>()

const thumbItems = computed(() => ALL_VIEWS.filter(v => v.key !== props.mainView))

// ── 语音对话 ──
const voiceActive = ref(false)
function toggleVoice() {
  voiceActive.value = !voiceActive.value
}

// ── 布局菜单 ──
const showMenu = ref(false)
const switcherRef = ref<HTMLElement>()
const menuPos = ref({ top: '0px', right: '0px' })

function updateMenuPos() {
  if (switcherRef.value) {
    const rect = switcherRef.value.getBoundingClientRect()
    menuPos.value = {
      top: `${rect.bottom + 6}px`,
      right: `${window.innerWidth - rect.right}px`,
    }
  }
}

function selectLayout(key: LayoutMode) {
  emit('update:layout', key)
  showMenu.value = false
}

function clickThumb(view: 'binocular' | 'visible' | 'thermal') {
  emit('switch-main', view)
}

function handleClickOutside(e: MouseEvent) {
  if (switcherRef.value && !switcherRef.value.contains(e.target as Node)) {
    showMenu.value = false
  }
}

watch(showMenu, (val) => {
  if (val) nextTick(updateMenuPos)
})

onMounted(() => document.addEventListener('click', handleClickOutside))
onUnmounted(() => document.removeEventListener('click', handleClickOutside))
</script>

<style scoped lang="less">
.camera-views {
  position: absolute;
  top: 68px;
  right: 20px;
  z-index: 5;
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
}

/* ── 工具栏 ── */
.toolbar {
  display: flex;
  gap: 6px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  height: 34px;
  padding: 0 10px;
  background: rgba(8, 16, 36, 0.88);
  border: 1px solid rgba(0, 212, 255, 0.25);
  border-radius: 8px;
  color: rgba(0, 212, 255, 0.7);
  cursor: pointer;
  backdrop-filter: blur(10px);
  transition: all 0.2s ease;

  &:hover {
    border-color: rgba(0, 212, 255, 0.6);
    color: #00d4ff;
    box-shadow: 0 0 12px rgba(0, 212, 255, 0.15);
  }

  &:active {
    transform: scale(0.95);
  }

  &.active {
    background: rgba(255, 60, 60, 0.15);
    border-color: rgba(255, 80, 80, 0.5);
    color: #ff4646;
    box-shadow: 0 0 16px rgba(255, 60, 60, 0.2);
  }
}

.toolbar-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.toolbar-text {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.5px;
  white-space: nowrap;
}

/* ── 语音激活态动画 ── */
.voice-active-icon {
  color: #ff4646;
}

.wave {
  opacity: 0;
  animation: voice-wave 1.5s ease-out infinite;
}

.wave1 { animation-delay: 0s; }
.wave2 { animation-delay: 0.4s; }

@keyframes voice-wave {
  0% {
    opacity: 0.6;
    transform: scale(0.8);
    transform-origin: center;
  }
  100% {
    opacity: 0;
    transform: scale(1.6);
    transform-origin: center;
  }
}

/* 语音按钮 hover 也偏红 */
.toolbar-btn.active:hover {
  border-color: rgba(255, 80, 80, 0.7);
  color: #ff6060;
  box-shadow: 0 0 20px rgba(255, 60, 60, 0.25);
}

/* ── 布局菜单 (Teleported to body) ── */
.layout-menu {
  position: fixed;
  min-width: 170px;
  background: rgba(8, 16, 36, 0.96);
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 10px;
  padding: 6px;
  backdrop-filter: blur(16px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.7), 0 0 1px rgba(0, 212, 255, 0.3);
  z-index: 99999;
}

.layout-option {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.65);
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    background: rgba(0, 212, 255, 0.08);
    color: rgba(255, 255, 255, 0.9);
  }

  &.active {
    background: rgba(0, 212, 255, 0.1);
    border-color: rgba(0, 212, 255, 0.2);
    color: #fff;
  }
}

.option-preview {
  width: 40px;
  height: 28px;
  flex-shrink: 0;
}

.option-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.5px;
  flex: 1;
}

.option-check {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

/* ── 菜单动画 ── */
.menu-fade-enter-active,
.menu-fade-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.menu-fade-enter-from,
.menu-fade-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── 缩略图（pip 模式） ── */
.camera-thumb {
  width: 200px;
  height: 140px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(0, 212, 255, 0.25);
  background: #04060f;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  position: relative;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);

  &:hover {
    border-color: rgba(0, 212, 255, 0.65);
    box-shadow: 0 4px 20px rgba(0, 212, 255, 0.25);
    transform: scale(1.03);

    .camera-label {
      background: rgba(0, 212, 255, 0.85);
      color: #04060f;
      font-weight: 800;
    }
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    opacity: 0.8;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }

  &:hover img {
    opacity: 1;
  }

  .live-tag {
    position: absolute;
    top: 6px;
    left: 6px;
    background: rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 3px;
    padding: 1px 5px;
    display: flex;
    align-items: center;
    gap: 4px;
    pointer-events: none;

    .live-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #ef4444;
      &.blinking-red { animation: rec-pulse 1s infinite alternate; }
    }

    .live-text {
      font-size: 8px;
      font-weight: 800;
      color: rgba(255, 255, 255, 0.8);
      font-family: monospace;
      letter-spacing: 0.5px;
    }
  }

  .scanlines-overlay {
    position: absolute;
    inset: 0;
    pointer-events: none;
    background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.2) 50%);
    background-size: 100% 3px;
    opacity: 0.3;
  }

  .camera-label {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 10px;
    font-weight: 700;
    color: rgba(255, 255, 255, 0.8);
    background: rgba(8, 16, 36, 0.75);
    padding: 3px 0;
    letter-spacing: 0.5px;
    transition: all 0.3s ease;
    backdrop-filter: blur(2px);
    border-top: 1px solid rgba(255, 255, 255, 0.05);
  }
}

@keyframes rec-pulse {
  0% { opacity: 0.2; box-shadow: 0 0 0px #ef4444; }
  100% { opacity: 1; box-shadow: 0 0 6px #ef4444; }
}
</style>
