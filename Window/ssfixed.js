import { findMode, showToast, saveLocally, loadLocally, startRecording, isRecording, stopRecording, displayAnalysis } from './scriptHelp/utils.js';

// Making the class and array to store the modes
class Mode {
    icon;
    name;
    description;
    details;
    prompt;
    responseList = [];


    constructor (icon, name, description, details = '') {
      this.icon = icon;
      this.name = name;
      this.description = description;
      this.prompt = description;
      this.details = details;
      this.responseList = [];
    }
}

export let modes = loadLocally();

if (!modes) {
  modes = [
    new Mode('users', 'Therapy', 'Designed for mental health support sessions. This mode helps identify emotional patterns and stress triggers.', 'Mental health support'),
    new Mode('sun', 'Uplift', 'This mode targets symptoms of depression by encouraging small, manageable steps toward emotional stability and motivation. It emphasizes mood tracking, gentle encouragement, and self-compassion.', 'Depression-focused guidance'),
    new Mode('scale-balanced', 'Balance', 'Designed to help manage anxiety, this mode provides calming strategies, grounding techniques, and helps users challenge irrational fears. It focuses on restoring emotional equilibrium.', 'Anxiety regulation aid')
  ];
}

let currentRecordingMode, responseContainer;
// The code for generating the HTML
function generateModeList() {
  const modeList = document.querySelector('.mode-list');
  let modeListHTML = '';

  modes.forEach((mode) => {
    modeListHTML += 
    `
      <button class="mode-button js-mode-button" data-mode="${mode.name}">
      <div class="mode-button-content">
        <div class="mode-icon">
          <i class="fa-solid fa-${mode.icon}"></i>
        </div>
        <div class="mode-info">
          <div class="mode-name">${mode.name}</div>
          <div class="mode-desc">${mode.details}</div>
        </div>
      </div>
    </button>
    `
  }) 

  modeList.innerHTML = modeListHTML;

  // Give the buttons functionality
  let selectedButton;
  document.querySelectorAll('.js-mode-button').forEach((modeButton) => {
    const modeData = modeButton.dataset.mode;

    modeButton.addEventListener('click', () => {
      //Makes the mode buttons appear with color when selected
      selectedButton && selectedButton.classList.toggle('active');
      selectedButton = modeButton;
      modeButton.classList.toggle('active');

      loadMain(modeData);

      // Find the tabs that are currently open
      const windowSelectMenu = document.getElementById('window-select-menu');

      windowSelectMenu.addEventListener("click", async () => {
      await window.electronAPI.getWindows().then((sources) => {
        sources.forEach((source) => {
          if (!Array.from(windowSelectMenu.options).find(option => option.value === source.id)) {
            let option = document.createElement('option');
            option.value = source.id;
            option.textContent = source.name.split(" - ").pop();

            windowSelectMenu.appendChild(option);
          }
        });
        
          //Remove tabs that ar closed
          Array.from(windowSelectMenu.options).forEach((option) => {
            if (!Array.from(sources).find(source => source.id === option.value) && option.textContent != "Please select the meeting window") {
              windowSelectMenu.removeChild(option);
            }
          })
        })
      })

      //Makes the record button work
        document.getElementById("record-btn").addEventListener('click', () => {
          if (!isRecording) {
            // Track the current mode in which the app is running
            currentRecordingMode = findMode(modeButton.dataset.mode);

            // Remove left over information
            currentRecordingMode.responseList = [];
            document.querySelector("#response-container").innerHTML = currentRecordingMode.responseList;

            startRecording();
          } else {
            stopRecording();
          }
      })
    })
  })

  // Load the main (right) page function
  const modeContent = document.querySelector('.js-mode-content');
  function loadMain(modeData) {
    const currentMode = findMode(modeData);

    let mainHTML = 
    `
    <div id="mode-content" class="mode-content">
      <div class="mode-header">
        <div class="mode-title">
          <span id="selected-mode-icon" class="mode-icon">
          <i class="fa-solid fa-${currentMode.icon}" aria-hidden="true"></i>
          </span>
          <h2 id="selected-mode-name">${currentMode.name}</h2>
        </div>
        
        <div class="record-controls">
          <button id="record-btn" class="record-btn">
            <span class="record-icon"></span>
            <span class="record-text">Start Recording</span>
          </button>
        </div>
      </div>

      <div class="window-select-div">
        <select name="windowSelectMenu" id="window-select-menu">
          <option value="">Please select the meeting window</option>
        </select>
      </div>

      <div class="mode-details">
        <div class="mode-description">
          <h3>Mode Description</h3>
          <p id="mode-description-text">${currentMode.description}</p>
        </div>
      </div>

      <div id="recording-status" class="recording-status hidden">
        <div class="pulse"></div>
        <span>Recording in progress...</span>
      </div>
    </div>

    <div id="response-container" class=""mode-content"></div>
    ` 

    modeContent.innerHTML = mainHTML;
    document.querySelector("#response-container").innerHTML = currentMode.responseList;
  }

  // For the create custom prompt I generate different HTML
  document.querySelector('.js-create-button').addEventListener('click', () => {
    modeContent.innerHTML = 
    `
    <div id="mode-content" class="mode-content">
    <div class="mode-header">
      <div class="mode-title">
        <span id="selected-mode-icon" class="mode-icon">
        <i class="fa-solid fa-gear"></i></span>
        <h2 id="selected-mode-name">Custom consultation</h2>
      </div>
      
      <div class="custom-mode-controls">
        <button id="add-custom-mode-button" class="record-btn">
          <i class="fa-solid fa-plus fa-lg" style="color: #ffffff;"></i>
          <span class="record-text">Add New</span>
        </button>
      </div>
    </div>

    <div id="custom-name" class="custom-input">
      <h3>Name of the consultation:</h3>
      <input type="text" id="custom-name-input" placeholder="Enter here...">
    </div>

    <div id="custom-input" class="custom-input">
      <h3>Prompt to guide the analysis:</h3>
      <input type="text" id="custom-prompt-input" placeholder="Enter here...">
    </div>

    <div class="mode-details">
      <div class="mode-description">
        <h3>Mode Description</h3>
        <p id="mode-description-text">
          Create a customized consultation mode for your specific needs.
        </p>
      </div>
  </div>
    `

    // Make the add new button work
    document.getElementById("add-custom-mode-button").addEventListener('click', () => {
      const name = document.getElementById("custom-name-input");
      const prompt = document.getElementById("custom-prompt-input");

      if (!name.value) {
        showToast('Please enter the name of the mode');
      } else if (!prompt.value) {
        showToast('Please enter the prompt of the mode');
      } else {
        const tempMode = new Mode('gear', name.value, prompt.value);
        name.value = '';
        prompt.value = '';

        modes.push(tempMode);
        saveLocally();
        generateModeList();
        showToast('Custom mode has been generated!');
      }
    })
  })

  // Receive the input from the python API's
  window.electronAPI.receivePythonOutput((data) => {
    console.log(data);

    if(currentRecordingMode.responseList.length === 0) {
      document.querySelector("#response-container").classList.remove("hidden");
    }

    currentRecordingMode.responseList.push(
      `
      <div id="mode-content-analysis" class="mode-content">
        <div class="mode-header">
          <div class="mode-title">
            <h2>Suggestions and Insights</h2>
          </div>
        </div>

        <div class="mode-details">
          <div class="mode-description" id="analysis-body">
            ${data}
          </div>
        </div>
      </div>
      `
    );

    document.querySelector("#response-container").innerHTML = currentRecordingMode.responseList;
  }); 

  // Initialize microphone access check (is it necessary?)
  navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => stream.getTracks().forEach(track => track.stop()))
  .catch(() => showToast('Please enable microphone access'));
}

generateModeList();