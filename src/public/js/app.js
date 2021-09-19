const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");

//camerasSelect.hidden = true;
call.hidden=true;

let myStream;
let muted = false;
let cameraOff = false;
let roomName = "TheChosenOne";
let myPeerConnection;
let myDataChannel;

// mute, cam control

async function getCameras(){
    try{
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter(device => device.kind === "videoinput");
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach(camera => {
            const option = document.createElement("option")
            option.value = camera.deviceId
            option.innerText = camera.label
            if(currentCamera.label === camera.label){
                option.selected = true
            }
            camerasSelect.appendChild(option);
        })
    }catch(e){
        console.log(e);
    };
}

async function getMedia(deviceId) {
    const initialConstrains = {
        audio : false, 
        video : {facingMode : "user" },
    }
    const cameraConstraints = {
        audio: false,
        video:{ deviceId : { exact : deviceId } },
    }
    try {
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId? cameraConstraints : initialConstrains
        );
        myFace.srcObject = myStream;
        if(!deviceId){
            await getCameras();
        }
    } catch(e){
        console.log(e);
    }
}

function handleMuteClick(){
    const i = muteBtn.querySelector("button");
    myStream.getAudioTracks().forEach((track) => (track.enabled = !track.enabled));
    if(!muted){
        i.classList = "fas fa-microphone-slash fa-lg";
        muted = true;
    } else {
        i.classList = "fas fa-microphone fa-lg";
        muted = false;
    }
}

function handleCameraClick(){
    const i = cameraBtn.querySelector("button");
    myStream.getVideoTracks().forEach((track) => (track.enabled = !track.enabled));
    if(cameraOff){
        i.classList = "fas fa-video fa-lg";
        cameraOff = false;
    } else {
        i.classList = "fas fa-video-slash fa-lg";
        cameraOff = true;
    }
}

async function handleCameraChange() {
    await getMedia(camerasSelect.value);
    if(myPeerConnection){
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection.getSenders().find((sender) => sender.track.kind === "video");
        videoSender.replaceTrack(videoTrack);
    }
}

muteBtn.addEventListener("click", handleMuteClick)
cameraBtn.addEventListener("click", handleCameraClick)
camerasSelect.addEventListener("input", handleCameraChange);

// Welcome Form (join a room)

const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");
welcomeForm.addEventListener("submit", handleWelcomeSubmit);

async function initCall(){
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

async function handleWelcomeSubmit(event){
    event.preventDefault();
    await initCall();
    socket.emit("join_room", roomName);
}

// Socket Code

// Peer A
socket.on("welcome", async () => {
    if(myPeerConnection === null) makeConnection();
    paintChat("Opposite come in!","alert")
    myDataChannel = myPeerConnection.createDataChannel("chat");
    myDataChannel.addEventListener("message", (message) => paintChat(message.data, "Opponent"));
    console.log("made data channel");
    const offer = await myPeerConnection.createOffer();
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer")
    socket.emit("offer", offer, roomName);
})

socket.on("answer", (answer) => {
    console.log("received the answer")
    myPeerConnection.setRemoteDescription(answer);
})

// Peer B
socket.on("offer", async (offer) => {
    myPeerConnection.addEventListener("datachannel", (event) => {
        myDataChannel = event.channel;
        myDataChannel.addEventListener("message", (message) => paintChat(message.data, "Opponent"));
    })
    console.log("received the offer")
    myPeerConnection.setRemoteDescription(offer);
    const answer = await myPeerConnection.createAnswer();
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName)
    console.log("sent the answer")
})

socket.on("ice", (ice) => {
    console.log("received candidate")
    myPeerConnection.addIceCandidate(ice)
})

socket.on("leave", (alert) => {
    myPeerConnection.close();
    myPeerConnection=null;
    myDataChannel=null;
    paintChat("Opposite exit!", "alert")
})


// RTC Code

function makeConnection(){
    myPeerConnection = new RTCPeerConnection();
    // STUN SERVER
    // myPeerConnection = new RTCPeerConnection({
    //     iceServers: [
    //       {
    //         urls: [
    //           "stun:stun.l.google.com:19302",
    //           "stun:stun1.l.google.com:19302",
    //           "stun:stun2.l.google.com:19302",
    //           "stun:stun3.l.google.com:19302",
    //           "stun:stun4.l.google.com:19302",
    //         ],
    //       },
    //     ],
    //   });
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream.getTracks().forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data){
    console.log("sent candidate")
    socket.emit("ice", data.candidate, roomName)
}

function handleAddStream(data){
    const peerFace = document.getElementById("peerFace");
    peerFace.srcObject = data.stream;
}

const chatForm = document.querySelector("#chat form");
const chatInput = chatForm.querySelector("input");
const chats = document.getElementById("chats");

function handleChatSubmit(event) {
    event.preventDefault();
    if(chatInput.value !== "" && myDataChannel){
    myDataChannel.send(chatInput.value);
    paintChat(chatInput.value, "You");
    }
    chatInput.value ="";
}

function paintChat(message, user){
    const div = document.createElement("div");
    div.classList = "chatBox";
    const li = document.createElement("li");
    li.innerText = message;
    chats.appendChild(div);
    switch (user) {
        case "You" :
            li.classList = "you"
            const icon = document.createElement("icon");
            icon.classList = "youIcon"
            icon.innerText = "You"
            div.appendChild(li);
            div.appendChild(icon);
            break;
        case "Opponent" :
            li.classList = "opponent"
            const icon2 = document.createElement("icon");
            icon2.classList = "opponentIcon"
            div.appendChild(icon2);
            div.appendChild(li);
            break;
        case "alert" :
            li.classList = "alert"
            div.appendChild(li);
            break;
    }

    }

chatForm.addEventListener("submit", handleChatSubmit);