<template>
  <div class="home-page">
    <TopNav />
    <div class="container">
      <div class="cards-row">
        <div
          class="card"
          @click="navigateToHealthInsurance"
        >
          <div class="card-image-wrapper">
            <img
              :src="healthInsuranceImage"
              alt="Health Insurance"
              class="card-image"
            >
          </div>
          <div class="card-content">
            <div class="card-text">
              <p class="card-title">
                Health Insurance Cover Amount Calculator
              </p>
            </div>
          </div>
        </div>
        <div
          class="card"
          @click="navigateToCalculator"
        >
          <div class="card-image-wrapper">
            <img
              :src="emiCalculatorImage"
              alt="EMI Calculator"
              class="card-image"
            >
          </div>
          <div class="card-content">
            <div class="card-text">
              <p class="card-title">
                EMI Calculator
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template> 

<script>
import TopNav from '../components/common/TopNav.vue'

export default {
  name: 'HomePage',
  components: {
    TopNav
  },
  data() {
    return {
      healthInsuranceImage: '/assets/health-insurance-calculator-banner.webp',
      emiCalculatorImage: '/assets/emi-calculator-banner.webp'
    }
  },
  methods: {
    navigateToHealthInsurance() {
      this.$router.push('/health-insurance')
    },
    navigateToCalculator() {
      this.$router.push('/calculator')
    }
  }
}
</script>

<style scoped>
.home-page {
  min-height: 100vh;
  background-color: var(--token-surface);
  position: relative;
}

.container {
  position: absolute;
  top: 74px;
  left: 0;
  right: 0;
  padding: var(--token-spacing-64pt) var(--token-spacing-80pt);
  box-sizing: border-box;
}

.cards-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--token-spacing-24pt);
  align-items: flex-start;
}

.card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  width: 350px;
  min-height: 271px;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.card:hover {
  opacity: 0.8;
}

.card-image-wrapper {
  aspect-ratio: 2 / 1;
  position: relative;
  width: 100%;
  overflow: hidden;
  pointer-events: none;
}

.card-image {
  position: absolute;
  height: 133.6%;
  left: 0;
  top: -5.43%;
  width: 100%;
  object-fit: cover;
}

.card-content {
  background-color: var(--token-multioption-card-bg);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--token-spacing-20pt);
  align-items: flex-start;
  padding: var(--token-spacing-12pt);
  width: 350px;
  flex: 1;
}

.card-text {
  display: flex;
  flex-direction: column;
  gap: var(--token-spacing-8pt);
  align-items: flex-start;
}

.card-title {
  font-family: var(--font-typeface-display);
  font-weight: var(--font-weight-700);
  font-size: var(--font-size-lg);
  line-height: var(--line-height-xl);
  color: var(--token-text-primary);
  margin: 0;
  max-width: 268px;
}

.appointment-card-wrapper {
  width: 343px;
  flex-shrink: 0;
}

/* Responsive styles */
@media (max-width: 640px) {
  .container {
    padding: var(--token-spacing-64pt) var(--token-spacing-40pt);
  }
  
  .card {
    width: 100%;
    max-width: 350px;
  }
  
  .card-content {
    width: 100%;
  }
  
  .appointment-card-wrapper {
    width: 100%;
    max-width: 343px;
  }
}

@media (max-width: 430px) {
  .container {
    padding: var(--token-spacing-64pt) var(--token-spacing-20pt);
  }
}
</style>

