import { onMounted, onBeforeUnmount, type Ref } from 'vue'
import type { EntityRef } from '@/types/road-editor'
import type { EditorTool } from '@/types/road-editor'

/**
 * 快捷键管理 composable
 */
export function useRoadKeyboardShortcuts(
  activeTool: Ref<EditorTool>,
  selectedEntity: Ref<EntityRef | null>,
  hasDraftSegment: () => boolean,
  hasDraftArea: () => boolean,
  discardSegmentDraft: () => void,
  discardAreaDraft: () => void,
  clearSelection: () => void,
  deleteSelectedEntity: () => void,
  handleUndo: () => boolean,
  handleRedo: () => boolean
) {
  function onKeyDown(e: KeyboardEvent) {
    // Ctrl+Z 撤销
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault()
      handleUndo()
      return
    }
    // Ctrl+Y / Ctrl+Shift+Z 重做
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault()
      handleRedo()
      return
    }

    switch (e.key) {
      case 'Escape':
        // 优先级: 绘制草稿 > 选中元素
        if (hasDraftSegment()) {
          discardSegmentDraft()
        } else if (hasDraftArea()) {
          discardAreaDraft()
        } else if (selectedEntity.value) {
          clearSelection()
        }
        break

      case 'Delete':
      case 'Backspace':
        // 避免在输入框中触发
        if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return
        if (selectedEntity.value) {
          deleteSelectedEntity()
        }
        break

      // 方向键微调（仅在选择工具下）
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        if (activeTool.value !== 'select') return
        e.preventDefault()
        nudgeSelected(1)
        break
    }
  }

  /** 方向键微调选中元素 */
  function nudgeSelected(step: number) {
    if (!selectedEntity.value) return
    // 实际微调逻辑由外部组件通过 DOM 事件处理
    // 这里只分发自定义事件
    window.dispatchEvent(new CustomEvent('road-nudge', {
      detail: { step }
    }))
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeyDown)
  })

  return {
    onKeyDown
  }
}
