import { useState, useEffect } from 'react';
import { getDonationsByOrg } from '@/app/actions/donations';

export function useBatchDonations(organizationIds) {
  const [donationsMap, setDonationsMap] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAllDonations = async () => {
      setLoading(true);
      try {
        const promises = organizationIds.map(id => getDonationsByOrg(id));
        const results = await Promise.all(promises);
        
        const newDonationsMap = organizationIds.reduce((acc, id, index) => {
          acc[id] = results[index];
          return acc;
        }, {});
        
        setDonationsMap(newDonationsMap);
      } catch (error) {
        console.error('Error fetching donations:', error);
      } finally {
        setLoading(false);
      }
    };

    if (organizationIds.length > 0) {
      fetchAllDonations();
    }
  }, [organizationIds]);

  return { donationsMap, loading };
}
