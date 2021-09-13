import http from "http"
import SocketIO from "socket.io"
import express from "express"
import { instrument } from "@socket.io/admin-ui"

const app = express();

app.set("view engine", "pug");
app.set("views", __dirname + "/views");
app.use("/public", express.static(__dirname + "/public"))
app.get("/", (req, res) => res.render("home"));
app.get("/*", (req, res) => res.redirect("/"));

const PORT = 4000;
const handleListen = () => console.log(`Server Listening on http://localhost:${PORT}.`)

const httpServer = http.createServer(app);
const wsServer = SocketIO(httpServer);

httpServer.listen(PORT, handleListen);
