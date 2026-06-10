<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const emit = defineEmits<{
  (e: 'direction', dir: string): void
  (e: 'gimbal', dir: string): void
}>()

function emitVehicle(dir: string) {
  emit('direction', dir)
}

function emitGimbal(dir: string) {
  emit('gimbal', dir)
}

// ── 按键状态（驱动 CSS class）──
const vKeys = ref({ w: false, a: false, s: false, d: false, space: false })
const gKeys = ref({ up: false, down: false, left: false, right: false })

// ── 触发涟漪脉冲 ──
const vPulse = ref({ w: 0, a: 0, s: 0, d: 0, space: 0 })
const gPulse = ref({ up: 0, down: 0, left: 0, right: 0 })

function handleKeyDown(e: KeyboardEvent) {
  if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'SELECT') return
  const key = e.key
  if (key === 'w' || key === 'W') { if (!vKeys.value.w) { vKeys.value.w = true; vPulse.value.w++; emitVehicle('forward') } }
  else if (key === 'a' || key === 'A') { if (!vKeys.value.a) { vKeys.value.a = true; vPulse.value.a++; emitVehicle('left') } }
  else if (key === 's' || key === 'S') { if (!vKeys.value.s) { vKeys.value.s = true; vPulse.value.s++; emitVehicle('backward') } }
  else if (key === 'd' || key === 'D') { if (!vKeys.value.d) { vKeys.value.d = true; vPulse.value.d++; emitVehicle('right') } }
  else if (key === ' ') { e.preventDefault(); if (!vKeys.value.space) { vKeys.value.space = true; vPulse.value.space++; emitVehicle('brake') } }
  else if (key === 'ArrowUp') { e.preventDefault(); if (!gKeys.value.up) { gKeys.value.up = true; gPulse.value.up++; emitGimbal('up') } }
  else if (key === 'ArrowDown') { e.preventDefault(); if (!gKeys.value.down) { gKeys.value.down = true; gPulse.value.down++; emitGimbal('down') } }
  else if (key === 'ArrowLeft') { e.preventDefault(); if (!gKeys.value.left) { gKeys.value.left = true; gPulse.value.left++; emitGimbal('left') } }
  else if (key === 'ArrowRight') { e.preventDefault(); if (!gKeys.value.right) { gKeys.value.right = true; gPulse.value.right++; emitGimbal('right') } }
}

function handleKeyUp(e: KeyboardEvent) {
  const key = e.key
  if (key === 'w' || key === 'W') { vKeys.value.w = false }
  else if (key === 'a' || key === 'A') { vKeys.value.a = false }
  else if (key === 's' || key === 'S') { vKeys.value.s = false }
  else if (key === 'd' || key === 'D') { vKeys.value.d = false }
  else if (key === ' ') { vKeys.value.space = false }
  else if (key === 'ArrowUp') { gKeys.value.up = false }
  else if (key === 'ArrowDown') { gKeys.value.down = false }
  else if (key === 'ArrowLeft') { gKeys.value.left = false }
  else if (key === 'ArrowRight') { gKeys.value.right = false }

  const v = vKeys.value
  if (!v.w && !v.a && !v.s && !v.d && !v.space) emitVehicle('stop')
  const g = gKeys.value
  if (!g.up && !g.down && !g.left && !g.right) emitGimbal('stop')
}

onMounted(() => {
  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  document.removeEventListener('keyup', handleKeyUp)
})
</script>

<template>
  <div class="desktop-control-pad-wrap">
    <!-- 左侧：机器人控制 -->
    <div class="zone zone-vehicle">
      <div class="zone-title">
        <span>机器人控制</span>
      </div>
      <div class="zone-hint">WASD + 空格</div>
      <div class="dpad-grid">
        <div class="dpad-row">
          <div class="dpad-spacer"></div>
          <button
            class="dpad-btn"
            :class="{ active: vKeys.w }"
            :data-pulse="vPulse.w"
            @mousedown.prevent="emitVehicle('forward')"
            @mouseup.prevent="emitVehicle('stop')"
          >
            <span class="dpad-key">W</span>
            <span class="dpad-label">前进</span>
            <span class="dpad-ring"></span>
          </button>
          <div class="dpad-spacer"></div>
        </div>
        <div class="dpad-row">
          <button
            class="dpad-btn"
            :class="{ active: vKeys.a }"
            :data-pulse="vPulse.a"
            @mousedown.prevent="emitVehicle('left')"
            @mouseup.prevent="emitVehicle('stop')"
          >
            <span class="dpad-key">A</span>
            <span class="dpad-label">左转</span>
            <span class="dpad-ring"></span>
          </button>
          <button
            class="dpad-btn dpad-center"
            :class="{ active: vKeys.space }"
            :data-pulse="vPulse.space"
            @mousedown.prevent="emitVehicle('brake')"
            @mouseup.prevent="emitVehicle('stop')"
          >
            <span class="dpad-key">空格</span>
            <span class="dpad-label">急停</span>
            <span class="dpad-ring"></span>
          </button>
          <button
            class="dpad-btn"
            :class="{ active: vKeys.d }"
            :data-pulse="vPulse.d"
            @mousedown.prevent="emitVehicle('right')"
            @mouseup.prevent="emitVehicle('stop')"
          >
            <span class="dpad-key">D</span>
            <span class="dpad-label">右转</span>
            <span class="dpad-ring"></span>
          </button>
        </div>
        <div class="dpad-row">
          <div class="dpad-spacer"></div>
          <button
            class="dpad-btn"
            :class="{ active: vKeys.s }"
            :data-pulse="vPulse.s"
            @mousedown.prevent="emitVehicle('backward')"
            @mouseup.prevent="emitVehicle('stop')"
          >
            <span class="dpad-key">S</span>
            <span class="dpad-label">后退</span>
            <span class="dpad-ring"></span>
          </button>
          <div class="dpad-spacer"></div>
        </div>
      </div>
    </div>

    <!-- 右侧：云台控制 -->
    <div class="zone zone-gimbal">
      <div class="zone-title">
        <span>云台控制</span>
      </div>
      <div class="zone-hint">方向键</div>
      <div class="dpad-grid">
        <div class="dpad-row">
          <div class="dpad-spacer"></div>
          <button
            class="dpad-btn"
            :class="{ active: gKeys.up }"
            :data-pulse="gPulse.up"
            @mousedown.prevent="emitGimbal('up')"
            @mouseup.prevent="emitGimbal('stop')"
          >
            <span class="dpad-key">↑</span>
            <span class="dpad-label">上仰</span>
            <span class="dpad-ring"></span>
          </button>
          <div class="dpad-spacer"></div>
        </div>
        <div class="dpad-row">
          <button
            class="dpad-btn"
            :class="{ active: gKeys.left }"
            :data-pulse="gPulse.left"
            @mousedown.prevent="emitGimbal('left')"
            @mouseup.prevent="emitGimbal('stop')"
          >
            <span class="dpad-key">←</span>
            <span class="dpad-label">左旋</span>
            <span class="dpad-ring"></span>
          </button>
          <button
            class="dpad-btn dpad-center"
            @mousedown.prevent="emitGimbal('center')"
          >
            <span class="dpad-key">归位</span>
            <span class="dpad-ring"></span>
          </button>
          <button
            class="dpad-btn"
            :class="{ active: gKeys.right }"
            :data-pulse="gPulse.right"
            @mousedown.prevent="emitGimbal('right')"
            @mouseup.prevent="emitGimbal('stop')"
          >
            <span class="dpad-key">→</span>
            <span class="dpad-label">右旋</span>
            <span class="dpad-ring"></span>
          </button>
        </div>
        <div class="dpad-row">
          <div class="dpad-spacer"></div>
          <button
            class="dpad-btn"
            :class="{ active: gKeys.down }"
            :data-pulse="gPulse.down"
            @mousedown.prevent="emitGimbal('down')"
            @mouseup.prevent="emitGimbal('stop')"
          >
            <span class="dpad-key">↓</span>
            <span class="dpad-label">下俯</span>
            <span class="dpad-ring"></span>
          </button>
          <div class="dpad-spacer"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.desktop-control-pad-wrap {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
  pointer-events: none;
  user-select: none;
  -webkit-user-select: none;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 0 28px 24px;
}

/* ── 区域通用 ── */
.zone {
  pointer-events: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: rgba(10, 16, 35, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 14px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4), 0 0 12px rgba(0, 212, 255, 0.08);
}

.zone-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(0, 212, 255, 0.9);
  letter-spacing: 1px;
}

.zone-hint {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.35);
  letter-spacing: 0.5px;
}

/* ── 按键网格 ── */
.dpad-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dpad-row {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.dpad-spacer {
  width: 64px;
  height: 64px;
}

/* ── 按键样式 ── */
.dpad-btn {
  position: relative;
  width: 64px;
  height: 64px;
  border: 1px solid rgba(0, 212, 255, 0.3);
  border-radius: 12px;
  background: rgba(0, 212, 255, 0.05);
  color: rgba(0, 212, 255, 0.8);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  transition: all 0.15s ease;
  overflow: hidden;
  user-select: none;
  -webkit-user-select: none;
}

.dpad-btn:hover {
  background: rgba(0, 212, 255, 0.1);
  border-color: rgba(0, 212, 255, 0.5);
  box-shadow: 0 0 12px rgba(0, 212, 255, 0.2);
}

.dpad-btn:active,
.dpad-btn.active {
  background: rgba(0, 212, 255, 0.2);
  border-color: rgba(0, 212, 255, 0.8);
  box-shadow: 0 0 20px rgba(0, 212, 255, 0.4), inset 0 0 10px rgba(0, 212, 255, 0.1);
  transform: scale(0.95);
}

.dpad-btn.dpad-center {
  background: rgba(255, 77, 79, 0.1);
  border-color: rgba(255, 77, 79, 0.3);
  color: rgba(255, 77, 79, 0.8);
}

.dpad-btn.dpad-center:hover {
  background: rgba(255, 77, 79, 0.15);
  border-color: rgba(255, 77, 79, 0.5);
  box-shadow: 0 0 12px rgba(255, 77, 79, 0.2);
}

.dpad-btn.dpad-center:active,
.dpad-btn.dpad-center.active {
  background: rgba(255, 77, 79, 0.25);
  border-color: rgba(255, 77, 79, 0.8);
  box-shadow: 0 0 20px rgba(255, 77, 79, 0.4), inset 0 0 10px rgba(255, 77, 79, 0.1);
}

.dpad-key {
  font-size: 14px;
  font-weight: 700;
  font-family: 'SF Mono', 'Consolas', 'Monaco', monospace;
  line-height: 1;
}

.dpad-label {
  font-size: 10px;
  opacity: 0.7;
  line-height: 1;
}

/* ── 涟漪效果 ── */
.dpad-ring {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
}

.dpad-btn[data-pulse] .dpad-ring {
  animation: dpad-pulse 0.4s ease-out;
}

@keyframes dpad-pulse {
  0% {
    box-shadow: inset 0 0 0 0 rgba(0, 212, 255, 0.4);
  }
  100% {
    box-shadow: inset 0 0 0 20px rgba(0, 212, 255, 0);
  }
}

.dpad-btn.dpad-center[data-pulse] .dpad-ring {
  animation: dpad-pulse-red 0.4s ease-out;
}

@keyframes dpad-pulse-red {
  0% {
    box-shadow: inset 0 0 0 0 rgba(255, 77, 79, 0.4);
  }
  100% {
    box-shadow: inset 0 0 0 20px rgba(255, 77, 79, 0);
  }
}
</style>
