// Randomize the sliders in skin section
function randomizeSliders(event) {
  if (event && event.preventDefault) {
    event.preventDefault();
    event.stopPropagation();
  }

  const assetCategories = Object.keys(assets);
  console.log(assetCategories);

  assetCategories.forEach((category) => {
    // Randomly select a new asset variation for each category
    const assetInfo = assets[category];
    const totalVariations = assetInfo.variations.length;
    const randomIndex = Math.floor(Math.random() * totalVariations);
    const selectedAsset = assetInfo.variations[randomIndex];

    // Find the corresponding slider based on category ID
    const sliderId = category.toLowerCase() + "Button"; // e.g., 'ageButton'
    const slider = document
      .querySelector("#" + sliderId)
      ?.parentNode?.parentNode?.querySelector(".slider");

    if (slider) {
      // Randomly set the slider value
      const min = parseFloat(slider.min);
      const max = parseFloat(slider.max);
      const step = parseFloat(slider.step);
      const randomValue =
        Math.floor(Math.random() * ((max - min) / step + 1)) * step + min;

      slider.value = randomValue.toFixed(1); // Set the new random value
      const valueDisplay = slider.parentNode.querySelector(".slider-value");
      valueDisplay.textContent = randomValue; // Update the display

      // Construct a safe command to send
      handleSendCommands({
        assetname: selectedAsset,
        slidertype: `${category}*${randomValue}`,
      });
    }
  });

  sliderIds.forEach((id) => {
    const slider = document
      .querySelector("#" + id)
      .parentNode.parentNode.querySelector(".slider");
    if (slider) {
      // Calculate a random value within the slider's range
      const min = parseFloat(slider.min);
      const max = parseFloat(slider.max);
      const step = parseFloat(slider.step);
      const randomValue = (
        Math.floor(Math.random() * ((max - min) / step + 1)) * step +
        min
      ).toFixed(1);

      // Set the slider value
      slider.value = randomValue;

      // Update the corresponding slider value display
      const valueDisplay = slider.parentNode.querySelector(".slider-value");
      if (valueDisplay) {
        valueDisplay.textContent = randomValue;
      }

      // Send the command via handleSendCommands
      const command = slider
        .getAttribute("oninput")
        .replace(/this.value/g, randomValue);
      eval(command); // Caution: using eval() has security implications
    }
  });
}

function randomizeHair(event) {
  event.preventDefault();
  event.stopPropagation();
  const randomIndex = Math.floor(Math.random() * hairAssets.length); // Get a random index
  const selectedHairAsset = hairAssets[randomIndex]; // Pick a hair asset name from the array

  // Call a function to send the command with the selected hair asset
  handleSendCommands({ assetname: selectedHairAsset });
  selectedHair = selectedHairAsset;

  console.log("Randomized hair asset command sent:", selectedHairAsset); // Optional: log the asset name
}

function randomizeEyebrows(event) {
  event.preventDefault();
  event.stopPropagation();
  const randomIndex = Math.floor(Math.random() * eyebrowAssets.length); // Get a random index
  const selectedEyebrowAsset = eyebrowAssets[randomIndex]; // Pick an eyebrow asset name from the array

  // Call a function to send the command with the selected eyebrow asset
  handleSendCommands({ assetname: selectedEyebrowAsset });

  console.log("Randomized eyebrow asset command sent:", selectedEyebrowAsset); // Optional: log the asset name
}

function randomizeEyelashes(event) {
  event.preventDefault();
  event.stopPropagation();

  const randomIndex = Math.floor(Math.random() * eyelashAssets.length); // Get a random index
  const selectedEyelashAsset = eyelashAssets[randomIndex]; // Pick an eyelash asset name from the array

  // Call a function to send the command with the selected eyelash asset
  handleSendCommands({ assetname: selectedEyelashAsset });

  console.log("Randomized eyelash asset command sent:", selectedEyelashAsset); // Optional: log the asset name
}

function randomizeMustache(event) {
  event.preventDefault();
  event.stopPropagation();

  const randomIndex = Math.floor(Math.random() * mustacheAssets.length); // Get a random index
  const selectedMustacheAsset = mustacheAssets[randomIndex]; // Pick a mustache asset name from the array

  // Call a function to send the command with the selected mustache asset
  handleSendCommands({ assetname: selectedMustacheAsset });

  console.log("Randomized mustache asset command sent:", selectedMustacheAsset); // Optional: log the asset name
}

function randomizeBeard(event) {
  event.preventDefault();
  event.stopPropagation();

  const randomIndex = Math.floor(Math.random() * beardAssets.length); // Get a random index
  const selectedBeardAsset = beardAssets[randomIndex]; // Pick a beard asset name from the array

  // Call a function to send the command with the selected beard asset
  handleSendCommands({ assetname: selectedBeardAsset });

  console.log("Randomized beard asset command sent:", selectedBeardAsset); // Optional: log the asset name
}

function randomizeHaircard(event) {
  event.preventDefault();
  event.stopPropagation();

  const randomIndex = Math.floor(Math.random() * haircardAssets.length); // Get a random index
  const selectedHaircardAsset = haircardAssets[randomIndex]; // Pick a haircard asset name from the array

  // Call a function to send the command with the selected haircard asset
  handleSendCommands({ assetname: selectedHaircardAsset });

  console.log("Randomized haircard asset command sent:", selectedHaircardAsset); // Optional: log the asset name
}

function randomizeLipstick(event) {
  event.preventDefault();
  event.stopPropagation();

  const randomIndex = Math.floor(Math.random() * lipstickAssets.length); // Get a random index
  const selectedLipstickAsset = lipstickAssets[randomIndex]; // Pick a lipstick asset name from the array

  // Call a function to send the command with the selected lipstick asset
  handleSendCommands({
    assetname: selectedLipstickAsset,
    slidertype: "M_Switch_Lipstick*1",
  });

  console.log("Randomized lipstick asset command sent:", selectedLipstickAsset); // Optional: log the asset name
}

function randomizeEyeShadow(event) {
  console.log("Executed this function automatically",'________________________________________');
  event.preventDefault();
  event.stopPropagation();

  const randomIndex = Math.floor(Math.random() * eyeShadowAssets.length); // Get a random index
  const selectedEyeShadow = eyeShadowAssets[randomIndex]; // Pick an eye shadow asset from the array

  // Call a function to send the command with the selected eye shadow
  handleSendCommands({ assetname: selectedEyeShadow });

  console.log("Randomized eye shadow command sent:", selectedEyeShadow); // Optional: log the asset name
}

function randomizeEyeliner(event) {
  event.preventDefault();
  event.stopPropagation();

  const randomIndex = Math.floor(Math.random() * eyelinerAssets.length); // Get a random index
  const selectedEyelinerAsset = eyelinerAssets[randomIndex]; // Pick an eyeliner asset from the array

  // Call a function to send the command with the selected eyeliner asset
  handleSendCommands({ assetname: selectedEyelinerAsset });

  console.log("Randomized eyeliner asset command sent:", selectedEyelinerAsset); // Optional: log the asset name
}

function randomizeFacePaint(event) {
  event.preventDefault();
  event.stopPropagation();

  const randomIndex = Math.floor(Math.random() * facePaintAssets.length); // Get a random index
  const selectedFacePaint = facePaintAssets[randomIndex]; // Pick a face paint asset from the array

  // Call a function to send the command with the selected face paint
  handleSendCommands({ assetname: selectedFacePaint });

  console.log("Randomized face paint command sent:", selectedFacePaint); // Optional: log the asset name
}

function randomizeTattoo(event) {
  event.preventDefault();
  event.stopPropagation();

  const randomIndex = Math.floor(Math.random() * tattooAssets.length); // Get a random index
  const selectedTattoo = tattooAssets[randomIndex]; // Pick a tattoo asset from the array

  handleSendCommands({ assetname: selectedTattoo });

  console.log("Randomized tattoo command sent:", selectedTattoo); // Optional: log the asset name
}

function randomizeIrisLens(event) {
  event.preventDefault();
  event.stopPropagation();

  const randomIndex = Math.floor(Math.random() * irisLensAssets.length); // Get a random index
  const selectedIrisLens = irisLensAssets[randomIndex]; // Pick an iris lens asset from the array

  handleSendCommands({ assetname: selectedIrisLens });

  console.log("Randomized iris lens command sent:", selectedIrisLens); // Optional: log the asset name
}

function randomizeIris(event) {
  event.preventDefault();
  event.stopPropagation();

  const randomIndex = Math.floor(Math.random() * irisAssets.length); // Get a random index
  const selectedIris = irisAssets[randomIndex]; // Pick an iris asset from the array

  // Call a function to send the command with the selected iris
  handleSendCommands({ assetname: selectedIris });

  console.log("Randomized iris command sent:", selectedIris); // Optional: log the asset name
}

function randomizeSpecial(event) {
  event.preventDefault();
  event.stopPropagation();

  const randomIndex = Math.floor(Math.random() * specialAssets.length); // Get a random index
  const selectedSpecial = specialAssets[randomIndex]; // Pick a special asset from the array

  // Call a function to send the command with the selected special
  handleSendCommands({ assetname: selectedSpecial });

  console.log("Randomized special command sent:", selectedSpecial); // Optional: log the asset name
}

function randomizeEyes(event) {
  event.preventDefault();
  event.stopPropagation();

  const randomIndex = Math.floor(Math.random() * eyesAssets.length); // Get a random index
  const selectedEyes = eyesAssets[randomIndex]; // Pick an eyes asset from the array

  // Call a function to send the command with the selected eyes
  handleSendCommands({ assetname: selectedEyes });

  console.log("Randomized eyes command sent:", selectedEyes); // Optional: log the asset name
}

function randomizeEars(event) {
  event.preventDefault();
  event.stopPropagation();

  const randomIndex = Math.floor(Math.random() * earsAssets.length); // Get a random index
  const selectedEars = earsAssets[randomIndex]; // Pick an ears asset from the array

  // Call a function to send the command with the selected ears
  handleSendCommands({ assetname: selectedEars });

  console.log("Randomized ears command sent:", selectedEars); // Optional: log the asset name
}

function randomizeNose(event) {
  event.preventDefault();
  event.stopPropagation();

  const randomIndex = Math.floor(Math.random() * noseAssets.length); // Get a random index
  const selectedNose = noseAssets[randomIndex]; // Pick a nose asset from the array

  // Call a function to send the command with the selected nose
  handleSendCommands({ assetname: selectedNose });

  console.log("Randomized nose command sent:", selectedNose); // Optional: log the asset name
}

function randomizeMouth(event) {
  event.preventDefault(event);
  event.stopPropagation(event);

  const randomIndex = Math.floor(Math.random() * mouthAssets.length); // Get a random index
  const selectedMouth = mouthAssets[randomIndex]; // Pick a mouth asset from the array

  // Call a function to send the command with the selected mouth
  handleSendCommands({ assetname: selectedMouth });

  console.log("Randomized mouth command sent:", selectedMouth); // Optional: log the asset name
}

function randomizeCheeks(event) {
  event.preventDefault();
  event.stopPropagation();

  const randomIndex = Math.floor(Math.random() * cheeksAssets.length); // Get a random index
  const selectedCheeks = cheeksAssets[randomIndex]; // Pick a cheeks asset from the array

  // Call a function to send the command with the selected cheeks
  handleSendCommands({ assetname: selectedCheeks });

  console.log("Randomized cheeks command sent:", selectedCheeks); // Optional: log the asset name
}

function randomizeJaw(event) {
  event.preventDefault();
  event.stopPropagation();

  const randomIndex = Math.floor(Math.random() * jawAssets.length); // Get a random index
  const selectedJaw = jawAssets[randomIndex]; // Pick a jaw asset from the array

  // Call a function to send the command with the selected jaw
  handleSendCommands({ assetname: selectedJaw });

  console.log("Randomized jaw command sent:", selectedJaw); // Optional: log the asset name
}
