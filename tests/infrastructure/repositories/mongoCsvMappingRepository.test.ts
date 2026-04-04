import { describe, it, expect, vi } from "vitest";
import type { MongoClient } from "mongodb";
import { MongoCsvMappingRepository } from "../../../src/infrastructure/repositories/mongoCsvMappingRepository.js";

const buildMockClient = () => {
  const insertOne = vi.fn();
  const toArray = vi.fn();
  const find = vi.fn().mockReturnValue({ toArray });

  const collection = vi.fn().mockReturnValue({ find, insertOne });
  const db = vi.fn().mockReturnValue({ collection });

  return { client: { db } as unknown as MongoClient, db, collection, find, toArray, insertOne };
};

describe("MongoCsvMappingRepository", () => {
  describe("findAllByUser", () => {
    it("returns mapped templates for the given user", async () => {
      const { client, toArray } = buildMockClient();
      const now = new Date("2026-01-01T00:00:00.000Z");
      toArray.mockResolvedValue([
        {
          _id: "tpl-1",
          userId: "user-123",
          name: "bank-export",
          mappings: [{ from: "Date", to: "startAt" }],
          createdAt: now,
          updatedAt: now,
        },
      ]);

      const repo = new MongoCsvMappingRepository(client, "plannance");
      const result = await repo.findAllByUser("user-123");

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        id: "tpl-1",
        userId: "user-123",
        name: "bank-export",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-01T00:00:00.000Z",
      });
    });

    it("returns empty array when no mappings exist for user", async () => {
      const { client, toArray } = buildMockClient();
      toArray.mockResolvedValue([]);

      const repo = new MongoCsvMappingRepository(client, "plannance");
      const result = await repo.findAllByUser("user-123");

      expect(result).toEqual([]);
    });

    it("queries by userId", async () => {
      const { client, find, toArray } = buildMockClient();
      toArray.mockResolvedValue([]);

      const repo = new MongoCsvMappingRepository(client, "plannance");
      await repo.findAllByUser("user-abc");

      expect(find).toHaveBeenCalledWith({ userId: "user-abc" });
    });
  });

  describe("save", () => {
    it("inserts a document and returns the mapped template", async () => {
      const { client, insertOne } = buildMockClient();
      insertOne.mockResolvedValue({});

      const repo = new MongoCsvMappingRepository(client, "plannance");
      const result = await repo.save("user-123", {
        name: "payroll",
        mappings: [{ from: "Amount", to: "amount" }],
      });

      expect(result.userId).toBe("user-123");
      expect(result.name).toBe("payroll");
      expect(result.mappings).toEqual([{ from: "Amount", to: "amount" }]);
      expect(result.id).toBeDefined();
      expect(result.createdAt).toBeDefined();
      expect(result.updatedAt).toBeDefined();
      expect(insertOne).toHaveBeenCalledOnce();
    });

    it("uses the correct database and collection names", async () => {
      const { client, db, collection, insertOne } = buildMockClient();
      insertOne.mockResolvedValue({});

      const repo = new MongoCsvMappingRepository(client, "my_db");
      await repo.save("user-123", { name: "test", mappings: [{ from: "x", to: "title" }] });

      expect(db).toHaveBeenCalledWith("my_db");
      expect(collection).toHaveBeenCalledWith("csv_mappings");
    });

    it("returns ISO string dates", async () => {
      const { client, insertOne } = buildMockClient();
      insertOne.mockResolvedValue({});

      const repo = new MongoCsvMappingRepository(client, "plannance");
      const result = await repo.save("user-123", {
        name: "test",
        mappings: [{ from: "Title", to: "title" }],
      });

      expect(result.createdAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(result.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });
});
