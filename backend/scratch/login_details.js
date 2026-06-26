const jwt = require('jsonwebtoken');
const token = jwt.sign({ id: 4, role: "startup" }, "ai-internship-platform-jwt-secret-key-2026", { expiresIn: "7d" });
const userObj = {
  id: 4,
  founderName: "poovarasan",
  companyName: "Buddy",
  email: "spoovarasan600@gmail.com",
  status: "ACTIVE",
  logoUrl: null,
  rulesAccepted: true,
  plan_type: "trial",
  is_locked: false
};
console.log("TOKEN:");
console.log(token);
console.log("\nUSER_JSON:");
console.log(JSON.stringify(userObj));
