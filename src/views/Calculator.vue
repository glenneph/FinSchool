<template>
  <div class="app">
    <TopNav />
    
    <!-- Overall Savings (shown after prepayment calculation) -->
    <div v-if="prepaymentResults" class="overall-savings-container">
      <OverallSavings :savings="prepaymentResults.overallSavings" />
    </div>
    
    <!-- Loan Table -->
    <div class="loan-table-container">
      <div class="loan-table">
        <v-data-table
          :headers="headers"
          :items="loans"
          hide-default-footer
          class="custom-loan-table"
        >
          <template v-slot:item.name="{ item }">
            <input 
              v-if="editingLoan === item.id"
              v-model="editingName"
              @blur="saveRename(item)"
              @keyup.enter="saveRename(item)"
              @keyup.esc="cancelEdit"
              class="loan-name-input"
              ref="nameInput"
              autofocus
            />
            <span 
              v-else
              class="loan-name editable"
              @click="startEdit(item)"
              :title="'Click to rename'"
            >
              {{ item.name }}
            </span>
          </template>
          
          <template v-slot:item.principal="{ item }">
            <span class="cell-value clickable-cell" @click="editLoan(item)">{{ item.principal }}</span>
          </template>
          
          <template v-slot:item.interest="{ item }">
            <span class="cell-value clickable-cell" @click="editLoan(item)">{{ item.interest }}</span>
          </template>
          
          <template v-slot:item.interestAmount="{ item }">
            <div class="savings-cell">
              <div class="savings-cell__main">
                <span class="cell-value">{{ item.interestAmount || '-' }}</span>
                <div v-if="item.interestSavedPercent > 0" class="savings-badge">
                  -{{ item.interestSavedPercent }}%
                </div>
              </div>
              <div v-if="item.interestSaved > 0" class="savings-subtext">
                you'll save <span class="savings-highlight">{{ formatCurrency(item.interestSaved) }}</span>
              </div>
            </div>
          </template>
          
          <template v-slot:item.emi="{ item }">
            <span class="cell-value clickable-cell" @click="editLoan(item)">{{ item.emi }}</span>
          </template>
          
          <template v-slot:item.tenure="{ item }">
            <div class="savings-cell">
              <span class="cell-value clickable-cell" @click="editLoan(item)">{{ item.tenure }}</span>
              <div v-if="item.tenureSavedMonths > 0" class="savings-subtext">
                you'll save <span class="savings-highlight">{{ getTenureSavedText(item) }}</span>
              </div>
            </div>
          </template>
          
          <template v-slot:item.actions="{ item }">
            <img 
              :src="deleteIcon" 
              alt="Delete" 
              class="delete-icon"
              @click="deleteLoan(item)"
            />
          </template>
          
          <template v-slot:bottom>
            <div class="add-loan-row" @click="addLoan">
              <div class="add-loan-content">
                <img :src="plusIcon" alt="Add" class="plus-icon" />
                <span class="add-loan-text">Add Loan</span>
              </div>
            </div>
          </template>
        </v-data-table>
      </div>

      <!-- Check Prepayments Button -->
      <Button @click="handlePrepaymentClick" />
    </div>

    <!-- Prepayment Modal -->
    <PrepaymentModalStep1 
      :is-open="showPrepaymentModal"
      :loans="loans"
      @close="showPrepaymentModal = false"
      @submit="handlePrepaymentSubmit"
    />
    
    <!-- Loan Amortization Tables (shown after prepayment calculation) -->
    <div v-if="prepaymentResults" class="loan-amortizations-container">
      <LoanAmortization 
        v-for="loan in loans" 
        :key="loan.id"
        :loan="loan"
        :loan-result="getLoanResult(loan.id)"
      />
    </div>
    
    <!-- Reset Prepayments Button -->
    <div v-if="prepaymentResults" class="reset-prepayments-container">
      <button class="reset-prepayments-btn" @click="resetPrepayments">
        Reset Prepayments
      </button>
    </div>
  </div>
</template>

<script>
import TopNav from '../components/common/TopNav.vue'
import Button from '../components/common/Button.vue'
import PrepaymentModalStep1 from '../components/PrepaymentModal-Step1.vue'
import OverallSavings from '../components/OverallSavings.vue'
import LoanAmortization from '../components/LoanAmortization.vue'
import { calculateMultiLoanPrepayments, formatToIndianCurrency } from '../utils/multiLoanPrepayment.js'

export default {
  name: 'Calculator',
  components: {
    TopNav,
    Button,
    PrepaymentModalStep1,
    OverallSavings,
    LoanAmortization
  },
  data() {
    return {
      plusIcon: '/assets/plus.svg',
      deleteIcon: '/assets/trash.svg',
      editingLoan: null,
      editingName: '',
      showPrepaymentModal: false,
      prepaymentResults: null,
      headers: [
        { title: '', key: 'name', align: 'start', sortable: false, width: 'auto' },
        { title: 'Principal', key: 'principal', align: 'end', sortable: false, width: 'auto' },
        { title: 'Interest', key: 'interest', align: 'end', sortable: false, width: 'auto' },
        { title: 'Interest Amount', key: 'interestAmount', align: 'end', sortable: false, width: 'auto' },
        { title: 'EMI', key: 'emi', align: 'end', sortable: false, width: 'auto' },
        { title: 'Tenure', key: 'tenure', align: 'end', sortable: false, width: 'auto' },
        { title: '', key: 'actions', align: 'center', sortable: false, width: '60px' }
      ],
      loans: []
    }
  },
  mounted() {
    // Load saved loans from localStorage
    this.loadSavedLoans()
    
    // If no loans exist, add a default one for demo
    if (this.loans.length === 0) {
      this.loans = [
        { 
          id: Date.now(),
          name: 'Housing Loan',
          principal: '₹14,54,615',
          interest: '18%',
          emi: '₹19,566',
          tenure: '15 yrs'
        }
      ]
    }
  },
  methods: {
    loadSavedLoans() {
      try {
        const savedLoans = JSON.parse(localStorage.getItem('savedLoans') || '[]')
        if (savedLoans.length > 0) {
          // Ensure all loans have IDs
          this.loans = savedLoans.map(loan => ({
            ...loan,
            id: loan.id || Date.now() + Math.random()
          }))
        }
      } catch (error) {
        console.error('Error loading saved loans:', error)
      }
    },
    startEdit(item) {
      this.editingLoan = item.id
      this.editingName = item.name
      // Focus the input on next tick
      this.$nextTick(() => {
        const input = this.$refs.nameInput
        if (input && input[0]) {
          input[0].focus()
          input[0].select()
        }
      })
    },
    saveRename(item) {
      if (this.editingName.trim() === '') {
        this.editingName = item.name
        this.cancelEdit()
        return
      }
      
      // Find and update the loan
      const loan = this.loans.find(l => l.id === item.id)
      if (loan) {
        loan.name = this.editingName.trim()
        // Save to localStorage
        localStorage.setItem('savedLoans', JSON.stringify(this.loans))
      }
      
      this.cancelEdit()
    },
    cancelEdit() {
      this.editingLoan = null
      this.editingName = ''
    },
    editLoan(item) {
      // Store the loan data for editing in localStorage
      localStorage.setItem('editingLoanData', JSON.stringify(item))
      // Redirect to calculator page
      window.location.href = '/calculator/index.html'
    },
    handlePrepaymentClick() {
      console.log('Check Prepayments clicked!')
      this.showPrepaymentModal = true
    },
    handlePrepaymentSubmit(data) {
      console.log('Prepayment data submitted:', data)
      
      // Calculate multi-loan prepayments
      const results = calculateMultiLoanPrepayments(this.loans, data, data.method)
      
      if (results) {
        this.prepaymentResults = results
        
        // Update loans with calculated savings data
        this.loans = this.loans.map((loan) => {
          const result = results.loanResults.find(r => r.id === loan.id)
          if (result) {
            return {
              ...loan,
              interestAmount: formatToIndianCurrency(result.newInterest),
              interestSaved: result.interestSaved,
              interestSavedPercent: result.originalInterest > 0 
                ? Math.round((result.interestSaved / result.originalInterest) * 100) 
                : 0,
              tenureSavedMonths: result.tenureSavedMonths,
              tenureSavedYears: Math.floor(result.tenureSavedMonths / 12),
              tenureSavedRemainingMonths: result.tenureSavedMonths % 12
            }
          }
          return loan
        })
      }
      
      this.showPrepaymentModal = false
    },
    addLoan() {
      console.log('Add Loan clicked!')
      // Open EMI Calculator tool in the same page
      window.location.href = '/calculator/index.html'
    },
    deleteLoan(item) {
      console.log('Delete loan:', item)
      const index = this.loans.indexOf(item)
      if (index > -1) {
        this.loans.splice(index, 1)
        // Update localStorage after deletion
        localStorage.setItem('savedLoans', JSON.stringify(this.loans))
        // Clear prepayment results if deleting a loan
        this.prepaymentResults = null
      }
    },
    formatCurrency(num) {
      return formatToIndianCurrency(num)
    },
    getTenureSavedText(item) {
      const years = item.tenureSavedYears || 0
      const months = item.tenureSavedRemainingMonths || 0
      const parts = []
      if (years > 0) parts.push(`${years} yr${years > 1 ? 's' : ''}`)
      if (months > 0) parts.push(`${months} mo${months > 1 ? 's' : ''}`)
      return parts.join(' & ') || '0 yrs'
    },
    resetPrepayments() {
      this.prepaymentResults = null
      // Reset loan data to remove savings info
      this.loans = this.loans.map(loan => {
        const { interestAmount, interestSaved, interestSavedPercent, tenureSavedMonths, tenureSavedYears, tenureSavedRemainingMonths, ...cleanLoan } = loan
        return cleanLoan
      })
    },
    getLoanResult(loanId) {
      if (!this.prepaymentResults || !this.prepaymentResults.loanResults) return null;
      return this.prepaymentResults.loanResults.find(r => r.id === loanId);
    }
  }
}
</script>

<style scoped>
.app {
  min-height: 100vh;
  background-color: var(--token-surface);
}

.loan-table-container {
  display: flex;
  flex-direction: column;
  gap: var(--token-spacing-40pt);
  padding: var(--token-spacing-64pt) var(--token-spacing-80pt);
  width: 100%;
  box-sizing: border-box;
}

.loan-table {
  background-color: var(--token-table-bg);
  border: 1px solid var(--token-stroke-primary);
  box-sizing: border-box;
}

/* Vuetify Table Customization */
.custom-loan-table {
  background-color: transparent !important;
}

/* Remove Vuetify default styles */
:deep(.v-table) {
  background-color: transparent !important;
}

:deep(.v-table__wrapper) {
  border: none !important;
}

/* Header Styles */
:deep(.v-data-table-header) {
  background-color: var(--token-table-header) !important;
}

:deep(.v-data-table-header th) {
  background-color: var(--token-table-header) !important;
  border-right: 1px solid var(--token-stroke-primary) !important;
  border-bottom: none !important;
  padding: var(--token-spacing-8pt) var(--token-spacing-24pt) !important;
  font-family: var(--font-typeface-body) !important;
  font-weight: 500 !important;
  font-size: var(--font-size-sm) !important;
  line-height: var(--line-height-18) !important;
  color: var(--token-text-primary-alt) !important;
  height: auto !important;
}

:deep(.v-data-table-header th .v-data-table-header__content) {
  color: var(--token-text-primary-alt) !important;
}

:deep(.v-data-table-header th span) {
  color: var(--token-text-primary-alt) !important;
}

:deep(.v-data-table-header th:last-child) {
  border-right: none !important;
  width: 60px !important;
  min-width: 60px !important;
  max-width: 60px !important;
  padding: var(--token-spacing-8pt) var(--token-spacing-12pt) !important;
}

/* Stronger header targeting to match Vuetify DOM */
.custom-loan-table :deep(thead) {
  background-color: var(--token-table-header) !important;
}

.custom-loan-table :deep(thead tr) {
  background-color: var(--token-table-header) !important;
}

.custom-loan-table :deep(thead th) {
  background-color: var(--token-table-header) !important;
  color: var(--token-text-primary-alt) !important; /* black */
  font-family: var(--font-typeface-body) !important; /* DM Sans */
  font-weight: var(--font-weight-500) !important; /* 500 */
  font-size: var(--font-size-sm) !important; /* 16px */
  line-height: var(--line-height-18) !important; /* 24px */
  padding: var(--token-spacing-8pt) var(--token-spacing-24pt) !important;
  border-right: 1px solid var(--token-stroke-primary) !important;
  height: 38px !important; /* Figma header height */
}

.custom-loan-table :deep(thead th .v-data-table-header__content),
.custom-loan-table :deep(thead th *),
.custom-loan-table :deep(thead th span) {
  color: var(--token-text-primary-alt) !important;
}

/* Right-align numeric headers (2..5), keep first left and last fixed width */
.custom-loan-table :deep(thead th:nth-child(n+2):not(:last-child)) {
  text-align: right !important;
}

.custom-loan-table :deep(thead th:first-child) {
  text-align: left !important;
}

/* Data Row Styles */
:deep(.v-data-table__td) {
  border-right: 1px solid var(--token-stroke-primary) !important;
  border-bottom: 1px solid var(--token-stroke-primary) !important;
  padding: var(--token-spacing-16pt) var(--token-spacing-24pt) !important;
  height: auto !important;
}

:deep(.v-data-table__td:last-child) {
  border-right: none !important;
  width: 60px !important;
  min-width: 60px !important;
  max-width: 60px !important;
  padding: var(--token-spacing-16pt) var(--token-spacing-12pt) !important;
}

:deep(tbody tr) {
  background-color: var(--token-table-bg) !important;
}

:deep(tbody tr:hover) {
  background-color: var(--token-table-bg) !important;
}

.loan-name {
  font-family: var(--font-typeface-display);
  font-weight: 500;
  font-size: var(--font-size-md);
  line-height: var(--line-height-lg);
  color: var(--token-text-primary);
}

.loan-name.editable {
  cursor: pointer;
  padding: 4px 8px;
  margin: -4px -8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.loan-name.editable:hover {
  background-color: rgba(174, 208, 182, 0.1);
}

.loan-name-input {
  font-family: var(--font-typeface-display);
  font-weight: 500;
  font-size: var(--font-size-md);
  line-height: var(--line-height-lg);
  color: var(--token-text-primary);
  background-color: transparent;
  border: none;
  padding: 4px 8px;
  outline: none;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.cell-value {
  font-family: var(--font-typeface-display);
  font-weight: 500;
  font-size: var(--font-size-md);
  line-height: var(--line-height-lg);
  color: var(--token-text-primary);
}

.cell-value.clickable-cell {
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.cell-value.clickable-cell:hover {
  opacity: 0.7;
}

.delete-icon {
  width: 24px;
  height: 24px;
  cursor: pointer;
}

/* Add Loan Row */
.add-loan-row {
  width: 100%;
}

.add-loan-content {
  display: flex;
  align-items: center;
  gap: var(--token-spacing-8pt);
  padding: var(--token-spacing-16pt) var(--token-spacing-24pt);
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.add-loan-content:hover {
  opacity: 0.8;
}

.plus-icon {
  width: 24px;
  height: 24px;
}

.add-loan-text {
  font-family: var(--font-typeface-display);
  font-weight: 700;
  font-size: var(--font-size-md);
  line-height: var(--line-height-lg);
  color: var(--token-text-green);
}

/* Overall Savings Container */
.overall-savings-container {
  padding: 0 var(--token-spacing-80pt);
  padding-top: var(--token-spacing-64pt);
}

/* Savings Cell Styles */
.savings-cell {
  display: flex;
  flex-direction: column;
  gap: var(--token-spacing-4pt);
  align-items: flex-end;
}

.savings-cell__main {
  display: flex;
  gap: var(--token-spacing-12pt);
  align-items: center;
}

.savings-badge {
  background-color: rgba(174, 208, 182, 0.1);
  padding: var(--token-spacing-4pt);
  border-radius: var(--token-corner-radius-4pt);
  font-family: var(--font-typeface-body);
  font-weight: var(--font-weight-500);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-sm);
  color: var(--token-text-green);
  white-space: nowrap;
}

.savings-subtext {
  font-family: var(--font-typeface-body);
  font-weight: var(--font-weight-400);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-sm);
  color: var(--token-text-primary);
  text-align: right;
}

.savings-highlight {
  font-weight: var(--font-weight-700);
  color: var(--token-text-green);
}

/* Loan Amortizations Container */
.loan-amortizations-container {
  padding: 0 var(--token-spacing-80pt);
  display: flex;
  flex-direction: column;
  gap: var(--token-spacing-32pt);
}

/* Reset Prepayments Button */
.reset-prepayments-container {
  padding: 0 var(--token-spacing-80pt) var(--token-spacing-64pt);
}

.reset-prepayments-btn {
  background-color: var(--token-button-primary);
  padding: var(--token-spacing-16pt) var(--token-spacing-20pt);
  border: none;
  cursor: pointer;
  font-family: var(--font-typeface-display);
  font-weight: var(--font-weight-500);
  font-size: var(--font-size-md);
  line-height: var(--line-height-lg);
  color: var(--token-text-primary-alt);
  transition: opacity 0.2s ease;
}

.reset-prepayments-btn:hover {
  opacity: 0.8;
}

</style>

