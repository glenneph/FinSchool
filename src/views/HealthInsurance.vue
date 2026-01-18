<template>
  <div class="health-insurance-page">
    <TopNav />
    <div class="container">
      <div class="cards-row">
        <QuestionCard
          label="City you live in"
          :icon="locationIcon"
          width="316px"
        >
          <TextField 
            v-model="selectedCity"
            placeholder="Enter Location"
            width="100%"
          />
        </QuestionCard>
      </div>
      
      <div class="result-card">
        <div class="result-header">
          <p class="result-title">
            Result
          </p>
        </div>
        <div class="result-content">
          <div
            v-if="isLoading"
            class="loading-state"
          >
            <p class="result-text">
              Generating health insurance recommendations...
            </p>
          </div>
          <div
            v-else-if="error"
            class="error-state"
          >
            <p class="result-text error-text">
              {{ error }}
            </p>
          </div>
          <div
            v-else-if="aiResponse"
            class="ai-response"
          >
            <div
              class="result-text"
              v-html="formatResponse(aiResponse)"
            />
          </div>
          <div
            v-else
            class="placeholder-state"
          >
            <p class="result-text">
              [AI Generate Content]
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import TopNav from '../components/common/TopNav.vue'
import QuestionCard from '../components/common/QuestionCard.vue'
import TextField from '../components/common/TextField.vue'

export default {
  name: 'HealthInsurance',
  components: {
    TopNav,
    QuestionCard,
    TextField
  },
  data() {
    return {
      locationIcon: '/assets/location-01.svg',
      selectedCity: null,
      aiResponse: null,
      isLoading: false,
      error: null,
      debounceTimer: null
    }
  },
  watch: {
    selectedCity(newValue) {
      // Clear previous debounce timer
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer)
      }

      // Reset states
      this.aiResponse = null
      this.error = null

      // Debounce API call - wait 1 second after user stops typing
      if (newValue && newValue.trim().length > 0) {
        this.debounceTimer = setTimeout(() => {
          this.fetchAIResponse(newValue.trim())
        }, 1000)
      }
    }
  },
  beforeUnmount() {
    // Clear debounce timer on component unmount
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
  },
  methods: {
    async fetchAIResponse(city) {
      this.isLoading = true
      this.error = null

      try {
        // Get API key from environment variable
        const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY

        if (!apiKey) {
          throw new Error('Google AI API key is not configured. Please add VITE_GOOGLE_AI_API_KEY to your .env file.')
        }

        // Log API key prefix for debugging (first 10 chars only for security)
        console.log('Using API key:', apiKey.substring(0, 10) + '...')
        console.log('API key length:', apiKey.length)

        // First, list all available models with this API key
        console.log('Fetching available models from API...')
        const modelsResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
        )
        
        if (!modelsResponse.ok) {
          throw new Error('Failed to fetch available models. Please check your API key.')
        }

        const modelsData = await modelsResponse.json()
        console.log('All available models:', modelsData)
        
        // Find all models that support generateContent
        const supportedModels = modelsData.models?.filter(m => 
          m.supportedGenerationMethods?.includes('generateContent')
        ) || []
        
        console.log('Models supporting generateContent:', supportedModels.map(m => m.name))
        
        if (supportedModels.length === 0) {
          throw new Error('No models available with generateContent support. Please check your API key permissions.')
        }

        // Prefer gemini-1.5-flash or gemini-1.5-pro, fallback to any available
        let selectedModel = supportedModels.find(m => m.name.includes('gemini-1.5-flash'))
          || supportedModels.find(m => m.name.includes('gemini-1.5-pro'))
          || supportedModels.find(m => m.name.includes('gemini'))
          || supportedModels[0]
        
        // Extract just the model name (remove 'models/' prefix)
        const modelName = selectedModel.name.replace('models/', '')
        console.log('Selected model to use:', modelName)

        // Use only v1 API (not v1beta)
        const modelsToTry = [
          { name: modelName, version: 'v1' }
        ]

        let response = null
        let lastError = null

        // Try each model/version combination until one works
        for (const model of modelsToTry) {
          try {
            console.log(`Trying model: ${model.name} with ${model.version}`)
            response = await fetch(
              `https://generativelanguage.googleapis.com/${model.version}/models/${model.name}:generateContent?key=${apiKey}`,
              {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  contents: [{
                    parts: [{
                      text: `For someone living in ${city}, India, provide the following information:

1. What is the average cost of heart disease treatment (including procedures like angioplasty, bypass surgery, and related hospital stays) in ${city}? Please provide this as a specific number in Indian Rupees (₹).

2. Based on this cost, calculate the recommended health insurance cover amount using the formula: Cover Amount = (Average cost of heart disease treatment) × 2

3. Provide a brief explanation (2-3 sentences) about why this cover amount is recommended for ${city}.

Please format your response clearly with the cost and cover amount prominently displayed.`
                    }]
                  }]
                })
              }
            )

            if (response.ok) {
              console.log(`Success with model: ${model.name} (${model.version})`)
              break
            } else {
              const errorData = await response.json().catch(() => ({}))
              lastError = errorData.error?.message || `Status ${response.status}`
              console.log(`Failed with ${model.name} (${model.version}): ${lastError}`)
            }
          } catch (err) {
            lastError = err.message
            console.log(`Error trying ${model.name} (${model.version}): ${err.message}`)
          }
        }

        if (!response || !response.ok) {
          throw new Error(lastError || 'All model attempts failed. Please check your API key and ensure the Generative Language API is enabled in your Google Cloud project.')
        }

        const data = await response.json()
        
        if (data.candidates && data.candidates[0] && data.candidates[0].content) {
          const rawResponse = data.candidates[0].content.parts[0].text
          
          // Parse the response to extract cost and calculate cover amount
          const parsedData = this.parseAIResponse(rawResponse, city)
          this.aiResponse = parsedData
        } else {
          throw new Error('Unexpected response format from AI API')
        }
      } catch (err) {
        console.error('Error fetching AI response:', err)
        this.error = err.message || 'Failed to generate AI response. Please try again.'
      } finally {
        this.isLoading = false
      }
    },
    parseAIResponse(text, city) {
      if (!text) return null

      // Try to extract the cost from the response
      // Look for patterns like ₹X, Rs. X, X lakhs, X crores, etc.
      const costPatterns = [
        /₹\s*([\d,]+(?:\.[\d]+)?)\s*(?:lakh|lakhs|L|Lakh|Lakhs)?/gi,
        /Rs\.?\s*([\d,]+(?:\.[\d]+)?)\s*(?:lakh|lakhs|L|Lakh|Lakhs)?/gi,
        /([\d,]+(?:\.[\d]+)?)\s*(?:lakh|lakhs|L|Lakh|Lakhs)\s*(?:rupees|Rs|₹)?/gi,
        /₹\s*([\d,]+(?:\.[\d]+)?)/gi,
        /Rs\.?\s*([\d,]+(?:\.[\d]+)?)/gi
      ]

      let extractedCost = null
      let costText = ''

      for (const pattern of costPatterns) {
        const matches = text.match(pattern)
        if (matches && matches.length > 0) {
          // Get the first match and extract the number
          const match = matches[0]
          const numberMatch = match.match(/[\d,]+(?:\.[\d]+)?/)
          if (numberMatch) {
            let number = parseFloat(numberMatch[0].replace(/,/g, ''))
            
            // Check if it's in lakhs
            if (match.toLowerCase().includes('lakh')) {
              number = number * 100000 // Convert lakhs to actual rupees
            } else if (match.toLowerCase().includes('crore')) {
              number = number * 10000000 // Convert crores to actual rupees
            }
            
            extractedCost = number
            costText = match
            break
          }
        }
      }

      // If we found a cost, calculate cover amount
      let coverAmount = null
      if (extractedCost) {
        coverAmount = extractedCost * 2
      }

      return {
        rawText: text,
        cost: extractedCost,
        costText: costText,
        coverAmount: coverAmount,
        city: city
      }
    },
    formatResponse(data) {
      if (!data) return ''
      
      // If data is a string (fallback), format it normally
      if (typeof data === 'string') {
        return data
          .split('\n\n')
          .map(paragraph => {
            if (paragraph.trim().startsWith('-') || paragraph.trim().match(/^\d+\./)) {
              return `<p style="font-family: var(--font-typeface-body); font-weight: var(--font-weight-400); margin: 0 0 12px 0;">${paragraph.trim()}</p>`
            }
            return `<p style="font-family: var(--font-typeface-body); font-weight: var(--font-weight-400); margin: 0 0 12px 0;">${paragraph.trim()}</p>`
          })
          .join('')
          .replace(/\n/g, '<br>')
      }

      // Format structured response
      let html = ''
      // Display cost of heart disease treatment
      if (data.costText) {
        html += `
          <div style="margin-bottom: 24px;">
            <p style="font-family: var(--font-typeface-body); font-weight: var(--font-weight-400); margin: 0 0 8px 0; color: var(--token-text-primary);">Average Cost of Heart Disease Treatment in ${data.city}:</p>
            <p style="font-family: var(--font-typeface-body); font-size: var(--font-size-md); font-weight: var(--font-weight-600); margin: 0; color: var(--token-text-green);">${data.costText}</p>
          </div>
        `
      }

      // Display suggested cover amount
      if (data.coverAmount) {
        const coverAmountFormatted = this.formatCurrency(data.coverAmount)
        html += `
          <div style="margin-bottom: 24px;">
            <p style="font-family: var(--font-typeface-body); font-weight: var(--font-weight-400); margin: 0 0 8px 0; color: var(--token-text-primary);">Recommended Health Insurance Cover Amount:</p>
            <p style="font-family: var(--font-typeface-body); font-size: var(--font-size-md); font-weight: var(--font-weight-600); margin: 0; color: var(--token-text-green);">₹${coverAmountFormatted}</p>
            <p style="font-family: var(--font-typeface-body); font-size: 14px; font-weight: var(--font-weight-400); margin: 8px 0 0 0; color: var(--token-text-secondary);">(Calculated as: ${data.costText} × 2)</p>
          </div>
        `
      }

      // Add explanation from AI (if available)
      if (data.rawText) {
        // Try to extract explanation part (remove cost mentions)
        let explanation = data.rawText
        // Remove the cost and cover amount mentions to get just the explanation
        explanation = explanation.replace(new RegExp(data.costText, 'gi'), '')
        if (data.coverAmount) {
          explanation = explanation.replace(new RegExp(this.formatCurrency(data.coverAmount), 'gi'), '')
        }
        
        if (explanation.trim().length > 50) {
          html += `
            <div style="margin-bottom: 24px;">
              <p style="font-family: var(--font-typeface-body); font-weight: var(--font-weight-400); margin: 0 0 8px 0; color: var(--token-text-primary);">${explanation.trim()}</p>
            </div>
          `
        }
      }

      // Add disclaimer
      html += `
        <div style="margin-bottom: 24px;">
          <p style="font-family: var(--font-typeface-body); font-size: 12px; font-weight: var(--font-weight-400); margin: 0; color: var(--token-text-secondary); font-style: italic;">
            <strong>Disclaimer:</strong> This is a general recommendation based on average costs. Please conduct your own research and consult with insurance advisors to determine the most suitable health insurance cover for your specific needs and circumstances.
          </p>
        </div>
      `

      return html
    },
    formatCurrency(amount) {
      // Format number with Indian numbering system (lakhs, crores)
      if (amount >= 10000000) {
        return (amount / 10000000).toFixed(2) + ' Crores'
      } else if (amount >= 100000) {
        return (amount / 100000).toFixed(2) + ' Lakhs'
      } else {
        return amount.toLocaleString('en-IN')
      }
    }
  }
}
</script>

<style scoped>
.health-insurance-page {
  min-height: 100vh;
  background-color: var(--token-surface);
  position: relative;
}

.container {
  position: absolute;
  top: 64px;
  left: 0;
  right: 0;
  padding: var(--token-spacing-64pt) var(--token-spacing-80pt);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--token-spacing-40pt);
  min-height: 999px;
}

.cards-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--token-spacing-24pt);
  align-items: flex-start;
  width: 100%;
}

.result-card {
  background-color: var(--token-popup-card-bg);
  border: 1px solid var(--token-stroke-green);
  border-radius: var(--token-corner-radius-4pt);
  width: 100%;
  overflow: hidden;
  position: relative;
}

.result-header {
  border-bottom: 1px solid var(--token-stroke-green);
  box-sizing: border-box;
  display: flex;
  gap: var(--token-spacing-8pt);
  align-items: center;
  padding: var(--token-spacing-16pt) var(--token-spacing-24pt);
  width: 100%;
}

.result-title {
  font-family: var(--font-typeface-display);
  font-weight: var(--font-weight-700);
  font-size: var(--font-size-lg);
  line-height: var(--line-height-xl);
  color: var(--token-text-primary);
  margin: 0;
  white-space: nowrap;
}

.result-content {
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  gap: var(--token-spacing-32pt);
  align-items: flex-start;
  padding: var(--token-spacing-24pt);
  width: 100%;
}

.result-text {
  font-family: var(--font-typeface-body);
  font-weight: var(--font-weight-400);
  font-size: var(--font-size-sm);
  line-height: var(--line-height-18);
  color: var(--token-text-primary);
  margin: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  width: 100%;
}

.loading-state,
.error-state,
.ai-response,
.placeholder-state {
  width: 100%;
}

.error-text {
  color: var(--token-base-red);
}

.ai-response p {
  margin: 0 0 12px 0;
}

.ai-response p:last-child {
  margin-bottom: 0;
}

/* Responsive styles */
@media (max-width: 640px) {
  .container {
    padding: var(--token-spacing-64pt) var(--token-spacing-40pt);
  }
}

@media (max-width: 430px) {
  .container {
    padding: var(--token-spacing-64pt) var(--token-spacing-20pt);
  }
}
</style>

