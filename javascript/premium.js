const premium_stripe = Stripe(PUBLIC_STRIPE_PUBLIC_API_KEY);
// const premium_stripe = Stripe(
//   "pk_live_51Lk3NyF22hdHq8pHctUFM6zqjf1bm9cDvVcFok3Fc2YI0W2wT6gwLgg7f65CAlCFqut9fBUTe3x1Et7j4MoRpLsv00lOOKEc5Z"
// );
const premium_element = premium_stripe.elements();
const premium_cardElement = premium_element.create("card");

let selectedPeriod = "monthly";
let selectedPlan = "premium";

const monthlyBtn = document.getElementById("monthlyBtn");
const annuallyBtn = document.getElementById("annuallyBtn");
const premiumPrice = document.getElementById("premiumPrice");
const proPrice = document.getElementById("proPrice");

monthlyBtn.addEventListener("click", () => setPrice("monthly"));
annuallyBtn.addEventListener("click", () => setPrice("annually"));

const planID = {
  premium: { monthly: 3, yearly: 4 },
};

document.addEventListener("DOMContentLoaded", async function () {
  premium_cardElement.mount("#premium-card-element");
});

async function handlePremiumPay() {
  const depositButton = document.getElementById("premium-start-button");
  const cardErrors = document.getElementById("premium-card-errors");
  premium_cardElement.on("change", function (event) {
    if (event.error) {
      cardErrors.textContent = event.error.message;
    } else {
      cardErrors.textContent = "";
    }
  });

  depositButton.disabled = true;
  depositButton.textContent = "Processing...";

  try {
    // Create PaymentIntent on your server
    const response = await fetch(
      "/.netlify/functions/premium/createSubscription",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan_id: planID[selectedPlan][selectedPeriod],
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
    const confirmResult = await premium_stripe.confirmCardPayment(
      paymentIntent.client_secret,
      {
        payment_method: {
          card: premium_cardElement,
          billing_details: {
            name: "", // You can add a name input if needed
          },
        },
      }
    );

    if (confirmResult.error) {
      throw confirmResult.error;
    }

    console.log(confirmResult);

    if (confirmResult.paymentIntent.status === "succeeded") {
      // Payment successful, confirm on your server
      const confirmResponse = await fetch(
        "/.netlify/functions/premium/confirmPlanPaymentIntent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            payment_intent_id: confirmResult.paymentIntent.id,
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

      cancelPremiumPay();
      setTimeout(async () => {
        await getSelectedSubscription();
        await setCurrentPremium();
        await updateCreditAmount("premium");
      }, 0);
    } else if (confirmResult.paymentIntent.status === "requires_action") {
      // Handle 3D Secure authentication if needed
      window.location.href =
        confirmResult.paymentIntent.next_action.redirect_to_url.url;
    }
  } catch (error) {
    cardErrors.textContent = error.message;
  } finally {
    depositButton.disabled = false;
    depositButton.textContent = "Start now";
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

  // Remove any existing event listeners
  premiumButton.removeEventListener("click", cancelPremiumPriceSection);
  premiumButton.removeEventListener("click", () =>
    showPremiumPriceSection("premium")
  );

  if (selectedSubscription == 3 || selectedSubscription == 4) {
    premiumButton.addEventListener("click", cancelPremiumPriceSection);
    currentSelectedPlanShow.style.display = "block";
    premiumButton.textContent = "Cancel";
    freePlanButton.style.display = "none";
    tilerElement.textContent = `Premium`;
    premiumPlanType.textContent = "Premium Plan";
  } else {
    premiumButton.addEventListener("click", () =>
      showPremiumPriceSection("premium")
    );
    currentSelectedPlanShow.style.display = "none";
    premiumButton.textContent = "Start now";
    freePlanButton.style.display = "block";
    tilerElement.textContent = `Free`;
    premiumPlanType.textContent = "Free Plan";
    document.getElementById("plan_created_date_p").textContent = "No Plan";
  }
}

async function cancelPremiumPriceSection() {
  try {
    const response = await fetch(
      "/.netlify/functions/premium/cancelSubscription",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_plan_id: selectedUserPlanId,
          userId: globalUserInfoId,
        }),
      }
    );

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

function setPrice(type) {
  if (type === "monthly") {
    selectedPeriod = "monthly";
    monthlyBtn.classList.replace("bg-gray-800", "bg-blue-starndard");
    annuallyBtn.classList.replace("bg-blue-starndard", "bg-gray-800");
    premiumPrice.textContent = "15";
    proPrice.textContent = "120";
  } else {
    selectedPeriod = "yearly";
    annuallyBtn.classList.replace("bg-gray-800", "bg-blue-starndard");
    monthlyBtn.classList.replace("bg-blue-starndard", "bg-gray-800");
    premiumPrice.textContent = "12";
    proPrice.textContent = "99";
  }
}

function showPremiumPriceSection(planType) {
  selectedPlan = planType;
  const premiumSelectionPart = document.getElementsByClassName(
    "premium-selection-part"
  )[0];
  premiumSelectionPart.style.display = "none";
  const premiumPayPart = document.getElementsByClassName("premium-pay-part")[0];
  premiumPayPart.style.display = "block";
}

function cancelPremiumPay() {
  selectedPlan = "free";
  const premiumSelectionPart = document.getElementsByClassName(
    "premium-selection-part"
  )[0];
  premiumSelectionPart.style.display = "block";
  const premiumPayPart = document.getElementsByClassName("premium-pay-part")[0];
  premiumPayPart.style.display = "none";
}
