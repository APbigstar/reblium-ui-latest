// Function to fetch group data and create dropdown

// Function to fetch virtual items from the selected group


async function purchaseFreeItem(projectId, itemSku, userToken) {
  try {
    const response = await fetch(
      `https://store.xsolla.com/api/v2/project/${projectId}/free/item/${itemSku}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to claim free item");
    }

    const data = await response.json();
    console.log("Free item claimed successfully:", data);
    alert("Free item added to your inventory!");
  } catch (error) {
    console.error("Error during claiming free item:", error);
    alert("Failed to claim free item: " + error.message);
  }
}

// Function to handle the purchase
async function purchaseItemWithCredits(
  projectId,
  itemSku,
  virtualCurrencySku,
  userToken
) {
  const query = new URLSearchParams({
    platform: "xsolla", // Ensure this is correctly set as per the item's requirements
  }).toString();

  try {
    const response = await fetch(
      `https://store.xsolla.com/api/v2/project/${projectId}/payment/item/${itemSku}/virtual/${virtualCurrencySku}?${query}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${userToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to complete purchase");
    }

    const data = await response.json();
  } catch (error) {
    console.error("Error during purchase:", error);
    alert("Purchase failed: " + error.message);
  }
}

// Retrieve user token from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const userToken = urlParams.get("token");

// Static values for project_id and virtual_currency_sku
const projectId = "218213";
const virtualCurrencySku = "Reb-credit-01";

// Function to fetch user inventory
async function fetchUserInventory(userToken) {
  const projectId = "218213";
  const platform = "xsolla"; // Adjust based on your requirements
  const limit = 50; // Default limit
  const offset = 0; // Start from the beginning

  try {
    const url = `https://store.xsolla.com/api/v2/project/${projectId}/user/inventory/items`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${userToken}`, // Ensure the token is passed correctly
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    displayInventory(data); // Function to handle the display of inventory items on the UI
  } catch (error) {
    console.error("Error fetching user inventory:", error);
  }
}

function displayInventory(data) {
  const inventoryContainer = document.getElementById("inventory-container"); // Ensure you have this in your HTML
  inventoryContainer.innerHTML = ""; // Clear previous entries

  data.items.forEach((item) => {
    // Skip displaying Reblium export credit
    if (item.name === "Reblium export credit" || item.sku === "Reb-credit-01") {
      return; // Continue to the next iteration, skipping this item
    }

    // Create the card container
    const card = document.createElement("div");
    card.className =
      "w-full max-w-sm mx-auto rounded-md shadow-md overflow-hidden m-3";

    // Create image container
    const imageContainer = document.createElement("div");
    imageContainer.className = "h-60 w-full bg-cover bg-center";
    imageContainer.style.backgroundImage = `url('${item.image_url}')`;

    // Create info container
    const infoContainer = document.createElement("div");
    infoContainer.className = "px-5 py-3 bg-slate-900 text-white"; // Adjusted for dark theme with white text

    // Item title
    const title = document.createElement("h3");
    title.className = "text-lg font-bold uppercase";
    title.textContent = item.name;

    // Append title to info container
    infoContainer.appendChild(title);

    // Optional: Show quantity if relevant
    if (item.quantity > 0) {
      const quantityText = document.createElement("span");
      quantityText.className = "block text-sm mt-1";
      quantityText.textContent = `Quantity: ${item.quantity}`;
      infoContainer.appendChild(quantityText);
    }

    // Append image and info containers to the card
    card.appendChild(imageContainer);
    card.appendChild(infoContainer);

    // Append the card to the inventory container
    inventoryContainer.appendChild(card);
  });

  // Check if inventory is empty and display a message if so
  if (data.items.length === 0) {
    const emptyMessage = document.createElement("p");
    emptyMessage.textContent = "Your inventory is empty.";
    emptyMessage.className = "text-center text-gray-500";
    inventoryContainer.appendChild(emptyMessage);
  }
}
