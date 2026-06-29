/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type AppTab = 'finder' | 'solver' | 'lists' | 'coach' | 'trainer';

export interface WordleGuess {
  word: string;
  result: string; // 5 characters of 'G' (Green/Correct), 'Y' (Yellow/Present), 'X' (Gray/Absent)
}

export interface WordExplanation {
  word: string;
  partOfSpeech: string;
  definition: string;
  scrabbleAnalysis: string;
  mnemonic: string;
  wordleDifficulty: string;
  sentences: string[];
}

export interface SavedPattern {
  id: string;
  name: string;
  startsWith: string;
  endsWith: string;
  contains: string;
  excludes: string;
}
