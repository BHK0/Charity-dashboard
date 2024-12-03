'use client';

import { useState } from 'react';
import { forgotPassword } from '../actions/auth';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setError('');

    try {
      await forgotPassword(email);
      setMessage('تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني');
      setEmail('');
    } catch (error) {
      setError(error.message || 'حدث خطأ أثناء إرسال رابط إعادة التعيين');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f8]">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md" dir="rtl">
        <h2 className="text-2xl font-semibold mb-6 text-[#998966]">نسيت كلمة المرور</h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#998966] focus:border-[#998966]"
              required
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
            {isSubmitting ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
          </button>

          <div className="text-center mt-4">
            <Link 
              href="/login"
              className="text-[#998966] hover:underline"
            >
              العودة إلى تسجيل الدخول
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
} 