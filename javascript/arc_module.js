import { WebRTCClient } from "https://unpkg.com/@arcware/webrtc-plugin@latest/index_new.umd.js";

let reconnectTimer;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const baseReconnectDelay = 5000; // 5 seconds

// Function to initialize the WebRTC client
function initializeWebRTCClient() {
  newWebRTC = new WebRTCClient({
    address: "wss://signalling-client.ragnarok.arcware.cloud/",
    shareId: "share-79f09605-3edc-4fa8-b5b9-49a7a3a5f25b",
    settings: {},
    playOverlay: false,
    loader: (val) => {
      val ? showLoader() : hideLoader();
    },
    applicationResponse: (response) => {
      console.log("Assistant Reply:", response);
      if (response) {
        const message = response.split(":")[1].trim();
        addBotMessage(message);
      }
    },
    sizeContainer: document.getElementById("sizeContainer"),
    container: document.getElementById("videoContainer"),
    audioRef: document.getElementById("audioRef"),
    onerror: handleError,
    onopen: handleOpen,
    onclose: handleClose,
  });
}

function handleError(error) {
  console.error("WebSocket Error:", error);
  if (error.code === 1011) {
    console.log("Session not found. Attempting to refresh session...");
    refreshSession().then(() => reconnect());
  } else {
    reconnect();
  }
}

function handleOpen() {
  console.log("WebSocket Connection established");
  reconnectAttempts = 0;
  clearTimeout(reconnectTimer);
  startHeartbeat();
}

function handleClose(event) {
  console.log("WebSocket Connection closed", event);
  stopHeartbeat();
  if (event.code === 4503) {
    console.log("Stream disconnected. Attempting to reconnect...");
    reconnect();
  } else if (event.code === 1000) {
    console.log("Normal closure, no reconnection needed");
  } else {
    reconnect();
  }
}

function reconnect() {
  if (reconnectAttempts < maxReconnectAttempts) {
    console.log(`Attempting to reconnect... (Attempt ${reconnectAttempts + 1}/${maxReconnectAttempts})`);
    clearTimeout(reconnectTimer);
    const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts);
    reconnectTimer = setTimeout(() => {
      reconnectAttempts++;
      initializeWebRTCClient();
    }, delay);
  } else {
    console.log("Max reconnection attempts reached. Please refresh the page.");
    showRefreshMessage();
  }
}

function refreshSession() {
  // Implement session refresh logic here
  // This should make a request to your backend to get a new session token
  return new Promise((resolve, reject) => {
    // Simulating an API call
    setTimeout(() => {
      console.log("Session refreshed");
      resolve();
    }, 1000);
  });
}

let heartbeatInterval;

function startHeartbeat() {
  stopHeartbeat(); // Clear any existing interval
  heartbeatInterval = setInterval(() => {
    if (newWebRTC && newWebRTC.ws && newWebRTC.ws.readyState === WebSocket.OPEN) {
      newWebRTC.ws.send("heartbeat");
    } else {
      stopHeartbeat();
      console.log("Heartbeat stopped due to closed connection");
      reconnect();
    }
  }, 30000); // Send a heartbeat every 30 seconds
}

function stopHeartbeat() {
  if (heartbeatInterval) {
    clearInterval(heartbeatInterval);
  }
}

function showLoader() {
  const loaderOverlay = document.querySelector(".loader-overlay");
  if (loaderOverlay) {
    loaderOverlay.style.display = "flex";
  }
}

function hideLoader() {
  const loaderOverlay = document.querySelector(".loader-overlay");
  if (loaderOverlay) {
    loaderOverlay.style.display = "none";
  }
}

function showRefreshMessage() {
  // Implement this function to show a message to the user
  // suggesting they refresh the page
  console.log("Please refresh the page to reconnect.");
  // You might want to update the UI here to show this message to the user
}

// Start the WebRTC client
initializeWebRTCClient();