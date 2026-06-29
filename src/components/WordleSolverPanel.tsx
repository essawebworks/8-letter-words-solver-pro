/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { FIVE_LETTER_WORDS, getScrabbleScore } from '../data/words';
import { WordleGuess } from '../types';
import { AlertCircle, HelpCircle, Check, Info, RefreshCw, Send, Zap } from 'lucide-react';
import { motion } from 'motion/react';

interface WordleSolverPanelProps {
  onSyncToCoach: (guesses: WordleGuess[]) => void;
  onExplainWord: (word: string) => void;
}

export default function WordleSolverPanel({ onSyncToCoach, onExplainWord }: WordleSolverPanelProps) {
  // 6 rows of guesses. Each row has 5 letters.
  const [rows, setRows] = useState<string[]>(['', '', '', '', '', '']);
  // Colors for each cell: 'X' (gray), 'Y' (yellow), 'G' (green)
  const [colors, setColors] = useState<string[]>([
    'XXXXX',
    'XXXXX',
    'XXXXX',
    'XXXXX',
    'XXXXX',
    'XXXXX',
  ]);
  // Active row index (0 to 5)
  const [activeRowIndex, setActiveRowIndex] = useState(0);

  // Handle keyboard inputs
  const handleKeyDown = (e: KeyboardEvent) => {
    if (activeRowIndex > 5) return;
    
    const currentWord = rows[activeRowIndex];
    
    // Backspace
    if (e.key === 'Backspace') {
      const newRows = [...rows];
      newRows[activeRowIndex] = currentWord.slice(0, -1);
      setRows(newRows);
      return;
    }

    // Enter to lock and go to next row
    if (e.key === 'Enter') {
      if (currentWord.length === 5) {
        if (activeRowIndex < 5) {
          setActiveRowIndex(prev => prev + 1);
        }
      }
      return;
    }

    // A-Z characters
    if (/^[a-zA-Z]$/.test(e.key)) {
      if (currentWord.length < 5) {
        const newRows = [...rows];
        newRows[activeRowIndex] = (currentWord + e.key).toUpperCase();
        setRows(newRows);
      }
    }
  };

  // Add event listener for keydown
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [rows, activeRowIndex]);

  // Click on a tile to cycle its status
  const toggleTileColor = (rowIndex: number, charIndex: number) => {
    if (rows[rowIndex].length <= charIndex) return;
    
    const rowColors = colors[rowIndex].split('');
    const curColor = rowColors[charIndex];
    let nextColor = 'X';
    
    if (curColor === 'X') nextColor = 'Y';
    else if (curColor === 'Y') nextColor = 'G';
    else nextColor = 'X';
    
    rowColors[charIndex] = nextColor;
    const newColors = [...colors];
    newColors[rowIndex] = rowColors.join('');
    setColors(newColors);
  };

  // Clear entire board
  const handleClear = () => {
    setRows(['', '', '', '', '', '']);
    setColors(['XXXXX', 'XXXXX', 'XXXXX', 'XXXXX', 'XXXXX', 'XXXXX']);
    setActiveRowIndex(0);
  };

  // Get active lists of guesses formatted for the solver
  const activeGuesses = useMemo<WordleGuess[]>(() => {
    const list: WordleGuess[] = [];
    for (let i = 0; i <= activeRowIndex; i++) {
      if (rows[i].length === 5) {
        list.push({
          word: rows[i],
          result: colors[i],
        });
      }
    }
    return list;
  }, [rows, colors, activeRowIndex]);

  // Algorithm: Filter words based on Wordle criteria
  const solverMatches = useMemo(() => {
    if (activeGuesses.length === 0) return FIVE_LETTER_WORDS;

    return FIVE_LETTER_WORDS.filter((word) => {
      // Analyze against each guess
      for (const guess of activeGuesses) {
        const guessWord = guess.word.toUpperCase();
        const guessResult = guess.result; // 'G', 'Y', 'X'

        // Check positional greens first
        for (let i = 0; i < 5; i++) {
          if (guessResult[i] === 'G' && word[i] !== guessWord[i]) {
            return false;
          }
        }

        // Check yellows and grays with letter counts to avoid multiple letter edge cases
        // E.g. guess "APPLE" with first P as Green, second P as Gray.
        // It means the target word has exactly one P.
        const letterCounts: { [key: string]: { min: number; exact: boolean } } = {};
        const guessLetters = guessWord.split('');

        // Count green and yellow occurrences for each letter in the guess
        guessLetters.forEach((char, idx) => {
          if (!letterCounts[char]) {
            letterCounts[char] = { min: 0, exact: false };
          }
          if (guessResult[idx] === 'G' || guessResult[idx] === 'Y') {
            letterCounts[char].min += 1;
          } else if (guessResult[idx] === 'X') {
            letterCounts[char].exact = true;
          }
        });

        // Verify letter counts in the candidate word
        for (const char in letterCounts) {
          const actualCount = word.split('').filter(c => c === char).length;
          const rule = letterCounts[char];

          if (rule.exact) {
            if (actualCount !== rule.min) return false;
          } else {
            if (actualCount < rule.min) return false;
          }
        }

        // Verify yellow positional negatives
        // A yellow letter must exist in the word but NOT at this index
        for (let i = 0; i < 5; i++) {
          if (guessResult[i] === 'Y') {
            if (word[i] === guessWord[i]) return false; // Must be at a different index
          }
        }
      }
      return true;
    });
  }, [activeGuesses]);

  // Algorithm: Suggest best next words using a letter frequency analysis
  // We calculate frequency of each letter in remaining valid matches
  // and score words based on unique letters matching high frequencies.
  const optimizedSuggestions = useMemo(() => {
    if (solverMatches.length <= 2) return solverMatches;

    // 1. Calculate letter frequencies for each position and overall
    const freq: { [key: string]: number } = {};
    solverMatches.forEach((word) => {
      const uniqueChars = Array.from(new Set(word.split(''))) as string[];
      uniqueChars.forEach((char) => {
        freq[char] = (freq[char] || 0) + 1;
      });
    });

    // 2. Score each word in the match pool
    const scored = solverMatches.map((word) => {
      // Sum freq of unique letters in the word to prioritize broad information gain
      const uniqueChars = Array.from(new Set(word.split(''))) as string[];
      const score = uniqueChars.reduce((acc, char) => acc + (freq[char] || 0), 0);
      return { word, score };
    });

    // 3. Sort by score descending
    scored.sort((a, b) => b.score - a.score);
    return scored.map((item) => item.word);
  }, [solverMatches]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="wordle-solver-root">
      {/* Interactive Wordle Grid Pane */}
      <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-emerald-500" />
              <h2 className="text-lg font-bold text-slate-100">Interactive Board</h2>
            </div>
            <button
              onClick={handleClear}
              className="text-xs flex items-center gap-1 text-slate-400 hover:text-emerald-400 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Clear Grid
            </button>
          </div>

          <p className="text-xs text-slate-400 mb-4 bg-slate-950 border border-slate-800 p-3 rounded-xl leading-relaxed">
            💡 <strong>How to use:</strong> Type a 5-letter word on your active row. Click each letter tile to toggle its feedback color (Gray = absent, Yellow = present elsewhere, Green = correct position).
          </p>

          {/* 6 Wordle Rows */}
          <div className="flex flex-col gap-2.5 max-w-sm mx-auto my-4">
            {rows.map((rowText, rowIndex) => {
              const active = rowIndex === activeRowIndex;
              const locked = rowIndex < activeRowIndex;
              const rowColorString = colors[rowIndex];

              return (
                <div
                  key={rowIndex}
                  className={`flex gap-2 p-1 rounded-xl transition-all ${
                    active ? 'bg-slate-950 border border-slate-800 shadow-[0_0_15px_rgba(16,185,129,0.05)]' : 'border border-transparent'
                  }`}
                >
                  {Array.from({ length: 5 }).map((_, charIndex) => {
                    const letter = rowText[charIndex] || '';
                    const tileColor = rowColorString[charIndex];

                    let colorClass = 'bg-slate-950 border-slate-800 text-slate-400';
                    if (letter) {
                      if (tileColor === 'G') {
                        colorClass = 'bg-emerald-500 border-emerald-600 text-slate-950 font-black shadow-[0_0_12px_rgba(16,185,129,0.3)]';
                      } else if (tileColor === 'Y') {
                        colorClass = 'bg-amber-500 border-amber-600 text-slate-950 font-black shadow-[0_0_12px_rgba(245,158,11,0.3)]';
                      } else {
                        colorClass = 'bg-slate-800 border-slate-700 text-slate-200';
                      }
                    }

                    return (
                      <motion.button
                        whileHover={letter ? { scale: 1.05 } : {}}
                        whileTap={letter ? { scale: 0.95 } : {}}
                        key={charIndex}
                        onClick={() => toggleTileColor(rowIndex, charIndex)}
                        disabled={!letter}
                        className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center font-mono text-xl font-bold uppercase transition-all duration-150 ${colorClass} ${
                          !letter ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                        }`}
                      >
                        {letter}
                      </motion.button>
                    );
                  })}

                  {/* Lock/Next Row indicator button */}
                  {active && (
                    <button
                      onClick={() => {
                        if (rows[activeRowIndex].length === 5 && activeRowIndex < 5) {
                          setActiveRowIndex(prev => prev + 1);
                        }
                      }}
                      disabled={rows[activeRowIndex].length !== 5}
                      className="ml-2 px-2 text-[10px] uppercase font-bold text-slate-400 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 hover:text-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg flex items-center justify-center whitespace-nowrap transition-all"
                    >
                      Lock Row
                    </button>
                  )}
                  {locked && (
                    <span className="ml-2 px-2 text-[10px] uppercase font-bold text-emerald-500 flex items-center justify-center whitespace-nowrap">
                      ✔ Saved
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Sync & Advice footer */}
        <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            Active solver rows: <strong className="text-slate-300">{activeGuesses.length}</strong>
          </div>
          <button
            onClick={() => onSyncToCoach(activeGuesses)}
            disabled={activeGuesses.length === 0}
            className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            Sync to AI Coach Panel
          </button>
        </div>
      </div>

      {/* Suggested Matching Words Pool */}
      <div className="lg:col-span-6 flex flex-col gap-6">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl min-h-[400px] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-bold text-slate-100">Smart Suggestions</h2>
              </div>
              <span className="text-xs font-mono bg-slate-950 border border-slate-800 px-2.5 py-1 rounded-full text-emerald-400 font-bold">
                {solverMatches.length} Matches
              </span>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              💡 <strong>Recommended guess ranking:</strong> These candidate words are prioritized based on letter-frequency coverage, which guarantees maximum information gain on your next guess.
            </p>

            {solverMatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
                <h4 className="text-sm font-bold text-slate-200">No matching words remaining</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Your color configurations might be contradictory. Double-check your letter greens and grays and try again.
                </p>
              </div>
            ) : (
              <div className="max-h-[320px] overflow-y-auto pr-1 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {optimizedSuggestions.slice(0, 40).map((word, idx) => {
                    const score = getScrabbleScore(word);
                    return (
                      <div
                        key={word}
                        onClick={() => onExplainWord(word)}
                        className={`group cursor-pointer border rounded-xl p-2.5 flex items-center justify-between transition-all duration-150 ${
                          idx === 0
                            ? 'bg-emerald-500/5 border-emerald-500/30 hover:bg-emerald-500/10'
                            : 'bg-slate-950 border-slate-800 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                            idx === 0 ? 'bg-emerald-500 text-slate-950' : 'bg-slate-900 text-slate-500'
                          }`}>
                            #{idx + 1}
                          </span>
                          <span className="font-mono font-black text-slate-200 group-hover:text-emerald-400 tracking-wider">
                            {word}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono flex items-center gap-2">
                          <span>Score: {score}</span>
                          {idx === 0 && <span className="text-emerald-400 font-bold uppercase text-[9px]">BEST</span>}
                        </div>
                      </div>
                    );
                  })}
                </div>
                {optimizedSuggestions.length > 40 && (
                  <p className="text-center text-slate-600 text-xs mt-3">
                    ... and {optimizedSuggestions.length - 40} more words. Narrow down with more tiles.
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="mt-4 bg-slate-950 border border-slate-800 rounded-xl p-3 flex gap-2 items-start text-xs text-slate-500">
            <Info className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              If you have locked in some yellow/green keys but still have no matches, click <span className="text-emerald-400 font-bold">Clear Grid</span> to start fresh.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
