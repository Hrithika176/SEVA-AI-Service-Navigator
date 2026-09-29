import { createInsertSchema } from "drizzle-zod";
import {
  boolean,
  date,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

const id = (name: string) => text(name).primaryKey();
const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
};

export const usersTable = pgTable("users", {
  id: id("id"),
  name: text("name"),
  state: text("state"),
  district: text("district"),
  preferredLanguage: text("preferred_language").notNull().default("English"),
  interests: text("interests").array().notNull().default([]),
  ...timestamps,
});

export const servicesTable = pgTable("services", {
  id: id("id"),
  name: text("name").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  level: text("level").notNull(),
  state: text("state").notNull(),
  authority: text("authority").notNull(),
  eligibility: text("eligibility").notNull(),
  requirements: text("requirements").array().notNull().default([]),
  documents: text("documents").array().notNull().default([]),
  applicationMethod: text("application_method").notNull(),
  officialUrl: text("official_url").notNull(),
  sourceName: text("source_name").notNull(),
  lastVerified: date("last_verified", { mode: "string" }).notNull(),
  active: boolean("active").notNull().default(true),
  isDemo: boolean("is_demo").notNull().default(false),
  ...timestamps,
});

export const serviceRequirementsTable = pgTable("service_requirements", {
  id: id("id"),
  serviceId: text("service_id").notNull(),
  label: text("label").notNull(),
  description: text("description").notNull(),
  required: boolean("required").notNull().default(true),
  ...timestamps,
});

export const serviceDocumentsTable = pgTable("service_documents", {
  id: id("id"),
  serviceId: text("service_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  ...timestamps,
});

export const serviceSourcesTable = pgTable("service_sources", {
  id: id("id"),
  serviceId: text("service_id").notNull(),
  sourceName: text("source_name").notNull(),
  officialUrl: text("official_url").notNull(),
  verifiedAt: date("verified_at", { mode: "string" }).notNull(),
  status: text("status").notNull().default("active"),
  ...timestamps,
});

export const userServiceJourneysTable = pgTable("user_service_journeys", {
  id: id("id"),
  userId: text("user_id"),
  serviceId: text("service_id").notNull(),
  status: text("status").notNull(),
  progress: integer("progress").notNull().default(0),
  currentStage: text("current_stage").notNull(),
  nextAction: text("next_action").notNull(),
  lastActivity: text("last_activity").notNull(),
  ...timestamps,
});

export const userDocumentsTable = pgTable("user_documents", {
  id: id("id"),
  userId: text("user_id"),
  name: text("name").notNull(),
  category: text("category").notNull(),
  status: text("status").notNull(),
  objectPath: text("object_path"),
  ...timestamps,
});

export const agentSessionsTable = pgTable("agent_sessions", {
  id: id("id"),
  userId: text("user_id"),
  status: text("status").notNull(),
  currentTask: text("current_task").notNull(),
  ...timestamps,
});

export const agentEventsTable = pgTable("agent_events", {
  id: id("id"),
  sessionId: text("session_id").notNull(),
  label: text("label").notNull(),
  status: text("status").notNull(),
  metadata: jsonb("metadata"),
  ...timestamps,
});

export const notificationsTable = pgTable("notifications", {
  id: id("id"),
  userId: text("user_id"),
  title: text("title").notNull(),
  body: text("body").notNull(),
  category: text("category").notNull(),
  time: text("time").notNull(),
  unread: boolean("unread").notNull().default(true),
  ...timestamps,
});

export const savedServicesTable = pgTable("saved_services", {
  id: id("id"),
  userId: text("user_id"),
  serviceId: text("service_id").notNull(),
  ...timestamps,
});

export const insertServiceSchema = createInsertSchema(servicesTable).omit({
  createdAt: true,
  updatedAt: true,
});
export type InsertService = z.infer<typeof insertServiceSchema>;
export type Service = typeof servicesTable.$inferSelect;