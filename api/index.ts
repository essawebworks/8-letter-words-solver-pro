/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI, Type } from "@google/genai";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini SDK server-side
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
} else {
  console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI features will be disabled.");
}

// Helper to check and return Gemini client
function getAI(): GoogleGenAI {
  if (!ai) {
    throw new Error("Gemini AI API Key is missing. Please set GEMINI_API_KEY in Settings > Secrets.");
  }
  return ai;
}

// Helper function to handle generation with retries and fallback
async function safeGenerateContent(client: any, params: any) {
  const modelsToTry = ["gemini-2.5-flash", "gemini-3.1-flash-lite", "gemini-3.5-flash"];
  let lastError: any = null;

  for (const model of modelsToTry) {
    const updatedParams = { ...params, model };
    
    // Attempt up to 3 times for each model
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[AI] Attempting generateContent with model: ${model} (attempt ${attempt}/3)...`);
        const response = await client.models.generateContent(updatedParams);
        if (response && response.text) {
          return response;
        }
      } catch (err: any) {
        lastError = err;
        console.error(`[AI] Error with ${model} on attempt ${attempt}:`, err.message || err);
        
        // If it's a 400 bad request, retry might not help, but for 503 / 429 it will
        const isTransient = !err.status || err.status === 503 || err.status === 429 || err.message?.includes("503") || err.message?.includes("high demand") || err.message?.includes("UNAVAILABLE");
        
        if (!isTransient && attempt === 1) {
          // If it is a non-transient error, break immediately to try fallback model
          break;
        }

        // Wait before retrying (exponential backoff)
        if (attempt < 3) {
          const delay = attempt * 1000;
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }
  }

  throw lastError || new Error("Failed to generate content after trying multiple models and retries.");
}

// API Routes

// 1. AI Wordle Coach Endpoint
app.post("/api/ai/coach", async (req, res) => {
  try {
    const { guesses, userMessage } = req.body;
    const client = getAI();

    // Construct a comprehensive prompt based on current Wordle board state
    let boardStateText = "The player has not made any guesses yet.";
    if (guesses && guesses.length > 0) {
      boardStateText = guesses.map((g: any, idx: number) => {
        // Result is expected as G (green), Y (yellow), X (gray)
        const feedback = g.result.split('').map((char: string) => {
          if (char === 'G') return "🟩 (Correct letter & position)";
          if (char === 'Y') return "🟨 (Correct letter, wrong position)";
          return "⬛ (Letter is not in word)";
        }).join(' ');
        return `Guess ${idx + 1}: "${g.word.toUpperCase()}" | Feedback: ${feedback}`;
      }).join("\n");
    }

    const systemInstruction = `You are the Wordle Wizard Coach, a world-class strategist for Wordle and 8-letter word games.
Your job is to provide brilliant game-theory advice, analyze the player's guesses, explain what information was gained, and recommend the best next steps.
Analyze word options based on letter frequency (E, A, R, O, T, L, I, S, N, etc.) and strategic eliminations.
Be encouraging, strategic, and sharp. Use markdown formatting. Keep your response within 200-300 words.`;

    const prompt = `Here is the current state of my Wordle game:
${boardStateText}

${userMessage ? `User query/comment: "${userMessage}"` : "Please analyze my game so far, tell me what letters I have confirmed, which letters are excluded, and what is the best strategic approach/candidate words for my next guess."}`;

    const response = await safeGenerateContent(client, {
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({
      success: true,
      advice: response.text,
    });
  } catch (error: any) {
    console.error("Error in Wordle Coach:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred with the AI Coach.",
    });
  }
});

// 2. AI Word Explainer Endpoint
app.post("/api/ai/explain", async (req, res) => {
  try {
    const { word } = req.body;
    if (!word || word.length < 3 || word.length > 12) {
      return res.status(400).json({ success: false, error: "Please provide a valid English word between 3 and 12 letters." });
    }

    const client = getAI();
    const cleanWord = word.toUpperCase();
    const len = cleanWord.length;

    const response = await safeGenerateContent(client, {
      contents: `Analyze the ${len}-letter English word "${cleanWord}". Provide its definition, part of speech, Scrabble value breakdown, difficulty in a word game, a mnemonic to remember it, and 3 natural example sentences.`,
      config: {
        systemInstruction: "You are a professional dictionary assistant and word solver. You return information in a structured JSON format.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING },
            partOfSpeech: { type: Type.STRING, description: "e.g., Noun, Verb, Adjective" },
            definition: { type: Type.STRING, description: "Clear, concise definition of the word." },
            scrabbleAnalysis: { type: Type.STRING, description: "Brief note about its Scrabble strategy or score." },
            mnemonic: { type: Type.STRING, description: "A clever mnemonic, fun origin, or tip to remember this word." },
            wordleDifficulty: { type: Type.STRING, description: "Easy, Medium, or Hard based on letter commonality" },
            sentences: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Three example sentences using the word."
            }
          },
          required: ["word", "partOfSpeech", "definition", "scrabbleAnalysis", "mnemonic", "wordleDifficulty", "sentences"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    res.json({
      success: true,
      data: parsedData
    });
  } catch (error: any) {
    console.error("Error in Word Explainer:", error);
    res.status(500).json({
      success: false,
      error: error.message || "An error occurred explaining the word."
    });
  }
});

// Integration of Vite Dev Server / Static Assets (Local Dev Only)
async function setupExpress() {
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    // Development mode (Local)
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[Wordle Wizard] Server running at http://localhost:${PORT}`);
    });
  }
}

setupExpress();

export default app;
