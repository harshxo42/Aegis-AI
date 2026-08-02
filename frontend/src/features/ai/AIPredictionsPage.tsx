/**
 * Aegis AI – AI Predictions Page
 *
 * Predict disease and urgency level based on symptoms using ML.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, Activity, AlertTriangle, User, Calendar, Bot, RefreshCw } from 'lucide-react';
import api from '@/api/client';
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
      
      const response = await api.post('/ai/predict', payload);
      setResult(response.data.data);
      toast.success('AI Prediction complete');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to get AI prediction');
    } finally {
      setLoading(false);
    }
  };

  const getTriageColor = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'var(--danger-500)';
      case 'MODERATE': return 'var(--warning-500)';
      case 'LOW': return 'var(--accent-500)';
      default: return 'var(--primary-500)';
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[var(--primary-500)]/10 text-[var(--primary-400)] border border-[var(--primary-500)]/20 shadow-[0_0_20px_rgba(59,130,246,0.15)]">
          <Bot size={32} />
        </div>
        <div>
          <h1 className="text-2xl font-bold">AI Disease Prediction</h1>
          <p className="text-gray-400 text-sm mt-1">Analyze symptoms for early detection and triage recommendations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form Section */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6"
        >
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <Activity size={20} className="text-[var(--primary-400)]" />
            Patient Information
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-300">Symptoms</label>
              <textarea
                value={formData.symptoms}
                onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })}
                placeholder="E.g. severe chest pain, shortness of breath, radiating pain to left arm..."
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--primary-500)] resize-none h-28"
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-300">Age</label>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="number"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    placeholder="Years"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--primary-500)]"
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                    required
                    min="0"
                    max="120"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-gray-300">Gender</label>
                <div className="relative">
                  <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" />
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--primary-500)] appearance-none cursor-pointer"
                    style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5 text-gray-300">Medical History (Optional)</label>
              <textarea
                value={formData.medical_history}
                onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                placeholder="E.g. hypertension, diabetes, previous surgeries..."
                className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all focus:ring-2 focus:ring-[var(--primary-500)] resize-none h-20"
                style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}
              />
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 mt-4"
              style={{ background: 'linear-gradient(135deg, var(--primary-600), var(--primary-500))', boxShadow: '0 4px 15px rgba(59, 130, 246, 0.3)' }}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" /> Analyzing Symptoms...
                </>
              ) : (
                <>
                  <Bot size={18} /> Run AI Analysis
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        {/* Results Section */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6 flex flex-col"
        >
          <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <ShieldCheck size={20} className="text-emerald-400" />
            AI Diagnosis Results
          </h2>

          {!result && !loading && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-[var(--border-color)] rounded-xl opacity-60">
              <Bot size={48} className="text-gray-500 mb-4 opacity-50" />
              <p className="text-gray-400">Submit patient symptoms to generate an AI prediction</p>
            </div>
          )}

          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center">
              <div className="w-16 h-16 border-4 border-t-[var(--primary-500)] border-r-[var(--accent-500)] border-b-transparent border-l-transparent rounded-full animate-spin mb-4" />
              <p className="text-[var(--primary-400)] animate-pulse font-medium">Processing Neural Networks...</p>
            </div>
          )}

          {result && !loading && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 flex-1"
            >
              {/* Disease */}
              <div className="text-center p-6 rounded-xl border" style={{ background: 'rgba(59, 130, 246, 0.05)', borderColor: 'rgba(59, 130, 246, 0.2)' }}>
                <p className="text-sm text-[var(--primary-400)] font-medium mb-1 uppercase tracking-wider">Predicted Condition</p>
                <h3 className="text-2xl font-bold text-white">{result.predicted_disease}</h3>
              </div>

              {/* Confidence & Triage */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] flex flex-col items-center justify-center text-center">
                  <span className="text-xs text-gray-400 mb-1">Confidence Score</span>
                  <span className="text-3xl font-bold text-emerald-400">{result.confidence_score}%</span>
                </div>
                <div 
                  className="p-4 rounded-xl border flex flex-col items-center justify-center text-center"
                  style={{ 
                    borderColor: `${getTriageColor(result.triage_level)}40`,
                    background: `${getTriageColor(result.triage_level)}10` 
                  }}
                >
                  <span className="text-xs text-gray-400 mb-1">Triage Priority</span>
                  <span className="text-xl font-bold" style={{ color: getTriageColor(result.triage_level) }}>
                    {result.triage_level}
                  </span>
                </div>
              </div>

              {/* Recommendation */}
              <div className="p-5 rounded-xl border" style={{ borderColor: 'var(--border-color)', background: 'var(--bg-tertiary)' }}>
                <div className="flex gap-3">
                  <AlertTriangle size={24} className="flex-shrink-0" style={{ color: getTriageColor(result.triage_level) }} />
                  <div>
                    <h4 className="font-semibold text-sm mb-1 text-gray-200">Recommended Action</h4>
                    <p className="text-sm text-gray-400 leading-relaxed">{result.recommended_action}</p>
                  </div>
                </div>
              </div>
              
              <div className="text-xs text-center text-gray-500 pt-4 border-t border-[var(--border-color)]">
                * This is an AI generated prediction and should not replace professional medical diagnosis.
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
