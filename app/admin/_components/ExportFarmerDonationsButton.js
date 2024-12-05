'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiDownload, FiX } from 'react-icons/fi';
import { exportFarmerDonations } from '@/app/actions/dateDonations';
import { toast } from 'react-hot-toast';

export default function ExportFarmerDonationsButton() {
  const [showModal, setShowModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('excel');
  const [isAllTime, setIsAllTime] = useState(true);

  // Get default date range (first and last day of previous month)
  const getDefaultDateRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth(), 0);
    
    // Add one day to both dates
    firstDay.setDate(firstDay.getDate() + 1);
    lastDay.setDate(lastDay.getDate() + 1);
    
    return {
      startDate: firstDay.toISOString().split('T')[0],
      endDate: lastDay.toISOString().split('T')[0]
    };
  };

  const [dateRange, setDateRange] = useState(getDefaultDateRange());

  // Reset form when modal closes
  useEffect(() => {
    if (!showModal) {
      setDateRange(getDefaultDateRange());
      setExportFormat('excel');
      setIsAllTime(true);
    }
  }, [showModal]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      
      let startDate = null;
      let endDate = null;

      if (!isAllTime) {
        startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
        endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

        if (startDate && endDate && startDate > endDate) {
          toast.error('Start date must be before end date');
          return;
        }
      }

      const result = await exportFarmerDonations(startDate, endDate, exportFormat);

      // Create and trigger download
      const blob = exportFormat === 'excel' 
        ? new Blob([new Uint8Array(result.data)], { 
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
          })
        : new Blob([result.data], { 
            type: 'text/csv;charset=utf-8;' 
          });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `farmer-donations-${new Date().toISOString().split('T')[0]}.${
        exportFormat === 'excel' ? 'xlsx' : 'csv'
      }`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setShowModal(false);
      toast.success('Donations exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Error exporting donations');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setShowModal(true)}
        className="flex items-center gap-2 bg-[#998966] text-white px-4 py-2 rounded-lg hover:opacity-90"
      >
        <FiDownload className="w-4 h-4" />
        <span>Export Donations</span>
      </motion.button>

      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black bg-opacity-50"
              onClick={() => setShowModal(false)}
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-5 h-5" />
              </button>

              <h3 className="text-xl font-semibold mb-4">Export Donations</h3>

              <div className="space-y-4">
                {/* Time Range Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Export Range</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setIsAllTime(true)}
                      className={`p-2 rounded-lg border-2 transition-colors ${
                        isAllTime
                          ? 'border-[#998966] bg-[#998966] text-white'
                          : 'border-gray-200 hover:border-[#998966]'
                      }`}
                    >
                      All Donations
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAllTime(false)}
                      className={`p-2 rounded-lg border-2 transition-colors ${
                        !isAllTime
                          ? 'border-[#998966] bg-[#998966] text-white'
                          : 'border-gray-200 hover:border-[#998966]'
                      }`}
                    >
                      Custom Period
                    </button>
                  </div>
                </div>

                {/* Date Range - Only show if not "All Time" */}
                <AnimatePresence>
                  {!isAllTime && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">From</label>
                          <input
                            type="date"
                            value={dateRange.startDate}
                            onChange={e => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                            className="w-full p-2 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">To</label>
                          <input
                            type="date"
                            value={dateRange.endDate}
                            onChange={e => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                            className="w-full p-2 border rounded-lg"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Export Format */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Export Format</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['excel', 'csv'].map((format) => (
                      <button
                        key={format}
                        type="button"
                        onClick={() => setExportFormat(format)}
                        className={`p-2 rounded-lg border-2 transition-colors ${
                          exportFormat === format
                            ? 'border-[#998966] bg-[#998966] text-white'
                            : 'border-gray-200 hover:border-[#998966]'
                        }`}
                      >
                        {format.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleExport}
                  disabled={isExporting}
                  className={`w-full py-2 rounded-lg bg-[#998966] text-white transition-opacity ${
                    isExporting ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'
                  }`}
                >
                  {isExporting ? 'Exporting...' : 'Export'}
                </motion.button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}