/* =====================
   STATE
===================== */
const state = {
  tree: null,
  files: {},
  activeFile: null,
  theme: localStorage.getItem("theme") || "light"
};

/* =====================
   INIT
===================== */
document.documentElement.dataset.theme = state.theme;

document.getElementById("themeToggle").onclick = () => {
  state.theme = state.theme === "light" ? "dark" : "light";
  document.documentElement.dataset.theme = state.theme;
  localStorage.setItem("theme", state.theme);
};

document.getElementById("loadRepo").onclick = loadRepo;
document.getElementById("loadLocal").onclick = () =>
  document.getElementById("localPicker").click();
document.getElementById("localPicker").onchange = loadLocalFiles;

/* =====================
   GITHUB API
===================== */
async function loadRepo() {
  const owner = ownerInput.value;
  const repo = repoInput.value;
  const branch = branchInput.value;

  const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;

  const res = await fetch(url);
  if (!res.ok) {
    alert("Failed to load repository");
    return;
  }

  const data = await res.json();
  buildTree(data.tree);
}

/* =====================
   TREE BUILDING
===================== */
function buildTree(entries) {
  const root = {};
  state.files = {};

  for (const item of entries) {
    const parts = item.path.split("/");
    let node = root;

    parts.forEach((part, i) => {
      if (!node[part]) {
        node[part] = {
          __meta: i === parts.length - 1 ? item : null
        };
      }
      node = node[part];
    });
  }

  state.tree = root;
  renderTree();
}

function renderTree() {
  const container = document.getElementById("fileTree");
  container.innerHTML = "";
  renderNode(state.tree, container);
}

function renderNode(node, parent) {
  for (const key in node) {
    if (key === "__meta") continue;
    const meta = node[key].__meta;

    if (meta && meta.type === "blob") {
      const el = document.createElement("div");
      el.textContent = "📄 " + key;
      el.className = "file";
      el.onclick = () => loadFile(meta);
      parent.appendChild(el);
    } else {
      const el = document.createElement("div");
      el.textContent = "📁 " + key;
      el.className = "folder";
      parent.appendChild(el);

      const child = document.createElement("div");
      child.style.paddingLeft = "16px";
      parent.appendChild(child);

      el.onclick = () =>
        child.style.display =
          child.style.display === "none" ? "block" : "none";

      renderNode(node[key], child);
    }
  }
}

/* =====================
   FILE LOADING
===================== */
async function loadFile(meta) {
  const url = meta.url;
  const res = await fetch(url);
  const data = await res.json();
  const content = atob(data.content);

  state.activeFile = meta.path;
  renderFile(meta.path, content);
}

/* =====================
   VIEWER
===================== */
function renderFile(path, content) {
  const viewer = document.getElementById("viewer");
  const outline = document.getElementById("outline");
  viewer.innerHTML = "";
  outline.innerHTML = "";

  if (path.endsWith(".md")) {
    const html = renderMarkdown(content);
    viewer.innerHTML = html;
    generateOutline();
  } else {
    const pre = document.createElement("pre");
    pre.textContent = content;
    viewer.appendChild(pre);
  }
}

/* =====================
   MARKDOWN (MINIMAL GITHUB-LIKE)
===================== */
function renderMarkdown(md) {
  return md
    .replace(/^###### (.*$)/gim, "<h6>$1</h6>")
    .replace(/^##### (.*$)/gim, "<h5>$1</h5>")
    .replace(/^#### (.*$)/gim, "<h4>$1</h4>")
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/```([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    .replace(/^\> (.*$)/gim, "<blockquote>$1</blockquote>")
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.*?)\*/g, "<em>$1</em>")
    .replace(/\n$/gim, "<br />");
}

/* =====================
   OUTLINE
===================== */
function generateOutline() {
  const outline = document.getElementById("outline");
  const headers = document.querySelectorAll(".viewer h1,h2,h3,h4,h5,h6");

  headers.forEach((h, i) => {
    const id = "h-" + i;
    h.id = id;

    const a = document.createElement("a");
    a.textContent = h.textContent;
    a.style.paddingLeft = (parseInt(h.tagName[1]) - 1) * 8 + "px";
    a.onclick = () => h.scrollIntoView();

    outline.appendChild(a);
  });
}

/* =====================
   LOCAL FILE SUPPORT
===================== */
function loadLocalFiles(e) {
  const files = [...e.target.files];
  const tree = {};

  files.forEach(file => {
    const parts = file.webkitRelativePath.split("/");
    let node = tree;

    parts.forEach((part, i) => {
      if (!node[part]) node[part] = {};
      if (i === parts.length - 1) node[part].__file = file;
      node = node[part];
    });
  });

  state.tree = tree;
  renderTree();
}
