<template>
  <div 
    class="popup-container" 
    :class="`popup-container--${type.toLowerCase()}`"
    data-name="PopUp"
  >
    <!-- Header Type -->
    <template v-if="type === 'Header'">
      <div 
        v-if="showBackButton"
        class="back-icon-wrapper"
        role="button"
        tabindex="0"
        @click="handleBack"
      >
        <img
          :src="backIcon"
          alt="Back"
          class="back-icon"
        >
      </div>
      <div class="popup-header-text">
        <h2 class="popup-header-title">
          <slot name="title">
            {{ title }}
          </slot>
        </h2>
        <p class="popup-header-subtitle">
          <slot name="subtitle">
            {{ subtitle }}
          </slot>
        </p>
      </div>
      <button 
        class="popup-close-btn"
        aria-label="Close"
        @click="handleClose"
      >
        <img
          :src="closeIcon"
          alt="Close"
          class="popup-close-icon"
        >
      </button>
    </template>

    <!-- Footer Type -->
    <template v-if="type === 'Footer'">
      <Button @click="handleAction">
        <slot name="button">
          {{ buttonText }}
        </slot>
      </Button>
    </template>
  </div>
</template>

<script>
import Button from './Button.vue'

export default {
  name: 'PopUp',
  components: {
    Button
  },
  props: {
    /**
     * The type of popup component
     * @values Header, Footer
     */
    type: {
      type: String,
      default: 'Header',
      validator: (value) => ['Header', 'Footer'].includes(value)
    },
    /**
     * Title text (for Header type)
     */
    title: {
      type: String,
      default: 'Header'
    },
    /**
     * Subtitle text (for Header type)
     */
    subtitle: {
      type: String,
      default: '(Step n/n)'
    },
    /**
     * Button text (for Footer type)
     */
    buttonText: {
      type: String,
      default: 'Button Text'
    },
    /**
     * Close icon path (for Header type)
     */
    closeIcon: {
      type: String,
      default: '/assets/cancel.svg'
    },
    /**
     * Back icon path (for Header type)
     */
    backIcon: {
      type: String,
      default: '/assets/arrow-left-01-round.svg'
    },
    /**
     * Show back button (for Header type)
     */
    showBackButton: {
      type: Boolean,
      default: false
    }
  },
  methods: {
    handleClose() {
      this.$emit('close')
    },
    handleBack() {
      this.$emit('back')
    },
    handleAction() {
      this.$emit('action')
    }
  }
}
</script>

<style scoped>
/* Container Base */
.popup-container {
  display: flex;
  width: 100%;
  box-sizing: border-box;
}

/* ========== HEADER TYPE ========== */
.popup-container--header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--token-spacing-16pt) var(--token-spacing-24pt);
  border-bottom: 1px solid var(--token-stroke-green);
}

.back-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: var(--token-spacing-8pt); /* Minimal hit area padding */
  margin-right: var(--token-spacing-8pt);
  transition: opacity 0.2s ease;
}

.back-icon-wrapper:hover {
  opacity: 0.7;
}

.back-icon {
  width: 24px;
  height: 24px;
  display: block;
}

.popup-header-text {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  flex: 1;
  justify-content: center;
}

.popup-header-title {
  font-family: var(--font-typeface-display);
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-700);
  line-height: var(--line-height-xl);
  color: var(--token-text-primary);
  margin: 0;
  white-space: nowrap;
}

.popup-header-subtitle {
  font-family: var(--font-typeface-display);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-500);
  line-height: var(--line-height-lg);
  color: var(--token-text-secondary);
  margin: 0;
  white-space: nowrap;
}

.popup-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background-color: var(--token-table-bg);
  border: 1px solid var(--token-icon-green);
  cursor: pointer;
  padding: 0;
  transition: opacity 0.2s ease;
  flex-shrink: 0;
}

.popup-close-btn:hover {
  opacity: 0.8;
}

.popup-close-btn:active {
  transform: scale(0.95);
}

.popup-close-icon {
  width: 24px;
  height: 24px;
  display: block;
}

/* ========== FOOTER TYPE ========== */
.popup-container--footer {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: var(--token-spacing-16pt) var(--token-spacing-24pt);
  border-top: 1px solid var(--token-stroke-green);
}
</style>

