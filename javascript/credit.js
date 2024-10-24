let chargedCreditAmount = 0;
let selectedCreditAmount = 0;

const stripe = Stripe(PUBLIC_STRIPE_PUBLIC_API_KEY);
// const stripe = Stripe(
//   "pk_live_51Lk3NyF22hdHq8pHctUFM6zqjf1bm9cDvVcFok3Fc2YI0W2wT6gwLgg7f65CAlCFqut9fBUTe3x1Et7j4MoRpLsv00lOOKEc5Z"
// );
const elements = stripe.elements();
const cardElement = elements.create("card");

document.addEventListener("DOMContentLoaded", async function () {
  cardElement.mount("#card-element");
});

async function handleDeposit() {
  const depositButton = document.getElementById("deposit-button");
  const cardErrors = document.getElementById("card-errors");
  cardElement.on("change", function (event) {
    if (event.error) {
      cardErrors.textContent = event.error.message;
    } else {
      cardErrors.textContent = "";
    }
  });
  const token =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImRlbW9AcmVibGl1bS5jb20iLCJleHAiOjE3MjQ0Mzc2NzgsImdyb3VwcyI6W3siaWQiOjQxNTEyLCJuYW1lIjoiZGVmYXVsdCIsImlzX2RlZmF1bHQiOnRydWV9XSwiaGFzX2F0dHJzIjp0cnVlLCJpYXQiOjE3MjQzNTEyNzgsImlzX21hc3RlciI6dHJ1ZSwiaXNzIjoiaHR0cHM6Ly9sb2dpbi54c29sbGEuY29tIiwicHJvbW9fZW1haWxfYWdyZWVtZW50IjpmYWxzZSwicHVibGlzaGVyX2lkIjo0MDU0MzUsInN1YiI6ImQ2NWUzODBmLThlMTYtNDNjMS1iOTEwLWE0ODVjMTZkM2EyNyIsInR5cGUiOiJ4c29sbGFfbG9naW4iLCJ1c2VybmFtZSI6IkRlbW8gUmVibGl1bSIsInhzb2xsYV9sb2dpbl9hY2Nlc3Nfa2V5IjoiNUN6ZU11MTNmZWY2cXVpR2FDX1pIRzJlcnBFVUhoLUlhTmFIdDl2Y3E0WSIsInhzb2xsYV9sb2dpbl9wcm9qZWN0X2lkIjoiNGEwNGQwMzctYTFmYi00YmVkLWIyNmItOGZiZDg2Yzk0ODI4In0.7IOvVh6ifTrvNZ9om-21UJVG89ZugJ4F8Qi3_-IPzUQ&remember_me=false";

  const amount = selectedCreditAmount;
  if (isNaN(amount) || amount <= 0) {
    cardErrors.textContent = "Please choose a credit amount.";
    return;
  }

  depositButton.disabled = true;
  depositButton.textContent = "Processing...";

  try {
    // Create PaymentIntent on your server
    const response = await fetch(
      "/.netlify/functions/credit/createCreditPaymentIntent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amount,
          userId: globalUserInfoId,
          userEmail: globalUserEmail,
        }), // Convert to cents
      }
    );
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || "Failed to create payment intent");
    }

    const paymentIntent = result.data;

    // Confirm the card payment
    const confirmResult = await stripe.confirmCardPayment(
      paymentIntent.client_secret,
      {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: "", // You can add a name input if needed
          },
        },
      }
    );

    if (confirmResult.error) {
      throw confirmResult.error;
    }

    if (confirmResult.paymentIntent.status === "succeeded") {
      // Payment successful, confirm on your server
      const confirmResponse = await fetch(
        "/.netlify/functions/credit/confirmCreditPaymentIntent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payment_intent_id: confirmResult.paymentIntent.id,
            amount: amount,
            userId: globalUserInfoId,
          }),
        }
      );

      const confirmResultStatus = await confirmResponse.json();

      if (confirmResultStatus.success !== true) {
        throw new Error(
          confirmResultStatus.error || "Failed to verify payment"
        );
      }

      // Reset form and show success message
      cardErrors.textContent = "Payment successful!";
      cardErrors.className = "mt-2 text-green-600 text-sm";

      cancelBuyCredits();
      showSaveAvatarExit();
      await getUserCredits();
      showNotification("Added credits successfully!", "", "success");
    } else if (confirmResult.paymentIntent.status === "requires_action") {
      // Handle 3D Secure authentication if needed
      window.location.href =
        confirmResult.paymentIntent.next_action.redirect_to_url.url;
    }
  } catch (error) {
    cardErrors.textContent = error.message;
  } finally {
    depositButton.disabled = false;
    depositButton.textContent = "Deposit";
  }
}

function setSelectedCreditAmount(amount) {
  selectedCreditAmount = amount;

  document
    .querySelectorAll("#buyCreditsConfirmation button")
    .forEach((button) => {
      button.classList.remove("selected-credit");
    });

  const cardErrors = document.getElementById("card-errors");
  cardErrors.textContent = "";

  // Add 'selected-credit' class to the clicked button
  event.target.classList.add("selected-credit");

  const creditData = { 12: 100, 30: 250, 60: 500, 96: 800 };

  const creditPriceEle = document.querySelector(
    "div.credit_amount_view_section h2.total-price"
  );
  const creditAmountEle = document.querySelector(
    "div.credit_amount_view_section span.credit-amount"
  );
  const subCreditAmountEle = document.querySelector(
    "div.credit_amount_view_section span.sub-credit-amount"
  );
  const totalCreditAmountEle = document.querySelector(
    "div.credit_amount_view_section span.total-credit-amount"
  );

  creditPriceEle.textContent = "€" + amount;
  creditAmountEle.textContent = creditData[amount] + " credits";
  subCreditAmountEle.textContent = creditData[amount] + " credits";
  totalCreditAmountEle.textContent = creditData[amount] + " credits";
}

function showingCreditList() {
  const avatarSaveModal = document.getElementById("saveAvatarConfirmation");
  avatarSaveModal.style.display = "block";

  const hairCreditElement = document.getElementsByClassName(
    "hair_credit_element"
  )[0];
  if (selectedHair) {
    hairCreditElement.style.display = "list-item";
  }
  const bodyCreditElement = document.getElementsByClassName(
    "body_credit_element"
  )[0];
  if (selectedBody) {
    bodyCreditElement.style.display = "list-item";
  }
}

function showSaveAvatarExit() {
  if (createMode) {
    if (!selectedUserAvatarId) {
      console.log("Avatar ID is empty. Opening the pop-up.");
      popup.style.display = "block"; // Show the pop-up only if avatarId is empty
    }
  } else {
    chargedCreditAmount = 0;
    if (selectedHair || selectedBody) {
      showingCreditList();
    } else {
      console.log("asdsfadf");
      handleSendCommands({
        saveavatar: parseFloat(selectedUserAvatarId),
      });
    }
  }
}

function cancelSaveAvatarExit() {
  const avatarSaveModal = document.getElementById("saveAvatarConfirmation");
  avatarSaveModal.style.display = "none";
}

function cancelBuyCredits() {
  const creditBuyModal = document.getElementById("buyCreditsConfirmation");
  creditBuyModal.style.display = "none";
}

function showBuyCredits() {
  const creditBuyModal = document.getElementById("buyCreditsConfirmation");
  creditBuyModal.style.display = "block";
  showNotification(
    "You don't have enough credits",
    "Please try to buy credits",
    "error"
  );
  const firstCreditAmountButton = document.querySelector(
    `#buyCreditsConfirmation button.credit-button:nth-of-type(1)`
  );
  firstCreditAmountButton.click();
}

async function updateCreditAmount(type = "") {
  try {
    const response = await fetch(
      "/.netlify/functions/credit/updateUserCreditAmount",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: globalUserInfoId,
          amount: type == "premium" ? 100 : -chargedCreditAmount,
          premium: type,
        }),
      }
    );

    const res = await response.json();

    if (res.success) {
      chargedCreditAmount = 0;
      selectedHair = "";
      selectedBody = "";
      await getUserCredits();
      handleSendCommands({
        saveavatar: parseFloat(selectedUserAvatarId),
      });
    } else {
      console.error("Failed to update credit amount:", res.error);
    }
  } catch (error) {
    console.error("Error updating credit amount:", error);
  }
}

async function handleSaveCustomizedAvatar() {
  cancelSaveAvatarExit();

  await getUserCredits();

  if (selectedBody) chargedCreditAmount += 3;
  if (selectedHair) chargedCreditAmount += 2;
  if (Number(userCreditAmount) >= Number(chargedCreditAmount)) {
    await updateCreditAmount();
    if (createMode) {
      const usernameInput = document.getElementById("username");
      const popup = document.getElementById("popup");
      popup.style.display = 'none'
      const isAdded = await addAvatarToDatabase(usernameInput.value);
      if (isAdded) {
        selectedHair = '';
        selectedBody = ''
        setTimeout(async () => {
          await updateAvatarSection(globalUserInfoId);
        }, 5000);
      }
    }
  } else {
    showBuyCredits();
  }
}
