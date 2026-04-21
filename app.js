const DEPLOY_ID   = "2026-04-20";
const STORAGE_KEY = "ourlist_state";
const DEPLOY_KEY  = "ourlist_deployId";

let state      = { chad: [], joelle: [] };
let currentTab = "chad";

// ── RTF parser ──────────────────────────────────────────────────────────────

function rtfToText(rtf) {
  let s = rtf;
  // Strip known header groups entirely — do NOT use a loop that strips all
  // {…} groups, because after inner groups are removed the greedy regex
  // would match the outer document brace and wipe the whole file.
  s = s
    .replace(/\{\\fonttbl[^}]*\}/g, "")
    .replace(/\{\\colortbl[^}]*\}/g, "")
    .replace(/\{\\\*[^}]*\}/g, "");
  // Decode common Windows-1252 hex escapes produced by TextEdit smart-quotes
  s = s
    .replace(/\\'92/g, "’") // ' right single quote
    .replace(/\\'91/g, "‘") // ' left single quote
    .replace(/\\'93/g, "“") // " left double quote
    .replace(/\\'94/g, "”") // " right double quote
    .replace(/\\'[0-9a-fA-F]{2}/g, ""); // drop any other hex escapes
  s = s
    .replace(/\\[a-z]+\-?[0-9]* ?/gi, "") // control words
    .replace(/\\\n/g, "\n")                // RTF hard return → newline
    .replace(/[\\{}]/g, "");               // remaining structural chars
  return s.split("\n").map(l => l.trim()).filter(l => l).join("\n");
}

function parseItems(text) {
  const result = { chad: [], joelle: [] };
  let person = null;
  let id = Date.now();
  for (const raw of text.split("\n")) {
    const l = raw.trim();
    const m = l.match(/^---\s*(\w+)\s*---$/);
    if (m) { person = m[1].toLowerCase(); continue; }
    if (person && result[person] !== undefined) {
      const done   = l.startsWith("[x]") || l.startsWith("[X]");
      const undone = l.startsWith("[ ]");
      if (done || undone) {
        result[person].push({ id: id++, text: l.slice(3).trim(), done, source: "file" });
      }
    }
  }
  return result;
}

// ── State ───────────────────────────────────────────────────────────────────

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

async function loadState() {
  const storedDeploy = localStorage.getItem(DEPLOY_KEY);

  if (storedDeploy === DEPLOY_ID) {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try { state = JSON.parse(stored); return; } catch (e) {}
    }
  }

  // New deploy (or first ever load) — fetch the RTF baseline
  let fileItems = { chad: [], joelle: [] };
  try {
    const res = await fetch("TodoList.rtf");
    if (res.ok) fileItems = parseItems(rtfToText(await res.text()));
  } catch (e) { /* file:// or network error — start empty */ }

  // Preserve any UI-added items from the previous deploy
  let uiItems = { chad: [], joelle: [] };
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      const old = JSON.parse(stored);
      for (const p of ["chad", "joelle"]) {
        uiItems[p] = (old[p] || []).filter(i => i.source === "ui");
      }
    } catch (e) {}
  }

  state = {
    chad:   [...fileItems.chad,   ...uiItems.chad],
    joelle: [...fileItems.joelle, ...uiItems.joelle],
  };
  saveState();
  localStorage.setItem(DEPLOY_KEY, DEPLOY_ID);
}

// ── Render ──────────────────────────────────────────────────────────────────

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function updateProgress() {
  let done = 0, total = 0;
  for (const p of ["chad", "joelle"]) (state[p] || []).forEach(i => { total++; if (i.done) done++; });
  document.getElementById("progressLabel").textContent = `${done}/${total} done`;
  document.getElementById("progressBar").style.width   = total ? `${(done / total) * 100}%` : "0%";
}

function render() {
  const container = document.getElementById("listContainer");
  container.innerHTML = "";
  updateProgress();

  const people = currentTab === "all" ? ["chad", "joelle"] : [currentTab];

  for (const person of people) {
    if (currentTab === "all") {
      const label = document.createElement("div");
      label.className   = "section-label";
      label.textContent = person === "chad" ? "Chad" : "Joelle";
      container.appendChild(label);
    }

    const items = state[person] || [];
    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.className   = "empty";
      empty.innerHTML   = `<div class="empty-icon">📝</div><p>Nothing here yet.<br>Add one below!</p>`;
      container.appendChild(empty);
      continue;
    }

    for (const item of items) {
      const el = document.createElement("div");
      el.className      = `item${item.done ? " done" : ""}`;
      el.dataset.person = person;
      el.dataset.id     = item.id;
      el.innerHTML = `
        <div class="check${item.done ? " checked" : ""}" data-action="toggle">
          ${item.done
            ? `<svg width="12" height="9" viewBox="0 0 12 9" fill="none">
                 <polyline points="1.5,4.5 4.5,7.5 10.5,1.5" stroke="#fff" stroke-width="2"
                   stroke-linecap="round" stroke-linejoin="round"/>
               </svg>`
            : ""}
        </div>
        <span class="item-text${item.done ? " done" : ""}" data-action="edit">${escapeHtml(item.text)}</span>
        <button class="delete-btn" data-action="delete" aria-label="Delete">×</button>
      `;
      container.appendChild(el);
    }
  }
}

// ── Sparkle animation ────────────────────────────────────────────────────────

function sparkle(checkEl) {
  const rect   = checkEl.getBoundingClientRect();
  const cx     = rect.left + rect.width  / 2;
  const cy     = rect.top  + rect.height / 2;
  const colors = ["#2A8B68", "#FFD60A", "#FF6B6B", "#4ECDC4", "#A78BFA", "#FF9F43"];

  for (let i = 0; i < 14; i++) {
    const dot = document.createElement("div");
    dot.style.cssText = [
      "position:fixed", "width:7px", "height:7px", "border-radius:50%",
      `background:${colors[i % colors.length]}`,
      `left:${cx}px`, `top:${cy}px`,
      "pointer-events:none", "z-index:9999",
      "transform:translate(-50%,-50%)",
    ].join(";");
    document.body.appendChild(dot);

    const angle = (i / 14) * Math.PI * 2;
    const dist  = 36 + Math.random() * 32;
    const dx    = Math.cos(angle) * dist;
    const dy    = Math.sin(angle) * dist;

    dot.animate(
      [
        { transform: "translate(-50%,-50%) scale(1.2)", opacity: 1 },
        { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(0)`, opacity: 0 },
      ],
      { duration: 520, easing: "ease-out" }
    ).onfinish = () => dot.remove();
  }
}

// ── Inline edit ─────────────────────────────────────────────────────────────

function startEdit(person, id, textEl) {
  if (textEl.contentEditable === "true") return;
  const item = (state[person] || []).find(i => i.id === id);
  if (!item) return;

  textEl.contentEditable = "true";
  textEl.classList.add("editing");
  textEl.focus();

  // Place cursor at end
  const range = document.createRange();
  range.selectNodeContents(textEl);
  range.collapse(false);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);

  function commit() {
    textEl.contentEditable = "false";
    textEl.classList.remove("editing");
    const newText = textEl.textContent.trim();
    if (newText) { item.text = newText; saveState(); }
    else textEl.textContent = item.text; // revert if cleared
    cleanup();
  }
  function onKey(e) {
    if (e.key === "Enter")  { e.preventDefault(); commit(); }
    if (e.key === "Escape") {
      textEl.textContent     = item.text;
      textEl.contentEditable = "false";
      textEl.classList.remove("editing");
      cleanup();
    }
  }
  function cleanup() {
    textEl.removeEventListener("blur",    commit);
    textEl.removeEventListener("keydown", onKey);
  }
  textEl.addEventListener("blur",    commit);
  textEl.addEventListener("keydown", onKey);
}

// ── Event delegation for list actions ───────────────────────────────────────

document.getElementById("listContainer").addEventListener("click", e => {
  const el     = e.target.closest("[data-action]");
  if (!el) return;
  const itemEl = el.closest(".item");
  if (!itemEl) return;

  const person = itemEl.dataset.person;
  const id     = Number(itemEl.dataset.id);
  const item   = (state[person] || []).find(i => i.id === id);
  if (!item) return;

  switch (el.dataset.action) {
    case "toggle":
      item.done = !item.done;
      if (item.done) sparkle(el);
      saveState();
      render();
      break;
    case "delete":
      state[person] = state[person].filter(i => i.id !== id);
      saveState();
      render();
      break;
    case "edit":
      startEdit(person, id, el);
      break;
  }
});

// ── Add item ─────────────────────────────────────────────────────────────────

function addItem() {
  if (currentTab === "all") return;
  const input = document.getElementById("addInput");
  const text  = input.value.trim();
  if (!text) return;
  state[currentTab].push({ id: Date.now(), text, done: false, source: "ui" });
  saveState();
  input.value = "";
  render();
}

// ── Tab switching ─────────────────────────────────────────────────────────────

function switchTab(tab) {
  currentTab = tab;
  for (const t of ["chad", "joelle", "all"]) {
    document.getElementById("tab" + t[0].toUpperCase() + t.slice(1))
      .classList.toggle("active", t === tab);
  }
  const input    = document.getElementById("addInput");
  const btn      = document.getElementById("addBtn");
  const disabled = tab === "all";
  input.placeholder = disabled
    ? "Switch to a person's tab to add items"
    : `Add something for ${tab === "chad" ? "Chad" : "Joelle"}…`;
  input.disabled    = disabled;
  btn.disabled      = disabled;
  input.style.opacity = btn.style.opacity = disabled ? "0.5" : "1";
  render();
}

// ── Init ─────────────────────────────────────────────────────────────────────

document.getElementById("addInput").addEventListener("keydown", e => { if (e.key === "Enter") addItem(); });
document.getElementById("addBtn").addEventListener("click", addItem);

if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent) && !navigator.standalone) {
  document.getElementById("hintBox").style.display = "block";
}

loadState().then(() => {
  document.getElementById("dateLabel").textContent = new Date().toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
  render();
});
