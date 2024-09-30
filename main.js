let globalUserInfoId = null;
let globalUserEmail = localStorage.getItem("user_email");
let userCreditAmount = 0;
let selectedSubscription = null;
let selectedUserPlanId = null;
let selectedUserAvatarId = "";
let createMode = false;

let newWebRTC;
let selectedCommand = null;
let latestLoadAvatarCommand = null;
let defaultAvatarPrompt = false;
let avatarResponse = null;

let videoLoaded = false;
let videoLoadedPromise = new Promise((resolve) => {
  window.resolveVideoLoaded = resolve;
});

let selectedHair = "";
let selectedBody = "";

let hasRandomized = false;

// Initialize the current asset index
let currentAssetIndex = 0;
let currentAnimationIndex = 0;
let isPlaying = true; // Assuming it starts as "playing"
let countCallFunctions = 0;

function setSelectedHair(assetName) {
  selectedHair = assetName;
  handleSendCommands({ assetname: assetName });
}

function setSelectedBody(assetName) {
  selectedBody = assetName;
  handleSendCommands({ assetname: assetName });
}

function checkDisplayStatus(element, status) {
  // If element is a string (i.e., an ID), get the actual element
  if (typeof element === "string") {
    element = document.getElementById(element);
  }

  // Check if the element exists
  if (!element) {
    console.error("Element not found");
    return false;
  }

  // Get the computed style of the element
  const style = window.getComputedStyle(element);

  // Return true if the display matches the status, false otherwise
  return style.display === status;
}

function filterItemsByGender(gender) {
  const imageCells = document.querySelectorAll(".image-cell");

  // Loop through all cells to apply the filter
  imageCells.forEach((cell) => {
    // Check the data-gender attribute of each cell
    if (cell.dataset.gender === gender || cell.dataset.gender === undefined) {
      // If the cell matches the selected gender or is unisex/neutral, display it
      cell.style.display = "";
    } else {
      // If the cell does not match, hide it
      cell.style.display = "none";
    }
  });
}

function handleRandomization() {
  if (videoLoaded) {
    // Existing code for collecting checkbox and slider values...
    const checkboxes = randomizeForm.querySelectorAll('input[type="checkbox"]');
    const checkboxValues = [];
    checkboxes.forEach((checkbox) => {
      checkboxValues.push(`${checkbox.name}*${checkbox.checked ? 1 : 0}`);
    });

    const slider = document.getElementById("mySlider");
    const sliderValue = parseFloat(slider.value);
    const ageRange = `Agemin*${sliderValue}, Agemax*${sliderValue}`;

    const result = [...checkboxValues, ageRange].join(", ");
    handleSendCommands({ randomize: result });
    handleSendCommands({ assetname: "Studio_makeUp" });

    // New code to randomize background
    const randomBackgroundIndex = Math.floor(
      Math.random() * backgroundAssets.length
    );
    const selectedBackground = backgroundAssets[randomBackgroundIndex];
    handleSendCommands({ assetname: selectedBackground });
    console.log("Randomized background command sent:", selectedBackground);
    hasRandomized = true;
  } else {
    console.log("Video is not loaded yet. Please wait for it to load.");
  }
}

function toggleAssetName() {
  // Increment the current index
  currentAssetIndex = (currentAssetIndex + 1) % assetNames.length;

  // Get the new asset name
  const newAssetName = assetNames[currentAssetIndex];

  // Call the function to send the command with the new asset name
  handleSendCommands({ assetname: newAssetName });
}

function toggleAnimationName(direction) {
  // Calculate the new index based on the direction
  currentAnimationIndex =
    (currentAnimationIndex + direction + animationNames.length) %
    animationNames.length;

  // Get the new animation name
  const newAnimationName = animationNames[currentAnimationIndex];

  // Call the function to send the command with the new animation name
  handleSendCommands({ assetname: newAnimationName });
}

function togglePlayback() {
  // Get references to the play and pause buttons
  const playButton = document.getElementById("playButton");
  const pauseButton = document.getElementById("pauseButton");

  // Toggle the display style of the buttons
  if (playButton.style.display === "none") {
    // If playButton is hidden, show it, and hide pauseButton
    playButton.style.display = "inline-block";
    pauseButton.style.display = "none";

    handleSendCommands({ player: "Play" });
    handleSendCommands({ assetname: "Catwalk_Female" });
  } else {
    // If playButton is visible, hide it, and show pauseButton
    playButton.style.display = "none";
    pauseButton.style.display = "inline-block";

    handleSendCommands({ player: "Pause" });
  }
}

function toggleImages() {
  var image1 = document.getElementById("image1");
  var image2 = document.getElementById("image2");

  if (image1.style.display === "block") {
    image1.style.display = "none";
    image2.style.display = "block";
  } else {
    image1.style.display = "block";
    image2.style.display = "none";
  }
}

function toggleAutoCamera() {
  var lockIcon = document.getElementById("lockIcon");

  // Check which icon is currently displayed
  if (lockIcon.classList.contains("fa-lock-open")) {
    // It's currently unlocked, so lock it
    lockIcon.classList.remove("fa-lock-open");
    lockIcon.classList.add("fa-lock");

    // Sending command to lock camera
    handleSendCommands({ autocamera: "No" });
  } else {
    // It's currently locked, so unlock it
    lockIcon.classList.remove("fa-lock");
    lockIcon.classList.add("fa-lock-open");

    // Sending command to unlock camera
    handleSendCommands({ autocamera: "Yes" });
  }
}

function toggleFullScreen() {
  var fullScreenIcon = document.getElementById("fullScreenIcon");

  // Check if the document is currently in fullscreen mode
  if (!document.fullscreenElement) {
    // Enter fullscreen mode
    document.documentElement.requestFullscreen().catch((err) => {
      console.log(
        `Error attempting to enable full-screen mode: ${err.message} (${err.name})`
      );
    });

    // Change the icon to minimize
    fullScreenIcon.classList.remove("fa-maximize");
    fullScreenIcon.classList.add("fa-minimize");
  } else {
    // Exit fullscreen mode
    document.exitFullscreen();

    // Change the icon back to maximize
    fullScreenIcon.classList.remove("fa-minimize");
    fullScreenIcon.classList.add("fa-maximize");
  }
}

function waitForVideoLoad() {
  return videoLoadedPromise;
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
    handleSendCommands({ autocamera: "Yes" });
  }
}
// Define an interval to periodically check for video loading
const checkInterval = setInterval(detectVideoLoadedAndExecuteFunctions, 1000);

window.isVideoLoaded = () => videoLoaded;

function handleSendCommands(command) {
  selectedCommand = Object.keys(command)[0];
  newWebRTC.emitUIInteraction(command);
  if (command.resetavatar) {
    latestLoadAvatarCommand = command.resetavatar;
  }
  console.log("Sending loadavatar command:", command.resetavatars);
}
// Async function to load and send avatar data
async function loadAndSendAvatarData(jsonFilePath) {
  await waitForVideoLoad(); // Wait for video to load

  // Use the fetch API to load the JSON file
  try {
    const response = await fetch(jsonFilePath);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const jsonData = await response.json(); // Parse the JSON response

    // Call your handleSendCommands function with the JSON data
    handleSendCommands({ resetavatar: JSON.stringify(jsonData) });
    // handleSendCommands({ cameraswitch: 'Head' });

    // Extracting the persona data from the JSON file
    const personaInfo = jsonData["Personas"];

    // Display persona data in popup input
    if (personaInfo) {
      const personaInput = document.getElementById("personaInput");
      personaInput.value = personaInfo; // Update the input field with the persona description
    }

    defaultAvatarPrompt = true;
  } catch (error) {
    console.error("Error loading JSON:", error);
  }
}

async function loadAndProcessJsonData(filePath) {
  try {
    const response = await fetch(filePath);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${filePath}`);
    }
    const jsonData = await response.json();
    // Here you can add more processing logic as needed
  } catch (error) {
    console.error("Error loading JSON data:", error);
  }
}

function handleCreateAvatarMode() {
  toggleDashboardAndArtistMode(true);
  updateDisplayState("design");
  createMode = true;
}

async function displayAvatarNames(avatars) {
  const avatarsContainer = document.getElementById("avatars-container");

  avatarsContainer.innerHTML = ""; // Clear the avatars container before adding new data

  // Reverse the order of avatars
  avatars.reverse();

  for (const avatar of avatars) {
    const avatarDiv = document.createElement("div");
    avatarDiv.className = "preset-avatar";

    const avatarImg = document.createElement("img");
    avatarImg.src = avatar.Avatar_Image
      ? `data:image/jpeg;base64,${avatar.Avatar_Image}`
      : "src/Default_Avatar_Icon.png";
    avatarImg.alt = `Avatar ${avatar.id}`;

    const avatarName = document.createElement("span");
    avatarName.className = "avatar-name";
    avatarName.textContent = avatar.Avatar_Name;
    avatarName.setAttribute("contenteditable", false);

    avatarDiv.appendChild(avatarImg);
    avatarDiv.appendChild(avatarName);

    // if (selectedSubscription == null) {
    //   const watermarkContainer = document.createElement("div");
    //   watermarkContainer.id = "watermarkContainer";

    //   // Create canvas elements for watermarks
    //   for (let i = 0; i < 5; i++) {
    //     const canvas = document.createElement("canvas");
    //     canvas.width = 100; // Set an appropriate width
    //     canvas.height = 50; // Set an appropriate height
    //     canvas.className = "avatar_watermark_item";
    //     canvas.style.userSelect = 'none'
    //     canvas.style.pointerEvents = 'none'

    //     const ctx = canvas.getContext("2d");
    //     ctx.font = "1.2rem Arial";
    //     ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';// #888 with 50% opacity
    //     ctx.textAlign = "center";
    //     ctx.textBaseline = "middle";
    //     ctx.fillText("Reblium", canvas.width / 2, canvas.height / 2);

    //     watermarkContainer.appendChild(canvas);
    //   }

    //   avatarDiv.appendChild(watermarkContainer);
    // }

    const avatarButtons = document.createElement("div");
    avatarButtons.className = "avatar-buttons";

    const editButton = document.createElement("button");
    editButton.id = "editButton";
    editButton.innerHTML = '<i class="fas fa-edit"></i> Edit';
    editButton.addEventListener("click", () => {
      toggleDashboardAndArtistMode(true); // Show artist_mode
      updateDisplayState("design");
      createMode = false;
      selectedUserAvatarId = avatar.id;
    });

    const deleteButton = document.createElement("button");
    deleteButton.innerHTML = '<i class="fas fa-trash"></i> Delete';
    deleteButton.addEventListener("click", () => {
      showDeleteModal(avatar.id);
    });

    avatarButtons.appendChild(editButton);
    avatarButtons.appendChild(deleteButton);
    avatarDiv.appendChild(avatarButtons);

    avatarsContainer.appendChild(avatarDiv);

    // Double-click event to enable editing
    avatarName.addEventListener("dblclick", () => {
      avatarName.setAttribute("contenteditable", true);
      avatarName.focus();
    });

    // Function to handle saving and disabling editing
    const saveAndDisableEditing = async () => {
      avatarName.setAttribute("contenteditable", false);
      const newName = avatarName.textContent.trim();
      if (newName !== avatar.Avatar_Name) {
        avatar.Avatar_Name = newName;
        await updateAvatarName(avatar.id, newName);
      }
    };

    // Blur event to save changes and disable editing
    avatarName.addEventListener("blur", saveAndDisableEditing);

    // Key down event to handle Enter and spacebar explicitly
    avatarName.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault(); // Prevent the default Enter key behavior (newline)
        saveAndDisableEditing();
      } else if (event.key === " ") {
        event.preventDefault();
      }
    });

    const shareButton = document.createElement("button");
    shareButton.innerHTML = '<i class="fas fa-share"></i> Share';
    shareButton.addEventListener("click", () => {
      // Get the Base64 image string from the selected avatar object
      const base64Image = avatar.Avatar_Image; // Replace with the property name containing the Base64 string

      // Convert the Base64 string to a Blob
      const byteCharacters = atob(base64Image);
      const byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      const blob = new Blob(byteArrays, { type: "image/jpeg" });

      // Create a URL for the Blob
      const blobUrl = URL.createObjectURL(blob);

      // Create a link element for downloading
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "persona_image.jpg"; // Set the desired download filename

      // Trigger a click event on the link to initiate the download
      link.click();

      // Clean up the URL object after download
      URL.revokeObjectURL(blobUrl);
    });

    // Create a teaching button with a custom class
    const renameButton = document.createElement("button");
    renameButton.innerHTML = '<i class="fas fa-edit"></i> Rename';
    // Assuming 'avatarName' is the element that displays the avatar's name
    renameButton.addEventListener("click", () => {
      if (avatarName.getAttribute("contenteditable") === "true") {
        avatarName.setAttribute("contenteditable", false);
        avatarName.blur(); // Manually trigger the blur if already editable
      } else {
        avatarName.setAttribute("contenteditable", true);
        avatarName.focus(); // Focus the element to start editing immediately
      }
    });

    // Create a play button with a custom class
    // const chatButton = document.createElement('button');
    // chatButton.innerHTML = '<i class="fas fa-play"></i> Chat';
    // renameButton.className = 'custom-button';

    // Append the new buttons to the avatarButtons container
    avatarButtons.appendChild(editButton);
    avatarButtons.appendChild(deleteButton);
    // avatarButtons.appendChild(shareButton);
    avatarButtons.appendChild(renameButton);
    // avatarButtons.appendChild(chatButton);

    avatarDiv.appendChild(avatarButtons);

    // Add the event listener for both click and double-click on an avatar
    avatarDiv.addEventListener("click", async () => {
      await waitForVideoLoad(); // Ensures the video or related content is fully loaded

      const selectedAvatarId = avatar.id;

      const selectedAvatar = avatars.find((av) => av.id === selectedAvatarId);
      if (selectedAvatar) {
        const avatarJsonData = selectedAvatar.Avatar;

        const previouslySelectedAvatar =
          document.querySelector(".avatar.selected");
        if (previouslySelectedAvatar) {
          previouslySelectedAvatar.classList.remove("selected");
        }

        // Extract and log the Personas information
        if (avatarJsonData && avatarJsonData.Personas) {
          // Display the Personas information in the input field
          document.getElementById("personaInput").value =
            avatarJsonData.Personas;
        } else {
          console.log(
            `No Personas information found for Avatar ID ${selectedAvatarId}.`
          );
        }

        avatarDiv.classList.add("selected");

        // Ensure these updates are not inside a conditional block that could be skipped
        selectedUserAvatarId = selectedAvatar.id;
        document.getElementById("avatarName").textContent =
          selectedAvatar.Avatar_Name;

        // Call the handleSendCommands function with the avatarJsonData
        handleSendCommands({ resetavatar: JSON.stringify(avatarJsonData) });
        // handleSendCommands({ cameraswitch: 'Head' });
      } else {
        console.log(`Selected avatar ID ${selectedAvatarId} not found.`);
      }
    });

    avatarsContainer.appendChild(avatarDiv);
  }
}

async function updateAvatarName(id, newName) {
  try {
    const response = await fetch("/.netlify/functions/updateAvatarName", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id, Avatar_Name: newName }),
    });

    const result = await response.json();
    if (response.ok) {
      console.log("Avatar name updated successfully:", result);
    } else {
      console.error("Error updating avatar name:", result.error);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

function showDeleteModal(selectedAvatarId) {
  // Load the HTML template for the pop-up
  const deleteConfirmationHtml = `
  <div id="deleteConfirmation" class="modal-delete">
    <div class="modal-content-delete">
      <h3>Are you sure you want to delete this avatar?</h3>
      <div class="modal-buttons-delete">
        <button id="cancelDeleteButton" class="cancel-delete">Cancel</button>
        <button id="confirmDeleteButton" class="delete-delete">Delete</button>
      </div>
    </div>
  </div>
`;
  // Append the HTML template to the document body
  document.body.insertAdjacentHTML("beforeend", deleteConfirmationHtml);

  // Get references to the pop-up and buttons
  const deleteConfirmation = document.getElementById("deleteConfirmation");
  const cancelButton = document.getElementById("cancelDeleteButton");
  const confirmButton = document.getElementById("confirmDeleteButton");

  // Show the pop-up
  deleteConfirmation.style.display = "block";

  // Add event listener to the "Cancel" button to hide the pop-up
  cancelButton.addEventListener("click", () => {
    deleteConfirmation.style.display = "none";
    deleteConfirmation.remove(); // Remove the pop-up from the DOM
  });

  // Add event listener to the "Confirm Delete" button to delete the avatar
  confirmButton.addEventListener("click", async () => {
    deleteConfirmation.style.display = "none";
    deleteConfirmation.remove(); // Remove the pop-up from the DOM
    await deleteAvatar(selectedAvatarId); // Call the function to delete the avatar
  });
}

async function updateAvatarSection(user_info_id) {
  try {
    const avatars = await fetchAvatarData(user_info_id);

    await displayAvatarNames(avatars);
    // displayAvatarImageData(avatars); // Call the new function
  } catch (error) {
    console.error("Error updating avatar section:", error);
  }
}

async function deleteAvatar(selectedAvatarId) {
  try {
    const response = await fetch(
      `/.netlify/functions/avatar/deleteAvatar/${selectedAvatarId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: globalUserInfoId }),
      }
    );

    if (!response.ok) {
      throw new Error("Failed to delete avatar.");
    }

    // Update the avatar section after successful deletion
    await updateAvatarSection(user_info_id);
  } catch (error) {
    console.error("Error deleting avatar:", error);
  }
}

async function addAvatarToDatabase(username) {
  try {
    const response = await fetch(`/.netlify/functions/avatar/addAvatar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        avatarName: username,
        user_info_id: globalUserInfoId,
      }),
    });

    // Check if the response status is OK (2xx) before trying to parse JSON
    if (!response.ok) {
      const errorMessage = await response.text(); // Get the error message from the response
      console.error("Error adding avatar name:", errorMessage);
      return false;
    }

    const data = await response.json();
    console.log(
      "Avatar name added successfully:",
      username,
      "with ID:",
      data.saveavatar
    );

    // Send the 'saveavatar' command with the newly obtained avatar ID
    handleSendCommands({ saveavatar: data.saveavatar });

    selectedUserAvatarId = data.saveavatar;

    return true; // Return true to indicate success
  } catch (error) {
    console.error("Network or server error:", error);
    return false;
  }
}

function showNotification(
  message,
  subMessage,
  type = "success",
  duration = 5000
) {
  const colorClasses = {
    success: "bg-green-100 border-green-500 text-green-700",
    error: "bg-red-100 border-red-500 text-red-700",
    warning: "bg-yellow-100 border-yellow-500 text-yellow-700",
    info: "bg-blue-100 border-blue-500 text-blue-700",
  };

  const iconPaths = {
    success: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
    error:
      "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z",
    warning:
      "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    info: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  };

  const colorClass = colorClasses[type] || colorClasses.success;
  const iconPath = iconPaths[type] || iconPaths.success;

  const notificationHtml = `
    <div id="notification" class="fixed top-7 right-4 rounded-lg shadow-lg p-4 flex items-start space-x-4 transition-all duration-300 ease-in-out opacity-0 translate-y-[-1rem] border-l-4 ${colorClass}" style="z-index: 1000;">
      <svg xmlns="http://www.w3.org/2000/svg" class="w-6 h-6 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="${iconPath}" />
      </svg>
      <div class="flex-grow">
        <p class="font-medium">${message}</p>
        <p class="text-sm opacity-75">${subMessage}</p>
      </div>
      <button onclick="closeNotification()" class="text-current opacity-75 hover:opacity-100">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  `;

  // Remove existing notification if any
  const existingNotification = document.getElementById("notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  // Add new notification
  document.body.insertAdjacentHTML("beforeend", notificationHtml);

  // Show notification with animation
  setTimeout(() => {
    const notification = document.getElementById("notification");
    notification.classList.remove("opacity-0", "translate-y-[-1rem]");
    notification.classList.add("opacity-100", "translate-y-0");
  }, 10);

  // Auto-hide notification
  setTimeout(() => {
    closeNotification();
  }, duration);
}

function closeNotification() {
  const notification = document.getElementById("notification");
  if (notification) {
    notification.classList.remove("opacity-100", "translate-y-0");
    notification.classList.add("opacity-0", "translate-y-[-1rem]");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  const randomizeButton = document.getElementById("randomizeButton");
  const lazyImages = document.querySelectorAll(".lazyload");
  const chatbotLogo = document.getElementById("chatbotLogo");
  const uploadButton = document.getElementById("UploadButton");
  const dhsPopup = document.getElementById("dhsPopup");
  const dhsClose = document.getElementById("dhsClose");
  const dhsDropzone = document.getElementById("dhsDropzone");
  const dhsConfirmButton = document.getElementById("dhsConfirmButton");
  const uploadStatus = document.getElementById("uploadStatus");
  const confirmButton = document.getElementById("confirmButton");
  const usernameInput = document.getElementById("username");
  const popup = document.getElementById("popup");

  randomizeButton.addEventListener("click", function (event) {
    event.preventDefault();
    handleRandomization();
    randomizeSliders();
  });

  lazyImages.forEach((img) => {
    img.src = img.getAttribute("data-src");
    img.onload = () => {
      img.removeAttribute("data-src");
    };
  });

  // Prevent default behavior for drag events
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    chatbotLogo.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Add visual feedback when dragging over the image
  ["dragenter", "dragover"].forEach((eventName) => {
    chatbotLogo.addEventListener(eventName, () => {
      chatbotLogo.classList.add("drag-over");
    });
  });

  ["dragleave", "drop"].forEach((eventName) => {
    chatbotLogo.addEventListener(eventName, () => {
      chatbotLogo.classList.remove("drag-over");
    });
  });

  // Handle the drop event
  chatbotLogo.addEventListener("drop", handleDrop, false);

  function handleDrop(e) {
    preventDefaults(e);
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
      const file = files[0];

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = function (event) {
          // Update the src of img with the Data URL for immediate feedback
          chatbotLogo.src = event.target.result;

          // Call uploadLogo to handle the upload process, passing Base64 data
          if (typeof uploadLogo === "function") {
            uploadLogo(event.target.result)
              .then(() => {
                console.log("Image uploaded successfully.");
              })
              .catch((error) => {
                console.error("Failed to upload image:", error);
              });
          } else {
            console.error("uploadLogo function is not available.");
          }
        };
        reader.readAsDataURL(file); // Convert the file to Data URL which is Base64 encoded
      } else {
        alert("Please drop an image file.");
      }
    }
  }

  // Show pop-up on button click
  uploadButton.addEventListener("click", () => {
    removeAllPopUps();
    dhsPopup.style.display = "flex";
  });

  // Close pop-up
  dhsClose.addEventListener("click", () => {
    dhsPopup.style.display = "none";
  });

  // Prevent default drag behaviors
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dhsDropzone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Highlight drop area when dragging over it
  ["dragenter", "dragover"].forEach((eventName) => {
    dhsDropzone.addEventListener(
      eventName,
      () => dhsDropzone.classList.add("highlight"),
      false
    );
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dhsDropzone.addEventListener(
      eventName,
      () => dhsDropzone.classList.remove("highlight"),
      false
    );
  });

  // Handle file drop
  dhsDropzone.addEventListener("drop", handleDrop, false);

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;

    if (files.length > 0) {
      const file = files[0];

      if (file.name.endsWith(".DHS")) {
        const reader = new FileReader();
        reader.onload = function (event) {
          try {
            uploadedDhsJson = JSON.parse(event.target.result); // Parse JSON from file
            uploadStatus.style.display = "block"; // Show success message
            uploadStatus.textContent = "File uploaded successfully!";
          } catch (error) {
            alert(
              "Error parsing DHS file. Please make sure it is a valid JSON file."
            );
            console.error("Error parsing DHS file:", error);
          }
        };
        reader.readAsText(file);
      } else {
        alert("Please upload a .DHS file.");
      }
    }
  }

  // Handle upload confirmation
  dhsConfirmButton.addEventListener("click", () => {
    if (uploadedDhsJson) {
      handleSendCommands({
        resetavatar: JSON.stringify(uploadedDhsJson),
      });
      dhsPopup.style.display = "none";
    } else {
      alert("Please upload a .DHS file first.");
    }
  });

  // Function to handle Export Avatar
  async function exportAvatar() {
    try {
      console.log("Export Avatar completed");
    } catch (error) {
      console.error("Error exporting avatar:", error);
    }
  }

  // Function to handle Export Raw BaseMesh
  async function exportRawBaseMesh() {
    try {
      console.log("Export Raw BaseMesh completed");
    } catch (error) {
      console.error("Error exporting raw base mesh:", error);
    }
  }

  // Function to handle Export Avatar (only head Mesh)
  async function exportAvatarHead() {
    try {
      console.log("Export Avatar Head completed");
    } catch (error) {
      console.error("Error exporting avatar head:", error);
    }
  }

  document
    .getElementById("exportAvatarButton")
    .addEventListener("click", exportAvatar);
  document
    .getElementById("exportRawBaseMeshButton")
    .addEventListener("click", exportRawBaseMesh);
  document
    .getElementById("exportAvatarHeadButton")
    .addEventListener("click", exportAvatarHead);

  confirmButton.addEventListener("click", async function (event) {
    if (selectedHair || selectedBody) {
      showingCreditList();
    } else {
      event.preventDefault();
      const username = usernameInput.value;
      const isAdded = await addAvatarToDatabase(username);
      if (isAdded) {
        setTimeout(async () => {
          await updateAvatarSection(globalUserInfoId);
          console.log("Avatar name added to user account:", username);
        }, 5000);
      }
    }
    popup.style.display = "none";
  });

  async function uploadLogo(base64Data) {
    const user_info_id = window.localStorage.getItem("user_info_id");
    if (!user_info_id) {
      console.error("User info ID is not available. Cannot upload logo.");
      return;
    }

    try {
      const response = await fetch(
        `/.netlify/functions/uploadLogo?user_info_id=${user_info_id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: base64Data }), // Ensure this matches what the server expects
        }
      );

      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`);
      }

      const result = await response.json();
    } catch (error) {
      console.error("Error uploading logo:", error);
    }
  }

  window.uploadLogo = uploadLogo;
});
