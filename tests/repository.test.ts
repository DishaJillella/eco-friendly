import { DrizzleTaskRepository, toTask } from "../src/tasks/repository.js";
import type { TaskRow } from "../src/db/schema.js";

const row: TaskRow = {
  id: "task_1",
  title: "Persisted task",
  description: "Stored",
  status: "todo",
  priority: "med",
  dueDate: "2026-06-15",
  createdAt: new Date("2026-05-29T00:00:00.000Z"),
  updatedAt: new Date("2026-05-29T00:01:00.000Z")
};

describe("toTask", () => {
  it("maps database rows to API tasks", () => {
    expect(toTask(row)).toEqual({
      id: "task_1",
      title: "Persisted task",
      description: "Stored",
      status: "todo",
      priority: "med",
      due_date: "2026-06-15",
      created_at: "2026-05-29T00:00:00.000Z",
      updated_at: "2026-05-29T00:01:00.000Z"
    });
  });
});

describe("DrizzleTaskRepository", () => {
  it("creates tasks with generated defaults", async () => {
    const returning = vi.fn(async () => [row]);
    const values = vi.fn(() => ({ returning }));
    const db = { insert: vi.fn(() => ({ values })) };
    const repository = new DrizzleTaskRepository(db as never);

    await expect(repository.create({ title: "Persisted task" })).resolves.toMatchObject({
      id: "task_1",
      status: "todo",
      priority: "med"
    });

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Persisted task",
        description: null,
        status: "todo",
        priority: "med",
        dueDate: null
      })
    );
  });

  it("throws when insert returning is empty", async () => {
    const db = {
      insert: vi.fn(() => ({
        values: vi.fn(() => ({ returning: vi.fn(async () => []) }))
      }))
    };
    const repository = new DrizzleTaskRepository(db as never);

    await expect(repository.create({ title: "No row" })).rejects.toThrow(
      "Task insert did not return a row"
    );
  });

  it("lists all tasks without a status filter", async () => {
    const from = vi.fn(async () => [row]);
    const db = { select: vi.fn(() => ({ from })) };
    const repository = new DrizzleTaskRepository(db as never);

    await expect(repository.list()).resolves.toHaveLength(1);
    expect(from).toHaveBeenCalledOnce();
  });

  it("lists tasks with a status filter", async () => {
    const where = vi.fn(async () => [row]);
    const from = vi.fn(() => ({ where }));
    const db = { select: vi.fn(() => ({ from })) };
    const repository = new DrizzleTaskRepository(db as never);

    await expect(repository.list("todo")).resolves.toMatchObject([{ id: "task_1" }]);
    expect(where).toHaveBeenCalledOnce();
  });

  it("updates provided fields and clears nullable values", async () => {
    const returning = vi.fn(async () => [{ ...row, description: null, dueDate: null }]);
    const where = vi.fn(() => ({ returning }));
    const set = vi.fn(() => ({ where }));
    const db = { update: vi.fn(() => ({ set })) };
    const repository = new DrizzleTaskRepository(db as never);

    const task = await repository.update("task_1", {
      title: "Updated",
      description: null,
      status: "done",
      priority: "high",
      due_date: null
    });

    expect(task).toMatchObject({ id: "task_1", description: null, due_date: null });
    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Updated",
        description: null,
        status: "done",
        priority: "high",
        dueDate: null
      })
    );
  });

  it("returns null when an update target is missing", async () => {
    const db = {
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => ({ returning: vi.fn(async () => []) }))
        }))
      }))
    };
    const repository = new DrizzleTaskRepository(db as never);

    await expect(repository.update("missing", { status: "done" })).resolves.toBeNull();
  });

  it("reports whether delete removed a row", async () => {
    const returning = vi.fn().mockResolvedValueOnce([{ id: "task_1" }]).mockResolvedValueOnce([]);
    const where = vi.fn(() => ({ returning }));
    const db = { delete: vi.fn(() => ({ where })) };
    const repository = new DrizzleTaskRepository(db as never);

    await expect(repository.delete("task_1")).resolves.toBe(true);
    await expect(repository.delete("missing")).resolves.toBe(false);
  });
});
