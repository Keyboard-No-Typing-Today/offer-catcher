# Testing and verification

## Environment

| Item | Value |
| --- | --- |
| OS | Windows 11 (10.0.26100) |
| Node.js | 22.21.1 |
| npm | 10.9.4 |
| JDK | 21.0.12.1 (Eclipse Adoptium) |
| Android SDK | platform 36, build-tools 36.0.0 |
| Emulator | Pixel 3a, Android 15 / API 35, x86_64 |
| Chrome | system Chrome for Playwright mobile screenshots |
| AI proxy | local Express on port 3001; DeepSeek flash + Qwen embedding |

## Automated tests

### Client (Vitest)

~~~bash
npm --prefix frontend test
~~~

Result: **7 files, 23 tests passed**.

| File | Covers |
| --- | --- |
| resumeProfile.test.js | contact extraction, section split, skills, education, scoring inputs, empty input |
| jdParser.test.js | title/company, required vs preferred skills, education, location |
| matchEngine.test.js | weighted score, dimensions, suggestions, empty profile, AI blend, ranking, semantic mapping |
| roles.test.js | 10 corpus directions, 21 samples, 1024-d Qwen vectors, role-to-JD matching |
| localMentor.test.js | explicit named-direction answer, nearest-direction fallback |
| localAssistant.test.js | job recommendation, tracker summary, empty message |
| format.test.js | truncation, score labels, initials, date display |

### AI proxy (Node test runner)

~~~bash
npm --prefix backend test
~~~

Result: **10 tests passed**.

| File | Covers |
| --- | --- |
| deepseek.test.js | JSON extraction, markdown fences, trailing-garbage repair, invalid input |
| validate.test.js | AI output schema, score clamping, control characters, message slicing |
| embeddings.test.js | cosine similarity edge cases, semantic score mapping |

### Build

~~~bash
npm --prefix frontend run build
~~~

Result: success. Main bundle ≈ 513 kB (≈ 182 kB gzip, including Ant Design Mobile); PDF parser chunk ≈ 538 kB; JSZip chunk ≈ 96 kB; PDF worker ≈ 1.3 MB loaded only on import.

## Web end-to-end walkthrough

Playwright mobile viewport (390 × 844, DPR 2) exercised the v2 three-module app:

- onboarding (no mock sample button)
- paste a synthetic resume → real local parse → 10 direction rankings with Qwen semantic rank
- role detail with common points, matched/missing skills and rewrite suggestions
- assistant: AI reply from the proxy
- Markdown resume export + browser download (`OfferCatcher-Resume.md`)
- Me: JSON data export (`offer-catcher-export.json`, 10,374 characters), no console/page errors
- voice E2E with a fake audio device: record WAV → `/api/ai/transcribe` → DeepSeek ASR transcript inserted into the input

Result: **no console errors, no page errors**; screenshots in [assets/screens](assets/screens) (v2-*.png).

## Android verification (emulator, API 35)

Installed the **v2.0.2 signed release APK** (versionCode 5) on the API 35 emulator; proxy via **adb reverse tcp:3001 tcp:3001**.

| Check | Result |
| --- | --- |
| Cold start and splash | PASS — cream splash, app loads, splash hides |
| Status bar and navigation bar | PASS — cream bars, dark icons, gesture handle visible |
| Three-tab shell (Match / Assistant / Me) | PASS — Ant Design Mobile TabBar, routes switch correctly |
| Native v2 APK version | PASS — `versionCode 5`, `versionName 2.0.2`, signed |
| Native PDF picker | PASS — three PDFs visible in Downloads; PM imported |
| Real profile persistence | PASS — profile remains after force-stop/relaunch |
| Ant Design Mobile rendering in WebView | PASS — no page errors |
| Native PDF import | PASS — PM PDF selected from Downloads; profile parsed to 17 skills / 70% |
| AI resume context | PASS — reply references the imported PM project/internship/Deloitte evidence; no “resume missing” claim |
| Native Markdown save | PASS — Documents/OfferCatcher-Resume.md, 6,619 bytes; save action visible |
| Voice permission | PASS — recording starts after RECORD_AUDIO + MODIFY_AUDIO_SETTINGS; emulator host mic is silent so ASR reports no speech; full ASR path covered with generated WAV + fake mic |
| Me AI status | PASS — shows “AI 已连接” after mount health check |
| Evidence/semantic separation | PASS — PM evidence 60/100, semantic #3; no inflated score |
| JSON export | PASS — 20,380 bytes to Documents; no API keys |
| Hardware back | PASS for sheets and route navigation |
| Native PDF parser cleanup | Fixed — loadingTask.destroy() after pdfjs-dist 6 incompatibility |
| React 19 + antd-mobile crash | Fixed — downgraded to React 18.3, page errors eliminated |
| Android Bluetooth/netsimd emulator crash | Diagnosed as emulator-system issue, not app; Bluetooth disabled |

## Performance observations

| Metric | Observation |
| --- | --- |
| Local analysis | < 100 ms on the emulator |
| AI analyze (backend, cached RAG) | ~8.5 s for deepseek-flash |
| AI analyze in the WebView (emulator) | ~22 s including health check and rendering; local result is visible immediately |
| AI chat | ~2 s |
| APK size | ~4.39 MB signed release v2.0.2 |
| Cold start | Emulator ~3–5 s including splash; a physical device should be faster |

## Known limitations

- The role profiles are aggregated from 21 resumes (2–3 per direction), so they are a direction reference, not live job postings.
- OCR of JPG resumes introduces noise; PDF text is cleaner. Raw resumes are git-ignored.
- The AI proxy is a single-user demo service, not multi-tenant; rate limiting is in-memory.
- Native microphone capture is covered by the browser fake-audio E2E and the Android permission declaration, but a real-device voice recording remains part of the physical demo.
- PDF resume export is deferred; Markdown is the current P0 output.
- A physical-device video must still be recorded by the project owner; the emulator flow and APK are verified.

## Evidence

- Screenshots: [assets/screens](assets/screens)
- Design spec: [superpowers/specs/2026-11-24-offer-catcher-design.md](superpowers/specs/2026-11-24-offer-catcher-design.md)
- APK: [../release/OfferCatcher-v2.0.2.apk](../release/OfferCatcher-v2.0.2.apk)
