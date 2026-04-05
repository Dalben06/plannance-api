import { parse } from "csv-parse";

export const parseRawRows = (buffer: Buffer): Promise<string[][]> =>
  new Promise((resolve, reject) => {
    parse(
      buffer,
      { columns: false, skip_empty_lines: true, relax_column_count: true },
      (err, records: string[][]) => {
        if (err) reject(err);
        else resolve(records);
      }
    );
  });
