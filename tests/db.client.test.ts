import { createDb } from "../src/db/client.js";

describe("createDb", () => {
  it("requires a database URL", () => {
    expect(() => createDb("")).toThrow("DATABASE_URL is required");
  });
});
