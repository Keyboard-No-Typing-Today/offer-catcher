# Offer Catcher — Mobile App Design

Status: approved by the project owner (`做B`, camera / notifications / share explicitly out of scope).
Date: 2026-11-24
Course: EE5415 Mobile Applications Design and Development, City University of Hong Kong.

## 1. Intent

Students apply to many jobs with the same resume and no feedback loop. Existing job boards help
them find postings, but not decide whether a posting is worth applying to, or what to change first.
Offer Catcher turns a resume plus a job description into a concrete match report and a lightweight
application pipeline, on the phone, with the resume kept on the device.

One-line pitch: **Paste a JD, get a match report in seconds, and keep every application moving.**

## 2. Goals

- Complete, polished Android app built with React + Capacitor 8, installable as an APK.
- Core loop works **offline**: import/parse a resume, paste a JD, receive a deterministic match report.
- Optional AI layer (DeepSeek chat + Qwen embeddings through a small proxy) improves the report and
  powers the assistant; the app degrades gracefully without it.
- Local-first data: profile, analyses, saved jobs, application tracker and chat stay on the device.
- Demonstrate Android platform integration without camera / notifications / share (excluded by owner):
  native preferences storage, network status, status bar, splash screen, hardware back button,
  filesystem export and haptics.
- Course deliverables: proposal, final report, marketing README, slides, demo video script, signed APK.

## 3. Non-goals

- No account system, cloud sync, multi-device sync or social features.
- No camera capture, OCR, push/local notifications or native share sheet.
- No live job-board scraping. The job catalogue is bundled sample data for the demo.
- No production-grade multi-tenant backend; the AI proxy is a single-user demo service.
- No iOS build in this iteration.

## 4. Users and jobs-to-be-done

Primary user: a Chinese-speaking university student / fresh graduate applying to internships or
graduate roles in tech, product, design, data or marketing.

- When I see a JD, I want to know in under a minute whether it is worth tailoring a resume for.
- When I decide to apply, I want specific edits, not a generic score.
- When I have applied, I want one place to see what is in flight and what needs follow-up.
- I do not want my resume uploaded to an unknown server just to get feedback.

## 5. Chosen approach

Three options were considered:

| Option | Summary | Verdict |
| --- | --- | --- |
| A. WebView wrapper | Keep the desktop Ant Design layout, wrap it in Capacitor | Rejected: looks like a website in a shell, weak mobile UX |
| B. Mobile-first, offline-first | New mobile UI, on-device parsing and matching, optional AI proxy | **Chosen** |
| C. Server-heavy client | Keep MySQL/LanceDB, deploy the old backend, thin mobile client | Rejected: demo depends on network/deployment, mobile UI still needs a rewrite |

Option B keeps the valuable parts of the prototype (job catalogue, AI analysis prompt, excellent-resume
corpus), removes the fragile MySQL/COS/LanceDB dependencies, and makes the graded physical-device demo
resilient.

## 6. Architecture

```text
┌──────────────────────────────────────────────┐
│ Capacitor Android shell                      │
│  React 19 + Vite mobile UI (HashRouter)      │
│                                              │
│  screens → store (Zustand + Preferences)     │
│           → local engine (parse + match)     │
│           → api client ───────────────┐      │
│  native: status bar, splash, back,    │      │
│          network, filesystem, haptics │      │
└───────────────────────────────────────┼──────┘
                                        │ HTTPS / LAN HTTP
                              ┌─────────▼──────────┐
                              │ Express AI proxy   │
                              │  DeepSeek chat     │
                              │  Qwen embeddings   │
                              │  excellent-resume  │
                              │  RAG (JSON cache)  │
                              └────────────────────┘
```

- The app never receives an AI provider key. Keys live in the proxy's `.env`.
- Without the proxy, the local engine still produces score, strengths, gaps and suggestions.
- The proxy is optional infrastructure, not a dependency for the core loop.

## 7. Core flows

1. **Onboarding**: welcome → import resume (PDF/DOCX/TXT) or load a sample → home.
2. **Analyze**: paste JD / choose a job → parse JD → local match → optional AI enhancement → result.
3. **Result**: score, dimension breakdown, matched/missing skills, strengths, gaps, suggestion cards.
4. **Save & track**: add job or result to tracker → update status (saved/applied/interview/offer/rejected).
5. **Ask**: assistant chat; AI-backed when proxy is reachable, local intent replies otherwise.
6. **Settings**: AI endpoint test, data export, clear data, about/privacy.

## 8. Local data model

```js
profile: {
  name, email, phone, links, rawText, fileName, fileType,
  sections: { summary, education, experience, projects, skills, awards, other },
  skills: [{ name, category }], yearsExperience, educationLevel,
  completeness, updatedAt
}
analysis: {
  id, jobId?, jobTitle, company, jdText, createdAt,
  localScore, aiScore?, finalScore, semanticScore?,
  summary, dimensions: { skills, experience, education, keywords, quality },
  matchedSkills, missingSkills, strengths, gaps,
  suggestions: [{ type, title, detail }], mode: 'local' | 'ai'
}
tracker: [{ id, jobId?, title, company, status, notes, appliedAt, updatedAt }]
settings: { apiBaseUrl, aiEnabled, lastAiCheck }
```

Persisted once via Zustand `persist` into `@capacitor/preferences` on Android and
`localStorage` on the web. Analyses are capped at 30, chat at 40 messages.

## 9. Matching engine

Deterministic and explainable, so it works offline and can be unit-tested:

- skill coverage (40%): must-have skills weighted above nice-to-have; synonym-aware.
- experience relevance (20%): years vs requirement + overlap between experience/project text and JD skills.
- education (10%): degree level vs requirement.
- keyword/ATS coverage (15%): JD keywords present in the resume.
- resume quality (15%): contact details, section completeness, quantified bullets, length.

Outputs score 0-100, dimension scores, matched/missing skills, strengths, gaps and 3-6 suggestions.
AI enhancement never discards the local result; the final score is a transparent blend and the UI
labels which parts are AI-assisted.

## 10. AI proxy

Endpoints:

- `GET /api/health` — model/config status.
- `POST /api/ai/analyze` — `{resumeText, jdText, local}` → AI summary, gaps, suggestions, dimension
  scores, semantic score from Qwen embeddings, and 1-3 retrieved excellent-resume examples.
- `POST /api/ai/chat` — `{messages, profile, context}` → reply.
- `POST /api/ai/embed` — debugging/utility endpoint.

Models: `deepseek-v4-pro` for analysis, `deepseek-flash` for chat, `qwen3.7-text-embedding` for
embeddings (1024-dim). JSON is extracted and schema-validated server-side; any failure falls back to a
structured local response. Inputs are truncated and rate-limited.

## 11. UI direction

**Field-notes / career journal**, not a generic blue dashboard:

- warm paper background, ink text, vermilion accent, sage success, serif display + clean sans body;
- generous 20-24px radii, thin rules, subtle paper grain;
- a match ring as the recurring visual motif;
- four bottom tabs (首页 / 岗位 / 助手 / 我的) plus a prominent “分析 JD” action on home;
- every screen has loading, empty, error and offline states;
- Chinese UI copy, English code and docs.

## 12. Android integration (in scope)

`@capacitor/preferences` (native persistence), `@capacitor/network` (offline banner),
`@capacitor/status-bar` + safe-area layout, `@capacitor/splash-screen`, `@capacitor/app`
(hardware back button, app state), `@capacitor/filesystem` (export data), `@capacitor/haptics`.
File import uses the Android document picker through an `<input type=file>` inside the WebView.

## 13. Testing and review

- Vitest unit tests for text extraction, resume/JD parsing, matching, score blending and validation.
- Node test runner for proxy utilities and JSON extraction.
- `npm run build` + preview; Playwright mobile-viewport walkthrough with screenshots.
- Android `assembleDebug` and `assembleRelease`; verify APK metadata with `aapt`/`apksigner`.
- Manual review: empty/loading/error/offline states, long text, back navigation, data persistence.
- Security pass: no keys in frontend bundle or git history; `.env` ignored; proxy-only provider access.

## 14. Deliverables

- Signed Android APK + source code.
- Proposal, final report, presentation slides, marketing README, demo video script.
- Screenshots and architecture diagram.

## 15. Success criteria

- A new user can import a resume, analyze a JD and see a useful report without any network.
- With the proxy running, the same flow returns AI-enhanced suggestions and a semantic score.
- Every core flow is reachable from the bottom navigation and survives app restart.
- APK builds, installs and runs on Android; back button and offline behavior are correct.
- All tests pass, no secrets tracked, and the report/proposal/marketing material are complete.
