"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

// --- Interfaces ---
type TimeRange = 'daily' | 'weekly' | 'monthly';

interface DashboardData {
  totalUsers: number;
  activeUsers: number; 
  totalMealsLogged: number;
  chartData?: Array<{ // Made optional so frontend doesn't break if backend is missing it
    date: string;
    users: number;
    meals: number;
  }>;
  recentLogs: Array<{
    _id: string;
    action: string;
    createdAt: string;
    userId: string;
    userName?: string; 
  }>;
}

// --- Helpers & Mock Data for Templates ---
const formatDate = (dateString: string) => {
  if (!dateString) return "Invalid Date";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";
  
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  }).format(date);
};

// Fallback data to show the beautiful chart template even if the API isn't sending chartData yet
const mockChartTemplates = {
  daily: [
    { date: '6 AM', users: 12, meals: 5 }, { date: '9 AM', users: 45, meals: 80 },
    { date: '12 PM', users: 85, meals: 150 }, { date: '3 PM', users: 65, meals: 45 },
    { date: '6 PM', users: 95, meals: 180 }, { date: '9 PM', users: 30, meals: 20 },
  ],
  weekly: [
    { date: 'Mon', users: 120, meals: 340 }, { date: 'Tue', users: 132, meals: 380 },
    { date: 'Wed', users: 101, meals: 310 }, { date: 'Thu', users: 145, meals: 420 },
    { date: 'Fri', users: 160, meals: 450 }, { date: 'Sat', users: 210, meals: 550 },
    { date: 'Sun', users: 190, meals: 490 },
  ],
  monthly: [
    { date: 'Week 1', users: 450, meals: 1200 }, { date: 'Week 2', users: 520, meals: 1450 },
    { date: 'Week 3', users: 480, meals: 1300 }, { date: 'Week 4', users: 610, meals: 1750 },
  ]
};

// Custom Tooltip for Recharts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-xl border border-slate-100 dark:border-slate-700">
        <p className="font-bold text-slate-800 dark:text-white mb-3 pb-2 border-b border-slate-100 dark:border-slate-700">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-6 mt-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: entry.color }}></span>
              <span className="text-slate-500 dark:text-slate-400 font-medium">{entry.name}</span>
            </div>
            <span className="font-bold text-slate-800 dark:text-white">{entry.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const StatusBadge = ({ action }: { action: string }) => {
  const isGreen = action.includes('SESSION_CREATED') || action.includes('SIGNUP');
  const isRed = action.includes('DELETE') || action.includes('ERROR');
  const isBlue = action.includes('PROFILE_UPDATE') || action.includes('LOGIN');

  let colorClasses = 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300';
  
  if (isGreen) {
    colorClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/50';
  } else if (isBlue) {
    colorClasses = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/50';
  } else if (isRed) {
    colorClasses = 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50';
  }

  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] sm:text-[11px] font-bold tracking-wider border ${colorClasses}`}>
      {action}
    </span>
  );
};

// --- Main Component ---
export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeRange, setTimeRange] = useState<TimeRange>('daily');

  const fetchDashboardData = async (range: TimeRange) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) { router.push('/login'); return; }

      const response = await fetch(`/api/admin/dashboard?range=${range}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        setError(response.status === 401 || response.status === 403
          ? 'You do not have admin access.'
          : 'Failed to load dashboard data.');
        return;
      }

      const dashboardStats = await response.json();
      setData(dashboardStats);
      setError('');
    } catch {
      setError('An error occurred while fetching data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(timeRange);
  }, [router, timeRange]);

  // Determine chart data: Use real API data if available, otherwise use beautiful mock template
  const activeChartData = (data?.chartData && data.chartData.length > 0) 
    ? data.chartData 
    : mockChartTemplates[timeRange];

  // --- Loading State ---
  if (loading && !data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 p-8 font-sans">
        <div className="max-w-7xl mx-auto space-y-8 animate-pulse">
          <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700"></div>
            ))}
          </div>
          <div className="h-96 bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700"></div>
        </div>
      </div>
    );
  }

  // --- Error State ---
  if (error) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-red-100 dark:border-red-900/30 max-w-md w-full text-center">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Access Denied</h2>
          <p className="text-gray-500 dark:text-slate-400 mb-6">{error}</p>
          <button onClick={() => router.push('/login')} className="w-full py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-medium hover:bg-gray-800 transition-colors">
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-slate-900 p-4 md:p-8 font-sans text-gray-900 dark:text-gray-100">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* --- Header & Filters --- */}
        <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Admin Dashboard</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Overview of Smart Nutrition performance.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Time Range Filter Pill */}
            <div className="flex p-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm w-full sm:w-auto">
              {['daily', 'weekly', 'monthly'].map((range) => (
                <button
                  key={range}
                  onClick={() => setTimeRange(range as TimeRange)}
                  className={`flex-1 sm:flex-none px-5 py-2 text-sm font-semibold rounded-lg capitalize transition-all duration-200 ${
                    timeRange === range 
                      ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 shadow-sm' 
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                  }`}
                >
                  {range}
                </button>
              ))}
            </div>

            <button onClick={() => fetchDashboardData(timeRange)} className="w-full sm:w-auto px-4 py-2.5 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Refresh
            </button>
          </div>
        </header>

        {/* --- Top Stat Cards --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 transition-transform hover:-translate-y-1 duration-200">
            <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Total Users</h3>
            <p className="text-4xl font-extrabold text-slate-800 dark:text-white">{data?.totalUsers || 0}</p>
          </div>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 transition-transform hover:-translate-y-1 duration-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
               <svg className="w-16 h-16 text-indigo-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" /></svg>
            </div>
            <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1 relative z-10">Active Users</h3>
            <div className="flex items-center gap-3 relative z-10">
              <p className="text-4xl font-extrabold text-indigo-600 dark:text-indigo-400">{data?.activeUsers || 0}</p>
              <span className="flex items-center text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-800/50">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1.5 animate-pulse"></span>
                Online
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 transition-transform hover:-translate-y-1 duration-200">
            <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Meals Logged</h3>
            <p className="text-4xl font-extrabold text-emerald-600 dark:text-emerald-400">{data?.totalMealsLogged || 0}</p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60 flex flex-col justify-center">
             <h3 className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">System Status</h3>
             <div className="flex items-center gap-3 mt-1">
               <div className="relative flex h-5 w-5 items-center justify-center">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
               </div>
               <p className="text-2xl font-bold text-slate-800 dark:text-white">System Online</p>
             </div>
          </div>
        </div>

        {/* --- Bar Chart Section --- */}
        <div className="bg-white dark:bg-slate-800 p-6 sm:p-8 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">Activity Overview <span className="text-slate-400 dark:text-slate-500 font-medium text-sm ml-2 capitalize">({timeRange})</span></h2>
            {(!data?.chartData || data.chartData.length === 0) && (
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1 rounded-full dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800">Preview Data</span>
            )}
          </div>
          
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" opacity={0.4} />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 13, fill: '#64748B', fontWeight: 500 }} 
                  dy={15} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 13, fill: '#64748B', fontWeight: 500 }} 
                  dx={-10}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148, 163, 184, 0.05)' }} />
                <Legend 
                  iconType="circle" 
                  wrapperStyle={{ paddingTop: '20px', fontSize: '14px', fontWeight: 500, color: '#64748B' }} 
                />
                <Bar dataKey="users" name="Active Users" fill="#4F46E5" radius={[6, 6, 0, 0]} maxBarSize={45} animationDuration={1500} />
                <Bar dataKey="meals" name="Meals Logged" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={45} animationDuration={1500} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- Recent Activity Table --- */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">Recent Logs</h2>
            <button className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 font-semibold transition-colors">View All Activity &rarr;</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead>
                <tr className="bg-white dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest w-1/4">Action</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest w-1/4">User Name</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest w-1/4">User ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Date & Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
                {data?.recentLogs && data.recentLogs.length > 0 ? (
                  data.recentLogs.map((log) => (
                    <tr key={log._id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group">
                      <td className="px-6 py-4">
                        <StatusBadge action={log.action} />
                      </td>
                      <td className="px-6 py-4 text-sm font-semibold text-slate-800 dark:text-slate-200">
                        {log.userName || 'Unknown User'}
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400 transition-colors">
                        {log.userId}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
                        {formatDate(log.createdAt)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500">
                        <svg className="w-12 h-12 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <p className="text-base font-medium">No recent activity found.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
      </div>
    </div>
  );
}