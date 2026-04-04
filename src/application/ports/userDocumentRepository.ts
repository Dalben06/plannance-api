import type { UserDocument, UserDocumentUpdate } from "../../domain/userDocument.js";

export interface UserDocumentRepository {
  findByUserId(userId: string): Promise<UserDocument | null>;
  upsert(userId: string, data: Partial<UserDocumentUpdate>): Promise<UserDocument>;
}
