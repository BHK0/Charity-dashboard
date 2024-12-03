'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setupPassword } from '../actions/auth';

function SetupPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isValidToken, setIsValidToken] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      router.push('/login');
    } else {
      setIsValidToken(true);
    }
  }, [token, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      alert('كلمات المرور غير متطابقة');
      return;
    }

    setIsSubmitting(true);

    try {
      await setupPassword(token, password);
      alert('تم إعداد كلمة المرور بنجاح');
      router.push('/login');
    } catch (error) {
      console.error('Setup password error:', error);
      alert('حدث خطأ أثناء إعداد كلمة المرور');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isValidToken) {
    return null; // or a loading spinner
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f8]" dir="rtl">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold mb-6 text-[#998966]">إعداد كلمة المرور</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">كلمة المرور الجديدة</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#998966] focus:border-[#998966]"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">تأكيد كلمة المرور</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#998966] focus:border-[#998966]"
            required
          />
        </div>
        <button
          type="submit"
          className={`w-full bg-[#998966] text-white px-6 py-2 rounded-lg transition-opacity ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'جاري التنفيذ...' : 'إعداد كلمة المرور'}
        </button>
      </form>
    </div>
  );
}

export default function SetupPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SetupPasswordForm />
    </Suspense>
  );
}
