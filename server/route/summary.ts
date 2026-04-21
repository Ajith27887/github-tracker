import { Prisma } from "@prisma/client";
import express from "express";
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

const adapater = new PrismaPg({
	connectionString : process.env.DATABASE_URL
})


const prisma = new PrismaClient({ adapter : adapater })
const router = express.Router();

router.get("/", async (req : Request, res : Response)  => {
	const userId = req.session.userId;                                                                                                                                                   
	if (!userId) return res.status(401).json({ error: "Unauthorized" });

	const allData = await prisma.repo.findUnique({
		where : {repo : "Ajith27887/github-tracker"}
	})
	
	const eventdata = await prisma.event.findMany({
		where : { repoId : allData?.id }
	})
	res.json(eventdata)
})

export default router;