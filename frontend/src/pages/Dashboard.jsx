import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import CitizenDashboard from './CitizenDashboard';
import MinistryDashboard from './MinistryDashboard';
import GovAdminDashboard from './GovAdminDashboard';

const Dashboard = () => {
  const { user } = useContext(AuthContext);

  if (!user) return null;

  if (user.role === 'citizen') {
    return <CitizenDashboard />;
  } else if (user.role === 'ministry_admin') {
    return <MinistryDashboard />;
  } else if (user.role === 'gov_admin' || user.role === 'super_admin') {
    return <GovAdminDashboard />;
  }

  return <div>Unknown Role</div>;
};

export default Dashboard;
