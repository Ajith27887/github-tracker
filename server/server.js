import 'dotenv/config';
import express from "express";
import cors from "cors";
import userData from "./route/userData.js";
import repoList from "./route/repo.ts";
import githubOAuth from "./route/githubOAuth.ts";
import session from "express-session";
console.log("client_id:", process.env.GITHUB_CLIENT_ID);


const app = express();


app.use(cors({
	origin: "http://localhost:3000",
	Credentials: true
}))

app.use(session({
	secret: "Ajith27",
	resave: false,
	saveUninitialized: false,
	cookie: { secure: false }
}));

app.use(express.json());

const port = process.env.PORT || 3001;


app.use("/user", userData)
app.use("/repo", repoList)
app.use("/auth", githubOAuth)

app.listen(port, () => {
	console.log(`PORT STARTED ${port}`);
})
