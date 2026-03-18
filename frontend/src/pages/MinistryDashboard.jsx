import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Download, FileText, Plus, Pencil, Trash2, X } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';

const MinistryDashboard = () => {
  const { user } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [lightboxMedia, setLightboxMedia] = useState(null);
  const [updateStatus, setUpdateStatus] = useState('');
  const [updatePriority, setUpdatePriority] = useState('Medium');
  const [resolutionRemarks, setResolutionRemarks] = useState('');

  // Budget & Analytics State
  const [ministryData, setMinistryData] = useState(null);
  const [updateSpent, setUpdateSpent] = useState(0);

  // Project planning state
  const [projects, setProjects] = useState([]);
  const [projectError, setProjectError] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [projectForm, setProjectForm] = useState({
    title: '',
    description: '',
    workingArea: '',
    projectBudget: 0,
    spentAmount: 0,
    completionPercentage: 0,
    pendingWork: '',
    status: 'Planned'
  });
  const [showProjectForm, setShowProjectForm] = useState(false);

  const fetchData = async () => {
    try {
      // Fetch complaints first; this is the primary dashboard content
      const compRes = await api.get('/complaints');
      setComplaints(compRes.data);

      // Fetch projects (optional / additional info)
      try {
        const projRes = await api.get('/projects');
        setProjects(projRes.data);
        setProjectError('');
      } catch (error) {
        console.error('Error fetching projects', error);
        setProjects([]);
        if (error?.response?.status === 401) {
          setProjectError('Not authorized. Please log in as a ministry admin to view projects.');
        } else {
          setProjectError('Failed to load projects.');
        }
      }

      // Fetch ministry data (for budget & overview)
      try {
        const minRes = await api.get('/ministries');
        const myUser = JSON.parse(localStorage.getItem('user'));
        const myMinistry = minRes.data.find(m => m.adminId?._id === myUser._id || m.adminId === myUser._id);
        if (myMinistry) {
          setMinistryData(myMinistry);
          setUpdateSpent(myMinistry.spentBudget);
        }
      } catch (error) {
        console.error('Error fetching ministry data', error);
      }
    } catch (error) {
      console.error('Error fetching complaints', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!lightboxMedia) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxMedia(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxMedia]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/complaints/${selectedComplaint._id}/status`, {
        status: updateStatus,
        priority: updatePriority,
        resolutionRemarks
      });
      setSelectedComplaint(null);
      fetchData(); // Refresh list
    } catch (error) {
      console.error('Failed to update complaint', error);
      alert('Failed to update complaint status');
    }
  };

  const resetProjectForm = () => {
    setProjectForm({
      title: '',
      description: '',
      workingArea: '',
      projectBudget: 0,
      spentAmount: 0,
      completionPercentage: 0,
      pendingWork: '',
      status: 'Planned'
    });
    setSelectedProject(null);
  };

  const handleProjectSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedProject) {
        await api.put(`/projects/${selectedProject._id}`, projectForm);
      } else {
        await api.post('/projects', projectForm);
      }
      resetProjectForm();
      setShowProjectForm(false);
      fetchData();
    } catch (error) {
      console.error('Failed to save project', error);
      alert('Failed to save project');
    }
  };

  const handleEditProject = (project) => {
    setSelectedProject(project);
    setProjectForm({
      title: project.title,
      description: project.description || '',
      workingArea: project.workingArea || '',
      projectBudget: project.projectBudget || 0,
      spentAmount: project.spentAmount || 0,
      completionPercentage: project.completionPercentage || 0,
      pendingWork: project.pendingWork || '',
      status: project.status || 'Planned'
    });
    setShowProjectForm(true);
  };

  const handleDeleteProject = async (projectId) => {
    const confirmed = window.confirm('Delete this project?');
    if (!confirmed) return;

    try {
      await api.delete(`/projects/${projectId}`);
      fetchData();
    } catch (error) {
      console.error('Failed to delete project', error);
      alert('Failed to delete project');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  const formatResponseTime = (complaint) => {
    if (!complaint.resolvedAt) return '-';
    const created = new Date(complaint.createdAt);
    const resolved = new Date(complaint.resolvedAt);
    const diffHours = Math.round((resolved - created) / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    return diffDays > 0 ? `${diffDays}d ${remainingHours}h` : `${diffHours}h`;
  };

  const handleBudgetUpdate = async (e) => {
    e.preventDefault();
    if (!ministryData) return;
    
    try {
        await api.put(`/ministries/${ministryData._id}/budget`, {
            spentBudget: Number(updateSpent)
        });
        alert('Budget updated successfully!');
        fetchData();
    } catch (error) {
        console.error('Failed to update budget', error);
        alert('Failed to update budget');
    }
  };

  const exportToCSV = () => {
    const headers = ['Title', 'Budget', 'Spent', 'Completed %', 'Citizen Name', 'Status', 'Priority', 'Date Submitted', 'Resolution Remarks'];
    const csvData = complaints.map(c => [
      c.title.replace(/,/g, ''), // remove commas to avoid csv breaking
      `₹${(c.projectBudget || 0).toLocaleString()}`,
      `₹${(c.spentAmount || 0).toLocaleString()}`,
      `${c.completionPercentage ?? 0}%`,
      c.userId?.name || 'Unknown',
      c.status,
      c.priority || 'Medium',
      format(new Date(c.createdAt), 'MMM dd yyyy'),
      (c.resolutionRemarks || '').replace(/,/g, '')
    ]);
    
    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + csvData.map(e => e.join(",")).join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `ministry_complaints_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Ministry Complaints Report', 14, 22);
    doc.setFontSize(11);
    doc.text(`Generated: ${format(new Date(), 'MMM dd, yyyy')}`, 14, 30);
    
    const tableColumn = ["Title", "Budget", "Spent", "Completed", "Citizen", "Status", "Priority", "Date", "Remarks"];
    const tableRows = [];

    complaints.forEach(complaint => {
      const rowData = [
        complaint.title,
        `₹${(complaint.projectBudget || 0).toLocaleString()}`,
        `₹${(complaint.spentAmount || 0).toLocaleString()}`,
        `${complaint.completionPercentage ?? 0}%`,
        complaint.userId?.name || 'Unknown',
        complaint.status,
        complaint.priority || 'Medium',
        format(new Date(complaint.createdAt), 'MMM dd, yyyy'),
        complaint.resolutionRemarks || '-'
      ];
      tableRows.push(rowData);
    });

    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [29, 78, 216] } // primary blue
    });
    
    doc.save(`ministry_complaints_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  if (loading) return <div className="text-center py-10">Loading dashboard...</div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-500">Welcome, {user?.name}</p>
          <h1 className="text-2xl font-bold text-gray-900">Ministry Admin Dashboard</h1>
        </div>
        <div className="flex space-x-3">
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-50 transition text-sm font-medium shadow-sm"
          >
            <FileText className="h-4 w-4" /> CSV
          </button>
          <button 
            onClick={exportToPDF}
            className="flex items-center gap-2 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-50 transition text-sm font-medium shadow-sm"
          >
            <Download className="h-4 w-4" /> PDF
          </button>
        </div>
      </div>

      {/* Main Content Split: List & Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Complaints List */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Assigned Complaints</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Citizen</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Response Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {complaints.map((complaint) => (
                  <tr key={complaint._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{complaint.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{complaint.userId?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(complaint.status)}`}>
                        {complaint.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {complaint.priority || 'Medium'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatResponseTime(complaint)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(complaint.createdAt), 'MMM dd')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        onClick={() => {
                          setSelectedComplaint(complaint);
                          setUpdateStatus(complaint.status);
                          setUpdatePriority(complaint.priority || 'Medium');
                          setResolutionRemarks(complaint.resolutionRemarks || '');
                        }}
                        className="text-primary hover:text-blue-900"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Update Panel */}
        <div className="bg-white rounded-lg shadow p-6 h-fit">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Manage Complaint</h2>
              <p className="text-sm text-gray-500">Review and update complaint details below.</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedComplaint(null)}
              className="self-start inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Close
            </button>
          </div>

          {selectedComplaint ? (
            <div className="mt-6 space-y-6">
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-600">Complaint Details</h3>
                <p className="mt-2 text-sm font-medium text-gray-900">{selectedComplaint.title}</p>
                <p className="mt-1 text-sm text-gray-600">{selectedComplaint.description || 'No description provided.'}</p>

                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
                  <div>
                    <span className="font-medium text-gray-700">Filed by:</span> {selectedComplaint.userId?.name || 'Unknown'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Submitted:</span> {format(new Date(selectedComplaint.createdAt), 'MMM dd, yyyy')}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Location:</span> {selectedComplaint.location || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Type:</span> {selectedComplaint.projectType || 'General'}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Budget:</span> ₹{(selectedComplaint.projectBudget || 0).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Spent:</span> ₹{(selectedComplaint.spentAmount || 0).toLocaleString()}
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Completed:</span> {selectedComplaint.completionPercentage ?? 0}%
                  </div>
                  {selectedComplaint.resolvedAt && (
                    <div>
                      <span className="font-medium text-gray-700">Resolved:</span> {format(new Date(selectedComplaint.resolvedAt), 'MMM dd, yyyy')}
                    </div>
                  )}
                  <div>
                    <span className="font-medium text-gray-700">Status:</span>{' '}
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadge(selectedComplaint.status)}`}>
                      {selectedComplaint.status}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Priority:</span> {selectedComplaint.priority || 'Medium'}
                  </div>
                </div>

                {selectedComplaint.pendingWork && (
                  <div className="mt-4 p-4 rounded-lg bg-white border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-600">Pending Work</h4>
                    <p className="mt-2 text-sm text-gray-700">{selectedComplaint.pendingWork}</p>
                  </div>
                )}

                {selectedComplaint.attachments && selectedComplaint.attachments.length > 0 && (
                  <div className="mt-4 p-4 rounded-lg bg-white border border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-600">Attachments</h4>
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {selectedComplaint.attachments.map((url) => {
                        const isVideo = /\.(mp4|webm|ogg)$/i.test(url);
                        return (
                          <div
                            key={url}
                            onClick={() => setLightboxMedia({ url, isVideo })}
                            className="group cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition"
                          >
                            {isVideo ? (
                              <video className="w-full h-40 object-cover bg-black" muted>
                                <source src={url} />
                                Your browser does not support the video tag.
                              </video>
                            ) : (
                              <img src={url} alt="Attachment" className="w-full h-40 object-cover" />
                            )}
                            <div className="p-2 bg-white flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-700">View full</span>
                              <span className="text-xs text-gray-400 group-hover:text-primary transition">⤢</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-600 mb-3">Update Status</h3>

                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Status</label>
                      <select
                        value={updateStatus}
                        onChange={(e) => setUpdateStatus(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                      >
                        <option value="Pending">Pending</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Priority</label>
                      <select
                        value={updatePriority}
                        onChange={(e) => setUpdatePriority(e.target.value)}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                      >
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Official Notes</label>
                      <textarea
                        rows={4}
                        value={resolutionRemarks}
                        onChange={(e) => setResolutionRemarks(e.target.value)}
                        className="mt-1 block w-full shadow-sm focus:ring-primary focus:border-primary sm:text-sm border border-gray-300 rounded-md p-2"
                        placeholder="Add resolution notes..."
                      />
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center items-center px-4 py-2 rounded-md bg-primary text-white font-semibold hover:bg-blue-700 transition"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedComplaint(null)}
                    className="w-full inline-flex justify-center items-center px-4 py-2 rounded-md border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-sm text-gray-500 text-center py-12">
              Select a complaint from the list to see details and manage updates.
            </div>
          )}
        </div>

      </div>
      
      {/* Ministry Metrics & Budget Panel */}
      {ministryData && (
        <div className="bg-white rounded-lg shadow p-6 mt-8 border-t-4 border-primary">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Manage Department Overview & Budget</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div>
                     <div className="flex justify-between items-end mb-2">
                        <div>
                            <p className="text-sm text-gray-500 font-medium">Spent</p>
                            <p className="text-xl font-bold text-gray-900">₹{(ministryData.spentBudget || 0).toLocaleString()}</p>
                        </div>
                        <div className="text-center px-4 border-l border-r border-gray-200">
                             <p className="text-sm text-gray-500 font-medium whitespace-nowrap">Avg Response Time</p>
                             <p className="text-xl font-bold text-indigo-600">
                                {(() => {
                                   const resolved = complaints.filter(c => c.status === 'Resolved' && c.resolvedAt);
                                   if (resolved.length === 0) return '-';
                                   const totalMs = resolved.reduce((acc, curr) => acc + (new Date(curr.resolvedAt) - new Date(curr.createdAt)), 0);
                                   const avgHours = totalMs / resolved.length / (1000 * 60 * 60);
                                   return `${avgHours.toFixed(1)} hrs`;
                                })()}
                             </p>
                        </div>
                        <div className="text-right">
                             <p className="text-sm text-gray-500 font-medium">Total Allocated</p>
                             <p className="text-xl font-bold text-gray-900">₹{(ministryData.totalBudget || 0).toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mt-4 overflow-hidden mb-2">
                        <div 
                        className={`h-3 rounded-full transition-all duration-1000 ${((ministryData.spentBudget / (ministryData.totalBudget || 1)) * 100) > 90 ? 'bg-red-500' : 'bg-primary'}`} 
                        style={{ width: `${Math.min(100, (ministryData.spentBudget / (ministryData.totalBudget || 1)) * 100)}%` }}
                        ></div>
                    </div>
                    <p className="text-xs text-right text-gray-500">
                        {Math.round((ministryData.spentBudget / (ministryData.totalBudget || 1)) * 100)}% Utilized
                    </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <form onSubmit={handleBudgetUpdate} className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="w-full">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Update Spent Amount (₹)</label>
                            <input 
                                type="number" 
                                min="0"
                                max={ministryData.totalBudget}
                                value={updateSpent}
                                onChange={(e) => setUpdateSpent(e.target.value)}
                                className="block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary"
                            />
                        </div>
                        <button type="submit" className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium shrink-0 shadow-sm transition">
                             Update Budget
                        </button>
                    </form>
                </div>
            </div>

        </div>
      )}

      {/* Project Planning */}
      <div className="bg-white rounded-lg shadow p-6 mt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Project Planning</h2>
          <button
            type="button"
            onClick={() => {
              resetProjectForm();
              setShowProjectForm(prev => !prev);
            }}
            className="inline-flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700 transition text-sm"
          >
            <Plus className="h-4 w-4" />
            {showProjectForm ? 'Close' : 'Add Project'}
          </button>
        </div>

        {showProjectForm && (
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 mb-6">
            <h3 className="text-md font-semibold text-gray-900 mb-4">
              {selectedProject ? 'Edit Project' : 'New Project'}
            </h3>
            <form onSubmit={handleProjectSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Project Name</label>
                  <input
                    type="text"
                    required
                    value={projectForm.title}
                    onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Working Area</label>
                  <input
                    type="text"
                    value={projectForm.workingArea}
                    onChange={(e) => setProjectForm({ ...projectForm, workingArea: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows={3}
                  value={projectForm.description}
                  onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Total Budget (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={projectForm.projectBudget}
                    onChange={(e) => setProjectForm({ ...projectForm, projectBudget: Number(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Spent (₹)</label>
                  <input
                    type="number"
                    min={0}
                    value={projectForm.spentAmount}
                    onChange={(e) => setProjectForm({ ...projectForm, spentAmount: Number(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <select
                    value={projectForm.status}
                    onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary focus:border-primary sm:text-sm rounded-md"
                  >
                    <option value="Planned">Planned</option>
                    <option value="In Progress">In Progress</option>
                    <option value="On Hold">On Hold</option>
                    <option value="Completed">Completed</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Completion (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={projectForm.completionPercentage}
                    onChange={(e) => setProjectForm({ ...projectForm, completionPercentage: Number(e.target.value) })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pending Work</label>
                  <textarea
                    rows={2}
                    value={projectForm.pendingWork}
                    onChange={(e) => setProjectForm({ ...projectForm, pendingWork: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary sm:text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  className="bg-primary text-white px-4 py-2 rounded-md hover:bg-blue-700 transition"
                >
                  {selectedProject ? 'Update Project' : 'Create Project'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    resetProjectForm();
                    setShowProjectForm(false);
                  }}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Project</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Working Area</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Budget</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Spent</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {projects.map((project) => (
                <tr key={project._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{project.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{project.workingArea || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">₹{(project.projectBudget || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">₹{(project.spentAmount || 0).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{project.status}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{format(new Date(project.updatedAt), 'MMM dd')}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditProject(project)}
                        className="p-1 rounded-md text-gray-600 hover:bg-gray-100"
                        title="Edit project"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProject(project._id)}
                        className="p-1 rounded-md text-red-500 hover:bg-red-50"
                        title="Delete project"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {lightboxMedia && (
        <div
          onClick={() => setLightboxMedia(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-4xl rounded-xl bg-white shadow-xl overflow-hidden"
          >
            <button
              onClick={() => setLightboxMedia(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-white/90 text-gray-700 hover:bg-white focus:outline-none"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="p-4">
              {lightboxMedia.isVideo ? (
                <video controls className="w-full h-[70vh] rounded-lg bg-black">
                  <source src={lightboxMedia.url} />
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={lightboxMedia.url}
                  alt="Attachment"
                  className="w-full h-[70vh] object-contain rounded-lg bg-black"
                />
              )}
            </div>
            <div className="p-4 border-t border-gray-100 text-sm text-gray-500">
              Click outside or press Escape to close.
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MinistryDashboard;
