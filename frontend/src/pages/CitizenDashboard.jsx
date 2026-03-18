import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { format } from 'date-fns';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

const CitizenDashboard = () => {
  const { user } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const { data } = await api.get('/complaints');
        setComplaints(data);
      } catch (error) {
        console.error('Error fetching complaints', error);
      } finally {
        setLoading(false);
      }
    };
    fetchComplaints();
  }, []);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Resolved': return <CheckCircle className="text-green-500 h-5 w-5" />;
      case 'In Progress': return <Clock className="text-yellow-500 h-5 w-5" />;
      default: return <AlertCircle className="text-red-500 h-5 w-5" />;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Resolved': return 'bg-green-100 text-green-800';
      case 'In Progress': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-red-100 text-red-800';
    }
  };

  if (loading) return <div className="text-center py-10">Loading your complaints...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user.name}</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Your Complaints</h2>
        </div>
        {complaints.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            You haven't submitted any complaints yet.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {complaints.map((complaint) => (
              <div key={complaint._id} className="p-6 hover:bg-gray-50 transition">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(complaint.status)}
                    <h3 className="text-lg font-medium text-gray-900">{complaint.title}</h3>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(complaint.status)}`}>
                    {complaint.status}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  <p>{complaint.description}</p>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                  <div>Ministry: {complaint.ministryId?.name || 'Unknown'}</div>
                  <div>Submitted: {format(new Date(complaint.createdAt), 'MMM dd, yyyy')}</div>
                </div>
                 {complaint.resolutionRemarks && (
                   <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-100 text-sm">
                     <span className="font-medium text-gray-700">Official Remark: </span>
                     <span className="text-gray-600">{complaint.resolutionRemarks}</span>
                   </div>
                 )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CitizenDashboard;
