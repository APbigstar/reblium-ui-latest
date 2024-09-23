// Import the WebRTCClient from the provided URL
import { WebRTCClient } from "https://unpkg.com/@arcware/webrtc-plugin@latest/index_new.umd.js";


// newWebRTC = new WebRTCClient({
//     address: "wss://signalling-client.ragnarok.arcware.cloud/",
//     shareId: "share-79f09605-3edc-4fa8-b5b9-49a7a3a5f25b",
//     settings: {},
//     playOverlay: false,
  
//     loader: (val) => {
//         if (val) {
//             showLoader();  // Assume this function shows a loading indicator
//         } else {
//             hideLoader();  // Assume this function hides the loading indicator
//         }
//     },
  
//     applicationResponse: (new_user_connected) => {
//         console.log("Assistant Reply:", new_user_connected)
//         if (new_user_connected) {
//             addBotMessage(new_user_connected.split(":")[1].trim());
//         }
//     },
  
//     sizeContainer: document.getElementById("sizeContainer"),
//     container: document.getElementById("videoContainer"),
//     audioRef: document.getElementById("audioRef"),
// });

// Assuming WebRTCClient is initialized somewhere in your code as newWebRTC

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
        onerror: (error) => {
            console.error('WebSocket Error:', error);
        },
        onopen: () => {
            console.log('WebSocket Connection established');
            startHeartbeat(); 
        },
        onclose: () => {
            console.log('WebSocket Connection closed');
            setTimeout(initializeWebRTCClient, 5000); 
        }
    });
}
// Heartbeat function to keep the WebSocket connection alive
function startHeartbeat() {
    const heartbeatInterval = 30000; // Send a heartbeat every 30 seconds
    const heartbeatMsg = JSON.stringify({ type: 'heartbeat', payload: 'ping' });
    setInterval(() => {
        if (newWebRTC.webSocket.readyState === WebSocket.OPEN) {
            newWebRTC.webSocket.send(heartbeatMsg);
        }
    }, heartbeatInterval);
}

function showLoader() {
    const loaderOverlay = document.querySelector(".loader-overlay");
    loaderOverlay.style.display = "flex";
  }

  function hideLoader() {
    const loaderOverlay = document.querySelector(".loader-overlay");
    loaderOverlay.style.display = "none";
  }


initializeWebRTCClient()