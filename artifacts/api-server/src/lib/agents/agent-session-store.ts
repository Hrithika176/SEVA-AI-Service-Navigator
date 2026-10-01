import { randomUUID } from "node:crypto";
import { desc, eq } from "drizzle-orm";
import { db, agentEventsTable, agentSessionsTable } from "@workspace/db";
import type { SafeAgentEvent } from "./types";

const updateSession = async (sessionId: string, status: string, currentTask: string) => {
  const now = new Date();
  await db
    .insert(agentSessionsTable)
    .values({ id: sessionId, userId: sessionId, status, currentTask, updatedAt: now })
    .onConflictDoUpdate({
      target: agentSessionsTable.id,
      set: { status, currentTask, updatedAt: now },
    });
};

export async function recordAgentEvent(
  sessionId: string,
  label: string,
  currentTask: string,
  status = "complete",
): Promise<SafeAgentEvent> {
  await updateSession(sessionId, "active", currentTask);
  const event = { id: `event-${randomUUID()}`, label, status };
  await db.insert(agentEventsTable).values({
    id: event.id,
    sessionId,
    label,
    status,
    metadata: null,
  });
  return event;
}

export async function completeAgentSession(sessionId: string, status: string, currentTask: string): Promise<void> {
  await updateSession(sessionId, status, currentTask);
}

export async function getAgentSession(sessionId: string) {
  const [session] = await db
    .select()
    .from(agentSessionsTable)
    .where(eq(agentSessionsTable.id, sessionId))
    .limit(1);
  const events = await db
    .select({
      id: agentEventsTable.id,
      label: agentEventsTable.label,
      status: agentEventsTable.status,
    })
    .from(agentEventsTable)
    .where(eq(agentEventsTable.sessionId, sessionId))
    .orderBy(desc(agentEventsTable.createdAt))
    .limit(30);

  return {
    id: sessionId,
    status: session?.status ?? "ready",
    current_task: session?.currentTask ?? "Waiting for a request",
    events: events.reverse(),
    updated_at: session?.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}