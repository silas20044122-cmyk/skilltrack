import { GoogleGenAI } from '@google/genai';

/**
 * Thin wrapper over the Gemini SDK.
 *
 * The model name is configuration (`GEMINI_MODEL`), never hard-coded, so a new
 * model can be adopted without a code change. Missing configuration or an
 * unavailable model is surfaced as a normal, catchable error — extraction then
 * fails softly and is recorded, never silently ignored.
 */

export function getGeminiModel(): string {
  return process.env.GEMINI_MODEL?.trim() || 'gemini-3.8-flash';
}

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not configured.');
  }
  return new GoogleGenAI({ apiKey });
}

export interface GeminiExtractionResponse {
  raw: string;
  model: string;
}

const MAX_ATTEMPTS = 5;
const BASE_DELAY_MS = 1500;

/**
 * Transient upstream conditions (model overload / rate limits) that are worth
 * retrying. The Gemini API reports these as HTTP 503 UNAVAILABLE, 429
 * RESOURCE_EXHAUSTED, or 500/502/504.
 */
const RETRYABLE = /UNAVAILABLE|RESOURCE_EXHAUSTED|overloaded|high demand|code":(?:429|500|502|503|504)\b/i;

/**
 * Send a PDF plus an instruction prompt to Gemini and return the raw text.
 * The caller is responsible for JSON parsing and schema validation.
 */
export async function runGeminiExtraction(
  pdf: Buffer,
  prompt: string,
  systemInstruction: string
): Promise<GeminiExtractionResponse> {
  const model = getGeminiModel();
  const ai = getClient();

  const contents = [
    {
      role: 'user' as const,
      parts: [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: pdf.toString('base64'),
          },
        },
        { text: prompt },
      ],
    },
  ];

  let lastDetail = '';
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config: {
          systemInstruction,
          responseMimeType: 'application/json',
          temperature: 0,
        },
      });

      const raw = response.text;
      if (!raw) {
        throw new Error('Gemini returned an empty response.');
      }
      return { raw, model };
    } catch (error) {
      lastDetail = error instanceof Error ? error.message : String(error);
      if (attempt >= MAX_ATTEMPTS || !RETRYABLE.test(lastDetail)) {
        throw new Error(`Gemini extraction request failed: ${lastDetail}`);
      }
      const delay = BASE_DELAY_MS * attempt + Math.floor(Math.random() * 500);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(`Gemini extraction request failed: ${lastDetail}`);
}
