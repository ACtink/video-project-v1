// =========================
// WebSocket Setup
// =========================
// const socket = new WebSocket(
//   "wss://boomless-plushed-paisley.ngrok-free.dev"
// );

const socket = new WebSocket("ws://localhost:3000");

socket.onopen = () => {
  console.log("WebSocket connected");
  updateStatus("Connected to server");
};

socket.onmessage = async (event) => {
  const message = JSON.parse(event.data);
  console.log("Received:", message);

  switch (message.type) {
    case "matched":
      hideLoading();
      isCaller = message.role === "caller"; // ✔ only caller makes offer
      updateStatus("Matched! Initializing call...");
      startWebRTC();
      break;

    case "offer":
      isCaller = false;
      await handleOffer(message.offer);
      break;

    case "answer":
      await handleAnswer(message.answer);
      break;

    case "ice-candidate":
      await handleRemoteICE(message.candidate);
      break;

    case "partner-disconnected":
      updateStatus("Partner disconnected");
      disconnectPeerOnly(message.reason);
      break;
    case "queued":
      hideLoading();
      updateStatus("you are added in the queue...");
      break;

    case "force-disconnect":
      disconnectPeerOnly(message.reason);
      break;

    case "partner-ended-call":
      disconnectPeerOnly(message.reason);
      break;

    case "connected":
      hideLoading();
      updateStatus("Connected to server, your ID: " + message.id);
      break;
    case "matching-to-next":
      hideLoading();
      updateStatus("Finding next stranger...");
      disconnectPeerOnly();
      break;
    default:
      console.log("Unknown message:", message);
  }
};

socket.onerror = (error) => {
  console.error("WebSocket error:", error);
  updateStatus("WebSocket error");
};




socket.onclose = () => {
  console.log("WebSocket disconnected");
  updateStatus("Server connection closed");
};

// Send message to server
function sendSignal(data) {
  socket.send(JSON.stringify(data));
}

// =========================
// DOM Elements
// =========================
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");

const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const endBtn = document.getElementById("endBtn");

const loading = document.getElementById("loading");
const statusText = document.getElementById("connectionState");

// =========================
// UI Helper Functions
// =========================
function showLoading() {
  loading.style.display = "block";
}

function hideLoading() {
  loading.style.display = "none";
}

function updateStatus(text) {
  statusText.textContent = text;
  console.log("STATUS:", text);
}

// =========================
// WebRTC Setup
// =========================
let localStream;
let peer;
let isCaller = false;

const rtcConfig = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    // TURN can be added later
  ],
};

// =========================
// Start WebRTC
// =========================
async function startWebRTC() {
  updateStatus("Starting camera...");

  peer = new RTCPeerConnection(rtcConfig);

  // ICE candidates
  peer.onicecandidate = (event) => {
    if (event.candidate) {
      sendSignal({
        type: "ice-candidate",
        candidate: event.candidate,
      });
    }
  };

  // Remote video track
  peer.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
  };

  peer.onconnectionstatechange = () => {
    console.log("State:", peer.connectionState);
  };

  // Use the already opened camera stream
  if (localStream) {
    localStream.getTracks().forEach((track) => {
      peer.addTrack(track, localStream);
    });
    localVideo.srcObject = localStream;
  } else {
    updateStatus("Local stream missing. Did you press Start?");
    return;
  }

  

  // If caller, create offer
  if (isCaller) {
    updateStatus("Creating offer...");
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    console.log("Sending offer:", offer);
    sendSignal({ type: "offer", offer });
  }
}

// =========================
// WebRTC Handlers
// =========================
async function handleOffer(offer) {
  updateStatus("Received offer, creating answer...");

  if (!peer) await startWebRTC();

  await peer.setRemoteDescription(new RTCSessionDescription(offer));

  const answer = await peer.createAnswer();
  await peer.setLocalDescription(answer);

  console.log("Sending answer:", answer);
  sendSignal({ type: "answer", answer });
}

async function handleAnswer(answer) {
  await peer.setRemoteDescription(new RTCSessionDescription(answer));
  updateStatus("Connected!");
}

async function handleRemoteICE(candidate) {
  try {
    await peer.addIceCandidate(candidate);
  } catch (err) {
    console.error("ICE Error:", err);
  }
}

// =========================
// End Call Function
// =========================

function endCall() {
  updateStatus("Call ended");
  hideLoading();

  sendSignal({ type: "end-call" });

  if (peer) {
    peer.close();
    peer = null;
  }

  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }

  localVideo.srcObject = null;
  remoteVideo.srcObject = null;
}

// =========================
// Button Events
// =========================
// Replace old startBtn.onclick with this
startBtn.onclick = async () => {
  updateStatus("Requesting camera & microphone permission...");
  showLoading();

  try {
    // Request media now (user gesture: click). This will trigger browser prompt.
    const preStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });

    // Show a local preview immediately
    localVideo.srcObject = preStream;
    localStream = preStream; // store so later startWebRTC can reuse tracks

    updateStatus("Permission granted — joining queue...");
    // Tell server to add this user to the matching queue
    sendSignal({ type: "join-queue" });

    // Keep loader visible until matched; when matched, startWebRTC will run.
  } catch (err) {
    console.error("Camera error (preflight):", err);
    hideLoading();
    if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
      updateStatus("Camera/microphone permission denied. Please allow access and try again.");
    } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
      updateStatus("No camera/microphone found.");
    } else {
      updateStatus("Unable to access camera/microphone: " + err.message);
    }
  }
};



// nextBtn.onclick = () => {
//   updateStatus("Finding next stranger...");
//   showLoading();

//   endCall();
//   sendSignal({ type: "next" });
// };


function disconnectPeerOnly(messageReason) {



  if(messageReason==="searchingNextForYou"){
    updateStatus("Finding next stranger...");
    showLoading();
  } else {
    updateStatus("Stranger disconnected. Click Next to search again.");
  } 





  if (peer) {
    peer.close();
    peer = null;
  }

  // Clean remote video properly
  if (remoteVideo.srcObject) {
    remoteVideo.srcObject.getTracks().forEach((track) => track.stop());
  }

  remoteVideo.srcObject = null;
}



nextBtn.onclick = () => {
  updateStatus("Finding next stranger...");
  showLoading();

  // disconnectPeerOnly(); // ❗ end peer connection
  sendSignal({ type: "next" });
  sendSignal({ type: "force-disconnect" });

};


endBtn.onclick = () => {
  endCall();
};
