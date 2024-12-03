import { Suspense } from 'react';
import { getAllOrganizations } from '@/app/actions/organizations';
import { getAllDonations } from '@/app/actions/donations';
import AnalyticsClient from './_components/AnalyticsClient';
import AnalyticsTabSkeleton from '../_components/AnalyticsTabSkeleton';
import ExportDonationsButton from '../_components/ExportDonationsButton';

async function AnalyticsPage() {
  const organizations = await getAllOrganizations();
  
  // Get current month's data
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  
  // Pre-fetch initial month's donations
  const initialDonations = await getAllDonations(startOfMonth, endOfMonth);

  return (
    <div className="min-h-screen space-y-6" dir="ltr">
      <div className="h-16 flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Donations Log</h2>
        <ExportDonationsButton />
      </div>

      <Suspense fallback={<AnalyticsTabSkeleton />}>
        <AnalyticsClient 
          initialOrganizations={organizations} 
          initialDonations={initialDonations}
          initialMonth={`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`}
        />
      </Suspense>
    </div>
  );
}

export default AnalyticsPage;