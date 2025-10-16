import { faker } from "@faker-js/faker";
import { client, db } from "@/lib/db";
import type { MemberStatus, ProjectStatus, TicketStatus } from "@/lib/schema";
import {
  memberStatus,
  members,
  projectStatus,
  projects,
  ticketStatus,
  tickets,
} from "@/lib/schema";

const DEFAULT_SEED_COUNT = 120;
const SLUG_SUFFIX_LENGTH = 6;

async function reset() {
  await db.delete(tickets);
  await db.delete(projects);
  await db.delete(members);
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

async function seedProjects(count = DEFAULT_SEED_COUNT) {
  const data = Array.from({ length: count }, () => {
    const title = faker.company.catchPhrase();
    return {
      slug: createSlug(title, faker.string.alphanumeric(SLUG_SUFFIX_LENGTH)),
      title,
      description: faker.company.buzzPhrase(),
      status: randomEnumValue(projectStatus) as ProjectStatus,
      owner: faker.person.fullName(),
    };
  });
  await db.insert(projects).values(data);
}

async function seedMembers(count = DEFAULT_SEED_COUNT) {
  const data = Array.from({ length: count }, () => {
    const name = faker.person.fullName();
    const slug = createSlug(
      name,
      faker.string.alphanumeric(SLUG_SUFFIX_LENGTH)
    );
    return {
      slug,
      name,
      email: faker.internet.email({ firstName: name.split(" ")[0] }),
      status: randomEnumValue(memberStatus) as MemberStatus,
      bio: faker.person.bio(),
      role: faker.person.jobTitle(),
    };
  });
  await db.insert(members).values(data);
}

async function seedTickets(count = DEFAULT_SEED_COUNT) {
  const projectIds = await db.select({ id: projects.id }).from(projects);
  const memberNames = await db.select({ name: members.name }).from(members);
  const data = Array.from({ length: count }, () => {
    const title = faker.hacker.phrase();
    const slug = createSlug(
      title,
      faker.string.alphanumeric(SLUG_SUFFIX_LENGTH)
    );
    return {
      slug,
      title,
      summary: faker.lorem.paragraph(),
      status: randomEnumValue(ticketStatus) as TicketStatus,
      projectId: projectIds.length
        ? faker.helpers.arrayElement(projectIds).id
        : null,
      assignee: memberNames.length
        ? faker.helpers.arrayElement(memberNames).name
        : null,
    };
  });
  await db.insert(tickets).values(data);
}

async function main() {
  await reset();
  await seedProjects();
  await seedMembers();
  await seedTickets();
  console.log("Seed complete");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await client.close();
  });
