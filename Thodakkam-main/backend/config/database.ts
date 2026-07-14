import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import dns from "dns";

// Resolve DNS lookup order issue on Windows (Node 17+) by preferring IPv4 first
if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

// Resolve .env from the backend/ root no matter where this file is loaded from
// (works for both `ts-node config/database.ts` and the compiled dist/config/database.js).
function findEnvPath(): string {
  let dir = __dirname;
  for (let i = 0; i < 5; i += 1) {
    const candidate = path.join(dir, ".env");
    if (fs.existsSync(candidate)) return candidate;
    dir = path.dirname(dir);
  }
  return path.resolve(process.cwd(), ".env");
}
dotenv.config({ path: findEnvPath() });

// Only bypass TLS verification when explicitly enabled.
if (process.env.ALLOW_INSECURE_TLS === "1") {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
}

function getConnectionString(): string {
  const raw = process.env.DATABASE_URL || "";
  // Strip params that can conflict with node-postgres TLS negotiation
  return raw
    .replace(/[?&]channel_binding=[^&]*/g, "")
    .replace(/[?&]sslmode=[^&]*/g, "")
    .replace(/\?$/, "");
}

const connectionString = getConnectionString();

// Explicit SSL toggle via environment variable.
// Set DB_SSL=true in production hosts that require TLS.
const sslConfig = process.env.DB_SSL === "true"
  ? { rejectUnauthorized: false }
  : false;

console.log(`[Database] Connection String: ${process.env.DATABASE_URL ? "Defined" : "UNDEFINED"}`);
console.log(`[Database] SSL mode: ${process.env.DB_SSL === "true" ? "enabled" : "disabled"}`);

// Custom robust DNS lookup resolver with public DNS (Google 8.8.8.8 and Cloudflare 1.1.1.1) fallbacks.
// Solves local Windows DNS cache timeouts and corporate/private DNS lookup glitches.
const dnsResolver = new dns.Resolver();
try {
  dnsResolver.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);
} catch (e) {
  // Safe fallback if resolver servers cannot be set
}

function customLookup(
  hostname: string,
  options: any,
  callback: (err: Error | null, address: string, family: number) => void
) {
  let actualOptions = options;
  let actualCallback = callback;
  if (typeof options === "function") {
    actualCallback = options;
    actualOptions = {};
  }

  dns.lookup(hostname, actualOptions, (err, address, family) => {
    if (!err) {
      return actualCallback(null, address, family);
    }

    if (hostname.includes("neon.tech")) {
      console.warn(`[DNS] Standard lookup failed for ${hostname} (${err.message}). Falling back to Google & Cloudflare DNS...`);
      dnsResolver.resolve4(hostname, (dnsErr, addresses) => {
        if (dnsErr || !addresses || addresses.length === 0) {
          console.error(`[DNS] Fallback DNS lookup also failed for ${hostname}:`, dnsErr?.message);
          return actualCallback(err, address, family);
        }
        const resolvedIp = addresses[0];
        console.log(`[DNS] Fallback DNS successfully resolved ${hostname} to ${resolvedIp}`);
        return actualCallback(null, resolvedIp, 4);
      });
    } else {
      return actualCallback(err, address, family);
    }
  });
}

function intFromEnv(name: string, fallback: number): number {
  const v = Number.parseInt(String(process.env[name] || ""), 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}

export const pool = new Pool({
  connectionString,
  ssl: sslConfig,
  lookup: customLookup,
  max: intFromEnv("DB_POOL_MAX", 20),
  min: intFromEnv("DB_POOL_MIN", 2),
  idleTimeoutMillis: intFromEnv("DB_POOL_IDLE_MS", 30_000),
  connectionTimeoutMillis: intFromEnv("DB_POOL_CONN_MS", 5_000),
  // Server-side guards: kill runaway statements / dead connections
  statement_timeout: intFromEnv("DB_STATEMENT_TIMEOUT_MS", 60_000),
  query_timeout: intFromEnv("DB_QUERY_TIMEOUT_MS", 60_000),
  keepAlive: true,
} as any);

// Prevent Node.js process crash when the database connection throws an error
pool.on("error", (err: Error) => {
  console.error("❌ Unexpected error on idle client", err);
});

function buildParameterizedQuery(strings: TemplateStringsArray, values: any[]) {
  let text = "";
  for (let i = 0; i < strings.length; i += 1) {
    text += strings[i];
    if (i < values.length) {
      text += `$${i + 1}`;
    }
  }
  return { text, values };
}

export async function sql(strings: TemplateStringsArray, ...values: any[]): Promise<any[]> {
  if (!Array.isArray(strings) || !Object.prototype.hasOwnProperty.call(strings, "raw")) {
    throw new Error("sql must be used as a tagged template literal");
  }
  const { text, values: params } = buildParameterizedQuery(strings, values);
  const result = await pool.query(text, params);
  return result.rows;
}

/**
 * Execute a SQL query against the Neon database
 * @param queryText - SQL query string
 * @param params - Query parameters
 * @returns Query results
 */
export async function query(queryText: string, params: any[] = []): Promise<any[]> {
  try {
    const result = await pool.query(queryText, params);
    return result.rows;
  } catch (error: any) {
    console.error("Database query error:", error.message);
    throw error;
  }
}

/**
 * Test the database connection
 * @returns True if connection is successful
 */
export async function testConnection(): Promise<boolean> {
  try {
    const result = await pool.query("SELECT NOW() AS current_time, version() AS pg_version");
    console.log("✅ Database connected successfully!");
    console.log(`   Time: ${result.rows[0].current_time}`);
    console.log(`   PostgreSQL: ${result.rows[0].pg_version}`);
    return true;
  } catch (error: any) {
    console.error("❌ Database connection failed:", error.message);
    return false;
  }
}
