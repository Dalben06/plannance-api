import type { MongoClient } from "mongodb";
import type { UserDocumentRepository } from "../../application/ports/userDocumentRepository.js";
import type { UserDocument, UserDocumentUpdate } from "../../domain/userDocument.js";

const COLLECTION = "user_documents";

export class MongoUserDocumentRepository implements UserDocumentRepository {
  constructor(
    private readonly client: MongoClient,
    private readonly dbName: string
  ) {}

  private get collection() {
    return this.client.db(this.dbName).collection<UserDocument>(COLLECTION);
  }

  async findByUserId(userId: string): Promise<UserDocument | null> {
    return (await this.collection.findOne({ _id: userId })) ?? null;
  }

  async upsert(userId: string, data: Partial<UserDocumentUpdate>): Promise<UserDocument> {
    const now = new Date();
    const result = await this.collection.findOneAndUpdate(
      { _id: userId },
      {
        $set: { ...data, updatedAt: now },
        $setOnInsert: { _id: userId, createdAt: now },
      },
      { upsert: true, returnDocument: "after" }
    );
    if (!result) {
      throw new Error("Failed to upsert user document: result is null");
    }
    return result;
  }
}
