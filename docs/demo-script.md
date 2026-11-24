# Demo video script (4–5 minutes)

Target: a single continuous screen recording on a physical Android device. Use the signed APK in release/. Keep the phone connected by USB and run **adb reverse tcp:3001 tcp:3001** with the AI proxy running; if you prefer Wi-Fi, set the proxy address in Settings to the laptop LAN IP.

## Before recording

- Install release/OfferCatcher-v1.0.0.apk.
- Start the proxy: npm --prefix backend run dev.
- adb reverse tcp:3001 tcp:3001.
- Clear app data once if you want a clean onboarding: adb shell pm clear hk.cityu.ee5415.offercatcher.
- Set screen brightness high; enable Do Not Disturb; use 1080p/60 if possible.
- Close other apps and notification banners.

## Shot list

### 0:00–0:25 — Hook

Show the home screen, then the match ring.

**Narration (EN):** "Students apply to dozens of jobs with the same resume and get almost no feedback. Offer Catcher turns a JD into a concrete match report — and keeps the resume on the phone."

### 0:25–0:55 — Onboarding and import

Open Welcome → show the brand and the promise → tap 导入简历，开始 → show the upload zone → choose a PDF or tap 用示例.

**Narration:** "Import a PDF or DOCX, or start with the sample. Parsing happens locally: contact details, sections and skills are extracted on the device."

### 0:55–1:30 — Resume profile

Show the detected skills, completeness, quantified results. Point out the editable text area.

**Narration:** "The parser is explainable, not a black box. Students can correct the text before analysis."

### 1:30–2:20 — JD analysis

Home → 分析 JD → paste a JD (or choose a role from the job board) → point out required/preferred skills → tap 开始匹配 → result appears immediately.

**Narration:** "The local engine scores skills, experience, education, keywords and resume quality, then turns the gaps into specific rewrite actions."

### 2:20–3:00 — AI enhancement

Stay on the result screen; the AI badge appears. Show the semantic score and AI-merged suggestions.

**Narration:** "When the optional proxy is reachable, DeepSeek and Qwen embeddings add a semantic score and more specific suggestions. The local result is already usable; AI is an enhancement, not a dependency."

### 3:00–3:30 — Pipeline

Back to home → 投递进度 → add/update a record → show the status chips.

**Narration:** "Applications do not disappear into chat history. Saved, applied, interview, offer and rejected stay in one place."

### 3:30–4:00 — Assistant

Open 助手 → ask "帮我找几个前端实习" or "这个岗位值得投吗？" → show the AI reply.

**Narration:** "The assistant can search the bundled catalogue, explain the match and suggest the next step."

### 4:00–4:25 — Offline and privacy

Turn on airplane mode (or disable Wi-Fi/data) → show the 网络受限 banner → run a local analysis → open Settings → show the AI toggle and proxy address.

**Narration:** "Without a network, the core flow still works. The resume stays local; only the text needed for AI is sent to the proxy the student configures."

### 4:25–4:45 — Closing

Show Settings → export data → show the file written to Documents. End on the home screen.

**Narration:** "Offer Catcher: apply with evidence, not hope."

## Chinese narration (optional)

0:00 开场：学生海投、简历不匹配、没有反馈。Offer 捕手把 JD 拆成可执行的匹配报告，简历留在手机里。
0:25 导入简历：支持 PDF/DOCX，也可以先用示例；解析在本机完成。
1:30 分析 JD：本地引擎从技能、经验、学历、关键词和简历质量五个维度打分，并给出改写建议。
2:20 AI 增强：连上自己的代理后，DeepSeek + Qwen embedding 补充语义分数和更具体的建议。
3:00 投递进度：收藏、已投、面试、Offer、拒绝集中管理。
3:30 助手：用自然语言找岗位、解释匹配。
4:00 离线与隐私：没有网络也能完成本地分析；简历不上传，key 只在服务端。
4:25 收尾：导出数据，回到首页。

## Recording checklist

- [ ] Phone unlocked, USB debugging authorized
- [ ] Proxy running, adb reverse active
- [ ] App installed from release APK
- [ ] Screen recording at 1080p
- [ ] No notification banners
- [ ] Show the physical device / USB cable in one shot
- [ ] Narration clear; no copyrighted music
- [ ] Final file named StudentID_Name_OfferCatcher_Demo.mp4
