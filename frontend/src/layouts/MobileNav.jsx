import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const MobileNav = () => {
  const location = useLocation();
  return (
    <div className="lg:hidden bg-gray-800 border-b border-gray-700 p-4">
      <div className="grid grid-cols-3 gap-2">
        <Link
          to="/character"
          className={`flex items-center justify-center p-2 rounded-lg ${location.pathname === '/character'
            ? 'bg-primary-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:text-white'
            }`}
        >
          Character
        </Link>
        <Link
          to="/"
          className={`flex items-center justify-center p-2 rounded-lg ${location.pathname === '/'
            ? 'bg-primary-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:text-white'
            }`}
        >
          Chat
        </Link>
        <Link
          to="/stats"
          className={`flex items-center justify-center p-2 rounded-lg ${location.pathname === '/stats'
            ? 'bg-primary-600 text-white'
            : 'bg-gray-700 text-gray-300 hover:text-white'
            }`}
        >
          Stats
        </Link>
      </div>
    </div>
  );
};

export default MobileNav;
