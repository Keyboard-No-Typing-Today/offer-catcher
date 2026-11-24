# Offer 捕手 (Offer Catcher) — Individual Project Proposal

**Course:** EE5415 Mobile Applications Design and Development, City University of Hong Kong
**Project type:** Individual project
**Author:** [Student Name / Student ID]
**Date:** November 2026

## 1. App name and one-line vision

**Offer 捕手 (Offer Catcher)** — paste a job description, get a concrete match report in seconds, and keep every application moving.

The app is a mobile-first, offline-first job-search copilot for students. It reads a resume, compares it with a target role, and returns a score, a five-part diagnosis, and a short list of specific edits. A lightweight pipeline then helps the student track what was saved, applied to, interviewed for, and rejected.

## 2. Problem

University students and fresh graduates apply to many roles with the same resume. Job boards optimise for **finding** postings, not for **deciding** whether a posting is worth tailoring a resume for, or for **showing what to change first**. Generic resume scanners return a score without a plan; desktop-first tools are awkward on a phone; many services upload the resume to an unknown server.

The result is a loop of low-quality applications: the student cannot see which requirements are actually missing, cannot prioritise edits, and loses track of follow-ups across chats and email.

## 3. Target users and needs

**Primary persona — "Lin", a final-year Computer Science student.**
- Applying to 20–40 internships and graduate roles in a semester.
- Has one resume, a few projects and one internship.
- Wants to know quickly whether a role is worth the tailoring effort.
- Does not want to upload a personal resume to another unknown website.
- Often checks opportunities on a phone, between classes.

**Needs**
1. A fast, mobile-first way to turn a JD into a match diagnosis.
2. Specific, actionable edits rather than a generic score.
3. A private place to keep the resume and application history.
4. A fallback when there is no reliable network.

**Secondary users** could include career-centre advisers helping students prioritise applications, and students switching between career fields (frontend, backend, product, design, data, testing, operations, algorithm, marketing, HR).

## 4. Key functionalities and user stories

| User story | Implementation |
| --- | --- |
| As a student, I want to import my resume so the app knows my background. | PDF/DOCX/TXT/Markdown import through the Android document picker; text extraction and section parsing on the device. |
| As a student, I want to correct bad PDF extraction. | Editable resume text with live re-parsing and a preview of skills, completeness and quantified results. |
| As a student, I want to paste a JD and see whether it is worth applying. | JD parser extracts required/preferred skills, years, education and location; a weighted local match engine produces a 0–100 score and five dimensions. |
| As a student, I want to know what to change, not just my score. | Strengths, gaps and 3–6 suggestion cards with concrete rewrite examples; an optional AI layer adds a semantic score and more specific suggestions. |
| As a student, I want to keep track of applications. | Saved → applied → interview → offer / rejected pipeline with notes and status editing. |
| As a student, I want to ask questions in natural language. | Assistant screen with AI-backed chat and a local intent fallback for job search, resume summary and tracker status. |
| As a privacy-conscious user, I want my resume to stay on my phone. | Local-first storage via Capacitor Preferences; AI keys live only on a proxy; the app works offline for the core loop. |
| As a student, I want a backup of my data. | JSON export through the native Filesystem plugin to the device Documents folder. |

## 5. User interface design

The design direction is a **career field journal**, not a generic blue dashboard:

- warm paper background, ink text, vermilion accent, sage success state;
- serif display type for headings, clean sans for body, mono labels for metadata;
- a match ring as the recurring visual motif;
- four bottom tabs: 首页 (home), 岗位 (jobs), 助手 (assistant), 我的 (profile/settings);
- every screen has loading, empty, error and offline states;
- Chinese UI copy, English code and documentation.

**Screen flow**

~~~text
Welcome → Import resume → Home
Home → Analyze JD → Result (local) → AI enhancement
Home → Jobs → Job detail → Analyze
Home → Tracker → Add/edit application
Home → Assistant → Chat
Home → Settings → AI connection / export / clear data
~~~

**Draft screens**

| Screen | Purpose |
| --- | --- |
| Welcome | Promise, privacy note, import or sample path |
| Home | Greeting, last match, stats, quick actions, recent analyses, ranked jobs |
| Resume | Import/edit, parsed profile, skills, completeness |
| Analyze | Choose a job or paste a JD, preview parsed requirements |
| Result | Score ring, dimension bars, strengths, gaps, skill comparison, suggestion cards, tracker action |
| Jobs | Search and field/type filters, match scores, saved jobs |
| Job detail | Role information, quick match, analysis CTA, tracker CTA |
| Tracker | Status summary, filters, add/edit records, notes |
| Assistant | Chat with AI or local intent handling, starter prompts |
| Settings | Profile, AI service URL/toggle/test, export, clear data, privacy |

Screenshots are in [assets/screens](assets/screens).

## 6. Market research and competitive analysis

| Product / category | Strength | Gap for this use case |
| --- | --- | --- |
| BOSS直聘 / 实习僧 | Large job supply, direct chat with recruiters | Job discovery, not resume-to-JD diagnosis; no private local resume workflow |
| Jobscan | Strong ATS keyword comparison | Desktop/web, subscription-oriented, English-first; not a mobile-first student product |
| Teal | Job tracker + resume builder | Web-first, account required; less emphasis on a fast phone workflow |
| 简历星球 / 简历模板工具 | Resume templates and basic suggestions | Template-first, not JD-specific; no application pipeline |
| Generic AI resume scanners | Fast score | Opaque score, generic advice, resume uploaded to a server |

**Differentiation**

1. **JD-to-action, not just a score.** Every diagnosis ends with a small number of concrete edits.
2. **Privacy-first local core.** Resume parsing and matching run on the device; AI is optional and proxied through a service the student controls.
3. **Mobile-native workflow.** Designed for one hand, one thumb, and short sessions between classes.
4. **A pipeline, not a one-off scan.** The result connects to a saved role and an application status.
5. **Honest about AI.** The local result is always available; the app labels whether a result is local or AI-enhanced.

**Humanitarian / monetisable angle**

- Humanitarian: lowers the information and confidence gap for first-generation and non-target-university students who cannot afford private career coaching.
- Monetisable: a freemium model could offer unlimited local analyses for free and a paid AI coaching tier / university career-centre licence.

## 7. Scope

**In scope for v1.0**
- Resume import and local parsing.
- JD import via paste or bundled sample roles.
- Local weighted matching engine with explainable dimensions.
- Optional AI analysis and chat through a self-hosted proxy.
- Application tracker.
- Local persistence, native document picker, back button, status bar, splash, network status, haptics, JSON export.
- Android APK, web build, tests, design/report/marketing docs.

**Out of scope for v1.0**
- Camera capture / OCR.
- Local or push notifications.
- Native share sheet.
- Cloud accounts, sync, or a multi-user production backend.
- Live job-board scraping.
- iOS.

These exclusions were explicit project-owner decisions; the remaining Android integrations still cover storage, networking, system UI, lifecycle, document access, filesystem and haptics.

## 8. Technical approach

- **Client:** React 19 + Vite 8, React Router 7, Zustand 5, Lucide icons; mobile-first CSS design system.
- **Native shell:** Capacitor 8, Android SDK 36, minSdk 24, JDK 21, Gradle 8.14.3 / AGP 8.13.0.
- **Local parsing:** pdfjs-dist for PDF text extraction; JSZip + WordprocessingML XML for DOCX; custom section/skill/JD parsers.
- **Local matching:** weighted dimensions — skills 40%, experience 20%, education 10%, keywords 15%, resume quality 15%; outputs score, strengths, gaps and suggestions.
- **AI proxy:** Node.js 22 + Express; DeepSeek chat (deepseek-flash, fallback deepseek-v4-pro); Qwen text embeddings (qwen3.7-text-embedding, 1024-d); compact excellent-resume RAG index. Strict JSON schema, repair and fallback; keys server-side only.
- **Storage:** Capacitor Preferences on Android, localStorage on web; analyses, tracker and chat persisted locally.
- **Build/test:** Vitest, Node test runner, Playwright for web walkthrough, adb + WebView DevTools for native verification.

## 9. Evaluation plan

- Unit tests for parsers, matching, AI blending, validation and JSON repair.
- Web mobile-viewport walkthrough of every route with console-error checks.
- Android emulator: install, cold start, native PDF import, local analysis, AI-enhanced analysis via adb reverse, assistant, tracker, back button, persistence, export.
- Performance: local analysis latency, AI latency, bundle sizes, APK size.
- Usability: empty/loading/error/offline states; one-hand navigation; clear score/action hierarchy.

## 10. Timeline

| Stage | Work |
| --- | --- |
| Week 7 | Proposal, competitive analysis, wireframes, design system |
| Weeks 8–10 | Local parsers, matching engine, mobile screens, tracker, persistence |
| Weeks 11–12 | AI proxy, embeddings/RAG, native integrations, Android build, device testing |
| Week 13 | Testing, bug fixes, performance, final report, marketing README |
| Week 14 | Signed APK, demo video, slides, submission |

The implementation is complete as of this submission; physical-device video recording remains for the project owner.

## 11. References

- Android Developers. Guide to app architecture. https://developer.android.com/topic/architecture
- Capacitor documentation. https://capacitorjs.com/docs
- React documentation. https://react.dev
- pdf.js. https://mozilla.github.io/pdf.js/
- DeepSeek API documentation. https://api.deepseek.com
- Alibaba Cloud Model Studio / DashScope. https://www.alibabacloud.com/en/product/modelstudio
- Jobscan. https://www.jobscan.co
- Teal. https://www.tealhq.com
