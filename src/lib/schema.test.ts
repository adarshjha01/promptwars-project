import { describe, it, expect } from "vitest";
import { ZodError } from "zod";
import { TriageResponseSchema } from "./schema";

const validTriageData = {
  symptoms: ["headache", "nausea", "dizziness"],
  identified_medications: ["Ibuprofen 400mg", "Metformin 500mg"],
  risk_level: "High" as const,
  potential_interactions:
    "Ibuprofen may reduce the effectiveness of Metformin and increase risk of lactic acidosis.",
  action_plan: [
    "Consult physician before continuing both medications.",
    "Monitor blood glucose levels closely.",
    "Consider alternative pain relief such as acetaminophen.",
  ],
};

describe("TriageResponseSchema", () => {
  it("validates a correct medical triage object", () => {
    const result = TriageResponseSchema.parse(validTriageData);
    expect(result).toEqual(validTriageData);
  });

  it("accepts all valid risk levels", () => {
    for (const level of ["Low", "Medium", "High", "Critical"] as const) {
      const data = { ...validTriageData, risk_level: level };
      expect(() => TriageResponseSchema.parse(data)).not.toThrow();
    }
  });

  it("throws ZodError when risk_level is missing", () => {
    const { risk_level: _risk_level, ...incomplete } = validTriageData;

    expect(() => TriageResponseSchema.parse(incomplete)).toThrow(ZodError);
  });

  it("throws ZodError when risk_level has an invalid value", () => {
    const invalid = { ...validTriageData, risk_level: "Extreme" };

    expect(() => TriageResponseSchema.parse(invalid)).toThrow(ZodError);
  });

  it("throws ZodError when symptoms is not an array", () => {
    const invalid = { ...validTriageData, symptoms: "headache" };

    expect(() => TriageResponseSchema.parse(invalid)).toThrow(ZodError);
  });

  it("throws ZodError when a required field is missing entirely", () => {
    const { action_plan: _action_plan, ...incomplete } = validTriageData;

    expect(() => TriageResponseSchema.parse(incomplete)).toThrow(ZodError);
  });

  it("accepts empty arrays for symptoms, medications, and action_plan", () => {
    const minimal = {
      ...validTriageData,
      symptoms: [],
      identified_medications: [],
      action_plan: [],
    };
    expect(() => TriageResponseSchema.parse(minimal)).not.toThrow();
  });
});
