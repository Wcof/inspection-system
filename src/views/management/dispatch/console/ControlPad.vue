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
  <div class="control-pad-wrap">
    <!-- 左侧：机器人控制 -->
    <div class="zone zone-vehicle">
      <div class="zone-label">机器人</div>
      <div class="dpad">
        <button
          class="dpad-btn dpad-up"
          :class="{ active: vKeys.w }"
          :data-pulse="vPulse.w"
          @mousedown.prevent="emitVehicle('forward')"
          @mouseup.prevent="emitVehicle('stop')"
          @touchstart.prevent="emitVehicle('forward')"
          @touchend.prevent="emitVehicle('stop')"
        >
          <svg class="dpad-icon" viewBox="0 0 24 24"><path d="M12 5L12 19M6 13L12 5L18 13" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="dpad-label">前进</span>
          <span class="dpad-key">W</span>
          <span class="dpad-ring"></span>
        </button>
        <button
          class="dpad-btn dpad-left"
          :class="{ active: vKeys.a }"
          :data-pulse="vPulse.a"
          @mousedown.prevent="emitVehicle('left')"
          @mouseup.prevent="emitVehicle('stop')"
          @touchstart.prevent="emitVehicle('left')"
          @touchend.prevent="emitVehicle('stop')"
        >
          <svg class="dpad-icon" viewBox="0 0 24 24"><path d="M5 12L19 12M11 6L5 12L11 18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="dpad-label">左转</span>
          <span class="dpad-key">A</span>
          <span class="dpad-ring"></span>
        </button>
        <button
          class="dpad-btn dpad-center dpad-brake"
          :class="{ active: vKeys.space }"
          :data-pulse="vPulse.space"
          @mousedown.prevent="emitVehicle('brake')"
          @mouseup.prevent="emitVehicle('stop')"
          @touchstart.prevent="emitVehicle('brake')"
          @touchend.prevent="emitVehicle('stop')"
        >
          <svg class="dpad-icon" viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2" stroke="currentColor" stroke-width="2.5" fill="none"/></svg>
          <span class="dpad-label">急停</span>
          <span class="dpad-key">空格</span>
          <span class="dpad-ring"></span>
        </button>
        <button
          class="dpad-btn dpad-right"
          :class="{ active: vKeys.d }"
          :data-pulse="vPulse.d"
          @mousedown.prevent="emitVehicle('right')"
          @mouseup.prevent="emitVehicle('stop')"
          @touchstart.prevent="emitVehicle('right')"
          @touchend.prevent="emitVehicle('stop')"
        >
          <svg class="dpad-icon" viewBox="0 0 24 24"><path d="M19 12L5 12M13 6L19 12L13 18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="dpad-label">右转</span>
          <span class="dpad-key">D</span>
          <span class="dpad-ring"></span>
        </button>
        <button
          class="dpad-btn dpad-down"
          :class="{ active: vKeys.s }"
          :data-pulse="vPulse.s"
          @mousedown.prevent="emitVehicle('backward')"
          @mouseup.prevent="emitVehicle('stop')"
          @touchstart.prevent="emitVehicle('backward')"
          @touchend.prevent="emitVehicle('stop')"
        >
          <svg class="dpad-icon" viewBox="0 0 24 24"><path d="M12 19L12 5M6 11L12 19L18 11" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="dpad-label">后退</span>
          <span class="dpad-key">S</span>
          <span class="dpad-ring"></span>
        </button>
      </div>
    </div>

    <!-- 右侧：云台控制 -->
    <div class="zone zone-gimbal">
      <div class="zone-label">云台</div>
      <div class="dpad">
        <button
          class="dpad-btn dpad-up"
          :class="{ active: gKeys.up }"
          :data-pulse="gPulse.up"
          @mousedown.prevent="emitGimbal('up')"
          @mouseup.prevent="emitGimbal('stop')"
          @touchstart.prevent="emitGimbal('up')"
          @touchend.prevent="emitGimbal('stop')"
        >
          <svg class="dpad-icon" viewBox="0 0 24 24"><path d="M12 5L12 19M6 13L12 5L18 13" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="dpad-label">上仰</span>
          <span class="dpad-key">↑</span>
          <span class="dpad-ring"></span>
        </button>
        <button
          class="dpad-btn dpad-left"
          :class="{ active: gKeys.left }"
          :data-pulse="gPulse.left"
          @mousedown.prevent="emitGimbal('left')"
          @mouseup.prevent="emitGimbal('stop')"
          @touchstart.prevent="emitGimbal('left')"
          @touchend.prevent="emitGimbal('stop')"
        >
          <svg class="dpad-icon" viewBox="0 0 24 24"><path d="M5 12L19 12M11 6L5 12L11 18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="dpad-label">左旋</span>
          <span class="dpad-key">←</span>
          <span class="dpad-ring"></span>
        </button>
        <button
          class="dpad-btn dpad-center dpad-reset"
          @mousedown.prevent="emitGimbal('center')"
          @touchstart.prevent="emitGimbal('center')"
        >
          <svg class="dpad-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5" stroke="currentColor" stroke-width="1.5" fill="none"/><circle cx="12" cy="12" r="1.5" fill="currentColor"/></svg>
          <span class="dpad-label">归位</span>
        </button>
        <button
          class="dpad-btn dpad-right"
          :class="{ active: gKeys.right }"
          :data-pulse="gPulse.right"
          @mousedown.prevent="emitGimbal('right')"
          @mouseup.prevent="emitGimbal('stop')"
          @touchstart.prevent="emitGimbal('right')"
          @touchend.prevent="emitGimbal('stop')"
        >
          <svg class="dpad-icon" viewBox="0 0 24 24"><path d="M19 12L5 12M13 6L19 12L13 18" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="dpad-label">右旋</span>
          <span class="dpad-key">→</span>
          <span class="dpad-ring"></span>
        </button>
        <button
          class="dpad-btn dpad-down"
          :class="{ active: gKeys.down }"
          :data-pulse="gPulse.down"
          @mousedown.prevent="emitGimbal('down')"
          @mouseup.prevent="emitGimbal('stop')"
          @touchstart.prevent="emitGimbal('down')"
          @touchend.prevent="emitGimbal('stop')"
        >
          <svg class="dpad-icon" viewBox="0 0 24 24"><path d="M12 19L12 5M6 11L12 19L18 11" stroke="currentColor" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span class="dpad-label">下俯</span>
          <span class="dpad-key">↓</span>
          <span class="dpad-ring"></span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.control-pad-wrap {
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
  gap: 8px;
}

.zone-label {
  font-size: 10px;
  font-weight: 700;
  color: rgba(0, 212, 255, 0.45);
  letter-spacing: 4px;
  text-shadow: 0 0 8px rgba(0, 212, 255, 0.2);
}

/* ── D-Pad 通用 ── */
.dpad {
  display: grid;
  grid-template-columns: 58px 58px 58px;
  grid-template-rows: 52px 52px 52px;
  gap: 5px;
}

.dpad-btn {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  background: linear-gradient(180deg, rgba(15, 28, 55, 0.95) 0%, rgba(8, 18, 38, 0.98) 100%);
  border: 1.5px solid rgba(0, 212, 255, 0.2);
  border-radius: 12px;
  color: rgba(0, 212, 255, 0.8);
  cursor: pointer;
  backdrop-filter: blur(12px);
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  transition: all 0.1s ease;
  overflow: hidden;
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

.dpad-btn:hover {
  border-color: rgba(0, 212, 255, 0.45);
  color: #00d4ff;
  box-shadow:
    0 2px 6px rgba(0, 0, 0, 0.4),
    0 0 14px rgba(0, 212, 255, 0.12);
}

.dpad-btn:active {
  transform: scale(0.93);
}

/* ── 键盘激活态 ── */
.dpad-btn.active {
  background: linear-gradient(180deg, rgba(0, 212, 255, 0.25) 0%, rgba(0, 150, 200, 0.15) 100%);
  border-color: #00d4ff;
  color: #00eaff;
  transform: scale(0.93);
  box-shadow:
    0 0 24px rgba(0, 212, 255, 0.35),
    0 0 48px rgba(0, 212, 255, 0.12),
    inset 0 0 16px rgba(0, 212, 255, 0.1);
}

.dpad-btn.active .dpad-icon {
  filter: drop-shadow(0 0 6px rgba(0, 228, 255, 0.8));
}

.dpad-btn.active .dpad-label {
  color: #fff;
  text-shadow: 0 0 8px rgba(0, 212, 255, 0.6);
}

.dpad-btn.active .dpad-key {
  color: rgba(0, 212, 255, 0.7);
}

/* ── 涟漪光环 ── */
.dpad-ring {
  position: absolute;
  inset: -2px;
  border-radius: inherit;
  border: 2px solid transparent;
  pointer-events: none;
  opacity: 0;
}

.dpad-btn.active .dpad-ring {
  animation: ring-flash 0.6s ease-out;
}

@keyframes ring-flash {
  0% {
    opacity: 0;
    border-color: rgba(0, 212, 255, 0.8);
    box-shadow: 0 0 30px rgba(0, 212, 255, 0.5);
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    border-color: rgba(0, 212, 255, 0);
    box-shadow: 0 0 60px rgba(0, 212, 255, 0);
  }
}

/* data-pulse 变化时重新触发动画 */
.dpad-btn[data-pulse] .dpad-ring {
  animation: ring-flash 0.6s ease-out;
}

/* ── 急停激活态（红色） ── */
.dpad-brake.active {
  background: linear-gradient(180deg, rgba(255, 70, 70, 0.35) 0%, rgba(200, 40, 40, 0.22) 100%);
  border-color: #ff4646;
  color: #ff6060;
  box-shadow:
    0 0 24px rgba(255, 70, 70, 0.35),
    0 0 48px rgba(255, 70, 70, 0.12),
    inset 0 0 16px rgba(255, 70, 70, 0.1);
}

.dpad-brake.active .dpad-icon {
  filter: drop-shadow(0 0 6px rgba(255, 70, 70, 0.8));
}

.dpad-brake.active .dpad-ring {
  animation: ring-flash-red 0.6s ease-out;
}

@keyframes ring-flash-red {
  0% {
    opacity: 0;
    border-color: rgba(255, 70, 70, 0.8);
    box-shadow: 0 0 30px rgba(255, 70, 70, 0.5);
  }
  50% { opacity: 1; }
  100% {
    opacity: 0;
    border-color: rgba(255, 70, 70, 0);
    box-shadow: 0 0 60px rgba(255, 70, 70, 0);
  }
}

.dpad-brake[data-pulse] .dpad-ring {
  animation: ring-flash-red 0.6s ease-out;
}

/* ── 图标 / 文字 ── */
.dpad-icon {
  width: 20px;
  height: 20px;
  transition: filter 0.1s ease;
}

.dpad-label {
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 1px;
  transition: all 0.1s ease;
}

.dpad-key {
  font-size: 9px;
  font-weight: 600;
  font-family: 'SF Mono', 'Menlo', monospace;
  color: rgba(0, 212, 255, 0.3);
  line-height: 1;
  transition: color 0.1s ease;
}

/* ── 九宫格定位 ── */
.dpad-up    { grid-column: 2; grid-row: 1; }
.dpad-left  { grid-column: 1; grid-row: 2; }
.dpad-center{ grid-column: 2; grid-row: 2; }
.dpad-right { grid-column: 3; grid-row: 2; }
.dpad-down  { grid-column: 2; grid-row: 3; }

/* ── 急停默认态 ── */
.dpad-brake {
  background: linear-gradient(180deg, rgba(220, 50, 50, 0.25) 0%, rgba(160, 30, 30, 0.18) 100%);
  border-color: rgba(255, 70, 70, 0.35);
  color: #ff4646;
}

.dpad-brake:hover {
  border-color: rgba(255, 70, 70, 0.6);
  color: #ff6060;
  box-shadow: 0 0 14px rgba(255, 70, 70, 0.15);
}

/* ── 归位按钮 ── */
.dpad-reset {
  background: radial-gradient(circle, rgba(0, 212, 255, 0.1) 0%, rgba(0, 212, 255, 0.03) 100%);
  border-color: rgba(0, 212, 255, 0.25);
  border-radius: 50%;
  color: rgba(0, 212, 255, 0.5);
}

.dpad-reset:hover {
  background: radial-gradient(circle, rgba(0, 212, 255, 0.18) 0%, rgba(0, 212, 255, 0.06) 100%);
  color: rgba(0, 212, 255, 0.8);
}
</style>
