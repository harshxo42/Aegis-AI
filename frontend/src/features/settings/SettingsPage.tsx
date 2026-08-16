/**
 * Aegis AI – Settings Page
 *
 * User profile settings, preferences, and security options.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppSelector } from '@/store';
import { 
  User, Shield, Bell, Moon, Monitor, 
  Smartphone, Save, Key
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const { user } = useAppSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.full_name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    theme: 'dark',
    notifications: true,
  });

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast.success('Settings updated successfully');
    }, 800);
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: <User size={18} /> },
    { id: 'security', label: 'Security', icon: <Shield size={18} /> },
    { id: 'preferences', label: 'Preferences', icon: <Monitor size={18} /> },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[var(--primary-500)]/10 text-[var(--primary-400)]">
          <User size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Account Settings</h1>
          <p className="text-gray-400 text-sm mt-1">Manage your profile, preferences, and security</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="md:col-span-1 space-y-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium ${
                activeTab === tab.id 
                  ? 'bg-[var(--primary-500)]/10 text-[var(--primary-400)] border border-[var(--primary-500)]/20' 
                  : 'text-gray-400 hover:bg-[var(--bg-hover)] border border-transparent'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="md:col-span-3">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="glass-card p-6"
          >
            {activeTab === 'profile' && (
              <form onSubmit={handleSave} className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">Personal Information</h2>
                
                <div className="flex items-center gap-6 mb-6">
                  <div className="w-20 h-20 rounded-full bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-center text-2xl font-bold text-[var(--primary-400)]">
                    {formData.fullName.charAt(0) || 'U'}
                  </div>
                  <div>
                    <button type="button" className="px-4 py-2 rounded-lg bg-[var(--primary-500)]/10 text-[var(--primary-400)] font-medium text-sm hover:bg-[var(--primary-500)]/20 transition-colors whitespace-nowrap flex-shrink-0">
                      Change Avatar
                    </button>
                    <p className="text-xs text-gray-500 mt-2">JPG, GIF or PNG. Max size of 800K</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-300">Full Name</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--primary-500)]"
                      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-300">Role</label>
                    <input
                      type="text"
                      value={user?.role ? user.role.replace('_', ' ') : 'Patient'}
                      disabled
                      className="w-full px-4 py-2.5 rounded-xl text-sm capitalize opacity-60 cursor-not-allowed"
                      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-300">Email Address</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--primary-500)]"
                      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1.5 text-gray-300">Phone Number</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--primary-500)]"
                      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div className="pt-6 border-t border-[var(--border-color)] flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2.5 rounded-xl text-white font-medium text-sm flex items-center gap-2 bg-[var(--primary-600)] hover:bg-[var(--primary-500)] transition-colors disabled:opacity-50 whitespace-nowrap flex-shrink-0"
                  >
                    {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={16} />}
                    Save Changes
                  </button>
                </div>
              </form>
            )}

            {activeTab === 'security' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">Security Settings</h2>
                
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm mb-1 text-white flex items-center gap-2">
                      <Key size={16} className="text-[var(--primary-400)]" />
                      Change Password
                    </h3>
                    <p className="text-xs text-gray-400">Update your password to keep your account secure.</p>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-color)] text-sm font-medium text-white hover:bg-[var(--bg-hover)] transition-colors whitespace-nowrap flex-shrink-0">
                    Update Password
                  </button>
                </div>
                
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm mb-1 text-white flex items-center gap-2">
                      <Smartphone size={16} className="text-[var(--primary-400)]" />
                      Two-Factor Authentication
                    </h3>
                    <p className="text-xs text-gray-400">Add an extra layer of security to your account.</p>
                  </div>
                  <button className="px-4 py-2 rounded-lg bg-[var(--primary-500)]/10 text-[var(--primary-400)] border border-[var(--primary-500)]/20 text-sm font-medium hover:bg-[var(--primary-500)]/20 transition-colors whitespace-nowrap flex-shrink-0">
                    Enable 2FA
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'preferences' && (
              <div className="space-y-6">
                <h2 className="text-lg font-semibold mb-4">System Preferences</h2>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-white flex items-center gap-2">
                        <Bell size={16} className="text-[var(--primary-400)]" />
                        Push Notifications
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">Receive alerts for emergencies and updates.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={formData.notifications} 
                        onChange={() => setFormData({...formData, notifications: !formData.notifications})}
                        className="sr-only peer" 
                      />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-500)]"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-sm text-white flex items-center gap-2">
                        <Moon size={16} className="text-[var(--primary-400)]" />
                        Dark Mode
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">Toggle between light and dark themes.</p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked={true} readOnly className="sr-only peer" />
                      <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary-500)]"></div>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
