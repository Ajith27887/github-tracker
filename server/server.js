import 'dotenv/config';
import express from "express";
import cors from "cors";
import userData from "./route/userData.js";
import repoList from "./route/repo.ts";
import githubOAuth from "./route/githubOAuth.ts";
import session from "express-session";
import event from "./route/event.ts"

const app = express();

app.use(cors({
	origin: "http://localhost:3000",
	credentials: true
}))

app.use(session({
	secret: "Ajith27",
	resave: false,
	saveUninitialized: false,
	cookie: { secure: false }
}));

app.use(express.json({ verify: (req, _res, buf) => { req.rawBody = buf } }));
app.use(express.urlencoded({ extended: true, verify: (req, _res, buf) => { req.rawBody = buf } }));


const port = process.env.PORT || 3001;

const requireAuth = ((req, res, next) => {
	if (!req.session.userId) {
		return res.status(401).json({ message: "Unauthorized" })
	}
	next();
})

app.use("/user", userData)
app.use("/repo", requireAuth, repoList)
app.use("/auth", githubOAuth)
app.use("/event", event)

app.listen(port, () => {
	console.log(`PORT STARTED ${port}`);
})

