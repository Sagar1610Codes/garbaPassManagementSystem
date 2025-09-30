import React, { useState, useEffect, Fragment } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  EnvelopeIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { Dialog, Transition } from '@headlessui/react';

export default function Dashboard() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('user');
  const [isInviting, setIsInviting] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchUsers = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('No authentication token found. Please login again.');
        // You might want to redirect to login here
        // navigate('/login');
        return;
      }

      try {
        console.log('Fetching users with token:', token.substring(0, 15) + '...');
        
        const response = await axios.get(`${process.env.REACT_APP_API_URL}/users`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          signal,
          withCredentials: true
        });

        console.log('Users API Response:', response);
        
        if (isMounted) {
          // The data is in response.data.data because of advancedResults middleware
          const usersData = response.data?.data || response.data || [];
          console.log('Setting users:', usersData);
          setUsers(Array.isArray(usersData) ? usersData : []);
        }
      } catch (error) {
        if (axios.isCancel(error)) {
          console.log('Request was canceled:', error.message);
          return;
        }
        
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });

        if (error.response?.status === 401) {
          toast.error('Session expired. Please login again.');
          // Clear invalid token
          localStorage.removeItem('token');
          // Redirect to login
          // navigate('/login');
        } else if (error.response?.data?.message) {
          toast.error(`Error: ${error.response.data.message}`);
        } else {
          toast.error('Failed to load user data. Please try again later.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      isMounted = false;
      controller.abort('Component unmounted, request canceled');
    };
  }, []);

  const handleStatusUpdate = async (userId, newStatus) => {
    try {
      await axios.put(
        `/users/${userId}/status`,
        { status: newStatus },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      setUsers(users.map(user =>
        user._id === userId ? { ...user, status: newStatus } : user
      ));
      toast.success('User status updated');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update user status');
    }
  };

  const handleInviteUser = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter an email address');
      return;
    }

    setIsInviting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        '/auth/invite',
        { email, role },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      toast.success(`Invitation sent to ${email}`);
      setEmail('');
      setRole('user');
      setIsInviteModalOpen(false);
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error(error.response?.data?.error || 'Failed to send invitation');
    } finally {
      setIsInviting(false);
    }
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  // Ensure users is always an array before filtering
  const filteredUsers = Array.isArray(users) ? users.filter(user => 
    (user.email?.toLowerCase() || '').includes(searchTerm) ||
    (user.name?.toLowerCase() || '').includes(searchTerm) ||
    (user.role?.toLowerCase() || '').includes(searchTerm)
  ) : [];

  const getStatusBadge = (status) => {
    const statusMap = {
      active: { color: 'bg-green-100 text-green-800', icon: CheckCircleIcon },
      pending: { color: 'bg-yellow-100 text-yellow-800', icon: ClockIcon },
      inactive: { color: 'bg-red-100 text-red-800', icon: XCircleIcon }
    };

    const { color, icon: Icon } = statusMap[status] || { color: 'bg-gray-100 text-gray-800', icon: XCircleIcon };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-garba-yellow mx-auto mb-4"></div>
          <p className="text-gray-300">Loading users...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex justify-center items-center">
        <div className="text-center">
          <XCircleIcon className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Error Loading Data</h2>
          <p className="text-gray-300 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-garba-yellow text-black rounded-md hover:bg-yellow-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-garba-yellow"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center space-x-4 mb-2">
              <h1 className="text-2xl font-bold text-white">Dashboard</h1>
              {user?.role && (
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                  ? 'bg-purple-100 text-purple-800'
                  : 'bg-blue-100 text-blue-800'
                  }`}>
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </span>
              )}
            </div>
            <p className="text-gray-300">Manage and verify participant registrations</p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              type="button"
              onClick={() => setIsInviteModalOpen(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-garba-yellow hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-garba-yellow"
            >
              <EnvelopeIcon className="-ml-1 mr-2 h-5 w-5" />
              Invite User
            </button>
          </div>
        </div>

        <div className="mt-8 flex flex-col">
          <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                <div className="bg-white px-4 py-5 sm:p-6">
                  <div className="mb-4">
                    <input
                      type="text"
                      placeholder="Search users..."
                      className="block w-full rounded-md border-gray-300 shadow-sm focus:border-garba-yellow focus:ring-garba-yellow sm:text-sm"
                      value={searchTerm}
                      onChange={handleSearch}
                    />
                  </div>
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                          Name
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Email
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Role
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                          Status
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white" aria-live="polite">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                            No users found matching your search.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((user) => (
                          <tr key={user._id}>
                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                              {user.name || 'N/A'}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {user.email}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                                }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                              {getStatusBadge(user.status || 'inactive')}
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                              <div className="space-x-2">
                                <button
                                  onClick={() => handleStatusUpdate(user._id, 'active')}
                                  className="text-garba-yellow hover:text-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-garba-yellow rounded px-2 py-1 flex items-center"
                                  aria-label={`Approve ${user.name || 'user'}`}
                                  disabled={isLoading}
                                >
                                  {isLoading ? (
                                    <>
                                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-garba-yellow" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      <span>Processing...</span>
                                    </>
                                  ) : 'Approve'}
                                </button>
                                <button
                                  onClick={() => handleStatusUpdate(user._id, 'inactive')}
                                  className="text-red-600 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded px-2 py-1 ml-2 flex items-center"
                                  aria-label={`Reject ${user.name || 'user'}`}
                                  disabled={isLoading}
                                >
                                  {isLoading ? (
                                    <>
                                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                      </svg>
                                      <span>Processing...</span>
                                    </>
                                  ) : 'Reject'}
                                </button>
                              </div>
                            </td>
                          </tr>
                        )))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Invite User Modal */}
        <Transition.Root show={isInviteModalOpen} as={Fragment}>
          <Dialog as="div" className="relative z-10" onClose={() => !isInviting && setIsInviteModalOpen(false)}>
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            </Transition.Child>

            <div className="fixed inset-0 z-10 overflow-y-auto">
              <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                <Transition.Child
                  as={Fragment}
                  enter="ease-out duration-300"
                  enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                  enterTo="opacity-100 translate-y-0 sm:scale-100"
                  leave="ease-in duration-200"
                  leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                  leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                >
                  <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                    <div className="absolute top-0 right-0 pt-4 pr-4">
                      <button
                        type="button"
                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                        onClick={() => !isInviting && setIsInviteModalOpen(false)}
                        disabled={isInviting}
                      >
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    </div>
                    <div>
                      <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                        <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                          Invite New User
                        </Dialog.Title>
                        <div className="mt-2">
                          <form onSubmit={handleInviteUser} className="space-y-4">
                            <div>
                              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                Email address
                              </label>
                              <input
                                type="email"
                                name="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-garba-yellow focus:ring-garba-yellow sm:text-sm"
                                placeholder="user@example.com"
                                required
                                disabled={isInviting}
                              />
                            </div>
                            <div>
                              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                                Role
                              </label>
                              <select
                                id="role"
                                name="role"
                                value={role}
                                onChange={(e) => setRole(e.target.value)}
                                className="mt-1 block w-full rounded-md border-gray-300 py-2 pl-3 pr-10 text-base focus:border-garba-yellow focus:outline-none focus:ring-garba-yellow sm:text-sm"
                                disabled={isInviting}
                              >
                                <option value="user">User</option>
                                <option value="admin">Admin</option>
                              </select>
                            </div>
                            <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                              <button
                                type="submit"
                                disabled={isInviting}
                                className="inline-flex w-full justify-center rounded-md border border-transparent bg-garba-yellow px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-garba-yellow focus:ring-offset-2 sm:col-start-2 sm:text-sm"
                              >
                                {isInviting ? (
                                  <>
                                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Sending...
                                  </>
                                ) : 'Send Invitation'}
                              </button>
                              <button
                                type="button"
                                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-garba-yellow focus:ring-offset-2 sm:col-start-1 sm:mt-0 sm:text-sm"
                                onClick={() => setIsInviteModalOpen(false)}
                                disabled={isInviting}
                              >
                                Cancel
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
            </div>
          </Dialog>
        </Transition.Root>
      </div>
    </div>
  );
}