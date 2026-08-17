/**
 * Aegis AI – AI Disease & Triage Predictions Page
 *
 * Predict disease category and urgency level based on patient symptoms using clinical ML models.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  Activity,
  AlertTriangle,
  User,
  Calendar,
  Bot,
  RefreshCw,
  Sparkles,
  FileText,
} from 'lucide-react';
import { aiAPI } from '@/api/client';
import { toast } from 'react-hot-toast';

export default function AIPredictionsPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    symptoms: '',
    age: '',
    gender: 'Male',
    medical_history: '',
  });

  const [result, setResult] = useState<{
    predicted_disease: string;
    confidence_score: number;
    recommended_action: string;
    triage_level: string;
  } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.symptoms.trim() || !formData.age) {
      toast.error('Please enter symptoms and age');
      return;
    }

    try {
      setLoading(true);
      const payload = {
        ...formData,
        age: parseInt(formData.age, 10),
      };

      const response = await aiAPI.predict(payload);
      setResult(response.data.data);
      toast.success('AI Clinical Evaluation complete');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to get AI prediction');
    } finally {
      setLoading(false);
    }
  };

  const getTriageBadge = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-500/15 border-rose-500/30 text-rose-600 dark:text-rose-400',
          indicator: 'bg-rose-500',
          label: 'Critical Priority',
        };
      case 'MODERATE':
        return {
          bg: 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-400',
          indicator: 'bg-amber-500',
          label: 'Moderate Priority',
        };
      case 'LOW':
        return {
          bg: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-400',
          indicator: 'bg-emerald-500',
          label: 'Low Priority',
        };
      default:
        return {
          bg: 'bg-blue-500/15 border-blue-500/30 text-blue-600 dark:text-blue-400',
          indicator: 'bg-blue-500',
          label: level || 'Standard Priority',
        };
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xs flex-shrink-0">
            <Bot size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">
              AI Disease & Triage Prediction
            </h1>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
              Machine-learning clinical evaluation for symptom analysis and triage guidance
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-2 self-start sm:self-auto px-3 py-1 rounded-full text-xs font-semibold bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)]">
          <Sparkles size={13} className="text-blue-500" />
          <span>Diagnostic Support Model</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* FORM SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center gap-2 pb-4 mb-5 border-b border-[var(--border-color)]">
              <Activity size={18} className="text-blue-600 dark:text-blue-400" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Patient Triage Intake
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Presenting Symptoms <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={formData.symptoms}
                  onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                  placeholder="e.g. Acute crushing retrosternal chest pain, radiating down left arm, diaphoresis, shortness of breath..."
                  className="w-full p-3.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--primary-500)]/20 focus:border-[var(--primary-500)] resize-y min-h-[6.5rem] leading-relaxed"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    Age (Years) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Calendar
                      size={15}
                      className="absolute top-1/2 -translate-y-1/2 left-3.5 text-[var(--text-muted)] pointer-events-none"
                    />
                    <input
                      type="number"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      placeholder="e.g. 58"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:ring-2 focus:ring-[var(--primary-500)]/20 focus:border-[var(--primary-500)]"
                      required
                      min="0"
                      max="120"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                    Biological Sex
                  </label>
                  <div className="relative">
                    <User
                      size={15}
                      className="absolute top-1/2 -translate-y-1/2 left-3.5 text-[var(--text-muted)] pointer-events-none"
                    />
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl text-sm bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--primary-500)]/20 focus:border-[var(--primary-500)] cursor-pointer"
                    >
                      <option value="Male" className="bg-[var(--bg-card)] text-[var(--text-primary)]">Male</option>
                      <option value="Female" className="bg-[var(--bg-card)] text-[var(--text-primary)]">Female</option>
                      <option value="Other" className="bg-[var(--bg-card)] text-[var(--text-primary)]">Other / Unspecified</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
                  Relevant Medical History (Optional)
                </label>
                <textarea
                  value={formData.medical_history}
                  onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                  placeholder="e.g. Type 2 Diabetes, Hypertension, Coronary Artery Disease, prior CABG..."
                  className="w-full p-3.5 bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--primary-500)]/20 focus:border-[var(--primary-500)] resize-y min-h-[4.5rem] leading-relaxed"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-6 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 bg-[var(--primary-600)] hover:bg-[var(--primary-500)] active:scale-[0.99] transition-all disabled:opacity-50 shadow-xs"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={17} className="animate-spin" />
                      <span>Evaluating Clinical Biomarkers...</span>
                    </>
                  ) : (
                    <>
                      <Bot size={17} />
                      <span>Run Clinical ML Prediction</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>

        {/* RESULTS SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col min-h-[380px]"
        >
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--border-color)]">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                AI Diagnostic & Triage Report
              </h2>
            </div>

            {result && (
              <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                Model Verified
              </span>
            )}
          </div>

          {!result && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-tertiary)]/40">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-[var(--bg-secondary)] text-[var(--text-muted)] mb-3">
                <FileText size={24} />
              </div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Awaiting Clinical Input
              </p>
              <p className="text-xs text-[var(--text-muted)] max-w-xs mt-1 leading-relaxed">
                Provide patient symptoms, age, and relevant history to calculate disease likelihood and triage priority.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="w-12 h-12 border-3 border-[var(--primary-600)] border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-sm font-bold text-[var(--text-primary)]">
                Evaluating Clinical Biomarkers...
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">
                Querying medical neural network across differential diagnoses.
              </p>
            </div>
          )}

          {result && !loading && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4 flex-1 flex flex-col justify-between"
            >
              <div className="space-y-4">
                {/* PREDICTED CONDITION */}
                <div className="p-4 rounded-xl border border-blue-500/25 bg-blue-500/10">
                  <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider block">
                    Primary Predicted Condition
                  </span>
                  <h3 className="text-xl font-bold text-[var(--text-primary)] mt-1">
                    {result.predicted_disease}
                  </h3>
                </div>

                {/* METRICS ROW */}
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] flex flex-col">
                    <span className="text-xs text-[var(--text-muted)] font-medium">Model Confidence</span>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {result.confidence_score}%
                      </span>
                    </div>
                  </div>

                  {(() => {
                    const badge = getTriageBadge(result.triage_level);
                    return (
                      <div className={`p-3.5 rounded-xl border flex flex-col justify-center ${badge.bg}`}>
                        <span className="text-xs font-medium text-[var(--text-muted)]">Triage Priority</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`w-2 h-2 rounded-full ${badge.indicator}`} />
                          <span className="text-base font-bold">
                            {result.triage_level}
                          </span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* RECOMMENDED ACTION */}
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)]">
                  <div className="flex gap-2.5 items-start">
                    <AlertTriangle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <h4 className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)] mb-1">
                        Recommended Clinical Action
                      </h4>
                      <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
                        {result.recommended_action}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* DISCLAIMER */}
              <div className="text-[11px] text-center text-[var(--text-muted)] pt-3 border-t border-[var(--border-color)] leading-snug">
                * Clinical Decision Support Notice: Machine-generated recommendations assist qualified practitioners and must not substitute formal physician examination or clinical judgment.
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
