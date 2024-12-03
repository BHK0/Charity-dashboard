'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { getAllDonations } from '@/app/actions/donations';
import Chart from 'chart.js/auto';
import { formatDistanceToNow, format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { enUS } from 'date-fns/locale';
import debounce from 'lodash/debounce';
import { motion } from 'framer-motion';

export default function AnalyticsClient({ initialOrganizations, initialDonations, initialMonth }) {
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [isLoading, setIsLoading] = useState(false);
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [donationCache, setDonationCache] = useState({
    [initialMonth]: initialDonations
  });

  // Define available months statically (last 12 months)
  const availableMonths = useMemo(() => {
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push(format(date, 'yyyy-MM'));
    }
    return months;
  }, []);

  // Filter donations for selected month with memoization
  const monthDonations = useMemo(() => {
    return donationCache[selectedMonth] ? donationCache[selectedMonth].filter(d => {
      const donationDate = parseISO(d.createdAt);
      const start = startOfMonth(new Date(selectedMonth));
      const end = endOfMonth(new Date(selectedMonth));
      return donationDate >= start && donationDate <= end;
    }) : [];
  }, [donationCache, selectedMonth]);

  // Calculate statistics with memoization
  const statistics = useMemo(() => ({
    totalAmount: monthDonations.reduce((sum, d) => sum + d.amount, 0),
    totalCount: monthDonations.length,
    averageAmount: monthDonations.length ? 
      Math.round(monthDonations.reduce((sum, d) => sum + d.amount, 0) / monthDonations.length) : 0,
    uniqueDonors: new Set(monthDonations.map(d => d.phoneNumber)).size,
    peakDay: monthDonations.length ? format(
      parseISO(monthDonations.reduce((max, d) => 
        max.amount > d.amount ? max : d
      ).createdAt),
      'MM/dd/yyyy',
      { locale: enUS }
    ) : '-'
  }), [monthDonations]);

  // Calculate organization rankings with memoization
  const orgRankings = useMemo(() => {
    return Object.entries(monthDonations.reduce((acc, donation) => {
      const orgId = donation.PK.split('#')[1];
      if (!acc[orgId]) {
        acc[orgId] = { amount: 0, count: 0 };
      }
      acc[orgId].amount += donation.amount;
      acc[orgId].count += 1;
      return acc;
    }, {}))
    .map(([orgId, stats]) => ({
      orgId,
      name: initialOrganizations.find(org => org.SK.split('#')[1] === orgId)?.name || 'Unknown',
      ...stats
    }))
    .sort((a, b) => b.amount - a.amount);
  }, [monthDonations, initialOrganizations]);

  // Fetch donations with error handling and loading state
  const fetchDonations = async () => {
    if (donationCache[selectedMonth]) {
      createOrUpdateChart(donationCache[selectedMonth]);
      return;
    }

    try {
      setIsLoading(true);
      const [year, monthNum] = selectedMonth.split('-').map(Number);
      const start = new Date(year, monthNum - 1, 1);
      const end = new Date(year, monthNum, 0);
      const donations = await getAllDonations(start, end);
      
      setDonationCache(prev => ({
        ...prev,
        [selectedMonth]: donations
      }));
      
      createOrUpdateChart(donations);
    } catch (error) {
      console.error('Error fetching donations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to fetch data when selectedMonth changes
  useEffect(() => {
    if (donationCache[selectedMonth]) {
      createOrUpdateChart(donationCache[selectedMonth]);
    } else {
      fetchDonations();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  // Add isMobileView to dependencies
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Memoize the chart creation/update function
  const createOrUpdateChart = useRef((allDonations) => {
    // Process data for chart
    const orgDonations = {};
    initialOrganizations.forEach(org => {
      const orgId = org.SK.split('#')[1];
      orgDonations[orgId] = {
        name: org.name,
        data: {}
      };
    });

    // Find the date range from actual donations
    let minDate = new Date();
    let maxDate = new Date(0);
    
    allDonations.forEach(donation => {
      const date = new Date(donation.createdAt);
      if (date < minDate) minDate = date;
      if (date > maxDate) maxDate = date;
    });

    // Only add padding days if we have less than 5 days of data
    const daySpan = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
    if (daySpan < 5) {
      minDate.setDate(minDate.getDate() - 2);
      maxDate.setDate(maxDate.getDate() + 3);
    }

    // Calculate ideal number of points for the date range
    const getIdealPoints = () => {
      if (!isMobileView) return daySpan;
      return 5;
    };

    // Create evenly spaced dates
    const createEvenlySpacedDates = () => {
      const numberOfPoints = getIdealPoints();
      const step = Math.max(1, Math.floor(daySpan / (numberOfPoints - 1)));
      const dates = [];
      
      dates.push(format(minDate, 'yyyy-MM-dd', { locale: enUS }));

      for (let i = step; i < daySpan; i += step) {
        const date = new Date(minDate);
        date.setDate(minDate.getDate() + i);
        if (date < maxDate) {
          dates.push(format(date, 'yyyy-MM-dd', { locale: enUS }));
        }
      }
      
      dates.push(format(maxDate, 'yyyy-MM-dd', { locale: enUS }));

      return dates;
    };

    const dates = createEvenlySpacedDates();

    // Modify the aggregateDailyData function
    const aggregateDailyData = (data) => {
      const aggregated = {};
      const sortedDates = Object.keys(data).sort();
      
      if (sortedDates.length === 0) return aggregated;

      dates.forEach((targetDate, index) => {
        const targetDateObj = parseISO(targetDate);
        let sum = 0;
        
        const nextTargetDate = index < dates.length - 1 ? 
          parseISO(dates[index + 1]) : 
          new Date(maxDate.getTime() + 86400000);
        
        Object.entries(data).forEach(([dateStr, value]) => {
          const date = parseISO(dateStr);
          if (date >= targetDateObj && date < nextTargetDate) {
            sum += value;
          }
        });
        
        aggregated[targetDate] = sum;
      });

      return aggregated;
    };

    const datesFormatted = dates.map(dateStr => format(parseISO(dateStr), 'yyyy-MM-dd', { locale: enUS }));
    const chartDates = dates.map(dateStr => 
      format(parseISO(dateStr), 'MM/dd', { locale: enUS })
    );

    // Group donations by organization and date
    allDonations.forEach(donation => {
      const date = format(parseISO(donation.createdAt), 'yyyy-MM-dd', { locale: enUS });
      const orgId = donation.PK.split('#')[1];
      if (orgDonations[orgId]) {
        if (!orgDonations[orgId].data[date]) {
          orgDonations[orgId].data[date] = 0;
        }
        orgDonations[orgId].data[date] += donation.amount;
      }
    });

    const config = {
      type: 'line',
      data: {
        labels: chartDates,
        datasets: Object.entries(orgDonations).map(([orgId, orgData], index) => {
          const aggregatedData = isMobileView ? 
            aggregateDailyData(orgData.data) : 
            orgData.data;

          return {
            label: orgData.name,
            data: datesFormatted.map(date => aggregatedData[date] || 0),
            borderColor: `hsl(${(index * 360) / Object.keys(orgDonations).length}, 70%, 50%)`,
            backgroundColor: `hsla(${(index * 360) / Object.keys(orgDonations).length}, 70%, 50%, 0.1)`,
            tension: isMobileView ? 0.3 : 0.4,
            fill: true,
            pointRadius: isMobileView ? 3 : 4,
            borderWidth: isMobileView ? 2 : 3,
            spanGaps: true,
            pointHoverRadius: isMobileView ? 4 : 6,
            showLine: true,
            pointStyle: isMobileView ? 'circle' : 'circle',
          };
        })
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 1000,
          easing: 'easeOutQuart',
        },
        plugins: {
          legend: {
            position: isMobileView ? 'bottom' : 'top',
            rtl: false,
            labels: {
              boxWidth: isMobileView ? 12 : 20,
              padding: isMobileView ? 8 : 15,
              font: {
                size: isMobileView ? 8 : 12,
                family: 'Arial'
              },
              generateLabels: (chart) => {
                const originalLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
                return originalLabels.map(label => ({
                  ...label,
                  text: isMobileView ? 
                    label.text.substring(0, 12) + (label.text.length > 12 ? '...' : '') :
                    label.text,
                  fillStyle: label.strokeStyle,
                  lineWidth: 0,
                  strokeStyle: label.strokeStyle,
                }));
              },
            },
            maxHeight: isMobileView ? 50 : 200,
          },
          title: {
            display: true,
            font: {
              size: isMobileView ? 14 : 16,
              family: 'Arial'
            },
            padding: {
              top: 10,
              bottom: 10
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              font: {
                size: isMobileView ? 8 : 12
              },
              callback: function(value) {
                if (isMobileView) {
                  if (value >= 1000000) {
                    return (value / 1000000).toFixed(1) + 'M';
                  }
                  if (value >= 1000) {
                    return (value / 1000).toFixed(0) + 'K';
                  }
                }
                return value.toLocaleString('en-US');
              },
              maxTicksLimit: isMobileView ? 4 : 8
            },
            grid: {
              display: !isMobileView,
              drawBorder: true,
              color: 'rgba(0, 0, 0, 0.1)',
              lineWidth: 0.5
            }
          },
          x: {
            ticks: {
              maxRotation: isMobileView ? 0 : 45,
              minRotation: isMobileView ? 0 : 45,
              font: {
                size: isMobileView ? 8 : 12
              },
            },
            grid: {
              display: !isMobileView
            }
          }
        },
        layout: {
          padding: {
            top: isMobileView ? 5 : 10,
            right: isMobileView ? 2 : 10,
            bottom: isMobileView ? 5 : 20,
            left: isMobileView ? 2 : 10
          }
        },
        elements: {
          point: {
            radius: isMobileView ? 3 : 3,
            hoverRadius: isMobileView ? 4 : 6,
            borderWidth: isMobileView ? 1 : 2,
          },
          line: {
            tension: isMobileView ? 0.4 : 0.4,
            borderWidth: isMobileView ? 1.5 : 3,
          }
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
      }
    };

    if (chartInstance.current) {
      chartInstance.current.data = config.data;
      chartInstance.current.options.animation = config.options.animation;
      chartInstance.current.update();
    } else {
      chartInstance.current = new Chart(chartRef.current, config);
    }
  }).current;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Month Selection */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Donation Statistics</h3>
          <div className="flex items-center gap-4">
            <button
              onClick={fetchDonations}
              className="text-[#998966] hover:text-gray-700 transition-colors"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="inline-block animate-spin">⟳</span>
              ) : (
                <span>⟳</span>
              )}
            </button>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#998966] focus:border-[#998966]"
            >
              {availableMonths.map(month => (
                <option key={month} value={month}>
                  {format(parseISO(`${month}-01`), 'MMMM yyyy', { locale: enUS })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Statistics Cards */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="bg-[#f8f7f8] p-4 rounded-lg animate-pulse">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-6 bg-gray-300 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#f8f7f8] p-4 rounded-lg">
              <h4 className="text-sm text-gray-600 mb-2">Total Donations</h4>
              <p className="text-2xl font-bold text-[#998966]">
                ${statistics.totalAmount.toLocaleString('en-US')}
              </p>
            </div>
            <div className="bg-[#f8f7f8] p-4 rounded-lg">
              <h4 className="text-sm text-gray-600 mb-2">Number of Donations</h4>
              <p className="text-2xl font-bold text-[#998966]">
                {statistics.totalCount.toLocaleString('en-US')}
              </p>
            </div>
            <div className="bg-[#f8f7f8] p-4 rounded-lg">
              <h4 className="text-sm text-gray-600 mb-2">Average Donation</h4>
              <p className="text-2xl font-bold text-[#998966]">
                ${statistics.averageAmount.toLocaleString('en-US')}
              </p>
            </div>
            <div className="bg-[#f8f7f8] p-4 rounded-lg">
              <h4 className="text-sm text-gray-600 mb-2">Unique Donors</h4>
              <p className="text-2xl font-bold text-[#998966]">
                {statistics.uniqueDonors.toLocaleString('en-US')}
              </p>
            </div>
          </div>
        )}

        {/* Chart - Increased height */}
        <div className={`${isMobileView ? 'h-[300px]' : 'h-[350px]'} relative`}>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
              <span className="text-gray-500">Loading chart...</span>
            </div>
          )}
          <canvas ref={chartRef}></canvas>
        </div>
      </div>

      {/* Organization Rankings */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h4 className="text-lg font-semibold mb-4 text-gray-800">Organization Rankings</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Rank</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Organization</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Total Donations</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Number of Donations</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Average Donation</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orgRankings.map((org, index) => (
                <tr key={org.orgId} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-left text-sm">{index + 1}</td>
                  <td className="px-4 py-3 text-left text-sm font-medium">{org.name}</td>
                  <td className="px-4 py-3 text-left text-sm">
                    ${org.amount.toLocaleString('en-US')}
                  </td>
                  <td className="px-4 py-3 text-left text-sm">
                    {org.count.toLocaleString('en-US')}
                  </td>
                  <td className="px-4 py-3 text-left text-sm">
                    ${Math.round(org.amount / org.count).toLocaleString('en-US')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Donations Log */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h4 className="text-lg font-semibold text-gray-800">Donations Log</h4>
          {isLoading && (
            <span className="text-sm text-gray-500">Updating...</span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Organization</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Phone Number</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthDonations
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 50)
                .map(donation => {
                  const orgId = donation.PK.split('#')[1];
                  const org = initialOrganizations.find(o => o.SK.split('#')[1] === orgId);
                  return (
                    <tr key={donation.SK} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-left text-sm">
                        <span className="truncate max-w-[200px] inline-block">
                          {org?.name || 'Unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-left text-sm">
                        {donation.phoneNumber}
                      </td>
                      <td className="px-4 py-3 text-left text-sm">
                        ${donation.amount.toLocaleString('en-US')}
                      </td>
                      <td className="px-4 py-3 text-left text-sm">
                        {format(parseISO(donation.createdAt), 'MM/dd/yyyy HH:mm', { locale: enUS })}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}