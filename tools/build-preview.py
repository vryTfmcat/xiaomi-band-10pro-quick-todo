"""Generate the standalone and browser verification pages from one editable fragment."""
from pathlib import Path
import re

root = Path(__file__).resolve().parents[1]
proto = root / 'prototype'
fragment = (proto / 'quick-todo.html').read_text(encoding='utf-8')
prefix = '''<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>快速待办蜂窝原型</title><style>:root{color-scheme:light dark}body{margin:0;padding:24px 10px;background:light-dark(#f2f4ef,#141b16)}button,summary{cursor:pointer}button:focus-visible,summary:focus-visible{outline:3px solid #76a951;outline-offset:3px}</style>'''
(proto / 'index.html').write_text(prefix + fragment + '</html>', encoding='utf-8')
test = (proto / 'verify-browser.js').read_text(encoding='utf-8')
(proto / 'verify.html').write_text(prefix + fragment + '<script>' + test + '</script></html>', encoding='utf-8')
(proto / 'check-script.cjs').write_text(re.search(r'<script>([\s\S]*?)</script>', fragment).group(1), encoding='utf-8')
print('Generated index.html, verify.html and check-script.cjs')
