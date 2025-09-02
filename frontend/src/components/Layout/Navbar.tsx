import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  VideoCameraIcon, 
  UserCircleIcon,
  ArrowRightOnRectangleIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { clsx } from 'clsx';

// Navigation bar component
const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <VideoCameraIcon className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">
                VideoCall Platform
              </span>
            </Link>
          </div>

          {/* Navigation links and user menu */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Navigation links based on user role */}
                <div className="hidden md:flex items-center space-x-6">
                  <Link 
                    to="/dashboard" 
                    className="text-gray-700 hover:text-blue-600 font-medium"
                  >
                    Dashboard
                  </Link>
                  
                  {user?.role === 'educator' && (
                    <Link 
                      to="/sessions/create" 
                      className="text-gray-700 hover:text-blue-600 font-medium"
                    >
                      Create Session
                    </Link>
                  )}
                  
                  {user?.role === 'child' && (
                    <Link 
                      to="/join" 
                      className="text-gray-700 hover:text-blue-600 font-medium"
                    >
                      Join Session
                    </Link>
                  )}
                </div>

                {/* User menu */}
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <UserCircleIcon className="h-6 w-6 text-gray-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {user?.name}
                    </span>
                    <span className={clsx(
                      'px-2 py-1 text-xs font-medium rounded-full',
                      user?.role === 'educator' 
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    )}>
                      {user?.role}
                    </span>
                  </div>
                  
                  <button
                    onClick={handleLogout}
                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Logout"
                  >
                    <ArrowRightOnRectangleIcon className="h-5 w-5" />
                  </button>
                </div>
              </>
            ) : (
              /* Authentication links for non-authenticated users */
              <div className="flex items-center space-x-4">
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-blue-600 font-medium"
                >
                  Login
                </Link>
                <Link 
                  to="/signup" 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile navigation menu */}
      {isAuthenticated && (
        <div className="md:hidden border-t border-gray-200 bg-gray-50">
          <div className="px-4 py-3 space-y-2">
            <Link 
              to="/dashboard" 
              className="block px-3 py-2 text-gray-700 hover:text-blue-600 font-medium"
            >
              Dashboard
            </Link>
            
            {user?.role === 'educator' && (
              <Link 
                to="/sessions/create" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 font-medium"
              >
                Create Session
              </Link>
            )}
            
            {user?.role === 'child' && (
              <Link 
                to="/join" 
                className="block px-3 py-2 text-gray-700 hover:text-blue-600 font-medium"
              >
                Join Session
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;