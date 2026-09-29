import { Router, type IRouter } from "express";
import {
  AnalyzeRequestBody,
  CreateDocumentBody,
  CreateJourneyBody,
  DeleteDocumentParams,
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
  agentSession,
  documents,
  findService,
  journeys,
  notifications,
  searchCount,
  services,
  updateAgentSession,
  type UserDocument,
} from "../lib/seva-store";

const router: IRouter = Router();

router.get("/services", (req, res): void => {
  const query = ListServicesQueryParams.parse(req.query);
  const q = query.q?.toLowerCase();
  const filtered = services.filter((service) => {
    const matchesQuery =
      !q ||
      [service.name, service.description, service.category, service.requirements.join(" ")]
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
});

router.get("/services/:id", (req, res): void => {
  const params = GetServiceParams.parse(req.params);
  const service = findService(params.id);
  if (!service) {
    res.status(404).json({ error: "Service not found" });
    return;
  }
  res.json(GetServiceResponse.parse(service));
});

router.get("/journeys", (_req, res): void => {
  res.json(ListJourneysResponse.parse(journeys));
});

router.post("/journeys", (req, res): void => {
  const body = CreateJourneyBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const service = findService(body.data.service_id);
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

router.patch("/journeys/:id", (req, res): void => {
  const params = UpdateJourneyParams.parse(req.params);
  const body = UpdateJourneyBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const journey = journeys.find((item) => item.id === params.id);
  if (!journey) {
    res.status(404).json({ error: "Journey not found" });
    return;
  }
  Object.assign(journey, body.data, { last_activity: "Just now" });
  res.json(UpdateJourneyResponse.parse(journey));
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

router.get("/agent/session", (_req, res): void => {
  res.json(GetAgentSessionResponse.parse(updateAgentSession()));
});

router.post("/agent/analyze", (req, res): void => {
  const body = AnalyzeRequestBody.safeParse(req.body);
  if (!body.success) {
    res.status(400).json({ error: body.error.message });
    return;
  }
  const request = body.data.request.toLowerCase();
  let category = "General support";
  let serviceIds = services.slice(0, 2).map((service) => service.id);
  if (request.includes("student") || request.includes("education") || request.includes("college")) {
    category = "Education";
    serviceIds = ["demo-education-support"];
  } else if (request.includes("certificate") || request.includes("document")) {
    category = "Certificates";
    serviceIds = ["demo-certificate-help"];
  } else if (request.includes("job") || request.includes("employment") || request.includes("work")) {
    category = "Employment";
    serviceIds = ["demo-employment-support"];
  } else if (request.includes("business") || request.includes("shop") || request.includes("startup")) {
    category = "Business";
    serviceIds = ["demo-small-business"];
  }
  const result = {
    request: body.data.request,
    category,
    service_ids: serviceIds,
    missing_information: ["Current state", "Relevant document readiness"],
    disclaimer:
      "Demo information — verify through the official source before applying. Final eligibility is determined by the relevant authority.",
  };
  res.json(AnalyzeRequestResponse.parse(result));
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