import { defineStore } from 'pinia'
import { ref } from 'vue'
import { MockService } from '@/mock/mockService'
import type { ThirdPartyApiConfig, ThirdPartySyncBatch } from '@/types/third-party'

export const useThirdPartyIntegrationStore = defineStore('thirdPartyIntegration', () => {
  const configs = ref<ThirdPartyApiConfig[]>([])
  const syncBatches = ref<ThirdPartySyncBatch[]>([])
  const loading = ref(false)

  function initialize() {
    fetchConfigs()
    fetchSyncBatches()
  }

  function fetchConfigs() {
    configs.value = MockService.getThirdPartyApiConfigs()
  }

  function fetchSyncBatches() {
    syncBatches.value = MockService.getThirdPartySyncBatches()
  }

  function getEnabledConfigs(): ThirdPartyApiConfig[] {
    return configs.value.filter(c => c.enabled)
  }

  function getConfigById(id: string): ThirdPartyApiConfig | undefined {
    return configs.value.find(c => c.id === id)
  }

  function saveConfig(config: ThirdPartyApiConfig): boolean {
    // 检查系统编码唯一性
    const existing = configs.value.find(c => c.systemCode === config.systemCode && c.id !== config.id)
    if (existing) {
      return false
    }
    config.updatedAt = new Date().toISOString()
    if (!config.id) {
      config.id = `tp-config-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      config.createdAt = new Date().toISOString()
    }
    MockService.saveThirdPartyApiConfig(config)
    fetchConfigs()
    return true
  }

  function deleteConfig(id: string) {
    MockService.deleteThirdPartyApiConfig(id)
    fetchConfigs()
  }

  function toggleEnabled(id: string) {
    const config = configs.value.find(c => c.id === id)
    if (config) {
      config.enabled = !config.enabled
      config.updatedAt = new Date().toISOString()
      MockService.saveThirdPartyApiConfig(config)
      fetchConfigs()
    }
  }

  function saveSyncBatch(batch: ThirdPartySyncBatch) {
    MockService.saveThirdPartySyncBatch(batch)
    fetchSyncBatches()
  }

  return {
    configs,
    syncBatches,
    loading,
    initialize,
    fetchConfigs,
    fetchSyncBatches,
    getEnabledConfigs,
    getConfigById,
    saveConfig,
    deleteConfig,
    toggleEnabled,
    saveSyncBatch
  }
})