/**
 * Aegis AI – Dashboard Page
 *
 * Role-specific dashboard with stats, charts, and quick actions.
 */

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppSelector } from '@/store';
import { analyticsAPI } from '@/api/client';
import type { DashboardStats } from '@/types';
import {
  Building2, Bed, HeartPulse, Ambulance, Users, AlertTriangle,
  TrendingUp, Activity, Clock, ChevronRight, Phone
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await analyticsAPI.getDashboard();
        setStats(response.data.data || {});
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const isAdmin = user?.role === 'hospital_admin' || user?.role === 'government_admin';
  const isPatient = user?.role === 'patient';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const adminStats = [
    {
      label: 'Total Hospitals',
      value: stats.total_hospitals || 0,
      icon: <Building2 size={22} />,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    },
    {
      label: 'Available Beds',
      value: stats.total_available_beds || 0,
      icon: <Bed size={22} />,
      color: '#10b981',
      gradient: 'linear-gradient(135deg, #10b981, #059669)',
    },
    {
      label: 'Active Emergencies',
      value: stats.active_emergencies || 0,
      icon: <AlertTriangle size={22} />,
      color: '#f43f5e',
      gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)',
    },
    {
      label: 'Ambulances Available',
      value: stats.available_ambulances || 0,
      icon: <Ambulance size={22} />,
      color: '#f59e0b',
      gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    },
    {
      label: 'ICU Available',
      value: stats.total_icu_available || 0,
      icon: <HeartPulse size={22} />,
      color: '#8b5cf6',
      gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    },
    {
      label: 'Total Users',
      value: stats.total_users || 0,
      icon: <Users size={22} />,
      color: '#06b6d4',
      gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)',
    },
  ];

  const patientStats = [
    {
      label: 'My Emergencies',
      value: stats.total_emergencies || 0,
      icon: <AlertTriangle size={22} />,
      color: '#f43f5e',
      gradient: 'linear-gradient(135deg, #f43f5e, #e11d48)',
    },
    {
      label: 'Nearby Hospitals',
      value: stats.nearby_hospitals || 0,
      icon: <Building2 size={22} />,
      color: '#3b82f6',
      gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    },
  ];

  const displayStats = isAdmin ? adminStats : isPatient ? patientStats : adminStats.slice(0, 4);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {getGreeting()}, {user?.full_name?.split(' ')[0]} 👋
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Here's your emergency response overview for today
          </p>
        </div>
        {isPatient && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/emergency')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm"
            style={{
              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
              boxShadow: '0 4px 15px rgba(239, 68, 68, 0.4)',
            }}
          >
            <Phone size={18} />
            SOS Emergency
          </motion.button>
        )}
      </motion.div>

      {/* Active Emergency Alert */}
      {isPatient && stats.active_emergency && (
        <motion.div
          variants={itemVariants}
          className="p-4 rounded-xl flex items-center justify-between cursor-pointer"
          style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
          }}
          onClick={() => navigate(`/emergencies`)}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <AlertTriangle size={24} style={{ color: 'var(--danger-400)' }} />
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-ping" style={{ background: '#ef4444' }} />
            </div>
            <div>
              <p className="font-semibold text-sm" style={{ color: 'var(--danger-400)' }}>
                Active Emergency
              </p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Status: {stats.active_emergency.status} • Severity: {stats.active_emergency.severity}/5
              </p>
            </div>
          </div>
          <ChevronRight size={18} style={{ color: 'var(--danger-400)' }} />
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayStats.map((stat, _index) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            className="glass-card p-5 group cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {stat.label}
                </p>
                <p className="text-3xl font-bold mt-2" style={{ color: stat.color }}>
                  {loading ? (
                    <span className="skeleton inline-block w-16 h-8" />
                  ) : (
                    stat.value.toLocaleString()
                  )}
                </p>
              </div>
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-white transition-transform group-hover:scale-110"
                style={{ background: stat.gradient }}
              >
                {stat.icon}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Find Hospital', icon: <Building2 size={20} />, path: '/hospitals', color: '#3b82f6' },
            { label: 'AI Predictions', icon: <TrendingUp size={20} />, path: '/ai/predictions', color: '#8b5cf6' },
            { label: 'View Map', icon: <Activity size={20} />, path: '/map', color: '#10b981' },
            { label: 'Notifications', icon: <Clock size={20} />, path: '/notifications', color: '#f59e0b' },
          ].map((action) => (
            <motion.button
              key={action.label}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate(action.path)}
              className="glass-card p-4 flex items-center gap-3 text-left w-full"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ background: action.color }}
              >
                {action.icon}
              </div>
              <span className="font-medium text-sm">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Recent Emergencies (Admin) */}
      {isAdmin && stats.recent_emergencies && stats.recent_emergencies.length > 0 && (
        <motion.div variants={itemVariants}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Emergencies</h2>
            <button
              onClick={() => navigate('/emergencies')}
              className="text-sm font-medium flex items-center gap-1"
              style={{ color: 'var(--primary-400)' }}
            >
              View All <ChevronRight size={14} />
            </button>
          </div>
          <div className="glass-card overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>Type</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>Severity</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>Status</th>
                  <th className="text-left py-3 px-4 font-semibold" style={{ color: 'var(--text-muted)' }}>Time</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent_emergencies.map((e) => (
                  <tr
                    key={e.id}
                    className="transition-colors hover:bg-[var(--bg-hover)] cursor-pointer"
                    style={{ borderBottom: '1px solid var(--border-color)' }}
                  >
                    <td className="py-3 px-4 capitalize">{e.type}</td>
                    <td className="py-3 px-4">
                      <span className={`severity-${e.severity} px-2 py-0.5 rounded-full text-xs font-medium`}>
                        Level {e.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`status-${e.status} capitalize font-medium`}>
                        {e.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4" style={{ color: 'var(--text-muted)' }}>
                      {e.requested_at ? new Date(e.requested_at).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
