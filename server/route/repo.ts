import express from "express";
import type { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";


const prisma = new PrismaClient()

const route = express.Router();

// GET repo
route.get("/", async (req: Request, res: Response) => {

	const repos = await prisma.repo.findMany({
		where : {userId : req.session.userId}
	});
	console.log(repos,"repos");
	res.status(200).json(repos)
});


route.post("/", async (req: Request, res: Response) => {
	try {
		const userId = req.session.userId;
		if (!userId) return res.status(401).json({ error: "Unauthorized" });

		const repoId = Number(req.body.repoId);
		const repoName = req.body.repoName;

		if (!Number.isInteger(repoId)) {
			res.status(400).json({ error: "repoId must be a valid integer" });
			return;
		}

		const AddRepo = await prisma.repo.create({
			data: {
				repoId,
				userId: Number(userId),
				repo: repoName
			}
		});
		res.status(201).json(AddRepo);
	} catch (error) {
		console.error("Add Repo Error:", error);
		res.status(500).json({ error: "Failed to Add Repo" });
	}
});

route.patch("/:id", async (req: Request, res: Response) => {
	try {
		const { id } = req.params;
		const { repoName } = req.body;
		
		const EditRepo = await prisma.repo.update({
			where: { 
				id: Number(id),
				userId: req.session.userId 
			},
			data: {
				repo: repoName
			}
		});
		res.status(200).json(EditRepo);
	} catch (error) {
		res.status(500).json({ error: "Failed to Edit Repo" });
	}
});


route.delete("/", async (req, res) => {
	try {
		const DeleteUser = await prisma.repo.deleteMany({
			where: { repo: req.body.repo, userId : req.session.userId }
		})
		res.status(200).json(DeleteUser)
	} catch (err : any) {
		res.status(500).json({ error: err.message })
	}
})


export default route;
