function validateEmail(email) {
    const re =
      /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  }

  // Add event listeners for tab navigation and email validation
  document.addEventListener("DOMContentLoaded", function () {
    const inputs = document.querySelectorAll("#signupFormElement input");
    const emailInput = document.getElementById("email");
    const emailError = document.getElementById("emailError");
    const messageElement = document.getElementById("signupMessage");

    // Check if user was redirected due to verification failure
    const verificationFailed = localStorage.getItem("verificationFailed");
    if (verificationFailed === "true") {
      messageElement.textContent =
        "Email verification failed. Please try signing up again.";
      messageElement.className = "mt-4 text-sm text-red-600";

      localStorage.removeItem("verificationFailed");
    }

    emailInput.addEventListener("blur", function () {
      if (!validateEmail(this.value)) {
        emailError.classList.remove("hidden");
      } else {
        emailError.classList.add("hidden");
      }
    });
  });

  document
    .getElementById("signupFormElement")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const signupForm = document.getElementById("signupForm");
      const verificationLinkSent = document.getElementById(
        "verificationLinkSent"
      );

      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;
      const confirmPassword =
        document.getElementById("confirmPassword").value;
      const messageElement = document.getElementById("signupMessage");

      if (!validateEmail(email)) {
        messageElement.textContent = "Please enter a valid email address.";
        messageElement.className = "mt-4 text-sm text-red-600";
        return;
      }

      if (password !== confirmPassword) {
        messageElement.textContent = "Passwords do not match.";
        messageElement.className = "mt-4 text-sm text-red-600";
        return;
      }

      try {
        const response = await fetch("/.netlify/functions/auth/signup", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (response.ok) {
          signupForm.classList.add("hidden");
          verificationLinkSent.classList.remove("hidden");
        } else {
          throw new Error(
            data.error || "An error occurred during sign up."
          );
        }
      } catch (error) {
        messageElement.textContent = error.message;
        messageElement.className = "mt-4 text-sm text-red-600";
      }
    });

  document
    .getElementById("requestCodeButton")
    .addEventListener("click", async function () {
      const email = document.getElementById("email").value;
      const name = document.getElementById("name").value;
      const verificationLinkSent = document.getElementById(
        "verificationLinkSent"
      );
      const verificationForm = document.getElementById("verificationForm");

      try {
        const response = await fetch(
          "/.netlify/functions/auth/request-code",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, name }),
          }
        );

        const data = await response.json();

        if (response.ok) {
          verificationLinkSent.classList.add("hidden");
          verificationForm.classList.remove("hidden");
        } else {
          throw new Error(
            data.error || "Failed to send verification code."
          );
        }
      } catch (error) {
        alert(error.message);
      }
    });

  document
    .getElementById("verificationFormElement")
    .addEventListener("submit", async function (e) {
      e.preventDefault();

      const code = document.getElementById("verificationCode").value;
      const messageElement = document.getElementById("verificationMessage");

      try {
        const response = await fetch("/.netlify/functions/auth/verify", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ code }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          messageElement.textContent = data.message;
          messageElement.className = "mt-4 text-sm text-green-600";

          // Redirect to login page after a short delay
          setTimeout(() => {
            window.location.href = "/";
          }, 2000);
        } else {
          throw new Error(data.error || "Verification failed");
        }
      } catch (error) {
        messageElement.textContent = error.message;
        messageElement.className = "mt-4 text-sm text-red-600";
      }
    });
