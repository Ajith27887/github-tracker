import express from "express";
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";


const adapater = new PrismaPg({
	connectionString : process.env.DATABASE_URL
})

const prisma = new PrismaClient({ adapter : adapater })

const route = express.Router();

// GET events
route.get("/", async (req: Request, res: Response) => {
	const AllEvent = await prisma.event.findMany();
	console.log(AllEvent,"events");
	res.status(200).json(AllEvent)
});


route.post("/", async (req : Request, res: Response ) => {
	try {
		const AddEvent = await prisma.event.createMany({
			data: [{
				repoId : req.body.repoId,
				req : req.body.repoName
			}]
		})
		res.status(201).json(AddEvent)
	} catch (error) {
		res.status(500).json({error : "Failed to Add Repo"})
	}
})

route.patch("/", async (req : Request, res: Response) => {
	try {
		const EditEvent = await prisma.event.updateMany({
			data : [{
				Where : { id : req.body.repoId },
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
			where: { req: req.body.req }
		})
		res.status(200).json(DeleteUser)
	} catch (err : any) {
		res.status(500).json({ error: err.message })
	}
})


export default route;