import React, { useState } from 'react';
import { Download, Edit3, TrendingUp, DollarSign, Clock, Users, BarChart3 } from 'lucide-react';

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
    const btStaffCost = totalMonthlyHours * staffRates.bt;
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

  const currentMetrics = calculateMetrics();

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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Treehouse Therapy Center LLC</h1>
              <p className="text-gray-600 mt-1">Dynamic Financial Analysis & Forecasting Dashboard</p>
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

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Key Performance Indicators</h2>
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
      </div>
    </div>
  );
};

export default TreehouseFinancialDashboard; 