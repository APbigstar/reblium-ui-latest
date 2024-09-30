import { WebRTCClient } from "https://unpkg.com/@arcware/webrtc-plugin@latest/index_new.umd.js";

let reconnectTimer;
let reconnectAttempts = 0;
const maxReconnectAttempts = 5;
const baseReconnectDelay = 5000; // 5 seconds

async function setRemoteDescription(description) {
  if (newWebRTC.player && newWebRTC.player.pcClient) {
    const pc = newWebRTC.player.pcClient;
    if (pc.signalingState !== "stable") {
      await new Promise(resolve => {
        const checkState = () => {
          if (pc.signalingState === "stable") {
            resolve();
          } else {
            setTimeout(checkState, 100);
          }
        };
        checkState();
      });
    }
    await pc.setRemoteDescription(description);
  }
}

async function setRemoteDescriptionWithRetry(description, maxRetries = 3) {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      await setRemoteDescription(description);
      return;
    } catch (error) {
      console.warn(`Failed to set remote description (attempt ${retries + 1}):`, error);
      retries++;
      if (retries >= maxRetries) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
}

function initializeWebRTCClient() {
  newWebRTC = new WebRTCClient({
    address: "wss://signalling-client.ragnarok.arcware.cloud/",
    shareId: "share-79f09605-3edc-4fa8-b5b9-49a7a3a5f25b",
    settings: {
      peerConnectionOptions: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' },
        ]
      }
    },
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
    unauthorizedFallback: handleUnauthorized,
    onWebRtcOffer: async (offer) => {
      try {
        await setRemoteDescriptionWithRetry(offer);
        // Continue with your existing logic after setting the remote description
      } catch (error) {
        console.error("Failed to set remote description after retries:", error);
        handleError(error);
      }
    },
  });

  // Add event listeners
  newWebRTC.events.addListener("WebsocketClosed", handleClose);
  newWebRTC.events.addListener("NoStreamAvailable", handleNoStream);
  newWebRTC.events.addListener("DataChannelClosed", handleDataChannelClosed);

  // Start the connection
  newWebRTC.socket
    .init(newWebRTC)
    .then(() => {
      console.log("WebSocket Connection established");
      reconnectAttempts = 0;
      clearTimeout(reconnectTimer);
      startHeartbeat();
    })
    .catch(handleError);
}

function handleError(error) {
  console.error("WebSocket Error:", error);
  if (error.code === 1011) {
    console.log("Session not found. Attempting to refresh session...");
    refreshSession().then(() => reconnect());
  } else if (error instanceof DOMException && error.name === 'InvalidStateError') {
    console.log("Invalid state error. Attempting to reconnect...");
    reconnect();
  } else {
    reconnect();
  }
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

function handleNoStream() {
  console.log("No stream available. Attempting to reconnect...");
  reconnect();
}

function handleDataChannelClosed() {
  console.log("Data channel closed. Attempting to reconnect...");
  reconnect();
}

function handleUnauthorized() {
  console.log("Unauthorized. Please check your credentials.");
  // Implement logic to handle unauthorized access (e.g., redirect to login page)
}

function reconnect() {
  if (reconnectAttempts < maxReconnectAttempts) {
    console.log(
      `Attempting to reconnect... (Attempt ${
        reconnectAttempts + 1
      }/${maxReconnectAttempts})`
    );
    clearTimeout(reconnectTimer);
    const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts);
    reconnectTimer = setTimeout(() => {
      reconnectAttempts++;
      if (newWebRTC && newWebRTC.player && newWebRTC.player.pcClient) {
        newWebRTC.player.pcClient.close();
      }
      setTimeout(() => {
        initializeWebRTCClient();
      }, 1000); // Add a 1-second delay before reinitializing
    }, delay);
  } else {
    console.log("Max reconnection attempts reached. Please refresh the page.");
    showRefreshMessage();
  }
}

function refreshSession() {
  // Implement session refresh logic here
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
    if (newWebRTC && newWebRTC.socket && newWebRTC.socket.ready()) {
      newWebRTC.socket.send(JSON.stringify({ type: "heartbeat" }));
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
  console.log("Please refresh the page to reconnect.");
  // Implement UI update to show this message to the user
}

// Start the WebRTC client
initializeWebRTCClient();