/**
 * Aegis AI – Login Page
 *
 * Premium authentication page with:
 * - Secure email/password login
 * - Password visibility toggle
 * - Loading state
 * - Error handling
 * - Responsive glassmorphism UI
 * - Redux authentication integration
 * - Registration link
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
  RotateCcw,
} from 'lucide-react';

import { useAppDispatch, useAppSelector } from '@/store';
import { loginUser, clearError } from '@/store/authSlice';


// ============================================================
// COMPONENT
// ============================================================

export default function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const from =
    (location.state as { from?: { pathname?: string } })?.from
      ?.pathname || '/dashboard';

  const { isLoading, error } = useAppSelector(
    (state) => state.auth
  );


  // ==========================================================
  // FORM STATE
  // ==========================================================

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [showPassword, setShowPassword] = useState(false);


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

    if (error) {
      dispatch(clearError());
    }
  };


  // ==========================================================
  // CLEAR FORM
  // ==========================================================

  const clearForm = () => {
    setFormData({
      email: '',
      password: '',
    });

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

        {/* Primary animated glow */}
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