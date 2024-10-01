let newWebRTC;
let selectedCommand = null;
let videoLoaded = false;
let videoLoadedPromise = new Promise((resolve) => {
  window.resolveVideoLoaded = resolve;
});



function waitForVideoLoad() {
  return videoLoadedPromise.then(() => {
    if (videoLoaded) {
      const audioEnableConfirmationElement = document.getElementById(
        "audioEnableConfirmation"
      );
      audioEnableConfirmationElement.style.display = "block";
    }
  });
}

function detectVideoLoadedAndExecuteFunctions() {
  const videoContainer = document.getElementById("videoContainer");
  if (!videoContainer) {
    console.log("Video container not found");
    return;
  }

  const videoElement = videoContainer.querySelector("video");
  if (!videoElement) {
    console.log("Video element not found");
    return;
  }

  if (videoElement.readyState >= 3 && !videoLoaded) {
    videoLoaded = true;
    window.resolveVideoLoaded();
    clearInterval(checkInterval);
  }
}
// Define an interval to periodically check for video loading
const checkInterval = setInterval(detectVideoLoadedAndExecuteFunctions, 1000);

window.isVideoLoaded = () => videoLoaded;

function handleSendCommands(command) {
  selectedCommand = Object.keys(command)[0];
  console.log(selectedCommand);
  newWebRTC.emitUIInteraction(command);
  if (command.resetavatar) {
    latestLoadAvatarCommand = command.resetavatar;
  }
  console.log("Sending loadavatar command:", command.resetavatars);
}

function addBotMessage(message) {
  if (selectedCommand && selectedCommand == "usermessege") {
    const messageElement = document.createElement("div");
    messageElement.style.marginBottom = "8px";

    const pElement = document.createElement("p");
    pElement.style.background = "rgba(0, 0, 0, 0.2)";
    pElement.style.color = "white";
    pElement.style.borderRadius = "12px";
    pElement.style.padding = "8px 16px";
    pElement.style.display = "inline-block";
    pElement.innerText = message;

    messageElement.appendChild(pElement);
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight;

    selectedCommand = null;
  }
}

function handleMute() {
  const icon = document.getElementById("muteButton").firstElementChild;
  const audioRef = document.getElementById("audioRef");
  if (audioRef.muted) {
    audioRef.muted = false; // Unmute audio
    audioRef.play(); // Play the audio if it was muted
    icon.className = "fas fa-volume-up"; // Update icon to volume up
    icon.classList.remove("text-red-500", "line-through"); // Remove muted styles
  } else {
    audioRef.muted = true; // Mute audio
    audioRef.pause(); // Pause the audio
    icon.className = "fas fa-volume-mute"; // Update icon to mute
    icon.classList.add("text-red-500", "line-through"); // Add muted styles
  }
}

function cancelEnableAudio() {
  const audioEnableConfirmationElement = document.getElementById(
    "audioEnableConfirmation"
  );
  audioEnableConfirmationElement.style.display = "none";
}

function enableAudio() {
  const audioEnableConfirmationElement = document.getElementById(
    "audioEnableConfirmation"
  );
  handleMute();
  audioEnableConfirmationElement.style.display = "none";
}

document.addEventListener("DOMContentLoaded", function () {
  initializeEverything();
  const languageOptions = document.querySelectorAll(".language-option");
  const clearChatHistoryBtn = document.getElementById(
    "clear-chat-history-icon"
  );
  const toggleButton = document.getElementById("toggle-webcam");
  const audioRef = document.getElementById("audioRef");
  const webcam = document.getElementById("webcam");
  let selectedLanguage = "en-US"; // Default language
  let selectedVoice = "Samantha";
  let webcamActive = false;
  const recognition = new webkitSpeechRecognition();
  const callButton = document.getElementById("call-button");
  const stopCallButton = document.getElementById("stopcall-button");
  const sendButton = document.getElementById("send-button");
  const userInput = document.getElementById("user-input");
  const chatbox = document.getElementById("chatbox");

  recognition.continuous = false; // Set to true for continuous listening
  recognition.lang = "en-EN"; // Set your desired language
  recognition.interimResults = false; // Whether to show interim results
  recognition.maxAlternatives = 1; // Maximum number of alternatives to provide

  if (!("webkitSpeechRecognition" in window)) {
    alert(
      "Your browser does not support speech recognition. Please try this feature in Google Chrome."
    );
    return;
  }

  sendButton.addEventListener("click", function () {
    const userMessage = userInput.value;
    if (userMessage.trim() !== "") {
      addUserMessage(userMessage);
      userInput.value = "";
    }
  });

  userInput.addEventListener("keyup", function (event) {
    if (event.key === "Enter") {
      sendButton.click();
    }
  });

  clearChatHistoryBtn.addEventListener("click", () => {
    chatbox.textContent = "";
  });

  toggleButton.addEventListener("click", () => {
    if (!webcamActive) {
      activateWebcam();
    } else {
      resetWebcam(webcam.srcObject); // Reset using the current stream
    }
  });

  languageOptions.forEach((option) => {
    option.addEventListener("click", () => {
      resetAndSetActive(option);
      languageOptions.forEach((opt) => opt.classList.remove("selected"));
      option.classList.add("selected");
      selectedLanguage = option.getAttribute("data-lang-code");

      handleSendCommands({
        personas: `Change your language to this: ${option.dataset.lang}`,
      });

      updateVoiceCode();

      recognition.lang = option.getAttribute("data-lang-code");
      console.log(
        "Language for speech recognition set to: " + recognition.lang
      );

      // Update UI to reflect selection
      document
        .querySelectorAll(".language-option")
        .forEach((opt) => opt.classList.remove("selected"));
      option.classList.add("selected");
    });
  });

  function resetWebcam(stream) {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop()); // Stops each track in the stream
    }
    webcam.srcObject = null;
    webcam.style.display = "none";
    toggleButton.textContent = "Turn on webcam";
    webcamActive = false;
  }

  function activateWebcam() {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        webcam.srcObject = stream;
        webcam
          .play()
          .catch((error) =>
            console.error("Error playing video stream:", error)
          );
        webcam.style.display = "block";
        toggleButton.textContent = "Turn off webcam";
        webcamActive = true;

        toggleButton.onclick = () => resetWebcam(stream); // Set the button to stop the stream
      })
      .catch((error) => {
        console.error("Webcam access error:", error);
        alert("Could not access the webcam.");
      });
  }

  function initAudioRefProps() {
    audioRef.muted = true;
  }

  function updateDisplayState() {
    const chatbot = document.getElementById("chatbot");

    handleSendCommands({
      cameraswitch: "Head",
    });
    handleSendCommands({ camup: "" });
    handleSendCommands({ camup: "" });
    handleSendCommands({ camup: "" });

    chatbot.focus(); // Focus the chatbot div
  }

  async function initializeEverything() {
    await waitForVideoLoad();
    await fetchAndDisplayAvatar();
    initPreviewMode();
  }

  function decryptData(encryptedData) {
    // Reverse the base64url encoding
    const base64 = encryptedData.replace(/-/g, "+").replace(/_/g, "/");
    const paddedBase64 = base64.padEnd(
      base64.length + ((4 - (base64.length % 4)) % 4),
      "="
    );

    let decrypted = atob(paddedBase64);
    let result = "";
    for (let i = 0; i < decrypted.length; i++) {
      const charCode =
        decrypted.charCodeAt(i) ^
        ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
      result += String.fromCharCode(charCode);
    }

    // Split the decrypted string back into avatarId and userId
    const [avatarId, userId] = result.split("|");
    return { avatarId, userId };
  }

  async function fetchAndDisplayAvatar() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const encryptedData = urlParams.get("data");

    const { avatarId, userId } = decryptData(encryptedData);

    if (avatarId) {
      try {
        const response = await fetch(
          `/.netlify/functions/avatar/getUserAvatar/${avatarId}`
        );
        const data = await response.json();
        const { avatarData } = data;

        setTimeout(() => {
          handleSendCommands({
            resetavatar: JSON.stringify(avatarData.Avatar),
          });
        }, 1000);
      } catch (error) {
        console.error("Failed to fetch avatar:", error);
      }
    } else {
      window.location.href = "/";
    }

    if (avatarId && userId) {
      try {
        const response = await fetch(
          `/.netlify/functions/UserPrompts/getUserPrompts?user_id=${userId}&avatar_id=${avatarId}`
        );
        const { success, data } = await response.json();
        if (!success) {
          handleSendCommands({
            texttospeech: "Hi, I am a Rebelium assistant. How can I help you?",
          });
        } else {
          const welcomeMessage = data.welcome_message;
          handleSendCommands({ texttospeech: welcomeMessage });
        }
      } catch (error) {
        console.error("Error fetching user prompt data:", error);
        return null;
      }
    }
  }

  function initPreviewMode() {
    initAudioRefProps();
    updateDisplayState();
  }

  function resetAndSetActive(option) {
    const languageOptions = document.querySelectorAll(".language-option");
    var activeBackgroundColor = "#00cdff"; // Define the active background color
    languageOptions.forEach(function (opt) {
      opt.style.background = "none"; // Reset to default background
    });
    option.style.background = activeBackgroundColor; // Set active background
  }

  function updateVoiceCode() {
    if (selectedLanguage && selectedVoice) {
      const voiceCode = voiceMappings[selectedLanguage][selectedVoice];
      console.log(`Selected voice code: ${voiceCode}`);
      handleSendCommands({ voiceid: voiceCode });
    }
  }

  function toggleButtons() {
    if (callButton.style.display === "none") {
      callButton.style.display = "block";
      stopCallButton.style.display = "none";
    } else {
      callButton.style.display = "none";
      stopCallButton.style.display = "block";
    }
  }

  function addUserMessage(message) {
    const messageElement = document.createElement("div");
    messageElement.style.marginBottom = "8px";
    messageElement.style.textAlign = "right";

    const pElement = document.createElement("p");
    pElement.style.background = "#00cdff";
    pElement.style.color = "white";
    pElement.style.borderRadius = "12px";
    pElement.style.padding = "8px 16px";
    pElement.style.display = "inline-block";
    pElement.innerText = message;

    messageElement.appendChild(pElement);
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight;

    handleSendCommands({ usermessege: message });
  }

  // Event handler to start speech recognition
  callButton.addEventListener("click", () => {
    console.log("Clicked Call Button");
    recognition.start();
    console.log("Speech recognition started.");
    toggleButtons(); // Show stop button
  });

  // Event handler to stop speech recognition
  stopCallButton.addEventListener("click", () => {
    console.log("Clicked Stop Button");
    recognition.stop();
    console.log("Speech recognition stopped.");
    toggleButtons(); // Show call button
  });

  recognition.onresult = function (event) {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) {
        let speechToText = result[0].transcript.trim();
        if (speechToText) {
          speechToText =
            speechToText.charAt(0).toUpperCase() + speechToText.slice(1);
          console.log(`Recognized text: ${speechToText}`);

          const messageElement = document.createElement("div");
          messageElement.style.margin = "8px";

          messageElement.style.textAlign = "right";

          const pElement = document.createElement("p");
          pElement.style.background = "rgba(0, 0, 0, 0.2)";
          pElement.style.color = "white";
          pElement.style.borderRadius = "12px";
          pElement.style.padding = "8px 16px";
          pElement.style.display = "inline-block";
          pElement.style.border = "white solid 1px";
          pElement.innerText = speechToText;

          messageElement.appendChild(pElement);
          chatbox.appendChild(messageElement);
          chatbox.scrollTop = chatbox.scrollHeight;

          // send the detected text to avatar
          handleSendCommands({ usermessege: speechToText });
        } else {
          console.log("No text recognized or text was only whitespace.");
        }
      }
    }
  };

  recognition.onerror = function (event) {
    console.error("Speech recognition error", event.error);
  };

  recognition.onend = function () {
    recognition.stop();
    console.log("Speech recognition ended.");
    toggleButtons(); // Reset button visibility
  };
});
