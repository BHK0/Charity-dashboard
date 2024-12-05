'use client';

import { useState } from 'react';
import { login } from '../actions/auth';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        // Small delay to ensure cookie is set
        setTimeout(() => {
          router.push('/admin');
        }, 100);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f7f8]">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md" dir="ltr">
        <h2 className="text-2xl font-semibold mb-6 text-[#998966]">Login</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#998966] focus:border-[#998966]"
            required
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-[#998966] focus:border-[#998966]"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 px-3 py-2 text-gray-500 hover:text-gray-700"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
        </div>
        <button
          type="submit"
          className={`w-full bg-[#998966] text-white px-6 py-2 rounded-lg transition-opacity ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Login'}
        </button>
        <div className="text-center mt-4">
          <Link 
            prefetch={true}
            href="/forgot-password"
            className="text-[#998966] hover:underline"
          >
            Forgot Password?
          </Link>
        </div>
      </form>
    </div>
  );
}
