/**
 * Aegis AI – Register Page
 *
 * Multi-step registration with role selection.
 */

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '@/store';
import { registerUser, clearError } from '@/store/authSlice';
import {
  Shield, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft,
  AlertCircle, User, Phone, Stethoscope, Building2, Truck, ShieldCheck,
  HeartPulse
} from 'lucide-react';
import type { UserRole } from '@/types';

const roles: { value: UserRole; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'patient', label: 'Patient', icon: <HeartPulse size={24} />, description: 'Request emergency help & manage health' },
  { value: 'doctor', label: 'Doctor', icon: <Stethoscope size={24} />, description: 'Manage patients & medical reports' },
  { value: 'ambulance_driver', label: 'Ambulance Driver', icon: <Truck size={24} />, description: 'Respond to emergency dispatch' },
  { value: 'hospital_admin', label: 'Hospital Admin', icon: <Building2 size={24} />, description: 'Manage hospital resources' },
  { value: 'government_admin', label: 'Government Admin', icon: <ShieldCheck size={24} />, description: 'Monitor city-wide emergencies' },
];

export default function RegisterPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useAppSelector((state) => state.auth);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirm_password: '',
    full_name: '',
    phone: '',
    role: 'patient' as UserRole,
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(clearError());

    const result = await dispatch(registerUser(formData));
    if (registerUser.fulfilled.match(result)) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden px-4 py-8">
      {/* Animated background */}
      <div className="absolute inset-0" style={{ background: 'var(--bg-primary)' }}>
        <div className="absolute inset-0 gradient-mesh" />
        <motion.div
          className="absolute w-96 h-96 rounded-full opacity-15 blur-3xl"
          style={{ background: 'var(--accent-500)', top: '20%', right: '10%' }}
          animate={{ x: [0, -50, 0], y: [0, 30, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-lg"
      >
        <div className="glass-card p-8" style={{ background: 'rgba(17, 24, 39, 0.7)' }}>
          {/* Logo */}
          <div className="text-center mb-6">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-2xl mb-3"
              style={{ background: 'linear-gradient(135deg, var(--primary-500), var(--accent-500))' }}
            >
              <Shield size={28} color="white" />
            </div>
            <h1 className="text-2xl font-bold">Create Account</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Step {step} of 2 — {step === 1 ? 'Choose your role' : 'Account details'}
            </p>
          </div>

          {/* Progress bar */}
          <div className="flex gap-2 mb-6">
            {[1, 2].map((s) => (
              <div
                key={s}
                className="flex-1 h-1 rounded-full transition-all duration-300"
                style={{
                  background: s <= step
                    ? 'linear-gradient(90deg, var(--primary-500), var(--accent-500))'
                    : 'var(--bg-tertiary)',
                }}
              />
            ))}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl mb-4"
              style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: 'var(--danger-400)' }}
            >
              <AlertCircle size={16} />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 ? (
              /* Step 1: Role Selection */
              <div className="space-y-3">
                {roles.map((role) => (
                  <motion.button
                    key={role.value}
                    type="button"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setFormData({ ...formData, role: role.value })}
                    className="w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 text-left"
                    style={{
                      background: formData.role === role.value ? 'var(--bg-hover)' : 'var(--bg-tertiary)',
                      border: formData.role === role.value
                        ? '1px solid var(--primary-500)'
                        : '1px solid var(--border-color)',
                    }}
                  >
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{
                        background: formData.role === role.value
                          ? 'linear-gradient(135deg, var(--primary-500), var(--accent-500))'
                          : 'var(--bg-secondary)',
                        color: formData.role === role.value ? 'white' : 'var(--text-muted)',
                      }}
                    >
                      {role.icon}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{role.label}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                        {role.description}
                      </p>
                    </div>
                  </motion.button>
                ))}

                <motion.button
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => setStep(2)}
                  className="w-full py-3 mt-4 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))' }}
                >
                  Continue <ArrowRight size={16} />
                </motion.button>
              </div>
            ) : (
              /* Step 2: Account Details */
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                    Full Name
                  </label>
                  <div className="relative">
                    <User size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                      placeholder="John Doe"
                      required
                      minLength={2}
                      className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--primary-500)]"
                      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--primary-500)]"
                      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Phone (Optional)</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--primary-500)]"
                      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Min 8 chars, uppercase, lowercase, digit"
                      required
                      minLength={8}
                      className="w-full pl-11 pr-12 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--primary-500)]"
                      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }}>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>Confirm Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
                    <input
                      type="password"
                      value={formData.confirm_password}
                      onChange={(e) => setFormData({ ...formData, confirm_password: e.target.value })}
                      placeholder="Re-enter your password"
                      required
                      minLength={8}
                      className="w-full pl-11 pr-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--primary-500)]"
                      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2"
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className="flex-1 py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))' }}
                  >
                    {isLoading ? (
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>Register <ArrowRight size={16} /></>
                    )}
                  </motion.button>
                </div>
              </div>
            )}
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: 'var(--text-muted)' }}>
            Already have an account?{' '}
            <Link to="/login" className="font-semibold" style={{ color: 'var(--primary-400)' }}>
              Sign In
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
