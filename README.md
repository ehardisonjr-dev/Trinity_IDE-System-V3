<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

# TRINITY Agent System — V3

**A multi-agent AI coding environment powered by Google Gemini**

[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?logo=vite&logoColor=white)](https://vite.dev)
[![Gemini](https://img.shields.io/badge/Google%20Gemini-API-4285F4?logo=google&logoColor=white)](https://ai.google.dev)

</div>

---

## What is Trinity?

Trinity is a **browser-based, multi-agent AI coding assistant** that orchestrates four specialized Gemini-powered agents to turn natural-language requests into validated, production-ready code.

Instead of asking a single model to do everything, Trinity splits work across dedicated roles:

| Agent | Role | Default Model |
|---|---|---|
| **Conductor** | Parses intent, delegates tasks, synthesizes the final response | Gemini 3 Pro |
| **Research Lead** | Grounds answers in live web data via Google Search | Gemini 3 Flash |
| **Coder** | Generates structured code proposals | Gemini 3 Pro |
| **Validator** | Reviews generated code for correctness before you accept it | Gemini 3 Pro |

Every code proposal goes through the full pipeline before it reaches you: **Conductor → (optional Research) → Code proposal → Validator → your approval**.

---

## Key Features

- **Multi-agent orchestration** — specialized reasoning paths for research, code generation, and validation
- **Code proposal & approval flow** — the AI proposes a file change with a description; you accept or reject it before anything is written to your workspace
- **Google Search grounding** — the Research agent queries the live web for technical docs, API patterns, and edge cases
- **Two execution modes**
  - **Thinking (Precision)** — enables Gemini's extended thinking budget for complex, multi-step problems
  - **Fast** — uses Gemini Flash Lite for near-instant responses on quick questions
- **Per-project workspaces** — organize work into named projects; each has its own chat history, file tree, and research sources tab
- **File manager** — browse and copy any file the AI has written into your workspace
- **Research sources tab** — all web sources cited by the Research agent are preserved and linked
- **Bounded context** — workspace file names are ranked by relevance and capped to prevent token overflow
- **Fully configurable models** — swap any agent's model from the Cluster Config panel, or enter a custom model ID

---

## Tech Stack

| Layer | Technology |
|---|---|
| UI framework | React 19 |
| Language | TypeScript 5.8 |
| Bundler | Vite 6 |
| Styling | Tailwind CSS (CDN) + inline styles |
| AI SDK | `@google/genai` v1.34+ |
| Icons | Font Awesome (CDN) |

---

## Prerequisites

- **Node.js 18+** (LTS recommended) — [download](https://nodejs.org)
- A **Google Gemini API key** — [get one free](https://aistudio.google.com/app/apikey)

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/ehardisonjr-dev/Trinity_IDE-System-V3.git
cd Trinity_IDE-System-V3
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set your API key

Create a file named `.env.local` in the project root:

```env
API_KEY=your_gemini_api_key_here
```

> **Important:** The app reads `process.env.API_KEY` at runtime via Vite's environment variable injection. Do **not** name the variable `VITE_` — use `API_KEY` exactly as shown.

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Usage

### Creating a workspace

1. Click **New Project** in the sidebar (or **Launch Workspace** on the home screen).
2. Enter a project name when prompted — it becomes the workspace identifier.

### Talking to the cluster

1. Select a workspace to open the chat view.
2. Type your request in the input bar and press **Enter** or click **Send**.
3. Watch the **System Activity** feed in the sidebar for real-time agent logs.

### Accepting a code proposal

When the Conductor returns a code change:
- A **proposal card** appears in the chat with the target file name and a description.
- The Validator automatically reviews the code — its report is shown below the proposal.
- Click **Accept & Integrate** to write the file into your workspace, or **Decline** to dismiss it.

### Switching execution modes

Use the toggle in the top-right of the project header:

| Mode | When to use |
|---|---|
| ⚡ **Fast** | Quick questions, boilerplate, lookups |
| 🧠 **Thinking** | Complex algorithms, architecture decisions, debugging |

### Browsing workspace files

Switch to the **Files** tab to see every file the agents have written. Click the copy icon to copy a file's content to your clipboard.

### Reviewing research sources

Switch to the **Research** tab to see all web sources cited by the Research agent during your session.

---

## Configuration

Open the **Cluster Config** panel (⚙ icon in the sidebar or the button on the home screen) to customize each agent's model.

| Setting | Description |
|---|---|
| **Core Conductor Node** | Model for orchestration and response synthesis |
| **Research Swarm Agent** | Model used for Google Search-grounded research |
| **Synthesis Coder Agent** | Model for code generation |
| **Verification Validator Node** | Model for proof-checking generated code |
| **Grounding Engine ID** | Optional custom Google Search CX engine key |

You can select from the three preset Gemini models or choose **+ Use Custom Model Key** to enter any model ID supported by the Gemini API.

### Preset models

| Model key | Label |
|---|---|
| `gemini-3-pro-preview` | Gemini 3 Pro — Ultimate Reasoning |
| `gemini-3-flash-preview` | Gemini 3 Flash — High Throughput |
| `gemini-flash-lite-latest` | Gemini Flash Lite — Near Instant |

---

## Build for Production

```bash
npm run build
```

Output is written to `dist/`. Serve it with any static file host (Netlify, Vercel, GitHub Pages, etc.).

To preview the production build locally:

```bash
npm run preview
```

---

## Project Structure

```
Trinity_IDE-System-V3/
├── index.html                 # Vite entry point (loads Tailwind & Font Awesome via CDN)
├── index.tsx                  # React root mount
├── App.tsx                    # Root component: project management, settings modal
├── types.ts                   # Shared TypeScript interfaces
├── components/
│   ├── Sidebar.tsx            # Project list + System Activity feed
│   └── ProjectView.tsx        # Per-project chat, file manager, research sources
├── services/
│   └── geminiService.ts       # TrinityService: conduct(), research(), validateCode()
├── vite.config.ts
├── tsconfig.json
├── package.json
└── CHANGELOG.md
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `API_KEY` | ✅ Yes | Google Gemini API key |

---

## Troubleshooting

**"API Exception: …quota…" or token errors**
- You may have hit your Gemini API rate limit. Wait a moment and try again, or switch to **Fast** mode to use a lighter model.

**Research agent returns "unable to reach the web"**
- The Google Search grounding tool requires your API key to have the Search grounding feature enabled in [AI Studio](https://aistudio.google.com).

**Blank screen after `npm run dev`**
- Confirm `.env.local` exists with `API_KEY=...` set.
- Check the browser console for errors; missing keys surface as API exceptions logged in the System Activity feed.

**Build warning: chunk > 500 kB**
- This is a known informational warning from Vite about the `@google/genai` bundle size. The app still builds and runs correctly.

---

## License

This project is private. All rights reserved.
