import { Suspense } from 'react';
import DateDonationForm from './_components/DateDonationForm';

export const metadata = {
  title: 'استلام التمور - الجمعية الخيرية',
  description: 'نموذج استلام التمور للجمعية الخيرية',
};

export default function FarmersPage() {
  return (
    <div className="min-h-screen bg-[#f8f7f8] py-12 px-4" dir="rtl">
      <Suspense fallback={
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6 animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/2 mx-auto mb-4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      }>
        <DateDonationForm />
      </Suspense>
    </div>
  );
} 