require.config({ paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs" } });
require(["vs/editor/editor.main"], () => {
  window.editor = monaco.editor.create(document.getElementById("editor"), {
    value: "// Your ESP32 code will appear here",
    language: "cpp",
    theme: "vs-dark",
    automaticLayout: true
  });
});

function log(msg) {
  document.getElementById("log").innerHTML = msg;
}

async function cloneRepo() {
  const url = document.getElementById("repoUrl").value;
  if (!url) return alert("Enter your GitHub URL");
  log("⏳ Cloning or updating repo...");
  const res = await fetch("/repo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url })
  });
  log(await res.text());
}

async function compile() {
  log("⚙️ Compiling...");
  const res = await fetch("/compile", { method: "POST" });
  log(await res.text());
}

async function upload() {
  const espIP = document.getElementById("espIP").value;
  if (!espIP) return alert("Enter ESP32 IP");
  log("📡 Uploading OTA...");
  const res = await fetch("/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ espIP })
  });
  log(await res.text());
}
