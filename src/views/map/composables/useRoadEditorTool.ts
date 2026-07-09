import { ref } from 'vue'
import type { EditorTool } from '@/types/road-editor'

/**
 * 统一工具状态管理
 * 所有画布行为必须先判断 activeTool
 */
export function useRoadEditorTool() {
  const activeTool = ref<EditorTool>('select')

  function setActiveTool(tool: EditorTool) {
    activeTool.value = tool
  }

  function isTool(tool: EditorTool): boolean {
    return activeTool.value === tool
  }

  function resetTool() {
    activeTool.value = 'select'
  }

  return {
    activeTool,
    setActiveTool,
    isTool,
    resetTool
  }
}
