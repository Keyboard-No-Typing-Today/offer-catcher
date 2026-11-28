# Offer 捕手 (Offer Catcher) — Final Report

**Course:** EE5415 Mobile Applications Design and Development, City University of Hong Kong
**Project:** Individual project
**Author:** [Student Name / Student ID]
**Version:** 2.0.2
**Date:** November 2026

## Abstract

Offer Catcher v2.0 is a three-module, local-first Android career assistant built with React 18, Capacitor 8, and Ant Design Mobile. **Match** imports a resume and ranks ten direction profiles derived from 21 anonymised resumes, using local matching plus Alibaba Cloud Qwen embeddings. **Assistant** answers questions with resume context, accepts voice input through DeepSeek ASR, and exports a recommended Markdown resume. **Me** handles AI settings, local data export and privacy. The app deliberately replaces the earlier mock job catalogue with an evidence-based, corpus-derived profile layer; Markdown export is P0, while HTML-to-PDF is explicitly deferred as the next step.

The project contributes (1) a deterministic, explainable local matching engine for student resumes; (2) a privacy-preserving optional-AI architecture with strict JSON validation and graceful fallback; (3) a mobile-first design that avoids the desktop-dashboard-in-a-WebView failure mode; and (4) a verified Android build with native storage, document picker, network awareness, status bar, splash, back-button handling, filesystem export and haptics.

## 1. Introduction

### 1.1 Motivation

Students applying for internships and graduate roles face a volume problem and a feedback problem. A single resume is sent to dozens of roles; job boards optimise discovery, not the decision of whether a particular posting is worth tailoring a resume for, or what to change first. Generic resume scanners return a score without a plan. Desktop-first tools are awkward on a phone. Many services require uploading a personal resume to an unknown server.

The project asks a narrower question than "find me a job": **given my resume and this JD, is it worth applying, and what should I change first?** The answer should fit in a short mobile session, should be explainable, and should not require surrendering the resume.

### 1.2 Contributions

1. A local, explainable match engine with five weighted dimensions and concrete rewrite suggestions.
2. A local-first mobile architecture that keeps the core loop offline and treats AI as an optional enhancement.
3. An optional AI proxy that combines DeepSeek chat, Qwen embeddings and a small excellent-resume RAG index, with schema validation, JSON repair and local fallback.
4. A three-module mobile product — Match, Assistant and Me — built with Ant Design Mobile instead of a wrapped desktop dashboard.
5. A resume-corpus pipeline that turns 21 user-provided resumes into ten anonymised direction profiles with Qwen embeddings, and a voice-enabled assistant with Markdown resume export.
6. A verified Capacitor Android v2.0.2 build with native storage, document import, system bar integration, hardware back handling, filesystem export and haptics.

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
| Find a direction | Rank 10 direction profiles derived from the 21-resume corpus; show score, common points and skill gaps |
| Ask questions | Assistant replies with AI using resume context; local fallback otherwise |
| Use voice | Record a question and insert the DeepSeek ASR transcript into the input |
| Export a resume | Generate a Markdown resume and save/download it |
| Work offline | Local parsing/matching and local assistant remain usable; AI failure is non-fatal |
| Back up data | JSON export through the native Filesystem plugin |

### 3.2 Functional requirements

- Resume import, local parsing and profile persistence.
- Ten corpus-derived direction profiles; local five-dimension match + Qwen embedding semantic ranking.
- Direction detail: common points, matched/missing skills, requirements and rewrite suggestions.
- Assistant: resume-aware Q&A, AI/local modes, voice input, Markdown resume export.
- Me: AI toggle, proxy URL, connection test, JSON export, clear/reset, privacy and version.
- Native: document picker, preferences, status bar, splash, back button, filesystem, haptics, microphone permission.

### 3.3 Non-functional requirements

- Core analysis < 100 ms on a mid-range phone.
- AI analysis should not block the local result; the UI must remain responsive.
- All AI output must be schema-validated; a failure must fall back to the local result.
- The app must survive process death and restore the profile, chat and settings.
- The UI must handle empty, loading, error and offline states.
- No API keys or personal data in the repository or APK.

### 3.4 Scope

Out of scope for v2.0: camera capture/OCR, local/push notifications, native share sheet, cloud accounts/sync, iOS, live job-board scraping and PDF resume export. These are explicit owner decisions. HTML-to-PDF resume generation is a next-step item, not P0: PDF layout/font tuning per candidate is dirty work, while Markdown fully preserves the content and is portable. The remaining native integrations still exercise storage, networking, system UI, lifecycle, document access, microphone permission, filesystem and haptics.

### 3.5 v2.0 three-module scope

| Module | Scope |
| --- | --- |
| Match | Import a real resume; parse locally; rank 10 corpus-derived direction profiles; show five dimensions, matched/missing skills, common points and rewrite suggestions |
| Assistant | Resume-aware Q&A; AI/local fallback; DeepSeek ASR voice input; Markdown resume export |
| Me | AI toggle and proxy test; JSON data export; clear/reset; privacy and data-source information |

Mock job records and the v1 tracker are no longer part of the main flow. The direction profiles are explicitly labelled as a direction reference, not live job postings.

## 4. Design

### 4.1 Architecture

~~~text
Capacitor Android shell
  React 18.3 + Vite 8 + Ant Design Mobile
    three tabs: Match / Assistant / Me
    Zustand + Capacitor Preferences
      → local parser + five-dimension match
      → role-profile vectors (Qwen 1024-d)
      → API client ───────────────────┐
    native: status bar, splash, back,  │
            filesystem, haptics, mic   │
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

roleProfile: {
  id, field, label, sampleCount, summary, topSkills, experienceThemes,
  keyPoints, requirements, keywords, education, embedding[1024], source
}

chatMessage: {id, role, content, mode, createdAt}

settings: {apiBaseUrl, aiEnabled, lastAiCheck}
~~~

Persisted through Zustand's persist middleware into Capacitor Preferences on Android and localStorage on the web. Profile, chat and settings are restored; chat is capped at 40 messages. The ten role profiles and their Qwen vectors are bundled in shared/role-profiles.json, not persisted per user.

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
3. If an excellent-resume RAG corpus is present, retrieve the top two examples from the cached index; if the corpus is empty, skip this step without failing the analysis.
4. Build a strict Chinese prompt with the local diagnosis as a reference.
5. Request JSON, extract it, repair occasional trailing-garbage output, validate the schema and clamp scores.
6. Return the AI result; the client merges it and labels it.

The local result is always shown first; the AI request runs in the background and updates the same analysis. This avoids a blank screen and makes a slow provider a non-event.

### 4.5 UI/UX design

The v2 design direction is a **career field journal** rendered with **Ant Design Mobile 5.43**: warm paper, ink, vermilion accent, sage success, serif display type and mono metadata. The app has exactly three tabs — **匹配 (Match)**, **助手 (Assistant)** and **我的 (Me)**. The theme is customised through Ant Design Mobile's CSS variables (primary, box, border, text, background) rather than accepting the default blue admin look.

| Module | Design intent |
| --- | --- |
| Match | Onboarding with real file/paste import; profile card; best-fit card; ranked direction list; detail sheet with dimensions, common points, matched/missing skills and rewrite actions |
| Assistant | Calm chat surface; AI/local connection badge; starter prompts; Markdown export sheet; voice button with recording state |
| Me | Profile summary; AI settings; JSON export; clear/reset; privacy and data provenance |

The layout is designed at 390 × 844 CSS px and verified at 360–412 px widths. The Android system bars are cream with dark icons; bottom navigation respects the gesture area. React 18.3 is used intentionally because Ant Design Mobile v5 does not support React 19's removal of unmountComponentAtNode; the first integration produced a page error on React 19 and was fixed by the downgrade.

### 4.6 Android integration

| Plugin / API | Use |
| --- | --- |
| @capacitor/preferences | Native local persistence |
| @capacitor/status-bar | Cream status bar, dark icons |
| @capacitor/splash-screen | Branded launch screen |
| @capacitor/app | Hardware back button and lifecycle |
| @capacitor/filesystem | JSON export to Documents |
| @capacitor/haptics | Feedback on primary actions |
| WebView file input | Android document picker for PDF/DOCX |
| RECORD_AUDIO + MODIFY_AUDIO_SETTINGS | Microphone capture for DeepSeek ASR voice input in the WebView |

The app targets SDK 36 with minSdk 24, uses Capacitor 8 and JDK 21, and is signed with a local release keystore that is excluded from git.

### 4.7 Corpus-derived profiles, Qwen embeddings and the assistant

The v1 job catalogue was hand-authored sample data, and the v1 demo used a SAMPLE_RESUME. That was the wrong product logic. In v2, the matching targets come from the user's own provided resume corpus:

1. 21 resumes (18 JPG screenshots + 3 PDFs) were grouped into ten directions.
2. PDFs were parsed with pypdf; JPGs were OCR'd with Tesseract chi_sim+eng.
3. Contact data was stripped; each direction was summarised by DeepSeek into common skills, experience themes, key points, requirements and keywords.
4. Each direction profile was embedded with Alibaba Cloud DashScope qwen3.7-text-embedding (1024 dimensions); vectors are shipped in shared/role-profiles.json.
5. At runtime the candidate resume is embedded once through /api/ai/embed; cosine similarity against the ten vectors produces a semantic rank. The local five-dimension evidence score is the displayed match score and determines recommendation order. The semantic rank is shown separately as a direction reference; it does not inflate the evidence score. Local-only fallback applies when embeddings are unavailable.

This removes mock jobs from the primary flow and gives every recommendation a traceable data source. Raw resumes and OCR text stay local; only anonymised aggregate profiles and vectors are committed.

**Assistant.** The assistant receives the parsed profile and top direction context. With the proxy it calls DeepSeek chat; without it, a local mentor fallback answers from the profile and local match results. It can generate a Markdown resume from the parsed sections and target direction, save it to the Android Documents directory (Filesystem) or download it on the web.

**QA pass (v2.0.2 findings).** A full emulator walkthrough found and fixed five issues: (1) the local fallback ignored an explicitly named direction and listed the three nearest directions; (2) the AI prompt only received a one-line profile and claimed the resume text was missing, so it could not reference project evidence; (3) the Markdown export put the save button after a nested scrollable TextArea, making it effectively unreachable on a phone — the preview is now a bounded scrollable pre block with action buttons visible; (4) the Me page stayed at “未检测” even when the assistant was connected — it now checks health on mount; (5) the blended semantic score inflated “evidence” (a 21/100 skill match could become 71/100), so the local evidence score is now the displayed score and the Qwen rank is a separate reference. A bottom spacer also prevents the last chat bubble from being hidden behind the fixed composer. (6) Native voice recording exposed that WebView audio capture needs both RECORD_AUDIO and MODIFY_AUDIO_SETTINGS; the latter was added and recording now starts on the emulator. The emulator host microphone is silent, so ASR returns “no speech” there; the full audio → DeepSeek ASR path is verified with generated audio and fake-microphone browser tests.

**Named direction handling.** A bug report exposed that the local fallback ignored an explicitly named direction (for example, “help me improve my resume for the algorithm engineer direction”) and listed the three nearest directions instead. The local mentor now detects a named role, returns that direction's local score plus exactly three gap actions, and never silently substitutes a different direction. The same request is also sent to the AI with the full ten-direction context. Regression tests cover both the explicit-direction and nearest-direction cases.

**Voice.** The client records 16-bit PCM WAV through getUserMedia + AudioContext, caps recording at 60 seconds, and sends base64 audio to /api/ai/transcribe. The Express route forwards the file to DeepSeek's official ASR endpoint (/v1/tools/asr); the transcript is inserted into the chat input. The Android manifest declares RECORD_AUDIO. The ASR request is stateless and the audio is not persisted.

**Markdown vs PDF.** The assistant exports Markdown, not PDF. PDF generation usually means rendering an HTML/CSS resume to PDF and then tuning page breaks, fonts and per-candidate content; that is dirty work and explicitly not P0. Markdown preserves all content, is editable and portable, and can be converted later. A template-driven HTML-to-PDF exporter is listed in Future Work.

## 5. Implementation

### 5.1 Client

React 18.3 with Vite 8, React Router 7 (HashRouter for the WebView), Zustand 5 and Ant Design Mobile 5.43. Zustand holds profile, chat and settings; persistence uses a Capacitor Preferences/localStorage adapter. Ant Design Mobile supplies the interaction primitives (Button, Card, List, Popup, TextArea, Toast, Dialog, Switch, Tag, ProgressBar) while a small custom CSS layer keeps the cream/ink field-journal identity. The deliberate React 18 downgrade avoids React 19's breaking removal of unmountComponentAtNode, which antd-mobile v5 still uses for imperative overlays.

The main JS bundle is about 420 kB (134 kB gzip). PDF parsing (538 kB) and JSZip (96 kB) are dynamically imported only when needed; the PDF worker (1.3 MB) is a separate asset.

### 5.2 Resume and JD parsing

PDF text is extracted with pdfjs-dist (legacy build) in a Web Worker. DOCX is read with JSZip and the WordprocessingML XML inside, avoiding a Node Buffer polyfill. TXT/Markdown is read directly. The parser then identifies contact details, section headings (Chinese and English), education level, date ranges, skills from a curated synonym-aware dictionary, bullets and quantified results.

The JD parser extracts title, company, location, salary, required vs preferred skills (segment-level, so a line containing "优先" does not turn every skill into a nice-to-have), years, education and keywords. The parsed preview is shown before analysis so the user can see what the engine understood.

### 5.3 Matching and AI merging

The local engine is pure JavaScript and unit-tested. AI merging is defensive: invalid scores are ignored, suggestions are deduplicated by title, arrays are capped, and the local result remains the fallback. The AI prompt explicitly forbids inventing experience and asks for a strict JSON object; the proxy repairs trailing-garbage output and retries with a stronger model if needed.

### 5.4 AI proxy

The proxy is a small Express service with CORS restricted to localhost/LAN origins, helmet, a 12 MB JSON limit (for base64 WAV upload), an in-memory rate limit, and stateless ASR forwarding to DeepSeek /v1/tools/asr. It reads keys from the repository-root .env (git-ignored). A health endpoint reports whether chat and embedding are configured without exposing keys. The RAG index is optional: built lazily from the excellent-resume text corpus when present, cached under backend/.cache, and skipped when empty or unavailable.

Measured backend analysis latency with deepseek-flash: about **8.5–9.0 s**. AI chat: about **2 s**. The client shows the local result immediately, so perceived latency is low.

### 5.5 Persistence and native behavior

Profile, chat and settings are persisted after every meaningful change. A cold restart restores the Match module with the previous profile and the last chat. The hardware back button first closes an open sheet, then returns to the previous route, and exits from Match. The Android theme sets cream status and navigation bars with dark icons; the splash uses the brand mark on cream. The Android theme sets cream status and navigation bars with light icons; the splash uses the brand mark on cream.

### 5.6 Build and signing

The Android project is generated by Capacitor and built with Gradle 8.14.3 and AGP 8.13.0 on JDK 21. A local keystore signs the release APK; keystore.properties and the .jks file are git-ignored. The v2.0.2 signed release APK is ~4.39 MB (versionCode 5) and is copied to release/OfferCatcher-v2.0.2.apk.

## 6. Evaluation

### 6.1 Unit tests

- **23 client tests** across resume parsing, JD parsing, matching, AI blending, role profiles (10 directions, 21 samples, 1024-d vectors), local mentor intent handling and formatting.
- **10 proxy tests** across JSON extraction/repair, schema validation, cosine similarity and semantic mapping.
- Backend ASR smoke test: a generated 16-bit WAV was transcribed by DeepSeek ASR (HTTP 200, correct English transcript, duration 5,969 ms).

All pass. The tests caught real issues during development, including the pdfjs-dist 6 document cleanup change (loadingTask.destroy instead of doc.destroy), a false-positive JavaScript alias, duplicate skill categories, and the React 19/antd-mobile overlay incompatibility.

### 6.2 Web end-to-end

A Playwright mobile walkthrough (390 × 844, DPR 2) covered the v2 onboarding, real PDF import, direction ranking, role detail, assistant chat, Markdown download and Me data export. No console or page errors. Voice was tested end-to-end with a fake audio device: the browser recorded WAV, the backend called DeepSeek ASR, and the transcript was inserted into the chat input. Screenshots are in docs/assets/screens (v2-*.png).

### 6.3 Android end-to-end

On a Pixel 3a API 35 emulator:

- v2.0.2 APK installed on Pixel 3a API 35 (versionCode 5, versionName 2.0.2).
- Three-tab shell (Match/Assistant/Me), cold start, long-press-free navigation.
- Native PDF picker imported the PM resume (17 skills, 70% completeness); role-profile matching and profile persistence verified across restart.
- Ant Design Mobile layout renders correctly in the Android WebView.
- AI reply after the prompt fix references the imported PM project evidence (knowledge-base system, internship, Deloitte), instead of claiming the resume is missing.
- Native Markdown save wrote Documents/OfferCatcher-Resume.md (6,619 bytes); the save button is visible without nested scrolling.
- Native voice recording starts after adding MODIFY_AUDIO_SETTINGS; the emulator host mic is silent, so ASR reports no speech. Full audio → ASR is covered by generated-WAV and fake-microphone tests.
- Me page auto-detects and displays “AI 已连接” instead of staying at “未检测”.
- Evidence score / semantic rank are now shown separately (PM example: 60/100 evidence, semantic #3), avoiding the earlier 21-skill / 71-score contradiction.
- JSON export (20,380 bytes) contains the profile and no API keys.
- Hardware back with sheets open and route navigation verified.

A physical-device video is still required by the course and remains for the project owner; the emulator provides functional evidence in the meantime.

### 6.4 Performance

| Metric | Result |
| --- | --- |
| Local analysis | < 100 ms on emulator |
| AI analysis (backend, warm) | ~8.5 s |
| AI analysis in WebView (emulator) | ~22 s including health check; local result immediate |
| AI chat | ~2 s |
| Main bundle | ~513 kB (182 kB gzip, includes Ant Design Mobile) |
| APK | ~4.39 MB signed release v2.0.2 |

### 6.5 Usability observations

- The 65/35 blend and separate AI/semantic scores avoid a misleading "AI oracle" score.
- The result screen's hierarchy (score → dimensions → strengths/gaps → skills → actions) matches the decision order.
- The assistant labels AI vs local mode; the old OS-level offline banner was removed in v2 because adb reverse/local proxy makes "no internet" a misleading signal.
- The three-tab Ant Design Mobile shell and single-accent visual system keep navigation legible on a small screen.

### 6.6 Security and privacy

- No provider key is present in the client bundle or APK.
- .env, keystore files and .env-adjacent material are git-ignored.
- Android backup is disabled for the app.
- The export JSON contains profile, chat and settings but no keys; a grep for sk-/apiKey/secret returns no matches.
- CORS is restricted to localhost/LAN/Capacitor origins; rate limiting is in-memory.

## 7. Discussion and lessons

The most important product decision was to make the local engine the primary experience and the AI an optional layer. This made the physical-device demo resilient, kept the privacy story credible, and forced the team to design an explainable scoring model instead of hiding behind a prompt. The AI layer then adds what a local engine cannot: natural-language judgement and more specific rewriting advice.

The second decision was to remove the prototype's MySQL/COS/LanceDB stack. For a single-user mobile demo, those dependencies added deployment risk and did not improve the core loop. A small proxy with a JSON RAG cache was enough to demonstrate the architecture, and the local-first design means the app still works if the proxy is unavailable.

The UI direction — a field journal rather than a generic dashboard — was also a deliberate attempt to satisfy the course's "own thoughts in UI/UX" requirement. The result is recognisably not a template, while remaining readable and accessible.

## 8. Limitations

- The app has not yet been recorded on a physical phone; the emulator flow is verified.
- The role profiles are aggregated from 21 resumes (2–3 per direction), so they are a direction reference, not a live job board and not statistically representative.
- OCR of JPG screenshots introduces noise; PDF text is cleaner. The profile summaries can inherit OCR errors.
- The AI proxy is a single-user demo, not a multi-tenant production service; rate limiting is in-memory.
- PDF resume export is deliberately deferred; Markdown is the current output.
- No notifications, camera or native share sheet.
- The AI model can still produce plausible but incorrect suggestions; the UI labels AI content and keeps the local result visible.
- A physical-device demo video is still required by the course and remains for the project owner.

## 9. Future work

1. Camera/OCR import for paper resumes and JD screenshots.
2. Local notifications for follow-up reminders and interview dates.
3. Native share sheet for a match card or a tailored resume summary.
4. A proper deployment of the AI proxy with HTTPS, per-user quotas and secret management.
5. A larger, verified job dataset or a legal job-board integration.
6. A template-driven HTML-to-PDF resume exporter (per-candidate typography and pagination tuning is the main reason it is deferred).
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
6. DeepSeek API documentation (chat and ASR). https://api.deepseek.com
7. Alibaba Cloud Model Studio / DashScope (Qwen embedding). https://www.alibabacloud.com/en/product/modelstudio
8. Ant Design Mobile. https://mobile.ant.design/
8. Jobscan. https://www.jobscan.co
9. Teal. https://www.tealhq.com

## Appendix A — API endpoints

| Method | Path | Input | Output |
| --- | --- | --- | --- |
| GET | /api/health | — | chat/embedding status, RAG stats |
| POST | /api/ai/analyze | resumeText, jdText, job, local | AI analysis, semanticScore, examples |
| POST | /api/ai/chat | messages, profile, context | reply |
| POST | /api/ai/embed | texts | vectors |
| POST | /api/ai/transcribe | base64 WAV + mimeType | DeepSeek ASR transcript, duration |

## Appendix B — Requirement mapping

| Course requirement | Evidence |
| --- | --- |
| Android app on a physical device | Signed APK, emulator verification; physical video pending |
| Multiple Android platform features | Preferences, StatusBar, SplashScreen, App back, Filesystem, Haptics, document picker, microphone permission |
| Non-trivial, complete product | Three modules, corpus-derived profiles, local engine, Qwen embedding, AI assistant, voice, Markdown export, data export |
| Humanitarian / monetisable | Accessible career coaching; freemium/university licence angle |
| Competitive analysis | Section 2 and proposal |
| Own UI/UX | Ant Design Mobile + custom cream/ink field-journal theme |
| Software configuration management | Git history, design spec, tests, CI workflow |
| AI allowed but understood | Local engine is the source of truth; Qwen embedding ranks directions; DeepSeek chat/ASR are optional, validated and labelled |
