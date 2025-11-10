<template>
  <div class="overall-savings">
    <div class="overall-savings__header">
      <h2 class="overall-savings__title">Overall Savings</h2>
    </div>
    
    <div class="overall-savings__content">
      <div class="overall-savings__fields">
        <!-- Column 1 -->
        <div class="overall-savings__column">
          <!-- Monthly EMI -->
          <div class="overall-savings__field">
            <span class="overall-savings__label">Monthly EMI</span>
            <span class="overall-savings__value">{{ formatCurrency(savings.totalMonthlyEMI) }}</span>
          </div>
          
          <!-- Total Amount with savings -->
          <div class="overall-savings__field-with-sub">
            <div class="overall-savings__field">
              <span class="overall-savings__label">Total Amount</span>
              <div class="overall-savings__value-group">
                <span class="overall-savings__value">{{ formatCurrency(savings.totalNewAmount) }}</span>
                <div v-if="savings.totalSavedPercent > 0" class="overall-savings__badge">
                  -{{ savings.totalSavedPercent }}%
                </div>
              </div>
            </div>
            <div v-if="savings.totalSaved > 0" class="overall-savings__subtext">
              you'll save <span class="overall-savings__subtext-highlight">{{ formatCurrency(savings.totalSaved) }}</span>
            </div>
          </div>
        </div>
        
        <!-- Column 2 -->
        <div class="overall-savings__column">
          <!-- Interest Amount with savings -->
          <div class="overall-savings__field-with-sub">
            <div class="overall-savings__field">
              <span class="overall-savings__label">Interest Amount</span>
              <div class="overall-savings__value-group">
                <span class="overall-savings__value">{{ formatCurrency(savings.totalNewInterest) }}</span>
                <div v-if="savings.interestSavedPercent > 0" class="overall-savings__badge">
                  -{{ savings.interestSavedPercent }}%
                </div>
              </div>
            </div>
            <div v-if="savings.interestSaved > 0" class="overall-savings__subtext">
              you'll save <span class="overall-savings__subtext-highlight">{{ formatCurrency(savings.interestSaved) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'OverallSavings',
  props: {
    savings: {
      type: Object,
      required: true,
      default: () => ({
        totalMonthlyEMI: 0,
        totalOriginalInterest: 0,
        totalNewInterest: 0,
        totalOriginalAmount: 0,
        totalNewAmount: 0,
        interestSaved: 0,
        totalSaved: 0,
        interestSavedPercent: 0,
        totalSavedPercent: 0
      })
    }
  },
  methods: {
    formatCurrency(num) {
      if (isNaN(num) || num === undefined) return '-';
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
.overall-savings {
  background-color: var(--token-popup-card-bg);
  border: 1px solid var(--token-stroke-green);
  border-radius: var(--token-corner-radius-4pt);
  overflow: hidden;
  width: 100%;
}

.overall-savings__header {
  padding: var(--token-spacing-16pt) var(--token-spacing-24pt);
  border-bottom: 1px solid var(--token-stroke-green);
}

.overall-savings__title {
  font-family: var(--font-typeface-display);
  font-weight: var(--font-weight-700);
  font-size: var(--font-size-lg);
  line-height: var(--line-height-xl);
  color: var(--token-text-primary);
  margin: 0;
}

.overall-savings__content {
  padding: var(--token-spacing-24pt);
}

.overall-savings__fields {
  display: flex;
  gap: var(--token-spacing-112pt);
  align-items: flex-start;
}

.overall-savings__column {
  display: flex;
  flex-direction: column;
  gap: var(--token-spacing-12pt);
}

.overall-savings__field {
  display: flex;
  gap: var(--token-spacing-0pt);
  align-items: center;
}

.overall-savings__field-with-sub {
  display: flex;
  flex-direction: column;
  gap: var(--token-spacing-4pt);
}

.overall-savings__label {
  font-family: var(--font-typeface-body);
  font-weight: var(--font-weight-500);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-18);
  color: var(--token-text-primary);
  width: 180px;
}

.overall-savings__value {
  font-family: var(--font-typeface-display);
  font-weight: var(--font-weight-700);
  font-size: var(--font-size-lg);
  line-height: var(--line-height-xl);
  color: var(--token-text-primary);
  text-align: right;
  width: 140px;
}

.overall-savings__value-group {
  display: flex;
  gap: var(--token-spacing-12pt);
  align-items: center;
}

.overall-savings__badge {
  background-color: rgba(174, 208, 182, 0.1);
  padding: var(--token-spacing-4pt);
  border-radius: var(--token-corner-radius-4pt);
  font-family: var(--font-typeface-body);
  font-weight: var(--font-weight-500);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-sm);
  color: var(--token-text-green);
  text-align: right;
  white-space: nowrap;
}

.overall-savings__subtext {
  font-family: var(--font-typeface-body);
  font-weight: var(--font-weight-400);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-sm);
  color: var(--token-text-primary);
}

.overall-savings__subtext-highlight {
  font-weight: var(--font-weight-700);
  color: var(--token-text-green);
}
</style>

