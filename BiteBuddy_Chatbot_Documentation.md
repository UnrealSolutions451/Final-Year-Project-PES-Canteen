# BiteBuddy — AI Food Assistant
### PES Canteen Web App | Technical Documentation

---

## Overview

BiteBuddy is the in-app food recommendation chatbot embedded in the P.E.S. Canteen menu page. It uses a **hybrid AI + rule-based architecture** to ensure it always responds — even when the AI API is unavailable or rate-limited.

---

## Architecture: Hybrid Design

```
User Message
     │
     ▼
┌─────────────────────┐
│   Groq AI (Primary) │  ← Llama 3.1 8B Instant via Groq Cloud API
│   Full NLP response │
└────────┬────────────┘
         │ Success? → Reply to user
         │ Fail (429 / network / error)?
         ▼
┌─────────────────────────┐
│  Rule-Based Engine       │  ← Local, instant, no API needed
│  (Fallback / Always On) │
└─────────────────────────┘
         │
         ▼
      Reply to user (always)
```

The bot **never shows an error to the user**. If AI fails, the rule-based engine silently takes over.

---

## Layer 1 — Groq AI (Primary)

| Property | Value |
|---|---|
| Provider | Groq Cloud (groq.com) |
| Model | `llama-3.1-8b-instant` |
| Free Tier Limit | 14,400 requests/day, 30 RPM |
| Response Time | ~300–700 ms |
| Protocol | OpenAI-compatible REST API (`fetch`) |
| SDK | None (plain `fetch` — no npm package needed) |

### How it works

1. On the first open, BiteBuddy fetches the live menu from Firebase Firestore.
2. A **system prompt** is built dynamically with today's available items grouped by category (name, price, type, description).
3. Every user message is sent to Groq with the full system prompt + conversation history (multi-turn context).
4. The AI responds in character — warm, casual, emoji-friendly — staying within the available menu.
5. If Groq returns a `429` (rate limit), the bot switches `usingAI` flag to `false` for the session and routes all further messages to the rule-based engine.

### System Prompt Design

The system prompt instructs BiteBuddy to:
- Only recommend items from TODAY's live menu (injected at runtime).
- Always mention the price.
- Keep replies short (3–4 sentences max).
- Handle dietary preferences: veg, non-veg, vegan, high protein, light, spicy, budget-friendly.
- Ask one clarifying question if the user is undecided.
- Redirect off-topic questions back to food.

### Conversation History

Chat history is maintained in React state as an array of `{ role, content }` objects (OpenAI format). Each new message appends to history and the full array is sent to Groq, enabling multi-turn conversations where context carries forward.

---

## Layer 2 — Rule-Based Engine (Fallback)

The rule-based engine is entirely local — no network calls, instant response, always available.

### How it works

It parses the user's message with **regex keyword matching** against these categories:

| Keyword Pattern | Action |
|---|---|
| `veg`, `vegetarian` (not `non-veg`) | Filter menu to `ty === "veg"` |
| `non-veg`, `chicken`, `meat`, `egg` | Filter menu to `ty === "non-veg"` |
| `drink`, `juice`, `water`, `beverage` | Filter to `category === "drinks"` |
| `snack` | Filter to `category === "snacks"` |
| `chinese` | Filter to `category === "chinese"` |
| `cheap`, `budget`, `affordable` | Sort by lowest price, pick top 3 |
| `filling`, `protein`, `heavy`, `hungry` | Sort by highest price, pick top 3 |
| `healthy`, `light`, `diet`, `low cal` | Filter veg + sort ascending price |

The engine picks up to **3 items** and returns a friendly formatted message with names and prices. If filters narrow to zero items, it falls back to the full available menu before picking.

### Fallback Safety

If the entire available menu is empty (e.g., Firestore error), the engine returns a polite "check back later" message instead of crashing.

---

## Live Menu Integration

BiteBuddy reads from the same Firebase Firestore `menu` collection the web app uses. It only includes items where `available === true`. This means:

- If the admin marks an item unavailable, BiteBuddy stops recommending it **immediately** on next open.
- No hardcoded menu — 100% synced with real canteen data.
- Items are grouped by `category` field in the system prompt for better AI context.

---

## UI Features

| Feature | Detail |
|---|---|
| Floating button | Fixed bottom-right, pulses 3× on page load to attract attention |
| Typing indicator | Animated bouncing dots while waiting for response |
| Quick chips | 5 pre-set suggestion buttons shown before first message |
| Auto-scroll | Chat always scrolls to the latest message |
| AI/Smart badge | Header badge shows "AI" (Groq active) or "Smart" (rule-based mode) |
| Multi-turn memory | Conversation context preserved across messages in the session |
| Mobile responsive | Full-width panel on mobile, height adapts to screen size |

---

## Tech Stack

| Component | Technology |
|---|---|
| Frontend | React.js (Vite) |
| AI API | Groq Cloud — Llama 3.1 8B Instant |
| Fallback | Custom rule-based engine (JavaScript) |
| Database | Firebase Firestore (menu data) |
| HTTP | Native `fetch` API (no extra SDK) |
| Env config | `VITE_GROQ_KEY` in `.env` |

---

## Failure Modes & Handling

| Failure | How BiteBuddy handles it |
|---|---|
| Groq 429 rate limit | Silently switches to rule-based for the session |
| Groq network error | Falls through to rule-based on that message |
| Firestore menu fetch fails | Builds system prompt with empty menu; rule-based uses empty list gracefully |
| No API key configured | Groq skipped entirely; rule-based is always on |
| Empty menu | Returns polite "check back later" message |

---

## Files

| File | Purpose |
|---|---|
| `react-app/src/components/ChatBot.jsx` | Full chatbot component (UI + Groq + rule-based) |
| `react-app/.env` | `VITE_GROQ_KEY` API key (not committed to git) |
| `react-app/src/pages/Menu.jsx` | Renders `<ChatBot />` with tableId and sessionId props |

---

*P.E.S. Canteen — Final Year Project | 2025–26*
