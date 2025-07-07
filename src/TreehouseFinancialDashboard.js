import React, { useState } from 'react';
import { Download, Edit3, TrendingUp, DollarSign, Clock, Users, Calculator } from 'lucide-react';

const TreehouseFinancialDashboard = () => {
  const [editMode, setEditMode] = useState(false);
  const [forecastMonths, setForecastMonths] = useState(6);
  
  // Core editable data
  const [clientData, setClientData] = useState([
    { id: 1, name: 'Client 1', weeklyHours: 6, active: true },
    { id: 2, name: 'Client 2', weeklyHours: 20, active: true },
    { id: 3, name: 'Client 3', weeklyHours: 20, active: true }
  ]);
  
  const [serviceRates, setServiceRates] = useState({
    directTherapy: 80.68,
    supervision: 80.68,
    familyTraining: 80.68,
    itp: 94.80
  });
  
  const [staffRates, setStaffRates] = useState({
    bt: 25,
    bcba: 47
  });
  
  const [overheadCosts, setOverheadCosts] = useState({
    rent: 550,
    other: 1000
  });
  
  const [serviceDistribution, setServiceDistribution] = useState({
    directTherapy: 0.90,
    supervision: 0.09,
    familyTraining: 0.01
  });
  
  const [growthAssumptions, setGrowthAssumptions] = useState({
    newClientsPerMonth: 0.5,
    averageNewClientHours: 15,
    rateIncreaseAnnual: 0.03,
    costInflationAnnual: 0.025
  });



  // Calculated values
  const calculateMetrics = () => {
    const activeClients = clientData.filter(client => client.active);
    const totalWeeklyHours = activeClients.reduce((sum, client) => sum + client.weeklyHours, 0);
    const totalMonthlyHours = totalWeeklyHours * 4.33; // Average weeks per month
    
    // Service hour breakdown
    const directTherapyHours = totalMonthlyHours * serviceDistribution.directTherapy;
    const supervisionHours = totalMonthlyHours * serviceDistribution.supervision;
    const familyTrainingHours = totalMonthlyHours * serviceDistribution.familyTraining;
    
    // Revenue calculation
    const directTherapyRevenue = directTherapyHours * serviceRates.directTherapy;
    const supervisionRevenue = supervisionHours * serviceRates.supervision;
    const familyTrainingRevenue = familyTrainingHours * serviceRates.familyTraining;
    const itpRevenue = activeClients.length * 16; // Fixed amount per client
    const totalRevenue = directTherapyRevenue + supervisionRevenue + familyTrainingRevenue + itpRevenue;
    
    // Expense calculation
    // Calculate staff costs based on actual service hours worked
    const btStaffCost = directTherapyHours * staffRates.bt;
    const bcbaStaffCost = (supervisionHours + familyTrainingHours) * staffRates.bcba;
    const totalStaffCost = btStaffCost + bcbaStaffCost;
    const totalExpenses = totalStaffCost + overheadCosts.rent + overheadCosts.other;
    
    // Profit calculation
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    
    return {
      activeClients: activeClients.length,
      totalWeeklyHours,
      totalMonthlyHours,
      directTherapyHours,
      supervisionHours,
      familyTrainingHours,
      directTherapyRevenue,
      supervisionRevenue,
      familyTrainingRevenue,
      itpRevenue,
      totalRevenue,
      btStaffCost,
      bcbaStaffCost,
      totalStaffCost,
      totalExpenses,
      netProfit,
      profitMargin,
      revenuePerHour: totalMonthlyHours > 0 ? totalRevenue / totalMonthlyHours : 0,
      costPerHour: totalMonthlyHours > 0 ? totalExpenses / totalMonthlyHours : 0,
      profitPerHour: totalMonthlyHours > 0 ? netProfit / totalMonthlyHours : 0
    };
  };

  // Forecast calculation
  const calculateForecast = () => {
    const currentMetrics = calculateMetrics();
    const forecast = [];
    
    for (let month = 1; month <= forecastMonths; month++) {
      // Growth calculations
      const additionalClients = Math.floor(month * growthAssumptions.newClientsPerMonth);
      const additionalHours = additionalClients * growthAssumptions.averageNewClientHours;
      const monthlyRateIncrease = Math.pow(1 + growthAssumptions.rateIncreaseAnnual, month / 12);
      const monthlyCostIncrease = Math.pow(1 + growthAssumptions.costInflationAnnual, month / 12);
      
      // Projected hours
      const projectedHours = currentMetrics.totalMonthlyHours + additionalHours;
      
      // Projected revenue (with rate increases)
      const projectedRevenue = (currentMetrics.totalRevenue + 
        (additionalHours * currentMetrics.revenuePerHour)) * monthlyRateIncrease;
      
      // Projected expenses (with cost inflation)
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
      weeklyHours: 10,
      active: true
    }]);
  };

  const removeClient = (id) => {
    setClientData(clients => clients.filter(client => client.id !== id));
  };

  const downloadData = () => {
    const data = {
      currentMetrics,
      forecast,
      clientData,
      serviceRates,
      staffRates,
      overheadCosts,
      serviceDistribution,
      growthAssumptions
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'treehouse_financial_analysis.json';
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
                src="/treehouse-logo.png.png" 
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
                <p className="text-gray-600 mt-1">Dynamic Financial Analysis & Forecasting Dashboard</p>
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

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Active Clients</p>
                <p className="text-2xl font-bold text-blue-600">{currentMetrics.activeClients}</p>
              </div>
              <Users className="text-blue-600" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Monthly Hours</p>
                <p className="text-2xl font-bold text-green-600">{Math.round(currentMetrics.totalMonthlyHours)}</p>
              </div>
              <Clock className="text-green-600" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Monthly Revenue</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(currentMetrics.totalRevenue)}</p>
              </div>
              <DollarSign className="text-purple-600" size={24} />
            </div>
          </div>
          
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Net Profit</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(currentMetrics.netProfit)}</p>
                <p className="text-sm text-gray-500">{currentMetrics.profitMargin.toFixed(1)}% margin</p>
              </div>
              <TrendingUp className="text-emerald-600" size={24} />
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
                  <th className="text-center py-2">Monthly Hours</th>
                  <th className="text-center py-2">Monthly Revenue</th>
                  <th className="text-center py-2">Status</th>
                  {editMode && <th className="text-center py-2">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {clientData.map(client => {
                  const monthlyHours = client.weeklyHours * 4.33;
                  const monthlyRevenue = monthlyHours * currentMetrics.revenuePerHour;
                  
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
                            value={client.weeklyHours}
                            onChange={(e) => updateClientData(client.id, 'weeklyHours', parseInt(e.target.value) || 0)}
                            className="border rounded px-2 py-1 w-20 text-center"
                          />
                        ) : (
                          client.weeklyHours
                        )}
                      </td>
                      <td className="text-center py-3">{Math.round(monthlyHours)}</td>
                      <td className="text-center py-3">{formatCurrency(monthlyRevenue)}</td>
                      <td className="text-center py-3">
                        {editMode ? (
                          <select
                            value={client.active ? 'active' : 'inactive'}
                            onChange={(e) => updateClientData(client.id, 'active', e.target.value === 'active')}
                            className="border rounded px-2 py-1"
                          >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                          </select>
                        ) : (
                          <span className={`px-2 py-1 rounded text-xs ${
                            client.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {client.active ? 'Active' : 'Inactive'}
                          </span>
                        )}
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

        {/* Financial Settings */}
        {editMode && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Service Rates</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Direct Therapy Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    value={serviceRates.directTherapy}
                    onChange={(e) => setServiceRates({...serviceRates, directTherapy: parseFloat(e.target.value) || 0})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Supervision Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    value={serviceRates.supervision}
                    onChange={(e) => setServiceRates({...serviceRates, supervision: parseFloat(e.target.value) || 0})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Family Training Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    value={serviceRates.familyTraining}
                    onChange={(e) => setServiceRates({...serviceRates, familyTraining: parseFloat(e.target.value) || 0})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ITP Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    value={serviceRates.itp}
                    onChange={(e) => setServiceRates({...serviceRates, itp: parseFloat(e.target.value) || 0})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Cost Structure</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">BT Staff Rate ($/hour)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={staffRates.bt}
                    onChange={(e) => setStaffRates({...staffRates, bt: parseFloat(e.target.value) || 0})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">BCBA Staff Rate ($/hour)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={staffRates.bcba}
                    onChange={(e) => setStaffRates({...staffRates, bcba: parseFloat(e.target.value) || 0})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Rent</label>
                  <input
                    type="number"
                    step="0.01"
                    value={overheadCosts.rent}
                    onChange={(e) => setOverheadCosts({...overheadCosts, rent: parseFloat(e.target.value) || 0})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Other Overhead</label>
                  <input
                    type="number"
                    step="0.01"
                    value={overheadCosts.other}
                    onChange={(e) => setOverheadCosts({...overheadCosts, other: parseFloat(e.target.value) || 0})}
                    className="w-full border rounded px-3 py-2"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Forecast Section */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              Financial Forecast
            </h2>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Forecast Period:</label>
              <select
                value={forecastMonths}
                onChange={(e) => setForecastMonths(parseInt(e.target.value))}
                className="border rounded px-3 py-1"
              >
                <option value={3}>3 Months</option>
                <option value={6}>6 Months</option>
                <option value={12}>12 Months</option>
                <option value={24}>24 Months</option>
              </select>
            </div>
          </div>

          {editMode && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Growth Assumptions</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm text-gray-700">New Clients/Month</label>
                    <input
                      type="number"
                      step="0.1"
                      value={growthAssumptions.newClientsPerMonth}
                      onChange={(e) => setGrowthAssumptions({...growthAssumptions, newClientsPerMonth: parseFloat(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700">Avg New Client Hours</label>
                    <input
                      type="number"
                      value={growthAssumptions.averageNewClientHours}
                      onChange={(e) => setGrowthAssumptions({...growthAssumptions, averageNewClientHours: parseInt(e.target.value) || 0})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Annual Changes</h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-sm text-gray-700">Rate Increase (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={growthAssumptions.rateIncreaseAnnual * 100}
                      onChange={(e) => setGrowthAssumptions({...growthAssumptions, rateIncreaseAnnual: (parseFloat(e.target.value) || 0) / 100})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700">Cost Inflation (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={growthAssumptions.costInflationAnnual * 100}
                      onChange={(e) => setGrowthAssumptions({...growthAssumptions, costInflationAnnual: (parseFloat(e.target.value) || 0) / 100})}
                      className="w-full border rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Month</th>
                  <th className="text-center py-2">Clients</th>
                  <th className="text-center py-2">Hours</th>
                  <th className="text-center py-2">Revenue</th>
                  <th className="text-center py-2">Expenses</th>
                  <th className="text-center py-2">Net Profit</th>
                  <th className="text-center py-2">Margin</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b bg-blue-50">
                  <td className="py-3 font-medium">Current</td>
                  <td className="text-center py-3">{currentMetrics.activeClients}</td>
                  <td className="text-center py-3">{Math.round(currentMetrics.totalMonthlyHours)}</td>
                  <td className="text-center py-3">{formatCurrency(currentMetrics.totalRevenue)}</td>
                  <td className="text-center py-3">{formatCurrency(currentMetrics.totalExpenses)}</td>
                  <td className="text-center py-3">{formatCurrency(currentMetrics.netProfit)}</td>
                  <td className="text-center py-3">{currentMetrics.profitMargin.toFixed(1)}%</td>
                </tr>
                {forecast.map(month => (
                  <tr key={month.month} className="border-b hover:bg-gray-50">
                    <td className="py-3">Month {month.month}</td>
                    <td className="text-center py-3">{month.clients}</td>
                    <td className="text-center py-3">{Math.round(month.hours)}</td>
                    <td className="text-center py-3">{formatCurrency(month.revenue)}</td>
                    <td className="text-center py-3">{formatCurrency(month.expenses)}</td>
                    <td className="text-center py-3">{formatCurrency(month.profit)}</td>
                    <td className="text-center py-3">{month.margin.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Revenue Aggregation */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-4">Forecast Period Summary</h3>
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600 font-medium">Total Revenue</p>
                <p className="text-xl font-bold text-purple-700">
                  {formatCurrency(
                    currentMetrics.totalRevenue + 
                    forecast.reduce((sum, month) => sum + month.revenue, 0)
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Current + {forecastMonths} months
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600 font-medium">Total Expenses</p>
                <p className="text-xl font-bold text-red-700">
                  {formatCurrency(
                    currentMetrics.totalExpenses + 
                    forecast.reduce((sum, month) => sum + month.expenses, 0)
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Current + {forecastMonths} months
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600 font-medium">Total Net Profit</p>
                <p className="text-xl font-bold text-green-700">
                  {formatCurrency(
                    currentMetrics.netProfit + 
                    forecast.reduce((sum, month) => sum + month.profit, 0)
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Current + {forecastMonths} months
                </p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow">
                <p className="text-sm text-gray-600 font-medium">Average Monthly Revenue</p>
                <p className="text-xl font-bold text-blue-700">
                  {formatCurrency(
                    (currentMetrics.totalRevenue + 
                    forecast.reduce((sum, month) => sum + month.revenue, 0)) / 
                    (forecastMonths + 1)
                  )}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Over {forecastMonths + 1} months
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Current Month Breakdown</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Service Hours</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Direct Therapy:</span>
                  <span>{Math.round(currentMetrics.directTherapyHours)}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Supervision:</span>
                  <span>{Math.round(currentMetrics.supervisionHours)}h</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Family Training:</span>
                  <span>{Math.round(currentMetrics.familyTrainingHours)}h</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Total:</span>
                  <span className="font-medium">{Math.round(currentMetrics.totalMonthlyHours)}h</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Revenue Sources</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Direct Therapy:</span>
                  <span>{formatCurrency(currentMetrics.directTherapyRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Supervision:</span>
                  <span>{formatCurrency(currentMetrics.supervisionRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Family Training:</span>
                  <span>{formatCurrency(currentMetrics.familyTrainingRevenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">ITP:</span>
                  <span>{formatCurrency(currentMetrics.itpRevenue)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Total:</span>
                  <span className="font-medium">{formatCurrency(currentMetrics.totalRevenue)}</span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Expenses</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">BT Staff:</span>
                  <span>{formatCurrency(currentMetrics.btStaffCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">BCBA Staff:</span>
                  <span>{formatCurrency(currentMetrics.bcbaStaffCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rent:</span>
                  <span>{formatCurrency(overheadCosts.rent)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Other Overhead:</span>
                  <span>{formatCurrency(overheadCosts.other)}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Total:</span>
                  <span className="font-medium">{formatCurrency(currentMetrics.totalExpenses)}</span>
                </div>
              </div>
            </div>
          </div>
          
          {/* Performance Metrics */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium text-gray-900 mb-4">Key Performance Indicators</h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">Revenue per Hour</p>
                <p className="text-lg font-bold text-blue-800">{formatCurrency(currentMetrics.revenuePerHour)}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600 font-medium">Cost per Hour</p>
                <p className="text-lg font-bold text-red-800">{formatCurrency(currentMetrics.costPerHour)}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Profit per Hour</p>
                <p className="text-lg font-bold text-green-800">{formatCurrency(currentMetrics.profitPerHour)}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Utilization Rate</p>
                <p className="text-lg font-bold text-purple-800">
                  {((currentMetrics.totalMonthlyHours / (currentMetrics.activeClients * 40 * 4.33)) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          </div>

          {/* Scenario Analysis */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium text-gray-900 mb-4">What-If Scenarios</h3>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {[
                { name: "Add 1 Client (15h/week)", change: { clients: 1, hours: 15 * 4.33 } },
                { name: "10% Rate Increase", change: { rateIncrease: 0.1 } },
                { name: "Reduce Overhead 20%", change: { overheadReduction: 0.2 } }
              ].map((scenario, index) => {
                let scenarioRevenue = currentMetrics.totalRevenue;
                let scenarioExpenses = currentMetrics.totalExpenses;
                
                if (scenario.change.clients) {
                  scenarioRevenue += scenario.change.hours * currentMetrics.revenuePerHour;
                  scenarioExpenses += scenario.change.hours * currentMetrics.costPerHour;
                }
                if (scenario.change.rateIncrease) {
                  scenarioRevenue *= (1 + scenario.change.rateIncrease);
                }
                if (scenario.change.overheadReduction) {
                  scenarioExpenses -= (overheadCosts.rent + overheadCosts.other) * scenario.change.overheadReduction;
                }
                
                const scenarioProfit = scenarioRevenue - scenarioExpenses;
                const profitChange = scenarioProfit - currentMetrics.netProfit;
                
                return (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm font-medium text-gray-900">{scenario.name}</p>
                    <p className="text-lg font-bold text-gray-800">{formatCurrency(scenarioProfit)}</p>
                    <p className={`text-sm ${profitChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {profitChange > 0 ? '+' : ''}{formatCurrency(profitChange)} vs current
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Break-even Analysis */}
          <div className="mt-6 pt-6 border-t">
            <h3 className="font-medium text-gray-900 mb-4">Break-even Analysis</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-yellow-50 p-4 rounded-lg">
                <p className="text-sm text-yellow-600 font-medium">Break-even Hours (Monthly)</p>
                <p className="text-2xl font-bold text-yellow-800">
                  {Math.ceil((overheadCosts.rent + overheadCosts.other) / (currentMetrics.revenuePerHour - currentMetrics.costPerHour))}
                </p>
                <p className="text-sm text-yellow-600 mt-1">
                  Fixed costs ÷ (Revenue per hour - Variable cost per hour)
                </p>
              </div>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-sm text-indigo-600 font-medium">Safety Margin</p>
                <p className="text-2xl font-bold text-indigo-800">
                  {((currentMetrics.totalMonthlyHours / Math.ceil((overheadCosts.rent + overheadCosts.other) / (currentMetrics.revenuePerHour - currentMetrics.costPerHour))) * 100 - 100).toFixed(0)}%
                </p>
                <p className="text-sm text-indigo-600 mt-1">
                  Current hours above break-even point
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TreehouseFinancialDashboard; 