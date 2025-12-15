const { contextBridge, ipcRenderer, desktopCapturer } = require("electron");
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;

ffmpeg.setFfmpegPath(ffmpegPath);

contextBridge.exposeInMainWorld("electronAPI", {
    openNewWindow: () => ipcRenderer.send('open-new-window'),
    saveAudio: (uint8Array) => ipcRenderer.send("save-audio", uint8Array), // Send to main process 
    deleteFile: () => {
        const filePath = path.join(__dirname, "temp", "desktop_audio.webm");

        fs.unlink(filePath, (err) => {
            if (err) console.error("Error deleting file:", err);
            else console.log("File deleted successfully");
        });
    },
    receivePythonOutput: (callback) => ipcRenderer.on('python-output', (event, data) => callback(data)),
    getWindows: async () => await ipcRenderer.invoke('DESKTOP_CAPTURER_GET_SOURCES')
});
