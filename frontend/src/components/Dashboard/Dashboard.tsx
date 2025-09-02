import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PlusIcon,
  CalendarIcon,
  UserGroupIcon,
  PlayIcon,
  ClockIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { Session } from '../../types';
import sessionService from '../../services/sessionService';
import { clsx } from 'clsx';

// Dashboard component showing user's sessions
const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Load user's sessions
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true);
        const data = await sessionService.getSessions();
        setSessions(data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load sessions');
      } finally {
        setLoading(false);
      }
    };

    loadSessions();
  }, []);

  // Format date and time for display
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  // Get status color classes
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'ended':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Join a session
  const handleJoinSession = (sessionId: string) => {
    navigate(`/session/${sessionId}`);
  };

  // Delete a session (educators only)
  const handleDeleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this session?')) return;

    try {
      await sessionService.deleteSession(sessionId);
      setSessions(sessions.filter(s => s._id !== sessionId));
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete session');
    }
  };

  // Filter sessions by status
  const scheduledSessions = sessions.filter(s => s.status === 'scheduled');
  const activeSessions = sessions.filter(s => s.status === 'active');
  const endedSessions = sessions.filter(s => s.status === 'ended');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your sessions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Welcome back, {user?.name}!
              </h1>
              <p className="mt-2 text-gray-600">
                {user?.role === 'educator' 
                  ? 'Manage your teaching sessions' 
                  : 'Your upcoming sessions'}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3">
              {user?.role === 'educator' ? (
                <button
                  onClick={() => navigate('/sessions/create')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Session
                </button>
              ) : (
                <button
                  onClick={() => navigate('/join')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Join Session
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* Quick stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <ClockIcon className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Scheduled</p>
                <p className="text-2xl font-bold text-gray-900">{scheduledSessions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <PlayIcon className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold text-gray-900">{activeSessions.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <CalendarIcon className="h-8 w-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{endedSessions.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions list */}
        <div className="space-y-6">
          {/* Active sessions */}
          {activeSessions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Active Sessions</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {activeSessions.map((session) => (
                  <SessionCard 
                    key={session._id} 
                    session={session} 
                    onJoin={handleJoinSession}
                    onDelete={user?.role === 'educator' ? handleDeleteSession : undefined}
                    userRole={user?.role}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Scheduled sessions */}
          {scheduledSessions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Upcoming Sessions</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {scheduledSessions.map((session) => (
                  <SessionCard 
                    key={session._id} 
                    session={session} 
                    onJoin={handleJoinSession}
                    onDelete={user?.role === 'educator' ? handleDeleteSession : undefined}
                    userRole={user?.role}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recent sessions */}
          {endedSessions.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-medium text-gray-900">Recent Sessions</h2>
              </div>
              <div className="divide-y divide-gray-200">
                {endedSessions.slice(0, 5).map((session) => (
                  <SessionCard 
                    key={session._id} 
                    session={session} 
                    userRole={user?.role}
                  />
                ))}
              </div>
            </div>
          )}

          {/* No sessions message */}
          {sessions.length === 0 && (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions yet</h3>
              <p className="text-gray-600 mb-6">
                {user?.role === 'educator' 
                  ? 'Create your first session to start teaching'
                  : 'Join a session using a session code or wait for an invitation'}
              </p>
              {user?.role === 'educator' ? (
                <button
                  onClick={() => navigate('/sessions/create')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Your First Session
                </button>
              ) : (
                <button
                  onClick={() => navigate('/join')}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                >
                  <PlayIcon className="h-5 w-5 mr-2" />
                  Join a Session
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Individual session card component
interface SessionCardProps {
  session: Session;
  onJoin?: (sessionId: string) => void;
  onDelete?: (sessionId: string) => void;
  userRole?: string;
}

const SessionCard: React.FC<SessionCardProps> = ({ session, onJoin, onDelete, userRole }) => {
  // Format date and time for display
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  const { date, time } = formatDateTime(session.scheduled_time);
  const educatorName = typeof session.educator_id === 'object' ? session.educator_id.name : 'Educator';
  const participantCount = Array.isArray(session.participants) ? session.participants.length : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'active': return 'bg-green-100 text-green-800';
      case 'ended': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-medium text-gray-900">{session.name}</h3>
            <span className={clsx(
              'px-2 py-1 text-xs font-medium rounded-full',
              getStatusColor(session.status)
            )}>
              {session.status}
            </span>
          </div>

          <div className="flex items-center space-x-6 text-sm text-gray-600">
            <div className="flex items-center space-x-1">
              <CalendarIcon className="h-4 w-4" />
              <span>{date} at {time}</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <UserGroupIcon className="h-4 w-4" />
              <span>{participantCount} participants</span>
            </div>

            {userRole === 'child' && (
              <div className="flex items-center space-x-1">
                <span>Educator: {educatorName}</span>
              </div>
            )}

            <div className="flex items-center space-x-1">
              <ClockIcon className="h-4 w-4" />
              <span>{session.duration} min</span>
            </div>
          </div>

          <div className="mt-2">
            <p className="text-sm text-gray-500">
              Session Code: <span className="font-mono font-medium">{session.session_code}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Join button */}
          {onJoin && session.status !== 'ended' && (
            <button
              onClick={() => onJoin(session._id)}
              className={clsx(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                session.status === 'active'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              )}
            >
              {session.status === 'active' ? 'Join Now' : 'Enter Session'}
            </button>
          )}

          {/* Delete button (educators only) */}
          {onDelete && session.status !== 'active' && (
            <button
              onClick={() => onDelete(session._id)}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete session"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;