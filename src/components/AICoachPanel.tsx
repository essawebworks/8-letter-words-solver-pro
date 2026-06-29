/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { WordleGuess } from '../types';
import { Bot, User, Send, HelpCircle, Sparkles, MessageSquare, ArrowRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AICoachPanelProps {
  syncedGuesses: WordleGuess[];
  onClearSync: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
}

export default function AICoachPanel({ syncedGuesses, onClearSync }: AICoachPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: "🧙‍♂️ **Greetings, Wordle Scholar!** I am your server-side **AI Wordle Wizard Coach**.\n\nI can analyze your active board state, calculate remaining possibilities, and recommend tactical words based on letter-frequency entropy.\n\nType a custom question, sync your active Solver Board, or click one of the quick prompts below to get started!"
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  // Preset strategic prompts
  const presets = [
    "What are the top 5 starting words for Wordle?",
    "Explain the 'letter frequency elimination' strategy.",
    "Should I play in 'Hard Mode' or standard mode?"
  ];

  const handleSend = async (messageText: string) => {
    if (!messageText.trim() && syncedGuesses.length === 0) return;

    const userMsgId = Date.now().toString();
    const newUserMessage: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: messageText || "Analyze my active board state."
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInputText('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai/coach', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          guesses: syncedGuesses,
          userMessage: messageText
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: data.advice
        }]);
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: `❌ **Error:** ${data.error || "Could not reach the AI Coach. Please make sure the server is fully running."}`
        }]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: `❌ **Network Error:** Could not contact the server. Please check your credentials and connection.`
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Safe and clean custom Markdown translator to standard JSX
  const renderFormattedText = (rawText: string) => {
    return rawText.split('\n').map((paragraph, pIdx) => {
      if (!paragraph.trim()) return <div key={pIdx} className="h-2" />;

      // 1. Handle Headings
      if (paragraph.startsWith('### ')) {
        return <h4 key={pIdx} className="text-sm font-bold text-emerald-400 mt-3 mb-1">{paragraph.replace('### ', '')}</h4>;
      }
      if (paragraph.startsWith('## ')) {
        return <h3 key={pIdx} className="text-md font-black text-emerald-500 mt-4 mb-2">{paragraph.replace('## ', '')}</h3>;
      }

      // 2. Handle Bullet points
      if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
        const cleanBullet = paragraph.replace(/^[-*]\s+/, '');
        return (
          <li key={pIdx} className="ml-4 list-disc text-xs text-slate-300 leading-relaxed mb-1">
            {parseBoldText(cleanBullet)}
          </li>
        );
      }

      // Default paragraph
      return (
        <p key={pIdx} className="text-xs text-slate-300 leading-relaxed mb-2.5">
          {parseBoldText(paragraph)}
        </p>
      );
    });
  };

  // Sub-helper to parse **bold** and inline code
  const parseBoldText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={index} className="text-emerald-400 font-bold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="ai-coach-root">
      {/* Synced Guesses Status Sidebar */}
      <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl h-fit">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-emerald-500 animate-pulse" />
            <h2 className="text-sm font-bold text-slate-100">Solver Board Sync</h2>
          </div>
          {syncedGuesses.length > 0 && (
            <button
              onClick={onClearSync}
              className="text-[10px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 px-2 py-1 rounded border border-rose-500/20 transition-all"
            >
              Unsync
            </button>
          )}
        </div>

        {syncedGuesses.length === 0 ? (
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-center">
            <HelpCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <h4 className="text-xs font-bold text-slate-400">No board synced yet</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-normal">
              Go to the **Wordle Solver** tab, type some words and feedback colors, and hit **Sync to AI Coach** to analyze your exact game state!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-[11px] text-emerald-400 leading-relaxed">
              🎉 <strong>Active Board Synced!</strong> The coach will dynamically analyze your progress below.
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2">
              {syncedGuesses.map((g, idx) => (
                <div key={idx} className="flex items-center justify-between font-mono text-sm border-b border-slate-900 last:border-0 pb-1.5 last:pb-0">
                  <span className="font-bold text-slate-400">Guess {idx + 1}:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-slate-100 tracking-wider mr-2">{g.word}</span>
                    <div className="flex gap-0.5">
                      {g.result.split('').map((char, cIdx) => (
                        <span
                          key={cIdx}
                          className={`w-3.5 h-3.5 rounded-sm inline-block ${
                            char === 'G'
                              ? 'bg-emerald-500'
                              : char === 'Y'
                              ? 'bg-amber-500'
                              : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-5 bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-2.5">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Wizard Tips</h4>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            The AI Coach can review guessing paths, tell you what letters to avoid next, and give customized definitions of suggestions.
          </p>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="lg:col-span-8 flex flex-col h-[520px] bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        {/* Chat header */}
        <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-400/30 flex items-center justify-center">
            <Bot className="w-5 h-5 text-emerald-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100">AI Coach Wizard</h3>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-ping" />
              Gemini 3.5 Flash Online
            </span>
          </div>
        </div>

        {/* Message Feed */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  isBot ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-200'
                }`}>
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div className={`rounded-2xl p-4 shadow-sm ${
                  isBot ? 'bg-slate-950 text-slate-300 rounded-tl-none border border-slate-800' : 'bg-emerald-500 text-slate-950 rounded-tr-none font-medium text-xs shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                }`}>
                  {isBot ? (
                    <div>{renderFormattedText(msg.text)}</div>
                  ) : (
                    <p className="leading-relaxed">{msg.text}</p>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-3 mr-auto items-center max-w-[80%]">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 rounded-tl-none flex items-center gap-2">
                <span className="text-xs text-slate-400">Consulting tactical database...</span>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce delay-100" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce delay-200" />
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce delay-300" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Preset Prompt Suggestions */}
        <div className="px-5 py-2.5 bg-slate-950/60 border-t border-slate-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] text-slate-500 whitespace-nowrap">Suggested:</span>
          {presets.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(preset)}
              className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/40 text-slate-300 px-2.5 py-1 rounded-lg whitespace-nowrap transition-all"
            >
              {preset}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="bg-slate-950 p-3.5 border-t border-slate-800 flex gap-2.5">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(inputText); }}
            placeholder={syncedGuesses.length > 0 ? "Ask the coach for suggestions..." : "Type strategy question or sync Wordle Solver board..."}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-emerald-500 transition-colors"
          />
          <button
            onClick={() => handleSend(inputText)}
            disabled={loading}
            className="px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 text-slate-950 font-bold rounded-xl flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
