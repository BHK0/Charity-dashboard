'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import Chart from 'chart.js/auto';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';

export default function FarmersAnalyticsClient({ initialDonations }) {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return format(now, 'yyyy-MM');
  });
  const [isMobileView, setIsMobileView] = useState(false);
  const pieChartRef = useRef(null);
  const barChartRef = useRef(null);
  const pieChartInstance = useRef(null);
  const barChartInstance = useRef(null);

  // Define available months
  const availableMonths = useMemo(() => {
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push(format(date, 'yyyy-MM'));
    }
    return months;
  }, []);

  // Filter donations for selected month
  const monthDonations = useMemo(() => {
    return initialDonations.filter(d => {
      const donationDate = parseISO(d.createdAt);
      const start = startOfMonth(new Date(selectedMonth));
      const end = endOfMonth(new Date(selectedMonth));
      return donationDate >= start && donationDate <= end;
    });
  }, [initialDonations, selectedMonth]);

  // Calculate statistics
  const statistics = useMemo(() => ({
    totalQuantity: monthDonations.reduce((sum, d) => sum + d.quantity, 0),
    totalDonors: new Set(monthDonations.map(d => d.phoneNumber)).size,
    averageQuantity: monthDonations.length ? 
      Math.round(monthDonations.reduce((sum, d) => sum + d.quantity, 0) / monthDonations.length) : 0,
    byType: monthDonations.reduce((acc, d) => {
      acc[d.donationType] = (acc[d.donationType] || 0) + d.quantity;
      return acc;
    }, {}),
    // Group donations by day for the bar chart
    byDay: monthDonations.reduce((acc, d) => {
      const day = format(parseISO(d.createdAt), 'yyyy-MM-dd');
      acc[day] = (acc[day] || 0) + d.quantity;
      return acc;
    }, {})
  }), [monthDonations]);

  // Create/update charts
  useEffect(() => {
    const createCharts = () => {
      if (pieChartInstance.current) {
        pieChartInstance.current.destroy();
      }
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }

      const pieCtx = pieChartRef.current.getContext('2d');
      
      // Check if there's data for pie chart
      if (Object.keys(statistics.byType).length === 0) {
        pieChartInstance.current = new Chart(pieCtx, {
          type: 'pie',
          data: {
            labels: ['No Data'],
            datasets: [{
              data: [1],
              backgroundColor: ['#E5E7EB'],
            }]
          },
          options: {
            responsive: true,
            plugins: {
              legend: {
                display: false
              },
              title: {
                display: true,
                text: 'Donations Distribution by Type',
                font: {
                  size: isMobileView ? 14 : 16,
                  family: 'Arial'
                }
              }
            }
          }
        });
      } else {
        // Create pie chart with data
        const typeData = {
          labels: Object.keys(statistics.byType).map(type => {
            const quantity = statistics.byType[type];
            return `${type} (${quantity} kg)`;
          }),
          datasets: [{
            data: Object.values(statistics.byType),
            backgroundColor: [
              'rgba(153, 137, 102, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(255, 159, 64, 0.8)'
            ]
          }]
        };

        pieChartInstance.current = new Chart(pieCtx, {
          type: 'pie',
          data: typeData,
          options: {
            responsive: true,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  font: {
                    size: isMobileView ? 10 : 12,
                    family: 'Arial'
                  }
                }
              },
              title: {
                display: true,
                text: 'Donations Distribution by Type',
                font: {
                  size: isMobileView ? 14 : 16,
                  family: 'Arial'
                }
              }
            }
          }
        });
      }

      // Create line chart with padding days
      const lineCtx = barChartRef.current.getContext('2d');
      let days = Object.keys(statistics.byDay).sort();
      let quantities = days.map(day => statistics.byDay[day]);

      // Add padding days if less than 3 days of data
      if (days.length > 0 && days.length < 3) {
        const firstDate = new Date(days[0]);
        const lastDate = new Date(days[days.length - 1]);

        // Add day before
        const dayBefore = new Date(firstDate);
        dayBefore.setDate(dayBefore.getDate() - 1);
        days.unshift(format(dayBefore, 'yyyy-MM-dd'));
        quantities.unshift(0);

        // Add day after
        const dayAfter = new Date(lastDate);
        dayAfter.setDate(dayAfter.getDate() + 1);
        days.push(format(dayAfter, 'yyyy-MM-dd'));
        quantities.push(0);
      }

      barChartInstance.current = new Chart(lineCtx, {
        type: 'line',
        data: {
          labels: days.map(day => format(parseISO(day), 'MM/dd')),
          datasets: [{
            label: 'Quantity (kg)',
            data: quantities,
            borderColor: 'rgba(153, 137, 102, 1)',
            backgroundColor: 'rgba(153, 137, 102, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: {
              display: false
            },
            title: {
              display: true,
              text: 'Daily Quantities',
              font: {
                size: isMobileView ? 14 : 16,
                family: 'Arial'
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: value => `${value} kg`
              }
            }
          }
        }
      });
    };

    createCharts();
  }, [statistics.byType, statistics.byDay, isMobileView]);

  // Handle mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      {/* Month Selection and Statistics Cards */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Donation Statistics</h3>
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-[#998966] focus:border-[#998966]"
          >
            {availableMonths.map(month => (
              <option key={month} value={month}>
                {format(parseISO(`${month}-01`), 'MMMM yyyy')}
              </option>
            ))}
          </select>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-[#f8f7f8] p-4 rounded-lg">
            <h4 className="text-sm text-gray-600 mb-2">Total Quantity</h4>
            <p className="text-2xl font-bold text-[#998966]">
              {statistics.totalQuantity.toLocaleString()} kg
            </p>
          </div>
          <div className="bg-[#f8f7f8] p-4 rounded-lg">
            <h4 className="text-sm text-gray-600 mb-2">Total Donors</h4>
            <p className="text-2xl font-bold text-[#998966]">
              {statistics.totalDonors.toLocaleString()}
            </p>
          </div>
          <div className="bg-[#f8f7f8] p-4 rounded-lg">
            <h4 className="text-sm text-gray-600 mb-2">Average Quantity</h4>
            <p className="text-2xl font-bold text-[#998966]">
              {statistics.averageQuantity.toLocaleString()} kg
            </p>
          </div>
        </div>

        {/* Charts - Updated layout */}
        <div className={`grid ${isMobileView ? 'grid-cols-1' : 'grid-cols-2'} gap-8`}>
          <div className="h-[300px] relative">
            <canvas ref={pieChartRef}></canvas>
          </div>
          <div className={`${isMobileView ? 'h-[200px]' : 'h-[300px]'} relative`}>
            <canvas ref={barChartRef}></canvas>
          </div>
        </div>
      </div>

      {/* Recent Donations Table */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h4 className="text-lg font-semibold mb-4 text-gray-800">Recent Donations</h4>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Donor</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Type</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Quantity</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500">Date</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {monthDonations
                .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
                .slice(0, 100)
                .map(donation => (
                  <tr key={donation.SK} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-left text-sm">{donation.donorName}</td>
                    <td className="px-4 py-3 text-left text-sm">{donation.donationType}</td>
                    <td className="px-4 py-3 text-left text-sm">{donation.quantity} kg</td>
                    <td className="px-4 py-3 text-left text-sm">
                      {format(parseISO(donation.createdAt), 'MM/dd/yyyy')}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}