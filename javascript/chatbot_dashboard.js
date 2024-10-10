const chatbox = document.getElementById("chatbox");
const chatContainer = document.getElementById("chat-container");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const clearChatHistoryBtn = document.getElementById("clear-chat-history-icon");
const openChatButton = document.getElementById("open-chat");
const closeChatButton = document.getElementById("close-chat");

let lastPersonaInput = "";
let selectedLanguage = "en-US"; // Default language
let selectedVoice = "Samantha";

clearChatHistoryBtn.addEventListener("click", () => {
  chatbox.textContent = "";
});
// Add an event listener to the send button
sendButton.addEventListener("click", function () {
  const userMessage = userInput.value;
  if (userMessage.trim() !== "") {
    addUserMessage(userMessage);
    userInput.value = "";
  }
});

// This function will show the API pop-up
document.getElementById("apiButton").addEventListener("click", function () {
  removeAllPopUps();
  document.getElementById("apiPopup").style.display = "block";
});

// This function will hide the pop-up
document.getElementById("apiClose").addEventListener("click", function () {
  document.getElementById("apiPopup").style.display = "none";
});

userInput.addEventListener("keyup", function (event) {
  if (event.key === "Enter") {
    sendButton.click();
  }
});

document
  .getElementById("apiKeyConfirmButton")
  .addEventListener("click", function () {
    var apiKey = document.getElementById("apiKeyInput").value; // Get the value from the input field
    if (apiKey) {
      // Check if the input is not empty
      handleSendCommands({ gptapikey: apiKey }); // Call the function with the API key
      document.getElementById("apiPopup").style.display = "none"; // Optionally, close the popup after sending the command
    } else {
      alert("Please enter an API key."); // Alert the user to enter an API key if the input is empty
    }
  });

document
  .getElementById("languageButton")
  .addEventListener("click", function () {
    removeAllPopUps();
    document.getElementById("languagePopup").style.display = "block"; // Show the language popup
  });

document.getElementById("languageClose").addEventListener("click", function () {
  document.getElementById("languagePopup").style.display = "none"; // Hide the popup
});

document.getElementById("voiceButton").addEventListener("click", function () {
  removeAllPopUps();
  document.getElementById("voicePopup").style.display = "block";
});

document.getElementById("voiceClose").addEventListener("click", function () {
  document.getElementById("voicePopup").style.display = "none";
});

document.getElementById("Signup").addEventListener("click", function () {
  var img = document.getElementById("signupImage");
  if (img.style.display === "none") {
    img.style.display = "block"; // Show the image
  } else {
    img.style.display = "none"; // Optionally hide if you want to toggle by button too
  }
});

document.getElementById("signupImage").addEventListener("click", function () {
  this.style.display = "none"; // Hide the image when it is clicked
});

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

function removeAllPopUps() {
  let popupElems = document.getElementsByClassName("assitant-popup");
  for (let item of popupElems) {
    item.style.display = "none";
  }
}

async function getUserPromps(type) {
  let personaInput = document.getElementById("personaInput");
  let welcomeMessage = document.getElementById("welcomeMessage");
  if (!defaultAvatarPrompt) {
    console.log("Avatar Mode -------------------------------");
    if (globalUserInfoId && selectedUserAvatarId) {
      try {
        const response = await fetch(
          `/.netlify/functions/UserPrompts/getUserPrompts?user_id=${globalUserInfoId}&avatar_id=${selectedUserAvatarId}`
        );
        const { success, data } = await response.json();
        if (!success) {
          if (type == "prompt") {
            personaInput.value = "";
            welcomeMessage.value = "";
            console.log("Not Found User Prompt");
          } else {
            handleSendCommands({
              texttospeech:
                "Hi, I am a Rebelium assistant. How can I help you?",
            });
          }
        } else {
          if (type == "prompt") {
            personaInput.value = data.prompts || "";
            welcomeMessage.value = data.welcome_message || "";
          } else {
            const welcomeMessage = data.welcome_message;
            setTimeout(() => {
              console.log(welcomeMessage, "Call Welcome Message");
              handleSendCommands({ texttospeech: welcomeMessage });
            }, 1000);
          }
        }
      } catch (error) {
        console.error("Error fetching user prompt data:", error);
        return null;
      }
    }
  }
}

function getLocalStream() {
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      window.localStream = stream;
      window.localAudio.srcObject = stream;
      window.localAudio.autoplay = true;
    })
    .catch((err) => {
      console.error(`you got an error: ${err}`);
    });
}

getLocalStream();

function encryptData(avatarId, userId) {
  const data = `${avatarId}|${userId}`; // Use pipe as delimiter
  let result = "";
  for (let i = 0; i < data.length; i++) {
    const charCode =
      data.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(result).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

document.addEventListener("DOMContentLoaded", function () {
  const languageOptions = document.querySelectorAll(".language-option");
  const voiceOptions = document.querySelectorAll(".voice-option");
  const personaButton = document.getElementById("personaButton");
  const personaPopup = document.getElementById("personaPopup");
  const personaClose = document.getElementById("personaClose");
  const personaConfirmButton = document.getElementById("personaConfirmButton");
  const personaInput = document.getElementById("personaInput");
  const welcomeMessage = document.getElementById("welcomeMessage");
  const chatbox = document.getElementById("chatbox");
  const callButton = document.getElementById("call-button");
  const stopCallButton = document.getElementById("stopcall-button");
  const recognition = new webkitSpeechRecognition();

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

  languageOptions.forEach((option) => {
    option.addEventListener("click", () => {
      resetAndSetActive(option);
      languageOptions.forEach((opt) => opt.classList.remove("selected"));
      option.classList.add("selected");
      selectedLanguage = option.getAttribute("data-lang-code");
      if (lastPersonaInput) {
        handleSendCommands({
          personas: `Change your language to this: ${option.dataset.lang} and use persona: ${lastPersonaInput}`,
        });
      } else {
        handleSendCommands({
          personas: `Change your language to this: ${option.dataset.lang}`,
        });
      }
      document.getElementById("languagePopup").style.display = "none";

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

  voiceOptions.forEach((option) => {
    option.addEventListener("click", () => {
      voiceOptions.forEach((opt) => opt.classList.remove("selected"));
      option.classList.add("selected");
      selectedVoice = option.textContent.trim();
      document.getElementById("voicePopup").style.display = "none"; // Hide the popup after selection
      updateVoiceCode();
    });
  });

  function toggleButtons() {
    if (callButton.style.display === "none") {
      callButton.style.display = "block";
      stopCallButton.style.display = "none";
    } else {
      callButton.style.display = "none";
      stopCallButton.style.display = "block";
    }
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

  personaButton.addEventListener("click", function () {
    removeAllPopUps();
    personaPopup.style.display = "block";
    if (createMode || avatarMode) {
      getUserPromps("prompt");
    } else {
      if (localStorage.getItem("welcome_message")) {
        welcomeMessage.value = localStorage.getItem("welcome_message");
      } else {
        welcomeMessage.value = ""
      }
      if (localStorage.getItem("prompt")) { 
        personaInput.value = localStorage.getItem("prompt");
      }
    }
  });

  personaClose.addEventListener("click", function () {
    personaPopup.style.display = "none";
  });

  personaConfirmButton.addEventListener("click", async function () {
    try {
      if (createMode || avatarMode) {
        const response = await fetch(
          "/.netlify/functions/UserPrompts/insertUserPrompts",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompts: personaInput.value,
              user_id: globalUserInfoId,
              avatar_id: selectedUserAvatarId,
              welcomeMessage: welcomeMessage.value,
            }),
          }
        );

        const { success, message } = await response.json();

        if (success) {
          showNotification(message, "", "success");
        } else {
          showNotification(
            "Failed to save chat setting.",
            "Please try again after saving avatar.",
            "error"
          );
        }
      } else {
        let welcomeMessage = document.getElementById("welcomeMessage");
        let prompt = document.getElementById("personaInput");
        localStorage.setItem("welcome_message", welcomeMessage.value || "");
        localStorage.setItem("prompt", prompt.value || "");
        showNotification("Saved your chat setting temporally.", "", "success");
        removeAllPopUps();
      }
    } catch (error) {
      console.log("Error: ", error);
    }

    const inputText = personaInput.value.trim(); // Get the value from the input field
    if (inputText !== "") {
      // Send the input text via handleSendCommands function
      handleSendCommands({ personas: inputText });
      lastPersonaInput = inputText; // Update the global variable with the latest input

      // Optionally clear the input field and close the popup
      personaInput.value = "";
      personaPopup.style.display = "none";
    } else {
      // Handle the case where the input is empty
      // alert("Please enter a persona before confirming.");
    }
  });
});
