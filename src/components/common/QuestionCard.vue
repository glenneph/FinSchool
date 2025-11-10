<template>
  <div class="question-card" :style="{ width: width }">
    <div class="question-header">
      <div class="icon-wrapper">
        <div class="icon-container">
          <img :src="icon" alt="Icon" class="question-icon" />
        </div>
      </div>
      <p class="question-text">{{ label }}</p>
    </div>
    <div class="question-content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'QuestionCard',
  props: {
    label: {
      type: String,
      default: 'City you live in'
    },
    icon: {
      type: String,
      default: '/assets/location-01.svg'
    },
    width: {
      type: String,
      default: '316px'
    }
  }
}
</script>

<style scoped>
.question-card {
  background-color: var(--token-multioption-card-bg);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--token-spacing-20pt);
  align-items: flex-start;
  padding: var(--token-spacing-24pt);
  border-radius: var(--token-corner-radius-4pt);
  width: 450px;
}

.question-header {
  box-sizing: border-box;
  display: flex;
  gap: var(--token-spacing-8pt);
  align-items: center;
  width: 100%;
  position: relative;
  flex-shrink: 0;
}

.icon-wrapper {
  background-color: var(--token-icon-green);
  overflow: hidden;
  position: relative;
  border-radius: 42px;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
}

.icon-container {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  overflow: hidden;
  width: 16px;
  height: 16px;
}

.question-icon {
  width: 100%;
  height: 100%;
  display: block;
  max-width: none;
  object-fit: contain;
}

.question-text {
  font-family: var(--font-typeface-body);
  font-weight: var(--font-weight-500);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-18);
  color: var(--token-text-primary);
  margin: 0;
  white-space: nowrap;
  position: relative;
  flex-shrink: 0;
}

.question-content {
  box-sizing: border-box;
  display: flex;
  gap: var(--token-spacing-8pt);
  align-items: flex-start;
  width: 100%;
  position: relative;
  flex-shrink: 0;
}

/* Responsive styles */
@media (max-width: 640px) {
  .question-card {
    width: 100%;
    max-width: 450px;
  }
}
</style>

