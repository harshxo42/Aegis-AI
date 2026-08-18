/**
 * Aegis AI – Login Page
 *
 * Premium login page with:
 * - Demo account quick-fill
 * - Password visibility toggle
 * - Loading state
 * - Error handling
 * - Responsive glassmorphism UI
 * - Redux authentication integration
 */

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  UserRound,
  Stethoscope,
  ShieldCheck,
  Building2,
  Ambulance,
  RotateCcw,
} from 'lucide-react';

import { useAppDispatch, useAppSelector } from '@/store';
import { loginUser, clearError } from '@/store/authSlice';


// ============================================================
// DEMO ACCOUNTS
// ============================================================

export const DEMO_ACCOUNTS = {
  admin: {
    key: 'admin',
    role: 'Admin',
    email: 'admin@aegisai.com',
    password: 'Admin@123',
    icon: ShieldCheck,
    iconBg: 'rgba(59, 130, 246, 0.12)',
    iconColor: 'var(--primary-400)',
  },

  hospital_admin: {
    key: 'hospital_admin',
    role: 'Hospital Admin',
    email: 'hospital@aegisai.com',
    password: 'Hospital@123',
    icon: Building2,
    iconBg: 'rgba(139, 92, 246, 0.12)',
    iconColor: '#a855f7',
  },

  patient: {
    key: 'patient',
    role: 'Patient',
    email: 'arjun@aegisai.com',
    password: 'Patient@123',
    icon: UserRound,
    iconBg: 'rgba(16, 185, 129, 0.12)',
    iconColor: 'var(--success-400)',
  },


  doctor: {
    key: 'doctor',
    role: 'Doctor',
    email: 'dr.mehta@aegisai.com',
    password: 'Doctor@123',
    icon: Stethoscope,
    iconBg: 'rgba(56, 189, 248, 0.12)',
    iconColor: '#38bdf8',
  },

  driver: {
    key: 'driver',
    role: 'Driver',
    email: 'driver1@aegisai.com',
    password: 'Driver@123',
    icon: Ambulance,
    iconBg: 'rgba(245, 158, 11, 0.12)',
    iconColor: 'var(--warning-400)',
  },
} as const;

export type DemoAccountKey = keyof typeof DEMO_ACCOUNTS;


// ============================================================
// COMPONENT
// ============================================================

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as { from?: { pathname?: string } })?.from?.pathname || '/dashboard';

  const { isLoading, error } = useAppSelector(
    (state) => state.auth
  );


  // ----------------------------------------------------------
  // FORM STATE
  // ----------------------------------------------------------

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);

  const [selectedDemo, setSelectedDemo] = useState<DemoAccountKey | null>(null);


  // ==========================================================
  // INPUT HANDLERS
  // ==========================================================

  const handleEmailChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      email: e.target.value,
    }));

    setSelectedDemo(null);

    if (error) {
      dispatch(clearError());
    }
  };


  const handlePasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData((prev) => ({
      ...prev,
      password: e.target.value,
    }));

    setSelectedDemo(null);

    if (error) {
      dispatch(clearError());
    }
  };


  // ==========================================================
  // DEMO ACCOUNT QUICK FILL
  // ==========================================================

  const fillDemoAccount = (
    accountType: DemoAccountKey
  ) => {
    const account = DEMO_ACCOUNTS[accountType];

    setFormData({
      email: account.email,
      password: account.password,
    });

    setSelectedDemo(accountType);

    dispatch(clearError());
  };


  // ==========================================================
  // CLEAR FORM
  // ==========================================================

  const clearForm = () => {
    setFormData({
      email: '',
      password: '',
    });

    setSelectedDemo(null);

    dispatch(clearError());
  };


  // ==========================================================
  // LOGIN
  // ==========================================================

  const handleSubmit = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();

    dispatch(clearError());

    const email = formData.email.trim();
    const password = formData.password;

    if (!email || !password) {
      return;
    }

    const result = await dispatch(
      loginUser({
        email,
        password,
      })
    );

    if (loginUser.fulfilled.match(result)) {
      navigate(from, { replace: true });
    }
  };



  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-x-hidden px-4 py-8 sm:py-10">

      {/* ======================================================
          BACKGROUND
      ====================================================== */}

      <div
        className="absolute inset-0"
        style={{
          background: 'var(--bg-primary)',
        }}
      >
        {/* Gradient mesh */}
        <div className="absolute inset-0 gradient-mesh" />

        {/* Blue animated glow */}
        <motion.div
          className="absolute w-72 h-72 sm:w-96 sm:h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
          style={{
            background: 'var(--primary-500)',
            top: '8%',
            left: '5%',
          }}
          animate={{
            x: [0, 50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Accent animated glow */}
        <motion.div
          className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full opacity-15 blur-3xl pointer-events-none"
          style={{
            background: 'var(--accent-500)',
            bottom: '5%',
            right: '5%',
          }}
          animate={{
            x: [0, -40, 0],
            y: [0, -40, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      </div>


      {/* ======================================================
          LOGIN CONTAINER
      ====================================================== */}

      <motion.div
        initial={{
          opacity: 0,
          y: 20,
          scale: 0.96,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.5,
          ease: 'easeOut',
        }}
        className="relative z-10 w-full max-w-md"
      >

        {/* ==================================================
            LOGIN CARD
        ================================================== */}

        <div
          className="glass-card p-5 sm:p-8 w-full"
          style={{
            background: 'rgba(17, 24, 39, 0.78)',
          }}
        >

          {/* =================================================
              LOGO / HEADER
          ================================================= */}

          <div className="text-center mb-7 sm:mb-8">

            <motion.div
              className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4"
              style={{
                background:
                  'linear-gradient(135deg, var(--primary-500), var(--accent-500))',
                boxShadow:
                  '0 0 30px rgba(59, 130, 246, 0.3)',
              }}
              animate={{
                rotate: [0, 5, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
              }}
            >
              <Shield
                size={32}
                color="white"
              />
            </motion.div>

            <h1
              className="text-2xl font-bold mb-1"
              style={{
                color: 'var(--text-primary)',
              }}
            >
              Welcome to Aegis AI
            </h1>

            <p
              style={{
                color: 'var(--text-muted)',
                fontSize: '0.875rem',
              }}
            >
              Intelligent Emergency Response Platform
            </p>

          </div>


          {/* =================================================
              ERROR MESSAGE
          ================================================= */}

          {error && (
            <motion.div
              initial={{
                opacity: 0,
                y: -10,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="flex items-start gap-2 px-4 py-3 rounded-xl mb-6"
              style={{
                background: 'rgba(239, 68, 68, 0.10)',
                border:
                  '1px solid rgba(239, 68, 68, 0.30)',
                color: 'var(--danger-400)',
              }}
            >
              <AlertCircle
                size={17}
                className="flex-shrink-0 mt-0.5"
              />

              <span className="text-sm leading-relaxed">
                {error}
              </span>
            </motion.div>
          )}


          {/* =================================================
              DEMO SELECTED MESSAGE
          ================================================= */}

          {selectedDemo && !error && (
            <motion.div
              initial={{
                opacity: 0,
                y: -8,
              }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              className="flex items-center gap-2 px-4 py-3 rounded-xl mb-6"
              style={{
                background:
                  'rgba(16, 185, 129, 0.08)',
                border:
                  '1px solid rgba(16, 185, 129, 0.25)',
                color: 'var(--success-400)',
              }}
            >
              <CheckCircle2
                size={17}
                className="flex-shrink-0"
              />

              <span className="text-sm">
                {DEMO_ACCOUNTS[selectedDemo].role} demo
                credentials filled. Click Sign In.
              </span>
            </motion.div>
          )}


          {/* =================================================
              LOGIN FORM
          ================================================= */}

          <form
            onSubmit={handleSubmit}
            className="flex flex-col gap-5"
          >

            {/* =================================================
                EMAIL
            ================================================= */}

            <div className="flex flex-col">

              <label
                htmlFor="email"
                className="text-sm font-medium mb-1.5"
                style={{
                  color: 'var(--text-secondary)',
                }}
              >
                Email Address
              </label>

              <div className="relative">

                <Mail
                  size={18}
                  className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    left: '14px',
                    color: 'var(--text-muted)',
                  }}
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleEmailChange}
                  placeholder="you@example.com"
                  required
                  disabled={isLoading}
                  className="w-full rounded-xl text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--primary-500)] disabled:opacity-60"
                  style={{
                    background:
                      'var(--bg-tertiary)',
                    border:
                      '1px solid var(--border-color)',
                    color:
                      'var(--text-primary)',
                    paddingLeft: '44px',
                    paddingRight: '14px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    height: '46px',
                  }}
                />

              </div>

            </div>


            {/* =================================================
                PASSWORD
            ================================================= */}

            <div className="flex flex-col">

              <label
                htmlFor="password"
                className="text-sm font-medium mb-1.5"
                style={{
                  color: 'var(--text-secondary)',
                }}
              >
                Password
              </label>

              <div className="relative">

                <Lock
                  size={18}
                  className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    left: '14px',
                    color: 'var(--text-muted)',
                  }}
                />

                <input
                  id="password"
                  name="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handlePasswordChange}
                  placeholder="Enter your password"
                  required
                  minLength={6}
                  disabled={isLoading}
                  className="w-full rounded-xl text-sm outline-none transition-all duration-200 focus:ring-2 focus:ring-[var(--primary-500)] disabled:opacity-60"
                  style={{
                    background:
                      'var(--bg-tertiary)',
                    border:
                      '1px solid var(--border-color)',
                    color:
                      'var(--text-primary)',
                    paddingLeft: '44px',
                    paddingRight: '46px',
                    paddingTop: '12px',
                    paddingBottom: '12px',
                    height: '46px',
                  }}
                />

                {/* Show / Hide password */}

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      (prev) => !prev
                    )
                  }
                  disabled={isLoading}
                  aria-label={
                    showPassword
                      ? 'Hide password'
                      : 'Show password'
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded focus:outline-none disabled:opacity-50"
                  style={{
                    color:
                      'var(--text-muted)',
                  }}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>


            {/* =================================================
                REMEMBER / FORGOT
            ================================================= */}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">

              <label className="flex items-center gap-2 cursor-pointer group">

                <input
                  type="checkbox"
                  disabled={isLoading}
                  className="flex-shrink-0 w-4 h-4 rounded border-gray-500 bg-[var(--bg-tertiary)] text-[var(--primary-500)] focus:ring-[var(--primary-500)] focus:ring-offset-[var(--bg-card)] focus:ring-offset-2 transition-colors cursor-pointer"
                />

                <span
                  className="text-sm select-none"
                  style={{
                    color:
                      'var(--text-muted)',
                  }}
                >
                  Remember me
                </span>

              </label>


              <Link
                to="/forgot-password"
                className="text-sm font-medium transition-colors hover:text-[var(--primary-300)] whitespace-nowrap"
                style={{
                  color:
                    'var(--primary-400)',
                }}
              >
                Forgot password?
              </Link>

            </div>


            {/* =================================================
                LOGIN BUTTON
            ================================================= */}

            <motion.button
              type="submit"
              disabled={
                isLoading ||
                !formData.email ||
                !formData.password
              }
              whileHover={{
                scale: 1.01,
              }}
              whileTap={{
                scale: 0.99,
              }}
              className="w-full mt-2 py-3.5 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background:
                  'linear-gradient(135deg, var(--primary-600), var(--primary-500))',
                boxShadow:
                  '0 4px 15px rgba(59, 130, 246, 0.3)',
              }}
            >

              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />

                  <span>
                    Signing In...
                  </span>
                </>
              ) : (
                <>
                  <span>
                    Sign In
                  </span>

                  <ArrowRight size={16} />
                </>
              )}

            </motion.button>


            {/* Clear button */}

            {(formData.email || formData.password) && (
              <button
                type="button"
                onClick={clearForm}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 text-xs transition-colors hover:text-[var(--text-primary)]"
                style={{
                  color:
                    'var(--text-muted)',
                }}
              >
                <RotateCcw size={13} />

                Clear credentials
              </button>
            )}

          </form>


          {/* =================================================
              DEMO ACCOUNTS
          ================================================= */}

          <div
            className="mt-6 p-4 sm:p-5 rounded-2xl"
            style={{
              background:
                'rgba(59, 130, 246, 0.05)',
              border:
                '1px solid rgba(59, 130, 246, 0.18)',
            }}
          >

            {/* Header */}

            <div className="flex items-center justify-between gap-2 mb-3.5">

              <span
                className="text-xs font-semibold tracking-wider uppercase"
                style={{
                  color:
                    'var(--primary-400)',
                }}
              >
                Demo Accounts
              </span>

              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wider uppercase flex-shrink-0"
                style={{
                  background:
                    'rgba(245, 158, 11, 0.15)',
                  color:
                    'var(--warning-400)',
                  border:
                    '1px solid rgba(245, 158, 11, 0.3)',
                }}
              >
                Demo Only
              </span>

            </div>


            {/* Demo Accounts List */}
            <div className="flex flex-col gap-2">
              {Object.values(DEMO_ACCOUNTS).map((account) => {
                const IconComponent = account.icon;
                const isSelected = selectedDemo === account.key;

                return (
                  <button
                    key={account.key}
                    type="button"
                    onClick={() => fillDemoAccount(account.key)}
                    disabled={isLoading}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed text-left"
                    style={{
                      background: isSelected
                        ? 'rgba(59, 130, 246, 0.15)'
                        : 'rgba(31, 41, 55, 0.65)',
                      border: isSelected
                        ? '1px solid rgba(59, 130, 246, 0.5)'
                        : '1px solid rgba(75, 85, 99, 0.25)',
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{
                        background: account.iconBg,
                        color: account.iconColor,
                      }}
                    >
                      <IconComponent size={18} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div
                        className="font-medium text-xs truncate"
                        style={{
                          color: 'var(--text-primary)',
                        }}
                      >
                        {account.role}
                      </div>

                      <div
                        className="font-mono text-[11px] truncate mt-0.5"
                        style={{
                          color: 'var(--text-muted)',
                        }}
                      >
                        {account.email}
                      </div>
                    </div>

                    {isSelected && (
                      <CheckCircle2
                        size={18}
                        style={{
                          color: 'var(--success-400)',
                        }}
                        className="flex-shrink-0"
                      />
                    )}
                  </button>
                );
              })}
            </div>


            {/* Warning */}

            <p
              className="text-[11px] text-center mt-4 leading-relaxed"
              style={{
                color:
                  'rgba(251, 113, 133, 0.85)',
              }}
            >
              Demo accounts are for testing only.
              Never use real credentials on demo
              environments.
            </p>

          </div>


          {/* =================================================
              REGISTER
          ================================================= */}

          <p
            className="text-center mt-6 text-sm"
            style={{
              color:
                'var(--text-muted)',
            }}
          >
            Don't have an account?{' '}

            <Link
              to="/register"
              className="font-semibold transition-colors hover:text-[var(--primary-300)]"
              style={{
                color:
                  'var(--primary-400)',
              }}
            >
              Create Account
            </Link>
          </p>


          {/* =================================================
              FOOTER
          ================================================= */}

          <div className="text-center mt-5">

            <p
              className="text-[10px]"
              style={{
                color:
                  'var(--text-muted)',
                opacity: 0.7,
              }}
            >
              Aegis AI • Intelligent Emergency
              Response Platform
            </p>

          </div>

        </div>

      </motion.div>

    </div>
  );
}