const socket = io();

const welcome = document.getElementById("welcome");
const enterForm = welcome.querySelector("#enter");
const nameForm = welcome.querySelector("#name");
const room = document.getElementById("room");

room.hidden = true;

let roomName;

function addMessage(message){
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message
    ul.appendChild(li);
}

function handleMessageSubmit (event) {
    event.preventDefault();
    const input = room.querySelector("#msg input");
    const value = input.value;
    socket.emit("new_message", value, roomName, () => {
        addMessage(`You : ${value}`);
    });
    input.value = "";
}

function handleNicknameSubmit (event) {
    event.preventDefault();
    nameForm.hidden= true;
    const input = welcome.querySelector("#name input");
    const value = input.value;
    socket.emit("nickname", value, () => {
        const h3 = document.getElementById("nickname");
        h3.innerText = `Your name : ${value}`;
    });
    input.value = "";
}

function showRoom(){
    enterForm.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`
    const msgForm = room.querySelector("#msg");
    msgForm.addEventListener("submit", handleMessageSubmit);
}

function handleRoomSubmit(event){
    event.preventDefault();
    const input = enterForm.querySelector("input");
    socket.emit("enter_room", input.value, showRoom);
    roomName = input.value;
    input.value = "";
}

enterForm.addEventListener("submit", handleRoomSubmit);
nameForm.addEventListener("submit", handleNicknameSubmit);   

socket.on("welcome", (user) => {
    addMessage(`${user} Joined!`)
})

socket.on("bye", (left) => {
    addMessage(`${left} Left!`);
})

socket.on("new_message", addMessage)
socket.on("room_change", (rooms) => {
    const roomList = welcome.querySelector("ul");
    roomList.innerHTML = "";
    if(rooms.length === 0){    
        return;
    }
    rooms.forEach(room => {
        console.log("it works")
        const li = document.createElement("li");
        li.innerText = room;
        roomList.append(li);
    })
});
// same ::: socket.on("room_change", (msg) => console.log(msg));