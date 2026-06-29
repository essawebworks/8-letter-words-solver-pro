/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppTab, WordleGuess, WordExplanation } from './types';
import WordFinderPanel from './components/WordFinderPanel';
import WordleSolverPanel from './components/WordleSolverPanel';
import CategorizedListsPanel from './components/CategorizedListsPanel';
import AICoachPanel from './components/AICoachPanel';
import WordleTrainerPanel from './components/WordleTrainerPanel';
import {
  Sparkles,
  Search,
  Zap,
  Grid,
  Bot,
  Trophy,
  Volume2,
  X,
  HelpCircle,
  Clock,
  BookOpen,
  Info,
  Moon,
  Sun
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('finder');
  const [syncedGuesses, setSyncedGuesses] = useState<WordleGuess[]>([]);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return 'dark';
  });

  React.useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('theme', nextTheme);
  };
  
  // Word Explainer Sheet State
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedWordInfo, setSelectedWordInfo] = useState<WordExplanation | null>(null);
  const [loadingWordInfo, setLoadingWordInfo] = useState(false);
  const [explainerError, setExplainerError] = useState<string | null>(null);

  // Sync solver grid guesses straight to coach panel
  const handleSyncToCoach = (guesses: WordleGuess[]) => {
    setSyncedGuesses(guesses);
    setActiveTab('coach');
  };

  // Handle word cards across the site to trigger deep AI definition lookup
  const handleExplainWord = async (word: string) => {
    setSelectedWord(word);
    setLoadingWordInfo(true);
    setExplainerError(null);
    setSelectedWordInfo(null);

    try {
      const response = await fetch('/api/ai/explain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word })
      });

      const json = await response.json();
      if (json.success) {
        setSelectedWordInfo(json.data);
      } else {
        setExplainerError(json.error || "Could not fetch explanation.");
      }
    } catch (err: any) {
      setExplainerError("Network connection error. Please verify server is online.");
    } finally {
      setLoadingWordInfo(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" id="wizard-app-root">
      

      {/* Hero Master Header */}
      <header className="bg-slate-900/70 border-b border-slate-800 py-6 px-6 shadow-2xl relative overflow-hidden">
        {/* Glow vector backdrops */}
        <div className="absolute -top-12 -right-12 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center shadow-[0_0_20px_rgba(16,185,129,0.3)] border border-emerald-400/20">
              <Sparkles className="w-6 h-6 text-slate-950 animate-pulse" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-100 font-display flex items-center gap-2">
                8 LETTER WORDS <span className="text-emerald-500 font-bold text-xs bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg font-mono uppercase tracking-widest">PRO EDITION</span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                The ultimate 8-letter word game solver, analyzer, and training system.
              </p>
            </div>
          </div>

          {/* Core Navigation Tabs Bar */}
          <div className="bg-slate-950 border border-slate-800 p-1.5 rounded-2xl flex flex-wrap gap-1 shadow-lg">
            <button
              onClick={() => setActiveTab('finder')}
              className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl transition-all ${
                activeTab === 'finder'
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Search className="w-4 h-4" />
              Word Finder
            </button>
            <button
              onClick={() => setActiveTab('solver')}
              className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl transition-all ${
                activeTab === 'solver'
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Zap className="w-4 h-4" />
              Wordle Solver
            </button>
            <button
              onClick={() => setActiveTab('lists')}
              className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl transition-all ${
                activeTab === 'lists'
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Grid className="w-4 h-4" />
              Smart Lists
            </button>
            <button
              onClick={() => setActiveTab('coach')}
              className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl transition-all ${
                activeTab === 'coach'
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Bot className="w-4 h-4" />
              AI Strategist
            </button>
            <button
              onClick={() => setActiveTab('trainer')}
              className={`flex items-center gap-1.5 text-xs font-bold px-4 py-2.5 rounded-xl transition-all ${
                activeTab === 'trainer'
                  ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.3)] font-black'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              <Trophy className="w-4 h-4" />
              Arena Trainer
            </button>
            <button
              onClick={toggleTheme}
              className="flex items-center justify-center p-2.5 rounded-xl border border-slate-800 hover:border-emerald-500/50 text-slate-400 hover:text-emerald-500 bg-slate-950 hover:bg-slate-900 transition-all cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.18 }}
          >
            {activeTab === 'finder' && (
              <WordFinderPanel
                onSelectWord={setSelectedWord}
                selectedWordInfo={selectedWordInfo}
                loadingWordInfo={loadingWordInfo}
                onExplainWord={handleExplainWord}
              />
            )}
            {activeTab === 'solver' && (
              <WordleSolverPanel
                onSyncToCoach={handleSyncToCoach}
                onExplainWord={handleExplainWord}
              />
            )}
            {activeTab === 'lists' && (
              <CategorizedListsPanel
                onExplainWord={handleExplainWord}
              />
            )}
            {activeTab === 'coach' && (
              <AICoachPanel
                syncedGuesses={syncedGuesses}
                onClearSync={() => setSyncedGuesses([])}
              />
            )}
            {activeTab === 'trainer' && (
              <WordleTrainerPanel
                onExplainWord={handleExplainWord}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Real-time Sliding Explainer Sheet Modal (AI dictionary lookup) */}
      <AnimatePresence>
        {selectedWord && (
          <div className="fixed inset-0 z-50 flex justify-end" id="ai-explainer-overlay">
            {/* Dark glass backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedWord(null)}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm"
            />

            {/* Sliding Drawer Body */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-md h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between"
            >
              {/* Drawer Header */}
              <div className="bg-slate-950 px-6 py-5 border-b border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-emerald-500 animate-pulse" />
                  <h2 className="text-md font-bold text-slate-100">AI Definition Wizard</h2>
                </div>
                <button
                  onClick={() => setSelectedWord(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Drawer Content Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Glowing Skeleton Loader Shimmer */}
                {loadingWordInfo && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <div className="h-10 bg-slate-800/50 rounded-xl w-1/3 animate-pulse" />
                      <div className="h-4 bg-slate-800/50 rounded-xl w-1/2 animate-pulse" />
                    </div>
                    <div className="h-28 bg-slate-800/50 rounded-2xl w-full animate-pulse" />
                    <div className="space-y-2">
                      <div className="h-4 bg-slate-800/50 rounded-xl w-3/4 animate-pulse" />
                      <div className="h-4 bg-slate-800/50 rounded-xl w-2/3 animate-pulse" />
                      <div className="h-4 bg-slate-800/50 rounded-xl w-5/6 animate-pulse" />
                    </div>
                  </div>
                )}

                {/* Error Banner */}
                {explainerError && (
                  <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl text-center space-y-2">
                    <Info className="w-8 h-8 text-rose-500 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-200">Could not explain word</h4>
                    <p className="text-xs text-slate-400 leading-normal">{explainerError}</p>
                  </div>
                )}

                {/* Fully Loaded Detailed Content */}
                {selectedWordInfo && (
                  <div className="space-y-6">
                    {/* Big word banner */}
                    <div className="flex justify-between items-end pb-3 border-b border-slate-800">
                      <div>
                        <span className="block text-3xl font-black font-mono text-slate-100 tracking-wider">
                          {selectedWordInfo.word}
                        </span>
                        <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase mt-1 inline-block">
                          {selectedWordInfo.partOfSpeech}
                        </span>
                      </div>
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                        selectedWordInfo.wordleDifficulty === 'Easy'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : selectedWordInfo.wordleDifficulty === 'Medium'
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        Difficulty: {selectedWordInfo.wordleDifficulty}
                      </span>
                    </div>

                    {/* Word Definition Card */}
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4.5 space-y-1.5">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Definition</h3>
                      <p className="text-sm text-slate-200 leading-relaxed font-medium">
                        {selectedWordInfo.definition}
                      </p>
                    </div>

                    {/* Mnemonics & Memory tricks */}
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4.5 space-y-1.5">
                      <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        Memory Hook & Tip
                      </h3>
                      <p className="text-xs text-slate-300 leading-relaxed font-mono">
                        {selectedWordInfo.mnemonic}
                      </p>
                    </div>

                    {/* Example Sentences */}
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Usage in Sentences</h3>
                      <div className="space-y-2">
                        {selectedWordInfo.sentences.map((sentence, idx) => (
                          <div key={idx} className="bg-slate-950/60 border border-slate-800 p-3 rounded-xl text-xs text-slate-300 italic leading-relaxed">
                            "{sentence}"
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Scrabble Analysis */}
                    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex justify-between items-center text-xs">
                      <span className="text-slate-400">Tactical Game Note:</span>
                      <span className="font-semibold text-slate-200 text-right max-w-[200px]">
                        {selectedWordInfo.scrabbleAnalysis}
                      </span>
                    </div>

                  </div>
                )}
              </div>


            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
}
