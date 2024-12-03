'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiCamera } from 'react-icons/fi';
import Image from 'next/image';
import { createDateDonation } from '@/app/actions/dateDonations';
import { toast } from 'react-hot-toast';

const validatePhoneNumber = (phone) => {
  const phoneRegex = /^05\d{8}$/;
  return phoneRegex.test(phone);
};

const formatPhoneNumber = (value) => {
  // Remove any non-digit characters
  const numbers = value.replace(/\D/g, '');
  
  // Ensure it starts with 05
  if (numbers.length === 0) return '';
  if (numbers.length === 1 && numbers[0] !== '0') return '0';
  if (numbers.length === 2 && numbers[0] === '0' && numbers[1] !== '5') return '05';
  
  // Format the rest of the number
  if (numbers.length <= 2) return numbers;
  return numbers.slice(0, 10);
};

export default function DateDonationForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({
    donationType: '',
    donorName: '',
    quantity: '',
    phoneNumber: '',
  });
  
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [images, setImages] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.donationType) {
      newErrors.donationType = 'Please select donation type';
    }
    
    if (!formData.quantity || formData.quantity <= 0) {
      newErrors.quantity = 'Please enter a valid quantity';
    }
    
    if (!formData.phoneNumber || !/^05\d{8}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Please enter a valid mobile number';
    }
    
    if (images.length === 0) {
      newErrors.images = 'Please add at least one image';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    const validFiles = files.filter(file => {
      if (file.size > maxSize) {
        toast.error(`File ${file.name} is too large. Maximum size is 5MB`);
        return false;
      }
      return true;
    });

    if (validFiles.length + images.length > 4) {
      toast.error('You can upload up to 4 images');
      return;
    }

    setImages(prev => [...prev, ...validFiles]);
    
    // Create preview URLs
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrls(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setFormData({
      donationType: '',
      donorName: '',
      quantity: '',
      phoneNumber: '',
    });
    setImages([]);
    setPreviewUrls([]);
    setTouched({});
    setShowSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched({
      donationType: true,
      quantity: true,
      phoneNumber: true,
      images: true
    });

    if (!validateForm()) {
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Create FormData for image upload
      const imageFormData = new FormData();
      images.forEach((image) => {
        imageFormData.append('files', image);
      });

      // Upload images to S3
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: imageFormData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload images');
      }

      const { imageUrls } = await uploadResponse.json();

      // Create donation with image URLs
      await createDateDonation({
        ...formData,
        donorName: formData.donorName.trim() || 'Anonymous',
        images: imageUrls,
      });

      setShowSuccess(true);
      
      // Reset form after 3 seconds
      setTimeout(() => {
        resetForm();
      }, 3000);
      
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('An error occurred while submitting the donation');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="bg-white rounded-lg shadow-lg p-8 text-center space-y-4"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 }}
              className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center"
            >
              <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-800">Donation Received Successfully</h2>
            <p className="text-gray-600">Thank you for your donation</p>
          </motion.div>
        ) : (
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            onSubmit={handleSubmit} 
            className="bg-white rounded-lg shadow-lg p-4 sm:p-6 space-y-6"
          >
            {/* Logo and Title */}
            <div className="text-center space-y-4">
              <div className="relative w-full h-20 sm:h-24">
                <Image
                  src="/logoLong.png"
                  alt="Khair Dates Society"
                  fill
                  priority
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[#998966]">Received Dates</h1>
                <p className="text-gray-600">For Year 2024</p>
              </div>
            </div>

            {/* Donation Type */}
            <div className="space-y-2">
              <label className="block text-lg font-medium text-gray-700">Donation Type</label>
              <div className="grid grid-cols-3 gap-3">
                {['Zakat', 'Sadaqah', 'Gift'].map((type) => (
                  <motion.button
                    key={type}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, donationType: type }))}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      formData.donationType === type 
                        ? 'border-[#998966] bg-[#998966] text-white'
                        : 'border-gray-200 hover:border-[#998966]'
                    }`}
                  >
                    {type}
                  </motion.button>
                ))}
              </div>
              {errors.donationType && touched.donationType && (
                <p className="text-red-500 text-sm">{errors.donationType}</p>
              )}
            </div>

            {/* Donor Name */}
            <div className="space-y-2">
              <label className="block text-lg font-medium text-gray-700">
                Donor Name (Optional)
              </label>
              <input
                type="text"
                value={formData.donorName}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  donorName: e.target.value 
                }))}
                placeholder="Will be recorded as Anonymous if left empty"
                className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-[#998966] outline-none"
              />
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <label className="block text-lg font-medium text-gray-700">
                Quantity (KG)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  quantity: e.target.value 
                }))}
                className="w-full p-3 rounded-lg border-2 border-gray-200 focus:border-[#998966] outline-none"
                placeholder="0.00"
              />
              {errors.quantity && touched.quantity && (
                <p className="text-red-500 text-sm">{errors.quantity}</p>
              )}
            </div>

            {/* Phone Number */}
            <div className="space-y-2">
              <label className="block text-lg font-medium text-gray-700">
                Mobile Number
              </label>
              <div className="relative">
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    phoneNumber: formatPhoneNumber(e.target.value) 
                  }))}
                  onBlur={() => setTouched(prev => ({ ...prev, phoneNumber: true }))}
                  className={`w-full p-3 rounded-lg border-2 ${
                    touched.phoneNumber && !validatePhoneNumber(formData.phoneNumber)
                      ? 'border-red-500 focus:border-red-500'
                      : 'border-gray-200 focus:border-[#998966]'
                  } outline-none`}
                  placeholder="05xxxxxxxx"
                  maxLength="10"
                  dir="ltr"
                />
                {formData.phoneNumber && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                    {validatePhoneNumber(formData.phoneNumber) ? (
                      <span className="text-green-600">✓ Valid number</span>
                    ) : (
                      <span className="text-gray-500">
                        {10 - formData.phoneNumber.length} digits remaining
                      </span>
                    )}
                  </span>
                )}
              </div>
              {touched.phoneNumber && !validatePhoneNumber(formData.phoneNumber) && (
                <p className="text-sm text-red-500">
                  Mobile number must start with 05 and be 10 digits long
                </p>
              )}
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="block text-lg font-medium text-gray-700">Images</label>
              <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                {/* Image Preview */}
                {previewUrls.map((url, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200"
                  >
                    <Image
                      src={url}
                      alt={`Preview ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
                
                {/* Upload Button */}
                {previewUrls.length < 4 && (
                  <motion.label
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="aspect-square rounded-lg border-2 border-dashed border-gray-300 hover:border-[#998966] cursor-pointer flex flex-col items-center justify-center text-gray-500 hover:text-[#998966] transition-colors"
                  >
                    <FiCamera className="w-6 h-6 mb-1" />
                    <span className="text-xs sm:text-sm text-center px-2">
                      {previewUrls.length === 0 ? 'Add Images' : 'Add More'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </motion.label>
                )}
              </div>
              {errors.images && touched.images && (
                <p className="text-red-500 text-sm">{errors.images}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Upload up to 4 images • Maximum 5MB per image
              </p>
            </div>

            {/* Submit Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 px-6 rounded-lg bg-[#998966] text-white font-medium transition-opacity ${
                isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle 
                      className="opacity-25" 
                      cx="12" 
                      cy="12" 
                      r="10" 
                      stroke="currentColor" 
                      strokeWidth="4" 
                      fill="none" 
                    />
                    <path 
                      className="opacity-75" 
                      fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" 
                    />
                  </svg>
                  <span>Submitting...</span>
                </div>
              ) : (
                'Submit'
              )}
            </motion.button>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}