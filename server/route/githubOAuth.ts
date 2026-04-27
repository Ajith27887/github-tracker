import express from "express";
import type { Request, Response } from "express";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import "express-session";


// By default, the express-session library doesn't know what data you plan to store in a session. Its internal
//  interface is basically empty. If you tried to type req.session.userId without this block, TypeScript would throw an error saying:

// What it does: This is called Interface Merging. You are telling the TypeScript compiler: "Hey, I know you already defined SessionData, but I'm adding a new property called userId which must always be a number."
// Why use it: It gives you IntelliSense (autocomplete) and prevents you from accidentally trying to save a string or an object into the userId slot later.
declare module 'express-session' {
	interface SessionData {
		userId : number
	}
}

const adapater = new PrismaPg({
	connectionString : process.env.DATABASE_URL
})

const prisma = new PrismaClient({ adapter : adapater })

const FRONTEND_URL = process.env.FRONTEND_URL ?? "https://github-tracker-silk.vercel.app";
const BACKEND_URL  = process.env.BACKEND_URL  ?? "http://localhost:3001";

const route = express.Router();

route.get("/", async (req : Request, res : Response) => {
	if (req.session.userId) {
		return res.redirect(`${FRONTEND_URL}/`);
	}
	res.redirect(
		`https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo&redirect_uri=${BACKEND_URL}/auth/callback`
	);
})

route.get("/callback", async (req: Request, res: Response) => {

	if (req.session.userId) {
		return res.redirect(`${FRONTEND_URL}/`);
	}

	// Why github send code instead of access token directly, Because redirect is happens on frontend route /callback so that is not safe,
	//	After getting code we fetch access token on server, Safely it happens, then we store on DB
  const code = req.query.code as string;

  if (!code) {
    res.status(400).json({ error: "No code received from GitHub" });
    return;
  }

  try {

	  const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
		method : "POST",
		headers : {
			"content-Type" : "application/json",
			"Accept" : "application/json" 
		},
		body : JSON.stringify ({
			client_id : process.env.GITHUB_CLIENT_ID,
			client_secret : process.env.GITHUB_CLIENT_SECRET,
			code : code
		})
	})

	const tokenData = await tokenResponse.json() as { email : string; access_token?: string; error?: string };

	console.log(tokenData);
	if (!tokenData.access_token) {
		res.status(500).json({ error: tokenData.error ?? "Failed to get access token" });
		return;
	}

	const userResponse = await fetch("https://api.github.com/user", {
		headers : {
			Authorization : `Bearer ${tokenData.access_token}`,
			Accept : "application/vnd.github+json"
		}
	})


	const userData = await userResponse.json();
	// res.json(userData)

	const user = await prisma.user.upsert({
		where : { githubId : userData.id },
		update : { 
			accessToken : tokenData.access_token,
			name: userData.name ?? "",
			email: userData.email ?? null,
			login: userData.login,
			avatarUrl: userData.avatar_url
		},
		create : { 
			name: userData.name ?? "",
			email: userData.email ?? null,
			login: userData.login,
			avatarUrl: userData.avatar_url,
			accessToken :  tokenData.access_token,
			githubId : userData.id
		}
	})

	// What it does: This takes the specific ID of the user (likely from a database) and saves it into the Session Store (which could be in memory, Redis, or a database).
  	req.session.userId = user.id

	const repoResponse = await fetch("https://api.github.com/user/repos", {
		headers : {
			Authorization : `Bearer ${tokenData.access_token}`,
			Accept : "application/vnd.github+json"
		}
	})

	const data = await repoResponse.json() ;
	// res.json(data)
	
		
	await prisma.repo.createMany({
		data : data.map((repo : any) => ({
			repoId : repo.id,
			userId : user.id,
			repo : repo.full_name
		})),
		skipDuplicates : true
	})

	res.redirect(`${FRONTEND_URL}/`)

  } catch (error) {
	console.error(error);
	res.status(500).json({ error : "Internal Server Error" })
  }
	
})

route.get("/me", async (req : Request, res : Response) => {
	const userID = req.session.userId as number;
	console.log(userID);
	
	if (userID) {
		res.json(userID)
	}else{
		res.status(401).json("Please log in to access this page")
	}
})

export default route