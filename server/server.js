import 'dotenv/config';
import express from "express";
import cors from "cors";
import userData from "./route/userData.js";
import repoList from "./route/repo.ts";
import githubOAuth from "./route/githubOAuth.ts";
import session from "express-session";
import event from "./route/event.ts"
import summary from "./route/summary.ts";
import requireAuth from './middleware/middleware.ts';

const app = express();

app.use(cors({
	origin: process.env.FRONTEND_URL ?? "https://github-tracker-silk.vercel.app",
	credentials: true
}))


app.use(session({
	secret: process.env.SESSION_SECRET,
	resave: false,
	saveUninitialized: false,
	cookie: { secure: process.env.NODE_ENV === 'production', sameSite: 'none' }
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

