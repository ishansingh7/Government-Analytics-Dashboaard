import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { Building2, Award, Clock, FileText, CheckCircle, TrendingUp } from 'lucide-react';

const COLORS = ['#10B981', '#F59E0B', '#EF4444']; // Green for Resolved, Yellow In Progress, Red Pending

const Home = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/analytics');
        setAnalytics(data);
      } catch (error) {
        console.error('Error fetching analytics', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-gray-500">Loading live analytics...</p>
      </div>
    );
  }

  if (!analytics) {
    return <div className="text-center py-20 text-red-500">Failed to load analytics data.</div>;
  }

  // Prepare data for charts
  const pieData = Object.entries(analytics.statusDistribution).map(([name, value]) => ({
    name,
    value
  })).filter(item => item.value > 0);

  // Sorting pie data to match colors: Resolved, In Progress, Pending
  const orderedPieData = [
     pieData.find(d => d.name === 'Resolved') || { name: 'Resolved', value: 0 },
     pieData.find(d => d.name === 'In Progress') || { name: 'In Progress', value: 0 },
     pieData.find(d => d.name === 'Pending') || { name: 'Pending', value: 0 }
  ];

  const barData = analytics.leaderboard.slice(0, 5).map(ministry => ({
    name: ministry.ministryName.length > 20 ? ministry.ministryName.substring(0, 20) + '...' : ministry.ministryName,
    performanceScore: parseFloat(ministry.performanceScore)
  }));
  
  // Mock trend data
  const trendData = [
    { name: 'Wk 1', complaints: Math.floor(analytics.overall.totalComplaints * 0.1) },
    { name: 'Wk 2', complaints: Math.floor(analytics.overall.totalComplaints * 0.2) },
    { name: 'Wk 3', complaints: Math.floor(analytics.overall.totalComplaints * 0.3) },
    { name: 'Wk 4', complaints: Math.floor(analytics.overall.totalComplaints * 0.4) },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-900 to-primary rounded-2xl p-8 sm:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between">
        <div className="max-w-2xl mb-8 md:mb-0">
          <h1 className="text-4xl sm:text-5xl font-extrabold mb-4 tracking-tight">Public Grievance & System Analytics</h1>
          <p className="text-lg text-blue-100 mb-8 max-w-xl">
            A transparent view into government performance. Track complaint resolutions, ministry efficiency, and public feedback in real-time.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link 
  to="/submit-complaint" 
  className="bg-white text-[#2E4897] px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-gray-50 transition transform hover:-translate-y-1"
>
  File a Complaint
</Link>
            <Link to="/ministries" className="bg-transparent border border-white text-white px-6 py-3 rounded-lg font-bold hover:bg-white/10 transition">
              Explore Ministries
            </Link>
          </div>
        </div>
        <div className="hidden lg:block w-64 h-64 bg-white/10 rounded-full flex items-center justify-center p-8 backdrop-blur-sm border border-white/20">
             <TrendingUp className="w-full h-full text-white/80" strokeWidth={1}/>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-blue-50 mr-4">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Grievances</p>
            <p className="text-3xl font-bold text-gray-900">{analytics.overall.totalComplaints}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-green-50 mr-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Resolved</p>
            <p className="text-3xl font-bold text-gray-900">{analytics.overall.resolvedComplaints}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-yellow-50 mr-4">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Resolution Rate</p>
            <p className="text-3xl font-bold text-gray-900">{analytics.overall.resolutionRate}%</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-purple-50 mr-4">
            <Building2 className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Ministries Monitored</p>
            <p className="text-3xl font-bold text-gray-900">{analytics.leaderboard.length}</p>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Status Distribution Pie Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
             Status Distribution
          </h2>
          <div className="h-80 select-none">
            {analytics.overall.totalComplaints === 0 ? (
                 <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={orderedPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={5}
                    dataKey="value"
                    >
                    {orderedPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
                </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Performing Ministries Bar Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Top Performing Ministries</h2>
          <div className="h-80 select-none">
            {analytics.leaderboard.length === 0 ? (
                 <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f0f0f0" />
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="name" type="category" width={150} tick={{fill: '#4B5563', fontSize: 12}} axisLine={false} tickLine={false} />
                    <RechartsTooltip cursor={{fill: 'transparent'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                    <Bar dataKey="performanceScore" fill="#3B82F6" radius={[0, 4, 4, 0]} barSize={24} name="Performance Score">
                        {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10B981' : index === 1 ? '#3B82F6' : '#94A3B8'} />
                        ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            )}
          </div>
        </div>
        
         {/* Filing Trend Line Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Grievance Registration Trend (Last 30 Days)</h2>
          <div className="h-72 select-none">
             {analytics.overall.totalComplaints === 0 ? (
                 <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                    <RechartsTooltip cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '5 5'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                    <Line type="monotone" dataKey="complaints" stroke="#3B82F6" strokeWidth={3} dot={{r: 4, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff'}} activeDot={{r: 6}} name="Complaints Filed" />
                </LineChart>
                </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Top 3 Ministries Leaderboard Cards */}
      <div className="mt-12">
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Award className="h-6 w-6 text-yellow-500 mr-2" /> Top 3 Ministries
          </h2>
          <Link to="/leaderboard" className="text-primary hover:text-blue-800 font-medium text-sm transition">
            View Full Leaderboard &rarr;
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {analytics.leaderboard.slice(0, 3).map((ministry, index) => (
            <div key={ministry.ministryId} className={`bg-white rounded-xl shadow-sm border flex flex-col ${index === 0 ? 'border-yellow-400 shadow-yellow-100' : index === 1 ? 'border-gray-300' : 'border-orange-200'}`}>
              <div className={`px-6 py-4 border-b flex items-center justify-between ${index === 0 ? 'bg-yellow-50/50' : 'bg-gray-50'}`}>
                <div className="flex items-center space-x-2">
                  <span className={`flex items-center justify-center h-8 w-8 rounded-full text-white font-bold text-sm ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-400'}`}>
                    #{index + 1}
                  </span>
                  <h3 className="font-bold text-gray-900 truncate max-w-[150px]" title={ministry.ministryName}>{ministry.ministryName}</h3>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-medium">Score</p>
                  <p className={`font-bold text-lg ${index === 0 ? 'text-yellow-600' : 'text-gray-900'}`}>{ministry.performanceScore}</p>
                </div>
              </div>
              <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Resolution Rate</span>
                  <span className="font-medium text-gray-900">{ministry.resolutionRate}%</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Resolved Complaints</span>
                  <span className="font-medium text-green-600">{ministry.resolvedComplaints} / {ministry.totalComplaints}</span>
                </div>
                 <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Avg Resolution Time</span>
                  <span className="font-medium text-gray-900">{ministry.avgResolutionTimeDays ? `${ministry.avgResolutionTimeDays} days` : 'N/A'}</span>
                </div>
              </div>
            </div>
          ))}
          {analytics.leaderboard.length === 0 && (
             <div className="col-span-3 text-center py-10 text-gray-500 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                 No performance data available to rank ministries yet.
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
