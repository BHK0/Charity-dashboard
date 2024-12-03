import { Suspense } from 'react';
import { getDateDonations } from '@/app/actions/dateDonations';
import FarmersManagementClient from './_components/FarmersManagementClient';
import FarmersManagementSkeleton from './_components/FarmersManagementSkeleton';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

async function FarmersManagement() {
  const donations = await getDateDonations();

  return (
    <div className="min-h-screen space-y-6" dir="ltr">
      <div className="h-16 flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Farmers</h2>
        <Link
          href="/farmers"
          target="_blank"
          className="flex items-center gap-2 px-4 py-2 bg-[#998966] text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          <span>Open Form</span>
          <ExternalLink size={18} />
        </Link>
      </div>

      <Suspense fallback={<FarmersManagementSkeleton />}>
        <FarmersManagementClient initialDonations={donations} />
      </Suspense>
    </div>
  );
}

export default FarmersManagement;