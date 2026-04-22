import { Prisma } from "@prisma/client";
import express from "express";
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { GoogleGenAI } from "@google/genai";

const GeminiAPI = process.env.GEMINI_API_KEY

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

	const sevenDaysAgo = new Date();
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

	const eventdata = await prisma.event.findMany({
		where : {
			createdat : { gte: sevenDaysAgo },
			repoId : allData?.id
		}
	})

	const ai = new GoogleGenAI({ apiKey: GeminiAPI });

	try {
		const response = await ai.models.generateContent({
			model: "gemini-2.5-flash",
			contents: `Here are a developer's GitHub events from this week:${JSON.stringify(eventdata)}

			Write a 3-sentence plain English summary of what they worked on,
			what repos were most active, and what types of changes they made.`,
		});
		res.json({ summary: response.text, events: eventdata });
	} catch (err : any) {
		console.error("Gemini error:", err);
		res.status(500).json({ error: err.message });
	}
})

export default router;