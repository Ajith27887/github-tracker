import express, { application } from "express";
import type { Request, Response } from "express";
import "dotenv/config";
import { json } from "stream/consumers";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { error } from "console";


const adapater = new PrismaPg({
	connectionString : process.env.DATABASE_URL
})

const prisma = new PrismaClient({ adapter : adapater })

const route = express.Router();

route.get("/", async (req : Request, res : Response) => {
	  res.redirect(
	    `https://github.com/login/oauth/authorize?client_id=${process.env.GITHUB_CLIENT_ID}&scope=repo&redirect_uri=http://localhost:3001/auth/callback`
	  );
})

route.get("/callback", async (req: Request, res: Response) => { 

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


	const userData = await userResponse.json() as {name : string; email : string; accessToken : string; githubId : number };
	res.json(userData)

	const user = await prisma.user.upsert({
		where : { githubId : userData.githubId },
		update : { accessToken : tokenData.access_token },
		create : { name :"", email : "", accessToken :  tokenData.access_token, githubId :userData.githubId }
	})

	const repoResponse = await fetch("https://api.github.com/user/repos", {
		headers : {
			Authorization : `Bearer ${tokenData.access_token}`,
			Accept : "application/vnd.github+json"
		}
	})

	const data = await repoResponse.json() ;
	res.json(data)
	
		
	await prisma.repo.createMany({
		data : data.map((repo : any) => ({
			repoId : repo.id,
			userId : user.id,
			repo : repo.full_name
		}))
	})

	// res.json("Table Added succesfully");


  } catch (error) {
	console.error(error);
	res.status(500).json({ error : "Internal Server Error" })
  }
	
})





export default route