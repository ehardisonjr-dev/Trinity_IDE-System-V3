# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Fixed

- **Token overflow when calling Gemini API** ([`a654a40`](../../commit/a654a404e6a76fb9400e821dbcd0ed147a724538), [`7369b33`](../../commit/7369b33fc4363710fe8d84d58a7190a4e5e7c183))

  Previously, unbounded workspace context was interpolated directly into the `systemInstruction` on every request, and research results were appended to prompts without any size cap — both causing Gemini token-limit errors at scale.

  **`services/geminiService.ts`**
  - Removed `Current Workspace Context: ${context}` interpolation from `systemInstruction`. The system instruction is now fully static, keeping it stable across all requests.
  - Moved workspace context into the user message as a clearly-labelled `[Workspace Context]` block prepended to `[User Request]`.
  - Added lightweight prompt-size logging on each request: `Prompt size: N chars (context: M chars, prompt: K chars)`.
  - Fixed a potential `TypeError` by guarding `context?.length ?? 0` when context is falsy.

  **`components/ProjectView.tsx`**
  - Replaced the unbounded `project.files.map(f => f.name).join(', ')` context string with a bounded, relevance-first context builder:
    - Files whose names match keywords from the user's input are ranked first.
    - Hard caps: `MAX_CONTEXT_FILES = 20` files, `MAX_CONTEXT_CHARS = 2000` characters.
    - Context string is appended with `…` when truncated.
  - Research text is now truncated to `MAX_RESEARCH_CHARS = 8000` characters before inclusion in `augmentedPrompt`, with a `…[research truncated]` suffix when truncated.
  - Added diagnostic activity-log entries for workspace context size and research text size vs. chars actually sent.
  - Hoisted prompt-size constants (`MAX_CONTEXT_FILES`, `MAX_CONTEXT_CHARS`, `MAX_RESEARCH_CHARS`, `MIN_KEYWORD_LENGTH`) to module scope so they are initialized once, not on every render.
  - Research sources are still stored and displayed in the UI (unchanged behaviour).

---

## [0.1.0] — 2025-12-31

### Added

- **Initial release** ([`2a5d5d8`](../../commit/2a5d5d8fc694ff751815f74b9be395f5a467149d))
  - `App.tsx` — root application shell with project management (create, select, delete) and global activity-log panel.
  - `components/ProjectView.tsx` — per-project chat interface with AI orchestration, file management tab, research sources tab, code-proposal approval flow, and Precision / Fast mode toggle.
  - `components/Sidebar.tsx` — project list sidebar with new-project creation and system-config modal (model selection).
  - `services/geminiService.ts` — `TrinityService` class wrapping the Google GenAI SDK with three agent methods:
    - `conduct()` — Conductor orchestration via configurable Gemini model.
    - `research()` — Google Search-grounded research via configured research model.
    - `validateCode()` — Validator code-review pass via configured validator model.
  - `types.ts` — shared TypeScript interfaces (`Project`, `ProjectFile`, `ChatMessage`, `ActivityLog`, `CodeProposal`, `SystemConfig`).
  - `index.html` / `index.tsx` — Vite + React entry points with Tailwind CSS and Font Awesome via CDN.
  - `vite.config.ts`, `tsconfig.json`, `package.json` — build tooling (Vite 6, React 19, TypeScript 5.8, `@google/genai`).
