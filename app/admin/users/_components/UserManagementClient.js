'use client';

import { useState } from 'react';
import { sendUserInvitation } from '@/app/actions/users';
import Link from 'next/link';
import { FiArrowLeft, FiCopy, FiCheck } from 'react-icons/fi';

export default function UserManagementClient({ initialUsers }) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState(initialUsers);
  const [error, setError] = useState('');
  const [lastInviteLink, setLastInviteLink] = useState('');
  const [copyStatus, setCopyStatus] = useState({});

  const handleAddUser = async (e) => {
    e.preventDefault();
    setError('');
    setLastInviteLink('');

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    // Check if email already exists
    if (users.some(user => user.email === email)) {
      setError('Email already exists');
      return;
    }

    setIsSubmitting(true);

    try {
      const { token } = await sendUserInvitation(email);
      const inviteLink = `${window.location.origin}/setup-password?token=${token}`;
      setLastInviteLink(inviteLink);
      setEmail('');
      setUsers([...users, { email, inviteLink }]);
    } catch (error) {
      console.error('Error sending invitation:', error);
      alert('An error occurred while sending the invitation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyLink = async (link, id) => {
    try {
      await navigator.clipboard.writeText(link);
      setCopyStatus({ [id]: true });
      setTimeout(() => setCopyStatus({ [id]: false }), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="min-h-screen p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-[#998966]">User Management</h2>
        <Link href="/admin" className="text-[#998966] hover:text-gray-700 transition-colors">
          <FiArrowLeft size={24} />
        </Link>
      </div>

      <form onSubmit={handleAddUser} className="space-y-4 mb-8">
        <div className="flex flex-col md:flex-row items-center space-y-2 md:space-y-0 md:space-x-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full md:flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#998966] focus:border-[#998966]"
            placeholder="Enter email address"
            required
          />
          <button
            type="submit"
            className={`w-full md:w-auto bg-[#998966] text-white px-6 py-2 rounded-lg transition-opacity ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Sending...' : 'Add User'}
          </button>
        </div>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </form>

      {lastInviteLink && (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h3 className="text-green-800 font-semibold mb-2">Invitation sent successfully!</h3>
          <div className="flex items-center space-x-2 bg-white p-2 rounded border border-green-200">
            <input
              type="text"
              value={lastInviteLink}
              readOnly
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm"
            />
            <button
              onClick={() => handleCopyLink(lastInviteLink, 'latest')}
              className="p-2 text-[#998966] hover:text-gray-700 transition-colors"
            >
              {copyStatus['latest'] ? <FiCheck /> : <FiCopy />}
            </button>
          </div>
        </div>
      )}

      <h3 className="text-lg font-semibold mb-4">Users List</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Email</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Invite Link</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user, index) => (
              <tr key={user.email} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{user.email}</td>
                <td className="px-4 py-3">
                  {user.inviteLink && (
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-500 truncate max-w-[50px]">
                        {user.inviteLink}
                      </span>
                      <button
                        onClick={() => handleCopyLink(user.inviteLink, index)}
                        className="p-1 text-[#998966] hover:text-gray-700 transition-colors"
                        title="Copy Link"
                      >
                        {copyStatus[index] ? <FiCheck /> : <FiCopy />}
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
