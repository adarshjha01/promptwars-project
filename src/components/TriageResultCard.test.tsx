import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TriageResultCard from "./TriageResultCard";
import type { TriageResult } from "@/lib/schema";

const mockResult: TriageResult = {
  symptoms: ["chest pain", "shortness of breath"],
  identified_medications: ["Aspirin 81mg", "Warfarin 5mg"],
  risk_level: "Critical",
  potential_interactions:
    "Aspirin and Warfarin both have anticoagulant properties. Combined use significantly increases the risk of bleeding events.",
  action_plan: [
    "Seek immediate medical attention.",
    "Do not take the next scheduled dose until cleared by a physician.",
  ],
};

describe("TriageResultCard", () => {
  it("renders the Critical risk badge with correct text", () => {
    render(
      <TriageResultCard
        result={mockResult}
        saveStatus="idle"
        hasImage={true}
        hasAudio={true}
        onReset={() => {}}
      />,
    );

    const badge = screen.getByRole("status", { name: /risk level: critical/i });
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent("Critical");
    expect(badge).toHaveClass("badge-critical");
  });

  it("renders all patient symptoms", () => {
    render(
      <TriageResultCard
        result={mockResult}
        saveStatus="idle"
        hasImage={true}
        hasAudio={true}
        onReset={() => {}}
      />,
    );

    expect(screen.getByText("chest pain")).toBeInTheDocument();
    expect(screen.getByText("shortness of breath")).toBeInTheDocument();
  });

  it("renders all identified medications", () => {
    render(
      <TriageResultCard
        result={mockResult}
        saveStatus="idle"
        hasImage={true}
        hasAudio={true}
        onReset={() => {}}
      />,
    );

    expect(screen.getByText("Aspirin 81mg")).toBeInTheDocument();
    expect(screen.getByText("Warfarin 5mg")).toBeInTheDocument();
  });

  it("renders the potential interactions warning", () => {
    render(
      <TriageResultCard
        result={mockResult}
        saveStatus="idle"
        hasImage={true}
        hasAudio={true}
        onReset={() => {}}
      />,
    );

    expect(
      screen.getByText(/aspirin and warfarin both have anticoagulant/i),
    ).toBeInTheDocument();
  });

  it("renders action plan steps with numbering", () => {
    render(
      <TriageResultCard
        result={mockResult}
        saveStatus="idle"
        hasImage={true}
        hasAudio={true}
        onReset={() => {}}
      />,
    );

    expect(
      screen.getByText("Seek immediate medical attention."),
    ).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
  });

  it("shows empty state when result is null", () => {
    render(
      <TriageResultCard
        result={null}
        saveStatus="idle"
        hasImage={false}
        hasAudio={false}
        onReset={() => {}}
      />,
    );

    expect(screen.getByText("Analysis Results")).toBeInTheDocument();
    expect(screen.getByText("Awaiting image")).toBeInTheDocument();
    expect(screen.getByText("Awaiting recording")).toBeInTheDocument();
  });

  it("shows 'Saved' badge when saveStatus is saved", () => {
    render(
      <TriageResultCard
        result={mockResult}
        saveStatus="saved"
        hasImage={true}
        hasAudio={true}
        onReset={() => {}}
      />,
    );

    expect(screen.getByText("Saved")).toBeInTheDocument();
  });
});
