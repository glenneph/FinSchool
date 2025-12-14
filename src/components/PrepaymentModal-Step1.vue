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
            <div v-if="activeTab === 'custom'" class="prepayment-table-container">
              <table class="details-table">
                <thead>
                  <tr>
                    <th>Start Date</th>
                    <th>End Date</th>
                    <th style="text-align: right;">Prepayment Amount</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(row, index) in prepaymentRows" :key="row.id">
                    <td>
                      <div class="date-input-wrapper">
                        <div class="flatpickr-wrapper">
                          <input 
                            type="text" 
                            :ref="'startPicker_' + index"
                            class="custom-date-input flatpickr-input"
                            placeholder="Select Date"
                          >
                          <img :src="calendarIcon" class="calendar-icon-overlay" />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div class="date-input-wrapper">
                         <div class="flatpickr-wrapper">
                          <input 
                            type="text" 
                            :ref="'endPicker_' + index"
                            class="custom-date-input flatpickr-input"
                            placeholder="Select Date"
                          >
                          <img :src="calendarIcon" class="calendar-icon-overlay" />
                        </div>
                      </div>
                    </td>
                    <td class="amount-cell">
                      <div class="amount-input-wrapper">
                        <span class="currency-symbol">₹</span>
                        <input 
                          type="number" 
                          v-model="row.amount" 
                          class="custom-amount-input" 
                          placeholder="Enter Amount"
                        >
                      </div>
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
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="4">
                            <button id="add-prepayment-row-btn" class="add-row-btn" @click="addRow">
                                <span class="material-symbols-outlined">+</span> Date
                            </button>
                        </td>
                    </tr>
                </tfoot>
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
import flatpickr from 'flatpickr'
import 'flatpickr/dist/flatpickr.min.css'
import 'flatpickr/dist/themes/dark.css'

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
      prepaymentRows: [],
      pickers: {}
    }
  },
  computed: {
    longestTenure() {
      if (!this.loans || this.loans.length === 0) return 15;
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
        this.initializePrepaymentRows();
        this.showMethodModal = false;
        this.$nextTick(() => {
          this.initPickers();
        });
      } else {
        this.showMethodModal = false;
        // Optional cleanup
      }
    },
    prepaymentRows: {
      handler() {
        this.$nextTick(() => {
          this.initPickers();
        });
      },
      deep: true
    }
  },
  mounted() {
    this.initializePrepaymentRows();
  },
  methods: {
    initializePrepaymentRows() {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Normalize to midnight to avoid minDate conflicts
      const endDate = this.prepaymentEndDate;
      
      this.prepaymentRows = [
        { 
          id: Date.now(),
          startDate: today, 
          endDate: endDate, 
          amount: '' 
        }
      ];
    },
    formatDateToString(date) {
        if (!date) return '';
        const d = new Date(date);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const year = d.getFullYear();
        return `${day}-${month}-${year}`;
    },
    initPickers() {
      this.prepaymentRows.forEach((row, index) => {
        const startRef = this.$refs['startPicker_' + index];
        const endRef = this.$refs['endPicker_' + index];
        
        if (!startRef || !endRef) return;
        
        let minStartDate = new Date();
        minStartDate.setHours(0, 0, 0, 0); // Normalize to midnight
        if (index > 0) {
           const prevRow = this.prepaymentRows[index - 1];
           if (prevRow.endDate) {
               minStartDate = new Date(prevRow.endDate);
               minStartDate.setDate(minStartDate.getDate() + 1);
               // prevRow.endDate might not be midnight normalized, but let's trust it came from flatpickr
               minStartDate.setHours(0, 0, 0, 0);
           }
        }
        
        const maxDate = this.prepaymentEndDate;

        // Start Picker
        if (startRef[0] && !startRef[0]._flatpickr) {
            const startPicker = flatpickr(startRef[0], {
                dateFormat: "d-m-Y",
                defaultDate: row.startDate,
                minDate: minStartDate,
                maxDate: maxDate,
                wrap: false,
                onChange: (selectedDates) => {
                    row.startDate = selectedDates[0];
                    if (endRef[0] && endRef[0]._flatpickr) {
                        endRef[0]._flatpickr.set('minDate', selectedDates[0]);
                    }
                    this.updateConstraintsCascade(index);
                }
            });
            // Explicitly set the date to ensure it displays
            if (row.startDate) {
                startPicker.setDate(row.startDate, false);
            }
        } else if (startRef[0] && startRef[0]._flatpickr) {
            startRef[0]._flatpickr.set('minDate', minStartDate);
            startRef[0]._flatpickr.set('maxDate', maxDate);
        }

        // End Picker
        if (endRef[0] && !endRef[0]._flatpickr) {
            const endPicker = flatpickr(endRef[0], {
                dateFormat: "d-m-Y",
                defaultDate: row.endDate,
                minDate: row.startDate || minStartDate,
                maxDate: maxDate,
                wrap: false,
                onChange: (selectedDates) => {
                    row.endDate = selectedDates[0];
                    this.updateConstraintsCascade(index + 1);
                }
            });
            // Explicitly set the date to ensure it displays
            if (row.endDate) {
                endPicker.setDate(row.endDate, false);
            }
        } else if (endRef[0] && endRef[0]._flatpickr) {
             const currentMin = row.startDate || minStartDate;
             endRef[0]._flatpickr.set('minDate', currentMin);
             endRef[0]._flatpickr.set('maxDate', maxDate);
        }
      });
    },
    updateConstraintsCascade(startIndex) {
        if (startIndex >= this.prepaymentRows.length) return;
        this.$nextTick(() => {
            this.initPickers();
        });
    },
    closeModal() {
      this.showMethodModal = false
      this.$emit('close')
    },
    handleNext() {
      if (this.activeTab === 'custom') {
        const validRows = this.prepaymentRows.filter(row => {
          const amount = parseFloat(row.amount);
          return !isNaN(amount) && amount > 0 && row.startDate && row.endDate;
        });
        
        if (validRows.length === 0) {
          alert('Please add at least one valid prepayment entry with amount, start date, and end date.')
          return
        }
      }
      this.showMethodModal = true
    },
    handleMethodModalClose() {
      this.showMethodModal = false
    },
    handleMethodSubmit(selectedMethod) {
      const transformedRows = this.prepaymentRows.map(row => ({
        ...row,
        startDate: this.formatDateToString(new Date(row.startDate)),
        endDate: this.formatDateToString(new Date(row.endDate))
      }));

      const submissionData = {
        activeTab: this.activeTab,
        selectedTemplate: this.selectedTemplate,
        prepaymentRows: transformedRows,
        method: selectedMethod
      };
      
      this.showMethodModal = false
      this.$emit('close')
      this.$emit('submit', submissionData)
    },
    addRow() {
      const lastRow = this.prepaymentRows[this.prepaymentRows.length - 1];
      if (!lastRow || !lastRow.endDate) {
          alert("Please calculate the end date for the previous row first.");
          return;
      }
      
      const newStartDate = new Date(lastRow.endDate);
      newStartDate.setDate(newStartDate.getDate() + 1);
      
      const maxDate = this.prepaymentEndDate;
      if (newStartDate >= maxDate) {
          alert("No time remaining in loan tenure to add more prepayments.");
          return;
      }

      // Default end date is always the max tenure date as requested
      const newEndDate = new Date(maxDate);

      const newId = Date.now();
      
      this.prepaymentRows.push({
        id: newId,
        startDate: newStartDate,
        endDate: newEndDate,
        amount: ''
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
/* Modal Overlay & Card */
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

.modal-body {
  display: flex;
  flex-direction: column;
  gap: var(--token-spacing-32pt);
  padding: var(--token-spacing-24pt);
  overflow-y: auto;
  flex: 1;
}

/* Tabs */
.tabs-container {
  display: flex;
  gap: var(--token-spacing-8pt);
  align-items: center;
}

.tab-content {
  flex: 1;
}

/* --- Redesigned Table (Matching Reference with Tokens) --- */

.prepayment-table-container {
  border: none;
  background-color: transparent;
}

.details-table {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--token-table-bg);
  border-radius: var(--token-corner-radius-0pt);
  overflow: hidden;
}

/* Headers */
.details-table th {
  background-color: var(--token-table-header);
  color: var(--token-text-primary-alt);
  font-family: var(--font-typeface-body);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-500);
  line-height: var(--line-height-sm);
  padding: var(--token-spacing-12pt) var(--token-spacing-24pt);
  text-align: left;
  border-right: 1px solid var(--token-stroke-primary);
  border-bottom: 1px solid var(--token-stroke-primary);
}

.details-table th:last-child {
  border-right: none;
  width: 72px;
}

/* Cells */
.details-table td {
  padding: var(--token-spacing-16pt) var(--token-spacing-24pt);
  font-family: var(--font-typeface-display);
  font-weight: var(--font-weight-500);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-sm);
  border-bottom: 1px solid var(--token-stroke-primary);
  border-right: 1px solid var(--token-stroke-primary);
  vertical-align: middle;
  background-color: var(--token-table-bg);
  color: var(--token-text-primary);
}

.details-table td:last-child {
  border-right: none;
}

/* Input Styling */
.date-input-wrapper {
  display: flex;
  align-items: center;
  width: 100%;
}

.flatpickr-wrapper {
  position: relative;
  width: 100%;
  display: flex;
  align-items: center;
}

.calendar-icon-overlay {
  position: absolute;
  right: 0;
  pointer-events: none;
  width: var(--token-spacing-24pt);
  height: var(--token-spacing-24pt);
}

.custom-date-input {
  background: transparent;
  border: none;
  color: var(--token-text-primary);
  font-family: var(--font-typeface-display);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-500);
  line-height: var(--line-height-sm);
  width: 100%;
  outline: none;
  cursor: pointer;
}

.custom-date-input::placeholder {
  color: var(--token-text-secondary);
}

.amount-cell {
  text-align: right;
}

.amount-input-wrapper {
  display: flex;
  align-items: center;
  gap: var(--token-spacing-8pt);
  justify-content: space-between;
}

.currency-symbol {
  color: var(--token-text-primary);
  font-family: var(--font-typeface-body);
  font-weight: var(--font-weight-500);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-sm);
}

.custom-amount-input {
  background: transparent;
  border: none;
  color: var(--token-text-primary);
  font-family: var(--font-typeface-display);
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-500);
  line-height: var(--line-height-sm);
  width: 100%;
  text-align: right; /* Right align the text inside input */
  outline: none;
}

.custom-amount-input::placeholder {
  color: var(--token-text-secondary);
}

/* Add Row Button */
/* Add Row Button */
.add-row-btn {
  display: flex;
  align-items: center;
  gap: var(--token-spacing-8pt);
  background: none;
  border: none;
  color: var(--token-text-green);
  font-family: var(--font-typeface-body);
  /* Increased font size as requested */
  font-size: var(--font-size-md);
  font-weight: var(--font-weight-500);
  line-height: var(--line-height-lg);
  cursor: pointer;
  padding: 0;
  margin-top: var(--token-spacing-8pt);
  transition: opacity 0.2s ease;
}

.add-row-btn:hover {
  opacity: 0.8;
}

.add-row-btn:active {
  opacity: 0.6;
}

.material-symbols-outlined {
  /* Increased icon size to match larger text */
  font-size: var(--font-size-lg);
  font-weight: var(--font-weight-700);
  line-height: 1;
}

/* Delete Icon */
.delete-icon {
  width: var(--token-spacing-24pt);
  height: var(--token-spacing-24pt);
  cursor: pointer;
  /* Remove hover effect (full opacity always) */
  opacity: 1; 
}

/* Disabled state handling */
.delete-icon.disabled {
  /* No opacity change needed if the icon source itself is 'muted' (trash-muted.svg) */
  cursor: default;
}

/* Flatpickr Customization for Dark Theme via Tokens */
:deep(.flatpickr-calendar) {
  background: var(--neutral-800) !important;
  border: 1px solid var(--token-stroke-green) !important;
  box-shadow: 0 var(--values-4px) var(--values-20px) rgba(0, 0, 0, 0.5) !important;
  border-radius: var(--token-corner-radius-4pt) !important;
}

:deep(.flatpickr-day.selected) {
  background: var(--token-button-primary) !important;
  border-color: var(--token-button-primary) !important;
  color: var(--token-text-primary-alt) !important;
}

:deep(.flatpickr-day.selected:hover) {
  background: var(--token-button-primary) !important;
  border-color: var(--token-button-primary) !important;
}

:deep(.flatpickr-months .flatpickr-month) {
  color: var(--token-text-primary) !important;
  fill: var(--token-text-primary) !important;
}

:deep(.flatpickr-current-month .flatpickr-monthDropdown-months) {
  background: var(--neutral-800) !important;
  color: var(--token-text-primary) !important;
}

:deep(span.flatpickr-weekday) {
  color: var(--token-text-secondary) !important;
  font-family: var(--font-typeface-body) !important;
  font-weight: var(--font-weight-500) !important;
}

:deep(.flatpickr-day) {
  color: var(--token-text-primary) !important;
  font-family: var(--font-typeface-body) !important;
}

:deep(.flatpickr-day:hover) {
  background: var(--token-table-bg) !important;
  border-color: var(--token-stroke-green) !important;
}

:deep(.flatpickr-day.today) {
  border-color: var(--token-stroke-green) !important;
}

:deep(.flatpickr-day.today:hover) {
  background: var(--token-table-bg) !important;
}
</style>
