/* =========================================================
   KONFIGURASI REPOSITORY
   ========================================================= */

const OWNER = "octocat";     // GANTI
const REPO  = "Hello-World"; // GANTI
const BRANCH = "main";

/* =========================================================
   ELEMENT
   ========================================================= */

const explorerEl = document.getElementById("fileExplorer");
const previewEl  = document.getElementById("preview");
const outlineEl  = document.getElementById("outline");
const breadcrumbEl = document.getElementById("breadcrumb");
const themeToggle = document.getElementById("themeToggle");

/* =========================================================
   THEME
   ========================================================= */

const savedTheme = localStorage.getItem("theme");
if (savedTheme) document.documentElement.dataset.theme = savedTheme;

themeToggle.onclick = () => {
  const current = document.documentElement.dataset.theme;
  const next = current === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  localStorage.setItem("theme", next);
};

/* =========================================================
   FETCH HELPERS
   ========================================================= */

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("GitHub API error");
  return res.json();
}

/* =========================================================
   FILE TREE
   ========================================================= */

async function loadTree(path = "") {
  const url = `https://api.github.com/repos/${OWNER}/${REPO}/contents/${path}?ref=${BRANCH}`;
  return fetchJSON(url);
}

function createItem(item, parentPath = "") {
  const el = document.createElement("div");
  el.className = "item";

  const icon = document.createElement("span");
  icon.className = "icon";

  if (item.type === "dir") {
    icon.textContent = "📁";
    el.append(icon, document.createTextNode(item.name));

    const children = document.createElement("div");
    children.className = "folder-children";
    children.style.display = "none";

    el.onclick = async () => {
      children.style.display =
        children.style.display === "none" ? "block" : "none";

      if (!children.hasChildNodes()) {
        const list = await loadTree(item.path);
        list.forEach(child =>
          children.appendChild(createItem(child, item.path))
        );
      }
    };

    const wrapper = document.createElement("div");
    wrapper.appendChild(el);
    wrapper.appendChild(children);
    return wrapper;
  }

  // FILE
  icon.textContent = "📄";
  el.append(icon, document.createTextNode(item.name));

  el.onclick = () => openFile(item);

  return el;
}

/* =========================================================
   OPEN FILE
   ========================================================= */

async function openFile(file) {
  document
    .querySelectorAll(".explorer .item")
    .forEach(i => i.classList.remove("active"));

  event.currentTarget.classList.add("active");

  breadcrumbEl.textContent = "/" + file.path;

  const res = await fetch(file.download_url);
  const text = await res.text();

  if (file.name.endsWith(".md")) {
    renderMarkdown(text);
    buildOutline();
  } else {
    previewEl.innerHTML = `<pre><code>${escapeHTML(text)}</code></pre>`;
    outlineEl.innerHTML = "";
  }
}

/* =========================================================
   MARKDOWN RENDERER (SENGAJA SEDERHANA)
   ========================================================= */

function renderMarkdown(md) {
  let html = md
    .replace(/^###### (.*$)/gim, "<h6>$1</h6>")
    .replace(/^##### (.*$)/gim, "<h5>$1</h5>")
    .replace(/^#### (.*$)/gim, "<h4>$1</h4>")
    .replace(/^### (.*$)/gim, "<h3>$1</h3>")
    .replace(/^## (.*$)/gim, "<h2>$1</h2>")
    .replace(/^# (.*$)/gim, "<h1>$1</h1>")
    .replace(/^\> (.*$)/gim, "<blockquote>$1</blockquote>")
    .replace(/```([\s\S]*?)```/gim, "<pre><code>$1</code></pre>")
    .replace(/\n$/gim, "<br />");

  previewEl.innerHTML = html;
}

/* =========================================================
   OUTLINE
   ========================================================= */

function buildOutline() {
  outlineEl.innerHTML = "<h4>Outline</h4>";
  previewEl.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach(h => {
    const a = document.createElement("a");
    a.textContent = h.textContent;
    a.onclick = () => h.scrollIntoView({ behavior: "smooth" });
    outlineEl.appendChild(a);
  });
}

/* =========================================================
   UTIL
   ========================================================= */

function escapeHTML(str) {
  return str.replace(/[&<>"']/g, m => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[m]);
}

/* =========================================================
   INIT
   ========================================================= */

(async function init() {
  explorerEl.innerHTML = "";
  const root = await loadTree();
  root.forEach(item => explorerEl.appendChild(createItem(item)));
})();
