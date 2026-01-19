// Multi-loan prepayment calculation utilities
// Based on script.js logic, adapted for multiple loans



/**
 * Parse loan amount from formatted string (₹14,54,615) to number
 */
function parseCurrency(currencyStr) {
  if (typeof currencyStr === 'number') return currencyStr;
  return parseFloat(currencyStr.replace(/[₹,]/g, '').trim()) || 0;
}

/**
 * Parse interest rate from string (18%) to number
 */
function parseInterest(interestStr) {
  if (typeof interestStr === 'number') return interestStr;
  return parseFloat(interestStr.replace('%', '').trim()) || 0;
}

/**
 * Parse tenure from string (15 yrs or 15 yr) to number
 */
function parseTenure(tenureStr) {
  if (typeof tenureStr === 'number') return tenureStr;
  return parseFloat(tenureStr.replace(/yrs?/g, '').trim()) || 0;
}

/**
 * Format number to Indian currency
 */
function formatToIndianCurrency(num) {
  if (isNaN(num) || num === undefined) return '-';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(num);
}

/**
 * Calculate EMI for a single loan
 */
function calculateEMI(principal, annualInterestRate, tenureYears) {
  const r = (annualInterestRate / 12) / 100;
  const n = Math.round(tenureYears * 12);

  if (r > 0 && n > 0) {
    const pow = Math.pow(1 + r, n);
    if (isFinite(pow) && (pow - 1) !== 0) {
      return (principal * r * pow) / (pow - 1);
    }
  }
  return principal / Math.max(1, n);
}

/**
 * Generate monthly schedule for a single loan
 */
function generateLoanSchedule(principal, emi, monthlyRate, tenureMonths, startDate) {
  let outstanding = principal;
  const schedule = [];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  let currentDate = new Date(startDate);

  for (let i = 0; i < tenureMonths; i++) {
    const year = currentDate.getFullYear();
    const month = monthNames[currentDate.getMonth()];

    const interestPayment = outstanding * monthlyRate;
    let principalPayment = Math.max(0, emi - interestPayment);

    if (outstanding <= principalPayment) {
      principalPayment = outstanding;
      const totalPayment = principalPayment + interestPayment;
      outstanding = 0;

      schedule.push({
        year,
        month,
        monthIndex: i,
        principal: principalPayment,
        interest: interestPayment,
        emi: totalPayment,
        prepayment: 0,
        total: totalPayment,
        balance: 0,
        date: new Date(currentDate)
      });
      break;
    } else {
      outstanding -= principalPayment;
      schedule.push({
        year,
        month,
        monthIndex: i,
        principal: principalPayment,
        interest: interestPayment,
        emi,
        prepayment: 0,
        total: emi,
        balance: outstanding,
        date: new Date(currentDate)
      });
    }

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return schedule;
}

/**
 * Sort loans by method (Snowball or Avalanche)
 */
function sortLoansByMethod(loans, method) {
  const loansCopy = [...loans];

  if (method === 'snowball') {
    // Smallest principal first
    return loansCopy.sort((a, b) => {
      const principalA = parseCurrency(a.principal);
      const principalB = parseCurrency(b.principal);
      return principalB - principalA;
    });
  } else if (method === 'avalanche') {
    // Highest interest rate first
    return loansCopy.sort((a, b) => {
      const interestA = parseInterest(a.interest);
      const interestB = parseInterest(b.interest);
      return interestB - interestA;
    });
  }

  return loansCopy;
}


/**
 * Apply prepayments to a single loan's schedule
 */





/**
 * Parse date string in format DD-MM-YYYY to Date object
 */
function parseDate(dateStr) {
  if (dateStr instanceof Date) return new Date(dateStr);

  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Months are 0-indexed
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date();
}

/**
 * Apply custom prepayments to multiple loans in sequence
 */
function applyCustomPrepaymentsToMultipleLoans(loans, prepaymentRows, method, startDate) {
  const sortedLoans = sortLoansByMethod(loans, method);
  const results = [];

  // Build prepayment map from date ranges
  const prepaymentMap = {};
  prepaymentRows.forEach(row => {
    let d = parseDate(row.startDate);
    const endDate = parseDate(row.endDate);

    while (d <= endDate) {
      const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
      prepaymentMap[key] = (prepaymentMap[key] || 0) + parseFloat(row.amount || 0);
      d.setMonth(d.getMonth() + 1);
    }
  });

  let currentDate = new Date(startDate);
  let remainingPrepayments = { ...prepaymentMap };

  // Process each loan in order (Sorted by priority)
  // Logic Update: All loans run in PARALLEL (starting Today).
  // Priority determines who eats the extra money first.
  sortedLoans.forEach((loan, loanIndex) => {
    const principal = parseCurrency(loan.principal);
    const interest = parseInterest(loan.interest);
    const tenure = parseTenure(loan.tenure);
    const emi = calculateEMI(principal, interest, tenure);

    // Generate base schedule
    // ALL loans start at the GLOBAL startDate. No daisy-chaining.
    const monthlyRate = (interest / 12) / 100;
    const tenureMonths = Math.round(tenure * 12);
    const baseSchedule = generateLoanSchedule(principal, emi, monthlyRate, tenureMonths, startDate);

    // Apply prepayments to this loan.
    // The 'remainingPrepayments' map tracks available extra money for each month.
    // High priority loans (processed first) will consume the money.
    // Low priority loans will find 0 available for early months if high priority loans took it.
    const scheduleWithPrep = applyPrepaymentsFromMap(
      baseSchedule,
      remainingPrepayments,
      principal,
      emi,
      monthlyRate,
      startDate
    );

    // Calculate metrics
    const totalInterest = scheduleWithPrep.reduce((sum, e) => sum + e.interest, 0);
    const totalPrepayments = scheduleWithPrep.reduce((sum, e) => sum + e.prepayment, 0);
    const totalAmount = principal + totalInterest;
    const actualMonths = scheduleWithPrep.length;

    // Calculate original metrics for comparison
    const originalTotalInterest = (emi * tenureMonths) - principal;
    const originalTotalAmount = principal + originalTotalInterest;

    results.push({
      ...loan,
      originalTenure: tenure,
      originalInterest: originalTotalInterest,
      originalTotal: originalTotalAmount,
      newTenure: actualMonths / 12,
      newInterest: totalInterest,
      newTotal: totalAmount,
      totalPrepayments,
      schedule: scheduleWithPrep,
      emi,
      interestSaved: originalTotalInterest - totalInterest,
      totalSaved: originalTotalAmount - totalAmount,
      tenureSavedMonths: tenureMonths - actualMonths
    });

    // REMOVED: Date shifting logic. 
    // We treat all loans as active simultaneously.
  });

  return results;
}

/**
 * Apply prepayments from a map to a loan schedule
 */
function applyPrepaymentsFromMap(schedule, prepaymentMap, principal, emi, monthlyRate, loanStartDate) {
  const newSchedule = [];
  let outstanding = principal;
  let currentDate = new Date(loanStartDate);

  for (let i = 0; i < schedule.length; i++) {
    const monthKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}`;
    const prepaymentAmount = prepaymentMap[monthKey] || 0;

    const interestPayment = outstanding * monthlyRate;
    let principalPayment = Math.max(0, emi - interestPayment);
    let actualPrepayment = prepaymentAmount;

    const totalReduction = principalPayment + actualPrepayment;

    if (outstanding <= totalReduction) {
      const actualPrincipal = Math.min(outstanding, principalPayment);
      actualPrepayment = Math.max(0, outstanding - actualPrincipal);

      newSchedule.push({
        ...schedule[i],
        principal: actualPrincipal,
        interest: interestPayment,
        prepayment: actualPrepayment,
        total: actualPrincipal + interestPayment + actualPrepayment,
        balance: 0
      });

      // Remove used prepayment from map
      if (actualPrepayment > 0) {
        prepaymentMap[monthKey] = Math.max(0, prepaymentMap[monthKey] - actualPrepayment);
      }

      break;
    } else {
      outstanding -= totalReduction;

      newSchedule.push({
        ...schedule[i],
        principal: principalPayment,
        interest: interestPayment,
        prepayment: actualPrepayment,
        total: emi + actualPrepayment,
        balance: outstanding
      });

      // Remove used prepayment from map
      if (actualPrepayment > 0) {
        prepaymentMap[monthKey] = Math.max(0, prepaymentMap[monthKey] - actualPrepayment);
      }
    }

    currentDate.setMonth(currentDate.getMonth() + 1);
  }

  return newSchedule;
}

/**
 * Apply 16-EMI Rule to multiple loans
 * Uses the EXACT same logic as custom prepayments, but:
 * - Prepayment amount = EMI amount (not user-specified)
 * - Prepayments only at months 0, 3, 6, 9... (every 3rd month, not every month)
 * This ensures seamless prepayment transfer from first loan to second loan (like custom prepayments)
 */
function apply16EMIRuleToMultipleLoans(loans, method, startDate) {
  const sortedLoans = sortLoansByMethod(loans, method);
  const results = [];

  // Track the NEXT due date for a prepayment
  // Initially, it's immediately (Month 0) or user preference. Assuming Month 0 (today)
  let nextPrepaymentDueDate = new Date(startDate);

  console.log('16 EMI Rule (Continuous Gap): Starting execution');

  // Process each loan in order
  sortedLoans.forEach((loan, loanIndex) => {
    const principal = parseCurrency(loan.principal);
    const interest = parseInterest(loan.interest);
    const tenure = parseTenure(loan.tenure);
    const emi = calculateEMI(principal, interest, tenure);

    // Generate base schedule
    // We assume all loans start accumulating interest from 'startDate' 
    // (or simple simulation where T=0 is now)
    const monthlyRate = (interest / 12) / 100;
    const tenureMonths = Math.round(tenure * 12);

    // For calculation simplicity, we treat loan start as 'startDate' 
    // but in a real daisy-chain, outstanding balance transfer logic would be complex.
    // Here we assume standard independent loans being paid off in sequence.
    const baseSchedule = generateLoanSchedule(principal, emi, monthlyRate, tenureMonths, startDate);

    // --- Generate Prepayment Map for THIS Loan ---
    const loanPrepaymentMap = {};

    // We walk forward from 'nextPrepaymentDueDate' by 3 months at a time
    // UNTIL we exceed the reasonable max tenure of this loan.
    // If the loan ends before a prepayment hits, that prepayment isn't used here,
    // and 'nextPrepaymentDueDate' stays waiting for the next loan.

    let pDate = new Date(nextPrepaymentDueDate);
    const maxDate = new Date(startDate);
    // Add adequate buffer (tenure + some years) 
    maxDate.setMonth(maxDate.getMonth() + tenureMonths + 60);

    while (pDate <= maxDate) {
      const key = `${pDate.getFullYear()}-${pDate.getMonth() + 1}`;
      loanPrepaymentMap[key] = emi; // Use THIS loan's EMI
      pDate.setMonth(pDate.getMonth() + 3);
    }

    console.log(`Loan ${loanIndex + 1} Prepay candidates starting: ${nextPrepaymentDueDate.toDateString()}`);

    // Apply prepayments to this loan
    const scheduleWithPrep = applyPrepaymentsFromMap(
      baseSchedule,
      loanPrepaymentMap,
      principal,
      emi,
      monthlyRate,
      startDate
    );

    // --- FIND LAST ACTUAL PREPAYMENT ---
    // We need to find the DATE of the last prepayment that was *actually* applied
    // (i.e., schedule entry where prepayment > 0)
    let lastActualPrepayment = null;

    scheduleWithPrep.forEach(entry => {
      if (entry.prepayment > 0) {
        lastActualPrepayment = new Date(entry.date);
      }
    });

    // Update global pointer IF a prepayment occurred
    if (lastActualPrepayment) {
      // Next due is 3 months after the last ACTUAL prepayment
      nextPrepaymentDueDate = new Date(lastActualPrepayment);
      nextPrepaymentDueDate.setMonth(nextPrepaymentDueDate.getMonth() + 3);
      console.log(`Loan ${loanIndex + 1}: Last Prepayment on ${lastActualPrepayment.toDateString()}. Next due: ${nextPrepaymentDueDate.toDateString()}`);
    } else {
      // No prepayment happened (loan too short? or finished before next due date)
      // 'nextPrepaymentDueDate' remains unchanged, waiting for a loan that lives long enough.
      console.log(`Loan ${loanIndex + 1}: No prepayments made. Next due remains: ${nextPrepaymentDueDate.toDateString()}`);
    }

    // Calculate metrics
    const totalInterest = scheduleWithPrep.reduce((sum, e) => sum + e.interest, 0);
    const totalPrepayments = scheduleWithPrep.reduce((sum, e) => sum + e.prepayment, 0);
    const totalAmount = principal + totalInterest;
    const actualMonths = scheduleWithPrep.length;

    // Calculate original metrics
    const originalTotalInterest = (emi * tenureMonths) - principal;
    const originalTotalAmount = principal + originalTotalInterest;

    results.push({
      ...loan,
      originalTenure: tenure,
      originalInterest: originalTotalInterest,
      originalTotal: originalTotalAmount,
      newTenure: actualMonths / 12,
      newInterest: totalInterest,
      newTotal: totalAmount,
      totalPrepayments,
      schedule: scheduleWithPrep,
      emi,
      interestSaved: originalTotalInterest - totalInterest,
      totalSaved: originalTotalAmount - totalAmount,
      tenureSavedMonths: tenureMonths - actualMonths
    });
  });

  return results;
}

/**
 * Calculate overall savings across all loans
 */
function calculateOverallSavings(loanResults) {
  const totalOriginalInterest = loanResults.reduce((sum, loan) => sum + loan.originalInterest, 0);
  const totalNewInterest = loanResults.reduce((sum, loan) => sum + loan.newInterest, 0);
  const totalOriginalAmount = loanResults.reduce((sum, loan) => sum + loan.originalTotal, 0);
  const totalNewAmount = loanResults.reduce((sum, loan) => sum + loan.newTotal, 0);
  const totalMonthlyEMI = loanResults.reduce((sum, loan) => sum + loan.emi, 0);

  const interestSaved = totalOriginalInterest - totalNewInterest;
  const totalSaved = totalOriginalAmount - totalNewAmount;
  const interestSavedPercent = totalOriginalInterest > 0 ? (interestSaved / totalOriginalInterest) * 100 : 0;
  const totalSavedPercent = totalOriginalAmount > 0 ? (totalSaved / totalOriginalAmount) * 100 : 0;

  return {
    totalMonthlyEMI,
    totalOriginalInterest,
    totalNewInterest,
    totalOriginalAmount,
    totalNewAmount,
    interestSaved,
    totalSaved,
    interestSavedPercent: Math.round(interestSavedPercent),
    totalSavedPercent: Math.round(totalSavedPercent)
  };
}

/**
 * Main function to calculate multi-loan prepayments
 */
export function calculateMultiLoanPrepayments(loans, prepaymentData, method) {
  const startDate = new Date();

  // Validate inputs
  if (!loans || loans.length === 0) {
    return null;
  }

  let loanResults = [];

  if (prepaymentData.activeTab === 'templates' && prepaymentData.selectedTemplate === '16-emi-rule') {
    // Apply 16-EMI Rule
    console.log('Applying 16 EMI Rule to loans:', loans.length);
    loanResults = apply16EMIRuleToMultipleLoans(loans, method, startDate);
    console.log('16 EMI Rule results:', loanResults.length, 'loans processed');
  } else if (prepaymentData.activeTab === 'custom' && prepaymentData.prepaymentRows) {
    // Apply custom prepayments
    loanResults = applyCustomPrepaymentsToMultipleLoans(
      loans,
      prepaymentData.prepaymentRows,
      method,
      startDate
    );
  } else {
    // No valid prepayment method selected
    console.warn('Invalid prepayment data:', prepaymentData);
    return null;
  }

  // Validate that we have results
  if (!loanResults || loanResults.length === 0) {
    console.error('No loan results generated. Loans:', loans.length, 'PrepaymentData:', prepaymentData);
    return null;
  }

  // Calculate overall savings
  const overallSavings = calculateOverallSavings(loanResults);

  return {
    loanResults,
    overallSavings,
    method
  };
}

export {
  formatToIndianCurrency,
  parseCurrency,
  parseInterest,
  parseTenure,
  sortLoansByMethod
};
