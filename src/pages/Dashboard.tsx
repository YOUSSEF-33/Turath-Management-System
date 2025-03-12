import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  PieChart, Pie, Cell, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { useApiGet } from '../utils/hooks';
import { Building, Settings, DollarSign, UserPlus } from 'lucide-react';

// Stat Card Component
const StatCard = ({ title, value, icon, color, change }: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode; 
  color: string;
  change?: { value: number; isPositive: boolean };
}) => (
  <div className="bg-white p-6 rounded-lg shadow-sm transition-all hover:shadow-md">
    <div className="flex justify-between items-start">
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
        <p className="text-2xl font-bold">{value}</p>
        {change && (
          <p className={`text-xs mt-2 ${change.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {change.isPositive ? '▲' : '▼'} {Math.abs(change.value)}% من الشهر الماضي
          </p>
        )}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

interface ChartData {
  unitsByType?: Array<{ name: string; count: number }>;
  statusData?: Array<{ name: string; value: number }>;
  revenueData?: Array<{ month: string; revenue: number }>;
}

// Dashboard Component
const Dashboard = () => {
  // Fetch summary data
  const { data: summaryData } = useApiGet('/dashboard/summary', {
    totalUnits: 0,
    availableUnits: 0,
    reservedUnits: 0,
    soldUnits: 0,
    totalProjects: 0,
    totalEmployees: 0,
    totalRevenue: 0,
    monthlyChange: {
      units: 3.5,
      revenue: 7.2,
      employees: -1.5,
      projects: 0
    }
  });

  // Fetch chart data
  const { data: chartData, loading: chartLoading } = useApiGet<ChartData>('/dashboard/charts', {}, {
    errorMessage: 'تعذر تحميل بيانات الرسوم البيانية'
  });

  // Fallback data for charts if API fails
  const [unitsByType, setUnitsByType] = useState([
    { name: 'فيلا', count: 12 },
    { name: 'دوبلكس', count: 24 },
    { name: 'شقة', count: 38 }
  ]);
  
  const [statusData, setStatusData] = useState([
    { name: 'متاح', value: 45 },
    { name: 'محجوز', value: 20 },
    { name: 'مباع', value: 35 }
  ]);
  
  const [revenueData, setRevenueData] = useState([
    { month: 'يناير', revenue: 120000 },
    { month: 'فبراير', revenue: 150000 },
    { month: 'مارس', revenue: 180000 },
    { month: 'أبريل', revenue: 220000 },
    { month: 'مايو', revenue: 200000 },
    { month: 'يونيو', revenue: 250000 }
  ]);

  // Process API data when it arrives
  useEffect(() => {
    if (chartData) {
      if (chartData.unitsByType) {
        setUnitsByType(chartData.unitsByType);
      }
      
      if (chartData.statusData) {
        setStatusData(chartData.statusData);
      }
      
      if (chartData.revenueData) {
        setRevenueData(chartData.revenueData);
      }
    }
  }, [chartData]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Fallback for summary data
  const summary = summaryData || {
    totalUnits: 0,
    availableUnits: 0,
    reservedUnits: 0,
    soldUnits: 0,
    totalProjects: 0,
    totalEmployees: 0,
    totalRevenue: 0,
    monthlyChange: {
      units: 0,
      revenue: 0,
      employees: 0,
      projects: 0
    }
  };

  return (
    <div className="p-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">لوحة التحكم</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
          title="إجمالي الوحدات" 
          value={summary.totalUnits} 
          icon={<Building className="h-6 w-6 text-white" />} 
          color="bg-blue-500"
          change={{ value: summary.monthlyChange.units, isPositive: summary.monthlyChange.units > 0 }}
        />
        <StatCard 
          title="المشاريع" 
          value={summary.totalProjects} 
          icon={<Settings className="h-6 w-6 text-white" />} 
          color="bg-purple-500"
          change={{ value: summary.monthlyChange.projects, isPositive: summary.monthlyChange.projects >= 0 }}
        />
        <StatCard 
          title="الإيرادات" 
          value={`${(summary.totalRevenue / 1000).toFixed(0)}K ريال`} 
          icon={<DollarSign className="h-6 w-6 text-white" />} 
          color="bg-green-500"
          change={{ value: summary.monthlyChange.revenue, isPositive: summary.monthlyChange.revenue > 0 }}
        />
        <StatCard 
          title="الموظفون" 
          value={summary.totalEmployees} 
          icon={<UserPlus className="h-6 w-6 text-white" />} 
          color="bg-orange-500"
          change={{ value: summary.monthlyChange.employees, isPositive: summary.monthlyChange.employees > 0 }}
        />
      </div>
      
      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Units by Type Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm animate-slide-in-left">
          <h2 className="text-lg font-semibold mb-4">توزيع أنواع الوحدات</h2>
          <div className="h-[300px] w-full">
            {chartLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <div className="loader"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={unitsByType}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value) => [`${value} وحدة`, 'العدد']}
                    labelStyle={{ color: '#333' }}
                  />
                  <Legend />
                  <Bar dataKey="count" fill="#8884d8" name="العدد" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        
        {/* Units Status Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm animate-slide-in-right">
          <h2 className="text-lg font-semibold mb-4">حالة الوحدات</h2>
          <div className="h-[300px] w-full">
            {chartLoading ? (
              <div className="h-full w-full flex items-center justify-center">
                <div className="loader"></div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [`${value} وحدة`, 'العدد']}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
      
      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8 animate-slide-in-up">
        <h2 className="text-lg font-semibold mb-4">الإيرادات الشهرية</h2>
        <div className="h-[300px] w-full">
          {chartLoading ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="loader"></div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" />
                <YAxis />
                <CartesianGrid strokeDasharray="3 3" />
                <Tooltip 
                  formatter={(value) => [`${value.toLocaleString()} ريال`, 'الإيرادات']} 
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#8884d8" 
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  name="الإيرادات"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;