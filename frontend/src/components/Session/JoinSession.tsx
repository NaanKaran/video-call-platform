import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, PlayIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import sessionService from '../../services/sessionService';

// Join session component (for children/students)
const JoinSession: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessionCode, setSessionCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!sessionCode.trim()) {
      setError('Please enter a session code');
      return;
    }

    setIsJoining(true);

    try {
      // First, try to join the session
      const session = await sessionService.joinSession({ 
        session_code: sessionCode.trim().toUpperCase() 
      });

      // If successful, navigate to the session
      navigate(`/session/${session._id}`);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message;
      if (errorMessage?.includes('not found')) {
        setError('Session not found. Please check the session code and try again.');
      } else if (errorMessage?.includes('ended')) {
        setError('This session has already ended.');
      } else {
        setError(errorMessage || 'Failed to join session');
      }
    } finally {
      setIsJoining(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert to uppercase and remove spaces
    const value = e.target.value.toUpperCase().replace(/\s/g, '');
    setSessionCode(value);
  };

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          
          <div className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <PlayIcon className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900">Join Session</h1>
            <p className="mt-2 text-gray-600">
              Enter the session code provided by your educator
            </p>
          </div>
        </div>

        {/* Join form */}
        <div className="bg-white shadow-sm rounded-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Session code input */}
            <div>
              <label htmlFor="sessionCode" className="block text-sm font-medium text-gray-700 mb-2">
                Session Code
              </label>
              <input
                type="text"
                id="sessionCode"
                value={sessionCode}
                onChange={handleCodeChange}
                placeholder="Enter 8-digit code"
                maxLength={8}
                className="block w-full px-4 py-3 text-center text-lg font-mono border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 uppercase tracking-widest"
                required
              />
              <p className="mt-2 text-sm text-gray-500 text-center">
                The session code is usually 8 characters long
              </p>
            </div>

            {/* User info */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600">
                <p><strong>Joining as:</strong> {user?.name}</p>
                <p><strong>Role:</strong> {user?.role}</p>
              </div>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isJoining || !sessionCode.trim()}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isJoining ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                  </svg>
                  Joining Session...
                </>
              ) : (
                <>
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Join Session
                </>
              )}
            </button>
          </form>
        </div>

        {/* Instructions */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Instructions</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium text-xs">
                1
              </div>
              <p>Get the session code from your educator</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium text-xs">
                2
              </div>
              <p>Enter the 8-digit code in the field above</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium text-xs">
                3
              </div>
              <p>Click "Join Session" to enter the video call</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium text-xs">
                4
              </div>
              <p>Allow camera and microphone access when prompted</p>
            </div>
          </div>
        </div>

        {/* Help section */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Having trouble? Make sure you have the correct session code from your educator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default JoinSession;