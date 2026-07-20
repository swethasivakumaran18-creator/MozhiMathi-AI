import React, { useState } from 'react';
import { BookOpen, Key, Terminal, Code, Cpu, Database, CheckCircle, Copy } from 'lucide-react';

export default function ApiDocs() {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const curlSnippet = `curl -X POST "https://ais-pre-ofe6qdslblajhcfr265rlz-380378608291.asia-southeast1.run.app/api/v1/linter/lint" \\
  -H "Content-Type: application/json" \\
  -d '{
    "text": "Declare a local variable in the server controller to fetch data from the database.",
    "domain_id": null,
    "strict_level": "standard"
  }'`;

  const nodeSnippet = `const response = await fetch('https://ais-pre-ofe6qdslblajhcfr265rlz-380378608291.asia-southeast1.run.app/api/v1/linter/lint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: 'Declare a local variable in the server controller to fetch data from the database.',
    domain_id: null,
    strict_level: 'standard'
  })
});

const data = await response.json();
console.log('Technical Score:', data.technical_score);
console.log('Suggestions:', data.warnings);`;

  const responseJson = `{
  "warnings": [
    {
      "original_term": "variable",
      "suggested_pure_term": "மாறி",
      "phonetic_rendering": "Maari",
      "explanation": "Derived from classical Tamil term representing value variation in algorithms.",
      "confidence_score": 0.95,
      "is_verified": true
    }
  ],
  "technical_score": 88.5,
  "confidence_indicator": "High",
  "total_flagged_count": 1
}`;

  return (
    <div id="api-docs-tab" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Navigation list (Left) */}
      <div className="lg:col-span-3 flex flex-col gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Endpoints</h3>
          <nav className="flex flex-col gap-1.5">
            <a href="#endpoint-lint" className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              <span className="font-mono bg-emerald-500 text-white px-1.5 py-0.5 rounded text-[9px] uppercase">Post</span>
              /api/v1/linter/lint
            </a>
            <a href="#endpoint-terms" className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-950/20 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 font-medium text-xs transition">
              <span className="font-mono bg-blue-500 text-white px-1.5 py-0.5 rounded text-[9px] uppercase">Get</span>
              /api/v1/terminology/terms
            </a>
            <a href="#endpoint-domains" className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-950/20 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 font-medium text-xs transition">
              <span className="font-mono bg-blue-500 text-white px-1.5 py-0.5 rounded text-[9px] uppercase">Get</span>
              /api/v1/terminology/domains
            </a>
          </nav>
        </div>

        <div className="p-5 bg-gradient-to-tr from-emerald-600 to-teal-700 text-white rounded-3xl shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -mr-6 -mt-6"></div>
          <h4 className="text-sm font-black mb-2 flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-200" /> Developer Keys
          </h4>
          <p className="text-xs text-emerald-100 leading-relaxed mb-4">
            Our APIs are open-source and free for educational integrations. No authorization tokens are required for rates &lt; 100 req/min.
          </p>
          <div className="bg-emerald-800/40 border border-emerald-500/30 p-2.5 rounded-xl font-mono text-[10px] break-all select-all text-emerald-200">
            X-Linter-Client: sandbox-developer-preview
          </div>
        </div>
      </div>

      {/* Docs content (Right) */}
      <div className="lg:col-span-9 flex flex-col gap-6">
        <div id="endpoint-lint" className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-sm">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-slate-800 pb-5 mb-6">
            <div>
              <div className="flex items-center gap-3">
                <span className="font-mono bg-emerald-500 text-white px-2.5 py-0.5 rounded-lg text-xs uppercase font-extrabold">Post</span>
                <h2 className="text-xl font-black text-slate-800 dark:text-slate-100">/api/v1/linter/lint</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">Lints technical files or text strings for non-conforming loan jargon.</p>
            </div>
            <div className="text-xs text-slate-400 font-mono bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800/80 px-3 py-1.5 rounded-xl">
              Content-Type: application/json
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Field breakdown */}
            <div className="flex flex-col gap-5">
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Request Payload Parameters</h3>
                <div className="flex flex-col gap-3.5">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">text</span>
                      <span className="text-[10px] bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-rose-400 px-1.5 py-0.5 rounded font-bold font-mono">Required</span>
                      <span className="text-[10px] text-slate-400 font-mono">string</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed pl-4 border-l border-slate-200 dark:border-slate-800">
                      The raw text string, source code, or markdown to be analyzed.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">domain_id</span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono">Optional</span>
                      <span className="text-[10px] text-slate-400 font-mono">int | null</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed pl-4 border-l border-slate-200 dark:border-slate-800">
                      Filters loan words specific to a unique domain like Computer Networks or Software Engineering.
                    </p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800 dark:text-slate-200">strict_level</span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded font-mono">Optional</span>
                      <span className="text-[10px] text-slate-400 font-mono">string</span>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed pl-4 border-l border-slate-200 dark:border-slate-800">
                      Choose between <code className="text-slate-600 dark:text-slate-300">lenient</code>, <code className="text-slate-600 dark:text-slate-300">standard</code>, or <code className="text-slate-600 dark:text-slate-300">strict</code>.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Response Headers & Status Codes</h3>
                <div className="flex flex-col gap-2 text-xs text-slate-400">
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/20 px-3.5 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <span className="font-mono text-emerald-600 font-bold">200 OK</span>
                    <span>Evaluation processed successfully</span>
                  </div>
                  <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-950/20 px-3.5 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
                    <span className="font-mono text-rose-500 font-bold">422 Unprocessable</span>
                    <span>Invalid JSON formatting / missing parameters</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Code snippets */}
            <div className="flex flex-col gap-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-slate-400" /> Curl request
                  </h3>
                  <button
                    onClick={() => copyToClipboard(curlSnippet, 'curl')}
                    className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                  >
                    {copiedText === 'curl' ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedText === 'curl' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 rounded-2xl text-[10px] font-mono text-slate-300 overflow-x-auto leading-relaxed max-w-full whitespace-pre">
                  {curlSnippet}
                </pre>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-slate-400" /> Javascript snippet
                  </h3>
                  <button
                    onClick={() => copyToClipboard(nodeSnippet, 'node')}
                    className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 hover:underline"
                  >
                    {copiedText === 'node' ? <CheckCircle className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedText === 'node' ? 'Copied' : 'Copy'}
                  </button>
                </div>
                <pre className="p-4 bg-slate-950 rounded-2xl text-[10px] font-mono text-slate-300 overflow-x-auto leading-relaxed max-w-full whitespace-pre">
                  {nodeSnippet}
                </pre>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-slate-400" /> Response JSON schema
                  </h3>
                </div>
                <pre className="p-4 bg-slate-950 rounded-2xl text-[10px] font-mono text-slate-300 overflow-x-auto leading-relaxed max-w-full whitespace-pre">
                  {responseJson}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
