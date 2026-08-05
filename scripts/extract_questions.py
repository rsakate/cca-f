#!/usr/bin/env python3
"""Extract all questions from mock-test-1 through mock-test-5.docx and output as JSON."""

from docx import Document
import json
import re
import os

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

def extract_questions(file_path, test_num):
    doc = Document(file_path)
    paras = [p.text.strip() for p in doc.paragraphs]
    questions = []
    i = 0
    while i < len(paras):
        # Format 1: 'Flag question: Question N' (mock tests 1-3)
        if paras[i].startswith('Flag question:'):
            q = {'test': test_num}
            i += 1  # 'Question N15 pts'
            i += 1
            if i < len(paras) and 'Scenario:' in paras[i]:
                q['scenario_raw'] = paras[i]
                i += 1
            if i < len(paras):
                q['question'] = paras[i]
                i += 1
            while i < len(paras) and (paras[i] == '' or paras[i] == 'Group of answer choices'):
                i += 1
            opts = []
            while i < len(paras) and len(opts) < 4 and paras[i] != 'Correct answer' and not paras[i].startswith('Flag question:'):
                if paras[i]:
                    opts.append(paras[i])
                i += 1
            q['options'] = opts
            if len(opts) == 4:
                questions.append(q)

        # Format 2: 'Correct answer'/'Wrong answer' then 'Question N' (mock tests 4-5)
        elif paras[i] in ('Correct answer', 'Wrong answer') and i+1 < len(paras) and re.match(r'^Question \d+$', paras[i+1]):
            q = {'test': test_num}
            i += 1  # Question N
            i += 1  # score line
            i += 1
            if i < len(paras) and 'Scenario:' in paras[i]:
                q['scenario_raw'] = paras[i]
                i += 1
            if i < len(paras):
                q['question'] = paras[i]
                i += 1
            while i < len(paras) and paras[i] == '':
                i += 1
            opts = []
            while i < len(paras) and len(opts) < 4:
                if paras[i] and paras[i] not in ('Correct answer', 'Wrong answer') and not re.match(r'^Question \d+$', paras[i]):
                    opts.append(paras[i])
                elif paras[i] in ('Correct answer', 'Wrong answer'):
                    break
                i += 1
            q['options'] = opts
            if len(opts) == 4:
                questions.append(q)
        else:
            i += 1
    return questions


SCENARIO_MAP = {
    'Customer Support Resolution Agent': 'Customer Support Resolution Agent',
    'Code Generation with Claude Code': 'Code Generation with Claude Code',
    'Multi-Agent Research System': 'Multi-Agent Research System',
    'Developer Productivity with Claude': 'Developer Productivity with Claude',
    'Claude Code for Continuous Integration': 'Claude Code for Continuous Integration',
    'Structured Data Extraction': 'Structured Data Extraction',
}

MODULE_FROM_SCENARIO = {
    'Customer Support Resolution Agent': None,  # varies
    'Code Generation with Claude Code': None,
    'Multi-Agent Research System': None,
    'Developer Productivity with Claude': None,
    'Claude Code for Continuous Integration': None,
    'Structured Data Extraction': None,
}


def normalize_scenario(raw):
    if not raw:
        return 'Unknown'
    for key in SCENARIO_MAP:
        if key in raw:
            return SCENARIO_MAP[key]
    return raw[:60]


def normalize_question(text):
    t = text.strip()
    if t.startswith('Question:'):
        t = t[9:].strip()
    return t


def dedup_key(q_text):
    t = normalize_question(q_text).lower()
    t = re.sub(r'[^a-z0-9 ]', '', t)
    return t[:100]


all_raw = []
for f in range(1, 6):
    path = os.path.join(BASE, f'mock-test-{f}.docx')
    qs = extract_questions(path, f)
    print(f'mock-test-{f}: {len(qs)} questions extracted')
    all_raw.extend(qs)

print(f'\nTotal raw: {len(all_raw)}')

# Dedup
seen = {}
unique = []
for q in all_raw:
    key = dedup_key(q.get('question', ''))
    if key not in seen:
        seen[key] = q
        q['scenario'] = normalize_scenario(q.get('scenario_raw', ''))
        q['question'] = normalize_question(q.get('question', ''))
        unique.append(q)

print(f'Unique: {len(unique)}')

# Output as JSON
output = []
for i, q in enumerate(unique):
    output.append({
        'idx': i,
        'test': q['test'],
        'scenario': q['scenario'],
        'question': q['question'],
        'options': q['options'],
    })

out_path = os.path.join(BASE, 'scripts', 'extracted_questions.json')
with open(out_path, 'w') as f:
    json.dump(output, f, indent=2)

print(f'\nWritten to {out_path}')
print(f'\nScenario distribution:')
from collections import Counter
sc = Counter(q['scenario'] for q in unique)
for s, c in sc.most_common():
    print(f'  {s}: {c}')
