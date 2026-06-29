/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { FIVE_LETTER_WORDS, getScrabbleScore } from '../data/words';
import { Award, RefreshCw, Sparkles, HelpCircle, AlertTriangle, Play, HelpCircle as HelpIcon, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface WordleTrainerPanelProps {
  onExplainWord: (word: string) => void;
}

export default function WordleTrainerPanel({ onExplainWord }: WordleTrainerPanelProps) {
  const [targetWord, setTargetWord] = useState('');
  const [guesses, setGuesses] = useState<string[]>([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameStatus, setGameStatus] = useState<'playing' | 'won' | 'lost'>('playing');
  
  // Hint system
  const [showHint, setShowHint] = useState(false);
  
  // Game stats
  const [stats, setStats] = useState({
    played: 0,
    wins: 0,
    streak: 0,
    maxStreak: 0
  });

  // Load stats from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('wordle_wizard_stats');
    if (saved) {
      try {
        setStats(JSON.parse(saved));
      } catch (e) {
        console.error("Error reading stats from storage:", e);
      }
    }
    startNewGame();
  }, []);

  const saveStats = (newStats: typeof stats) => {
    setStats(newStats);
    localStorage.setItem('wordle_wizard_stats', JSON.stringify(newStats));
  };

  // Select a fun common 5-letter word for target
  const startNewGame = () => {
    // Select from a pool of popular/common target words
    const commonStarters = ["CRANE", "ADIEU", "SLATE", "SNAKE", "APPLE", "BRASS", "ABOUT", "HOUSE", "SMART", "BRAVE", "ALERT", "AUDIO", "LIGHT", "DREAM", "STARE", "WORLD", "PILOT", "MAGIC", "STORY", "SWEET", "TRAIN", "BEACH", "CANDY", "SMILE", "TRAIT"];
    // Fallback to random if needed
    const pool = FIVE_LETTER_WORDS.filter(w => w.length === 5);
    const chosen = pool[Math.floor(Math.random() * pool.length)] || "CRANE";
    
    setTargetWord(chosen);
    setGuesses([]);
    setCurrentGuess('');
    setGameStatus('playing');
    setShowHint(false);
  };

  // Keyboard rows for standard QWERTY layout
  const keyboardRows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', 'BACKSPACE']
  ];

  // Key feedback status
  const keyFeedbackStatus = useMemo(() => {
    const statuses: { [key: string]: 'G' | 'Y' | 'X' } = {};
    guesses.forEach((guess) => {
      guess.split('').forEach((char, idx) => {
        const targetChar = targetWord[idx];
        if (char === targetChar) {
          statuses[char] = 'G'; // Green overrides everything
        } else if (targetWord.includes(char)) {
          if (statuses[char] !== 'G') {
            statuses[char] = 'Y'; // Yellow overrides Gray
          }
        } else {
          if (!statuses[char]) {
            statuses[char] = 'X'; // Gray
          }
        }
      });
    });
    return statuses;
  }, [guesses, targetWord]);

  // Handle typing input
  const handleInputChar = (char: string) => {
    if (gameStatus !== 'playing') return;

    if (char === 'BACKSPACE') {
      setCurrentGuess(prev => prev.slice(0, -1));
    } else if (char === 'ENTER') {
      if (currentGuess.length === 5) {
        submitGuess();
      }
    } else if (/^[A-Z]$/.test(char)) {
      if (currentGuess.length < 5) {
        setCurrentGuess(prev => prev + char);
      }
    }
  };

  // Physical keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStatus !== 'playing') return;
      
      const key = e.key.toUpperCase();
      if (key === 'BACKSPACE') {
        handleInputChar('BACKSPACE');
      } else if (key === 'ENTER') {
        handleInputChar('ENTER');
      } else if (/^[A-Z]$/.test(key)) {
        handleInputChar(key);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, guesses, gameStatus]);

  // Submit guess
  const submitGuess = () => {
    const guess = currentGuess.toUpperCase();
    if (!FIVE_LETTER_WORDS.includes(guess)) {
      alert(`"${guess}" is not in our 5-letter word pool! Try a valid dictionary word.`);
      return;
    }

    const newGuesses = [...guesses, guess];
    setGuesses(newGuesses);
    setCurrentGuess('');

    if (guess === targetWord) {
      setGameStatus('won');
      const newStreak = stats.streak + 1;
      saveStats({
        played: stats.played + 1,
        wins: stats.wins + 1,
        streak: newStreak,
        maxStreak: Math.max(stats.maxStreak, newStreak)
      });
    } else if (newGuesses.length >= 6) {
      setGameStatus('lost');
      saveStats({
        played: stats.played + 1,
        wins: stats.wins,
        streak: 0,
        maxStreak: stats.maxStreak
      });
    }
  };

  // AI Hint Calculation: Calculates current possible words
  const aiTrainerHints = useMemo(() => {
    if (guesses.length === 0) return { matches: FIVE_LETTER_WORDS, suggestion: "ADIEU" };

    const matches = FIVE_LETTER_WORDS.filter((word) => {
      for (const guess of guesses) {
        for (let i = 0; i < 5; i++) {
          const guessChar = guess[i];
          const targetChar = targetWord[i];

          // Check greens
          if (guessChar === targetChar) {
            if (word[i] !== guessChar) return false;
          }
          // Check yellows
          else if (targetWord.includes(guessChar)) {
            if (!word.includes(guessChar)) return false;
            if (word[i] === guessChar) return false; // yellow means it must be in a different position
          }
          // Check grays
          else {
            if (word.includes(guessChar)) return false;
          }
        }
      }
      return true;
    });

    // Score hints by Scrabble score or alphabet to rank
    const sorted = [...matches].sort((a, b) => getScrabbleScore(b) - getScrabbleScore(a));
    return {
      matches,
      suggestion: sorted[0] || "No strategic guess found"
    };
  }, [guesses, targetWord]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="wordle-trainer-root">
      {/* Play Stage */}
      <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col items-center justify-between min-h-[460px]">
        {/* Header bar */}
        <div className="w-full flex justify-between items-center pb-3 border-b border-slate-800 mb-4">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-5 h-5 text-emerald-500" />
            <h2 className="text-sm font-bold text-slate-100">Practice Arena</h2>
          </div>
          <button
            onClick={startNewGame}
            className="text-xs px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-slate-400 hover:text-emerald-400 rounded-lg flex items-center gap-1 transition-all"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Restart Arena
          </button>
        </div>

        {/* Wordle Game Board rows */}
        <div className="flex flex-col gap-2 my-2">
          {Array.from({ length: 6 }).map((_, rowIndex) => {
            const rowGuess = guesses[rowIndex] || '';
            const isActive = rowIndex === guesses.length;
            const isFilled = rowIndex < guesses.length;

            return (
              <div key={rowIndex} className="flex gap-2 justify-center">
                {Array.from({ length: 5 }).map((_, charIndex) => {
                  let letter = '';
                  if (isActive) {
                    letter = currentGuess[charIndex] || '';
                  } else if (isFilled) {
                    letter = rowGuess[charIndex] || '';
                  }

                  // Establish feedback styles
                  let bgClass = 'bg-slate-950 border-slate-800 text-slate-300';
                  if (isFilled) {
                    const char = letter;
                    const targetChar = targetWord[charIndex];
                    if (char === targetChar) {
                      bgClass = 'bg-emerald-500 border-emerald-600 text-slate-950 font-black shadow-[0_0_10px_rgba(16,185,129,0.25)]';
                    } else if (targetWord.includes(char)) {
                      bgClass = 'bg-amber-500 border-amber-600 text-slate-950 font-black shadow-[0_0_10px_rgba(245,158,11,0.25)]';
                    } else {
                      bgClass = 'bg-slate-800 border-slate-700 text-slate-400';
                    }
                  } else if (isActive && letter) {
                    bgClass = 'border-slate-500 text-slate-100 scale-102';
                  }

                  return (
                    <motion.div
                      key={charIndex}
                      animate={isFilled ? { rotateX: [0, 90, 0] } : {}}
                      transition={{ duration: 0.3, delay: charIndex * 0.08 }}
                      className={`w-11 h-11 border-2 rounded-lg flex items-center justify-center font-mono text-xl font-bold uppercase transition-all ${bgClass}`}
                    >
                      {letter}
                    </motion.div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* On-screen QWERTY Keyboard */}
        <div className="w-full max-w-md flex flex-col gap-1.5 mt-4">
          {keyboardRows.map((row, rIdx) => (
            <div key={rIdx} className="flex justify-center gap-1">
              {row.map((char) => {
                const feedback = keyFeedbackStatus[char];
                let bgStyle = 'bg-slate-950 text-slate-200 border-slate-800 hover:bg-slate-800';
                
                if (feedback === 'G') {
                  bgStyle = 'bg-emerald-500 text-slate-950 border-emerald-600 font-bold';
                } else if (feedback === 'Y') {
                  bgStyle = 'bg-amber-500 text-slate-950 border-amber-600 font-bold';
                } else if (feedback === 'X') {
                  bgStyle = 'bg-slate-800 text-slate-500 border-slate-800/50 opacity-60';
                }

                const isSpecial = char === 'ENTER' || char === 'BACKSPACE';

                return (
                  <button
                    key={char}
                    onClick={() => handleInputChar(char)}
                    className={`h-9 px-1 rounded font-mono text-xs font-bold border flex items-center justify-center transition-all ${
                      isSpecial ? 'w-14 bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700 text-[9px]' : 'w-7.5'
                    } ${bgStyle}`}
                  >
                    {char === 'BACKSPACE' ? '⌫' : char}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Trainer Sidebar Stats & AI Advice */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        {/* Game Stats */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
            <Award className="w-4.5 h-4.5 text-emerald-500" />
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Your Stats</h3>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
              <span className="block text-lg font-black font-mono text-slate-100">{stats.played}</span>
              <span className="text-[9px] text-slate-500 uppercase">Played</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
              <span className="block text-lg font-black font-mono text-emerald-400">
                {stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0}%
              </span>
              <span className="text-[9px] text-slate-500 uppercase">Win %</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
              <span className="block text-lg font-black font-mono text-emerald-400">{stats.streak}</span>
              <span className="text-[9px] text-slate-500 uppercase">Streak</span>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
              <span className="block text-lg font-black font-mono text-slate-400">{stats.maxStreak}</span>
              <span className="text-[9px] text-slate-500 uppercase">Max</span>
            </div>
          </div>
        </div>

        {/* AI Wizard Hint Button & Result display */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex-1 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-800">
              <Sparkles className="w-4.5 h-4.5 text-emerald-500 animate-pulse" />
              <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Master Hint Desk</h3>
            </div>

            <p className="text-xs text-slate-400 mb-4 leading-relaxed">
              Stuck on a tricky play? Ask the Master Hint engine to calculate remaining words and optimal moves.
            </p>

            {showHint ? (
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Remaining matches:</span>
                  <span className="font-bold font-mono text-emerald-400">{aiTrainerHints.matches.length}</span>
                </div>

                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-500 mb-1">Strategist Recommendation:</span>
                  <div
                    onClick={() => onExplainWord(aiTrainerHints.suggestion)}
                    className="cursor-pointer bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg p-2.5 flex justify-between items-center font-mono font-bold text-slate-100 group"
                  >
                    <span className="group-hover:text-emerald-400 text-sm tracking-wider">{aiTrainerHints.suggestion}</span>
                    <span className="text-[10px] text-slate-500">Explain word</span>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowHint(true)}
                className="w-full bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-emerald-400 transition-all shadow-sm"
              >
                <Sparkles className="w-4 h-4 text-emerald-500" />
                Reveal Trainer Hint
              </button>
            )}
          </div>

          {/* Winning/Losing Status Banner */}
          <AnimatePresence>
            {gameStatus !== 'playing' && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className={`mt-4 p-4 rounded-xl text-center space-y-2.5 ${
                  gameStatus === 'won'
                    ? 'bg-emerald-500/10 border border-emerald-500/30'
                    : 'bg-rose-500/10 border border-rose-500/30'
                }`}
              >
                <h4 className={`font-black text-sm uppercase tracking-wider ${
                  gameStatus === 'won' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {gameStatus === 'won' ? '🏆 Victory!' : '💀 Arena Defeat'}
                </h4>
                
                <p className="text-xs text-slate-300">
                  Target Word was:
                  <strong className="block font-mono text-lg text-slate-100 font-black tracking-widest mt-1">
                    {targetWord}
                  </strong>
                </p>

                <div className="flex gap-2 justify-center pt-1.5">
                  <button
                    onClick={() => onExplainWord(targetWord)}
                    className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-[10px] font-bold text-slate-400 hover:text-emerald-400 rounded-lg border border-slate-800 transition-colors"
                  >
                    Explain Word
                  </button>
                  <button
                    onClick={startNewGame}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-[10px] font-black rounded-lg transition-colors shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                  >
                    Play Again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
