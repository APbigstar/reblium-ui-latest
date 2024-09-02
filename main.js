let globalUserId = null; // Define at a global scope accessible to both functions
let globalUserInfoId = null;
let globalUserEmail = localStorage.getItem('user_email');
let userCreditAmount = 0;
let selectedSubscription = null;
let selectedUserPlanId = null;

async function getUserCredits() {
  const checkUserCreditAmount = await fetch(
    `/.netlify/functions/getUserCreditAmount?user_id=${globalUserInfoId}`
  );

  const creditData = await checkUserCreditAmount.json();
  console.log(creditData);
  if (creditData.amount) {
    userCreditAmount = creditData.amount;
    document.getElementById("exportCredits").textContent = userCreditAmount;
  } else {
    userCreditAmount = 0;
    document.getElementById("exportCredits").textContent = userCreditAmount;
  }
}

async function getSelectedSubscription() {
  const checkCurrentUserSubscription = await fetch(
    `/.netlify/functions/getSelectedSubscription?user_id=${globalUserInfoId}`
  );
  const subscriptionData = await checkCurrentUserSubscription.json();
  console.log("subscriptionData", subscriptionData);
  if (subscriptionData.plan) {
    selectedSubscription = subscriptionData.plan;
    selectedUserPlanId = subscriptionData.userPlanId;
  } else {
    selectedSubscription = null;
    selectedUserPlanId = null;
  }
}

async function setCurrentPremium() {
  console.log("Setting current premium");
  const premiumButton = document.getElementById(
    "premium-subscription-start-button"
  );
  const currentSelectedPlanShow = document.getElementById(
    "premium-plan-selected"
  );

  // Remove any existing event listeners
  premiumButton.removeEventListener("click", cancelPremiumPriceSection);
  premiumButton.removeEventListener("click", () =>
    showPremiumPriceSection("premium")
  );

  if (selectedSubscription == 1 || selectedSubscription == 2) {
    premiumButton.addEventListener("click", cancelPremiumPriceSection);
    currentSelectedPlanShow.style.display = "block";
    premiumButton.textContent = "Cancel";
    try {
      const response = await fetch(
        "/.netlify/functions/updateUserCreditAmount",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: globalUserInfoId,
            amount: 100,
            premium: "premium",
          }),
        }
      );

      const res = await response.json();

      if (res.success) {
        chargedCreditAmount = 0;
        selectedHair = "";
        selectedBody = "";
        await getUserCredits();
      } else {
        console.error("Failed to update credit amount:", res.error);
      }
    } catch (error) {
      console.error("Error updating credit amount:", error);
    }
  } else {
    premiumButton.addEventListener("click", () =>
      showPremiumPriceSection("premium")
    );
    currentSelectedPlanShow.style.display = "none";
    premiumButton.textContent = "Start now";
  }
}

async function cancelPremiumPriceSection() {
  console.log("Click Cancel Subscription Button.");
  try {
    const response = await fetch("/.netlify/functions/cancelSubscription", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        user_plan_id: selectedUserPlanId,
        userId: globalUserInfoId
      }),
    });

    const res = await response.json();

    if (res.success) {
      await getSelectedSubscription();
      await setCurrentPremium();
    } else {
      console.error("Failed to cancel subscription:", res.error);
    }
  } catch (error) {
    console.error("Error canceling subscription", error);
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  const confirmButton = document.getElementById("confirmButton");
  const usernameInput = document.getElementById("username");
  const popup = document.getElementById("popup");
  const avatarsContainer = document.getElementById("avatars-container");
  let user_info_id;

  // Function to fetch user data from the XSolla API using the user token
  async function fetchUserData(userToken) {
    try {
      const response = await fetch("https://login.xsolla.com/api/users/me", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        // console.log(userData);

        // Display the user's email in your HTML
        document.getElementById("userEmail").textContent = userData.email;

        if (userData.picture) {
          // Display the user image if it exists in the response
          document.getElementById("userImage").src = userData.picture;
        } else {
          document.getElementById("userImage").src =
            "https://static-00.iconduck.com/assets.00/avatar-default-symbolic-icon-479x512-n8sg74wg.png";
        }

        // console.log('User ID from XSolla:', userData.id); // Display the user ID in the console log
        return userData;
      } else {
        throw new Error("Invalid user token");
      }
    } catch (error) {
      throw error;
    }
  }

  const urlParams = new URLSearchParams(window.location.search);
  const userToken = urlParams.get("token");

  // Function to fetch user's export credits
  async function fetchExportCredits(userToken) {
    const query = new URLSearchParams({ platform: "xsolla" }).toString();
    const projectId = "218213";

    try {
      const resp = await fetch(
        `https://store.xsolla.com/api/v2/project/${projectId}/user/virtual_currency_balance?${query}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${userToken}`,
          },
        }
      );

      if (resp.ok) {
        const data = await resp.json();
        if (data.items && data.items.length > 0) {
          const exportCredits = data.items[0].amount;
          // document.getElementById("exportCredits").textContent = exportCredits; // Display credits in the HTML element
        }
      } else {
        console.error("Failed to fetch export credits data");
      }
    } catch (error) {
      console.error("Error fetching export credits data:", error);
    }
  }

  window.fetchExportCredits = fetchExportCredits;

  // Function to consume credits and update the display
  async function consumeCredits(userToken, sku, quantity) {
    const query = new URLSearchParams({ platform: "xsolla" }).toString();
    const projectId = "218213";

    try {
      const resp = await fetch(
        `https://store.xsolla.com/api/v2/project/${projectId}/user/inventory/item/consume?${query}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${userToken}`,
          },
          body: JSON.stringify({
            sku: sku,
            quantity: quantity,
          }),
        }
      );

      if (resp.ok) {
        // Add a delay of 500 milliseconds (adjust as needed)
        // await new Promise(resolve => setTimeout(resolve, 100));

        // Update the display after consuming
        await fetchExportCredits(userToken);
      } else {
        console.error("Failed to consume credits");
      }
    } catch (error) {
      console.error("Error consuming credits:", error);
    }
  }

  // Function to handle Export Avatar
  async function exportAvatar() {
    try {
      await consumeCredits(userToken, "Reb-credit-01", 10); // Adjust SKU and quantity as needed
      console.log("Export Avatar completed");
    } catch (error) {
      console.error("Error exporting avatar:", error);
    }
  }

  // Function to handle Export Raw BaseMesh
  async function exportRawBaseMesh() {
    try {
      await consumeCredits(userToken, "Reb-credit-01", 20); // Adjust SKU and quantity as needed
      console.log("Export Raw BaseMesh completed");
    } catch (error) {
      console.error("Error exporting raw base mesh:", error);
    }
  }

  // Function to handle Export Avatar (only head Mesh)
  async function exportAvatarHead() {
    try {
      await consumeCredits(userToken, "Reb-credit-01", 5); // Adjust SKU and quantity as needed
      console.log("Export Avatar Head completed");
    } catch (error) {
      console.error("Error exporting avatar head:", error);
    }
  }

  async function generateAvatar() {
    try {
      await consumeCredits(userToken, "Reb-credit-01", 1); // Adjust SKU and quantity as needed
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
  document
    .getElementById("randomizeButton")
    .addEventListener("click", generateAvatar);

  // Call the function when the page loads
  window.addEventListener("load", async () => {
    try {
      await fetchExportCredits(userToken);
    } catch (error) {
      console.error("Error:", error);
    }
  });

  // Function to create a new user in the database
  async function createUser(userId) {
    try {
      const response = await fetch(`/.netlify/functions/addUser`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ user_id: userId }),
      });

      if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error("Error creating new user: " + errorMessage);
      }

      const data = await response.json();
      return data.user_info_id;
    } catch (error) {
      console.error("Error creating new user:", error);
      throw error;
    }
  }

  // // display all the images by avatar id
  // function displayAvatarImageData(avatars) {
  //   for (const avatar of avatars) {
  //     if (avatar.Avatar_Image) {
  //       console.log(`Avatar ID ${avatar.id} Image Data:`, avatar.Avatar_Image);
  //     } else {
  //       console.log(`Avatar ID ${avatar.id} has no image data.`);
  //     }
  //   }
  // }

  // Refactor Fetching and Displaying Avatars:
  async function updateAvatarSection(user_info_id) {
    try {
      const avatars = await fetchAvatarData(user_info_id);

      await displayAvatarNames(avatars);
      // displayAvatarImageData(avatars); // Call the new function
    } catch (error) {
      console.error("Error updating avatar section:", error);
    }
  }

  async function fetchBlendshapeData(user_info_id) {
    try {
      const response = await fetch(
        `/.netlify/functions/getBlendshape?user_info_id=${user_info_id}`
      );
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const blendshapeData = await response.json();
      console.log("Fetched blendshape data:", blendshapeData);
      handleSendCommands({ loadUserblendshapes: blendshapeData });

      return blendshapeData;
    } catch (error) {
      console.error("Error fetching blendshape data:", error);
      return null;
    }
  }

  // Function to fetch avatar data from the backend API for a specific user_info_id
  async function fetchAvatarData(user_info_id) {
    try {
      const response = await fetch(
        `/.netlify/functions/getUserAvatars?user_info_id=${user_info_id}`
      );
      const data = await response.json();
      console.log("Fetched avatar data:", data);
      return data;
    } catch (error) {
      console.error("Error fetching avatar data:", error);
      return [];
    }
  }

  async function fetchPersonalizedAvatars(user_info_id) {
    try {
      const url = `/.netlify/functions/getPersonalizedAvatars?user_info_id=${user_info_id}`;
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const personalizedAvatars = await response.json();
      console.log("Personalized Avatars:", personalizedAvatars);

      const container = document.getElementById("personalizedAvatarButton"); // Assuming this is the container for all avatars

      // Ensure the container exists
      if (!container) {
        console.error("Avatar display container not found.");
        return;
      }

      // Clear previous content
      container.innerHTML = "";

      // Iterate over each personalized avatar and create an img element
      personalizedAvatars.forEach((avatar) => {
        const img = document.createElement("img");
        img.src = `data:image/jpeg;base64,${avatar.Avatar_Image}`;
        img.alt = avatar.Avatar_Name || "Personalized Avatar";
        img.style.cursor = "pointer"; // Make it visually clear the images are clickable
        img.classList.add("avatar-image"); // Add a class for styling

        // Set onclick event to log only this avatar's data
        img.onclick = () => {
          console.log("Avatar clicked:", avatar.Avatar);
        };

        container.appendChild(img);
      });
    } catch (error) {
      console.error("Error fetching personalized avatars:", error);
    }
  }

  // Display the skeleton loading animation
  function showSkeletonLoader() {
    avatarsContainer.innerHTML = ""; // Clear the container

    for (let i = 0; i < 8; i++) {
      const skeletonAvatar = document.createElement("div");
      skeletonAvatar.className = "skeleton";

      const skeletonImage = document.createElement("div");
      skeletonImage.className = "skeleton-image";

      const skeletonText1 = document.createElement("div");
      skeletonText1.className = "skeleton-text";

      skeletonAvatar.appendChild(skeletonImage);
      skeletonAvatar.appendChild(skeletonText1);

      avatarsContainer.appendChild(skeletonAvatar);
    }
  }

  // Hide the skeleton loader and display the avatars
  async function hideSkeletonLoader() {
    avatarsContainer.innerHTML = ""; // Clear the container
    // Call your displayAvatarNames function here to populate the container with avatars
    await displayAvatarNames(avatarsData); // Replace with your actual avatars data
  }

  // Simulate loading avatars (replace this with your actual data fetching logic)
  function loadAvatars() {
    showSkeletonLoader();

    // Simulate an API call or data loading delay
    setTimeout(() => {
      // Replace the following with your actual data loading logic
      const avatarsData = fetchAvatars(); // Example fetchAvatars function

      // Once avatarsData is available, hide the skeleton loader and display avatars
      hideSkeletonLoader();
    }, 2000); // Adjust the delay as needed
  }

  // Call loadAvatars function to start loading avatars
  loadAvatars();

  // // Call the function when the site is loaded
  // document.addEventListener('DOMContentLoaded', function () {
  //   const sliderValues = getAllSliderValuesAndNames();
  // });

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

  async function displayAvatarNames(avatars) {
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
      console.log("clicked avatar")

        await waitForVideoLoad(); // Ensures the video or related content is fully loaded

        const selectedAvatarId = avatar.id;
        
        console.log(avatar.id)

        const selectedAvatar = avatars.find((av) => av.id === selectedAvatarId);
        console.log(selectedAvatar)
        if (selectedAvatar) {
          const avatarJsonData = selectedAvatar.Avatar;
          console.log(
            `JSON Data for Avatar ID ${selectedAvatarId}:`,
            avatarJsonData
          );

          handleSendCommands(avatarJsonData);

          const previouslySelectedAvatar =
            document.querySelector(".avatar.selected");
          if (previouslySelectedAvatar) {
            previouslySelectedAvatar.classList.remove("selected");
          }

          // Extract and log the Personas information
          if (avatarJsonData && avatarJsonData.Personas) {
            console.log(
              `Personas Information for Avatar ID ${selectedAvatarId}:`,
              avatarJsonData.Personas
            );

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
          document.getElementById("avatarId").textContent = selectedAvatar.id;
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

  async function deleteAvatar(selectedAvatarId) {
    try {
      const response = await fetch(
        `/.netlify/functions/deleteAvatar/${selectedAvatarId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete avatar.");
      }

      // Update the avatar section after successful deletion
      await updateAvatarSection(user_info_id);
      console.log("Avatar deleted successfully:", selectedAvatarId);
    } catch (error) {
      console.error("Error deleting avatar:", error);
    }
  }

  // Function to add a new avatar name to the database and send a command
  async function addAvatarToDatabase(username, user_info_id) {
    try {
      const response = await fetch(`/.netlify/functions/addAvatar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ avatarName: username, user_info_id }),
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

      document.getElementById("avatarId").textContent = data.saveavatar;

      return true; // Return true to indicate success
    } catch (error) {
      console.error("Network or server error:", error);
      return false;
    }
  }

  // Add event listener to the confirm button
  confirmButton.addEventListener("click", async function (event) {
    event.preventDefault(); // Prevent form submission

    // Get the username from the input field
    const username = usernameInput.value;

    // Add the new avatar name to the database with the corresponding user_info_id
    const isAdded = await addAvatarToDatabase(username, user_info_id); // Pass user_info_id

    if (isAdded) {
      // Delay fetching and updating avatar section by 5 seconds
      setTimeout(async () => {
        await updateAvatarSection(user_info_id);
        console.log("Avatar name added to user account:", username);
      }, 5000);
    }

    // Close the pop-up
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
      console.log("Upload result:", result.message);
    } catch (error) {
      console.error("Error uploading logo:", error);
    }
  }

  window.uploadLogo = uploadLogo;

  function loadLogo() {
    // const user_info_id = window.localStorage.getItem("user_info_id"); // Assuming user_info_id is stored in localStorage
    const user_info_id = globalUserInfoId
    const chatbotLogo = document.getElementById("chatbotLogo");

    if (!user_info_id) {
      console.error("User info ID is not available.");
      return; // Exit if no user_info_id is found
    }

    fetch(`/.netlify/functions/getUserLogo?user_info_id=${user_info_id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch logo");
        }
        return response.text(); // Expecting a Base64 encoded string
      })
      .then((base64Data) => {
        chatbotLogo.src = base64Data; // Set the image src to the Base64 string
      })
      .catch((error) => {
        console.error("Error loading logo:", error);
      });
  }

  // This function gets the tier name based on the user id
  async function fetchTierName(user_info_id) {
    try {
      const response = await fetch(
        `/.netlify/functions/user-tier?user_info_id=${user_info_id}`
      );
      const data = await response.json();
      if (response.ok) {
        document.getElementById(
          "tier"
        ).textContent = `Reblium: ${data.tier_name}`;
      } else {
        console.error("Failed to fetch tier name:", data.error);
      }
    } catch (error) {
      console.error("Error fetching tier name:", error);
      document.getElementById("tier").textContent =
        "Error fetching tier information.";
    }
  }

  // // Call the function with user_info_id when needed
  document.getElementById("save-exit").addEventListener("click", () => {
    updateAvatarSection(user_info_id);
  });

  // Function to initialize the page and fetch/display avatar data
  async function initPage() {
    try {
      // Get the user token from the URL
      const urlParams = new URLSearchParams(window.location.search);
      const userToken = urlParams.get("token");

      if (!userToken) {
        console.error("User token not found in URL.");
        return;
      }

      // Fetch user data from the XSolla API using the user token
      const userData = await fetchUserData(userToken);

      const userId = userData.id;
      globalUserId = userData.id;
      console.log(userId);
      // Check if the user exists in the database and get the user_info_id
      const checkUserExistsResponse = await fetch(
        `/.netlify/functions/checkUserExists?user_id=${userId}`
      );
      const checkUserExistsData = await checkUserExistsResponse.json();

      if (!checkUserExistsData.exists) {
        // User does not exist, so add it to the database
        user_info_id = await createUser(userId);
        globalUserInfoId = user_info_id;
        // console.log('New user created with user_info_id:', user_info_id);
      } else {
        // User already exists, get the user_info_id
        user_info_id = checkUserExistsData.user_info_id;
        globalUserInfoId = user_info_id;
        // console.log('User already exists in the database:', user_info_id);
      }
      window.localStorage.setItem("user_info_id", user_info_id);

      const blendshapeData = await fetchBlendshapeData(user_info_id);
      if (blendshapeData) {
        handleSendCommands({ resetavatar: JSON.stringify(blendshapeData) });
      }

      await fetchPersonalizedAvatars(user_info_id);
      await fetchTierName(user_info_id);
      await getUserCredits();
      await getSelectedSubscription();
      await setCurrentPremium();

      loadLogo();

      // Fetch and display the avatars for the user with matching user_info_id
      const avatars = await fetchAvatarData(user_info_id);
      await displayAvatarNames(avatars);
    } catch (error) {
      console.error("Error initializing page:", error);
    }
  }

  // Call the initPage function when the DOM is ready
  await initPage();
});

function showNotification(message, subMessage, type = 'success', duration = 5000) {
  const colorClasses = {
    success: 'bg-green-100 border-green-500 text-green-700',
    error: 'bg-red-100 border-red-500 text-red-700',
    warning: 'bg-yellow-100 border-yellow-500 text-yellow-700',
    info: 'bg-blue-100 border-blue-500 text-blue-700'
  };

  const iconPaths = {
    success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
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
  const existingNotification = document.getElementById('notification');
  if (existingNotification) {
    existingNotification.remove();
  }

  // Add new notification
  document.body.insertAdjacentHTML('beforeend', notificationHtml);
  
  // Show notification with animation
  setTimeout(() => {
    const notification = document.getElementById('notification');
    notification.classList.remove('opacity-0', 'translate-y-[-1rem]');
    notification.classList.add('opacity-100', 'translate-y-0');
  }, 10);

  // Auto-hide notification
  setTimeout(() => {
    closeNotification();
  }, duration);
}

function closeNotification() {
  const notification = document.getElementById('notification');
  if (notification) {
    notification.classList.remove('opacity-100', 'translate-y-0');
    notification.classList.add('opacity-0', 'translate-y-[-1rem]');
    setTimeout(() => {
      notification.remove();
    }, 300);
  }
}