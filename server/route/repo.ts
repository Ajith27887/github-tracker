import express from "express";
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";


const adapater = new PrismaPg({
	connectionString : process.env.DATABASE_URL
})

const prisma = new PrismaClient({ adapter : adapater })

const route = express.Router();

// GET repo 
route.get("/", async (req: Request, res: Response) => {
	const repos = prisma.repo.findMany();
	console.log(repos,"repos");	
	res.status(200).json(repos)
});


route.post("/", async (req : Request, res: Response ) => {
	try {
		const AddRepo = prisma.repo.createMany({
			data: [{
				userId : req.body.id,
				repo : req.body.repoName
			}]
		})
		res.status(201).json(AddRepo)
	} catch (error) {
		res.status(500).json({error : "Failed to Add Repo"})
	}
})

route.patch("/", async (req : Request, res: Response) => {
	try {
		const EditRepo = prisma.repo.updateMany({
			data : [{
				Where : { id : req.body.userId },
				data : { repo :  req.body.repo }
			}]
		})
		res.status(201).json(EditRepo);
	} catch (error) {
		res.status(500).json({ error : "Failed to Edit" })
	}
})


route.delete("/", async (req, res) => {
	try {
		const DeleteUser = await prisma.repo.deleteMany({
			where: { repo: req.body.repo }
		})
		res.status(200).json(DeleteUser)
	} catch (err : any) {
		res.status(500).json({ error: err.message })
	}
})


export default route;