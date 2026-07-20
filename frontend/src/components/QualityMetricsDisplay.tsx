import React from 'react';
import { Award, BookOpen, AlertCircle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { QualityMetrics, LanguageInfo } from '../types';

interface Props {
  metrics: QualityMetrics;
  langInfo: LanguageInfo;
}

export default function QualityMetricsDisplay({ metrics, langInfo }: Props) {
  const score = metrics.writing_score;

  // Determine color theme based on score
  const getScoreColor = (s: number) => {
    if (s >= 90) return { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-200 dark:border-emerald-800' };
    if (s >= 70) return { text: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/30', border: 'border-amber-200 dark:border-amber-800' };
    return { text: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/30', border: 'border-rose-200 dark:border-rose-800' };
  };

  const colors = getScoreColor(score);

  const getLanguageLabel = (code: string) => {
    switch (code) {
      case 'ta': return 'Pure Tamil (தமிழ்)';
      case 'ta-Latn': return 'Tanglish / Romanized Tamil (தமிழ்-ஆங்கிலம்)';
      case 'en': return 'English (ஆங்கிலம்)';
      default: return code.toUpperCase();
    }
  };

  return (
    <div id="quality-metrics-display" className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
      {/* 1. Writing Quality Score Card */}
      <div className={`p-6 rounded-2xl border ${colors.bg} ${colors.border} flex items-center justify-between`}>
        <div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Writing Quality</h3>
          <p className="text-4xl font-extrabold mt-1 tracking-tight">{score}%</p>
          <p className="text-xs text-slate-500 mt-1">
            {score >= 90 ? 'Excellent terminology flow!' : score >= 70 ? 'Good, but has English/slang loan words.' : 'Needs significant localization.'}
          </p>
        </div>
        <div className="relative flex items-center justify-center">
          <svg className="w-20 h-20 transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r="34"
              className="stroke-slate-200 dark:stroke-slate-800"
              strokeWidth="6"
              fill="transparent"
            />
            <circle
              cx="40"
              cy="40"
              r="34"
              className="stroke-emerald-500"
              strokeWidth="6"
              fill="transparent"
              strokeDasharray={2 * Math.PI * 34}
              strokeDashoffset={2 * Math.PI * 34 * (1 - score / 100)}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute font-semibold text-sm">{score}</div>
        </div>
      </div>

      {/* 2. Detected Language & Profile Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-4">
        <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl text-indigo-500">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Detected Language</h3>
          <p className="text-lg font-semibold mt-1 text-slate-800 dark:text-slate-200">
            {getLanguageLabel(langInfo.detected_language)}
          </p>
          <div className="flex gap-2 items-center mt-1">
            <span className="text-xs text-slate-500">Confidence: {(langInfo.confidence * 100).toFixed(0)}%</span>
            {langInfo.contains_tanglish && (
              <span className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded text-[10px] font-medium uppercase">
                Tanglish Matches
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3. Readability & Statistics Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-4">
        <div className="p-3 bg-teal-50 dark:bg-teal-950/30 rounded-xl text-teal-500">
          <Award className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Readability & Issues</h3>
          <p className="text-lg font-semibold mt-1 text-slate-800 dark:text-slate-200">
            {metrics.readability_level} Complexity
          </p>
          <div className="flex gap-2 items-center mt-1">
            <span className="text-xs font-semibold text-rose-500 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5" /> {metrics.grammar_errors_count} flag(s) raised
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
