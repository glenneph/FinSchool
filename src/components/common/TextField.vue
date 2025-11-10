<template>
  <div class="text-field-wrapper">
    <div class="text-field-border">
      <div class="text-field-content">
        <input
          :value="modelValue"
          @input="$emit('update:modelValue', $event.target.value)"
          :placeholder="placeholder"
          class="text-field-input"
          :class="{ 'text-field-input--placeholder': !hasValue }"
        />
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TextField',
  props: {
    modelValue: {
      type: String,
      default: null
    },
    placeholder: {
      type: String,
      default: 'Enter Location'
    },
    width: {
      type: String,
      default: '402px'
    }
  },
  emits: ['update:modelValue'],
  computed: {
    hasValue() {
      return !!this.modelValue && this.modelValue.trim() !== ''
    }
  }
}
</script>

<style scoped>
.text-field-wrapper {
  box-sizing: border-box;
  display: flex;
  gap: var(--token-spacing-8pt);
  align-items: flex-start;
  padding: var(--token-spacing-0pt);
  width: v-bind(width);
  max-width: 100%;
}

.text-field-border {
  flex: 1;
  min-height: 1px;
  min-width: 1px;
  border: 1px solid var(--token-stroke-green);
  border-style: solid;
  position: relative;
}

.text-field-content {
  box-sizing: border-box;
  display: flex;
  gap: var(--token-spacing-8pt);
  align-items: center;
  justify-content: flex-end;
  overflow: hidden;
  padding: var(--token-spacing-12pt) var(--token-spacing-16pt);
  position: relative;
  width: 100%;
  border-radius: inherit;
}

.text-field-input {
  flex: 1;
  min-height: 1px;
  min-width: 1px;
  font-family: var(--font-typeface-display);
  font-weight: var(--font-weight-700);
  font-size: var(--font-size-lg);
  line-height: var(--line-height-xl);
  color: var(--token-text-primary);
  background: transparent;
  border: none;
  outline: none;
  margin: 0;
  padding: 0;
  position: relative;
  width: 100%;
}

.text-field-input::placeholder {
  color: var(--token-text-secondary);
}

.text-field-input--placeholder {
  color: var(--token-text-secondary);
}
</style>

