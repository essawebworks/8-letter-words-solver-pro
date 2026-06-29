/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { FIVE_LETTER_WORDS, getScrabbleScore, countVowels, hasDuplicateLetters } from '../data/words';
import { WordExplanation } from '../types';
import { Search, Info, Copy, Check, Filter, Sparkles, RefreshCw, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WordFinderPanelProps {
  onSelectWord: (word: string) => void;
  selectedWordInfo: WordExplanation | null;
  loadingWordInfo: boolean;
  onExplainWord: (word: string) => void;
}

export default function WordFinderPanel({
  onSelectWord,
  selectedWordInfo,
  loadingWordInfo,
  onExplainWord
}: WordFinderPanelProps) {
  // Main search criteria
  const [startsWith, setStartsWith] = useState('');
  const [endsWith, setEndsWith] = useState('');
  const [contains, setContains] = useState('');
  const [excludes, setExcludes] = useState('');
  
  // Positional letter filters (index 0 to 4)
  const [positions, setPositions] = useState<string[]>(['', '', '', '', '']);
  
  // Sort and pagination options
  const [sortBy, setSortBy] = useState<'alpha' | 'scrabble' | 'vowels' | 'unique'>('alpha');
  const [currentPage, setCurrentPage] = useState(1);
  const [copiedWord, setCopiedWord] = useState<string | null>(null);

  // Reset all filters
  const handleReset = () => {
    setStartsWith('');
    setEndsWith('');
    setContains('');
    setExcludes('');
    setPositions(['', '', '', '', '']);
    setCurrentPage(1);
  };

  // Update specific index letter in position filters
  const handlePositionChange = (index: number, val: string) => {
    const char = val.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 1);
    const newPositions = [...positions];
    newPositions[index] = char;
    setPositions(newPositions);
    setCurrentPage(1);
  };

  // Core Word filtering algorithm
  const filteredWords = useMemo(() => {
    return FIVE_LETTER_WORDS.filter(word => {
      // 1. Starts with
      if (startsWith && !word.startsWith(startsWith.toUpperCase())) return false;
      
      // 2. Ends with
      if (endsWith && !word.endsWith(endsWith.toUpperCase())) return false;
      
      // 3. Must Contain Letters
      if (contains) {
        const cleanContains = contains.toUpperCase().split('').filter(c => c.trim());
        for (const char of cleanContains) {
          if (!word.includes(char)) return false;
        }
      }
      
      // 4. Must Exclude Letters
      if (excludes) {
        const cleanExcludes = excludes.toUpperCase().split('').filter(c => c.trim());
        for (const char of cleanExcludes) {
          if (word.includes(char)) return false;
        }
      }
      
      // 5. Positional Matching
      for (let i = 0; i < 5; i++) {
        if (positions[i] && word[i] !== positions[i]) return false;
      }
      
      return true;
    });
  }, [startsWith, endsWith, contains, excludes, positions]);

  // Sorting
  const sortedWords = useMemo(() => {
    const wordsCopy = [...filteredWords];
    if (sortBy === 'alpha') {
      wordsCopy.sort();
    } else if (sortBy === 'scrabble') {
      wordsCopy.sort((a, b) => getScrabbleScore(b) - getScrabbleScore(a));
    } else if (sortBy === 'vowels') {
      wordsCopy.sort((a, b) => countVowels(b) - countVowels(a));
    } else if (sortBy === 'unique') {
      wordsCopy.sort((a, b) => {
        const aDup = hasDuplicateLetters(a) ? 1 : 0;
        const bDup = hasDuplicateLetters(b) ? 1 : 0;
        return aDup - bDup; // No duplicate letters first
      });
    }
    return wordsCopy;
  }, [filteredWords, sortBy]);

  // Pagination bounds
  const itemsPerPage = 60;
  const totalPages = Math.ceil(sortedWords.length / itemsPerPage) || 1;
  const paginatedWords = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return sortedWords.slice(startIndex, startIndex + itemsPerPage);
  }, [sortedWords, currentPage]);

  const handleCopy = (word: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(word);
    setCopiedWord(word);
    setTimeout(() => setCopiedWord(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="word-finder-root">
      {/* Sidebar Filters */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl h-fit">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-bold text-slate-100">Search Filters</h2>
          </div>
          <button
            onClick={handleReset}
            className="text-xs flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Reset All
          </button>
        </div>

        {/* Starts & Ends With */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Starts With</label>
            <input
              type="text"
              maxLength={1}
              value={startsWith}
              onChange={(e) => {
                setStartsWith(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase());
                setCurrentPage(1);
              }}
              placeholder="e.g. S"
              className="w-full bg-slate-950 border border-slate-800 text-emerald-400 focus:border-emerald-500 rounded-lg py-2 px-3 text-center uppercase font-mono font-bold outline-none transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Ends With</label>
            <input
              type="text"
              maxLength={1}
              value={endsWith}
              onChange={(e) => {
                setEndsWith(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase());
                setCurrentPage(1);
              }}
              placeholder="e.g. T"
              className="w-full bg-slate-950 border border-slate-800 text-emerald-400 focus:border-emerald-500 rounded-lg py-2 px-3 text-center uppercase font-mono font-bold outline-none transition-all"
            />
          </div>
        </div>

        {/* Must Contain & Exclude */}
        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center justify-between">
              <span>Must Contain Letters</span>
              <span className="text-[10px] text-slate-500 font-normal">No commas</span>
            </label>
            <input
              type="text"
              value={contains}
              onChange={(e) => {
                setContains(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase());
                setCurrentPage(1);
              }}
              placeholder="e.g. AE"
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 focus:border-emerald-500 rounded-lg py-2 px-3 uppercase font-mono tracking-widest outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center justify-between">
              <span>Exclude Letters</span>
              <span className="text-[10px] text-slate-500 font-normal">Yellow/Gray list</span>
            </label>
            <input
              type="text"
              value={excludes}
              onChange={(e) => {
                setExcludes(e.target.value.replace(/[^a-zA-Z]/g, '').toUpperCase());
                setCurrentPage(1);
              }}
              placeholder="e.g. XYZ"
              className="w-full bg-slate-950 border border-slate-800 text-slate-400 focus:border-rose-500 rounded-lg py-2 px-3 uppercase font-mono tracking-widest outline-none transition-all"
            />
          </div>
        </div>

        {/* Position Slot Filtering */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-slate-400 mb-2">
            Exact Position Slots (1-5)
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[0, 1, 2, 3, 4].map((index) => (
              <div key={index} className="flex flex-col items-center">
                <input
                  type="text"
                  maxLength={1}
                  value={positions[index]}
                  onChange={(e) => handlePositionChange(index, e.target.value)}
                  placeholder="?"
                  className={`w-full bg-slate-950 border text-center font-bold text-lg rounded-lg py-2 uppercase font-mono outline-none transition-all ${
                    positions[index]
                      ? 'border-emerald-500 text-emerald-400 focus:border-emerald-600 bg-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                      : 'border-slate-800 text-slate-500 focus:border-emerald-500'
                  }`}
                />
                <span className="text-[10px] text-slate-600 mt-1">S{index + 1}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Informative Stats */}
        <div className="mt-6 bg-slate-950 border border-slate-800 rounded-xl p-3.5 space-y-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">
            Search Statistics
          </h3>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Filtered Words:</span>
            <span className="font-bold text-emerald-400 font-mono">{filteredWords.length}</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Total Word pool:</span>
            <span className="font-bold text-slate-500 font-mono">{FIVE_LETTER_WORDS.length}</span>
          </div>
        </div>
      </div>

      {/* Main Results View */}
      <div className="lg:col-span-8 flex flex-col gap-6">
        {/* Sorting header */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-300">
              Found <strong className="text-slate-100">{filteredWords.length}</strong> matching 5-letter words
            </span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto py-1">
            <span className="text-xs text-slate-500 whitespace-nowrap">Sort By:</span>
            <button
              onClick={() => { setSortBy('alpha'); setCurrentPage(1); }}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                sortBy === 'alpha'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'text-slate-400 border-slate-800 hover:border-slate-700 bg-slate-950'
              }`}
            >
              Alphabetical
            </button>
            <button
              onClick={() => { setSortBy('scrabble'); setCurrentPage(1); }}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                sortBy === 'scrabble'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'text-slate-400 border-slate-800 hover:border-slate-700 bg-slate-950'
              }`}
            >
              Scrabble Score
            </button>
            <button
              onClick={() => { setSortBy('vowels'); setCurrentPage(1); }}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                sortBy === 'vowels'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'text-slate-400 border-slate-800 hover:border-slate-700 bg-slate-950'
              }`}
            >
              Vowels
            </button>
            <button
              onClick={() => { setSortBy('unique'); setCurrentPage(1); }}
              className={`text-xs px-2.5 py-1.5 rounded-lg border transition-all ${
                sortBy === 'unique'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : 'text-slate-400 border-slate-800 hover:border-slate-700 bg-slate-950'
              }`}
            >
              No Repeats
            </button>
          </div>
        </div>

        {/* Grid of Results */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl min-h-[400px] flex flex-col justify-between">
          {sortedWords.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-rose-500 mb-4 shadow-lg">
                <Info className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">No Matching Words</h3>
              <p className="text-sm text-slate-400 mt-2 max-w-sm">
                Try loosening your filters. E.g. clear excluded letters or reset position filters.
              </p>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {paginatedWords.map((word) => {
                  const scrabble = getScrabbleScore(word);
                  const vowels = countVowels(word);
                  return (
                    <motion.div
                      layout
                      key={word}
                      onClick={() => onExplainWord(word)}
                      className="group cursor-pointer bg-slate-950 hover:bg-slate-800/80 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-3 relative flex items-center justify-between shadow-sm transition-all duration-200"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex flex-col">
                        <span className="font-mono font-bold text-lg text-slate-100 tracking-wider group-hover:text-emerald-400 transition-colors">
                          {word}
                        </span>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-500">
                          <span className="font-mono">Pts: {scrabble}</span>
                          <span>•</span>
                          <span>Vowels: {vowels}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => handleCopy(word, e)}
                          title="Copy word"
                          className="p-1 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                        >
                          {copiedWord === word ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-800 pt-4 mt-6">
              <span className="text-xs text-slate-500">
                Page <strong className="text-slate-300">{currentPage}</strong> of {totalPages}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Prev
                </button>
                <div className="flex items-center gap-1 max-w-[120px] overflow-x-auto px-1">
                  {Array.from({ length: totalPages }).map((_, i) => {
                    const pg = i + 1;
                    if (Math.abs(pg - currentPage) <= 1 || pg === 1 || pg === totalPages) {
                      return (
                        <button
                          key={pg}
                          onClick={() => setCurrentPage(pg)}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg text-xs font-mono transition-all ${
                            currentPage === pg
                              ? 'bg-emerald-500 text-slate-950 font-bold'
                              : 'bg-slate-950 border border-slate-800 text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          {pg}
                        </button>
                      );
                    }
                    if (pg === 2 || pg === totalPages - 1) {
                      return <span key={pg} className="text-slate-600 text-xs font-mono">..</span>;
                    }
                    return null;
                  })}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
