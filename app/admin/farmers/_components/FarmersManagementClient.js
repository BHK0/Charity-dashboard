'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';
import { Grid, List, Download, X, Search } from 'lucide-react';

export default function FarmersManagementClient({ initialDonations }) {
  const [selectedType, setSelectedType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth < 768 ? 'grid' : 'table';
    }
    return 'grid';
  });
  const [selectedDonation, setSelectedDonation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const filteredDonations = useMemo(() => {
    return initialDonations.filter(donation => {
      const matchesType = selectedType === 'all' || donation.donationType === selectedType;
      const matchesSearch = 
        donation.donorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        donation.phoneNumber.includes(searchTerm);
      
      return matchesType && matchesSearch;
    });
  }, [initialDonations, selectedType, searchTerm]);

  const handleImageDownload = async (imageUrl) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading image:', error);
      alert('Error downloading image');
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lg p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-1 md:flex-none md:w-1/2 gap-4">
            {/* Search with count - 2/3 width */}
            <div className="relative flex-[2]">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 border border-gray-300 rounded-lg focus:ring-[#998966] focus:border-[#998966]"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-500 bg-white px-2">
                {filteredDonations.length} donations
              </span>
            </div>

            {/* Type Filter - 1/3 width */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="h-10 flex-1 px-4 border border-gray-300 rounded-lg focus:ring-[#998966] focus:border-[#998966]"
            >
              <option value="all">All Types</option>
              <option value="زكاة">Zakat</option>
              <option value="صدقة">Sadaqah</option>
              <option value="هبة">Gift</option>
            </select>
          </div>

          {/* View Toggle - Fixed width pill */}
          <div className="inline-flex bg-gray-100 h-10 p-1 rounded-lg items-center sm:ml-auto self-center">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-white text-[#998966] shadow-sm' 
                  : 'text-gray-500 hover:text-[#998966]'
              }`}
              title="Grid view"
            >
              <Grid size={20} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'table' 
                  ? 'bg-white text-[#998966] shadow-sm' 
                  : 'text-gray-500 hover:text-[#998966]'
              }`}
              title="Table view"
            >
              <List size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredDonations.map((donation) => (
            <motion.div
              key={donation.SK}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <div className="p-4 flex flex-col h-full">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">{donation.donorName}</h3>
                      <p className="text-sm text-gray-600">{donation.phoneNumber}</p>
                    </div>
                    <span className="px-3 py-1 bg-[#f8f7f8] text-[#998966] rounded-full text-sm">
                      {donation.donationType}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Quantity:</span>
                      <span className="font-medium text-right">{donation.quantity} kg</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium">
                        {format(parseISO(donation.createdAt), 'MM/dd/yyyy')}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedDonation(donation);
                    setIsModalOpen(true);
                  }}
                  className="mt-4 text-[#998966] hover:bg-[#f8f7f8] px-4 py-2 rounded-lg transition-colors w-full"
                >
                  View Details
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Donor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Phone</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Quantity</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDonations.map((donation) => (
                  <tr key={donation.SK} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{donation.donorName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{donation.phoneNumber}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-3 py-1 bg-[#f8f7f8] text-[#998966] rounded-full text-sm">
                        {donation.donationType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{donation.quantity} kg</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {format(parseISO(donation.createdAt), 'MM/dd/yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => {
                          setSelectedDonation(donation);
                          setIsModalOpen(true);
                        }}
                        className="text-[#998966] hover:text-gray-700"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details Modal */}
      <AnimatePresence>
        {isModalOpen && selectedDonation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              className="bg-white rounded-lg w-full max-w-2xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-semibold">Donation Details</h3>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedImage(null);
                    }}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* Donation Details */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-sm text-gray-600">Donor Name</label>
                    <p className="font-medium">{selectedDonation.donorName}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Phone Number</label>
                    <p className="font-medium">{selectedDonation.phoneNumber}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Donation Type</label>
                    <p className="font-medium">{selectedDonation.donationType}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Quantity</label>
                    <p className="font-medium">{selectedDonation.quantity} kg</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-600">Date</label>
                    <p className="font-medium">
                      {format(parseISO(selectedDonation.createdAt), 'MM/dd/yyyy')}
                    </p>
                  </div>
                </div>

                {/* Image Gallery */}
                {selectedDonation.images?.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold mb-4">Images</h4>
                    <div className="grid grid-cols-3 gap-4">
                      {selectedDonation.images.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="relative h-24 rounded-lg overflow-hidden">
                            <Image
                              src={image}
                              alt={`Image ${index + 1}`}
                              fill
                              className="object-cover cursor-pointer transition-transform group-hover:scale-105"
                              onClick={() => setSelectedImage(image)}
                            />
                          </div>
                          <button
                            onClick={() => handleImageDownload(image)}
                            className="absolute top-1 right-1 p-1 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Download Image"
                          >
                            <Download size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Image Modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedImage(null)}
          >
            <div className="relative max-w-4xl max-h-[90vh] w-full h-full">
              <Image
                src={selectedImage}
                alt="Full size image"
                fill
                className="object-contain"
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleImageDownload(selectedImage);
                }}
                className="absolute top-4 right-4 p-2 bg-white rounded-full text-gray-800 hover:bg-gray-100"
                title="Download Image"
              >
                <Download size={20} />
              </button>
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-4 left-4 p-2 bg-white rounded-full text-gray-800 hover:bg-gray-100"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}