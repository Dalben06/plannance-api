export type UserDocument = {
  _id: string; // user UUID — primary key, matches UserView.id
  createdAt: Date;
  updatedAt: Date;
};

// Writable fields for update/upsert operations (id and createdAt are immutable)
export type UserDocumentUpdate = Omit<UserDocument, "_id" | "createdAt">;
