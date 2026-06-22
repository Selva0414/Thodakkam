async function test() {
  console.log("Sending request to Render AI API using native fetch...");
  try {
    const res = await fetch("https://generate-job-description.onrender.com/generate-job-description", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_title: "React Developer" }),
    });
    console.log("Status:", res.status);
    const text = await res.text();
    console.log("Raw Response:");
    console.log(text);
  } catch (err) {
    console.error("Error calling API:", err);
  }
}

test();
