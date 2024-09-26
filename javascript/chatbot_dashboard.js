let lastPersonaInput = ""; // This will hold the last persona input submitted

const chatbox = document.getElementById("chatbox");
const chatContainer = document.getElementById("chat-container");
const userInput = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const clearChatHistoryBtn = document.getElementById("clear-chat-history-icon");
const openChatButton = document.getElementById("open-chat");
const closeChatButton = document.getElementById("close-chat");
// const toggleIcon = document.getElementById("toggle-icon");

// // Function to toggle the chatbox visibility
// function toggleChatbox() {
//   if (chatbox.style.display === "none") {
//     // Show the chatbox if it's currently hidden
//     chatbox.style.display = "block"; // Set display to block to show it
//     chatContainer.classList.remove("chat-collapsed");
//     toggleIcon.textContent = "—"; // Set the toggle icon to indicate collapsing
//   } else {
//     // Hide the chatbox if it's currently shown
//     chatbox.style.display = "none"; // Set display to none to hide it
//     chatContainer.classList.add("chat-collapsed");
//     toggleIcon.textContent = "+"; // Set the toggle icon to indicate expanding
//   }
// }

// closeChatButton.addEventListener("click", toggleChatbox);

clearChatHistoryBtn.addEventListener('click', () => {
  chatbox.textContent = ''
})

// Add an event listener to the send button
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

document.addEventListener("DOMContentLoaded", function () {
  var languageOptions = document.querySelectorAll(".language-option");
  var activeBackgroundColor = "#00cdff"; // Define the active background color

  // Function to reset all backgrounds and set the active one
  function resetAndSetActive(option) {
    languageOptions.forEach(function (opt) {
      opt.style.background = "none"; // Reset to default background
    });
    option.style.background = activeBackgroundColor; // Set active background
  }

  // Set up click event handlers
  languageOptions.forEach(function (option) {
    option.addEventListener("click", function () {
      resetAndSetActive(option);
    });
  });
});

const voiceMappings = {
  "en-US": {
    Samantha: "en-GB-News-G",
    Richard: "en-GB-News-J",
    Emily: "en-GB-News-H",
    John: "en-GB-Neural2-B",
  },
  "nl-NL": {
    Samantha: "nl-NL-Wavenet-D",
    Richard: "nl-NL-Wavenet-C",
    Emily: "nl-NL-Wavenet-E",
    John: "nl-NL-Standard-B",
  },
  "fr-FR": {
    Samantha: "fr-FR-Neural2-A",
    Richard: "fr-FR-Neural2-B",
    Emily: "fr-FR-Neural2-C",
    John: "fr-FR-Neural2-D",
  },
  "es-ES": {
    Samantha: "es-ES-Neural2-C",
    Richard: "es-ES-Neural2-B",
    Emily: "es-ES-Neural2-A",
    John: "es-ES-Neural2-F",
  },
  "ja-JP": {
    Samantha: "ja-JP-Neural2-B",
    Richard: "ja-JP-Neural2-C",
    Emily: "ja-JP-Wavenet-A",
    John: "ja-JP-Neural2-D",
  },
  "de-DE": {
    Samantha: "de-DE-Neural2-A",
    Richard: "de-DE-Neural2-B",
    Emily: "de-DE-Neural2-C",
    John: "de-DE-Neural2-D",
  },
  "cmn-Hans-CN": {
    Samantha: "cmn-CN-Wavenet-D",
    Richard: "cmn-CN-Wavenet-C",
    Emily: "cmn-TW-Wavenet-A",
    John: "cmn-TW-Wavenet-B",
  },
  "yue-Hant-HK": {
    Samantha: "yue-HK-Standard-C",
    Richard: "yue-HK-Standard-D",
    Emily: "yue-HK-Standard-A",
    John: "yue-HK-Standard-B",
  },
  "ar-XA": {
    Samantha: "ar-XA-Wavenet-D",
    Richard: "ar-XA-Wavenet-B",
    Emily: "ar-XA-Wavenet-A",
    John: "ar-XA-Wavenet-C",
  },
};

let selectedLanguage = "en-US"; // Default language
let selectedVoice = "Samantha";

document.addEventListener("DOMContentLoaded", function () {
  const languageOptions = document.querySelectorAll(".language-option");
  const voiceOptions = document.querySelectorAll(".voice-option");

  languageOptions.forEach((option) => {
    option.addEventListener("click", () => {
      languageOptions.forEach((opt) => opt.classList.remove("selected"));
      option.classList.add("selected");
      selectedLanguage = option.getAttribute("data-lang-code");
      updateVoiceCode();
    });
  });

  voiceOptions.forEach((option) => {
    option.addEventListener("click", () => {
      voiceOptions.forEach((opt) => opt.classList.remove("selected"));
      option.classList.add("selected");
      selectedVoice = option.textContent.trim();
      updateVoiceCode();
    });
  });
});

// selected google voice and send to voice id (unreal side)
function updateVoiceCode() {
  if (selectedLanguage && selectedVoice) {
    const voiceCode = voiceMappings[selectedLanguage][selectedVoice];
    console.log(`Selected voice code: ${voiceCode}`);
    handleSendCommands({ voiceid: voiceCode });
  }
}

// Speech to text
document.addEventListener("DOMContentLoaded", function () {
  const chatbox = document.getElementById("chatbox");
  const callButton = document.getElementById("call-button");
  const stopCallButton = document.getElementById("stopcall-button");

  // Check for speech recognition support
  if (!("webkitSpeechRecognition" in window)) {
    alert(
      "Your browser does not support speech recognition. Please try this feature in Google Chrome."
    );
    return;
  }

  const recognition = new webkitSpeechRecognition();
  recognition.continuous = false; // Set to true for continuous listening
  recognition.lang = "en-EN"; // Set your desired language
  recognition.interimResults = false; // Whether to show interim results
  recognition.maxAlternatives = 1; // Maximum number of alternatives to provide

  // Toggle visibility of buttons
  function toggleButtons() {
    if (callButton.style.display === "none") {
      callButton.style.display = "block";
      stopCallButton.style.display = "none";
    } else {
      callButton.style.display = "none";
      stopCallButton.style.display = "block";
    }
  }

  // Add event listener to language options
  document.querySelectorAll(".language-option").forEach((option) => {
    option.addEventListener("click", function () {
      // Update the language code based on data attribute
      recognition.lang = this.getAttribute("data-lang-code");
      console.log(
        "Language for speech recognition set to: " + recognition.lang
      );

      // Update UI to reflect selection
      document
        .querySelectorAll(".language-option")
        .forEach((opt) => opt.classList.remove("selected"));
      this.classList.add("selected");
    });
  });

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

  // Handle recognized speech results
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

function removeAllPopUps() {
  let popupElems = document.getElementsByClassName('assitant-popup');
  for (let item of popupElems) {
    item.style.display = 'none';
  }
}

// This function will show the API pop-up
document.getElementById("apiButton").addEventListener("click", function () {
  removeAllPopUps()
  document.getElementById("apiPopup").style.display = "block";
});

// This function will hide the pop-up
document.getElementById("apiClose").addEventListener("click", function () {
  document.getElementById("apiPopup").style.display = "none";
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

// This function will show the Language pop-up

document
  .getElementById("languageButton")
  .addEventListener("click", function () {
    removeAllPopUps()
    document.getElementById("languagePopup").style.display = "block"; // Show the language popup
  });

document.getElementById("languageClose").addEventListener("click", function () {
  document.getElementById("languagePopup").style.display = "none"; // Hide the popup
});

const languageOptions = document.querySelectorAll(".language-option");
languageOptions.forEach((option) => {
  option.addEventListener("click", function () {
    languageOptions.forEach((opt) => opt.classList.remove("selected"));
    this.classList.add("selected");
    console.log("Language selected:", this.dataset.lang);

    // Use the lastPersonaInput global variable to send it along with the language change
    if (lastPersonaInput) {
      handleSendCommands({
        personas: `Change your language to this: ${this.dataset.lang} and use persona: ${lastPersonaInput}`,
      });
    } else {
      handleSendCommands({
        personas: `Change your language to this: ${this.dataset.lang}`,
      });
    }

    updateVoiceCode();
    document.getElementById("languagePopup").style.display = "none";
  });
});

document.getElementById("voiceButton").addEventListener("click", function () {
  removeAllPopUps()
  document.getElementById("voicePopup").style.display = "block";
});

document.getElementById("voiceClose").addEventListener("click", function () {
  document.getElementById("voicePopup").style.display = "none";
});

const voiceOptions = document.querySelectorAll(".voice-option");
voiceOptions.forEach((option) => {
  option.addEventListener("click", function () {
    // Remove 'selected' class from all options
    languageOptions.forEach((opt) => opt.classList.remove("selected"));
    // Add 'selected' class to clicked option
    this.classList.add("selected");
    // Optionally, perform further actions like changing the application language
    document.getElementById("voicePopup").style.display = "none"; // Hide the popup after selection
  });
});

function encryptData(avatarId, userId) {
  const data = `${avatarId}|${userId}`; // Use pipe as delimiter
  let result = '';
  for (let i = 0; i < data.length; i++) {
    const charCode = data.charCodeAt(i) ^ ENCRYPTION_KEY.charCodeAt(i % ENCRYPTION_KEY.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(result).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

document.addEventListener("DOMContentLoaded", function () {
  const shareButton = document.getElementById("shareButton"); // Correct ID
  const sharePopup = document.getElementById("sharePopup"); // Ensure this ID exists
  const shareClose = document.getElementById("shareClose"); // Ensure this ID exists

  // Open popup on share button click
  shareButton.addEventListener("click", function () {
    removeAllPopUps()
    sharePopup.style.display = "flex";
    const encrypted = encryptData(selectedUserAvatarId, globalUserInfoId);
    shareLinkInput.value = `${FRONTEND_URL}/sharedAvatar?data=${encrypted}`; 
  });

  // Close popup
  shareClose.addEventListener("click", function () {
    sharePopup.style.display = "none";
  });

  // Copy link logic
  shareConfirmButton.addEventListener("click", function () {
    shareLinkInput.select();
    document.execCommand("copy");
    alert("Link copied to clipboard!");
    sharePopup.style.display = "none"; // Optionally close popup after copying
  });
});

// Listener for the Signup button
document.getElementById("Signup").addEventListener("click", function () {
  var img = document.getElementById("signupImage");
  if (img.style.display === "none") {
    img.style.display = "block"; // Show the image
  } else {
    img.style.display = "none"; // Optionally hide if you want to toggle by button too
  }
});


// Listener for the image itself
document.getElementById("signupImage").addEventListener("click", function () {
  this.style.display = "none"; // Hide the image when it is clicked
});

async function getUserPromps(type) {
  let personaInput = document.getElementById("personaInput");
  let welcomeMessage = document.getElementById("welcomeMessage");
  if (!defaultAvatarPrompt) {
    if (globalUserInfoId && selectedUserAvatarId) {
      try {
        const response = await fetch(
          `/.netlify/functions/UserPrompts/getUserPrompts?user_id=${globalUserInfoId}&avatar_id=${selectedUserAvatarId}`
        );
        const { success, data } = await response.json();
        if (!success) {
          if (type == "prompt") {
            personaInput.value = "";
            console.log("Not Found User Prompt");
          } else {
            handleSendCommands({
              texttospeech: "Hi, I am a Rebelium assistant. How can I help you?",
            });
          }
        } else {
          if (type == "prompt") {
            personaInput.value = data.prompts;
            welcomeMessage.value = data.welcome_message;
          } else {
            const welcomeMessage = data.welcome_message;
            setTimeout(() => {
              console.log(welcomeMessage, 'Call Welcome Message')
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

document.addEventListener("DOMContentLoaded", function () {
  // Select the Persona button and popup elements
  const personaButton = document.getElementById("personaButton");
  const personaPopup = document.getElementById("personaPopup");
  const personaClose = document.getElementById("personaClose");
  const personaConfirmButton = document.getElementById("personaConfirmButton");
  const personaInput = document.getElementById("personaInput");
  const welcomeMessage = document.getElementById("welcomeMessage");

  // Open the persona popup when the Persona button is clicked
  personaButton.addEventListener("click", function () {
    removeAllPopUps()
    personaPopup.style.display = "block";
    getUserPromps("prompt");
  });

  // Close the persona popup when the close button is clicked
  personaClose.addEventListener("click", function () {
    personaPopup.style.display = "none";
  });

  // Handle the confirm button click
  personaConfirmButton.addEventListener("click", async function () {
    try {
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
      alert("Please enter a persona before confirming.");
    }
  });
});

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
