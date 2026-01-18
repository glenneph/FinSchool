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
          @click:row="handleRowClick"
        >
          <template v-slot:item.name="{ item }">
            <input 
              v-if="editingLoan === item.id"
              v-model="editingName"
              @blur="saveRename(item)"
              @keyup.enter="saveRename(item)"
              @keyup.esc="cancelEdit"
              @click.stop
              class="loan-name-input"
              ref="nameInput"
              autofocus
              size="1"
            />
            <span 
              v-else
              class="loan-name editable"
              @click.stop="startEdit(item)"
              :title="'Click to rename'"
            >
              {{ item.name }}
            </span>
          </template>
          
          <template v-slot:item.principal="{ item }">
            <span class="cell-value">{{ item.principal }}</span>
          </template>
          
          <template v-slot:item.interest="{ item }">
            <span class="cell-value">{{ item.interest }}</span>
          </template>
          
          <template v-slot:item.interestAmount="{ item }">
            <div class="savings-cell">
              <div class="savings-cell__main">
                <span class="cell-value">{{ item.interestAmount || '-' }}</span>
                <div v-if="item.interestSavedPercent > 0" class="savings-badge">
                  -{{ item.interestSavedPercent }}%
                </div>
              </div>
              <div v-if="item.interestSaved > 1" class="savings-subtext">
                you'll save <span class="savings-highlight">{{ formatCurrency(item.interestSaved) }}</span>
              </div>
            </div>
          </template>
          
          <template v-slot:item.emi="{ item }">
            <span class="cell-value">{{ item.emi }}</span>
          </template>
          
          <template v-slot:item.tenure="{ item }">
            <div class="savings-cell">
              <span class="cell-value">{{ item.tenure }}</span>
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
              @click.stop="deleteLoan(item)"
            />
          </template>
          
          <template v-slot:bottom>
            <div class="add-loan-row" @click="addLoan" v-if="!prepaymentResults">
              <div class="add-loan-content">
                <img :src="plusIcon" alt="Add" class="plus-icon" />
                <span class="add-loan-text">Add Loan</span>
              </div>
            </div>
          </template>

          <template v-slot:no-data>
            <div class="no-data-text">No data available</div>
          </template>
        </v-data-table>
      </div>

      <!-- Prepayment Buttons Container -->
      <div class="prepayment-buttons-container">
        <!-- Check Prepayments Button -->
        <Button @click="handlePrepaymentClick" />
        
        <!-- Reset Prepayments Button -->
        <Button v-if="prepaymentResults" variant="Secondary" @click="resetPrepayments">
          Reset Prepayments
        </Button>
      </div>
    </div>

    <!-- Prepayment Modal -->
    <PrepaymentModalStep1 
      :is-open="showPrepaymentModal"
      :loans="loans"
      @close="showPrepaymentModal = false"
      @submit="handlePrepaymentSubmit"
    />
  </div>

</template>

<script>
import TopNav from '../components/common/TopNav.vue'
import Button from '../components/common/Button.vue'
import PrepaymentModalStep1 from '../components/PrepaymentModal-Step1.vue'
import OverallSavings from '../components/OverallSavings.vue'
import { calculateMultiLoanPrepayments, formatToIndianCurrency, parseCurrency, parseInterest, parseTenure, sortLoansByMethod } from '../utils/multiLoanPrepayment.js'

export default {
  name: 'Calculator',
  components: {
    TopNav,
    Button,
    PrepaymentModalStep1,
    OverallSavings
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
    // Test if imports are working
    console.log('=== Testing Imports ===')
    console.log('parseCurrency:', typeof parseCurrency)
    console.log('parseInterest:', typeof parseInterest)
    console.log('parseTenure:', typeof parseTenure)
    console.log('formatToIndianCurrency:', typeof formatToIndianCurrency)
    
    // Test parsing
    console.log('Test parseCurrency("₹14,54,615"):', parseCurrency('₹14,54,615'))
    console.log('Test parseInterest("18%"):', parseInterest('18%'))
    console.log('Test parseTenure("15 yrs"):', parseTenure('15 yrs'))
    
    // Load saved loans from localStorage
    this.loadSavedLoans()
    
    // Load prepayment results from localStorage to persist across navigation
    this.loadPrepaymentResults()
    
    // If no loans exist, do nothing (start empty)
    if (this.loans.length === 0) {
      console.log('No loans found, starting with empty table')
    }
  },
  methods: {
    calculateInterestAmount(loan) {
      try {
        console.log('calculateInterestAmount called for:', loan.name)
        console.log('Loan data:', JSON.stringify(loan, null, 2))
        
        // Parse loan values using imported functions
        const principal = parseCurrency(loan.principal)
        const interestRate = parseInterest(loan.interest)
        const tenure = parseTenure(loan.tenure)
        
        console.log('Parsed values:', { principal, interestRate, tenure })
        
        if (!principal || !interestRate || !tenure) {
          console.log('Missing required values, returning -')
          return '-'
        }
        
        // Calculate EMI
        const r = (interestRate / 12) / 100
        const n = Math.round(tenure * 12)
        
        console.log('Calculation params:', { r, n })
        
        let emi = 0
        if (r > 0 && n > 0) {
          const pow = Math.pow(1 + r, n)
          if (isFinite(pow) && (pow - 1) !== 0) {
            emi = (principal * r * pow) / (pow - 1)
          }
        } else {
          emi = principal / Math.max(1, n)
        }
        
        console.log('Calculated EMI:', emi)
        
        // Calculate total interest
        const totalInterest = (emi * n) - principal
        
        console.log('Total Interest:', totalInterest)
        
        const formatted = formatToIndianCurrency(totalInterest)
        console.log('Formatted Interest Amount:', formatted)
        
        return formatted
      } catch (error) {
        console.error('Error calculating interest:', error)
        console.error('Error stack:', error.stack)
        return '-'
      }
    },
    loadSavedLoans() {
      try {
        console.log('=== Loading Saved Loans ===')
        const savedLoans = JSON.parse(localStorage.getItem('savedLoans') || '[]')
        console.log('Raw saved loans:', savedLoans)
        
        if (savedLoans.length > 0) {
          // Use saved interest amount, or calculate as fallback for old loans
          this.loans = savedLoans.map(loan => {
            console.log('Processing loan:', loan.name)
            console.log('Saved interestAmount:', loan.interestAmount)
            
            // Use the saved interestAmount if available, otherwise calculate it
            const interestAmount = loan.interestAmount || this.calculateInterestAmount(loan)
            
            console.log('Final interestAmount for', loan.name, ':', interestAmount)
            
            return {
              ...loan,
              id: loan.id || Date.now() + Math.random(),
              interestAmount: interestAmount
            }
          })
          console.log('=== Final loaded loans ===')
          console.log(JSON.stringify(this.loans, null, 2))
        }
      } catch (error) {
        console.error('Error loading saved loans:', error)
        console.error('Error stack:', error.stack)
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
      
      // Store prepayment context if prepayment results exist
      if (this.prepaymentResults && this.prepaymentResults.loanResults) {
        const loanResult = this.prepaymentResults.loanResults.find(r => r.id === item.id)
        
        if (loanResult) {
          // Determine loan position in sorted sequence
          const sortedLoans = sortLoansByMethod(this.loans, this.prepaymentResults.method)
          const loanPosition = sortedLoans.findIndex(l => l.id === item.id) + 1
          
          // Calculate cumulative months from previous loans
          let previousLoansMonths = 0
          for (let i = 0; i < loanPosition - 1; i++) {
            const prevLoan = sortedLoans[i]
            const prevLoanResult = this.prepaymentResults.loanResults.find(r => r.id === prevLoan.id)
            if (prevLoanResult && prevLoanResult.schedule) {
              previousLoansMonths += prevLoanResult.schedule.length
            }
          }
          
          // Extract FULL prepayment schedule
          // No index shifting needed anymore because the engine (multiLoanPrepayment.js)
          // now correctly generates schedules starting from Today (Date 0) with '0' prepayments
          // for the months where the money was used by higher priority loans.
          const prepaymentSchedule = []
          if (loanResult.schedule) {
            loanResult.schedule.forEach((entry, index) => {
              if (entry.prepayment > 0) {
                prepaymentSchedule.push({
                  monthIndex: index,
                  amount: entry.prepayment,
                  year: entry.year,
                  month: entry.month
                })
              }
            })
          }
          
          // Store prepayment context
          const prepaymentContext = {
            loanId: item.id,
            loanPosition: loanPosition,
            prepaymentMethod: this.prepaymentResults.method,
            prepaymentSchedule: prepaymentSchedule,
            previousLoansMonths: 0, // No longer relevant for timeline
            monthsBeforePrepaymentsStart: 0, // No longer forced wait
            loanResult: loanResult,
            startDate: new Date().toISOString()
          }
          
          localStorage.setItem('prepaymentContext', JSON.stringify(prepaymentContext))
          console.log('Stored prepayment context:', prepaymentContext)
        }
      } else {
        // Clear any existing prepayment context if no prepayments exist
        localStorage.removeItem('prepaymentContext')
      }
      
      // Redirect to calculator page
      window.location.href = '/emi-tool/index.html'
    },
    handlePrepaymentClick() {
      console.log('Check Prepayments clicked!')
      this.showPrepaymentModal = true
    },
    handlePrepaymentSubmit(data) {
      console.log('=== CALCULATOR: Received prepayment submission ===');
      console.log('Data received:', JSON.stringify(data, null, 2));
      console.log('Current loans:', this.loans.length);
      console.log('Loans data:', JSON.stringify(this.loans, null, 2));
      
      // Validate custom prepayments
      if (data.activeTab === 'custom' && (!data.prepaymentRows || data.prepaymentRows.length === 0)) {
        console.warn('Validation failed: No custom prepayment rows');
        alert('Please add at least one prepayment entry in Custom prepayments.')
        return
      }
      
      console.log('Starting calculation...');
      console.log('Active tab:', data.activeTab);
      console.log('Selected method:', data.method);
      
      // Calculate multi-loan prepayments (works for both custom and 16 EMI rule)
      const results = calculateMultiLoanPrepayments(this.loans, data, data.method)
      
      console.log('Calculation completed. Results:', results);
      
      if (!results || !results.loanResults || results.loanResults.length === 0) {
        console.error('=== CALCULATION FAILED ===');
        console.error('Results object:', results);
        console.error('Has loanResults?', !!results?.loanResults);
        console.error('LoanResults length:', results?.loanResults?.length);
        alert('Failed to calculate prepayments. Please check your loan data and try again.')
        console.error('Prepayment calculation failed:', results)
        return // Don't close modal if calculation failed
      }
      
      console.log('=== CALCULATION SUCCEEDED ===');
      console.log('Number of loan results:', results.loanResults.length);
      console.log('Overall savings:', results.overallSavings);
      
      this.prepaymentResults = results
      
      // Update loans with calculated savings data immediately for UI feedback
      const sortedLoans = sortLoansByMethod(this.loans, data.method)
      this.loans = sortedLoans.map((loan) => {
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

      // Defer heavy localStorage writes to next tick to prevent UI blocking
      setTimeout(() => {
        try {
          // Save prepayment results
          localStorage.setItem('prepaymentResults', JSON.stringify(results))
          
          // Save updated loans
          localStorage.setItem('savedLoans', JSON.stringify(this.loans))
          
          console.log('Background: Saved results to localStorage');
        } catch (e) {
          console.error('Background Save Failed:', e);
        }
      }, 50);

      console.log('=== UI UPDATED ===');
    },
    addLoan() {
      console.log('Add Loan clicked!')
      // Open EMI Calculator tool in the same page
      window.location.href = '/emi-tool/index.html'
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
        localStorage.removeItem('prepaymentResults')
        localStorage.removeItem('prepaymentContext')
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
      // Clear prepayment results from localStorage
      localStorage.removeItem('prepaymentResults')
      localStorage.removeItem('prepaymentContext')
      
      // Reset loan data to remove savings info but keep the original interestAmount
      this.loans = this.loans.map(loan => {
        const { interestSaved, interestSavedPercent, tenureSavedMonths, tenureSavedYears, tenureSavedRemainingMonths, ...cleanLoan } = loan
        // Recalculate the original interest amount (without prepayments)
        cleanLoan.interestAmount = this.calculateInterestAmount(loan)
        return cleanLoan
      })
      
      // Save updated loans to localStorage
      localStorage.setItem('savedLoans', JSON.stringify(this.loans))
    },
    loadPrepaymentResults() {
      try {
        const savedResults = localStorage.getItem('prepaymentResults')
        if (savedResults) {
          const results = JSON.parse(savedResults)
          this.prepaymentResults = results
          
          // Restore loan savings data from prepayment results
          if (results.loanResults) {
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
          
          console.log('Loaded prepayment results from localStorage')
        }
      } catch (error) {
        console.error('Error loading prepayment results:', error)
      }
    },
    getLoanResult(loanId) {
      if (!this.prepaymentResults || !this.prepaymentResults.loanResults) return null;
      return this.prepaymentResults.loanResults.find(r => r.id === loanId);
    },
    handleRowClick(event, { item }) {
      // Check if the clicked cell is the first one (Name column)
      const cell = event.target.closest('td');
      // cellIndex 0 is the Name column
      if (cell && cell.cellIndex === 0) {
        this.startEdit(item);
      } else {
        // For all other cells, go to the calculator
        this.editLoan(item);
      }
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
  cursor: pointer;
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
  /* Match the normal cell width */
  display: block;
  width: 100% !important;
  max-width: 100% !important;
  min-width: 0 !important;
  box-sizing: border-box;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Keep the first column constrained without allowing the input to stretch it */
:deep(.v-data-table__td:first-child) {
  overflow: hidden;
  white-space: nowrap;
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
  color: var(--token-text-green); /* Using green for subtext too as per design */
}

/* No Data Styling */
.no-data-text {
  font-family: var(--font-typeface-body);
  font-weight: var(--font-weight-500);
  font-size: var(--font-size-md);
  color: var(--token-text-primary);
  padding: var(--token-spacing-24pt);
  border-bottom: 1px solid var(--token-stroke-primary);
  text-align: center;
}

.custom-loan-table :deep(.v-data-table-rows-no-data td) {
  padding: 0 !important;
}


.savings-highlight {
  font-weight: var(--font-weight-700);
  color: var(--token-text-green);
}

/* Prepayment Buttons */
.prepayment-buttons-container {
  display: flex;
  gap: var(--token-spacing-24pt);
  padding: var(--token-spacing-0pt);
}

</style>

