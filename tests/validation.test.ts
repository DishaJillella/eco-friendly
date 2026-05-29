import { z } from "zod";
import {
  createTaskSchema,
  formatZodErrors,
  listTasksQuerySchema,
  patchTaskSchema
} from "../src/tasks/validation.js";

describe("task validation", () => {
  it("formats root-level zod errors under body", () => {
    const parsed = z.string().safeParse(123);

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(formatZodErrors(parsed.error)).toEqual({
        body: ["Invalid input: expected string, received number"]
      });
    }
  });

  it("collects multiple field validation errors", () => {
    const parsed = createTaskSchema.safeParse({
      title: " ",
      status: "blocked",
      priority: "urgent",
      due_date: "2026-02-31",
      extra: true
    });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(formatZodErrors(parsed.error)).toMatchObject({
        title: ["Title is required"],
        status: ['Invalid option: expected one of "todo"|"in_progress"|"done"'],
        priority: ['Invalid option: expected one of "low"|"med"|"high"'],
        due_date: ["Must be a valid calendar date"],
        body: ['Unrecognized key: "extra"']
      });
    }
  });

  it("accepts valid patch payloads that clear nullable fields", () => {
    expect(
      patchTaskSchema.safeParse({
        description: null,
        due_date: null,
        status: "done",
        priority: "low"
      }).success
    ).toBe(true);
  });

  it("rejects unknown list query parameters", () => {
    const parsed = listTasksQuerySchema.safeParse({ status: "todo", owner: "me" });

    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      expect(formatZodErrors(parsed.error)).toEqual({
        body: ['Unrecognized key: "owner"']
      });
    }
  });
});
