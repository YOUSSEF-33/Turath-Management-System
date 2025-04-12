import { useState } from 'react';
import { Building, Settings, DollarSign, UserPlus } from 'lucide-react';
import { Chart as ChartJS, registerables } from 'chart.js';
import { Bar, Pie, Line } from 'react-chartjs-2';
import 'chartjs-plugin-datalabels';

// Register Chart.js components
ChartJS.register(...registerables);

// Stat Card Component
const StatCard = ({ title, value, icon, color, change }: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: string;
  change?: { value: number; isPositive: boolean };
}) => (
  <div className={`bg-white p-4 md:p-6 rounded-lg shadow-sm transition-all hover:shadow-md border-l-4 ${color} border-opacity-50`}>
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-xs md:text-sm font-medium text-gray-500 mb-1">{title}</h3>
        <p className="text-xl md:text-2xl font-bold text-gray-800">{value}</p>
        {change && (
          <p className={`text-xs mt-1 md:mt-2 flex items-center ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {change.isPositive ? (
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12 7a1 1 0 01-1 1H9v1h2a1 1 0 110 2H9v1h2a1 1 0 110 2H9v1a1 1 0 11-2 0v-1H5a1 1 0 110-2h2v-1H5a1 1 0 110-2h2V8H5a1 1 0 010-2h2V5a1 1 0 112 0v1h2a1 1 0 011 1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {Math.abs(change.value)}% من الشهر الماضي
          </p>
        )}
      </div>
      <div className={`p-2 md:p-3 rounded-lg ${color} bg-opacity-10 text-${color.replace('bg-', '')}`}>
        {icon}
      </div>
    </div>
  </div>
);

// Dashboard Component
const Dashboard = () => {
  // Data for summary cards
  const summary = {
    totalUnits: 74,
    totalProjects: 5,
    totalEmployees: 120,
    totalRevenue: 1200000,
    monthlyChange: {
      units: 3.5,
      revenue: 7.2,
      employees: -1.5,
      projects: 0
    }
  };

  // Chart data configuration
  const [chartData] = useState({
    unitsByType: {
      labels: ['فيلا', 'دوبلكس', 'شقة'],
      datasets: [{
        label: 'عدد الوحدات',
        data: [12, 24, 38],
        backgroundColor: [
          'rgba(99, 102, 241, 0.8)',
          'rgba(139, 92, 246, 0.8)',
          'rgba(236, 72, 153, 0.8)'
        ],
        borderColor: [
          'rgba(99, 102, 241, 1)',
          'rgba(139, 92, 246, 1)',
          'rgba(236, 72, 153, 1)'
        ],
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    unitsStatus: {
      labels: ['متاح', 'محجوز', 'مباع'],
      datasets: [{
        data: [45, 20, 35],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(245, 158, 11, 1)',
          'rgba(239, 68, 68, 1)'
        ],
        borderWidth: 1
      }]
    },
    revenueTrend: {
      labels: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو'],
      datasets: [{
        label: 'الإيرادات',
        data: [120000, 150000, 180000, 220000, 200000, 250000],
        fill: true,
        backgroundColor: 'rgba(99, 102, 241, 0.1)',
        borderColor: 'rgba(99, 102, 241, 1)',
        tension: 0.4,
        borderWidth: 2
      }]
    }
  });

  // Common chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        rtl: true,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            family: 'Tajawal, sans-serif'
          }
        }
      },
      tooltip: {
        rtl: true,
        bodyFont: {
          family: 'Tajawal, sans-serif'
        },
        callbacks: {
          label: (context: any) => {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== undefined) {
              label += context.parsed.y.toLocaleString('ar-EG');
            } else if (context.raw !== undefined) {
              label += context.raw.toLocaleString('ar-EG');
            }
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: {
          font: {
            family: 'Tajawal, sans-serif'
          }
        }
      },
      y: {
        ticks: {
          font: {
            family: 'Tajawal, sans-serif'
          },
          callback: (value: any) => value.toLocaleString('ar-EG')
        }
      }
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-gray-50 min-h-screen">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6"></h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard 
          title="إجمالي الوحدات" 
          value={summary.totalUnits} 
          icon={<Building className="h-5 w-5" />} 
          color="border-indigo-500 text-indigo-500"
          change={{ value: summary.monthlyChange.units, isPositive: summary.monthlyChange.units > 0 }}
        />
        <StatCard 
          title="المشاريع" 
          value={summary.totalProjects} 
          icon={<Settings className="h-5 w-5" />} 
          color="border-purple-500 text-purple-500"
          change={{ value: summary.monthlyChange.projects, isPositive: summary.monthlyChange.projects >= 0 }}
        />
        <StatCard 
          title="الإيرادات" 
          value={`${(summary.totalRevenue / 1000).toLocaleString('ar-EG')} ألف ريال`} 
          icon={<DollarSign className="h-5 w-5" />} 
          color="border-emerald-500 text-emerald-500"
          change={{ value: summary.monthlyChange.revenue, isPositive: summary.monthlyChange.revenue > 0 }}
        />
        <StatCard 
          title="الموظفون" 
          value={summary.totalEmployees} 
          icon={<UserPlus className="h-5 w-5" />} 
          color="border-amber-500 text-amber-500"
          change={{ value: summary.monthlyChange.employees, isPositive: summary.monthlyChange.employees > 0 }}
        />
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Units by Type Chart */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">توزيع أنواع الوحدات</h2>
          <div className="h-[300px]">
            <Bar 
              data={chartData.unitsByType}
              options={{
                ...chartOptions,
                indexAxis: 'x',
                plugins: {
                  ...chartOptions.plugins,
                  datalabels: {
                    display: false
                  }
                }
              }}
            />
          </div>
        </div>
        
        {/* Units Status Chart */}
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">حالة الوحدات</h2>
          <div className="h-[300px]">
            <Pie 
              data={chartData.unitsStatus}
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  datalabels: {
                    display: true,
                    formatter: (value: any) => `${value} وحدة`,
                    font: {
                      family: 'Tajawal, sans-serif',
                      weight: 'bold'
                    },
                    color: '#fff'
                  }
                }
              }}
            />
          </div>
        </div>
      </div>
      
      {/* Revenue Trend Chart */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">الإيرادات الشهرية</h2>
        <div className="h-[300px]">
          <Line 
            data={chartData.revenueTrend}
            options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                datalabels: {
                  display: false
                }
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;