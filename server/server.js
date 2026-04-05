import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
const port = process.env.PORT || 3001;

app.get("/", (req, res) => {
	res.json({ text: "Hello World" })
})


app.listen(port, () => {
	console.log(`PORT STARTED ${port}`);

})
