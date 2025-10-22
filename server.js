import express from "express";
import { exec } from "child_process";
import { existsSync, readdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 8080;

app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "public")));

const REPO_DIR = path.join(__dirname, "repo");

// === Clone or Pull GitHub Repo ===
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

// === List Source Files ===
app.get("/files", (req, res) => {
  if (!existsSync(REPO_DIR)) return res.status(400).send([]);
  const exts = [".ino", ".cpp", ".h", ".c", ".hpp"];
  const files = readdirSync(REPO_DIR).filter(f => exts.some(ext => f.endsWith(ext)));
  res.json(files);
});

// === Get File Content ===
app.get("/file", (req, res) => {
  const { name } = req.query;
  const filePath = path.join(REPO_DIR, name);
  if (!existsSync(filePath)) return res.status(404).send("Not found");
  const content = readFileSync(filePath, "utf8");
  res.send(content);
});

// === Save Edited File ===
app.post("/save", (req, res) => {
  const { name, content } = req.body;
  const filePath = path.join(REPO_DIR, name);
  writeFileSync(filePath, content);
  res.send("✅ File saved");
});

// === Compile Code ===
app.post("/compile", (req, res) => {
  const fqbn = "esp32:esp32:esp32";
  const cmd = `arduino-cli compile --fqbn ${fqbn} ${REPO_DIR}`;

  exec(cmd, { maxBuffer: 1024 * 500 }, (err, stdout, stderr) => {
    res.send(`<pre>${stdout || stderr}</pre>`);
  });
});

// === OTA Upload ===
app.post("/upload", (req, res) => {
  const { hostname, password } = req.body;
  const cmd = `arduino-cli upload -p network:${hostname}.local --fqbn esp32:esp32:esp32 --auth ${password} ./repo`;
  console.log("Uploading OTA:", cmd);

  exec(cmd, (err, stdout, stderr) => {
    if (err) return res.json({ success: false, log: stderr });
    res.json({ success: true, log: stdout });
  });
});


app.listen(PORT, () =>
  console.log(`🌐 Web IDE running at http://localhost:${PORT}`)
);
