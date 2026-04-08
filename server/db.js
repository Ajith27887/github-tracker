import { Client } from "pg";

const client = new Client({
	user: process.env.USER,
	host: process.env.HOST,
	database: process.env.DATABASE,
	port: process.env.PORT,
	password: process.env.PASSWORD
})

export default client;

