#!/usr/bin/env python3
"""
Merge existing 80 curated questions + 193 new extracted questions into a single
all_questions.js file for the mock exam suite.
"""

import json
import re
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ── 1. Load existing curated questions from JS files ─────────────────────────
existing = []
for domain_file in [
    'questions/domain1_agentic_architecture.js',
    'questions/domain2_tool_design_mcp.js',
    'questions/domain3_claude_code_config.js',
    'questions/domain4_prompt_engineering.js',
    'questions/domain5_context_reliability.js',
]:
    path = os.path.join(BASE, domain_file)
    with open(path) as f:
        content = f.read()

    # Parse QUESTIONS.push(...) blocks - extract each question object
    # Find all { id:N, ... } blocks
    # Use a simple state machine to extract balanced braces
    in_push = False
    depth = 0
    current = ''
    objects = []

    for char in content:
        if char == '{':
            depth += 1
            if depth == 1:
                current = '{'
                continue
            current += char
        elif char == '}':
            depth -= 1
            if depth == 0:
                current += '}'
                objects.append(current)
                current = ''
                continue
            current += char
        elif depth > 0:
            current += char

    for obj_str in objects:
        try:
            # Convert JS object to JSON-parseable format
            js = obj_str
            # Add quotes around keys
            js = re.sub(r'(\w+)\s*:', r'"\1":', js)
            # Fix double-quoted keys that got double-quoted
            js = js.replace('""', '"')
            # Handle single-quoted strings
            js = js.replace("'", '"')

            # This is fragile - let's use a different approach
            # Extract fields directly with regex
            q = {}

            id_m = re.search(r'id\s*:\s*(\d+)', obj_str)
            if id_m:
                q['id'] = int(id_m.group(1))

            module_m = re.search(r'module\s*:\s*(\d+)', obj_str)
            if module_m:
                q['module'] = int(module_m.group(1))

            scenario_m = re.search(r'scenario\s*:\s*"([^"]*)"', obj_str)
            if scenario_m:
                q['scenario'] = scenario_m.group(1)

            text_m = re.search(r'text\s*:\s*"((?:[^"\\]|\\.)*)"', obj_str, re.DOTALL)
            if text_m:
                q['text'] = text_m.group(1)

            correct_m = re.search(r'correct\s*:\s*(\d+)', obj_str)
            if correct_m:
                q['correct'] = int(correct_m.group(1))

            expl_m = re.search(r'explanation\s*:\s*"((?:[^"\\]|\\.)*)"', obj_str, re.DOTALL)
            if expl_m:
                q['explanation'] = expl_m.group(1)

            # Extract options array
            opts_m = re.search(r'options\s*:\s*\[(.*?)\]', obj_str, re.DOTALL)
            if opts_m:
                opts_str = opts_m.group(1)
                options = re.findall(r'"((?:[^"\\]|\\.)*)"', opts_str, re.DOTALL)
                q['options'] = options

            if q.get('id') is not None and q.get('options'):
                existing.append(q)
        except Exception as e:
            pass

print(f'Loaded {len(existing)} existing curated questions')

# ── 2. Load new extracted questions ──────────────────────────────────────────
with open(os.path.join(BASE, 'scripts', 'extracted_questions.json')) as f:
    extracted = json.load(f)

# Load answers
all_answers = {}
for i in range(1, 5):
    with open(os.path.join(BASE, 'scripts', f'answers_{i}.json')) as f:
        answers = json.load(f)
    for a in answers:
        all_answers[a['idx']] = a

print(f'Loaded {len(all_answers)} answer determinations')

# ── 3. Build dedup key from existing questions ───────────────────────────────
def make_key(text):
    t = re.sub(r'<[^>]+>', '', text)  # strip HTML
    t = re.sub(r'[^a-z0-9 ]', '', t.lower())
    return t[:100]

existing_keys = {}
for q in existing:
    key = make_key(q.get('text', ''))
    existing_keys[key] = q['id']

# ── 4. Merge: existing + new unique ─────────────────────────────────────────
all_questions = list(existing)  # start with existing
next_id = max(q['id'] for q in existing) + 1
new_count = 0
skipped = 0

def escape_js_string(s):
    """Escape a string for use in JavaScript."""
    s = s.replace('\\', '\\\\')
    s = s.replace('"', '\\"')
    s = s.replace('\n', '\\n')
    s = s.replace('\r', '')
    s = s.replace('\t', '\\t')
    return s

for eq in extracted:
    key = make_key(eq.get('question', ''))
    if key in existing_keys:
        skipped += 1
        continue

    idx = eq['idx']
    if idx not in all_answers:
        skipped += 1
        continue

    ans = all_answers[idx]

    # Build question object
    q = {
        'id': next_id,
        'module': ans['module'],
        'scenario': eq['scenario'],
        'text': eq['question'],
        'options': eq['options'],
        'correct': ans['correct'],
        'explanation': ans['explanation'],
    }

    all_questions.append(q)
    existing_keys[key] = next_id
    next_id += 1
    new_count += 1

print(f'Added {new_count} new questions (skipped {skipped} duplicates/missing)')
print(f'Total questions: {len(all_questions)}')

# ── 5. Generate all_questions.js ─────────────────────────────────────────────
lines = ['// CCA-F / CCAR-F Mock Exam — Consolidated Question Bank']
lines.append(f'// Total: {len(all_questions)} questions across 5 domains and 6 scenarios')
lines.append(f'// IDs 1-{max(q["id"] for q in existing)} = original curated questions')
lines.append(f'// IDs {max(q["id"] for q in existing)+1}+ = extracted from mock tests 1-5')
lines.append('// Auto-generated by scripts/build_all_questions.py')
lines.append('')
lines.append('QUESTIONS.push(')

for i, q in enumerate(all_questions):
    opts_js = ',\n    '.join(f'"{escape_js_string(o)}"' for o in q['options'])

    entry = '{'
    entry += f'\n  id:{q["id"]}, module:{q["module"]}, scenario:"{escape_js_string(q["scenario"])}",'
    entry += f'\n  text:"{escape_js_string(q["text"])}",'
    entry += f'\n  options:[\n    {opts_js}\n  ],'
    entry += f'\n  correct:{q["correct"]},'
    entry += f'\n  explanation:"{escape_js_string(q["explanation"])}"'
    entry += '\n}'

    if i < len(all_questions) - 1:
        entry += ','
    lines.append(entry)

lines.append(');')

out_path = os.path.join(BASE, 'questions', 'all_questions.js')
with open(out_path, 'w') as f:
    f.write('\n'.join(lines))

print(f'\nWritten to {out_path}')
print(f'File size: {os.path.getsize(out_path) / 1024:.1f} KB')

# Stats
from collections import Counter
modules = Counter(q['module'] for q in all_questions)
scenarios = Counter(q['scenario'] for q in all_questions)
print(f'\nModule distribution:')
for m in sorted(modules):
    print(f'  Module {m}: {modules[m]} questions')
print(f'\nScenario distribution:')
for s, c in scenarios.most_common():
    print(f'  {s}: {c}')
