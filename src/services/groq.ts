const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

interface GenerateItineraryParams {
  destination: string;
  startDate: string;
  endDate: string;
  interests: string;
  budgetLevel: "budget" | "moderate" | "luxury";
}

export interface GeneratedDay {
  day: number;
  date: string;
  summary: string;
  activities: {
    time: string;
    title: string;
    description: string;
    estimatedCost: number;
  }[];
}

async function callGroq(prompt: string, system: string): Promise<string> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing VITE_GROQ_API_KEY environment variable.");

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API error (${response.status}): ${text}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

export async function generateItinerary(params: GenerateItineraryParams): Promise<GeneratedDay[]> {
  const system =
    "You are a professional travel planner. Respond ONLY with valid JSON matching this shape: " +
    '{"days": [{"day": number, "date": "YYYY-MM-DD", "summary": string, "activities": ' +
    '[{"time": "HH:MM", "title": string, "description": string, "estimatedCost": number}]}]}. ' +
    "No prose outside the JSON.";

  const prompt = `Create a detailed day-by-day itinerary for a trip to ${params.destination}, from ${params.startDate} to ${params.endDate}. Traveler interests: ${params.interests}. Budget level: ${params.budgetLevel}. Include 3-5 activities per day with realistic times and estimated costs in USD.`;

  const raw = await callGroq(prompt, system);
  const parsed = JSON.parse(raw);
  return parsed.days as GeneratedDay[];
}

export async function generatePackingList(
  destination: string,
  durationDays: number,
  activities: string
): Promise<string[]> {
  const system =
    'Respond ONLY with valid JSON: {"items": string[]}. No prose outside the JSON.';
  const prompt = `Generate a packing list for a ${durationDays}-day trip to ${destination}. Planned activities: ${activities}.`;
  const raw = await callGroq(prompt, system);
  const parsed = JSON.parse(raw);
  return parsed.items as string[];
}

export async function chatWithAssistant(
  message: string,
  tripContext: string
): Promise<string> {
  const system =
    "You are VoyageAI's travel assistant. Give concise, practical, friendly answers about the user's trip. Keep responses under 150 words unless asked for detail.";
  const prompt = `Trip context: ${tripContext}\n\nUser question: ${message}`;

  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing VITE_GROQ_API_KEY environment variable.");

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
      temperature: 0.6,
    }),
  });

  if (!response.ok) throw new Error(`Groq API error (${response.status})`);
  const data = await response.json();
  return data.choices[0].message.content;
}

export interface DocumentAnalysis {
  extractedText: string;
  summary: string;
  suggestedCategory:
    | "passport"
    | "visa"
    | "ticket"
    | "hotel_booking"
    | "receipt"
    | "map"
    | "photo"
    | "other";
  keyDetails: Record<string, string>;
}

/**
 * Analyze a travel document image (passport, ticket, hotel booking, receipt, etc.)
 * using a Groq vision-capable model. Pass a base64-encoded image (no data: prefix)
 * and its mime type.
 *
 * IMPORTANT — Groq's vision model lineup changes frequently and models get
 * decommissioned with only a few weeks' notice:
 *   - llama-3.2-90b-vision-preview (used here previously) was decommissioned back
 *     when Meta's Llama 4 models launched (~April 2025). Calls to it fail with a
 *     `model_decommissioned` error.
 *   - meta-llama/llama-4-scout-17b-16e-instruct (used below) is the current
 *     replacement, but Groq announced ITS deprecation on June 17, 2026 too, with
 *     roughly a 30-day grace period — so check
 *     https://console.groq.com/docs/deprecations before relying on this in
 *     production, and https://console.groq.com/docs/vision for whatever
 *     vision-capable model is current when you read this.
 */
export async function analyzeDocumentImage(
  base64Image: string,
  mimeType: string
): Promise<DocumentAnalysis> {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) throw new Error("Missing VITE_GROQ_API_KEY environment variable.");

  const system =
    'Respond ONLY with valid JSON: {"extractedText": string, "summary": string, ' +
    '"suggestedCategory": "passport"|"visa"|"ticket"|"hotel_booking"|"receipt"|"map"|"photo"|"other", ' +
    '"keyDetails": {[key: string]: string}}. ' +
    "extractedText should be a full OCR transcription of all visible text. " +
    "summary should be 1-2 sentences describing what the document is. " +
    "keyDetails should pull out relevant fields (e.g. name, dates, confirmation numbers, amounts) " +
    "as a flat key-value object. No prose outside the JSON.";

  const response = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "meta-llama/llama-4-scout-17b-16e-instruct",
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: [
            { type: "text", text: "Extract and analyze this travel document." },
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64Image}` },
            },
          ],
        },
      ],
      temperature: 0.2,
      response_format: { type: "json_object" },
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Groq Vision API error (${response.status}): ${text}. If this says the model was ` +
        `decommissioned, check https://console.groq.com/docs/vision for the current vision model ` +
        `and update src/services/groq.ts.`
    );
  }

  const data = await response.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  return parsed as DocumentAnalysis;
}
