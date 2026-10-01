import type { DemoService, RequirementCheck } from "./types";

export function runRequirementsAgent(request: string, matches: DemoService[]): RequirementCheck[] {
  const normalizedRequest = request.toLocaleLowerCase("en-IN");
  const checks = new Map<string, RequirementCheck>();

  for (const service of matches) {
    for (const requirement of service.requirements) {
      const words = requirement.toLocaleLowerCase("en-IN").split(/[^\p{L}\p{N}]+/u).filter((word) => word.length > 3);
      const provided = words.length > 0 && words.every((word) => normalizedRequest.includes(word));
      checks.set(requirement, { requirement, status: provided ? "provided" : "not_provided" });
    }
  }

  return [...checks.values()];
}