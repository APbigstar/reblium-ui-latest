function showLogin() {
  document.getElementById("login-section").classList.remove("hidden");
  document.getElementById("signup-section").classList.add("hidden");
  document.getElementById("forgot-password-section").classList.add("hidden");
}

function showSignup() {
  document.getElementById("login-section").classList.add("hidden");
  document.getElementById("signup-section").classList.remove("hidden");
  document.getElementById("forgot-password-section").classList.add("hidden");
}

function showForgotPassword() {
  document.getElementById("login-section").classList.add("hidden");
  document.getElementById("signup-section").classList.add("hidden");
  document.getElementById("forgot-password-section").classList.remove("hidden");
}


document.addEventListener("DOMContentLoaded", function () {
  const socialLoginButtons = document.getElementById("socialLoginButtons");

  socialLoginButtons.addEventListener("click", function (event) {
    if (event.target.closest(".quick-login-button")) {
      const button = event.target.closest(".quick-login-button");
      const provider = button.dataset.provider;
      button.disabled = true;
      window.location.href = `/.netlify/functions/auth/${provider}`;
    }
  });
});

// Add click event listeners to the social login buttons
document.querySelectorAll(".quick-login-button").forEach((button) => {
  button.addEventListener("click", async (event) => {
    const providerName = event.currentTarget.getAttribute("data-provider");
    await initiateSocialAuthentication(providerName);
  });
});

document
  .getElementById("login-button")
  .addEventListener("click", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const password = document.getElementById("id_password_1").value;
    const loginMessage = document.getElementById("login-message");

    try {
      const response = await fetch("/.netlify/functions/auth/signin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        loginMessage.textContent = "Login successful!";
        loginMessage.className = "mt-4 text-sm text-blue-starndard text-center";

        // Store the token in localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user_email", data.email);

        setTimeout(() => {
          window.location.href = `/dashboard.html?token=${data.token}`;
        }, 1000);
      } else {
        throw new Error(data.error || "Login failed");
      }
    } catch (error) {
      loginMessage.textContent = error.message;
      loginMessage.className = "mt-4 text-sm text-red-600 text-center";
    }
  });
