import express from "express";
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import SmeeClient from "smee-client";
import crypto from "crypto";
import "dotenv/config";
import { connect } from "http2";

const secret = process.env.GITHUB_WEEBHOOK_SECRET

const smee = new SmeeClient({
	source: 'https://smee.io/qGARbiSvI0iTQGoa',
	target: 'http://localhost:3001/event',
	logger: console
})
const events = smee.start()

const adapater = new PrismaPg({
	connectionString : process.env.DATABASE_URL
})

const prisma = new PrismaClient({ adapter : adapater })
 
interface EventPayload {
	payload : Object
}

const route = express.Router();
const event : EventPayload[] = [];

// GET events
route.get("/", async (req: Request, res: Response) => {
	// const AllEvent = await prisma.event.findMany();
	// console.log(AllEvent,"events");
	// res.status(200).json(AllEvent)
	res.json(event[0].payload)
});


route.post("/", async (req : Request, res: Response ) => {
	const signature = req.header("X-Hub-Signature-256");
	const Event = req.header("x-github-event")
	const delivery = req.header("x-github-delivery")

	if (!signature || !secret) {
		return res.status(401).send("Missing signature or secret");
	}

	const verify = (body : Buffer, signature : string) => {
		const digest = "sha256=" + crypto.createHmac("sha256", secret).update(body).digest("hex");
		const signatureBuf = Buffer.from(signature);
		const digestBuf = Buffer.from(digest);
		if (signatureBuf.length !== digestBuf.length) return false;
		return crypto.timingSafeEqual(signatureBuf, digestBuf);
	}

	const rawBody = (req as any).rawBody as Buffer;

	if (process.env.NODE_ENV === "production" && !verify(rawBody, signature)) {
		return res.status(401).send("Invalid signature");
	}

	const data = req.body;
	const payload = typeof data?.payload === "string" ? JSON.parse(data.payload) : data;
	event.push({ payload });
	res.json(payload);


	const EventData  = await prisma.event.create({
		data  : {
			message : payload?.commits[0].message,
			branch : payload.repository.default_branch,
			repo :  {
				connect : {
					repoId : Number(payload.repository.id)
				}
			}
		}
	})
	res.json(EventData)
})

route.patch("/", async (req : Request, res: Response) => {
	try {
		const EditEvent = await prisma.event.updateMany({
			data : [{
				Where : { repoId : req.body.repoId },
				data : { req :  req.body.req }
			}]
		})
		res.status(201).json(EditEvent);
	} catch (error) {
		res.status(500).json({ error : "Failed to Edit" })
	}
})


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