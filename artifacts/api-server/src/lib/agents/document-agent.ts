import type { AgentDocuments, DemoService } from "./types";

export function runDocumentAgent(request: string, matches: DemoService[]): AgentDocuments {
  const required = [...new Set(matches.flatMap((service) => service.documents))];
  const normalizedRequest = request.toLocaleLowerCase("en-IN");
  const available: string[] = [];
  const missing: string[] = [];
  const uncertain: string[] = [];

  for (const requiredName of required) {
    const normalizedName = requiredName.toLocaleLowerCase("en-IN");
    const words = normalizedName.split(/[^\p{L}\p{N}]+/u).filter((word) => word.length > 2);
    if (!words.length || !words.every((word) => normalizedRequest.includes(word))) {
      uncertain.push(requiredName);
      continue;
    }

    const mentionIndex = normalizedRequest.indexOf(words[0]!);
    const context = normalizedRequest.slice(Math.max(0, mentionIndex - 55), mentionIndex + normalizedName.length + 55);
    if (/\b(don't have|do not have|missing|not available|not ready|still need to get)\b/i.test(context)) {
      missing.push(requiredName);
    } else if (/\b(i have|already have|ready|available|prepared|uploaded)\b/i.test(context)) {
      available.push(requiredName);
    } else {
      uncertain.push(requiredName);
    }
  }

  return { required, available, missing, uncertain };
}