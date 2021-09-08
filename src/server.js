import express from "express"

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"))
app.get("/", (req, res) => res.render("home"));
const PORT = 4000;
const handleListen = () => console.log(`Server Listening on ${PORT}.`)
app.listen(PORT, handleListen);