import { onMounted, onUnmounted } from 'vue'
import { useRobotConsoleStore } from '@/stores/robotConsole'

/**
 * 键盘控制组合式函数
 * 单一职责：监听全局键盘事件，将按键状态同步到 Store
 * 只在 ControlPanel 中调用一次，避免重复监听
 */
export function useKeyboardControl() {
  const store = useRobotConsoleStore()

  function handleKeyDown(e: KeyboardEvent) {
    if (store.controlMode !== 'pc') return
    if (store.taskStatus === 'emergency_locked') return
    const key = e.key.toLowerCase()
    if (['w', 'a', 's', 'd', ' '].includes(key)) {
      e.preventDefault()
      store.setKeyPressed(key, true)
    }
  }

  function handleKeyUp(e: KeyboardEvent) {
    if (store.controlMode !== 'pc') return
    const key = e.key.toLowerCase()
    store.setKeyPressed(key, false)
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('keyup', handleKeyUp)
  })
}
