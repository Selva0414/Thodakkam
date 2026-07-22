const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://neondb_owner:npg_wIL63PrMuKof@ep-dawn-scene-a1q4wgha.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require' });
client.connect().then(async () => {
  try {
    const res = await client.query('INSERT INTO posts (author_id, author_name, author_role, author_avatar, content, tags, author_type, media_url, media_name) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *', [110, 'zentro solution', 'Startup', 'https://ui-avatars.com/api/?name=zentro%20solution&background=0F172A&color=fff', 'good', ['Project'], 'startup', null, null]);
    console.log(res.rows);
  } catch(e) {
    console.error(e);
  }
  client.end();
});
