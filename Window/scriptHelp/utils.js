import { modes } from '../ssfixed.js';

// Find the Mode in the array
export function findMode(name) {
  let wantedMode;
  modes.forEach((mode) => {
    if (mode.name === name) {
      wantedMode = mode;
    }
  })

  return wantedMode;
}

// Make the toast message appear
export function showToast(message, duration = 3000) {
  const toastMessage = document.getElementById('toast-message');
  
  toastMessage.textContent = message;
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), duration);
}

// Save To localStorage
export function saveLocally() {
  localStorage.setItem('modes', JSON.stringify(modes));
}

// Load from localStorage
export function loadLocally() {
  return JSON.parse(localStorage.getItem('modes'));
}

// Semi-Fixed recording
let audioChunks = [];
let mediaRecorder;
let stoppedAuto = false;
export let isRecording = false;
export async function startRecording() {
  console.log("startRecording()");

  const recordBtn = document.getElementById('record-btn'); 
  const recordingStatus = document.getElementById('recording-status');
  // Checks if the wanted tab is open (does not select it, FIX later)
  const windowSelectMenu = document.getElementById("window-select-menu");
  const sources = await window.electronAPI.getWindows();

  let wantedSource; 
  sources.forEach((source) => {
    if (source.id == windowSelectMenu.selectedOptions[0].value) {
      wantedSource = source;
    }
  })

  if (!wantedSource) {
    showToast('Please select a source')
    throw new Error('The wanted tab was not found');
  }

  // Starts recording the entire screen
  const stream = await navigator.mediaDevices.getDisplayMedia({
      audio: true,
      video: false
  })
  
  mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });

  mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
          audioChunks.push(event.data); // Collect audio chunks
      }
  };

  mediaRecorder.onstop = () => {
    if (!stoppedAuto) {
      isRecording = false;
      console.log("recording stopped");
    } else {
      stoppedAuto = false;
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

      // Would be nice to add a ID deletion, since this code will run even after the process is done
      setTimeout(() => {
        stoppedAuto = true;
        mediaRecorder.stop(); // Stop the recording after 10 seconds
      }, 50000);
    };
  }

    mediaRecorder.start();
    isRecording = true;

    // Change UI
    showToast('Recording started');
    recordBtn.classList.add('recording');
    recordBtn.innerHTML = '<span class="record-icon"></span><span class="record-text">Stop Recording</span>';
    recordingStatus.classList.remove('hidden');

    // Automatically stop the recording after 10 seconds
    setTimeout(() => {
      stoppedAuto = true;
      mediaRecorder.stop();
    }, 50000);
};

// Stop recording
export function stopRecording() {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
	  stoppedAuto = false;
    mediaRecorder.stop();
    mediaRecorder.stream.getTracks().forEach(track => track.stop());
  }
  
  isRecording = false;

  // Changes UI
  const recordBtn = document.getElementById('record-btn'); 
  const recordingStatus = document.getElementById('recording-status');
  recordBtn.classList.remove('recording');
  recordBtn.innerHTML = '<span class="record-icon"></span><span class="record-text">Start Recording</span>';
  recordingStatus.classList.add('hidden');
  showToast('Recording stopped');
}

// DisplayAnalysis
export async function displayAnalysis(data){
  console.log(data);
}

// Function render responses 
export function renderResponses() {
  
}