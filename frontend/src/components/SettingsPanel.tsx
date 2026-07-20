import React, { useState, useEffect } from 'react';
import { Settings, Shield, Sliders, Cpu, Save, RefreshCw, Check, Sparkles } from 'lucide-react';

export default function SettingsPanel() {
  const [strictLevel, setStrictLevel] = useState<string>('standard');
  const [modelType, setModelType] = useState<string>('gemini-2.5-flash');
  const [temperature, setTemperature] = useState<number>(0.2);
  const [autoFixOnScan, setAutoFixOnScan] = useState<boolean>(false);
  const [experimentalTuning, setExperimentalTuning] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [saved, setSaved] = useState<boolean>(false);

  // Load configuration from local storage
  useEffect(() => {
    const cachedStrict = localStorage.getItem('linter_strictness');
    const cachedModel = localStorage.getItem('linter_model');
    const cachedTemp = localStorage.getItem('linter_temp');
    const cachedAuto = localStorage.getItem('linter_autofix');

    if (cachedStrict) setStrictLevel(cachedStrict);
    if (cachedModel) setModelType(cachedModel);
    if (cachedTemp) setTemperature(parseFloat(cachedTemp));
    if (cachedAuto) setAutoFixOnScan(cachedAuto === 'true');
  }, []);

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem('linter_strictness', strictLevel);
    localStorage.setItem('linter_model', modelType);
    localStorage.setItem('linter_temp', temperature.toString());
    localStorage.setItem('linter_autofix', autoFixOnScan.toString());

    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 800);
  };

  const handleReset = () => {
    setStrictLevel('standard');
    setModelType('gemini-2.5-flash');
    setTemperature(0.2);
    setAutoFixOnScan(false);
    setExperimentalTuning(true);
  };

  return (
    <div id="settings-tab" className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Sidebar Controls (Left) */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col gap-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" /> System Configurations
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Persist compiler-level strictness and semantic evaluation thresholds.
          </p>
        </div>

        {/* Save/Reset controls */}
        <div className="flex flex-col gap-2.5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition cursor-pointer flex items-center justify-center gap-2"
          >
            {saving ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : saved ? (
              <Check className="w-4 h-4" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {saving ? 'Saving...' : saved ? 'Settings Saved' : 'Save Configurations'}
          </button>
          <button
            onClick={handleReset}
            className="w-full py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
          >
            Reset to Default
          </button>
        </div>
      </div>

      {/* Primary Configuration panels (Right 2 columns) */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-5 flex items-center gap-2">
            <Shield className="w-4 h-4 text-emerald-500" /> Linguistic Strictness Policies
          </h4>

          <div className="flex flex-col gap-5">
            {/* Linter Strictness Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Lexical Scan Strictness Threshold</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setStrictLevel('lenient')}
                  className={`p-3.5 rounded-2xl border text-center transition cursor-pointer ${
                    strictLevel === 'lenient'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 text-slate-500'
                  }`}
                >
                  <span className="block text-sm">Lenient</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Only flag exact loan matches</span>
                </button>

                <button
                  onClick={() => setStrictLevel('standard')}
                  className={`p-3.5 rounded-2xl border text-center transition cursor-pointer ${
                    strictLevel === 'standard'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 text-slate-500'
                  }`}
                >
                  <span className="block text-sm">Standard</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Flag loan terms & Tanglish slang</span>
                </button>

                <button
                  onClick={() => setStrictLevel('strict')}
                  className={`p-3.5 rounded-2xl border text-center transition cursor-pointer ${
                    strictLevel === 'strict'
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 font-bold'
                      : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 text-slate-500'
                  }`}
                >
                  <span className="block text-sm">Strict</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Flag any non-classical loan roots</span>
                </button>
              </div>
            </div>

            {/* Autofix toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">Immediate Auto-Fix Replacement</span>
                <span className="text-xs text-slate-400 block mt-0.5">When checking, automatically choose highest-scoring synonym replacements.</span>
              </div>
              <input
                type="checkbox"
                checked={autoFixOnScan}
                onChange={(e) => setAutoFixOnScan(e.target.checked)}
                className="w-10 h-5 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-wider mb-5 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-emerald-500" /> LLM & Translation Settings
          </h4>

          <div className="flex flex-col gap-5">
            {/* Model type */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Primary translation AI</label>
              <select
                value={modelType}
                onChange={(e) => setModelType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Supercharged speed)</option>
                <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep logical inference)</option>
                <option value="lexicon-local">Offline Classical Lexicon Matcher</option>
              </select>
            </div>

            {/* Temperature Slider */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-500">AI Innovation Temperature Coefficient</span>
                <span className="font-bold font-mono text-slate-700 dark:text-slate-300">{temperature.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0.0"
                max="1.0"
                step="0.05"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full accent-emerald-500 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>Conservative (Accurate Dictionary Matches)</span>
                <span>Creative (Modern Synonyms Generation)</span>
              </div>
            </div>

            {/* Experimental */}
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950/30 border border-slate-100 dark:border-slate-800 rounded-2xl">
              <div>
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200 block">Verify translations using university source records</span>
                <span className="text-xs text-slate-400 block mt-0.5">Cross-reference LLM output with Madras/Anna University database rules before showing suggestions.</span>
              </div>
              <input
                type="checkbox"
                checked={experimentalTuning}
                onChange={(e) => setExperimentalTuning(e.target.checked)}
                className="w-10 h-5 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
