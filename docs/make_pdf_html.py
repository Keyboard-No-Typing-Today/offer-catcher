import os
import markdown

CSS = """
@page { size: A4; margin: 18mm 16mm; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { font-family: "Segoe UI", "Microsoft YaHei", "PingFang SC", sans-serif; color: #1c1a16; line-height: 1.65; font-size: 10.5pt; }
h1, h2, h3 { font-family: Georgia, "SimSun", serif; color: #1c1a16; page-break-after: avoid; }
h1 { font-size: 26pt; border-bottom: 2px solid #cf4e2b; padding-bottom: 8px; }
h2 { font-size: 17pt; margin-top: 22px; border-left: 4px solid #cf4e2b; padding-left: 10px; }
h3 { font-size: 13pt; }
p { margin: 8px 0; text-align: left; }
a { color: #a93a1d; text-decoration: none; }
table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 9pt; page-break-inside: avoid; }
th, td { border: 1px solid #d9ccb7; padding: 6px 7px; vertical-align: top; text-align: left; }
th { background: #ede6d8; }
pre { background: #f2ecdf; border: 1px solid #e3d8c6; padding: 10px; border-radius: 6px; font-size: 8.5pt; white-space: pre-wrap; page-break-inside: avoid; }
code { font-family: Consolas, "Courier New", monospace; font-size: 9pt; background: #f2ecdf; padding: 1px 3px; border-radius: 3px; }
pre code { background: transparent; padding: 0; }
img { max-width: 100%; border-radius: 8px; border: 1px solid #e3d8c6; page-break-inside: avoid; }
blockquote { border-left: 4px solid #cf4e2b; margin: 12px 0; padding: 6px 12px; background: #f7f3ea; color: #4d483f; }
hr { border: none; border-top: 1px solid #d9ccb7; margin: 18px 0; }
"""

def convert(name, title):
    src = os.path.join('docs', name + '.md')
    out = os.path.join('docs', name + '.html')
    text = open(src, encoding='utf-8').read()
    body = markdown.markdown(text, extensions=['tables', 'fenced_code', 'sane_lists', 'toc'])
    html = '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>' + title + '</title><style>' + CSS + '</style></head><body>' + body + '</body></html>'
    open(out, 'w', encoding='utf-8').write(html)
    print('WROTE', out, len(html))

convert('report', 'Offer Catcher Final Report')
convert('proposal', 'Offer Catcher Proposal')
