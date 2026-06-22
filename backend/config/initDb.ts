import fs from "fs";
import path from "path";
import { query } from "./database";

async function initializeDatabase(): Promise<void> {
  try {
    console.log("Initializing database...");

    // Read the schema file
    const schemaPath = path.join(__dirname, "../database/schemas/03_community_and_mcq.sql");
    const schemaSql = fs.readFileSync(schemaPath, "utf8");

    // Execute the schema SQL by splitting into individual commands
    const commands = schemaSql
      .split(";")
      .map((cmd) => cmd.trim())
      .filter((cmd) => cmd.length > 0);

    for (const command of commands) {
      await query(command);
    }

    console.log("Database initialized successfully.");
  } catch (error) {
    console.error("Error initializing database:", error);
  } finally {
    process.exit();
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase();
}

export { initializeDatabase };
