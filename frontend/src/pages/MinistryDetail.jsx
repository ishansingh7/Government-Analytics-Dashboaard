import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../utils/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { ArrowLeft, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react';

const COLORS = ['#10B981', '#F59E0B', '#EF4444']; // Green, Yellow, Red

const MinistryDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsRes, projectsRes] = await Promise.all([
          api.get(`/analytics/ministry/${id}`),
          api.get(`/projects?ministryId=${id}`)
        ]);
        setData(analyticsRes.data);
        setProjects(projectsRes.data);
      } catch (error) {
        try {
          const minRes = await api.get(`/ministries/${id}`);
          const mockData = await api.get(`/analytics`);
          const minStats = mockData.data.leaderboard.find(m => m.ministryId === id);

          setData({
            ministry: minRes.data,
            stats: {
              totalComplaints: minStats?.totalComplaints || 0,
              resolvedComplaints: minStats?.resolvedComplaints || 0,
              resolutionRate: minStats?.resolutionRate || 0
            },
            statusDistribution: [
              { _id: 'Resolved', count: minStats?.resolvedComplaints || 0 },
              { _id: 'In Progress', count: Math.floor((minStats?.totalComplaints || 0) * 0.2) },
              { _id: 'Pending', count: (minStats?.totalComplaints || 0) - (minStats?.resolvedComplaints || 0) - Math.floor((minStats?.totalComplaints || 0) * 0.2) }
            ]
          });

          // Try to fetch projects even if analytics endpoint fails
          try {
            const projectsRes = await api.get(`/projects?ministryId=${id}`);
            setProjects(projectsRes.data);
          } catch (projErr) {
            console.error('Error fetching projects', projErr);
          }

        } catch (innerError) {
          console.error('Error fetching data', innerError);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="text-center py-20 text-gray-500">Loading ministry analytics...</div>;
  if (!data || !data.ministry) return <div className="text-center py-20 text-red-500">Ministry data not found.</div>;

  const chartData = data.statusDistribution
    .map(stat => ({
      name: stat._id,
      value: stat.count > 0 ? stat.count : 0 // Exclude 0 counts if possible, but keep for legend
    }))
    .filter(stat => stat.value >= 0); // Keep all for now

  // Sort chart data specifically for color mapping [Resolved, In Progress, Pending]
  const orderedChartData = [
      chartData.find(d => d.name === 'Resolved') || { name: 'Resolved', value: 0 },
      chartData.find(d => d.name === 'In Progress') || { name: 'In Progress', value: 0 },
      chartData.find(d => d.name === 'Pending') || { name: 'Pending', value: 0 }
  ];

  return (
    <div className="space-y-6">
      <Link to="/ministries" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700 transition">
        <ArrowLeft className="h-4 w-4 mr-1" /> Back to Directory
      </Link>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">{data.ministry.name}</h1>
        <p className="text-gray-500 mb-8 max-w-3xl">{data.ministry.description}</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50/50 rounded-xl p-6 border border-blue-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-blue-800">Total Complaints</h3>
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                </div>
                <p className="text-3xl font-bold text-blue-900">{data.stats.totalComplaints}</p>
            </div>
            
            <div className="bg-green-50/50 rounded-xl p-6 border border-green-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-green-800">Resolved</h3>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                </div>
                <p className="text-3xl font-bold text-green-900">{data.stats.resolvedComplaints}</p>
            </div>

            <div className="bg-purple-50/50 rounded-xl p-6 border border-purple-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-purple-800">Resolution Rate</h3>
                    <PieChart className="h-5 w-5 text-purple-500" />
                </div>
                <p className="text-3xl font-bold text-purple-900">{data.stats.resolutionRate}%</p>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 border-t border-gray-100 pt-8">
             <div>
                <h3 className="text-lg font-bold text-gray-900 mb-6">Status Breakdown</h3>
                <div className="h-80 relative">
                    {data.stats.totalComplaints === 0 ? (
                        <div className="absolute inset-0 flex items-center justify-center text-gray-500">No complaints filed yet</div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                            <Pie
                                data={orderedChartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={120}
                                paddingAngle={2}
                                dataKey="value"
                            >
                                {orderedChartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <RechartsTooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Legend verticalAlign="bottom" height={36}/>
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>
             </div>

             <div className="space-y-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Budget Utilization</h3>
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-end mb-2">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Spent</p>
                            <p className="text-xl font-bold text-gray-900">₹{(data.ministry.spentBudget || 0).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                             <p className="text-sm text-gray-500 font-medium">Total Allocated</p>
                             <p className="text-xl font-bold text-gray-900">₹{(data.ministry.totalBudget || 0).toLocaleString()}</p>
                        </div>
                    </div>
                    
                    <div className="w-full bg-gray-200 rounded-full h-3 mt-4 overflow-hidden mb-2">
                        <div 
                        className={`h-3 rounded-full transition-all duration-1000 ${((data.ministry.spentBudget / (data.ministry.totalBudget || 1)) * 100) > 90 ? 'bg-red-500' : 'bg-primary'}`} 
                        style={{ width: `${Math.min(100, (data.ministry.spentBudget / (data.ministry.totalBudget || 1)) * 100)}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-right text-gray-500">
                        {Math.round((data.ministry.spentBudget / (data.ministry.totalBudget || 1)) * 100)}% Utilized
                    </p>
                </div>
             </div>
        </div>

        <div className="mt-10">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Current Projects</h2>
          {projects.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-6 text-center text-gray-500">No active projects to display yet.</div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 font-medium text-gray-600">Project</th>
                      <th className="px-3 py-2 font-medium text-gray-600">Working Area</th>
                      <th className="px-3 py-2 font-medium text-gray-600">Status</th>
                      <th className="px-3 py-2 font-medium text-gray-600">Budget</th>
                      <th className="px-3 py-2 font-medium text-gray-600">Spent</th>
                      <th className="px-3 py-2 font-medium text-gray-600">Completion</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projects.map((project) => (
                      <tr key={project._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2">{project.title}</td>
                        <td className="px-3 py-2">{project.workingArea || '-'}</td>
                        <td className="px-3 py-2">{project.status}</td>
                        <td className="px-3 py-2">₹{(project.projectBudget || 0).toLocaleString()}</td>
                        <td className="px-3 py-2">₹{(project.spentAmount || 0).toLocaleString()}</td>
                        <td className="px-3 py-2">{project.completionPercentage ?? 0}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MinistryDetail;
