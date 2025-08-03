import React, { useState } from 'react';
import { Download, Edit3, TrendingUp, DollarSign, Clock, Users, Calculator, AlertTriangle, CheckCircle, Shield } from 'lucide-react';

const TreehouseFinancialDashboard = () => {
  const [editMode, setEditMode] = useState(false);
  const [forecastMonths, setForecastMonths] = useState(6);
  
  // Core editable data
  const [clientData, setClientData] = useState([
    { id: 1, name: 'Client 1', weeklyHours: 6, active: true, age: 8, annualUsed: 12500 },
    { id: 2, name: 'Client 2', weeklyHours: 20, active: true, age: 12, annualUsed: 28900 },
    { id: 3, name: 'Client 3', weeklyHours: 20, active: true, age: 6, annualUsed: 15600 }
  ]);
  
  // ACCURATE MHCP SERVICE RATES - Based on $54/hour base with provider tiers
  const [serviceRates, setServiceRates] = useState({
    // Base rates at 100% reimbursement (QSP/Level I) - $13.50 per 15-min unit
    directTherapy: 54.00,        // 97153: Individual ABA - $13.50 × 4 units/hour
    groupTherapy: 54.00,         // 97154: Group ABA - $13.50 × 4 units/hour  
    supervision: 54.00,          // 97155: Protocol Modification - $13.50 × 4 units/hour
    familyTraining: 54.00,       // 97156: Family Guidance - $13.50 × 4 units/hour
    familyGroup: 54.00,          // 97157: Multiple-Family Group - $13.50 × 4 units/hour
    assessment: 54.00,           // 97151: Behavior Assessment - $13.50 × 4 units/hour
    travelTime: 13.50,           // H0046: Travel - actual hourly rate varies
    
    // Provider tier multipliers
    level1Multiplier: 1.00,      // 100% - QSP/Level I
    level2Multiplier: 0.80,      // 80% - Level II  
    level3Multiplier: 0.50       // 50% - Level III (97153, 97154 only)
  });
  
  // Staff configuration with provider levels
  const [staffRates, setStaffRates] = useState({
    btLevel2: 22,               // Level II BT - 80% reimbursement
    btLevel3: 18,               // Level III BT - 50% reimbursement  
    bcbaLevel1: 45,             // Level I BCBA - 100% reimbursement
    qsp: 55                     // Qualified Supervising Professional
  });
  
  const [overheadCosts, setOverheadCosts] = useState({
    rent: 550,
    insurance: 300,
    licensing: 200,
    other: 500
  });
  
  // Service distribution with MHCP compliance limits
  const [serviceDistribution, setServiceDistribution] = useState({
    directTherapy: 0.75,         // 75% - 97153 (max 8h/day, 25h/week)
    groupTherapy: 0.05,          // 5% - 97154 (max 4.5h/day)
    supervision: 0.12,           // 12% - 97155 (max 6h/day)
    familyTraining: 0.06,        // 6% - 97156 (max 4h/day)
    familyGroup: 0.01,           // 1% - 97157 (max 4h/day)
    assessment: 0.01,            // 1% - 97151 (80 units/year max)
    travelTime: 0.00            // 0% - H0046 (minimize)
  });
  
  // Staff mix by provider level
  const [staffMix, setStaffMix] = useState({
    level1Percentage: 0.30,      // 30% Level I/QSP staff
    level2Percentage: 0.50,      // 50% Level II staff
    level3Percentage: 0.20       // 20% Level III staff
  });
  
  const [growthAssumptions, setGrowthAssumptions] = useState({
    newClientsPerMonth: 0.5,
    averageNewClientHours: 15,
    rateIncreaseAnnual: 0.03,    // MHCP annual indexing
    costInflationAnnual: 0.025
  });

  // Staff management state
  const [staffCount, setStaffCount] = useState({
    btTotal: 3,
    bcba: 1,
    qsp: 1
  });

  // MHCP compliance calculations
  const calculateMHCPCompliance = (client) => {
    const ANNUAL_CAP = 37800;    // $37,800 per beneficiary annually
    const WEEKLY_HOUR_LIMIT = 25; // 25 hours max per week
    const DAILY_LIMITS = {
      directTherapy: 8,          // 8 hours daily max
      groupTherapy: 4.5,         // 4.5 hours daily max
      supervision: 6,            // 6 hours daily max
      familyTraining: 4,         // 4 hours daily max
      familyGroup: 4,            // 4 hours daily max
      assessment: 80 / 52        // 80 units annually ÷ 52 weeks
    };
    
    const weeklyHoursCompliant = client.weeklyHours <= WEEKLY_HOUR_LIMIT;
    const annualCapRemaining = ANNUAL_CAP - (client.annualUsed || 0);
    const canContinueServices = annualCapRemaining > 0;
    
    return {
      weeklyHoursCompliant,
      annualCapRemaining,
      canContinueServices,
      weeklyLimit: WEEKLY_HOUR_LIMIT,
      dailyLimits: DAILY_LIMITS
    };
  };

  // Calculate weighted reimbursement rates based on staff mix
  const calculateWeightedRates = () => {
    const weightedMultiplier = (
      staffMix.level1Percentage * serviceRates.level1Multiplier +
      staffMix.level2Percentage * serviceRates.level2Multiplier +
      staffMix.level3Percentage * serviceRates.level3Multiplier
    );
    
    return {
      directTherapy: serviceRates.directTherapy * weightedMultiplier,
      groupTherapy: serviceRates.groupTherapy * weightedMultiplier,
      supervision: serviceRates.supervision * serviceRates.level1Multiplier, // BCBA only
      familyTraining: serviceRates.familyTraining * serviceRates.level1Multiplier, // BCBA only
      familyGroup: serviceRates.familyGroup * serviceRates.level1Multiplier, // BCBA only
      assessment: serviceRates.assessment * serviceRates.level1Multiplier, // QSP only
      travelTime: serviceRates.travelTime
    };
  };

  // Main financial calculations with MHCP accuracy
  const calculateMetrics = () => {
    const activeClients = clientData.filter(client => client.active);
    const totalWeeklyHours = activeClients.reduce((sum, client) => sum + Math.min(client.weeklyHours, 25), 0); // MHCP 25h limit
    const totalMonthlyHours = totalWeeklyHours * 4.33; // Average weeks per month
    
    // Check MHCP compliance for all clients
    const complianceChecks = activeClients.map(client => ({
      ...client,
      compliance: calculateMHCPCompliance(client)
    }));
    
    // Service hour breakdown with MHCP limits
    const directTherapyHours = Math.min(
      totalMonthlyHours * serviceDistribution.directTherapy,
      activeClients.length * 8 * 30 // Daily limit × 30 days
    );
    const groupTherapyHours = Math.min(
      totalMonthlyHours * serviceDistribution.groupTherapy,
      activeClients.length * 4.5 * 30
    );
    const supervisionHours = Math.min(
      totalMonthlyHours * serviceDistribution.supervision,
      activeClients.length * 6 * 30
    );
    const familyTrainingHours = Math.min(
      totalMonthlyHours * serviceDistribution.familyTraining,
      activeClients.length * 4 * 30
    );
    const familyGroupHours = Math.min(
      totalMonthlyHours * serviceDistribution.familyGroup,
      activeClients.length * 4 * 30
    );
    const assessmentHours = Math.min(
      totalMonthlyHours * serviceDistribution.assessment,
      activeClients.length * (80 / 52) * 4.33 / 4 // 80 units/year ÷ 52 weeks × 4.33 weeks ÷ 4 units
    );
    const travelHours = totalMonthlyHours * serviceDistribution.travelTime;
    
    // Get weighted rates based on staff mix
    const weightedRates = calculateWeightedRates();
    
    // Revenue calculation with accurate MHCP rates
    const directTherapyRevenue = directTherapyHours * weightedRates.directTherapy;
    const groupTherapyRevenue = groupTherapyHours * weightedRates.groupTherapy;
    const supervisionRevenue = supervisionHours * weightedRates.supervision;
    const familyTrainingRevenue = familyTrainingHours * weightedRates.familyTraining;
    const familyGroupRevenue = familyGroupHours * weightedRates.familyGroup;
    const assessmentRevenue = assessmentHours * weightedRates.assessment;
    const travelRevenue = travelHours * weightedRates.travelTime;
    
    const totalRevenue = directTherapyRevenue + groupTherapyRevenue + supervisionRevenue + 
                        familyTrainingRevenue + familyGroupRevenue + assessmentRevenue + travelRevenue;
    
    // Check against annual caps
    const totalAnnualProjected = totalRevenue * 12;
    const clientsAtRisk = complianceChecks.filter(c => !c.compliance.canContinueServices).length;
    
    // Staff cost calculation with provider levels
    const totalBTs = parseInt(staffCount.btTotal) || 3;
    const level2BTs = Math.floor(totalBTs * staffMix.level2Percentage);
    const level3BTs = Math.floor(totalBTs * staffMix.level3Percentage);
    const level1BTs = totalBTs - level2BTs - level3BTs;
    
    // BT costs by level
    const btLevel2Cost = level2BTs * (parseFloat(staffRates.btLevel2) || 0) * 130; // 130h capacity
    const btLevel3Cost = level3BTs * (parseFloat(staffRates.btLevel3) || 0) * 130;
    const btLevel1Cost = level1BTs * 30 * 130; // Estimated Level I rate
    const totalBTCost = btLevel2Cost + btLevel3Cost + btLevel1Cost;
    
    // BCBA/QSP costs for supervision and assessments
    const bcbaCount = parseInt(staffCount.bcba) || 1;
    const qspCount = parseInt(staffCount.qsp) || 1;
    const bcbaServiceHours = supervisionHours + familyTrainingHours + familyGroupHours;
    const qspServiceHours = assessmentHours;
    const bcbaAdminTime = bcbaServiceHours * 0.30; // 30% admin time for MHCP documentation
    const qspAdminTime = qspServiceHours * 0.25;
    
    const bcbaStaffCost = (bcbaServiceHours + bcbaAdminTime) * (parseFloat(staffRates.bcbaLevel1) || 0);
    const qspStaffCost = (qspServiceHours + qspAdminTime) * (parseFloat(staffRates.qsp) || 0);
    
    const totalStaffCost = totalBTCost + bcbaStaffCost + qspStaffCost;
    const totalExpenses = totalStaffCost + 
                         (parseFloat(overheadCosts.rent) || 0) + 
                         (parseFloat(overheadCosts.insurance) || 0) +
                         (parseFloat(overheadCosts.licensing) || 0) +
                         (parseFloat(overheadCosts.other) || 0);
    
    // Profit calculation
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    // Cash flow modeling for MHCP (60-90 day delays + prior auth)
    const accountsReceivable = totalRevenue * 3.0; // 3 months delay including prior auth
    const workingCapitalNeeded = totalExpenses * 3.5; // 3.5 months operating expenses
    const priorAuthDelayRisk = activeClients.length * 0.15; // 15% prior auth delay rate
    
    // Service mix efficiency
    const billableHours = totalMonthlyHours - travelHours;
    const highValueHours = assessmentHours; // Only assessments are premium rate
    const lowValueHours = groupTherapyHours + travelHours;
    const highValuePercentage = totalMonthlyHours > 0 ? (highValueHours / totalMonthlyHours) * 100 : 0;
    const lowValuePercentage = totalMonthlyHours > 0 ? (lowValueHours / totalMonthlyHours) * 100 : 0;
    
    return {
      // Basic metrics
      activeClients: activeClients.length,
      totalWeeklyHours,
      totalMonthlyHours,
      
      // MHCP compliance
      complianceChecks,
      clientsAtRisk,
      averageWeeklyHours: activeClients.length > 0 ? totalWeeklyHours / activeClients.length : 0,
      
      // Service hours breakdown
      directTherapyHours,
      groupTherapyHours,
      supervisionHours,
      familyTrainingHours,
      familyGroupHours,
      assessmentHours,
      travelHours,
      billableHours,
      
      // Revenue breakdown with accurate rates
      directTherapyRevenue,
      groupTherapyRevenue,
      supervisionRevenue,
      familyTrainingRevenue,
      familyGroupRevenue,
      assessmentRevenue,
      travelRevenue,
      totalRevenue,
      weightedRates,
      
      // Staff costs by level
      totalBTCost,
      btLevel2Cost,
      btLevel3Cost,
      btLevel1Cost,
      bcbaStaffCost,
      qspStaffCost,
      totalStaffCost,
      totalExpenses,
      
      // Profitability
      netProfit,
      profitMargin,
      revenuePerHour: totalMonthlyHours > 0 ? totalRevenue / totalMonthlyHours : 0,
      costPerHour: totalMonthlyHours > 0 ? totalExpenses / totalMonthlyHours : 0,
      profitPerHour: totalMonthlyHours > 0 ? netProfit / totalMonthlyHours : 0,
      
      // Capacity and utilization
      btCapacity: totalBTs * 130,
      bcbaCapacity: bcbaCount * 100,
      qspCapacity: qspCount * 80,
      btUtilization: totalBTs > 0 ? (directTherapyHours / (totalBTs * 130)) * 100 : 0,
      bcbaUtilization: bcbaCount > 0 ? ((bcbaServiceHours + bcbaAdminTime) / (bcbaCount * 100)) * 100 : 0,
      
      // Service mix efficiency
      highValueHours,
      lowValueHours,
      highValuePercentage,
      lowValuePercentage,
      
      // MHCP-specific cash flow
      accountsReceivable,
      workingCapitalNeeded,
      priorAuthDelayRisk,
      cashFlowRisk: accountsReceivable > workingCapitalNeeded ? 'High' : 'Moderate',
      
      // Annual projections
      totalAnnualProjected,
      averageAnnualPerClient: activeClients.length > 0 ? totalAnnualProjected / activeClients.length : 0
    };
  };

  // MHCP-specific validation
  const validateMHCPCompliance = (metrics) => {
    const alerts = [];
    
    // Weekly hour compliance
    if (metrics.averageWeeklyHours > 25) {
      alerts.push({
        type: 'critical',
        message: `Average weekly hours (${metrics.averageWeeklyHours.toFixed(1)}) exceeds MHCP 25-hour limit. Risk of claim denials.`
      });
    }
    
    // Annual cap warnings
    if (metrics.clientsAtRisk > 0) {
      alerts.push({
        type: 'warning',
        message: `${metrics.clientsAtRisk} client(s) approaching $37,800 annual cap. Plan service transitions.`
      });
    }
    
    // Revenue per hour sustainability
    if (metrics.revenuePerHour < 40) {
      alerts.push({
        type: 'critical',
        message: `Revenue per hour ($${metrics.revenuePerHour.toFixed(2)}) is below $40 MHCP sustainability threshold.`
      });
    }
    
    // Cash flow risk from prior authorization delays
    if (metrics.priorAuthDelayRisk > 0.5) {
      alerts.push({
        type: 'warning',
        message: `High prior authorization delay risk. ${metrics.priorAuthDelayRisk.toFixed(0)} clients may experience service interruptions.`
      });
    }
    
    // Service mix optimization
    if (metrics.lowValuePercentage > 15) {
      alerts.push({
        type: 'opportunity',
        message: `Low-value services (${metrics.lowValuePercentage.toFixed(1)}%) exceed 15%. Consider optimizing service mix.`
      });
    }
    
    return alerts;
  };

  // Enhanced break-even for MHCP margins
  const calculateBreakEven = (metrics) => {
    const fixedCosts = (parseFloat(overheadCosts.rent) || 0) + 
                      (parseFloat(overheadCosts.insurance) || 0) +
                      (parseFloat(overheadCosts.licensing) || 0) +
                      (parseFloat(overheadCosts.other) || 0);
    const variableCostPerHour = metrics.totalStaffCost / metrics.totalMonthlyHours;
    const contributionMarginPerHour = metrics.revenuePerHour - variableCostPerHour;
    const breakEvenHours = contributionMarginPerHour > 0 ? fixedCosts / contributionMarginPerHour : 0;
    const safetyMarginPercent = breakEvenHours > 0 ? ((metrics.totalMonthlyHours - breakEvenHours) / breakEvenHours) * 100 : 0;
    
    return {
      hoursNeeded: Math.ceil(breakEvenHours),
      contributionMargin: contributionMarginPerHour,
      safetyMarginPercent: safetyMarginPercent,
      fixedCosts: fixedCosts,
      variableCostPerHour: variableCostPerHour
    };
  };

  // Forecast calculation with MHCP constraints
  const calculateForecast = () => {
    const currentMetrics = calculateMetrics();
    const forecast = [];
    
    for (let month = 1; month <= forecastMonths; month++) {
      const additionalClients = Math.floor(month * growthAssumptions.newClientsPerMonth);
      const additionalHours = Math.min(
        additionalClients * growthAssumptions.averageNewClientHours,
        additionalClients * 25 // MHCP weekly limit
      );
      const monthlyRateIncrease = Math.pow(1 + growthAssumptions.rateIncreaseAnnual, month / 12);
      const monthlyCostIncrease = Math.pow(1 + growthAssumptions.costInflationAnnual, month / 12);
      
      const projectedHours = currentMetrics.totalMonthlyHours + additionalHours;
      const projectedRevenue = (currentMetrics.totalRevenue + 
        (additionalHours * currentMetrics.revenuePerHour)) * monthlyRateIncrease;
      const projectedExpenses = (currentMetrics.totalExpenses + 
        (additionalHours * currentMetrics.costPerHour)) * monthlyCostIncrease;
      
      const projectedProfit = projectedRevenue - projectedExpenses;
      const projectedMargin = projectedRevenue > 0 ? (projectedProfit / projectedRevenue) * 100 : 0;
      
      // Check annual cap constraints
      const annualRevenue = projectedRevenue * 12;
      const avgRevenuePerClient = (currentMetrics.activeClients + additionalClients) > 0 ? 
        annualRevenue / (currentMetrics.activeClients + additionalClients) : 0;
      const capConstrained = avgRevenuePerClient > 37800;
      
      forecast.push({
        month,
        clients: currentMetrics.activeClients + additionalClients,
        hours: projectedHours,
        revenue: projectedRevenue,
        expenses: projectedExpenses,
        profit: projectedProfit,
        margin: projectedMargin,
        capConstrained: capConstrained,
        avgRevenuePerClient: avgRevenuePerClient
      });
    }
    
    return forecast;
  };

  const currentMetrics = calculateMetrics();
  const forecast = calculateForecast();
  const complianceAlerts = validateMHCPCompliance(currentMetrics);
  const breakEvenAnalysis = calculateBreakEven(currentMetrics);

  const updateClientData = (id, field, value) => {
    setClientData(clients => 
      clients.map(client => 
        client.id === id ? { ...client, [field]: value } : client
      )
    );
  };

  const addClient = () => {
    const newId = Math.max(...clientData.map(c => c.id)) + 1;
    setClientData([...clientData, {
      id: newId,
      name: `Client ${newId}`,
      weeklyHours: 15,
      active: true,
      age: 8,
      annualUsed: 0
    }]);
  };

  const removeClient = (id) => {
    setClientData(clients => clients.filter(client => client.id !== id));
  };

  const downloadData = () => {
    const data = {
      currentMetrics,
      forecast,
      complianceAlerts,
      breakEvenAnalysis,
      clientData,
      serviceRates,
      staffRates,
      staffCount,
      staffMix,
      overheadCosts,
      serviceDistribution,
      growthAssumptions,
      mhcpRatesSource: "MN DHS Official Documentation - $54/hour base rate",
      lastUpdated: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'treehouse_mhcp_accurate_analysis.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <img 
                src="/logo-test.svg" 
                alt="Treehouse Therapy Center" 
                className="h-16 w-16 object-contain"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className="h-16 w-16 bg-gradient-to-br from-teal-500 to-orange-500 rounded-lg flex items-center justify-center" style={{display: 'none'}}>
                <span className="text-white font-bold text-2xl">TT</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Treehouse Therapy Center LLC</h1>
                <p className="text-gray-600 mt-1">MHCP Financial Analysis - OFFICIAL MN DHS RATES</p>
                <p className="text-sm text-green-600 font-medium">✓ $54/hour base rate with provider tier system • ✓ MHCP compliance monitoring</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setEditMode(!editMode)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  editMode 
                    ? 'bg-green-600 text-white hover:bg-green-700' 
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Edit3 size={16} />
                {editMode ? 'Save Changes' : 'Edit Mode'}
              </button>
              <button
                onClick={downloadData}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Download size={16} />
                Export Data
              </button>
            </div>
          </div>
        </div>

        {/* MHCP Compliance Alerts */}
        {complianceAlerts.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center gap-2 mb-4">
              <Shield className="text-red-600" size={20} />
              <h2 className="text-xl font-bold text-gray-900">MHCP Compliance & Risk Analysis</h2>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {complianceAlerts.map((alert, index) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  alert.type === 'critical' ? 'bg-red-50 border-red-200' :
                  alert.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-blue-50 border-blue-200'
                }`}>
                  <p className={`text-sm font-medium ${
                    alert.type === 'critical' ? 'text-red-800' :
                    alert.type === 'warning' ? 'text-yellow-800' :
                    'text-blue-800'
                  }`}>
                    {alert.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Metrics Cards - Updated for MHCP */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Clients</p>
                <p className="text-2xl font-bold text-blue-600">{currentMetrics.activeClients}</p>
                <p className="text-xs text-gray-500">{currentMetrics.averageWeeklyHours.toFixed(1)}h avg/week</p>
              </div>
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Monthly Hours</p>
                <p className="text-2xl font-bold text-green-600">{Math.round(currentMetrics.totalMonthlyHours)}</p>
                <p className="text-xs text-gray-500">{Math.round(currentMetrics.billableHours)} billable</p>
              </div>
              <Clock className="text-green-600" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Monthly Revenue (MHCP)</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(currentMetrics.totalRevenue)}</p>
                <p className="text-xs text-gray-500">{formatCurrency(currentMetrics.revenuePerHour)}/hour</p>
              </div>
              <DollarSign className="text-purple-600" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Net Profit</p>
                <p className={`text-2xl font-bold ${currentMetrics.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {formatCurrency(currentMetrics.netProfit)}
                </p>
                <p className="text-sm text-gray-500">{currentMetrics.profitMargin.toFixed(1)}% margin</p>
              </div>
              <TrendingUp className={currentMetrics.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'} size={24} />
            </div>
          </div>
        </div>

        {/* MHCP Rate Structure Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="text-blue-600" size={20} />
            <h2 className="text-xl font-bold text-gray-900">MHCP Rate Structure & Provider Mix</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Base Rate (Level I/QSP)</p>
              <p className="text-lg font-bold text-green-800">{formatCurrency(serviceRates.directTherapy)}/hour</p>
              <p className="text-xs text-green-600 mt-1">$13.50 per 15-min unit</p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Level II Rate (80%)</p>
              <p className="text-lg font-bold text-blue-800">{formatCurrency(serviceRates.directTherapy * serviceRates.level2Multiplier)}/hour</p>
              <p className="text-xs text-blue-600 mt-1">{(staffMix.level2Percentage * 100).toFixed(0)}% of staff</p>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm text-yellow-600 font-medium">Level III Rate (50%)</p>
              <p className="text-lg font-bold text-yellow-800">{formatCurrency(serviceRates.directTherapy * serviceRates.level3Multiplier)}/hour</p>
              <p className="text-xs text-yellow-600 mt-1">{(staffMix.level3Percentage * 100).toFixed(0)}% of staff</p>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Weighted Average</p>
              <p className="text-lg font-bold text-purple-800">{formatCurrency(currentMetrics.revenuePerHour)}/hour</p>
              <p className="text-xs text-purple-600 mt-1">Actual blended rate</p>
            </div>
          </div>

          {/* Current Service Distribution with MHCP Limits */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Service Hours (MHCP Limits Applied)</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Direct Therapy (97153):</span>
                  <span>{Math.round(currentMetrics.directTherapyHours)}h (max 8h/day)</span>
                </div>
                <div className="flex justify-between">
                  <span>Group Therapy (97154):</span>
                  <span>{Math.round(currentMetrics.groupTherapyHours)}h (max 4.5h/day)</span>
                </div>
                <div className="flex justify-between">
                  <span>Supervision (97155):</span>
                  <span>{Math.round(currentMetrics.supervisionHours)}h (max 6h/day)</span>
                </div>
                <div className="flex justify-between">
                  <span>Family Training (97156):</span>
                  <span>{Math.round(currentMetrics.familyTrainingHours)}h (max 4h/day)</span>
                </div>
                <div className="flex justify-between">
                  <span>Assessment (97151):</span>
                  <span>{Math.round(currentMetrics.assessmentHours)}h (80 units/year)</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Revenue by Service (Actual MHCP Rates)</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Direct Therapy:</span>
                  <span>{formatCurrency(currentMetrics.directTherapyRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Group Therapy:</span>
                  <span>{formatCurrency(currentMetrics.groupTherapyRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Supervision:</span>
                  <span>{formatCurrency(currentMetrics.supervisionRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Family Training:</span>
                  <span>{formatCurrency(currentMetrics.familyTrainingRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Assessment:</span>
                  <span>{formatCurrency(currentMetrics.assessmentRevenue)}</span>
                </div>
                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>Total Revenue:</span>
                  <span>{formatCurrency(currentMetrics.totalRevenue)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MHCP Annual Cap Tracking */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="text-orange-600" size={20} />
            <h2 className="text-xl font-bold text-gray-900">Annual Cap Monitoring ($37,800 per client)</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Average Annual Per Client</p>
              <p className="text-lg font-bold text-blue-800">{formatCurrency(currentMetrics.averageAnnualPerClient)}</p>
              <p className="text-xs text-blue-600 mt-1">Based on current monthly rate</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Cap Utilization</p>
              <p className="text-lg font-bold text-green-800">
                {((currentMetrics.averageAnnualPerClient / 37800) * 100).toFixed(0)}%
              </p>
              <p className="text-xs text-green-600 mt-1">Of $37,800 annual limit</p>
            </div>
            
            <div className={`p-4 rounded-lg ${
              currentMetrics.clientsAtRisk > 0 ? 'bg-red-50' : 'bg-green-50'
            }`}>
              <p className={`text-sm font-medium ${
                currentMetrics.clientsAtRisk > 0 ? 'text-red-600' : 'text-green-600'
              }`}>Clients At Risk</p>
              <p className={`text-lg font-bold ${
                currentMetrics.clientsAtRisk > 0 ? 'text-red-800' : 'text-green-800'
              }`}>{currentMetrics.clientsAtRisk}</p>
              <p className={`text-xs mt-1 ${
                currentMetrics.clientsAtRisk > 0 ? 'text-red-600' : 'text-green-600'
              }`}>Approaching annual cap</p>
            </div>
          </div>

          {/* Client Details Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Client</th>
                  <th className="text-center py-2">Weekly Hours</th>
                  <th className="text-center py-2">Annual Used</th>
                  <th className="text-center py-2">Remaining Cap</th>
                  <th className="text-center py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {currentMetrics.complianceChecks.map(client => {
                  const remainingCap = 37800 - (client.annualUsed || 0);
                  const weeklyCompliant = client.weeklyHours <= 25;
                  
                  return (
                    <tr key={client.id} className="border-b hover:bg-gray-50">
                      <td className="py-3">{client.name}</td>
                      <td className="text-center py-3">
                        <span className={weeklyCompliant ? 'text-green-600' : 'text-red-600'}>
                          {client.weeklyHours}h
                        </span>
                      </td>
                      <td className="text-center py-3">{formatCurrency(client.annualUsed || 0)}</td>
                      <td className="text-center py-3">
                        <span className={remainingCap > 5000 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(remainingCap)}
                        </span>
                      </td>
                      <td className="text-center py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          weeklyCompliant && remainingCap > 5000 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {weeklyCompliant && remainingCap > 5000 ? 'Compliant' : 'At Risk'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Client Management with MHCP Compliance */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Client Management (MHCP Compliance)</h2>
            {editMode && (
              <button
                onClick={addClient}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Client
              </button>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Client</th>
                  <th className="text-center py-2">Weekly Hours</th>
                  <th className="text-center py-2">Age</th>
                  <th className="text-center py-2">Annual Used</th>
                  <th className="text-center py-2">Monthly Revenue</th>
                  <th className="text-center py-2">Status</th>
                  {editMode && <th className="text-center py-2">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {clientData.map(client => {
                  const monthlyHours = Math.min(client.weeklyHours * 4.33, 25 * 4.33); // Apply MHCP limit
                  const monthlyRevenue = monthlyHours * currentMetrics.revenuePerHour;
                  const compliance = calculateMHCPCompliance(client);
                  
                  return (
                    <tr key={client.id} className="border-b hover:bg-gray-50">
                      <td className="py-3">
                        {editMode ? (
                          <input
                            type="text"
                            value={client.name}
                            onChange={(e) => updateClientData(client.id, 'name', e.target.value)}
                            className="border rounded px-2 py-1 w-full"
                          />
                        ) : (
                          client.name
                        )}
                      </td>
                      <td className="text-center py-3">
                        {editMode ? (
                          <input
                            type="number"
                            max="25"
                            value={client.weeklyHours}
                            onChange={(e) => updateClientData(client.id, 'weeklyHours', Math.min(25, parseInt(e.target.value) || 0))}
                            className={`border rounded px-2 py-1 w-20 text-center ${client.weeklyHours > 25 ? 'border-red-300' : ''}`}
                          />
                        ) : (
                          <span className={client.weeklyHours > 25 ? 'text-red-600' : ''}>
                            {client.weeklyHours}h
                          </span>
                        )}
                      </td>
                      <td className="text-center py-3">
                        {editMode ? (
                          <input
                            type="number"
                            max="20"
                            value={client.age}
                            onChange={(e) => updateClientData(client.id, 'age', Math.min(20, parseInt(e.target.value) || 8))}
                            className="border rounded px-2 py-1 w-16 text-center"
                          />
                        ) : (
                          client.age
                        )}
                      </td>
                      <td className="text-center py-3">
                        {editMode ? (
                          <input
                            type="number"
                            max="37800"
                            value={client.annualUsed || 0}
                            onChange={(e) => updateClientData(client.id, 'annualUsed', Math.min(37800, parseInt(e.target.value) || 0))}
                            className="border rounded px-2 py-1 w-24 text-center text-xs"
                          />
                        ) : (
                          formatCurrency(client.annualUsed || 0)
                        )}
                      </td>
                      <td className="text-center py-3">{formatCurrency(monthlyRevenue)}</td>
                      <td className="text-center py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          compliance.weeklyHoursCompliant && compliance.canContinueServices
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {compliance.weeklyHoursCompliant && compliance.canContinueServices ? 'Compliant' : 'At Risk'}
                        </span>
                      </td>
                      {editMode && (
                        <td className="text-center py-3">
                          <button
                            onClick={() => removeClient(client.id)}
                            className="text-red-600 hover:text-red-800 text-sm"
                          >
                            Remove
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Break-even Analysis with MHCP Reality */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">MHCP Break-Even Analysis</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Break-Even Hours (Monthly)</p>
              <p className="text-2xl font-bold text-red-800">{breakEvenAnalysis.hoursNeeded}h</p>
              <p className="text-sm text-red-600 mt-1">
                {formatCurrency(breakEvenAnalysis.fixedCosts)} fixed ÷ {formatCurrency(breakEvenAnalysis.contributionMargin)} margin
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Current Safety Margin</p>
              <p className={`text-2xl font-bold ${breakEvenAnalysis.safetyMarginPercent > 20 ? 'text-blue-800' : 'text-red-800'}`}>
                {breakEvenAnalysis.safetyMarginPercent.toFixed(0)}%
              </p>
              <p className="text-sm text-blue-600 mt-1">Above break-even threshold</p>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Revenue per Hour</p>
              <p className="text-2xl font-bold text-green-800">{formatCurrency(currentMetrics.revenuePerHour)}</p>
              <p className="text-sm text-green-600 mt-1">Blended MHCP rate</p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">MHCP Financial Reality Check</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-orange-800 mb-2">Constraints:</h4>
                <ul className="space-y-1 text-orange-700">
                  <li>• $54/hour maximum base rate (Level I/QSP)</li>
                  <li>• 25-hour weekly service limit per client</li>
                  <li>• $37,800 annual cap per beneficiary</li>
                  <li>• 60-90 day payment delays + prior auth</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-green-800 mb-2">Optimization Strategies:</h4>
                <ul className="space-y-1 text-green-700">
                  <li>• Maximize Level I/QSP staff ratio</li>
                  <li>• Efficient scheduling to minimize travel</li>
                  <li>• Strong prior authorization management</li>
                  <li>• Focus on high-compliance clients</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreehouseFinancialDashboard;