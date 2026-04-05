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
    private readonly getClient: () => Promise<MongoClient>,
    private readonly dbName: string
  ) {}

  private async collection() {
    const client = await this.getClient();
    return client.db(this.dbName).collection<CsvImportDocument>(COLLECTION);
  }

  private async ensureIndexes(): Promise<void> {
    this.indexesReady ??= this.collection()
      .then((col) => col.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }))
      .then(() => undefined);
    await this.indexesReady;
  }

  async findAllByUser(userId: string): Promise<CsvImportResult[]> {
    await this.ensureIndexes();
    const col = await this.collection();
    const docs = await col.find({ userId }).toArray();
    return docs.map(mapDoc);
  }

  async findById(id: string): Promise<CsvImportResult | null> {
    await this.ensureIndexes();
    const col = await this.collection();
    const doc = await col.findOne({ _id: id });
    return doc ? mapDoc(doc) : null;
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
    const col = await this.collection();
    await col.insertOne(doc);
    return mapDoc(doc);
  }

  async update(importResult: CsvImportResult): Promise<CsvImportResult> {
    await this.ensureIndexes();
    const doc: CsvImportDocument = {
      _id: importResult.id,
      userId: importResult.userId,
      errorsLines: importResult.errorsLines,
      data: importResult.data,
      createdAt: new Date(importResult.createdAt),
      expiresAt: new Date(importResult.expiresAt),
    };
    const col = await this.collection();
    const result = await col.replaceOne({ _id: doc._id }, doc);
    if (result.matchedCount === 0) {
      throw new Error(`CsvImport with id ${doc._id} not found for update.`);
    }
    return mapDoc(doc);
  }
}
