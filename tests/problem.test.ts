import { problem } from "../src/tasks/problem.js";

function createReply(url = "/test") {
  const reply = {
    request: { url },
    code: vi.fn(() => reply),
    type: vi.fn(() => reply),
    send: vi.fn((body) => body)
  };

  return reply;
}

describe("problem", () => {
  it("sends RFC 7807 problem details with validation errors", () => {
    const reply = createReply("/tasks");

    const body = problem(reply as never, 422, "Task payload is invalid", {
      title: ["Title is required"]
    });

    expect(reply.code).toHaveBeenCalledWith(422);
    expect(reply.type).toHaveBeenCalledWith("application/problem+json");
    expect(reply.send).toHaveBeenCalledWith({
      type: "https://httpstatuses.com/422",
      title: "Unprocessable Entity",
      status: 422,
      detail: "Task payload is invalid",
      instance: "/tasks",
      errors: { title: ["Title is required"] }
    });
    expect(body).toMatchObject({ status: 422 });
  });

  it("falls back to a generic title for unexpected status codes", () => {
    const reply = createReply("/unexpected");

    problem(reply as never, 418 as never, "Unexpected status");

    expect(reply.send).toHaveBeenCalledWith({
      type: "https://httpstatuses.com/418",
      title: "Error",
      status: 418,
      detail: "Unexpected status",
      instance: "/unexpected"
    });
  });
});
