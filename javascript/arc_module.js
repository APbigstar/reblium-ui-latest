import { WebRTCClient } from "https://unpkg.com/@arcware/webrtc-plugin@latest/index_new.umd.js";

// Function to initialize the WebRTC client
function initializeWebRTCClient() {
  let reconnectTimer = null;

  function reconnect() {
    console.log("Attempting to reconnect...");
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(initializeWebRTCClient, 5000);
  }

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
    onerror: (error) => {
      console.error("WebSocket Error:", error);
      if (error.code === 1011) {
        console.log("Session not found. Attempting to reconnect...");
        reconnect();
      }
    },
    onopen: () => {
      console.log("WebSocket Connection established");
      clearTimeout(reconnectTimer);
      startHeartbeat();
    },
    onclose: (event) => {
      console.log("WebSocket Connection closed", event);
      if (event.code === 4503) {
        console.log("Stream disconnected. Attempting to reconnect...");
      }
      reconnect();
    },
  });
}

// Helper function to start a heartbeat mechanism
function startHeartbeat() {
  const heartbeatInterval = setInterval(() => {
    if (newWebRTC && newWebRTC.ws.readyState === WebSocket.OPEN) {
      newWebRTC.ws.send("heartbeat");
    } else {
      clearInterval(heartbeatInterval);
      console.log("Heartbeat stopped due to closed connection");
      reconnect();
    }
  }, 30000); // Send a heartbeat every 30 seconds
}

function showLoader() {
  const loaderOverlay = document.querySelector(".loader-overlay");
  loaderOverlay.style.display = "flex";
}

function hideLoader() {
  const loaderOverlay = document.querySelector(".loader-overlay");
  loaderOverlay.style.display = "none";
}

initializeWebRTCClient();
