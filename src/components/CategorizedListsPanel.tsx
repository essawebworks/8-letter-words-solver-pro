/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { FIVE_LETTER_WORDS, getScrabbleScore, countVowels, hasDuplicateLetters } from '../data/words';
import { Grid, ChevronRight, Copy, Check, Info, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';

interface CategorizedListsPanelProps {
  onExplainWord: (word: string) => void;
}

interface CuratedCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  filterFn: (word: string) => boolean;
}

export default function CategorizedListsPanel({ onExplainWord }: CategorizedListsPanelProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [copiedWord, setCopiedWord] = useState<string | null>(null);

  // Define categories of 5-letter words
  const categories: CuratedCategory[] = [
    {
      id: 'vowel-rich',
      name: 'Vowel Heavy Words',
      description: 'Words containing 3 or 4 vowels. Excellent starting guesses.',
      icon: '🍉',
      filterFn: (w) => countVowels(w) >= 3
    },
    {
      id: 'unique-letters',
      name: 'All Unique Letters',
      description: 'Words with 5 completely distinct letters for maximum coverage.',
      icon: '💎',
      filterFn: (w) => !hasDuplicateLetters(w)
    },
    {
      id: 'double-letters',
      name: 'Double Letter Traps',
      description: 'Words containing repeating letters (e.g. PUPPY, GEESE). Very tricky in Wordle!',
      icon: '👯‍♂️',
      filterFn: (w) => hasDuplicateLetters(w)
    },
    {
      id: 'starts-a',
      name: 'Starts with "A"',
      description: 'All valid 5-letter words starting with the letter A.',
      icon: '🅰',
      filterFn: (w) => w.startsWith('A')
    },
    {
      id: 'ends-y',
      name: 'Ends with "Y"',
      description: 'Common Wordle suffixes and adjectives ending in Y.',
      icon: '🎈',
      filterFn: (w) => w.endsWith('Y')
    },
    {
      id: 'high-scoring',
      name: 'High Scrabble Points',
      description: 'Words scoring 15+ points in Scrabble. Great for letter discovery.',
      icon: '🏆',
      filterFn: (w) => getScrabbleScore(w) >= 15
    },
    {
      id: 'adieu-friends',
      name: 'ADIEU & Vowel Starters',
      description: 'Words like ADIEU, AUDIO, CANOE, etc. containing 4 vowels.',
      icon: '⚡',
      filterFn: (w) => countVowels(w) >= 4
    },
    {
      id: 'uncommon-letters',
      name: 'Rare Letter Words',
      description: 'Words containing rare letters like Z, Q, J, or X.',
      icon: '👾',
      filterFn: (w) => {
        const rare = ['Z', 'Q', 'J', 'X', 'K'];
        return w.split('').some(char => rare.includes(char));
      }
    }
  ];

  const handleCopy = (word: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(word);
    setCopiedWord(word);
    setTimeout(() => setCopiedWord(null), 2000);
  };

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  const matchedWords = useMemo(() => {
    if (!selectedCategory) return [];
    return FIVE_LETTER_WORDS.filter(selectedCategory.filterFn).sort();
  }, [selectedCategoryId]);

  return (
    <div className="space-y-6" id="categorized-lists-root">
      {/* Category selector grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {categories.map((cat) => {
          const count = FIVE_LETTER_WORDS.filter(cat.filterFn).length;
          const active = selectedCategoryId === cat.id;

          return (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              key={cat.id}
              onClick={() => setSelectedCategoryId(cat.id)}
              className={`cursor-pointer rounded-2xl border p-4 shadow-sm flex flex-col justify-between h-36 transition-all duration-200 ${
                active
                  ? 'bg-emerald-500/10 border-emerald-500 text-slate-100 shadow-[0_0_15px_rgba(16,185,129,0.1)]'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 text-slate-300 hover:bg-slate-800/60'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-xs font-mono font-bold bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-full text-emerald-400">
                    {count} Words
                  </span>
                </div>
                <h3 className="font-bold text-sm tracking-tight text-slate-100">{cat.name}</h3>
                <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="flex items-center gap-1 mt-2 text-xs font-semibold text-emerald-400 self-end">
                <span>View list</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Words list pane */}
      {selectedCategory ? (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-5">
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedCategory.icon}</span>
              <div>
                <h2 className="text-lg font-bold text-slate-100">{selectedCategory.name}</h2>
                <p className="text-xs text-slate-400">{selectedCategory.description}</p>
              </div>
            </div>
            <span className="text-sm font-semibold font-mono text-emerald-400 bg-slate-950 border border-slate-800 px-3 py-1 rounded-full">
              Showing {matchedWords.length} Words
            </span>
          </div>

          <div className="max-h-[360px] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
              {matchedWords.map((word) => {
                const scrabble = getScrabbleScore(word);
                return (
                  <div
                    key={word}
                    onClick={() => onExplainWord(word)}
                    className="group cursor-pointer bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 rounded-xl p-2.5 flex items-center justify-between transition-all"
                  >
                    <span className="font-mono font-black text-slate-100 tracking-wider group-hover:text-emerald-400 transition-colors">
                      {word}
                    </span>
                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => handleCopy(word, e)}
                        className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800"
                      >
                        {copiedWord === word ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl text-center flex flex-col items-center justify-center py-16">
          <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center text-emerald-500 mb-4 shadow-lg">
            <Grid className="w-6 h-6" />
          </div>
          <h3 className="text-md font-bold text-slate-200">Select a Word Category</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Choose any card above to instantly view lists of curated 5-letter words with advanced letter layouts.
          </p>
        </div>
      )}
    </div>
  );
}
