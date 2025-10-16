import { faker } from "@faker-js/faker";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { members, projects, tickets, memberStatus, projectStatus, ticketStatus } from "@/lib/schema";
import type { MemberStatus, ProjectStatus, TicketStatus } from "@/lib/schema";

const sqlite = new Database("./.data/dev.sqlite");
const db = drizzle(sqlite);

async function reset() {
  db.delete(tickets).run();
  db.delete(projects).run();
  db.delete(members).run();
}

function randomEnumValue<T extends readonly string[]>(values: T): T[number] {
  return faker.helpers.arrayElement(values);
}

function createSlug(...parts: string[]) {
  return parts
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function seedProjects(count = 120) {
  const data = Array.from({ length: count }, () => {
    const title = faker.company.catchPhrase();
    return {
      slug: createSlug(title, faker.string.alphanumeric(6)),
      title,
      description: faker.company.buzzPhrase(),
      status: randomEnumValue(projectStatus) as ProjectStatus,
      owner: faker.person.fullName(),
    };
  });
  db.insert(projects).values(data).run();
}

function seedMembers(count = 120) {
  const data = Array.from({ length: count }, () => {
    const name = faker.person.fullName();
    const slug = createSlug(name, faker.string.alphanumeric(6));
    return {
      slug,
      name,
      email: faker.internet.email({ firstName: name.split(" ")[0] }),
      status: randomEnumValue(memberStatus) as MemberStatus,
      bio: faker.person.bio(),
      role: faker.person.jobTitle(),
    };
  });
  db.insert(members).values(data).run();
}

function seedTickets(count = 120) {
  const projectIds = db.select({ id: projects.id }).from(projects).all();
  const memberNames = db.select({ name: members.name }).from(members).all();
  const data = Array.from({ length: count }, () => {
    const title = faker.hacker.phrase();
    const slug = createSlug(title, faker.string.alphanumeric(6));
    return {
      slug,
      title,
      summary: faker.lorem.paragraph(),
      status: randomEnumValue(ticketStatus) as TicketStatus,
      projectId: projectIds.length ? faker.helpers.arrayElement(projectIds).id : null,
      assignee: memberNames.length ? faker.helpers.arrayElement(memberNames).name : null,
    };
  });
  db.insert(tickets).values(data).run();
}

async function main() {
  await reset();
  seedProjects();
  seedMembers();
  seedTickets();
  console.log("Seed complete");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
