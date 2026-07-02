require("dotenv").config();
const ws = require("ws");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const { neonConfig, Pool } = require("@neondatabase/serverless");

neonConfig.webSocketConstructor = ws;

function getConnectionString(raw) {
  return (raw || "")
    .replace(/[?&]channel_binding=[^&]*/g, "")
    .replace(/[?&]sslmode=[^&]*/g, "")
    .replace(/\?$/, "");
} 

function normalizeStatus(value) {
  const upper = String(value || "").trim().toUpperCase();
  if (upper === "APPROVED") return "ACTIVE";
  if (upper === "REJECT") return "REJECTED";
  if (upper === "SUSPEND") return "SUSPENDED";
  return upper;
}

async function getStartup(pool) {
  const rows = await pool.query(`
    SELECT id, company_name, status, email
    FROM startups
    ORDER BY created_at DESC NULLS LAST
    LIMIT 50
  `);

  if (!rows.rows.length) {
    throw new Error("No startups found in DB");
  }

  const active = rows.rows.find((row) => normalizeStatus(row.status) === "ACTIVE");
  return active || rows.rows[0];
}

async function main() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is required in backend/.env");
  }

  const apiBase = process.env.API_BASE || "http://localhost:5001";
  const connectionString = getConnectionString(process.env.DATABASE_URL);
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const startup = await getStartup(pool);
    const normalizedStatus = normalizeStatus(startup.status);
    console.log("Using startup:", {
      id: startup.id,
      company_name: startup.company_name,
      email: startup.email,
      status: startup.status,
      normalizedStatus,
    });

    const token = jwt.sign(
      { id: startup.id, role: "startup" },
      process.env.JWT_SECRET,
      { expiresIn: "30m" }
    );

    const payload = {
      title: "API Debug Role",
      department: "Engineering",
      empType: "Full-time",
      workMode: "Onsite",
      location: "Chennai",
      experience: "1-3 years",
      education: "Any Degree",
      openings: 2,
      applicationDeadline: "2026-05-20",
      applicationMethod: "platform",
      externalUrl: "",
      skills: ["React", "Node.js"],
      screeningQuestions: ["Tell us about a project"],
      description:
        "This is a debug job description with enough length to pass validation and test backend insert logic safely.",
      remote: false,
      status: "active",
    };

    const response = await axios.post(`${apiBase}/api/startup/jobs`, payload, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 30000,
      validateStatus: () => true,
    });

    console.log("POST /api/startup/jobs status:", response.status);
    console.log("Response body:", response.data);
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  const status = error?.response?.status;
  const data = error?.response?.data;
  console.error("Repro script failed:", {
    message: error?.message,
    status,
    data,
  });
  process.exit(1);
});
