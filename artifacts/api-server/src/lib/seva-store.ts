export type DemoService = {
  id: string;
  name: string;
  description: string;
  category: string;
  level: string;
  state: string;
  authority: string;
  eligibility: string;
  requirements: string[];
  documents: string[];
  application_method: string;
  official_url: string;
  source_name: string;
  last_verified: string;
  active: boolean;
  is_demo: boolean;
};

export type Journey = {
  id: string;
  service_id: string;
  service_name: string;
  status: string;
  progress: number;
  last_activity: string;
  next_action: string;
  current_stage: string;
};

export type UserDocument = {
  id: string;
  name: string;
  category: string;
  status: string;
  updated_at: string;
};

export type Notification = {
  id: string;
  title: string;
  body: string;
  category: string;
  time: string;
  unread: boolean;
};

export const services: DemoService[] = [
  {
    id: "demo-education-support",
    name: "Demo education support navigator",
    description:
      "A demonstration record showing how SEVA AI can organize possible education-assistance paths without claiming eligibility.",
    category: "Education",
    level: "Central / State",
    state: "All India",
    authority: "Demo record — authority to verify",
    eligibility: "May be relevant for students seeking financial support. Final eligibility is determined by the relevant authority.",
    requirements: ["Current education level", "State of application", "Income information"],
    documents: ["Identity document", "Academic document", "Income document"],
    application_method: "Check the official service portal after confirming the current scheme",
    official_url: "https://www.india.gov.in/",
    source_name: "India.gov.in",
    last_verified: "Demo record — verify before applying",
    active: true,
    is_demo: true,
  },
  {
    id: "demo-certificate-help",
    name: "Demo certificate service guide",
    description:
      "A demonstration record for finding the right certificate process based on a person's state and district.",
    category: "Certificates",
    level: "State / Local",
    state: "All India",
    authority: "Demo record — state authority to verify",
    eligibility: "May be relevant when you need a government-issued certificate. Requirements vary by state and certificate type.",
    requirements: ["Certificate type", "State", "District or local authority"],
    documents: ["Identity document", "Address document", "Application form"],
    application_method: "Online or local office, depending on the verified service",
    official_url: "https://services.india.gov.in/",
    source_name: "National Government Services Portal",
    last_verified: "Demo record — verify before applying",
    active: true,
    is_demo: true,
  },
  {
    id: "demo-employment-support",
    name: "Demo employment service navigator",
    description:
      "A demonstration record for locating potentially relevant employment support and job-service information.",
    category: "Employment",
    level: "Central / State",
    state: "All India",
    authority: "Demo record — authority to verify",
    eligibility: "May be relevant for people exploring employment support. Availability and requirements depend on location.",
    requirements: ["Employment goal", "State of residence", "Preferred service type"],
    documents: ["Identity document", "Education or skills document"],
    application_method: "Verify the official employment portal and local support options",
    official_url: "https://www.india.gov.in/",
    source_name: "India.gov.in",
    last_verified: "Demo record — verify before applying",
    active: true,
    is_demo: true,
  },
  {
    id: "demo-small-business",
    name: "Demo small business support guide",
    description:
      "A demonstration record for mapping an early business question to public support information.",
    category: "Business",
    level: "Central / State / Local",
    state: "All India",
    authority: "Demo record — authority to verify",
    eligibility: "May be relevant for people starting or formalizing a small business. Do not rely on this record for final eligibility.",
    requirements: ["Business activity", "State and district", "Registration or support goal"],
    documents: ["Identity document", "Address document", "Business details"],
    application_method: "Confirm the current official process before submitting any information",
    official_url: "https://services.india.gov.in/",
    source_name: "National Government Services Portal",
    last_verified: "Demo record — verify before applying",
    active: true,
    is_demo: true,
  },
];

export const journeys: Journey[] = [
  {
    id: "journey-education",
    service_id: "demo-education-support",
    service_name: "Education assistance",
    status: "Documents pending",
    progress: 48,
    last_activity: "Today, 10:32 AM",
    next_action: "Verify the income document requirement",
    current_stage: "Documents",
  },
  {
    id: "journey-certificate",
    service_id: "demo-certificate-help",
    service_name: "Certificate service",
    status: "Ready to apply",
    progress: 76,
    last_activity: "Yesterday, 4:18 PM",
    next_action: "Review the official service source",
    current_stage: "Application",
  },
  {
    id: "journey-employment",
    service_id: "demo-employment-support",
    service_name: "Employment service",
    status: "Saved",
    progress: 18,
    last_activity: "Sep 26, 2026",
    next_action: "Tell us what kind of employment support you need",
    current_stage: "Discover",
  },
];

export const documents: UserDocument[] = [
  { id: "doc-identity", name: "Identity document", category: "Identity", status: "ready", updated_at: "Updated today" },
  { id: "doc-academic", name: "Academic document", category: "Education", status: "ready", updated_at: "Updated yesterday" },
  { id: "doc-income", name: "Income document", category: "Financial", status: "needs-review", updated_at: "Needs verification" },
  { id: "doc-form", name: "Application form", category: "Application", status: "missing", updated_at: "Not added yet" },
];

export const notifications: Notification[] = [
  {
    id: "notification-source",
    title: "Verification reminder",
    body: "Your saved education support record is demo information. Check the official source before applying.",
    category: "Updates",
    time: "12 min ago",
    unread: true,
  },
  {
    id: "notification-docs",
    title: "Two preparation steps remain",
    body: "Your education journey still has an income document and application form to review.",
    category: "Documents",
    time: "Yesterday",
    unread: true,
  },
  {
    id: "notification-agent",
    title: "Your service journey is waiting",
    body: "SEVA AI has a next-step suggestion ready for your current journey.",
    category: "Agent",
    time: "Sep 26, 2026",
    unread: false,
  },
];

export const agentSession = {
  id: "session-demo",
  status: "ACTIVE",
  current_task: "Preparing your next service step",
  events: [
    { id: "event-1", label: "Request analyzed", status: "complete" },
    { id: "event-2", label: "Service search completed", status: "complete" },
    { id: "event-3", label: "Requirements identified", status: "complete" },
    { id: "event-4", label: "Document verification", status: "current" },
    { id: "event-5", label: "User confirmation", status: "pending" },
  ],
  updated_at: "Just now",
};

export let searchCount = 128;

export const findService = (id: string) => services.find((service) => service.id === id);

export const updateAgentSession = () => {
  agentSession.updated_at = "Just now";
  return agentSession;
};