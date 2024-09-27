let currentStep = 0;

const tutorialVideo = document.getElementById("tutorialVideo");
const titleElement = document.getElementById("tutorialTitle");
const descriptionElement = document.getElementById("tutorialContent");
const prevButton = document.getElementById("prevTutorial");
const nextButton = document.getElementById("nextTutorial");
const skipButton = document.getElementById("skipTutorial");

const closeModalBtn = document.getElementById("closeSignUpModal");

const introModalOverlay = document.getElementById("introModalOverlay");
const tutorialModalOverlay = document.getElementById("tutorialModalOverlay");
const signUpLoginBtn = document.getElementById("signUpLogin");
const modalOverlay = document.getElementById("modalOverlay");
const signupOption = document.getElementById("signupOption");
const processSignUpProcess = document.getElementById("processSignUpProcess");
const welcomeSection = document.getElementById("welcomeSection");
const signUpFormBtn = document.getElementById("signUpFormBtn");
const signUpFormSection = document.getElementById("signUpFormSection");

// Function to update tutorial content based on the current step
function updateTutorialStep(step) {
  titleElement.textContent = tutorialSteps[step].title;

  tutorialVideo.querySelector("source").src = tutorialSteps[step].videoSrc;
  tutorialVideo.load();
  tutorialVideo.autoplay = true;
  tutorialVideo.muted = true;

  descriptionElement.textContent = tutorialSteps[step].description;

  prevButton.style.display = step === 0 ? "none" : "inline-block";

  nextButton.style.display =
    step === tutorialSteps.length - 1 ? "none" : "inline-block";

  skipButton.textContent = step === tutorialSteps.length - 1 ? "Close" : "Skip";
}

// Initial state
updateTutorialStep(currentStep);

// Event listeners for buttons
nextButton.addEventListener("click", () => {
  if (currentStep < tutorialSteps.length - 1) {
    currentStep++;
    updateTutorialStep(currentStep);
  }
});

prevButton.addEventListener("click", () => {
  if (currentStep > 0) {
    currentStep--;
    updateTutorialStep(currentStep);
  }
});

skipTutorial.addEventListener("click", () => {
  tutorialModalOverlay.style.display = "none";
});

setInterval(() => {
  showSignUpModal();
}, 60000);

signUpFormBtn.addEventListener("click", () => {
  signUpFormSection.style.display = "block";
  signupOption.style.display = "none";
});

closeModalBtn.addEventListener("click", () => {
  modalOverlay.style.display = "none";
  signupOption.style.display = "none";
  signUpFormSection.style.display = "none";
});

processSignUpProcess.addEventListener("click", () => {
  introModalOverlay.style.display = "none";
  tutorialModalOverlay.style.display = "flex";
});

modalOverlay.addEventListener("click", (e) => {
  if (e.target === modalOverlay) {
    modalOverlay.style.display = "none";
  }
});

function cancelSignUpOption() {
  signupOption.style.display = "none";
  modalOverlay.style.display = "none";
}

function showSignUpModal() {
  if (
    (checkDisplayStatus(modalOverlay, "flex") &&
      checkDisplayStatus(signUpFormSection, "block")) ||
    checkDisplayStatus(introModalOverlay, "flex") ||
    checkDisplayStatus(tutorialModalOverlay, "flex")
  ) {
    return;
  } else {
    introModalOverlay.style.display = "none";
    modalOverlay.style.display = "flex";
    signupOption.style.display = "block";
    signUpFormSection.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", function () {
  waitForVideoLoad().then(() => {
    console.log("Video loaded, calling handleRandomization");
    // handleRandomization();
    // randomizeSliders();
  });
});
