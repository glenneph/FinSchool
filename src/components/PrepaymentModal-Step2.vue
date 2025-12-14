<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-card">
      <!-- Header using PopUp component -->
      <PopUp 
        type="Header"
        title="Check Prepayments"
        subtitle="(Step 2/2)"
        :close-icon="closeIcon"
        @close="closeModal"
      />

      <!-- Modal Body Content -->
      <div class="modal-body">
        <div class="methods-container">
          <RadioOption 
            label="Snowball Method"
            :is-active="selectedMethod === 'snowball'"
            @select="selectedMethod = 'snowball'"
          />
          <RadioOption 
            label="Avalanche Method"
            :is-active="selectedMethod === 'avalanche'"
            @select="selectedMethod = 'avalanche'"
          />
        </div>
      </div>

      <!-- Footer using PopUp component -->
      <PopUp 
        type="Footer"
        button-text="Submit"
        @action="handleSubmit"
      />
    </div>
  </div>
</template>

<script>
import PopUp from './common/PopUp.vue'
import RadioOption from './common/RadioOption.vue'

export default {
  name: 'PrepaymentModalStep2',
  components: {
    PopUp,
    RadioOption
  },
  props: {
    isOpen: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      closeIcon: '/assets/cancel.svg',
      selectedMethod: 'snowball'
    }
  },
  methods: {
    closeModal() {
      console.log('=== STEP 2: Close clicked (going back to Step 1) ===');
      this.$emit('close')
    },
    handleSubmit() {
      console.log('=== STEP 2: Submit clicked ===');
      console.log('Selected Method:', this.selectedMethod);
      this.$emit('submit', this.selectedMethod)
      console.log('Emitted submit event with method:', this.selectedMethod);
    }
  }
}
</script>

<style scoped>
/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(17.5px);
  -webkit-backdrop-filter: blur(17.5px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: var(--token-spacing-80pt);
}

/* Modal Card */
.modal-card {
  background-color: var(--token-popup-card-bg);
  border: 1px solid var(--token-stroke-green);
  border-radius: var(--token-corner-radius-4pt);
  width: 100%;
  max-width: 1280px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Modal Body */
.modal-body {
  display: flex;
  flex-direction: column;
  padding: var(--token-spacing-24pt);
  overflow-y: auto;
  flex: 1;
}

/* Methods Container */
.methods-container {
  display: flex;
  gap: var(--token-spacing-16pt);
  align-items: flex-start;
  flex-wrap: wrap;
}
</style>

