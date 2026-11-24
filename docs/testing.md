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

Result: **5 files, 18 tests passed**.

| File | Covers |
| --- | --- |
| resumeProfile.test.js | contact extraction, section split, skills, education, scoring inputs, empty input |
| jdParser.test.js | title/company, required vs preferred skills, education, location |
| matchEngine.test.js | weighted score, dimensions, suggestions, empty profile, AI blend, ranking, semantic mapping |
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

Result: success. Main bundle ≈ 420 kB (≈ 134 kB gzip); PDF parser chunk ≈ 538 kB; JSZip chunk ≈ 96 kB; PDF worker ≈ 1.3 MB loaded only on import.

## Web end-to-end walkthrough

Playwright mobile viewport (390 × 844, DPR 2) opened every route:

- welcome → sample → home
- resume editor
- analyze JD
- result (local, then AI-enhanced after ~15 s)
- job board
- job detail
- tracker
- assistant (AI reply)
- settings

Result: **no console errors, no page errors**; screenshots in [assets/screens](assets/screens).

## Android verification (emulator, API 35)

Installed the debug APK with adb, mapped the proxy with **adb reverse tcp:3001 tcp:3001**, and exercised the app over the WebView DevTools protocol.

| Check | Result |
| --- | --- |
| Cold start and splash | PASS — cream splash, app loads, splash hides |
| Status bar and navigation bar | PASS — cream bars, dark icons, gesture handle visible |
| Sample onboarding → home | PASS |
| Data persistence across force-stop/relaunch | PASS — profile, analyses and tracker restored from Preferences |
| Native document picker → PDF import | PASS — 3,284 characters extracted from a 2-page PDF |
| Local analysis | PASS — result appears immediately |
| AI enhancement via localhost reverse | PASS — AI badge, semantic score, merged suggestions after ~22 s on the emulator |
| Assistant chat | PASS — AI reply rendered, Markdown cleaned |
| Tracker add | PASS — new record appears in the list |
| Hardware back with sheet open | PASS — sheet closes, route stays |
| Hardware back on a pushed screen | PASS — returns to the previous route |
| JSON export via Filesystem | PASS — 25,519-byte file in /sdcard/Documents |
| Export contains no API keys | PASS — a grep for sk-/apiKey/secret returns 0 matches |
| Native PDF parser cleanup | Fixed — replaced doc.destroy() with loadingTask.destroy() after pdfjs-dist 6 incompatibility |
| Scroll reset between routes | Fixed — added ScrollToTop; screens no longer start mid-page |
| Tracker filter/header overlap | Fixed — moved the Add action into the top bar |
| Navigation bar color | Fixed — theme sets cream navigation bar and light icons |

## Performance observations

| Metric | Observation |
| --- | --- |
| Local analysis | < 100 ms on the emulator |
| AI analyze (backend, cached RAG) | ~8.5 s for deepseek-flash |
| AI analyze in the WebView (emulator) | ~22 s including health check and rendering; local result is visible immediately |
| AI chat | ~2 s |
| APK size | 6.1 MB debug / 4.3 MB signed release |
| Cold start | Emulator ~3–5 s including splash; a physical device should be faster |

## Known limitations

- The offline banner reflects the OS network state; the AI proxy can still be reachable through adb reverse or the LAN, which is why the banner says "网络受限 · 本地分析可用" rather than blocking AI.
- The AI proxy is a single-user demo service, not multi-tenant; rate limiting is in-memory.
- The job catalogue is bundled sample data and is labelled in the app.
- A physical-device video must still be recorded by the project owner; the emulator flow and APK are verified.

## Evidence

- Screenshots: [assets/screens](assets/screens)
- Design spec: [superpowers/specs/2026-11-24-offer-catcher-design.md](superpowers/specs/2026-11-24-offer-catcher-design.md)
- APK: [../release/OfferCatcher-v1.1.0.apk](../release/OfferCatcher-v1.1.0.apk)
