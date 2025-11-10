// Multi-loan prepayment calculation utilities
// Based on script.js logic, adapted for multiple loans

const INFLATION_RATE = 5.85;

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
 * Parse tenure from string (15 yrs) to number
 */
function parseTenure(tenureStr) {
  if (typeof tenureStr === 'number') return tenureStr;
  return parseFloat(tenureStr.replace('yrs', '').trim()) || 0;
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
      return principalA - principalB;
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
 * Generate 16-EMI Rule prepayments for multiple loans
 * Pays 1 EMI amount every 3rd month for each loan in sequence
 */
function generate16EMIRuleForMultipleLoans(sortedLoans, startDate) {
  const prepaymentSchedule = [];
  let currentDate = new Date(startDate);
  let monthCounter = 0;
  
  sortedLoans.forEach((loan) => {
    const emi = parseCurrency(loan.emi);
    const tenureMonths = Math.round(parseTenure(loan.tenure) * 12);
    
    // For this loan, apply 16-EMI rule until it's paid off
    for (let i = 0; i < tenureMonths; i++) {
      const cyclePosition = monthCounter % 3;
      if (cyclePosition === 2) {
        // Every 3rd month, add prepayment
        prepaymentSchedule.push({
          loanId: loan.id,
          date: new Date(currentDate),
          amount: emi,
          monthIndex: i
        });
      }
      currentDate.setMonth(currentDate.getMonth() + 1);
      monthCounter++;
    }
  });
  
  return prepaymentSchedule;
}

/**
 * Apply prepayments to a single loan's schedule
 */
function applyPrepaymentsToLoan(loanSchedule, prepayments, loanId) {
  const scheduleWithPrepayments = [...loanSchedule];
  
  prepayments.forEach(prep => {
    if (prep.loanId !== loanId) return;
    
    // Find the matching month in the schedule
    const monthEntry = scheduleWithPrepayments.find(entry => 
      entry.monthIndex === prep.monthIndex && entry.balance > 0
    );
    
    if (monthEntry) {
      monthEntry.prepayment = Math.min(prep.amount, monthEntry.balance);
    }
  });
  
  // Recalculate schedule with prepayments
  return recalculateScheduleWithPrepayments(scheduleWithPrepayments);
}

/**
 * Recalculate loan schedule after prepayments are added
 */
function recalculateScheduleWithPrepayments(schedule) {
  const newSchedule = [];
  let outstanding = schedule[0].balance + schedule[0].principal;
  const monthlyRate = schedule[0].interest / outstanding;
  const emi = schedule[0].emi;
  
  for (let i = 0; i < schedule.length; i++) {
    const entry = schedule[i];
    
    const interestPayment = outstanding * monthlyRate;
    let principalPayment = Math.max(0, emi - interestPayment);
    const prepayment = entry.prepayment || 0;
    
    const totalReduction = principalPayment + prepayment;
    
    if (outstanding <= totalReduction) {
      const actualPrincipal = Math.min(outstanding, principalPayment);
      const actualPrepayment = Math.max(0, outstanding - actualPrincipal);
      
      newSchedule.push({
        ...entry,
        principal: actualPrincipal,
        interest: interestPayment,
        prepayment: actualPrepayment,
        total: actualPrincipal + interestPayment + actualPrepayment,
        balance: 0
      });
      break;
    } else {
      outstanding -= totalReduction;
      newSchedule.push({
        ...entry,
        principal: principalPayment,
        interest: interestPayment,
        prepayment,
        total: emi + prepayment,
        balance: outstanding
      });
    }
  }
  
  return newSchedule;
}

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
  
  // Process each loan in order
  sortedLoans.forEach((loan, loanIndex) => {
    const principal = parseCurrency(loan.principal);
    const interest = parseInterest(loan.interest);
    const tenure = parseTenure(loan.tenure);
    const emi = calculateEMI(principal, interest, tenure);
    
    // Generate base schedule
    const monthlyRate = (interest / 12) / 100;
    const tenureMonths = Math.round(tenure * 12);
    const baseSchedule = generateLoanSchedule(principal, emi, monthlyRate, tenureMonths, currentDate);
    
    // Apply prepayments to this loan
    const scheduleWithPrep = applyPrepaymentsFromMap(
      baseSchedule, 
      remainingPrepayments, 
      principal, 
      emi, 
      monthlyRate,
      currentDate
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
    
    // Move start date forward for next loan
    if (scheduleWithPrep.length > 0) {
      const lastEntry = scheduleWithPrep[scheduleWithPrep.length - 1];
      currentDate = new Date(lastEntry.date);
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
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
 */
function apply16EMIRuleToMultipleLoans(loans, method, startDate) {
  const sortedLoans = sortLoansByMethod(loans, method);
  const results = [];
  let globalCurrentDate = new Date(startDate);
  let monthCounter = 0;
  
  // Process each loan in sequence
  sortedLoans.forEach((loan) => {
    const principal = parseCurrency(loan.principal);
    const interest = parseInterest(loan.interest);
    const tenure = parseTenure(loan.tenure);
    const emi = calculateEMI(principal, interest, tenure);
    
    const monthlyRate = (interest / 12) / 100;
    const tenureMonths = Math.round(tenure * 12);
    
    // Generate base schedule
    let baseSchedule = generateLoanSchedule(principal, emi, monthlyRate, tenureMonths, globalCurrentDate);
    
    // Apply 16-EMI rule: pay 1 EMI every 3rd month
    const scheduleWithPrep = [];
    let outstanding = principal;
    let loanStartDate = new Date(globalCurrentDate);
    
    for (let i = 0; i < tenureMonths; i++) {
      const cyclePosition = monthCounter % 3;
      const prepaymentAmount = (cyclePosition === 2) ? emi : 0;
      
      const interestPayment = outstanding * monthlyRate;
      let principalPayment = Math.max(0, emi - interestPayment);
      let actualPrepayment = Math.min(prepaymentAmount, outstanding - principalPayment);
      
      const totalReduction = principalPayment + actualPrepayment;
      
      if (outstanding <= totalReduction) {
        const actualPrincipal = Math.min(outstanding, principalPayment);
        actualPrepayment = Math.max(0, outstanding - actualPrincipal);
        
        scheduleWithPrep.push({
          year: loanStartDate.getFullYear(),
          month: monthNames[loanStartDate.getMonth()],
          monthIndex: i,
          principal: actualPrincipal,
          interest: interestPayment,
          emi: actualPrincipal + interestPayment,
          prepayment: actualPrepayment,
          total: actualPrincipal + interestPayment + actualPrepayment,
          balance: 0,
          date: new Date(loanStartDate)
        });
        break;
      } else {
        outstanding -= totalReduction;
        
        scheduleWithPrep.push({
          year: loanStartDate.getFullYear(),
          month: monthNames[loanStartDate.getMonth()],
          monthIndex: i,
          principal: principalPayment,
          interest: interestPayment,
          emi,
          prepayment: actualPrepayment,
          total: emi + actualPrepayment,
          balance: outstanding,
          date: new Date(loanStartDate)
        });
      }
      
      loanStartDate.setMonth(loanStartDate.getMonth() + 1);
      monthCounter++;
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
    
    // Update global current date
    if (scheduleWithPrep.length > 0) {
      const lastEntry = scheduleWithPrep[scheduleWithPrep.length - 1];
      globalCurrentDate = new Date(lastEntry.date);
      globalCurrentDate.setMonth(globalCurrentDate.getMonth() + 1);
    }
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
    loanResults = apply16EMIRuleToMultipleLoans(loans, method, startDate);
  } else if (prepaymentData.activeTab === 'custom' && prepaymentData.prepaymentRows) {
    // Apply custom prepayments
    loanResults = applyCustomPrepaymentsToMultipleLoans(
      loans, 
      prepaymentData.prepaymentRows, 
      method, 
      startDate
    );
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
  parseTenure
};

