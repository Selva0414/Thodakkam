async function go() {
  const res = await fetch('http://localhost:5000/api/posts');
  const data = await res.json();
  console.log(JSON.stringify(data.data.posts[0], null, 2));
}
go();
