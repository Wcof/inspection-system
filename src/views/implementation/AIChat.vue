<template>
  <div class="ai-iframe-page">
    <iframe
      src="https://ai.geekaeon.com/newAI/assistant"
      class="ai-iframe"
      frameborder="0"
      allow="microphone; camera; clipboard-read; clipboard-write"
      allowfullscreen
    />
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.ai-iframe-page {
  width: 100%;
  height: calc(100vh - 64px);
  padding: 0;
  margin: 0;
  overflow: hidden;
}
.ai-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}
</style>
