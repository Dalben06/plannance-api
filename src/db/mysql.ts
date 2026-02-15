import mysql from "mysql2/promise";
import { env } from "../config/env.js";

let pool: mysql.Pool | null = null;

export const getPool = (): mysql.Pool => {
  if (!pool) {
    pool = mysql.createPool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
      waitForConnections: true,
      connectionLimit: env.DB_CONNECTION_LIMIT,
      timezone: "Z"
    });
  }

  return pool;
};
