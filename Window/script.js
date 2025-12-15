// Mode Data
let MODES = {
  "therapy": {
    icon: '<i class="fa-solid fa-users"></i>',
    name: 'Therapy',
    description: 'Mental health support sessions focusing on emotional well-being.',
    details: 'Designed for mental health support sessions. This mode helps identify emotional patterns and stress triggers.',
    strengths: [
      { icon: '<i class="fa-solid fa-shield"></i>', text: 'Privacy First' },
      { icon: '<i class="fa-solid fa-heartbeat"></i>', text: 'Empathy Focus' },
      { icon: '<i class="fa-solid fa-bullseye"></i>', text: 'Deep Insights' }
    ]
  },
  "custom": {
    icon: '<i class="fa-solid fa-gear"></i>',
    name: 'Custom',
    description: 'Create a customized consultation mode for your specific needs.',
    strengths: [
      { icon: '<i class="fa-solid fa-check-circle"></i>', text: 'Fast and convenient' },
      { icon: '<i class="fa-solid fa-bullseye"></i>', text: 'Set your own goals' },
      { icon: '<i class="fa-solid fa-chart-line"></i>', text: 'Maximize utility' }
    ]
  },
  "uplift": {
    icon: '<i class="fa-solid fa-sun"></i>',
    name: 'Uplift',
    description: 'Depression-focused guidance.',
    details: 'This mode targets symptoms of depression by encouraging small, manageable steps toward emotional stability and motivation. It emphasizes mood tracking, gentle encouragement, and self-compassion.',
    isCustomMode: true,
    strengths: [
      { icon: '<i class="fa-solid fa-chart-line"></i>', text: 'Mood Monitoring' },
      { icon: '<i class="fa-solid fa-bolt"></i>', text: 'Motivational Nudges' },
      { icon: '<i class="fa-solid fa-heart"></i>', text: 'Gentle Affirmations' }
    ]
  },
  "balance": {
    icon: '<i class="fa-solid fa-scale-balanced"></i>',
    name: 'Balance',
    description: 'Anxiety regulation aid.',
    details: 'Designed to help manage anxiety, this mode provides calming strategies, grounding techniques, and helps users challenge irrational fears. It focuses on restoring emotional equilibrium.',
    isCustomMode: true,
    strengths: [
      { icon: '<i class="fa-solid fa-wind"></i>', text: 'Calming Exercises' },
      { icon: '<i class="fa-solid fa-question-circle"></i>', text: 'Thought Challenging' },
      { icon: '<i class="fa-solid fa-droplet"></i>', text: 'Stress Reduction' }
    ]
  }
};

// State
let currentMode = null;
let isRecording = false;
let audioChunks = [];

const CONTINUE_RECORDING = 0;
const STOP_RECORDING = 1;
let recording_mode = CONTINUE_RECORDING;

// DOM Elements
const modeButtons = document.querySelectorAll('.mode-button');
const emptyState = document.getElementById('empty-state');
const modeContent = document.getElementById('mode-content');
const analysisIcon = document.getElementById('selected-mode-icon-analysis');
const analysisBody = document.getElementById('analysis-body');
const analysisBlock = document.getElementById('mode-content-analysis');
const selectedModeIcon = document.getElementById('selected-mode-icon');
const selectedModeName = document.getElementById('selected-mode-name');
const customModeBadge = document.getElementById('custom-mode-badge');
const recordBtn = document.getElementById('record-btn');
const addCustomModeBtn = document.getElementById('add-custom-mode-btn')
const windowSelectMenu = document.getElementById('window-select-menu')
const customInput = document.querySelectorAll('.custom-input');
const promptInput = document.getElementById('prompt-input');
const modeDescriptionText = document.getElementById('mode-description-text');
const strengthsDiv = document.getElementById('strengths-container')
const strengthsGrid = document.getElementById('strengths-grid');
const recordingStatus = document.getElementById('recording-status');
const analysisModal = document.getElementById('analysis-modal');
const closeModalBtn = document.getElementById('close-modal-btn');
const emotionResult = document.getElementById('emotion-result');
const recommendationResult = document.getElementById('recommendation-result');
const questionsList = document.getElementById('questions-list');
const followupList = document.getElementById('followup-list');
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');

// Functions
function showToast(message, duration = 3000) {
  toastMessage.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), duration);
}

function updateStrengths(mode) {
  if (!mode.strengths) return;
  
  strengthsGrid.innerHTML = mode.strengths.map(strength => 
    `<div class="strength-card">
      <span class="strength-icon">${strength.icon}</span>
      <span class="strength-text">${strength.text}</span>
    </div>`
  ).join('');

  return 1;
}

windowSelectMenu.addEventListener("click", async () => {
  await window.electronAPI.getWindows().then((sources) => {
    sources.forEach((source) => {
      if (!Array.from(windowSelectMenu.options).find(option => option.value === source.id)) {
        let option = document.createElement('option');
        option.value = source.id;
        option.textContent = source.name.split(" - ").pop();

        windowSelectMenu.appendChild(option)
      }
    });
    
    Array.from(windowSelectMenu.options).forEach((option) => {
      if (!Array.from(sources).find(source => source.id === option.value) && option.textContent != "Please select the meeting window") {
        windowSelectMenu.removeChild(option)
      }
    })
  })
})

function selectMode(modeId) {
  const mode = MODES[modeId];
  currentMode = mode;
  currentMode.id = modeId;  // Store the mode ID for reference

  // Update UI
  modeButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === modeId);
  });

  emptyState.classList.add('hidden');
  modeContent.classList.remove('hidden');
  
  selectedModeIcon.innerHTML = mode.icon;
  selectedModeName.textContent = `${mode.name} Consultation`;
  customModeBadge.classList.toggle('hidden', !mode.isCustomMode);
  
  customInput.forEach((elem)=>{elem.classList.toggle('hidden', modeId !== 'custom')})
  addCustomModeBtn.parentElement.classList.toggle('hidden', modeId !== 'custom')
  recordBtn.parentElement.classList.toggle('hidden', modeId === 'custom')
  windowSelectMenu.parentElement.style.display = (modeId === 'custom' ? 'none' : "")
  modeDescriptionText.textContent = mode.details || mode.description;

  strengthsDiv.hidden = updateStrengths(mode) ? false : true;
}

async function displayAnalysis(data){
	analysisBlock.classList.remove('hidden')
	analysisIcon.innerHTML = `<i class="fa-solid fa-dna"></i>`;
	analysisBody.innerHTML = data;
  analysisBlock.scrollIntoView({ behavior: "smooth"});
}

async function startRecording() {
    console.log("startRecording()");
    await window.electronAPI.getWindows().then((sources) => {
      sources.forEach((source) => {
          if (source.id == windowSelectMenu.selectedOptions[0].value) {
              navigator.mediaDevices.getDisplayMedia({
                  audio: true,
                  video: false
              }).then((stream) => {
                mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

                mediaRecorder.ondataavailable = (event) => {
                    if (event.data.size > 0) {
                        audioChunks.push(event.data); // Collect audio chunks
                    }
                };

                mediaRecorder.onstop = () => {
                    if (recording_mode == STOP_RECORDING) {
						            isRecording = false;
                        console.log("recording stopped");
                    } else {
                        const blob = new Blob(audioChunks, { type: "audio/webm" });
                        const reader = new FileReader();

                        reader.onloadend = () => {
                            const arrayBuffer = reader.result;
                            const uint8Array = new Uint8Array(arrayBuffer);
                            window.electronAPI.saveAudio(uint8Array); // Send audio data to the main process to save
                        };

                        reader.readAsArrayBuffer(blob); // Read the blob as an ArrayBuffer

                        audioChunks = [];

                        mediaRecorder.start();

                        setTimeout(() => {
                            mediaRecorder.stop(); // Stop the recording after 10 seconds
                        }, 50000);
                    };
                }

                mediaRecorder.start();
                isRecording = true;
                recording_mode = CONTINUE_RECORDING;
                showToast('Recording started');
                recordBtn.classList.add('recording');
                recordBtn.innerHTML = '<span class="record-icon"></span><span class="record-text">Stop Recording</span>';
                recordingStatus.classList.remove('hidden');

                // Automatically stop the recording after 10 seconds
                setTimeout(() => {
                    mediaRecorder.stop(); // Stop the recording after 10 seconds
                }, 50000);
            })
            .catch((e) => console.error("Error accessing audio:", e));
          };
        });
    }
)};

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
	  recording_mode = STOP_RECORDING;
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
  }
  
  isRecording = false;
  recordBtn.classList.remove('recording');
  recordBtn.innerHTML = '<span class="record-icon"></span><span class="record-text">Start Recording</span>';
  recordingStatus.classList.add('hidden');
  showToast('Recording stopped');
}

// Event Listeners

window.electronAPI.receivePythonOutput((data) => {
  displayAnalysis(data);
});

modeButtons.forEach(button => {
  button.addEventListener('click', () => {selectMode(button.dataset.mode)});
});

addCustomModeBtn.addEventListener('click', () => {
  const name = document.getElementById('custom-name-input').value.trim();
  const prompt = document.getElementById('custom-prompt-input').value.trim();

  if (!name || !prompt) {
    showToast("Please fill in all fields");
    return;
  }

  const customId = `${name}`;
  const newMode = {
    icon: `<i class="fa-solid fa-gear"></i>`,
    name: name,
    description: "description",
    details: prompt,
    isCustomMode: true,
  };

  MODES[customId] = newMode;

  // Add to the UI (e.g., add a new button)
  const btn = document.createElement('button');
  btn.setAttribute("class", "mode-button")
  btn.setAttribute("data-type", name)

  btn.innerHTML = `<div class="mode-button-content">
    <span class="mode-icon">
      <i class="fa-solid fa-gears"></i>
    </span>
    <div class="mode-info">
      <div class="mode-name">`+ name + `</div>
      <span class="custom-tag">
        <i class="fa-solid fa-gear"></i>&nbsp; Custom</span>
    </div>
  </div>`
  document.getElementById('mode-button-container').appendChild(btn);

  btn.addEventListener('click', () => selectMode(customId));

  showToast(`Custom mode "${name}" added!`);
});

console.log(
  document.getElementById('custom-name-input'),
  document.getElementById('custom-prompt-input')
);

recordBtn.addEventListener('click', () => {
  if (isRecording) {
    stopRecording();
  } else {
    if (!currentMode) {
      showToast('Please select a mode first');
      return;
    }
    if (currentMode.id === 'custom' && !promptInput.value.trim()) {
      showToast('Please enter a custom prompt');
      return;
    }
    startRecording();
  }
});

closeModalBtn.addEventListener('click', () => {
  analysisModal.classList.remove('visible');
});

analysisModal.addEventListener('click', (e) => {
  if (e.target === analysisModal) {
    analysisModal.classList.remove('visible');
  }
});

// Initialize microphone access check
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => stream.getTracks().forEach(track => track.stop()))
  .catch(() => showToast('Please enable microphone access'));