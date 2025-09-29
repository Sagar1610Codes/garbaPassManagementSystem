import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, UserCircleIcon } from '@heroicons/react/24/outline';

const Navbar = () => {
  return (
    <nav className="bg-garba-dark shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <span className="text-xl font-bold text-garba-yellow">Garba<span className="text-white">Pass</span></span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link 
                to="/" 
                className="border-garba-yellow text-garba-yellow inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium hover:bg-gray-800 hover:bg-opacity-30 rounded-md px-3 py-2"
              >
                <HomeIcon className="h-5 w-5 mr-1" />
                Home
              </Link>
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            <Link
              to="/register"
              className="bg-garba-orange text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-opacity-90 transition duration-150"
            >
              Get Your Pass
            </Link>
            <Link
              to="/dashboard"
              className="ml-4 text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium flex items-center"
            >
              <UserCircleIcon className="h-5 w-5 mr-1" />
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
