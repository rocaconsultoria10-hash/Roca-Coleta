import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

const connectionString =
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL não configurada."
  );
}

export const pool = new Pool({
  connectionString,
});

export async function testarPostgres() {
  const resultado =
    await pool.query(
      "SELECT current_database() AS banco, NOW() AS agora"
    );

  return resultado.rows[0];
}