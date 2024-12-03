

import { getOrganizationByUrl } from '@/app/actions/organizations';
import DonationForm from './_components/DonationForm';

// Generate metadata for the page
export async function generateMetadata({ params }) {
  const org = await getOrganizationByUrl(params.customUrl);
  
  if (!org) {
    return {
      title: 'Page Not Found'
    };
  }

  return {
    title: `${org.name} - Khair`,
    description: `Donation page for ${org.name}`
  };
}

export default async function OrganizationPage({ params }) {
  const org = await getOrganizationByUrl(params.customUrl);
  
  if (!org) {
    return <div className="text-center p-8">Organization not found</div>;
  }

  return (
    <div className="min-h-screen p-4 bg-[#f8f7f8]">
      <DonationForm organization={org} />
    </div>
  );
}
