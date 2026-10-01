import type { AgentDocuments, AgentGuidance, AgentIntent, DemoService, RequirementCheck } from "./types";

export function runGuidanceAgent(
  intent: AgentIntent,
  matches: DemoService[],
  requirements: RequirementCheck[],
  documents: AgentDocuments,
): AgentGuidance {
  const service = matches[0];
  if (!service) {
    return {
      status: "verification_required",
      title: "Verification required",
      message: "No verified service record in the catalog matched this request. SEVA cannot provide service-specific eligibility, document, deadline, fee, application-status, or portal guidance from unverified information.",
      next_step: intent.location
        ? "Ask an administrator to add or verify an official service record before relying on service-specific guidance."
        : "Share your state or Union Territory, then ask an administrator to verify a matching official service record.",
    };
  }

  const notProvided = requirements.find((item) => item.status === "not_provided");
  if (notProvided) {
    return {
      status: "ready",
      title: "Confirm one requirement",
      message: `The verified record lists “${notProvided.requirement}”. It was not provided in your request, so SEVA cannot assess it yet.`,
      next_step: `Confirm: ${notProvided.requirement}`,
    };
  }

  const unresolvedDocument = [...documents.missing, ...documents.uncertain][0];
  if (unresolvedDocument) {
    return {
      status: "ready",
      title: "Review document readiness",
      message: `The verified record lists “${unresolvedDocument}”. Your checklist does not confirm it as ready.`,
      next_step: `Review your checklist for: ${unresolvedDocument}`,
    };
  }

  return {
    status: "ready",
    title: "Review the verified source",
    message: `The catalog record for “${service.name}” is verified. The relevant authority makes final eligibility and application decisions.`,
    next_step: `Open the official source for ${service.name} and confirm the current instructions.`,
  };
}