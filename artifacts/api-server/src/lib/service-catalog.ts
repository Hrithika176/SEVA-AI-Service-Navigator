import { asc, eq } from "drizzle-orm";
import { db, servicesTable } from "@workspace/db";
import { services as demoServices, type DemoService } from "./seva-store";

type DatabaseService = typeof servicesTable.$inferSelect;

const fromDatabase = (service: DatabaseService): DemoService => ({
  id: service.id,
  name: service.name,
  description: service.description,
  category: service.category,
  level: service.level,
  state: service.state,
  authority: service.authority,
  eligibility: service.eligibility,
  requirements: service.requirements,
  documents: service.documents,
  application_method: service.applicationMethod,
  official_url: service.officialUrl,
  source_name: service.sourceName,
  source_type: service.sourceType,
  last_verified: service.lastVerified,
  verification_status: service.verificationStatus,
  active: service.active,
  is_demo: service.isDemo,
});

export async function listServiceCatalog(): Promise<DemoService[]> {
  const records = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.active, true))
    .orderBy(asc(servicesTable.name));
  return [...records.map(fromDatabase), ...demoServices.filter((service) => service.active)];
}

export async function findDatabaseService(id: string): Promise<DemoService | undefined> {
  const [record] = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.id, id))
    .limit(1);
  return record ? fromDatabase(record) : undefined;
}

export async function findCatalogService(id: string): Promise<DemoService | undefined> {
  return (await findDatabaseService(id)) ?? demoServices.find((service) => service.id === id);
}

export async function findVerifiedServices(): Promise<DemoService[]> {
  const records = await db
    .select()
    .from(servicesTable)
    .where(eq(servicesTable.active, true))
    .orderBy(asc(servicesTable.name));

  return records
    .filter((service) => !service.isDemo && service.verificationStatus.toLowerCase() === "verified")
    .filter((service) => {
      try {
        return new URL(service.officialUrl).protocol === "https:"
          && Boolean(service.authority.trim())
          && Boolean(service.sourceType.trim())
          && Boolean(service.lastVerified);
      } catch {
        return false;
      }
    })
    .map(fromDatabase);
}