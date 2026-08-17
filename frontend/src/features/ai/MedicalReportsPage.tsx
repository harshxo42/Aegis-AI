/**
 * Aegis AI – Medical Reports OCR & NLP Analysis Page
 *
 * Upload, parse, and analyze diagnostic medical reports using clinical AI models.
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  UploadCloud,
  File,
  Trash2,
  ShieldCheck,
  AlertCircle,
  RefreshCw,
  Sparkles,
  FileType,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { aiAPI } from '@/api/client';

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

      const response = await aiAPI.analyzeReport(formData);

      setResult(response.data.data.analysis);
      toast.success('Report analyzed successfully');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to analyze report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      {/* PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-color)]">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-xs flex-shrink-0">
            <FileText size={24} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-[var(--text-primary)] leading-tight">
                Medical Records & Diagnostic Analysis
              </h1>
              <span className="inline-flex items-center gap-1 text-[11px] px-2.5 py-0.5 rounded-full font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                OCR Active
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[var(--text-muted)] mt-0.5">
              Automated clinical NLP extraction, abnormal biomarker detection, and structured summaries
            </p>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[var(--bg-tertiary)] border border-[var(--border-color)] text-[var(--text-secondary)] self-start sm:self-auto">
          <Sparkles size={13} className="text-blue-500" />
          <span>Clinical NLP Engine</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* UPLOAD SECTION */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between h-fit space-y-5">
          <div>
            <div className="flex items-center gap-2 pb-4 mb-4 border-b border-[var(--border-color)]">
              <FileType size={18} className="text-blue-600 dark:text-blue-400" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Document Intake
              </h2>
            </div>

            {/* DROP ZONE */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-7 text-center transition-all duration-150 ${
                isDragging
                  ? 'border-[var(--primary-500)] bg-[var(--primary-500)]/10'
                  : 'border-[var(--border-color)] bg-[var(--bg-tertiary)] hover:border-[var(--primary-500)]/50 hover:bg-[var(--bg-hover)]'
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
                <div className="w-14 h-14 rounded-2xl bg-[var(--bg-secondary)] border border-[var(--border-color)] flex items-center justify-center mb-3 text-[var(--primary-500)] shadow-xs">
                  <UploadCloud size={28} />
                </div>
                <h3 className="text-sm font-bold text-[var(--text-primary)] mb-1">
                  Click to select file or drag and drop
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Standard format: PDF, JPG, or PNG (up to 10 MB)
                </p>
              </label>
            </div>

            {/* SELECTED FILE METADATA */}
            <AnimatePresence>
              {file && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  className="mt-4 p-3.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-tertiary)] flex items-center justify-between gap-3 shadow-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                      <File size={18} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-[var(--text-primary)] truncate">
                        {file.name}
                      </p>
                      <p className="text-[11px] text-[var(--text-muted)]">
                        {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to analyze
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setFile(null);
                      setResult(null);
                    }}
                    title="Remove selected file"
                    aria-label="Remove selected file"
                    className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || loading}
            className="w-full py-3 px-6 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 bg-[var(--primary-600)] hover:bg-[var(--primary-500)] active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            {loading ? (
              <>
                <RefreshCw size={17} className="animate-spin" />
                <span>Parsing Medical Record...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={17} />
                <span>Run AI Medical Extraction</span>
              </>
            )}
          </button>
        </div>

        {/* RESULTS SECTION */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl flex flex-col overflow-hidden shadow-xs min-h-[420px]">
          <div className="p-5 sm:p-6 border-b border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Extracted Clinical Findings
              </h2>
            </div>

            {result && (
              <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                Analysis Complete
              </span>
            )}
          </div>

          <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-5">
            {!result && !loading && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-[var(--border-color)] rounded-xl bg-[var(--bg-tertiary)]/40 my-auto">
                <FileText size={40} className="text-[var(--text-muted)] mb-3 opacity-60" />
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  Awaiting Document Upload
                </p>
                <p className="text-xs text-[var(--text-muted)] max-w-xs mt-1 leading-relaxed">
                  Upload a pathology report, lab panel, or discharge summary to extract vital biomarkers and clinical insights.
                </p>
              </div>
            )}

            {loading && (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 my-auto">
                <div className="w-12 h-12 border-3 border-[var(--primary-600)] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-bold text-[var(--text-primary)]">
                  Extracting Clinical Entities...
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs">
                  Running optical character recognition and named-entity normalization.
                </p>
              </div>
            )}

            {result && !loading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-5"
              >
                {/* SUMMARY */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    Executive Clinical Summary
                  </h3>
                  <div className="p-4 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)]">
                    <p className="text-xs sm:text-sm leading-relaxed text-[var(--text-primary)]">
                      {result.summary}
                    </p>
                  </div>
                </div>

                {/* KEY METRICS */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2.5">
                    Extracted Lab & Clinical Metrics
                  </h3>
                  <div className="space-y-2.5">
                    {result.key_metrics?.map((metric: any, index: number) => {
                      const isNormal = metric.status?.toLowerCase() === 'normal';
                      return (
                        <div
                          key={index}
                          className="p-3 rounded-xl bg-[var(--bg-tertiary)] border border-[var(--border-color)] flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                              {metric.metric}
                            </p>
                            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
                              Reference Interval: {metric.normal_range}
                            </p>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <p className="font-bold text-xs sm:text-sm text-[var(--text-primary)]">
                              {metric.value}
                            </p>
                            <span
                              className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full mt-0.5 border ${
                                isNormal
                                  ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
                              }`}
                            >
                              {metric.status}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* RECOMMENDATIONS */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-2">
                    Clinical Guidance & Follow-up
                  </h3>
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/25">
                    <div className="flex gap-2.5 items-start">
                      <AlertCircle size={18} className="text-amber-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm leading-relaxed text-amber-800 dark:text-amber-300">
                        {result.recommendations}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-center text-[var(--text-muted)] pt-3 border-t border-[var(--border-color)] leading-snug">
                  * Clinical Records Notice: OCR extractions should be verified against original physical medical records.
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
