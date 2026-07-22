import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, BookOpen, AlertCircle, Cpu, ShieldAlert, 
  CheckCircle, Scale, Github, BookOpenCheck, Settings, 
  Search, Terminal, Code, Award 
} from 'lucide-react';
import LinterPanel from './components/LinterPanel';
import TerminologyDirectory from './components/TerminologyDirectory';
import SearchAnalysis from './components/SearchAnalysis';
import SettingsPanel from './components/SettingsPanel';
import ApiDocs from './components/ApiDocs';
import { LintResponse } from './types';

export type AppTab = 'editor' | 'dictionary' | 'search' | 'settings' | 'apidocs';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('editor');
  const [dbCount, setDbCount] = useState<number>(0);
  const [editorText, setEditorText] = useState<string>(() => {
    const activeIdx = localStorage.getItem('linter_active_preset') || '1';
    return localStorage.getItem(`linter_preset_${activeIdx}`) || '';
  });
  const [lintResult, setLintResult] = useState<LintResponse | null>(null);

  const fetchDbCount = async () => {
    try {
      // Corrected to use the standard terms list endpoint path
      const res = await fetch('/api/v1/terminology/terms?limit=1000');
      if (res.ok) {
        const data = await res.json();
        setDbCount(data.length);
      }
    } catch (e) {
      console.error('Error fetching db terms count:', e);
    }
  };

  useEffect(() => {
    fetchDbCount();
  }, []);

  return (
    <div id="main-app-container" className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 flex flex-col font-sans transition-all duration-300">
      
      {/* 1. Header Navigation Bar */}
      <header className="border-b border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950/85 backdrop-blur-md sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-600 dark:bg-emerald-500 rounded-xl text-white shadow-md shadow-emerald-500/20">
              <Cpu className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                கலைச்சொல் <span className="text-emerald-600 dark:text-emerald-400">Linter</span>
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold tracking-wider uppercase">
                Classical Tamil Technical Terminology Suite
              </p>
            </div>
          </div>

          {/* Navigation Bar Hub */}
          <nav className="hidden lg:flex bg-slate-100 dark:bg-slate-900/60 rounded-xl p-0.5 border border-slate-200/60 dark:border-slate-800/60">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                activeTab === 'editor'
                  ? 'bg-white dark:bg-slate-950 shadow-sm text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Sparkles className="w-4 h-4" /> Editor
            </button>
            <button
              onClick={() => setActiveTab('dictionary')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                activeTab === 'dictionary'
                  ? 'bg-white dark:bg-slate-950 shadow-sm text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <BookOpen className="w-4 h-4" /> Dictionary Explorer
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                activeTab === 'search'
                  ? 'bg-white dark:bg-slate-950 shadow-sm text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Search className="w-4 h-4" /> Search Analyzer
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                activeTab === 'settings'
                  ? 'bg-white dark:bg-slate-950 shadow-sm text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Settings className="w-4 h-4" /> Settings
            </button>
            <button
              onClick={() => setActiveTab('apidocs')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all ${
                activeTab === 'apidocs'
                  ? 'bg-white dark:bg-slate-950 shadow-sm text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <Terminal className="w-4 h-4" /> API Docs
            </button>
          </nav>

          {/* Database Counter pill */}
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 font-mono">
              {dbCount || '...'} verified terms synced
            </span>
          </div>
        </div>

        {/* Mobile Navigation Bar Hub */}
        <div className="lg:hidden px-4 py-2 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex overflow-x-auto gap-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('editor')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 ${
              activeTab === 'editor' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setActiveTab('dictionary')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 ${
              activeTab === 'dictionary' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Explorer
          </button>
          <button
            onClick={() => setActiveTab('search')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 ${
              activeTab === 'search' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Search
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 ${
              activeTab === 'settings' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            Settings
          </button>
          <button
            onClick={() => setActiveTab('apidocs')}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold rounded-lg shrink-0 ${
              activeTab === 'apidocs' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300'
            }`}
          >
            API Docs
          </button>
        </div>
      </header>

      {/* 2. Hero Visual Brand Header Section */}
      <section className="bg-slate-900 text-white relative overflow-hidden py-10 transition-all border-b border-slate-800">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="max-w-xl">
            <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-bold tracking-widest uppercase border border-emerald-500/20">
              Technical RAG & Hybrid AI Linter
            </span>
            <h2 className="text-3xl font-extrabold tracking-tight text-white mt-3">
              {activeTab === 'editor' && "Linguistic Rich Text Editor"}
              {activeTab === 'dictionary' && "University Glossary Directory"}
              {activeTab === 'search' && "Hybrid Vector Search Console"}
              {activeTab === 'settings' && "Engine Rules Configuration"}
              {activeTab === 'apidocs' && "Linter API Documentation"}
            </h2>
            <p className="text-slate-400 mt-2 text-sm leading-relaxed">
              {activeTab === 'editor' && "Align software comments and code remarks to clean native classical Tamil. Uses our live TipTap scanning decorators."}
              {activeTab === 'dictionary' && "Explore over 1,000 pure Tamil technical words approved by university academic boards and software practice groups."}
              {activeTab === 'search' && "Visualize composite calculations breaking down exact, fuzzy trigram, and dense vector matching similarity scores."}
              {activeTab === 'settings' && "Configure linguistic strictness levels, model parameters, auto-fix preferences, and pipeline options."}
              {activeTab === 'apidocs' && "Integrate our high-performance linter engine directly with your GitHub workflows, IDE plugins, or CI pipelines."}
            </p>
          </div>

          <div className="flex flex-wrap gap-4 bg-slate-950/40 border border-slate-800 rounded-2xl p-4 w-full md:w-auto">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                <BookOpenCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">Matching Strategy</span>
                <span className="text-xs font-bold text-white">Exact, Trigram & Vector</span>
              </div>
            </div>
            <div className="w-px bg-slate-800 hidden sm:block"></div>
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-semibold text-slate-400 block uppercase">Standards compliance</span>
                <span className="text-xs font-bold text-white">Madras & Anna Univ</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Main Body Content Switcher */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          {activeTab === 'editor' && (
            <motion.div
              key="editor"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <LinterPanel 
                onLintSuccess={fetchDbCount} 
                initialText={editorText}
                onTextChange={setEditorText}
                initialResult={lintResult}
                onResultChange={setLintResult}
              />
            </motion.div>
          )}

          {activeTab === 'dictionary' && (
            <motion.div
              key="dictionary"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <TerminologyDirectory onTermAdded={fetchDbCount} />
            </motion.div>
          )}

          {activeTab === 'search' && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <SearchAnalysis />
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <SettingsPanel />
            </motion.div>
          )}

          {activeTab === 'apidocs' && (
            <motion.div
              key="apidocs"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.15 }}
            >
              <ApiDocs />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 4. Clean Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-900 bg-white dark:bg-slate-950 py-8 mt-12 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} கலைச்சொல் Linter. Curating Pure Tamil Technical Vocabulary.</p>
          <div className="flex gap-4">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Compliant with Classical Lexicons & Anna University Terminology Standards
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
