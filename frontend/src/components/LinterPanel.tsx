import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Copy, Check, FileText, AlertTriangle, Info, 
  Settings, Award, ShieldCheck, CheckCircle2, RotateCcw, 
  ArrowRight, Bold, Italic, Heading1, Heading2, List as ListIcon, 
  Code, Play, Terminal, Wand2 
} from 'lucide-react';
import { LintResponse, LintWarning } from '../types';
import { LinterHighlighter } from './TipTapHighlighter';

interface Props {
  onLintSuccess?: (response: LintResponse) => void;
}

export default function LinterPanel({ onLintSuccess }: Props) {
  const [text, setText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<LintResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<'pure' | 'phonetic' | null>(null);

  // Hover card overlay positioning states
  const [activeWarning, setActiveWarning] = useState<LintWarning | null>(null);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const [hoverRange, setHoverRange] = useState<{ from: number; to: number } | null>(null);

  // Dev Sim Terminal state
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);

  // Preset templates
  const presets = [
    {
      title: "Mixed Tanglish Code Comment",
      text: "Variable declare pannunga, appuram logic process panni client server ku database connectivity connect pannunga."
    },
    {
      title: "Sanskritized Technical Writing",
      text: "இந்த மென்பொருள் தயாரிப்பில் எங்களின் அகங்காரத்தை விடுத்து, மக்கள் வலம் வர (பிரதட்சனம்) வசதியாக செயலியை உருவாக்கியுள்ளோம்."
    },
    {
      title: "English Loan Tech Article",
      text: "New algorithm and high performance compiler features implement seiya vendum, system server configurations correct aga configure pannunga."
    }
  ];

  // Callback passed to TipTap highlighter to detect mouse hover
  const handleHoverWarning = useCallback((
    warning: LintWarning | null,
    rect: DOMRect | null,
    range: { from: number; to: number } | null
  ) => {
    setActiveWarning(warning);
    setHoverRect(rect);
    setHoverRange(range);
  }, []);

  // Initialize TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      LinterHighlighter.configure({
        warnings: [],
        onHoverWarning: handleHoverWarning,
      }),
    ],
    content: `<p>Variable declare pannunga, appuram logic process panni client server ku database connectivity connect pannunga.</p>`,
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[220px] max-h-[400px] overflow-y-auto p-4 text-sm leading-relaxed text-slate-800 dark:text-slate-200',
      },
    },
    onUpdate: ({ editor }) => {
      const plainText = editor.getText();
      setText(plainText);
    },
  });

  // Call lint API
  const handleLint = async (inputText: string) => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/linter/lint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: inputText })
      });
      if (!res.ok) throw new Error('Failed to run Tamil technical linter.');
      const data: LintResponse = await res.json();
      setResult(data);
      
      // Update our highlighter extensions with new warnings list
      if (editor) {
        (editor as any).setOptions({
          linterHighlighter: {
            warnings: data.warnings,
          }
        });
        // Force view redraw to render decorations
        editor.view.dispatch(editor.state.tr);
      }

      if (onLintSuccess) onLintSuccess(data);
    } catch (e: any) {
      setError(e.message || 'Error executing linting process.');
    } finally {
      setLoading(false);
    }
  };

  // Run initial linting
  useEffect(() => {
    if (editor && text === '') {
      const plainText = editor.getText();
      setText(plainText);
      handleLint(plainText);
    }
  }, [editor]);

  // Handle Preset Selection
  const loadPreset = (presetText: string) => {
    if (!editor) return;
    editor.commands.setContent(`<p>${presetText}</p>`);
    setText(presetText);
    handleLint(presetText);
  };

  // Replace a specific flagged range with pure Tamil equivalent
  const replaceWithPure = (pureTerm: string) => {
    if (!editor || !hoverRange) return;
    
    // Replace text inside ProseMirror ranges
    editor.commands.insertContentAt({ from: hoverRange.from, to: hoverRange.to }, pureTerm);
    
    // Hide hover card
    setActiveWarning(null);
    setHoverRect(null);
    setHoverRange(null);

    // Re-lint updated content to refresh metrics
    setTimeout(() => {
      handleLint(editor.getText());
    }, 100);
  };

  // Clean-all sweep to replace all flagged warnings in one click
  const fixAllWarnings = () => {
    if (!editor || !result || !result.warnings || result.warnings.length === 0) return;

    // To prevent position offsets shifting while performing edits,
    // we sort warnings by their indices descending (from end of doc to start)
    const sortedWarnings = [...result.warnings]
      .filter(w => w.start_index !== undefined && w.end_index !== undefined)
      .sort((a, b) => b.start_index - a.start_index);

    // Since we are applying edits sequentially using plain text coordinates first,
    // let's do this directly on the plain text representation, then set editor content!
    let updatedText = editor.getText();
    
    sortedWarnings.forEach(warn => {
      const start = warn.start_index;
      const end = warn.end_index;
      const before = updatedText.substring(0, start);
      const after = updatedText.substring(end);
      updatedText = before + warn.suggested_pure_term + after;
    });

    editor.commands.setContent(`<p>${updatedText}</p>`);
    setText(updatedText);
    handleLint(updatedText);

    // Show nice builder log
    setTerminalLogs(prev => [
      ...prev,
      `[info] Swapped ${sortedWarnings.length} loan words with classical synonyms automatically.`
    ]);
  };

  // CI/CD Pipeline simulation log
  const simulatePipeline = () => {
    if (!result) return;
    setIsBuilding(true);
    setTerminalLogs([]);
    const logs = [
      "🔄 Initializing git pre-commit hook validation...",
      `📂 Scanning file buffer: index.ts (${text.length} characters)`,
      "🚀 Executing Hybrid Matcher Lexicon scoring...",
      `📊 Technical Score evaluated: ${result.quality_metrics.writing_score}%`,
      result.quality_metrics.writing_score >= 80 
        ? "✅ Purity Threshold PASSED (Min 80%)" 
        : "⚠️ Purity Threshold FAILED (Min 80%) - Found loan jargon",
    ];

    let delay = 0;
    logs.forEach((log, idx) => {
      setTimeout(() => {
        setTerminalLogs(prev => [...prev, log]);
        if (idx === logs.length - 1) {
          setIsBuilding(false);
        }
      }, delay);
      delay += 400;
    });
  };

  const copyToClipboard = (type: 'pure' | 'phonetic', content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedText(type);
    setTimeout(() => setCopiedText(null), 2000);
  };

  return (
    <div id="linter-workspace" className="grid grid-cols-1 xl:grid-cols-12 gap-6 relative">
      {/* LEFT: Rich Text Editor Workspace (8 Columns) */}
      <div className="xl:col-span-8 flex flex-col gap-5">
        {/* Editor Wrapper */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col relative">
          
          {/* Header Banner */}
          <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap justify-between items-center gap-4 bg-slate-50/50 dark:bg-slate-950/15">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Linguistic Text Editor</h3>
            </div>
            
            {/* Presets selector */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mr-1">Presets:</span>
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => loadPreset(p.text)}
                  className="text-[11px] px-2.5 py-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:border-emerald-500/50 transition cursor-pointer font-medium"
                >
                  Preset {idx + 1}
                </button>
              ))}
            </div>
          </div>

          {/* formatting toolbar */}
          {editor && (
            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800/80 flex items-center gap-1 flex-wrap bg-white dark:bg-slate-900">
              <button
                onClick={() => editor.chain().focus().toggleBold().run()}
                className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${editor.isActive('bold') ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'text-slate-500'}`}
                title="Bold"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleItalic().run()}
                className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${editor.isActive('italic') ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'text-slate-500'}`}
                title="Italic"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
                className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${editor.isActive('heading', { level: 1 }) ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'text-slate-500'}`}
                title="Heading 1"
              >
                <Heading1 className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${editor.isActive('heading', { level: 2 }) ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'text-slate-500'}`}
                title="Heading 2"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${editor.isActive('bulletList') ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'text-slate-500'}`}
                title="Bullet List"
              >
                <ListIcon className="w-4 h-4" />
              </button>
              <button
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                className={`p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 ${editor.isActive('codeBlock') ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30' : 'text-slate-500'}`}
                title="Code Block"
              >
                <Code className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 mx-2"></div>

              <span className="text-[10px] text-slate-400 font-mono font-medium">
                {text.length} characters | {text.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
          )}

          {/* Editor Input Area */}
          <div className="flex-grow min-h-[220px] bg-slate-50/20 dark:bg-slate-950/5 relative">
            <EditorContent editor={editor} />
          </div>

          {/* Action Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-950/10 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <span className="w-2.5 h-2.5 bg-emerald-500/20 border border-emerald-500 rounded"></span> Verified equivalents
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400 ml-4">
                <span className="w-2.5 h-2.5 bg-amber-500/20 border border-amber-500 rounded"></span> AI suggestions
              </span>
            </div>

            <button
              id="editor-scan-btn"
              onClick={() => handleLint(text)}
              disabled={loading || !text.trim()}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer shadow-md disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-3 w-3 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Evaluating...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" /> Scan Document
                </>
              )}
            </button>
          </div>
        </div>

        {/* PERFECTED REWRITES BOX */}
        {result && (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                <Wand2 className="w-4 h-4 text-emerald-500 animate-pulse" /> Unified Refactored Drafts
              </h4>
              <button
                onClick={() => copyToClipboard('pure', result.suggested_rewrite_pure)}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
              >
                {copiedText === 'pure' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedText === 'pure' ? 'Copied Pure Tamil Draft' : 'Copy Pure Draft'}
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded tracking-wide uppercase mb-2 inline-block">Pure Classical Synonyms</span>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                    {result.suggested_rewrite_pure}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded tracking-wide uppercase mb-2 inline-block">Tamil-English Phonetic Rhythm</span>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed">
                    {result.suggested_rewrite_phonetic}
                  </p>
                </div>
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => copyToClipboard('phonetic', result.suggested_rewrite_phonetic)}
                    className="text-[10px] text-slate-400 font-semibold hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
                  >
                    {copiedText === 'phonetic' ? 'Copied!' : 'Copy Phonetic Draft'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Live CI/CD Pipeline Simulator */}
        {result && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg">
            <div className="flex justify-between items-center mb-4">
              <h4 className="text-xs font-bold text-slate-300 font-mono flex items-center gap-2">
                <Terminal className="w-4 h-4 text-emerald-400" /> Developer Git Hooks & Pipeline Simulation
              </h4>
              <button
                onClick={simulatePipeline}
                disabled={isBuilding}
                className="flex items-center gap-1 text-[10px] bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition cursor-pointer"
              >
                <Play className="w-3 h-3 text-emerald-400" /> {isBuilding ? "Building..." : "Run Hooks"}
              </button>
            </div>

            <div className="font-mono text-xs bg-black/40 p-4 rounded-xl text-slate-300 max-h-40 overflow-y-auto leading-relaxed border border-slate-900">
              {terminalLogs.length === 0 ? (
                <span className="text-slate-500 italic">Click "Run Hooks" to test git pre-commit rejection simulator...</span>
              ) : (
                terminalLogs.map((log, idx) => (
                  <div key={idx} className={log.includes("PASSED") || log.includes("PASSED") ? "text-emerald-400" : log.includes("FAILED") ? "text-rose-400" : "text-slate-300"}>
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* RIGHT: Analytical Dashboards & Technical Score Indicators (4 Columns) */}
      <div className="xl:col-span-4 flex flex-col gap-6">
        
        {/* Technical Score Circle Gauge */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Technical Score</span>
          
          <div className="relative w-36 h-36 flex items-center justify-center mb-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r="64"
                className="stroke-slate-100 dark:stroke-slate-800/80"
                strokeWidth="8"
                fill="transparent"
              />
              <motion.circle
                cx="72"
                cy="72"
                r="64"
                className="stroke-emerald-500"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 64}
                initial={{ strokeDashoffset: 2 * Math.PI * 64 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 64 * (1 - (result?.quality_metrics.writing_score || 75) / 100) }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-4xl font-black text-slate-900 dark:text-white font-mono">
                {result?.quality_metrics.writing_score ?? 75}%
              </span>
              <span className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">Tamil Purity</span>
            </div>
          </div>

          <div className="w-full border-t border-slate-100 dark:border-slate-800/80 pt-4 flex flex-col gap-2.5">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Detected Language:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {result?.language_info.detected_language === 'ta' ? 'Classical Tamil' : result?.language_info.detected_language === 'ta-Latn' ? 'Tanglish' : 'Multilingual Mix'}
              </span>
            </div>

            {/* Confidence Indicator */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Confidence Indicator:</span>
              <span className={`px-2 py-0.5 rounded font-bold text-[10px] uppercase ${
                (result?.language_info.confidence || 0.8) >= 0.9 
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400'
                  : 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
              }`}>
                {result ? ((result.language_info.confidence * 100).toFixed(0) + '% High') : 'Medium'}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-400 font-medium">Readability level:</span>
              <span className="font-bold text-slate-700 dark:text-slate-300">
                {result?.quality_metrics.readability_level || "Technical"} Standard
              </span>
            </div>
          </div>

          {result && result.warnings.length > 0 && (
            <button
              id="fix-all-warnings-btn"
              onClick={fixAllWarnings}
              className="w-full mt-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Sweep & Refactor All ({result.warnings.length} flags)
            </button>
          )}
        </div>

        {/* Flagged Warn Inspector Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex-grow">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" /> Active Flags ({result?.warnings.length || 0})
          </h4>

          {(!result || result.warnings.length === 0) ? (
            <div className="py-12 text-center text-slate-400 text-xs flex flex-col items-center gap-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              Document contains perfect technical classical terminology. No flags.
            </div>
          ) : (
            <div className="flex flex-col gap-3.5 max-h-[350px] overflow-y-auto pr-1">
              {result.warnings.map((warn, index) => (
                <div
                  key={index}
                  className="p-3.5 border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-950/25 rounded-xl hover:shadow-sm transition"
                >
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-[11px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded font-mono">
                      {warn.original_term}
                    </span>
                    <span className="text-[10px] text-slate-400">Match score: {warn.confidence_score}</span>
                  </div>

                  <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                    Replace with:{' '}
                    <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">{warn.suggested_pure_term}</span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed mt-1">
                    {warn.explanation}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* FLOAT HOVER CARD OVERLAY */}
      <AnimatePresence>
        {activeWarning && hoverRect && (
          <div
            id="hover-card-popover"
            className="fixed z-50 pointer-events-auto"
            style={{
              top: `${window.scrollY + hoverRect.bottom + 8}px`,
              left: `${window.scrollX + hoverRect.left + (hoverRect.width / 2)}px`,
              transform: 'translateX(-50%)'
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              transition={{ duration: 0.12 }}
              className="w-72 bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl p-4 flex flex-col gap-3 leading-relaxed relative"
              onMouseEnter={() => {}} // Keep open on hover
            >
              {/* Tooltip triangle arrow */}
              <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full border-4 border-transparent border-b-slate-900"></div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Suggested Equivalent</span>
                  {activeWarning.is_verified && (
                    <span className="flex items-center gap-0.5 text-[9px] font-bold text-emerald-400 uppercase">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                
                <h4 className="text-base font-extrabold text-emerald-400 flex items-center gap-1.5">
                  {activeWarning.suggested_pure_term}
                  <span className="text-[11px] text-slate-400 font-medium">({activeWarning.phonetic_rendering})</span>
                </h4>
              </div>

              <div className="text-xs text-slate-300">
                {activeWarning.explanation}
              </div>

              {activeWarning.example_usage && (
                <div className="text-[11px] border-t border-slate-800/80 pt-2 text-slate-400">
                  <span className="font-bold text-slate-500 block mb-0.5">Correct Usage:</span>
                  <p className="italic font-medium text-emerald-300">"{activeWarning.example_usage}"</p>
                </div>
              )}

              <button
                id="hover-card-replace-btn"
                onClick={() => replaceWithPure(activeWarning.suggested_pure_term)}
                className="w-full mt-1.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1"
              >
                Insert: {activeWarning.suggested_pure_term}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
