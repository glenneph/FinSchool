<template>
  <div 
    class="button-container" 
    :class="{ 'state-hover': isHovered }"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <!-- Background frame (visible only in hover state for Primary, or as shadow for Secondary) -->
    <div v-if="showBackground" class="button-background" :class="backgroundClass"></div>
    
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
  props: {
    variant: {
      type: String,
      default: 'Primary',
      validator: (value) => ['Primary', 'Secondary'].includes(value)
    }
  },
  data() {
    return {
      isHovered: false
    }
  },
  computed: {
    buttonClass() {
      const variant = this.variant.toLowerCase();
      const state = this.isHovered ? 'hover' : 'default';
      return `btn-${variant}-${state}`;
    },
    backgroundClass() {
      return this.variant === 'Secondary' && this.isHovered ? 'background-shadow' : '';
    },
    showBackground() {
      if (this.variant === 'Primary') {
        return this.isHovered;
      } else if (this.variant === 'Secondary') {
        return this.isHovered;
      }
      return false;
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

/* Background frame for Primary hover (offset green) */
.button-background {
  position: absolute;
  top: 8px;
  left: 8px;
  width: 100%;
  height: 100%;
  background-color: var(--token-button-primary);
  z-index: 0;
}

/* Background frame for Secondary hover (offset dark) */
.button-background.background-shadow {
  background-color: var(--token-button-secondary);
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

/* PRIMARY VARIANT */
/* Primary - Default state */
.btn-primary-default {
  background-color: var(--token-button-primary);
  color: var(--token-text-primary-alt);
}

/* Primary - Hover state */
.btn-primary-hover {
  background-color: var(--token-button-secondary);
  color: var(--token-text-primary);
}

/* SECONDARY VARIANT */
/* Secondary - Default state */
.btn-secondary-default {
  background-color: var(--token-button-secondary);
  color: var(--token-text-primary);
}

/* Secondary - Hover state */
.btn-secondary-hover {
  background-color: var(--token-button-primary);
  color: var(--token-text-primary-alt);
}

/* Active state */
.btn:active {
  transform: scale(0.98);
}
</style>

