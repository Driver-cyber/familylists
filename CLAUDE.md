# CLAUDE.md — Project Constitution
## Our List · Shared Family Todo App

> *"Measure twice, cut once. Order from chaos. Don't let perfect be the enemy of good."*

---

## 🧠 Session Protocol

**Read first:** Always check `DECISIONS.md` before touching any code. It is the ground truth for what has been decided and what is still open.

**Propose before you build:** For any change involving more than one file or a new feature, write a short plan and wait for explicit approval (`y`, `go`, or `looks good`) before writing code. No exceptions.

**Ask before assuming:** If a request is ambiguous or contradicts something in DECISIONS.md, surface it. "Are we pivoting?" is always the right question.

**Token discipline:** Do not read files speculatively. Don't grep recursively. Don't load the whole repo context if the task only requires one file. Ask for the specific file path when unsure.

---

## 🎯 North Star

**Our List** is a simple, shared weekly todo app for Chad and Joelle. It is not a task management platform. It is not a productivity tool. It is a small, personal, joyful ritual — a shared list that two people update together once a week and can check off from anywhere via a shared URL.

**The experience goal:** It should feel like writing on a shared piece of paper, not like opening Notion.

**Success in v1:** Chad updates `TodoList.rtf`, commits to GitHub, Cloudflare auto-deploys, and Joelle can open the link on her phone and check something off. Mid-week, either of them can add or edit items directly in the app without a redeploy.

---

## 🛠 Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| **Frontend** | Vanilla HTML / CSS / JS | No framework overhead for a single static page. Fast, simple, no build step. |
| **Weekly baseline** | `TodoList.rtf` (text file in repo) | Chad pastes the week's todos here, commits, and it becomes the new starting point. |
| **State (all items + checkboxes)** | `localStorage` | Full app state lives here between deploys. Merge logic handles weekly resets. |
| **Deploy signal** | `DEPLOY_ID` constant in `app.js` | A manually updated date string (e.g. `"2026-04-20"`) that tells the app a new week has started. |
| **Hosting** | Cloudflare Pages | Auto-deploys on GitHub commit. Zero config. |
| **Version control** | GitHub + GitHub Desktop | Chad manages commits manually. |
| **Build process** | None | Static files only. |

**Non-negotiables:**
- No backend. No database. No auth.
- No npm, no bundler, no framework in v1.
- The text file is the weekly import format — the app is also fully editable from the UI.

---

## 📁 File Structure (Target)

```
/
├── index.html               # Main app shell
├── style.css                # All styles
├── app.js                   # Parse, merge, render, animate
├── TodoList.rtf             # Weekly todo baseline (updated by Chad)
├── Example_List_HTML.html   # Design reference prototype (do not ship)
├── CLAUDE.md                # This file
└── DECISIONS.md             # Living decision log
```

---

## 📋 Text File Format Contract

The app parses `TodoList.rtf` as plain text. The format contract:

```
Our List - [Date]
--- Chad ---
[ ] task description
[x] completed task
--- Joelle ---
[ ] task description
```

**Rules:**
- Section headers: `--- Name ---` exactly
- Unchecked: `[ ]` (bracket, space, bracket)
- Pre-checked: `[x]` (bracket, x, bracket) — checkbox state is managed by localStorage, this is just the initial import state
- Do not change the format without updating DECISIONS.md and the parser

---

## 🔀 Data Model & Merge Logic

This is the core architectural decision. Get it right.

**Item schema:**
```js
{
  id: Number,       // Date.now() at creation
  text: String,
  done: Boolean,
  source: 'file' | 'ui'   // 'file' = came from TodoList.rtf, 'ui' = added in app
}
```

**On app load:**
1. Read `DEPLOY_ID` from `app.js`
2. Read `storedDeployId` from localStorage
3. **If they match** → load state from localStorage as-is. Done.
4. **If they differ (new deploy):**
   - Parse `TodoList.rtf` into fresh items tagged `source: 'file'`
   - Keep all items tagged `source: 'ui'` from localStorage (these survive)
   - Discard old `source: 'file'` items (they've been replaced by the new file)
   - Merge and save to localStorage with new `DEPLOY_ID`

**Weekly workflow for Chad:**
1. Edit `TodoList.rtf` with the new week's items
2. Update `DEPLOY_ID` in `app.js` to today's date string
3. Commit and push → Cloudflare auto-deploys → new week begins

---

## 🎨 Design Reference

A prototype HTML file (`Example_List_HTML.html`) is in the repo. Treat it as the visual foundation — not code to copy verbatim.

**Keep from the prototype:**
- Font: `Outfit` (Google Fonts), weights 400–800
- Background: `#FAF7F2` (warm cream), primary accent: `#2A8B68` (forest green)
- Card style: white cards, `border-radius: 14px`, `border: 1px solid #E8E3DB`
- Sticky header with tabs
- Progress bar (X/Y done) in header
- Mobile-first single-column layout
- Safari "Add to Home Screen" hint (show only in Safari, non-standalone)

**Build fresh (don't copy from prototype):**
- Data model — prototype uses URL hash; we use deploy fingerprint + localStorage merge
- Full CRUD — prototype has add only; we need add, inline edit, and delete
- Completion animation — prototype has none; we want a sparkle/confetti burst on check-off

---

## 🔜 Module Status

| Module | Status | Description |
|---|---|---|
| Text parser | 🔜 | Reads `TodoList.rtf` as plain text, extracts per-person item lists |
| Deploy fingerprint + merge | 🔜 | `DEPLOY_ID` constant, merge logic on load, `source` tagging |
| Tab UI | 🔜 | Chad / Joelle / All — sticky, clean switching |
| Checkbox rendering | 🔜 | Interactive checkboxes, state persisted in localStorage |
| UI add / edit / delete | 🔜 | Full CRUD from the app; new items tagged `source: 'ui'` |
| Completion animation | 🔜 | Sparkle or confetti burst on check-off |
| Cloudflare deploy | ✅ | Repo linked, auto-deploy configured |

---

## 🚫 Explicitly Out of Scope (v1)

| Feature | Reason | Revisit |
|---|---|---|
| Real-time sync | Requires backend. Wrong complexity for v1. | v2 |
| Auto-write back to text file from UI | Needs GitHub API or backend. File is import-only in v1. | v2 |
| User authentication | Two people, shared URL. No login needed. | v2 |
| Dark mode | Good parking lot item. | v2 |
| Multiple lists / categories | One list, two people. | v2 |
| Push notifications | Out of scope. | Future |

---

## 🔧 Maintenance Protocol

- After any significant feature: Claude asks "Should I update DECISIONS.md?"
- Session start: read DECISIONS.md first, no exceptions.
- Multi-file change: propose a plan, wait for `y` or `go`.
- Text file format change: flag explicitly before touching the parser.
