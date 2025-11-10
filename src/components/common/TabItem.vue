<template>
  <div 
    class="tab-item" 
    :class="stateClass"
    data-name="TabItem"
  >
    <p class="tab-item-text">
      <slot>{{ label }}</slot>
    </p>
  </div>
</template>

<script>
export default {
  name: 'TabItem',
  props: {
    /**
     * The state of the tab item
     * @values Active, Inactive
     */
    state: {
      type: String,
      default: 'Active',
      validator: (value) => ['Active', 'Inactive'].includes(value)
    },
    /**
     * The text label to display (optional if using slot)
     */
    label: {
      type: String,
      default: ''
    }
  },
  computed: {
    stateClass() {
      return `tab-item--${this.state.toLowerCase()}`
    }
  }
}
</script>

<style scoped>
.tab-item {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 0 var(--token-spacing-4pt) 0;
  min-width: 100px;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  box-sizing: border-box;
}

/* Active State - with bottom border */
.tab-item--active {
  border-bottom: 1px solid var(--token-table-header);
}

.tab-item-text {
  font-family: var(--font-typeface-body);
  font-size: var(--font-size-md);
  line-height: var(--line-height-lg);
  text-align: center;
  margin: 0;
  transition: all 0.2s ease;
  flex: 1;
}

/* Active State Typography */
.tab-item--active .tab-item-text {
  font-weight: var(--font-weight-600);
  color: var(--token-text-primary);
}

/* Inactive State Typography */
.tab-item--inactive .tab-item-text {
  font-weight: var(--font-weight-500);
  color: var(--token-text-secondary);
}

/* Hover effect for inactive state */
.tab-item--inactive:hover .tab-item-text {
  color: var(--token-text-primary);
  opacity: 0.8;
}
</style>

