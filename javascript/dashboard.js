function closePaymentModal() {
  const modal = document.getElementById("paymentModal");
  modal.style.display = "none";
  document.getElementById("paymentFrame").src = ""; // Clears the iframe source to ensure privacy and security
}

// Function to handle the reset button click
function handleResetButtonClick() {
  if (latestLoadAvatarCommand) {
    // Send the latest loadavatar command
    handleSendCommands({ resetavatar: latestLoadAvatarCommand });
    console.log(
      "Reset button clicked with the latest loadavatar command:",
      latestLoadAvatarCommand
    );
  } else {
    console.log("No loadavatar command available to reset.");
  }
}

// Display the skeleton loading animation
function showSkeletonLoader() {
  const avatarsContainer = document.getElementById("avatars-container");

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
  const avatarsContainer = document.getElementById("avatars-container");

  avatarsContainer.innerHTML = ""; // Clear the container
  // Call your displayAvatarNames function here to populate the container with avatars
  // await displayAvatarNames(avatarsData); // Replace with your actual avatars data
}

// Simulate loading avatars (replace this with your actual data fetching logic)
function loadAvatars() {
  showSkeletonLoader();

  // Simulate an API call or data loading delay
  setTimeout(() => {
    // Replace the following with your actual data loading logic
    // const avatarsData = fetchAvatars(); // Example fetchAvatars function

    // Once avatarsData is available, hide the skeleton loader and display avatars
    hideSkeletonLoader();
  }, 2000); // Adjust the delay as needed
}

async function fetchUserData(userToken) {
  try {
    const response = await fetch("/.netlify/functions/auth/validate-token", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${userToken}`,
      },
    });

    if (response.ok) {
      const userData = await response.json();

      // Display the user's email in your HTML
      document.getElementById("userEmail").textContent = userData.email;

      if (userData.picture) {
        // Display the user image if it exists in the response
        document.getElementById("userImage").src = userData.picture;
      } else {
        document.getElementById("userImage").src =
          "https://static-00.iconduck.com/assets.00/avatar-default-symbolic-icon-479x512-n8sg74wg.png";
      }

      return userData;
    } else {
      window.location.href = "/";
      throw new Error("Invalid user token");
    }
  } catch (error) {
    throw error;
  }
}

function storeToken(token) {
  const tokenData = JSON.parse(atob(token.split(".")[1]));
  const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
  localStorage.setItem("token", token);
  localStorage.setItem("tokenExpiration", expirationTime);
}

function setUpTokenExpirationCheck() {
  setInterval(checkTokenExpiration, 60000);
}

function checkTokenExpiration() {
  const expirationTime = localStorage.getItem("tokenExpiration");
  if (expirationTime && Date.now() > parseInt(expirationTime)) {
    console.log("Token has expired");
    logout();
  }
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("tokenExpiration");
  localStorage.removeItem("user_info_id");
  localStorage.removeItem("user_email");
  redirectToLogin();
}

function redirectToLogin() {
  window.location.href = "/";
}

async function fetchPersonalizedAvatars(user_info_id) {
  try {
    const url = `/.netlify/functions/getPersonalizedAvatars?user_info_id=${user_info_id}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const personalizedAvatars = await response.json();

    // const container = document.getElementById("personalizedAvatarButton"); // Assuming this is the container for all avatars

    // // Ensure the container exists
    // if (!container) {
    //   console.error("Avatar display container not found.");
    //   return;
    // }

    // Clear previous content
    // container.innerHTML = "";

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

async function getUserCredits() {
  const checkUserCreditAmount = await fetch(
    `/.netlify/functions/credit/getUserCreditAmount?user_id=${globalUserInfoId}`
  );

  const creditData = await checkUserCreditAmount.json();

  if (creditData.amount) {
    userCreditAmount = creditData.amount;
    document.getElementById("exportCredits").textContent =
      globalUserInfoId === DEV_ACCOUNT_ID ? "Unlimited" : userCreditAmount;
    document.getElementById("detail_page_credit_amount").textContent =
      globalUserInfoId === DEV_ACCOUNT_ID ? "Unlimited" : userCreditAmount;
    if (creditData.createdAt) {
      let createdDate = new Date(creditData.createdAt);
      createdDate.setMonth(createdDate.getMonth() + 1);
      let oneMonthLater = createdDate.toISOString().slice(0, 10);
      document.getElementById("plan_created_date_p").innerHTML =
        globalUserInfoId === DEV_ACCOUNT_ID
          ? ""
          : `You're next billing cycle starts on ` +
            `<span style="font-size: 1.2rem; color: rgb(34 211 238);">` +
            oneMonthLater +
            `</span>`;
    } else {
      document.getElementById("plan_created_date_p").textContent = "No Plan";
    }
  } else {
    userCreditAmount = 0;
    document.getElementById("exportCredits").textContent =
      globalUserInfoId === DEV_ACCOUNT_ID ? "Unlimited" : userCreditAmount;
    document.getElementById("detail_page_credit_amount").textContent =
      globalUserInfoId === DEV_ACCOUNT_ID ? "Unlimited" : userCreditAmount;
    document.getElementById("plan_created_date_p").textContent =
      globalUserInfoId === DEV_ACCOUNT_ID ? "" : "No Plan";
  }
}

async function getSelectedSubscription() {
  const checkCurrentUserSubscription = await fetch(
    `/.netlify/functions/premium/getSelectedSubscription?user_id=${globalUserInfoId}`
  );
  const subscriptionData = await checkCurrentUserSubscription.json();
  if (subscriptionData.plan) {
    selectedSubscription = subscriptionData.plan;
    selectedUserPlanId = subscriptionData.userPlanId;
  } else {
    selectedSubscription = null;
    selectedUserPlanId = null;
  }
}

async function setCurrentPremium() {
  const premiumButton = document.getElementById(
    "premium-subscription-start-button"
  );
  const freePlanButton = document.getElementById("free-plan-button");
  const currentSelectedPlanShow = document.getElementById(
    "premium-plan-selected"
  );
  const tilerElement = document.getElementById("tier");
  const premiumPlanType = document.getElementById("detail_premium_plan_type");

  const planChangeBtn = document.getElementById("plan_change_btn");
  const planCancelBtn = document.getElementById("plan_cancel_btn");

  // Remove any existing event listeners
  premiumButton.removeEventListener("click", cancelPremiumPriceSection);
  premiumButton.removeEventListener("click", () =>
    showPremiumPriceSection("premium")
  );

  if (
    selectedSubscription == MONTHLY_PREMIUM_SUBSCRIPTION_ID ||
    selectedSubscription == YEARLY_PREMIUM_SUBSCRIPTION_ID
  ) {
    premiumButton.addEventListener("click", cancelPremiumPriceSection);
    currentSelectedPlanShow.style.display = "block";

    premiumButton.style.display =
      globalUserInfoId === DEV_ACCOUNT_ID ? "none" : "inline-block";
    currentSelectedPlanShow.style.display =
      globalUserInfoId === DEV_ACCOUNT_ID ? "none" : "block";
    planChangeBtn.style.display =
      globalUserInfoId === DEV_ACCOUNT_ID ? "none" : "inline-block";
    planCancelBtn.style.display =
      globalUserInfoId === DEV_ACCOUNT_ID ? "none" : "inline-block";

    premiumButton.textContent = "Cancel";
    freePlanButton.style.display = "none";
    tilerElement.textContent =
      globalUserInfoId === DEV_ACCOUNT_ID ? "Dev" : `Premium`;
    premiumPlanType.textContent =
      globalUserInfoId === DEV_ACCOUNT_ID ? "Dev Plan" : "Premium Plan";
  } else {
    premiumButton.addEventListener("click", () =>
      showPremiumPriceSection("premium")
    );
    currentSelectedPlanShow.style.display = "none";
    premiumButton.textContent =
      globalUserInfoId === DEV_ACCOUNT_ID ? "none" : "Start now";
    freePlanButton.style.display =
      globalUserInfoId === DEV_ACCOUNT_ID ? "none" : "block";
    tilerElement.textContent =
      globalUserInfoId === DEV_ACCOUNT_ID ? "Dev" : `Free`;
    premiumPlanType.textContent =
      globalUserInfoId === DEV_ACCOUNT_ID ? "Dev Plan" : "Free Plan";
    document.getElementById("plan_created_date_p").textContent =
      globalUserInfoId === DEV_ACCOUNT_ID ? "" : "No Plan";
    planChangeBtn.style.display =
      globalUserInfoId === DEV_ACCOUNT_ID ? "none" : "inline-block";
    planCancelBtn.style.display =
      globalUserInfoId === DEV_ACCOUNT_ID ? "none" : "inline-block";
  }
}

async function fetchAvatarData(user_info_id) {
  try {
    const response = await fetch(
      `/.netlify/functions/avatar/getUserAvatars?user_info_id=${user_info_id}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching avatar data:", error);
    return [];
  }
}

document.addEventListener("DOMContentLoaded", async function () {
  // Call loadAvatars function to start loading avatars
  loadAvatars();

  const createNew = document.getElementById("create-new");
  const dashboard = document.getElementById("dashboard");
  const chatbot = document.getElementById("chatbot");
  const artistMode = document.getElementById("artist_mode");
  const shareButton = document.getElementById("shareButton"); // Correct ID
  const sharePopup = document.getElementById("sharePopup"); // Ensure this ID exists
  const shareClose = document.getElementById("shareClose"); // Ensure this ID exists

  const urlParams = new URLSearchParams(window.location.search);
  const userToken = urlParams.get("token");
  let createNewClicked = false;

  createNew.addEventListener("click", function (event) {
    event.preventDefault();
    createNewClicked = true; // Set the flag when "create-new" is clicked
    handleRandomization();
  });

  shareButton.addEventListener("click", function () {
    removeAllPopUps();
    sharePopup.style.display = "flex";
    const encrypted = encryptData(selectedUserAvatarId, globalUserInfoId);
    shareLinkInput.value = `${FRONTEND_URL}/sharedAvatar?data=${encrypted}`;
  });

  shareClose.addEventListener("click", function () {
    sharePopup.style.display = "none";
  });

  shareConfirmButton.addEventListener("click", function () {
    shareLinkInput.select();
    document.execCommand("copy");
    alert("Link copied to clipboard!");
    sharePopup.style.display = "none"; // Optionally close popup after copying
  });

  waitForVideoLoad().then(() => {
    if (createNewClicked) {
      // Check if "create-new" was clicked before video load
      handleRandomization();

      console.log("Ready to randomize.");
    }
  });

  // Function to initialize the page and fetch/display avatar data
  async function initPage() {
    try {
      if (localStorage.getItem("user_email") && !userToken) {
        console.error("User token not found in URL.");
        // Redirect to login page if no token is present
        window.location.href = "/";
        return;
      }

      if (userToken) storeToken(userToken);
      setUpTokenExpirationCheck();

      const userData = await fetchUserData(userToken);

      if (userData) {
        user_info_id = userData.id;
        globalUserInfoId = userData.id;
        window.localStorage.setItem("user_info_id", user_info_id);
      }

      await fetchPersonalizedAvatars(user_info_id);
      // await fetchTierName(user_info_id);
      await getUserCredits();
      await getSelectedSubscription();
      await setCurrentPremium();

      // Fetch and display the avatars for the user with matching user_info_id
      const avatars = await fetchAvatarData(user_info_id);
      await displayAvatarNames(avatars);
    } catch (error) {
      console.error("Error initializing page:", error);
    }
  }

  // Call the initPage function when the DOM is ready
  await initPage();

  // Function to show artist mode after dashboard
  function hiddenArtistMode() {
    dashboard.style.display = "block";
    artistMode.style.display = "none";
    chatbot.style.display = "none";

    // Set the design button as active since we start with artist mode
    document.getElementById("designButton").classList.add("active");
    document.getElementById("designButton").classList.remove("inactive");
    document.getElementById("conversationButton").classList.add("inactive");
    document.getElementById("conversationButton").classList.remove("active");
  }

  // Show artist mode automatically after the dashboard
  hiddenArtistMode();
  initAudioRefProps();
});
