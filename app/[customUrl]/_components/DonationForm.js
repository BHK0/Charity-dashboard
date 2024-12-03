'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createDonation } from '@/app/actions/donations';

// Helper function to translate rate limit error messages
const translateRateLimitError = (error) => {
  if (!error.includes('Too many requests')) return error;
  return `عذراً، لقد تجاوزت الحد المسموح به من المحاولات. الرجاء المحاولة مرة أخرى بعد 5 دقائق.`;
};

// Phone number validation
const validatePhoneNumber = (phone) => {
  const phoneRegex = /^05\d{8}$/;
  return phoneRegex.test(phone);
};

// Format phone number as user types
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

export default function DonationForm({ organization }) {
  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    amount: null
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [orgLogoSize, setOrgLogoSize] = useState({ width: 120, height: 80 });
  const [touched, setTouched] = useState({});

  // Logo size calculation effect
  useEffect(() => {
    const img = new window.Image();
    img.src = organization.logo;
    img.onload = () => {
      const aspectRatio = img.width / img.height;
      let newWidth = 120; // Reduced max width
      let newHeight = newWidth / aspectRatio;
      
      if (newHeight > 80) { // Reduced max height
        newHeight = 80;
        newWidth = newHeight * aspectRatio;
      }
      
      setOrgLogoSize({ width: Math.round(newWidth), height: Math.round(newHeight) });
    };
  }, [organization.logo]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'رقم الجوال مطلوب';
    } else if (!validatePhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = 'يجب أن يبدأ رقم الجوال بـ 05 وأن يتكون من 10 أرقام';
    }

    // Only show amount error if user has interacted with amount selection
    if (touched.amount && !formData.amount) {
      newErrors.amount = 'الرجاء اختيار مبلغ البرع';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Add this new function to check if form is valid for submit button
  const isFormValid = () => {
    return validatePhoneNumber(formData.phoneNumber) && formData.amount !== null;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'phoneNumber') {
      setFormData(prev => ({
        ...prev,
        [name]: formatPhoneNumber(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateForm();
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const orgId = organization.SK.split('#')[1];
      await createDonation(orgId, {
        name: formData.name.trim() || 'مجهول',
        phoneNumber: formData.phoneNumber,
        amount: formData.amount
      });
      
      setFormData({ name: '', phoneNumber: '', amount: null });
      setTouched({});
      alert('تم استلام طلب التبرع بنجاح!');
    } catch (error) {
      console.error('Error submitting donation:', error);
      setErrors(prev => ({
        ...prev,
        submit: translateRateLimitError(error.message)
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6" dir="rtl">
      {/* Updated Logo Header Section with consistent spacing */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative w-full flex justify-center">
          {/* Center container with fixed gap from separator */}
          <div className="relative flex items-center">
            {/* Right Logo Container */}
            <div className="w-[100px] flex justify-end"> {/* Fixed width container */}
              <div className="relative w-[65px] h-[80px]">
                <Image
                  src="/logoLong.png"
                  alt="Khair Charity"
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </div>
            </div>

            {/* Separator Line */}
            <div className="h-16 w-px bg-gray-300 mx-4" /> {/* Fixed margin */}

            {/* Left Logo Container */}
            <div className="w-[100px] flex justify-start"> {/* Fixed width container */}
              <div className="relative" style={{ width: orgLogoSize.width, height: orgLogoSize.height }}>
                <Image
                  src={organization.logo}
                  alt={organization.name}
                  fill
                  style={{ objectFit: 'contain' }}
                  priority
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Organization Name */}
        <h2 className="mt-4 text-xl font-semibold text-gray-800">{organization.name}</h2>
      </div>

      <div className="space-y-4">
        {errors.submit && (
          <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm">
            {errors.submit}
          </div>
        )}
        
        <div className="space-y-2">
          <input
            type="text"
            name="name"
            placeholder="الاسم (اختياري)"
            value={formData.name}
            onChange={handleInputChange}
            className="w-full p-3 border rounded-lg text-right transition-colors focus:border-[#998966] focus:ring-1 focus:ring-[#998966]"
            dir="rtl"
          />
        </div>

        <div className="space-y-2">
          <div className="relative">
            <input
              type="tel"
              name="phoneNumber"
              placeholder="رقم الجوال"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              onBlur={() => handleBlur('phoneNumber')}
              className={`w-full p-3 border rounded-lg text-right transition-colors ${
                errors.phoneNumber && touched.phoneNumber
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : 'focus:border-[#998966] focus:ring-1 focus:ring-[#998966]'
              }`}
              dir="rtl"
            />
            {formData.phoneNumber && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm">
                {validatePhoneNumber(formData.phoneNumber) ? (
                  <span className="text-green-600">✓ رقم صحيح</span>
                ) : (
                  <span className="text-gray-500">
                    {10 - formData.phoneNumber.length} أرقام متبقية
                  </span>
                )}
              </span>
            )}
          </div>
          {errors.phoneNumber && touched.phoneNumber && (
            <p className="text-sm text-red-500">{errors.phoneNumber}</p>
          )}
        </div>
        
        <div>
          <div className="grid grid-cols-3 gap-3">
            {organization.donationChoices.map((amount) => (
              <button
                key={amount}
                onClick={() => {
                  setFormData(prev => ({ ...prev, amount }));
                  setTouched(prev => ({ ...prev, amount: true }));
                }}
                className={`h-12 px-3 py-2 rounded-lg transition-colors duration-200 text-sm ${
                  formData.amount === amount 
                    ? 'bg-[#998966] text-white ring-2 ring-[#998966] shadow-lg'
                    : 'bg-gray-100 text-gray-800 hover:shadow-md border-2 border-[#998966]'
                }`}
              >
                {amount} ريال
              </button>
            ))}
          </div>
          {errors.amount && touched.amount && (
            <p className="text-sm text-red-500 mt-1">{errors.amount}</p>
          )}
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !isFormValid()}
          className={`w-full p-3 rounded-xl text-white transition-all duration-200 transform bg-[#998966] ${
            isSubmitting || !isFormValid()
              ? 'opacity-50 cursor-not-allowed hover:opacity-50' 
              : 'hover:opacity-90 hover:scale-[1.02]'
          }`}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center space-x-reverse space-x-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>جاري التنفيذ...</span>
            </div>
          ) : (
            'تبرع الآن'
          )}
        </button>
      </div>
    </div>
  );
}
