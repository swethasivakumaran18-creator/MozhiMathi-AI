import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Copy, Check, FileText, AlertTriangle, Info, 
  Settings, Award, ShieldCheck, CheckCircle2, RotateCcw, 
  ArrowRight, Bold, Italic, Code, Play, Terminal, Wand2, Plus,
  ChevronDown
} from 'lucide-react';
import { LintResponse, LintWarning } from '../types';
import { LinterHighlighter } from './TipTapHighlighter';

interface Props {
  onLintSuccess?: (response: LintResponse) => void;
  initialText?: string;
  onTextChange?: (text: string) => void;
  initialResult?: LintResponse | null;
  onResultChange?: (result: LintResponse | null) => void;
}

export default function LinterPanel({ 
  onLintSuccess,
  initialText = '',
  onTextChange,
  initialResult = null,
  onResultChange
}: Props) {
  const [text, setText] = useState<string>(initialText);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<LintResponse | null>(initialResult);
  const [error, setError] = useState<string | null>(null);
  const [copiedText, setCopiedText] = useState<'pure' | 'phonetic' | null>(null);

  // Hover card overlay positioning states
  const [activeWarning, setActiveWarning] = useState<LintWarning | null>(null);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const [hoverRange, setHoverRange] = useState<{ from: number; to: number } | null>(null);

  // Dev Sim Terminal state
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [isBuilding, setIsBuilding] = useState<boolean>(false);

  // Draft selector states
  const [activeDraftType, setActiveDraftType] = useState<'pure' | 'phonetic' | 'english'>('pure');
  const [showDraftDropdown, setShowDraftDropdown] = useState<boolean>(false);

  // Autocomplete Suggestions States
  const [suggestions, setSuggestions] = useState<Array<{ text: string; confidence: number }>>([]);
  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState<number>(0);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [suggestionRect, setSuggestionRect] = useState<{ top: number; left: number } | null>(null);
  const [autocompleteLoading, setAutocompleteLoading] = useState<boolean>(false);

  const suggestionsRef = useRef(suggestions);
  const showSuggestionsRef = useRef(showSuggestions);
  const activeIdxRef = useRef(activeSuggestionIdx);

  useEffect(() => {
    suggestionsRef.current = suggestions;
  }, [suggestions]);

  useEffect(() => {
    showSuggestionsRef.current = showSuggestions;
  }, [showSuggestions]);

  useEffect(() => {
    activeIdxRef.current = activeSuggestionIdx;
  }, [activeSuggestionIdx]);

  // Load workspace slots from localStorage or default to [1, 2, 3]
  const [workspaces, setWorkspaces] = useState<number[]>(() => {
    const cached = localStorage.getItem('linter_workspaces');
    return cached ? JSON.parse(cached) : [1, 2, 3];
  });

  // Active Preset Index state
  const [activePresetIndex, setActivePresetIndex] = useState<number>(() => {
    const cachedActive = Number(localStorage.getItem('linter_active_preset') || '1');
    const initialList = localStorage.getItem('linter_workspaces') 
      ? JSON.parse(localStorage.getItem('linter_workspaces')!) 
      : [1, 2, 3];
    return initialList.includes(cachedActive) ? cachedActive : initialList[0] || 1;
  });

  const hoverTimeoutRef = useRef<any>(null);

  // Callback passed to TipTap highlighter to detect mouse hover
  const handleHoverWarning = useCallback((
    warning: LintWarning | null,
    rect: DOMRect | null,
    range: { from: number; to: number } | null
  ) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }

    if (warning && rect) {
      setActiveWarning(warning);
      setHoverRect(rect);
      setHoverRange(range);
    } else {
      // Small timeout to allow user to move mouse over the popover card
      hoverTimeoutRef.current = setTimeout(() => {
        setActiveWarning(null);
        setHoverRect(null);
        setHoverRange(null);
      }, 200);
    }
  }, []);

  // Initialize TipTap Editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      LinterHighlighter.configure({
        warnings: initialResult ? initialResult.warnings : [],
        onHoverWarning: handleHoverWarning,
      }),
    ],
    content: `<p>${initialText}</p>`,
    editorProps: {
      attributes: {
        class: 'focus:outline-none min-h-[220px] max-h-[400px] overflow-y-auto p-4 text-sm leading-relaxed text-slate-800 dark:text-slate-200',
      },
      handleKeyDown: (view, event) => {
        if (showSuggestionsRef.current && suggestionsRef.current.length > 0) {
          if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveSuggestionIdx(prev => (prev + 1) % suggestionsRef.current.length);
            return true;
          }
          if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveSuggestionIdx(prev => (prev - 1 + suggestionsRef.current.length) % suggestionsRef.current.length);
            return true;
          }
          if (event.key === 'Tab' || event.key === 'Enter') {
            event.preventDefault();
            insertSuggestion(suggestionsRef.current[activeIdxRef.current].text);
            return true;
          }
          if (event.key === 'Escape') {
            event.preventDefault();
            setShowSuggestions(false);
            return true;
          }
        }
        return false;
      }
    },
    onBlur: () => {
      setTimeout(() => setShowSuggestions(false), 200);
    },
    onUpdate: ({ editor }) => {
      const plainText = editor.getText();
      setText(plainText);
      if (onTextChange) onTextChange(plainText);
      
      // Save current text to active preset in localStorage
      const activeIdx = Number(localStorage.getItem('linter_active_preset') || '1');
      localStorage.setItem(`linter_preset_${activeIdx}`, plainText);
    },
  });

  const insertSuggestion = (suggestionText: string) => {
    if (!editor) return;
    
    const { state } = editor;
    const { selection } = state;
    const anchor = selection.anchor;
    
    const textBefore = editor.getText().substring(0, anchor - 1);
    const words = textBefore.split(/\s+/);
    const lastWord = words[words.length - 1] || "";
    
    const startPos = anchor - lastWord.length;
    const endPos = anchor;
    
    editor.chain()
      .focus()
      .insertContentAt({ from: startPos, to: endPos }, suggestionText + " ")
      .run();
      
    setShowSuggestions(false);
  };

  const fetchAutocomplete = async (tier: 'db' | 'llm') => {
    if (!editor) return;
    
    const { state } = editor;
    const { selection } = state;
    const anchor = selection.anchor;
    const textBefore = editor.getText().substring(0, anchor - 1);
    
    if (!textBefore.trim() || anchor <= 1) {
      setShowSuggestions(false);
      return;
    }
    
    try {
      setAutocompleteLoading(true);
      const res = await fetch('/api/editor/next-word', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: editor.getText(),
          cursorPosition: anchor - 1,
          tier: tier
        })
      });
      
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      if (data.suggestions && data.suggestions.length > 0) {
        setSuggestions(data.suggestions);
        setActiveSuggestionIdx(0);
        
        const coordinates = editor.view.coordsAtPos(anchor);
        const editorEl = document.getElementById('tiptap-editor-container');
        if (editorEl && coordinates) {
          const rect = editorEl.getBoundingClientRect();
          const topPos = coordinates.top - rect.top + editorEl.scrollTop + 22;
          const leftPos = coordinates.left - rect.left;
          
          setSuggestionRect({
            top: topPos,
            left: Math.max(8, Math.min(leftPos, rect.width - 240))
          });
          setShowSuggestions(true);
        }
      } else {
        setShowSuggestions(false);
      }
    } catch (err) {
      setShowSuggestions(false);
    } finally {
      setAutocompleteLoading(false);
    }
  };

  useEffect(() => {
    if (!editor) return;
    
    const dbTimeout = setTimeout(() => {
      fetchAutocomplete('db');
    }, 200);
    
    const llmTimeout = setTimeout(() => {
      fetchAutocomplete('llm');
    }, 1000);
    
    return () => {
      clearTimeout(dbTimeout);
      clearTimeout(llmTimeout);
    };
  }, [text, editor?.state.selection.anchor]);

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
      if (onResultChange) onResultChange(data);

      // Save results to active workspace in localStorage
      const activeIdx = Number(localStorage.getItem('linter_active_preset') || '1');
      localStorage.setItem(`linter_preset_result_${activeIdx}`, JSON.stringify(data));
      
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

  // Load initial preset content when editor is ready
  useEffect(() => {
    if (editor) {
      const activeIdx = Number(localStorage.getItem('linter_active_preset') || '1');
      loadPreset(activeIdx);
    }
  }, [editor]);

  // Handle Preset Selection
  const loadPreset = (index: number) => {
    if (!editor) return;
    setActivePresetIndex(index);
    localStorage.setItem('linter_active_preset', index.toString());
    const presetText = localStorage.getItem(`linter_preset_${index}`) || '';
    
    // Load cached lint result if available
    let cachedResult: LintResponse | null = null;
    const cachedResultStr = localStorage.getItem(`linter_preset_result_${index}`);
    if (cachedResultStr) {
      try {
        cachedResult = JSON.parse(cachedResultStr);
      } catch (e) {
        cachedResult = null;
      }
    }
    
    editor.commands.setContent(`<p>${presetText}</p>`);
    setText(presetText);
    if (onTextChange) onTextChange(presetText);
    
    setResult(cachedResult);
    if (onResultChange) onResultChange(cachedResult);
    
    // Update TipTap decorations
    const warningsList = cachedResult ? cachedResult.warnings : [];
    (editor as any).setOptions({
      linterHighlighter: {
        warnings: warningsList,
      }
    });
    editor.view.dispatch(editor.state.tr);
  };

  const addWorkspace = () => {
    const nextId = workspaces.length > 0 ? Math.max(...workspaces) + 1 : 1;
    const updated = [...workspaces, nextId];
    setWorkspaces(updated);
    localStorage.setItem('linter_workspaces', JSON.stringify(updated));
    loadPreset(nextId);
  };

  const removeWorkspace = (id: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent selecting the tab while deleting
    if (workspaces.length <= 1) return;
    
    const updated = workspaces.filter(w => w !== id);
    setWorkspaces(updated);
    localStorage.setItem('linter_workspaces', JSON.stringify(updated));
    
    localStorage.removeItem(`linter_preset_${id}`);
    localStorage.removeItem(`linter_preset_result_${id}`);
    
    if (activePresetIndex === id) {
      const fallbackId = updated[0];
      loadPreset(fallbackId);
    }
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
            
            {/* Workspaces selector */}
            <div className="flex items-center gap-2 flex-nowrap max-w-full">
              <div className="flex items-center gap-1 shrink-0" title="Each slot acts as a separate text editor draft. Switch between them to work on multiple translations. Your content is automatically saved to browser storage.">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Workspaces:</span>
                <Info className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-500 cursor-help transition-colors" />
              </div>
              
              {/* Scrollable tabs container */}
              <div className="flex items-center gap-1.5 overflow-x-auto overflow-y-hidden max-w-[120px] sm:max-w-[240px] md:max-w-[340px] scrollbar-none py-1 flex-nowrap">
                {workspaces.map((idx) => (
                  <div
                    key={idx}
                    onClick={() => loadPreset(idx)}
                    className={`group relative text-[11px] px-2.5 py-1 rounded-lg border transition cursor-pointer font-bold flex items-center gap-1.5 shrink-0 ${
                      activePresetIndex === idx
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-emerald-500/50'
                    }`}
                    title={`Workspace Slot ${idx} - Auto-saved to browser`}
                  >
                    <span>Slot {idx}</span>
                    {workspaces.length > 1 && (
                      <button
                        onClick={(e) => removeWorkspace(idx, e)}
                        className={`text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center transition-colors cursor-pointer ${
                          activePresetIndex === idx
                            ? 'hover:bg-emerald-700 text-emerald-100 hover:text-white'
                            : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600'
                        }`}
                        title="Remove workspace"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Add Workspace Button */}
              <button
                onClick={addWorkspace}
                className="p-1 rounded-lg border border-dashed border-slate-200 dark:border-slate-700 hover:border-emerald-500 hover:text-emerald-500 text-slate-400 transition cursor-pointer shrink-0"
                title="Add new workspace slot"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
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
          <div id="tiptap-editor-container" className="flex-grow min-h-[220px] bg-slate-50/20 dark:bg-slate-950/5 relative overflow-y-auto">
            <EditorContent editor={editor} />

            {/* Autocomplete floating suggestions overlay */}
            {showSuggestions && suggestions.length > 0 && suggestionRect && (
              <div
                className="absolute z-50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200/80 dark:border-slate-800/80 rounded-2xl shadow-xl p-1.5 flex flex-col gap-0.5 min-w-[220px] transition-all duration-150 animate-in fade-in slide-in-from-top-2"
                style={{
                  top: `${suggestionRect.top}px`,
                  left: `${suggestionRect.left}px`,
                }}
              >
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => insertSuggestion(item.text)}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-all gap-4 cursor-pointer ${
                      idx === activeSuggestionIdx
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{item.text}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                      idx === activeSuggestionIdx
                        ? 'bg-emerald-700/60 text-emerald-100'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'
                    }`}>
                      {Math.round(item.confidence * 100)}%
                    </span>
                  </button>
                ))}
                <div className="border-t border-slate-100 dark:border-slate-800/60 mt-1 px-3 py-1 text-[9px] text-slate-400 font-semibold flex items-center justify-between">
                  <span>↑↓ Navigate</span>
                  <span>Tab Accept</span>
                </div>
              </div>
            )}
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
            <div className="flex flex-wrap justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800 gap-4">
              <div className="flex items-center gap-3">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4 text-emerald-500 animate-pulse" /> Unified Refactored Drafts
                </h4>
                
                {/* Custom dropdown selector */}
                <div className="relative inline-block text-left">
                  <button
                    type="button"
                    onClick={() => setShowDraftDropdown(prev => !prev)}
                    className="flex items-center justify-between gap-1.5 px-3 py-1.5 bg-slate-50/50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:border-emerald-500/50 transition cursor-pointer"
                  >
                    <span>
                      {activeDraftType === 'pure' && 'Pure Tamil'}
                      {activeDraftType === 'phonetic' && 'Phonetic Rhythm'}
                      {activeDraftType === 'english' && 'Pure English'}
                    </span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${showDraftDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {showDraftDropdown && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setShowDraftDropdown(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -4 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -4 }}
                          transition={{ duration: 0.15 }}
                          className="absolute left-0 mt-2 w-56 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xl z-20 p-1.5 flex flex-col gap-0.5"
                        >
                          {[
                            { id: 'pure', label: 'Pure Tamil Translation' },
                            { id: 'phonetic', label: 'Tamil-English Phonetic Rhythm' },
                            { id: 'english', label: 'Pure English Translation' }
                          ].map(opt => (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => {
                                setActiveDraftType(opt.id as any);
                                setShowDraftDropdown(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                                activeDraftType === opt.id
                                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-950/20'
                              }`}
                            >
                              <span>{opt.label}</span>
                              {activeDraftType === opt.id && <Check className="w-3.5 h-3.5 text-emerald-500" />}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              <button
                onClick={() => {
                  const content = 
                    activeDraftType === 'pure' ? result.suggested_rewrite_pure :
                    activeDraftType === 'phonetic' ? result.suggested_rewrite_phonetic :
                    result.suggested_rewrite_english;
                  copyToClipboard(activeDraftType as any, content);
                }}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedText === activeDraftType ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedText === activeDraftType ? 'Copied to Clipboard' : 'Copy Active Draft'}
              </button>
            </div>
            
            <div className="p-5 bg-slate-50/50 dark:bg-slate-950/15 border border-slate-100 dark:border-slate-800/80 rounded-3xl min-h-[100px] flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3 inline-block">
                  {activeDraftType === 'pure' && 'Pure Classical Synonyms Translation'}
                  {activeDraftType === 'phonetic' && 'Tamil-English Phonetic Rhythm Translation'}
                  {activeDraftType === 'english' && 'Pure English Translation'}
                </span>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {activeDraftType === 'pure' && result.suggested_rewrite_pure}
                  {activeDraftType === 'phonetic' && result.suggested_rewrite_phonetic}
                  {activeDraftType === 'english' && result.suggested_rewrite_english}
                </p>
              </div>
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
        {(() => {
          if (!activeWarning || !hoverRect) return null;
          
          // Width clamping math for full responsiveness on all screen sizes
          const cardWidth = Math.min(288, window.innerWidth - 24);
          const halfWidth = cardWidth / 2;
          const targetLeft = hoverRect.left + (hoverRect.width / 2);
          const minLeft = 12 + halfWidth;
          const maxLeft = window.innerWidth - 12 - halfWidth;
          const safeLeft = Math.max(minLeft, Math.min(maxLeft, targetLeft));
          const delta = targetLeft - safeLeft;
          const arrowOffsetPercent = 50 + (delta / cardWidth) * 100;
          
          return (
            <div
              id="hover-card-popover"
              className="fixed z-50 pointer-events-auto"
              style={{
                top: `${hoverRect.bottom + 8}px`,
                left: `${safeLeft}px`,
                transform: 'translateX(-50%)',
                width: `${cardWidth}px`
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 5 }}
                transition={{ duration: 0.12 }}
                className="w-full bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl p-4 flex flex-col gap-3 leading-relaxed relative"
                onMouseEnter={() => {
                  if (hoverTimeoutRef.current) {
                    clearTimeout(hoverTimeoutRef.current);
                    hoverTimeoutRef.current = null;
                  }
                }}
                onMouseLeave={() => {
                  setActiveWarning(null);
                  setHoverRect(null);
                  setHoverRange(null);
                }}
              >
                {/* Tooltip triangle arrow */}
                <div 
                  className="absolute top-0 transform -translate-x-1/2 -translate-y-full border-4 border-transparent border-b-slate-900"
                  style={{ left: `${arrowOffsetPercent}%` }}
                ></div>

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
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
