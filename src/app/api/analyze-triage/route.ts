import {
  GoogleGenerativeAI,
  SchemaType,
  type ResponseSchema,
} from "@google/generative-ai";
import { TriageResponseSchema } from "@/lib/schema";
import { ZodError } from "zod";

/* ─── Response Schema (enforces strict JSON output from Gemini) ─── */
const triageResponseSchema: ResponseSchema = {
  type: SchemaType.OBJECT,
  properties: {
    symptoms: {
      type: SchemaType.ARRAY,
      description:
        "Patient-reported symptoms transcribed from the audio recording.",
      items: { type: SchemaType.STRING },
    },
    identified_medications: {
      type: SchemaType.ARRAY,
      description:
        "Medications identified from the prescription image, including dosage if visible.",
      items: { type: SchemaType.STRING },
    },
    risk_level: {
      type: SchemaType.STRING,
      format: "enum",
      description:
        "Overall risk level based on potential drug interactions and symptom severity.",
      enum: ["Low", "Medium", "High", "Critical"],
    },
    potential_interactions: {
      type: SchemaType.STRING,
      description:
        "A detailed explanation of any potential drug–drug or drug–symptom interactions found.",
    },
    action_plan: {
      type: SchemaType.ARRAY,
      description:
        "Ordered list of recommended next steps for the patient or caregiver.",
      items: { type: SchemaType.STRING },
    },
  },
  required: [
    "symptoms",
    "identified_medications",
    "risk_level",
    "potential_interactions",
    "action_plan",
  ],
};

/* ─── System Prompt ─── */
const SYSTEM_PROMPT = `You are an expert home triage assistant with deep knowledge of pharmacology, drug interactions, and emergency medicine.

You will receive TWO inputs:
1. An IMAGE of a prescription, medication label, or list of medications.
2. An AUDIO recording of a patient (or caregiver) describing their symptoms.

Your job:
- Transcribe the audio and extract every symptom mentioned by the patient.
- Identify every medication visible in the image, including dosage and frequency if legible.
- Cross-reference the identified medications against each other AND against the reported symptoms to detect potential drug–drug interactions or drug–symptom contraindications.
- Assess an overall risk level: Low, Medium, High, or Critical.
- Produce a clear, actionable plan the patient or caregiver should follow.

Be thorough, precise, and err on the side of caution. If the image or audio is unclear, state what you could and could not determine. Never make up medications or symptoms — only report what you can see or hear.`;

/* ─── Helper: File → base64 InlineData ─── */
async function fileToInlineData(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString("base64");
  return {
    inlineData: {
      mimeType: file.type,
      data: base64,
    },
  };
}

/* ─── POST Handler ─── */
export async function POST(request: Request) {
  try {
    /* ── Validate API key ── */
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return Response.json(
        { error: "Server configuration error. API key is not set." },
        { status: 500 },
      );
    }

    /* ── Parse FormData ── */
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;
    const audioFile = formData.get("audio") as File | null;

    if (!imageFile || !(imageFile instanceof File) || imageFile.size === 0) {
      return Response.json(
        { error: "Missing or empty 'image' file in the request." },
        { status: 400 },
      );
    }

    if (!audioFile || !(audioFile instanceof File) || audioFile.size === 0) {
      return Response.json(
        { error: "Missing or empty 'audio' file in the request." },
        { status: 400 },
      );
    }

    /* ── Convert files to base64 inline data ── */
    const [imageData, audioData] = await Promise.all([
      fileToInlineData(imageFile),
      fileToInlineData(audioFile),
    ]);

    /* ── Initialize Gemini ── */
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: triageResponseSchema,
      },
    });

    /* ── Call Gemini with multimodal content ── */
    const result = await model.generateContent([
      SYSTEM_PROMPT,
      imageData,
      audioData,
    ]);

    const response = result.response;
    const text = response.text();

    /* ── Parse JSON then validate with Zod schema ── */
    const rawParsed = JSON.parse(text);
    const validated = TriageResponseSchema.parse(rawParsed);

    return Response.json(validated, { status: 200 });
  } catch (error: unknown) {
    console.error("[analyze-triage] Error:", error);

    /* ── Zod validation failure → malformed AI response ── */
    if (error instanceof ZodError) {
      console.error("[analyze-triage] Zod validation errors:", error.issues);
      return Response.json(
        {
          error:
            "Malformed AI response: the model returned data that does not match the expected schema. Please try again.",
          details: error.issues,
        },
        { status: 500 },
      );
    }

    const message =
      error instanceof Error ? error.message : "An unexpected error occurred.";

    /* Detect timeout-like errors */
    const isTimeout =
      message.toLowerCase().includes("timeout") ||
      message.toLowerCase().includes("deadline");

    return Response.json(
      {
        error: isTimeout
          ? "The analysis request timed out. Please try again with a smaller file."
          : "Failed to analyze the provided files. Please try again.",
      },
      { status: 500 },
    );
  }
}
