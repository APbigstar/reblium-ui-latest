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

// // Get dataprovider when pressing google button
// document.querySelectorAll(".quick-login-button").forEach((button) => {
//   button.addEventListener("click", async (event) => {
//     const providerName = event.currentTarget.getAttribute("data-provider");
//     await initiateSocialAuthentication(providerName);
//   });
// });

// // Function to initiate social authentication with a given providerName
// async function initiateSocialAuthentication(providerName) {
//   try {
//     const query = new URLSearchParams({
//       projectId: "4a04d037-a1fb-4bed-b26b-8fbd86c94828",
//       // login_url: 'https://beta.reblium.com/dashboard',
//       login_url: "https://test-reblium.netlify.app/dashboard",
//       // login_url: 'http://localhost:8888/dashboard',
//       with_logout: "0",
//     }).toString();

//     const resp = await fetch(
//       `https://login.xsolla.com/api/social/${providerName}/login_url?${query}`,
//       { method: "GET" }
//     );

//     if (resp.status === 200) {
//       const responseData = await resp.json(); // Read response as JSON
//       window.location.href = responseData.url; // Redirect the user to the authentication link
//     } else {
//       console.error("Error getting social authentication link");
//     }
//   } catch (error) {
//     console.error("An error occurred:", error);
//   }
// }

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

// Xsolla api for login
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
        loginMessage.className = "mt-4 text-sm text-green-600 text-center";

        // Store the token in localStorage
        localStorage.setItem("token", data.token);
        localStorage.setItem("user_email", data.email);

        // Redirect to dashboard or home page after successful login
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

// // Signup section
// document.addEventListener('DOMContentLoaded', function() {
//     document.getElementById('signup-button').addEventListener('click', async (event) => {
//         event.preventDefault(); // Prevent the default form submission

//         const emailInput = document.getElementById('signup-email'); // Assuming you have added an id="signup-email" to the email input
//         const passwordInput = document.getElementById('signup-password');
//         const confirmPasswordInput = document.getElementById('confirm-password');
//         const signupSuccessMessage = document.getElementById('signup-success-message');
//         const signupErrorMessage = document.getElementById('signup-error-message');

//         // Clear previous messages
//         signupSuccessMessage.classList.add('hidden');
//         signupErrorMessage.classList.add('hidden');

//         // Validate passwords match
//         if (passwordInput.value !== confirmPasswordInput.value) {
//             signupErrorMessage.textContent = 'Passwords do not match.';
//             signupErrorMessage.classList.remove('hidden');
//             return;
//         }

//         // Construct the request body with email, password, and username
//         const requestBody = {
//             email: emailInput.value,
//             password: passwordInput.value,
//             username: emailInput.value
//         };

//         // Define your API parameters
//         const query = new URLSearchParams({
//             projectId: '4a04d037-a1fb-4bed-b26b-8fbd86c94828',
//             login_url: 'https://beta.reblium.com/dashboard'
//         }).toString();

//         try {
//             const response = await fetch(`https://login.xsolla.com/api/user?${query}`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json'
//                 },
//                 body: JSON.stringify(requestBody)
//             });

//             if (response.status === 204) {
//                 signupSuccessMessage.textContent = 'Signup successful. Check your email for further instructions.';
//                 signupSuccessMessage.classList.remove('hidden');
//             } else {
//                 const data = await response.json();
//                 let errorMessage = data.error_description || 'An error occurred. Please try again later.';

//                 // Check for specific error messages to clean up
//                 if (data.error && data.error.description) {
//                     errorMessage = data.error.description.replace(/body\./g, '');
//                 }

//                 signupErrorMessage.textContent = errorMessage;
//                 signupErrorMessage.classList.remove('hidden');
//             }
//         } catch (error) {
//             console.error('An error occurred during signup:', error);
//             signupErrorMessage.textContent = 'An error occurred during signup. Please try again later.';
//             signupErrorMessage.classList.remove('hidden');
//         }
//     });
// });

// Forgot Xsolla api
document.addEventListener("DOMContentLoaded", function () {
  document
    .querySelector("#forgot-password-section form")
    .addEventListener("submit", async (event) => {
      event.preventDefault(); // Prevent the default form submission

      const emailInput = document.getElementById("forgot-password-email");
      const successMessageDiv = document.getElementById(
        "forgot-password-success-message"
      );
      const errorMessageDiv = document.getElementById(
        "forgot-password-error-message"
      );

      // Hide previous messages
      successMessageDiv.classList.add("hidden");
      errorMessageDiv.classList.add("hidden");

      try {
        const query = new URLSearchParams({
          projectId: "4a04d037-a1fb-4bed-b26b-8fbd86c94828",
          login_url: "https://beta.reblium.com/dashboard",
        }).toString();

        const response = await fetch(
          `https://login.xsolla.com/api/password/reset/request?${query}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ username: emailInput.value }),
          }
        );

        if (response.status === 204) {
          // Password reset request sent successfully
          successMessageDiv.textContent =
            "Password reset request sent successfully. Check your email for further instructions.";
          successMessageDiv.classList.remove("hidden");
        } else {
          const data = await response.json();
          // Log the entire error response for debugging purposes
          console.log("Xsolla API Error Response:", data);

          // Extract the error description from the response
          let errorMessage = "An error occurred. Please try again later.";
          if (data.error && data.error.description) {
            errorMessage = data.error.description;
          }

          errorMessageDiv.textContent = errorMessage;
          errorMessageDiv.classList.remove("hidden");
        }
      } catch (error) {
        errorMessageDiv.textContent =
          "An error occurred during the password reset request. Please try again later.";
        errorMessageDiv.classList.remove("hidden");
      }
    });
});
