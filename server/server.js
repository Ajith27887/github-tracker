import 'dotenv/config';
import express from "express";
import cors from "cors";
import userData from "./route/userData.js";
import repoList from "./route/repo.ts"

const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 3001;


app.use("/user", userData)
app.use("/repo", repoList)

app.listen(port, () => {
	console.log(`PORT STARTED ${port}`);
})
