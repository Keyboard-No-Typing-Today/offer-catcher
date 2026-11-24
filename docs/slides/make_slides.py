import os
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE
from pptx.oxml.ns import qn
from PIL import Image

PAPER = RGBColor(0xF5, 0xF0, 0xE6)
PAPER2 = RGBColor(0xED, 0xE6, 0xD8)
INK = RGBColor(0x1C, 0x1A, 0x16)
INK2 = RGBColor(0x4D, 0x48, 0x3F)
MUTED = RGBColor(0x7B, 0x74, 0x67)
ACCENT = RGBColor(0xCF, 0x4E, 0x2B)
SAGE = RGBColor(0x5D, 0x73, 0x59)
WHITE = RGBColor(0xFF, 0xFD, 0xF8)

W = 13.333
H = 7.5
SCREENS = os.path.join('docs', 'assets', 'screens')

prs = Presentation()
prs.slide_width = Inches(W)
prs.slide_height = Inches(H)
blank = prs.slide_layouts[6]


def set_font(run, font='Microsoft YaHei', size=18, color=INK, bold=False):
    run.font.name = font
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    rPr = run._r.get_or_add_rPr()
    for tag in ('a:ea', 'a:cs'):
        node = rPr.find(qn(tag))
        if node is None:
            node = rPr.makeelement(qn(tag), {})
            rPr.append(node)
        node.set('typeface', font)


def bg(slide, color=PAPER):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()
    return shape


def text(slide, value, left, top, width, height, size=18, color=INK, font='Microsoft YaHei', bold=False, align=PP_ALIGN.LEFT, anchor=MSO_ANCHOR.TOP, spacing=1.0):
    box = slide.shapes.add_textbox(Inches(left), Inches(top), Inches(width), Inches(height))
    tf = box.text_frame
    tf.word_wrap = True
    tf.vertical_anchor = anchor
    tf.margin_left = 0
    tf.margin_right = 0
    tf.margin_top = 0
    tf.margin_bottom = 0
    lines = str(value).split('\n')
    for index, line in enumerate(lines):
        p = tf.paragraphs[0] if index == 0 else tf.add_paragraph()
        p.alignment = align
        p.line_spacing = spacing
        r = p.add_run()
        r.text = line
        set_font(r, font, size, color, bold)
    return box


def kicker(slide, value, color=ACCENT):
    text(slide, value, 0.8, 0.55, 8.0, 0.35, 10, color, 'Consolas', True)


def title(slide, value, color=INK, size=40, top=0.95, left=0.8, width=11.6):
    text(slide, value, left, top, width, 1.2, size, color, 'Georgia', True, spacing=0.95)


def line(slide, x1, y1, x2, y2, color=ACCENT, width=1.2):
    shape = slide.shapes.add_connector(1, Inches(x1), Inches(y1), Inches(x2), Inches(y2))
    shape.line.color.rgb = color
    shape.line.width = Pt(width)


def pill(slide, value, left, top, width=1.8, color=ACCENT, textcolor=WHITE):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(0.38))
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()
    tf = shape.text_frame
    tf.margin_left = 0
    tf.margin_right = 0
    tf.margin_top = 0
    tf.margin_bottom = 0
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    r = p.add_run()
    r.text = value
    set_font(r, 'Microsoft YaHei', 10, textcolor, True)


def card(slide, left, top, width, height, fill=WHITE, line_color=PAPER2):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(left), Inches(top), Inches(width), Inches(height))
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.color.rgb = line_color
    shape.line.width = Pt(1)
    shape.adjustments[0] = 0.06
    return shape


def phone(slide, path, left, top, height=5.6):
    image = Image.open(path)
    ratio = image.width / image.height
    width = height * ratio
    frame = card(slide, left - 0.08, top - 0.08, width + 0.16, height + 0.16, WHITE, PAPER2)
    frame.line.width = Pt(2)
    slide.shapes.add_picture(path, Inches(left), Inches(top), Inches(width), Inches(height))
    return width


def footer(slide, number):
    text(slide, 'Offer 捕手 · EE5415 Individual Project', 0.8, 6.95, 7.0, 0.3, 9, MUTED, 'Consolas')
    text(slide, str(number).zfill(2), 12.1, 6.95, 0.5, 0.3, 9, MUTED, 'Consolas', align=PP_ALIGN.RIGHT)


# 1 Title
s = prs.slides.add_slide(blank)
bg(s, INK)
# accent orbit
circle = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(9.1), Inches(0.4), Inches(4.6), Inches(4.6))
circle.fill.background()
circle.line.color.rgb = ACCENT
circle.line.width = Pt(1.2)
circle2 = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(10.0), Inches(1.3), Inches(2.8), Inches(2.8))
circle2.fill.background()
circle2.line.color.rgb = RGBColor(0x5A, 0x55, 0x4C)
circle2.line.width = Pt(0.8)
dot = s.shapes.add_shape(MSO_SHAPE.OVAL, Inches(9.9), Inches(0.35), Inches(0.16), Inches(0.16))
dot.fill.solid(); dot.fill.fore_color.rgb = ACCENT; dot.line.fill.background()
text(s, 'EE5415 · INDIVIDUAL PROJECT · 2026', 0.9, 0.75, 6.5, 0.3, 10, RGBColor(0xC9, 0xC2, 0xB4), 'Consolas', True)
text(s, 'Offer 捕手', 0.85, 1.6, 7.8, 1.4, 60, PAPER, 'Georgia', True)
text(s, 'Offer Catcher', 0.9, 2.55, 6.5, 0.6, 24, ACCENT, 'Georgia', True)
text(s, 'Paste a JD. Get a match report in seconds.\nKeep every application moving.', 0.9, 3.55, 6.4, 1.2, 20, RGBColor(0xD8, 0xD1, 0xC4), 'Microsoft YaHei', False, spacing=1.3)
text(s, '[Your Name] · [Student ID]', 0.9, 5.75, 6.0, 0.35, 12, RGBColor(0xA9, 0xA2, 0x94), 'Consolas')
text(s, 'City University of Hong Kong', 0.9, 6.15, 6.0, 0.35, 12, RGBColor(0xA9, 0xA2, 0x94), 'Consolas')
# phone
phone(s, os.path.join(SCREENS, 'android-02-home.png'), 8.35, 1.25, 5.7)

# 2 Problem
s = prs.slides.add_slide(blank)
bg(s, PAPER)
kicker(s, 'THE PROBLEM')
title(s, 'Students apply blind.', INK, 40, 0.95, 0.8, 11.5)
text(s, 'Job boards help students find postings, not decide whether a posting is worth tailoring a resume for — or what to change first.', 0.85, 2.2, 5.5, 1.4, 18, INK2, 'Microsoft YaHei', spacing=1.35)
items = [
    ('01', 'No feedback loop', 'One resume, dozens of applications. Rejections arrive without a reason.'),
    ('02', 'Desktop-first tools', 'Resume scanners are built for a browser tab, not a phone between classes.'),
    ('03', 'Privacy trade-off', 'Most tools ask for the resume before showing any value.'),
]
for i, (num, head, body) in enumerate(items):
    top = 3.9 + i * 0.95
    text(s, num, 0.9, top, 0.5, 0.3, 12, ACCENT, 'Consolas', True)
    text(s, head, 1.5, top - 0.05, 2.5, 0.35, 17, INK, 'Georgia', True)
    text(s, body, 1.5, top + 0.3, 4.7, 0.5, 12, MUTED, 'Microsoft YaHei')
# quote card
card(s, 7.0, 2.1, 5.5, 4.4, INK, INK)
text(s, '“I have sent 40 applications\nand still do not know\nwhich resume version\nis actually working.”', 7.35, 2.5, 4.8, 2.2, 22, PAPER, 'Georgia', False, spacing=1.3)
text(s, '— a final-year student, paraphrased', 7.35, 5.4, 4.6, 0.4, 11, RGBColor(0xC9, 0xC2, 0xB4), 'Consolas')
footer(s, 2)

# 3 Solution
s = prs.slides.add_slide(blank)
bg(s, PAPER)
kicker(s, 'THE PRODUCT')
title(s, 'From JD to action, in one phone session.', INK, 36, 0.9, 0.8, 11.8)
steps = [
    ('01', 'Import', 'PDF / DOCX / TXT.\nParsed on the device.'),
    ('02', 'Paste a JD', 'Required and preferred\nskills extracted locally.'),
    ('03', 'Act', 'Score, gaps, and\nrewrite suggestions.'),
]
for i, (num, head, body) in enumerate(steps):
    left = 0.85 + i * 2.7
    card(s, left, 2.15, 2.45, 2.15, WHITE, PAPER2)
    text(s, num, left + 0.2, 2.35, 0.50, 0.3, 12, ACCENT, 'Consolas', True)
    text(s, head, left + 0.2, 2.7, 2.05, 0.45, 20, INK, 'Georgia', True)
    text(s, body, left + 0.2, 3.25, 2.05, 0.8, 11, MUTED, 'Microsoft YaHei', spacing=1.25)
text(s, 'A local engine always runs.\nAn optional AI proxy adds semantic judgement and conversational help.', 0.9, 4.75, 5.4, 1.1, 16, INK2, 'Microsoft YaHei', spacing=1.3)
phone(s, os.path.join(SCREENS, 'android-11-result.png'), 9.15, 1.7, 5.1)
footer(s, 3)

# 4 Users / USPs
s = prs.slides.add_slide(blank)
bg(s, PAPER)
kicker(s, 'WHO IT IS FOR')
title(s, 'Built for the student applying at 11pm.', INK, 36, 0.9, 0.8, 11.8)
card(s, 0.85, 2.1, 3.2, 4.2, WHITE, PAPER2)
text(s, 'PRIMARY USER', 1.1, 2.3, 2.6, 0.3, 9, ACCENT, 'Consolas', True)
text(s, 'A final-year student\napplying to 20–40\ninternships and\ngraduate roles.', 1.1, 2.7, 2.6, 1.8, 15, INK, 'Microsoft YaHei', spacing=1.3)
text(s, 'One resume. A few\nprojects. One internship.\nOften browsing on a phone.', 1.1, 4.55, 2.6, 1.2, 11, MUTED, 'Microsoft YaHei', spacing=1.25)
usps = [
    ('JD-specific', 'Every diagnosis ends with a concrete edit, not a generic score.'),
    ('Privacy-first', 'Resume parsing and matching stay on the phone.'),
    ('Mobile-native', 'One hand, one thumb, short sessions.'),
    ('Pipeline', 'The result becomes a saved role and a tracked application.'),
]
for i, (head, body) in enumerate(usps):
    left = 4.4 + (i % 2) * 4.25
    top = 2.1 + (i // 2) * 2.2
    card(s, left, top, 3.95, 1.95, PAPER2, PAPER2)
    text(s, head, left + 0.25, top + 0.25, 3.4, 0.35, 18, INK, 'Georgia', True)
    text(s, body, left + 0.25, top + 0.75, 3.4, 0.9, 12, INK2, 'Microsoft YaHei', spacing=1.25)
footer(s, 4)

# 5 Product screens
s = prs.slides.add_slide(blank)
bg(s, INK)
kicker(s, 'PRODUCT TOUR', ACCENT)
title(s, 'Designed as a field journal, not a dashboard.', PAPER, 34, 0.9, 0.8, 11.8)
for i, (path, caption) in enumerate([
    ('01-welcome.png', 'Onboarding'),
    ('android-02-home.png', 'Home'),
    ('android-08-assistant.png', 'Assistant'),
]):
    left = 1.05 + i * 4.0
    phone(s, os.path.join(SCREENS, path), left, 2.0, 4.6)
    text(s, caption, left - 0.1, 6.65, 3.2, 0.3, 10, RGBColor(0xC9, 0xC2, 0xB4), 'Consolas', False, PP_ALIGN.CENTER)
footer(s, 5)

# 6 Match engine
s = prs.slides.add_slide(blank)
bg(s, PAPER)
kicker(s, 'LOCAL ENGINE')
title(s, 'Explainable by design.', INK, 38, 0.9, 0.8, 8.0)
text(s, 'Five weighted dimensions, all computed on the device. The score is a starting point; the suggestions are the product.', 0.85, 1.95, 5.6, 1.0, 15, INK2, 'Microsoft YaHei', spacing=1.3)
rows = [
    ('Skills', '40%', 'Must-have coverage + nice-to-have at 0.4 weight'),
    ('Experience', '20%', 'Years vs requirement + relevant project evidence'),
    ('Education', '10%', 'Degree level with partial credit'),
    ('Keywords', '15%', 'ATS keyword coverage'),
    ('Resume quality', '15%', 'Contact, sections, quantified bullets, length'),
]
for i, (name, weight, desc) in enumerate(rows):
    top = 3.05 + i * 0.63
    text(s, name, 0.9, top, 1.7, 0.3, 12, INK, 'Consolas', True)
    text(s, weight, 2.55, top, 0.7, 0.3, 12, ACCENT, 'Consolas', True)
    text(s, desc, 3.35, top, 3.3, 0.45, 10, MUTED, 'Microsoft YaHei')
# score card
card(s, 7.35, 1.85, 5.1, 4.6, INK, INK)
text(s, 'MATCH', 7.7, 2.15, 1.2, 0.3, 9, RGBColor(0xC9, 0xC2, 0xB4), 'Consolas', True)
text(s, '81', 7.65, 2.45, 2.2, 1.3, 64, PAPER, 'Georgia', True)
text(s, 'Worth applying', 9.4, 2.75, 2.6, 0.4, 16, RGBColor(0x9C, 0xC2, 0xA8), 'Microsoft YaHei', True)
text(s, 'Skills 75  ·  Experience 75\nEducation 100  ·  Keywords 57\nQuality 100', 7.7, 3.95, 4.3, 1.0, 12, RGBColor(0xD8, 0xD1, 0xC4), 'Consolas', spacing=1.3)
text(s, '65% local + 35% AI when enabled', 7.7, 5.2, 4.3, 0.8, 11, RGBColor(0xC9, 0xC2, 0xB4), 'Microsoft YaHei')
footer(s, 6)

# 7 AI layer
s = prs.slides.add_slide(blank)
bg(s, PAPER)
kicker(s, 'OPTIONAL INTELLIGENCE')
title(s, 'AI is an enhancement, not a dependency.', INK, 34, 0.9, 0.8, 11.8)
boxes = [
    ('React client', 'Local result first\nNo provider key', 0.85, 2.2, 3.1),
    ('Express proxy', 'Keys server-side\nJSON validation + repair', 4.45, 2.2, 3.1),
    ('DeepSeek + Qwen', 'Chat + 1024-d embeddings\nRAG: 7 excellent-resume chunks', 8.05, 2.2, 3.9),
]
for head, body, left, top, width in boxes:
    card(s, left, top, width, 1.95, WHITE, PAPER2)
    text(s, head, left + 0.22, top + 0.22, width - 0.4, 0.4, 17, INK, 'Georgia', True)
    text(s, body, left + 0.22, top + 0.75, width - 0.4, 0.9, 11, MUTED, 'Microsoft YaHei', spacing=1.25)
# arrows
for x in (3.98, 7.58):
    line(s, x, 3.2, x + 0.4, 3.2, ACCENT, 2)
text(s, 'If the proxy is unreachable, the app silently keeps the local result. The UI labels AI vs local.', 0.9, 4.7, 7.4, 0.7, 14, INK2, 'Microsoft YaHei')
text(s, 'Privacy boundary: resume text goes only to the proxy the student configures; keys never enter the APK.', 0.9, 5.45, 8.4, 0.7, 12, SAGE, 'Microsoft YaHei', True)
footer(s, 7)

# 8 Android
s = prs.slides.add_slide(blank)
bg(s, PAPER)
kicker(s, 'ANDROID INTEGRATION')
title(s, 'Native where it matters.', INK, 38, 0.9, 0.8, 8.0)
features = [
    ('Preferences', 'Native local persistence'),
    ('Network', 'Offline-aware UI'),
    ('StatusBar', 'Cream system bars'),
    ('SplashScreen', 'Branded launch'),
    ('App back', 'Sheet → screen → exit'),
    ('Filesystem', 'JSON export to Documents'),
    ('Haptics', 'Primary-action feedback'),
    ('Document picker', 'PDF / DOCX import'),
]
for i, (head, body) in enumerate(features):
    left = 0.85 + (i % 4) * 3.1
    top = 2.1 + (i // 4) * 1.55
    card(s, left, top, 2.85, 1.3, WHITE, PAPER2)
    text(s, head, left + 0.2, top + 0.2, 2.5, 0.3, 13, INK, 'Consolas', True)
    text(s, body, left + 0.2, top + 0.6, 2.5, 0.5, 10, MUTED, 'Microsoft YaHei')
text(s, 'Deliberately out of scope for v1.0: camera/OCR, notifications, native share.\nThe remaining integrations still exercise storage, network, system UI, document access and filesystem.', 0.9, 5.5, 11.4, 0.9, 13, INK2, 'Microsoft YaHei', spacing=1.3)
footer(s, 8)

# 9 Validation
s = prs.slides.add_slide(blank)
bg(s, INK)
kicker(s, 'VALIDATION', ACCENT)
title(s, 'Tested, not just built.', PAPER, 38, 0.9, 0.8, 8.0)
stats = [('18', 'client tests'), ('10', 'proxy tests'), ('4.3 MB', 'signed APK'), ('22 s', 'AI on emulator')]
for i, (value, label) in enumerate(stats):
    left = 0.85 + i * 1.95
    text(s, value, left, 2.05, 1.8, 0.9, 30, PAPER, 'Georgia', True)
    text(s, label, left, 2.9, 1.8, 0.4, 9, RGBColor(0xC9, 0xC2, 0xB4), 'Consolas')
checks = [
    'Cold start, splash, cream system bars',
    'Native document picker → 3,284-char PDF',
    'AI-enhanced analysis via adb reverse',
    'Assistant chat, tracker add/edit',
    'Back closes sheet; restart restores data',
    'JSON export with no API keys',
]
for i, item in enumerate(checks):
    top = 3.7 + i * 0.46
    text(s, '✓', 0.95, top, 0.3, 0.3, 12, RGBColor(0x9C, 0xC2, 0xA8), 'Consolas', True)
    text(s, item, 1.35, top, 5.6, 0.35, 11, RGBColor(0xD8, 0xD1, 0xC4), 'Microsoft YaHei')
phone(s, os.path.join(SCREENS, 'android-11-result.png'), 9.15, 1.35, 5.3)
footer(s, 9)

# 10 Lessons / roadmap
s = prs.slides.add_slide(blank)
bg(s, PAPER)
kicker(s, 'TAKEAWAYS')
title(s, 'What worked, and what is next.', INK, 36, 0.9, 0.8, 11.8)
text(s, 'WHAT WORKED', 0.9, 2.0, 3.0, 0.3, 9, ACCENT, 'Consolas', True)
worked = [
    'Local engine first made the demo resilient and the privacy story credible.',
    'A strict JSON contract + repair + fallback made AI safe to ship.',
    'A real mobile UI direction beat a WebView-wrapped desktop page.',
]
for i, item in enumerate(worked):
    text(s, '·', 0.95, 2.45 + i * 0.8, 0.2, 0.3, 14, ACCENT, 'Consolas', True)
    text(s, item, 1.25, 2.4 + i * 0.8, 5.2, 0.7, 12, INK2, 'Microsoft YaHei', spacing=1.25)
text(s, 'NEXT', 7.15, 2.0, 3.0, 0.3, 9, ACCENT, 'Consolas', True)
nxt = [
    'Camera/OCR for paper resumes and JD screenshots.',
    'Notifications for follow-ups and interviews.',
    'Native share + a public AI proxy with quotas.',
    'A larger, verified job dataset and real outcome data.',
]
for i, item in enumerate(nxt):
    text(s, '·', 7.2, 2.45 + i * 0.7, 0.2, 0.3, 14, ACCENT, 'Consolas', True)
    text(s, item, 7.5, 2.4 + i * 0.7, 4.8, 0.6, 11, INK2, 'Microsoft YaHei', spacing=1.2)
footer(s, 10)

# 11 Closing
s = prs.slides.add_slide(blank)
bg(s, INK)
text(s, 'Offer 捕手', 0.9, 1.5, 7.5, 1.0, 46, PAPER, 'Georgia', True)
text(s, 'Apply with evidence, not hope.', 0.95, 2.55, 8.0, 0.7, 24, ACCENT, 'Georgia', True)
text(s, 'github.com/Keyboard-No-Typing-Today/offer-catcher', 0.95, 4.1, 9.0, 0.4, 12, RGBColor(0xC9, 0xC2, 0xB4), 'Consolas')
text(s, 'EE5415 Mobile Applications Design and Development\nCity University of Hong Kong · 2026', 0.95, 5.0, 8.0, 0.8, 12, RGBColor(0xA9, 0xA2, 0x94), 'Microsoft YaHei', spacing=1.3)
text(s, 'Thank you. Questions?', 0.95, 6.2, 6.0, 0.5, 16, PAPER, 'Georgia', True)

os.makedirs(os.path.join('docs', 'slides'), exist_ok=True)
out = os.path.join('docs', 'slides', 'OfferCatcher_EE5415_Slides.pptx')
prs.save(out)
print('SAVED', out, os.path.getsize(out))
