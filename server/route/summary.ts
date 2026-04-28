import { Prisma } from "@prisma/client";
import express from "express";
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { GoogleGenAI } from "@google/genai";

const GeminiAPI = process.env.GEMINI_API_KEY

const prisma = new PrismaClient()
const router = express.Router();

router.get("/", async (req : Request, res : Response)  => {
	const userId = req.session.userId;                                                                                                                                                   
	if (!userId) return res.status(401).json({ error: "Unauthorized" });

	const repoId = Number(req.query.repoId);
	if (!repoId) return res.status(400).json({ error: "repoId required" });

	const allData = await prisma.repo.findFirst({
		where : { id: repoId, userId: req.session.userId }
	})

	if (!allData) return res.status(404).json({ error: "Repo not found" });

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
		const msg = String(err?.message ?? "");
		const isUnavailable = msg.includes('"code":503') || msg.includes("UNAVAILABLE");
		if (isUnavailable) {
			return res.status(503).json({ error: "MODEL_UNAVAILABLE", message: "Gemini is busy. Please retry." });
		}
		res.status(500).json({ error: "SUMMARY_FAILED", message: msg });
	}
})

export default router;