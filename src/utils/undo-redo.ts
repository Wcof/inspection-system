import { ref, type Ref } from 'vue'

/**
 * 撤销/重做 composable
 * @param maxStackSize 最大历史栈深度（默认 50）
 */
export function useUndoRedo<T>(maxStackSize = 50) {
  const undoStack: T[] = []
  const redoStack: T[] = []

  const canUndo: Ref<boolean> = ref(false)
  const canRedo: Ref<boolean> = ref(false)

  function updateFlags() {
    canUndo.value = undoStack.length > 0
    canRedo.value = redoStack.length > 0
  }

  function pushSnapshot(snapshot: T) {
    undoStack.push(snapshot)
    if (undoStack.length > maxStackSize) {
      undoStack.shift()
    }
    // 新操作清空 redo 栈
    redoStack.length = 0
    updateFlags()
  }

  function undo(currentSnapshot: T): T | null {
    if (undoStack.length === 0) return null
    // 将当前状态推入 redo 栈
    redoStack.push(currentSnapshot)
    // 弹出上一个状态
    const prev = undoStack.pop()!
    updateFlags()
    return prev
  }

  function redo(currentSnapshot: T): T | null {
    if (redoStack.length === 0) return null
    // 将当前状态推入 undo 栈
    undoStack.push(currentSnapshot)
    // 弹出下一个状态
    const next = redoStack.pop()!
    updateFlags()
    return next
  }

  function clear() {
    undoStack.length = 0
    redoStack.length = 0
    updateFlags()
  }

  return {
    canUndo,
    canRedo,
    pushSnapshot,
    undo,
    redo,
    clear
  }
}
