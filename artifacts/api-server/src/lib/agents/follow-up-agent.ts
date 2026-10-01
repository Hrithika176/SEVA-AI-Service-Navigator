import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db, userServiceJourneysTable } from "@workspace/db";
import type { AgentDocuments, AgentFollowUp, AgentGuidance, AgentIntent, DemoService, RequirementCheck } from "./types";

export async function runFollowUpAgent(
  sessionId: string,
  intent: AgentIntent,
  matches: DemoService[],
  requirements: RequirementCheck[],
  documents: AgentDocuments,
  guidance: AgentGuidance,
): Promise<AgentFollowUp> {
  const service = matches[0];
  if (!service) {
    return {
      journey_id: "",
      status: "needs_verification",
      current_stage: "Service discovery",
      next_incomplete_step: guidance.next_step,
    };
  }

  const journeyId = `journey-${sessionId}-${service.id}`;
  const requirementTodo = requirements.find((item) => item.status === "not_provided");
  const documentTodo = [...documents.missing, ...documents.uncertain][0];
  const nextAction = requirementTodo
    ? `Confirm requirement: ${requirementTodo.requirement}`
    : documentTodo
      ? `Review document: ${documentTodo}`
      : guidance.next_step;
  const completedSteps = Number(!requirementTodo) + Number(!documentTodo) + Number(Boolean(intent.location));
  const progress = Math.round((completedSteps / 3) * 100);
  const status = requirementTodo || documentTodo ? "Needs information" : "Ready to review source";
  const currentStage = requirementTodo ? "Requirements" : documentTodo ? "Documents" : "Official source";
  const now = new Date().toISOString();

  const existing = await db
    .select({ id: userServiceJourneysTable.id })
    .from(userServiceJourneysTable)
    .where(eq(userServiceJourneysTable.id, journeyId))
    .limit(1);

  if (existing.length) {
    await db
      .update(userServiceJourneysTable)
      .set({ status, progress, currentStage, nextAction, lastActivity: now, updatedAt: new Date() })
      .where(eq(userServiceJourneysTable.id, journeyId));
  } else {
    await db.insert(userServiceJourneysTable).values({
      id: journeyId || `journey-${randomUUID()}`,
      userId: sessionId,
      serviceId: service.id,
      status,
      progress,
      currentStage,
      nextAction,
      lastActivity: now,
    });
  }

  return {
    journey_id: journeyId,
    status,
    current_stage: currentStage,
    next_incomplete_step: nextAction,
  };
}