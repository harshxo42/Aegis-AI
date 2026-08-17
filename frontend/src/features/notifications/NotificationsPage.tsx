/**
 * Aegis AI – Notifications & Dispatch Alert Center
 *
 * Real-time clinical alert center for emergency dispatches, triage updates, and hospital notices.
 */

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  AlertTriangle,
  Info,
  CheckCircle,
  AlertCircle,
  Check,
  CheckCheck,
  RefreshCw,
  Inbox,
} from 'lucide-react';
import { notificationsAPI } from '@/api/client';
import type { Notification } from '@/types';
import { formatDistanceToNow } from 'date-fns';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'emergency'>('all');

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationsAPI.list();
      setNotifications(res.data.data || []);
    } catch (error) {
      console.error('[Aegis AI] Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await notificationsAPI.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('[Aegis AI] Failed to mark read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    const unread = notifications.filter((n) => !n.is_read);
    for (const n of unread) {
      await handleMarkRead(n.id);
    }
  };

  const getIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'emergency':
        return <AlertTriangle size={18} className="text-rose-600 dark:text-rose-400" />;
      case 'warning':
        return <AlertCircle size={18} className="text-amber-600 dark:text-amber-400" />;
      case 'success':
        return <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />;
      default:
        return <Info size={18} className="text-blue-600 dark:text-blue-400" />;
    }
  };

  const getBgColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'emergency':
        return 'bg-rose-500/10 border-rose-500/25';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/25';
      case 'success':
        return 'bg-emerald-500/10 border-emerald-500/25';
      default:
        return 'bg-blue-500/10 border-blue-500/25';
    }
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread') return !n.is_read;
    if (filter === 'emergency') return n.notification_type === 'emergency';
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xs flex-shrink-0">
            <Bell size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">
                Alerts & Notifications
              </h1>
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                  {unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
              Live operational alerts, emergency response telemetry, and system dispatches
            </p>
          </div>
        </div>

        {/* HEADER ACTIONS */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors flex items-center gap-1.5 shadow-2xs"
            >
              <CheckCheck size={14} className="text-emerald-500" />
              <span>Mark All Read</span>
            </button>
          )}

          <button
            type="button"
            onClick={fetchNotifications}
            title="Refresh alerts"
            aria-label="Refresh alerts"
            className="p-2 rounded-xl text-[var(--text-secondary)] bg-[var(--bg-tertiary)] border border-[var(--border-color)] hover:bg-[var(--bg-hover)] transition-colors shadow-2xs"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* FILTER TABS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            filter === 'all'
              ? 'bg-[var(--primary-600)] text-white shadow-xs'
              : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
          }`}
        >
          <span>All Alerts</span>
          <span className="text-[10px] opacity-75 font-mono">({notifications.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setFilter('unread')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            filter === 'unread'
              ? 'bg-[var(--primary-600)] text-white shadow-xs'
              : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
          }`}
        >
          <span>Unread</span>
          {unreadCount > 0 && (
            <span className="text-[10px] font-mono font-bold bg-rose-500 text-white px-1.5 py-0.2 rounded-full">
              {unreadCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setFilter('emergency')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            filter === 'emergency'
              ? 'bg-[var(--primary-600)] text-white shadow-xs'
              : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)]'
          }`}
        >
          <span>Critical SOS</span>
          <span className="text-[10px] opacity-75 font-mono">
            ({notifications.filter((n) => n.notification_type === 'emergency').length})
          </span>
        </button>
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="space-y-3">
        {loading ? (
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-4 sm:p-5 flex gap-3.5 items-start animate-pulse"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-[var(--bg-tertiary)] rounded-md w-1/3" />
                <div className="h-3 bg-[var(--bg-tertiary)] rounded-md w-2/3" />
              </div>
            </div>
          ))
        ) : filteredNotifications.length === 0 ? (
          <div className="bg-[var(--bg-card)] border border-dashed border-[var(--border-color)] rounded-2xl p-10 text-center space-y-3">
            <div className="w-12 h-12 mx-auto rounded-2xl flex items-center justify-center bg-[var(--bg-tertiary)] text-[var(--text-muted)]">
              <Inbox size={24} />
            </div>
            <div>
              <p className="text-base font-bold text-[var(--text-primary)]">
                {filter === 'all' ? 'All caught up' : 'No matching notifications'}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1 max-w-sm mx-auto leading-relaxed">
                {filter === 'all'
                  ? 'All emergency dispatches, clinical triage updates, and system notifications are up to date.'
                  : 'There are no active notifications matching the selected filter criteria.'}
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {filteredNotifications.map((notif, i) => {
              const isUnread = !notif.is_read;

              return (
                <motion.div
                  key={notif.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`bg-[var(--bg-card)] border rounded-2xl p-4 sm:p-5 flex gap-3.5 items-start transition-all shadow-xs ${
                    isUnread
                      ? 'border-[var(--primary-500)]/40 bg-[var(--primary-500)]/5 border-l-4 border-l-[var(--primary-600)]'
                      : 'border-[var(--border-color)] opacity-85 hover:opacity-100'
                  }`}
                >
                  {/* ICON AVATAR */}
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${getBgColor(
                      notif.notification_type
                    )}`}
                  >
                    {getIcon(notif.notification_type)}
                  </div>

                  {/* CONTENT */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">
                          {notif.title}
                        </h3>
                        {isUnread && (
                          <span className="w-2 h-2 rounded-full bg-[var(--primary-600)] flex-shrink-0" />
                        )}
                      </div>

                      <span className="text-[11px] font-medium text-[var(--text-muted)] whitespace-nowrap flex-shrink-0">
                        {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                      {notif.message}
                    </p>
                  </div>

                  {/* ACTION: MARK READ */}
                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(notif.id)}
                      className="p-2 text-[var(--text-muted)] hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-500/10 rounded-xl transition-colors flex-shrink-0"
                      title="Mark as read"
                      aria-label="Mark as read"
                    >
                      <Check size={16} />
                    </button>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
