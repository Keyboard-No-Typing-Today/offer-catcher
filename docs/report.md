# Offer 捕手 (Offer Catcher) — Final Report

**Course:** EE5415 Mobile Applications Design and Development, City University of Hong Kong
**Project:** Individual project
**Author:** [Student Name / Student ID]
**Version:** 1.0.0
**Date:** November 2026

## Abstract

Offer Catcher is an Android job-search copilot built with React 19 and Capacitor 8. It turns a resume and a job description into a concrete match report: a 0–100 score, five explainable dimensions, matched and missing skills, strengths, gaps and a short list of rewrite actions. A local-first architecture keeps the resume on the device and makes the core loop work without a network. An optional self-hosted AI proxy adds a semantic similarity score, more specific suggestions and a conversational assistant using DeepSeek chat and Qwen embeddings with a compact excellent-resume RAG index. A lightweight application tracker connects the analysis to the rest of the job-search workflow.

The project contributes (1) a deterministic, explainable local matching engine for student resumes; (2) a privacy-preserving optional-AI architecture with strict JSON validation and graceful fallback; (3) a mobile-first design that avoids the desktop-dashboard-in-a-WebView failure mode; and (4) a verified Android build with native storage, document picker, network awareness, status bar, splash, back-button handling, filesystem export and haptics.

## 1. Introduction

### 1.1 Motivation

Students applying for internships and graduate roles face a volume problem and a feedback problem. A single resume is sent to dozens of roles; job boards optimise discovery, not the decision of whether a particular posting is worth tailoring a resume for, or what to change first. Generic resume scanners return a score without a plan. Desktop-first tools are awkward on a phone. Many services require uploading a personal resume to an unknown server.

The project asks a narrower question than "find me a job": **given my resume and this JD, is it worth applying, and what should I change first?** The answer should fit in a short mobile session, should be explainable, and should not require surrendering the resume.

### 1.2 Contributions

1. A local, explainable match engine with five weighted dimensions and concrete rewrite suggestions.
2. A local-first mobile architecture that keeps the core loop offline and treats AI as an optional enhancement.
3. An optional AI proxy that combines DeepSeek chat, Qwen embeddings and a small excellent-resume RAG index, with schema validation, JSON repair and local fallback.
4. A designed mobile product — onboarding, home, resume editor, JD analysis, result, job board, job detail, tracker, assistant and settings — rather than a wrapped desktop page.
5. A verified Capacitor Android build with native storage, document import, system bar integration, hardware back handling, filesystem export and haptics.

## 2. Related work and competitive analysis

| Product / category | Strength | Gap for this use case |
| --- | --- | --- |
| BOSS直聘, 实习僧 | Large job supply; direct recruiter chat | Discovery, not resume-to-JD diagnosis; no private local workflow |
| Jobscan | Strong ATS keyword comparison | Web/desktop, subscription-oriented, English-first |
| Teal | Job tracker and resume builder | Account required, web-first; less focused on a fast phone loop |
| 简历星球 and template tools | Templates and basic advice | Template-first, not JD-specific; no pipeline |
| Generic AI resume scanners | Fast score | Opaque score, generic advice, resume leaves the device |

Offer Catcher's differentiation is the combination of **JD-specific actionability**, **privacy-first local processing**, **mobile-first interaction design**, and **a pipeline that keeps the result alive**. The AI is explicitly optional and labelled; the local result is always available.

## 3. Requirements

### 3.1 Users and user stories

Primary persona: a final-year student applying to 20–40 roles in a semester, with one resume, a few projects and one internship, often browsing on a phone between classes.

| User story | Acceptance criterion |
| --- | --- |
| Import a resume | PDF/DOCX/TXT/Markdown is accepted, text is extracted and the profile is shown for correction |
| See whether a JD is worth applying to | Local score, five dimensions, matched/missing skills and a summary appear without network |
| Know what to change | At least three concrete suggestion cards with title and detail |
| Keep the resume private | Resume text is stored locally; AI keys are never in the client bundle |
| Track applications | Add/edit/delete records; statuses saved, applied, interview, offer, rejected |
| Ask questions | Assistant replies with AI when the proxy is reachable; local intent fallback otherwise |
| Work offline | Local analysis and tracker remain usable; AI failure is non-fatal |
| Back up data | JSON export through the native Filesystem plugin |

### 3.2 Functional requirements

- Resume import, parsing, editing, profile persistence.
- JD paste and bundled job selection; required/preferred skill extraction.
- Weighted local match; strengths, gaps, suggestions; score bands.
- Optional AI analysis with semantic score and merged suggestions.
- Job catalogue with search, field/type filters, save, detail.
- Application tracker with notes and status editing.
- Assistant chat with AI/local modes; starter prompts.
- Settings: AI toggle, proxy URL, connection test, data export, clear data.
- Native: document picker, preferences, network status, status bar, splash, back button, filesystem, haptics.

### 3.3 Non-functional requirements

- Core analysis < 100 ms on a mid-range phone.
- AI analysis should not block the local result; the UI must remain responsive.
- All AI output must be schema-validated; a failure must fall back to the local result.
- The app must survive process death and restore profile, analyses and tracker.
- The UI must handle empty, loading, error and offline states.
- No API keys or personal data in the repository or APK.

### 3.4 Scope

Out of scope for v1.0: camera capture/OCR, local/push notifications, native share sheet, cloud accounts/sync, iOS, live job-board scraping. These were explicit owner decisions. The remaining native integrations still exercise storage, networking, system UI, lifecycle, document access, filesystem and haptics.

## 4. Design

### 4.1 Architecture

~~~text
Capacitor Android shell
  React 19 + Vite 8 mobile UI (HashRouter)
    screens → Zustand + Preferences
             → local parser + match engine
             → API client ──────────────┐
    native: status bar, splash, back,   │
            network, filesystem, haptics│
                                        │ HTTP(S) / LAN
                              ┌─────────▼──────────┐
                              │ Express AI proxy   │
                              │  DeepSeek chat     │
                              │  Qwen embeddings   │
                              │  excellent-resume  │
                              │  RAG (JSON cache)  │
                              └────────────────────┘
~~~

The client owns the product state and the deterministic core. The proxy owns provider keys, prompt construction, validation and RAG. The proxy is optional infrastructure; the local result is the source of truth for the score, and AI can only refine the narrative and suggestions.

### 4.2 Data model

~~~text
profile: {
  name, email, phone, links, rawText, fileName, fileType,
  sections: {summary, education, experience, projects, skills, awards, campus, publications, other},
  skills: [{name, category}], yearsExperience, educationLevel, educationLabel,
  bullets, quantifiedCount, wordCount, completeness, updatedAt
}

analysis: {
  id, createdAt, jobId, jobTitle, company, jdText, jd,
  mode, score, band, summary, dimensions, matchedSkills, missingSkills,
  preferredMissing, strengths, gaps, suggestions, semanticScore, aiScore, meta
}

tracker: [{id, jobId, title, company, status, notes, appliedAt, createdAt, updatedAt}]

settings: {apiBaseUrl, aiEnabled, lastAiCheck}
~~~

Persisted through Zustand's persist middleware into Capacitor Preferences on Android and localStorage on the web. Analyses are capped at 30 and chat at 40 messages to keep storage bounded.

### 4.3 Local matching engine

The engine is deterministic and explainable.

| Dimension | Weight | Method |
| --- | --- | --- |
| Skills | 40% | Coverage of must-have skills (weight 1) and nice-to-have skills (weight 0.4), synonym-aware |
| Experience | 20% | Years vs requirement, plus overlap between experience/project text and JD skills |
| Education | 10% | Degree level vs requirement, with partial credit for one level below |
| Keywords | 15% | Coverage of JD keywords in the resume; ATS-oriented |
| Resume quality | 15% | Contact details, sections, quantified bullets, length |

The local score is the weighted sum, clamped to 0–100. Outputs include dimension scores, matched/missing skills, strengths, gaps and 3–6 suggestions. Suggestions are generated by rules, not an LLM, so they are reproducible and available offline.

When AI is available, the client blends the local score and AI score at **65% local / 35% AI**, keeps the semantic score separately, merges AI suggestions ahead of local ones, and labels the result as AI-enhanced. An invalid or empty AI response leaves the local result untouched.

### 4.4 AI proxy, embeddings and RAG

The Express proxy exposes:

| Endpoint | Purpose |
| --- | --- |
| GET /api/health | Model/config status, RAG stats |
| POST /api/ai/analyze | Resume + JD + local analysis → AI analysis, semantic score, examples |
| POST /api/ai/chat | Conversation + profile/context → reply |
| POST /api/ai/embed | Utility endpoint for embeddings |

Models: **deepseek-flash** for fast chat and analysis, with **deepseek-v4-pro** as a fallback when JSON repair fails; **qwen3.7-text-embedding** (1024-d) for semantic similarity and RAG.

Pipeline for analysis:

1. Validate and truncate resume/JD input.
2. Embed resume and JD; cosine similarity mapped to 0–100.
3. Retrieve the top two excellent-resume examples from a small RAG index (JSON cache; 7 chunks in the demo corpus).
4. Build a strict Chinese prompt with the local diagnosis as a reference.
5. Request JSON, extract it, repair occasional trailing-garbage output, validate the schema and clamp scores.
6. Return the AI result; the client merges it and labels it.

The local result is always shown first; the AI request runs in the background and updates the same analysis. This avoids a blank screen and makes a slow provider a non-event.

### 4.5 UI/UX design

The design direction is a **career field journal**: warm paper, ink, vermilion accent, sage success, serif display type, mono metadata and a recurring match ring. The four bottom tabs are 首页, 岗位, 助手 and 我的; analysis is a prominent action on home. Screens use generous radii, thin rules, a subtle grain and a single accent to avoid the generic "AI dashboard" look.

Key screens:

| Screen | Design intent |
| --- | --- |
| Welcome | Promise, privacy, two clear paths: import or sample |
| Home | Greeting, last match, stats, four quick actions, recent analyses, ranked jobs |
| Resume | Import zone, editable text, live profile preview, skills and completeness |
| Analyze | Choose a role or paste a JD, preview parsed requirements, one primary CTA |
| Result | Score ring, band, AI/local badge, dimensions, strengths, gaps, skill comparison, suggestion cards, tracker action |
| Jobs | Search, field/type filters, match scores, save |
| Job detail | Role information, quick match, analysis and tracker actions |
| Tracker | Summary counts, status filters, add/edit sheet, notes |
| Assistant | Chat with AI/local labels, starter prompts, job links |
| Settings | Profile, AI toggle/URL/test, data export/clear, privacy, about |

The layout is designed at 390 × 844 CSS px and verified at 360–412 px widths. The Android system bars are cream with dark icons; bottom navigation respects the gesture area.

### 4.6 Android integration

| Plugin / API | Use |
| --- | --- |
| @capacitor/preferences | Native local persistence |
| @capacitor/network | Offline banner and network state |
| @capacitor/status-bar | Cream status bar, dark icons |
| @capacitor/splash-screen | Branded launch screen |
| @capacitor/app | Hardware back button and lifecycle |
| @capacitor/filesystem | JSON export to Documents |
| @capacitor/haptics | Feedback on primary actions |
| WebView file input | Android document picker for PDF/DOCX |

The app targets SDK 36 with minSdk 24, uses Capacitor 8 and JDK 21, and is signed with a local release keystore that is excluded from git.

## 5. Implementation

### 5.1 Client

React 19 with Vite 8 and React Router 7 (HashRouter for the WebView). Zustand 5 holds profile, analyses, tracker, saved jobs, chat and settings; persistence uses a custom adapter that switches between Preferences and localStorage. The UI is a small design system (buttons, cards, chips, score ring, dimension bars, sheet, toast, empty state, skeleton) rather than a generic component library, which keeps the visual language consistent and the bundle small.

The main JS bundle is about 420 kB (134 kB gzip). PDF parsing (538 kB) and JSZip (96 kB) are dynamically imported only when needed; the PDF worker (1.3 MB) is a separate asset.

### 5.2 Resume and JD parsing

PDF text is extracted with pdfjs-dist (legacy build) in a Web Worker. DOCX is read with JSZip and the WordprocessingML XML inside, avoiding a Node Buffer polyfill. TXT/Markdown is read directly. The parser then identifies contact details, section headings (Chinese and English), education level, date ranges, skills from a curated synonym-aware dictionary, bullets and quantified results.

The JD parser extracts title, company, location, salary, required vs preferred skills (segment-level, so a line containing "优先" does not turn every skill into a nice-to-have), years, education and keywords. The parsed preview is shown before analysis so the user can see what the engine understood.

### 5.3 Matching and AI merging

The local engine is pure JavaScript and unit-tested. AI merging is defensive: invalid scores are ignored, suggestions are deduplicated by title, arrays are capped, and the local result remains the fallback. The AI prompt explicitly forbids inventing experience and asks for a strict JSON object; the proxy repairs trailing-garbage output and retries with a stronger model if needed.

### 5.4 AI proxy

The proxy is a small Express service with CORS restricted to localhost/LAN origins, helmet, a 2 MB JSON limit and an in-memory rate limit. It reads keys from the repository-root .env (git-ignored). A health endpoint reports whether chat and embedding are configured without exposing keys. The RAG index is built lazily from the excellent-resume text corpus, cached under backend/.cache, and skipped on failure.

Measured backend analysis latency with deepseek-flash and a warm RAG cache: about **8.5 s**. AI chat: about **2 s**. The client shows the local result immediately, so perceived latency is low.

### 5.5 Persistence and native behavior

Profile, analyses, tracker and chat are persisted after every meaningful change. A cold restart restores the home screen with the previous profile and tracker (verified). The hardware back button first closes an open sheet, then returns to the previous route, and exits from home. The Android theme sets cream status and navigation bars with light icons; the splash uses the brand mark on cream.

### 5.6 Build and signing

The Android project is generated by Capacitor and built with Gradle 8.14.3 and AGP 8.13.0 on JDK 21. A local keystore signs the release APK; keystore.properties and the .jks file are git-ignored. The debug build is 6.1 MB; the signed release APK is 4.3 MB and is copied to release/.

## 6. Evaluation

### 6.1 Unit tests

- **18 client tests** across resume parsing, JD parsing, matching, AI blending, ranking, local assistant and formatting.
- **10 proxy tests** across JSON extraction/repair, schema validation, cosine similarity and semantic mapping.

All pass. The tests caught real issues during development, including the pdfjs-dist 6 document cleanup change (loadingTask.destroy instead of doc.destroy), a false-positive JavaScript alias, and duplicate skill categories.

### 6.2 Web end-to-end

A Playwright mobile walkthrough (390 × 844, DPR 2) covered welcome, home, resume, analyze, result (local and AI-enhanced), jobs, job detail, tracker, assistant and settings. No console or page errors. Screenshots are in docs/assets/screens.

### 6.3 Android end-to-end

On a Pixel 3a API 35 emulator:

- APK installed, cold start, splash, cream system bars.
- Sample onboarding, home, job selection, local analysis, AI-enhanced analysis via adb reverse.
- Native document picker + PDF import (3,284 characters extracted).
- AI assistant reply; Markdown cleaned for display.
- Tracker add and status editing.
- Hardware back with sheet open (closes sheet) and on a pushed screen (navigates back).
- Force-stop and relaunch; profile, analyses and tracker restored.
- JSON export (25,519 bytes) to /sdcard/Documents; no secrets in the export.

A physical-device video is still required by the course and remains for the project owner; the emulator provides functional evidence in the meantime.

### 6.4 Performance

| Metric | Result |
| --- | --- |
| Local analysis | < 100 ms on emulator |
| AI analysis (backend, warm) | ~8.5 s |
| AI analysis in WebView (emulator) | ~22 s including health check; local result immediate |
| AI chat | ~2 s |
| Main bundle | 420 kB (134 kB gzip) |
| APK | 6.1 MB debug / 4.3 MB signed release |

### 6.5 Usability observations

- The 65/35 blend and separate AI/semantic scores avoid a misleading "AI oracle" score.
- The result screen's hierarchy (score → dimensions → strengths/gaps → skills → actions) matches the decision order.
- The offline banner is intentionally non-blocking; the app can still reach a local proxy through adb reverse or a LAN address, which is why the copy says "网络受限 · 本地分析可用" rather than disabling AI.
- The four-tab shell and single-accent visual system keep navigation legible on a small screen.

### 6.6 Security and privacy

- No provider key is present in the client bundle or APK.
- .env, keystore files and .env-adjacent material are git-ignored.
- Android backup is disabled for the app.
- The export JSON contains profile, analyses, tracker and settings but no keys; a grep for sk-/apiKey/secret returns no matches.
- CORS is restricted to localhost/LAN/Capacitor origins; rate limiting is in-memory.

## 7. Discussion and lessons

The most important product decision was to make the local engine the primary experience and the AI an optional layer. This made the physical-device demo resilient, kept the privacy story credible, and forced the team to design an explainable scoring model instead of hiding behind a prompt. The AI layer then adds what a local engine cannot: natural-language judgement and more specific rewriting advice.

The second decision was to remove the prototype's MySQL/COS/LanceDB stack. For a single-user mobile demo, those dependencies added deployment risk and did not improve the core loop. A small proxy with a JSON RAG cache was enough to demonstrate the architecture, and the local-first design means the app still works if the proxy is unavailable.

The UI direction — a field journal rather than a generic dashboard — was also a deliberate attempt to satisfy the course's "own thoughts in UI/UX" requirement. The result is recognisably not a template, while remaining readable and accessible.

## 8. Limitations

- The app has not yet been recorded on a physical phone; the emulator flow is verified.
- The job catalogue is sample data, not a live job board.
- The AI proxy is a single-user demo, not a multi-tenant production service; rate limiting is in-memory.
- PDF text extraction can lose spacing in some fonts (for example, "Blog" may become "B log"); the resume editor exists partly for this reason.
- OCR for scanned PDFs and camera capture are out of scope.
- No notifications/share sheet; the tracker is manual.
- The AI model can still produce plausible but incorrect suggestions; the UI labels AI content and keeps the local result visible.

## 9. Future work

1. Camera/OCR import for paper resumes and JD screenshots.
2. Local notifications for follow-up reminders and interview dates.
3. Native share sheet for a match card or a tailored resume summary.
4. A proper deployment of the AI proxy with HTTPS, per-user quotas and secret management.
5. A larger, verified job dataset or a legal job-board integration.
6. Resume export to PDF/DOCX with tracked changes.
7. A/B testing of the matching weights with real student outcomes.
8. iOS support through the same Capacitor project.

## 10. Conclusion

Offer Catcher delivers a complete, tested mobile workflow that turns a JD into an actionable match report while keeping the resume on the device. The local engine makes the core loop fast and offline-capable; the optional AI proxy adds semantic understanding and conversational help without becoming a single point of failure. The Android build verifies the platform integrations, and the product has the visual and interaction design of a real application rather than a student prototype. With a physical-device demo and the remaining course documents, it is ready for final submission.

## References

1. Android Developers. Guide to app architecture. https://developer.android.com/topic/architecture
2. Capacitor documentation. https://capacitorjs.com/docs
3. React documentation. https://react.dev
4. pdf.js. https://mozilla.github.io/pdf.js/
5. JSZip. https://stuk.github.io/jszip/
6. DeepSeek API documentation. https://api.deepseek.com
7. Alibaba Cloud Model Studio / DashScope. https://www.alibabacloud.com/en/product/modelstudio
8. Jobscan. https://www.jobscan.co
9. Teal. https://www.tealhq.com

## Appendix A — API endpoints

| Method | Path | Input | Output |
| --- | --- | --- | --- |
| GET | /api/health | — | chat/embedding status, RAG stats |
| POST | /api/ai/analyze | resumeText, jdText, job, local | AI analysis, semanticScore, examples |
| POST | /api/ai/chat | messages, profile, context | reply |
| POST | /api/ai/embed | texts | vectors |

## Appendix B — Requirement mapping

| Course requirement | Evidence |
| --- | --- |
| Android app on a physical device | Signed APK, emulator verification; physical video pending |
| Multiple Android platform features | Preferences, Network, StatusBar, SplashScreen, App back, Filesystem, Haptics, document picker |
| Non-trivial, complete product | Ten screens, local engine, optional AI, tracker, export |
| Humanitarian / monetisable | Accessible career coaching; freemium/university licence angle |
| Competitive analysis | Section 2 and proposal |
| Own UI/UX | Field-journal design system, screenshots |
| Software configuration management | Git history, design spec, tests, CI workflow |
| AI allowed but understood | Local engine is the source of truth; AI is optional, validated and labelled |
