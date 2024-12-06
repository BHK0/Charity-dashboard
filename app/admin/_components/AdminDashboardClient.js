'use client';

import { useState, useOptimistic } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CreateOrgButton from './CreateOrgButton';
import OrgCard from './OrgCard';
import withAuth from '../../utils/withAuth';

function AdminDashboardClientBase({ 
  initialOrganizations, 
  initialDonationsMap,
  showOnlyButton, 
  showOnlyContent,
  userEmail,
  isLoading
}) {
  // Use optimistic state for organizations
  const [optimisticOrgs, addOptimisticOrg] = useOptimistic(
    initialOrganizations,
    (state, newOrg) => [...state, newOrg]
  );

  if (showOnlyButton) {
    return (
      <CreateOrgButton 
        onOptimisticAdd={addOptimisticOrg}
      />
    );
  }

  if (showOnlyContent) {
    return (
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6"
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <AnimatePresence mode="popLayout">
          {optimisticOrgs.map((org) => {
            const orgId = org.SK.split('#')[1];
            return (
              <motion.div
                key={org.SK}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                className={org._isOptimistic ? 'opacity-70' : ''}
              >
                <OrgCard 
                  organization={org}
                  donations={initialDonationsMap[orgId] || []}
                  isOptimistic={org._isOptimistic}
                  userEmail={userEmail}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    );
  }

  return null;
}

export default withAuth(AdminDashboardClientBase);
