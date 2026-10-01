import { Router, type IRouter } from "express";
import { and, desc, eq } from "drizzle-orm";
import { db, userServiceJourneysTable } from "@workspace/db";
import {
  AnalyzeRequestBody,
  CreateDocumentBody,
  CreateJourneyBody,
  DeleteDocumentParams,
  ReportServiceOutdatedBody,
  ReportServiceOutdatedParams,
  ReportServiceOutdatedResponse,
  UpdateServiceVerificationBody,
  UpdateServiceVerificationParams,
  UpdateServiceVerificationResponse,
  GetAgentSessionResponse,
  GetAnalyticsSummaryResponse,
  GetDashboardSummaryResponse,
  GetServiceParams,
  GetServiceResponse,
  GetActivityResponse,
  ListDocumentsResponse,
  ListJourneysResponse,
  ListNotificationsResponse,
  ListServicesQueryParams,
  ListServicesResponse,
  MarkNotificationReadParams,
  MarkNotificationReadResponse,
  UpdateDocumentBody,
  UpdateDocumentParams,
  UpdateDocumentResponse,
  UpdateJourneyBody,
  UpdateJourneyParams,
  UpdateJourneyResponse,
  CreateDocumentResponse,
  CreateJourneyResponse,
  AnalyzeRequestResponse,
} from "@workspace/api-zod";
import {
  documents,
  journeys,
  notifications,
  searchCount,
  services,
  type UserDocument,
} from "../lib/seva-store";
import { findCatalogService, findDatabaseService, listServiceCatalog } from "../lib/service-catalog";
import { getAgentSession } from "../lib/agents/agent-session-store";
import { runAgentWorkflow } from "../lib/agents/run-agent-workflow";

const router: IRouter = Router();

router.get("/services", async (req, res): Promise<void> => {
  try {
    const query = ListServicesQueryParams.parse(req.query);
    const q = query.q?.toLowerCase();
    const catalog = await listServiceCatalog();
    const filtered = catalog.filter((service) => {
      const matchesQuery =
        !q ||
        [service.name, service.description, service.category, service.requirements.join(" "), service.authority]
          .join(" ")
          .toLowerCase()
          .includes(q);
      const matchesCategory =
        !query.category || service.category.toLowerCase() === query.category.toLowerCase();
      const matchesState =
        !query.state ||
        service.state.toLowerCase() === query.state.toLowerCase() ||
        service.state === "All India";
      return service.active && matchesQuery && matchesCategory && matchesState;
    });
    res.json(ListServicesResponse.parse(filtered));
  } catch (error) {
    req.log.error({ err: error }, "Service catalog lookup failed");
    res.status(503).json({ error: "The service catalog is temporarily unavailable." });
  }
});

router.get("/services/:id", async (req, res): Promise<void> => {
  try {
    const params = GetServiceParams.parse(req.params);
    const service = await findCatalogService(params.id);
    if (!service) {
      res.status(404).json({ error: "Service not found" });
      return;
    }
    res.json(GetServiceResponse.parse(service));
  } catch (error) {
    req.log.error({ err: error }, "Service lookup failed");
    res.status(503).json({ error: "The service catalog is temporarily unavailable." });
  }
});

router.post("/services/:id/outdated-reports", async (req, res): Promise<void> => {
  const params = ReportServiceOutdatedParams.parse(req.params);
  const body = ReportServiceOutdatedBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  let service;
  try {
    service = await findCatalogService(params.id);
  } catch (error) {
    req.log.error({ err: error }, "Service lookup failed for freshness report");
    res.status(503).json({ error: "The service catalog is temporarily unavailable." });
    return;
  }
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  req.log.info({ serviceId: service.id, reason: body.data.reason }, "Service freshness report received");
  res.status(201).json(
    ReportServiceOutdatedResponse.parse({
      id: `report-${Date.now()}`,
      service_id: service.id,
      status: "received",
      message: "Thanks. This source report has been queued for admin verification.",
    }),
  );
});

router.patch("/admin/services/:id/verification", async (req, res): Promise<void> => {
  const params = UpdateServiceVerificationParams.parse(req.params);
  const body = UpdateServiceVerificationBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  try {
    const databaseService = await findDatabaseService(params.id);
    const demoService = services.find((item) => item.id === params.id);
    if (databaseService) {
      res.status(403).json({ error: "Database-backed source changes require authenticated admin access." });
      return;
    }
    if (!demoService) {
      res.status(404).json({ error: "Service not found" });
      return;
    }
    if (demoService.is_demo && body.data.verification_status.toLowerCase() === "verified") {
      res.status(400).json({ error: "Demo records cannot be marked as verified public services." });
      return;
    }
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(body.data.official_url);
    } catch {
      res.status(400).json({ error: "Official URL must be a valid HTTPS URL." });
      return;
    }
    if (parsedUrl.protocol !== "https:") {
      res.status(400).json({ error: "Official URL must use HTTPS." });
      return;
    }

    Object.assign(demoService, body.data);
    res.json(UpdateServiceVerificationResponse.parse(demoService));
  } catch (error) {
    req.log.error({ err: error, serviceId: params.id }, "Service verification update failed");
    res.status(503).json({ error: "The service record could not be updated right now." });
  }
});

router.get("/journeys", async (req, res): Promise<void> => {
  const sessionId = typeof req.query.session_id === "string" ? req.query.session_id : "";
  if (sessionId && (sessionId.length < 8 || sessionId.length > 100 || !/^[A-Za-z0-9_-]+$/.test(sessionId))) {
    res.status(400).json({ error: "Invalid session_id." });
    return;
  }
  try {
    if (!sessionId) {
      res.json(ListJourneysResponse.parse(journeys));
      return;
    }
    const rows = await db
      .select()
      .from(userServiceJourneysTable)
      .where(eq(userServiceJourneysTable.userId, sessionId))
      .orderBy(desc(userServiceJourneysTable.updatedAt));
    const catalog = await listServiceCatalog();
    const persisted = rows.flatMap((row) => {
      const service = catalog.find((item) => item.id === row.serviceId);
      if (!service) return [];
      return [{
        id: row.id,
        service_id: service.id,
        service_name: service.name,
        status: row.status,
        progress: row.progress,
        last_activity: row.lastActivity,
        next_action: row.nextAction,
        current_stage: row.currentStage,
      }];
    });
    res.json(ListJourneysResponse.parse([...persisted, ...journeys]));
  } catch (error) {
    req.log.error({ err: error }, "Journey lookup failed");
    res.status(503).json({ error: "Journeys are temporarily unavailable." });
  }
});

router.post("/journeys", async (req, res): Promise<void> => {
  const body = CreateJourneyBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  let service;
  try {
    service = await findCatalogService(body.data.service_id);
  } catch (error) {
    req.log.error({ err: error }, "Service lookup failed while creating journey");
    res.status(503).json({ error: "The service catalog is temporarily unavailable." });
    return;
  }
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  const journey = {
    id: `journey-${Date.now()}`,
    service_id: service.id,
    service_name: service.name,
    status: "Saved",
    progress: 18,
    last_activity: "Just now",
    next_action: "Check the requirements for this service",
    current_stage: "Discover",
  };
  journeys.unshift(journey);
  res.status(201).json(CreateJourneyResponse.parse(journey));
});

router.patch("/journeys/:id", async (req, res): Promise<void> => {
  const params = UpdateJourneyParams.parse(req.params);
  const body = UpdateJourneyBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const journey = journeys.find((item) => item.id === params.id);
  if (journey) {
    const { session_id: _sessionId, ...update } = body.data;
    Object.assign(journey, update, { last_activity: "Just now" });
    res.json(UpdateJourneyResponse.parse(journey));
    return;
  }

  const sessionId = body.data.session_id;
  if (!sessionId || !params.id.startsWith(`journey-${sessionId}-`)) {
    res.status(404).json({ error: "Journey not found" });
    return;
  }
  try {
    const [stored] = await db
      .select()
      .from(userServiceJourneysTable)
      .where(and(
        eq(userServiceJourneysTable.id, params.id),
        eq(userServiceJourneysTable.userId, sessionId),
      ))
      .limit(1);
    if (!stored) {
      res.status(404).json({ error: "Journey not found" });
      return;
    }
    const service = await findCatalogService(stored.serviceId);
    if (!service) {
      res.status(404).json({ error: "Service not found" });
      return;
    }
    const { session_id: _sessionId, ...update } = body.data;
    const next = {
      status: update.status ?? stored.status,
      progress: update.progress ?? stored.progress,
      current_stage: update.current_stage ?? stored.currentStage,
      next_action: update.next_action ?? stored.nextAction,
      last_activity: new Date().toISOString(),
    };
    await db
      .update(userServiceJourneysTable)
      .set({
        status: next.status,
        progress: next.progress,
        currentStage: next.current_stage,
        nextAction: next.next_action,
        lastActivity: next.last_activity,
        updatedAt: new Date(),
      })
      .where(and(
        eq(userServiceJourneysTable.id, params.id),
        eq(userServiceJourneysTable.userId, sessionId),
      ));
    res.json(UpdateJourneyResponse.parse({
      id: stored.id,
      service_id: service.id,
      service_name: service.name,
      ...next,
    }));
  } catch (error) {
    req.log.error({ err: error, journeyId: params.id }, "Journey update failed");
    res.status(503).json({ error: "The journey could not be updated right now." });
  }
});

router.get("/documents", (_req, res): void => {
  res.json(ListDocumentsResponse.parse(documents));
});

router.post("/documents", (req, res): void => {
  const body = CreateDocumentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const document: UserDocument = {
    id: `doc-${Date.now()}`,
    name: body.data.name,
    category: body.data.category,
    status: "ready",
    updated_at: "Added just now",
  };
  documents.unshift(document);
  res.status(201).json(CreateDocumentResponse.parse(document));
});

router.patch("/documents/:id", (req, res): void => {
  const params = UpdateDocumentParams.parse(req.params);
  const body = UpdateDocumentBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const document = documents.find((item) => item.id === params.id);
  if (!document) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  Object.assign(document, body.data, { updated_at: "Updated just now" });
  res.json(UpdateDocumentResponse.parse(document));
});

router.delete("/documents/:id", (req, res): void => {
  const params = DeleteDocumentParams.parse(req.params);
  const index = documents.findIndex((item) => item.id === params.id);
  if (index === -1) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  documents.splice(index, 1);
  res.sendStatus(204);
});

router.get("/agent/session", async (req, res): Promise<void> => {
  const sessionId = typeof req.query.session_id === "string" ? req.query.session_id : "";
  if (sessionId.length < 8 || sessionId.length > 100 || !/^[A-Za-z0-9_-]+$/.test(sessionId)) {
    res.status(400).json({ error: "A valid session_id is required." });
    return;
  }
  try {
    res.json(GetAgentSessionResponse.parse(await getAgentSession(sessionId)));
  } catch (error) {
    req.log.error({ err: error }, "Agent session lookup failed");
    res.status(503).json({ error: "Agent activity is temporarily unavailable." });
  }
});

router.post("/agent/analyze", async (req, res): Promise<void> => {
  const body = AnalyzeRequestBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  try {
    const result = await runAgentWorkflow(body.data.request.trim(), body.data.session_id);
    req.log.info({ sessionId: result.session_id, matchedServices: result.service_ids.length }, "Agent workflow completed");
    res.json(AnalyzeRequestResponse.parse(result));
  } catch (error) {
    req.log.error({ err: error }, "Agent workflow failed");
    res.status(503).json({ error: "SEVA could not complete this request. Please retry shortly." });
  }
});

router.get("/notifications", (_req, res): void => {
  res.json(ListNotificationsResponse.parse(notifications));
});

router.post("/notifications/:id/read", (req, res): void => {
  const params = MarkNotificationReadParams.parse(req.params);
  const notification = notifications.find((item) => item.id === params.id);
  if (!notification) {
    res.status(404).json({ error: "Notification not found" });
    return;
  }
  notification.unread = false;
  res.json(MarkNotificationReadResponse.parse(notification));
});

router.get("/dashboard/summary", (_req, res): void => {
  const ready = documents.filter((document) => document.status === "ready").length;
  const readiness = Math.round((ready / documents.length) * 100);
  res.json(
    GetDashboardSummaryResponse.parse({
      active_journeys: journeys.filter((journey) => journey.status !== "Saved").length,
      saved_services: journeys.length,
      document_readiness: readiness,
      pending_steps: documents.filter((document) => document.status !== "ready").length,
      searches: searchCount,
    }),
  );
});

router.get("/dashboard/activity", (_req, res): void => {
  res.json(
    GetActivityResponse.parse([
      { id: "activity-1", label: "Request analyzed", detail: "Education support request mapped to demo information", time: "12 min ago", type: "agent" },
      { id: "activity-2", label: "Document readiness updated", detail: "Academic document marked as ready", time: "Yesterday", type: "documents" },
      { id: "activity-3", label: "Service saved", detail: "Certificate service added to My Services", time: "Sep 26, 2026", type: "service" },
    ]),
  );
});

router.get("/analytics/summary", (_req, res): void => {
  res.json(
    GetAnalyticsSummaryResponse.parse({
      total_searches: searchCount,
      successful_matches: 94,
      incomplete_journeys: 2,
      average_completion: 61,
      category_counts: [
        { label: "Education", value: 42 },
        { label: "Certificates", value: 28 },
        { label: "Employment", value: 24 },
        { label: "Business", value: 18 },
      ],
      missing_information: [
        { label: "State or district", value: 32 },
        { label: "Document readiness", value: 26 },
        { label: "Service type", value: 18 },
      ],
    }),
  );
});

export default router;