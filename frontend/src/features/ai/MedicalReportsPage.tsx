/**
 * Aegis AI – Medical Reports Page
 *
 * Upload, view, and analyze medical reports using AI.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, UploadCloud, File, Trash2, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '@/api/client';

export default function MedicalReportsPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png'];
    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Invalid file type. Please upload a PDF, JPG, or PNG.');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      toast.error('File is too large. Maximum size is 10MB.');
      return;
    }

    setFile(selectedFile);
    setResult(null);
  };

  const handleUpload = async () => {
    if (!file) return;

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/ai/analyze-report', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setResult(response.data.data.analysis);
      toast.success('Report analyzed successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to analyze report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-[var(--accent-500)]/10 text-[var(--accent-400)] border border-[var(--accent-500)]/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]">
            <FileText size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Medical Reports</h1>
            <p className="text-gray-400 text-sm mt-1">AI-powered OCR and Natural Language Processing for health records</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Upload Section */}
        <div className="glass-card p-6 h-fit">
          <h2 className="text-lg font-semibold mb-6">Upload New Report</h2>

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 mb-6 ${isDragging
                ? 'border-[var(--primary-400)] bg-[var(--primary-500)]/5'
                : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:border-[var(--primary-400)]/50'
              }`}
          >
            <input
              type="file"
              id="file-upload"
              className="hidden"
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png"
            />

            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] flex items-center justify-center mb-4 text-[var(--primary-400)]">
                <UploadCloud size={32} />
              </div>
              <h3 className="text-base font-semibold text-white mb-1">Click to upload or drag and drop</h3>
              <p className="text-sm text-gray-400">PDF, JPG or PNG (max. 10MB)</p>
            </label>
          </div>

          <AnimatePresence>
            {file && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] mb-6 flex items-center justify-between"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <File size={24} className="text-[var(--primary-400)] flex-shrink-0" />
                  <div className="truncate">
                    <p className="text-sm font-medium text-white truncate">{file.name}</p>
                    <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button
                  onClick={() => { setFile(null); setResult(null); }}
                  className="p-2 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-400/10 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            onClick={handleUpload}
            disabled={!file || loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full py-3 rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, var(--accent-600), var(--accent-500))', boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)' }}
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="animate-spin" /> Analyzing Report...
              </>
            ) : (
              <>
                <ShieldCheck size={18} /> Process with AI
              </>
            )}
          </motion.button>
        </div>

        {/* Results Section */}
        <div className="glass-card flex flex-col overflow-hidden">
          <div className="p-6 border-b border-[var(--border-color)]">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <ShieldCheck size={20} className="text-[var(--accent-400)]" />
              AI Analysis Results
            </h2>
          </div>

          <div className="p-6 flex-1 bg-[var(--bg-tertiary)] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {!result && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                <FileText size={48} className="text-gray-500 mb-4 opacity-50" />
                <p className="text-gray-400">Upload a report to see AI extracted metrics and summaries.</p>
              </div>
            )}

            {loading && (
              <div className="h-full flex flex-col items-center justify-center">
                <div className="w-12 h-12 border-4 border-t-[var(--accent-500)] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mb-4" />
                <p className="text-[var(--accent-400)] animate-pulse font-medium">Extracting medical text...</p>
              </div>
            )}

            {result && !loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">Summary</h3>
                  <div className="p-4 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)]">
                    <p className="text-sm leading-relaxed text-gray-200">{result.summary}</p>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-3">Key Metrics</h3>
                  <div className="space-y-3">
                    {result.key_metrics.map((metric: any, index: number) => (
                      <div key={index} className="p-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-between">
                        <div>
                          <p className="font-medium text-sm text-white">{metric.metric}</p>
                          <p className="text-xs text-gray-400">Normal Range: {metric.normal_range}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-sm text-white">{metric.value}</p>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${metric.status.toLowerCase() === 'normal'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}>
                            {metric.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-2">AI Recommendations</h3>
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <div className="flex gap-3">
                      <AlertCircle size={20} className="text-amber-400 flex-shrink-0" />
                      <p className="text-sm leading-relaxed text-amber-200">{result.recommendations}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
