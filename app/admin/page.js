import { Suspense } from 'react';
import { getAllOrganizations } from '../actions/organizations';
import { getDonationsByOrg } from '../actions/donations';
import AdminDashboardClient from './_components/AdminDashboardClient';
import OrgCardSkeleton from './_components/OrgCardSkeleton';

async function AdminDashboard() {
  const organizations = await getAllOrganizations();

  const donationsMap = {};
  for (const org of organizations) {
    const orgId = org.SK.split('#')[1];
    donationsMap[orgId] = await getDonationsByOrg(orgId);
  }

  return (
    <div className="min-h-screen space-y-6" dir="ltr">
      <div className="h-16 flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900">Organizations</h2>
        <Suspense>
          <AdminDashboardClient 
            initialOrganizations={organizations} 
            showOnlyButton={true} 
          />
        </Suspense>
      </div>

      <Suspense fallback={
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {[...Array(6)].map((_, index) => (
            <OrgCardSkeleton key={index} />
          ))}
        </div>
      }>
        <AdminDashboardClient 
          initialOrganizations={organizations}
          initialDonationsMap={donationsMap}
          showOnlyContent={true} 
        />
      </Suspense>
    </div>
  );
}

export default AdminDashboard;
