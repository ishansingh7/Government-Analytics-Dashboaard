import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';
import jsPDF from 'jspdf';
import { FileText, CheckCircle, Clock, Building2, Plus, Users, Pencil, Trash2, Download } from 'lucide-react';

const GovAdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [ministries, setMinistries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMinistry, setSelectedMinistry] = useState(null);
  const [ministryComplaints, setMinistryComplaints] = useState([]);
  const [ministryModalOpen, setMinistryModalOpen] = useState(false);
  
  // New Ministry Form State
  const [showAddForm, setShowAddForm] = useState(false);
  const [newMinistry, setNewMinistry] = useState({
    name: '',
    description: '',
    totalBudget: 0,
    adminEmail: '', // To link a registered ministry admin
    adminName: '',
    adminPassword: ''
  });
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const [editingMinistryId, setEditingMinistryId] = useState(null);
  const [editMinistry, setEditMinistry] = useState({
    name: '',
    description: '',
    totalBudget: 0
  });
  const [actionError, setActionError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  const fetchData = async () => {
    try {
      const [analyticsRes, ministriesRes] = await Promise.all([
        api.get('/analytics'),
        api.get('/ministries')
      ]);
      setAnalytics(analyticsRes.data);
      setMinistries(ministriesRes.data);
    } catch (error) {
      console.error('Error fetching admin data', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setActionError('');
    setActionSuccess('');
    
    try {
      // Create ministry payload
      const payload = {
        name: newMinistry.name,
        description: newMinistry.description,
        totalBudget: Number(newMinistry.totalBudget),
        adminEmail: newMinistry.adminEmail || undefined,
        adminName: newMinistry.adminName || undefined,
        adminPassword: newMinistry.adminPassword || undefined
      };

      await api.post('/ministries', payload);
      
      setFormSuccess('Ministry added successfully!');
      setNewMinistry({ name: '', description: '', totalBudget: 0, adminEmail: '', adminName: '', adminPassword: '' });
      setShowAddForm(false);
      fetchData(); // Refresh lists
    } catch (error) {
      console.error('Add ministry error', error);
      setFormError(error.response?.data?.message || error.message || 'Failed to add ministry');
    }
  };

  const handleStartEdit = (ministry) => {
    setActionError('');
    setActionSuccess('');
    setEditingMinistryId(ministry._id);
    setEditMinistry({
      name: ministry.name,
      description: ministry.description || '',
      totalBudget: ministry.totalBudget || 0
    });
  };

  const handleCancelEdit = () => {
    setEditingMinistryId(null);
    setEditMinistry({ name: '', description: '', totalBudget: 0 });
  };

  const handleEditSubmit = async (ministryId) => {
    setActionError('');
    setActionSuccess('');

    try {
      await api.put(`/ministries/${ministryId}`, {
        name: editMinistry.name,
        description: editMinistry.description,
        totalBudget: Number(editMinistry.totalBudget)
      });

      setActionSuccess('Ministry updated successfully!');
      setEditingMinistryId(null);
      fetchData();
    } catch (error) {
      setActionError(error.response?.data?.message || 'Failed to update ministry');
    }
  };

  const handleDeleteMinistry = async (ministryId) => {
    const confirmed = window.confirm('Are you sure you want to delete this ministry? This action cannot be undone.');
    if (!confirmed) return;

    setActionError('');
    setActionSuccess('');

    try {
      await api.delete(`/ministries/${ministryId}`);
      setActionSuccess('Ministry deleted successfully.');
      if (editingMinistryId === ministryId) {
        handleCancelEdit();
      }
      fetchData();
    } catch (error) {
      setActionError(error.response?.data?.message || 'Failed to delete ministry');
    }
  };

  const openMinistryRecords = async (ministry) => {
    setSelectedMinistry(ministry);
    setMinistryModalOpen(true);

    try {
      const res = await api.get(`/complaints?ministryId=${ministry._id}`);
      setMinistryComplaints(res.data);
    } catch (error) {
      console.error('Failed to load ministry complaints', error);
      setMinistryComplaints([]);
    }
  };

  const exportMinistryToPDF = (ministry, complaints) => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`${ministry.name} - Complaint Records`, 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);

    const tableColumn = ["Title", "Citizen", "Status", "Priority", "Budget", "Completed", "Spent", "Date"];
    const tableRows = [];

    complaints.forEach(c => {
      tableRows.push([
        c.title,
        c.userId?.name || 'Unknown',
        c.status,
        c.priority || 'Medium',
        `₹${(c.projectBudget || 0).toLocaleString()}`,
        `${c.completionPercentage ?? 0}%`,
        `₹${(c.spentAmount || 0).toLocaleString()}`,
        new Date(c.createdAt).toLocaleDateString()
      ]);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [29, 78, 216] }
    });

    doc.save(`${ministry.name.replace(/\s+/g, '_')}_complaints_${new Date().toISOString().slice(0,10)}.pdf`);
  };

  if (loading) return <div className="text-center py-20">Loading Super Admin Dashboard...</div>;
  if (!analytics) return <div className="text-center py-20 text-red-500">Failed to load data.</div>;

  const barData = analytics.leaderboard.map(ministry => ({
    name: ministry.ministryName.length > 15 ? ministry.ministryName.substring(0, 15) + '...' : ministry.ministryName,
    score: parseFloat(ministry.performanceScore)
  })).sort((a,b) => b.score - a.score);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <p className="text-sm text-gray-500">Welcome, {user?.name}</p>
            <h1 className="text-3xl font-bold text-gray-900">Government Super Admin Control</h1>
            <p className="text-gray-500">System-wide overview and ministry management.</p>
        </div>
        <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg font-medium shadow hover:bg-blue-700 transition"
        >
            <Plus className="h-5 w-5" /> Add Ministry
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Register New Ministry</h2>
          
          {formError && <div className="bg-red-50 text-red-700 p-3 rounded mb-4">{formError}</div>}
          {formSuccess && <div className="bg-green-50 text-green-700 p-3 rounded mb-4">{formSuccess}</div>}
          
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Ministry Name</label>
                <input 
                  type="text" required 
                  value={newMinistry.name} onChange={e => setNewMinistry({...newMinistry, name: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Total Budget (₹)</label>
                <input 
                  type="number" required min="0"
                  value={newMinistry.totalBudget} onChange={e => setNewMinistry({...newMinistry, totalBudget: e.target.value})}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ministry Admin Email </label>
              <input 
                type="email" placeholder="email of registered ministry admin"
                value={newMinistry.adminEmail} onChange={e => setNewMinistry({...newMinistry, adminEmail: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              />
              <p className="text-xs text-gray-500 mt-1">Providing this will auto-assign the ministry to the registered admin user.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">New Admin Name </label>
                <input
                  type="text"
                  value={newMinistry.adminName}
                  onChange={(e) => setNewMinistry({ ...newMinistry, adminName: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  placeholder="Full name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">New Admin Password</label>
                <input
                  type="password"
                  value={newMinistry.adminPassword}
                  onChange={(e) => setNewMinistry({ ...newMinistry, adminPassword: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                  placeholder="Create password"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea 
                rows={3} required
                value={newMinistry.description} onChange={e => setNewMinistry({...newMinistry, description: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
              ></textarea>
            </div>
            <div className="flex justify-end">
              <button type="submit" className="bg-primary text-white px-6 py-2 rounded-md hover:bg-blue-700 transition">
                Create Ministry
              </button>
            </div>
          </form>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-blue-50 mr-4">
            <FileText className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Total Grievances</p>
            <p className="text-2xl font-bold text-gray-900">{analytics.overall.totalComplaints}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-green-50 mr-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Resolved</p>
            <p className="text-2xl font-bold text-gray-900">{analytics.overall.resolvedComplaints}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
           <div className="p-3 rounded-full bg-yellow-50 mr-4">
            <Clock className="h-8 w-8 text-yellow-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-gray-900">{analytics.overall.pendingComplaints}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-indigo-50 mr-4">
            <Clock className="h-8 w-8 text-indigo-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Avg Resolution (hrs)</p>
            <p className="text-2xl font-bold text-gray-900">{analytics.overall.avgResolutionTimeHours ?? '-'}{analytics.overall.avgResolutionTimeHours ? '' : ''}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-purple-50 mr-4">
            <Building2 className="h-8 w-8 text-purple-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Active Ministries</p>
            <p className="text-2xl font-bold text-gray-900">{ministries.length}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center">
          <div className="p-3 rounded-full bg-slate-50 mr-4">
            <Users className="h-8 w-8 text-slate-600" />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Top Ministries</p>
            <p className="text-2xl font-bold text-gray-900">{analytics.topPerforming?.length || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Ministry Performance Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-6">Ministry Performance Comparison</h2>
          <div className="h-80 select-none">
            {barData.length === 0 ? (
                 <div className="h-full flex items-center justify-center text-gray-400">No data available</div>
            ) : (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} margin={{ top: 5, right: 30, left: 0, bottom: 25 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 11}} angle={-45} textAnchor="end" />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                        <RechartsTooltip cursor={{fill: '#f8fafc'}} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                        <Bar dataKey="score" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Performance Score" />
                    </BarChart>
                </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Performance Highlights */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Top / Bottom Performing Ministries</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Top Performing</h3>
              <ul className="space-y-2">
                {analytics.topPerforming && analytics.topPerforming.length > 0 ? (
                  analytics.topPerforming.slice(0, 5).map((item) => (
                    <li key={item.ministryId} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium text-gray-800">{item.ministryName}</span>
                      <span className="text-xs text-green-700 font-semibold">{item.performanceScore}</span>
                    </li>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No data available</div>
                )}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-600 mb-2">Worst Performing</h3>
              <ul className="space-y-2">
                {analytics.worstPerforming && analytics.worstPerforming.length > 0 ? (
                  analytics.worstPerforming.slice(0, 5).map((item) => (
                    <li key={item.ministryId} className="flex justify-between items-center px-3 py-2 bg-gray-50 rounded">
                      <span className="text-sm font-medium text-gray-800">{item.ministryName}</span>
                      <span className="text-xs text-red-700 font-semibold">{item.performanceScore}</span>
                    </li>
                  ))
                ) : (
                  <div className="text-sm text-gray-500">No data available</div>
                )}
              </ul>
            </div>
          </div>
        </div>

        {/* Existing Ministries List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">Manage Ministries</h2>
                <Users className="h-5 w-5 text-gray-400" />
            </div>

            {actionError && <div className="bg-red-50 text-red-700 p-3 rounded mb-4">{actionError}</div>}
            {actionSuccess && <div className="bg-green-50 text-green-700 p-3 rounded mb-4">{actionSuccess}</div>}

            <div className="overflow-y-auto max-h-80 pr-2 space-y-3">
                {ministries.map(ministry => {
                    const isEditing = editingMinistryId === ministry._id;
                    return (
                        <div key={ministry._id} className="p-4 border border-gray-100 rounded-lg hover:bg-gray-50 transition">
                            {isEditing ? (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500">Name</label>
                                            <input
                                                value={editMinistry.name}
                                                onChange={e => setEditMinistry({ ...editMinistry, name: e.target.value })}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500">Budget</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={editMinistry.totalBudget}
                                                onChange={e => setEditMinistry({ ...editMinistry, totalBudget: e.target.value })}
                                                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500">Description</label>
                                        <textarea
                                            rows={2}
                                            value={editMinistry.description}
                                            onChange={e => setEditMinistry({ ...editMinistry, description: e.target.value })}
                                            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="px-3 py-2 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleEditSubmit(ministry._id)}
                                            className="px-3 py-2 rounded-md bg-primary text-white hover:bg-blue-700"
                                        >
                                            Save
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-900">{ministry.name}</h3>
                                            <p className="text-sm text-gray-500 mt-1 truncate" title={ministry.description}>{ministry.description}</p>
                                            <div className="mt-2 text-xs text-blue-600 font-medium flex items-center">
                                                <Users className="h-3 w-3 mr-1" />
                                                Admin: {ministry.adminId ? ministry.adminId.email : <span className="text-red-500">Unassigned</span>}
                                            </div>
                                            <div className="mt-1 text-xs text-gray-500">
                                                Budget: ₹{(ministry.totalBudget || 0).toLocaleString()}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => openMinistryRecords(ministry)}
                                                className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
                                                title="View ministry records"
                                            >
                                                <FileText className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleStartEdit(ministry)}
                                                className="p-2 rounded-md text-gray-500 hover:bg-gray-100"
                                                title="Edit ministry"
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteMinistry(ministry._id)}
                                                className="p-2 rounded-md text-red-500 hover:bg-red-50"
                                                title="Delete ministry"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    );
                })}
                {ministries.length === 0 && (
                     <div className="text-center py-10 text-gray-500 italic">No ministries found.</div>
                )}
            </div>
        </div>
      </div>

      {ministryModalOpen && selectedMinistry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl shadow-xl overflow-hidden">
            <div className="flex items-start justify-between p-4 border-b">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{selectedMinistry.name} Records</h2>
                <p className="text-sm text-gray-500">{selectedMinistry.description}</p>
              </div>
              <button
                onClick={() => setMinistryModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
            <div className="p-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">Complaints: {ministryComplaints.length}</div>
                  <div className="text-sm text-gray-600">Budget: ₹{(selectedMinistry.totalBudget || 0).toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Spent: ₹{(selectedMinistry.spentBudget || 0).toLocaleString()}</div>
                </div>
                <button
                  onClick={() => exportMinistryToPDF(selectedMinistry, ministryComplaints)}
                  className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm"
                >
                  <Download className="h-4 w-4" /> Export PDF
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 font-medium text-gray-600">Title</th>
                      <th className="px-3 py-2 font-medium text-gray-600">Citizen</th>
                      <th className="px-3 py-2 font-medium text-gray-600">Status</th>
                      <th className="px-3 py-2 font-medium text-gray-600">Priority</th>
                      <th className="px-3 py-2 font-medium text-gray-600">Budget</th>
                      <th className="px-3 py-2 font-medium text-gray-600">Completed</th>
                      <th className="px-3 py-2 font-medium text-gray-600">Spent</th>
                      <th className="px-3 py-2 font-medium text-gray-600">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ministryComplaints.map((complaint) => (
                      <tr key={complaint._id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2">{complaint.title}</td>
                        <td className="px-3 py-2">{complaint.userId?.name || 'Unknown'}</td>
                        <td className="px-3 py-2">{complaint.status}</td>
                        <td className="px-3 py-2">{complaint.priority || 'Medium'}</td>
                        <td className="px-3 py-2">₹{(complaint.projectBudget || 0).toLocaleString()}</td>
                        <td className="px-3 py-2">{complaint.completionPercentage ?? 0}%</td>
                        <td className="px-3 py-2">₹{(complaint.spentAmount || 0).toLocaleString()}</td>
                        <td className="px-3 py-2">{new Date(complaint.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GovAdminDashboard;
