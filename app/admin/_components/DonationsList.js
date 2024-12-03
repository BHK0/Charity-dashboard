'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { ar } from 'date-fns/locale';
import DonationsListSkeleton from './DonationsListSkeleton';

export default function DonationsList({ organizationId, donations, loading }) {
  const tableVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  };

  const formattedDonations = useMemo(() => {
    if (!donations || donations.length === 0) return [];
    return donations.slice(0, 5).map((donation) => ({
      ...donation,
      formattedDate: format(new Date(donation.createdAt), 'P', { locale: ar }),
    }));
  }, [donations]);

  if (loading) {
    return <DonationsListSkeleton />;
  }

  if (formattedDonations.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center mt-4 text-gray-600"
      >
        No donations yet
      </motion.div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      exit="exit"
      variants={tableVariants}
      className="mt-4"
      dir="ltr"
    >
      <h3 className="text-lg font-semibold mb-2">Latest Donations</h3>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <div className="min-w-full inline-block align-middle">
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Phone Number
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Amount
                  </th>
                  <th scope="col" className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {formattedDonations.map((donation) => (
                  <tr key={donation.SK} className="hover:bg-gray-50">
                    <td className="whitespace-nowrap px-3 py-2 text-left text-xs text-gray-800">
                      <span className="inline-block max-w-[100px] truncate">
                        {donation.phoneNumber}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-left text-xs text-gray-800">
                      {donation.amount.toLocaleString('en-US')} SAR
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-left text-xs text-gray-800">
                      {donation.formattedDate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
