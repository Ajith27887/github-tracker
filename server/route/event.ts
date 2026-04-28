import express from "express";
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import SmeeClient from "smee-client";
import crypto from "crypto";
import "dotenv/config";

const secret = process.env.GITHUB_WEEBHOOK_SECRET

const smee = new SmeeClient({
	source: 'https://smee.io/qGARbiSvI0iTQGoa',
	target: `${process.env.BACKEND_URL ?? "http://localhost:3001"}/event`,
	logger: console
})
const events = smee.start()

const adapter = new PrismaPg({
	connectionString : process.env.DATABASE_URL
})

const prisma = new PrismaClient({ adapter : adapter })
 
interface EventPayload {
	payload : Object
}

const route = express.Router();
const event : EventPayload[] = [];

// GET events
route.get("/", async (req: Request, res: Response) => {
    const AllEvent = await prisma.event.findMany();                                                                                                 
	res.json(AllEvent)
});


route.post("/", async (req: Request, res: Response) => {
	try {
		console.log("Entered event POST");

		const signature = req.header("X-Hub-Signature-256");
		const eventType = req.header("x-github-event");

		if (process.env.NODE_ENV === "production") {
			if (!signature || !secret) {
				console.log("Missing sign or secret");
				return res.status(401).send("Missing signature or secret");
			}

			const verify = (body: Buffer, signature: string) => {
				const digest = "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
				const signatureBuf = Buffer.from(signature);
				const digestBuf = Buffer.from(digest);
				if (signatureBuf.length !== digestBuf.length) return false;
				return crypto.timingSafeEqual(signatureBuf, digestBuf);
			}

			const rawBody = (req as any).rawBody as Buffer;
			if (!verify(rawBody, signature)) {
				console.log("invalid signature");
				return res.status(401).send("Invalid signature");
			}
		}

		
		const data = req.body;
		const payload = typeof data?.payload === "string" ? JSON.parse(data.payload) : data;

		if (eventType === "ping") {
			return res.status(200).send("pong");
		}

		if (eventType === "push") {
			const message = payload?.commits?.[0]?.message || "No commit message";
			const branch = payload?.ref?.replace("refs/heads/", "") || payload?.repository?.default_branch || "unknown";
			const githubRepoId = payload?.repository?.id;

			if (!githubRepoId) {
				return res.status(400).json({ error: "Missing repository ID" });
			}

			const EventData = await prisma.event.create({
				data: {
					message,
					branch,
					repo: {
						connect: {
							repoId: Number(githubRepoId)
						}
					}
				}
			});
			return res.status(201).json(EventData);
		}

		return res.status(200).send("Event received but not processed");
	} catch (error: any) {
		console.error("Error processing event:", error);
		return res.status(500).json({ error: error.message });
	}
});


route.patch("/:id", async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { message, branch } = req.body;
		
		const EditEvent = await prisma.event.update({
			where: { id: Number(id) },
			data: {
				...(message && { message }),
				...(branch && { branch })
			}
		});
		res.status(200).json(EditEvent);
	} catch (error) {
		res.status(500).json({ error: "Failed to Edit Event" });
	}
});


route.delete("/", async (req, res) => {
	try {
		const DeleteUser = await prisma.event.deleteMany({
			where: { repoId: req.body.repoId }
		})
		res.status(200).json(DeleteUser)
	} catch (err : any) {
		res.status(500).json({ error: err.message })
	}
})

export default route;