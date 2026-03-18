import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

const Unauthorized = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="max-w-lg w-full bg-white rounded-2xl shadow-md border border-gray-100 p-10 text-center">
        <div className="flex items-center justify-center mb-6">
          <ShieldAlert className="h-12 w-12 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Unauthorized</h1>
        <p className="text-gray-600 mb-6">
          You do not have permission to access this page. If you believe this is an error,
          please contact your administrator or try a different account.
        </p>
        <div className="flex justify-center gap-3">
          <Link
            to="/"
            className="px-6 py-2 rounded-md bg-primary text-white font-semibold hover:bg-blue-700 transition"
          >
            Go to Home
          </Link>
          <Link
            to="/dashboard"
            className="px-6 py-2 rounded-md bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Unauthorized;
