/**
 * Aegis AI – Analytics Dashboard
 *
 * Real-time city-wide emergency statistics and hospital capacity heat maps.
 */

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, Activity, Truck, Building2, 
  TrendingUp, ChevronDown 
} from 'lucide-react';
import { analyticsAPI } from '@/api/client';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await analyticsAPI.getDashboard();
      setData(res.data.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="w-10 h-10 border-4 border-[var(--primary-500)] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Fallback mock data if backend doesn't return everything yet
  const stats = data || {
    total_emergencies: 142,
    active_emergencies: 24,
    total_hospitals: 15,
    available_ambulances: 8,
    icu_occupancy_rate: 76,
  };

  const trendData = [
    { day: 'Mon', value: 45 },
    { day: 'Tue', value: 52 },
    { day: 'Wed', value: 38 },
    { day: 'Thu', value: 65 },
    { day: 'Fri', value: 48 },
    { day: 'Sat', value: 70 },
    { day: 'Sun', value: 55 },
  ];
  
  const maxTrend = Math.max(...trendData.map(d => d.value));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--primary-500)]/10 text-[var(--primary-400)] shadow-[0_0_20px_rgba(59,130,246,0.15)]">
            <BarChart3 size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">City Analytics</h1>
            <p className="text-gray-400 text-sm mt-1">Real-time health infrastructure overview</p>
          </div>
        </div>
        
        <div className="glass-card px-4 py-2 flex items-center gap-2 cursor-pointer hover:bg-[var(--bg-hover)]">
          <span className="text-sm font-medium">Last 7 Days</span>
          <ChevronDown size={16} className="text-gray-400" />
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Emergencies', value: stats.active_emergencies, icon: <Activity size={24}/>, color: 'text-rose-400', bg: 'bg-rose-500/10' },
          { label: 'Total Hospitals', value: stats.total_hospitals, icon: <Building2 size={24}/>, color: 'text-blue-400', bg: 'bg-blue-500/10' },
          { label: 'Available Ambulances', value: stats.available_ambulances, icon: <Truck size={24}/>, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Avg. Response Time', value: '8.4m', icon: <TrendingUp size={24}/>, color: 'text-amber-400', bg: 'bg-amber-500/10' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-6 flex items-center gap-4"
          >
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 ${stat.bg} ${stat.color}`}>
              {stat.icon}
            </div>
            <div>
              <p className="text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
              <h3 className="text-3xl font-bold text-white">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Trend Chart */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-6 lg:col-span-2 flex flex-col"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-lg font-bold">Emergency Volume Trends</h2>
              <p className="text-sm text-gray-400 mt-1">Number of SOS requests per day</p>
            </div>
            <div className="flex gap-2">
              <span className="w-3 h-3 rounded-full bg-[var(--primary-500)] mt-1" />
              <span className="text-sm text-gray-300">Requests</span>
            </div>
          </div>
          
          <div className="flex-1 flex items-end gap-2 sm:gap-6 h-64 mt-auto">
            {trendData.map((d, i) => {
              const height = `${(d.value / maxTrend) * 100}%`;
              return (
                <div key={i} className="flex-1 flex flex-col items-center justify-end gap-3 group h-full">
                  <div className="w-full relative flex items-end h-full bg-[var(--bg-tertiary)] rounded-t-lg overflow-hidden border border-[var(--border-color)] border-b-0">
                    <motion.div 
                      initial={{ height: 0 }}
                      animate={{ height }}
                      transition={{ duration: 1, delay: i * 0.1, type: 'spring' }}
                      className="w-full bg-gradient-to-t from-[var(--primary-600)] to-[var(--primary-400)] rounded-t-md group-hover:brightness-125 transition-all"
                    />
                    {/* Tooltip */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-xs py-1 px-2 rounded font-bold z-10 pointer-events-none">
                      {d.value}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 font-medium uppercase">{d.day}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Capacity Overview */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6 flex flex-col"
        >
          <h2 className="text-lg font-bold mb-1">City ICU Capacity</h2>
          <p className="text-sm text-gray-400 mb-6">Real-time aggregate occupancy</p>

          <div className="flex-1 flex flex-col items-center justify-center relative min-h-[250px]">
            {/* Donut Chart Approximation with CSS */}
            <div className="w-48 h-48 rounded-full relative flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.1)]" style={{ background: `conic-gradient(var(--danger-500) ${stats.icu_occupancy_rate}%, var(--bg-tertiary) 0)` }}>
              <div className="w-36 h-36 rounded-full bg-[var(--bg-secondary)] flex flex-col items-center justify-center shadow-inner z-10">
                <span className="text-4xl font-bold text-white">{stats.icu_occupancy_rate}%</span>
                <span className="text-xs text-gray-400 font-medium mt-1 uppercase tracking-wider">Occupied</span>
              </div>
            </div>
            
            <div className="mt-8 w-full space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-300">
                  <span className="w-3 h-3 rounded-full bg-rose-500" /> Critical (&gt;90%)
                </span>
                <span className="font-bold">4 Hospitals</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-300">
                  <span className="w-3 h-3 rounded-full bg-amber-500" /> High (75-90%)
                </span>
                <span className="font-bold">6 Hospitals</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-gray-300">
                  <span className="w-3 h-3 rounded-full bg-emerald-500" /> Normal (&lt;75%)
                </span>
                <span className="font-bold">5 Hospitals</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

    </div>
  );
}
