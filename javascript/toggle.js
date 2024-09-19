document.addEventListener("DOMContentLoaded", function () {
  const avatarContainer = document.querySelector(".avatar-container");
  const saveExitButton = document.getElementById("saveexitButton");

  avatarContainer.addEventListener("dblclick", function () {
    toggleUIVisibility();
  });

  saveExitButton.addEventListener("click", function () {
    toggleExitSaveUIVisibility();
  });

  const submenuButton = document.getElementById("submenuButton");
  const customSubmenu = document.getElementById("customSubmenu");

  submenuButton.addEventListener("click", () => {
    customSubmenu.classList.toggle("active");
  });
});
