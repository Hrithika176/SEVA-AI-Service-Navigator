import type { AgentIntent } from "./types";

const stateNames = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa",
  "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland",
  "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttar Pradesh", "Uttarakhand", "West Bengal", "Andaman and Nicobar Islands",
  "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry",
];

const userTypes = [
  ["student", /\b(student|pupil|college student|scholar)\b/i],
  ["farmer", /\b(farmer|agriculturist)\b/i],
  ["senior citizen", /\b(senior citizen|elderly|retired)\b/i],
  ["person with a disability", /\b(disabilit|divyang|accessibility)\b/i],
  ["job seeker", /\b(job seeker|unemployed|looking for work)\b/i],
  ["small business owner", /\b(small business|shop owner|business owner|entrepreneur)\b/i],
] as const;

const categoryRules = [
  { category: "Education", pattern: /\b(student|education|school|college|scholarship|tuition)\b/i, purpose: "education-related support" },
  { category: "Certificates", pattern: /\b(certificate|birth certificate|caste certificate|income certificate|residence certificate|domicile)\b/i, purpose: "certificate or document service" },
  { category: "Employment", pattern: /\b(job|employment|work|unemployed|skills training)\b/i, purpose: "employment-related support" },
  { category: "Business", pattern: /\b(business|startup|shop|enterprise|trade license)\b/i, purpose: "business-related support" },
];

export function runIntentAgent(request: string): AgentIntent {
  const rule = categoryRules.find((candidate) => candidate.pattern.test(request));
  const normalizedRequest = request.toLocaleLowerCase("en-IN");
  const location = stateNames.find((state) => normalizedRequest.includes(state.toLocaleLowerCase("en-IN"))) ?? "";
  const userType = userTypes.find(([, pattern]) => pattern.test(request))?.[0] ?? "";
  const missingInformation: string[] = [];

  if (!rule) missingInformation.push("Type of public service or outcome needed");
  if (!location) missingInformation.push("State or Union Territory");

  return {
    category: rule?.category ?? "Unclassified",
    purpose: rule?.purpose ?? "Clarification needed",
    location,
    user_type: userType,
    missing_information: missingInformation,
  };
}