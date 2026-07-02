import { testConnection } from "./config/database";

async function run() {
  console.log("Testing database connection...");
  const success = await testConnection();
  if (success) {
    console.log("Connection test passed!");
    process.exit(0);
  } else {
    console.log("Connection test failed!");
    process.exit(1);
  }
}

run();
