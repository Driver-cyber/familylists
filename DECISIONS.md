# DECISIONS.md — Living Decision Log
## Our List · Shared Family Todo App

> **Note to Claude:** This file is the "current vibe." Always read it at session start.
> Decided = move forward. Open = ask before acting. Parked = don't touch yet.

---

## 🎯 Current North Star

**Goal:** Ship a working v1 — Chad updates the text file, bumps DEPLOY_ID, commits, Cloudflare deploys, Joelle opens the URL and can check things off or add new items on the fly.

**Current phase:** Initial build. Writing the code for the first time.

**Vibe:** Simple, fast, joyful. Get it working and beautiful, in that order.

---

## ✅ Decisions Made (Don't Relitigate These)

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-20 | Project name: **Our List** | Matches the source file header. Personal and direct. |
| 2026-04-20 | Static site only — no backend, no database, no auth | Two users, shared URL, no sync requirement in v1. Right-sized. |
| 2026-04-20 | Vanilla HTML/CSS/JS — no framework | No build step, no overhead, deploys as-is to Cloudflare Pages. |
| 2026-04-20 | `TodoList.rtf` parsed as plain text (weekly import) | RTF is text-readable. No conversion needed. File is the weekly starting point, not the live source of truth. |
| 2026-04-20 | Full UI add/edit/delete in the app | Flexibility for mid-week changes without requiring a commit. |
| 2026-04-20 | **Hybrid data model: Option B (merge on redeploy)** | UI-added items survive redeployment. Text file items replace old text-file items only. No database needed. |
| 2026-04-20 | Deploy fingerprint via `DEPLOY_ID` constant | Simple date string in `app.js`, manually bumped on each weekly update. Tells app when a new deploy has occurred. |
| 2026-04-20 | Item `source` tagging (`'file'` vs `'ui'`) | Enables merge logic to know which items to replace vs. preserve on redeploy. |
| 2026-04-20 | localStorage for all state | Full app state (items + checkboxes) persists here. No backend. |
| 2026-04-20 | Three tabs: Chad / Joelle / All | Matches source file structure. Obvious UX. |
| 2026-04-20 | Delight animation on check-off | Sparkle or confetti burst. Subtle, joyful. v1 feature, not a nice-to-have. |
| 2026-04-20 | Mobile-first design | Joelle likely uses on phone. Single column, thumb-friendly. |
| 2026-04-20 | Design reference: `Example_List_HTML.html` | Aesthetic foundation. Outfit font, cream/green palette, card style, sticky header. Build fresh data model on top of this visual direction. |
| 2026-04-20 | Cloudflare Pages + GitHub auto-deploy | Already configured. No changes to deploy pipeline. |

---

## 🔜 Open Questions (Decide Before Acting)

*None currently open. Add items here when something comes up mid-build.*

---

## 💡 Parking Lot (v2 and Beyond)

| Idea | Notes |
|---|---|
| Real-time sync | Would require Firebase or similar. Right call for v2 when the list becomes more active. |
| Auto-write text file from UI | Close the loop so Chad doesn't have to edit the file manually. Needs GitHub API or a small backend. |
| Dark mode | Easy to add in v2. |
| Recurring tasks | Some todos repeat weekly. Could be a format extension (e.g., `[r]` prefix). |
| Emoji / tags per task | Fun personality addition. Don't touch until v1 ships. |
| Option C merge (text wins, UI items survive) | More sophisticated than Option B. Revisit if the merge logic causes confusion in practice. |

---

## 📝 Change Log

**[2026-04-20]** — Project initialized. Founding session complete. All v1 decisions locked. Build starting.

---

*When something shifts mid-build — a pivot, a new constraint, a better idea — add it here before touching the code.*
