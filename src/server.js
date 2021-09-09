import http from "http"
import WebSocket from "ws"
import express from "express"

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"))
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const PORT = 4000;
const handleListen = () => console.log(`Server Listening on http://localhost:${PORT}.`)

const server = http.createServer(app);
const wss = new WebSocket.Server({server});

wss.on("connection", (socket) => {
    console.log("Connected to Browser ✓")
    socket.on("close", () => console.log("Disconnected from the Browser ❌"))
    socket.on("message", message => {
        console.log(message.toString("utf8"));
    })
    socket.send("hello!!!");

})

server.listen(PORT, handleListen);