<template>
  <div
    v-if="loanResult && loanResult.schedule"
    class="loan-amortization"
  >
    <div class="amortization-header">
      <h3 class="amortization-title">
        {{ loan.name }} - Amortization Schedule
      </h3>
    </div>
    
    <div class="amortization-table-wrapper">
      <table class="amortization-table">
        <tbody>
          <tr 
            v-for="year in years" 
            :key="year" 
            class="year-row"
            :class="{ 'open': expandedYear === year }"
            @click="toggleYear(year)"
          >
            <td :colspan="hasPrepayments ? 6 : 5">
              <div class="year-cell">
                <span>{{ year }}</span>
                <img 
                  :src="chevronIcon" 
                  alt="Toggle" 
                  class="chevron-icon"
                  :class="{ 'rotated': expandedYear === year }"
                >
              </div>
            </td>
          </tr>
          
          <!-- Expanded month details -->
          <template v-if="expandedYear">
            <tr class="details-container-row">
              <td :colspan="hasPrepayments ? 6 : 5">
                <table class="details-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>To Principal</th>
                      <th>To Interest</th>
                      <th v-if="hasPrepayments">
                        Pre-payment
                      </th>
                      <th>Total Payment</th>
                      <th>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-for="(row, index) in expandedMonths"
                      :key="index"
                    >
                      <td>{{ row.month }}</td>
                      <td>{{ formatCurrency(row.principal) }}</td>
                      <td>{{ formatCurrency(row.interest) }}</td>
                      <td v-if="hasPrepayments">
                        {{ formatCurrency(row.prepayment) }}
                      </td>
                      <td>{{ formatCurrency(row.total) }}</td>
                      <td>{{ formatCurrency(row.balance) }}</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr class="summary-row">
                      <td>Summary</td>
                      <td>{{ formatCurrency(yearSummary.principal) }}</td>
                      <td>{{ formatCurrency(yearSummary.interest) }}</td>
                      <td v-if="hasPrepayments">
                        {{ formatCurrency(yearSummary.prepayment) }}
                      </td>
                      <td>{{ formatCurrency(yearSummary.total) }}</td>
                      <td>-</td>
                    </tr>
                  </tfoot>
                </table>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
export default {
  name: 'LoanAmortization',
  props: {
    loan: {
      type: Object,
      required: true
    },
    loanResult: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      chevronIcon: '/assets/chevron.svg',
      expandedYear: null
    }
  },
  computed: {
    years() {
      if (!this.loanResult || !this.loanResult.schedule) return [];
      
      const yearSet = new Set();
      this.loanResult.schedule.forEach(row => {
        if (row.year) yearSet.add(row.year);
      });
      
      return Array.from(yearSet).sort((a, b) => a - b);
    },
    hasPrepayments() {
      if (!this.loanResult || !this.loanResult.schedule) return false;
      return this.loanResult.schedule.some(row => row.prepayment > 0);
    },
    expandedMonths() {
      if (!this.expandedYear || !this.loanResult || !this.loanResult.schedule) return [];
      return this.loanResult.schedule.filter(row => row.year === this.expandedYear);
    },
    yearSummary() {
      if (!this.expandedMonths || this.expandedMonths.length === 0) {
        return { principal: 0, interest: 0, prepayment: 0, total: 0 };
      }
      
      return this.expandedMonths.reduce((summary, row) => {
        summary.principal += row.principal || 0;
        summary.interest += row.interest || 0;
        summary.prepayment += row.prepayment || 0;
        summary.total += row.total || 0;
        return summary;
      }, { principal: 0, interest: 0, prepayment: 0, total: 0 });
    }
  },
  methods: {
    toggleYear(year) {
      this.expandedYear = this.expandedYear === year ? null : year;
    },
    formatCurrency(num) {
      if (isNaN(num) || num === undefined || num === null) return '-';
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(num);
    }
  }
}
</script>

<style scoped>
.loan-amortization {
  margin-top: var(--token-spacing-24pt);
  background-color: var(--token-table-bg);
  border: 1px solid var(--token-stroke-primary);
  border-radius: var(--token-corner-radius-4pt);
  overflow: hidden;
}

.amortization-header {
  padding: var(--token-spacing-16pt) var(--token-spacing-24pt);
  border-bottom: 1px solid var(--token-stroke-primary);
}

.amortization-title {
  font-family: var(--font-typeface-display);
  font-weight: var(--font-weight-700);
  font-size: var(--font-size-md);
  line-height: var(--line-height-lg);
  color: var(--token-text-primary);
  margin: 0;
}

.amortization-table-wrapper {
  overflow-x: auto;
}

.amortization-table {
  width: 100%;
  border-collapse: collapse;
}

/* Year Row */
.year-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.year-row:hover {
  background-color: rgba(174, 208, 182, 0.05);
}

.year-row td {
  padding: var(--token-spacing-16pt) var(--token-spacing-24pt);
  border-bottom: 1px solid var(--token-stroke-primary);
}

.year-cell {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-family: var(--font-typeface-display);
  font-weight: var(--font-weight-500);
  font-size: var(--font-size-md);
  line-height: var(--line-height-lg);
  color: var(--token-text-primary);
}

.chevron-icon {
  width: 24px;
  height: 24px;
  transition: transform 0.2s ease;
}

.chevron-icon.rotated {
  transform: rotate(180deg);
}

/* Details Container */
.details-container-row td {
  padding: 0;
  border-bottom: 1px solid var(--token-stroke-primary);
}

.details-table {
  width: 100%;
  border-collapse: collapse;
}

.details-table thead {
  background-color: var(--token-table-header);
}

.details-table th {
  padding: var(--token-spacing-8pt) var(--token-spacing-24pt);
  font-family: var(--font-typeface-body);
  font-weight: var(--font-weight-500);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-18);
  color: var(--token-text-primary-alt);
  text-align: left;
  border-right: 1px solid var(--token-stroke-primary);
}

.details-table th:last-child {
  border-right: none;
}

.details-table tbody td {
  padding: var(--token-spacing-16pt) var(--token-spacing-24pt);
  font-family: var(--font-typeface-display);
  font-weight: var(--font-weight-500);
  font-size: var(--font-size-md);
  line-height: var(--line-height-lg);
  color: var(--token-text-primary);
  border-right: 1px solid var(--token-stroke-primary);
  border-bottom: 1px solid var(--token-stroke-primary);
}

.details-table tbody td:last-child {
  border-right: none;
}

.details-table tbody tr:last-child td {
  border-bottom: none;
}

/* Summary Row in Footer */
.details-table tfoot {
  background-color: var(--token-table-bg);
}

.summary-row td {
  padding: var(--token-spacing-16pt) var(--token-spacing-24pt);
  font-family: var(--font-typeface-display);
  font-weight: var(--font-weight-700);
  font-size: var(--font-size-md);
  line-height: var(--line-height-lg);
  color: var(--token-text-primary);
  border-right: 1px solid var(--token-stroke-primary);
  border-top: 1px solid var(--token-stroke-primary);
}

.summary-row td:last-child {
  border-right: none;
}
</style>

