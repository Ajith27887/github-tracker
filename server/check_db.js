import 'dotenv/config';
import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    const resRepos = await pool.query('SELECT COUNT(*) FROM "Repo"');
    const resEvents = await pool.query('SELECT COUNT(*) FROM "Event"');
    console.log({
      repos: resRepos.rows[0].count,
      events: resEvents.rows[0].count
    });
    
    if (resEvents.rows[0].count === '0') {
      const repos = await pool.query('SELECT id, repo, "repoId" FROM "Repo" LIMIT 5');
      console.log('Sample Repos:', repos.rows);
    } else {
      const events = await pool.query('SELECT id, message, createdat FROM "Event" LIMIT 5');
      console.log('Sample Events:', events.rows);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

check();
