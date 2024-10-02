import { WebRTCClient } from "https://unpkg.com/@arcware/webrtc-plugin@latest/index_new.umd.js";

newWebRTC = new WebRTCClient({
  address: "wss://signalling-client.ragnarok.arcware.cloud/",
  shareId: "share-79f09605-3edc-4fa8-b5b9-49a7a3a5f25b",
  settings: {},
  playOverlay: false,

  loader: (val) => {
    if (val) {
      showLoader(); // Assume this function shows a loading indicator
    } else {
      hideLoader(); // Assume this function hides the loading indicator
    }
  },

  applicationResponse: (response) => {
    if (response) {
      const message = response.split(":")[1].trim();
      addBotMessage(message);
    } // Logging the response
  },

  sizeContainer: document.getElementById("sizeContainer"),
  container: document.getElementById("videoContainer"),
  audioRef: document.getElementById("audioRef"),
});

// import { WebRTCClient } from "https://unpkg.com/@arcware/webrtc-plugin@latest/index_new.umd.js";

// let reconnectTimer;
// let reconnectAttempts = 0;
// const maxReconnectAttempts = 5;
// const baseReconnectDelay = 5000; // 5 seconds

// function initializeWebRTCClient() {
//   newWebRTC = new WebRTCClient({
//     address: "wss://signalling-client.ragnarok.arcware.cloud/",
//     shareId: "share-79f09605-3edc-4fa8-b5b9-49a7a3a5f25b",
//     settings: {},
//     playOverlay: false,
//     loader: (val) => {
//       val ? showLoader() : hideLoader();
//     },
//     applicationResponse: (response) => {
//       console.log("response", response);
//       if (response) {
//         const message = response.split(":")[1].trim();
//         addBotMessage(message);
//       }
//     },
//     sizeContainer: document.getElementById("sizeContainer"),
//     container: document.getElementById("videoContainer"),
//     audioRef: document.getElementById("audioRef"),
//   });

//   // Add event listeners
//   newWebRTC.events.addListener("WebsocketClosed", handleClose);
//   newWebRTC.events.addListener("NoStreamAvailable", handleNoStream);
//   newWebRTC.events.addListener("DataChannelClosed", handleDataChannelClosed);

//   // Initialize WebRTC features without starting the WebSocket connection
//   initializeWebRTCFeatures();
// }

// function initializeWebRTCFeatures() {
//   // Initialize any necessary WebRTC features here
//   // This function replaces the direct WebSocket initialization

//   // For example, you might want to set up the video container, initialize the data channel, etc.
//   console.log("Initializing WebRTC features");

//   // If there are any initialization steps that don't require an active WebSocket connection, do them here

//   // After initialization, you can start the heartbeat or perform other necessary actions
//   startHeartbeat();
// }

// function handleClose(event) {
//   console.log("WebSocket Connection closed", event);
//   stopHeartbeat();
//   reconnect();
// }

// function handleNoStream() {
//   console.log("No stream available. Attempting to reconnect...");
//   reconnect();
// }

// function handleDataChannelClosed() {
//   console.log("Data channel closed. Attempting to reconnect...");
//   reconnect();
// }

// function reconnect() {
//   if (reconnectAttempts < maxReconnectAttempts) {
//     console.log(
//       `Attempting to reconnect... (Attempt ${
//         reconnectAttempts + 1
//       }/${maxReconnectAttempts})`
//     );
//     clearTimeout(reconnectTimer);
//     stopHeartbeat();
//     if (newWebRTC && newWebRTC.socket) {
//       newWebRTC.socket.close();
//     }
//     const delay = baseReconnectDelay * Math.pow(2, reconnectAttempts);
//     reconnectTimer = setTimeout(() => {
//       const streamingVideoContent = document.getElementById('streamingVideoContainer');
//       if (streamingVideoContent) streamingVideoContent.remove();
//       reconnectAttempts++;
//       initializeWebRTCClient();
//     }, delay);
//   } else {
//     console.log("Max reconnection attempts reached. Please refresh the page.");
//     showRefreshMessage();
//   }
// }

// let heartbeatInterval;

// function startHeartbeat() {
//   stopHeartbeat(); // Clear any existing interval
//   heartbeatInterval = setInterval(() => {
//     if (newWebRTC && newWebRTC.socket && newWebRTC.socket.ready()) {
//       try {
//         newWebRTC.socket.send(JSON.stringify({ type: "heartbeat" }));
//       } catch (error) {
//         console.error("Failed to send heartbeat:", error);
//         stopHeartbeat();
//         reconnect();
//       }
//     } else {
//       console.log("WebSocket not ready, stopping heartbeat");
//       stopHeartbeat();
//       reconnect();
//     }
//   }, 30000); // Send a heartbeat every 30 seconds
// }

// function stopHeartbeat() {
//   if (heartbeatInterval) {
//     clearInterval(heartbeatInterval);
//   }
// }

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

// function showRefreshMessage() {
//   console.log("Please refresh the page to reconnect.");
//   // Implement UI update to show this message to the user
// }

// // Start the WebRTC client
// initializeWebRTCClient();