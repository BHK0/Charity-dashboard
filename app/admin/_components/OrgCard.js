'use client';

import { motion } from 'framer-motion';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import DonationsList from './DonationsList';
import DonationsListSkeleton from './DonationsListSkeleton';
import { updateOrganization, deleteOrganization } from '@/app/actions/organizations';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { deleteBlob } from '@/app/actions/blobs';
import { canManageOrg } from '@/app/utils/authHelpers';
import { toast } from 'react-hot-toast';

function DonationChoicesEditor({ choices, onChange }) {
  const [newAmount, setNewAmount] = useState('');

  const handleAdd = () => {
    if (newAmount && !isNaN(newAmount)) {
      const amount = parseInt(newAmount);
      onChange([...choices, amount].sort((a, b) => a - b));
      setNewAmount('');
    }
  };

  const handleRemove = (index) => {
    const newChoices = choices.filter((_, i) => i !== index);
    onChange(newChoices);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {choices.map((amount, index) => (
          <div
            key={index}
            className="inline-flex items-center bg-gray-100 rounded-full px-3 py-1"
          >
            <span className="text-sm">{amount} SAR</span>
            <button
              type="button"
              onClick={() => handleRemove(index)}
              className="ml-2 text-gray-500 hover:text-red-500"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="number"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
          placeholder="Enter amount"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
        />
        <button
          type="button"
          onClick={handleAdd}
          className="bg-[#998966] text-white px-4 py-2 rounded-lg hover:opacity-90"
        >
          Add
        </button>
      </div>
    </div>
  );
}

export default function OrgCard({ organization, donations, onUpdate, onDelete, isOptimistic, userEmail }) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [authError, setAuthError] = useState('');
  const fileInputRef = useRef(null);
  const [editData, setEditData] = useState({
    name: organization.name,
    customUrl: organization.customUrl,
    donationChoices: organization.donationChoices,
    logo: organization.logo
  });
  const [previewUrl, setPreviewUrl] = useState(organization.logo);
  const [urlError, setUrlError] = useState('');
  const orgId = organization.SK.split('#')[1];  
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
  };

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 }
  };

  const validateCustomUrl = useCallback((url) => {
    if (url === organization.customUrl) return true;
    if (url.length < 3) return false;
    const urlRegex = /^[a-z0-9]+$/;
    return urlRegex.test(url);
  }, [organization.customUrl]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'image/png' || file.size > 500 * 1024) {
      alert('Please upload a PNG image less than 500KB');
      return;
    }

    try {
      setIsUploading(true);
      
      const previewURL = URL.createObjectURL(file);
      setPreviewUrl(previewURL);

      const filename = `logos/${Date.now()}-${file.name}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      try {
        const response = await fetch(`/api/upload/blob?filename=${filename}`, {
          method: 'POST',
          body: file,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `Connection error: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.url) {
          throw new Error('Image URL not received');
        }

        setEditData(prev => ({ ...prev, logo: data.url }));
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          throw new Error('File upload took too long. Please try again');
        }
        throw fetchError;
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      let errorMessage = 'Error uploading image';
      if (error.message.includes('took too long')) {
        errorMessage = error.message;
      } else if (error.message === 'Failed to fetch') {
        errorMessage = 'Failed to connect to server';
      } else {
        errorMessage += ': ' + error.message;
      }
      alert(errorMessage);
      setPreviewUrl(organization.logo);
      setEditData(prev => ({ ...prev, logo: organization.logo }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = useCallback(async () => {
    if (!validateCustomUrl(editData.customUrl)) {
      setUrlError('Custom URL must contain only lowercase letters and numbers');
      return;
    }
    if (!editData.name.trim()) {
      setUrlError('Organization name is required');
      return;
    }

    setIsEditing(true);
    try {
      if (editData.logo !== organization.logo) {
        await deleteBlob(organization.logo);
      }
      await updateOrganization(orgId, editData);
      window.location.reload();
    } catch (error) {
      console.error('Error updating organization:', error);
      alert('Error during update');
    } finally {
      setIsEditing(false);
    }
  }, [editData, organization.logo, orgId, validateCustomUrl]);

  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await deleteBlob(organization.logo);
      await deleteOrganization(orgId);
      window.location.reload();
    } catch (error) {
      console.error('Error deleting organization:', error);
      alert('Error during deletion');
    } finally {
      setIsDeleting(false);
    }
  }, [organization.logo, orgId]);

  const handleEditClick = () => {
    if (!canManageOrg(userEmail, orgId)) {
      toast.error("You're not authorized to edit this organization");
      return;
    }
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = () => {
    if (!canManageOrg(userEmail, orgId)) {
      toast.error("You're not authorized to delete this organization");
      return;
    }
    setIsDeleteModalOpen(true);
  };

  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      layout
      className={`bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300 p-6 ${
        isOptimistic ? 'opacity-70' : ''
      }`}
      dir="ltr"
    >
      {isOptimistic && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75">
          <div className="text-[#998966] animate-pulse">Adding...</div>
        </div>
      )}
      
      <div className="flex items-center space-x-4 mb-4">
        <div className="relative w-16 h-16 justify-center items-center rounded-full overflow-hidden border-2 border-[#998966]">
          <Image
            src={organization.logo}
            alt={organization.name}
            width={64}
            height={64}
            className="object-contain scale-75 transition-transform duration-300 hover:scale-90"
          />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{organization.name}</h3>
          <p className="text-sm text-gray-500">{organization.customUrl}</p> 
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-gray-600">Total Donations:</span>
          <span className="font-semibold text-[#998966]">{organization.totalDonations.toLocaleString('en-US')} SAR</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-600">Number of Donations:</span>
          <span className="font-semibold text-[#998966]">{organization.donationCount.toLocaleString('en-US')}</span>
        </div>
      </div>

      <div className="mt-4 flex space-x-2">
        <Link
          href={`/${organization.customUrl}`}
          className="bg-[#998966] text-white px-4 py-2 rounded hover:opacity-90 transition-opacity text-sm"
          target="_blank"
        >
          View Page
        </Link>
        <button
          onClick={handleEditClick}
          className="bg-[#f8f7f8] text-[#998966] px-4 py-2 rounded hover:bg-gray-200 transition-colors text-sm"
        >
          Edit
        </button>
        <button
          onClick={handleDeleteClick}
          className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition-colors text-sm"
        >
          Delete
        </button>
      </div>
      
      <DonationsList organizationId={orgId} donations={donations} />

      {isEditModalOpen && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={modalVariants}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Edit Organization</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Organization Logo</label>
                <div
                  className="w-24 h-24 mx-auto border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center relative overflow-hidden cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploading ? (
                    <div className="text-center">
                      <svg className="animate-spin h-8 w-8 text-gray-400" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                      </svg>
                    </div>
                  ) : (
                    <Image
                      src={previewUrl}
                      alt="Logo preview"
                      width={96}
                      height={96}
                      className="object-contain scale-75"
                    />
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png"
                  className="hidden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#998966] focus:border-[#998966]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Custom URL</label>
                <div className="flex items-center w-full">
                  <div className="bg-gray-100 text-gray-500 h-10 px-3 py-2 rounded-l-lg border border-r-0 border-gray-300 whitespace-nowrap text-sm">
                    https://charity-dashboard-orcin.vercel.app/
                  </div>
                  <input
                    type="text"
                    value={editData.customUrl}
                    onChange={(e) => {
                      const value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                      setEditData(prev => ({ ...prev, customUrl: value }));
                      setUrlError('');
                    }}
                    className="flex-1 px-3 w-full py-2 border h-10 border-gray-300 rounded-r-lg rounded-l-none focus:ring-[#998966] focus:border-[#998966]"
                  />
                </div>
                {urlError && <p className="mt-1 text-sm text-red-500">{urlError}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Donation Options</label>
                <DonationChoicesEditor
                  choices={editData.donationChoices}
                  onChange={(newChoices) => setEditData(prev => ({
                    ...prev,
                    donationChoices: newChoices
                  }))}
                />
              </div>

              <div className="flex space-x-4">
                <button
                  onClick={handleEdit}
                  className={`bg-[#998966] text-white px-6 py-2 rounded-lg transition-opacity ${isEditing ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
                  disabled={isEditing}
                >
                  {isEditing ? 'Saving...' : 'Save'}
                </button>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {isDeleteModalOpen && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={modalVariants}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h3 className="text-xl font-semibold mb-4">Confirm Deletion</h3>
            <p className="mb-4">Are you sure you want to delete this organization?</p>
            <div className="flex space-x-4">
              <button
                onClick={handleDelete}
                className={`bg-red-500 text-white px-6 py-2 rounded-lg transition-opacity ${isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-600'}`}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="bg-gray-200 text-gray-800 px-6 py-2 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
