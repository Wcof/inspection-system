<template>
  <div class="kb-iframe-page">
    <iframe
      src="https://ai.geekaeon.com/newAI/knowledge"
      class="kb-iframe"
      frameborder="0"
      allow="clipboard-read; clipboard-write"
      allowfullscreen
    />
  </div>
</template>

<script setup lang="ts">
</script>

<style scoped>
.kb-iframe-page {
  width: 100%;
  height: calc(100vh - 64px);
  padding: 0;
  margin: 0;
  overflow: hidden;
}
.kb-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}
</style>
