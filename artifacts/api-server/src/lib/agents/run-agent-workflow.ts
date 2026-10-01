import { randomUUID } from "node:crypto";
import { AnalyzeRequestResponse } from "@workspace/api-zod";
import { completeAgentSession, recordAgentEvent } from "./agent-session-store";
import { runDocumentAgent } from "./document-agent";
import { runFollowUpAgent } from "./follow-up-agent";
import { runGuidanceAgent } from "./guidance-agent";
import { runIntentAgent } from "./intent-agent";
import { runRequirementsAgent } from "./requirements-agent";
import { runServiceDiscoveryAgent } from "./service-discovery-agent";
import type { SafeAgentEvent } from "./types";

export async function runAgentWorkflow(request: string, requestedSessionId?: string) {
  const sessionId = requestedSessionId ?? `session-${randomUUID()}`;
  const events: SafeAgentEvent[] = [];
  const record = async (label: string, task: string) => {
    events.push(await recordAgentEvent(sessionId, label, task));
  };

  await record("REQUEST_RECEIVED", "Structuring the request");
  const intent = runIntentAgent(request);
  await record("INTENT_IDENTIFIED", "Searching verified service records");

  const matches = await runServiceDiscoveryAgent(request, intent);
  await record("SERVICES_FOUND", "Checking catalog requirements");

  const requirements = runRequirementsAgent(request, matches);
  await record("REQUIREMENTS_CHECKED", "Reviewing the document checklist");

  const documentState = runDocumentAgent(request, matches);
  await record("DOCUMENTS_IDENTIFIED", "Preparing a source-grounded next step");

  const guidance = runGuidanceAgent(intent, matches, requirements, documentState);
  const followUp = await runFollowUpAgent(
    sessionId,
    intent,
    matches,
    requirements,
    documentState,
    guidance,
  );

  await record("NEXT_STEP_PREPARED", "Agent workflow completed");
  const finalStatus = guidance.status === "verification_required" ? "needs_verification" : "completed";
  await completeAgentSession(sessionId, finalStatus, followUp.next_incomplete_step);

  const result = {
    request,
    session_id: sessionId,
    category: intent.category,
    service_ids: matches.map((service) => service.id),
    missing_information: intent.missing_information,
    disclaimer: matches.length
      ? "Service matches and service-specific guidance come only from verified catalog records. Final decisions are made by the relevant authority."
      : "Verification required. No verified catalog record matched this request; demo or general-knowledge content is not used as a service recommendation.",
    intent,
    requirement_checks: requirements,
    documents: documentState,
    guidance,
    follow_up: followUp,
    events,
  };

  return AnalyzeRequestResponse.parse(result);
}