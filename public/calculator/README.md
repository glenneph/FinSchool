# Standalone EMI Calculator

This is the standalone HTML/CSS/JS EMI calculator that integrates with the main Vue.js calculator app.

## Flow

### Adding a New Loan
1. User clicks "Add Loan" button in `Calculator.vue`
2. Redirects to `/calculator/index.html`
3. User fills in loan details (Amount, Interest Rate, Tenure)
4. User clicks "Save Loan" button
5. Loan data is saved to localStorage (`savedLoans` array)
6. Redirects back to `/calculator` (main Vue app)
7. `Calculator.vue` loads and displays the new loan in the table

### Editing an Existing Loan
1. User clicks on any loan value (Principal, Interest, EMI, Tenure) in `Calculator.vue`
2. Loan data is stored in localStorage (`editingLoanData`)
3. Redirects to `/calculator/index.html`
4. Form is pre-populated with existing loan data
5. User modifies the values
6. User clicks "Save Loan" button
7. Loan is updated in localStorage (`savedLoans` array)
8. Redirects back to `/calculator` (main Vue app)
9. `Calculator.vue` shows the updated loan

### Cancel Flow
- User clicks "Cancel" button at any time
- Confirms cancellation
- `editingLoanData` is cleared from localStorage
- Redirects back to `/calculator` without saving changes

## Data Format

Loan objects are stored in localStorage with the following structure:

```javascript
{
  id: 1234567890,          // Timestamp or unique ID
  name: 'Housing Loan',     // User-provided name
  principal: '₹14,54,615',  // Formatted currency string
  interest: '18%',          // Percentage string
  emi: '₹19,566',          // Formatted currency string (calculated)
  tenure: '15 yrs'          // Years string
}
```

## localStorage Keys

- `savedLoans`: Array of all loan objects
- `editingLoanData`: Temporary storage for the loan being edited (cleared after save/cancel)

## Files

- `index.html`: Main calculator page with form inputs and results
- `style.css`: All styles including responsive design
- `script.js`: Calculator logic + Save/Cancel integration

