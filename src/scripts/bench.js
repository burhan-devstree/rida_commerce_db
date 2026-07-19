const jwt = require('jsonwebtoken');

const JWT_SECRET = "rida_commerce_db_rukaiya_arsi";
const token = jwt.sign({ userId: "6699a7777777777777777777", email: "rukaiya.fashions@gmail.com" }, JWT_SECRET);

async function makeRequest(path) {
  const start = Date.now();
  const res = await fetch(`http://localhost:3000${path}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await res.json().catch(() => ({}));
  const elapsed = Date.now() - start;
  console.log(`[${res.status}] ${path} - ${elapsed}ms`);
  return { status: res.status, elapsed };
}

async function run() {
  console.log("Starting Next.js API requests...");
  // 1st request (might trigger connection if not already active)
  await makeRequest("/api/ridas");
  // 2nd request
  await makeRequest("/api/ridas");
  // 3rd request
  await makeRequest("/api/invoices?page=1&limit=10");
  // 4th request
  await makeRequest("/api/invoices?page=1&limit=10");
  // 5th request
  await makeRequest("/api/dashboard/summary");
  // 6th request
  await makeRequest("/api/dashboard/summary");
  console.log("Benchmark finished.");
}

run().catch(console.error);
