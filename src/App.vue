<template>
  <div class="app-root">
    <div class="app-content">
      <router-view />
    </div>
    
    <div class="unsupported-device">
      <p class="unsupported-text">
        This site is currently not supported to your device resolution . Try Switching to <span class="desktop-mode-text">Desktop Mode</span>
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
/* Global styles */
.app-root {
  width: 100%;
  min-height: 100vh;
}

.unsupported-device {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background-color: var(--token-surface);
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 0 40px; /* 40px left and right padding */
  box-sizing: border-box;
}

.unsupported-text {
  font-family: var(--font-typeface-body);
  font-size: 20px; /* Requested 20px font size */
  color: var(--token-text-primary);
  text-align: center;
  margin: 0;
  line-height: 1.5;
}

.desktop-mode-text {
  color: var(--token-text-green);
}

@media (max-width: 800px) {
  .app-content {
    display: none !important;
  }
  
  .unsupported-device {
    display: flex !important;
  }
}
</style>

