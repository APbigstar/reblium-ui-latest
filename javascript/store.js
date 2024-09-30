const urlParams = new URLSearchParams(window.location.search);
const userToken = urlParams.get("token");

// Static values for project_id and virtual_currency_sku
const projectId = "218213";
const virtualCurrencySku = "Reb-credit-01";

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
