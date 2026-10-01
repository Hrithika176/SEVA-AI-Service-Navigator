import type { DemoService, UserDocument } from "../seva-store";

export type AgentIntent = {
  category: string;
  purpose: string;
  location: string;
  user_type: string;
  missing_information: string[];
};

export type RequirementCheck = {
  requirement: string;
  status: "provided" | "not_provided";
};

export type AgentDocuments = {
  required: string[];
  available: string[];
  missing: string[];
  uncertain: string[];
};

export type AgentGuidance = {
  status: "ready" | "verification_required";
  title: string;
  message: string;
  next_step: string;
};

export type AgentFollowUp = {
  journey_id: string;
  status: string;
  current_stage: string;
  next_incomplete_step: string;
};

export type SafeAgentEvent = {
  id: string;
  label: string;
  status: string;
};

export type AgentContext = {
  request: string;
  intent: AgentIntent;
  matches: DemoService[];
  requirements: RequirementCheck[];
  documents: AgentDocuments;
  guidance: AgentGuidance;
  follow_up: AgentFollowUp;
  events: SafeAgentEvent[];
};

export type { DemoService, UserDocument };