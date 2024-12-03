'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { resetPassword } from '../actions/auth';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      router.replace('/login');
    }
  }, [token, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (password !== confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }

    setIsSubmitting(true);

    try {
      await resetPassword(token, password);
      setMessage('تم إعادة تعيين كلمة المرور بنجاح');
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      setError(error.message || 'حدث خطأ أثناء إعادة تعيين كلمة المرور');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!token) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f8]">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md" dir="rtl">
        <h2 className="text-2xl font-semibold mb-6 text-[#998966]">إعادة تعيين كلمة المرور</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              كلمة المرور الجديدة
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#998966] focus:border-[#998966]"
              required
              minLength={6}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تأكيد كلمة المرور
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#998966] focus:border-[#998966]"
              required
              minLength={6}
            />
          </div>

          {message && (
            <div className="p-3 bg-green-50 text-green-800 rounded-lg">
              {message}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 text-red-800 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            className={`w-full bg-[#998966] text-white px-6 py-2 rounded-lg transition-opacity ${
              isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
            }`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'جاري الإرسال...' : 'إعادة تعيين كلمة المرور'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f8f7f8]">
        <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md text-center" dir="rtl">
          جاري التحميل...
        </div>
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
} 