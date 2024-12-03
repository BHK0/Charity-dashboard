'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { createOrganizationWithOptimistic } from '@/app/actions/organizations';
import { useFormState, useFormStatus } from 'react-dom';

// Reuse the DonationChoicesEditor component
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
              className="mr-2 text-gray-500 hover:text-red-500"
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

// Add this component for the submit button
function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      disabled={pending}
      className={`bg-[#998966] text-white px-6 py-2.5 rounded-lg transition-opacity ${
        pending ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
      }`}
    >
      {pending ? 'Saving...' : 'Save'}
    </button>
  );
}

export default function CreateOrgButton({ onOptimisticAdd }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    customUrl: '',
    logo: '',
    colors: { primary: '#998966', secondary: '#f8f7f8' },
    donationChoices: [30, 60, 120]
  });
  const [previewUrl, setPreviewUrl] = useState(null);

  // Initial state for form
  const initialState = { message: null, errors: {} };

  // Form state handler
  const [state, formAction] = useFormState(async (prevState, formData) => {
    try {
      // Validate required fields
      if (!formData.get('name') || !formData.get('customUrl') || !formData.get('logo')) {
        return { 
          message: 'An error occurred',
          errors: { submit: 'All fields are required' }
        };
      }

      // Create organization data object
      const orgData = {
        name: formData.get('name'),
        customUrl: formData.get('customUrl'),
        logo: formData.get('logo'),
        colors: { primary: '#998966', secondary: '#f8f7f8' },
        donationChoices: JSON.parse(formData.get('donationChoices') || '[30, 60, 120]'),
      };

      const result = await createOrganizationWithOptimistic(orgData);
      
      if (result.success) {
        // Add optimistic flag
        const optimisticOrg = {
          ...result.organization,
          _isOptimistic: true
        };
        
        // Add to optimistic state
        onOptimisticAdd(optimisticOrg);
        
        // Close modal and reset form
        setIsModalOpen(false);
        setFormData({
          name: '',
          customUrl: '',
          logo: '',
          colors: { primary: '#998966', secondary: '#f8f7f8' },
          donationChoices: [30, 60, 120]
        });
        setPreviewUrl(null);
        
        return { message: 'Organization created successfully', errors: {} };
      } else {
        return { 
          message: 'Error creating organization',
          errors: { submit: result.error }
        };
      }
    } catch (error) {
      return { 
        message: 'An unexpected error occurred',
        errors: { submit: error.message }
      };
    }
  }, initialState);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type and size
    if (file.type !== 'image/png' || file.size > 500 * 1024) {
      alert('Please upload a PNG image less than 500KB');
      return;
    }

    try {
      setIsUploading(true);
      
      // Create preview URL
      const previewURL = URL.createObjectURL(file);
      setPreviewUrl(previewURL);

      // Prepare file for upload
      const filename = `logos/${Date.now()}-${file.name}`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
      }, 60000); // Increased to 60 seconds

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

        setFormData((prevData) => ({ ...prevData, logo: data.url }));
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
        errorMessage = 'Server connection failed. Please check your internet connection and try again';
      } else {
        errorMessage += ': ' + error.message;
      }
      
      alert(errorMessage);
      setPreviewUrl(null);
      setFormData((prevData) => ({ ...prevData, logo: '' }));
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="bg-[#998966] text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity"
      >
        Add New Organization
      </button>

      {isModalOpen && (
        <div className="fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsModalOpen(false)}
          />
          
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <form
              action={formAction}
              className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-[#998966]">Add New Organization</h3>
              </div>

              {/* Form Content */}
              <div className="p-6 space-y-4">
                {/* Logo Upload */}
                <div>
                  <input
                    type="hidden"
                    name="logo"
                    value={formData.logo}
                    required
                  />
                  <div
                    className="w-24 h-24 md:w-32 md:h-32 mx-auto border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center relative overflow-hidden cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploading ? (
                      <div className="text-center">
                        <svg className="animate-spin h-8 w-8 text-gray-400" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                        </svg>
                      </div>
                    ) : previewUrl ? (
                      <Image
                        src={previewUrl}
                        alt="Logo preview"
                        layout="fill"
                        objectFit="contain"
                        className="object-contain scale-80"
                      />
                    ) : (
                      <div className="text-center p-2">
                        <svg className="mx-auto h-8 w-8 md:h-12 md:w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-1 text-xs md:text-sm text-gray-500 break-words text-center">
                          Choose organization logo
                        </p>
                      </div>
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

                {/* Organization Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organization Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#998966] focus:border-[#998966]"
                    required
                  />
                </div>

                {/* Custom URL */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custom URL</label>
                  <div className="flex items-center w-full">
                    <div className="bg-gray-100 text-gray-500 h-10 px-3 py-2 rounded-l-lg border border-r-0 border-gray-300 whitespace-nowrap text-sm">
                      https://charity-dashboard.vercel.app/
                    </div>
                    <input
                      type="text"
                      name="customUrl"
                      value={formData.customUrl}
                      onChange={(e) => {
                        const value = e.target.value.toLowerCase().replace(/[^a-z0-9]/g, '');
                        setFormData(prev => ({ ...prev, customUrl: value }));
                      }}
                      className="flex-1 px-3 w-full py-2 border h-10 border-gray-300 rounded-r-lg focus:ring-[#998966] focus:border-[#998966]"
                      required
                    />
                  </div>
                </div>

                {/* Donation Choices */}
                <div>
                  <input
                    type="hidden"
                    name="donationChoices"
                    value={JSON.stringify(formData.donationChoices)}
                  />
                  <label className="block text-sm font-medium text-gray-700 mb-2">Donation Options</label>
                  <DonationChoicesEditor
                    choices={formData.donationChoices}
                    onChange={(newChoices) => setFormData(prev => ({
                      ...prev,
                      donationChoices: newChoices
                    }))}
                  />
                </div>
              </div>

              {/* Error message */}
              {state?.errors?.submit && (
                <div className="px-6 pb-4">
                  <div className="p-4 text-red-500 bg-red-50 rounded-lg">
                    {state.errors.submit}
                  </div>
                </div>
              )}

              {/* Footer */}
              <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="bg-gray-100 text-gray-800 px-4 py-2.5 rounded-lg hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <SubmitButton />
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
