async function run() {
  try {
    const res = await fetch('http://localhost:5000/api/applications/user/8bd8e155-da43-418a-99d7-c1db39b05c18');
    const data = await res.json();
    console.dir(data, {depth: null});
  } catch (err) {
    console.error(err);
  }
}
run();
