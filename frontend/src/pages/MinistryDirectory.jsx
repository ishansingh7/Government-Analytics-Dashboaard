import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Building2, PieChart } from 'lucide-react';

const MinistryDirectory = () => {
  const [ministries, setMinistries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMinistries = async () => {
      try {
        const { data } = await api.get('/ministries');
        setMinistries(data);
      } catch (error) {
        console.error('Error fetching ministries', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMinistries();
  }, []);

  if (loading) return <div className="text-center py-20">Loading ministries...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-8">
        <Building2 className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold text-gray-900">Government Ministries</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ministries.map((ministry) => (
          <div key={ministry._id} className="bg-white rounded-xl shadow-md border border-gray-100 hover:shadow-lg transition overflow-hidden flex flex-col">
            <div className="p-6 flex-grow">
              <h2 className="text-xl font-bold text-gray-900 mb-2 truncate" title={ministry.name}>
                {ministry.name}
              </h2>
              <p className="text-gray-500 text-sm line-clamp-3 mb-4">
                {ministry.description || 'No description provided for this ministry.'}
              </p>
               
               {/* Budget visualization mockup */}
               <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                     <span>Budget Usage</span>
                     <span>{Math.round((ministry.spentBudget / (ministry.totalBudget || 1)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full ${ministry.spentBudget > ministry.totalBudget * 0.9 ? 'bg-red-500' : 'bg-primary'}`} 
                      style={{ width: `${Math.min(100, (ministry.spentBudget / (ministry.totalBudget || 1)) * 100)}%` }}
                    ></div>
                  </div>
               </div>
            </div>
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-100 mt-auto flex justify-between items-center">
              <Link
                to={`/ministries/${ministry._id}/analytics`}
                className="text-primary hover:text-blue-700 font-medium text-sm flex items-center gap-1 transition"
              >
                <PieChart className="h-4 w-4" /> View Analytics
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MinistryDirectory;
