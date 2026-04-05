import { describe, it, expect, vi } from "vitest";
import type { MongoClient } from "mongodb";
import { MongoCsvImportRepository } from "../../../src/infrastructure/repositories/mongoCsvImportRepository.js";

const buildMockClient = () => {
  const createIndex = vi.fn().mockResolvedValue("expiresAt_1");
  const insertOne = vi.fn().mockResolvedValue({});
  const toArray = vi.fn().mockResolvedValue([]);
  const find = vi.fn().mockReturnValue({ toArray });

  const collection = vi.fn().mockReturnValue({ createIndex, insertOne, find });
  const db = vi.fn().mockReturnValue({ collection });

  return {
    client: { db } as unknown as MongoClient,
    createIndex,
    insertOne,
    find,
    toArray,
  };
};

describe("MongoCsvImportRepository", () => {
  it("ensures the TTL index before saving and listing imports", async () => {
    const { client, createIndex, insertOne, find } = buildMockClient();
    const repo = new MongoCsvImportRepository(client, "plannance");

    await repo.save({
      id: "import-1",
      userId: "user-123",
      errorsLines: [],
      data: [],
      createdAt: "2026-04-04T00:00:00.000Z",
      expiresAt: "2026-04-04T03:00:00.000Z",
    });
    await repo.findAllByUser("user-123");

    expect(createIndex).toHaveBeenCalledOnce();
    expect(createIndex).toHaveBeenCalledWith({ expiresAt: 1 }, { expireAfterSeconds: 0 });
    expect(insertOne).toHaveBeenCalledOnce();
    expect(find).toHaveBeenCalledWith({ userId: "user-123" });
  });
});
