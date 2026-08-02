/**
 * Aegis AI – Notifications Page
 *
 * Real-time notification center for user alerts.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertTriangle, Info, CheckCircle, AlertCircle, Check } from 'lucide-react';
import { notificationsAPI } from '@/api/client';
import type { Notification } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationsAPI.list();
      setNotifications(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark read', error);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    for (const n of unread) {
      await handleMarkRead(n.id);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'emergency': return <AlertTriangle size={20} className="text-rose-500" />;
      case 'warning': return <AlertCircle size={20} className="text-amber-500" />;
      case 'success': return <CheckCircle size={20} className="text-emerald-500" />;
      default: return <Info size={20} className="text-blue-500" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type) {
      case 'emergency': return 'bg-rose-500/10 border-rose-500/20';
      case 'warning': return 'bg-amber-500/10 border-amber-500/20';
      case 'success': return 'bg-emerald-500/10 border-emerald-500/20';
      default: return 'bg-blue-500/10 border-blue-500/20';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-[var(--primary-500)]/10 text-[var(--primary-400)]">
            <Bell size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-gray-400 text-sm mt-1">
              You have {unreadCount} unread message{unreadCount !== 1 && 's'}
            </p>
          </div>
        </div>

        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllRead}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors"
          >
            Mark all as read
          </button>
        )}
      </div>

      <div className="space-y-3">
        {loading ? (
          [1, 2, 3, 4].map(i => (
            <div key={i} className="glass-card p-4 flex gap-4 items-start">
              <div className="skeleton w-10 h-10 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="skeleton h-5 w-1/3" />
                <div className="skeleton h-4 w-2/3" />
              </div>
            </div>
          ))
        ) : notifications.length === 0 ? (
          <div className="glass-card p-12 text-center border-dashed">
            <Bell size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-lg font-medium text-gray-300">All caught up!</p>
            <p className="text-sm text-gray-500 mt-1">No new notifications to display.</p>
          </div>
        ) : (
          <AnimatePresence>
            {notifications.map((notif, i) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`glass-card p-4 flex gap-4 items-start transition-colors ${!notif.is_read ? 'bg-[var(--bg-hover)] border-l-4 border-l-[var(--primary-500)]' : 'opacity-70'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 border ${getBgColor(notif.notification_type)}`}>
                  {getIcon(notif.notification_type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className={`text-sm font-semibold ${!notif.is_read ? 'text-white' : 'text-gray-300'}`}>
                      {notif.title}
                    </h3>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{notif.message}</p>
                </div>

                {!notif.is_read && (
                  <button 
                    onClick={() => handleMarkRead(notif.id)}
                    className="p-2 text-gray-500 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                    title="Mark as read"
                  >
                    <Check size={18} />
                  </button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
