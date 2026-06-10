<template>
  <div class="map-thumbnail">
    <div class="radar-container">
      <img :src="thumbnailSrc" alt="地图缩略图" class="thumbnail-img" />
      <div class="radar-sweep"></div>
      <div class="radar-ping"></div>
      <div class="radar-hud-lines">
        <span class="compass-tick n">N</span>
        <span class="compass-tick s">S</span>
        <span class="compass-tick e">E</span>
        <span class="compass-tick w">W</span>
        <span class="crosshair-center"></span>
      </div>
    </div>
    <div class="thumbnail-label">
      <span class="label-text">地图</span>
      <span class="coords-text">位置: 40.7128° N, 74.0060° W</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import thumbnailImg from '@/缩略地图.png'

const thumbnailSrc = thumbnailImg
</script>

<style scoped lang="less">
.map-thumbnail {
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 5;
  width: 172px;
  height: 130px;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid rgba(0, 212, 255, 0.25);
  background: rgba(4, 6, 15, 0.7);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.6), inset 0 0 10px rgba(0, 212, 255, 0.05);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  display: flex;
  flex-direction: column;

  &:hover {
    transform: translateX(-50%) translateY(-2px) scale(1.02);
    border-color: #00d4ff;
    box-shadow: 0 4px 20px rgba(0, 212, 255, 0.35);

    .thumbnail-label {
      background: rgba(0, 212, 255, 0.95);
      
      .label-text, .coords-text {
        color: #04060f;
        font-weight: 800;
      }
    }
  }

  .radar-container {
    flex: 1;
    position: relative;
    overflow: hidden;

    .thumbnail-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0.75;
      filter: saturate(1.2) contrast(1.1) brightness(0.85);
    }
  }
}

// 旋转雷达扫掠效果
.radar-sweep {
  position: absolute;
  inset: -50%;
  pointer-events: none;
  background: conic-gradient(
    from 0deg,
    rgba(0, 212, 255, 0.45) 0deg,
    rgba(0, 212, 255, 0.08) 60deg,
    transparent 180deg
  );
  animation: sweep 4s infinite linear;
  z-index: 2;
}

// 雷达随机闪烁信号点
.radar-ping {
  position: absolute;
  top: 35%;
  left: 60%;
  width: 5px;
  height: 5px;
  background: #00d4ff;
  border-radius: 50%;
  box-shadow: 0 0 8px #00d4ff;
  animation: ping 1.5s infinite ease-out;
  z-index: 3;
}

// 雷达HUD刻度/十字准星
.radar-hud-lines {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;

  .crosshair-center {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 12px;
    height: 12px;
    transform: translate(-50%, -50%);
    border: 1px dashed rgba(0, 212, 255, 0.3);
    border-radius: 50%;
    
    &::before, &::after {
      content: '';
      position: absolute;
      background: rgba(0, 212, 255, 0.35);
    }
    &::before { top: 5px; left: -2px; width: 16px; height: 1px; }
    &::after { top: -2px; left: 5px; width: 1px; height: 16px; }
  }

  .compass-tick {
    position: absolute;
    font-family: monospace;
    font-size: 8px;
    font-weight: 800;
    color: rgba(0, 212, 255, 0.45);
    line-height: 1;

    &.n { top: 4px; left: 50%; transform: translateX(-50%); }
    &.s { bottom: 4px; left: 50%; transform: translateX(-50%); }
    &.e { right: 4px; top: 50%; transform: translateY(-50%); }
    &.w { left: 4px; top: 50%; transform: translateY(-50%); }
  }
}

.thumbnail-label {
  background: rgba(8, 16, 36, 0.85);
  padding: 4px 8px;
  border-top: 1px solid rgba(0, 212, 255, 0.15);
  display: flex;
  flex-direction: column;
  gap: 1px;
  transition: all 0.3s ease;
  backdrop-filter: blur(2px);

  .label-text {
    font-size: 9px;
    font-weight: 800;
    color: #00d4ff;
    letter-spacing: 1.5px;
    text-shadow: 0 0 6px rgba(0, 212, 255, 0.2);
  }

  .coords-text {
    font-size: 7px;
    font-family: monospace;
    color: rgba(255, 255, 255, 0.45);
    letter-spacing: 0.5px;
  }
}

@keyframes sweep {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes ping {
  0% { transform: scale(0.6); opacity: 1; }
  70% { opacity: 0.6; }
  100% { transform: scale(3.5); opacity: 0; }
}
</style>
