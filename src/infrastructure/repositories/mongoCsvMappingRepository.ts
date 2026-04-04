import { randomUUID } from "node:crypto";
import type { MongoClient } from "mongodb";
import type { CsvMappingRepository } from "../../application/ports/csvMappingRepository.js";
import type {
  CsvColumnMapping,
  CsvMappingTemplate,
  CsvMappingTemplateCreate,
} from "../../domain/csv.js";

const COLLECTION = "csv_mappings";

type CsvMappingDocument = {
  _id: string;
  userId: string;
  name: string;
  mappings: CsvColumnMapping[];
  createdAt: Date;
  updatedAt: Date;
};

const mapDoc = (doc: CsvMappingDocument): CsvMappingTemplate => ({
  id: doc._id,
  userId: doc.userId,
  name: doc.name,
  mappings: doc.mappings,
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

export class MongoCsvMappingRepository implements CsvMappingRepository {
  constructor(
    private readonly client: MongoClient,
    private readonly dbName: string
  ) {}

  private get collection() {
    return this.client.db(this.dbName).collection<CsvMappingDocument>(COLLECTION);
  }

  async findAllByUser(userId: string): Promise<CsvMappingTemplate[]> {
    const docs = await this.collection.find({ userId }).toArray();
    return docs.map(mapDoc);
  }

  async save(userId: string, input: CsvMappingTemplateCreate): Promise<CsvMappingTemplate> {
    const now = new Date();
    const doc: CsvMappingDocument = {
      _id: randomUUID(),
      userId,
      name: input.name,
      mappings: input.mappings,
      createdAt: now,
      updatedAt: now,
    };
    await this.collection.insertOne(doc);
    return mapDoc(doc);
  }
}
