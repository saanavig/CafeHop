import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });
import * as z from "zod";
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});

const ReceiptSchema = z.object({
  merchant_name: z.string().nullable(),
  subtotal_cents: z.number().int().nullable(),
  tax_cents: z.number().int().nullable(),
  total_cents: z.number().int().nullable(),
});

const ocrText = `
STARBUCKS
Latte 5.25
Tax 0.42
Total 5.67
`;

async function main() {
  const response = await ai.models.generateContent({
    model: "models/gemini-2.5-flash",
    contents: `
Parse this receipt OCR text into strict JSON.

Rules:
- Output ONLY valid JSON.
- subtotal_cents, tax_cents, total_cents must be integers (in cents).
- If missing, use null.

OCR TEXT:
${ocrText}

Return format:
{
  "merchant_name": string | null,
  "subtotal_cents": number | null,
  "tax_cents": number | null,
  "total_cents": number | null
}
`,
  });

  console.log("RAW RESPONSE:");
  console.log(response.text);

  try {
    const parsed = JSON.parse(response.text!);
    console.log("\nPARSED JSON:");
    console.log(parsed);
  } catch {
    console.log("Model did not return valid JSON.");
  }
}

main().catch(console.error);