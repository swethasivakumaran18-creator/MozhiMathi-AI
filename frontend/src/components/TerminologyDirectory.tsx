import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Filter, BookOpen, ExternalLink, HelpCircle, Scale, ShieldCheck, X, Sparkles, Check, ChevronDown } from 'lucide-react';
import { Term, Domain, Category, Source } from '../types';

interface Props {
  onTermAdded?: () => void;
}

export default function TerminologyDirectory({ onTermAdded }: Props) {
  const [terms, setTerms] = useState<Term[]>([]);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sources, setSources] = useState<Source[]>([]);

  // Filtering and Searching State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedDomain, setSelectedDomain] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSource, setSelectedSource] = useState<string>('all');
  const [showDomainDropdown, setShowDomainDropdown] = useState<boolean>(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<boolean>(false);

  // Modal / Drawer state for adding new terms
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [newEnglishTerm, setNewEnglishTerm] = useState<string>('');
  const [newTamilTerm, setNewTamilTerm] = useState<string>('');
  const [newPureTamilTerm, setNewPureTamilTerm] = useState<string>('');
  const [newIpaTamil, setNewIpaTamil] = useState<string>('');
  const [newDomainId, setNewDomainId] = useState<string>('');
  const [newCategoryId, setNewCategoryId] = useState<string>('');
  const [newSourceId, setNewSourceId] = useState<string>('');
  const [newDefinition, setNewDefinition] = useState<string>('');
  const [newExample, setNewExample] = useState<string>('');
  const [newExampleEn, setNewExampleEn] = useState<string>('');
  const [addLoading, setAddLoading] = useState<boolean>(false);
  const [addError, setAddError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Term detailed drawer
  const [selectedTerm, setSelectedTerm] = useState<Term | null>(null);

  const fetchFilters = async () => {
    try {
      const [dRes, cRes, sRes] = await Promise.all([
        fetch('/api/v1/terminology/domains'),
        fetch('/api/v1/terminology/categories'),
        fetch('/api/v1/terminology/sources')
      ]);
      if (dRes.ok) setDomains(await dRes.json());
      if (cRes.ok) setCategories(await cRes.json());
      if (sRes.ok) setSources(await sRes.json());
    } catch (e) {
      console.error('Error fetching filters: ', e);
    }
  };

  const PAGE_SIZE = 15;
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchTerms = async (reset: boolean = false, currentOffset?: number) => {
    try {
      const queryParams = new URLSearchParams();
      if (searchQuery) queryParams.append('q', searchQuery);
      if (selectedDomain !== 'all') queryParams.append('domain_id', selectedDomain);
      if (selectedCategory !== 'all') queryParams.append('category_id', selectedCategory);

      const offset = reset ? 0 : (currentOffset !== undefined ? currentOffset : terms.length);
      queryParams.append('skip', offset.toString());
      queryParams.append('limit', PAGE_SIZE.toString());

      const res = await fetch(`/api/v1/terminology/terms?${queryParams.toString()}`);
      if (res.ok) {
        const newTerms = await res.json();
        if (reset) {
          setTerms(newTerms);
        } else {
          setTerms(prev => {
            const existingIds = new Set(prev.map(t => t.id));
            const filteredNew = newTerms.filter((t: Term) => !existingIds.has(t.id));
            return [...prev, ...filteredNew];
          });
        }
        setHasMore(newTerms.length === PAGE_SIZE);
      }
    } catch (e) {
      console.error('Error fetching terms: ', e);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchTerms(true, 0);
  }, [searchQuery, selectedDomain, selectedCategory]);

  const handleAddTerm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnglishTerm.trim() || !newTamilTerm.trim() || !newPureTamilTerm.trim()) {
      setAddError('English term, phonetic Tamil, and pure Tamil values are required.');
      return;
    }

    setAddLoading(true);
    setAddError(null);
    setSuccessMsg(null);

    const termPayload = {
      english_term: newEnglishTerm,
      tamil_term: newTamilTerm,
      pure_tamil_term: newPureTamilTerm,
      ipa_tamil: newIpaTamil || null,
      domain_id: newDomainId ? parseInt(newDomainId) : null,
      category_id: newCategoryId ? parseInt(newCategoryId) : null,
      source_id: newSourceId ? parseInt(newSourceId) : null,
      confidence_score: 1.0,
      is_verified: true,
      definitions: newDefinition ? [{ tamil_definition: newDefinition, author: "Community" }] : [],
      examples: newExample ? [{ tamil_example: newExample, english_example: newExampleEn || null }] : [],
      synonyms: []
    };

    try {
      const res = await fetch('/api/v1/terminology/terms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(termPayload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Failed to submit term.');
      }

      setSuccessMsg('Technical term successfully submitted and verified!');
      // Reset form
      setNewEnglishTerm('');
      setNewTamilTerm('');
      setNewPureTamilTerm('');
      setNewIpaTamil('');
      setNewDefinition('');
      setNewExample('');
      setNewExampleEn('');

      fetchTerms(true, 0);
      if (onTermAdded) onTermAdded();

      setTimeout(() => {
        setShowAddModal(false);
        setSuccessMsg(null);
      }, 1500);

    } catch (err: any) {
      setAddError(err.message || 'Error creating term.');
    } finally {
      setAddLoading(false);
    }
  };

  return (
    <div id="terminology-directory" className="flex flex-col gap-6">
      {/* Search and Filters Layout */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-600" /> Technical Glossary Directory
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Explore pure Tamil vocabulary curated by universities and open-source software practitioners.
            </p>
          </div>
          <button
            id="add-term-btn"
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm cursor-pointer transition shadow"
          >
            <Plus className="w-4 h-4" /> Add Technical Term
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Box */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              id="glossary-search"
              type="text"
              placeholder="Search English or Tamil technical words..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Domain Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowDomainDropdown(!showDomainDropdown);
                setShowCategoryDropdown(false);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 text-slate-700 dark:text-slate-300 font-medium flex items-center justify-between cursor-pointer"
            >
              <span className="truncate">
                {selectedDomain === 'all'
                  ? 'All Domains (அனைத்து களங்கள்)'
                  : (domains.find(d => d.id.toString() === selectedDomain)?.name || 'Select Domain')
                }
              </span>
              <ChevronDown className={`w-3.5 h-3.5 ml-2 transition-transform duration-200 ${showDomainDropdown ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showDomainDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowDomainDropdown(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.1 }}
                    className="absolute left-0 mt-1 w-full max-h-60 overflow-y-auto bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xl z-50 py-1.5 flex flex-col"
                  >
                    <button
                      onClick={() => {
                        setSelectedDomain('all');
                        setShowDomainDropdown(false);
                      }}
                      className={`px-3.5 py-2 text-left text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center justify-between ${selectedDomain === 'all' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/10' : 'text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      <span>All Domains (அனைத்து களங்கள்)</span>
                      {selectedDomain === 'all' && <Check className="w-3.5 h-3.5" />}
                    </button>
                    {domains.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => {
                          setSelectedDomain(d.id.toString());
                          setShowDomainDropdown(false);
                        }}
                        className={`px-3.5 py-2 text-left text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center justify-between ${selectedDomain === d.id.toString() ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/10' : 'text-slate-700 dark:text-slate-300'
                          }`}
                      >
                        <span>{d.name}</span>
                        {selectedDomain === d.id.toString() && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Category Filter */}
          <div className="relative">
            <button
              onClick={() => {
                setShowCategoryDropdown(!showCategoryDropdown);
                setShowDomainDropdown(false);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/25 focus:border-emerald-500 text-slate-700 dark:text-slate-300 font-medium flex items-center justify-between cursor-pointer"
            >
              <span className="truncate">
                {selectedCategory === 'all'
                  ? 'All Categories (அனைத்து பிரிவுகள்)'
                  : (categories.find(c => c.id.toString() === selectedCategory)?.name || 'Select Category')
                }
              </span>
              <ChevronDown className={`w-3.5 h-3.5 ml-2 transition-transform duration-200 ${showCategoryDropdown ? 'rotate-180' : ''}`} />
            </button>

            <AnimatePresence>
              {showCategoryDropdown && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowCategoryDropdown(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    transition={{ duration: 0.1 }}
                    className="absolute left-0 mt-1 w-full max-h-60 overflow-y-auto bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800/80 rounded-2xl shadow-xl z-50 py-1.5 flex flex-col"
                  >
                    <button
                      onClick={() => {
                        setSelectedCategory('all');
                        setShowCategoryDropdown(false);
                      }}
                      className={`px-3.5 py-2 text-left text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center justify-between ${selectedCategory === 'all' ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/10' : 'text-slate-700 dark:text-slate-300'
                        }`}
                    >
                      <span>All Categories (அனைத்து பிரிவுகள்)</span>
                      {selectedCategory === 'all' && <Check className="w-3.5 h-3.5" />}
                    </button>
                    {categories.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCategory(c.id.toString());
                          setShowCategoryDropdown(false);
                        }}
                        className={`px-3.5 py-2 text-left text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center justify-between ${selectedCategory === c.id.toString() ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50/40 dark:bg-emerald-950/10' : 'text-slate-700 dark:text-slate-300'
                          }`}
                      >
                        <span>{c.name}</span>
                        {selectedCategory === c.id.toString() && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {terms.length === 0 ? (
          <div className="col-span-full py-12 text-center text-slate-400 dark:text-slate-500 text-sm">
            No terms match your search filters. Try typing another concept!
          </div>
        ) : (
          terms.map((t) => (
            <div
              key={t.id}
              onClick={() => setSelectedTerm(t)}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 hover:shadow-lg transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-center mb-3">
                  <span className="px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider rounded">
                    {t.domain?.name || 'General Tech'}
                  </span>
                  <div className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold uppercase">Verified</span>
                  </div>
                </div>

                <div className="text-xl font-extrabold text-slate-800 dark:text-slate-100 mb-1">
                  {t.english_term}
                </div>

                <div className="text-xs text-slate-400 dark:text-slate-500 mb-3">
                  IPA: {t.ipa_tamil || 'N/A'}
                </div>

                <div className="flex flex-col gap-1.5 p-3 bg-slate-50 dark:bg-slate-950/20 rounded-xl border border-slate-100/60 dark:border-slate-800/60">
                  <div className="text-xs text-slate-400">Phonetic / Tanglish:</div>
                  <div className="text-sm font-semibold text-rose-700 dark:text-rose-400">{t.tamil_term}</div>
                  <div className="text-xs text-slate-400 mt-1">Pure Tamil translation:</div>
                  <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{t.pure_tamil_term}</div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center text-xs text-slate-400">
                <span>Source: {t.source?.name || 'Glossary'}</span>
                <span className="font-semibold text-emerald-500">Score: {t.confidence_score}</span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination "Show More" Button */}
      {hasMore && terms.length > 0 && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => fetchTerms(false, terms.length)}
            className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-sm border border-slate-200/50 dark:border-slate-700/50"
          >
            Show More Terms (மேலும் காட்டு)
          </button>
        </div>
      )}

      {/* Add New Term Dialog */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-lg rounded-3xl shadow-2xl p-6 relative overflow-y-auto max-h-[90vh]"
            >
              <button
                onClick={() => setShowAddModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-slate-100">
                Propose Pure Tamil Technical Term
              </h3>

              <form onSubmit={handleAddTerm} className="flex flex-col gap-4">
                {/* English */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">English Term *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Memory"
                    value={newEnglishTerm}
                    onChange={(e) => setNewEnglishTerm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Phonetic / Loan */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Phonetic Tamil / Common Loan Word *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. மெமரி"
                    value={newTamilTerm}
                    onChange={(e) => setNewTamilTerm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Pure Tamil translation */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Pure Tamil Equivalent *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. நினைவகம்"
                    value={newPureTamilTerm}
                    onChange={(e) => setNewPureTamilTerm(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* IPA Phonetics */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">IPA Phonetic Rendering (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. mɛməri"
                    value={newIpaTamil}
                    onChange={(e) => setNewIpaTamil(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                {/* Domain & Category selectors */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Domain</label>
                    <select
                      value={newDomainId}
                      onChange={(e) => setNewDomainId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none text-slate-700 dark:text-slate-300"
                    >
                      <option value="">Select Domain</option>
                      {domains.map((d) => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Category</label>
                    <select
                      value={newCategoryId}
                      onChange={(e) => setNewCategoryId(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none text-slate-700 dark:text-slate-300"
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Custom Source selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Source Glossary</label>
                  <select
                    value={newSourceId}
                    onChange={(e) => setNewSourceId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none text-slate-700 dark:text-slate-300"
                  >
                    <option value="">Select Source</option>
                    {sources.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                    {sources.length === 0 && <option value="3">Community Proposed</option>}
                  </select>
                </div>

                {/* Definition */}
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Tamil Definition</label>
                  <textarea
                    placeholder="உள்ளடக்கம் அல்லது தரவுகளை கணினியில் சேமித்து வைக்கும் மென்பொருள்/வன்பொருள் பகுதி."
                    value={newDefinition}
                    onChange={(e) => setNewDefinition(e.target.value)}
                    className="w-full h-16 px-3 py-2 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none resize-none"
                  />
                </div>

                {/* Examples */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Tamil Example</label>
                    <textarea
                      placeholder="நினைவகம் முழுமையாக உள்ளது."
                      value={newExample}
                      onChange={(e) => setNewExample(e.target.value)}
                      className="w-full h-14 px-3 py-1.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">English Translation</label>
                    <textarea
                      placeholder="The memory is full."
                      value={newExampleEn}
                      onChange={(e) => setNewExampleEn(e.target.value)}
                      className="w-full h-14 px-3 py-1.5 bg-slate-50 dark:bg-slate-950/30 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-800 dark:text-slate-200 focus:outline-none resize-none"
                    />
                  </div>
                </div>

                {addError && (
                  <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900 rounded-xl text-rose-600 dark:text-rose-400 text-xs">
                    {addError}
                  </div>
                )}

                {successMsg && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs flex items-center gap-1">
                    <Check className="w-4 h-4" /> {successMsg}
                  </div>
                )}

                <button
                  id="submit-term-btn"
                  type="submit"
                  disabled={addLoading}
                  className="w-full py-2.5 bg-slate-900 dark:bg-emerald-600 dark:hover:bg-emerald-500 hover:bg-slate-800 text-white font-bold rounded-xl text-sm transition cursor-pointer disabled:opacity-50"
                >
                  {addLoading ? 'Submitting Term...' : 'Submit Propose Term'}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Term Detailed Info Drawer */}
      <AnimatePresence>
        {selectedTerm && (
          <div className="fixed inset-0 bg-slate-900/40 dark:bg-slate-950/60 flex items-center justify-end z-50 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-md h-full shadow-2xl p-6 relative flex flex-col justify-between overflow-y-auto"
            >
              <div>
                <button
                  onClick={() => setSelectedTerm(null)}
                  className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition mb-4 self-start"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex gap-2 items-center mb-2">
                  <span className="px-2.5 py-0.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded text-xs font-bold uppercase tracking-wider">
                    {selectedTerm.domain?.name || 'General Tech'}
                  </span>
                  <span className="px-2.5 py-0.5 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded text-xs font-bold uppercase tracking-wider">
                    {selectedTerm.category?.name || 'Concept'}
                  </span>
                </div>

                <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-1">
                  {selectedTerm.english_term}
                </h3>
                <p className="text-sm font-mono text-slate-400 dark:text-slate-500 mb-6">
                  IPA Phonetic: {selectedTerm.ipa_tamil || 'N/A'}
                </p>

                <div className="flex flex-col gap-4">
                  {/* Equivalents mapping */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800/60 rounded-2xl flex flex-col gap-3">
                    <div>
                      <span className="text-xs text-slate-400 block mb-1">Common Loan Word / Phonetic:</span>
                      <span className="text-lg font-bold text-rose-600 dark:text-rose-400">{selectedTerm.tamil_term}</span>
                    </div>
                    <div className="border-t border-slate-200/50 dark:border-slate-800/50 pt-2">
                      <span className="text-xs text-slate-400 block mb-1">Pure Tamil translation (தூய தமிழாக்கம்):</span>
                      <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">{selectedTerm.pure_tamil_term}</span>
                    </div>
                  </div>

                  {/* Mathematical Search & Scores metrics */}
                  <div className="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 flex flex-col gap-2">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-indigo-500" /> Hybrid Matching Profile
                    </span>
                    <div className="flex justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-500">Exact String Matching Weight (w1)</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">0.50</span>
                    </div>
                    <div className="flex justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-500">Trigram Fuzzy Similarity Weight (w2)</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">0.30</span>
                    </div>
                    <div className="flex justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-500">Vector Semantic Similarity Weight (w3)</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">0.20</span>
                    </div>
                    <div className="flex justify-between text-xs py-1 border-b border-slate-100 dark:border-slate-800/60">
                      <span className="text-slate-500">Source Authority Coefficient (C_source)</span>
                      <span className="font-mono text-emerald-600 dark:text-emerald-400">
                        {selectedTerm.source?.name.includes("Anna") ? '1.00 (Standard)' : '0.90 (UoM)'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-bold pt-1">
                      <span className="text-slate-700 dark:text-slate-300">Composite Confidence Score</span>
                      <span className="font-mono text-emerald-500">{selectedTerm.confidence_score}</span>
                    </div>
                  </div>

                  {/* Definitions */}
                  {selectedTerm.definitions && selectedTerm.definitions.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Tamil Definition</h4>
                      {selectedTerm.definitions.map((def, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 dark:bg-slate-950/20 border border-slate-100 dark:border-slate-800 rounded-xl">
                          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                            {def.tamil_definition}
                          </p>
                          {def.english_definition && (
                            <p className="text-[11px] text-slate-400 mt-2 italic border-t border-slate-200/50 dark:border-slate-800/50 pt-1.5">
                              {def.english_definition}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Examples */}
                  {selectedTerm.examples && selectedTerm.examples.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Curated Usage Examples</h4>
                      {selectedTerm.examples.map((ex, idx) => (
                        <div key={idx} className="p-3 bg-emerald-50/20 dark:bg-emerald-950/10 border border-emerald-100/40 dark:border-emerald-800/40 rounded-xl flex flex-col gap-1.5">
                          <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 leading-relaxed">
                            {ex.tamil_example}
                          </p>
                          {ex.english_example && (
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                              Translation: "{ex.english_example}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800/60 flex justify-between items-center text-xs text-slate-400">
                <span>Glossary Source: {selectedTerm.source?.name || 'Verified Collection'}</span>
                {selectedTerm.source?.url && (
                  <a
                    href={selectedTerm.source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-500 hover:underline flex items-center gap-0.5"
                  >
                    Site <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
