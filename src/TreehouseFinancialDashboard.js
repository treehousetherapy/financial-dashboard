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
  
  // OFFICIAL MHCP SERVICE RATES - From MN DHS EIDBI Billing Grid Nov 2024
  const [serviceRates, setServiceRates] = useState({
    // Per 15-minute unit rates
    cmde: 50.11,                // 97151: CMDE per 15 Minutes
    directTherapy: 20.17,       // 97153: ABA Individual Therapy per 15 Minutes  
    groupTherapy: 6.72,         // 97154: ABA Group per 15 Minutes
    supervision: 20.17,         // 97155: Observation & Direction per 15 Minutes
    familyTraining: 20.17,      // 97156: Family/Caregiver Training per 15 Minutes
    familyGroup: 6.72,          // 97157: Family Training Group per 15 Minutes
    
    // Per encounter rates
    itp: 94.80,                 // H0032: ITP per encounter
    coordinatedCare: 174.22,    // T1024: Coordinated Care Conference per encounter
    
    // Per minute rate
    travelTime: 0.52            // H0046: Travel Time per minute
  });
  
  // Service frequency and duration assumptions
  const [serviceSettings, setServiceSettings] = useState({
    // How often services occur (per month)
    itpFrequency: 1,            // ITP sessions per month per client
    coordinatedCareFrequency: 0.5, // Coordinated care conferences per month per client
    
    // Average session durations for encounter-based services
    avgItpDuration: 90,         // Average ITP session length in minutes
    avgCoordinatedCareDuration: 60, // Average coordinated care session length in minutes
    
    // Travel assumptions
    avgTravelPerSession: 15     // Average travel time per session in minutes
  });
  
  const [staffRates, setStaffRates] = useState({
    bt: 25,
    bcba: 47
  });
  
  const [overheadCosts, setOverheadCosts] = useState({
    rent: 550,
    insurance: 300,
    licensing: 200,
    other: 500
  });
  
  // Service distribution for time-based services only
  const [serviceDistribution, setServiceDistribution] = useState({
    directTherapy: 0.70,         // 70% - Core ABA service (97153)
    supervision: 0.15,           // 15% - BCBA supervision (97155)
    familyTraining: 0.08,        // 8% - Family training (97156)
    groupTherapy: 0.04,          // 4% - Group ABA (97154)
    familyGroup: 0.02,           // 2% - Family group (97157)
    cmde: 0.01                   // 1% - Assessments (97151)
    // Note: ITP, Coordinated Care, and Travel are calculated separately as encounter/frequency-based
  });
  
  const [growthAssumptions, setGrowthAssumptions] = useState({
    newClientsPerMonth: 0.5,
    averageNewClientHours: 15,
    rateIncreaseAnnual: 0.03,
    costInflationAnnual: 0.025
  });

  // Staff management state
  const [staffCount, setStaffCount] = useState({
    bt: 2,
    bcba: 1
  });

  // Calculate revenue correctly based on billing units
  const calculateServiceRevenue = (hours, clients) => {
    // Time-based services (per 15-minute unit)
    const directTherapyHours = hours * serviceDistribution.directTherapy;
    const supervisionHours = hours * serviceDistribution.supervision;
    const familyTrainingHours = hours * serviceDistribution.familyTraining;
    const groupTherapyHours = hours * serviceDistribution.groupTherapy;
    const familyGroupHours = hours * serviceDistribution.familyGroup;
    const cmdeHours = hours * serviceDistribution.cmde;
    
    // Convert hours to 15-minute units and calculate revenue
    const directTherapyRevenue = directTherapyHours * 4 * serviceRates.directTherapy;
    const supervisionRevenue = supervisionHours * 4 * serviceRates.supervision;
    const familyTrainingRevenue = familyTrainingHours * 4 * serviceRates.familyTraining;
    const groupTherapyRevenue = groupTherapyHours * 4 * serviceRates.groupTherapy;
    const familyGroupRevenue = familyGroupHours * 4 * serviceRates.familyGroup;
    const cmdeRevenue = cmdeHours * 4 * serviceRates.cmde;
    
    // Encounter-based services (per session regardless of length)
    const itpSessions = clients * serviceSettings.itpFrequency;
    const coordinatedCareSessions = clients * serviceSettings.coordinatedCareFrequency;
    const itpRevenue = itpSessions * serviceRates.itp;
    const coordinatedCareRevenue = coordinatedCareSessions * serviceRates.coordinatedCare;
    
    // Travel time (per minute)
    const totalSessions = (directTherapyHours + supervisionHours + familyTrainingHours + 
                          groupTherapyHours + familyGroupHours + cmdeHours) / 1.5 + // Assume 1.5 hour avg session
                          itpSessions + coordinatedCareSessions;
    const totalTravelMinutes = totalSessions * serviceSettings.avgTravelPerSession;
    const travelRevenue = totalTravelMinutes * serviceRates.travelTime;
    
    return {
      // Time-based service hours
      directTherapyHours,
      supervisionHours,
      familyTrainingHours,
      groupTherapyHours,
      familyGroupHours,
      cmdeHours,
      
      // Time-based revenue
      directTherapyRevenue,
      supervisionRevenue,
      familyTrainingRevenue,
      groupTherapyRevenue,
      familyGroupRevenue,
      cmdeRevenue,
      
      // Encounter-based
      itpSessions,
      coordinatedCareSessions,
      itpRevenue,
      coordinatedCareRevenue,
      
      // Travel
      totalTravelMinutes,
      travelRevenue,
      
      // Totals
      totalTimeBasedHours: directTherapyHours + supervisionHours + familyTrainingHours + 
                          groupTherapyHours + familyGroupHours + cmdeHours,
      totalRevenue: directTherapyRevenue + supervisionRevenue + familyTrainingRevenue + 
                   groupTherapyRevenue + familyGroupRevenue + cmdeRevenue + 
                   itpRevenue + coordinatedCareRevenue + travelRevenue
    };
  };

  // MHCP compliance calculations
  const calculateMHCPCompliance = (client) => {
    const ANNUAL_CAP = 37800;
    const WEEKLY_HOUR_LIMIT = 25;
    
    const weeklyHoursCompliant = client.weeklyHours <= WEEKLY_HOUR_LIMIT;
    const annualCapRemaining = ANNUAL_CAP - (client.annualUsed || 0);
    const canContinueServices = annualCapRemaining > 0;
    
    return {
      weeklyHoursCompliant,
      annualCapRemaining,
      canContinueServices,
      weeklyLimit: WEEKLY_HOUR_LIMIT
    };
  };

  // Main financial calculations
  const calculateMetrics = () => {
    const activeClients = clientData.filter(client => client.active);
    // Cap hours at 25 per client for MHCP billing compliance (users can enter higher for scenario planning)
    const totalWeeklyHours = activeClients.reduce((sum, client) => sum + Math.min(client.weeklyHours, 25), 0);
    const totalMonthlyHours = totalWeeklyHours * 4.33;
    
    // Calculate service revenue with correct billing units
    const serviceRevenue = calculateServiceRevenue(totalMonthlyHours, activeClients.length);
    
    // Check MHCP compliance
    const complianceChecks = activeClients.map(client => ({
      ...client,
      compliance: calculateMHCPCompliance(client)
    }));
    
    // Staff cost calculation
    const btCount = parseInt(staffCount.bt) || 2;
    const bcbaCount = parseInt(staffCount.bcba) || 1;
    const btMonthlyCapacity = btCount * 130;
    const btBaseCost = btCount * (parseFloat(staffRates.bt) || 0) * 80;
    const btOvertimeCost = serviceRevenue.directTherapyHours > btMonthlyCapacity ? 
      (serviceRevenue.directTherapyHours - btMonthlyCapacity) * (parseFloat(staffRates.bt) || 0) * 1.5 : 0;
    const btStaffCost = btBaseCost + btOvertimeCost;
    
    // BCBA costs for supervision, family training, CMDE, ITP, and coordinated care
    const bcbaDirectServiceHours = serviceRevenue.supervisionHours + serviceRevenue.familyTrainingHours + 
                                  serviceRevenue.cmdeHours + 
                                  (serviceRevenue.itpSessions * serviceSettings.avgItpDuration / 60) +
                                  (serviceRevenue.coordinatedCareSessions * serviceSettings.avgCoordinatedCareDuration / 60);
    const bcbaAdminTime = bcbaDirectServiceHours * 0.25;
    const bcbaTotalHours = bcbaDirectServiceHours + bcbaAdminTime;
    const bcbaStaffCost = bcbaTotalHours * (parseFloat(staffRates.bcba) || 0);
    
    const totalStaffCost = btStaffCost + bcbaStaffCost;
    const totalExpenses = totalStaffCost + 
                         (parseFloat(overheadCosts.rent) || 0) + 
                         (parseFloat(overheadCosts.insurance) || 0) +
                         (parseFloat(overheadCosts.licensing) || 0) +
                         (parseFloat(overheadCosts.other) || 0);
    
    // Profit calculation
    const netProfit = serviceRevenue.totalRevenue - totalExpenses;
    const profitMargin = serviceRevenue.totalRevenue > 0 ? (netProfit / serviceRevenue.totalRevenue) * 100 : 0;
    
    // Calculate effective hourly rates for encounter services
    const effectiveItpHourlyRate = serviceSettings.avgItpDuration > 0 ? 
      (serviceRates.itp / (serviceSettings.avgItpDuration / 60)) : 0;
    const effectiveCoordinatedCareHourlyRate = serviceSettings.avgCoordinatedCareDuration > 0 ? 
      (serviceRates.coordinatedCare / (serviceSettings.avgCoordinatedCareDuration / 60)) : 0;
    
    // Service mix analysis
    const highValueRevenue = serviceRevenue.coordinatedCareRevenue + serviceRevenue.itpRevenue + serviceRevenue.cmdeRevenue;
    const lowValueRevenue = serviceRevenue.groupTherapyRevenue + serviceRevenue.familyGroupRevenue + serviceRevenue.travelRevenue;
    const highValuePercentage = serviceRevenue.totalRevenue > 0 ? (highValueRevenue / serviceRevenue.totalRevenue) * 100 : 0;
    const lowValuePercentage = serviceRevenue.totalRevenue > 0 ? (lowValueRevenue / serviceRevenue.totalRevenue) * 100 : 0;
    
    // Cash flow analysis
    const accountsReceivable = serviceRevenue.totalRevenue * 2.5;
    const workingCapitalNeeded = totalExpenses * 3;
    const clientsAtRisk = complianceChecks.filter(c => !c.compliance.canContinueServices).length;
    
    return {
      // Basic metrics
      activeClients: activeClients.length,
      totalWeeklyHours,
      totalMonthlyHours,
      complianceChecks,
      clientsAtRisk,
      averageWeeklyHours: activeClients.length > 0 ? totalWeeklyHours / activeClients.length : 0,
      
      // Service breakdown (from serviceRevenue)
      ...serviceRevenue,
      
      // Effective hourly rates for encounter services
      effectiveItpHourlyRate,
      effectiveCoordinatedCareHourlyRate,
      
      // Staff costs
      btStaffCost,
      bcbaStaffCost,
      totalStaffCost,
      totalExpenses,
      
      // Profitability
      netProfit,
      profitMargin,
      revenuePerHour: totalMonthlyHours > 0 ? serviceRevenue.totalRevenue / totalMonthlyHours : 0,
      costPerHour: totalMonthlyHours > 0 ? totalExpenses / totalMonthlyHours : 0,
      profitPerHour: totalMonthlyHours > 0 ? netProfit / totalMonthlyHours : 0,
      
      // Capacity
      btCapacity: btMonthlyCapacity,
      bcbaCapacity: bcbaCount * 100,
      btUtilization: btMonthlyCapacity > 0 ? (serviceRevenue.directTherapyHours / btMonthlyCapacity) * 100 : 0,
      bcbaUtilization: bcbaCount > 0 ? (bcbaTotalHours / (bcbaCount * 100)) * 100 : 0,
      bcbaDirectHours: bcbaDirectServiceHours,
      bcbaAdminHours: bcbaAdminTime,
      bcbaTotalHours: bcbaTotalHours,
      
      // Service mix efficiency
      highValueRevenue,
      lowValueRevenue,
      highValuePercentage,
      lowValuePercentage,
      
      // Cash flow
      accountsReceivable,
      workingCapitalNeeded,
      cashFlowRisk: accountsReceivable > workingCapitalNeeded ? 'High' : 'Moderate'
    };
  };

  // MHCP-specific validation
  const validateMHCPCompliance = (metrics) => {
    const alerts = [];
    
    if (metrics.averageWeeklyHours > 25) {
      alerts.push({
        type: 'critical',
        message: `Average weekly hours (${metrics.averageWeeklyHours.toFixed(1)}) exceeds MHCP 25-hour limit.`
      });
    }
    
    if (metrics.clientsAtRisk > 0) {
      alerts.push({
        type: 'warning',
        message: `${metrics.clientsAtRisk} client(s) approaching $37,800 annual cap.`
      });
    }
    
    if (metrics.revenuePerHour < 50) {
      alerts.push({
        type: 'critical',
        message: `Revenue per hour ($${metrics.revenuePerHour.toFixed(2)}) is below $50 sustainability threshold.`
      });
    }
    
    if (metrics.highValuePercentage < 20) {
      alerts.push({
        type: 'opportunity',
        message: `High-value services (${metrics.highValuePercentage.toFixed(1)}%) below 20% target. Increase encounter-based services.`
      });
    }
    
    return alerts;
  };

  // Enhanced break-even analysis
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

  // Forecast calculation
  const calculateForecast = () => {
    const currentMetrics = calculateMetrics();
    const forecast = [];
    
    for (let month = 1; month <= forecastMonths; month++) {
      const additionalClients = Math.floor(month * growthAssumptions.newClientsPerMonth);
      const additionalHours = Math.min(
        additionalClients * growthAssumptions.averageNewClientHours,
        additionalClients * 25
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
      
      forecast.push({
        month,
        clients: currentMetrics.activeClients + additionalClients,
        hours: projectedHours,
        revenue: projectedRevenue,
        expenses: projectedExpenses,
        profit: projectedProfit,
        margin: projectedMargin
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
      serviceSettings,
      staffRates,
      staffCount,
      overheadCosts,
      serviceDistribution,
      growthAssumptions,
      officialMHCPSource: "MN DHS EIDBI Billing Grid November 2024",
      lastUpdated: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'treehouse_correct_billing_units_analysis.json';
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
                src="/treehouse-logo-final.png" 
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
                <p className="text-gray-600 mt-1">MHCP Financial Analysis - CORRECT BILLING UNITS</p>
                <p className="text-sm text-green-600 font-medium">✓ Per 15-min unit • ✓ Per encounter • ✓ Per minute billing • ✓ Nov 2024 EIDBI Grid</p>
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
              <AlertTriangle className="text-orange-600" size={20} />
              <h2 className="text-xl font-bold text-gray-900">MHCP Compliance & Revenue Optimization</h2>
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

        {/* Key Metrics Cards */}
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
                <p className="text-xs text-gray-500">{Math.round(currentMetrics.totalTimeBasedHours)} billable</p>
              </div>
              <Clock className="text-green-600" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Monthly Revenue (MHCP)</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(currentMetrics.totalRevenue)}</p>
                <p className="text-xs text-gray-500">{formatCurrency(currentMetrics.revenuePerHour)}/hour avg</p>
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

        {/* Billing Units Explanation Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="text-purple-600" size={20} />
            <h2 className="text-xl font-bold text-gray-900">MHCP Billing Units Breakdown</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">Per 15-Minute Unit</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>CMDE (97151):</span>
                  <span>${serviceRates.cmde} = {formatCurrency(serviceRates.cmde * 4)}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span>ABA Individual (97153):</span>
                  <span>${serviceRates.directTherapy} = {formatCurrency(serviceRates.directTherapy * 4)}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span>ABA Group (97154):</span>
                  <span>${serviceRates.groupTherapy} = {formatCurrency(serviceRates.groupTherapy * 4)}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span>Supervision (97155):</span>
                  <span>${serviceRates.supervision} = {formatCurrency(serviceRates.supervision * 4)}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span>Family Training (97156):</span>
                  <span>${serviceRates.familyTraining} = {formatCurrency(serviceRates.familyTraining * 4)}/hr</span>
                </div>
                <div className="flex justify-between">
                  <span>Family Group (97157):</span>
                  <span>${serviceRates.familyGroup} = {formatCurrency(serviceRates.familyGroup * 4)}/hr</span>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3">Per Encounter</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>ITP (H0032):</span>
                  <span>${serviceRates.itp} per session</span>
                </div>
                <div className="text-xs text-green-600 mb-2">
                  Effective rate: {formatCurrency(currentMetrics.effectiveItpHourlyRate)}/hr 
                  (based on {serviceSettings.avgItpDuration} min avg)
                </div>
                <div className="flex justify-between">
                  <span>Coordinated Care (T1024):</span>
                  <span>${serviceRates.coordinatedCare} per session</span>
                </div>
                <div className="text-xs text-green-600">
                  Effective rate: {formatCurrency(currentMetrics.effectiveCoordinatedCareHourlyRate)}/hr 
                  (based on {serviceSettings.avgCoordinatedCareDuration} min avg)
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-3">Per Minute</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Travel Time (H0046):</span>
                  <span>${serviceRates.travelTime} per minute</span>
                </div>
                <div className="text-xs text-yellow-600">
                  = {formatCurrency(serviceRates.travelTime * 60)}/hour if continuous
                </div>
                <div className="mt-2 text-xs text-yellow-700">
                  Monthly travel: {Math.round(currentMetrics.totalTravelMinutes)} minutes
                  = {formatCurrency(currentMetrics.travelRevenue)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Service Revenue Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-blue-600" size={20} />
            <h2 className="text-xl font-bold text-gray-900">Revenue Breakdown by Service Type</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Time-Based Services (Hours & Revenue)</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>ABA Individual (97153):</span>
                  <span>{Math.round(currentMetrics.directTherapyHours)}h • {formatCurrency(currentMetrics.directTherapyRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Supervision (97155):</span>
                  <span>{Math.round(currentMetrics.supervisionHours)}h • {formatCurrency(currentMetrics.supervisionRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Family Training (97156):</span>
                  <span>{Math.round(currentMetrics.familyTrainingHours)}h • {formatCurrency(currentMetrics.familyTrainingRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>ABA Group (97154):</span>
                  <span>{Math.round(currentMetrics.groupTherapyHours)}h • {formatCurrency(currentMetrics.groupTherapyRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Family Group (97157):</span>
                  <span>{Math.round(currentMetrics.familyGroupHours)}h • {formatCurrency(currentMetrics.familyGroupRevenue)}</span>
                </div>
                <div className="flex justify-between text-blue-600 font-medium">
                  <span>CMDE (97151):</span>
                  <span>{Math.round(currentMetrics.cmdeHours)}h • {formatCurrency(currentMetrics.cmdeRevenue)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Encounter-Based Services (Sessions & Revenue)</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-green-600 font-medium">
                  <span>ITP (H0032):</span>
                  <span>{currentMetrics.itpSessions.toFixed(1)} sessions • {formatCurrency(currentMetrics.itpRevenue)}</span>
                </div>
                <div className="text-xs text-gray-500 ml-4">
                  {serviceSettings.itpFrequency} per client/month × {currentMetrics.activeClients} clients
                </div>
                
                <div className="flex justify-between text-green-600 font-medium">
                  <span>Coordinated Care (T1024):</span>
                  <span>{currentMetrics.coordinatedCareSessions.toFixed(1)} sessions • {formatCurrency(currentMetrics.coordinatedCareRevenue)}</span>
                </div>
                <div className="text-xs text-gray-500 ml-4">
                  {serviceSettings.coordinatedCareFrequency} per client/month × {currentMetrics.activeClients} clients
                </div>
                
                <div className="flex justify-between text-yellow-600">
                  <span>Travel Time (H0046):</span>
                  <span>{Math.round(currentMetrics.totalTravelMinutes)} min • {formatCurrency(currentMetrics.travelRevenue)}</span>
                </div>
                
                <div className="flex justify-between border-t pt-2 font-bold">
                  <span>Total Revenue:</span>
                  <span>{formatCurrency(currentMetrics.totalRevenue)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Service Settings Configuration */}
        {editMode && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Service Frequency & Duration Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-3">Encounter-Based Services</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">ITP Sessions per Client/Month</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={serviceSettings.itpFrequency}
                      onChange={(e) => setServiceSettings({...serviceSettings, itpFrequency: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Avg ITP Duration (minutes)</label>
                    <input
                      type="number"
                      min="0"
                      value={serviceSettings.avgItpDuration}
                      onChange={(e) => setServiceSettings({...serviceSettings, avgItpDuration: parseInt(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Coordinated Care per Client/Month</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={serviceSettings.coordinatedCareFrequency}
                      onChange={(e) => setServiceSettings({...serviceSettings, coordinatedCareFrequency: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Avg Coordinated Care Duration (minutes)</label>
                    <input
                      type="number"
                      min="0"
                      value={serviceSettings.avgCoordinatedCareDuration}
                      onChange={(e) => setServiceSettings({...serviceSettings, avgCoordinatedCareDuration: parseInt(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-3">Travel Time</h4>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Avg Travel per Session (minutes)</label>
                  <input
                    type="number"
                    min="0"
                    value={serviceSettings.avgTravelPerSession}
                    onChange={(e) => setServiceSettings({...serviceSettings, avgTravelPerSession: parseInt(e.target.value) || 0})}
                    className="w-full border rounded px-2 py-1 text-sm"
                  />
                  <p className="text-xs text-yellow-600 mt-1">Rate: ${serviceRates.travelTime}/minute</p>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3">Service Rates (per billing unit)</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">ITP per encounter ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={serviceRates.itp}
                      onChange={(e) => setServiceRates({...serviceRates, itp: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Coordinated Care per encounter ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={serviceRates.coordinatedCare}
                      onChange={(e) => setServiceRates({...serviceRates, coordinatedCare: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Travel per minute ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={serviceRates.travelTime}
                      onChange={(e) => setServiceRates({...serviceRates, travelTime: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Staff Management Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="text-green-600" size={20} />
            <h2 className="text-xl font-bold text-gray-900">Staff Management & Capacity</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Staff Counts */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3">Staff Count</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Behavior Technicians</label>
                  {editMode ? (
                    <input
                      type="number"
                      min="0"
                      value={staffCount.bt}
                      onChange={(e) => setStaffCount({...staffCount, bt: parseInt(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1"
                    />
                  ) : (
                    <p className="text-lg font-bold text-green-800">{staffCount.bt}</p>
                  )}
                  <p className="text-xs text-green-600">Capacity: {staffCount.bt * 130}h/month</p>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">BCBA</label>
                  {editMode ? (
                    <input
                      type="number"
                      min="0"
                      value={staffCount.bcba}
                      onChange={(e) => setStaffCount({...staffCount, bcba: parseInt(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1"
                    />
                  ) : (
                    <p className="text-lg font-bold text-green-800">{staffCount.bcba}</p>
                  )}
                  <p className="text-xs text-green-600">Capacity: {staffCount.bcba * 100}h/month</p>
                </div>
              </div>
            </div>
            
            {/* Staff Rates */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">Hourly Rates</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">BT Rate ($/hour)</label>
                  {editMode ? (
                    <input
                      type="number"
                      min="0"
                      step="0.50"
                      value={staffRates.bt}
                      onChange={(e) => setStaffRates({...staffRates, bt: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1"
                    />
                  ) : (
                    <p className="text-lg font-bold text-blue-800">{formatCurrency(staffRates.bt)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">BCBA Rate ($/hour)</label>
                  {editMode ? (
                    <input
                      type="number"
                      min="0"
                      step="0.50"
                      value={staffRates.bcba}
                      onChange={(e) => setStaffRates({...staffRates, bcba: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1"
                    />
                  ) : (
                    <p className="text-lg font-bold text-blue-800">{formatCurrency(staffRates.bcba)}</p>
                  )}
                </div>
              </div>
            </div>
            
            {/* Utilization */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-800 mb-3">Current Utilization</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">BT Utilization</label>
                  <p className="text-lg font-bold text-purple-800">{currentMetrics.btUtilization.toFixed(1)}%</p>
                  <div className={`w-full bg-gray-200 rounded-full h-2 ${currentMetrics.btUtilization > 100 ? 'bg-red-200' : ''}`}>
                    <div 
                      className={`h-2 rounded-full ${currentMetrics.btUtilization > 100 ? 'bg-red-600' : currentMetrics.btUtilization > 85 ? 'bg-yellow-500' : 'bg-purple-600'}`}
                      style={{width: `${Math.min(currentMetrics.btUtilization, 100)}%`}}
                    ></div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-700 mb-1">BCBA Utilization</label>
                  <p className="text-lg font-bold text-purple-800">{currentMetrics.bcbaUtilization.toFixed(1)}%</p>
                  <div className={`w-full bg-gray-200 rounded-full h-2 ${currentMetrics.bcbaUtilization > 100 ? 'bg-red-200' : ''}`}>
                    <div 
                      className={`h-2 rounded-full ${currentMetrics.bcbaUtilization > 100 ? 'bg-red-600' : currentMetrics.bcbaUtilization > 85 ? 'bg-yellow-500' : 'bg-purple-600'}`}
                      style={{width: `${Math.min(currentMetrics.bcbaUtilization, 100)}%`}}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Staff Costs Summary */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Monthly Staff Costs</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">BT Costs</p>
                <p className="font-bold text-gray-900">{formatCurrency(currentMetrics.btStaffCost)}</p>
              </div>
              <div>
                <p className="text-gray-600">BCBA Costs</p>
                <p className="font-bold text-gray-900">{formatCurrency(currentMetrics.bcbaStaffCost)}</p>
              </div>
              <div>
                <p className="text-gray-600">Total Staff</p>
                <p className="font-bold text-gray-900">{formatCurrency(currentMetrics.totalStaffCost)}</p>
              </div>
              <div>
                <p className="text-gray-600">Staff/Revenue</p>
                <p className="font-bold text-gray-900">{((currentMetrics.totalStaffCost / currentMetrics.totalRevenue) * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Overhead & Expense Management */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Calculator className="text-red-600" size={20} />
            <h2 className="text-xl font-bold text-gray-900">Overhead & Expense Management</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-medium text-red-800 mb-3">Facility Costs</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Monthly Rent</label>
                  {editMode ? (
                    <input
                      type="number"
                      min="0"
                      step="50"
                      value={overheadCosts.rent}
                      onChange={(e) => setOverheadCosts({...overheadCosts, rent: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1"
                    />
                  ) : (
                    <p className="text-lg font-bold text-red-800">{formatCurrency(overheadCosts.rent)}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-orange-50 p-4 rounded-lg">
              <h3 className="font-medium text-orange-800 mb-3">Insurance</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Monthly Insurance</label>
                  {editMode ? (
                    <input
                      type="number"
                      min="0"
                      step="25"
                      value={overheadCosts.insurance}
                      onChange={(e) => setOverheadCosts({...overheadCosts, insurance: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1"
                    />
                  ) : (
                    <p className="text-lg font-bold text-orange-800">{formatCurrency(overheadCosts.insurance)}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-3">Licensing</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Monthly Licensing</label>
                  {editMode ? (
                    <input
                      type="number"
                      min="0"
                      step="25"
                      value={overheadCosts.licensing}
                      onChange={(e) => setOverheadCosts({...overheadCosts, licensing: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1"
                    />
                  ) : (
                    <p className="text-lg font-bold text-yellow-800">{formatCurrency(overheadCosts.licensing)}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">Other Expenses</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-gray-700 mb-1">Monthly Other</label>
                  {editMode ? (
                    <input
                      type="number"
                      min="0"
                      step="25"
                      value={overheadCosts.other}
                      onChange={(e) => setOverheadCosts({...overheadCosts, other: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1"
                    />
                  ) : (
                    <p className="text-lg font-bold text-gray-800">{formatCurrency(overheadCosts.other)}</p>
                  )}
                  <p className="text-xs text-gray-600">Supplies, software, etc.</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Expense Summary */}
          <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Monthly Expense Breakdown</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Staff Costs</p>
                <p className="font-bold text-gray-900">{formatCurrency(currentMetrics.totalStaffCost)}</p>
                <p className="text-xs text-gray-500">{((currentMetrics.totalStaffCost / currentMetrics.totalExpenses) * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-gray-600">Overhead</p>
                <p className="font-bold text-gray-900">{formatCurrency(parseFloat(overheadCosts.rent) + parseFloat(overheadCosts.insurance) + parseFloat(overheadCosts.licensing) + parseFloat(overheadCosts.other))}</p>
                <p className="text-xs text-gray-500">{(((parseFloat(overheadCosts.rent) + parseFloat(overheadCosts.insurance) + parseFloat(overheadCosts.licensing) + parseFloat(overheadCosts.other)) / currentMetrics.totalExpenses) * 100).toFixed(0)}%</p>
              </div>
              <div>
                <p className="text-gray-600">Total Expenses</p>
                <p className="font-bold text-gray-900">{formatCurrency(currentMetrics.totalExpenses)}</p>
                <p className="text-xs text-gray-500">100%</p>
              </div>
              <div>
                <p className="text-gray-600">Expense Ratio</p>
                <p className="font-bold text-gray-900">{((currentMetrics.totalExpenses / currentMetrics.totalRevenue) * 100).toFixed(1)}%</p>
                <p className="text-xs text-gray-500">of revenue</p>
              </div>
              <div>
                <p className="text-gray-600">Cost per Hour</p>
                <p className="font-bold text-gray-900">{formatCurrency(currentMetrics.costPerHour)}</p>
                <p className="text-xs text-gray-500">blended rate</p>
              </div>
            </div>
          </div>
        </div>

        {/* Break-Even Analysis Panel */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-purple-600" size={20} />
            <h2 className="text-xl font-bold text-gray-900">Break-Even Analysis & Financial Health</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-red-50 p-4 rounded-lg">
              <h3 className="font-medium text-red-800 mb-3">Break-Even Metrics</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-red-600">Monthly Hours Needed</p>
                  <p className="text-2xl font-bold text-red-800">{breakEvenAnalysis.hoursNeeded}h</p>
                </div>
                <div>
                  <p className="text-sm text-red-600">Current Safety Margin</p>
                  <p className={`text-lg font-bold ${breakEvenAnalysis.safetyMarginPercent > 20 ? 'text-green-800' : 'text-red-800'}`}>
                    {breakEvenAnalysis.safetyMarginPercent.toFixed(0)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-red-600">Fixed Costs</p>
                  <p className="text-lg font-bold text-red-800">{formatCurrency(breakEvenAnalysis.fixedCosts)}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">Contribution Analysis</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-blue-600">Contribution Margin/Hour</p>
                  <p className="text-lg font-bold text-blue-800">{formatCurrency(breakEvenAnalysis.contributionMargin)}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-600">Variable Cost/Hour</p>
                  <p className="text-lg font-bold text-blue-800">{formatCurrency(breakEvenAnalysis.variableCostPerHour)}</p>
                </div>
                <div>
                  <p className="text-sm text-blue-600">Contribution Ratio</p>
                  <p className="text-lg font-bold text-blue-800">
                    {((breakEvenAnalysis.contributionMargin / currentMetrics.revenuePerHour) * 100).toFixed(1)}%
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3">Financial Health</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-green-600">Current Profit</p>
                  <p className={`text-lg font-bold ${currentMetrics.netProfit >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                    {formatCurrency(currentMetrics.netProfit)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-600">Profit Margin</p>
                  <p className={`text-lg font-bold ${currentMetrics.profitMargin >= 10 ? 'text-green-800' : 'text-red-800'}`}>
                    {currentMetrics.profitMargin.toFixed(1)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-green-600">Cash Flow Risk</p>
                  <p className={`text-lg font-bold ${currentMetrics.cashFlowRisk === 'High' ? 'text-red-800' : 'text-green-800'}`}>
                    {currentMetrics.cashFlowRisk}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Service Distribution Settings */}
        {editMode && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Service Distribution Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-800 mb-3">Time-Based Service Mix</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">ABA Individual (97153) %</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={serviceDistribution.directTherapy}
                      onChange={(e) => setServiceDistribution({...serviceDistribution, directTherapy: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Supervision (97155) %</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={serviceDistribution.supervision}
                      onChange={(e) => setServiceDistribution({...serviceDistribution, supervision: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Family Training (97156) %</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={serviceDistribution.familyTraining}
                      onChange={(e) => setServiceDistribution({...serviceDistribution, familyTraining: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-medium text-green-800 mb-3">Group & Assessment Services</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">ABA Group (97154) %</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={serviceDistribution.groupTherapy}
                      onChange={(e) => setServiceDistribution({...serviceDistribution, groupTherapy: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Family Group (97157) %</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={serviceDistribution.familyGroup}
                      onChange={(e) => setServiceDistribution({...serviceDistribution, familyGroup: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">CMDE (97151) %</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="1"
                      value={serviceDistribution.cmde}
                      onChange={(e) => setServiceDistribution({...serviceDistribution, cmde: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-800 mb-3">Growth & Projections</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">New Clients/Month</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={growthAssumptions.newClientsPerMonth}
                      onChange={(e) => setGrowthAssumptions({...growthAssumptions, newClientsPerMonth: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Avg New Client Hours</label>
                    <input
                      type="number"
                      min="0"
                      max="25"
                      value={growthAssumptions.averageNewClientHours}
                      onChange={(e) => setGrowthAssumptions({...growthAssumptions, averageNewClientHours: parseInt(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Annual Rate Increase %</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="0.1"
                      value={growthAssumptions.rateIncreaseAnnual}
                      onChange={(e) => setGrowthAssumptions({...growthAssumptions, rateIncreaseAnnual: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Distribution Summary */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Current Distribution Total</h4>
              <p className="text-sm text-gray-600">
                Total: {(serviceDistribution.directTherapy + serviceDistribution.supervision + serviceDistribution.familyTraining + 
                        serviceDistribution.groupTherapy + serviceDistribution.familyGroup + serviceDistribution.cmde).toFixed(2)} 
                {(serviceDistribution.directTherapy + serviceDistribution.supervision + serviceDistribution.familyTraining + 
                  serviceDistribution.groupTherapy + serviceDistribution.familyGroup + serviceDistribution.cmde) !== 1.0 && 
                  <span className="text-red-600 ml-2">⚠️ Should equal 1.00</span>}
              </p>
            </div>
          </div>
        )}

        {/* Cash Flow & Working Capital */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="text-blue-600" size={20} />
            <h2 className="text-xl font-bold text-gray-900">Cash Flow & Working Capital Analysis</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3">Accounts Receivable</h3>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-blue-800">{formatCurrency(currentMetrics.accountsReceivable)}</p>
                <p className="text-xs text-blue-600">2.5 months revenue (MHCP delays)</p>
                <p className="text-xs text-gray-600">
                  Days: {((currentMetrics.accountsReceivable / currentMetrics.totalRevenue) * 30).toFixed(0)} days outstanding
                </p>
              </div>
            </div>
            
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="font-medium text-yellow-800 mb-3">Working Capital Needed</h3>
              <div className="space-y-2">
                <p className="text-2xl font-bold text-yellow-800">{formatCurrency(currentMetrics.workingCapitalNeeded)}</p>
                <p className="text-xs text-yellow-600">3 months operating expenses</p>
                <p className="text-xs text-gray-600">
                  Coverage: {(currentMetrics.workingCapitalNeeded / currentMetrics.totalExpenses).toFixed(1)} months
                </p>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${currentMetrics.cashFlowRisk === 'High' ? 'bg-red-50' : 'bg-green-50'}`}>
              <h3 className={`font-medium mb-3 ${currentMetrics.cashFlowRisk === 'High' ? 'text-red-800' : 'text-green-800'}`}>
                Cash Flow Risk
              </h3>
              <div className="space-y-2">
                <p className={`text-2xl font-bold ${currentMetrics.cashFlowRisk === 'High' ? 'text-red-800' : 'text-green-800'}`}>
                  {currentMetrics.cashFlowRisk}
                </p>
                <p className={`text-xs ${currentMetrics.cashFlowRisk === 'High' ? 'text-red-600' : 'text-green-600'}`}>
                  {currentMetrics.cashFlowRisk === 'High' ? 'AR > Working Capital' : 'Adequate reserves'}
                </p>
                <p className="text-xs text-gray-600">
                  Gap: {formatCurrency(Math.abs(currentMetrics.accountsReceivable - currentMetrics.workingCapitalNeeded))}
                </p>
              </div>
            </div>
          </div>
          
          {/* Cash Flow Recommendations */}
          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Cash Flow Management Strategies</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Improve Collections:</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• Submit claims within 24-48 hours of service</li>
                  <li>• Follow up on pending authorizations weekly</li>
                  <li>• Maintain clean claim submission rate >95%</li>
                  <li>• Consider factoring for large AR balances</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-green-800 mb-2">Working Capital:</h4>
                <ul className="space-y-1 text-green-700">
                  <li>• Maintain 3-4 months operating expenses</li>
                  <li>• Establish line of credit for seasonal gaps</li>
                  <li>• Consider invoice factoring at 2-3%</li>
                  <li>• Monitor daily cash flow projections</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Growth Forecasting */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="text-green-600" size={20} />
            <h2 className="text-xl font-bold text-gray-900">Growth Forecasting ({forecastMonths} Months)</h2>
            {editMode && (
              <select
                value={forecastMonths}
                onChange={(e) => setForecastMonths(parseInt(e.target.value))}
                className="ml-4 border rounded px-2 py-1"
              >
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={12}>12 Months</option>
                <option value={24}>24 Months</option>
              </select>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Month</th>
                  <th className="text-center py-2">Clients</th>
                  <th className="text-center py-2">Hours</th>
                  <th className="text-center py-2">Revenue</th>
                  <th className="text-center py-2">Expenses</th>
                  <th className="text-center py-2">Profit</th>
                  <th className="text-center py-2">Margin</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b bg-gray-50">
                  <td className="py-2 font-medium">Current</td>
                  <td className="text-center py-2">{currentMetrics.activeClients}</td>
                  <td className="text-center py-2">{Math.round(currentMetrics.totalMonthlyHours)}</td>
                  <td className="text-center py-2">{formatCurrency(currentMetrics.totalRevenue)}</td>
                  <td className="text-center py-2">{formatCurrency(currentMetrics.totalExpenses)}</td>
                  <td className={`text-center py-2 ${currentMetrics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(currentMetrics.netProfit)}
                  </td>
                  <td className="text-center py-2">{currentMetrics.profitMargin.toFixed(1)}%</td>
                </tr>
                {forecast.map((month, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-2">Month +{month.month}</td>
                    <td className="text-center py-2">{month.clients}</td>
                    <td className="text-center py-2">{Math.round(month.hours)}</td>
                    <td className="text-center py-2">{formatCurrency(month.revenue)}</td>
                    <td className="text-center py-2">{formatCurrency(month.expenses)}</td>
                    <td className={`text-center py-2 ${month.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(month.profit)}
                    </td>
                    <td className="text-center py-2">{month.margin.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Forecast Summary */}
          <div className="mt-6 p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium text-green-800 mb-3">{forecastMonths}-Month Projection Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Projected Clients</p>
                <p className="font-bold text-green-800">{forecast[forecast.length - 1]?.clients || 0}</p>
                <p className="text-xs text-green-600">+{((forecast[forecast.length - 1]?.clients || 0) - currentMetrics.activeClients)} clients</p>
              </div>
              <div>
                <p className="text-gray-600">Revenue Growth</p>
                <p className="font-bold text-green-800">
                  {(((forecast[forecast.length - 1]?.revenue || 0) - currentMetrics.totalRevenue) / currentMetrics.totalRevenue * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-green-600">{formatCurrency((forecast[forecast.length - 1]?.revenue || 0) - currentMetrics.totalRevenue)} increase</p>
              </div>
              <div>
                <p className="text-gray-600">Final Profit</p>
                <p className={`font-bold ${(forecast[forecast.length - 1]?.profit || 0) >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  {formatCurrency(forecast[forecast.length - 1]?.profit || 0)}
                </p>
                <p className="text-xs text-green-600">{(forecast[forecast.length - 1]?.margin || 0).toFixed(1)}% margin</p>
              </div>
              <div>
                <p className="text-gray-600">Growth Rate</p>
                <p className="font-bold text-green-800">
                  {(growthAssumptions.newClientsPerMonth * 12).toFixed(1)} clients/year
                </p>
                <p className="text-xs text-green-600">{(growthAssumptions.newClientsPerMonth * 100).toFixed(1)}% monthly</p>
              </div>
            </div>
          </div>
        </div>

        {/* Client Management */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900">Client Management</h2>
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
                  const monthlyHours = Math.min(client.weeklyHours * 4.33, 25 * 4.33);
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
                            min="0"
                            placeholder="Weekly hours"
                            value={client.weeklyHours === '' ? '' : client.weeklyHours}
                            onChange={(e) => updateClientData(client.id, 'weeklyHours', e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                            className={`border rounded px-2 py-1 w-20 text-center ${client.weeklyHours > 25 ? 'border-red-300 bg-red-50' : ''}`}
                          />
                        ) : (
                          <span className={client.weeklyHours > 25 ? 'text-red-600 font-semibold' : ''}>
                            {client.weeklyHours}h{client.weeklyHours > 25 ? ' ⚠️' : ''}
                          </span>
                        )}
                      </td>
                      <td className="text-center py-3">
                        {editMode ? (
                          <input
                            type="number"
                            min="0"
                            max="21"
                            placeholder="Age"
                            value={client.age === '' ? '' : client.age}
                            onChange={(e) => updateClientData(client.id, 'age', e.target.value === '' ? '' : parseInt(e.target.value) || 8)}
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
                            min="0"
                            max="37800"
                            placeholder="Annual used"
                            value={client.annualUsed === '' || client.annualUsed === undefined ? '' : client.annualUsed}
                            onChange={(e) => updateClientData(client.id, 'annualUsed', e.target.value === '' ? 0 : Math.min(37800, parseInt(e.target.value) || 0))}
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

        {/* Performance Summary */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Financial Performance Summary</h2>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Blended Revenue/Hour</p>
              <p className="text-lg font-bold text-blue-800">{formatCurrency(currentMetrics.revenuePerHour)}</p>
              <p className="text-xs text-blue-600">All services combined</p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <p className="text-sm text-red-600 font-medium">Cost per Hour</p>
              <p className="text-lg font-bold text-red-800">{formatCurrency(currentMetrics.costPerHour)}</p>
              <p className="text-xs text-red-600">Staff + overhead</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Profit per Hour</p>
              <p className="text-lg font-bold text-green-800">{formatCurrency(currentMetrics.profitPerHour)}</p>
              <p className="text-xs text-green-600">Net margin</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Break-Even Hours</p>
              <p className="text-lg font-bold text-purple-800">{breakEvenAnalysis.hoursNeeded}h</p>
              <p className="text-xs text-purple-600">Monthly requirement</p>
            </div>
          </div>

          {/* Strategy Recommendations */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">MHCP Revenue Optimization Strategy</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-green-800 mb-2">Maximize Encounter-Based Revenue:</h4>
                <ul className="space-y-1 text-green-700">
                  <li>• Increase Coordinated Care frequency (${serviceRates.coordinatedCare}/session)</li>
                  <li>• Schedule regular ITP reviews (${serviceRates.itp}/session)</li>
                  <li>• Efficient session lengths to maximize hourly value</li>
                  <li>• Multiple providers can bill for same encounter</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-blue-800 mb-2">Optimize Time-Based Services:</h4>
                <ul className="space-y-1 text-blue-700">
                  <li>• Focus on CMDE assessments ({formatCurrency(serviceRates.cmde * 4)}/hour)</li>
                  <li>• Minimize low-value group services</li>
                  <li>• Reduce travel time through scheduling</li>
                  <li>• Ensure proper 15-minute unit billing</li>
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