import { describe, expect, it, vi } from "vitest";
import type { MongoClient } from "mongodb";
import { MongoUserDocumentRepository } from "../../../src/infrastructure/repositories/mongoUserDocumentRepository.js";
import type { UserDocument } from "../../../src/domain/userDocument.js";

const makeDoc = (overrides: Partial<UserDocument> = {}): UserDocument => ({
  _id: "user-uuid-123",
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-01-01T00:00:00.000Z"),
  ...overrides,
});

const buildMockClient = () => {
  const findOne = vi.fn();
  const findOneAndUpdate = vi.fn();

  const collection = vi.fn().mockReturnValue({ findOne, findOneAndUpdate });
  const db = vi.fn().mockReturnValue({ collection });

  const client = { db } as unknown as MongoClient;
  return { getClient: () => Promise.resolve(client), db, collection, findOne, findOneAndUpdate };
};

describe("MongoUserDocumentRepository", () => {
  describe("findByUserId", () => {
    it("returns the document when found", async () => {
      const { getClient: client, findOne } = buildMockClient();
      const doc = makeDoc();
      findOne.mockResolvedValue(doc);

      const repo = new MongoUserDocumentRepository(client, "plannance");
      const result = await repo.findByUserId("user-uuid-123");

      expect(result).toEqual(doc);
      expect(findOne).toHaveBeenCalledWith({ _id: "user-uuid-123" });
    });

    it("returns null when no document exists", async () => {
      const { getClient: client, findOne } = buildMockClient();
      findOne.mockResolvedValue(null);

      const repo = new MongoUserDocumentRepository(client, "plannance");
      const result = await repo.findByUserId("missing-user");

      expect(result).toBeNull();
    });
  });

  describe("upsert", () => {
    it("calls findOneAndUpdate with correct $set and $setOnInsert and returns the document", async () => {
      const { getClient: client, findOneAndUpdate } = buildMockClient();
      const updatedDoc = makeDoc({ updatedAt: new Date("2026-03-24T10:00:00.000Z") });
      findOneAndUpdate.mockResolvedValue(updatedDoc);

      const repo = new MongoUserDocumentRepository(client, "plannance");
      const result = await repo.upsert("user-uuid-123", {});

      expect(result).toEqual(updatedDoc);
      expect(findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "user-uuid-123" },
        expect.objectContaining({
          $set: expect.objectContaining({ updatedAt: expect.any(Date) }),
          $setOnInsert: expect.objectContaining({
            _id: "user-uuid-123",
            createdAt: expect.any(Date),
          }),
        }),
        { upsert: true, returnDocument: "after" }
      );
    });

    it("merges provided data into $set", async () => {
      const { getClient: client, findOneAndUpdate } = buildMockClient();
      findOneAndUpdate.mockResolvedValue(makeDoc());

      const repo = new MongoUserDocumentRepository(client, "plannance");
      await repo.upsert("user-uuid-123", { updatedAt: new Date() });

      expect(findOneAndUpdate).toHaveBeenCalledWith(
        { _id: "user-uuid-123" },
        expect.objectContaining({
          $set: expect.objectContaining({ updatedAt: expect.any(Date) }),
        }),
        expect.any(Object)
      );
    });

    it("uses the correct database and collection names", async () => {
      const { getClient: client, db, collection, findOneAndUpdate } = buildMockClient();
      findOneAndUpdate.mockResolvedValue(makeDoc());

      const repo = new MongoUserDocumentRepository(client, "my_db");
      await repo.upsert("user-uuid-123", {});

      expect(db).toHaveBeenCalledWith("my_db");
      expect(collection).toHaveBeenCalledWith("user_documents");
    });
  });
});
