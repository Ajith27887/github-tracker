import { PrismaClient } from "@prisma/client";
import express from "express";
import { PrismaPg } from "@prisma/adapter-pg";
import "dotenv/config";

//Prisma and adapotor setup;
const adapter = new PrismaPg({
	connectionString: process.env.DATABASE_URL
})
const prisma = new PrismaClient({ adapter: adapter });

const router = express.Router()

router.get("/me", async (req, res) => {
	if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
	const user = await prisma.user.findUnique({
		where: { id: req.session.userId },
		select: { id: true, name: true, login: true, avatarUrl: true },
	});
	if (!user) return res.status(404).json({ error: "Not found" });
	res.json(user);
});

// Reading Data from DB
router.get("/", async (req, res) => {
	const users = await prisma.user.findMany();
	res.json(users);
});

// Adding data to DB
router.post("/", async (req, res) => {
	try {
		const userData = await prisma.user.createMany({
			data: [{ name: req.body.name, email: req.body.email }]
		})
		console.log("Added to DB");
		res.status(201).json(userData);
	} catch (err) {
		if (err.code === "P2002") {
			res.status(409).json({ error: "Email already exists" });
		} else {
			res.status(500).json({ error: err.message });
		}
	}
})

//Edit User Nmae (if Needed)
router.patch("/", async (req, res) => {
	try {
		const updateUserData = await prisma.user.updateMany({
			where: { email: req.body.email },
			data: { name: req.body.name }
		})

		res.status(201).json(updateUserData)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})

//Delete User
router.delete("/", async (req, res) => {
	try {
		const DeleteUser = await prisma.user.deleteMany({
			where: { email: req.body.email }
		})
		res.status(200).json(DeleteUser)
	} catch (err) {
		res.status(500).json({ error: err.message })
	}
})
export default router;
