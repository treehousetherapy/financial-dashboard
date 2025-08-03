/**
 * Financial validation utilities for Treehouse Financial Dashboard
 * Implements validation rules for healthcare therapy center financial data
 */

export const validateFinancialInputs = (data) => {
  const errors = [];
  const warnings = [];

  // Service Rate Validation
  if (data.serviceRates?.directTherapy <= 0) {
    errors.push("Direct therapy rate must be greater than $0");
  }
  if (data.serviceRates?.directTherapy > 200) {
    warnings.push("Direct therapy rate above $200/hour - verify rate accuracy");
  }

  // Staff Rate Validation
  if (data.staffRates?.bt < 15) {
    warnings.push("BT rate below $15/hour - consider minimum wage compliance");
  }
  if (data.staffRates?.bcba < 35) {
    warnings.push("BCBA rate below $35/hour - verify market rate competitiveness");
  }

  // Utilization Rate Validation
  const btUtilization = data.btUtilization || 0;
  const bcbaUtilization = data.bcbaUtilization || 0;
  
  if (btUtilization > 100) {
    errors.push("BT utilization cannot exceed 100% - adjust staff count or client hours");
  }
  if (bcbaUtilization > 100) {
    errors.push("BCBA utilization cannot exceed 100% - adjust staff count or supervision hours");
  }
  if (btUtilization > 85) {
    warnings.push("BT utilization above 85% - consider hiring additional staff");
  }
  if (bcbaUtilization > 80) {
    warnings.push("BCBA utilization above 80% - risk of burnout and quality issues");
  }

  // Financial Health Checks
  if (data.profitMargin < 10) {
    warnings.push("Profit margin below 10% - review cost structure");
  }
  if (data.profitMargin > 40) {
    warnings.push("Profit margin above 40% - consider rate competitiveness");
  }

  // Service Distribution Validation
  if (data.serviceDistribution) {
    const total = Object.values(data.serviceDistribution).reduce((sum, val) => sum + val, 0);
    if (Math.abs(total - 1) > 0.01) {
      errors.push("Service distribution must total 100%");
    }
  }

  // Cost Structure Validation
  if (data.totalExpenses > data.totalRevenue * 1.2) {
    errors.push("Expenses exceed 120% of revenue - unsustainable model");
  }

  return { errors, warnings };
};

export const validateBusinessLogic = (metrics) => {
  const issues = [];

  // Capacity vs Demand Analysis
  const totalDemandHours = metrics.totalMonthlyHours;
  const totalCapacity = metrics.btCapacity + metrics.bcbaCapacity;
  
  if (totalDemandHours > totalCapacity) {
    issues.push({
      type: 'capacity',
      message: `Demand (${Math.round(totalDemandHours)}h) exceeds capacity (${totalCapacity}h)`,
      severity: 'error'
    });
  }

  // Revenue per Client Analysis
  const revenuePerClient = metrics.totalRevenue / metrics.activeClients;
  if (revenuePerClient < 1000) {
    issues.push({
      type: 'revenue',
      message: `Low revenue per client ($${Math.round(revenuePerClient)}) - review service intensity`,
      severity: 'warning'
    });
  }

  // Cost per Hour Analysis
  if (metrics.costPerHour > metrics.revenuePerHour * 0.9) {
    issues.push({
      type: 'costs',
      message: `Cost per hour (${metrics.costPerHour.toFixed(2)}) too close to revenue per hour`,
      severity: 'warning'
    });
  }

  return issues;
};

// Break-even analysis with proper healthcare considerations
export const calculateBreakEven = (fixedCosts, variableCostPerHour, revenuePerHour) => {
  if (revenuePerHour <= variableCostPerHour) {
    return {
      error: "Revenue per hour must exceed variable cost per hour",
      breakEvenHours: null
    };
  }

  const contributionMargin = revenuePerHour - variableCostPerHour;
  const breakEvenHours = fixedCosts / contributionMargin;

  return {
    breakEvenHours: Math.ceil(breakEvenHours),
    contributionMargin,
    contributionMarginPercent: (contributionMargin / revenuePerHour) * 100
  };
};

// Healthcare-specific financial ratios
export const calculateHealthcareMetrics = (metrics) => {
  return {
    // Staff cost as percentage of revenue (should be 60-70% for ABA)
    staffCostRatio: (metrics.totalStaffCost / metrics.totalRevenue) * 100,
    
    // Revenue per direct care hour (key efficiency metric)
    revenuePerDirectHour: metrics.totalRevenue / metrics.directTherapyHours,
    
    // Administrative burden (BCBA admin time ratio)
    adminTimeRatio: (metrics.bcbaAdminHours / metrics.bcbaTotalHours) * 100,
    
    // Client retention impact (estimate based on active clients)
    averageClientValue: metrics.totalRevenue / metrics.activeClients,
    
    // Billing efficiency (assumes 95% collection rate)
    estimatedCollections: metrics.totalRevenue * 0.95
  };
};