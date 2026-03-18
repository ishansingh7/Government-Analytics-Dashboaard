import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import { Trophy, Medal, Star, Target, Activity } from 'lucide-react';

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data } = await api.get('/analytics');
        setLeaderboard(data.leaderboard);
      } catch (error) {
        console.error('Error fetching leaderboard', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="text-center py-20">Loading rankings...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="text-center bg-white rounded-2xl p-10 shadow-sm border border-gray-100">
        <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Ministry Performance Rankings</h1>
        <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
          Transparent evaluation of government departments based on grievance resolution efficiency and public responsiveness.
        </p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
           <h2 className="text-lg font-bold text-gray-900 flex items-center">
             <Activity className="h-5 w-5 text-primary mr-2" /> Live Standings
           </h2>
           <span className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-sm">Updated Today</span>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Ministry</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Resolution Rate</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Resolved</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Avg Time</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Score</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {leaderboard.map((ministry, index) => (
                <tr key={ministry.ministryId} className="hover:bg-blue-50/50 transition duration-150 ease-in-out">
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className={`flex items-center justify-center h-10 w-10 border-2 rounded-full font-bold text-sm shadow-sm ${
                        index === 0 ? 'bg-yellow-100 border-yellow-400 text-yellow-700' : 
                        index === 1 ? 'bg-gray-100 border-gray-300 text-gray-700' : 
                        index === 2 ? 'bg-orange-100 border-orange-300 text-orange-700' : 
                        'bg-white border-gray-200 text-gray-500'
                      }`}>
                         {index === 0 ? <Trophy className="h-5 w-5" /> : index === 1 ? <Medal className="h-5 w-5" /> : index === 2 ? <Medal className="h-5 w-5" /> : `#${index + 1}`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <Link to={`/ministries/${ministry.ministryId}/analytics`} className="text-sm font-bold text-gray-900 hover:text-primary transition">
                           {ministry.ministryName}
                        </Link>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center">
                       <Target className="h-4 w-4 text-gray-400 mr-1.5" />
                       <span className="text-sm font-medium text-gray-900">{ministry.resolutionRate}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-center">
                    <span className="px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full bg-green-100 text-green-800">
                      {ministry.resolvedComplaints} / {ministry.totalComplaints}
                    </span>
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-center text-sm font-medium text-gray-600">
                    {ministry.avgResolutionTimeDays ? `${ministry.avgResolutionTimeDays} days` : '-'}
                  </td>
                  <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-bold">
                     <div className="flex items-center justify-end text-primary">
                         <Star className="h-4 w-4 mr-1 fill-current" />
                         {ministry.performanceScore}
                     </div>
                  </td>
                </tr>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                   <td colSpan="6" className="px-6 py-10 text-center text-gray-500 italic">No rankings available yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
