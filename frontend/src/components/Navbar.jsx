import React, { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, FileText, Building2, BarChart2, LogOut, LogIn } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white shadow-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-primary flex items-center gap-2">
                 <Building2 className="h-6 w-6" /> GovAnalytics
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link to="/" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Home
              </Link>
              <Link to="/leaderboard" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Leaderboard
              </Link>
               <Link to="/ministries" className="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Ministries
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
             <Link 
  to="/submit-complaint" 
  className="bg-[#2E4897] text-white px-4 py-2 rounded-md text-sm font-medium shadow"
>
  Submit Complaint
</Link>
            {user ? (
              <div className="flex items-center gap-4">
                <Link to="/dashboard" className="text-gray-600 hover:text-primary transition flex items-center gap-1">
                   <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-gray-600 hover:text-red-600 transition flex items-center gap-1"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            ) : (
               <div className="flex items-center gap-2">
                 <Link to="/login" className="text-gray-600 hover:text-primary transition flex items-center gap-1">
                   <LogIn className="h-4 w-4" /> Login
                 </Link>
                 <Link 
  to="/register" 
  className="border border-[#2E4897] text-[#2E4897] px-3 py-1.5 rounded-md hover:bg-[#2E4897] hover:text-white transition text-sm"
>
  Register
</Link>
               </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
