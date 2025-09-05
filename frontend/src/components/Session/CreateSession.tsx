import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CalendarIcon, 
  ClockIcon, 
  ArrowLeftIcon, 
  UserPlusIcon, 
  XMarkIcon,
  EnvelopeIcon 
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import sessionService from '../../services/sessionService';
import type { CreateSessionData } from '../../types';

// Create session form component (educators only)
const CreateSession: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState<CreateSessionData>({
    name: '',
    scheduled_time: '',
    duration: 60,
  });

  // Participant invitation state
  const [participants, setParticipants] = useState<string[]>([]);
  const [newParticipantEmail, setNewParticipantEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Redirect if not an educator
  React.useEffect(() => {
    if (user && user.role !== 'educator') {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) : value,
    }));
  };

  // Email validation function
  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Add participant email
  const handleAddParticipant = () => {
    setEmailError('');
    
    if (!newParticipantEmail.trim()) {
      setEmailError('Please enter an email address');
      return;
    }

    if (!isValidEmail(newParticipantEmail)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (participants.includes(newParticipantEmail.toLowerCase())) {
      setEmailError('This participant has already been added');
      return;
    }

    setParticipants(prev => [...prev, newParticipantEmail.toLowerCase()]);
    setNewParticipantEmail('');
  };

  // Remove participant
  const handleRemoveParticipant = (email: string) => {
    setParticipants(prev => prev.filter(p => p !== email));
  };

  // Handle enter key in participant email input
  const handleParticipantKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddParticipant();
    }
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim()) return 'Session name is required';
    if (formData.name.trim().length < 3) return 'Session name must be at least 3 characters';
    if (!formData.scheduled_time) return 'Scheduled time is required';
    
    // Check if scheduled time is in the future
    const scheduledDate = new Date(formData.scheduled_time);
    const now = new Date();
    if (scheduledDate <= now) return 'Scheduled time must be in the future';
    
    if (formData.duration && formData.duration < 15) return 'Duration must be at least 15 minutes';
    if (formData.duration && formData.duration > 240) return 'Duration cannot exceed 240 minutes';
    
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate form
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);

    try {
      const session = await sessionService.createSession({
        ...formData,
        name: formData.name.trim(),
        participant_emails: participants,
      });

      // Redirect to dashboard with success message
      navigate('/dashboard', {
        state: {
          message: `Session "${session.name}" created successfully! Session code: ${session.session_code}`,
        }
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create session');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get minimum date/time (current time + 5 minutes)
  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now.toISOString().slice(0, 16);
  };

  return (
    <div className="h-full bg-gray-50 overflow-auto">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to Dashboard
          </button>
          
          <h1 className="text-3xl font-bold text-gray-900">Create New Session</h1>
          <p className="mt-2 text-gray-600">
            Set up a video session for your students
          </p>
        </div>

        {/* Create session form */}
        <div className="bg-white shadow-sm rounded-lg">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Session name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Session Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Math Session with Grade 5"
              />
              <p className="mt-1 text-sm text-gray-500">
                Give your session a descriptive name
              </p>
            </div>

            {/* Scheduled time */}
            <div>
              <label htmlFor="scheduled_time" className="block text-sm font-medium text-gray-700">
                <CalendarIcon className="inline h-4 w-4 mr-1" />
                Scheduled Date & Time *
              </label>
              <input
                type="datetime-local"
                id="scheduled_time"
                name="scheduled_time"
                required
                value={formData.scheduled_time}
                onChange={handleChange}
                min={getMinDateTime()}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                When do you want to start this session?
              </p>
            </div>

            {/* Duration */}
            <div>
              <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                <ClockIcon className="inline h-4 w-4 mr-1" />
                Duration (minutes) *
              </label>
              <input
                type="number"
                id="duration"
                name="duration"
                required
                min="15"
                max="240"
                step="5"
                value={formData.duration}
                onChange={handleChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                How long will this session last? (15-240 minutes)
              </p>
            </div>

            {/* Participant invitations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <UserPlusIcon className="inline h-4 w-4 mr-1" />
                Invite Participants (Optional)
              </label>
              
              {/* Add participant input */}
              <div className="flex space-x-2 mb-3">
                <div className="flex-1">
                  <input
                    type="email"
                    value={newParticipantEmail}
                    onChange={(e) => {
                      setNewParticipantEmail(e.target.value);
                      setEmailError('');
                    }}
                    onKeyPress={handleParticipantKeyPress}
                    placeholder="Enter participant email address"
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  {emailError && (
                    <p className="mt-1 text-sm text-red-600">{emailError}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleAddParticipant}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors flex items-center"
                >
                  <UserPlusIcon className="h-4 w-4 mr-1" />
                  Add
                </button>
              </div>

              {/* Participants list */}
              {participants.length > 0 && (
                <div className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Invited Participants ({participants.length})
                  </h4>
                  <div className="space-y-2">
                    {participants.map((email, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-white px-3 py-2 rounded border border-gray-200"
                      >
                        <div className="flex items-center space-x-2">
                          <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-700">{email}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveParticipant(email)}
                          className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                          title="Remove participant"
                        >
                          <XMarkIcon className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="mt-2 text-sm text-gray-500">
                Add participant email addresses to send them automatic invitations with the session details and join link.
              </p>
            </div>

            {/* Session preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Session Preview</h3>
              <div className="text-sm text-blue-700 space-y-1">
                <p><strong>Name:</strong> {formData.name || 'Enter session name'}</p>
                <p><strong>Scheduled:</strong> {
                  formData.scheduled_time 
                    ? new Date(formData.scheduled_time).toLocaleString()
                    : 'Select date and time'
                }</p>
                <p><strong>Duration:</strong> {formData.duration} minutes</p>
                <p><strong>Educator:</strong> {user?.name}</p>
                {participants.length > 0 && (
                  <p><strong>Invited Participants:</strong> {participants.length} people will receive invitations</p>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                    </svg>
                    Creating...
                  </>
                ) : (
                  'Create Session'
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Help section */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">How it works</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium text-xs">
                1
              </div>
              <p>Create your session with a name, date, and duration</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium text-xs">
                2
              </div>
              <p>A unique session code will be generated automatically</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium text-xs">
                3
              </div>
              <p>Share the session code with your students</p>
            </div>
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-medium text-xs">
                4
              </div>
              <p>Start the session when it's time and students can join</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateSession;