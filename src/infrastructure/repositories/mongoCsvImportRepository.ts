import type { MongoClient } from "mongodb";
import type { CsvImportRepository } from "../../application/ports/csvImportRepository.js";
import type { CsvImportResult, CsvImportRow, CsvImportErrorRow } from "../../domain/csvImport.js";

const COLLECTION = "csv_imports";

type CsvImportDocument = {
  _id: string;
  userId: string;
  errorsLines: CsvImportErrorRow[];
  data: CsvImportRow[];
  createdAt: Date;
  expiresAt: Date;
};

const mapDoc = (doc: CsvImportDocument): CsvImportResult => ({
  id: doc._id,
  userId: doc.userId,
  errorsLines: doc.errorsLines,
  data: doc.data,
  createdAt: doc.createdAt.toISOString(),
  expiresAt: doc.expiresAt.toISOString(),
});

export class MongoCsvImportRepository implements CsvImportRepository {
  private indexesReady: Promise<void> | null = null;

  constructor(
    private readonly client: MongoClient,
    private readonly dbName: string
  ) {}

  private get collection() {
    return this.client.db(this.dbName).collection<CsvImportDocument>(COLLECTION);
  }

  private async ensureIndexes(): Promise<void> {
    this.indexesReady ??= this.collection
      .createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 })
      .then(() => undefined);
    await this.indexesReady;
  }

  async findAllByUser(userId: string): Promise<CsvImportResult[]> {
    await this.ensureIndexes();
    const docs = await this.collection.find({ userId }).toArray();
    return docs.map(mapDoc);
  }

  async save(importResult: CsvImportResult): Promise<CsvImportResult> {
    await this.ensureIndexes();
    const doc: CsvImportDocument = {
      _id: importResult.id,
      userId: importResult.userId,
      errorsLines: importResult.errorsLines,
      data: importResult.data,
      createdAt: new Date(importResult.createdAt),
      expiresAt: new Date(importResult.expiresAt),
    };
    await this.collection.insertOne(doc);
    return mapDoc(doc);
  }
}
