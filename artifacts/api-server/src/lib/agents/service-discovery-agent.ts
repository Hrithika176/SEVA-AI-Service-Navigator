import { findVerifiedServices } from "../service-catalog";
import type { AgentIntent, DemoService } from "./types";

const stopWords = new Set([
  "about", "after", "also", "and", "are", "for", "from", "get", "help", "how",
  "i", "in", "is", "me", "my", "need", "of", "on", "the", "to", "want", "with",
]);

export async function runServiceDiscoveryAgent(request: string, intent: AgentIntent): Promise<DemoService[]> {
  const verifiedCatalog = await findVerifiedServices();
  const terms = request
    .toLocaleLowerCase("en-IN")
    .split(/[^\p{L}\p{N}]+/u)
    .filter((term) => term.length > 2 && !stopWords.has(term));

  return verifiedCatalog
    .map((service) => {
      const searchable = [
        service.name,
        service.description,
        service.category,
        service.state,
        service.authority,
        service.eligibility,
        ...service.requirements,
      ].join(" ").toLocaleLowerCase("en-IN");
      let score = service.category.toLocaleLowerCase("en-IN") === intent.category.toLocaleLowerCase("en-IN") ? 3 : 0;
      for (const term of terms) if (searchable.includes(term)) score += 1;
      if (intent.location && service.state !== "All India" && service.state.toLowerCase() !== intent.location.toLowerCase()) score = 0;
      return { service, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.service.name.localeCompare(b.service.name))
    .slice(0, 5)
    .map(({ service }) => service);
}