import { describe, expect, it } from "bun:test";
import {
  memberFormSchema,
  projectFormSchema,
  ticketFormSchema,
} from "@/lib/zod";

describe("form validation", () => {
  it("validates project forms", () => {
    const result = projectFormSchema.safeParse({
      slug: "alpha",
      title: "Alpha",
      description: "",
      status: "planned",
      owner: "Taylor",
    });
    expect(result.success).toBe(true);
  });

  it("coerces ticket project id to null", () => {
    const result = ticketFormSchema.parse({
      slug: "ticket-1",
      title: "Ticket",
      summary: "summary",
      status: "todo",
      projectId: "",
      assignee: "",
    });
    expect(result.projectId).toBeNull();
  });

  it("enforces member email format", () => {
    const result = memberFormSchema.safeParse({
      slug: "jane-doe",
      name: "Jane Doe",
      email: "jane@example.com",
      status: "active",
      bio: "",
      role: "Developer",
    });
    expect(result.success).toBe(true);
  });
});
