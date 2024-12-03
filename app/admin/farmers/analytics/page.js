import { Suspense } from 'react';
import { getDateDonations } from '@/app/actions/dateDonations';
import FarmersAnalyticsClient from './_components/FarmersAnalyticsClient';
import AnalyticsTabSkeleton from '../../_components/AnalyticsTabSkeleton';
import ExportFarmerDonationsButton from '../../_components/ExportFarmerDonationsButton';

async function FarmersAnalytics() {
  const donations = await getDateDonations();

  return (
    <div className="min-h-screen space-y-6">
      <div className="h-16 flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Farmers Analytics</h2>
        <ExportFarmerDonationsButton />
      </div>

      <Suspense fallback={<AnalyticsTabSkeleton />}>
        <FarmersAnalyticsClient initialDonations={donations} />
      </Suspense>
    </div>
  );
}

export default FarmersAnalytics;