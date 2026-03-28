import { z } from "zod";

/**
 * Strict Zod schema that validates every Gemini AI triage response.
 * Any deviation from this shape will throw a ZodError at parse-time,
 * keeping the API contract tight and preventing malformed data from
 * leaking into the frontend or Firestore.
 */
export const TriageResponseSchema = z.object({
  symptoms: z.array(z.string()),
  identified_medications: z.array(z.string()),
  risk_level: z.enum(["Low", "Medium", "High", "Critical"]),
  potential_interactions: z.string(),
  action_plan: z.array(z.string()),
});

/** Inferred TypeScript type from the schema */
export type TriageResult = z.infer<typeof TriageResponseSchema>;
