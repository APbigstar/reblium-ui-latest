async function fetchGroupsAndCreateDropdown() {
  const projectId = "218213";
  const query = new URLSearchParams({}).toString(); // Add any required query parameters

  const resp = await fetch(
    `https://store.xsolla.com/api/v2/project/${projectId}/items/groups?${query}`,
    { method: "GET" }
  );

  if (!resp.ok) {
    console.error("Failed to fetch group data");
    return;
  }

  const data = await resp.json(); // Assuming the response is in JSON format

  // Create dropdown element
  const dropdown = document.createElement("select");
  dropdown.className =
    "block w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50";

  // Populate dropdown with group options
  data.groups.forEach((group) => {
    const option = document.createElement("option");
    option.value = group.external_id; // Assuming 'external_id' is the identifier for a group
    option.textContent = group.name; // Assuming 'name' is the display name for a group
    dropdown.appendChild(option);
  });

  // Append dropdown to the DOM
  const container = document.getElementById("dropdown-container"); // Make sure this ID matches your container's ID
  container.appendChild(dropdown);

  // Event listener for when a group is selected in the dropdown
  dropdown.addEventListener("change", (event) => {
    const selectedGroup = event.target.value; // Get the selected group value
    fetchItemsByGroup(selectedGroup); // Call the function with the selected group
  });

  // Pre-select a group (for example, the first group in the list)
  if (data.groups.length > 0) {
    dropdown.selectedIndex = 0; // Set the selected index to 0 to select the first group
    const selectedGroup = data.groups[0].external_id; // Get the selected group value
    fetchItemsByGroup(selectedGroup); // Call the function with the selected group
  }
}

async function fetchItemsByGroup(selectedGroup) {
  const projectId = "218213";

  const query = new URLSearchParams({
    limit: "50",
    offset: "0",
    locale: "en",
  }).toString();

  const resp = await fetch(
    `https://store.xsolla.com/api/v2/project/${projectId}/items/virtual_items/group/${selectedGroup}?${query}`,
    {
      method: "GET",
      headers: {
        Authorization: "Bearer eop57k1boA7nnYPtewZ6KEXJyJADEwRT", // Replace with your Bearer token
      },
    }
  );

  if (resp.ok) {
    const data = await resp.json();
    const itemListContainer = document.getElementById("itemList");
    // Clear the itemListContainer before adding new items
    itemListContainer.innerHTML = "";

    if (data.items && data.items.length > 0) {
      data.items.forEach((item) => {
        // Create card container
        const card = document.createElement("div");
        card.className =
          "w-full max-w-sm mx-auto rounded-md shadow-md overflow-hidden m-3";

        // Create image container
        const imageContainer = document.createElement("div");
        imageContainer.className = "h-60 w-60 bg-cover bg-center";
        imageContainer.style.backgroundImage = `url('${item.image_url}')`;

        // Create info container
        const infoContainer = document.createElement("div");
        infoContainer.className = "px-5 py-3";
        infoContainer.style.backgroundColor = "#1e1e1e79";

        // Item title
        const title = document.createElement("h3");
        title.className = "text-slate-50 uppercase";
        title.textContent = item.name;

        // Price container with credit image, price text, and buy button
        const priceContainer = document.createElement("div");
        priceContainer.className = "flex items-center justify-between mt-2";

        // Credit image
        if (
          item.virtual_prices.length > 0 &&
          item.virtual_prices[0].image_url
        ) {
          const creditImage = document.createElement("img");
          creditImage.src = item.virtual_prices[0].image_url;
          creditImage.alt = "Credit";
          creditImage.className = "w-5 h-5";
          priceContainer.appendChild(creditImage);
        }

        // Price text
        const priceText = document.createElement("span");
        priceText.className = "text-slate-200";
        priceText.textContent =
          item.virtual_prices.length > 0
            ? item.virtual_prices[0].calculated_price.amount
            : "Free";
        priceContainer.appendChild(priceText);

        // Buy button
        const buyButton = document.createElement("button");
        buyButton.textContent = item.is_free ? "Claim" : "Buy";
        buyButton.className =
          "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline";
        buyButton.addEventListener("click", function (event) {
          event.stopPropagation(); // Prevent the card's click event
          // Decide the function based on whether the item is free or not
          if (item.is_free) {
            purchaseFreeItem(projectId, item.sku, userToken); // Assuming you have a separate function for free items
          } else {
            purchaseItemWithCredits(
              projectId,
              item.sku,
              virtualCurrencySku,
              userToken
            );
          }
        });
        priceContainer.appendChild(buyButton);

        // Append elements to info container and then to card
        infoContainer.appendChild(title);
        infoContainer.appendChild(priceContainer);
        card.appendChild(imageContainer);
        card.appendChild(infoContainer);
        itemListContainer.appendChild(card);
      });
    } else {
      itemListContainer.textContent = "No items available for this group.";
    }
  } else {
    console.error("Failed to fetch virtual items data");
  }
}

fetchGroupsAndCreateDropdown();

// Function to close the payment modal and clear the iframe source for security
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

// Function to fetch user data from the XSolla API using the user token
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
      globalUserInfoId === DEV_ACCOUNT_ID ? "Death" : `Premium`;
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
      globalUserInfoId === DEV_ACCOUNT_ID ? "Death" : `Free`;
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

  const urlParams = new URLSearchParams(window.location.search);
  const userToken = urlParams.get("token");
  let createNewClicked = false;

  createNew.addEventListener("click", function (event) {
    event.preventDefault();
    createNewClicked = true; // Set the flag when "create-new" is clicked
    handleRandomization();
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
