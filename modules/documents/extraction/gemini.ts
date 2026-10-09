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

  let response;
  try {
    response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
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
      ],
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0,
      },
    });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Gemini extraction request failed: ${detail}`);
  }

  const raw = response.text;
  if (!raw) {
    throw new Error('Gemini returned an empty response.');
  }
  return { raw, model };
}
