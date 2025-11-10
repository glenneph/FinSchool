<template>
  <div 
    class="radio-option" 
    :class="{ 'radio-option--active': isActive }"
    @click="$emit('select')"
  >
    <div class="radio-option__circle">
      <img 
        v-if="isActive" 
        :src="radioSelectedIcon" 
        alt="Selected" 
        class="radio-option__icon"
      />
      <img 
        v-else 
        :src="radioIcon" 
        alt="Not selected" 
        class="radio-option__icon"
      />
    </div>
    <p class="radio-option__label">{{ label }}</p>
  </div>
</template>

<script>
export default {
  name: 'RadioOption',
  props: {
    label: {
      type: String,
      required: true
    },
    isActive: {
      type: Boolean,
      default: false
    }
  },
  emits: ['select'],
  data() {
    return {
      radioSelectedIcon: '/assets/radio-selected.svg',
      radioIcon: '/assets/radio.svg'
    }
  }
}
</script>

<style scoped>
.radio-option {
  display: inline-flex;
  align-items: center;
  gap: var(--token-spacing-12pt);
  padding: var(--token-spacing-24pt);
  background-color: var(--token-multioption-card-bg);
  border-radius: var(--token-corner-radius-4pt);
  cursor: pointer;
  user-select: none;
  transition: opacity 0.2s ease;
  box-sizing: border-box;
}

/* Desktop breakpoint: fixed width */
@media (min-width: 1024px) {
  .radio-option {
    width: 306px;
  }
}

.radio-option:hover {
  opacity: 0.8;
}

.radio-option__circle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: var(--token-spacing-24pt);
  height: var(--token-spacing-24pt);
  flex-shrink: 0;
}

.radio-option__icon {
  width: 100%;
  height: 100%;
  display: block;
}

.radio-option__label {
  font-family: var(--font-typeface-display);
  font-weight: var(--font-weight-700);
  font-size: var(--font-size-lg);
  line-height: var(--line-height-xl);
  color: var(--token-text-primary);
  margin: 0;
  white-space: nowrap;
}

/* Active state */
.radio-option--active .radio-option__label {
  color: var(--token-text-primary);
}

/* Inactive state - optionally reduce opacity */
.radio-option:not(.radio-option--active) .radio-option__label {
  color: var(--token-text-primary);
  opacity: 0.9;
}
</style>

