import express from "express";
import type { Request, Response } from "express";
import SmeeClient from "smee-client";
import crypto from "crypto";
import "dotenv/config";
import prisma from "../prismaClient.ts";

const secret = process.env.GITHUB_WEEBHOOK_SECRET

const smee = new SmeeClient({
	source: 'https://smee.io/qGARbiSvI0iTQGoa',
	target: `${process.env.BACKEND_URL ?? "http://localhost:3001"}/event`,
	logger: console
})
const events = smee.start()

interface EventPayload {
	payload: Object
}


const route = express.Router();

// GET events
route.get("/", async (req: Request, res: Response) => {
	try {
		const AllEvent = await prisma.event.findMany({
			include: { repo: true }
		});
		res.json(AllEvent)
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
});


route.post("/", async (req: Request, res: Response) => {
	try {
		console.log(">>> Incoming Webhook");
		console.log("Headers:", JSON.stringify(req.headers, null, 2));

		const signature = req.header("X-Hub-Signature-256");
		const eventType = req.header("x-github-event");

		console.log("EventType:", signature);

		if (process.env.NODE_ENV === "production") {
			if (!signature || !secret) {
				console.error("Missing signature or secret in production");
				return res.status(401).send("Missing signature or secret");
			}
/**
 * 
 * @param body Adding secret into body and digest hax
 * @param signature Signature-256 is came from req
 * @returns 
 */
			const verify = (body: Buffer, signature: string) => {
				const digest = "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
				const signatureBuf = Buffer.from(signature);
				const digestBuf = Buffer.from(digest);
				if (signatureBuf.length !== digestBuf.length) return false;
				return crypto.timingSafeEqual(signatureBuf, digestBuf);
			}

			const rawBody = (req as any).rawBody as Buffer;
			if (!rawBody || !verify(rawBody, signature)) {
				console.error("Invalid signature");
				return res.status(401).send("Invalid signature");
			}
		}


		let data = req.body;
		// Smee often wraps the payload in a 'payload' field as a stringified JSON if sent as form-data
		const payload = (typeof data?.payload === "string") ? JSON.parse(data.payload) : data;

		console.log("Payload Repository ID:", payload?.repository?.id);
		console.log("Payload Commits Count:", payload?.commits?.length || 0);

		if (eventType === "ping") {
			console.log("Ping received");
			return res.status(200).send("pong");
		}

		if (eventType === "push") {
			const githubRepoId = payload?.repository?.id;
			if (!githubRepoId) {
				console.error("No repository ID in payload");
				return res.status(400).json({ error: "Missing repository ID" });
			}

			// Find the repo in our DB first to be sure it exists
			const existingRepo = await prisma.repo.findUnique({
				where: { repoId: Number(githubRepoId) }
			});

			if (!existingRepo) {
				console.error(`Repo with github ID ${githubRepoId} not found in our database. Make sure it is tracked.`);
				return res.status(404).json({ error: "Repository not tracked" });
			}

			const message = payload?.commits?.[0]?.message || "No commit message";
			const branch = payload?.ref?.replace("refs/heads/", "") || payload?.repository?.default_branch || "unknown";

			console.log(`Saving event for repo ${existingRepo.repo}: ${message} on ${branch}`);

			const EventData = await prisma.event.create({
				data: {
					message,
					branch,
					repoId: existingRepo.id
				}
			});

			console.log("Event saved successfully:", EventData.id);
			return res.status(201).json(EventData);
		}

		console.log(`Event ${eventType} received but not processed`);
		return res.status(200).send(`Event ${eventType} received but not processed`);
	} catch (error: any) {
		console.error("!!! Error processing event:", error);
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