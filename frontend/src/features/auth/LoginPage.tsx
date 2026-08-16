/**
 * Aegis AI – Login Page
 *
 * Premium login page with glassmorphism card and animated gradient background.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/store';
import { loginUser, clearError } from '@/store/authSlice';
import { Shield, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    const result = await dispatch(loginUser(formData));
    if (loginUser.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-x-hidden px-4 py-10">
      {/* Animated background */}
      <div className="absolute inset-0" style={{ background: 'var(--bg-primary)' }}>
        <div className="absolute inset-0 gradient-mesh" />
        <motion.div
          className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl"
          style={{ background: 'var(--primary-500)', top: '10%', left: '10%' }}
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute w-80 h-80 rounded-full opacity-15 blur-3xl"
          style={{ background: 'var(--accent-500)', bottom: '10%', right: '10%' }}
          animate={{ x: [0, -40, 0], y: [0, -40, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        <div
          className="glass-card p-6 sm:p-8 w-full"
          style={{ background: 'rgba(17, 24, 39, 0.75)' }}
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{
                background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
                boxShadow: '0 0 30px rgba(59, 130, 246, 0.3)',
              }}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
            >
              <Shield size={32} color="white" />
            </motion.div>
            <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
              Welcome to Aegis AI
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              Intelligent Emergency Response Platform
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl mb-6"
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: 'var(--danger-400)',
              }}
            >
              <AlertCircle size={16} className="flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Email Address
              </label>
              <div className="relative">
                <Mail
                  size={18}
                  className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ left: '14px', color: 'var(--text-muted)', flexShrink: 0 }}
                />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="you@example.com"
                  required
                  className="w-full rounded-xl text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--primary-500)]"
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    paddingLeft: '44px',
                    paddingRight: '14px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    height: '46px',
                  }}
                />
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Password
              </label>
              <div className="relative">
                <Lock
                  size={18}
                  className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{ left: '14px', color: 'var(--text-muted)', flexShrink: 0 }}
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter your password"
                  required
                  minLength={6}
                  className="w-full rounded-xl text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--primary-500)]"
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)',
                    paddingLeft: '44px',
                    paddingRight: '46px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    height: '46px',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded focus:outline-none"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" className="flex-shrink-0 w-4 h-4 rounded border-gray-500 bg-[var(--bg-tertiary)] text-[var(--primary-500)] focus:ring-[var(--primary-500)] focus:ring-offset-[var(--bg-card)] focus:ring-offset-2 transition-colors cursor-pointer" />
                <span className="text-sm select-none" style={{ color: 'var(--text-muted)' }}>
                  Remember me
                </span>
              </label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium transition-colors hover:text-[var(--primary-300)] whitespace-nowrap"
                style={{ color: 'var(--primary-400)' }}
              >
                Forgot password?
              </Link>
            </div>

            <motion.button
              type="submit"
              disabled={isLoading}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              className="w-full mt-2 py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50"
              style={{
                background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
                boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)',
              }}
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Sign In
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>
          </form>

          {/* Demo Credentials */}
          <div
            className="mt-6 p-4 sm:p-5 rounded-2xl"
            style={{
              background: 'rgba(59, 130, 246, 0.05)',
              border: '1px solid rgba(59, 130, 246, 0.18)',
            }}
          >
            <div className="flex items-center justify-between gap-2 mb-3.5">
              <span
                className="text-xs font-semibold tracking-wider uppercase"
                style={{ color: 'var(--primary-400)' }}
              >
                Demo Accounts
              </span>
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wider uppercase flex-shrink-0"
                style={{
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: 'var(--warning-400)',
                  border: '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                Demo Only
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
                style={{
                  background: 'rgba(31, 41, 55, 0.65)',
                  border: '1px solid rgba(75, 85, 99, 0.25)',
                }}
              >
                <span className="font-medium text-xs text-[var(--text-primary)] flex-shrink-0">Admin</span>
                <span className="font-mono text-[11px] sm:text-xs text-[var(--text-muted)] text-right truncate">admin@aegisai.com</span>
              </div>
              <div
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
                style={{
                  background: 'rgba(31, 41, 55, 0.65)',
                  border: '1px solid rgba(75, 85, 99, 0.25)',
                }}
              >
                <span className="font-medium text-xs text-[var(--text-primary)] flex-shrink-0">Patient</span>
                <span className="font-mono text-[11px] sm:text-xs text-[var(--text-muted)] text-right truncate">patient@aegisai.com</span>
              </div>
              <div
                className="flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl"
                style={{
                  background: 'rgba(31, 41, 55, 0.65)',
                  border: '1px solid rgba(75, 85, 99, 0.25)',
                }}
              >
                <span className="font-medium text-xs text-[var(--text-primary)] flex-shrink-0">Doctor</span>
                <span className="font-mono text-[11px] sm:text-xs text-[var(--text-muted)] text-right truncate">dr.mehta@aegisai.com</span>
              </div>
            </div>

            <p
              className="text-[11px] text-center mt-3.5 leading-relaxed"
              style={{ color: 'rgba(251, 113, 133, 0.85)' }}
            >
              Never use real credentials on demo environments.
            </p>
          </div>

          {/* Sign Up Link */}
          <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold transition-colors hover:text-[var(--primary-300)]" style={{ color: 'var(--primary-400)' }}>
              Create Account
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
