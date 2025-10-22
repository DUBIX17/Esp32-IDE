require.config({ paths: { vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs" } });

let editor, currentFile = null;

require(["vs/editor/editor.main"], () => {
  editor = monaco.editor.create(document.getElementById("editor"), {
    value: "// Load or clone a GitHub repo to begin.",
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
  await fetch("/repo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url }) });
  await loadTabs();
}

async function loadTabs() {
  const res = await fetch("/files");
  const files = await res.json();
  const tabs = document.getElementById("tabs");
  tabs.innerHTML = "";
  files.forEach(name => {
    const tab = document.createElement("button");
    tab.textContent = name;
    tab.onclick = () => loadFile(name);
    tabs.appendChild(tab);
  });
  if (files[0]) loadFile(files[0]);
}

async function loadFile(name) {
  const res = await fetch(`/file?name=${name}`);
  const content = await res.text();
  editor.setValue(content);
  currentFile = name;
  log(`📄 Editing: ${name}`);
}

async function save() {
  if (!currentFile) return alert("No file open");
  const content = editor.getValue();
  const res = await fetch("/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: currentFile, content })
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
