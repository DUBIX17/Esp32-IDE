import express from "express";
import { exec } from "child_process";
import { existsSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 8080;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const REPO_DIR = path.join(__dirname, "repo");

// === Clone or Pull Repo ===
app.post("/repo", (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).send("No repo URL provided");

  const cmd = existsSync(REPO_DIR)
    ? `cd ${REPO_DIR} && git pull`
    : `git clone ${url} ${REPO_DIR}`;

  exec(cmd, (err, stdout, stderr) => {
    if (err) return res.status(500).send(stderr);
    res.send(stdout || "Repository updated.");
  });
});

// === Compile ===
app.post("/compile", (req, res) => {
  const fqbn = "esp32:esp32:esp32"; // Customize if needed
  const compileCmd = `arduino-cli compile --fqbn ${fqbn} ${REPO_DIR}`;

  exec(compileCmd, { maxBuffer: 1024 * 500 }, (err, stdout, stderr) => {
    res.send(`<pre>${stdout || stderr}</pre>`);
  });
});

// === OTA Upload ===
app.post("/upload", (req, res) => {
  const { espIP } = req.body;
  if (!espIP) return res.status(400).send("No ESP32 IP provided");

  const uploadCmd = `arduino-cli upload --fqbn esp32:esp32:esp32 --upload-tool arduinoOTA -p ${espIP} ${REPO_DIR}`;

  exec(uploadCmd, { maxBuffer: 1024 * 500 }, (err, stdout, stderr) => {
    res.send(`<pre>${stdout || stderr}</pre>`);
  });
});

app.listen(PORT, () => console.log(`🌐 Web IDE running at http://localhost:${PORT}`));
