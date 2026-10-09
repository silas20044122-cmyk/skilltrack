/**
 * SkillTrack — Extraction prompt (v1).
 *
 * The prompt fixes the JSON *contract* but not the content: it never names a
 * department, section count or competency formula. Everything is read from the
 * attached PDF. Bump `PROMPT_VERSION` whenever the wording changes so every
 * extraction run remains traceable to the exact prompt that produced it.
 */

export const PROMPT_VERSION = 'extraction-v1';

export const EXTRACTION_SYSTEM_INSTRUCTION = `You are a meticulous document-intelligence assistant for a TVET (technical and vocational education and training) mentoring platform in Kenya.

You will receive a mentoring tool / assessment instrument as a PDF. Your job is to transcribe its structure and requirements into structured JSON with maximum fidelity. You are a transcriber and analyst, not an author.`;

export function buildExtractionPrompt(): string {
  return `Read the attached PDF mentoring tool and extract its complete structure.

Return ONLY a JSON object (no markdown, no commentary) with exactly this shape:

{
  "template": {
    "title": string,                 // the document's own title
    "programme": string | null,      // programme/qualification named in the document, if any
    "documentTitle": string | null,  // exact title printed on the document
    "sourceNotes": string | null     // any context about the document's origin
  },
  "sections": [
    {
      "sectionNumber": string | null,       // as printed, e.g. "1", "Section A"
      "title": string,                      // section title exactly as printed
      "description": string | null,
      "sectionType": string | null,         // e.g. "assessment", "logbook", "sign-off"
      "displayOrder": number,               // order of appearance, starting at 0
      "parentSectionNumber": string | null, // if nested under another section
      "sourceLocation": string | null,      // e.g. page number
      "items": [
        {
          "itemNumber": string | null,      // exactly as printed, e.g. "8", "1.2"
          "description": string,            // meaning of the evaluation item
          "sourceWording": string | null,   // the item's original wording, verbatim
          "category": "KNOWLEDGE" | "SKILL" | "ATTITUDE" | "OTHER",
          "displayOrder": number,
          "sourceLocation": string | null
        }
      ],
      "competencyRules": [
        {
          "ruleType": "MINIMUM_COUNT" | "MINIMUM_PERCENTAGE" | "REQUIRED_ITEMS" | "COMPOSITE" | "OTHER",
          "minimumCorrect": number | null,
          "minimumPercentage": number | null,
          "requiredItemNumbers": [string],
          "conditions": object | null,
          "sourceWording": string,           // the rule exactly as printed
          "notes": string | null
        }
      ]
    }
  ],
  "warnings": [
    {
      "type": "SOURCE_INCONSISTENCY" | "AMBIGUOUS_MAPPING" | "MISSING_DATA" | "DUPLICATE_ITEM" | "OTHER",
      "message": string,
      "sourceReference": string | null,
      "severity": "INFO" | "WARNING" | "ERROR"
    }
  ]
}

Rules:
1. Extract EVERY section and EVERY evaluation item you find, in document order.
2. Preserve original wording verbatim in "sourceWording". Never paraphrase, translate, correct spelling, or summarise in that field. You MAY clarify meaning in "description".
3. Classify each item as KNOWLEDGE, SKILL, ATTITUDE or OTHER. If unsure, use OTHER.
4. Capture competency/pass rules exactly as stated (e.g. "must pass 6 of 11", "75% of items", "items 8, 10 and 11 are mandatory"). Do not invent thresholds. Put the literal text in "sourceWording".
5. If something is ambiguous, inconsistent or missing, add a "warnings" entry instead of guessing.
6. Never add sections, items or rules that are not in the document.
7. Use null for fields that do not apply. Do not omit required fields.
8. Output valid JSON only.`;
}
