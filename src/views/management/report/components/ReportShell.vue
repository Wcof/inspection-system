<template>
  <div class="report-shell">
    <section class="hero">
      <div class="hero-grid" />
      <div class="hero-main">
        <p class="hero-badge">{{ badge }}</p>
        <h1>{{ title }}</h1>
        <p class="hero-subtitle">{{ subtitle }}</p>
      </div>
      <div class="hero-extra">
        <slot name="hero-extra" />
      </div>
    </section>

    <a-card class="control-card" :bordered="false">
      <div class="control-wrap">
        <a-space>
          <span class="control-label">{{ periodLabel }}</span>
          <a-segmented :value="modelValue" :options="periodOptions" @update:value="emit('update:modelValue', $event)" />
        </a-space>
        <div class="control-actions">
          <slot name="actions" />
        </div>
      </div>
    </a-card>

    <slot />
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  title: string
  subtitle: string
  badge?: string
  periodLabel?: string
  modelValue: string
  periodOptions: { label: string; value: string }[]
}>(), {
  badge: 'REPORT',
  periodLabel: '统计周期'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<style scoped>
.report-shell {
  --rs-bg: #eef3f6;
  --rs-ink: #0f172a;
  --rs-muted: #475569;
  --rs-card: #ffffff;
  --rs-accent: #0f766e;
  --rs-accent-soft: rgba(15, 118, 110, 0.14);
  background:
    radial-gradient(circle at 10% 8%, rgba(15, 118, 110, 0.12), transparent 34%),
    radial-gradient(circle at 88% 0, rgba(245, 158, 11, 0.12), transparent 30%),
    linear-gradient(180deg, #f6f8fa, #f1f5f9 40%, #eef3f6);
  border-radius: 16px;
  padding: 18px;
  font-family: 'DIN Alternate', 'Bahnschrift', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.hero {
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  padding: 18px 20px;
  color: #ecfeff;
  background: linear-gradient(125deg, #0f172a 0%, #0f766e 56%, #1d4ed8 100%);
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 14px;
}

.hero-grid {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(transparent 95%, rgba(236, 254, 255, 0.18) 95%),
    linear-gradient(90deg, transparent 95%, rgba(236, 254, 255, 0.16) 95%);
  background-size: 22px 22px;
  opacity: 0.28;
  pointer-events: none;
}

.hero-main {
  position: relative;
  z-index: 1;
}

.hero-badge {
  margin: 0;
  display: inline-block;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 11px;
  letter-spacing: 1.2px;
  background: rgba(236, 254, 255, 0.18);
  color: #cffafe;
}

.hero-main h1 {
  margin: 10px 0 6px;
  font-size: 30px;
  line-height: 1.1;
  letter-spacing: 0.3px;
}

.hero-subtitle {
  margin: 0;
  color: rgba(236, 254, 255, 0.9);
  max-width: 640px;
}

.hero-extra {
  position: relative;
  z-index: 1;
  align-self: center;
}

.control-card {
  margin-top: 14px;
  border-radius: 12px;
  background: var(--rs-card);
  box-shadow: 0 12px 26px -24px rgba(15, 23, 42, 0.8);
}

.control-wrap {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.control-label {
  color: var(--rs-muted);
  font-size: 13px;
}

.control-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

@media (max-width: 960px) {
  .report-shell {
    padding: 12px;
    border-radius: 12px;
  }

  .hero {
    grid-template-columns: 1fr;
    padding: 14px;
  }

  .hero-main h1 {
    font-size: 24px;
  }
}
</style>
