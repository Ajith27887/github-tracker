import 'dotenv/config';
import express from "express";
import cors from "cors";
import userData from "./route/userData.js";
import repoList from "./route/repo.ts";
import githubOAuth from "./route/githubOAuth.ts";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import pg from "pg";
import fs from "node:fs";
import dotenv from "dotenv";
import event from "./route/event.ts"
import summary from "./route/summary.ts";
import requireAuth from './middleware/middleware.ts';

const app = express();

const isProd = process.env.NODE_ENV === 'production';

app.set('trust proxy', 1);

const allowedOrigins = [
	process.env.FRONTEND_URL,
	"https://github-tracker-silk.vercel.app",
].filter(Boolean);

app.use(cors({
	origin: (origin, cb) => {
		if (!origin) return cb(null, true);
		if (allowedOrigins.includes(origin)) return cb(null, true);
		if (/^https:\/\/github-tracker.*\.vercel\.app$/.test(origin)) return cb(null, true);
		return cb(new Error(`CORS blocked: ${origin}`));
	},
	credentials: true,
}))


const PgSession = connectPgSimple(session);
const pgPool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Fail fast and say what we're actually talking to. Previously the server booted
// happily against an unreachable database and only surfaced it as a generic 500
// from inside /auth/callback, which is very hard to read backwards.
if (!process.env.DATABASE_URL) {
	console.error("FATAL: DATABASE_URL is not set. Is server/.env present, and did you start from the server/ directory?");
	process.exit(1);
}
{
	// dotenv never overrides a variable already present in the process environment,
	// so an exported DATABASE_URL silently wins over .env. Make that visible.
	let fromFile = {};
	try {
		fromFile = dotenv.parse(fs.readFileSync(new URL("./.env", import.meta.url)));
	} catch {
		// No .env file - normal on Render, where env vars come from the platform.
	}
	if (fromFile.DATABASE_URL && fromFile.DATABASE_URL !== process.env.DATABASE_URL) {
		console.warn("WARNING: DATABASE_URL is set in your shell and is OVERRIDING server/.env.");
		console.warn("         .env wants:", new URL(fromFile.DATABASE_URL).host);
		console.warn("         shell gives:", new URL(process.env.DATABASE_URL).host);
		console.warn("         Run `unset DATABASE_URL DIRECT_URL` to use .env instead.");
	}
	console.log(`DB target: ${new URL(process.env.DATABASE_URL).host} (NODE_ENV=${process.env.NODE_ENV ?? "development"})`);
	try {
		await pgPool.query("select 1");
		console.log("DB: connected");
	} catch (err) {
		console.error(`FATAL: cannot reach the database at ${new URL(process.env.DATABASE_URL).host}`);
		console.error(`       ${err.message}`);
		// Exiting here would crash-loop a deployed service, so in production we
		// stay up and let the instrumented routes report the error per-request.
		if (!isProd) process.exit(1);
	}
}

app.use(session({
	store: new PgSession({ pool: pgPool, createTableIfMissing: true }),
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	proxy: true,
	cookie: {
		// SameSite=None requires Secure; in dev (http://localhost) that pair is
		// rejected by the browser, so the session cookie is never stored.
		secure: isProd,
		sameSite: isProd ? 'none' : 'lax'
	}
}));


app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf } }));
app.use(express.urlencoded({ extended: true, verify: (req, _res, buf) => { req.rawBody = buf } }));


const port = process.env.PORT || 3001;

app.use("/summary", requireAuth, summary)
app.use("/user", userData)
app.use("/repo", requireAuth, repoList)
app.use("/auth", githubOAuth)
app.use("/event", event)

app.listen(port, () => {
	console.log(`PORT STARTED ${port}`);
})

