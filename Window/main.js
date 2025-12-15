const { app, BrowserWindow, desktopCapturer, session, ipcMain } = require('electron')
const path = require("path"); //  Import `path` module
const fs = require("fs"); //  Import the File System module
const ffmpeg = require("fluent-ffmpeg");
const ffmpegPath = require("@ffmpeg-installer/ffmpeg").path;
const { spawn } = require('child_process');
var script_path = path.join(__dirname, '..', "AI", "main.py");

let mainWindow;
let pydata;

ffmpeg.setFfmpegPath(ffmpegPath);

// Function to create the main application window
const createMainWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1100,
        height: 700,
        icon: path.join(__dirname, '..', 'resources', 'logo.ico'),
        minWidth: 800,
        autoHideMenuBar: true, // Hides the default menu bar
        resizable: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: true,
            enableRemoteModule: false,
        }
    });

    session.defaultSession.setDisplayMediaRequestHandler((request, callback) => {
        desktopCapturer.getSources({ types: ['screen'] }).then((sources) => {
            // Grant access to the first screen found
            callback({ video: sources[0], audio: 'loopback' });
        });
    }, { useSystemPicker: true });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));
};

// Handle saving audio

ipcMain.handle(
    'DESKTOP_CAPTURER_GET_SOURCES',
    async () => {const sources = await desktopCapturer.getSources({ types: ['window'] }); return sources;}
)

ipcMain.on("save-audio", (event, uint8Array) => {
  const webmPath = path.join(__dirname, "temp", "desktop_audio.webm");
  const mp3Path = path.join(__dirname, "..", "AI", "script_dependencies", "sample.mp3");

    // Save raw .webm file
    fs.writeFile(webmPath, Buffer.from(uint8Array), (err) => {
        if (err) {
            console.error("Error saving webm file:", err);
            return;
        }

        console.log("WebM file saved. Converting to MP3...");

        // Convert WebM to MP3 using ffmpeg
        ffmpeg(webmPath)
            .toFormat("mp3")
            .on("end", () => {
                console.log("MP3 file saved:", mp3Path);
                fs.unlink(webmPath, (err) => {
                    if (err) console.error("Error deleting WebM file:", err);
                });

                AI_analyse_python_process = spawn('python', [script_path]);

                AI_analyse_python_process.stdout.on('data', (data) => {
                    console.log(`stdout: ${data}`);
                });
                
                AI_analyse_python_process.stderr.on('data', (data) => {
                    console.error(`stderr: ${data}`);
                });
    
                AI_analyse_python_process.stdout.on('data', function (data) {
                    pydata = data.toString();
                });
    
                AI_analyse_python_process.on('close', (code) => {
                    console.log(`Process exited with code ${code}`);
            
                    // After the script exits, read the file and send its content
                    fs.readFile(path.join(__dirname, "..", "AI", "script_dependencies", "chatgpt_report.txt"), "utf-8", (err, fileData) => {
                        if (!err && mainWindow) {
                            mainWindow.webContents.send('python-output', fileData);
                        }
                    });
                });
            })
            .on("error", (err) => console.error("FFmpeg conversion error:", err))
            .save(mp3Path);
    });
});

// When app is ready, create the main window
app.whenReady().then(() => {
    createMainWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
