<template>
  <div class="appointment-card">
    <!-- Top Section: Doctor Information -->
    <div class="card-top-section">
      <!-- Image Placeholder -->
      <div class="image-placeholder">
        <img v-if="image" :src="image" :alt="doctorName" class="doctor-image" />
      </div>

      <!-- Content Section -->
      <div class="content-section">
        <!-- Guarantee Badge -->
        <div class="guarantee-badge">
          <span class="badge-text">{{ guaranteeText }}</span>
        </div>

        <!-- Doctor Info and Close Button -->
        <div class="doctor-info-row">
          <!-- Doctor Details -->
          <div class="doctor-details">
            <p class="doctor-name">{{ doctorName }}</p>
            <p class="doctor-specialty">{{ specialty }}</p>
          </div>

          <!-- Close Button -->
          <button class="close-button" @click="handleClose" aria-label="Close">
            <svg 
              width="24" 
              height="24" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              class="close-icon"
            >
              <path 
                d="M18 6L6 18M6 6L18 18" 
                stroke="currentColor" 
                stroke-width="2" 
                stroke-linecap="round" 
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Divider -->
    <div class="divider"></div>

    <!-- Bottom Section: Date & Time -->
    <div class="card-bottom-section">
      <span class="date-label">Date & Time:</span>
      <span class="date-value">{{ formattedDateTime }}</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppointmentCard',
  props: {
    /**
     * Doctor's name
     */
    doctorName: {
      type: String,
      required: true
    },
    /**
     * Doctor's specialty
     */
    specialty: {
      type: String,
      required: true
    },
    /**
     * Appointment date and time (Date object or ISO string)
     */
    dateTime: {
      type: [Date, String],
      required: true
    },
    /**
     * Image URL for doctor's photo (optional)
     */
    image: {
      type: String,
      default: null
    },
    /**
     * Guarantee badge text
     */
    guaranteeText: {
      type: String,
      default: 'ON TIME GURANTEE'
    }
  },
  computed: {
    formattedDateTime() {
      if (!this.dateTime) return '';
      
      const date = typeof this.dateTime === 'string' 
        ? new Date(this.dateTime) 
        : this.dateTime;
      
      if (isNaN(date.getTime())) return '';
      
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      
      const dayName = days[date.getDay()];
      const day = date.getDate();
      const month = months[date.getMonth()];
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      const displayMinutes = minutes.toString().padStart(2, '0');
      
      // Format: "Sunday 11th Nov, 2:00 PM"
      const ordinal = this.getOrdinalSuffix(day);
      return `${dayName} ${day}${ordinal} ${month}, ${displayHours}:${displayMinutes} ${ampm}`;
    }
  },
  methods: {
    handleClose() {
      this.$emit('close');
    },
    getOrdinalSuffix(day) {
      if (day > 3 && day < 21) return 'th';
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    }
  }
}
</script>

<style scoped>
.appointment-card {
  background-color: var(--token-table-bg);
  border: 0.5px solid var(--token-stroke-green);
  border-radius: var(--token-corner-radius-12pt);
  padding: var(--token-spacing-16pt);
  display: flex;
  flex-direction: column;
  gap: var(--token-spacing-16pt);
  box-sizing: border-box;
}

/* Top Section */
.card-top-section {
  display: flex;
  gap: var(--token-spacing-12pt);
  align-items: flex-start;
  width: 100%;
}

/* Image Placeholder */
.image-placeholder {
  width: 69px;
  height: 69px;
  background-color: #cdedff;
  border-radius: var(--token-corner-radius-12pt);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.doctor-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Content Section */
.content-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: var(--token-spacing-8pt);
  min-width: 0;
}

/* Guarantee Badge */
.guarantee-badge {
  background: linear-gradient(135deg, rgba(94, 201, 145, 1) 0%, rgba(76, 163, 120, 1) 100%);
  border-radius: var(--token-corner-radius-4pt);
  padding: 2px 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: fit-content;
}

.badge-text {
  font-family: var(--font-typeface-body);
  font-weight: var(--font-weight-700);
  font-size: var(--font-size-3xs);
  line-height: var(--line-height-2xs);
  color: var(--token-text-primary);
  white-space: nowrap;
  letter-spacing: 0;
}

/* Doctor Info Row */
.doctor-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  gap: var(--token-spacing-4pt);
}

.doctor-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0;
  flex: 1;
  min-width: 0;
}

.doctor-name {
  font-family: var(--font-typeface-body);
  font-weight: var(--font-weight-600);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-md);
  color: var(--token-text-primary);
  margin: 0;
  white-space: nowrap;
  letter-spacing: -0.42px;
}

.doctor-specialty {
  font-family: var(--font-typeface-body);
  font-weight: var(--font-weight-500);
  font-size: var(--font-size-2xs);
  line-height: var(--line-height-xs);
  color: var(--token-text-green);
  margin: 0;
  white-space: nowrap;
  letter-spacing: -0.36px;
}

/* Close Button */
.close-button {
  width: 32px;
  height: 32px;
  border-radius: var(--token-corner-radius-16pt);
  background: linear-gradient(135deg, rgba(237, 74, 59, 1) 0%, rgba(215, 51, 36, 1) 100%);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  flex-shrink: 0;
  transition: opacity 0.2s ease, transform 0.1s ease;
}

.close-button:hover {
  opacity: 0.9;
}

.close-button:active {
  transform: scale(0.95);
}

.close-icon {
  width: 24px;
  height: 24px;
  color: var(--token-text-primary);
  stroke: currentColor;
}

/* Divider */
.divider {
  height: 0;
  width: 100%;
  border-top: 1px dashed var(--token-stroke-primary);
  margin: 0;
}

/* Bottom Section */
.card-bottom-section {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  font-family: var(--font-typeface-body);
  font-weight: var(--font-weight-500);
  font-size: var(--font-size-xs);
  line-height: var(--line-height-sm);
  color: var(--token-text-secondary);
  white-space: nowrap;
}

.date-label {
  flex-shrink: 0;
}

.date-value {
  text-align: right;
  flex-shrink: 0;
}
</style>

