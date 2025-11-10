<template>
  <div 
    class="button-container" 
    :class="{ 'state-hover': isHovered }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Green background frame (visible only in hover state) -->
    <div v-if="isHovered" class="button-background"></div>
    
    <!-- Main button -->
    <button 
      class="btn" 
      :class="buttonClass"
      @click="handleClick"
    >
      <slot>Check Prepayments</slot>
    </button>
  </div>
</template>

<script>
export default {
  name: 'Button',
  data() {
    return {
      isHovered: false
    }
  },
  computed: {
    buttonClass() {
      return this.isHovered ? 'btn-hover' : 'btn-default'
    }
  },
  methods: {
    handleClick(event) {
      this.$emit('click', event)
    }
  }
}
</script>

<style scoped>
.button-container {
  position: relative;
  width: fit-content;
}

/* Green background frame for hover state */
.button-background {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 100%;
  height: 100%;
  background-color: var(--token-button-primary);
  z-index: 0;
}

/* Base button styles */
.btn {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--token-spacing-8pt);
  padding: var(--token-spacing-16pt) var(--token-spacing-20pt);
  font-family: var(--font-typeface-display);
  font-weight: 500;
  font-size: var(--font-size-md);
  line-height: var(--line-height-lg);
  border: none;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.2s ease;
  z-index: 1;
}

/* Default state */
.btn-default {
  background-color: var(--token-button-primary);
  color: var(--token-text-primary-alt);
}

/* Hover state */
.btn-hover {
  background-color: var(--token-button-secondary);
  color: var(--token-text-primary);
}

/* Active state */
.btn:active {
  transform: scale(0.98);
}
</style>

