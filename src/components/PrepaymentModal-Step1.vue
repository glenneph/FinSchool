<template>
  <div>
    <!-- Step 1: Prepayment Modal -->
    <div v-if="isOpen && !showMethodModal" class="modal-overlay" @click.self="closeModal">
      <div class="modal-card">
      <!-- Header using PopUp component -->
      <PopUp 
        type="Header"
        title="Check Prepayments"
        subtitle="(Step 1/2)"
        :close-icon="closeIcon"
        @close="closeModal"
      />

      <!-- Modal Body Content -->
      <div class="modal-body">
        <!-- Tabs using TabItem component -->
        <div class="tabs-container">
        <TabItem 
          :state="activeTab === 'custom' ? 'Active' : 'Inactive'"
          label="Custom"
          @click="activeTab = 'custom'"
        />
          <TabItem 
            :state="activeTab === 'templates' ? 'Active' : 'Inactive'"
            label="Templates"
            @click="activeTab = 'templates'"
          />
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Custom Tab -->
          <div v-if="activeTab === 'custom'" class="custom-table-container">
            <table class="prepayment-table">
              <thead>
                <tr>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th class="amount-header">Prepayment Amount</th>
                  <th class="actions-header"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, index) in prepaymentRows" :key="row.id">
                  <td class="date-cell">
                    <span class="date-text">{{ row.startDate }}</span>
                    <img :src="calendarIcon" alt="Calendar" class="calendar-icon" />
                  </td>
                  <td class="date-cell">
                    <span class="date-text">{{ row.endDate }}</span>
                    <img :src="calendarIcon" alt="Calendar" class="calendar-icon" />
                  </td>
                  <td class="amount-cell">
                    <span class="rupee-symbol">₹</span>
                    <span class="amount-text">{{ row.amount }}</span>
                  </td>
                  <td class="actions-cell">
                    <img 
                      :src="index === 0 ? deleteIconDisabled : deleteIcon" 
                      alt="Delete" 
                      class="delete-icon"
                      :class="{ 'disabled': index === 0 }"
                      @click="index !== 0 && deleteRow(index)"
                    />
                  </td>
                </tr>
                <tr class="add-row">
                  <td colspan="4">
                    <button class="add-date-btn" @click="addRow">
                      <img :src="addIcon" alt="Add" class="add-icon" />
                      <span class="add-text">Date</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Templates Tab -->
          <div v-if="activeTab === 'templates'" class="templates-content">
            <RadioOption 
              label="16 EMI Rule"
              :is-active="selectedTemplate === '16-emi-rule'"
              @select="selectedTemplate = '16-emi-rule'"
            />
          </div>
        </div>
      </div>

      <!-- Footer using PopUp component -->
      <PopUp 
        type="Footer"
        button-text="Next"
        @action="handleNext"
      />
      </div>
    </div>

    <!-- Step 2: Method Selection Modal -->
    <PrepaymentModalStep2 
      :is-open="showMethodModal"
      @close="handleMethodModalClose"
      @submit="handleMethodSubmit"
    />
  </div>
</template>

<script>
import PopUp from './common/PopUp.vue'
import TabItem from './common/TabItem.vue'
import RadioOption from './common/RadioOption.vue'
import PrepaymentModalStep2 from './PrepaymentModal-Step2.vue'

export default {
  name: 'PrepaymentModalStep1',
  components: {
    PopUp,
    TabItem,
    RadioOption,
    PrepaymentModalStep2
  },
  props: {
    isOpen: {
      type: Boolean,
      default: false
    },
    loans: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      activeTab: 'custom',
      closeIcon: '/assets/cancel.svg',
      calendarIcon: '/assets/calendar.svg',
      deleteIcon: '/assets/trash.svg',
      deleteIconDisabled: '/assets/trash-muted.svg',
      addIcon: '/assets/plus.svg',
      selectedTemplate: '16-emi-rule',
      showMethodModal: false,
      prepaymentRows: []
    }
  },
  computed: {
    longestTenure() {
      if (!this.loans || this.loans.length === 0) return 15;
      
      // Find the loan with longest tenure
      const maxTenure = Math.max(...this.loans.map(loan => {
        const tenureStr = loan.tenure || '0 yrs';
        return parseFloat(tenureStr.replace('yrs', '').trim()) || 0;
      }));
      
      return maxTenure;
    },
    prepaymentEndDate() {
      const today = new Date();
      const endDate = new Date(today);
      endDate.setFullYear(endDate.getFullYear() + this.longestTenure);
      return endDate;
    }
  },
  watch: {
    isOpen(newVal) {
      if (newVal) {
        // Reinitialize when modal opens
        this.initializePrepaymentRows();
        this.showMethodModal = false;
      }
    }
  },
  mounted() {
    this.initializePrepaymentRows();
  },
  methods: {
    initializePrepaymentRows() {
      // Initialize with one default row
      const today = new Date();
      const endDate = this.prepaymentEndDate;
      
      this.prepaymentRows = [
        { 
          id: 1, 
          startDate: this.formatDate(today), 
          endDate: this.formatDate(endDate), 
          amount: '10000' 
        }
      ];
    },
    formatDate(date) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}-${month}-${year}`;
    },
    closeModal() {
      this.showMethodModal = false
      this.$emit('close')
    },
    handleNext() {
      // Move to step 2: Method selection
      this.showMethodModal = true
      console.log('Next clicked with data:', this.prepaymentRows)
    },
    handleMethodModalClose() {
      // Close method modal and go back to step 1
      this.showMethodModal = false
    },
    handleMethodSubmit(selectedMethod) {
      // Submit final data
      console.log('Final submission:', {
        activeTab: this.activeTab,
        selectedTemplate: this.selectedTemplate,
        prepaymentRows: this.prepaymentRows,
        method: selectedMethod
      })
      this.showMethodModal = false
      this.$emit('submit', {
        activeTab: this.activeTab,
        selectedTemplate: this.selectedTemplate,
        prepaymentRows: this.prepaymentRows,
        method: selectedMethod
      })
      this.$emit('close')
    },
    addRow() {
      const newId = Math.max(...this.prepaymentRows.map(r => r.id)) + 1
      this.prepaymentRows.push({
        id: newId,
        startDate: '26-12-2027',
        endDate: '26-12-2028',
        amount: '10000'
      })
    },
    deleteRow(index) {
      if (index > 0) {
        this.prepaymentRows.splice(index, 1)
      }
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
  gap: var(--token-spacing-32pt);
  padding: var(--token-spacing-24pt);
  overflow-y: auto;
  flex: 1;
}

/* Tabs Container */
.tabs-container {
  display: flex;
  gap: var(--token-spacing-8pt);
  align-items: center;
}

/* Tab Content */
.tab-content {
  flex: 1;
}

/* Prepayment Table */
.custom-table-container {
  border: 1px solid var(--token-stroke-primary);
  background-color: var(--token-table-bg);
}

.prepayment-table {
  width: 100%;
  border-collapse: collapse;
}

/* Table Header */
.prepayment-table thead {
  background-color: var(--token-table-header);
}

.prepayment-table th {
  padding: var(--token-spacing-8pt) var(--token-spacing-24pt);
  font-family: var(--font-typeface-body);
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-500);
  line-height: var(--line-height-18);
  color: var(--token-text-primary-alt);
  text-align: left;
  border-right: 1px solid var(--token-stroke-primary);
  height: 38px;
  box-sizing: border-box;
  width: 250px;
}

.prepayment-table th:last-child {
  border-right: none;
  width: 72px;
}

.prepayment-table th.amount-header {
  text-align: right;
}

/* Table Body */
.prepayment-table tbody tr:not(.add-row) td {
  padding: var(--token-spacing-16pt) var(--token-spacing-24pt);
  font-family: var(--font-typeface-display);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-500);
  line-height: var(--line-height-lg);
  color: var(--token-text-primary);
  border-right: 1px solid var(--token-stroke-primary);
  border-bottom: 1px solid var(--token-stroke-primary);
  height: 62px;
  box-sizing: border-box;
  width: 250px;
}

.prepayment-table tbody tr:not(.add-row) td:last-child {
  border-right: none;
  width: 72px;
}

/* Date Cell */
.date-cell {
  position: relative;
}

.date-cell .date-text {
  display: inline-block;
  margin-right: var(--token-spacing-8pt);
}

.date-cell .calendar-icon {
  width: 24px;
  height: 24px;
  vertical-align: middle;
}

/* Amount Cell */
.amount-cell {
  text-align: right;
}

.amount-cell .rupee-symbol {
  margin-right: var(--token-spacing-8pt);
}

.amount-cell .amount-text {
  display: inline;
}

/* Actions Cell */
.actions-cell {
  display: flex;
  align-items: center;
  justify-content: center;
}

.delete-icon {
  width: 24px;
  height: 24px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.delete-icon:hover:not(.disabled) {
  opacity: 0.7;
}

.delete-icon.disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

/* Add Row */
.add-row td {
  padding: var(--token-spacing-16pt) var(--token-spacing-24pt);
  border: none;
  height: 60px;
  box-sizing: border-box;
}

.add-date-btn {
  display: flex;
  align-items: center;
  gap: var(--token-spacing-8pt);
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  font-family: var(--font-typeface-display);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-700);
  line-height: var(--line-height-lg);
  color: var(--token-text-green);
  transition: opacity 0.2s ease;
}

.add-date-btn:hover {
  opacity: 0.8;
}

.add-icon {
  width: 20px;
  height: 20px;
}

.add-text {
  white-space: nowrap;
}

/* Templates Content */
.templates-content {
  display: flex;
  flex-direction: column;
  gap: var(--token-spacing-16pt);
  align-items: flex-start;
}
</style>

